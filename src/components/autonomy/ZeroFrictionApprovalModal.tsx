import React, { useState } from 'react';
import { 
  Check, X, RefreshCw, ShieldAlert, Sparkles, UserCheck, 
  Layers, ArrowRight, DollarSign, Activity, AlertCircle, Info, ChevronRight
} from 'lucide-react';
import { ApprovalRequest } from '../../autonomy/types';

interface ZeroFrictionApprovalModalProps {
  request: ApprovalRequest;
  onClose: () => void;
  onRespond: (approvalId: string, action: 'APPROVE' | 'REJECT' | 'REQUEST_ALTERNATIVE' | 'DELEGATE') => void;
}

export const ZeroFrictionApprovalModal: React.FC<ZeroFrictionApprovalModalProps> = ({ request, onClose, onRespond }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_ALTERNATIVE' | 'DELEGATE') => {
    setIsProcessing(true);
    await onRespond(request.approvalId, action);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--orion-border)] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                Human Approval Required
              </span>
              <span className="text-xs font-mono text-[var(--orion-text-muted)]">
                REQ-ID: {request.approvalId}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[var(--orion-text)]">
              {request.actionType.replace(/_/g, ' ')}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-[var(--orion-text-muted)] hover:bg-[var(--orion-surface-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. WHY & AI REASONING SUMMARY */}
        <div className="bg-[var(--orion-accent-subtle)] border border-[var(--orion-accent)]/30 rounded-xl p-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--orion-accent)] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            AI Decision Rationale & Why Needed
          </h4>
          <p className="text-xs text-[var(--orion-text)] font-medium leading-relaxed">
            {request.why}
          </p>
          <div className="text-[11px] text-[var(--orion-text-secondary)] border-t border-[var(--orion-border)] pt-2 mt-2">
            <b>AI Summary:</b> {request.aiReasoningSummary}
          </div>
        </div>

        {/* 2. KEY METRICS MATRIX (IMPACT, COST, RISK, CONFIDENCE) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[var(--orion-surface-secondary)] border border-[var(--orion-border)] rounded-xl p-3">
            <span className="text-[10px] font-bold text-[var(--orion-text-muted)] uppercase tracking-wider block">
              Financial Exposure
            </span>
            <span className="text-lg font-bold font-mono text-emerald-400 mt-1 block">
              ${request.financialCost.toLocaleString()}
            </span>
          </div>

          <div className="bg-[var(--orion-surface-secondary)] border border-[var(--orion-border)] rounded-xl p-3">
            <span className="text-[10px] font-bold text-[var(--orion-text-muted)] uppercase tracking-wider block">
              Risk Score
            </span>
            <span className="text-lg font-bold font-mono text-amber-400 mt-1 block">
              {request.riskScore} / 100
            </span>
          </div>

          <div className="bg-[var(--orion-surface-secondary)] border border-[var(--orion-border)] rounded-xl p-3">
            <span className="text-[10px] font-bold text-[var(--orion-text-muted)] uppercase tracking-wider block">
              AI Confidence
            </span>
            <span className="text-lg font-bold font-mono text-[var(--orion-accent)] mt-1 block">
              {(request.confidence * 100).toFixed(0)}%
            </span>
          </div>

          <div className="bg-[var(--orion-surface-secondary)] border border-[var(--orion-border)] rounded-xl p-3">
            <span className="text-[10px] font-bold text-[var(--orion-text-muted)] uppercase tracking-wider block">
              Reversibility
            </span>
            <span className={`text-sm font-bold font-mono mt-1.5 block ${request.reversibility ? 'text-emerald-400' : 'text-rose-400'}`}>
              {request.reversibility ? 'REVERSIBLE' : 'NON-REVERSIBLE'}
            </span>
          </div>
        </div>

        {/* 3. CURRENT VS PROPOSED STATE & DIGITAL TWIN RESULT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* State Transition */}
          <div className="bg-[var(--orion-surface-secondary)] border border-[var(--orion-border)] rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)] block">
              State Transition Comparison
            </span>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded bg-[var(--orion-surface)] border border-[var(--orion-border)]">
                <span className="text-[10px] text-[var(--orion-text-muted)] uppercase block font-mono">Current State</span>
                <pre className="text-[11px] font-mono text-[var(--orion-text-secondary)] mt-1 whitespace-pre-wrap">
                  {JSON.stringify(request.currentState, null, 2)}
                </pre>
              </div>

              <div className="flex justify-center my-1 text-[var(--orion-accent)]">
                <ArrowRight className="w-4 h-4 rotate-90 md:rotate-0" />
              </div>

              <div className="p-2.5 rounded bg-[var(--orion-accent-subtle)] border border-[var(--orion-accent)]/30">
                <span className="text-[10px] text-[var(--orion-accent)] uppercase block font-mono">Proposed State</span>
                <pre className="text-[11px] font-mono text-[var(--orion-text)] mt-1 whitespace-pre-wrap">
                  {JSON.stringify(request.proposedState, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Digital Twin Simulation Result */}
          <div className="bg-[var(--orion-surface-secondary)] border border-[var(--orion-border)] rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)] block">
              Digital Twin 2.0 Simulation Impact
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded bg-[var(--orion-surface)]">
                <span className="text-[var(--orion-text-secondary)]">Service Level Impact</span>
                <span className="font-mono font-bold text-emerald-400">{request.digitalTwinResult.serviceLevelImpact}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-[var(--orion-surface)]">
                <span className="text-[var(--orion-text-secondary)]">Gross Margin Impact</span>
                <span className="font-mono font-bold text-emerald-400">{request.digitalTwinResult.marginImpact}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-[var(--orion-surface)]">
                <span className="text-[var(--orion-text-secondary)]">Risk Variance</span>
                <span className="font-mono font-bold text-[var(--orion-accent)]">{request.digitalTwinResult.riskVariance}</span>
              </div>
              <div className="p-2.5 rounded bg-[var(--orion-surface)] text-[11px] text-[var(--orion-text-secondary)]">
                <b>Expected Benefit:</b> {request.expectedBenefit}
              </div>
            </div>
          </div>
        </div>

        {/* 4. ZERO-FRICTION ACTION BUTTONS */}
        <div className="pt-4 border-t border-[var(--orion-border)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleAction('APPROVE')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              APPROVE & EXECUTE
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleAction('REJECT')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              REJECT
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleAction('REQUEST_ALTERNATIVE')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--orion-surface-secondary)] text-[var(--orion-text)] border border-[var(--orion-border)] hover:bg-[var(--orion-surface-hover)] transition-all cursor-pointer"
            >
              Request Alternative
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleAction('DELEGATE')}
              className="px-3 py-2 rounded-xl text-xs font-medium text-[var(--orion-text-secondary)] hover:text-[var(--orion-text)] transition-colors cursor-pointer"
            >
              Delegate
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleAction('APPROVE')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--orion-accent-subtle)] text-[var(--orion-accent)] border border-[var(--orion-accent)]/30 hover:bg-[var(--orion-accent)] hover:text-[var(--orion-on-accent)] transition-all cursor-pointer"
            >
              Approve for Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
