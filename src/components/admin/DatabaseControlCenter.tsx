import React, { useState, useEffect } from 'react';
import { 
  Database, Shield, Server, CheckCircle2, AlertTriangle, RefreshCw, 
  Layers, Lock, Activity, Cpu, ArrowRightLeft, Check, AlertOctagon,
  Sparkles, Trash2, Search, ExternalLink, HardDrive, ShieldCheck, Zap
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { 
  DatabaseEnvironmentMode, 
  DatabaseEnvironmentState,
  LIVE_DATABASE_CONFIG,
  DEMO_DATABASE_CONFIG
} from '../../core/database/DatabaseEnvironment';
import { 
  getAllDomainSchemas, 
  getAllCollections,
  DatabaseDomainCode,
  SchemaEntityDefinition,
  DomainSchemaGroup
} from '../../core/database/DatabaseSchemaRegistry';
import { 
  integrityValidator, 
  DatabaseAuditReport 
} from '../../core/database/DatabaseIntegrityValidator';
import { demoSeeder } from '../../core/database/DemoDataSeeder';
import { cn } from '../../lib/utils';

export const DatabaseControlCenter: React.FC = () => {
  const { profile, hasRole } = useAuth();
  const { showToast } = useToast();

  const isPlatformAdmin = profile?.role === 'platform_admin' || hasRole(['platform_admin']);
  const isOrgAdmin = profile?.role === 'organization_admin' || hasRole(['organization_admin']);

  const [envState, setEnvState] = useState<DatabaseEnvironmentState>(() => dbManager.getState());
  const [isProbing, setIsProbing] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<DatabaseDomainCode | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Step-up confirmation modal state
  const [switchModalTarget, setSwitchModalTarget] = useState<DatabaseEnvironmentMode | null>(null);
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [switchReason, setSwitchReason] = useState('');

  // Integrity audit state
  const [integrityReport, setIntegrityReport] = useState<DatabaseAuditReport | null>(null);
  const [isRunningAudit, setIsRunningAudit] = useState(false);

  // Seeder state
  const [isSeeding, setIsSeeding] = useState(false);

  // Sync state on events
  useEffect(() => {
    const handleEnvChanged = () => {
      setEnvState(dbManager.getState());
    };
    window.addEventListener('orion-database-environment-changed', handleEnvChanged);
    return () => window.removeEventListener('orion-database-environment-changed', handleEnvChanged);
  }, []);

  // Initial latency probe
  const probeConnectivity = async () => {
    setIsProbing(true);
    try {
      const state = await dbManager.testConnectivity();
      setEnvState(state);
      showToast(`Database latency: ${state.measuredLatencyMs}ms (${state.status})`, 'info');
    } catch (e: any) {
      showToast('Connectivity check failed: ' + (e?.message || 'Unknown error'), 'error');
    } finally {
      setIsProbing(false);
    }
  };

  const handleInitiateSwitch = (target: DatabaseEnvironmentMode) => {
    if (target === envState.environment) {
      showToast(`Already connected to ${target} database environment`, 'info');
      return;
    }
    setConfirmationPhrase('');
    setSwitchReason('');
    setSwitchModalTarget(target);
  };

  const executeSwitch = async () => {
    if (!switchModalTarget) return;

    if (switchModalTarget === 'LIVE') {
      if (confirmationPhrase !== 'SWITCH TO LIVE') {
        showToast('Please type "SWITCH TO LIVE" exactly to confirm step-up authorization', 'error');
        return;
      }
      if (!switchReason.trim()) {
        showToast('A valid audit reason is required when switching to LIVE database', 'error');
        return;
      }
    }

    setIsSwitching(true);
    try {
      const result = await dbManager.switchEnvironment({
        targetEnvironment: switchModalTarget,
        actorUserId: profile?.id || 'admin',
        actorRole: (profile?.role as any) || 'platform_admin',
        callerType: 'human_admin',
        stepUpConfirmed: true,
        reason: switchReason.trim() || `Admin switched to ${switchModalTarget} environment`,
      });

      if (result.success) {
        setEnvState(dbManager.getState());
        setSwitchModalTarget(null);
        showToast(
          `Switched to ${result.currentEnvironment} database. Closed ${result.listenersRecreatedCount} active listeners. Cache namespaced to "${result.cacheNamespace}".`,
          'success'
        );
      } else {
        showToast(result.error || 'Failed to switch database environment', 'error');
      }
    } catch (e: any) {
      showToast('Switch error: ' + (e?.message || 'Unknown error'), 'error');
    } finally {
      setIsSwitching(false);
    }
  };

  const runIntegrityAudit = async () => {
    setIsRunningAudit(true);
    try {
      const report = await integrityValidator.runFullAudit();
      setIntegrityReport(report);
      showToast(`Integrity audit complete. Overall Score: ${report.overallScore}% across ${report.collectionsAudited} collections.`, 'success');
    } catch (err: any) {
      showToast('Integrity audit failed: ' + (err?.message || 'Unknown error'), 'error');
    } finally {
      setIsRunningAudit(false);
    }
  };

  const handleSeedDemoData = async () => {
    if (envState.environment === 'LIVE') {
      showToast('Data seeding is STRICTLY FORBIDDEN on LIVE environment', 'error');
      return;
    }
    setIsSeeding(true);
    try {
      const summary = await demoSeeder.seedDemoEnvironment(envState.activeTenantId);
      showToast(`Seeded demo data: ${summary.counts.suppliers} suppliers, ${summary.counts.products} products, ${summary.counts.warehouses} warehouses.`, 'success');
      runIntegrityAudit().catch(() => {});
    } catch (e: any) {
      showToast('Seeder failure: ' + (e?.message || 'Unknown error'), 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const domainList = getAllDomainSchemas();
  const allCollections = getAllCollections();

  const filteredCollections = allCollections.filter(c => {
    const matchesDomain = selectedDomain === 'ALL' || c.domain === selectedDomain;
    const matchesSearch = searchTerm === '' || 
      c.collectionPath.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-os-bg text-os-text-primary">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-os-border pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold font-mono tracking-tight text-white flex items-center gap-3">
                DATABASE CONTROL PLANE
                <span className={cn(
                  "text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold uppercase tracking-wider border",
                  envState.environment === 'LIVE'
                    ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    : "bg-amber-950/80 text-amber-400 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                )}>
                  {envState.environment} MODE
                </span>
              </h1>
              <p className="text-xs text-os-text-secondary mt-0.5">
                Authoritative Multi-Tenant Schema Registry, Environment Isolation & Governed Control Plane
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={probeConnectivity}
            disabled={isProbing}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded bg-os-surface border border-os-border hover:border-cyan-500/50 hover:text-cyan-400 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isProbing && "animate-spin text-cyan-400")} />
            {isProbing ? 'Probing Latency...' : 'Probe Database'}
          </button>
          <button
            onClick={runIntegrityAudit}
            disabled={isRunningAudit}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Activity className={cn("w-3.5 h-3.5", isRunningAudit && "animate-pulse")} />
            {isRunningAudit ? 'Auditing Schema...' : 'Run Integrity Audit'}
          </button>
        </div>
      </div>

      {/* ENVIRONMENT SWITCHER CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LIVE DATABASE CARD */}
        <div className={cn(
          "relative p-5 rounded-xl border transition-all",
          envState.environment === 'LIVE'
            ? "bg-emerald-950/20 border-emerald-500/60 shadow-lg shadow-emerald-950/30"
            : "bg-os-surface/60 border-os-border hover:border-os-border-active"
        )}>
          {envState.environment === 'LIVE' && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ACTIVE ENVIRONMENT
            </div>
          )}
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-white text-sm">LIVE DATABASE</h3>
              <p className="text-[11px] font-mono text-emerald-400/80">{LIVE_DATABASE_CONFIG.projectId}</p>
            </div>
          </div>

          <p className="text-xs text-os-text-secondary mb-4">
            Production Cloud Firestore instance. Authoritative persistence for active supply chain operations, enterprise multi-tenancy, and governed policy actions.
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-black/40 p-3 rounded-lg border border-os-border/50 mb-4">
            <div>
              <span className="text-os-text-muted block text-[10px]">CACHE NAMESPACE</span>
              <span className="text-emerald-400">{LIVE_DATABASE_CONFIG.cachePrefix}</span>
            </div>
            <div>
              <span className="text-os-text-muted block text-[10px]">SECURITY RULES</span>
              <span className="text-white">Strict Multi-Tenant</span>
            </div>
            <div>
              <span className="text-os-text-muted block text-[10px]">SEEDING ALLOWED</span>
              <span className="text-red-400 font-bold">STRICTLY BLOCKED</span>
            </div>
            <div>
              <span className="text-os-text-muted block text-[10px]">LATENCY</span>
              <span className="text-white">
                {envState.environment === 'LIVE' ? `${envState.measuredLatencyMs}ms` : '—'}
              </span>
            </div>
          </div>

          {envState.environment !== 'LIVE' ? (
            <button
              onClick={() => handleInitiateSwitch('LIVE')}
              className="w-full py-2 px-3 text-xs font-mono font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950"
            >
              <Lock className="w-3.5 h-3.5" />
              Switch to LIVE (Requires Step-Up Authorization)
            </button>
          ) : (
            <div className="w-full py-1.5 text-center text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 rounded">
              Current Connected Authority
            </div>
          )}
        </div>

        {/* DEMO DATABASE CARD */}
        <div className={cn(
          "relative p-5 rounded-xl border transition-all",
          envState.environment === 'DEMO'
            ? "bg-amber-950/20 border-amber-500/60 shadow-lg shadow-amber-950/30"
            : "bg-os-surface/60 border-os-border hover:border-os-border-active"
        )}>
          {envState.environment === 'DEMO' && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              ACTIVE ENVIRONMENT
            </div>
          )}
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-white text-sm">DEMO DATABASE</h3>
              <p className="text-[11px] font-mono text-amber-400/80">{DEMO_DATABASE_CONFIG.projectId}</p>
            </div>
          </div>

          <p className="text-xs text-os-text-secondary mb-4">
            Isolated synthetic sandbox environment. Completely partitioned from production data with zero cross-tenant contamination or risk of production write leakage.
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-black/40 p-3 rounded-lg border border-os-border/50 mb-4">
            <div>
              <span className="text-os-text-muted block text-[10px]">CACHE NAMESPACE</span>
              <span className="text-amber-400">{DEMO_DATABASE_CONFIG.cachePrefix}</span>
            </div>
            <div>
              <span className="text-os-text-muted block text-[10px]">ISOLATION LEVEL</span>
              <span className="text-white">Strict Airgap</span>
            </div>
            <div>
              <span className="text-os-text-muted block text-[10px]">SEEDING TOOLS</span>
              <span className="text-emerald-400">Enabled (Safe Sandbox)</span>
            </div>
            <div>
              <span className="text-os-text-muted block text-[10px]">LATENCY</span>
              <span className="text-white">
                {envState.environment === 'DEMO' ? `${envState.measuredLatencyMs}ms` : '—'}
              </span>
            </div>
          </div>

          {envState.environment !== 'DEMO' ? (
            <button
              onClick={() => handleInitiateSwitch('DEMO')}
              className="w-full py-2 px-3 text-xs font-mono font-bold rounded bg-amber-600 hover:bg-amber-500 text-black transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-950"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Switch to DEMO Sandbox
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSeedDemoData}
                disabled={isSeeding}
                className="flex-1 py-1.5 text-xs font-mono font-bold rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Zap className={cn("w-3.5 h-3.5", isSeeding && "animate-spin")} />
                {isSeeding ? 'Seeding...' : 'Seed Synthetic Data'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* INTEGRITY AUDIT SUMMARY */}
      {integrityReport && (
        <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <h3 className="font-mono font-bold text-sm text-white">
                DATABASE INTEGRITY & MULTI-TENANT AUDIT REPORT
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-os-text-secondary">Health Score:</span>
              <span className={cn(
                "text-sm font-mono font-bold px-2 py-0.5 rounded border",
                integrityReport.overallScore >= 90
                  ? "bg-emerald-950 text-emerald-400 border-emerald-500/40"
                  : integrityReport.overallScore >= 70
                  ? "bg-amber-950 text-amber-400 border-amber-500/40"
                  : "bg-red-950 text-red-400 border-red-500/40"
              )}>
                {integrityReport.overallScore}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded bg-black/40 border border-os-border/40">
              <span className="text-[10px] text-os-text-muted block">COLLECTIONS AUDITED</span>
              <span className="text-white font-bold text-sm">{integrityReport.collectionsAudited}</span>
            </div>
            <div className="p-2.5 rounded bg-black/40 border border-os-border/40">
              <span className="text-[10px] text-os-text-muted block">TOTAL DOCUMENTS SAMPLED</span>
              <span className="text-white font-bold text-sm">{integrityReport.totalDocumentsSampled}</span>
            </div>
            <div className="p-2.5 rounded bg-black/40 border border-os-border/40">
              <span className="text-[10px] text-os-text-muted block">TOTAL VIOLATIONS</span>
              <span className={cn("font-bold text-sm", integrityReport.totalViolationsFound === 0 ? "text-emerald-400" : "text-amber-400")}>
                {integrityReport.totalViolationsFound}
              </span>
            </div>
            <div className="p-2.5 rounded bg-black/40 border border-os-border/40">
              <span className="text-[10px] text-os-text-muted block">ENVIRONMENT</span>
              <span className="text-cyan-400 font-bold text-sm">
                {integrityReport.environment}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 18-DOMAIN SCHEMA REGISTRY BROWSER */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              18-DOMAIN AUTHORITATIVE SCHEMA REGISTRY
            </h2>
            <p className="text-xs text-os-text-secondary">
              Exhaustive index of collections across all supply chain operational domains (A–R).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-os-text-muted" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search collection or entity..."
                className="pl-8 pr-3 py-1 text-xs font-mono bg-os-surface border border-os-border rounded focus:border-cyan-500 focus:outline-none w-48 text-white placeholder:text-os-text-muted"
              />
            </div>

            <select
              value={selectedDomain}
              onChange={e => setSelectedDomain(e.target.value as any)}
              className="px-2.5 py-1 text-xs font-mono bg-os-surface border border-os-border rounded focus:border-cyan-500 focus:outline-none text-os-text-primary"
            >
              <option value="ALL">All Domains ({allCollections.length} collections)</option>
              {domainList.map(d => (
                <option key={d.domain} value={d.domain}>
                  {d.domain}: {d.name} ({d.collections.length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* DOMAINS CAROUSEL / GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCollections.map(col => (
            <div
              key={col.collectionPath}
              className="p-3.5 rounded-lg border border-os-border bg-os-surface/40 hover:bg-os-surface/70 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                    {col.domain}
                  </span>
                  <span className="text-[10px] font-mono text-os-text-muted">
                    PK: {col.primaryKey}
                  </span>
                </div>

                <h4 className="font-mono font-bold text-white text-xs mb-1 truncate">
                  {col.collectionPath}
                </h4>
                <p className="text-[11px] text-os-text-secondary line-clamp-2 mb-2">
                  {col.description}
                </p>
              </div>

              <div className="pt-2 border-t border-os-border/40 text-[10px] font-mono flex items-center justify-between text-os-text-muted">
                <span>Tenant: {col.tenantField}</span>
                <span className="text-emerald-400">Rule: {col.ruleCoverage}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STEP-UP CONFIRMATION MODAL */}
      {switchModalTarget && (
        <div className="fixed inset-0 z-[2147483600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-os-surface border border-os-border rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400 border-b border-os-border pb-3">
              <AlertOctagon className="w-6 h-6" />
              <div>
                <h3 className="font-mono font-bold text-white text-base">
                  CONFIRM DATABASE SWITCH TO {switchModalTarget}
                </h3>
                <p className="text-xs text-os-text-secondary">Governed Administrative Action</p>
              </div>
            </div>

            <div className="text-xs space-y-2 text-os-text-secondary bg-black/40 p-3 rounded-lg border border-os-border/40">
              <p>
                <strong className="text-white">Active Listeners:</strong> All {envState.activeListenersCount} active snapshot listeners will be cleanly terminated before switching.
              </p>
              <p>
                <strong className="text-white">Cache Invalidation:</strong> In-memory and persisted query caches will be partitioned under namespace: <code className="text-cyan-400">{switchModalTarget === 'LIVE' ? LIVE_DATABASE_CONFIG.cachePrefix : DEMO_DATABASE_CONFIG.cachePrefix}</code>
              </p>
              <p>
                <strong className="text-white">Outbox Isolation:</strong> Pending mutations from prior environment will not be replayed across environment boundaries.
              </p>
            </div>

            {switchModalTarget === 'LIVE' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono text-os-text-muted mb-1">
                    Audit Reason (Required for LIVE switch)
                  </label>
                  <input
                    type="text"
                    value={switchReason}
                    onChange={e => setSwitchReason(e.target.value)}
                    placeholder="e.g., Routine production supply chain shift"
                    className="w-full px-3 py-1.5 text-xs font-mono bg-black/60 border border-os-border rounded focus:border-emerald-500 focus:outline-none text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-os-text-muted mb-1">
                    Type <span className="text-emerald-400 font-bold">SWITCH TO LIVE</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmationPhrase}
                    onChange={e => setConfirmationPhrase(e.target.value)}
                    placeholder="SWITCH TO LIVE"
                    className="w-full px-3 py-1.5 text-xs font-mono bg-black/60 border border-os-border rounded focus:border-emerald-500 focus:outline-none text-white"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSwitchModalTarget(null)}
                className="flex-1 py-2 text-xs font-mono rounded bg-os-surface border border-os-border hover:bg-os-surface-hover text-os-text-secondary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSwitch}
                disabled={isSwitching}
                className={cn(
                  "flex-1 py-2 text-xs font-mono font-bold rounded text-white transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50",
                  switchModalTarget === 'LIVE'
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-amber-600 hover:bg-amber-500 text-black"
                )}
              >
                {isSwitching ? 'Executing Transition...' : `Confirm Switch to ${switchModalTarget}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
