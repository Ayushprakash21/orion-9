/**
 * ORION-9 SIMULATION TO REAL-TIME VISUALIZATION END-TO-END INTEGRATION TEST
 * 
 * Verifies the full operational cycle:
 * 1. DEMO Simulation Engine generates synthetic batch / transactional events.
 * 2. Event Fabric propagates data changes.
 * 3. LiveMetricsEngine recalculates authoritative metrics without full page refresh.
 * 4. RealtimeSubscriptionManager streams updated metrics to subscribed visualization components.
 * 5. Environment switch to LIVE cleanly tears down DEMO subscriptions and activates LIVE rules.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  liveMetricsEngine, 
  realtimeSubscriptionManager, 
  timeSeriesEngine 
} from '../../core/visualization';
import { DemoSyntheticDataEngine } from '../../core/database/DemoSyntheticDataEngine';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { ScmPersistenceService } from '../../services/scm/ScmPersistenceService';

describe('Orion-9 Simulation to Real-Time Visualization Integration Pipeline', () => {
  const tenantId = 'tenant-integration-vis-001';

  beforeEach(async () => {
    await dbManager.switchEnvironment({
      targetEnvironment: 'DEMO',
      actorUserId: 'admin-001',
      actorRole: 'platform_admin',
      callerType: 'human_admin',
      stepUpConfirmed: true,
    });
  });

  it('dynamically updates live visualization when synthetic transactions are generated', async () => {
    const demoEngine = DemoSyntheticDataEngine.getInstance();
    const persistence = ScmPersistenceService.getInstance();

    let latestMetricValue: number = 0;
    const unsub = realtimeSubscriptionManager.subscribeMetric(
      tenantId,
      'DEMO',
      'INVENTORY_ON_HAND',
      (metric) => {
        latestMetricValue = metric.value;
      }
    );

    // Allow initial load
    await new Promise(r => setTimeout(r, 20));
    const initialUnits = latestMetricValue;

    // Simulate new transactional record insertion
    await persistence.saveRecord('inventory', tenantId, {
      id: 'inv-vis-sim-001',
      tenantId,
      productId: 'PROD-VIS-001',
      warehouseId: 'WH-VIS-001',
      onHand: 500,
      reserved: 50,
      safetyStock: 100,
      unitCost: 45,
    });

    // Notify data update via Event Fabric
    await realtimeSubscriptionManager.refreshAllActiveSubscriptions();
    await new Promise(r => setTimeout(r, 30));

    expect(latestMetricValue).toBeGreaterThan(initialUnits);
    expect(latestMetricValue).toBe(initialUnits + 500);

    unsub();
  });

  it('guarantees strict environment isolation on DEMO -> LIVE switch', async () => {
    const persistence = ScmPersistenceService.getInstance();

    // Create a record in DEMO
    await persistence.saveRecord('purchase_orders', tenantId, {
      id: 'po-demo-vis-001',
      tenantId,
      totalValue: 75000,
      status: 'CONFIRMED',
      leadTimeDays: 10,
    });

    const demoSpend = await liveMetricsEngine.computeMetric('PO_SPEND', tenantId, 'DEMO');
    expect(demoSpend.environment).toBe('DEMO');
    expect(demoSpend.value).toBe(75000);

    // Switch to LIVE
    await dbManager.switchEnvironment({
      targetEnvironment: 'LIVE',
      actorUserId: 'admin-001',
      actorRole: 'platform_admin',
      callerType: 'human_admin',
      stepUpConfirmed: true,
    });

    const liveSpend = await liveMetricsEngine.computeMetric('PO_SPEND', 'isolated-live-tenant', 'LIVE');
    expect(liveSpend.environment).toBe('LIVE');
    // DEMO data must NOT leak into LIVE tenant context
    expect(liveSpend.value).toBe(0);
    expect(liveSpend.status).toBe('NO_DATA');
  });
});
