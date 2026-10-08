/**
 * ORION-9 GATE 5: DEMO -> LIVE ENVIRONMENT / PRIVILEGE ESCALATION ASSURANCE SUITE
 *
 * Verifies that client-side tampering, URL parameter manipulation, header forgery,
 * token alteration, and state drift CANNOT escalate a DEMO session into LIVE,
 * cannot escalate a standard user into an administrator, and cannot leak listeners
 * or cross-mutate database environments.
 *
 * Zero test skips. Every test makes concrete negative security assertions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { authService, AuthSessionDetails } from '../../services/authService';
import { userService, CANONICAL_DEMO_USER, CANONICAL_DEMO_ADMIN } from '../../services/userService';
import { privilegedSessionManager } from '../../kernel/security/privilegedSession';
import { verifyWorkerAuthToken } from '../../server/workerSecurity';

// In-memory mock localStorage for node test runner
class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] !== undefined ? this.store[key] : null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = new LocalStorageMock();
}
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = globalThis;
}

describe('GATE 5: DEMO -> LIVE Environment Isolation & Anti-Escalation Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    dbManager.setEnvironment('DEMO');
    privilegedSessionManager.revoke('Test setup reset');
  });

  afterEach(() => {
    localStorage.clear();
    dbManager.setEnvironment('DEMO');
    privilegedSessionManager.revoke('Test teardown');
  });

  // ---------------------------------------------------------------------------
  // 5A: INVENTORY ENVIRONMENT SOURCES
  // ---------------------------------------------------------------------------
  describe('5A: Environment Sources Audit', () => {
    it('1. verifies default environment is DEMO and resolves to correct configuration', () => {
      expect(dbManager.getEnvironment()).toBe('DEMO');
      const config = dbManager.getConfig();
      expect(config.environment).toBe('DEMO');
      expect(config.isProductionSafe).toBe(false);
      expect(config.cachePrefix).toBe('orion9:demo');
    });

    it('2. verifies LIVE configuration requires authoritative cloud persistence', () => {
      dbManager.setEnvironment('LIVE');
      const config = dbManager.getConfig();
      expect(config.environment).toBe('LIVE');
      expect(config.isProductionSafe).toBe(true);
      expect(config.cachePrefix).toBe('orion9:live');
      dbManager.setEnvironment('DEMO');
    });
  });

  // ---------------------------------------------------------------------------
  // 5B: CLIENT TAMPERING DEFENSE
  // ---------------------------------------------------------------------------
  describe('5B: Client-Side Tampering Rejection', () => {
    it('3. rejects localStorage environment tampering when user possesses DEMO credentials', async () => {
      // Login as normal DEMO user
      await authService.login('user', 'user');

      // Attacker attempts to modify localStorage database environment to LIVE
      localStorage.setItem('orion9_database_environment', 'LIVE');
      dbManager.setEnvironment('LIVE');

      // authService.isAuthenticated MUST return false because DEMO session cannot operate in LIVE
      const isAuthed = authService.isAuthenticated();
      expect(isAuthed).toBe(false);
    });

    it('4. rejects role tampering inside session token stored in localStorage', async () => {
      // Normal demo user logs in
      await authService.login('user', 'user');

      const rawSession = localStorage.getItem('orion_auth_session');
      expect(rawSession).not.toBeNull();

      const sessionObj = JSON.parse(rawSession!);
      // Attacker elevates role from 'user' to 'platform_admin'
      sessionObj.role = 'platform_admin';
      sessionObj.permissions = ['*'];
      localStorage.setItem('orion_auth_session', JSON.stringify(sessionObj));

      // Authoritative identity check detects drift between session claim and userService store
      const isAuthed = authService.isAuthenticated();
      expect(isAuthed).toBe(false);
      // Malicious session must be purged from storage
      expect(localStorage.getItem('orion_auth_session')).toBeNull();
    });

    it('5. prevents URL parameter (?environment=LIVE) from escalating DEMO session privileges', async () => {
      await authService.login('user', 'user');

      // Simulate URL query parameter spoofing
      const url = new URL('https://orion9.app/dashboard?environment=LIVE');
      const requestedEnv = url.searchParams.get('environment');
      expect(requestedEnv).toBe('LIVE');

      // Verify that server-side / engine-side validation rejects DEMO token in LIVE
      const token = authService.getAuthToken();
      const validation = verifyWorkerAuthToken(token, 'LIVE');
      expect(validation.authorized).toBe(false);
      expect(validation.statusCode).toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // 5C: TOKEN TAMPERING
  // ---------------------------------------------------------------------------
  describe('5C: Cryptographic & Structured Token Tampering', () => {
    it('6. rejects structured token when environment claim is forged', () => {
      const forgedToken = `orion_sess:LIVE:local-user:user:${Date.now() + 3600000}:sig_forged`;
      // Worker running in DEMO mode receives a token claiming LIVE
      const res = verifyWorkerAuthToken(forgedToken, 'DEMO');
      expect(res.authorized).toBe(false);
      expect(res.statusCode).toBe(403);
      expect(res.error).toContain('Cross-environment token rejection');
    });

    it('7. rejects structured token when role claim is invalid or forged', () => {
      const forgedRoleToken = `orion_sess:DEMO:local-user:super_hacker:${Date.now() + 3600000}:sig_test`;
      const res = verifyWorkerAuthToken(forgedRoleToken, 'DEMO');
      expect(res.authorized).toBe(false);
      expect(res.statusCode).toBe(403);
      expect(res.error).toContain('Invalid role claim');
    });

    it('8. rejects expired token regardless of claims', () => {
      const expiredToken = `orion_sess:DEMO:local-admin:platform_admin:${Date.now() - 5000}:sig_expired`;
      const res = verifyWorkerAuthToken(expiredToken, 'DEMO');
      expect(res.authorized).toBe(false);
      expect(res.statusCode).toBe(401);
      expect(res.error).toContain('expired');
    });

    it('9. rejects empty, missing, or malformed bearer tokens', () => {
      expect(verifyWorkerAuthToken(null, 'DEMO').authorized).toBe(false);
      expect(verifyWorkerAuthToken('', 'DEMO').authorized).toBe(false);
      expect(verifyWorkerAuthToken('malformed_random_token_string', 'DEMO').authorized).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 5D: DEMO DATA ATTACK (PREVENT MUTATING LIVE FROM DEMO)
  // ---------------------------------------------------------------------------
  describe('5D: DEMO Environment Mutation Fencing', () => {
    it('10. outbox guard strictly rejects payloads with environment mismatch', () => {
      dbManager.setEnvironment('DEMO');

      // Attacker attempts to replay an outbox payload targeted for LIVE while engine is in DEMO
      const livePayload = {
        environment: 'LIVE',
        tenantId: 'tenant-live-01',
        entityId: 'PO-999',
      };

      const isValid = dbManager.validateOutboxPayload(livePayload);
      expect(isValid).toBe(false);
    });

    it('11. rejects DEMO credentials when attempting authentication in LIVE environment', async () => {
      dbManager.setEnvironment('LIVE');

      await expect(
        authService.login('admin', 'admin')
      ).rejects.toThrow('DEMO credentials are not permitted in the LIVE environment.');

      await expect(
        authService.login('user', 'user')
      ).rejects.toThrow('DEMO credentials are not permitted in the LIVE environment.');
    });

    it('12. prevents DEMO user from requesting privileged step-up session', () => {
      dbManager.setEnvironment('DEMO');
      expect(() => {
        privilegedSessionManager.issuePrivilegedSession(
          'local-user',
          'ORION_PLATFORM',
          'user',
          'step_up_password',
          'DEMO'
        );
      }).toThrow(/Forbidden: Role user is not authorized/i);
    });
  });

  // ---------------------------------------------------------------------------
  // 5E: LIVE DATA ATTACK (PREVENT SYNTHETIC DRIFT INTO LIVE)
  // ---------------------------------------------------------------------------
  describe('5E: LIVE Environment Protection Against Synthetic Mocks', () => {
    it('13. outbox guard strictly rejects payloads missing environment tag', () => {
      const untaggedPayload = {
        tenantId: 'tenant-alpha',
        entityId: 'PO-UNT-001',
      };

      const isValid = dbManager.validateOutboxPayload(untaggedPayload as any);
      expect(isValid).toBe(false);
    });

    it('14. namespaced cache keys prevent cross-environment cache collisions', () => {
      dbManager.setEnvironment('DEMO');
      const demoKey = dbManager.getCacheKey('tenant-01', 'inventory', 'SKU-100');

      dbManager.setEnvironment('LIVE');
      const liveKey = dbManager.getCacheKey('tenant-01', 'inventory', 'SKU-100');

      expect(demoKey).toContain(':demo:');
      expect(liveKey).toContain(':live:');
      expect(demoKey).not.toEqual(liveKey);
    });
  });

  // ---------------------------------------------------------------------------
  // 5F: ENVIRONMENT SWITCHING & CLEANUP
  // ---------------------------------------------------------------------------
  describe('5F: Environment Switching & Listener Teardown Lifecycle', () => {
    it('15. cleanly unregisters all active snapshot listeners upon environment switch', () => {
      const mockUnsubscribe1 = vi.fn();
      const mockUnsubscribe2 = vi.fn();

      dbManager.registerListener('listener-suppliers', mockUnsubscribe1);
      dbManager.registerListener('listener-inventory', mockUnsubscribe2);

      const unregisteredCount = dbManager.unregisterAllListeners();
      expect(unregisteredCount).toBe(2);
      expect(mockUnsubscribe1).toHaveBeenCalledTimes(1);
      expect(mockUnsubscribe2).toHaveBeenCalledTimes(1);
    });

    it('16. clears cached entries for active environment during cache purge', () => {
      dbManager.setEnvironment('DEMO');
      dbManager.setCached('tenant-01', 'inventory', 'SKU-001', { qty: 100 });
      expect(dbManager.getCached('tenant-01', 'inventory', 'SKU-001')).toEqual({ qty: 100 });

      dbManager.clearEnvironmentCache();
      expect(dbManager.getCached('tenant-01', 'inventory', 'SKU-001')).toBeNull();
    });

    it('17. environment switch purges incompatible auth sessions from storage', async () => {
      dbManager.setEnvironment('DEMO');
      await authService.login('admin', 'admin');
      expect(localStorage.getItem('orion_auth_session')).not.toBeNull();

      // Switch environment to LIVE
      dbManager.setEnvironment('LIVE');

      // The prior DEMO session must have been purged
      expect(localStorage.getItem('orion_auth_session')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // 5G: DIRECT API ATTACK SIMULATION
  // ---------------------------------------------------------------------------
  describe('5G: Direct API Attack Defense', () => {
    it('18. direct API call presenting DEMO token to LIVE worker endpoint is rejected with 403', () => {
      const demoToken = `orion_sess:DEMO:local-admin:platform_admin:${Date.now() + 3600000}:sig_demo`;
      const validation = verifyWorkerAuthToken(demoToken, 'LIVE');
      expect(validation.authorized).toBe(false);
      expect(validation.statusCode).toBe(403);
    });

    it('19. direct API call presenting invalid JWT is rejected with 401', () => {
      const badJwt = 'header.invalid_json_payload.signature';
      const validation = verifyWorkerAuthToken(badJwt, 'LIVE');
      expect(validation.authorized).toBe(false);
      expect(validation.statusCode).toBe(401);
    });

    it('20. direct API call presenting non-existent user JWT is rejected with 401', () => {
      const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payloadB64 = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64'); // missing sub/user_id
      const noUserJwt = `${headerB64}.${payloadB64}.fake_sig`;

      const validation = verifyWorkerAuthToken(noUserJwt, 'LIVE');
      expect(validation.authorized).toBe(false);
      expect(validation.statusCode).toBe(401);
      expect(validation.error).toContain('missing subject identifier');
    });
  });
});
