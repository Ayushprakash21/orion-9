import React, { useState, useEffect } from 'react';
import { 
  Factory, Cog, Layers, Play, CheckCircle2, AlertCircle, 
  Clock, ShieldCheck, RefreshCw, Plus, PackageCheck, Wrench
} from 'lucide-react';
import { manufacturingMrpEngine } from '../scm/ManufacturingMrpEngine';
import { 
  BOMRecord, 
  WorkCenterRecord, 
  RoutingRecord, 
  ProductionOrderRecord 
} from '../scm/types';

export const ManufacturingCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PRODUCTION_ORDERS' | 'BOMS' | 'WORK_CENTERS' | 'ROUTINGS'>('PRODUCTION_ORDERS');
  const [orders, setOrders] = useState<ProductionOrderRecord[]>([]);
  const [boms, setBoms] = useState<BOMRecord[]>([]);
  const [workCenters, setWorkCenters] = useState<WorkCenterRecord[]>([]);
  const [routings, setRoutings] = useState<RoutingRecord[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setOrders(manufacturingMrpEngine.listProductionOrders());
    setBoms(manufacturingMrpEngine.listBOMs());
    setWorkCenters(manufacturingMrpEngine.listWorkCenters());
    setRoutings(manufacturingMrpEngine.listRoutings());
  };

  const handleReleaseOrder = (orderId: string) => {
    try {
      manufacturingMrpEngine.releaseProductionOrder(orderId, 'demo-tenant', 'shop_supervisor');
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleIssueMaterials = (orderId: string, bomId: string) => {
    try {
      const exploded = manufacturingMrpEngine.explodeBOM(bomId, 1);
      if (exploded.length > 0) {
        manufacturingMrpEngine.issueMaterial({
          tenantId: 'demo-tenant',
          productionOrderId: orderId,
          componentProductId: exploded[0].componentProductId,
          quantityIssued: exploded[0].requiredQuantity,
          warehouseId: 'wh-central-01',
          actor: 'shop_operator'
        });
        refreshData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConfirmOperation = (orderId: string) => {
    try {
      manufacturingMrpEngine.confirmOperation({
        tenantId: 'demo-tenant',
        productionOrderId: orderId,
        operationNumber: 10,
        workCenterId: 'wc-smt-01',
        yieldQuantity: 10,
        scrapQuantity: 0,
        reworkQuantity: 0,
        actualLaborHours: 2.5,
        actualMachineHours: 2.5,
        actor: 'line_technician'
      });
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCompleteOrder = (orderId: string) => {
    try {
      manufacturingMrpEngine.completeProductionOrder(orderId, 'demo-tenant', 'qa_inspector');
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12" data-testid="manufacturing-center">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-os-border pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Factory size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Manufacturing & MRP Center</h1>
            <p className="text-xs text-os-text-muted font-mono">
              Multi-Level BOMs, Work Centers, Production Routing & Shop Floor Order Execution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className="px-3 py-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded flex items-center gap-1.5">
            <ShieldCheck size={13} /> KERNEL GOVERNED (INVARIANT #4)
          </span>
          <button
            type="button"
            onClick={refreshData}
            className="p-2 bg-white/5 hover:bg-white/10 text-os-text-secondary hover:text-white rounded border border-os-border transition-all"
            title="Refresh Data"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-os-card border border-os-border rounded-lg p-4">
          <div className="flex items-center justify-between text-os-text-muted text-xs font-mono">
            <span>ACTIVE PRODUCTION ORDERS</span>
            <Factory size={16} className="text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{orders.length}</div>
          <div className="mt-1 text-xs text-os-text-muted">Shop Floor Queue</div>
        </div>

        <div className="bg-os-card border border-os-border rounded-lg p-4">
          <div className="flex items-center justify-between text-os-text-muted text-xs font-mono">
            <span>ACTIVE BOM VERSIONS</span>
            <Layers size={16} className="text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-400 font-mono">{boms.length}</div>
          <div className="mt-1 text-xs text-os-text-muted">Multi-Level Component Trees</div>
        </div>

        <div className="bg-os-card border border-os-border rounded-lg p-4">
          <div className="flex items-center justify-between text-os-text-muted text-xs font-mono">
            <span>WORK CENTERS</span>
            <Wrench size={16} className="text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono">{workCenters.length}</div>
          <div className="mt-1 text-xs text-os-text-muted">High-Efficiency SMT & Assembly</div>
        </div>

        <div className="bg-os-card border border-os-border rounded-lg p-4">
          <div className="flex items-center justify-between text-os-text-muted text-xs font-mono">
            <span>ACTIVE ROUTINGS</span>
            <Cog size={16} className="text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-400 font-mono">{routings.length}</div>
          <div className="mt-1 text-xs text-os-text-muted">Multi-Operation Sequences</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-os-border gap-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('PRODUCTION_ORDERS')}
          className={`px-4 py-2 border-b-2 font-semibold transition-all ${
            activeTab === 'PRODUCTION_ORDERS'
              ? 'border-amber-400 text-amber-400 bg-amber-500/10'
              : 'border-transparent text-os-text-muted hover:text-white'
          }`}
        >
          PRODUCTION ORDERS ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('BOMS')}
          className={`px-4 py-2 border-b-2 font-semibold transition-all ${
            activeTab === 'BOMS'
              ? 'border-amber-400 text-amber-400 bg-amber-500/10'
              : 'border-transparent text-os-text-muted hover:text-white'
          }`}
        >
          BILL OF MATERIALS ({boms.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('WORK_CENTERS')}
          className={`px-4 py-2 border-b-2 font-semibold transition-all ${
            activeTab === 'WORK_CENTERS'
              ? 'border-amber-400 text-amber-400 bg-amber-500/10'
              : 'border-transparent text-os-text-muted hover:text-white'
          }`}
        >
          WORK CENTERS ({workCenters.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ROUTINGS')}
          className={`px-4 py-2 border-b-2 font-semibold transition-all ${
            activeTab === 'ROUTINGS'
              ? 'border-amber-400 text-amber-400 bg-amber-500/10'
              : 'border-transparent text-os-text-muted hover:text-white'
          }`}
        >
          ROUTINGS ({routings.length})
        </button>
      </div>

      {/* Tab: Production Orders */}
      {activeTab === 'PRODUCTION_ORDERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-white">Shop Floor Production Orders</div>
            <button
              type="button"
              onClick={() => {
                if (boms.length > 0) {
                  manufacturingMrpEngine.createProductionOrder({
                    tenantId: 'demo-tenant',
                    productId: boms[0].finishedProductId,
                    bomId: boms[0].bomId,
                    routingId: routings[0]?.routingId || 'rtg-01',
                    warehouseId: 'wh-central-01',
                    plannedQuantity: 50,
                    startDate: '2026-10-01',
                    dueDate: '2026-10-15',
                    actor: 'shop_supervisor'
                  });
                  refreshData();
                }
              }}
              className="px-3 py-1.5 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded flex items-center gap-1.5 transition-all font-mono"
            >
              <Plus size={13} /> New Production Order
            </button>
          </div>

          <div className="bg-os-card border border-os-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-white/5 border-b border-os-border text-os-text-muted">
                  <tr>
                    <th className="p-3">ORDER #</th>
                    <th className="p-3">PRODUCT</th>
                    <th className="p-3">PLANNED QTY</th>
                    <th className="p-3">COMPLETED</th>
                    <th className="p-3">DUE DATE</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-os-border/50 text-os-text-secondary">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-os-text-muted">
                        No production orders found. Click "New Production Order" to generate one.
                      </td>
                    </tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order.productionOrderId} className="hover:bg-white/[0.02]">
                        <td className="p-3 font-bold text-white">{order.orderNumber}</td>
                        <td className="p-3 text-indigo-300 font-semibold">{order.productId}</td>
                        <td className="p-3">{order.plannedQuantity}</td>
                        <td className="p-3 text-emerald-400 font-bold">{order.completedQuantity}</td>
                        <td className="p-3 text-os-text-muted">{order.dueDate}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            order.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                            order.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                            order.status === 'RELEASED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                            'bg-white/5 text-os-text-muted border-os-border'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1.5">
                          {order.status === 'PLANNED' && (
                            <button
                              type="button"
                              onClick={() => handleReleaseOrder(order.productionOrderId)}
                              className="px-2 py-0.5 text-[11px] bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/40 rounded"
                            >
                              Release
                            </button>
                          )}
                          {order.status === 'RELEASED' && (
                            <button
                              type="button"
                              onClick={() => handleIssueMaterials(order.productionOrderId, order.bomId)}
                              className="px-2 py-0.5 text-[11px] bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 rounded"
                            >
                              Issue Mat
                            </button>
                          )}
                          {order.status === 'IN_PROGRESS' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleConfirmOperation(order.productionOrderId)}
                                className="px-2 py-0.5 text-[11px] bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/40 rounded"
                              >
                                Confirm Op
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCompleteOrder(order.productionOrderId)}
                                className="px-2 py-0.5 text-[11px] bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 rounded"
                              >
                                Complete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: BOMs */}
      {activeTab === 'BOMS' && (
        <div className="space-y-4">
          <div className="text-sm font-semibold text-white">Multi-Level Bill of Materials</div>
          <div className="space-y-3">
            {boms.map(bom => (
              <div key={bom.bomId} className="bg-os-card border border-os-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-os-border pb-2">
                  <div>
                    <div className="text-white font-bold">{bom.bomNumber} — {bom.finishedProductName}</div>
                    <div className="text-xs text-os-text-muted font-mono">Product ID: {bom.finishedProductId} | Base Qty: {bom.baseQuantity} | Version: v{bom.version}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                    ACTIVE
                  </span>
                </div>

                <div className="text-xs font-mono text-os-text-muted">Components:</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {bom.components.map((comp, idx) => (
                    <div key={idx} className="p-2.5 rounded bg-white/5 border border-os-border text-xs font-mono">
                      <div className="font-bold text-indigo-300">{comp.componentName}</div>
                      <div className="text-os-text-muted text-[11px]">ID: {comp.componentProductId}</div>
                      <div className="flex justify-between mt-1 text-[11px]">
                        <span>Qty: {comp.quantityPerUnit} {comp.unitOfMeasure}</span>
                        <span className="text-amber-400">Lead: {comp.leadTimeDays}d</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Work Centers */}
      {activeTab === 'WORK_CENTERS' && (
        <div className="space-y-4">
          <div className="text-sm font-semibold text-white">Work Centers & Capacity</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workCenters.map(wc => (
              <div key={wc.workCenterId} className="bg-os-card border border-os-border rounded-lg p-4 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-os-border pb-2">
                  <div className="font-bold text-white text-sm">{wc.name}</div>
                  <span className="text-emerald-400 font-bold">{wc.code}</span>
                </div>
                <div className="flex justify-between text-os-text-muted">
                  <span>Capacity / Day:</span>
                  <span className="text-white">{wc.capacityHoursPerDay} hrs</span>
                </div>
                <div className="flex justify-between text-os-text-muted">
                  <span>Efficiency:</span>
                  <span className="text-emerald-400 font-bold">{wc.efficiencyPercent}%</span>
                </div>
                <div className="flex justify-between text-os-text-muted">
                  <span>Hourly Labor / Machine:</span>
                  <span className="text-white">${wc.hourlyLaborRate} / ${wc.hourlyMachineRate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Routings */}
      {activeTab === 'ROUTINGS' && (
        <div className="space-y-4">
          <div className="text-sm font-semibold text-white">Manufacturing Routing Sequences</div>
          <div className="space-y-3">
            {routings.map(rtg => (
              <div key={rtg.routingId} className="bg-os-card border border-os-border rounded-lg p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-os-border pb-2">
                  <div className="font-bold text-white">{rtg.routingNumber}</div>
                  <div className="text-os-text-muted">Product: {rtg.productId}</div>
                </div>
                <div className="space-y-2">
                  {rtg.operations.map(op => (
                    <div key={op.operationNumber} className="p-2.5 rounded bg-white/5 border border-os-border flex items-center justify-between">
                      <div>
                        <span className="font-bold text-amber-400 mr-2">Op {op.operationNumber}:</span>
                        <span className="text-white">{op.description}</span>
                      </div>
                      <div className="text-os-text-muted text-[11px]">
                        Setup: {op.setupTimeHours}h | Run: {op.runTimeHoursPerUnit}h/unit
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManufacturingCenter;
