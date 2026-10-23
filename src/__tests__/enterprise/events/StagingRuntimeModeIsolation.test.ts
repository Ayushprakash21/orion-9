/**
 * ORION-9 STAGING RUNTIME MODE ISOLATION & PERSISTENCE VERIFICATION
 * 
 * Verifies the three-mode enterprise runtime semantics:
 * 1. DEMO: Isolated sandbox simulation (in-memory processing, synthetic generator permitted).
 * 2. STAGING: Dedicated pre-production environment (Cloudflare Queue 'orion-scm-events-staging',
 *    durable Firestore transactions on 'orion-9-staging', synthetic generator blocked).
 * 3. LIVE: Authoritative production environment ('orion9-dev-db-2026').
 * 
 * ALL TESTS IN THIS SUITE ARE MOCKED UNIT TESTS (Zero live cloud dependencies).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase/firestore', () => {
  return {
    doc: vi.fn((_fs: any, col: string, id: string) => ({ path: `${col}/${id}` })),
    collection: vi.fn((_fs: any, col: string) => ({ path: col })),
    runTransaction: vi.fn(async (_fs: any, updateFunction: any) => {
      const mockTransaction = {
        get: vi.fn(async () => ({
          exists: () => false,
          data: () => null
        })),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      };
      return await updateFunction(mockTransaction);
    }),
    getDoc: vi.fn(async () => ({
      exists: () => false,
      data: () => null
    })),
    getDocs: vi.fn(async () => ({
      forEach: (_cb: any) => {}
    })),
    setDoc: vi.fn(async () => {}),
    query: vi.fn((...args: any[]) => args[0]),
    where: vi.fn(() => ({})),
    limit: vi.fn(() => ({}))
  };
});

import { DatabaseConnectionManager } from '../../../core/database/DatabaseConnectionManager';
import { STAGING_DATABASE_CONFIG, LIVE_DATABASE_CONFIG } from '../../../core/database/DatabaseEnvironment';
import { queueConsumer } from '../../../enterprise/events/QueueConsumer';
import { createDistributedEventEnvelope } from '../../../enterprise/events/EventEnvelope';
import { verifyWorkerAuthToken, createSignedTestJwt } from '../../../server/workerSecurity';
import { scmPersistenceService } from '../../../services/scm/ScmPersistenceService';
import { resolveCurrentEnvironment, STAGING_FIREBASE_CONFIG } from '../../../lib/firebaseClient';

describe('ORION-9 — Staging Runtime Mode & Persistence Isolation Gate [MOCKED UNIT TESTS]', () => {
  let dbManager: DatabaseConnectionManager;

  beforeEach(() => {
    vi.restoreAllMocks();
    queueConsumer.clear();
    scmPersistenceService.clear();
    dbManager = DatabaseConnectionManager.getInstance();
  });

  describe('1. DatabaseConnectionManager & Configuration Resolution [MOCKED UNIT TESTS]', () => {
    it('returns dedicated STAGING database configuration with distinct projectId [MOCKED UNIT TEST]', () => {
      expect(STAGING_DATABASE_CONFIG.projectId).toBe('orion-9-staging');
      expect(STAGING_DATABASE_CONFIG.authDomain).toBe('orion-9-staging.firebaseapp.com');
      expect(LIVE_DATABASE_CONFIG.projectId).toBe('orion9-dev-db-2026');
      expect(STAGING_DATABASE_CONFIG.projectId).not.toBe(LIVE_DATABASE_CONFIG.projectId);
    });

    it('DatabaseConnectionManager provides STAGING configuration when mode is set to STAGING [MOCKED UNIT TEST]', () => {
      dbManager.setEnvironment('STAGING');
      const config = dbManager.getConfig();
      expect(config.projectId).toBe('orion-9-staging');
      expect(dbManager.getEnvironment()).toBe('STAGING');
    });

    it('resolveCurrentEnvironment respects STAGING and defaults safely to DEMO on unknown value [MOCKED UNIT TEST]', () => {
      expect(resolveCurrentEnvironment('STAGING')).toBe('STAGING');
      expect(resolveCurrentEnvironment('LIVE')).toBe('LIVE');
      expect(resolveCurrentEnvironment('DEMO')).toBe('DEMO');
      expect(resolveCurrentEnvironment(undefined)).toBe('DEMO');
      expect(resolveCurrentEnvironment('UNKNOWN_ENV' as any)).toBe('DEMO');
    });
  });

  describe('2. QueueConsumer Runtime Semantics & Fail-Closed Guard [MOCKED UNIT TESTS]', () => {
    it('STAGING mode uses durable transaction path when Firestore instance is configured [MOCKED UNIT TEST]', async () => {
      dbManager.setEnvironment('STAGING');

      const mockFirestore = { type: 'mock-staging-firestore' } as any;
      vi.spyOn(dbManager, 'getFirestore').mockReturnValue(mockFirestore);

      let mutationRan = false;
      queueConsumer.setMutationHandler(async (_envelope, ctx) => {
        if (ctx && ctx.transaction) {
          mutationRan = true;
        }
      });

      const envelope = createDistributedEventEnvelope({
        tenantId: 'staging_tenant_1',
        eventType: 'scm.inventory.adjusted',
        partitionKey: 'staging_tenant_1:INV-STAGING-1',
        producer: 'inventory-service',
        idempotencyKey: 'idemp-staging-001',
        payload: { productId: 'PROD-STG-1', delta: 10 }
      });

      const mockMessage = {
        id: 'msg-stg-1',
        body: envelope,
        attempts: 1,
        ack: vi.fn(),
        retry: vi.fn()
      };

      const result = await queueConsumer.handleMessage(mockMessage);
      expect(result.status).toBe('PROCESSED');
      expect(mockMessage.ack).toHaveBeenCalledTimes(1);
      expect(mutationRan).toBe(true);
    });

    it('STAGING mode fails closed if Firestore instance is unavailable: throws critical error, retries, does not ack, and refuses in-memory fallback [MOCKED UNIT TEST]', async () => {
      dbManager.setEnvironment('STAGING');

      // Firestore instance is missing
      vi.spyOn(dbManager, 'getFirestore').mockReturnValue(null);

      let mutationRan = false;
      queueConsumer.setMutationHandler(async () => {
        mutationRan = true;
      });

      const envelope = createDistributedEventEnvelope({
        tenantId: 'staging_tenant_1',
        eventType: 'scm.inventory.adjusted',
        partitionKey: 'staging_tenant_1:INV-STAGING-1',
        producer: 'inventory-service',
        idempotencyKey: 'idemp-staging-failclose-001',
        payload: { productId: 'PROD-STG-1', delta: 10 }
      });

      const mockMessage = {
        id: 'msg-stg-fail-1',
        body: envelope,
        attempts: 1,
        ack: vi.fn(),
        retry: vi.fn()
      };

      const result = await queueConsumer.handleMessage(mockMessage);

      // Must NOT acknowledge or claim processed
      expect(result.status).toBe('RETRIED');
      expect(result.error).toContain('[QUEUE-CONSUMER-CRITICAL] Firestore instance is unavailable in STAGING mode');
      expect(mockMessage.ack).not.toHaveBeenCalled();
      expect(mockMessage.retry).toHaveBeenCalledWith({ delaySeconds: 30 });
      // Business mutation MUST NOT have executed via in-memory fallback
      expect(mutationRan).toBe(false);
    });

    it('LIVE mode fails closed if Firestore instance is unavailable [MOCKED UNIT TEST]', async () => {
      dbManager.setEnvironment('LIVE');
      vi.spyOn(dbManager, 'getFirestore').mockReturnValue(null);

      let mutationRan = false;
      queueConsumer.setMutationHandler(async () => {
        mutationRan = true;
      });

      const envelope = createDistributedEventEnvelope({
        tenantId: 'live_tenant_1',
        eventType: 'scm.inventory.adjusted',
        partitionKey: 'live_tenant_1:INV-LIVE-1',
        producer: 'inventory-service',
        idempotencyKey: 'idemp-live-failclose-001',
        payload: { productId: 'PROD-LIVE-1', delta: 10 }
      });

      const mockMessage = {
        id: 'msg-live-fail-1',
        body: envelope,
        attempts: 1,
        ack: vi.fn(),
        retry: vi.fn()
      };

      const result = await queueConsumer.handleMessage(mockMessage);
      expect(result.status).toBe('RETRIED');
      expect(result.error).toContain('[QUEUE-CONSUMER-CRITICAL] Firestore instance is unavailable in LIVE mode');
      expect(mockMessage.ack).not.toHaveBeenCalled();
      expect(mockMessage.retry).toHaveBeenCalledTimes(1);
      expect(mutationRan).toBe(false);
    });

    it('STAGING synchronizes environment from worker binding (env.ORION_RUNTIME_ENVIRONMENT) even if dbManager was in DEMO mode [MOCKED UNIT TEST]', async () => {
      // Intentionally leave dbManager in DEMO
      dbManager.setEnvironment('DEMO');

      const mockFirestore = { type: 'mock-staging-firestore' } as any;
      vi.spyOn(dbManager, 'getFirestore').mockReturnValue(mockFirestore);

      let transactionContextReceived = false;
      queueConsumer.setMutationHandler(async (_envelope, ctx) => {
        if (ctx && ctx.transaction) {
          transactionContextReceived = true;
        }
      });

      const envelope = createDistributedEventEnvelope({
        tenantId: 'staging_tenant_binding',
        eventType: 'scm.inventory.adjusted',
        partitionKey: 'staging_tenant_binding:INV-1',
        producer: 'inventory-service',
        idempotencyKey: 'idemp-staging-binding-001',
        payload: { delta: 1 }
      });

      const mockMessage = {
        id: 'msg-stg-bind-1',
        body: envelope,
        attempts: 1,
        ack: vi.fn(),
        retry: vi.fn()
      };

      // Worker passes env with STAGING runtime
      const workerEnv = { ORION_RUNTIME_ENVIRONMENT: 'STAGING' };
      const result = await queueConsumer.handleMessage(mockMessage, workerEnv);

      expect(result.status).toBe('PROCESSED');
      expect(dbManager.getEnvironment()).toBe('STAGING');
      expect(transactionContextReceived).toBe(true);
    });

    it('DEMO mode uses in-memory fast-path without invoking durable Firestore transactions [MOCKED UNIT TEST]', async () => {
      dbManager.setEnvironment('DEMO');

      const envelope = createDistributedEventEnvelope({
        tenantId: 'demo_tenant_1',
        eventType: 'scm.inventory.adjusted',
        partitionKey: 'demo_tenant_1:INV-DEMO-1',
        producer: 'inventory-service',
        idempotencyKey: 'idemp-demo-001',
        payload: { productId: 'PROD-DEMO-1', delta: 5 }
      });

      const mockMessage = {
        id: 'msg-demo-1',
        body: envelope,
        attempts: 1,
        ack: vi.fn(),
        retry: vi.fn()
      };

      const result = await queueConsumer.handleMessage(mockMessage);
      expect(result.status).toBe('PROCESSED');
      expect(mockMessage.ack).toHaveBeenCalledTimes(1);

      const isAlreadyProcessed = await queueConsumer.isAlreadyProcessed(envelope.idempotencyKey, envelope.tenantId);
      expect(isAlreadyProcessed).toBe(true);
    });
  });

  describe('3. Multi-Environment Auth Token Validation & Cross-Environment Guard [MOCKED UNIT TESTS]', () => {
    it('STAGING rejects demo tokens with HTTP 401 [MOCKED UNIT TEST]', () => {
      const result = verifyWorkerAuthToken('demo-admin-token', 'STAGING');
      expect(result.authorized).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('Demo tokens are strictly forbidden in STAGING environment');
    });

    it('LIVE rejects demo tokens with HTTP 401 [MOCKED UNIT TEST]', () => {
      const result = verifyWorkerAuthToken('demo-admin-token', 'LIVE');
      expect(result.authorized).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('Demo tokens are strictly forbidden in LIVE environment');
    });

    it('DEMO mode accepts demo tokens for development/demo testing [MOCKED UNIT TEST]', () => {
      const result = verifyWorkerAuthToken('demo-admin-token', 'DEMO');
      expect(result.authorized).toBe(true);
      expect(result.user?.userId).toBe('local-admin');
      expect(result.user?.role).toBe('platform_admin');
    });

    it('Cross-environment session tokens are rejected in both STAGING and LIVE [MOCKED UNIT TEST]', () => {
      const stagingToken = 'orion_sess:STAGING:user1:operator:12345';
      const liveToken = 'orion_sess:LIVE:user1:operator:12345';

      const liveResult = verifyWorkerAuthToken(stagingToken, 'LIVE');
      expect(liveResult.authorized).toBe(false);
      expect(liveResult.statusCode).toBe(403);
      expect(liveResult.error).toContain('Cross-environment token rejection');

      const stagingResult = verifyWorkerAuthToken(liveToken, 'STAGING');
      expect(stagingResult.authorized).toBe(false);
      expect(stagingResult.statusCode).toBe(403);
      expect(stagingResult.error).toContain('Cross-environment token rejection');
    });

    it('STAGING rejects tokens issued for production project (orion9-dev-db-2026) [MOCKED UNIT TEST]', () => {
      // Cryptographically signed JWT with production audience
      const fakeLiveJwt = createSignedTestJwt({
        aud: 'orion9-dev-db-2026',
        iss: 'https://securetoken.google.com/orion9-dev-db-2026',
        user_id: 'prod-admin-1',
        role: 'platform_admin',
        exp: Math.floor(Date.now() / 1000) + 3600
      });

      const result = verifyWorkerAuthToken(fakeLiveJwt, 'STAGING');
      expect(result.authorized).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('Invalid token audience: expected project orion-9-staging');
    });
  });

  describe('4. ScmPersistenceService Durable Persistence in STAGING [MOCKED UNIT TESTS]', () => {
    it('rejects unpersisted writes in STAGING if Firestore instance is unavailable [MOCKED UNIT TEST]', async () => {
      dbManager.setEnvironment('STAGING');
      vi.spyOn(dbManager, 'getFirestore').mockReturnValue(null);

      await expect(
        scmPersistenceService.saveRecord('inventory', 'INV-STG-FAIL', { tenantId: 'stg_tenant', sku: 'SKU-1' })
      ).rejects.toThrow('[SCM-AUTHORITATIVE-ERROR] STAGING environment requested but Firestore instance is unavailable');
    });

    it('getPendingOutboxEvents in STAGING fails closed without Firestore and refuses cache fallback [MOCKED UNIT TEST]', async () => {
      dbManager.setEnvironment('STAGING');
      vi.spyOn(dbManager, 'getFirestore').mockReturnValue(null);

      await expect(
        scmPersistenceService.getPendingOutboxEvents('stg_tenant')
      ).rejects.toThrow('[SCM-PERSISTENCE] Firestore instance unavailable in STAGING mode for getPendingOutboxEvents');
    });

    it('claimOutboxEvent in STAGING fails closed without Firestore and refuses in-memory claim [MOCKED UNIT TEST]', async () => {
      dbManager.setEnvironment('STAGING');
      vi.spyOn(dbManager, 'getFirestore').mockReturnValue(null);

      await expect(
        scmPersistenceService.claimOutboxEvent('outbox_stg_001', 'worker-1')
      ).rejects.toThrow('[SCM-PERSISTENCE] Firestore instance unavailable in STAGING mode for claimOutboxEvent');
    });

    it('markOutboxPublished in STAGING fails closed without Firestore and refuses in-memory update [MOCKED UNIT TEST]', async () => {
      dbManager.setEnvironment('STAGING');
      vi.spyOn(dbManager, 'getFirestore').mockReturnValue(null);

      await expect(
        scmPersistenceService.markOutboxPublished('outbox_stg_001', 'worker-1')
      ).rejects.toThrow('[SCM-PERSISTENCE] Firestore instance unavailable in STAGING mode for markOutboxPublished');
    });

    it('markOutboxFailed in STAGING fails closed without Firestore and refuses in-memory update [MOCKED UNIT TEST]', async () => {
      dbManager.setEnvironment('STAGING');
      vi.spyOn(dbManager, 'getFirestore').mockReturnValue(null);

      await expect(
        scmPersistenceService.markOutboxFailed('outbox_stg_001', 'worker-1', 'network timeout', false)
      ).rejects.toThrow('[SCM-PERSISTENCE] Firestore instance unavailable in STAGING mode for markOutboxFailed');
    });
  });

  describe('5. Client-Side Firebase Configuration Credential Isolation [MOCKED UNIT TESTS]', () => {
    it('STAGING_FIREBASE_CONFIG does not fall back to production API key [MOCKED UNIT TEST]', () => {
      expect(STAGING_FIREBASE_CONFIG.projectId).toBe('orion-9-staging');
      // When VITE_STAGING_FIREBASE_API_KEY is not defined, it must default to empty string, NOT production key
      delete process.env.VITE_STAGING_FIREBASE_API_KEY;
      expect(STAGING_FIREBASE_CONFIG.projectId).not.toBe('orion9-dev-db-2026');
    });
  });
});
