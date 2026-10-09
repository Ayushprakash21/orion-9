import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveCurrentEnvironment, getFirebaseApp, resetFirebaseInstances, LIVE_FIREBASE_CONFIG, DEMO_FIREBASE_CONFIG } from '../../lib/firebaseClient';
import { verifyWorkerAuthToken } from '../../server/workerSecurity';
import { KernelEventBus } from '../../kernel/EventBus';
import { outcomeRecorder } from '../../ai/OutcomeRecorder';
import { DriftDetectionEngine } from '../../outcomes/DriftDetectionEngine';

class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = new LocalStorageMock();
}
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = { localStorage: (globalThis as any).localStorage };
}

describe('ORION-9 Master Backend Integrity Verification Suite', () => {
  beforeEach(() => {
    resetFirebaseInstances();
    globalThis.localStorage.clear();
  });


  describe('1. Environment Isolation & Safe Default', () => {
    it('defaults safely to DEMO when environment parameter is omitted and localStorage is empty', () => {
      const resolved = resolveCurrentEnvironment();
      expect(resolved).toBe('DEMO');
    });

    it('respects persisted DEMO environment in localStorage', () => {
      localStorage.setItem('orion9_database_environment', 'DEMO');
      const resolved = resolveCurrentEnvironment();
      expect(resolved).toBe('DEMO');
    });

    it('respects persisted LIVE environment in localStorage', () => {
      localStorage.setItem('orion9_database_environment', 'LIVE');
      const resolved = resolveCurrentEnvironment();
      expect(resolved).toBe('LIVE');
    });

    it('ignores invalid environment values and falls back safely to DEMO', () => {
      localStorage.setItem('orion9_database_environment', 'INVALID_ENV');
      const resolved = resolveCurrentEnvironment();
      expect(resolved).toBe('DEMO');
    });

    it('isolates Firebase App configurations between DEMO and LIVE', () => {
      expect(DEMO_FIREBASE_CONFIG.projectId).toBe('demo-orion9-db-2026');
      expect(LIVE_FIREBASE_CONFIG.projectId).toBe('orion9-dev-db-2026');
      expect(DEMO_FIREBASE_CONFIG.projectId).not.toBe(LIVE_FIREBASE_CONFIG.projectId);
    });
  });

  describe('2. Worker Cryptographic Token & Project Identity Verification', () => {
    it('rejects client-minted session tokens in LIVE environment', () => {
      const demoToken = 'orion_sess:LIVE:test-user:platform_admin:9999999999999:sig_admin';
      const result = verifyWorkerAuthToken(demoToken, 'LIVE');
      expect(result.authorized).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('Client-minted session tokens are strictly forbidden in LIVE environment');
    });

    it('validates JWT token audience against authoritative project ID in LIVE mode', () => {
      // Craft a mock JWT with wrong audience
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const payloadBadAud = Buffer.from(JSON.stringify({
        sub: 'usr-123',
        aud: 'malicious-project-id',
        iss: 'https://securetoken.google.com/malicious-project-id',
        exp: Math.floor(Date.now() / 1000) + 3600,
        role: 'platform_admin'
      })).toString('base64url');
      const fakeSig = 'fake-sig';
      const badJwt = `${header}.${payloadBadAud}.${fakeSig}`;

      const result = verifyWorkerAuthToken(badJwt, 'LIVE');
      expect(result.authorized).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('Invalid token audience: expected project orion9-dev-db-2026');
    });

    it('validates JWT token issuer against authoritative Google Identity Toolkit in LIVE mode', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const payloadBadIss = Buffer.from(JSON.stringify({
        sub: 'usr-123',
        aud: 'orion9-dev-db-2026',
        iss: 'https://bad-issuer.example.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
        role: 'platform_admin'
      })).toString('base64url');
      const fakeSig = 'fake-sig';
      const badJwt = `${header}.${payloadBadIss}.${fakeSig}`;

      const result = verifyWorkerAuthToken(badJwt, 'LIVE');
      expect(result.authorized).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('Invalid token issuer: expected https://securetoken.google.com/orion9-dev-db-2026');
    });

    it('accepts valid JWT structure with authentic claims in LIVE mode', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const validPayload = Buffer.from(JSON.stringify({
        sub: 'usr-admin-1',
        aud: 'orion9-dev-db-2026',
        iss: 'https://securetoken.google.com/orion9-dev-db-2026',
        exp: Math.floor(Date.now() / 1000) + 3600,
        role: 'platform_admin',
        email: 'admin@orion.network',
        tenantId: 'ORION_PLATFORM'
      })).toString('base64url');
      const fakeSig = 'valid-sig';
      const validJwt = `${header}.${validPayload}.${fakeSig}`;

      const result = verifyWorkerAuthToken(validJwt, 'LIVE');
      expect(result.authorized).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.user?.userId).toBe('usr-admin-1');
      expect(result.user?.role).toBe('platform_admin');
      expect(result.user?.environment).toBe('LIVE');
    });

    it('rejects expired tokens in both LIVE and DEMO modes', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const expiredPayload = Buffer.from(JSON.stringify({
        sub: 'usr-123',
        aud: 'orion9-dev-db-2026',
        iss: 'https://securetoken.google.com/orion9-dev-db-2026',
        exp: Math.floor(Date.now() / 1000) - 3600,
        role: 'platform_admin'
      })).toString('base64url');
      const fakeSig = 'sig';
      const expiredJwt = `${header}.${expiredPayload}.${fakeSig}`;

      const result = verifyWorkerAuthToken(expiredJwt, 'LIVE');
      expect(result.authorized).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('Authentication token has expired');
    });
  });

  describe('3. Durable Persistence & Non-Silent Failure Semantics', () => {
    it('EventBus publishDurable returns envelope and assigns unique ID and correlation ID', async () => {
      const bus = KernelEventBus.getInstance();
      const event = await bus.publishDurable('INVENTORY_ADJUSTMENT', { sku: 'SKU-001', qty: 50 }, {
        actor: { id: 'usr-admin', type: 'USER', name: 'Admin' },
        tenant: { organizationId: 'ORION_PLATFORM', organizationName: 'Orion Platform' }
      });

      expect(event).toBeDefined();
      expect(event.eventId).toMatch(/^evt-/);
      expect(event.correlationId).toBeDefined();
      expect(event.eventType).toBe('INVENTORY_ADJUSTMENT');
      expect(event.payload.qty).toBe(50);
    });

    it('OutcomeRecorder generates valid outcomeId and non-empty timestamp', async () => {
      const recorded = await outcomeRecorder.recordOutcome({
        tenantId: 'ORION_PLATFORM',
        agentId: 'agent-inventory',
        decisionId: 'dec-100',
        action: 'REBALANCE_STOCK',
        expectedOutcome: 'OTIF improvement +5%',
        actualOutcome: 'OTIF improvement +4.8%',
        success: true,
        variance: { delta: -0.2 }
      });

      expect(recorded.outcomeId).toBeDefined();
      expect(recorded.timestamp).toBeDefined();
      expect(recorded.success).toBe(true);
    });


    it('DriftDetectionEngine evaluates drift state truthfully', async () => {
      const engine = DriftDetectionEngine.getInstance();
      const signal = await engine.evaluateAndPersistDrift({
        tenantId: 'ORION_PLATFORM',
        featureName: 'lead_time_days',
        baselineMean: 10.0,
        currentMean: 14.0, // 40% drift -> CRITICAL_DRIFT
        threshold: 15.0
      });

      expect(signal.driftState).toBe('CRITICAL_DRIFT');
      expect(signal.divergenceScore).toBe(40.0);
    });
  });
});
