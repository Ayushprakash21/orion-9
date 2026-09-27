import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { 
  demoPersistentSchedulerService,
  DemoPersistentSchedulerService
} from '../../services/demo/DemoPersistentSchedulerService';
import { demoSyntheticDataEngine } from '../../core/database/DemoSyntheticDataEngine';
import { getFirebaseApp } from '../../lib/firebaseClient';
import worker from '../../worker';

describe('Orion-9 Cloudflare Worker Scheduled Runtime & DEMO Scheduler Architecture', () => {
  beforeEach(async () => {
    // Reset service state to initial state for testing
    demoPersistentSchedulerService.initSchedulerState();

    // Ensure active environment is DEMO for testing
    await dbManager.switchEnvironment({
      targetEnvironment: 'DEMO',
      actorUserId: 'admin_test',
      actorRole: 'platform_admin',
      callerType: 'human_admin',
      stepUpConfirmed: true,
      reason: 'Setup Persistent Scheduler test suite',
    });
  });

  afterEach(() => {
    demoPersistentSchedulerService.stopPersistentScheduler();
  });

  // TEST 1 — INITIAL STATE
  describe('TEST 1: Truthful Initial State', () => {
    it('initializes fresh scheduler with truthful NOT_STARTED state (zero fabricated batches)', () => {
      demoPersistentSchedulerService.initSchedulerState();
      const state = demoPersistentSchedulerService.getSchedulerState();

      expect(state.status).toBe('NOT_STARTED');
      expect(state.hourlyRate).toBe(25);
      expect(state.lastSuccessfulRun).toBeNull();
      expect(state.lastBatchId).toBeNull();
      expect(state.lastBatchResult).toBeNull();
      expect(state.totalBatchesCompleted).toBe(0);
      expect(state.totalPackagesGenerated).toBe(0);
      expect(state.schedulerMode).toBe('CLOUDFLARE_CRON');
      expect(state.nextScheduledRun).toBeDefined();
    });
  });

  // TEST 2 — RATE
  describe('TEST 2: Generation Rate (25 Packages / Hour)', () => {
    it('generates exactly 25 complete enterprise packages per scheduled batch', async () => {
      const targetHour = '2026-09-27T10:00:00.000Z';
      const audit = await demoPersistentSchedulerService.executeScheduledHourlyGeneration(targetHour, true);

      expect(audit).toBeDefined();
      expect(audit.packagesCount).toBe(25);
      expect(audit.status).toBe('COMPLETED');
      expect(audit.environment).toBe('DEMO');
      expect(audit.batchId).toBe('DEMO-20260927T1000Z-BATCH');
      expect(audit.breakdown.companies).toBe(25);
      expect(audit.breakdown.suppliers).toBeGreaterThanOrEqual(50);
      expect(audit.breakdown.products).toBeGreaterThanOrEqual(75);
      expect(audit.breakdown.purchaseOrders).toBeGreaterThanOrEqual(75);
      expect(audit.breakdown.shipments).toBeGreaterThanOrEqual(50);
      expect(audit.breakdown.inventoryItems).toBeGreaterThanOrEqual(75);
      expect(audit.breakdown.invoices).toBeGreaterThanOrEqual(25);
      expect(audit.breakdown.totalRecords).toBeGreaterThanOrEqual(300);
    });
  });

  // TEST 3 — DEMO GUARD
  describe('TEST 3: Server-Side Environment Safety Guard', () => {
    it('permits generation in DEMO mode', async () => {
      expect(dbManager.getEnvironment()).toBe('DEMO');
      const audit = await demoPersistentSchedulerService.executeScheduledHourlyGeneration('2026-09-27T11:00:00.000Z', true);
      expect(audit.status).toBe('COMPLETED');
    });

    it('hard-rejects execution in LIVE mode', async () => {
      await dbManager.switchEnvironment({
        targetEnvironment: 'LIVE',
        actorUserId: 'admin_test',
        actorRole: 'platform_admin',
        callerType: 'human_admin',
        stepUpConfirmed: true,
        reason: 'Switch to Live for Guard Test',
      });

      expect(dbManager.getEnvironment()).toBe('LIVE');

      await expect(
        demoPersistentSchedulerService.executeScheduledHourlyGeneration('2026-09-27T12:00:00.000Z', false)
      ).rejects.toThrow(/\[DEMO-ENGINE-GUARD\] Access Denied: Synthetic Data Engine cannot execute in LIVE mode/);
    });
  });

  // TEST 4 — FORCE FLAG
  describe('TEST 4: Force Flag Safety Boundaries', () => {
    it('allows forced manual generation in DEMO mode for administrators', async () => {
      const audit = await demoPersistentSchedulerService.executeScheduledHourlyGeneration('2026-09-27T13:00:00.000Z', true);
      expect(audit.status).toBe('COMPLETED');
    });

    it('strictly forbids forced manual generation in LIVE mode (force cannot bypass LIVE guard)', async () => {
      await dbManager.switchEnvironment({
        targetEnvironment: 'LIVE',
        actorUserId: 'admin_test',
        actorRole: 'platform_admin',
        callerType: 'human_admin',
        stepUpConfirmed: true,
        reason: 'Switch to Live for Force Guard Test',
      });

      expect(dbManager.getEnvironment()).toBe('LIVE');

      // Force = true in LIVE must STILL fail
      await expect(
        demoPersistentSchedulerService.executeScheduledHourlyGeneration('2026-09-27T13:00:00.000Z', true)
      ).rejects.toThrow(/\[DEMO-ENGINE-GUARD\] Access Denied: Synthetic Data Engine cannot execute in LIVE mode/);
    });
  });

  // TEST 5 — IDEMPOTENCY
  describe('TEST 5: Deterministic Idempotency', () => {
    it('prevents duplicate generation for the same scheduled hour', async () => {
      const fixedHour = '2026-09-27T14:00:00.000Z';

      const firstRun = await demoPersistentSchedulerService.executeScheduledHourlyGeneration(fixedHour, true);
      expect(firstRun.packagesCount).toBe(25);
      expect(firstRun.status).toBe('COMPLETED');

      // Second run on same hour returns COMPLETED without duplicate creation
      const secondRun = await demoPersistentSchedulerService.executeScheduledHourlyGeneration(fixedHour, false);
      expect(secondRun.batchId).toBe(firstRun.batchId);
      expect(secondRun.packagesCount).toBe(25);
      expect(secondRun.status).toBe('COMPLETED');
      expect(secondRun.completedAt).toBe(firstRun.completedAt);
    });
  });

  // TEST 6 — LEASE
  describe('TEST 6: Distributed Execution Lease & Multi-Worker Fencing', () => {
    it('allows only one worker to acquire lease while concurrent worker is fenced out', async () => {
      const targetHour = '2026-09-27T15:00:00.000Z';
      const batchId = demoPersistentSchedulerService.computeDeterministicBatchId(targetHour);

      const lease1 = await demoPersistentSchedulerService.acquireExecutionLease(targetHour, batchId, 'worker-alpha');
      expect(lease1).not.toBeNull();
      expect(lease1?.status).toBe('ACTIVE');

      const lease2 = await demoPersistentSchedulerService.acquireExecutionLease(targetHour, batchId, 'worker-beta');
      expect(lease2).toBeNull(); // Fenced out

      await demoPersistentSchedulerService.releaseExecutionLease(lease1!.leaseId, 'COMPLETED');
    });
  });

  // TEST 7 — FAILURE
  describe('TEST 7: Generator Failure Handling', () => {
    it('sets scheduler status to ERROR upon generation exception', async () => {
      // Mock synthetic generator throwing error
      const spy = vi.spyOn(demoSyntheticDataEngine, 'generateEnterpriseBatch').mockRejectedValueOnce(
        new Error('Simulated generator failure')
      );

      await expect(
        demoPersistentSchedulerService.generateDemoHourlyBatch('2026-09-27T16:00:00.000Z', { force: true })
      ).rejects.toThrow('Simulated generator failure');

      const state = demoPersistentSchedulerService.getSchedulerState();
      expect(state.status).toBe('ERROR');
      expect(state.lastError).toContain('Simulated generator failure');

      spy.mockRestore();
    });
  });

  // TEST 8 — FIRESTORE FAILURE
  describe('TEST 8: Firestore Write Failure Truthful Reporting', () => {
    it('marks batch as FAILED when database errors occur and does not report success', async () => {
      const spy = vi.spyOn(demoSyntheticDataEngine, 'generateEnterpriseBatch').mockResolvedValueOnce({
        generationBatchId: 'DEMO-20260927T1700Z-BATCH',
        environment: 'DEMO',
        generatedBy: 'ORION_PERSISTENT_CLOUD_SCHEDULER',
        generatorVersion: '2.5.0',
        packageCount: 0,
        recordCounts: {
          companies: 0,
          suppliers: 0,
          customers: 0,
          products: 0,
          warehouses: 0,
          purchaseOrders: 0,
          shipments: 0,
          inventoryItems: 0,
          invoices: 0,
          exceptions: 0,
          signals: 0,
        },
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 10,
        errors: ['Firestore permission denied / quota exceeded'],
        status: 'FAILED',
      });

      await expect(
        demoPersistentSchedulerService.generateDemoHourlyBatch('2026-09-27T17:00:00.000Z', { force: true })
      ).rejects.toThrow(/Batch generation failed/);

      const state = demoPersistentSchedulerService.getSchedulerState();
      expect(state.status).toBe('ERROR');

      spy.mockRestore();
    });
  });

  // TEST 9 & 10 — PAUSE & RESUME
  describe('TEST 9 & 10: Pause and Resume Safety Controls', () => {
    it('pauses scheduler and skips scheduled generations', async () => {
      const paused = await demoPersistentSchedulerService.pauseScheduler('admin_test', 'platform_admin');
      expect(paused.status).toBe('PAUSED');
      expect(paused.pausedBy).toBe('admin_test');

      const skipped = await demoPersistentSchedulerService.executeScheduledHourlyGeneration('2026-09-27T18:00:00.000Z', false);
      expect(skipped.status).toBe('SKIPPED');
      expect(skipped.packagesCount).toBe(0);
    });

    it('resumes scheduler and enables scheduled generation', async () => {
      await demoPersistentSchedulerService.pauseScheduler('admin_test', 'platform_admin');
      const resumed = await demoPersistentSchedulerService.resumeScheduler('admin_test', 'platform_admin');
      expect(resumed.status).toBe('RUNNING');

      const audit = await demoPersistentSchedulerService.executeScheduledHourlyGeneration('2026-09-27T19:00:00.000Z', false);
      expect(audit.status).toBe('COMPLETED');
      expect(audit.packagesCount).toBe(25);
    });
  });

  // TEST 11 — SCHEDULED HANDLER
  describe('TEST 11: Cloudflare Worker scheduled() Entrypoint', () => {
    it('Worker scheduled() handler executes DEMO scheduler generation', async () => {
      const controller = {
        scheduledTime: new Date('2026-09-27T20:00:00.000Z').getTime(),
        cron: '0 * * * *',
      };
      const env = {
        ASSETS: { fetch: vi.fn() },
        ORION_RUNTIME_ENVIRONMENT: 'DEMO',
      };
      const ctx = {
        waitUntil: vi.fn((promise: Promise<any>) => promise),
        passThroughOnException: vi.fn(),
      };

      await worker.scheduled(controller, env, ctx);

      expect(ctx.waitUntil).toHaveBeenCalled();
      const state = demoPersistentSchedulerService.getSchedulerState();
      expect(state.lastBatchId).toBe('DEMO-20260927T2000Z-BATCH');
      expect(state.totalPackagesGenerated).toBeGreaterThanOrEqual(25);
    });
  });

  // TEST 12 — CRON CONFIG
  describe('TEST 12: Wrangler Hourly Cron Configuration', () => {
    it('verifies wrangler.jsonc contains hourly trigger "0 * * * *"', () => {
      const wranglerPath = path.resolve(__dirname, '../../../wrangler.jsonc');
      const content = fs.readFileSync(wranglerPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.triggers).toBeDefined();
      expect(parsed.triggers.crons).toBeDefined();
      expect(parsed.triggers.crons).toContain('0 * * * *');
      expect(parsed.main).toBe('src/worker.ts');
    });
  });

  // TEST 13 — NO PRODUCTION TIMER
  describe('TEST 13: Production Scheduling Mechanism Isolation', () => {
    it('verifies production runtime is Cloudflare Cron and server.ts timer is gated', () => {
      const serverPath = path.resolve(__dirname, '../../../server.ts');
      const serverContent = fs.readFileSync(serverPath, 'utf-8');

      // server.ts must gate local setInterval behind ORION_ENABLE_LOCAL_SCHEDULER
      expect(serverContent).toContain('process.env.ORION_ENABLE_LOCAL_SCHEDULER');
      expect(serverContent).toContain('Production runtime: Cloudflare Worker scheduled() cron');
    });
  });
});
