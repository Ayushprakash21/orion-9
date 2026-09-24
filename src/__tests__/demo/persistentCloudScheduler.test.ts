import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { 
  demoPersistentSchedulerService,
  DemoPersistentSchedulerService
} from '../../services/demo/DemoPersistentSchedulerService';
import { demoSyntheticDataEngine } from '../../core/database/DemoSyntheticDataEngine';
import { getFirebaseApp, getFirebaseFirestore } from '../../lib/firebaseClient';

describe('Orion-9 Persistent Cloud Scheduler & Real Demo Firestore Architecture', () => {
  beforeEach(async () => {
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

  describe('1. Real Firestore Isolation: LIVE vs DEMO Databases', () => {
    it('maintains isolated named Firebase app instances for LIVE and DEMO environments', () => {
      const liveApp = getFirebaseApp('LIVE');
      const demoApp = getFirebaseApp('DEMO');

      expect(liveApp).toBeDefined();
      expect(demoApp).toBeDefined();
      expect(liveApp.name).toBe('[DEFAULT]');
      expect(demoApp.name).toBe('DEMO_ORION9_APP');
      expect(liveApp).not.toBe(demoApp);
    });

    it('DatabaseConnectionManager maintains strict environment isolation for configurations', () => {
      const demoConfig = dbManager.getConfig();
      expect(demoConfig.environment).toBe('DEMO');
      expect(demoConfig.projectId).toBe('demo-orion9-db-2026');

      const demoDb = dbManager.getFirestore('DEMO');
      expect(demoDb).toBeNull(); // Graceful fallback in node/vitest mock
    });

    it('strictly forbids persistent cloud scheduler execution in LIVE mode', async () => {
      // Switch DB manager to LIVE
      await dbManager.switchEnvironment({
        targetEnvironment: 'LIVE',
        actorUserId: 'admin_test',
        actorRole: 'platform_admin',
        callerType: 'human_admin',
        stepUpConfirmed: true,
        reason: 'Switch to Live for Guard Test',
      });

      expect(dbManager.getEnvironment()).toBe('LIVE');

      // Attempt to execute scheduled hourly generation -> must throw hard safety guard
      await expect(
        demoPersistentSchedulerService.executeScheduledHourlyGeneration('2026-09-25T10:00:00.000Z', true)
      ).rejects.toThrow(/\[DEMO-ENGINE-GUARD\] Access Denied: Synthetic Data Engine cannot execute in LIVE mode/);
    });
  });

  describe('2. Authoritative 25-Package Generation per Hourly Batch', () => {
    it('generates exactly 25 complete enterprise packages per hourly batch', async () => {
      const targetHour = '2026-09-25T12:00:00.000Z';
      const audit = await demoPersistentSchedulerService.executeScheduledHourlyGeneration(targetHour, true);

      expect(audit).toBeDefined();
      expect(audit.packagesCount).toBe(25);
      expect(audit.status).toBe('COMPLETED');
      expect(audit.environment).toBe('DEMO');
      expect(audit.batchId).toBe('DEMO-20260925T1200Z-BATCH');
      expect(audit.breakdown.companies).toBe(25);
      expect(audit.breakdown.suppliers).toBeGreaterThanOrEqual(50);
      expect(audit.breakdown.products).toBeGreaterThanOrEqual(75);
      expect(audit.breakdown.purchaseOrders).toBeGreaterThanOrEqual(75);
      expect(audit.breakdown.shipments).toBeGreaterThanOrEqual(50);
      expect(audit.breakdown.inventoryItems).toBeGreaterThanOrEqual(75);
      expect(audit.breakdown.invoices).toBeGreaterThanOrEqual(25);
      expect(audit.breakdown.totalRecords).toBeGreaterThanOrEqual(300);
    });

    it('produces deterministic batch IDs based on scheduled UTC hour', () => {
      const hour1 = '2026-09-25T03:00:00.000Z';
      const batchId1 = demoPersistentSchedulerService.computeDeterministicBatchId(hour1);
      expect(batchId1).toBe('DEMO-20260925T0300Z-BATCH');

      const hour2 = '2026-12-31T23:59:59.999Z';
      const batchId2 = demoPersistentSchedulerService.computeDeterministicBatchId(hour2);
      expect(batchId2).toBe('DEMO-20261231T2300Z-BATCH');
    });

    it('enforces idempotency: executing generation for the same hour returns COMPLETED existing batch without duplicate writes', async () => {
      const fixedHour = '2026-09-25T14:00:00.000Z';

      const firstRun = await demoPersistentSchedulerService.executeScheduledHourlyGeneration(fixedHour, true);
      expect(firstRun.packagesCount).toBe(25);
      expect(firstRun.status).toBe('COMPLETED');

      // Second invocation for the identical hour
      const secondRun = await demoPersistentSchedulerService.executeScheduledHourlyGeneration(fixedHour, false);
      expect(secondRun.batchId).toBe(firstRun.batchId);
      expect(secondRun.packagesCount).toBe(25);
      expect(secondRun.status).toBe('COMPLETED');
      expect(secondRun.completedAt).toBe(firstRun.completedAt);
    });
  });

  describe('3. Distributed Execution Leases & Multi-Worker Fencing', () => {
    it('acquires lease before execution and releases it upon completion', async () => {
      const targetHour = '2026-09-25T15:00:00.000Z';
      const batchId = demoPersistentSchedulerService.computeDeterministicBatchId(targetHour);

      const lease = await demoPersistentSchedulerService.acquireExecutionLease(targetHour, batchId, 'worker-test-alpha');
      expect(lease).not.toBeNull();
      expect(lease?.status).toBe('ACTIVE');
      expect(lease?.batchId).toBe(batchId);

      // Attempting to acquire lease with another worker on the same hour fails (fencing)
      const duplicateLease = await demoPersistentSchedulerService.acquireExecutionLease(targetHour, batchId, 'worker-test-beta');
      expect(duplicateLease).toBeNull();

      // Release lease
      await demoPersistentSchedulerService.releaseExecutionLease(lease!.leaseId, 'COMPLETED');
    });
  });

  describe('4. Durable Pause and Resume Control', () => {
    it('allows administrators to durably pause and resume the persistent scheduler', async () => {
      const pausedState = await demoPersistentSchedulerService.pauseScheduler('admin_test', 'platform_admin');
      expect(pausedState.status).toBe('PAUSED');
      expect(pausedState.pausedBy).toBe('admin_test');
      expect(pausedState.pausedAt).toBeDefined();

      // Attempting generation while paused returns PAUSED state without creating batches
      const targetHour = '2026-09-25T16:00:00.000Z';
      const skippedAudit = await demoPersistentSchedulerService.executeScheduledHourlyGeneration(targetHour, false);
      expect(skippedAudit.status).toBe('SKIPPED');

      // Resume scheduler
      const resumedState = await demoPersistentSchedulerService.resumeScheduler('admin_test', 'platform_admin');
      expect(resumedState.status).toBe('RUNNING');
      expect(resumedState.pausedAt).toBeUndefined();
    });

    it('rejects pause / resume requests from non-admin roles', async () => {
      await expect(
        demoPersistentSchedulerService.pauseScheduler('viewer_user', 'viewer')
      ).rejects.toThrow(/Unauthorized/);

      await expect(
        demoPersistentSchedulerService.resumeScheduler('viewer_user', 'viewer')
      ).rejects.toThrow(/Unauthorized/);
    });
  });

  describe('5. Governed Catch-Up Policy for Missed Hours', () => {
    it('identifies and executes missed hourly batches up to maxCatchUpHours limit', async () => {
      // Simulate missed hours: last successful run was 3 hours ago
      const threeHoursAgo = new Date(Date.now() - 3 * 3600000).toISOString();
      const currentHour = new Date().toISOString();

      const missedHours = demoPersistentSchedulerService.calculateMissedHours(threeHoursAgo, currentHour, 6);
      expect(missedHours.length).toBeGreaterThanOrEqual(2);
      expect(missedHours.length).toBeLessThanOrEqual(6);
    });

    it('caps catch-up batches at maxCatchUpHours = 6 to prevent runaway generation after prolonged downtime', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 3600000).toISOString();
      const currentHour = new Date().toISOString();

      const missedHours = demoPersistentSchedulerService.calculateMissedHours(tenDaysAgo, currentHour, 6);
      expect(missedHours.length).toBe(6);
    });
  });

  describe('6. Multi-Hour Persistence & Closed-Browser Simulation', () => {
    it('executes consecutive hourly generations and accumulates persisted packages', async () => {
      const hour1 = '2026-09-25T17:00:00.000Z';
      const hour2 = '2026-09-25T18:00:00.000Z';

      const batch1 = await demoPersistentSchedulerService.executeScheduledHourlyGeneration(hour1, true);
      expect(batch1.packagesCount).toBe(25);
      expect(batch1.batchId).toBe('DEMO-20260925T1700Z-BATCH');

      const batch2 = await demoPersistentSchedulerService.executeScheduledHourlyGeneration(hour2, true);
      expect(batch2.packagesCount).toBe(25);
      expect(batch2.batchId).toBe('DEMO-20260925T1800Z-BATCH');

      const schedulerState = demoPersistentSchedulerService.getSchedulerState();
      expect(schedulerState.totalPackagesGenerated).toBeGreaterThanOrEqual(50);
      expect(schedulerState.totalBatchesCompleted).toBeGreaterThanOrEqual(2);
      expect(schedulerState.hourlyRate).toBe(25);
      expect(schedulerState.schedulerMode).toBe('CLOUD_PERSISTENT');
    });

    it('daemon background interval starts and stops cleanly without leaks', () => {
      demoPersistentSchedulerService.startPersistentScheduler(1000);
      expect(demoPersistentSchedulerService.isSchedulerActive()).toBe(true);

      demoPersistentSchedulerService.stopPersistentScheduler();
      expect(demoPersistentSchedulerService.isSchedulerActive()).toBe(false);
    });
  });
});
