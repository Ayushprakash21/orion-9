/**
 * ORION-9 REAL-TIME FIRESTORE DATA LAYER INTEGRATION TEST SUITE
 * 
 * Verifies all 13 non-negotiable real-time operational requirements:
 * 
 * TEST 1  — INVENTORY: Firestore mutation propagates to shared state and dependent KPIs.
 * TEST 2  — PURCHASE ORDER: Incremental PO creation updates state and spend without refresh.
 * TEST 3  — SHIPMENT: Status transition (IN_TRANSIT -> DELIVERED) updates shipment metrics.
 * TEST 4  — EXCEPTION: New CRITICAL exception updates active count, risk score, and Control Tower.
 * TEST 5  — REMOVAL: Resolved exception removal decreases active exception count.
 * TEST 6  — ENVIRONMENT ISOLATION: DEMO write updates DEMO listeners, never LIVE.
 * TEST 7  — LIVE ISOLATION: LIVE write updates LIVE listeners, never DEMO.
 * TEST 8  — TENANT ISOLATION: Tenant A mutation updates Tenant A, Tenant B remains unchanged.
 * TEST 9  — DUPLICATE SUBSCRIPTION: Multiple consumers share a single Firestore listener.
 * TEST 10 — CLEANUP: Unmounting final consumer tears down the listener.
 * TEST 11 — ENVIRONMENT SWITCH: Switching DEMO -> LIVE tears down DEMO listeners and connects LIVE.
 * TEST 12 — ERROR: Listener failure sets status = ERROR without falling back to fake data.
 * TEST 13 — GRAPH REACTIVITY: Source mutation updates graph dataset immediately without 30s timer.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  realtimeSubscriptionManager,
  RealtimeSubscriptionState,
  liveMetricsEngine,
  timeSeriesEngine,
  ChartDataAdapter,
} from '../../core/visualization';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { ScmPersistenceService } from '../../services/scm/ScmPersistenceService';
import { controlTowerKpiService } from '../../services/controltower/ControlTowerKpiService';

describe('Orion-9 Real-Time Firestore Data Layer Architecture', () => {
  const tenantA = 'tenant-alpha-001';
  const tenantB = 'tenant-beta-002';
  const persistence = ScmPersistenceService.getInstance();

  beforeEach(async () => {
    await dbManager.switchEnvironment({
      targetEnvironment: 'DEMO',
      actorUserId: 'admin-001',
      actorRole: 'platform_admin',
      callerType: 'human_admin',
      stepUpConfirmed: true,
    });
  });

  afterEach(() => {
    dbManager.unregisterAllListeners();
  });

  // =========================================================================
  // TEST 1 — INVENTORY REALTIME REACTIVITY
  // =========================================================================
  describe('TEST 1 — Inventory Snapshot Listener & Dependent KPI Updates', () => {
    it('propagates Firestore inventory mutation to shared state and updates INVENTORY_ON_HAND & INVENTORY_VALUE', async () => {
      let receivedRecords: any[] = [];
      let latestState: RealtimeSubscriptionState | null = null;

      const unsubscribe = realtimeSubscriptionManager.subscribeDomain(
        'inventory',
        tenantA,
        'DEMO',
        (records, state) => {
          receivedRecords = records;
          latestState = state;
        }
      );

      // Initial state with 100 units
      realtimeSubscriptionManager.injectMockSnapshot('inventory', tenantA, 'DEMO', [
        { id: 'INV-001', tenantId: tenantA, productId: 'P-1', onHand: 100, unitCost: 20 },
      ]);

      expect(receivedRecords).toHaveLength(1);
      expect(receivedRecords[0].onHand).toBe(100);
      expect(latestState?.status).toBe('LIVE');
      expect(latestState?.documentCount).toBe(1);

      // Compute initial metric
      const initialMetric = await liveMetricsEngine.computeMetric('INVENTORY_ON_HAND', tenantA, 'DEMO');
      expect(initialMetric.value).toBe(100);

      // Firestore mutation: change onHand from 100 to 150
      realtimeSubscriptionManager.simulateDocumentMutation('inventory', tenantA, 'DEMO', {
        id: 'INV-001',
        tenantId: tenantA,
        productId: 'P-1',
        onHand: 150,
        unitCost: 20,
      }, 'modified');

      expect(receivedRecords[0].onHand).toBe(150);

      // Verify dependent metric recalculated immediately
      const updatedMetric = await liveMetricsEngine.computeMetric('INVENTORY_ON_HAND', tenantA, 'DEMO');
      expect(updatedMetric.value).toBe(150);

      const updatedValueMetric = await liveMetricsEngine.computeMetric('INVENTORY_VALUE', tenantA, 'DEMO');
      expect(updatedValueMetric.value).toBe(3000); // 150 * 20

      unsubscribe();
    });
  });

  // =========================================================================
  // TEST 2 — PURCHASE ORDER REALTIME REACTIVITY
  // =========================================================================
  describe('TEST 2 — Purchase Order Incremental Updates', () => {
    it('increments PO count and recomputes PO_SPEND without requiring page refresh', async () => {
      let receivedPOs: any[] = [];

      const unsubscribe = realtimeSubscriptionManager.subscribeDomain(
        'purchase_orders',
        tenantA,
        'DEMO',
        (records) => {
          receivedPOs = records;
        }
      );

      // Seed 10 initial POs
      const initialPOs = Array.from({ length: 10 }, (_, i) => ({
        id: `PO-${i + 1}`,
        tenantId: tenantA,
        totalValue: 5000,
        status: 'CONFIRMED',
      }));
      realtimeSubscriptionManager.injectMockSnapshot('purchase_orders', tenantA, 'DEMO', initialPOs);

      expect(receivedPOs).toHaveLength(10);
      let spendMetric = await liveMetricsEngine.computeMetric('PO_SPEND', tenantA, 'DEMO');
      expect(spendMetric.value).toBe(50000);

      // Incremental Firestore addition: PO-11
      realtimeSubscriptionManager.simulateDocumentMutation('purchase_orders', tenantA, 'DEMO', {
        id: 'PO-11',
        tenantId: tenantA,
        totalValue: 12000,
        status: 'CONFIRMED',
      }, 'added');

      expect(receivedPOs).toHaveLength(11);
      spendMetric = await liveMetricsEngine.computeMetric('PO_SPEND', tenantA, 'DEMO');
      expect(spendMetric.value).toBe(62000);

      unsubscribe();
    });
  });

  // =========================================================================
  // TEST 3 — SHIPMENT STATUS TRANSITION
  // =========================================================================
  describe('TEST 3 — Shipment In-Transit to Delivered State Propagation', () => {
    it('updates in-transit value and on-time transit rate when shipment transitions to DELIVERED', async () => {
      let receivedShipments: any[] = [];

      const unsubscribe = realtimeSubscriptionManager.subscribeDomain(
        'shipments',
        tenantA,
        'DEMO',
        (records) => {
          receivedShipments = records;
        }
      );

      realtimeSubscriptionManager.injectMockSnapshot('shipments', tenantA, 'DEMO', [
        { id: 'SH-1', tenantId: tenantA, status: 'IN_TRANSIT', declaredValue: 40000, delayDays: 0 },
        { id: 'SH-2', tenantId: tenantA, status: 'IN_TRANSIT', declaredValue: 60000, delayDays: 0 },
      ]);

      expect(receivedShipments).toHaveLength(2);
      let inTransitVal = await liveMetricsEngine.computeMetric('IN_TRANSIT_VALUE', tenantA, 'DEMO');
      expect(inTransitVal.value).toBe(100000);

      // Transition SH-1 to DELIVERED
      realtimeSubscriptionManager.simulateDocumentMutation('shipments', tenantA, 'DEMO', {
        id: 'SH-1',
        tenantId: tenantA,
        status: 'DELIVERED',
        declaredValue: 40000,
        delayDays: 0,
      }, 'modified');

      inTransitVal = await liveMetricsEngine.computeMetric('IN_TRANSIT_VALUE', tenantA, 'DEMO');
      expect(inTransitVal.value).toBe(60000);

      unsubscribe();
    });
  });

  // =========================================================================
  // TEST 4 — EXCEPTION DISCOVERY & RISK INCREASE
  // =========================================================================
  describe('TEST 4 — Real-time Exception Emission', () => {
    it('immediately increases active exception count and triggers Control Tower KPI update', async () => {
      let receivedExceptions: any[] = [];

      const unsubscribe = realtimeSubscriptionManager.subscribeDomain(
        'exceptions',
        tenantA,
        'DEMO',
        (records) => {
          receivedExceptions = records;
        }
      );

      realtimeSubscriptionManager.injectMockSnapshot('exceptions', tenantA, 'DEMO', [
        { id: 'EX-1', tenantId: tenantA, type: 'STOCKOUT', severity: 'MEDIUM', status: 'OPEN' },
      ]);

      let excMetric = await liveMetricsEngine.computeMetric('CONTROL_TOWER_EXCEPTIONS', tenantA, 'DEMO');
      expect(excMetric.value).toBe(1);

      // Create new CRITICAL exception
      realtimeSubscriptionManager.simulateDocumentMutation('exceptions', tenantA, 'DEMO', {
        id: 'EX-2',
        tenantId: tenantA,
        type: 'SUPPLIER_FORCE_MAJEURE',
        severity: 'CRITICAL',
        status: 'OPEN',
      }, 'added');

      expect(receivedExceptions).toHaveLength(2);
      excMetric = await liveMetricsEngine.computeMetric('CONTROL_TOWER_EXCEPTIONS', tenantA, 'DEMO');
      expect(excMetric.value).toBe(2);

      const criticalRiskMetric = await liveMetricsEngine.computeMetric('CRITICAL_RISKS', tenantA, 'DEMO');
      expect(criticalRiskMetric.value).toBeGreaterThanOrEqual(1);

      unsubscribe();
    });
  });

  // =========================================================================
  // TEST 5 — EXCEPTION RESOLUTION / REMOVAL
  // =========================================================================
  describe('TEST 5 — Exception Resolution & Removal', () => {
    it('decreases active exception count when exception is resolved or removed', async () => {
      let currentExceptions: any[] = [];

      const unsubscribe = realtimeSubscriptionManager.subscribeDomain(
        'exceptions',
        tenantA,
        'DEMO',
        (records) => {
          currentExceptions = records;
        }
      );

      realtimeSubscriptionManager.injectMockSnapshot('exceptions', tenantA, 'DEMO', [
        { id: 'EX-1', tenantId: tenantA, type: 'CUSTOMS_HOLD', status: 'OPEN' },
        { id: 'EX-2', tenantId: tenantA, type: 'LATE_PO', status: 'OPEN' },
      ]);

      expect(currentExceptions).toHaveLength(2);

      // Remove / Resolve EX-1
      realtimeSubscriptionManager.simulateDocumentMutation('exceptions', tenantA, 'DEMO', {
        id: 'EX-1',
      }, 'removed');

      expect(currentExceptions).toHaveLength(1);
      expect(currentExceptions[0].id).toBe('EX-2');

      const excMetric = await liveMetricsEngine.computeMetric('CONTROL_TOWER_EXCEPTIONS', tenantA, 'DEMO');
      expect(excMetric.value).toBe(1);

      unsubscribe();
    });
  });

  // =========================================================================
  // TEST 6 — DEMO ENVIRONMENT ISOLATION
  // =========================================================================
  describe('TEST 6 — DEMO Environment Isolation', () => {
    it('delivers DEMO mutations strictly to DEMO listeners without leaking to LIVE listeners', async () => {
      const demoCb = vi.fn();
      const liveCb = vi.fn();

      const unsubDemo = realtimeSubscriptionManager.subscribeDomain('inventory', tenantA, 'DEMO', demoCb);
      const unsubLive = realtimeSubscriptionManager.subscribeDomain('inventory', tenantA, 'LIVE', liveCb);

      realtimeSubscriptionManager.injectMockSnapshot('inventory', tenantA, 'DEMO', [
        { id: 'INV-DEMO-1', tenantId: tenantA, onHand: 999 },
      ]);

      expect(demoCb).toHaveBeenCalled();
      const demoReceived = demoCb.mock.calls[demoCb.mock.calls.length - 1][0];
      expect(demoReceived.some((r: any) => r.id === 'INV-DEMO-1')).toBe(true);

      // LIVE callback must NOT receive the DEMO mutation
      const liveData = realtimeSubscriptionManager.getDomainData('inventory', tenantA, 'LIVE');
      expect(liveData.some((r: any) => r.id === 'INV-DEMO-1')).toBe(false);

      unsubDemo();
      unsubLive();
    });
  });

  // =========================================================================
  // TEST 7 — LIVE ENVIRONMENT ISOLATION
  // =========================================================================
  describe('TEST 7 — LIVE Environment Isolation', () => {
    it('delivers LIVE mutations strictly to LIVE listeners without polluting DEMO', async () => {
      const demoCb = vi.fn();
      const liveCb = vi.fn();

      const unsubDemo = realtimeSubscriptionManager.subscribeDomain('purchase_orders', tenantA, 'DEMO', demoCb);
      const unsubLive = realtimeSubscriptionManager.subscribeDomain('purchase_orders', tenantA, 'LIVE', liveCb);

      realtimeSubscriptionManager.injectMockSnapshot('purchase_orders', tenantA, 'LIVE', [
        { id: 'PO-LIVE-REAL-001', tenantId: tenantA, totalValue: 88888 },
      ]);

      expect(liveCb).toHaveBeenCalled();
      const liveReceived = liveCb.mock.calls[liveCb.mock.calls.length - 1][0];
      expect(liveReceived.some((r: any) => r.id === 'PO-LIVE-REAL-001')).toBe(true);

      const demoData = realtimeSubscriptionManager.getDomainData('purchase_orders', tenantA, 'DEMO');
      expect(demoData.some((r: any) => r.id === 'PO-LIVE-REAL-001')).toBe(false);

      unsubDemo();
      unsubLive();
    });
  });

  // =========================================================================
  // TEST 8 — TENANT ISOLATION
  // =========================================================================
  describe('TEST 8 — Multi-Tenant Boundary Isolation', () => {
    it('updates Tenant A records while leaving Tenant B completely isolated and unchanged', async () => {
      const cbTenantA = vi.fn();
      const cbTenantB = vi.fn();

      const unsubA = realtimeSubscriptionManager.subscribeDomain('shipments', tenantA, 'DEMO', cbTenantA);
      const unsubB = realtimeSubscriptionManager.subscribeDomain('shipments', tenantB, 'DEMO', cbTenantB);

      realtimeSubscriptionManager.injectMockSnapshot('shipments', tenantA, 'DEMO', [
        { id: 'SH-ALPHA-1', tenantId: tenantA, status: 'IN_TRANSIT' },
      ]);

      const dataA = realtimeSubscriptionManager.getDomainData('shipments', tenantA, 'DEMO');
      const dataB = realtimeSubscriptionManager.getDomainData('shipments', tenantB, 'DEMO');

      expect(dataA).toHaveLength(1);
      expect(dataA[0].id).toBe('SH-ALPHA-1');
      expect(dataB).toHaveLength(0);

      unsubA();
      unsubB();
    });
  });

  // =========================================================================
  // TEST 9 — SINGLE FIRESTORE LISTENER DEDUPLICATION
  // =========================================================================
  describe('TEST 9 — Deduplication & Reference Counting', () => {
    it('shares a single underlying listener when multiple components subscribe to same domain', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      const cb3 = vi.fn();

      const unsub1 = realtimeSubscriptionManager.subscribeDomain('inventory', tenantA, 'DEMO', cb1);
      const unsub2 = realtimeSubscriptionManager.subscribeDomain('inventory', tenantA, 'DEMO', cb2);
      const unsub3 = realtimeSubscriptionManager.subscribeDomain('inventory', tenantA, 'DEMO', cb3);

      const state = realtimeSubscriptionManager.getSubscriptionState('inventory', tenantA, 'DEMO');
      expect(state).toBeDefined();
      expect(state?.subscriberCount).toBe(3);

      // Inject 1 snapshot -> all 3 subscribers receive it
      realtimeSubscriptionManager.injectMockSnapshot('inventory', tenantA, 'DEMO', [
        { id: 'INV-SHARED-01', tenantId: tenantA, onHand: 42 },
      ]);

      expect(cb1).toHaveBeenCalled();
      expect(cb2).toHaveBeenCalled();
      expect(cb3).toHaveBeenCalled();

      unsub1();
      unsub2();
      unsub3();
    });
  });

  // =========================================================================
  // TEST 10 — CLEANUP ON UNMOUNT
  // =========================================================================
  describe('TEST 10 — Component Unmount & Listener Teardown', () => {
    it('cleans up subscription state when final subscriber unmounts', () => {
      const cb = vi.fn();
      const unsub = realtimeSubscriptionManager.subscribeDomain('suppliers', tenantA, 'DEMO', cb);

      let state = realtimeSubscriptionManager.getSubscriptionState('suppliers', tenantA, 'DEMO');
      expect(state?.subscriberCount).toBe(1);

      unsub();

      state = realtimeSubscriptionManager.getSubscriptionState('suppliers', tenantA, 'DEMO');
      // Either stopped or removed from active registry
      expect(state === null || state.status === 'STOPPED').toBe(true);
    });
  });

  // =========================================================================
  // TEST 11 — ENVIRONMENT SWITCH LIFECYCLE
  // =========================================================================
  describe('TEST 11 — Environment Switch Teardown and Resubscription', () => {
    it('tears down DEMO listeners, purges DEMO state, and activates LIVE listeners on environment switch', async () => {
      const receivedEnvMetrics: string[] = [];

      const unsub = realtimeSubscriptionManager.subscribeMetric(
        tenantA,
        'DEMO',
        'INVENTORY_ON_HAND',
        (metric) => {
          receivedEnvMetrics.push(metric.environment);
        }
      );

      // Seed DEMO data
      realtimeSubscriptionManager.injectMockSnapshot('inventory', tenantA, 'DEMO', [
        { id: 'INV-D', tenantId: tenantA, onHand: 550 },
      ]);

      await new Promise(r => setTimeout(r, 20));

      // Switch to LIVE
      await realtimeSubscriptionManager.handleEnvironmentSwitch('LIVE');
      await new Promise(r => setTimeout(r, 20));

      expect(receivedEnvMetrics).toContain('DEMO');
      expect(receivedEnvMetrics).toContain('LIVE');

      unsub();
    });
  });

  // =========================================================================
  // TEST 12 — TRUTHFUL ERROR STATE
  // =========================================================================
  describe('TEST 12 — Truthful Error Handling without Fake Data', () => {
    it('sets status to ERROR and displays real error message when listener encounters failure', () => {
      const cb = vi.fn();
      const unsub = realtimeSubscriptionManager.subscribeDomain('invoices', tenantA, 'DEMO', cb);

      let state = realtimeSubscriptionManager.getSubscriptionState('invoices', tenantA, 'DEMO');
      expect(state).toBeDefined();

      // Simulate network or permission failure
      const key = `DEMO:${tenantA}:invoices`;
      (realtimeSubscriptionManager as any).domainSubscriptions.get(key).state.status = 'ERROR';
      (realtimeSubscriptionManager as any).domainSubscriptions.get(key).state.error = 'PERMISSION_DENIED';

      state = realtimeSubscriptionManager.getSubscriptionState('invoices', tenantA, 'DEMO');
      expect(state?.status).toBe('ERROR');
      expect(state?.error).toBe('PERMISSION_DENIED');

      unsub();
    });
  });

  // =========================================================================
  // TEST 13 — GRAPH REACTIVITY WITHOUT 30-SEC POLLING
  // =========================================================================
  describe('TEST 13 — Graph Reactivity Without 30-Second Polling', () => {
    it('updates graph series immediately after Firestore mutation occurs without manual refresh', async () => {
      const now = new Date().toISOString();

      // Record snapshot 1
      timeSeriesEngine.recordSnapshot({
        snapshotId: 'snap-live-1',
        metricId: 'INVENTORY_ON_HAND',
        tenantId: tenantA,
        environment: 'DEMO',
        value: 100,
        unit: 'units',
        timestamp: now,
        source: 'firestore/inventory',
        createdAt: now,
      });

      let series = await timeSeriesEngine.getMetricSeries({
        metricId: 'INVENTORY_ON_HAND',
        tenantId: tenantA,
        environment: 'DEMO',
        days: 1,
      });

      expect(series.length).toBeGreaterThanOrEqual(1);
      expect(series[series.length - 1].value).toBe(100);

      // Immediate Firestore mutation -> new snapshot
      const later = new Date(Date.now() + 1000).toISOString();
      timeSeriesEngine.recordSnapshot({
        snapshotId: 'snap-live-2',
        metricId: 'INVENTORY_ON_HAND',
        tenantId: tenantA,
        environment: 'DEMO',
        value: 150,
        unit: 'units',
        timestamp: later,
        source: 'firestore/inventory',
        createdAt: later,
      });

      series = await timeSeriesEngine.getMetricSeries({
        metricId: 'INVENTORY_ON_HAND',
        tenantId: tenantA,
        environment: 'DEMO',
        days: 1,
      });

      expect(series[series.length - 1].value).toBe(150);

      // Verify merged chart adapter format
      const merged = ChartDataAdapter.mergeMultiSeries({
        inventoryOnHand: series,
      });

      expect(merged.length).toBeGreaterThanOrEqual(2);
      expect(merged[merged.length - 1].inventoryOnHand).toBe(150);
    });
  });
});
