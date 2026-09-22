/**
 * ORION-9 WAVE 10: ENTERPRISE PRODUCTION CONTROL PLANE
 * Release Center UI Component
 * 
 * Release pipeline gates, preflight verification evidence, deployment history,
 * and 1-click rollback linkage.
 */

import React, { useState, useEffect } from 'react';
import {
  releaseManager,
  ReleaseRecord,
  ReleaseStage,
} from '../../operations';
import {
  GitCommit,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const ReleaseCenter: React.FC<{ tenantId?: string }> = () => {
  const [releases, setReleases] = useState<ReleaseRecord[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<ReleaseRecord | null>(null);

  const loadReleases = () => {
    const list = releaseManager.getAllReleases();
    setReleases(list);
    if (list.length > 0 && !selectedRelease) {
      setSelectedRelease(list[0]);
    } else if (selectedRelease) {
      const updated = list.find(r => r.id === selectedRelease.id);
      if (updated) setSelectedRelease(updated);
    }
  };

  useEffect(() => {
    loadReleases();
  }, []);

  const handlePromote = (releaseId: string) => {
    const res = releaseManager.promoteRelease(releaseId, 'platform_admin');
    if (res.success) {
      loadReleases();
    } else {
      alert('Cannot promote release: all preflight verification gates must pass.');
    }
  };

  const handleRollback = (releaseId: string) => {
    if (window.confirm('Are you sure you want to trigger 1-click automated rollback for this release?')) {
      releaseManager.rollbackRelease(releaseId, 'platform_admin', 'Operational rollback via Release Center');
      loadReleases();
    }
  };

  const getStageBadge = (stage: ReleaseStage) => {
    switch (stage) {
      case 'PROMOTED':
        return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">PROMOTED</span>;
      case 'VERIFIED':
        return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">VERIFIED</span>;
      case 'PREFLIGHT_PENDING':
        return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">PREFLIGHT PENDING</span>;
      case 'CANARY':
        return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">CANARY</span>;
      case 'ROLLED_BACK':
        return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">ROLLED BACK</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-400">DRAFT</span>;
    }
  };

  return (
    <div className="p-6 bg-slate-950 text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <GitCommit className="h-6 w-6 text-cyan-400" />
              Release Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Deployment Safety & Preflight Gates
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise release verification pipeline, automated preflight gates, deployment history, and 1-click rollback linkage.
          </p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Release Catalog */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Releases ({releases.length})
          </div>
          <div className="space-y-2">
            {releases.map(rel => (
              <div
                key={rel.id}
                onClick={() => setSelectedRelease(rel)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedRelease?.id === rel.id
                    ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-sm font-bold text-white">{rel.version}</span>
                  {getStageBadge(rel.stage)}
                </div>
                <div className="text-xs font-mono text-slate-500 mt-1 flex items-center gap-1.5">
                  <GitCommit className="h-3 w-3" />
                  {rel.commitSha.slice(0, 12)}
                </div>
                <p className="text-xs text-slate-400 mt-2 line-clamp-1">{rel.notes}</p>
                <div className="mt-3 text-[11px] text-slate-500 font-mono">
                  {new Date(rel.deployedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Release Detail */}
        <div className="lg:col-span-2 space-y-6">
          {selectedRelease ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-lg font-bold text-white">{selectedRelease.version}</span>
                    {getStageBadge(selectedRelease.stage)}
                  </div>
                  <p className="text-xs text-slate-400">{selectedRelease.notes}</p>
                  <span className="text-[11px] font-mono text-slate-500 mt-1 block">
                    Commit: <strong className="text-cyan-400">{selectedRelease.commitSha}</strong> • Deployed by: {selectedRelease.deployedBy}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {selectedRelease.stage === 'VERIFIED' && (
                    <button
                      onClick={() => handlePromote(selectedRelease.id)}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition shadow-lg shadow-emerald-600/20"
                    >
                      Promote to Production
                    </button>
                  )}
                  {selectedRelease.stage === 'PROMOTED' && selectedRelease.rollbackTargetVersion && (
                    <button
                      onClick={() => handleRollback(selectedRelease.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Rollback to {selectedRelease.rollbackTargetVersion}
                    </button>
                  )}
                </div>
              </div>

              {/* Preflight Verification Gates */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                  Preflight Verification Gates ({selectedRelease.gates.filter(g => g.passed).length}/{selectedRelease.gates.length} Passed)
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {selectedRelease.gates.map(gate => (
                    <div
                      key={gate.gateId}
                      className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{gate.name}</span>
                          <span className="text-[10px] font-mono text-slate-500">[{gate.gateId}]</span>
                        </div>
                        <p className="text-xs text-slate-400">{gate.evidence}</p>
                      </div>
                      <div>
                        {gate.passed ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
                            <CheckCircle2 className="h-3.5 w-3.5" /> PASSED
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded">
                            <Clock className="h-3.5 w-3.5" /> PENDING
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rollback Linkage Box */}
              {selectedRelease.rollbackTargetVersion && (
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RotateCcw className="h-5 w-5 text-rose-400 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-slate-200">
                        Designated Rollback Target: {selectedRelease.rollbackTargetVersion}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        In case of production disruption, 1-click rollback restores configuration, schema, and operational rules instantly.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-sm">
              Select a release to inspect preflight gates and deployment history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
