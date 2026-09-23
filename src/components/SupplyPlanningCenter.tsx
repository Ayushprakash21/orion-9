import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Layers, CheckCircle2, ShieldCheck, RefreshCw, 
  Plus, ArrowRight, Calendar, TrendingUp, AlertTriangle, Play
} from 'lucide-react';
import { supplyPlanningEngine } from '../scm/SupplyPlanningEngine';
import { SupplyPlanRecord, PlannedOrderRecord } from '../scm/types';

export const SupplyPlanningCenter: React.FC = () => {
  const [plans, setPlans] = useState<SupplyPlanRecord[]>([]);
  const [plannedOrders, setPlannedOrders] = useState<PlannedOrderRecord[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const allPlans = supplyPlanningEngine.listSupplyPlans();
    setPlans(allPlans);
    setPlannedOrders(supplyPlanningEngine.listPlannedOrders());
    if (allPlans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(allPlans[0].supplyPlanId);
    }
  };

  const handlePublish = (planId: string) => {
    try {
      supplyPlanningEngine.publishSupplyPlan(planId, 'demo-tenant', 'supply_director');
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConvert = (orderId: string, type: string) => {
    try {
      const convertedId = type === 'PLANNED_PO' ? `po-gen-${Date.now().toString(36)}` : `prd-gen-${Date.now().toString(36)}`;
      supplyPlanningEngine.convertPlannedOrder({
        plannedOrderId: orderId,
        tenantId: 'demo-tenant',
        convertedEntityId: convertedId,
        actor: 'planner'
      });
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const currentPlan = plans.find(p => p.supplyPlanId === selectedPlanId) || plans[0];

  return (
    <div className="space-y-6 pb-12" data-testid="supply-planning-center">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-os-border pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <BarChart3 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Supply Planning & MRP Center</h1>
            <p className="text-xs text-os-text-muted font-mono">
              Gross-to-Net Demand Netting, Time-Phased MRP Calculations & Planned Order Conversion
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className="px-3 py-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded flex items-center gap-1.5">
            <ShieldCheck size={13} /> KERNEL GOVERNED (INVARIANT #3)
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
            <span>SUPPLY PLANS</span>
            <Layers size={16} className="text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{plans.length}</div>
          <div className="mt-1 text-xs text-os-text-muted">Master Supply Schedules</div>
        </div>

        <div className="bg-os-card border border-os-border rounded-lg p-4">
          <div className="flex items-center justify-between text-os-text-muted text-xs font-mono">
            <span>PLANNED ORDERS</span>
            <TrendingUp size={16} className="text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-400 font-mono">{plannedOrders.length}</div>
          <div className="mt-1 text-xs text-os-text-muted">PO & Production Suggestions</div>
        </div>

        <div className="bg-os-card border border-os-border rounded-lg p-4">
          <div className="flex items-center justify-between text-os-text-muted text-xs font-mono">
            <span>CONVERTED TO EXECUTION</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono">
            {plannedOrders.filter(o => o.status === 'CONVERTED').length}
          </div>
          <div className="mt-1 text-xs text-os-text-muted">Released to SCM Execution</div>
        </div>

        <div className="bg-os-card border border-os-border rounded-lg p-4">
          <div className="flex items-center justify-between text-os-text-muted text-xs font-mono">
            <span>PLANNING STATUS</span>
            <ShieldCheck size={16} className="text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono">
            {currentPlan?.isPublished ? 'PUBLISHED' : 'DRAFT'}
          </div>
          <div className="mt-1 text-xs text-os-text-muted">{currentPlan?.planName || 'No Active Plan'}</div>
        </div>
      </div>

      {/* Plan Details & Gross-to-Net Grid */}
      {currentPlan && (
        <div className="bg-os-card border border-os-border rounded-lg p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-os-border pb-3">
            <div>
              <h2 className="text-base font-bold text-white">{currentPlan.planName}</h2>
              <div className="text-xs text-os-text-muted font-mono">
                Horizon: {currentPlan.horizonStart} to {currentPlan.horizonEnd} | Created by: {currentPlan.createdBy}
              </div>
            </div>
            <div>
              {!currentPlan.isPublished ? (
                <button
                  type="button"
                  onClick={() => handlePublish(currentPlan.supplyPlanId)}
                  className="px-3 py-1.5 text-xs bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 rounded flex items-center gap-1.5 font-mono"
                >
                  <Play size={13} /> Publish Supply Plan
                </button>
              ) : (
                <span className="px-3 py-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} /> PUBLISHED TO EXECUTION LAYER
                </span>
              )}
            </div>
          </div>

          {/* Gross-to-Net Items Table */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-white font-mono uppercase">Gross-to-Net Demand Matrix</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-white/5 border-b border-os-border text-os-text-muted">
                  <tr>
                    <th className="p-3">PRODUCT</th>
                    <th className="p-3">PERIOD</th>
                    <th className="p-3 text-right">GROSS DEMAND</th>
                    <th className="p-3 text-right">ON-HAND</th>
                    <th className="p-3 text-right">SCHED RECEIPTS</th>
                    <th className="p-3 text-right">SAFETY STOCK</th>
                    <th className="p-3 text-right text-amber-400">NET REQUIREMENTS</th>
                    <th className="p-3 text-right text-emerald-400">PLANNED RECEIPTS</th>
                    <th className="p-3 text-right">PROJECTED ENDING</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-os-border/50 text-os-text-secondary">
                  {currentPlan.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-bold text-white">{item.productId}</td>
                      <td className="p-3 text-os-text-muted">{item.period}</td>
                      <td className="p-3 text-right">{item.grossDemand}</td>
                      <td className="p-3 text-right">{item.onHandStock}</td>
                      <td className="p-3 text-right">{item.scheduledReceipts}</td>
                      <td className="p-3 text-right">{item.safetyStock}</td>
                      <td className="p-3 text-right font-bold text-amber-400">{item.netRequirements}</td>
                      <td className="p-3 text-right font-bold text-emerald-400">{item.plannedOrderReceipts}</td>
                      <td className="p-3 text-right">{item.projectedEndingStock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Planned Orders Table */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-white font-mono uppercase">Generated Planned Orders</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-white/5 border-b border-os-border text-os-text-muted">
                  <tr>
                    <th className="p-3">PLANNED ORDER ID</th>
                    <th className="p-3">TYPE</th>
                    <th className="p-3">PRODUCT</th>
                    <th className="p-3">QTY</th>
                    <th className="p-3">RELEASE DATE</th>
                    <th className="p-3">REQUIRED DATE</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3 text-right">CONVERSION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-os-border/50 text-os-text-secondary">
                  {currentPlan.plannedOrders.map(po => (
                    <tr key={po.plannedOrderId} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-bold text-white">{po.plannedOrderId}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          po.type === 'PLANNED_PRODUCTION' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        }`}>
                          {po.type === 'PLANNED_PRODUCTION' ? 'PRODUCTION' : 'PURCHASE'}
                        </span>
                      </td>
                      <td className="p-3 text-indigo-300 font-semibold">{po.productId}</td>
                      <td className="p-3 font-bold">{po.quantity}</td>
                      <td className="p-3 text-os-text-muted">{po.orderReleaseDate}</td>
                      <td className="p-3 text-os-text-muted">{po.requiredDate}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          po.status === 'CONVERTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {po.status !== 'CONVERTED' ? (
                          <button
                            type="button"
                            onClick={() => handleConvert(po.plannedOrderId, po.type)}
                            className="px-2.5 py-1 text-[11px] bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 rounded font-mono"
                          >
                            Convert to {po.type === 'PLANNED_PRODUCTION' ? 'Shop Order' : 'PO'}
                          </button>
                        ) : (
                          <span className="text-os-text-muted text-[11px]">
                            {po.convertedEntityId}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplyPlanningCenter;
