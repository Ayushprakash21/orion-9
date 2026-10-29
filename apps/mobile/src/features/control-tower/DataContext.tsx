/**
 * ORION-9 SCM DATA CONTEXT
 * Provides real-time and cached supply-chain operational telemetry to the mobile app.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  DashboardMetrics,
  ExceptionRecord,
  ShipmentRecord,
  InventoryRecord,
  PurchaseOrderRecord,
  SupplierRecord,
  OperationalEvent,
} from '../../types';
import { storage } from '../../storage';
import { api } from '../../services/api';
import { auth } from '../../services/auth';

const CACHE_KEYS = {
  METRICS: 'orion_cache_metrics',
  EXCEPTIONS: 'orion_cache_exceptions',
  SHIPMENTS: 'orion_cache_shipments',
  INVENTORY: 'orion_cache_inventory',
  POS: 'orion_cache_pos',
  SUPPLIERS: 'orion_cache_suppliers',
  EVENTS: 'orion_cache_events',
};

export const DEFAULT_EXCEPTIONS: ExceptionRecord[] = [
  {
    id: 'EXC-2026-001',
    date: '2026-10-28T14:30:00Z',
    type: 'Stock-Out Risk',
    severity: 'Critical',
    entityId: 'SKU-1000',
    description: 'Quantum Neural Processing Unit inventory below critical 2-day safety threshold at Chicago DC-01.',
    estimatedImpact: 145000,
    status: 'Open',
    owner: 'Elena Rostova',
    recommendedAction: 'Expedite inbound shipment SHP-2026-0001 and trigger emergency buffer allocation from Dallas DC-03.',
  },
  {
    id: 'EXC-2026-002',
    date: '2026-10-28T11:15:00Z',
    type: 'Shipment Delay',
    severity: 'Critical',
    entityId: 'SHP-2026-0001',
    description: 'Pacific maritime lane transshipment congestion in Long Beach. Expected delay: +4 days.',
    estimatedImpact: 88000,
    status: 'Investigating',
    owner: 'Marcus Vance',
    recommendedAction: 'Reroute remaining containers via intermodal rail priority corridor PAC-04.',
  },
  {
    id: 'EXC-2026-003',
    date: '2026-10-28T09:45:00Z',
    type: 'PO Overdue',
    severity: 'High',
    entityId: 'PO-2026-0042',
    description: 'Supplier Titan Microelectronics failed to acknowledge delivery schedule for 1,200 optical sensors.',
    estimatedImpact: 62000,
    status: 'Action Required',
    owner: 'Sarah Chen',
    recommendedAction: 'Issue formal SLA non-compliance warning and activate secondary qualified supplier Apex Dynamics.',
  },
  {
    id: 'EXC-2026-004',
    date: '2026-10-27T16:20:00Z',
    type: 'Supplier Quality',
    severity: 'High',
    entityId: 'SUP-002',
    description: 'Apex Dynamics lot batch #4409 defect rate spiked to 4.2% (threshold: 1.5%).',
    estimatedImpact: 34000,
    status: 'Investigating',
    owner: 'Elena Rostova',
    recommendedAction: 'Initiate quarantine inspection protocol on lot #4409 and pause open PO-2026-0048.',
  },
  {
    id: 'EXC-2026-005',
    date: '2026-10-27T12:00:00Z',
    type: 'Forecast Variance',
    severity: 'Medium',
    entityId: 'SKU-1004',
    description: 'Automotive sensor demand exceeds rolling baseline by 28% in EMEA East region.',
    estimatedImpact: 21000,
    status: 'Open',
    owner: 'David K.',
    recommendedAction: 'Adjust dynamic safety buffer factor from 1.2 to 1.45 for next 30 days.',
  },
];

export const DEFAULT_SHIPMENTS: ShipmentRecord[] = [
  {
    id: 'SHP-2026-0001',
    poId: 'PO-2026-0038',
    supplierId: 'SUP-001',
    carrier: 'Maersk Line',
    origin: 'Port of Yokohama, JP',
    destination: 'Long Beach Terminal, US',
    shipDate: '2026-10-18T00:00:00Z',
    expectedArrival: '2026-11-01T00:00:00Z',
    actualArrival: null,
    status: 'Delayed',
    delayDays: 4,
    freightCost: 32500,
    trackingNumber: 'MSK-99201481',
  },
  {
    id: 'SHP-2026-0002',
    poId: 'PO-2026-0040',
    supplierId: 'SUP-003',
    carrier: 'DHL Global Forwarding',
    origin: 'Frankfurt Air Hub, DE',
    destination: 'Chicago O\'Hare Hub, US',
    shipDate: '2026-10-26T00:00:00Z',
    expectedArrival: '2026-10-29T00:00:00Z',
    actualArrival: null,
    status: 'In Transit',
    delayDays: 0,
    freightCost: 14200,
    trackingNumber: 'DHL-88102941',
  },
  {
    id: 'SHP-2026-0003',
    poId: 'PO-2026-0041',
    supplierId: 'SUP-002',
    carrier: 'Kuehne + Nagel',
    origin: 'Rotterdam Gateway, NL',
    destination: 'New York Newark, US',
    shipDate: '2026-10-22T00:00:00Z',
    expectedArrival: '2026-10-31T00:00:00Z',
    actualArrival: null,
    status: 'In Transit',
    delayDays: 1,
    freightCost: 18900,
    trackingNumber: 'KN-5519201',
  },
  {
    id: 'SHP-2026-0004',
    poId: 'PO-2026-0035',
    supplierId: 'SUP-004',
    carrier: 'FedEx Freight',
    origin: 'Shenzhen Tech Hub, CN',
    destination: 'Dallas Logistics Hub, US',
    shipDate: '2026-10-15T00:00:00Z',
    expectedArrival: '2026-10-27T00:00:00Z',
    actualArrival: '2026-10-28T04:12:00Z',
    status: 'Delivered',
    delayDays: 0,
    freightCost: 26000,
    trackingNumber: 'FDX-10294819',
  },
];

export const DEFAULT_INVENTORY: InventoryRecord[] = [
  {
    id: 'INV-1000',
    productId: 'SKU-1000',
    warehouseId: 'WH-CHI-01',
    onHand: 140,
    reserved: 95,
    inTransit: 500,
    safetyStock: 120,
    reorderPoint: 200,
    dailyDemand: 22,
    averageDailyDemand: 20,
    unitCost: 450,
    leadTime: 14,
    lastUpdated: '2026-10-28T16:00:00Z',
  },
  {
    id: 'INV-1001',
    productId: 'SKU-1001',
    warehouseId: 'WH-CHI-01',
    onHand: 1250,
    reserved: 340,
    inTransit: 800,
    safetyStock: 300,
    reorderPoint: 600,
    dailyDemand: 45,
    averageDailyDemand: 42,
    unitCost: 180,
    leadTime: 10,
    lastUpdated: '2026-10-28T15:30:00Z',
  },
  {
    id: 'INV-1002',
    productId: 'SKU-1002',
    warehouseId: 'WH-DAL-02',
    onHand: 85,
    reserved: 70,
    inTransit: 250,
    safetyStock: 90,
    reorderPoint: 150,
    dailyDemand: 12,
    averageDailyDemand: 10,
    unitCost: 820,
    leadTime: 21,
    lastUpdated: '2026-10-28T14:15:00Z',
  },
  {
    id: 'INV-1003',
    productId: 'SKU-1003',
    warehouseId: 'WH-ATL-03',
    onHand: 2400,
    reserved: 410,
    inTransit: 0,
    safetyStock: 500,
    reorderPoint: 800,
    dailyDemand: 65,
    averageDailyDemand: 60,
    unitCost: 95,
    leadTime: 7,
    lastUpdated: '2026-10-28T13:45:00Z',
  },
];

export const DEFAULT_SUPPLIERS: SupplierRecord[] = [
  {
    id: 'SUP-001',
    name: 'Titan Microelectronics',
    category: 'Semiconductors',
    region: 'East Asia',
    country: 'Japan',
    contact: 'Kenji Sato (k.sato@titan-micro.jp)',
    otif: 78.4,
    qualityRate: 99.2,
    leadTime: 21,
    defectRate: 0.8,
    spend: 2450000,
    openPoValue: 340000,
    score: 82,
    riskLevel: 'High',
    status: 'Active',
  },
  {
    id: 'SUP-002',
    name: 'Apex Dynamics Automation',
    category: 'Sensors & Robotics',
    region: 'North America',
    country: 'United States',
    contact: 'Rachel Green (r.green@apexdynamics.com)',
    otif: 91.5,
    qualityRate: 95.8,
    leadTime: 12,
    defectRate: 4.2,
    spend: 1820000,
    openPoValue: 210000,
    score: 88,
    riskLevel: 'Medium',
    status: 'Active',
  },
  {
    id: 'SUP-003',
    name: 'Nordic Precision Assemblies',
    category: 'Precision Mechanical',
    region: 'Europe',
    country: 'Germany',
    contact: 'Hans Weber (h.weber@nordic-precision.de)',
    otif: 97.2,
    qualityRate: 99.8,
    leadTime: 8,
    defectRate: 0.2,
    spend: 3100000,
    openPoValue: 490000,
    score: 96,
    riskLevel: 'Low',
    status: 'Preferred',
  },
  {
    id: 'SUP-004',
    name: 'Pacific Core Tech',
    category: 'Power Systems',
    region: 'East Asia',
    country: 'Taiwan',
    contact: 'Mei-Ling Chen (ml.chen@pct-power.tw)',
    otif: 84.1,
    qualityRate: 98.4,
    leadTime: 16,
    defectRate: 1.6,
    spend: 1450000,
    openPoValue: 180000,
    score: 85,
    riskLevel: 'Medium',
    status: 'Active',
  },
];

export const DEFAULT_POS: PurchaseOrderRecord[] = [
  {
    id: 'PO-2026-0038',
    supplierId: 'SUP-001',
    orderDate: '2026-10-10T00:00:00Z',
    expectedDelivery: '2026-11-01T00:00:00Z',
    status: 'Delayed',
    totalValue: 225000,
    currency: 'USD',
    buyer: 'Sarah Chen',
    lines: [
      { productId: 'SKU-1000', quantity: 500, receivedQuantity: 0, unitPrice: 450 },
    ],
  },
  {
    id: 'PO-2026-0040',
    supplierId: 'SUP-003',
    orderDate: '2026-10-20T00:00:00Z',
    expectedDelivery: '2026-10-29T00:00:00Z',
    status: 'In Transit',
    totalValue: 144000,
    currency: 'USD',
    buyer: 'Marcus Vance',
    lines: [
      { productId: 'SKU-1001', quantity: 800, receivedQuantity: 0, unitPrice: 180 },
    ],
  },
  {
    id: 'PO-2026-0042',
    supplierId: 'SUP-001',
    orderDate: '2026-10-12T00:00:00Z',
    expectedDelivery: '2026-10-26T00:00:00Z',
    status: 'Overdue',
    totalValue: 98400,
    currency: 'USD',
    buyer: 'Sarah Chen',
    lines: [
      { productId: 'SKU-1002', quantity: 120, receivedQuantity: 0, unitPrice: 820 },
    ],
  },
];

export const DEFAULT_EVENTS: OperationalEvent[] = [
  {
    id: 'EVT-01',
    source: 'Event Fabric',
    entityType: 'INVENTORY_REBALANCE',
    entityId: 'SKU-1000',
    eventType: 'Buffer Calibration',
    timestamp: '12m ago',
    description: 'Autonomous rebalance policy calculated +45 unit buffer for Chicago DC.',
    badgeColor: '#10b981',
  },
  {
    id: 'EVT-02',
    source: 'EDI Gateway',
    entityType: 'SHIPMENT_STATUS',
    entityId: 'SHP-2026-0001',
    eventType: 'Lane Congestion Detected',
    timestamp: '34m ago',
    description: 'Carrier Maersk updated transshipment ETA +4 days at Port of Long Beach.',
    badgeColor: '#ef4444',
  },
  {
    id: 'EVT-03',
    source: 'ERP Synchronizer',
    entityType: 'PO_CONFIRMATION',
    entityId: 'PO-2026-0040',
    eventType: 'Ledger Reconciled',
    timestamp: '1h ago',
    description: 'PO-2026-0040 delivery milestone confirmed by DHL Global Forwarding.',
    badgeColor: '#06b6d4',
  },
  {
    id: 'EVT-04',
    source: 'Cognitive Engine',
    entityType: 'RISK_PROPOSAL',
    entityId: 'EXC-2026-001',
    eventType: 'Decision Proposed',
    timestamp: '2h ago',
    description: 'Decision Copilot proposed priority intermodal expedite for SKU-1000.',
    badgeColor: '#f59e0b',
  },
];

interface DataContextType {
  metrics: DashboardMetrics | null;
  exceptions: ExceptionRecord[];
  shipments: ShipmentRecord[];
  inventory: InventoryRecord[];
  purchaseOrders: PurchaseOrderRecord[];
  suppliers: SupplierRecord[];
  recentEvents: OperationalEvent[];
  isLoading: boolean;
  isRefreshing: boolean;
  isOffline: boolean;
  lastRefreshedAt: string | null;
  refreshData: () => Promise<void>;
  executeAction: (
    actionType: string,
    entityId: string,
    parameters?: Record<string, any>
  ) => Promise<{ success: boolean; message: string; auditId: string }>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [recentEvents, setRecentEvents] = useState<OperationalEvent[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);

  const fetchAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const env = await auth.getEnvironment();

      // 1. Check local cache first for instant responsive render without layout shift
      const cachedExceptions = await storage.getJson<ExceptionRecord[]>(CACHE_KEYS.EXCEPTIONS);
      const cachedShipments = await storage.getJson<ShipmentRecord[]>(CACHE_KEYS.SHIPMENTS);
      const cachedInventory = await storage.getJson<InventoryRecord[]>(CACHE_KEYS.INVENTORY);
      const cachedSuppliers = await storage.getJson<SupplierRecord[]>(CACHE_KEYS.SUPPLIERS);
      const cachedPOs = await storage.getJson<PurchaseOrderRecord[]>(CACHE_KEYS.POS);
      const cachedEvents = await storage.getJson<OperationalEvent[]>(CACHE_KEYS.EVENTS);
      const cachedMetrics = await storage.getJson<DashboardMetrics>(CACHE_KEYS.METRICS);

      if (cachedExceptions && cachedShipments && cachedInventory) {
        setExceptions(cachedExceptions);
        setShipments(cachedShipments);
        setInventory(cachedInventory);
        if (cachedSuppliers) setSuppliers(cachedSuppliers);
        if (cachedPOs) setPurchaseOrders(cachedPOs);
        if (cachedEvents) setRecentEvents(cachedEvents);
        if (cachedMetrics) setMetrics(cachedMetrics);
      }

      // 2. Fetch fresh operational telemetry from the backend API
      try {
        const liveRes = await api.get<{
          success: boolean;
          metrics?: DashboardMetrics;
          exceptions?: ExceptionRecord[];
          shipments?: ShipmentRecord[];
          inventory?: InventoryRecord[];
          purchaseOrders?: PurchaseOrderRecord[];
          suppliers?: SupplierRecord[];
          recentEvents?: OperationalEvent[];
        }>('/api/control-tower/data');

        if (liveRes && liveRes.success) {
          const freshExceptions = liveRes.exceptions || DEFAULT_EXCEPTIONS;
          const freshShipments = liveRes.shipments || DEFAULT_SHIPMENTS;
          const freshInventory = liveRes.inventory || DEFAULT_INVENTORY;
          const freshSuppliers = liveRes.suppliers || DEFAULT_SUPPLIERS;
          const freshPOs = liveRes.purchaseOrders || DEFAULT_POS;
          const freshEvents = liveRes.recentEvents || DEFAULT_EVENTS;

          const freshMetrics: DashboardMetrics = liveRes.metrics || {
            networkHealthIndex: 87,
            criticalExceptionsCount: freshExceptions.filter(e => e.severity === 'Critical').length,
            delayedShipmentsCount: freshShipments.filter(s => s.delayDays > 0).length,
            delayedShipmentsValue: freshShipments
              .filter(s => s.delayDays > 0)
              .reduce((sum, s) => sum + s.freightCost, 0),
            inventoryRiskCount: freshInventory.filter(
              i => (i.onHand - i.reserved) < i.safetyStock
            ).length,
            totalInventoryUnits: freshInventory.reduce((sum, i) => sum + i.onHand, 0),
            totalInventoryValue: freshInventory.reduce(
              (sum, i) => sum + i.onHand * i.unitCost,
              0
            ),
            openPOCount: freshPOs.length,
            overduePOCount: freshPOs.filter(
              po => po.status === 'Overdue' || po.status === 'Delayed'
            ).length,
            totalSpendCommitment: freshPOs.reduce((sum, po) => sum + po.totalValue, 0),
            averageSupplierOtif:
              Math.round(
                (freshSuppliers.reduce((sum, s) => sum + s.otif, 0) /
                  freshSuppliers.length) *
                  10
              ) / 10,
            lastRefreshedAt: new Date().toISOString(),
            environment: env,
          };

          setExceptions(freshExceptions);
          setShipments(freshShipments);
          setInventory(freshInventory);
          setSuppliers(freshSuppliers);
          setPurchaseOrders(freshPOs);
          setRecentEvents(freshEvents);
          setMetrics(freshMetrics);
          setIsOffline(false);

          await Promise.all([
            storage.setJson(CACHE_KEYS.EXCEPTIONS, freshExceptions),
            storage.setJson(CACHE_KEYS.SHIPMENTS, freshShipments),
            storage.setJson(CACHE_KEYS.INVENTORY, freshInventory),
            storage.setJson(CACHE_KEYS.SUPPLIERS, freshSuppliers),
            storage.setJson(CACHE_KEYS.POS, freshPOs),
            storage.setJson(CACHE_KEYS.EVENTS, freshEvents),
            storage.setJson(CACHE_KEYS.METRICS, freshMetrics),
          ]);

          setLastRefreshedAt(
            new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          );
          return;
        }
      } catch (networkErr) {
        if (env === 'LIVE') {
          setIsOffline(true);
          if (!cachedExceptions) {
            throw networkErr;
          }
        }
      }

      const resolvedExceptions = cachedExceptions || DEFAULT_EXCEPTIONS;
      const resolvedShipments = cachedShipments || DEFAULT_SHIPMENTS;
      const resolvedInventory = cachedInventory || DEFAULT_INVENTORY;
      const resolvedSuppliers = cachedSuppliers || DEFAULT_SUPPLIERS;
      const resolvedPOs = cachedPOs || DEFAULT_POS;
      const resolvedEvents = cachedEvents || DEFAULT_EVENTS;

      const calculatedMetrics: DashboardMetrics = {
        networkHealthIndex: 87,
        criticalExceptionsCount: resolvedExceptions.filter(e => e.severity === 'Critical').length,
        delayedShipmentsCount: resolvedShipments.filter(s => s.delayDays > 0).length,
        delayedShipmentsValue: resolvedShipments
          .filter(s => s.delayDays > 0)
          .reduce((sum, s) => sum + s.freightCost, 0),
        inventoryRiskCount: resolvedInventory.filter(
          i => (i.onHand - i.reserved) < i.safetyStock
        ).length,
        totalInventoryUnits: resolvedInventory.reduce((sum, i) => sum + i.onHand, 0),
        totalInventoryValue: resolvedInventory.reduce(
          (sum, i) => sum + i.onHand * i.unitCost,
          0
        ),
        openPOCount: resolvedPOs.length,
        overduePOCount: resolvedPOs.filter(
          po => po.status === 'Overdue' || po.status === 'Delayed'
        ).length,
        totalSpendCommitment: resolvedPOs.reduce((sum, po) => sum + po.totalValue, 0),
        averageSupplierOtif:
          Math.round(
            (resolvedSuppliers.reduce((sum, s) => sum + s.otif, 0) /
              resolvedSuppliers.length) *
              10
          ) / 10,
        lastRefreshedAt: new Date().toISOString(),
        environment: env,
      };

      setMetrics(calculatedMetrics);
      setExceptions(resolvedExceptions);
      setShipments(resolvedShipments);
      setInventory(resolvedInventory);
      setPurchaseOrders(resolvedPOs);
      setSuppliers(resolvedSuppliers);
      setRecentEvents(resolvedEvents);
      setLastRefreshedAt(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      if (env === 'DEMO') {
        setIsOffline(false);
      }
    } catch (err) {
      setIsOffline(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const refreshData = async () => {
    await fetchAllData(true);
  };

  const executeAction = async (
    actionType: string,
    entityId: string,
    parameters: Record<string, any> = {}
  ): Promise<{ success: boolean; message: string; auditId: string }> => {
    const session = await auth.getSession();
    if (!session) {
      throw new Error('Authentication required to execute operational actions.');
    }

    try {
      const res = await api.post<{ success: boolean; message: string; auditId: string }>(
        '/api/control/execute-action',
        {
          actionType,
          entityId,
          parameters,
          actorUserId: session.user.id,
          actorRole: session.user.role,
        }
      );
      await fetchAllData(true);
      return res;
    } catch (err: any) {
      // In LIVE environment: strictly propagate error with zero fabrication
      if (session.environment === 'LIVE') {
        throw new Error(err.message || `Failed to execute action '${actionType}' for ${entityId} on live backend.`);
      }

      // In DEMO environment: generate deterministic simulated audit entry
      const auditId = `AUD-SIM-${Date.now().toString(36).toUpperCase()}`;
      await fetchAllData(true);
      return {
        success: true,
        message: `[SIMULATION] Action '${actionType}' confirmed for ${entityId}. Verified by ${session.user.fullName}.`,
        auditId,
      };
    }
  };

  return (
    <DataContext.Provider
      value={{
        metrics,
        exceptions,
        shipments,
        inventory,
        purchaseOrders,
        suppliers,
        recentEvents,
        isLoading,
        isRefreshing,
        isOffline,
        lastRefreshedAt,
        refreshData,
        executeAction,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
