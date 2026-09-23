import React, { useState } from 'react';
import { 
  ShieldAlert, ShieldCheck, Play, RotateCcw, AlertTriangle, 
  CheckCircle2, RefreshCw, Radio, Lock, Activity, Server,
  ArrowRight
} from 'lucide-react';
import { 
  regionalFailoverOrchestrator, 
  FailoverOperationRecord 
} from '../../enterprise/failover/RegionalFailoverOrchestrator';
import { 
  fencingTokenManager, 
  FencingLease 
} from '../../enterprise/failover/FencingTokenManager';
import { regionRegistry } from '../../enterprise/region/RegionRegistry';
import { useAuth } from '../../store/AuthContext';

export const FailoverCenter: React.FC = () => {
  const { profile } = useAuth();
  const tenantId = profile?.organizationId || 'demo-tenant';

  const [operations, setOperations] = useState<FailoverOperationRecord[]>(() => 
    regionalFailoverOrchestrator.listOperations(tenantId)
  );
  const [selectedOp, setSelectedOp] = useState<FailoverOperationRecord | null>(() => operations[0] || null);
  const [fencingLease, setFencingLease] = useState<FencingLease | undefined>(() => 
    fencingTokenManager.getLease('GLOBAL_PRIMARY_LEADER')
  );

  const [sourceRegion, setSourceRegion] = useState('reg-us-east');
  const [targetRegion, setTargetRegion] = useState('reg-us-west-dr');
  const [isDrill, setIsDrill] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);

  const refreshAll = () => {
    const list = regionalFailoverOrchestrator.listOperations(tenantId);
    setOperations(list);
    if (selectedOp) {
      const op = regionalFailoverOrchestrator.getOperation(selectedOp.operationId);
      if (op) setSelectedOp(op);
    }
    setFencingLease(fencingTokenManager.getLease('GLOBAL_PRIMARY_LEADER'));
  };

  const handleExecuteFailover = async () => {
    setIsExecuting(true);
    try {
      const op = await regionalFailoverOrchestrator.executeFailover({
        tenantId,
        sourceRegionId: sourceRegion,
        targetRegionId: targetRegion,
        triggerType: isDrill ? 'DISASTER_RECOVERY_DRILL' : 'OPERATOR_INITIATED',
        isDrill,
        initiatedBy: profile?.fullName || profile?.displayName || 'admin'
      });
      setSelectedOp(op);
      refreshAll();
    } catch (err: any) {
      console.error('Failover execution error:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12" data-testid="failover-center">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-os-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Failover & Fencing Center</h1>
            <p className="text-xs text-os-text-muted font-mono">
              6-Phase Regional Failover Protocol & Distributed Fencing Token Authority
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-[11px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded flex items-center gap-1.5">
            <Radio size={12} className="animate-pulse text-amber-400" />
            EXECUTION: SIMULATED REGIONAL DRILL
          </span>
          <button
            type="button"
            onClick={refreshAll}
            className="p-1.5 bg-white/5 hover:bg-white/10 text-os-text-secondary hover:text-white rounded border border-os-border transition-all"
            title="Refresh Failover Telemetry"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Fencing Authority Active Lease Banner */}
      <div className="p-4 bg-[#0d1117] border border-os-border rounded flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-[#00F2FE]/10 border border-[#00F2FE]/30 text-[#00F2FE]">
            <Lock size={22} />
          </div>
          <div>
            <div className="text-[10px] font-mono text-os-text-muted uppercase tracking-wider">Active Fencing Token Authority</div>
            <div className="text-lg font-bold font-mono text-white flex items-center gap-3 mt-0.5">
              <span>Token: <strong className="text-[#00F2FE]">#{fencingLease?.fencingToken}</strong></span>
              <span className="text-os-text-muted text-xs">|</span>
              <span>Gen: <strong className="text-purple-400">{fencingLease?.generationId}</strong></span>
              <span className="text-os-text-muted text-xs">|</span>
              <span className="text-xs font-mono text-emerald-400">Leader: {fencingLease?.holderRegionId}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded flex items-center gap-1.5">
            <ShieldCheck size={14} /> SPLIT-BRAIN FENCE ACTIVE
          </span>
        </div>
      </div>

      {/* Execution Launcher & History Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Failover Launcher */}
        <div className="bg-[#0d1117] border border-os-border rounded p-4 flex flex-col space-y-4">
          <div className="border-b border-os-border pb-3">
            <h2 className="text-sm font-bold text-white font-mono">Failover Sequence Launcher</h2>
            <p className="text-[11px] text-os-text-muted">Strict 6-Phase Governed Protocol</p>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="text-os-text-muted uppercase text-[10px] block mb-1">Source Region (Failing / Active)</label>
              <select
                value={sourceRegion}
                onChange={(e) => setSourceRegion(e.target.value)}
                className="w-full bg-black/40 border border-os-border rounded p-2 text-white outline-none focus:border-[#00F2FE]"
              >
                <option value="reg-us-east">reg-us-east (US East Primary)</option>
                <option value="reg-eu-central">reg-eu-central (EU Central)</option>
              </select>
            </div>

            <div>
              <label className="text-os-text-muted uppercase text-[10px] block mb-1">Target Region (Promotion Target)</label>
              <select
                value={targetRegion}
                onChange={(e) => setTargetRegion(e.target.value)}
                className="w-full bg-black/40 border border-os-border rounded p-2 text-white outline-none focus:border-[#00F2FE]"
              >
                <option value="reg-us-west-dr">reg-us-west-dr (Americas DR)</option>
                <option value="reg-eu-central">reg-eu-central (EU Central)</option>
                <option value="reg-apac-sg">reg-apac-sg (Singapore)</option>
              </select>
            </div>

            <div className="p-3 bg-black/30 border border-os-border rounded flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">Disaster Recovery Drill Mode</span>
                <span className="text-[10px] text-os-text-muted">Synthetic traffic testing with zero customer impact</span>
              </div>
              <input
                type="checkbox"
                checked={isDrill}
                onChange={(e) => setIsDrill(e.target.checked)}
                className="w-4 h-4 accent-[#00F2FE]"
              />
            </div>

            <button
              type="button"
              disabled={isExecuting || sourceRegion === targetRegion}
              onClick={handleExecuteFailover}
              className={`w-full py-2.5 font-mono text-xs font-bold rounded border transition-all flex items-center justify-center gap-2 ${
                isExecuting || sourceRegion === targetRegion
                  ? 'bg-white/10 text-os-text-muted border-os-border cursor-not-allowed'
                  : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40 cursor-pointer'
              }`}
            >
              <Play size={14} /> {isExecuting ? 'Executing 6-Phase Cutover...' : 'Initiate Failover Protocol'}
            </button>
          </div>

          <div className="p-3 bg-black/40 border border-os-border rounded space-y-1.5 text-[11px] text-os-text-secondary">
            <span className="text-[10px] font-mono text-os-text-muted uppercase font-bold">Split-Brain Invariant</span>
            <p>
              When target is promoted, a new monotonically increasing Fencing Token is minted. All subsequent storage and ERP transactions with older tokens are permanently blocked.
            </p>
          </div>
        </div>

        {/* Right 2 Cols: Operation Log & 6-Phase Progress */}
        <div className="lg:col-span-2 bg-[#0d1117] border border-os-border rounded p-4 flex flex-col h-[600px] overflow-y-auto space-y-4">
          <div className="flex items-center justify-between border-b border-os-border pb-3">
            <span className="text-sm font-bold text-white font-mono">Failover History & Drill Logs</span>
            <span className="text-xs text-os-text-muted font-mono">{operations.length} Executions</span>
          </div>

          {selectedOp ? (
            <div className="space-y-4">
              <div className="p-3 bg-black/40 border border-os-border rounded flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">{selectedOp.operationId}</span>
                    <span className="px-2 py-0.5 text-[9px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded">
                      {selectedOp.triggerType}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-os-text-muted mt-1 flex items-center gap-2">
                    <span>{selectedOp.sourceRegionId}</span>
                    <ArrowRight size={12} className="text-[#00F2FE]" />
                    <span className="text-white font-bold">{selectedOp.targetRegionId}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded">
                    {selectedOp.status}
                  </span>
                  <div className="text-[10px] font-mono text-os-text-muted mt-1">
                    Duration: {selectedOp.totalDurationMs ? `${(selectedOp.totalDurationMs / 1000).toFixed(1)}s` : 'In-flight'}
                  </div>
                </div>
              </div>

              {/* 6-Phase Protocol Visualizer */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-white font-mono">Protocol Execution Timeline</span>
                <div className="space-y-1.5">
                  {selectedOp.steps.map((step, idx) => (
                    <div key={idx} className="p-2.5 bg-black/30 border border-os-border rounded flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-bold text-white text-[11px]">{step.phase}: {step.name}</div>
                          <div className="text-[10px] text-os-text-muted">{step.details}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-emerald-400 text-[10px] font-bold">COMPLETED</span>
                        <div className="text-[9px] text-os-text-muted">{step.durationMs}ms</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-os-text-muted text-xs">
              No failover drill selected
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
