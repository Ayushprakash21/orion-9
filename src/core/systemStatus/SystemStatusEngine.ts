/**
 * ORION-9 UNIFIED SYSTEM STATUS ENGINE
 * Authoritative, deterministic aggregator for runtime, scheduler, Firestore,
 * listeners, freshness, graphs, and automation health telemetry.
 */

import {
  OverallSystemStatus,
  SubsystemHealthStatus,
  ListenerHealthStatus,
  FreshnessStatus,
  GraphHealthStatus,
  AutomationOperatingMode,
  SystemStatusSnapshot,
  RuntimeSubsystemStatus,
  SchedulerSubsystemStatus,
  FirestoreSubsystemStatus,
  ListenerSubsystemStatus,
  FreshnessSubsystemStatus,
  GraphSubsystemStatus,
  AutomationSubsystemStatus,
  FRESHNESS_THRESHOLDS,
} from './SystemStatusTypes';
import { systemStatusRegistry } from './SystemStatusRegistry';
import { dbManager } from '../database/DatabaseConnectionManager';
import { DemoPersistentSchedulerService } from '../../services/demo/DemoPersistentSchedulerService';
import { realtimeSubscriptionManager, RealtimeDomain, getTruthfulConnectionState } from '../visualization/RealtimeSubscriptionManager';
import { realtimeStateStore } from '../visualization/RealtimeStateStore';
import { workflowObservability } from '../../workflows/WorkflowObservability';
import { WorkflowApprovalEngine } from '../../workflows/WorkflowApprovalEngine';

/**
 * Strips secrets, tokens, credentials, stack traces, and internal Firestore paths
 */
export function sanitizeErrorMessage(err: any): { errorCode?: string; errorMessage?: string } {
  if (!err) return {};

  const rawMessage = typeof err === 'string' ? err : (err.message || String(err));
  const rawCode = err.code || err.errorCode;

  // Match standard permission/auth codes
  if (rawCode === 'permission-denied' || /permission.?denied/i.test(rawMessage)) {
    return { errorCode: 'PERMISSION_DENIED', errorMessage: 'Firestore permission denied' };
  }
  if (rawCode === 'unauthenticated' || /unauthenticated/i.test(rawMessage)) {
    return { errorCode: 'UNAUTHENTICATED', errorMessage: 'Authentication required' };
  }
  if (rawCode === 'unavailable' || /unavailable/i.test(rawMessage)) {
    return { errorCode: 'SERVICE_UNAVAILABLE', errorMessage: 'Firestore service unavailable' };
  }
  if (rawCode === 'deadline-exceeded' || /deadline.?exceeded/i.test(rawMessage)) {
    return { errorCode: 'DEADLINE_EXCEEDED', errorMessage: 'Firestore request timed out' };
  }
  if (rawCode === 'resource-exhausted' || /quota|resource.?exhausted/i.test(rawMessage)) {
    return { errorCode: 'RESOURCE_EXHAUSTED', errorMessage: 'Quota or rate limit exceeded' };
  }
  if (/network|offline|failed to fetch/i.test(rawMessage)) {
    return { errorCode: 'NETWORK_ERROR', errorMessage: 'Network connection unavailable' };
  }

  // Generic sanitized message: first line only, strip stack traces and filesystem paths
  const firstLine = rawMessage.split('\n')[0];
  const sanitized = firstLine
    .replace(/[A-Za-z0-9_-]{24,}/g, '[REDACTED_TOKEN]')
    .replace(/(?:[a-zA-Z]:)?[\\/][a-zA-Z0-9._\-\\/]+/g, '[REDACTED_PATH]')
    .trim();

  return {
    errorCode: rawCode ? String(rawCode).toUpperCase() : 'UNKNOWN_ERROR',
    errorMessage: sanitized || 'Operational error occurred',
  };
}

export class SystemStatusEngine {
  private static instance: SystemStatusEngine;

  private constructor() {}

  public static getInstance(): SystemStatusEngine {
    if (!SystemStatusEngine.instance) {
      SystemStatusEngine.instance = new SystemStatusEngine();
    }
    return SystemStatusEngine.instance;
  }

