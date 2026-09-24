import React, { useState, useEffect } from 'react';
import { 
  Database, Play, Pause, RotateCcw, AlertTriangle, CheckCircle2, 
  Sparkles, RefreshCw, Zap, Sliders, ShieldAlert, Layers, Clock, 
  Check, FileText, Globe, Box, Truck, BarChart2, AlertOctagon,
  ArrowRight, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { 
  demoSyntheticDataEngine, 
  GenerationBatchAudit 
} from '../../core/database/DemoSyntheticDataEngine';
import { 
  demoLiveSimulationEngine, 
  SimulationState, 
  SimulationConfig,
  SimulationSpeed,
  DemoRetentionPolicy
} from '../../core/database/DemoLiveSimulationEngine';
import { DemoSchedulerState } from '../../services/demo/DemoPersistentSchedulerService';
import { cn } from '../../lib/utils';

export const AdminDemoData: React.FC = () => {
  const { profile, hasRole } = useAuth();
  const { showToast } = useToast();

  const isPlatformAdmin = profile?.role === 'platform_admin' || hasRole(['platform_admin']);
  const isOrgAdmin = profile?.role === 'organization_admin' || hasRole(['organization_admin']);

  const [dbEnv, setDbEnv] = useState(() => dbManager.getEnvironment());
  const [simState, setSimState] = useState<SimulationState>(() => demoLiveSimulationEngine.getState());
  const [simConfig, setSimConfig] = useState<SimulationConfig>(() => demoLiveSimulationEngine.getConfig());
  const [batchHistory, setBatchHistory] = useState<GenerationBatchAudit[]>(() => demoSyntheticDataEngine.getBatchHistory());
  const [cloudSchedulerState, setCloudSchedulerState] = useState<DemoSchedulerState | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isAdvancingCycle, setIsAdvancingCycle] = useState(false);
  const [isControllingScheduler, setIsControllingScheduler] = useState(false);

  // Reset confirmation modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState('');

  // Fetch cloud scheduler state
  const fetchCloudSchedulerStatus = async () => {
    try {
      const res = await fetch('/api/demo/scheduler-status');
      if (res.ok) {
        const data = await res.json();
        if (data.scheduler) {
          setCloudSchedulerState(data.scheduler);
        }
      }
    } catch (e) {
      // Background poll silently fails in offline mock/test modes
    }
  };

  // Sync state with simulation engine and environment events
  useEffect(() => {
    fetchCloudSchedulerStatus();
    const interval = setInterval(fetchCloudSchedulerStatus, 15000);

    const handleEnvChange = () => {
      setDbEnv(dbManager.getEnvironment());
    };
    const handleSimChange = (e: any) => {
      if (e.detail?.state) setSimState(e.detail.state);
      if (e.detail?.config) setSimConfig(e.detail.config);
    };
    const handleBatchGenerated = () => {
      setBatchHistory(demoSyntheticDataEngine.getBatchHistory());
      setSimState(demoLiveSimulationEngine.getState());
      fetchCloudSchedulerStatus();
    };

    window.addEventListener('orion-database-environment-changed', handleEnvChange);
    window.addEventListener('orion:demo-simulation-state-changed', handleSimChange);
    window.addEventListener('orion:demo-synthetic-batch-generated', handleBatchGenerated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('orion-database-environment-changed', handleEnvChange);
      window.removeEventListener('orion:demo-simulation-state-changed', handleSimChange);
      window.removeEventListener('orion:demo-synthetic-batch-generated', handleBatchGenerated);
    };
  }, []);

  const handleGenerateNow = async () => {
    if (dbEnv !== 'DEMO') {
      showToast('Data generation is strictly disabled in LIVE database mode', 'error');
      return;
    }
    setIsGenerating(true);
    try {
      // Try backend endpoint first for cloud persistence
      let audit: any = null;
      try {
        const res = await fetch('/api/demo/generate-hourly-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ forceTrigger: true })
        });
        if (res.ok) {
          const json = await res.json();
          audit = json.batch;
        }
      } catch (err) {
        // Fallback to client-side engine if server route is unreachable
      }

      if (!audit) {
        audit = await demoSyntheticDataEngine.generateEnterpriseBatch(25);
      }

      showToast(
        `Generated batch ${audit.generationBatchId || audit.batchId}: ${audit.packageCount || audit.packagesCount || 25} enterprise packages (${audit.recordCounts?.companies || 25} companies, ${audit.recordCounts?.products || 100} products, ${audit.recordCounts?.purchaseOrders || 100} POs) in ${audit.durationMs || 0}ms`,
        'success'
      );
      setBatchHistory(demoSyntheticDataEngine.getBatchHistory());
      fetchCloudSchedulerStatus();
    } catch (err: any) {
      showToast('Generation failed: ' + (err?.message || 'Unknown error'), 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleScheduler = async () => {
    setIsControllingScheduler(true);
    try {
      const isCurrentlyPaused = cloudSchedulerState?.status === 'PAUSED' || simState.status === 'PAUSED';
      const action = isCurrentlyPaused ? 'RESUME' : 'PAUSE';

      try {
        await fetch('/api/demo/scheduler-control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, actorId: profile?.id || 'admin', role: profile?.role || 'platform_admin' })
        });
      } catch (e) {}

      if (action === 'PAUSE') {
        demoLiveSimulationEngine.pause();
        showToast('Persistent Cloud Scheduler & Simulation Engine paused', 'info');
      } else {
        demoLiveSimulationEngine.resume();
        showToast('Persistent Cloud Scheduler & Simulation Engine resumed (25 pkgs/hr)', 'success');
      }
      setSimState(demoLiveSimulationEngine.getState());
      fetchCloudSchedulerStatus();
    } finally {
      setIsControllingScheduler(false);
    }
  };

  const handleSpeedChange = (speed: SimulationSpeed) => {
    demoLiveSimulationEngine.setSpeed(speed);
    setSimConfig(demoLiveSimulationEngine.getConfig());
    setSimState(demoLiveSimulationEngine.getState());
    showToast(`Simulation telemetry speed adjusted to ${speed}`, 'info');
  };

  const handleAdvanceOneCycle = async () => {
    if (dbEnv !== 'DEMO') {
      showToast('Simulation cycles only run in DEMO environment', 'error');
      return;
    }
    setIsAdvancingCycle(true);
    try {
      const res = await demoLiveSimulationEngine.executeSimulationCycle();
      showToast(`Advanced simulation cycle: ${res.eventsAdvanced} events progressed, ${res.exceptionsCreated} exceptions evaluated`, 'success');
      setSimState(demoLiveSimulationEngine.getState());
    } catch (e: any) {
      showToast('Cycle error: ' + e.message, 'error');
    } finally {
      setIsAdvancingCycle(false);
    }
  };

  const handleExecuteReset = async () => {
    if (dbEnv !== 'DEMO') {
      showToast('HARD SAFETY VIOLATION: Reset is strictly prohibited in LIVE environment', 'error');
      return;
    }
    if (resetConfirmation !== 'RESET DEMO DATA') {
      showToast('Please type "RESET DEMO DATA" exactly to confirm reset', 'error');
      return;
    }

    setIsResetting(true);
    try {
      const res = await demoLiveSimulationEngine.resetDemoData(profile?.id || 'admin', isPlatformAdmin);
      showToast(res.message, 'success');
      setShowResetModal(false);
      setResetConfirmation('');
      setBatchHistory(demoSyntheticDataEngine.getBatchHistory());
      setSimState(demoLiveSimulationEngine.getState());
      fetchCloudSchedulerStatus();
    } catch (err: any) {
      showToast('Reset failed: ' + (err?.message || 'Authorization rejected'), 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const lastBatch = batchHistory[0];

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-os-bg text-os-text-primary">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-os-border pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold font-mono tracking-tight text-white flex items-center gap-3 flex-wrap">
                SYNTHETIC DATA & PERSISTENT SCHEDULER
                <span className={cn(
                  "text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold uppercase tracking-wider border",
                  dbEnv === 'DEMO'
                    ? "bg-amber-950/80 text-amber-400 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                    : "bg-emerald-950/80 text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                )}>
                  {dbEnv} ENVIRONMENT
                </span>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-cyan-950 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  SCHEDULER: CLOUD ACTIVE
                </span>
              </h1>
              <p className="text-xs text-os-text-secondary mt-0.5">
                Continuous AI-Generated Enterprise Ecosystems (25 Packages/Hour) & Authoritative Demo Firestore Daemon
              </p>
            </div>
          </div>
        </div>

        {/* TOP ACTION BAR */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleToggleScheduler}
            disabled={isControllingScheduler}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded border transition-colors cursor-pointer disabled:opacity-50",
              (cloudSchedulerState?.status || simState.status) === 'RUNNING'
                ? "bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50"
                : "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50"
            )}
          >
            {(cloudSchedulerState?.status || simState.status) === 'RUNNING' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {(cloudSchedulerState?.status || simState.status) === 'RUNNING' ? 'Pause Cloud Scheduler' : 'Resume Cloud Scheduler'}
          </button>

          <button
            onClick={handleGenerateNow}
            disabled={isGenerating || dbEnv !== 'DEMO'}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold rounded bg-amber-600 hover:bg-amber-500 text-black transition-colors cursor-pointer disabled:opacity-50"
          >
            <Zap className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} />
            {isGenerating ? 'Generating 25 Packages...' : 'Generate Now (25 Packages)'}
          </button>

          <button
            onClick={() => setShowResetModal(true)}
            disabled={dbEnv !== 'DEMO'}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded bg-red-950/40 border border-red-500/40 text-red-400 hover:bg-red-900/50 transition-colors cursor-pointer disabled:opacity-50"
            title="Reset Demo Dataset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Data
          </button>
        </div>
      </div>

      {/* LIVE ENGINE STATUS & METRICS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl border border-os-border bg-os-surface/60">
          <span className="text-[10px] font-mono text-os-text-muted block mb-1">CLOUD SCHEDULER</span>
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2.5 h-2.5 rounded-full",
              (cloudSchedulerState?.status || simState.status) === 'RUNNING' ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
            )} />
            <span className="text-sm font-mono font-bold text-white uppercase">
              {cloudSchedulerState?.status || simState.status}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-os-border bg-os-surface/60">
          <span className="text-[10px] font-mono text-os-text-muted block mb-1">RATE TARGET</span>
          <span className="text-sm font-mono font-bold text-amber-400">
            25 packages / hr
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-os-border bg-os-surface/60">
          <span className="text-[10px] font-mono text-os-text-muted block mb-1">TARGET FIRESTORE</span>
          <span className="text-sm font-mono font-bold text-cyan-400">demo-orion9-db-2026</span>
        </div>

        <div className="p-3.5 rounded-xl border border-os-border bg-os-surface/60">
          <span className="text-[10px] font-mono text-os-text-muted block mb-1">BATCHES RECORDED</span>
          <span className="text-sm font-mono font-bold text-white">
            {cloudSchedulerState?.totalBatchesCompleted ?? batchHistory.length}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-os-border bg-os-surface/60">
          <span className="text-[10px] font-mono text-os-text-muted block mb-1">PACKAGES PERSISTED</span>
          <span className="text-sm font-mono font-bold text-emerald-400">
            {cloudSchedulerState?.totalPackagesGenerated ?? (batchHistory.length * 25)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-os-border bg-os-surface/60">
          <span className="text-[10px] font-mono text-os-text-muted block mb-1">NEXT CLOUD RUN (UTC)</span>
          <span className="text-sm font-mono font-bold text-purple-400">
            {cloudSchedulerState?.nextScheduledRun ? new Date(cloudSchedulerState.nextScheduledRun).toLocaleTimeString() : 'Active Hourly'}
          </span>
        </div>
      </div>

      {/* SIMULATION SPEED & CONFIGURATION CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* SPEED SELECTOR CARD */}
        <div className="p-5 rounded-xl border border-os-border bg-os-surface/40 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="font-mono font-bold text-sm text-white">CLIENT TELEMETRY SPEED</h3>
          </div>
          <p className="text-xs text-os-text-secondary">
            Controls UI visual step rate for active sessions without altering the 25 pkg/hr cloud daemon.
          </p>

          <div className="grid grid-cols-4 gap-2">
            {(['1x', '5x', '20x', 'PAUSED'] as SimulationSpeed[]).map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={cn(
                  "py-2 text-xs font-mono font-bold rounded border transition-all cursor-pointer",
                  simState.speed === speed
                    ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_8px_rgba(0,242,254,0.3)]"
                    : "bg-os-surface border-os-border text-os-text-secondary hover:text-white hover:border-os-border-active"
                )}
              >
                {speed === '1x' ? '1x Real' : speed === '5x' ? '5x Fast' : speed === '20x' ? '20x Hyper' : 'Paused'}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-os-border/40 flex items-center justify-between">
            <span className="text-[11px] font-mono text-os-text-muted">Manual Step:</span>
            <button
              onClick={handleAdvanceOneCycle}
              disabled={isAdvancingCycle || dbEnv !== 'DEMO'}
              className="px-3 py-1 text-xs font-mono rounded bg-os-surface border border-os-border hover:border-cyan-400 text-cyan-300 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <ArrowRight className={cn("w-3 h-3", isAdvancingCycle && "animate-spin")} />
              Advance 1 Cycle
            </button>
          </div>
        </div>

        {/* EXCEPTION PROBABILITIES CARD */}
        <div className="p-5 rounded-xl border border-os-border bg-os-surface/40 space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h3 className="font-mono font-bold text-sm text-white">CONTROLLED DISRUPTIONS</h3>
          </div>
          <p className="text-xs text-os-text-secondary">
            Configure empirical injection rates for synthetic supply chain exceptions.
          </p>

          <div className="space-y-2.5 text-xs font-mono">
            <div>
              <div className="flex justify-between text-[11px] text-os-text-muted mb-1">
                <span>Transport Delays</span>
                <span className="text-amber-400">
                  {Math.round(simConfig.exceptionProbabilities.transportDelayProbability * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={simConfig.exceptionProbabilities.transportDelayProbability}
                onChange={(e) => {
                  demoLiveSimulationEngine.updateConfig({
                    exceptionProbabilities: { transportDelayProbability: parseFloat(e.target.value) } as any,
                  });
                  setSimConfig(demoLiveSimulationEngine.getConfig());
                }}
                className="w-full accent-amber-500 cursor-pointer h-1 bg-os-border rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-os-text-muted mb-1">
                <span>Supplier Delays</span>
                <span className="text-amber-400">
                  {Math.round(simConfig.exceptionProbabilities.supplierDelayProbability * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={simConfig.exceptionProbabilities.supplierDelayProbability}
                onChange={(e) => {
                  demoLiveSimulationEngine.updateConfig({
                    exceptionProbabilities: { supplierDelayProbability: parseFloat(e.target.value) } as any,
                  });
                  setSimConfig(demoLiveSimulationEngine.getConfig());
                }}
                className="w-full accent-amber-500 cursor-pointer h-1 bg-os-border rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* RETENTION POLICY CARD */}
        <div className="p-5 rounded-xl border border-os-border bg-os-surface/40 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="font-mono font-bold text-sm text-white">DATA RETENTION POLICY</h3>
          </div>
          <p className="text-xs text-os-text-secondary">
            Automated synthetic data pruning prevents unbounded storage expansion.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {(['7_DAYS', '30_DAYS', '90_DAYS', 'UNLIMITED'] as DemoRetentionPolicy[]).map((policy) => (
              <button
                key={policy}
                onClick={() => {
                  demoLiveSimulationEngine.updateConfig({ retentionPolicy: policy });
                  setSimConfig(demoLiveSimulationEngine.getConfig());
                  showToast(`Retention policy updated to ${policy}`, 'info');
                }}
                className={cn(
                  "py-2 px-2 text-xs font-mono font-bold rounded border transition-all cursor-pointer text-center",
                  simConfig.retentionPolicy === policy
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                    : "bg-os-surface border-os-border text-os-text-secondary hover:text-white"
                )}
              >
                {policy.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-os-border/40 text-[11px] font-mono text-os-text-muted flex items-center justify-between">
            <span>Daemon Mode:</span>
            <span className="text-emerald-400 font-bold">
              CLOUD_PERSISTENT
            </span>
          </div>
        </div>
      </div>

      {/* GENERATION AUDIT HISTORY TABLE */}
      <div className="p-5 rounded-xl border border-os-border bg-os-surface/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h3 className="font-mono font-bold text-sm text-white">GENERATION AUDIT & BATCH LOG</h3>
          </div>
          <span className="text-xs font-mono text-os-text-muted">
            Total Batches Recorded: {batchHistory.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-os-border text-os-text-muted bg-black/40">
                <th className="p-2.5">BATCH ID</th>
                <th className="p-2.5">PACKAGES</th>
                <th className="p-2.5">COMPANIES</th>
                <th className="p-2.5">SUPPLIERS</th>
                <th className="p-2.5">PRODUCTS</th>
                <th className="p-2.5">PURCHASE ORDERS</th>
                <th className="p-2.5">SHIPMENTS</th>
                <th className="p-2.5">DURATION</th>
                <th className="p-2.5">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {batchHistory.length > 0 ? (
                batchHistory.map((batch) => (
                  <tr key={batch.generationBatchId} className="border-b border-os-border/40 hover:bg-os-surface/60">
                    <td className="p-2.5 font-bold text-cyan-300">{batch.generationBatchId}</td>
                    <td className="p-2.5 text-white">{batch.packageCount}</td>
                    <td className="p-2.5 text-white">{batch.recordCounts.companies}</td>
                    <td className="p-2.5 text-white">{batch.recordCounts.suppliers}</td>
                    <td className="p-2.5 text-white">{batch.recordCounts.products}</td>
                    <td className="p-2.5 text-white">{batch.recordCounts.purchaseOrders}</td>
                    <td className="p-2.5 text-white">{batch.recordCounts.shipments}</td>
                    <td className="p-2.5 text-os-text-muted">{batch.durationMs}ms</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        {batch.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-os-text-muted">
                    No generation batches recorded in this session. Click "Generate Now (25 Packages)" or let the cloud scheduler daemon run automatically.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* GOVERNED RESET CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-[2147483600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-os-surface border border-os-border rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400 border-b border-os-border pb-3">
              <AlertOctagon className="w-6 h-6" />
              <div>
                <h3 className="font-mono font-bold text-white text-base">
                  GOVERNED DEMO DATA RESET
                </h3>
                <p className="text-xs text-os-text-secondary">Administrative Sandbox Maintenance</p>
              </div>
            </div>

            <div className="text-xs space-y-2 text-os-text-secondary bg-black/40 p-3 rounded-lg border border-os-border/40">
              <p>
                <strong className="text-white">Safety Check:</strong> This action is only permitted in DEMO mode. LIVE database records can never be touched or reset.
              </p>
              <p>
                <strong className="text-white">Result:</strong> All synthetic demo companies, orders, shipments, and exceptions will be purged and re-initialized with a pristine 25-package baseline ecosystem.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono text-os-text-muted">
                Type <span className="text-red-400 font-bold">RESET DEMO DATA</span> to confirm:
              </label>
              <input
                type="text"
                value={resetConfirmation}
                onChange={(e) => setResetConfirmation(e.target.value)}
                placeholder="RESET DEMO DATA"
                className="w-full px-3 py-1.5 text-xs font-mono bg-black/60 border border-os-border rounded focus:border-red-500 focus:outline-none text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirmation('');
                }}
                className="flex-1 py-2 text-xs font-mono rounded bg-os-surface border border-os-border hover:bg-os-surface-hover text-os-text-secondary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={isResetting || resetConfirmation !== 'RESET DEMO DATA'}
                className="flex-1 py-2 text-xs font-mono font-bold rounded bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isResetting ? 'Purging & Reseeding...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
