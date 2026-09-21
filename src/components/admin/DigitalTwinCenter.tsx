/**
 * ORION-9 WAVE 8: ENTERPRISE DIGITAL TWIN + SCENARIO INTELLIGENCE + SIMULATION
 * Digital Twin Center UI Component
 * 
 * Central management console for enterprise supply chain Digital Twin topology,
 * entity counts, real-time health telemetry, and state reconciliation discrepancies.
 */

import React, { useState, useEffect } from 'react';
import {
  DigitalTwin,
  TwinSnapshot,
  TwinHealth,
  ReconciliationDiscrepancy,
  TwinEntityType
} from '../../digitalTwin/types';
import {
  TwinGraphEngine,
  twinSnapshotEngine,
  twinHealthEngine,
  twinReconciliationEngine,
  CanonicalEntityMapper
} from '../../digitalTwin';
import {
  Network,
  Database,
  Activity,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Camera,
  Layers,
  CheckCircle2,
  Clock,
  Boxes,
  Truck,
  Building2,
  ShoppingCart
} from 'lucide-react';

export const DigitalTwinCenter: React.FC<{ tenantId?: string }> = ({ tenantId = 'TENANT_A' }) => {
  const [graph] = useState(() => new TwinGraphEngine());
  const [snapshots, setSnapshots] = useState<TwinSnapshot[]>([]);
  const [health, setHealth] = useState<TwinHealth | null>(null);
  const [discrepancies, setDiscrepancies] = useState<ReconciliationDiscrepancy[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<TwinEntityType | 'ALL'>('ALL');

  useEffect(() => {
    initializeTwinData();
  }, [tenantId]);

  const initializeTwinData = () => {
    setIsSyncing(true);
    // Seed canonical baseline nodes into graph
    const mockEntities = [
      CanonicalEntityMapper.mapSupplier({
        id: 'SUP-PACIFIC',
        name: 'Pacific Electronics Ltd',
        category: 'Semiconductors',
        region: 'APAC',
        country: 'Taiwan',
        otif: 94,
        qualityRate: 99,
        leadTime: 21,
        defectRate: 0.8,
        spend: 450000,
        score: 88,
        status: 'ACTIVE'
      }, tenantId),
      CanonicalEntityMapper.mapSupplier({
        id: 'SUP-ATLANTIC',
        name: 'Atlantic Precision Metals',
        category: 'Fasteners',
        region: 'EMEA',
        country: 'Germany',
        otif: 98,
        qualityRate: 99.5,
        leadTime: 14,
        defectRate: 0.2,
        spend: 180000,
        score: 95,
        status: 'ACTIVE'
      }, tenantId),
      CanonicalEntityMapper.mapPurchaseOrder({
        id: 'PO-9001',
        supplierId: 'SUP-PACIFIC',
        buyer: 'BUYER-01',
        orderDate: new Date(Date.now() - 5 * 86400000).toISOString(),
        expectedDelivery: new Date(Date.now() + 16 * 86400000).toISOString(),
        status: 'In Transit',
        totalValue: 125000,
        currency: 'USD',
        lines: [{ productId: 'SKU-MICRO-01', quantity: 1000, receivedQuantity: 0, unitPrice: 125 }]
      }, tenantId),
      CanonicalEntityMapper.mapShipment({
        id: 'SHP-8801',
        poId: 'PO-9001',
        carrier: 'Maersk Ocean',
        origin: 'Kaohsiung Port',
        destination: 'Long Beach Terminal',
        shipDate: new Date(Date.now() - 3 * 86400000).toISOString(),
        expectedArrival: new Date(Date.now() + 12 * 86400000).toISOString(),
        actualArrival: null,
        status: 'In Transit',
        delayDays: 0,
        freightCost: 4500,
        trackingNumber: 'MSK-992100'
      }, tenantId),
      CanonicalEntityMapper.mapInventory({
        id: 'INV-MICRO-01',
        productId: 'SKU-MICRO-01',
        warehouseId: 'WH-CENTRAL-01',
        onHand: 350,
        reserved: 120,
        safetyStock: 100,
        reorderPoint: 250,
        averageDailyDemand: 15,
        unitCost: 125,
        leadTime: 21,
        lastUpdated: new Date().toISOString()
      }, tenantId),
    ];

    mockEntities.forEach(e => graph.addNode(e));

    // Connect relationships
    graph.addEdge({
      relationshipId: 'REL-SUP-PO-1',
      tenantId,
      fromId: 'SUP-PACIFIC',
      fromType: 'SUPPLIER',
      toId: 'PO-9001',
      toType: 'PURCHASE_ORDER',
      type: 'supplies',
      weight: 1.0,
    });
    graph.addEdge({
      relationshipId: 'REL-PO-SHP-1',
      tenantId,
      fromId: 'PO-9001',
      fromType: 'PURCHASE_ORDER',
      toId: 'SHP-8801',
      toType: 'SHIPMENT',
      type: 'ships',
      weight: 1.0,
    });
    graph.addEdge({
      relationshipId: 'REL-SHP-INV-1',
      tenantId,
      fromId: 'SHP-8801',
      fromType: 'SHIPMENT',
      toId: 'INV-MICRO-01',
      toType: 'INVENTORY',
      type: 'fulfills',
      weight: 0.9,
    });

    // Reconcile and calculate health
    const disc = twinReconciliationEngine.reconcile(tenantId, graph, mockEntities);
    const hlth = twinHealthEngine.assessHealth(tenantId, graph, twinReconciliationEngine);

    // Capture initial baseline snapshot
    const snp = twinSnapshotEngine.createSnapshot(tenantId, 'TWIN-DEFAULT', 1, graph);

    setSnapshots(twinSnapshotEngine.listSnapshots(tenantId));
    setHealth(hlth);
    setDiscrepancies(disc);
    setIsSyncing(false);
  };

  const handleCaptureSnapshot = () => {
    const newVersion = snapshots.length + 1;
    const snp = twinSnapshotEngine.createSnapshot(tenantId, 'TWIN-DEFAULT', newVersion, graph);
    setSnapshots(twinSnapshotEngine.listSnapshots(tenantId));
  };

  const nodes = selectedFilter === 'ALL'
    ? graph.listNodes(tenantId)
    : graph.listNodes(tenantId, selectedFilter);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-os-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded">
              WAVE 8 DIGITAL TWIN
            </span>
            <span className="text-xs font-mono text-os-text-muted">MULTI-RELATIONAL TOPOLOGY</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1 flex items-center gap-2">
            <Network className="text-cyan-400" size={24} />
            Enterprise Digital Twin Center
          </h1>
          <p className="text-xs text-os-text-secondary mt-1">
            Canonical in-memory topology modeling Suppliers, POs, Shipments, Warehouses, Inventory, and Customer Orders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={initializeTwinData}
            disabled={isSyncing}
            className="px-3 py-2 bg-os-surface hover:bg-os-surface-hover border border-os-border text-os-text-primary text-xs font-medium rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            Reconcile State
          </button>
          <button
            onClick={handleCaptureSnapshot}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg flex items-center gap-2 shadow transition-colors"
          >
            <Camera size={14} />
            Capture Snapshot
          </button>
        </div>
      </div>

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-os-surface border border-os-border rounded-xl p-4">
          <div className="flex items-center justify-between text-os-text-muted text-xs mb-1">
            <span>Operational Health</span>
            <Activity size={16} className="text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">{health?.status || 'HEALTHY'}</div>
          <div className="text-[11px] text-os-text-secondary mt-1">
            Completeness: {Math.round((health?.entityCompleteness || 0.95) * 100)}%
          </div>
        </div>

        <div className="bg-os-surface border border-os-border rounded-xl p-4">
          <div className="flex items-center justify-between text-os-text-muted text-xs mb-1">
            <span>Topology Entities</span>
            <Boxes size={16} className="text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-os-text-primary">{graph.listNodes(tenantId).length}</div>
          <div className="text-[11px] text-os-text-secondary mt-1">
            Relationships: {graph.listEdges(tenantId).length} active edges
          </div>
        </div>

        <div className="bg-os-surface border border-os-border rounded-xl p-4">
          <div className="flex items-center justify-between text-os-text-muted text-xs mb-1">
            <span>Frozen Snapshots</span>
            <Layers size={16} className="text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400">{snapshots.length}</div>
          <div className="text-[11px] text-os-text-secondary mt-1">Immutable historical states</div>
        </div>

        <div className="bg-os-surface border border-os-border rounded-xl p-4">
          <div className="flex items-center justify-between text-os-text-muted text-xs mb-1">
            <span>Reconciliation Issues</span>
            <AlertTriangle size={16} className="text-purple-400" />
          </div>
          <div className="text-xl font-bold text-os-text-primary">{discrepancies.length}</div>
          <div className="text-[11px] text-os-text-secondary mt-1">Zero silent corrections</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topology Node Explorer */}
        <div className="lg:col-span-2 bg-os-surface border border-os-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-os-border pb-3">
            <h3 className="text-sm font-semibold text-os-text-primary flex items-center gap-2">
              <Network size={16} className="text-cyan-400" />
              Digital Twin Topology Explorer
            </h3>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as any)}
              className="bg-os-surface-hover border border-os-border text-os-text-primary text-xs rounded px-2 py-1 outline-none"
            >
              <option value="ALL">All Entity Types</option>
              <option value="SUPPLIER">Suppliers</option>
              <option value="PURCHASE_ORDER">Purchase Orders</option>
              <option value="SHIPMENT">Shipments</option>
              <option value="INVENTORY">Inventory</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {nodes.map((node) => (
              <div
                key={node.entityId}
                className="p-3 bg-os-surface-hover/50 border border-os-border/70 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs">
                    {node.entityType === 'SUPPLIER' && <Building2 size={14} />}
                    {node.entityType === 'PURCHASE_ORDER' && <ShoppingCart size={14} />}
                    {node.entityType === 'SHIPMENT' && <Truck size={14} />}
                    {node.entityType === 'INVENTORY' && <Boxes size={14} />}
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-os-text-primary">{node.name}</div>
                    <div className="text-[11px] text-os-text-muted font-mono">{node.entityId}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                    node.riskScore > 75 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    node.riskScore > 40 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    Risk: {node.riskScore}
                  </span>
                  <span className="text-[10px] text-os-text-secondary uppercase">{node.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Snapshots & Reconciliations Sidebar */}
        <div className="space-y-6">
          {/* Snapshots Ledger */}
          <div className="bg-os-surface border border-os-border rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-os-text-primary flex items-center gap-2">
              <Camera size={16} className="text-amber-400" />
              Immutable Snapshots
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {snapshots.map((s) => (
                <div key={s.snapshotId} className="p-2.5 bg-os-surface-hover/60 border border-os-border rounded-lg text-xs">
                  <div className="flex items-center justify-between font-mono text-[11px] text-os-text-primary">
                    <span>Version {s.stateVersion}</span>
                    <span className="text-amber-400">{s.checksum}</span>
                  </div>
                  <div className="text-[10px] text-os-text-muted mt-1 flex items-center justify-between">
                    <span>{s.entityCount} nodes / {s.relationshipCount} edges</span>
                    <span>{new Date(s.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reconciliation Log */}
          <div className="bg-os-surface border border-os-border rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-os-text-primary flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              State Reconciliation
            </h3>
            <div className="space-y-2 max-h-[160px] overflow-y-auto text-xs">
              {discrepancies.length === 0 ? (
                <div className="text-center py-4 text-os-text-muted text-xs flex flex-col items-center gap-1">
                  <CheckCircle2 size={20} className="text-emerald-400" />
                  <span>Twin fully synchronized with Firestore</span>
                </div>
              ) : (
                discrepancies.map((d) => (
                  <div key={d.discrepancyId} className="p-2 bg-red-500/10 border border-red-500/20 rounded text-[11px] text-red-300">
                    <span className="font-bold uppercase font-mono mr-1">[{d.type}]</span>
                    {d.details}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
