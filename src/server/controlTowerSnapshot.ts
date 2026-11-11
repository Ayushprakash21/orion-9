/**
 * ORION-9 TENANT-AWARE & PERMISSION-SCOPED CONTROL TOWER SNAPSHOT CACHE
 *
 * Isolates cached telemetry snapshots strictly by (environment, tenantId, role, domain, pathname),
 * enforces cross-tenant header boundaries, redacts sensitive PII/fields for viewer roles,
 * bounds cache growth with FIFO eviction, and invalidates cleanly on operational mutations.
 */

export interface SnapshotUserContext {
  userId: string;
  email?: string;
  role: string;
  organizationId?: string;
}

export interface TenantResolutionResult {
  allowed: boolean;
  tenantId?: string;
  statusCode?: number;
  error?: string;
}

export interface ControlTowerCacheEntry {
  body: string;
  expiresAt: number;
  tenantId: string;
  environment: string;
}

const CONTROL_TOWER_SNAPSHOT_TTL_MS = 2000;
const MAX_CONTROL_TOWER_CACHE_ENTRIES = 128;

const controlTowerSnapshotCache = new Map<string, ControlTowerCacheEntry>();

const BASELINE_EXCEPTIONS = Object.freeze([
  Object.freeze({
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
  }),
  Object.freeze({
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
  }),
  Object.freeze({
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
  }),
  Object.freeze({
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
  }),
  Object.freeze({
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
  }),
]);

const BASELINE_SHIPMENTS = Object.freeze([
  Object.freeze({
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
  }),
  Object.freeze({
    id: 'SHP-2026-0002',
    poId: 'PO-2026-0040',
    supplierId: 'SUP-003',
    carrier: 'DHL Global Forwarding',
    origin: 'Frankfurt Air Hub, DE',
    destination: "Chicago O'Hare Hub, US",
    shipDate: '2026-10-26T00:00:00Z',
    expectedArrival: '2026-10-29T00:00:00Z',
    actualArrival: null,
    status: 'In Transit',
    delayDays: 0,
    freightCost: 14200,
    trackingNumber: 'DHL-88102941',
  }),
  Object.freeze({
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
  }),
  Object.freeze({
    id: 'SHP-2026-0004',
    poId: 'PO-2026-0039',
    supplierId: 'SUP-004',
    carrier: 'Ocean Network Express',
    origin: 'Port of Kaohsiung, TW',
    destination: 'Oakland Port, US',
    shipDate: '2026-10-15T00:00:00Z',
    expectedArrival: '2026-10-28T00:00:00Z',
    actualArrival: '2026-10-28T18:00:00Z',
    status: 'Delivered',
    delayDays: 0,
    freightCost: 26400,
    trackingNumber: 'ONE-7721904',
  }),
]);

const BASELINE_INVENTORY = Object.freeze([
  Object.freeze({
    id: 'INV-001',
    productId: 'SKU-1000',
    warehouseId: 'WH-CHI-01',
    onHand: 180,
    reserved: 120,
    inTransit: 500,
    safetyStock: 150,
    reorderPoint: 250,
    dailyDemand: 28,
    averageDailyDemand: 28,
    unitCost: 450,
    leadTime: 14,
  }),
  Object.freeze({
    id: 'INV-002',
    productId: 'SKU-1001',
    warehouseId: 'WH-DAL-02',
    onHand: 850,
    reserved: 200,
    inTransit: 800,
    safetyStock: 300,
    reorderPoint: 500,
    dailyDemand: 45,
    averageDailyDemand: 45,
    unitCost: 180,
    leadTime: 8,
  }),
  Object.freeze({
    id: 'INV-003',
    productId: 'SKU-1002',
    warehouseId: 'WH-FRA-01',
    onHand: 420,
    reserved: 380,
    inTransit: 120,
    safetyStock: 100,
    reorderPoint: 180,
    dailyDemand: 16,
    averageDailyDemand: 16,
    unitCost: 820,
    leadTime: 21,
  }),
  Object.freeze({
    id: 'INV-004',
    productId: 'SKU-1003',
    warehouseId: 'WH-NRT-01',
    onHand: 2680,
    reserved: 450,
    inTransit: 0,
    safetyStock: 600,
    reorderPoint: 1000,
    dailyDemand: 72,
    averageDailyDemand: 72,
    unitCost: 125,
    leadTime: 6,
  }),
]);