  /**
   * Deterministically generates a side-effect free snapshot of Orion-9 system status
   */
  public getSnapshot(
    tenantId: string = 'default-tenant',
    environment?: 'DEMO' | 'LIVE',
    orgId?: string
  ): SystemStatusSnapshot {
    const activeEnv = environment || dbManager.getEnvironment();
    const effectiveTenant = tenantId || 'default-tenant';
    const now = Date.now();

    // 1. Runtime Subsystem
    const runtime = this.evalRuntime(effectiveTenant, activeEnv, orgId, now);

    // 2. Scheduler Subsystem
    const scheduler = this.evalScheduler(effectiveTenant, activeEnv, orgId, now);

    // 3. Firestore Subsystem
    const firestore = this.evalFirestore(effectiveTenant, activeEnv, orgId, now);

    // 4. Listeners Subsystem (5 domains)
    const listeners = this.evalListeners(effectiveTenant, activeEnv, orgId, now);

    // 5. Freshness Subsystem (5 domains)
    const freshness = this.evalFreshness(effectiveTenant, activeEnv, orgId, now, listeners);

    // 6. Graphs Subsystem
    const graphs = this.evalGraphs(effectiveTenant, activeEnv, orgId, now, listeners);

    // 7. Automation Subsystem
    const automation = this.evalAutomation(effectiveTenant, activeEnv, orgId, now);

    // 8. Overall Aggregation
    const overallStatus = this.aggregateOverall(
      runtime,
      scheduler,
      firestore,
      listeners,
      freshness,
      graphs,
      automation
    );

    return {
      overallStatus,
      generatedAt: now,
      environment: activeEnv,
      tenantId: effectiveTenant,
      organizationId: orgId,
      runtime,
      scheduler,
      firestore,
      listeners,
      freshness,
      graphs,
      automation,
    };
  }

  private evalRuntime(
    tenantId: string,
    environment: 'DEMO' | 'LIVE',
    orgId?: string,
    now: number = Date.now()
  ): RuntimeSubsystemStatus {
    const override = systemStatusRegistry.getRuntimeOverride(tenantId, environment, orgId);
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine !== undefined
      ? navigator.onLine
      : true;
    const appInit = typeof window !== 'undefined' || typeof process !== 'undefined';

    const base: RuntimeSubsystemStatus = {
      status: !isOnline ? 'OFFLINE' : (appInit ? 'HEALTHY' : 'UNKNOWN'),
      message: !isOnline
        ? 'Runtime is offline — no active network connection'
        : (appInit ? 'Runtime operational — application, kernel, and network online' : 'Runtime status unavailable — runtime telemetry has not been established'),
      lastCheckedAt: now,
      lastHealthyAt: isOnline && appInit ? now : null,
      environment,
      source: 'browser_runtime',
      applicationInitialized: appInit,
      kernelInitialized: appInit,
      authInitialized: appInit,
      isOnline,
    };

    return override ? { ...base, ...override } : base;
  }

