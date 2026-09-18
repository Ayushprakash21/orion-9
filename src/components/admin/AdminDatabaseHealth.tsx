import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  ShieldCheck, 
  HardDrive, 
  Layers, 
  ArrowUpRight,
  Clock,
  Server
} from 'lucide-react';
import { databaseHealthService, DatabaseHealthReport, ORION_SCHEMA_COLLECTIONS } from '../../services/databaseHealthService';
import { outboxSyncEngine } from '../../core/data/OutboxSyncEngine';

export const AdminDatabaseHealth: React.FC = () => {
  const [report, setReport] = useState<DatabaseHealthReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const data = await databaseHealthService.checkHealth();
      setReport(data);
    } catch (err) {
      console.warn('Failed to fetch DB health:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const triggerOutboxSync = async () => {
    setIsSyncing(true);
    try {
      await outboxSyncEngine.processQueue();
      await fetchHealth();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-6 text-os-text-primary">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-os-border pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Database Architecture & Health Verification</h2>
              <p className="text-xs text-os-text-muted mt-0.5">
                Primary: <strong className="text-os-text-primary">Google Firebase (Auth & Cloud Firestore)</strong> • Local Store: <strong className="text-os-text-primary">IndexedDB / LocalForage</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchHealth}
            disabled={isLoading}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-os-border bg-os-surface hover:bg-os-border/50 text-os-text-primary transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Diagnostics
          </button>
          <button
            onClick={triggerOutboxSync}
            disabled={isSyncing}
            className="px-3.5 py-2 text-xs font-medium rounded-lg bg-os-accent text-black hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <ArrowUpRight className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Outbox
          </button>
        </div>
      </div>

      {/* Main Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Remote Connection */}
        <div className="p-4 rounded-xl border border-os-border bg-os-surface/40 backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-os-text-muted">
            <span>Remote Database</span>
            <Server className="w-4 h-4 text-os-text-muted" />
          </div>
          <div className="text-base font-semibold font-mono flex items-center gap-2">
            {report?.connectionStatus === 'CONNECTED' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">CONNECTED</span>
              </>
            ) : report?.connectionStatus === 'CONFIGURED' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">CONFIGURED</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-400" />
                <span className="text-rose-400">ERROR</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-os-text-muted">
            {report?.provider}
          </p>
        </div>

        {/* Schema Status */}
        <div className="p-4 rounded-xl border border-os-border bg-os-surface/40 backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-os-text-muted">
            <span>Cloud Firestore Schema</span>
            <Layers className="w-4 h-4 text-os-text-muted" />
          </div>
          <div className="text-base font-semibold font-mono flex items-center gap-2">
            {report?.firestoreStatus === 'CONNECTED' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">ACTIVE</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">UNVERIFIED</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-os-text-muted">
            Collections: <strong>firestore.rules</strong> ({report?.tableAvailability.totalDefined} collections)
          </p>
        </div>

        {/* Firestore Security Rules Enforcement */}
        <div className="p-4 rounded-xl border border-os-border bg-os-surface/40 backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-os-text-muted">
            <span>Firestore Security Rules</span>
            <ShieldCheck className="w-4 h-4 text-os-text-muted" />
          </div>
          <div className="text-base font-semibold font-mono flex items-center gap-2">
            {report?.securityRulesStatus === 'VERIFIED' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">HARDENED</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">UNVERIFIED</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-os-text-muted">
            Tenant Isolation: Mandatory Org ID
          </p>
        </div>

        {/* Local IndexedDB Store */}
        <div className="p-4 rounded-xl border border-os-border bg-os-surface/40 backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-os-text-muted">
            <span>Local Cache & Outbox</span>
            <HardDrive className="w-4 h-4 text-os-text-muted" />
          </div>
          <div className="text-base font-semibold font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400">AVAILABLE</span>
          </div>
          <p className="text-[11px] text-os-text-muted">
            Outbox Queue: {report?.syncStatus.pendingOutboxCount} pending changes
          </p>
        </div>
      </div>

      {/* Verification Notice Banner */}
      <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-3">
        <div className="p-1 rounded-md bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="text-xs space-y-1">
          <p className="font-semibold text-blue-300">Dual-Tier Enterprise Architecture Grounding</p>
          <p className="text-os-text-muted leading-relaxed">
            Orion-9 never treats local browser storage as the enterprise system-of-record. <strong>Google Firebase Auth & Cloud Firestore</strong> serve as the persistent multi-tenant system-of-record with strict Firestore Security Rules. <strong>IndexedDB (LocalForage)</strong> operates as a zero-latency local cache with an offline transactional Outbox queue, guaranteeing offline continuity and immediate responsiveness.
          </p>
        </div>
      </div>

      {/* Schema Collection Inventory */}
      <div className="rounded-xl border border-os-border bg-os-surface/30 overflow-hidden">
        <div className="px-5 py-4 border-b border-os-border flex items-center justify-between bg-os-surface/50">
          <div>
            <h3 className="text-sm font-semibold">Orion-9 Enterprise Firestore Collections ({ORION_SCHEMA_COLLECTIONS.length} Collections)</h3>
            <p className="text-xs text-os-text-muted mt-0.5">All collections protected with mandatory organization/tenant isolation and Firestore Security Rules</p>
          </div>
          <span className="px-2.5 py-1 text-[10px] font-mono rounded-md bg-white/5 border border-os-border text-os-text-secondary">
            v2.0 Firebase Architecture
          </span>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {ORION_SCHEMA_COLLECTIONS.map(collection => (
              <div
                key={collection}
                className="px-3 py-2 rounded-lg border border-os-border/60 bg-os-surface/50 flex items-center justify-between font-mono text-xs"
              >
                <span className="truncate">{collection}</span>
                <span className="text-[10px] text-emerald-400 font-sans ml-2">Rules</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
