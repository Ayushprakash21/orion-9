/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE + ENTERPRISE LEARNING + PRODUCTION CONTROL PLANE
 * Rollback Center UI Component
 * 
 * Governed version history and instant 1-click rollback to previously verified baselines.
 * STRICT GOVERNANCE: AI Agents cannot trigger rollbacks.
 */

import React, { useState, useEffect } from 'react';
import { IntelligenceVersion } from '../../outcomes/types';
import { IntelligenceVersionEngine } from '../../outcomes';
import {
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  History,
  Layers,
  Code2,
} from 'lucide-react';

export const RollbackCenter: React.FC<{
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
  const [versions, setVersions] = useState<IntelligenceVersion[]>([]);
  const [selectedTargetVersion, setSelectedTargetVersion] = useState<string>('');
  const [rollbackReason, setRollbackReason] = useState<string>('');
  const [isRollbackModalOpen, setIsRollbackModalOpen] = useState<boolean>(false);
  const [inspectVersion, setInspectVersion] = useState<IntelligenceVersion | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    loadVersions();
  }, [tenantId]);

  const loadVersions = () => {
    const engine = IntelligenceVersionEngine.getInstance();
    engine.ensureBaselineVersion(tenantId);
    const list = engine.listVersions(tenantId);
    setVersions(list);

    const retired = list.find(v => v.status === 'RETIRED' || v.status === 'ACTIVE');
    if (retired && !selectedTargetVersion) {
      setSelectedTargetVersion(retired.versionId);
    }
  };

  const handleExecuteRollback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetVersion || !rollbackReason.trim()) return;

    const engine = IntelligenceVersionEngine.getInstance();
    const result = engine.rollbackToVersion({
      tenantId,
      targetVersionId: selectedTargetVersion,
      executedBy: currentUserId,
      userRole,
      reason: rollbackReason,
      isAIAgent,
    });

    if (result.success) {
      setFeedbackMsg({
        text: `Rollback successful! Production version reverted to ${selectedTargetVersion}.`,
        isError: false,
      });
      setIsRollbackModalOpen(false);
      setRollbackReason('');
      loadVersions();
    } else {
      setFeedbackMsg({
        text: result.error || 'Rollback failed',
        isError: true,
      });
    }
  };

  const activeVersion = versions.find(v => v.status === 'ACTIVE');

  return (
    <div className="p-6 bg-slate-950 text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">Rollback Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Disaster Recovery Control
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Governed production release ledger and instant 1-click reversion to verified baseline configurations.
          </p>
        </div>

        <button
          onClick={() => setIsRollbackModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Trigger Governed Rollback
        </button>
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

      {/* Active Production Banner */}
      {activeVersion && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span className="text-xs font-semibold uppercase text-indigo-300">Active Production Configuration</span>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                {activeVersion.versionId}
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">Checksum: {activeVersion.checksum}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/60 rounded-lg p-3 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block">Promoted By</span>
              <span className="text-white font-medium">{activeVersion.promotedBy}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Promoted At</span>
              <span className="text-white font-medium">{new Date(activeVersion.promotedAt).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Lead Time Buffer</span>
              <span className="text-indigo-300 font-medium">+{activeVersion.parameters.leadTimeBufferDays || 0} days</span>
            </div>
            <div>
              <span className="text-slate-500 block">PO Auto-Approval Limit</span>
              <span className="text-emerald-300 font-medium">
                ${(activeVersion.policyThresholds.autoApprovalPoLimit || 50000).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Version History Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            Intelligence Configuration Version Ledger
          </h3>
          <span className="text-xs text-slate-500">{versions.length} versions recorded</span>
        </div>

        <div className="divide-y divide-slate-800">
          {versions.map(v => {
            const isActive = v.status === 'ACTIVE';
            const isRolledBack = v.status === 'ROLLED_BACK';

            return (
              <div key={v.versionId} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-bold text-white">{v.versionId}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold uppercase border ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : isRolledBack
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {v.status}
                    </span>
                    {v.rollbackTargetVersion && (
                      <span className="text-xs text-amber-400 font-mono">
                        (Rolled back to {v.rollbackTargetVersion})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-4">
                    <span>Promoted by: <strong className="text-slate-200">{v.promotedBy}</strong></span>
                    <span>Date: {new Date(v.promotedAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setInspectVersion(v)}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1.5"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    Inspect Diff
                  </button>

                  {!isActive && (
                    <button
                      onClick={() => {
                        setSelectedTargetVersion(v.versionId);
                        setIsRollbackModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 text-xs font-medium transition flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Revert to This
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rollback Execution Modal */}
      {isRollbackModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Execute Governed Rollback</h3>
            </div>
            <p className="text-xs text-slate-400">
              Revert active production intelligence models and policy thresholds to a prior verified snapshot.
            </p>

            <form onSubmit={handleExecuteRollback} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Target Rollback Version</label>
                <select
                  value={selectedTargetVersion}
                  onChange={e => setSelectedTargetVersion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                >
                  {versions.filter(v => v.status !== 'ACTIVE').map(v => (
                    <option key={v.versionId} value={v.versionId}>
                      {v.versionId} (Status: {v.status}, Promoted: {new Date(v.promotedAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Mandatory Rollback Justification</label>
                <textarea
                  required
                  rows={3}
                  value={rollbackReason}
                  onChange={e => setRollbackReason(e.target.value)}
                  placeholder="e.g., Unforecasted cost escalation detected in challenger model following v1.1 deployment."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRollbackModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Confirm &amp; Revert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Diff Modal */}
      {inspectVersion && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white font-mono">Parameters: {inspectVersion.versionId}</h3>
            <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto max-h-80">
              {JSON.stringify({ parameters: inspectVersion.parameters, thresholds: inspectVersion.policyThresholds }, null, 2)}
            </pre>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectVersion(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