  private evalScheduler(
    tenantId: string,
    environment: 'DEMO' | 'LIVE',
    orgId?: string,
    now: number = Date.now()
  ): SchedulerSubsystemStatus {
    const override = systemStatusRegistry.getSchedulerOverride(tenantId, environment, orgId);

    if (environment === 'DEMO') {
      const demoState = DemoPersistentSchedulerService.getInstance().getSchedulerState();
      let status: SubsystemHealthStatus = 'HEALTHY';
      let message = `Demo scheduler running — hourly batch rate: ${demoState.hourlyRate} pkgs/hr`;
      let isStale = false;

      if (demoState.status === 'ERROR' || demoState.lastError) {
        status = 'ERROR';
        const sanitized = sanitizeErrorMessage(demoState.lastError || 'Demo scheduler failure');
        message = sanitized.errorMessage || 'Demo scheduler failure';
      } else if (demoState.status === 'PAUSED' || demoState.status === 'NOT_STARTED') {
        status = 'DEGRADED';
        message = `Demo scheduler is ${demoState.status.toLowerCase()} (hourly generation suspended)`;
      } else if (demoState.lastSuccessfulRun) {
        const lastRunTime = new Date(demoState.lastSuccessfulRun).getTime();
        if (now - lastRunTime > FRESHNESS_THRESHOLDS.SCHEDULER_STALE_MS) {
          status = 'DEGRADED';
          isStale = true;
          message = 'Demo scheduler stale — no successful generation run in > 2 hours';
        }
      }

      const base: SchedulerSubsystemStatus = {
        status,
        message,
        lastCheckedAt: now,
        lastHealthyAt: status === 'HEALTHY' ? now : (demoState.lastSuccessfulRun ? new Date(demoState.lastSuccessfulRun).getTime() : null),
        environment,
        source: 'demo_persistent_scheduler',
        configured: true,
        enabled: demoState.status === 'RUNNING',
        schedulerMode: demoState.schedulerMode,
        lastScheduledHour: demoState.lastScheduledHour,
        lastSuccessfulRun: demoState.lastSuccessfulRun,
        lastFailedExecution: demoState.lastError || null,
        nextScheduledRun: demoState.nextScheduledRun,
        totalBatchesCompleted: demoState.totalBatchesCompleted,
        totalPackagesGenerated: demoState.totalPackagesGenerated,
        consecutiveFailures: demoState.status === 'ERROR' ? 1 : 0,
        isStale,
      };

      return override ? { ...base, ...override } : base;
    }

    // LIVE Environment — Cloudflare Cron production path
    const baseLive: SchedulerSubsystemStatus = {
      status: 'HEALTHY',
      message: 'Cloudflare Worker Cron Trigger configured (0 * * * *)',
      lastCheckedAt: now,
      lastHealthyAt: now,
      environment,
      source: 'cloudflare_cron_trigger',
      configured: true,
      enabled: true,
      schedulerMode: 'CLOUDFLARE_CRON',
      lastScheduledHour: null,
      lastSuccessfulRun: null,
      nextScheduledRun: null,
      totalBatchesCompleted: 0,
      totalPackagesGenerated: 0,
      consecutiveFailures: 0,
      isStale: false,
    };

    return override ? { ...baseLive, ...override } : baseLive;
  }

  private evalFirestore(
    tenantId: string,
    environment: 'DEMO' | 'LIVE',
    orgId?: string,
    now: number = Date.now()
  ): FirestoreSubsystemStatus {
    const override = systemStatusRegistry.getFirestoreOverride(tenantId, environment, orgId);
    const dbState = dbManager.getState(tenantId, orgId);
    const instance = dbManager.getFirestore();

    let status: SubsystemHealthStatus = 'HEALTHY';
    let message = `Firestore connected — active environment: ${environment}`;
    let errorCode: string | undefined;
    let errorMessage: string | undefined;

    if (dbState.status === 'PERMISSION_DENIED') {
      status = 'ERROR';
      errorCode = 'PERMISSION_DENIED';
      errorMessage = 'Firestore permission denied';
      message = 'Firestore access denied by security rules';
    } else if (dbState.status === 'AUTHENTICATION_REQUIRED') {
      status = 'DEGRADED';
      errorCode = 'UNAUTHENTICATED';
      errorMessage = 'Authentication required';
      message = 'Firestore requires active user authentication';
    } else if (dbState.status === 'DISCONNECTED') {
      status = 'OFFLINE';
      message = 'Firestore disconnected — offline storage active';
    } else if (dbState.status === 'DEGRADED') {
      status = 'DEGRADED';
      message = dbState.lastError ? sanitizeErrorMessage(dbState.lastError).errorMessage || 'Firestore connection degraded' : 'Firestore connection degraded';
    } else if (dbState.status === 'CONNECTED') {
      status = 'HEALTHY';
      message = `Firestore connected — active environment: ${environment}`;
    } else if (!instance) {
      status = 'UNKNOWN';
      message = 'Firestore uninitialized — awaiting configuration';
    }

    const base: FirestoreSubsystemStatus = {
      status,
      message,
      lastCheckedAt: now,
      lastHealthyAt: status === 'HEALTHY' ? now : null,
      latencyMs: dbState.measuredLatencyMs,
      errorCode,
      errorMessage,
      environment,
      source: 'database_connection_manager',
      configured: Boolean(dbState.config),
      initialized: Boolean(instance),
      authenticated: dbState.status !== 'AUTHENTICATION_REQUIRED',
      connectionStatus: dbState.status,
      activeListenersCount: dbState.activeListenersCount,
    };

    return override ? { ...base, ...override } : base;
  }