const BASELINE_SUPPLIERS = Object.freeze([
  Object.freeze({
    id: 'SUP-001',
    name: 'Titan Microelectronics',
    category: 'Semiconductors',
    region: 'Asia Pacific',
    country: 'Japan',
    contact: 'Kenji Takahashi (k.takahashi@titan-micro.jp)',
    otif: 78.4,
    qualityRate: 97.6,
    leadTime: 18,
    defectRate: 2.4,
    spend: 4850000,
    openPoValue: 720000,
    score: 76,
    riskLevel: 'High' as const,
    status: 'Under Review',
  }),
  Object.freeze({
    id: 'SUP-002',
    name: 'Apex Dynamics',
    category: 'Precision Mechanical',
    region: 'North America',
    country: 'United States',
    contact: 'Rachel Adams (radams@apexdynamics.com)',
    otif: 91.8,
    qualityRate: 95.8,
    leadTime: 12,
    defectRate: 4.2,
    spend: 2900000,
    openPoValue: 340000,
    score: 88,
    riskLevel: 'Medium' as const,
    status: 'Active',
  }),
  Object.freeze({
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
    riskLevel: 'Low' as const,
    status: 'Preferred',
  }),
  Object.freeze({
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
    riskLevel: 'Medium' as const,
    status: 'Active',
  }),
]);

const BASELINE_PURCHASE_ORDERS = Object.freeze([
  Object.freeze({
    id: 'PO-2026-0038',
    supplierId: 'SUP-001',
    orderDate: '2026-10-10T00:00:00Z',
    expectedDelivery: '2026-11-01T00:00:00Z',
    status: 'Delayed' as const,
    totalValue: 225000,
    currency: 'USD',
    buyer: 'Sarah Chen',
    lines: Object.freeze([{ productId: 'SKU-1000', quantity: 500, receivedQuantity: 0, unitPrice: 450 }]),
  }),
  Object.freeze({
    id: 'PO-2026-0040',
    supplierId: 'SUP-003',
    orderDate: '2026-10-20T00:00:00Z',
    expectedDelivery: '2026-10-29T00:00:00Z',
    status: 'In Transit' as const,
    totalValue: 144000,
    currency: 'USD',
    buyer: 'Marcus Vance',
    lines: Object.freeze([{ productId: 'SKU-1001', quantity: 800, receivedQuantity: 0, unitPrice: 180 }]),
  }),
  Object.freeze({
    id: 'PO-2026-0042',
    supplierId: 'SUP-001',
    orderDate: '2026-10-12T00:00:00Z',
    expectedDelivery: '2026-10-26T00:00:00Z',
    status: 'Overdue' as const,
    totalValue: 98400,
    currency: 'USD',
    buyer: 'Sarah Chen',
    lines: Object.freeze([{ productId: 'SKU-1002', quantity: 120, receivedQuantity: 0, unitPrice: 820 }]),
  }),
]);

