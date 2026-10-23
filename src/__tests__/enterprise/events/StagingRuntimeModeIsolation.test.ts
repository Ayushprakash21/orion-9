/**
 * ORION-9 STAGING RUNTIME MODE & MULTI-ENVIRONMENT ISOLATION UNIT TESTS
 *
 * NOTE: These are unit tests executed with MOCKED Firebase and Cloudflare runtimes.
 * They verify code paths, configuration resolution, and fail-closed security guards.
 * They do NOT represent live Cloudflare or Google Cloud deployed integration tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Top-level mock for Firestore runTransaction
vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    runTransaction: vi.fn(async (_db, fn) => {
      const mockTx = {
        get: vi.fn().mockResolvedValue({ exists: () => false }),
        set: vi.fn(),
        update: vi.fn(),
      };
      return fn(mockTx);
    }),
    doc: vi.fn((_db, col, id) => ({ path: `${col}/${id}` })),
    collection: vi.fn((_db, col) => ({ path: col })),
  };
});

import { DatabaseConnectionManager } from '../../../core/database/DatabaseConnectionManager';
import { queueConsumer } from '../../../enterprise/events/QueueConsumer';
import { createDistributedEventEnvelope } from '../../../enterprise/events/EventEnvelope';
import { scmPersistenceService } from '../../../services/scm/ScmPersistenceService';
import { verifyWorkerAuthToken } from '../../../server/workerSecurity';
import { STAGING_DATABASE_CONFIG, LIVE_DATABASE_CONFIG } from '../../../core/database/DatabaseEnvironment';
import { resolveCurrentEnvironment } from '../../../lib/firebaseClient';

describe('ORION-9 Staging Runtime Mode & Multi-Environment Isolation (Mocked Unit Tests)', () => {
  const dbManager = DatabaseConnectionManager.getInstance();

  beforeEach(() => {
    vi.clearAllMocks();
    queueConsumer.clear();
    dbManager.setEnvironment('DEMO');
  });

  afterEach(() => {
    dbManager.setEnvironment('DEMO');
  });

  describe('1. Authoritative Environment Resolution & Project ID Boundaries', () => {
    it('STAGING environment selects isolated staging config and does not fall back to production', () => {
      dbManager.setEnvironment('STAGING');

      expect(dbManager.getEnvironment()).toBe('STAGING');
      const config = dbManager.getConfig();
      expect(config.environment).toBe('STAGING');
      expect(config.projectId).toBe('orion-9-staging');
      expect(config.projectId).not.toBe(LIVE_DATABASE_CONFIG.projectId);
      expect(config.cachePrefix).toBe('orion9:staging');
    });

    it('DEMO environment selects isolated demo config and does not access production', () => {
      dbManager.setEnvironment('DEMO');

      expect(dbManager.getEnvironment()).toBe('DEMO');
      const config = dbManager.getConfig();
      expect(config.environment).toBe('DEMO');
      expect(config.projectId).toBe('demo-orion9-db-2026');
      expect(config.projectId).not.toBe(LIVE_DATABASE_CONFIG.projectId);
    });

    it('LIVE environment selects production config only when explicitly configured', () => {
      dbManager.setEnvironment('LIVE');

      expect(dbManager.getEnvironment()).toBe('LIVE');
      const config = dbManager.getConfig();
      expect(config.environment).toBe('LIVE');
      expect(config.projectId).toBe('orion9-dev-db-2026');
      expect(config.isProductionSafe).toBe(true);
    });

    it('resolveCurrentEnvironment respects STAGING and defaults safely to DEMO on unknown value', () => {
      expect(resolveCurrentEnvironment('STAGING')).toBe('STAGING');
      expect(resolveCurrentEnvironment('LIVE')).toBe('LIVE');
      expect(resolveCurrentEnvironment('DEMO')).toBe('DEMO');
      expect(resolveCurrentEnvironment(undefined)).toBe('DEMO');
      expect(resolveCurrentEnvironment('UNKNOWN_ENV' as any)).toBe('DEMO');
    });
  });

  describe('2. QueueConsumer Runtime Semantics: STAGING vs DEMO vs LIVE', () => {
    it('STAGING mode uses durable transaction path when Firestore instance is configured', async () => {
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

    it('DEMO mode uses in-memory fast-path without invoking durable Firestore transactions', async () => {
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

  describe('3. Multi-Environment Auth Token Validation & Cross-Environment Guard', () => {
    it('STAGING rejects demo tokens with HTTP 401', () => {
      const result = verifyWorkerAuthToken('demo-admin-token', 'STAGING');
      expect(result.authorized).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('Demo tokens are strictly forbidden in STAGING environment');
    });

    it('LIVE rejects demo tokens with HTTP 401', () => {
      const result = verifyWorkerAuthToken('demo-admin-token', 'LIVE');
      expect(result.authorized).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('Demo tokens are strictly forbidden in LIVE environment');
    });

    it('DEMO mode accepts demo tokens for development/demo testing', () => {
      const result = verifyWorkerAuthToken('demo-admin-token', 'DEMO');
      expect(result.authorized).toBe(true);
      expect(result.user?.userId).toBe('local-admin');
      expect(result.user?.role).toBe('platform_admin');
    });

    it('Cross-environment session tokens are rejected in both STAGING and LIVE', () => {
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
  });

  describe('4. ScmPersistenceService Durable Persistence in STAGING', () => {
    it('rejects unpersisted writes in STAGING if Firestore instance is unavailable', async () => {
      dbManager.setEnvironment('STAGING');
      vi.spyOn(dbManager, 'getFirestore').mockReturnValue(null);

      await expect(
        scmPersistenceService.saveRecord('inventory', 'INV-STG-FAIL', { tenantId: 'stg_tenant', sku: 'SKU-1' })
      ).rejects.toThrow('[SCM-AUTHORITATIVE-ERROR] STAGING environment requested but Firestore instance is unavailable');
    });
  });
});
