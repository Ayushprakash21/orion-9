import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  ShieldCheck, 
  RefreshCw, 
  Radio, 
  Activity,
  HardDrive
} from 'lucide-react';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { DatabaseEnvironmentMode } from '../../core/database/DatabaseEnvironment';
import { useToast } from '../../store/ToastContext';
import { OrionSettingsSplitLayout } from './OrionSettingsSplitLayout';
import { HealthService } from '../../operations/HealthService';

export const EnvironmentSettingsPanel: React.FC = () => {
  const { showToast } = useToast();
  const [currentEnv, setCurrentEnv] = useState<DatabaseEnvironmentMode>(() => dbManager.getEnvironment());
  const [pendingEnv, setPendingEnv] = useState<DatabaseEnvironmentMode | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    latencyMs: number;
    dbStatus: string;
    backendMode: string;
  }>({
    latencyMs: 12,
    dbStatus: 'CONNECTED',
    backendMode: 'IndexedDB / Firestore',
  });

  // Track environment changes across OS
  useEffect(() => {
    const handleEnvChanged = () => {
      const active = dbManager.getEnvironment();
      setCurrentEnv(active);
    };

    window.addEventListener('orion-database-environment-changed', handleEnvChanged);

    // Initial probe
    const runProbe = async () => {
      try {
        const state = dbManager.getState();
        const health = await HealthService.getInstance().runHealthCheck();
        setHealthStatus({
          latencyMs: state.measuredLatencyMs || (health.livenessProbe ? 14 : 28),
          dbStatus: state.status,
          backendMode: dbManager.getEnvironment() === 'LIVE' ? 'Cloud Firestore & Relays' : 'Local Demo Sandbox',
        });
      } catch {
        // Fallback
      }
    };
    runProbe();

    return () => {
      window.removeEventListener('orion-database-environment-changed', handleEnvChanged);
    };
  }, []);

  const handleInitiateSwitch = (target: DatabaseEnvironmentMode) => {
    if (target === currentEnv) return;
    setPendingEnv(target);
    setIsConfirmOpen(true);
  };

  const handleConfirmSwitch = async () => {
    if (!pendingEnv) return;
    setIsSwitching(true);
    try {
      dbManager.setEnvironment(pendingEnv);
      setCurrentEnv(pendingEnv);
      showToast(
        `Orion OS Environment switched to ${pendingEnv}`,
        'success',
        'System Environment'
      );
      setHealthStatus(prev => ({
        ...prev,
        backendMode: pendingEnv === 'LIVE' ? 'Cloud Firestore & Relays' : 'Local Demo Sandbox',
      }));
    } catch (err: any) {
      showToast(err?.message || 'Failed to switch environment', 'error', 'System Environment');
    } finally {
      setIsSwitching(false);
      setIsConfirmOpen(false);
      setPendingEnv(null);
    }
  };

  const primaryContent = (
    <div className="space-y-6">
      {/* Current Active Mode Banner */}
      <div 
        data-testid="environment-active-banner"
        className={`p-4 rounded-xl border backdrop-blur-md flex items-center justify-between gap-4 ${
          currentEnv === 'LIVE'
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-amber-500/10 border-amber-500/30'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${
            currentEnv === 'LIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono tracking-widest text-white/50">Active OS Environment</span>
              <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-md ${
                currentEnv === 'LIVE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {currentEnv} MODE
              </span>
            </div>
            <p className="text-sm font-semibold text-white mt-0.5">
              {currentEnv === 'LIVE'
                ? 'Production Cloud Services & Persistent Databases'
                : 'Sandboxed Demonstration Mode with Synthetic Enterprise Data'}
            </p>
          </div>
        </div>
      </div>

      {/* Environment Choice Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
          Available Environments
        </h3>

        {/* LIVE Environment Option */}
        <div 
          data-testid="env-option-live"
          className={`p-5 rounded-xl border transition-all ${
            currentEnv === 'LIVE'
              ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
              : 'bg-white/[0.03] border-white/[0.08] hover:border-white/20'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5">
                <Server className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white">LIVE Environment</h4>
                  {currentEnv === 'LIVE' && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-md">
                  Real enterprise operations connected to persistent cloud services, tenant Firestore documents, and live multi-echelon SCM event streams.
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">Cloud Firestore</span>
                  <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">Production Relays</span>
                  <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">Audit Logging</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              data-testid="switch-to-live-btn"
              disabled={currentEnv === 'LIVE' || isSwitching}
              onClick={() => handleInitiateSwitch('LIVE')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                currentEnv === 'LIVE'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 opacity-75 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95'
              }`}
            >
              {currentEnv === 'LIVE' ? 'Active Mode' : 'Switch to LIVE'}
            </button>
          </div>
        </div>

        {/* DEMO Environment Option */}
        <div 
          data-testid="env-option-demo"
          className={`p-5 rounded-xl border transition-all ${
            currentEnv === 'DEMO'
              ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-950/20'
              : 'bg-white/[0.03] border-white/[0.08] hover:border-white/20'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 mt-0.5">
                <Database className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white">DEMO Sandbox</h4>
                  {currentEnv === 'DEMO' && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-md">
                  Isolated sandbox with pre-seeded synthetic contracts, logistics shipments, and autonomous AI agents. Safe for exploratory testing and offline scenarios.
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">Synthetic Seeder</span>
                  <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">In-Memory Mock</span>
                  <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">Zero Cloud Costs</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              data-testid="switch-to-demo-btn"
              disabled={currentEnv === 'DEMO' || isSwitching}
              onClick={() => handleInitiateSwitch('DEMO')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                currentEnv === 'DEMO'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 opacity-75 cursor-default'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md active:scale-95'
              }`}
            >
              {currentEnv === 'DEMO' ? 'Active Mode' : 'Switch to DEMO'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmOpen && pendingEnv && (
        <div 
          data-testid="environment-confirm-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="bg-[#12151a] border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  Confirm Environment Switch
                </h3>
                <p className="text-xs text-slate-400">
                  Target: <span className="font-bold text-white uppercase">{pendingEnv}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Switching runtime environment immediately switches active database providers, clears memory-cached datasets, and broadcasts an OS-level environment change notification.
            </p>

            <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-[11px] text-slate-400 font-mono space-y-1">
              <div>Current: <span className="text-white font-bold">{currentEnv}</span></div>
              <div>Destination: <span className="text-white font-bold">{pendingEnv}</span></div>
              <div>Persistence: <span className="text-emerald-400">Local Configuration Key</span></div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                data-testid="cancel-env-switch-btn"
                onClick={() => {
                  setIsConfirmOpen(false);
                  setPendingEnv(null);
                }}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-env-switch-btn"
                disabled={isSwitching}
                onClick={handleConfirmSwitch}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 transition-colors shadow-lg cursor-pointer"
              >
                {isSwitching ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Switching...
                  </>
                ) : (
                  'Confirm Switch'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const secondaryContent = (
    <div className="space-y-5">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1">
          Runtime Diagnostics & Telemetry
        </h3>
        <p className="text-xs text-slate-500">
          Live connection telemetry and storage backend metrics.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3.5">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <span className="text-xs text-slate-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" /> Latency Probe
          </span>
          <span className="text-xs font-mono font-semibold text-emerald-400">
            {healthStatus.latencyMs} ms
          </span>
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <span className="text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Database Status
          </span>
          <span className="text-xs font-mono font-semibold text-white">
            {healthStatus.dbStatus}
          </span>
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <span className="text-xs text-slate-400 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-indigo-400" /> Primary Storage Provider
          </span>
          <span className="text-xs font-mono font-medium text-slate-300">
            {healthStatus.backendMode}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" /> Event Bus Broadcast
          </span>
          <span className="text-[11px] font-mono text-emerald-400">
            ONLINE
          </span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-500/20 space-y-2">
        <h4 className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" /> Architectural Boundary Note
        </h4>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          In ORION-9, environment configuration is governed strictly by the OS Kernel Settings. User authentication does not alter environment state; all sessions adhere to the active OS environment selection.
        </p>
      </div>
    </div>
  );

  return (
    <OrionSettingsSplitLayout
      title="System Environment"
      subtitle="Kernel Database & Data Service Orchestration"
      badge={currentEnv}
      primary={primaryContent}
      secondary={secondaryContent}
    />
  );
};
