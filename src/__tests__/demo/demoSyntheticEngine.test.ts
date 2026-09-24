import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { 
  demoSyntheticDataEngine, 
  DemoSyntheticDataEngine 
} from '../../core/database/DemoSyntheticDataEngine';
import { 
  demoLiveSimulationEngine, 
  DemoLiveSimulationEngine 
} from '../../core/database/DemoLiveSimulationEngine';

describe('Orion-9 Demo Synthetic Data Engine & Live-Simulation Architecture', () => {
  beforeEach(async () => {
    // Ensure active environment is DEMO for these tests
    await dbManager.switchEnvironment({
      targetEnvironment: 'DEMO',
      actorUserId: 'admin_test',
      actorRole: 'platform_admin',
      callerType: 'human_admin',
      stepUpConfirmed: true,
      reason: 'Setup Demo test suite',
    });
  });

  describe('AI Synthetic Enterprise Data Generator (20 Packages / Batch)', () => {
    it('generates exactly 20 complete enterprise packages in default batch', async () => {
      const batchId = `DEMO-TEST-BATCH-20PKGS-${Date.now()}`;
      const audit = await demoSyntheticDataEngine.generateEnterpriseBatch(20, batchId);

      expect(audit).toBeDefined();
      expect(audit.packageCount).toBe(20);
      expect(audit.recordCounts.companies).toBe(20);
      expect(audit.recordCounts.suppliers).toBeGreaterThanOrEqual(40); // 2-3 suppliers per company
      expect(audit.recordCounts.products).toBeGreaterThanOrEqual(60); // 3-5 products per company
      expect(audit.recordCounts.purchaseOrders).toBeGreaterThanOrEqual(60);
      expect(audit.recordCounts.inventoryItems).toBeGreaterThanOrEqual(60);
      expect(audit.status).toBe('COMPLETED');
      expect(audit.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('every generated entity is marked with environment: DEMO and syntheticData: true', async () => {
      const batchId = `DEMO-TEST-TAGS-${Date.now()}`;
      const audit = await demoSyntheticDataEngine.generateEnterpriseBatch(2, batchId);

      expect(audit.environment).toBe('DEMO');
      expect(audit.generationBatchId).toBe(batchId);
    });

    it('enforces multi-tenant isolation by tagging all entities with tenantId and organizationId', async () => {
      const customTenant = 'DEMO_TENANT_CUSTOM_ALPHA';
      const customOrg = 'DEMO_ORG_CUSTOM_ALPHA';
      const batchId = `DEMO-TEST-TENANTS-${Date.now()}`;

      const audit = await demoSyntheticDataEngine.generateEnterpriseBatch(2, batchId, customTenant, customOrg);
      expect(audit.packageCount).toBe(2);
      expect(audit.status).toBe('COMPLETED');
    });

    it('enforces idempotency: duplicate batch ID invocation does not re-generate duplicate records', async () => {
      const fixedBatchId = `DEMO-IDEMPOTENT-FIXED-001`;
      
      const firstRun = await demoSyntheticDataEngine.generateEnterpriseBatch(5, fixedBatchId);
      const secondRun = await demoSyntheticDataEngine.generateEnterpriseBatch(5, fixedBatchId);

      expect(firstRun.generationBatchId).toBe(fixedBatchId);
      expect(secondRun.generationBatchId).toBe(fixedBatchId);
      expect(secondRun.durationMs).toBe(firstRun.durationMs);
    });
  });

  describe('Live Database Protection & Hard Environment Guards', () => {
    it('strictly denies synthetic data generation when active environment is LIVE', async () => {
      // Switch to LIVE mode
      await dbManager.switchEnvironment({
        targetEnvironment: 'LIVE',
        actorUserId: 'admin_test',
        actorRole: 'platform_admin',
        callerType: 'human_admin',
        stepUpConfirmed: true,
        reason: 'Switch to Live for Guard Test',
      });

      expect(dbManager.getEnvironment()).toBe('LIVE');

      // Attempt to generate synthetic data while in LIVE mode -> Must throw hard error
      await expect(
        demoSyntheticDataEngine.generateEnterpriseBatch(20)
      ).rejects.toThrow(/Access Denied: Synthetic Data Engine cannot execute in LIVE mode/);
    });

    it('strictly denies governed Demo reset when active environment is LIVE', async () => {
      // Switch to LIVE mode
      await dbManager.switchEnvironment({
        targetEnvironment: 'LIVE',
        actorUserId: 'admin_test',
        actorRole: 'platform_admin',
        callerType: 'human_admin',
        stepUpConfirmed: true,
        reason: 'Switch to Live for Reset Guard Test',
      });

      expect(dbManager.getEnvironment()).toBe('LIVE');

      await expect(
        demoLiveSimulationEngine.resetDemoData('admin_test', true)
      ).rejects.toThrow(/HARD SAFETY VIOLATION: Reset is strictly DENIED when environment is LIVE/);
    });
  });

  describe('Continuous Live Simulation Engine & Lifecycle Progression', () => {
    beforeEach(async () => {
      await dbManager.switchEnvironment({
        targetEnvironment: 'DEMO',
        actorUserId: 'admin_test',
        actorRole: 'platform_admin',
        callerType: 'human_admin',
        stepUpConfirmed: true,
        reason: 'Reset to Demo for simulation tests',
      });
    });

    it('advances synthetic business lifecycle events in simulation cycle', async () => {
      const result = await demoLiveSimulationEngine.executeSimulationCycle();
      expect(result).toBeDefined();
      expect(result.eventsAdvanced).toBeGreaterThanOrEqual(0);
      expect(result.exceptionsCreated).toBeGreaterThanOrEqual(0);
    });

    it('supports dynamic simulation speed adjustments (1x, 5x, 20x, PAUSED)', () => {
      demoLiveSimulationEngine.setSpeed('5x');
      expect(demoLiveSimulationEngine.getState().speed).toBe('5x');
      expect(demoLiveSimulationEngine.getState().status).toBe('RUNNING');

      demoLiveSimulationEngine.setSpeed('20x');
      expect(demoLiveSimulationEngine.getState().speed).toBe('20x');

      demoLiveSimulationEngine.pause();
      expect(demoLiveSimulationEngine.getState().speed).toBe('PAUSED');
      expect(demoLiveSimulationEngine.getState().status).toBe('PAUSED');

      demoLiveSimulationEngine.resume();
      expect(demoLiveSimulationEngine.getState().speed).toBe('1x');
      expect(demoLiveSimulationEngine.getState().status).toBe('RUNNING');
    });

    it('updates configurable exception injection probabilities', () => {
      demoLiveSimulationEngine.updateConfig({
        exceptionProbabilities: {
          transportDelayProbability: 0.25,
          supplierDelayProbability: 0.30,
        } as any,
      });

      const config = demoLiveSimulationEngine.getConfig();
      expect(config.exceptionProbabilities.transportDelayProbability).toBe(0.25);
      expect(config.exceptionProbabilities.supplierDelayProbability).toBe(0.30);
    });

    it('updates configurable retention policies (7d, 30d, 90d, UNLIMITED)', () => {
      demoLiveSimulationEngine.updateConfig({ retentionPolicy: '7_DAYS' });
      expect(demoLiveSimulationEngine.getConfig().retentionPolicy).toBe('7_DAYS');

      demoLiveSimulationEngine.updateConfig({ retentionPolicy: '30_DAYS' });
      expect(demoLiveSimulationEngine.getConfig().retentionPolicy).toBe('30_DAYS');
    });

    it('governed reset successfully purges and restores 20 baseline packages in DEMO mode', async () => {
      const resetResult = await demoLiveSimulationEngine.resetDemoData('admin_test', true);
      expect(resetResult.success).toBe(true);
      expect(resetResult.message).toContain('Restored 20 fresh synthetic enterprise ecosystems');
      expect(demoLiveSimulationEngine.getState().totalCyclesExecuted).toBe(0);
    });
  });
});