const BASELINE_RECENT_EVENTS = Object.freeze([
  Object.freeze({
    id: 'EVT-01',
    source: 'Event Fabric',
    entityType: 'INVENTORY_REBALANCE',
    entityId: 'SKU-1000',
    eventType: 'Buffer Calibration',
    timestamp: '12m ago',
    description: 'Autonomous rebalance policy calculated +45 unit buffer for Chicago DC.',
    badgeColor: '#10b981',
  }),
  Object.freeze({
    id: 'EVT-02',
    source: 'EDI Gateway',
    entityType: 'SHIPMENT_STATUS',
    entityId: 'SHP-2026-0001',
    eventType: 'Lane Congestion Detected',
    timestamp: '34m ago',
    description: 'Carrier Maersk updated transshipment ETA +4 days at Port of Long Beach.',
    badgeColor: '#ef4444',
  }),
  Object.freeze({
    id: 'EVT-03',
    source: 'ERP Synchronizer',
    entityType: 'PO_CONFIRMATION',
    entityId: 'PO-2026-0040',
    eventType: 'Ledger Reconciled',
    timestamp: '1h ago',
    description: 'PO-2026-0040 delivery milestone confirmed by DHL Global Forwarding.',
    badgeColor: '#06b6d4',
  }),
  Object.freeze({
    id: 'EVT-04',
    source: 'Cognitive Engine',
    entityType: 'RISK_PROPOSAL',
    entityId: 'EXC-2026-001',
    eventType: 'Decision Proposed',
    timestamp: '2h ago',
    description: 'Decision Copilot proposed priority intermodal expedite for SKU-1000.',
    badgeColor: '#f59e0b',
  }),
]);

const PRECOMPUTED_BASE_METRICS = Object.freeze({
  networkHealthIndex: 87,
  criticalExceptionsCount: BASELINE_EXCEPTIONS.filter(e => e.severity === 'Critical').length,
  delayedShipmentsCount: BASELINE_SHIPMENTS.filter(s => s.delayDays > 0).length,
  delayedShipmentsValue: BASELINE_SHIPMENTS.filter(s => s.delayDays > 0).reduce((sum, s) => sum + s.freightCost, 0),
  inventoryRiskCount: BASELINE_INVENTORY.filter(i => (i.onHand - i.reserved) < i.safetyStock).length,
  totalInventoryUnits: BASELINE_INVENTORY.reduce((sum, i) => sum + i.onHand, 0),
  totalInventoryValue: BASELINE_INVENTORY.reduce((sum, i) => sum + i.onHand * i.unitCost, 0),
  openPOCount: BASELINE_PURCHASE_ORDERS.length,
  overduePOCount: BASELINE_PURCHASE_ORDERS.filter(po => po.status === 'Overdue' || po.status === 'Delayed').length,
  totalSpendCommitment: BASELINE_PURCHASE_ORDERS.reduce((sum, po) => sum + po.totalValue, 0),
  averageSupplierOtif: Math.round((BASELINE_SUPPLIERS.reduce((sum, s) => sum + s.otif, 0) / BASELINE_SUPPLIERS.length) * 10) / 10,
});

/**
 * Resolves the authoritative tenantId for an authenticated user and rejects cross-tenant header spoofing.
 */
export function resolveAuthorizedTenantId(
  user: SnapshotUserContext,
  requestedTenantHeader?: string | null
): TenantResolutionResult {
  const headerTenant = requestedTenantHeader?.trim() || '';
  const userOrg = user.organizationId?.trim() || '';
  const isPlatformAdmin = user.role === 'platform_admin';

  if (userOrg && userOrg !== 'ORION_PLATFORM') {
    if (headerTenant && headerTenant !== userOrg && !isPlatformAdmin) {
      return {
        allowed: false,
        statusCode: 403,
        error: `Forbidden: Cross-tenant access denied for requested tenant '${headerTenant}'.`,
      };
    }
    return {
      allowed: true,
      tenantId: isPlatformAdmin && headerTenant ? headerTenant : userOrg,
    };
  }

  return {
    allowed: true,
    tenantId: headerTenant || 'org-global-corp',
  };
}

/**
 * Builds or returns a cached, strictly tenant-scoped & permission-scoped Control Tower JSON payload.
 */