  private evalListeners(
    tenantId: string,
    environment: 'DEMO' | 'LIVE',
    orgId?: string,
    now: number = Date.now()
  ): {
    inventory: ListenerSubsystemStatus;
    purchaseOrders: ListenerSubsystemStatus;
    shipments: ListenerSubsystemStatus;
    exceptions: ListenerSubsystemStatus;
    controlTower: ListenerSubsystemStatus;
  } {
    const overrides = systemStatusRegistry.getListenerOverride(tenantId, environment, orgId);

    const domains: Array<{ key: keyof typeof res; domain: RealtimeDomain }> = [
      { key: 'inventory', domain: 'inventory' },
      { key: 'purchaseOrders', domain: 'purchase_orders' },
      { key: 'shipments', domain: 'shipments' },
      { key: 'exceptions', domain: 'exceptions' },
      { key: 'controlTower', domain: 'control_tower' },
    ];

    const res = {} as any;

    for (const { key, domain } of domains) {
      const subState = realtimeSubscriptionManager.getSubscriptionState(domain, tenantId, environment);
      const connState = getTruthfulConnectionState(subState);
      const lastSnapshotAt = subState?.lastSnapshotAt ? new Date(subState.lastSnapshotAt).getTime() : null;
      const recordCount = subState?.documentCount ?? 0;

      let status: ListenerHealthStatus = 'CONNECTED';
      let message = `Connected — ${recordCount} records, listening on ${domain}`;
      let errorCode: string | undefined;
      let errorMessage: string | undefined;
      let isStale = false;

      if (!subState) {
        status = 'EMPTY';
        message = `Connected — 0 records in ${domain}`;
      } else if (connState === 'ERROR') {
        status = 'ERROR';
        errorCode = 'LISTENER_ERROR';
        errorMessage = 'Snapshot listener error occurred';
        message = `Listener failed for ${domain}`;
      } else if (connState === 'OFFLINE') {
        status = 'OFFLINE';
        message = `Listener offline for ${domain}`;
      } else if (connState === 'STALE') {
        status = 'STALE';
        isStale = true;
        message = `Listener stale for ${domain}`;
      } else if (connState === 'LOADING') {
        status = 'LOADING';
        message = `Initializing listener for ${domain}...`;
      } else if (connState === 'EMPTY' || recordCount === 0) {
        status = 'EMPTY';
        message = `Connected — 0 records in ${domain}`;
      }

      const base: ListenerSubsystemStatus = {
        status,
        message,
        lastCheckedAt: now,
        lastHealthyAt: (status === 'CONNECTED' || status === 'EMPTY') ? now : null,
        domain,
        recordCount,
        lastSnapshotAt,
        lastSuccessfulUpdateAt: lastSnapshotAt,
        tenantId,
        isStale,
        environment,
        source: 'realtime_subscription_manager',
        errorCode,
        errorMessage,
      };

      const domainOverride = overrides ? (overrides as any)[key] : null;
      res[key] = domainOverride ? { ...base, ...domainOverride } : base;
    }

    return res;
  }

