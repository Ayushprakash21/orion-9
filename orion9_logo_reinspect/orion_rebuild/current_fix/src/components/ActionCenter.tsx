import React, { useState, useMemo } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  Sparkles, 
  Shield, 
  Clock, 
  ArrowRight, 
  X, 
  Filter, 
  Search, 
  RotateCcw, 
  Check, 
  Ban, 
  BrainCircuit, 
  Activity,
  Layers
} from 'lucide-react';
import { Action } from '../types';
import { ActionEngine } from '../services/ActionEngine';

export const ActionCenter: React.FC = () => {
  const { 
    actions, 
    exceptions, 
    inventory, 
    purchaseOrders, 
    shipments, 
    suppliers,
    approveAction, 
    executeAction, 
    cancelAction, 
    auditEvents,
    userProfile,
    updateData
  } = useSupplyChain();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PROPOSED' | 'APPROVED' | 'EXECUTED' | 'CANCELLED'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [simulationActive, setSimulationActive] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'info' | 'warn'; text: string } | null>(null);

  // If actions array is empty, provide fallback generated actions from engine
  const effectiveActions: Action[] = useMemo(() => {
    if (actions && actions.length > 0) return actions;
    return ActionEngine.generateActions(exceptions, [], inventory, purchaseOrders, shipments, suppliers);
  }, [actions, exceptions, inventory, purchaseOrders, shipments, suppliers]);

  const handleRegenerateActions = async () => {
    const fresh = ActionEngine.generateActions(exceptions, [], inventory, purchaseOrders, shipments, suppliers);
    await updateData('actions', fresh);
    showNotice('info', `Regenerated ${fresh.length} autonomous action recommendations.`);
  };

  const showNotice = (type: 'success' | 'info' | 'warn', text: string) => {
    setNotificationMsg({ type, text });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const filteredActions = useMemo(() => {
    return effectiveActions.filter(act => {
      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'PROPOSED') {
          if (act.status !== 'PROPOSED' && act.status !== 'AWAITING_APPROVAL') return false;
        } else if (act.status !== statusFilter) {
          return false;
        }
      }

      // Priority filter
      if (priorityFilter !== 'ALL') {
        if (act.priority !== priorityFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesEntity = act.entity.toLowerCase().includes(q);
        const matchesIssue = act.issue.toLowerCase().includes(q);
        const matchesRec = act.recommendation.toLowerCase().includes(q);
        const matchesId = act.id.toLowerCase().includes(q);
        if (!matchesEntity && !matchesIssue && !matchesRec && !matchesId) return false;
      }

      return true;
    });
  }, [effectiveActions, statusFilter, priorityFilter, searchQuery]);

  // Statistics
  const counts = useMemo(() => {
    return {
      total: effectiveActions.length,
      proposed: effectiveActions.filter(a => a.status === 'PROPOSED' || a.status === 'AWAITING_APPROVAL').length,
      approved: effectiveActions.filter(a => a.status === 'APPROVED').length,
      executed: effectiveActions.filter(a => a.status === 'EXECUTED').length,
      cancelled: effectiveActions.filter(a => a.status === 'CANCELLED').length,
      critical: effectiveActions.filter(a => a.priority === 'CRITICAL').length
    };
  }, [effectiveActions]);

  const handleApprove = (actionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    approveAction(actionId);
    showNotice('success', `Action ${actionId} approved. Queued for execution.`);
  };

  const handleExecute = (actionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    executeAction(actionId);
    showNotice('success', `Action ${actionId} executed successfully. Entity state updated.`);
  };

  const handleCancel = (actionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    cancelAction(actionId);
    showNotice('warn', `Action ${actionId} cancelled.`);
  };

  // Filter audit events relevant to actions
  const actionAuditLogs = useMemo(() => {
    return auditEvents.filter(ev => 
      ev.eventType === 'ACTION_APPROVED' || 
      ev.eventType === 'ACTION_EXECUTED' || 
      ev.eventType === 'ACTION_CANCELLED' ||
      ev.eventType === 'APPROVED' ||
      ev.eventType === 'REJECTED'
    );
  }, [auditEvents]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-[1680px] mx-auto box-border min-w-0">
      {/* Toast Notification Banner */}
      {notificationMsg && (
        <div className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between transition-all ${
          notificationMsg.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
            : notificationMsg.type === 'warn'
            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
        }`}>
          <div className="flex items-center gap-2">
            {notificationMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{notificationMsg.text}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-current opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-os-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded">
              CONTROL PLANE
            </span>
            <span className="text-xs font-mono text-os-text-muted">AUTONOMOUS DISPATCH ENGINE</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">ORION Action Center</h1>
          <p className="text-xs text-os-text-secondary mt-1">
            Prioritized operational interventions, automatic exception mitigations, and policy-governed approval workflows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRegenerateActions}
            className="px-3 py-1.5 bg-os-surface hover:bg-os-surface-hover border border-os-border text-os-text-primary text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            title="Re-evaluate supply chain state and generate fresh autonomous actions"
          >
            <RotateCcw size={13} />
            <span>Re-evaluate Actions</span>
          </button>
        </div>
      </div>

      {/* Metric Quick Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div 
          onClick={() => setStatusFilter('ALL')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${statusFilter === 'ALL' ? 'bg-os-surface-elevated border-cyan-500/40 shadow-sm' : 'bg-os-surface border-os-border hover:border-os-border-hover'}`}
        >
          <div className="text-[10px] uppercase font-mono text-os-text-muted">Total Actions</div>
          <div className="text-xl font-bold text-os-text-primary mt-1">{counts.total}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('PROPOSED')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${statusFilter === 'PROPOSED' ? 'bg-amber-500/10 border-amber-500/40 shadow-sm' : 'bg-os-surface border-os-border hover:border-os-border-hover'}`}
        >
          <div className="text-[10px] uppercase font-mono text-amber-400">Awaiting Review</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{counts.proposed}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('APPROVED')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${statusFilter === 'APPROVED' ? 'bg-cyan-500/10 border-cyan-500/40 shadow-sm' : 'bg-os-surface border-os-border hover:border-os-border-hover'}`}
        >
          <div className="text-[10px] uppercase font-mono text-cyan-400">Approved</div>
          <div className="text-xl font-bold text-cyan-400 mt-1">{counts.approved}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('EXECUTED')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${statusFilter === 'EXECUTED' ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm' : 'bg-os-surface border-os-border hover:border-os-border-hover'}`}
        >
          <div className="text-[10px] uppercase font-mono text-emerald-400">Executed</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{counts.executed}</div>
        </div>

        <div 
          onClick={() => setPriorityFilter(priorityFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${priorityFilter === 'CRITICAL' ? 'bg-red-500/10 border-red-500/40 shadow-sm' : 'bg-os-surface border-os-border hover:border-os-border-hover'}`}
        >
          <div className="text-[10px] uppercase font-mono text-red-400">Critical Priority</div>
          <div className="text-xl font-bold text-red-400 mt-1">{counts.critical}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('CANCELLED')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${statusFilter === 'CANCELLED' ? 'bg-os-surface-elevated border-os-border shadow-sm' : 'bg-os-surface border-os-border hover:border-os-border-hover'}`}
        >
          <div className="text-[10px] uppercase font-mono text-os-text-muted">Cancelled</div>
          <div className="text-xl font-bold text-os-text-muted mt-1">{counts.cancelled}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-os-surface p-3 rounded-xl border border-os-border">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-os-text-muted" />
            <input 
              type="text"
              placeholder="Search by entity (PO, SKU, SHP), issue, or recommendation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-os-bg border border-os-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-os-text-primary focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-mono text-os-text-muted flex items-center gap-1 shrink-0">
            <Filter size={12} /> Status:
          </span>
          {(['ALL', 'PROPOSED', 'APPROVED', 'EXECUTED', 'CANCELLED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors shrink-0 ${
                statusFilter === st 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' 
                  : 'bg-os-bg text-os-text-secondary hover:bg-os-surface-hover'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Action Queue (2 cols), Right Autopilot Execution Log & Policy (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Items List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredActions.length === 0 ? (
            <div className="p-12 text-center bg-os-surface border border-os-border rounded-xl">
              <CheckCircle2 className="mx-auto text-emerald-400 mb-3" size={32} />
              <h3 className="text-sm font-semibold text-os-text-primary">No Matching Actions</h3>
              <p className="text-xs text-os-text-muted mt-1">
                {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                  ? 'Adjust your filter criteria to inspect other operational records.'
                  : 'All supply chain pathways are operating within policy tolerances.'}
              </p>
            </div>
          ) : (
            filteredActions.map((action) => {
              const isProposed = action.status === 'PROPOSED' || action.status === 'AWAITING_APPROVAL';
              const isApproved = action.status === 'APPROVED';
              const isExecuted = action.status === 'EXECUTED';
              const isCancelled = action.status === 'CANCELLED';

              return (
                <div 
                  key={action.id}
                  onClick={() => setSelectedAction(action)}
                  className="bg-os-surface border border-os-border hover:border-cyan-500/40 rounded-xl p-5 transition-all cursor-pointer space-y-4 shadow-sm"
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        action.priority === 'CRITICAL' ? 'bg-red-500 animate-pulse' :
                        action.priority === 'HIGH' ? 'bg-amber-500' :
                        action.priority === 'MEDIUM' ? 'bg-cyan-400' : 'bg-emerald-400'
                      }`} />
                      <span className="font-mono text-xs font-bold text-os-text-primary">{action.id}</span>
                      <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-os-surface-secondary border border-os-border text-cyan-400">
                        {action.entity}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded ${
                        action.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                        action.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                        'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      }`}>
                        {action.priority}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded ${
                        isExecuted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        isApproved ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' :
                        isCancelled ? 'bg-os-surface text-os-text-muted border border-os-border' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {action.status}
                      </span>
                    </div>
                  </div>

                  {/* Issue & Recommendation */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-os-text-primary leading-snug">
                      {action.issue}
                    </h3>
                    <div className="p-3 bg-os-surface-secondary rounded-lg border border-os-border/70 text-xs">
                      <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[10px] uppercase mb-1">
                        <Sparkles size={12} /> Autonomous Recommendation
                      </div>
                      <p className="text-os-text-secondary leading-relaxed font-medium">
                        {action.recommendation}
                      </p>
                    </div>
                  </div>

                  {/* Meta / Metrics Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-os-bg p-2.5 rounded-lg border border-os-border/50">
                    <div>
                      <span className="text-os-text-muted block text-[10px]">Impact Exposure</span>
                      <span className="font-mono font-medium text-red-400">{action.impact}</span>
                    </div>
                    <div>
                      <span className="text-os-text-muted block text-[10px]">Confidence</span>
                      <span className="font-mono font-medium text-cyan-400">{action.confidence || 'HIGH'}</span>
                    </div>
                    <div>
                      <span className="text-os-text-muted block text-[10px]">Policy Gate</span>
                      <span className="font-mono text-os-text-secondary truncate block">Level 4 Autopilot</span>
                    </div>
                    <div>
                      <span className="text-os-text-muted block text-[10px]">Target Entity</span>
                      <span className="font-mono text-os-text-primary truncate block">{action.entity}</span>
                    </div>
                  </div>

                  {/* Operational Action Buttons Toolbar */}
                  <div className="flex items-center justify-between pt-2 border-t border-os-border/60">
                    <div className="text-[11px] text-os-text-muted flex items-center gap-1.5 font-mono">
                      <Clock size={12} />
                      <span>Created: {new Date(action.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {isProposed && (
                        <>
                          <button
                            onClick={(e) => handleCancel(action.id, e)}
                            className="px-2.5 py-1.5 bg-os-surface-hover hover:bg-os-surface border border-os-border text-red-400 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                            title="Reject/Cancel this action"
                          >
                            <Ban size={12} /> Cancel
                          </button>
                          <button
                            onClick={(e) => handleApprove(action.id, e)}
                            className="px-3 py-1.5 bg-os-surface-hover hover:bg-os-surface border border-os-border text-cyan-400 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            onClick={(e) => handleExecute(action.id, e)}
                            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <Play size={12} /> Execute Now
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <>
                          <button
                            onClick={(e) => handleCancel(action.id, e)}
                            className="px-2.5 py-1.5 bg-os-surface-hover hover:bg-os-surface border border-os-border text-red-400 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Ban size={12} /> Revoke
                          </button>
                          <button
                            onClick={(e) => handleExecute(action.id, e)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <Play size={12} /> Dispatch Execution
                          </button>
                        </>
                      )}

                      {isExecuted && (
                        <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                          <CheckCircle2 size={14} /> Executed & State Mutated
                        </span>
                      )}

                      {isCancelled && (
                        <span className="text-xs font-mono text-os-text-muted flex items-center gap-1.5 bg-os-surface px-3 py-1.5 rounded-lg border border-os-border">
                          <Ban size={14} /> Cancelled
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Execution Stream & Autopilot Policies */}
        <div className="space-y-6">
          {/* Autopilot Execution Stream */}
          <div className="bg-os-surface border border-os-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-os-border pb-3">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-cyan-400" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-os-text-primary font-bold">
                  Autopilot Execution Stream
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                AUDIT LOG
              </span>
            </div>

            {actionAuditLogs.length === 0 ? (
              <div className="text-center py-8">
                <Clock size={28} className="mx-auto text-os-text-muted opacity-30 mb-2" />
                <p className="text-xs text-os-text-muted">No state mutations logged yet.</p>
                <p className="text-[11px] text-os-text-secondary mt-1">
                  Approve or execute actions above to record persistent operational audit events.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto font-mono text-[11px]">
                {actionAuditLogs.map((log) => (
                  <div key={log.id} className="p-2.5 bg-os-surface-secondary rounded-lg border border-os-border/70 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`font-bold ${
                        log.eventType === 'ACTION_EXECUTED' ? 'text-emerald-400' :
                        log.eventType === 'ACTION_APPROVED' || log.eventType === 'APPROVED' ? 'text-cyan-400' :
                        'text-red-400'
                      }`}>
                        {log.eventType}
                      </span>
                      <span className="text-os-text-muted">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-os-text-primary text-xs font-medium">
                      Target: {log.decisionId}
                    </div>
                    <div className="text-os-text-secondary text-[10px]">
                      Actor: {log.actor}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Autonomy & Policy Compliance Controls */}
          <div className="bg-os-surface border border-os-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-os-border pb-3">
              <Shield size={16} className="text-cyan-400" />
              <h3 className="text-xs font-mono uppercase tracking-wider text-os-text-primary font-bold">
                Autonomy Engine Policy
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-os-border/60">
                <span className="text-os-text-secondary">Autopilot Level</span>
                <span className="font-mono text-cyan-400 font-bold">L4 Operational Autonomy</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-os-border/60">
                <span className="text-os-text-secondary">Auto-Execution Financial Cap</span>
                <span className="font-mono text-os-text-primary">₹500,000 / event</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-os-border/60">
                <span className="text-os-text-secondary">Safety Stock Tolerance</span>
                <span className="font-mono text-emerald-400">±2.5 Days Buffer</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-os-border/60">
                <span className="text-os-text-secondary">Dual-Operator Authorization</span>
                <span className="font-mono text-os-text-primary">Required for Supplier Swaps</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-os-text-secondary">Autonomous Lead Time Drift</span>
                <span className="font-mono text-amber-400">Alert at &gt;48 hrs deviation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Action Deep-Dive Drawer / Modal */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-os-surface border border-os-border rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-os-border pb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-cyan-400" />
                <div>
                  <h3 className="text-base font-bold text-os-text-primary">Action Intelligence Analysis</h3>
                  <p className="text-xs text-os-text-muted font-mono">{selectedAction.id} • Entity: {selectedAction.entity}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedAction(null);
                  setSimulationActive(false);
                }}
                className="text-os-text-muted hover:text-os-text-primary p-1.5 rounded-lg hover:bg-os-surface-hover"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs">
              <div className="bg-os-surface-secondary p-3.5 rounded-lg border border-os-border space-y-1">
                <span className="text-[10px] font-mono text-os-text-muted uppercase">Operational Issue</span>
                <p className="text-sm font-semibold text-os-text-primary">{selectedAction.issue}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-os-surface-secondary rounded-lg border border-os-border space-y-1">
                  <span className="text-[10px] font-mono text-os-text-muted uppercase">Root Cause (Why)</span>
                  <p className="text-os-text-primary font-medium">{selectedAction.reason || 'Pattern anomaly detected by SCM engine.'}</p>
                </div>
                <div className="p-3 bg-os-surface-secondary rounded-lg border border-os-border space-y-1">
                  <span className="text-[10px] font-mono text-os-text-muted uppercase">Evidence Data</span>
                  <p className="text-os-text-primary font-medium">{selectedAction.evidence || 'Historical variance & lead-time deviation logs.'}</p>
                </div>
              </div>

              <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold flex items-center gap-1">
                    <BrainCircuit size={14} /> Autonomous Recommendation
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                    Confidence: {selectedAction.confidence || 'HIGH'}
                  </span>
                </div>
                <p className="text-sm font-medium text-cyan-300 leading-relaxed">
                  {selectedAction.recommendation}
                </p>
              </div>

              {/* What-If Simulation Inline Card */}
              <div className="border border-os-border rounded-lg p-3.5 bg-os-bg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-os-text-primary flex items-center gap-1.5">
                    <BrainCircuit size={14} className="text-cyan-400" />
                    What-If Risk Mitigation Simulation
                  </span>
                  <button
                    onClick={() => setSimulationActive(!simulationActive)}
                    className="px-2.5 py-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded"
                  >
                    {simulationActive ? 'Reset Simulation' : 'Run What-If Simulation'}
                  </button>
                </div>

                {simulationActive ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs space-y-1 animate-in fade-in duration-150">
                    <div className="font-bold flex items-center gap-1">
                      <CheckCircle2 size={14} /> Simulation Completed:
                    </div>
                    <p>• Estimated financial exposure reduction: {selectedAction.impact}</p>
                    <p>• Post-execution risk rating: LOW (Residual stockout probability: &lt;1.8%)</p>
                    <p>• Predicted service level recovery: +4.2% within 72 hours</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-os-text-muted">
                    Click "Run What-If Simulation" to project risk mitigation, residual variance, and financial recovery before confirming execution.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-os-border">
              <button
                onClick={() => {
                  setSelectedAction(null);
                  setSimulationActive(false);
                }}
                className="px-4 py-2 bg-os-surface-hover hover:bg-os-surface border border-os-border text-os-text-primary text-xs font-medium rounded-lg"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {selectedAction.status !== 'EXECUTED' && selectedAction.status !== 'CANCELLED' && (
                  <button
                    onClick={() => {
                      handleCancel(selectedAction.id);
                      setSelectedAction(null);
                    }}
                    className="px-3.5 py-2 bg-os-surface border border-os-border text-red-400 hover:bg-red-500/10 text-xs font-medium rounded-lg"
                  >
                    Cancel Action
                  </button>
                )}

                {(selectedAction.status === 'PROPOSED' || selectedAction.status === 'AWAITING_APPROVAL') && (
                  <button
                    onClick={() => {
                      handleApprove(selectedAction.id);
                      setSelectedAction(null);
                    }}
                    className="px-4 py-2 bg-os-surface-elevated border border-os-border text-cyan-400 hover:bg-os-surface-hover text-xs font-medium rounded-lg"
                  >
                    Approve
                  </button>
                )}

                {selectedAction.status !== 'EXECUTED' && selectedAction.status !== 'CANCELLED' && (
                  <button
                    onClick={() => {
                      handleExecute(selectedAction.id);
                      setSelectedAction(null);
                    }}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <Play size={12} /> Execute Action
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
