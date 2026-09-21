/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE + ENTERPRISE LEARNING + PRODUCTION CONTROL PLANE
 * Learning Center UI Component
 * 
 * Manages systemic learning signals, governed improvement proposals, and human authorization.
 * STRICT ENFORCEMENT: AI Agents cannot approve improvement proposals.
 */

import React, { useState, useEffect } from 'react';
import {
  OutcomeLearningSignal,
  ImprovementProposal,
} from '../../outcomes/types';
import {
  LearningSignalEngine,
  ImprovementProposalEngine,
  IntelligenceVersionEngine,
} from '../../outcomes';
import {
  Brain,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Send,
  PlusCircle,
  FileCode,
  ShieldCheck,
} from 'lucide-react';

export const LearningCenter: React.FC<{
  tenantId?: string;
  userRole?: string;
  currentUserId?: string;
  isAIAgent?: boolean;
}> = ({
  tenantId = 'TENANT_A',
  userRole = 'platform_admin',
  currentUserId = 'admin-user-01',
  isAIAgent = false,
}) => {
  const [activeTab, setActiveTab] = useState<'SIGNALS' | 'PROPOSALS'>('SIGNALS');
  const [signals, setSignals] = useState<OutcomeLearningSignal[]>([]);
  const [proposals, setProposals] = useState<ImprovementProposal[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Proposal modal state
  const [selectedSignal, setSelectedSignal] = useState<OutcomeLearningSignal | null>(null);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDesc, setProposalDesc] = useState('');
  const [leadTimeAdjustment, setLeadTimeAdjustment] = useState<number>(1.5);
  const [costCapAdjustment, setCostCapAdjustment] = useState<number>(10.0);

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = () => {
    const signalEngine = LearningSignalEngine.getInstance();
    const proposalEngine = ImprovementProposalEngine.getInstance();

    let sigs = signalEngine.listSignals(tenantId);
    if (sigs.length === 0) {
      // Seed demonstrative learning signal
      const sig1 = signalEngine.emitSignal({
        tenantId,
        metric: 'LEAD_TIME_UNDERESTIMATION',
        driftMagnitudePct: 18.5,
        sampleSize: 42,
        status: 'REVIEW_REQUIRED',
        recommendedAction: 'Adjust standard transpacific ocean transit buffer by +1.8 days to reflect port congestion.',
        detectedBy: 'SYSTEM_LEARNING_ENGINE',
      });

      const sig2 = signalEngine.emitSignal({
        tenantId,
        metric: 'SUPPLIER_FILL_RATE_DRIFT',
        driftMagnitudePct: 12.0,
        sampleSize: 28,
        status: 'REVIEW_REQUIRED',
        recommendedAction: 'Increase safety stock reorder point for SKU-ELECTRONICS-09 by 15%.',
        detectedBy: 'SYSTEM_LEARNING_ENGINE',
      });

      sigs = [sig1, sig2];
    }

    let props = proposalEngine.listProposals(tenantId);
    if (props.length === 0 && sigs.length > 0) {
      const prop1 = proposalEngine.createProposal({
        tenantId,
        signalId: sigs[0].signalId,
        title: 'Recalibrate Transpacific Lead Time Buffer',
        description: 'Update base transit model parameter from 14.0 to 15.8 days based on 42 verified shipments.',
        proposalType: 'SUPPLIER_LEAD_TIME_ADJUSTMENT',
        proposedChanges: { leadTimeBufferDays: 1.8, targetRoute: 'CN_SHA_TO_US_LAX' },
        baselineParameters: { leadTimeBufferDays: 0, targetRoute: 'CN_SHA_TO_US_LAX' },
        expectedImpact: { otifImprovementPct: 4.2, costReductionAnnualized: 45000, riskReductionPct: 22 },
        createdBy: currentUserId,
      });
      props = [prop1];
    }

    setSignals(sigs);
    setProposals(props);
  };

  const handleOpenProposalModal = (sig: OutcomeLearningSignal) => {
    setSelectedSignal(sig);
    setProposalTitle(`Proposal: Resolve ${sig.metric}`);
    setProposalDesc(sig.recommendedAction);
  };

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSignal) return;

    const proposalEngine = ImprovementProposalEngine.getInstance();
    proposalEngine.createProposal({
      tenantId,
      signalId: selectedSignal.signalId,
      title: proposalTitle,
      description: proposalDesc,
      proposalType: 'SUPPLIER_LEAD_TIME_ADJUSTMENT',
      proposedChanges: { leadTimeBufferDays: leadTimeAdjustment, costCapPct: costCapAdjustment },
      baselineParameters: { leadTimeBufferDays: 0, costCapPct: 0 },
      expectedImpact: {
        otifImprovementPct: 3.5,
        costReductionAnnualized: 30000,
        riskReductionPct: 18,
      },
      createdBy: currentUserId,
    });

    setSelectedSignal(null);
    setFeedbackMsg({ text: 'Improvement proposal created successfully in PENDING_APPROVAL status.', isError: false });
    loadData();
  };

  const handleReviewProposal = (proposalId: string, action: 'APPROVED' | 'REJECTED') => {
    const proposalEngine = ImprovementProposalEngine.getInstance();
    const result = proposalEngine.reviewProposal({
      tenantId,
      proposalId,
      reviewedBy: currentUserId,
      userRole,
      isAIAgent,
      action,
      justification: action === 'APPROVED'
        ? 'Verified against 30-day historical outcome variances and simulation blast-radius checks.'
        : 'Proposal rejected due to risk profile exceeding threshold.',
    });

    if (result.success) {
      setFeedbackMsg({
        text: `Proposal ${proposalId} has been ${action}.`,
        isError: false,
      });
    } else {
      setFeedbackMsg({
        text: result.error || 'Review failed',
        isError: true,
      });
    }

    loadData();
  };

  const handleDeployProposal = (proposal: ImprovementProposal) => {
    const proposalEngine = ImprovementProposalEngine.getInstance();
    const versionEngine = IntelligenceVersionEngine.getInstance();

    const promoteRes = versionEngine.promoteVersion({
      tenantId,
      versionId: `v1.${proposals.length + 1}.0`,
      parameters: proposal.proposedChanges,
      policyThresholds: { autoApprovalPoLimit: 60000 },
      promotedFromProposalId: proposal.proposalId,
      promotedBy: currentUserId,
      userRole,
      isAIAgent,
    });

    if (promoteRes.success) {
      proposalEngine.markDeployed(tenantId, proposal.proposalId);
      setFeedbackMsg({
        text: `Proposal deployed! Promoted to active version ${promoteRes.version?.versionId}.`,
        isError: false,
      });
    } else {
      setFeedbackMsg({
        text: promoteRes.error || 'Deployment failed',
        isError: true,
      });
    }

    loadData();
  };

  return (
    <div className="p-6 bg-slate-950 text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">Learning Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Closed-Loop Governance
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Transform empirical outcome variances into governed, versioned improvements. AI self-approval strictly prohibited.
          </p>
        </div>

        {/* Current User Role Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-400">Actor:</span>
          <span className="text-white font-mono">{currentUserId}</span>
          <span className="text-indigo-400 font-semibold uppercase">({userRole})</span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between border ${
            feedbackMsg.isError
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('SIGNALS')}
          className={`pb-3 text-sm font-medium transition flex items-center gap-2 border-b-2 ${
            activeTab === 'SIGNALS'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Brain className="w-4 h-4" />
          Learning Signals ({signals.length})
        </button>

        <button
          onClick={() => setActiveTab('PROPOSALS')}
          className={`pb-3 text-sm font-medium transition flex items-center gap-2 border-b-2 ${
            activeTab === 'PROPOSALS'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Improvement Proposals ({proposals.length})
        </button>
      </div>

      {/* TAB 1: Signals */}
      {activeTab === 'SIGNALS' && (
        <div className="space-y-4">
          {signals.map(sig => (
            <div
              key={sig.signalId}
              className="bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition space-y-3"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white font-mono">{sig.metric}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Drift: +{sig.driftMagnitudePct}%
                  </span>
                  <span className="text-xs text-slate-400">Sample Size: {sig.sampleSize} verified events</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">Status: {sig.status}</span>
                  <button
                    onClick={() => handleOpenProposalModal(sig)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Draft Proposal
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-indigo-400">Recommended Action:</strong> {sig.recommendedAction}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: Proposals */}
      {activeTab === 'PROPOSALS' && (
        <div className="space-y-4">
          {proposals.map(prop => {
            const isPending = prop.status === 'PENDING_APPROVAL';
            const isApproved = prop.status === 'APPROVED';
            const isDeployed = prop.status === 'DEPLOYED';

            return (
              <div
                key={prop.proposalId}
                className="bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-white">{prop.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold uppercase border ${
                          isDeployed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          isApproved ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {prop.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{prop.description}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleReviewProposal(prop.proposalId, 'APPROVED')}
                          className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve (Human)
                        </button>
                        <button
                          onClick={() => handleReviewProposal(prop.proposalId, 'REJECTED')}
                          className="px-3 py-1.5 rounded bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium transition flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </>
                    )}

                    {isApproved && (
                      <button
                        onClick={() => handleDeployProposal(prop)}
                        className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Deploy to Production Version
                      </button>
                    )}
                  </div>
                </div>

                {/* Impact Preview */}
                <div className="grid grid-cols-3 gap-3 bg-slate-950/60 rounded-lg p-3 border border-slate-800/60 text-xs">
                  <div>
                    <span className="text-slate-500 block">Projected OTIF Boost</span>
                    <span className="text-emerald-400 font-bold">+{prop.expectedImpact.otifImprovementPct}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Est. Annualized Savings</span>
                    <span className="text-white font-bold">${prop.expectedImpact.costReductionAnnualized.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Risk Reduction</span>
                    <span className="text-blue-400 font-bold">-{prop.expectedImpact.riskReductionPct}%</span>
                  </div>
                </div>

                {/* Rollback Plan Card */}
                <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-800 text-xs space-y-1">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    Automated Rollback Plan Target: {prop.rollbackPlan.targetVersion}
                  </span>
                  <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                    {prop.rollbackPlan.automatedSteps.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Proposal Modal */}
      {selectedSignal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Draft Governed Improvement Proposal</h3>
            <p className="text-xs text-slate-400">
              Formalize model calibration parameters for human governance review.
            </p>

            <form onSubmit={handleCreateProposal} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Proposal Title</label>
                <input
                  type="text"
                  value={proposalTitle}
                  onChange={e => setProposalTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Description & Justification</label>
                <textarea
                  rows={3}
                  value={proposalDesc}
                  onChange={e => setProposalDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Lead Time Buffer (+Days)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={leadTimeAdjustment}
                    onChange={e => setLeadTimeAdjustment(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Freight Cap Shift (%)</label>
                  <input
                    type="number"
                    step="1"
                    value={costCapAdjustment}
                    onChange={e => setCostCapAdjustment(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedSignal(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
                >
                  Submit Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
