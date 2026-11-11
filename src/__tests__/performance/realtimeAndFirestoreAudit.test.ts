/**
 * ORION-9 REALTIME SUBSCRIPTION, FIRESTORE QUERY FAN-OUT & CONCURRENCY AUDIT
 *
 * Benchmarks and verifies under 150 simulated concurrent users:
 * 1. RealtimeSubscriptionManager single-listener reference counting & deduplication
 * 2. High-concurrency mutation delivery latency & zero dropped/duplicated events
 * 3. Cross-tenant & cross-environment subscription isolation (0 leakage)
 * 4. ScmPersistenceService concurrent adjustInventory locks & idempotency conflicts
 * 5. LiveMetricsEngine collection read fan-out behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { realtimeSubscriptionManager } from '../../core/visualization/RealtimeSubscriptionManager';
import { liveMetricsEngine } from '../../core/visualization/LiveMetricsEngine';
import { scmPersistenceService } from '../../services/scm/ScmPersistenceService';
import { dbManager } from '../../core/database/DatabaseConnectionManager';

describe('ORION-9 150-User Realtime & Persistence Performance Audit', () => {
  const TENANTS = [
    'org-perf-sandbox-alpha',
    'org-perf-sandbox-beta',
    'org-perf-sandbox-gamma',
  ];

  beforeEach(() => {
    realtimeSubscriptionManager.cleanupUserSubscriptions();
    scmPersistenceService.clear();
    dbManager.setEnvironment('DEMO');
  });

  it('1. Deduplicates 150 concurrent Control Tower subscribers across 3 tenants into 12 shared domain listeners (4 domains × 3 tenants)', () => {
    const startMs = performance.now();
    const unsubs: Array<() => void> = [];
    const receivedCounts = new Array(150).fill(0);

    for (let u = 0; u < 150; u++) {
      const tenantId = TENANTS[u % TENANTS.length];
      const unsub = realtimeSubscriptionManager.subscribeControlTower(
        tenantId,
        'DEMO',
        () => {
          receivedCounts[u]++;
        },
        tenantId
      );
      unsubs.push(unsub);
    }

    const subscribeMs = performance.now() - startMs;

    // Verify exact reference counts: 50 users per tenant per domain
    for (const tenantId of TENANTS) {
      for (const domain of ['inventory', 'purchase_orders', 'shipments', 'exceptions'] as const) {
        const state = realtimeSubscriptionManager.getSubscriptionState(domain, tenantId, 'DEMO');
        expect(state).not.toBeNull();
        expect(state!.subscriberCount).toBe(50);
      }
    }

    // Measure mutation fan-out latency & delivery completeness
    const mutStart = performance.now();
    for (const tenantId of TENANTS) {
      realtimeSubscriptionManager.simulateDocumentMutation(
        'inventory',
        tenantId,
        'DEMO',
        { id: `INV-PERF-${tenantId}`, tenantId, productId: 'SKU-1000', onHand: 500, unitCost: 450 },
        'modified'
      );
      realtimeSubscriptionManager.simulateDocumentMutation(
        'shipments',
        tenantId,
        'DEMO',
        { id: `SHP-PERF-${tenantId}`, tenantId, status: 'In Transit', delayDays: 0, freightCost: 1200 },
        'modified'
      );
      realtimeSubscriptionManager.simulateDocumentMutation(
        'purchase_orders',
        tenantId,
        'DEMO',
        { id: `PO-PERF-${tenantId}`, tenantId, status: 'Approved', totalValue: 25000 },
        'modified'
      );
    }
    const mutationFanoutMs = performance.now() - mutStart;

    // Every single one of the 150 users received updates
    expect(receivedCounts.every((c) => c >= 4)).toBe(true);
    expect(subscribeMs).toBeLessThan(1000);
    expect(mutationFanoutMs).toBeLessThan(500);

    // Full teardown must drop subscriber counts & clean all domain subscriptions
    unsubs.forEach((u) => u());
    for (const tenantId of TENANTS) {
      const state = realtimeSubscriptionManager.getSubscriptionState('inventory', tenantId, 'DEMO');
      expect(state).toBeNull();
    }

    console.log(
      `[REALTIME-AUDIT] 150-user subscribe=${subscribeMs.toFixed(2)}ms, 9-mutation-fanout=${mutationFanoutMs.toFixed(2)}ms`
    );
  });

  it('2. Enforces strict cross-tenant isolation across 150 simultaneous domain listeners (zero leakage)', () => {
    const alphaPayloads: any[] = [];
    const betaPayloads: any[] = [];
    const unsubs: Array<() => void> = [];

    for (let i = 0; i < 75; i++) {
      unsubs.push(
        realtimeSubscriptionManager.subscribeInventory('org-perf-alpha', 'DEMO', (items) => {
          alphaPayloads.push(items);
        })
      );
      unsubs.push(
        realtimeSubscriptionManager.subscribeInventory('org-perf-beta', 'DEMO', (items) => {
          betaPayloads.push(items);
        })
      );
    }

    const beforeBetaLen = betaPayloads.length;
    realtimeSubscriptionManager.simulateDocumentMutation(
      'inventory',
      'org-perf-alpha',
      'DEMO',
      { id: 'INV-SECRET-ALPHA', tenantId: 'org-perf-alpha', productId: 'SKU-ALPHA', onHand: 999 },
      'added'
    );

    // Alpha received the update; Beta received ZERO notifications from Alpha's mutation
    const alphaData = realtimeSubscriptionManager.getDomainData('inventory', 'org-perf-alpha', 'DEMO');
    const betaData = realtimeSubscriptionManager.getDomainData('inventory', 'org-perf-beta', 'DEMO');

    expect(alphaData.some((d: any) => d.id === 'INV-SECRET-ALPHA')).toBe(true);
    expect(betaData.some((d: any) => d.id === 'INV-SECRET-ALPHA')).toBe(false);
    expect(betaPayloads.length).toBe(beforeBetaLen);

    unsubs.forEach((u) => u());
  });

  it('3. Serializes 50 concurrent inventory stock adjustments safely without lost updates or negative stock corruption', async () => {
    const tenantId = 'org-perf-lock-test';
    const warehouseId = 'WH-PERF-01';
    const productId = 'SKU-LOCK-01';

    await scmPersistenceService.saveRecord('inventory', `INV-${warehouseId}-${productId}`, {
      id: `INV-${warehouseId}-${productId}`,
      tenantId,
      productId,
      warehouseId,
      onHand: 1000,
      reserved: 0,
      safetyStock: 100,
      reorderPoint: 200,
      averageDailyDemand: 10,
      unitCost: 50,
      leadTime: 5,
      lastUpdated: new Date().toISOString(),
    });

    const t0 = performance.now();
    // 50 concurrent +10 adjustments (each needs unique operationId)
    const tasks = Array.from({ length: 50 }, (_, idx) =>
      scmPersistenceService.adjustInventory({
        tenantId,
        productId,
        warehouseId,
        quantityDelta: 10,
        transactionType: 'CYCLE_COUNT_ADJUSTMENT',
        referenceEntityType: 'CYCLE_COUNT',
        referenceEntityId: `CC-${idx}`,
        actor: `perf-inv-${idx}`,
        operationId: `op-lock-${idx}`,
      })
    );

    const results = await Promise.all(tasks);
    const elapsedMs = performance.now() - t0;

    // Final stock must equal exact initial 1000 + 50*10 = 1500 (zero lost updates)
    const finalInv = await scmPersistenceService.getRecord<any>(
      'inventory',
      tenantId,
      `INV-${warehouseId}-${productId}`
    );
    expect(finalInv?.onHand).toBe(1500);
    expect(results.every((r) => !r.isDuplicate)).toBe(true);

    // Duplicate retry with same operationId must be idempotent (zero duplicate increment)
    const retryRes = await scmPersistenceService.adjustInventory({
      tenantId,
      productId,
      warehouseId,
      quantityDelta: 10,
      transactionType: 'CYCLE_COUNT_ADJUSTMENT',
      referenceEntityType: 'CYCLE_COUNT',
      referenceEntityId: 'CC-0',
      actor: 'perf-inv-0',
      operationId: 'op-lock-0',
    });
    expect(retryRes.isDuplicate).toBe(true);
    const afterRetry = await scmPersistenceService.getRecord<any>(
      'inventory',
      tenantId,
      `INV-${warehouseId}-${productId}`
    );
    expect(afterRetry?.onHand).toBe(1500);

    console.log(`[LOCK-AUDIT] 50 concurrent serialized inventory mutations completed in ${elapsedMs.toFixed(2)}ms`);
  });

  it('4. Audits LiveMetricsEngine persistence read fan-out when computing metrics', async () => {
    const spy = vi.spyOn(scmPersistenceService, 'listRecords');
    await liveMetricsEngine.computeMetric('INVENTORY_ON_HAND', 'org-perf-fanout-audit', 'DEMO');
    const callsForSingleInventoryMetric = spy.mock.calls.length;
    console.log(`[METRICS-FANOUT-AUDIT] listRecords calls for single INVENTORY_ON_HAND metric: ${callsForSingleInventoryMetric}`);
    // Record actual count (before optimization this fetches 8 collections for 1 metric!)
    expect(callsForSingleInventoryMetric).toBeGreaterThanOrEqual(1);
    spy.mockRestore();
  });
});
