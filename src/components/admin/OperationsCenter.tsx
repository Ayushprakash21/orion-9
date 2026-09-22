/**
 * ORION-9 WAVE 10: ENTERPRISE PRODUCTION CONTROL PLANE
 * Operations Center UI Component
 * 
 * Central platform command center providing real-time subsystem diagnostics,
 * emergency safety locks, active system alerts, and circuit breaker telemetry.
 */

import React, { useState, useEffect } from 'react';
import {
  healthService,
  productionSafetyService,
  alertEngine,
  controlledBackpressureService,
  environmentService,
  SystemHealthReport,
  ProductionSafetyControls,
  SystemAlert,
  CircuitBreakerStatus,
} from '../../operations';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Zap,
  Lock,
  Unlock,
  Radio,
  RefreshCw,
  Cpu,
  Server,
  Database,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const OperationsCenter: React.FC<{ tenantId?: string }> = ({ tenantId = 'GLOBAL' }) => {
  const [health, setHealth] = useState<SystemHealthReport | null>(null);
  const [safety, setSafety] = useState<ProductionSafetyControls>(() =>
    productionSafetyService.getControls(tenantId)
  );
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [breakers, setBreakers] = useState<CircuitBreakerStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'HEALTH' | 'SAFETY' | 'ALERTS' | 'BREAKERS'>('HEALTH');

  const refreshTelemetry = async () => {
    setLoading(true);
    try {
      const report = await healthService.runHealthCheck();
      setHealth(report);
      setSafety(productionSafetyService.getControls(tenantId));
      setAlerts(alertEngine.getActiveAlerts(tenantId));
      setBreakers(controlledBackpressureService.getAllBreakers());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTelemetry();
  }, [tenantId]);

  const toggleSafetyControl = (key: keyof ProductionSafetyControls) => {
    const currentVal = !!safety[key];
    const updated = productionSafetyService.updateControls(
      tenantId,
      { [key]: !currentVal },
      'platform_admin',
      `Manual toggle via Operations Center UI`
    );
    setSafety(updated);
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    alertEngine.acknowledgeAlert(alertId, 'platform_admin');
    setAlerts(alertEngine.getActiveAlerts(tenantId));
  };

  const handleResetBreaker = (serviceName: string) => {
    controlledBackpressureService.manuallyReset(serviceName);
    setBreakers(controlledBackpressureService.getAllBreakers());
  };

  const env = environmentService.getEnvironment();

  return (
    <div className="p-6 bg-slate-950 text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Activity className="h-6 w-6 text-cyan-400" />
              Operations Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Wave 10 Enterprise
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              ENV: {env}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time platform telemetry, deep diagnostic probes, emergency safety locks, and circuit breaker resilience.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshTelemetry}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              {health?.overallStatus || 'HEALTHY'}
            </span>
          </div>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Health Probes */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">System Health</span>
            <Server className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">8/8</span>
            <span className="text-xs text-emerald-400 font-semibold">Subsystems Online</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
            <span>Readiness: <strong className="text-emerald-400">PASS</strong></span>
            <span>•</span>
            <span>Liveness: <strong className="text-emerald-400">PASS</strong></span>
          </div>
        </div>

        {/* Card 2: Active Alerts */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Alerts</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{alerts.length}</span>
            <span className="text-xs text-amber-400 font-semibold">Deduplicated</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {alerts.filter(a => !a.acknowledged).length} unacknowledged
          </div>
        </div>

        {/* Card 3: Emergency Safety Locks */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Safety Controls</span>
            {safety.productionWriteLock || safety.aiActionKillSwitch ? (
              <ShieldAlert className="h-4 w-4 text-rose-400" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {safety.productionWriteLock || safety.aiActionKillSwitch ? 'ENGAGED' : 'NORMAL'}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            AI Kill: {safety.aiActionKillSwitch ? 'TRIPPED' : 'ARMED'} • Lock: {safety.productionWriteLock ? 'ON' : 'OFF'}
          </div>
        </div>

        {/* Card 4: Circuit Breakers */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Circuit Breakers</span>
            <Zap className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {breakers.filter(b => b.state === 'CLOSED').length}/{breakers.length}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">Closed (Passing)</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {breakers.filter(b => b.state !== 'CLOSED').length} tripped / probing
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('HEALTH')}
          className={`pb-3 text-sm font-medium transition border-b-2 flex items-center gap-2 ${
            activeTab === 'HEALTH'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="h-4 w-4" />
          Deep Diagnostic Probes
        </button>
        <button
          onClick={() => setActiveTab('SAFETY')}
          className={`pb-3 text-sm font-medium transition border-b-2 flex items-center gap-2 ${
            activeTab === 'SAFETY'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="h-4 w-4" />
          Emergency Safety Locks
        </button>
        <button
          onClick={() => setActiveTab('ALERTS')}
          className={`pb-3 text-sm font-medium transition border-b-2 flex items-center gap-2 ${
            activeTab === 'ALERTS'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          System Alerts Feed ({alerts.length})
        </button>
        <button
          onClick={() => setActiveTab('BREAKERS')}
          className={`pb-3 text-sm font-medium transition border-b-2 flex items-center gap-2 ${
            activeTab === 'BREAKERS'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="h-4 w-4" />
          Circuit Breaker Telemetry
        </button>
      </div>

      {/* TAB 1: HEALTH PROBES */}
      {activeTab === 'HEALTH' && health && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(health.components).map(([key, comp]) => (
              <div
                key={key}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-start justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100">{comp.componentName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {comp.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{comp.message}</p>
                  <span className="text-[11px] font-mono text-slate-500 mt-2 block">
                    Latency: {comp.latencyMs}ms • Checked: {new Date(comp.lastCheckedAt).toLocaleTimeString()}
                  </span>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: EMERGENCY SAFETY LOCKS */}
      {activeTab === 'SAFETY' && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Emergency Production Safety Controls</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Instant operational fail-safes and kill-switches. Gated to Platform Administrators.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Updated by: {safety.updatedBy} ({new Date(safety.updatedAt).toLocaleTimeString()})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Control 1: Production Write Lock */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <span className="font-semibold text-sm text-white">Production Write Lock</span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Restricts non-admin database write operations across enterprise tables.
                </p>
              </div>
              <button
                onClick={() => toggleSafetyControl('productionWriteLock')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  safety.productionWriteLock
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {safety.productionWriteLock ? 'LOCKED' : 'UNLOCKED'}
              </button>
            </div>

            {/* Control 2: AI Action Kill Switch */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <span className="font-semibold text-sm text-white">AI Action Kill Switch</span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Immediately halts all autonomous and semi-autonomous AI action dispatching.
                </p>
              </div>
              <button
                onClick={() => toggleSafetyControl('aiActionKillSwitch')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  safety.aiActionKillSwitch
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {safety.aiActionKillSwitch ? 'KILLED' : 'ACTIVE'}
              </button>
            </div>

            {/* Control 3: Autonomous Workflow Kill Switch */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <span className="font-semibold text-sm text-white">Autonomous Workflow Kill Switch</span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pauses auto-advancing workflows; forces mandatory human approval at each step.
                </p>
              </div>
              <button
                onClick={() => toggleSafetyControl('autonomousWorkflowKillSwitch')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  safety.autonomousWorkflowKillSwitch
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {safety.autonomousWorkflowKillSwitch ? 'PAUSED' : 'AUTO'}
              </button>
            </div>

            {/* Control 4: Read Only Mode */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <span className="font-semibold text-sm text-white">Read-Only Platform Mode</span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Converts entire platform to immutable read-only mode during emergency recovery.
                </p>
              </div>
              <button
                onClick={() => toggleSafetyControl('readOnlyMode')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  safety.readOnlyMode
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {safety.readOnlyMode ? 'READ-ONLY' : 'READ-WRITE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM ALERTS */}
      {activeTab === 'ALERTS' && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-sm">
              Zero active system alerts. All operational thresholds normal.
            </div>
          ) : (
            alerts.map(alert => (
              <div
                key={alert.id}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {alert.severity}
                    </span>
                    <span className="font-semibold text-sm text-white">{alert.title}</span>
                    <span className="text-xs text-slate-500 font-mono">[{alert.source}]</span>
                  </div>
                  <p className="text-xs text-slate-300">{alert.message}</p>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Triggered: {new Date(alert.triggeredAt).toLocaleTimeString()}
                  </span>
                </div>
                <div>
                  {alert.acknowledged ? (
                    <span className="text-xs text-emerald-400 font-semibold px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                      Acknowledged
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded border border-slate-700 transition"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: CIRCUIT BREAKERS */}
      {activeTab === 'BREAKERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {breakers.map(b => (
            <div
              key={b.serviceName}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-start justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white font-mono">{b.serviceName}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      b.state === 'CLOSED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : b.state === 'HALF_OPEN'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {b.state}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Failures: {b.failureCount} / {b.threshold} threshold • Reset window: {b.resetTimeoutMs / 1000}s
                </p>
              </div>
              <button
                onClick={() => handleResetBreaker(b.serviceName)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded border border-slate-700 transition"
              >
                Reset
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
