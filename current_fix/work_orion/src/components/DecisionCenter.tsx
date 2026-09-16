import React, { useState, useMemo } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { 
  BrainCircuit, 
  AlertTriangle, 
  GitBranch, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter,
  Check,
  Ban,
  Clock,
  Shield,
  FileText,
  User,
  History
} from 'lucide-react';
import { Decision } from '../types';

export const DecisionCenter: React.FC = () => {
  const { decisions, approveDecision, rejectDecision, userProfile } = useSupplyChain();
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved'>('pending');
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [operatorComment, setOperatorComment] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const pendingDecisions = useMemo(() => {
    return decisions.filter(d => d.status === 'READY_FOR_REVIEW' || d.status === 'ANALYZING');
  }, [decisions]);

  const pastDecisions = useMemo(() => {
    return decisions.filter(d => d.status !== 'READY_FOR_REVIEW' && d.status !== 'ANALYZING');
  }, [decisions]);

  const currentList = activeTab === 'pending' ? pendingDecisions : pastDecisions;

  // Derive active decision
  const selectedDecision = useMemo(() => {
    if (selectedDecisionId) {
      const found = decisions.find(d => d.id === selectedDecisionId);
      if (found) return found;
    }
    return currentList.length > 0 ? currentList[0] : null;
  }, [selectedDecisionId, decisions, currentList]);

  // Sync selectedOptionId when decision changes
  React.useEffect(() => {
    if (selectedDecision) {
      setSelectedOptionId(selectedDecision.recommendedOptionId || (selectedDecision.options[0]?.id ?? ''));
    }
  }, [selectedDecision?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApprove = () => {
    if (!selectedDecision) return;
    const actor = userProfile?.fullName || 'Senior Operations Lead';
    approveDecision(selectedDecision.id, selectedOptionId, actor, operatorComment || 'Approved in Decision Engine');
    showToast(`Decision ${selectedDecision.id} approved successfully.`);
    setOperatorComment('');
  };

  const handleReject = () => {
    if (!selectedDecision) return;
    const actor = userProfile?.fullName || 'Senior Operations Lead';
    rejectDecision(selectedDecision.id, actor, operatorComment || 'Declined by operations controller');
    showToast(`Decision ${selectedDecision.id} rejected.`);
    setOperatorComment('');
  };

  return (
    <div className="flex flex-col bg-os-bg text-os-text-primary px-4 sm:px-6 lg:px-8 xl:px-10 py-6 w-full max-w-[1680px] mx-auto box-border min-h-full min-w-0 space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-current opacity-70 hover:opacity-100">
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-os-border pb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-os-text-secondary text-xs mb-1 font-mono">
            <BrainCircuit size={14} className="text-cyan-400" />
            <span>INTELLIGENCE</span>
            <span>/</span>
            <span className="text-os-text-primary">AUTONOMOUS DECISION ENGINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-os-text-primary tracking-tight">
            Decision Center
          </h1>
          <p className="text-xs text-os-text-secondary mt-1">
            Simulate multi-variable trade-offs, evaluate cost/benefit models, and record policy-governed executive decisions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-os-surface border border-os-border rounded-lg p-1">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold'
                  : 'text-os-text-secondary hover:text-os-text-primary'
              }`}
            >
              <span>Pending Review</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded bg-os-bg font-mono">
                {pendingDecisions.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'resolved'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold'
                  : 'text-os-text-secondary hover:text-os-text-primary'
              }`}
            >
              <span>Resolved Archive</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded bg-os-bg font-mono">
                {pastDecisions.length}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Decision Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left List Column */}
        <div className="lg:col-span-4 flex flex-col bg-os-surface border border-os-border rounded-xl overflow-hidden min-h-[460px]">
          <div className="p-4 border-b border-os-border bg-os-surface-secondary flex justify-between items-center">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-os-text-primary">
              {activeTab === 'pending' ? 'PENDING DECISIONS' : 'HISTORICAL DECISIONS'}
            </h2>
            <div className="px-2 py-0.5 rounded text-[10px] font-mono bg-os-surface border border-os-border text-cyan-400">
              {currentList.length} ITEMS
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[720px]">
            {currentList.map(d => {
              const isSelected = selectedDecision?.id === d.id;
              const isResolved = d.status === 'APPROVED' || d.status === 'REJECTED';

              return (
                <div 
                  key={d.id}
                  onClick={() => setSelectedDecisionId(d.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 ${
                    isSelected 
                      ? 'bg-os-surface-elevated border-cyan-500/50 shadow-sm' 
                      : 'bg-os-bg border-os-border hover:border-cyan-500/30'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                        d.severity === 'CRITICAL' ? 'text-red-400 bg-red-400/10 border border-red-400/20' :
                        d.severity === 'HIGH' ? 'text-amber-400 bg-amber-400/10 border border-amber-400/20' :
                        'text-cyan-400 bg-cyan-400/10 border border-cyan-400/20'
                      }`}>
                        {d.severity}
                      </span>
                      <span className="text-[10px] font-mono text-os-text-muted">{d.id}</span>
                    </div>

                    <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      d.status === 'APPROVED' ? 'text-emerald-400 bg-emerald-400/10' :
                      d.status === 'REJECTED' ? 'text-red-400 bg-red-400/10' :
                      'text-os-text-muted bg-os-surface'
                    }`}>
                      {d.status}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-os-text-primary line-clamp-1">{d.title}</h3>
                  <p className="text-[11px] text-os-text-secondary line-clamp-2 leading-relaxed">{d.issue}</p>

                  <div className="flex items-center justify-between text-[10px] text-os-text-muted pt-1 border-t border-os-border/50">
                    <span>Entity: {d.entityId}</span>
                    <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}

            {currentList.length === 0 && (
              <div className="p-8 text-center text-os-text-muted text-xs">
                <BrainCircuit size={32} className="mx-auto opacity-30 mb-2" />
                <p>No decisions in this category.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Detail Column */}
        <div className="lg:col-span-8 flex flex-col bg-os-surface border border-os-border rounded-xl overflow-hidden min-h-[500px]">
          {selectedDecision ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Detail Header */}
              <div className="p-6 border-b border-os-border bg-os-surface shrink-0 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-cyan-400">{selectedDecision.id}</span>
                      <span className="text-xs text-os-text-muted">•</span>
                      <span className="text-xs font-mono text-os-text-secondary">Entity: {selectedDecision.entityId}</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-os-text-primary">{selectedDecision.title}</h2>
                    <p className="text-xs text-os-text-secondary mt-1 max-w-2xl">{selectedDecision.issue}</p>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end gap-2 shrink-0">
                    <span className="text-[10px] text-os-text-muted uppercase tracking-wider font-mono">Model Confidence</span>
                    <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                      selectedDecision.confidence === 'HIGH' ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' :
                      selectedDecision.confidence === 'MEDIUM' ? 'text-amber-400 border-amber-400/30 bg-amber-400/10' :
                      'text-red-400 border-red-400/30 bg-red-400/10'
                    }`}>
                      {selectedDecision.confidence} CONFIDENCE
                    </span>
                  </div>
                </div>

                {/* Resolution Badge if already Approved or Rejected */}
                {(selectedDecision.status === 'APPROVED' || selectedDecision.status === 'REJECTED') && (
                  <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                    selectedDecision.status === 'APPROVED' 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      {selectedDecision.status === 'APPROVED' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      <span>
                        <strong>{selectedDecision.status}</strong> by {selectedDecision.approval?.approvedBy || 'Operator'} on {selectedDecision.approval?.approvedAt ? new Date(selectedDecision.approval.approvedAt).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    {selectedDecision.approval?.comment && (
                      <span className="italic text-[11px] opacity-80">"{selectedDecision.approval.comment}"</span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Detail Content Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[640px]">
                {/* Evidence & Root Cause Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Evidence Card */}
                  <div className="bg-os-surface-secondary border border-os-border rounded-xl p-4 space-y-3">
                    <h3 className="text-xs uppercase tracking-wider text-os-text-primary font-mono font-bold flex items-center gap-1.5">
                      <Search size={14} className="text-cyan-400" /> Evidence Logs
                    </h3>
                    <div className="space-y-2">
                      {selectedDecision.evidence.map((e, idx) => (
                        <div key={idx} className="bg-os-bg border border-os-border/70 rounded-lg p-2.5 text-xs space-y-1">
                          <p className="text-os-text-primary font-medium">{e.description}</p>
                          <div className="flex items-center justify-between text-[10px] text-os-text-muted font-mono">
                            <span>Source: {e.sourceType}</span>
                            <span>ID: {e.sourceId}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Root Cause Card */}
                  <div className="bg-os-surface-secondary border border-os-border rounded-xl p-4 space-y-3">
                    <h3 className="text-xs uppercase tracking-wider text-os-text-primary font-mono font-bold flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-amber-400" /> Root Cause Diagnosis
                    </h3>
                    <div className="bg-os-bg border border-os-border/70 rounded-lg p-3 text-xs space-y-2">
                      <div>
                        <span className="text-os-text-muted text-[10px] uppercase font-mono block">Primary Cause</span>
                        <p className="text-os-text-primary font-semibold mt-0.5">{selectedDecision.rootCause.primaryCause}</p>
                      </div>
                      {selectedDecision.rootCause.contributingFactors.length > 0 && (
                        <div className="pt-2 border-t border-os-border/50">
                          <span className="text-os-text-muted text-[10px] uppercase font-mono block mb-1">Contributing Dynamics</span>
                          <ul className="list-disc pl-4 text-xs text-os-text-secondary space-y-1">
                            {selectedDecision.rootCause.contributingFactors.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Options & Trade-Off Simulation */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-wider text-os-text-primary font-mono font-bold flex items-center gap-1.5">
                      <GitBranch size={14} className="text-cyan-400" /> Options & Trade-off Simulations
                    </h3>
                    <span className="text-[11px] text-os-text-muted">
                      Select an option below to approve or simulate
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedDecision.options.map(opt => {
                      const isRecommended = opt.id === selectedDecision.recommendedOptionId;
                      const isChosen = selectedOptionId === opt.id;
                      const isReady = selectedDecision.status === 'READY_FOR_REVIEW';

                      return (
                        <div 
                          key={opt.id}
                          onClick={() => isReady && setSelectedOptionId(opt.id)}
                          className={`border rounded-xl p-4 transition-all relative ${
                            isChosen 
                              ? 'bg-cyan-500/5 border-cyan-500/60 shadow-sm' 
                              : isRecommended 
                              ? 'bg-os-surface-secondary border-cyan-500/30' 
                              : 'bg-os-bg border-os-border'
                          } ${isReady ? 'cursor-pointer hover:border-cyan-500/50' : ''}`}
                        >
                          {isRecommended && (
                            <div className="absolute top-3 right-3 bg-cyan-500 text-black text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                              AI Recommended
                            </div>
                          )}

                          <div className="flex items-start gap-3">
                            {isReady && (
                              <input 
                                type="radio" 
                                name="decision-option" 
                                checked={isChosen} 
                                onChange={() => setSelectedOptionId(opt.id)}
                                className="mt-1 accent-cyan-400 cursor-pointer"
                              />
                            )}

                            <div className="flex-1 space-y-3">
                              <div className="flex justify-between items-start pr-20">
                                <div>
                                  <h4 className="text-sm font-bold text-os-text-primary">{opt.name}</h4>
                                  <p className="text-xs text-os-text-secondary mt-0.5">{opt.description}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-3 border-t border-os-border/60">
                                <div className="bg-os-surface p-2 rounded-lg border border-os-border/50">
                                  <span className="text-os-text-muted text-[10px] uppercase font-mono block">Estimated Cost</span>
                                  <span className="text-os-text-primary font-mono font-semibold">₹{opt.cost.toLocaleString()}</span>
                                </div>
                                <div className="bg-os-surface p-2 rounded-lg border border-os-border/50">
                                  <span className="text-os-text-muted text-[10px] uppercase font-mono block">Projected Benefit</span>
                                  <span className="text-os-text-primary font-medium truncate block">{opt.benefit}</span>
                                </div>
                                <div className="bg-os-surface p-2 rounded-lg border border-os-border/50">
                                  <span className="text-os-text-muted text-[10px] uppercase font-mono block">Algorithm Score</span>
                                  <span className="text-cyan-400 font-mono font-bold">{opt.score}/100</span>
                                </div>
                                <div className="bg-os-surface p-2 rounded-lg border border-os-border/50">
                                  <span className="text-os-text-muted text-[10px] uppercase font-mono block">Exposure Delta</span>
                                  <span className={`font-mono font-semibold ${opt.simulationResult.delta.exposureDelta < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {opt.simulationResult.delta.exposureDelta < 0 ? '-' : '+'}₹{Math.abs(opt.simulationResult.delta.exposureDelta).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Audit Trail & History Log */}
                {selectedDecision.auditTrail && selectedDecision.auditTrail.length > 0 && (
                  <div className="bg-os-surface-secondary border border-os-border rounded-xl p-4 space-y-2">
                    <h3 className="text-xs uppercase tracking-wider text-os-text-primary font-mono font-bold flex items-center gap-1.5">
                      <History size={14} className="text-os-text-muted" /> Decision Audit Trail
                    </h3>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto font-mono text-[11px] text-os-text-secondary">
                      {selectedDecision.auditTrail.map((trail, idx) => (
                        <div key={idx} className="p-2 bg-os-bg border border-os-border rounded">
                          {trail}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Bottom Action / Approval Toolbar */}
              <div className="p-4 border-t border-os-border bg-os-surface flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                {selectedDecision.status === 'READY_FOR_REVIEW' ? (
                  <>
                    <div className="flex-1 max-w-md">
                      <input 
                        type="text"
                        placeholder="Optional operator approval comment / rationale..."
                        value={operatorComment}
                        onChange={(e) => setOperatorComment(e.target.value)}
                        className="w-full bg-os-bg border border-os-border rounded-lg px-3 py-1.5 text-xs text-os-text-primary focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={handleReject}
                        className="px-4 py-2 text-xs font-medium text-red-400 bg-os-surface border border-os-border rounded-lg hover:bg-red-500/10 transition-colors flex items-center gap-1"
                      >
                        <Ban size={13} /> Reject Decision
                      </button>
                      <button 
                        onClick={handleApprove}
                        className="px-5 py-2 text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                      >
                        <Check size={14} /> Approve Selected Option
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between w-full text-xs font-mono text-os-text-muted">
                    <span>STATUS: {selectedDecision.status}</span>
                    <span>No further review required for archived decisions.</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-os-text-muted p-8">
              <BrainCircuit size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">Select a decision from the list to inspect trade-offs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
