/**
 * ORION-9 REAL-TIME FIRESTORE DATA FABRIC COMPREHENSIVE TEST SUITE
 * 
 * Verifies all 9 mandatory specification sections:
 * SECTION A — Inventory Realtime Listener (initial snapshot, add, update, remove, unsubscribe)
 * SECTION B — Purchase Order Realtime Listener (initial snapshot, update, status change, unsubscribe)
 * SECTION C — Shipment Realtime Listener (initial snapshot, update, status change, unsubscribe)
 * SECTION D — Exception Realtime Listener (initial snapshot, severity/status update, resolution, unsubscribe)
 * SECTION E — Control Tower Realtime Aggregation (domain updates, KPI recomputes, graph state propagation)
 * SECTION F — Graph Integration (Firestore update -> metric state -> chart data stream)
 * SECTION G — Security & Tenancy (tenant isolation, unauthorized block, zero cross-tenant leakage)
 * SECTION H — Subscription Lifecycle (deduplication, zero leaks, logout cleanup, context change)
 * SECTION I — DEMO vs LIVE Isolation (DEMO remains DEMO, LIVE never consumes synthetic state)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  realtimeSubscriptionManager,
  realtimeStateStore,
  RealtimeSubscriptionState,
  liveMetricsEngine,
  timeSeriesEngine,
  ChartDataAdapter,
  ControlTowerRealtimeState,
} from '../../core/visualization';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { Inventory, PurchaseOrder, Shipment, Exception } from '../../types';
import { AuthorizationEngine, ActorType } from '../../kernel/authorization/AuthorizationEngine';

describe('ORION-9 — Real-Time Firestore Data Fabric Verification Suite', () => {
  const tenantA = 'org-tenant-alpha';
  const tenantB = 'org-tenant-beta';

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
    realtimeSubscriptionManager.cleanupUserSubscriptions();
  });

  // =========================================================================
  // SECTION A: INVENTORY REALTIME LISTENER
  // =========================================================================
  describe('SECTION A — Inventory Realtime Listener', () => {
    it('handles initial snapshot, add, update, remove, and unsubscribe', () => {
      let receivedItems: Inventory[] = [];
      let latestState: RealtimeSubscriptionState | null = null;

      // 1. Subscribe
      const unsubscribe = realtimeSubscriptionManager.subscribeInventory(
        tenantA,
        'DEMO',
        (items, state) => {
          receivedItems = items;
          latestState = state;
        }
      );

      // Initial snapshot
      const item1: Inventory = {
        id: 'INV-101',
        productId: 'PROD-A',
        warehouseId: 'WH-1',
        onHand: 200,
        reserved: 20,
        unitCost: 15,
        safetyStock: 50,
        reorderPoint: 75,
        averageDailyDemand: 10,
        leadTime: 5,
      };
      realtimeSubscriptionManager.injectMockSnapshot('inventory', tenantA, 'DEMO', [item1]);

      expect(receivedItems).toHaveLength(1);
      expect(receivedItems[0].onHand).toBe(200);
      expect(latestState?.status).toBe('LIVE');
      expect(latestState?.documentCount).toBe(1);

      // Add document
      const item2: Inventory = {
        id: 'INV-102',
        productId: 'PROD-B',
        warehouseId: 'WH-1',
        onHand: 100,
        reserved: 10,
        unitCost: 30,
        safetyStock: 30,
        reorderPoint: 50,
        averageDailyDemand: 5,
        leadTime: 7,
      };
      realtimeSubscriptionManager.simulateDocumentMutation('inventory', tenantA, 'DEMO', item2, 'added');
      expect(receivedItems).toHaveLength(2);

      // Update document
      const item1Updated: Inventory = { ...item1, onHand: 250 };
      realtimeSubscriptionManager.simulateDocumentMutation('inventory', tenantA, 'DEMO', item1Updated, 'modified');
      const found = receivedItems.find(i => i.id === 'INV-101');
      expect(found?.onHand).toBe(250);

      // Remove document
      realtimeSubscriptionManager.simulateDocumentMutation('inventory', tenantA, 'DEMO', item2, 'removed');
      expect(receivedItems).toHaveLength(1);
      expect(receivedItems.find(i => i.id === 'INV-102')).toBeUndefined();

      // Unsubscribe cleanly
      unsubscribe();
      const stateAfterUnsub = realtimeSubscriptionManager.getSubscriptionState('inventory', tenantA, 'DEMO');
      expect(stateAfterUnsub).toBeNull();
    });
  });

  // =========================================================================
  // SECTION B: PURCHASE ORDER REALTIME LISTENER
  // =========================================================================
  describe('SECTION B — Purchase Order Realtime Listener', () => {
    it('handles initial snapshot, PO update, status changes, and unsubscribe', async () => {
      let receivedPOs: PurchaseOrder[] = [];

      const unsubscribe = realtimeSubscriptionManager.subscribePurchaseOrders(
        tenantA,
        'DEMO',
        (pos) => {
          receivedPOs = pos;
        }
      );

      const po1: PurchaseOrder = {
        id: 'PO-501',
        poNumber: 'PO-2026-001',
        supplierId: 'SUP-01',
        supplierName: 'Apex Industrial',
        status: 'DRAFT',
        orderDate: '2026-09-28',
        expectedDate: '2026-10-05',
        totalAmount: 12000,
        totalValue: 12000,
        items: [],
      } as any;

      realtimeSubscriptionManager.injectMockSnapshot('purchase_orders', tenantA, 'DEMO', [po1]);
      expect(receivedPOs).toHaveLength(1);
      expect(receivedPOs[0].status).toBe('DRAFT');

      // Status change: DRAFT -> CONFIRMED
      const po1Confirmed = { ...po1, status: 'CONFIRMED', totalValue: 14000 };
      realtimeSubscriptionManager.simulateDocumentMutation('purchase_orders', tenantA, 'DEMO', po1Confirmed, 'modified');
      expect(receivedPOs[0].status).toBe('CONFIRMED');

      // Recompute dependent metric
      const spendMetric = await liveMetricsEngine.computeMetric('PO_SPEND', tenantA, 'DEMO');
      expect(spendMetric.value).toBe(14000);

      unsubscribe();
    });
  });

  // =========================================================================
  // SECTION C: SHIPMENT REALTIME LISTENER
  // =========================================================================
  describe('SECTION C — Shipment Realtime Listener', () => {
    it('handles initial snapshot, tracking update, status transitions, and unsubscribe', async () => {
      let receivedShipments: Shipment[] = [];

      const unsubscribe = realtimeSubscriptionManager.subscribeShipments(
        tenantA,
        'DEMO',
        (ships) => {
          receivedShipments = ships;
        }
      );

      const ship1: Shipment = {
        id: 'SHP-901',
        shipmentNumber: 'SHP-2026-001',
        status: 'PLANNED',
        origin: 'Berlin Hub',
        destination: 'Frankfurt DC',
        carrierId: 'CAR-01',
        estimatedDelivery: '2026-10-02',
      } as any;

      realtimeSubscriptionManager.injectMockSnapshot('shipments', tenantA, 'DEMO', [ship1]);
      expect(receivedShipments).toHaveLength(1);
      expect(receivedShipments[0].status).toBe('PLANNED');

      // Transition to IN_TRANSIT
      const ship1InTransit = { ...ship1, status: 'IN_TRANSIT', eta: '2026-10-01' };
      realtimeSubscriptionManager.simulateDocumentMutation('shipments', tenantA, 'DEMO', ship1InTransit, 'modified');
      expect(receivedShipments[0].status).toBe('IN_TRANSIT');

      // Transition to DELIVERED
      const ship1Delivered = { ...ship1, status: 'DELIVERED' };
      realtimeSubscriptionManager.simulateDocumentMutation('shipments', tenantA, 'DEMO', ship1Delivered, 'modified');
      expect(receivedShipments[0].status).toBe('DELIVERED');

      unsubscribe();
    });
  });

  // =========================================================================
  // SECTION D: EXCEPTION REALTIME LISTENER
  // =========================================================================
  describe('SECTION D — Exception Realtime Listener', () => {
    it('handles exception creation, severity escalation, resolution, and unsubscribe', async () => {
      let receivedExceptions: Exception[] = [];

      const unsubscribe = realtimeSubscriptionManager.subscribeExceptions(
        tenantA,
        'DEMO',
        (exceptions) => {
          receivedExceptions = exceptions;
        }
      );

      const exc1: Exception = {
        id: 'EXC-101',
        type: 'Supplier Delay',
        severity: 'Medium',
        status: 'Open',
        date: '2026-09-28',
        estimatedImpact: 15000,
        description: 'Component shipment delayed at border clearance',
      } as any;

      realtimeSubscriptionManager.injectMockSnapshot('exceptions', tenantA, 'DEMO', [exc1]);
      expect(receivedExceptions).toHaveLength(1);
      expect(receivedExceptions[0].severity).toBe('Medium');

      // Escalate severity: Medium -> Critical
      const exc1Escalated = { ...exc1, severity: 'Critical' };
      realtimeSubscriptionManager.simulateDocumentMutation('exceptions', tenantA, 'DEMO', exc1Escalated, 'modified');
      expect(receivedExceptions[0].severity).toBe('Critical');

      // Resolve exception
      const exc1Resolved = { ...exc1Escalated, status: 'Resolved' };
      realtimeSubscriptionManager.simulateDocumentMutation('exceptions', tenantA, 'DEMO', exc1Resolved, 'modified');
      expect(receivedExceptions[0].status).toBe('Resolved');

      unsubscribe();
    });
  });

  // =========================================================================
  // SECTION E: CONTROL TOWER REALTIME AGGREGATION
  // =========================================================================
  describe('SECTION E — Control Tower Realtime Aggregation', () => {
    it('consumes domain updates without duplicate querying and computes aggregated KPIs', () => {
      let latestCtState: ControlTowerRealtimeState | null = null;

      const unsubscribeCt = realtimeSubscriptionManager.subscribeControlTower(
        tenantA,
        'DEMO',
        (ctState) => {
          latestCtState = ctState;
        }
      );

      // Inject inventory and exception
      realtimeSubscriptionManager.injectMockSnapshot('inventory', tenantA, 'DEMO', [
        { id: 'INV-A1', productId: 'P1', onHand: 500, unitCost: 10 },
      ]);
      realtimeSubscriptionManager.injectMockSnapshot('exceptions', tenantA, 'DEMO', [
        { id: 'EXC-E1', severity: 'Critical', status: 'Open' },
      ]);

      expect(latestCtState).not.toBeNull();
      expect(latestCtState?.summary.totalInventoryOnHand).toBe(500);
      expect(latestCtState?.summary.activeExceptionsCount).toBe(1);
      expect(latestCtState?.summary.criticalRisksCount).toBe(1);
      expect(latestCtState?.connectionStatus).toBe('CONNECTED');

      // Verify that Control Tower KPIs update reactively
      const onHandKpi = latestCtState?.kpis.find(k => k.code === 'INVENTORY_ON_HAND');
      expect(onHandKpi?.currentValue).toBe(500);

      unsubscribeCt();
    });
  });

  // =========================================================================
  // SECTION F: GRAPH INTEGRATION
  // =========================================================================
  describe('SECTION F — Graph Integration with Realtime Telemetry', () => {
    it('propagates Firestore inventory mutation to LiveMetricsEngine and ChartDataAdapter multi-series', async () => {
      // 1. Initial inventory in Firestore
      realtimeSubscriptionManager.injectMockSnapshot('inventory', tenantA, 'DEMO', [
        { id: 'INV-G1', onHand: 1200, unitCost: 50 },
      ]);

      // 2. Metric calculation reflects live snapshot
      const metricOnHand = await liveMetricsEngine.computeMetric('INVENTORY_ON_HAND', tenantA, 'DEMO');
      expect(metricOnHand.value).toBe(1200);

      const metricVal = await liveMetricsEngine.computeMetric('INVENTORY_VALUE', tenantA, 'DEMO');
      expect(metricVal.value).toBe(60000); // 1200 * 50

      // 3. TimeSeriesEngine produces aligned chart series
      const seriesOnHand = await timeSeriesEngine.getMetricSeries({
        metricId: 'INVENTORY_ON_HAND',
        tenantId: tenantA,
        environment: 'DEMO',
        days: 7,
      });
      const seriesVal = await timeSeriesEngine.getMetricSeries({
        metricId: 'INVENTORY_VALUE',
        tenantId: tenantA,
        environment: 'DEMO',
        days: 7,
      });

      const merged = ChartDataAdapter.mergeMultiSeries({
        INVENTORY_ON_HAND: seriesOnHand,
        INVENTORY_VALUE: seriesVal,
      });

      expect(merged.length).toBeGreaterThan(0);
      const latestPoint = merged[merged.length - 1];
      expect(latestPoint.INVENTORY_ON_HAND).toBe(1200);

      // 4. Mutate inventory (receipt of 300 additional units)
      realtimeSubscriptionManager.simulateDocumentMutation('inventory', tenantA, 'DEMO', {
        id: 'INV-G1',
        onHand: 1500,
        unitCost: 50,
      }, 'modified');

      // 5. Verify immediate updated metric computation without page refresh
      const updatedMetric = await liveMetricsEngine.computeMetric('INVENTORY_ON_HAND', tenantA, 'DEMO');
      expect(updatedMetric.value).toBe(1500);

      const updatedValMetric = await liveMetricsEngine.computeMetric('INVENTORY_VALUE', tenantA, 'DEMO');
      expect(updatedValMetric.value).toBe(75000);
    });
  });

  // =========================================================================
  // SECTION G: SECURITY & TENANCY
  // =========================================================================
  describe('SECTION G — Security & Tenant Isolation', () => {
    const authEngine = new AuthorizationEngine();

    it('fences Tenant A data from Tenant B mutations', () => {
      let tenantARecords: Inventory[] = [];
      let tenantBRecords: Inventory[] = [];

      const unsubA = realtimeSubscriptionManager.subscribeInventory(tenantA, 'DEMO', (items) => {
        tenantARecords = items;
      });
      const unsubB = realtimeSubscriptionManager.subscribeInventory(tenantB, 'DEMO', (items) => {
        tenantBRecords = items;
      });

      // Inject 100 units for Tenant A
      realtimeSubscriptionManager.injectMockSnapshot('inventory', tenantA, 'DEMO', [
        { id: 'INV-A', tenantId: tenantA, onHand: 100 },
      ]);

      // Inject 50 units for Tenant B
      realtimeSubscriptionManager.injectMockSnapshot('inventory', tenantB, 'DEMO', [
        { id: 'INV-B', tenantId: tenantB, onHand: 50 },
      ]);

      expect(tenantARecords).toHaveLength(1);
      expect(tenantARecords[0].onHand).toBe(100);

      expect(tenantBRecords).toHaveLength(1);
      expect(tenantBRecords[0].onHand).toBe(50);

      // Mutate Tenant A only
      realtimeSubscriptionManager.simulateDocumentMutation('inventory', tenantA, 'DEMO', {
        id: 'INV-A',
        tenantId: tenantA,
        onHand: 999,
      }, 'modified');

      expect(tenantARecords[0].onHand).toBe(999);
      // Tenant B MUST remain completely unaffected
      expect(tenantBRecords[0].onHand).toBe(50);

      unsubA();
      unsubB();
    });

    it('rejects cross-tenant data requests via AuthorizationEngine boundary', () => {
      const actorTenantA = {
        id: 'usr-alice',
        type: ActorType.USER,
        name: 'Alice',
        roles: ['inventory_manager'],
        organizationId: tenantA,
      };

      expect(() => {
        authEngine.authorize({
          actor: actorTenantA,
          resourceType: 'inventory',
          requiredPermission: 'inventory:read',
          organizationId: tenantB, // Targeted Tenant B
        });
      }).toThrow(/does not match command organization/);
    });
  });

  // =========================================================================
  // SECTION H: SUBSCRIPTION LIFECYCLE & CLEANUP
  // =========================================================================
  describe('SECTION H — Subscription Lifecycle & Memory Management', () => {
    it('deduplicates multiple subscribers to single reference-counted listener and cleans up on unmount', () => {
      let callCountA = 0;
      let callCountB = 0;

      // Component 1 mounts
      const unsub1 = realtimeSubscriptionManager.subscribeInventory(tenantA, 'DEMO', () => {
        callCountA++;
      });
      let state = realtimeSubscriptionManager.getSubscriptionState('inventory', tenantA, 'DEMO');
      expect(state?.subscriberCount).toBe(1);

      // Component 2 mounts and subscribes to same domain
      const unsub2 = realtimeSubscriptionManager.subscribeInventory(tenantA, 'DEMO', () => {
        callCountB++;
      });
      state = realtimeSubscriptionManager.getSubscriptionState('inventory', tenantA, 'DEMO');
      expect(state?.subscriberCount).toBe(2);

      // Component 1 unmounts
      unsub1();
      state = realtimeSubscriptionManager.getSubscriptionState('inventory', tenantA, 'DEMO');
      expect(state?.subscriberCount).toBe(1);

      // Component 2 unmounts
      unsub2();
      state = realtimeSubscriptionManager.getSubscriptionState('inventory', tenantA, 'DEMO');
      expect(state).toBeNull(); // Cleanly removed from active subscriptions
    });

    it('cleans up all subscriptions on user logout', () => {
      realtimeSubscriptionManager.subscribeInventory(tenantA, 'DEMO', () => {});
      realtimeSubscriptionManager.subscribePurchaseOrders(tenantA, 'DEMO', () => {});

      expect(realtimeSubscriptionManager.getSubscriptionState('inventory', tenantA, 'DEMO')).not.toBeNull();
      expect(realtimeSubscriptionManager.getSubscriptionState('purchase_orders', tenantA, 'DEMO')).not.toBeNull();

      // Trigger user logout teardown
      realtimeSubscriptionManager.cleanupUserSubscriptions();

      expect(realtimeSubscriptionManager.getSubscriptionState('inventory', tenantA, 'DEMO')).toBeNull();
      expect(realtimeSubscriptionManager.getSubscriptionState('purchase_orders', tenantA, 'DEMO')).toBeNull();
    });
  });

  // =========================================================================
  // SECTION I: DEMO VS LIVE ISOLATION
  // =========================================================================
  describe('SECTION I — Strict DEMO vs LIVE Isolation', () => {
    it('never leaks DEMO synthetic mutations into LIVE listeners or metrics', async () => {
      let demoInventory: Inventory[] = [];
      let liveInventory: Inventory[] = [];

      const unsubDemo = realtimeSubscriptionManager.subscribeInventory(tenantA, 'DEMO', (items) => {
        demoInventory = items;
      });
      const unsubLive = realtimeSubscriptionManager.subscribeInventory(tenantA, 'LIVE', (items) => {
        liveInventory = items;
      });

      // Inject into DEMO
      realtimeSubscriptionManager.injectMockSnapshot('inventory', tenantA, 'DEMO', [
        { id: 'DEMO-SKU-1', onHand: 42 },
      ]);

      expect(demoInventory).toHaveLength(1);
      expect(demoInventory[0].onHand).toBe(42);

      // LIVE listener MUST remain empty
      expect(liveInventory).toHaveLength(0);

      // Compute LIVE metric: MUST evaluate to NO_DATA or 0, never fallback to demo data
      const liveMetric = await liveMetricsEngine.computeMetric('INVENTORY_ON_HAND', tenantA, 'LIVE');
      expect(liveMetric.status).toBe('NO_DATA');
      expect(liveMetric.value).toBe(0);

      unsubDemo();
      unsubLive();
    });
  });
});
