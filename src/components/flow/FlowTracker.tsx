import React, { useState, useEffect, useMemo } from 'react';
import {
  GitCommit,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Search,
  Filter,
  Plus,
  FileText,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  X,
  Building,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  FlowPipelineType,
  FlowStatus,
  FlowTrackingRecord,
  FlowStage,
  FlowException,
  LinkedFlowDocument,
  FlowExceptionSeverity,
  FlowExceptionType,
} from '../../core/flow/FlowTrackerTypes';
import { FlowTrackerEngine, O2C_STAGES_TEMPLATE, P2P_STAGES_TEMPLATE } from '../../core/flow/FlowTrackerEngine';
import { useAuth } from '../../store/AuthContext';
import { formatCurrency } from '../../lib/formatters';

export const FlowTracker: React.FC = () => {
  const { profile, user } = useAuth();
  const tenantId = profile?.organizationId || (user as any)?.tenantId || 'tenant_default';

  const [flows, setFlows] = useState<FlowTrackingRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [pipelineFilter, setPipelineFilter] = useState<FlowPipelineType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<FlowStatus | 'ALL'>('ALL');
  const [showExceptionsOnly, setShowExceptionsOnly] = useState<boolean>(false);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState<boolean>(false);
  const [showExceptionModal, setShowExceptionModal] = useState<boolean>(false);
  const [showResolveModal, setShowResolveModal] = useState<boolean>(false);
  const [selectedException, setSelectedException] = useState<FlowException | null>(null);

  // Form states
  const [newFlowType, setNewFlowType] = useState<FlowPipelineType>('ORDER_TO_CASH');
  const [newRefNumber, setNewRefNumber] = useState<string>('');
  const [newCounterparty, setNewCounterparty] = useState<string>('');
  const [newTotalAmount, setNewTotalAmount] = useState<number>(50000);
  const [newCurrency, setNewCurrency] = useState<string>('USD');
  const [newSlaDays, setNewSlaDays] = useState<number>(7);

  // Advance stage state
  const [advanceActor, setAdvanceActor] = useState<string>('System User');
  const [advanceNotes, setAdvanceNotes] = useState<string>('');
  const [advanceDocRef, setAdvanceDocRef] = useState<string>('');
  const [advanceDocType, setAdvanceDocType] = useState<string>('DOCUMENT');

  // Exception state
  const [excSeverity, setExcSeverity] = useState<FlowExceptionSeverity>('HIGH');
  const [excType, setExcType] = useState<FlowExceptionType>('SLA_BREACH');
  const [excTitle, setExcTitle] = useState<string>('');
  const [excDesc, setExcDesc] = useState<string>('');

  // Resolve exception state
  const [resolutionNotes, setResolutionNotes] = useState<string>('');

  const engine = useMemo(() => FlowTrackerEngine.getInstance(), []);

  const loadData = async () => {
    setLoading(true);
    try {
      const records = await engine.listFlows(tenantId);
      setFlows(records);
      if (records.length > 0 && !selectedFlowId) {
        setSelectedFlowId(records[0].id);
      }
    } catch (e) {
      console.error('[FlowTracker] Failed to load flows:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const filteredFlows = useMemo(() => {
    return flows.filter((f) => {
      if (pipelineFilter !== 'ALL' && f.flowType !== pipelineFilter) return false;
      if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
      if (showExceptionsOnly && (!f.exceptions || f.exceptions.filter(e => !e.resolved).length === 0)) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesRef = f.referenceNumber.toLowerCase().includes(term);
        const matchesParty = f.counterpartyName.toLowerCase().includes(term);
        const matchesEntity = f.entityId.toLowerCase().includes(term);
        const matchesDocs = f.linkedDocuments.some(d => d.reference.toLowerCase().includes(term));
        if (!matchesRef && !matchesParty && !matchesEntity && !matchesDocs) return false;
      }
      return true;
    });
  }, [flows, pipelineFilter, statusFilter, showExceptionsOnly, searchTerm]);

  const selectedFlow = useMemo(() => {
    return flows.find((f) => f.id === selectedFlowId) || filteredFlows[0] || null;
  }, [flows, selectedFlowId, filteredFlows]);

  // Metrics
  const metrics = useMemo(() => {
    const total = flows.length;
    const inProgress = flows.filter(f => f.status === 'IN_PROGRESS').length;
    const exceptions = flows.filter(f => f.status === 'EXCEPTION' || (f.exceptions && f.exceptions.some(e => !e.resolved))).length;
    const completed = flows.filter(f => f.status === 'COMPLETED').length;
    const totalValue = flows.reduce((sum, f) => sum + (f.totalAmount || 0), 0);
    return { total, inProgress, exceptions, completed, totalValue };
  }, [flows]);

  const handleCreateFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRefNumber.trim() || !newCounterparty.trim()) return;

    try {
      const targetDate = new Date(Date.now() + newSlaDays * 86400000).toISOString();
      const created = await engine.createFlow({
        tenantId,
        flowId: `flow-${Date.now()}`,
        flowType: newFlowType,
        entityId: newRefNumber.trim(),
        referenceNumber: newRefNumber.trim(),
        counterpartyName: newCounterparty.trim(),
        currentStage: newFlowType === 'ORDER_TO_CASH' ? 'ORDER_CREATED' : 'PO_DRAFT',
        status: 'IN_PROGRESS',
        stages: [],
        exceptions: [],
        linkedDocuments: [
          {
            documentType: newFlowType === 'ORDER_TO_CASH' ? 'SALES_ORDER' : 'PURCHASE_ORDER',
            documentId: newRefNumber.trim(),
            reference: newRefNumber.trim(),
            date: new Date().toISOString(),
            status: 'INITIALIZED',
          },
        ],
        totalAmount: Number(newTotalAmount),
        currency: newCurrency,
        sla: {
          targetCompletionDate: targetDate,
          isBreached: false,
          totalDurationHours: newSlaDays * 24,
        },
      });

      setShowCreateModal(false);
      setNewRefNumber('');
      setNewCounterparty('');
      await loadData();
      setSelectedFlowId(created.id);
    } catch (err) {
      console.error('[FlowTracker] Creation error:', err);
    }
  };

  const handleAdvanceStage = async (stageId: string) => {
    if (!selectedFlow) return;
    try {
      const doc = advanceDocRef ? {
        documentType: advanceDocType,
        documentId: advanceDocRef,
        reference: advanceDocRef,
        date: new Date().toISOString(),
        status: 'ATTACHED',
      } : undefined;

      await engine.advanceFlowStage(
        tenantId,
        selectedFlow.id,
        stageId,
        advanceActor,
        advanceNotes,
        doc
      );

      setShowAdvanceModal(false);
      setAdvanceNotes('');
      setAdvanceDocRef('');
      await loadData();
    } catch (err) {
      console.error('[FlowTracker] Advance error:', err);
    }
  };

  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlow || !excTitle.trim()) return;
    try {
      await engine.recordException(tenantId, selectedFlow.id, {
        stage: selectedFlow.currentStage,
        severity: excSeverity,
        type: excType,
        title: excTitle,
        description: excDesc,
      });

      setShowExceptionModal(false);
      setExcTitle('');
      setExcDesc('');
      await loadData();
    } catch (err) {
      console.error('[FlowTracker] Exception creation error:', err);
    }
  };

  const handleResolveException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlow || !selectedException) return;
    try {
      await engine.resolveException(
        tenantId,
        selectedFlow.id,
        selectedException.id,
        profile?.fullName || (user as any)?.displayName || 'Authorized Resolver',
        resolutionNotes
      );

      setShowResolveModal(false);
      setSelectedException(null);
      setResolutionNotes('');
      await loadData();
    } catch (err) {
      console.error('[FlowTracker] Resolution error:', err);
    }
  };

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'ACTIVE':
        return <Clock className="w-5 h-5 text-sky-400 animate-pulse" />;
      case 'FAILED':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      default:
        return <GitCommit className="w-5 h-5 text-os-text-muted/40" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-os-bg text-os-text-primary p-6 space-y-6 overflow-hidden">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-os-border">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Unified Supply Chain Flow Tracker</h1>
              <p className="text-xs text-os-text-muted mt-0.5">
                Real-time event tracking, SLA enforcement & exception routing across Order-to-Cash and Procure-to-Pay pipelines.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 text-os-text-muted hover:text-os-text-primary rounded-lg border border-os-border hover:bg-os-surface transition-colors"
            title="Refresh pipeline data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Tracking Flow
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl border border-os-border bg-os-surface/40 backdrop-blur-sm">
          <div className="text-xs font-semibold text-os-text-muted uppercase">Total Pipelines</div>
          <div className="text-2xl font-bold mt-1 text-os-text-primary">{metrics.total}</div>
          <div className="text-[11px] text-os-text-muted mt-0.5">Active lifecycle items</div>
        </div>
        <div className="p-4 rounded-xl border border-sky-500/20 bg-sky-500/5 backdrop-blur-sm">
          <div className="text-xs font-semibold text-sky-400 uppercase">In Progress</div>
          <div className="text-2xl font-bold mt-1 text-sky-400">{metrics.inProgress}</div>
          <div className="text-[11px] text-sky-400/70 mt-0.5">Moving on milestones</div>
        </div>
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-sm">
          <div className="text-xs font-semibold text-rose-400 uppercase">Exceptions / Holds</div>
          <div className="text-2xl font-bold mt-1 text-rose-400">{metrics.exceptions}</div>
          <div className="text-[11px] text-rose-400/70 mt-0.5">Requires intervention</div>
        </div>
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm">
          <div className="text-xs font-semibold text-emerald-400 uppercase">Completed</div>
          <div className="text-2xl font-bold mt-1 text-emerald-400">{metrics.completed}</div>
          <div className="text-[11px] text-emerald-400/70 mt-0.5">Fully reconciled</div>
        </div>
        <div className="p-4 rounded-xl border border-os-border bg-os-surface/40 backdrop-blur-sm col-span-2 md:col-span-1">
          <div className="text-xs font-semibold text-os-text-muted uppercase">Gross Flow Value</div>
          <div className="text-2xl font-bold mt-1 text-os-text-primary">{formatCurrency(metrics.totalValue, 'USD')}</div>
          <div className="text-[11px] text-os-text-muted mt-0.5">Active transaction total</div>
        </div>
      </div>

      {/* Main Split Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Left Column: Flow List & Filters */}
        <div className="lg:col-span-5 flex flex-col h-full bg-os-surface/50 border border-os-border rounded-xl p-4 overflow-hidden">
          {/* Search & Filters */}
          <div className="space-y-3 pb-3 border-b border-os-border">
            <div className="relative">
              <Search className="w-4 h-4 text-os-text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search PO, SO, Tracking, Inv, Customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-os-bg border border-os-border rounded-lg pl-9 pr-3 py-2 text-xs text-os-text-primary placeholder:text-os-text-muted focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
              <button
                onClick={() => setPipelineFilter('ALL')}
                className={`px-2.5 py-1 rounded-md transition-colors ${pipelineFilter === 'ALL' ? 'bg-os-surface-hover text-os-text-primary font-medium' : 'text-os-text-muted hover:text-os-text-primary'}`}
              >
                All
              </button>
              <button
                onClick={() => setPipelineFilter('ORDER_TO_CASH')}
                className={`px-2.5 py-1 rounded-md transition-colors ${pipelineFilter === 'ORDER_TO_CASH' ? 'bg-sky-500/20 text-sky-400 font-medium' : 'text-os-text-muted hover:text-sky-400'}`}
              >
                Order-to-Cash
              </button>
              <button
                onClick={() => setPipelineFilter('PROCURE_TO_PAY')}
                className={`px-2.5 py-1 rounded-md transition-colors ${pipelineFilter === 'PROCURE_TO_PAY' ? 'bg-indigo-500/20 text-indigo-400 font-medium' : 'text-os-text-muted hover:text-indigo-400'}`}
              >
                Procure-to-Pay
              </button>
              <button
                onClick={() => setShowExceptionsOnly(!showExceptionsOnly)}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${showExceptionsOnly ? 'bg-rose-500/20 text-rose-400 font-medium' : 'text-os-text-muted hover:text-rose-400'}`}
              >
                <AlertTriangle className="w-3 h-3" />
                Exceptions
              </button>
            </div>
          </div>

          {/* Flow Cards List */}
          <div className="flex-1 overflow-y-auto divide-y divide-os-border/50 pr-1 mt-2">
            {loading ? (
              <div className="p-8 text-center text-xs text-os-text-muted">Loading pipeline flows...</div>
            ) : filteredFlows.length === 0 ? (
              <div className="p-8 text-center text-xs text-os-text-muted">No flows match the criteria.</div>
            ) : (
              filteredFlows.map((flow) => {
                const isSelected = selectedFlow?.id === flow.id;
                const hasUnresolvedExc = flow.exceptions && flow.exceptions.some(e => !e.resolved);
                return (
                  <div
                    key={flow.id}
                    onClick={() => setSelectedFlowId(flow.id)}
                    className={`p-3 cursor-pointer rounded-lg transition-all ${
                      isSelected
                        ? 'bg-sky-500/10 border border-sky-500/30'
                        : 'hover:bg-os-surface/80 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            flow.flowType === 'ORDER_TO_CASH'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}
                        >
                          {flow.flowType === 'ORDER_TO_CASH' ? 'O2C' : 'P2P'}
                        </span>
                        <span className="text-sm font-semibold text-os-text-primary">{flow.referenceNumber}</span>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          flow.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : flow.status === 'EXCEPTION' || hasUnresolvedExc
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {flow.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 text-xs text-os-text-muted">
                      <div className="truncate max-w-[200px]">{flow.counterpartyName}</div>
                      <div className="font-medium text-os-text-primary">{formatCurrency(flow.totalAmount, flow.currency)}</div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-os-border/40 text-[11px]">
                      <div className="text-os-text-muted">
                        Stage: <span className="text-sky-400 font-medium">{flow.currentStage.replace(/_/g, ' ')}</span>
                      </div>
                      {hasUnresolvedExc && (
                        <div className="flex items-center gap-1 text-rose-400 font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Action Required</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Flow Details & Pipeline Stepper */}
        <div className="lg:col-span-7 flex flex-col h-full bg-os-surface/50 border border-os-border rounded-xl p-5 overflow-y-auto space-y-6">
          {selectedFlow ? (
            <>
              {/* Header Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-os-border">
                <div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                        selectedFlow.flowType === 'ORDER_TO_CASH'
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      }`}
                    >
                      {selectedFlow.flowType === 'ORDER_TO_CASH' ? 'Order-to-Cash Pipeline' : 'Procure-to-Pay Pipeline'}
                    </span>
                    <h2 className="text-xl font-bold text-os-text-primary">{selectedFlow.referenceNumber}</h2>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-os-text-muted mt-2">
                    <span className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-os-text-muted" />
                      {selectedFlow.counterpartyName}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-os-text-muted" />
                      {formatCurrency(selectedFlow.totalAmount, selectedFlow.currency)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-os-text-muted" />
                      Target SLA: {new Date(selectedFlow.sla.targetCompletionDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAdvanceModal(true)}
                    className="px-3.5 py-1.5 text-xs font-medium bg-sky-500 hover:bg-sky-600 text-white rounded-lg shadow-sm transition-colors"
                  >
                    Advance Stage
                  </button>
                  <button
                    onClick={() => setShowExceptionModal(true)}
                    className="px-3.5 py-1.5 text-xs font-medium bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    Flag Hold/Variance
                  </button>
                </div>
              </div>

              {/* Visual Pipeline Progression Stepper */}
              <div>
                <h3 className="text-xs font-semibold text-os-text-muted uppercase tracking-wider mb-4">
                  Pipeline Stage Progression
                </h3>
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-os-border">
                  {selectedFlow.stages.map((stage, idx) => {
                    const isCurrent = stage.id === selectedFlow.currentStage;
                    return (
                      <div key={stage.id} className="relative flex items-start gap-4">
                        <div className="absolute -left-6 mt-0.5 bg-os-bg rounded-full ring-4 ring-os-surface">
                          {getStageIcon(stage.status)}
                        </div>

                        <div className="flex-1 bg-os-surface border border-os-border rounded-lg p-3.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-os-text-primary">{stage.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-sky-500/20 text-sky-400 rounded">
                                  Current Active
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-os-text-muted">
                              {stage.completedAt
                                ? `Completed ${new Date(stage.completedAt).toLocaleString()}`
                                : stage.startedAt
                                ? `Started ${new Date(stage.startedAt).toLocaleString()}`
                                : 'Pending'}
                            </span>
                          </div>

                          <p className="text-xs text-os-text-muted mt-1">{stage.label}</p>

                          {stage.actor && (
                            <div className="text-[11px] text-os-text-muted mt-2">
                              Actor / System: <span className="text-os-text-primary font-medium">{stage.actor}</span>
                            </div>
                          )}

                          {stage.notes && (
                            <div className="text-[11px] text-os-text-muted mt-1 bg-os-bg/50 p-2 rounded border border-os-border/50">
                              Notes: {stage.notes}
                            </div>
                          )}

                          {stage.variance && (
                            <div className="mt-2 text-[11px] p-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded flex items-center gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              <span>
                                Variance: {stage.variance.quantity ? `${stage.variance.quantity} units, ` : ''}
                                {stage.variance.delayHours ? `${stage.variance.delayHours} hrs delay, ` : ''}
                                {stage.variance.reason}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Exceptions Section */}
              {selectedFlow.exceptions && selectedFlow.exceptions.length > 0 && (
                <div className="pt-4 border-t border-os-border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" />
                      Exceptions & Variances ({selectedFlow.exceptions.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {selectedFlow.exceptions.map((exc) => (
                      <div
                        key={exc.id}
                        className={`p-3 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          exc.resolved
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-rose-500/10 border-rose-500/30'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                exc.severity === 'CRITICAL'
                                  ? 'bg-rose-600 text-white'
                                  : exc.severity === 'HIGH'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {exc.severity}
                            </span>
                            <span className="text-xs font-semibold text-os-text-primary">{exc.title}</span>
                          </div>
                          <p className="text-xs text-os-text-muted mt-1">{exc.description}</p>
                          <div className="text-[10px] text-os-text-muted mt-1">
                            Detected: {new Date(exc.detectedAt).toLocaleString()}
                            {exc.resolved && ` • Resolved by ${exc.resolvedBy}: ${exc.resolutionNotes}`}
                          </div>
                        </div>

                        {!exc.resolved && (
                          <button
                            onClick={() => {
                              setSelectedException(exc);
                              setShowResolveModal(true);
                            }}
                            className="px-3 py-1.5 text-xs font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg transition-colors whitespace-nowrap"
                          >
                            Resolve Exception
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked Documents Register */}
              <div className="pt-4 border-t border-os-border">
                <h3 className="text-xs font-semibold text-os-text-muted uppercase tracking-wider mb-3">
                  Cross-Referenced Documents
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedFlow.linkedDocuments.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-os-surface border border-os-border flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-sky-400" />
                        <div>
                          <div className="text-xs font-medium text-os-text-primary">{doc.reference}</div>
                          <div className="text-[10px] text-os-text-muted">{doc.documentType}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-os-bg border border-os-border text-os-text-muted">
                        {doc.status || 'LINKED'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-os-text-muted text-xs">
              Select a flow to inspect pipeline details
            </div>
          )}
        </div>
      </div>

      {/* CREATE FLOW MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-os-surface border border-os-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-os-border">
              <h3 className="text-base font-bold text-os-text-primary">Create New Pipeline Flow</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-os-text-muted hover:text-os-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateFlow} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-semibold text-os-text-muted block mb-1">Pipeline Architecture</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewFlowType('ORDER_TO_CASH')}
                    className={`p-2 text-xs font-medium rounded-lg border ${
                      newFlowType === 'ORDER_TO_CASH'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                        : 'bg-os-bg border-os-border text-os-text-muted'
                    }`}
                  >
                    Order-to-Cash (O2C)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewFlowType('PROCURE_TO_PAY')}
                    className={`p-2 text-xs font-medium rounded-lg border ${
                      newFlowType === 'PROCURE_TO_PAY'
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                        : 'bg-os-bg border-os-border text-os-text-muted'
                    }`}
                  >
                    Procure-to-Pay (P2P)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-os-text-muted block mb-1">
                  Primary Reference (e.g. SO-8891, PO-9912)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SO-2026-904"
                  value={newRefNumber}
                  onChange={(e) => setNewRefNumber(e.target.value)}
                  className="w-full bg-os-bg border border-os-border rounded-lg px-3 py-2 text-xs text-os-text-primary focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-os-text-muted block mb-1">
                  Counterparty (Customer / Supplier)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BioGen Scientific"
                  value={newCounterparty}
                  onChange={(e) => setNewCounterparty(e.target.value)}
                  className="w-full bg-os-bg border border-os-border rounded-lg px-3 py-2 text-xs text-os-text-primary focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-os-text-muted block mb-1">Total Value</label>
                  <input
                    type="number"
                    min="1"
                    value={newTotalAmount}
                    onChange={(e) => setNewTotalAmount(Number(e.target.value))}
                    className="w-full bg-os-bg border border-os-border rounded-lg px-3 py-2 text-xs text-os-text-primary focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-os-text-muted block mb-1">Target SLA (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={newSlaDays}
                    onChange={(e) => setNewSlaDays(Number(e.target.value))}
                    className="w-full bg-os-bg border border-os-border rounded-lg px-3 py-2 text-xs text-os-text-primary focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-os-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs text-os-text-muted hover:text-os-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white rounded-lg shadow-sm"
                >
                  Create Tracking Flow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADVANCE STAGE MODAL */}
      {showAdvanceModal && selectedFlow && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-os-surface border border-os-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-os-border">
              <h3 className="text-base font-bold text-os-text-primary">Advance Pipeline Stage</h3>
              <button onClick={() => setShowAdvanceModal(false)} className="text-os-text-muted hover:text-os-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-semibold text-os-text-muted block mb-1">Select Stage to Mark Complete</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedFlow.stages.map((stage) => (
                    <button
                      key={stage.id}
                      type="button"
                      disabled={stage.status === 'COMPLETED'}
                      onClick={() => handleAdvanceStage(stage.id)}
                      className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                        stage.status === 'COMPLETED'
                          ? 'bg-os-bg/30 border-os-border/40 text-os-text-muted/50 cursor-not-allowed'
                          : stage.id === selectedFlow.currentStage
                          ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 hover:bg-sky-500/30'
                          : 'bg-os-bg border-os-border text-os-text-primary hover:bg-os-surface-hover'
                      }`}
                    >
                      <span className="text-xs font-medium">{stage.name}</span>
                      <span className="text-[10px]">{stage.status}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-os-text-muted block mb-1">Executing Actor / System</label>
                <input
                  type="text"
                  value={advanceActor}
                  onChange={(e) => setAdvanceActor(e.target.value)}
                  className="w-full bg-os-bg border border-os-border rounded-lg px-3 py-2 text-xs text-os-text-primary focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-os-text-muted block mb-1">Audit Notes</label>
                <input
                  type="text"
                  placeholder="Optional notes for completion audit"
                  value={advanceNotes}
                  onChange={(e) => setAdvanceNotes(e.target.value)}
                  className="w-full bg-os-bg border border-os-border rounded-lg px-3 py-2 text-xs text-os-text-primary focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-os-text-muted block mb-1">Link Document Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. WAYBILL-1002"
                    value={advanceDocRef}
                    onChange={(e) => setAdvanceDocRef(e.target.value)}
                    className="w-full bg-os-bg border border-os-border rounded-lg px-3 py-2 text-xs text-os-text-primary focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-os-text-muted block mb-1">Doc Type</label>
                  <input
                    type="text"
                    value={advanceDocType}
                    onChange={(e) => setAdvanceDocType(e.target.value)}
                    className="w-full bg-os-bg border border-os-border rounded-lg px-3 py-2 text-xs text-os-text-primary focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLAG EXCEPTION MODAL */}
      {showExceptionModal && selectedFlow && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-os-surface border border-os-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-os-border">
              <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Flag Pipeline Exception / Hold
              </h3>
              <button onClick={() => setShowExceptionModal(false)} className="text-os-text-muted hover:text-os-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddException} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-os-text-muted block mb-1">Severity</label>
                  <select
                    value={excSeverity}
                    onChange={(e) => setExcSeverity(e.target.value as FlowExceptionSeverity)}
                    className="w-full bg-os-bg border border-os-border rounded-lg px-3 py-2 text-xs text-os-text-primary focus:outline-none"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-os-text-muted block mb-1">Type</label>
                  <select
                    value={excType}
                    onChange={(e) => setExcType(e.target.value as FlowExceptionType)}
                    className="w-full bg-os-bg border border-os-border rounded-lg px-3 py-2 text-xs text-os-text-primary focus:outline-none"
                  >
                    <option value="SLA_BREACH">SLA Breach</option>
                    <option value="DELIVERY_HOLD">Delivery Hold</option>
                    <option value="QUANTITY_VARIANCE">Quantity Variance</option>
                    <option value="PRICE_VARIANCE">Price Variance</option>
                    <option value="MATCHING_DISCREPANCY">Matching Discrepancy</option>
                    <option value="STUCK_MILESTONE">Stuck Milestone</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-os-text-muted block mb-1">Exception Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quantity variance on Line 1"
                  value={excTitle}
                  onChange={(e) => setExcTitle(e.target.value)}
                  className="w-full bg-os-bg border border-os-border rounded-lg px-3 py-2 text-xs text-os-text-primary focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-os-text-muted block mb-1">Details & Impact</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe root cause, impacted stage, and action needed..."
                  value={excDesc}
                  onChange={(e) => setExcDesc(e.target.value)}
                  className="w-full bg-os-bg border border-os-border rounded-lg px-3 py-2 text-xs text-os-text-primary focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-os-border">
                <button
                  type="button"
                  onClick={() => setShowExceptionModal(false)}
                  className="px-3 py-1.5 text-xs text-os-text-muted hover:text-os-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-sm"
                >
                  Log Exception
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE EXCEPTION MODAL */}
      {showResolveModal && selectedException && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-os-surface border border-os-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-os-border">
              <h3 className="text-base font-bold text-emerald-400">Resolve Exception</h3>
              <button onClick={() => setShowResolveModal(false)} className="text-os-text-muted hover:text-os-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleResolveException} className="space-y-4 mt-4">
              <div className="p-3 rounded-lg bg-os-bg border border-os-border text-xs">
                <div className="font-semibold text-os-text-primary">{selectedException.title}</div>
                <div className="text-os-text-muted mt-1">{selectedException.description}</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-os-text-muted block mb-1">Resolution Summary</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain corrective action taken, approval granted, or adjustment made..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full bg-os-bg border border-os-border rounded-lg px-3 py-2 text-xs text-os-text-primary focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-os-border">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-3 py-1.5 text-xs text-os-text-muted hover:text-os-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm"
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default FlowTracker;