export function getOrBuildControlTowerSnapshotJson(params: {
  activeEnv: 'DEMO' | 'STAGING' | 'LIVE';
  tenantId: string;
  role: string;
  pathname: string;
  domain?: string | null;
}): { body: string; cacheHit: boolean; cacheKey: string } {
  const domain = (params.domain || 'all').trim().toLowerCase() || 'all';
  const cacheKey = `${params.activeEnv}:${params.tenantId}:${params.role}:${domain}:${params.pathname}`;
  const nowMs = Date.now();
  const cached = controlTowerSnapshotCache.get(cacheKey);
  if (cached && cached.expiresAt > nowMs) {
    return { body: cached.body, cacheHit: true, cacheKey };
  }

  const nowIso = new Date(nowMs).toISOString();
  const isViewer = params.role === 'viewer';
  const isReadOnly = isViewer || params.role === 'analyst';
  const isAdmin = params.role === 'platform_admin' || params.role === 'organization_admin';

  const exceptions = BASELINE_EXCEPTIONS.map(ex => ({
    ...ex,
    tenantId: params.tenantId,
    owner: isViewer ? 'Restricted' : ex.owner,
  }));
  const shipments = BASELINE_SHIPMENTS.map(sh => ({ ...sh, tenantId: params.tenantId }));
  const inventory = BASELINE_INVENTORY.map(inv => ({ ...inv, tenantId: params.tenantId, lastUpdated: nowIso }));
  const suppliers = BASELINE_SUPPLIERS.map(sup => ({
    ...sup,
    tenantId: params.tenantId,
    contact: isViewer ? 'Restricted' : sup.contact,
  }));
  const purchaseOrders = BASELINE_PURCHASE_ORDERS.map(po => ({
    ...po,
    tenantId: params.tenantId,
    buyer: isViewer ? 'Restricted' : po.buyer,
  }));
  const recentEvents = BASELINE_RECENT_EVENTS.map(ev => ({ ...ev, tenantId: params.tenantId }));

  const responseBody = JSON.stringify({
    success: true,
    tenantId: params.tenantId,
    organizationId: params.tenantId,
    permissions: {
      canExecuteActions: !isReadOnly,
      canDispatchOutbox: isAdmin,
      readOnly: isReadOnly,
      role: params.role,
    },
    metrics: {
      ...PRECOMPUTED_BASE_METRICS,
      tenantId: params.tenantId,
      lastRefreshedAt: nowIso,
      environment: params.activeEnv,
    },
    exceptions,
    shipments,
    inventory,
    purchaseOrders,
    suppliers,
    recentEvents,
    environment: params.activeEnv,
    timestamp: nowIso,
  });

  if (controlTowerSnapshotCache.size >= MAX_CONTROL_TOWER_CACHE_ENTRIES) {
    const oldestKey = controlTowerSnapshotCache.keys().next().value;
    if (oldestKey !== undefined) {
      controlTowerSnapshotCache.delete(oldestKey);
    }
  }
  controlTowerSnapshotCache.set(cacheKey, {
    body: responseBody,
    expiresAt: nowMs + CONTROL_TOWER_SNAPSHOT_TTL_MS,
    tenantId: params.tenantId,
    environment: params.activeEnv,
  });

  return { body: responseBody, cacheHit: false, cacheKey };
}

/**
 * Invalidates Control Tower snapshots for a specific (environment, tenantId) or entire cache.
 */
export function invalidateControlTowerCache(activeEnv?: string, tenantId?: string): number {
  let removed = 0;
  for (const [key, entry] of controlTowerSnapshotCache.entries()) {
    const envMatches = !activeEnv || entry.environment === activeEnv;
    const tenantMatches = !tenantId || entry.tenantId === tenantId;
    if (envMatches && tenantMatches) {
      controlTowerSnapshotCache.delete(key);
      removed++;
    }
  }
  return removed;
}

export function getControlTowerCacheSize(): number {
  return controlTowerSnapshotCache.size;
}