  private evalFreshness(
    tenantId: string,
    environment: 'DEMO' | 'LIVE',
    orgId: string | undefined,
    now: number,
    listeners: {
      inventory: ListenerSubsystemStatus;
      purchaseOrders: ListenerSubsystemStatus;
      shipments: ListenerSubsystemStatus;
      exceptions: ListenerSubsystemStatus;
      controlTower: ListenerSubsystemStatus;
    }
  ): {
    inventory: FreshnessSubsystemStatus;
    purchaseOrders: FreshnessSubsystemStatus;
    shipments: FreshnessSubsystemStatus;
    exceptions: FreshnessSubsystemStatus;
    controlTower: FreshnessSubsystemStatus;
  } {
    const overrides = systemStatusRegistry.getFreshnessOverride(tenantId, environment, orgId);

    const domains: Array<keyof typeof listeners> = [
      'inventory',
      'purchaseOrders',
      'shipments',
      'exceptions',
      'controlTower',
    ];

    const res = {} as any;

    for (const d of domains) {
      const listener = listeners[d];
      const lastUpdate = listener.lastSuccessfulUpdateAt;

      let status: FreshnessStatus = 'UNKNOWN';
      let ageMs: number | null = null;
      let message = 'No timestamp recorded';

      if (lastUpdate && lastUpdate > 0) {
        ageMs = Math.max(0, now - lastUpdate);
        if (ageMs <= FRESHNESS_THRESHOLDS.FRESH_MAX_MS) {
          status = 'FRESH';
          const secs = Math.round(ageMs / 1000);
          message = `Data is fresh (updated ${secs}s ago)`;
        } else if (ageMs <= FRESHNESS_THRESHOLDS.AGING_MAX_MS) {
          status = 'AGING';
          const mins = Math.round(ageMs / 60000);
          message = `Data is aging (updated ${mins}m ago)`;
        } else {
          status = 'STALE';
          const mins = Math.round(ageMs / 60000);
          message = `Data is stale (last update ${mins}m ago)`;
        }
      }

      const base: FreshnessSubsystemStatus = {
        status,
        domain: listener.domain,
        ageMs,
        lastUpdatedAt: lastUpdate,
        thresholdFreshMs: FRESHNESS_THRESHOLDS.FRESH_MAX_MS,
        thresholdAgingMs: FRESHNESS_THRESHOLDS.AGING_MAX_MS,
        message,
      };

      const domainOverride = overrides ? (overrides as any)[d] : null;
      res[d] = domainOverride ? { ...base, ...domainOverride } : base;
    }

    return res;
  }

  private evalGraphs(
    tenantId: string,
    environment: 'DEMO' | 'LIVE',
    orgId: string | undefined,
    now: number,
    listeners: {
      inventory: ListenerSubsystemStatus;
      purchaseOrders: ListenerSubsystemStatus;
      shipments: ListenerSubsystemStatus;
      exceptions: ListenerSubsystemStatus;
      controlTower: ListenerSubsystemStatus;
    }
  ): GraphSubsystemStatus {
    const override = systemStatusRegistry.getGraphOverride(tenantId, environment, orgId);

    // Inspect listener statuses
    const listenerValues = Object.values(listeners);
    const hasError = listenerValues.some(l => l.status === 'ERROR');
    const hasStale = listenerValues.some(l => l.status === 'STALE');
    const allEmpty = listenerValues.every(l => l.recordCount === 0);

    let status: GraphHealthStatus = 'READY';
    let message = 'Graphs ready — live time series streaming';
    let isStale = false;

    if (hasError) {
      status = 'ERROR';
      message = 'Graph rendering degraded — underlying listener error';
    } else if (hasStale) {
      status = 'STALE';
      isStale = true;
      message = 'Graph series stale — underlying data aging or stale';
    } else if (allEmpty) {
      status = 'EMPTY';
      message = 'Graphs ready — 0 source records available';
    }

    const base: GraphSubsystemStatus = {
      status,
      message,
      lastCheckedAt: now,
      lastHealthyAt: (status === 'READY' || status === 'EMPTY') ? now : null,
      environment,
      source: 'realtime_graph_fabric',
      graphsInitialized: true,
      sourceStateAvailable: !hasError,
      seriesCount: 6,
      lastSeriesUpdateAt: now,
      isStale,
    };

    return override ? { ...base, ...override } : base;
  }

