/**
 * ORION-9 SCM CONTROL TOWER WORKSPACE
 * Unified operational command center supporting 17 operational domains,
 * authoritative KPI evaluation, SLA monitoring, topological risk visualization,
 * and an interactive Exception-to-Action Workbench.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { formatCurrency, formatCurrencyPair, formatNumber, formatPercentage } from '../../lib/formatters';
import { 
  ControlTowerDomain, 
  GovernedKpiRecord, 
  SlaMonitorRecord, 
  OperationalSnapshot,
  ExceptionWorkbenchItem
} from '../../services/controltower/types';
import { controlTowerKpiService } from '../../services/controltower/ControlTowerKpiService';
import { controlTowerBridge } from '../../services/controltower/ControlTowerBridge';
import { exceptionWorkbenchService } from '../../services/controltower/ExceptionWorkbenchService';
import { controlTowerRiskIntegrator } from '../../services/controltower/ControlTowerRiskIntegrator';
import { 
  ShieldAlert, Activity, CheckCircle2, AlertTriangle, 
  Layers, BrainCircuit, ArrowRight, Zap, Target, Truck, 
  Box, Factory, DollarSign, ShieldCheck, Eye, RefreshCw,
  Clock, Compass, Network, GitCommit, FileText, ChevronRight
} from 'lucide-react';

const DOMAINS: Array<{ id: ControlTowerDomain; label: string; icon: any }> = [
  { id: 'executive', label: 'Overview', icon: Layers },
  { id: 'procurement', label: 'Procurement', icon: Target },
  { id: 'logistics', label: 'Logistics', icon: Truck },
  { id: 'inventory', label: 'Inventory', icon: Box },
  { id: 'suppliers', label: 'Suppliers', icon: Factory },
  { id: 'quality', label: 'Quality', icon: ShieldCheck },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'orders', label: 'Orders', icon: Compass },
  { id: 'warehouses', label: 'Warehouses', icon: Network },
  { id: 'exceptions', label: 'Exceptions', icon: AlertTriangle },
  { id: 'risks', label: 'Risks', icon: ShieldAlert },
  { id: 'predictions', label: 'Predictions', icon: Activity },
  { id: 'decisions', label: 'Decisions', icon: Zap },
  { id: 'scenarios', label: 'Scenarios', icon: GitCommit },
  { id: 'outcomes', label: 'Outcomes', icon: CheckCircle2 },
  { id: 'supply', label: 'Supply', icon: Factory },
  { id: 'demand', label: 'Demand', icon: Eye },
];

export const ControlTowerWorkspace: React.FC = () => {
  const { 
    userProfile, 
    currency,
    exceptions,
    shipments,
    purchaseOrders,
  } = useSupplyChain();

  const tenantId = (userProfile as any)?.organizationId || (userProfile as any)?.tenantId || 'tenant-default';

  const { openEntity } = useEntityDrawer();

  const [activeDomain, setActiveDomain] = useState<ControlTowerDomain>('executive');
  const [kpis, setKpis] = useState<GovernedKpiRecord[]>([]);
  const [slas, setSlas] = useState<SlaMonitorRecord[]>([]);
  const [snapshot, setSnapshot] = useState<OperationalSnapshot | null>(null);
  const [workbenchItems, setWorkbenchItems] = useState<ExceptionWorkbenchItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [executingAction, setExecutingAction] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load authoritative data
  const loadControlTowerData = async () => {
    try {
      setLoading(true);
      const [computedKpis, computedSlas] = await Promise.all([
        controlTowerKpiService.computeDomainKpis(tenantId),
        controlTowerBridge.evaluateOperationalSlas(tenantId),
      ]);

      setKpis(computedKpis);
      setSlas(computedSlas);

      const activeExcCount = exceptions.filter((e) => e.status !== 'Resolved').length;
      const criticalRisksCount = computedSlas.filter((s) => s.status === 'BREACHED').length;

      const snap = await controlTowerKpiService.generateOperationalSnapshot(
        tenantId,
        activeExcCount,
        criticalRisksCount,
        2
      );
      setSnapshot(snap);

      // Initialize or fetch workbench items
      let existingItems = exceptionWorkbenchService.listWorkbenchItems(tenantId);
      if (existingItems.length === 0 && exceptions.length > 0) {
        for (const exc of exceptions.slice(0, 5)) {
          await exceptionWorkbenchService.createWorkbenchItem(tenantId, {
            exceptionId: exc.id,
            tenantId,
            summary: exc.type || 'Operational Disruption',
            type: exc.type || 'DISRUPTION',
            category: (exc.type?.toLowerCase().includes('ship') ? 'LOGISTICS' : 'INVENTORY') as any,
            severity: exc.severity as any,
            status: 'OPEN',
            entityReferences: [],
            slaMinutes: 180,
            financialImpact: exc.estimatedImpact || 20000,
            detectedAt: exc.date || new Date().toISOString(),
            createdAt: exc.date || new Date().toISOString(),
          });
        }
        existingItems = exceptionWorkbenchService.listWorkbenchItems(tenantId);
      }
      setWorkbenchItems(existingItems);
      if (existingItems.length > 0 && !selectedItemId) {
        setSelectedItemId(existingItems[0].id);
      }
    } catch (err) {
      console.warn('[ControlTower] Error loading telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadControlTowerData();
  }, [tenantId, exceptions.length]);

  const selectedWorkbenchItem = useMemo(() => {
    return workbenchItems.find((w) => w.id === selectedItemId) || workbenchItems[0];
  }, [workbenchItems, selectedItemId]);

  const handleInvestigateItem = async (item: ExceptionWorkbenchItem) => {
    try {
      setExecutingAction(true);
      const actor = {
        id: userProfile?.id || 'usr-controller',
        type: 'USER',
        name: userProfile?.fullName || 'Control Tower Controller',
        roles: [userProfile?.role || 'operations_director'],
        organizationId: tenantId,
      };
      const updated = await exceptionWorkbenchService.investigateAndFormulate(tenantId, item.id, actor);
      setWorkbenchItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      showToast(`Diagnostic and decision options formulated for ${item.title}`);
    } catch (err: any) {
      showToast(`Investigation failed: ${err.message}`);
    } finally {
      setExecutingAction(false);
    }
  };

  const handleExecuteAction = async (item: ExceptionWorkbenchItem, optionId: string) => {
    try {
      setExecutingAction(true);
      const actor = {
        id: userProfile?.id || 'usr-controller',
        type: 'USER',
        name: userProfile?.fullName || 'Control Tower Controller',
        roles: [userProfile?.role || 'operations_director'],
        organizationId: tenantId,
      };
      const { item: updated, commandResult } = await exceptionWorkbenchService.executeGovernedAction(
        tenantId,
        item.id,
        optionId,
        actor
      );
      setWorkbenchItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      if (commandResult.success) {
        showToast(`Governed action executed successfully via Kernel: ${commandResult.commandId}`);
        loadControlTowerData();
      } else {
        showToast(`Kernel rejected action: ${commandResult.error}`);
      }
    } catch (err: any) {
      showToast(`Action failed: ${err.message}`);
    } finally {
      setExecutingAction(false);
    }
  };

  const filteredKpis = useMemo(() => {
    if (activeDomain === 'executive') return kpis;
    return kpis.filter((k) => k.domain === activeDomain);
  }, [kpis, activeDomain]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={15} />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-current opacity-70 hover:opacity-100">&times;</button>
        </div>
      )}

      {/* EXECUTIVE CONTROL STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-os-surface/90 border border-os-border/80 rounded-xl p-4 shadow-sm backdrop-blur-md">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-os-text-muted">Network Health</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-mono font-light text-cyan-400">
              {snapshot?.healthScore || 94}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {snapshot?.executiveSummary.overallStatus || 'Healthy'}
            </span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-os-text-muted">Active Exceptions</span>
          <div className="flex items-center gap-2 mt-1">
            <AlertTriangle size={16} className="text-amber-400" />
            <span className="text-2xl font-mono text-os-text-primary">
              {snapshot?.executiveSummary.activeExceptionsCount || 0}
            </span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-os-text-muted">SLA Breaches</span>
          <div className="flex items-center gap-2 mt-1">
            <Clock size={16} className="text-red-400" />
            <span className="text-2xl font-mono text-os-text-primary">
              {slas.filter((s) => s.status === 'BREACHED').length}
            </span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-os-text-muted">Capital at Risk</span>
          <div className="mt-1">
            <span className="text-xl font-mono text-os-text-primary font-medium">
              {formatCurrency(snapshot?.executiveSummary.totalCapitalAtRisk || 0, currency)}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-center items-end">
          <button 
            onClick={loadControlTowerData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-os-border hover:bg-os-surface-hover text-xs text-os-text-secondary transition-all"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Telemetry Refresh</span>
          </button>
        </div>
      </div>

      {/* DOMAIN NAVIGATION PILLS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-os-border">
        {DOMAINS.map((dom) => {
          const Icon = dom.icon;
          const isActive = activeDomain === dom.id;
          return (
            <button
              key={dom.id}
              onClick={() => setActiveDomain(dom.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover'
              }`}
            >
              <Icon size={13} />
              <span>{dom.label}</span>
            </button>
          );
        })}
      </div>

      {/* DOMAIN KPI MATRIX & SLA PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KPI MATRIX */}
        <div className="lg:col-span-2 bg-os-surface/80 border border-os-border/70 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-os-text-primary flex items-center gap-2">
              <Activity size={14} className="text-cyan-400" />
              <span>Governed Domain KPIs ({filteredKpis.length})</span>
            </h3>
            <span className="text-[10px] font-mono text-os-text-muted">Authoritative SCM Source</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredKpis.map((kpi) => (
              <div 
                key={kpi.kpiId}
                className="p-3 rounded-lg border border-os-border bg-os-surface-secondary/40 hover:border-os-border-strong transition-all"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[11px] font-medium text-os-text-secondary line-clamp-1">{kpi.name}</span>
                  <span className={`text-[9px] font-mono px-1 py-0.5 rounded border ${
                    kpi.status === 'ON_TARGET' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                    kpi.status === 'WATCH' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                    'text-red-400 border-red-500/30 bg-red-500/10'
                  }`}>
                    {kpi.status}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-xl font-mono text-os-text-primary font-light">
                    {kpi.unit === 'USD' ? formatCurrency(kpi.currentValue, currency) : `${kpi.currentValue} ${kpi.unit}`}
                  </span>
                  <span className="text-[10px] font-mono text-os-text-muted">Target: {kpi.targetValue} {kpi.unit}</span>
                </div>
                <div className="text-[9px] text-os-text-muted mt-2 font-mono truncate" title={kpi.formulaDescription}>
                  {kpi.formulaDescription}
                </div>
              </div>
            ))}
            {filteredKpis.length === 0 && (
              <div className="col-span-2 text-center py-8 text-xs text-os-text-muted">
                No telemetry recorded for domain '{activeDomain}'.
              </div>
            )}
          </div>
        </div>

        {/* SLA MONITORS */}
        <div className="bg-os-surface/80 border border-os-border/70 rounded-xl p-5 shadow-xs flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-os-text-primary flex items-center gap-2">
              <Clock size={14} className="text-amber-400" />
              <span>SLA Performance Monitors</span>
            </h3>
            <span className="text-[10px] font-mono text-os-text-muted">Targeted Deadlines</span>
          </div>

          <div className="space-y-3 flex-1">
            {slas.map((sla) => (
              <div key={sla.slaId} className="p-3 rounded-lg border border-os-border bg-os-surface-secondary/40">
                <div className="flex justify-between items-start mb-1.5">
                  <span className="text-xs font-medium text-os-text-primary">{sla.name}</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                    sla.status === 'COMPLIANT' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                    'text-red-400 border-red-500/30 bg-red-500/10'
                  }`}>
                    {sla.status}
                  </span>
                </div>
                <div className="text-[11px] text-os-text-secondary mb-1">
                  Active Breaches: <span className="font-mono text-red-400 font-bold">{sla.activeBreachCount}</span> of {sla.evaluatedCount}
                </div>
                <div className="text-[10px] font-mono text-os-text-muted">
                  Max Target: {Math.round(sla.targetDurationMinutes / 60)}h
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* EXCEPTION WORKBENCH & ACTION EXECUTION */}
      <div className="bg-os-surface/80 border border-os-border/70 rounded-xl p-5 shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-cyan-400" />
            <h3 className="text-xs uppercase tracking-wider font-semibold text-os-text-primary">
              Control Tower Exception-to-Action Workbench
            </h3>
          </div>
          <span className="text-[10px] font-mono text-os-text-muted">Governed Kernel Execution</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* EXCEPTION LIST */}
          <div className="divide-y divide-os-border border border-os-border rounded-lg max-h-96 overflow-y-auto">
            {workbenchItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className={`p-3 cursor-pointer transition-colors ${
                  selectedWorkbenchItem?.id === item.id ? 'bg-cyan-500/10 border-l-2 border-cyan-400' : 'hover:bg-os-surface-hover'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-medium text-os-text-primary line-clamp-1">{item.title}</span>
                  <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                    item.severity === 'CRITICAL' ? 'text-red-400 bg-red-500/10' : 'text-amber-400 bg-amber-500/10'
                  }`}>{item.severity}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-os-text-muted mt-1">
                  <span>Status: {item.status}</span>
                  <span>{formatCurrency(item.capitalAtRisk, currency)}</span>
                </div>
              </div>
            ))}
            {workbenchItems.length === 0 && (
              <div className="p-6 text-center text-xs text-os-text-muted">No active workbench items.</div>
            )}
          </div>

          {/* DIAGNOSTIC & ACTION EXECUTION PANEL */}
          <div className="lg:col-span-2 border border-os-border rounded-lg p-4 bg-os-surface-secondary/20 flex flex-col justify-between">
            {selectedWorkbenchItem ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start border-b border-os-border pb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-os-text-primary">{selectedWorkbenchItem.title}</h4>
                    <span className="text-[10px] font-mono text-os-text-muted">ID: {selectedWorkbenchItem.id} | Domain: {selectedWorkbenchItem.domain.toUpperCase()}</span>
                  </div>
                  <button 
                    onClick={() => handleInvestigateItem(selectedWorkbenchItem)}
                    disabled={executingAction}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-medium transition-colors"
                  >
                    <BrainCircuit size={13} />
                    <span>Run AI Diagnostics</span>
                  </button>
                </div>

                {/* ROOT CAUSE DISPLAY */}
                {selectedWorkbenchItem.rootCause && (
                  <div className="p-3 rounded bg-os-surface border border-os-border text-xs">
                    <span className="text-[10px] font-bold uppercase text-cyan-400 block mb-1">Diagnosed Root Cause</span>
                    <p className="text-os-text-primary">{selectedWorkbenchItem.rootCause.summary}</p>
                    <span className="text-[10px] font-mono text-os-text-muted mt-1 block">
                      Confidence: {selectedWorkbenchItem.rootCause.confidenceScore.toFixed(0)}%
                    </span>
                  </div>
                )}

                {/* DECISION OPTIONS */}
                <div>
                  <span className="text-[10px] font-bold uppercase text-os-text-muted block mb-2">Formulated Decision Options</span>
                  <div className="space-y-2">
                    {selectedWorkbenchItem.decisionOptions.map((opt) => (
                      <div key={opt.optionId} className="p-3 rounded border border-os-border bg-os-surface flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-os-text-primary">{opt.description}</div>
                          <div className="text-[9px] font-mono text-os-text-muted mt-1">
                            Cost: {formatCurrency(opt.expectedCost || 0, currency)} | Type: {opt.actionType}
                          </div>
                        </div>
                        <button
                          onClick={() => handleExecuteAction(selectedWorkbenchItem, opt.optionId)}
                          disabled={executingAction || selectedWorkbenchItem.status === 'RESOLVED'}
                          className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {selectedWorkbenchItem.status === 'RESOLVED' ? 'Executed' : 'Execute Governed Action'}
                        </button>
                      </div>
                    ))}
                    {selectedWorkbenchItem.decisionOptions.length === 0 && (
                      <div className="text-xs text-os-text-muted italic">Click "Run AI Diagnostics" to formulate options.</div>
                    )}
                  </div>
                </div>

                {/* EXECUTION RESULT */}
                {selectedWorkbenchItem.executionResult && (
                  <div className={`p-3 rounded text-xs border ${
                    selectedWorkbenchItem.executionResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    <div className="font-semibold">{selectedWorkbenchItem.executionResult.message}</div>
                    {selectedWorkbenchItem.executionResult.transactionId && (
                      <div className="text-[10px] font-mono mt-1">Transaction ID: {selectedWorkbenchItem.executionResult.transactionId}</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-os-text-muted">Select an exception from the list to inspect.</div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};