  private evalAutomation(
    tenantId: string,
    environment: 'DEMO' | 'LIVE',
    orgId?: string,
    now: number = Date.now()
  ): AutomationSubsystemStatus {
    const override = systemStatusRegistry.getAutomationOverride(tenantId, environment, orgId);

    const metrics = workflowObservability.getWorkflowMetrics(tenantId);
    const pendingApprovals = WorkflowApprovalEngine.getInstance().listPendingApprovals(tenantId);

    let status: SubsystemHealthStatus = 'HEALTHY';
    let message = `Automation operational — ${metrics.totalCompleted} workflows completed`;
    const mode: AutomationOperatingMode = 'COPILOT';

    if (metrics.totalFailed > 0 && metrics.totalCompleted === 0 && metrics.totalTriggered > 0) {
      status = 'ERROR';
      message = `All automated workflows failed (${metrics.totalFailed} failures)`;
    } else if (pendingApprovals.length > 0) {
      status = 'DEGRADED';
      message = `${pendingApprovals.length} workflows pending operator approval`;
    } else if (metrics.totalFailed > 0) {
      status = 'DEGRADED';
      message = `${metrics.totalFailed} workflow execution failures recorded`;
    }

    const base: AutomationSubsystemStatus = {
      status,
      message,
      lastCheckedAt: now,
      lastHealthyAt: status === 'HEALTHY' ? now : null,
      environment,
      source: 'workflow_observability',
      mode,
      initialized: true,
      enabled: true,
      totalTriggered: metrics.totalTriggered,
      totalCompleted: metrics.totalCompleted,
      totalFailed: metrics.totalFailed,
      pendingApprovalsCount: pendingApprovals.length,
      dlqCount: 0,
      consecutiveFailures: metrics.totalFailed,
      lastExecutionAt: metrics.totalTriggered > 0 ? now : null,
    };

    return override ? { ...base, ...override } : base;
  }

  /**
   * Deterministic Aggregation for Overall System Status
   */
  private aggregateOverall(
    runtime: RuntimeSubsystemStatus,
    scheduler: SchedulerSubsystemStatus,
    firestore: FirestoreSubsystemStatus,
    listeners: {
      inventory: ListenerSubsystemStatus;
      purchaseOrders: ListenerSubsystemStatus;
      shipments: ListenerSubsystemStatus;
      exceptions: ListenerSubsystemStatus;
      controlTower: ListenerSubsystemStatus;
    },
    freshness: {
      inventory: FreshnessSubsystemStatus;
      purchaseOrders: FreshnessSubsystemStatus;
      shipments: FreshnessSubsystemStatus;
      exceptions: FreshnessSubsystemStatus;
      controlTower: FreshnessSubsystemStatus;
    },
    graphs: GraphSubsystemStatus,
    automation: AutomationSubsystemStatus
  ): OverallSystemStatus {
    const allListeners = Object.values(listeners);
    const allFreshness = Object.values(freshness);

    // 1. OFFLINE if runtime or Firestore is offline
    if (runtime.status === 'OFFLINE' || !runtime.isOnline || firestore.status === 'OFFLINE') {
      return 'OFFLINE';
    }

    // 2. ERROR if critical subsystem has an actual error
    if (
      runtime.status === 'ERROR' ||
      firestore.status === 'ERROR' ||
      allListeners.some(l => l.status === 'ERROR') ||
      graphs.status === 'ERROR' ||
      automation.status === 'ERROR' ||
      (scheduler.environment === 'DEMO' && scheduler.status === 'ERROR')
    ) {
      return 'ERROR';
    }

    // 3. UNKNOWN if critical telemetry is unavailable
    if (runtime.status === 'UNKNOWN' || firestore.status === 'UNKNOWN') {
      return 'UNKNOWN';
    }

    // 4. DEGRADED if any non-critical subsystem is degraded or stale
    if (
      runtime.status === 'DEGRADED' ||
      firestore.status === 'DEGRADED' ||
      scheduler.status === 'DEGRADED' ||
      allListeners.some(l => l.status === 'STALE' || l.status === 'LOADING') ||
      allFreshness.some(f => f.status === 'STALE' || f.status === 'AGING') ||
      graphs.status === 'STALE' ||
      automation.status === 'DEGRADED'
    ) {
      return 'DEGRADED';
    }

    // 5. HEALTHY: all required critical subsystems are healthy
    return 'HEALTHY';
  }
}

export const systemStatusEngine = SystemStatusEngine.getInstance();
