/**
 * ORION-9 PART 4 TRACK 9: OBSERVABILITY & OPERATIONAL INTELLIGENCE
 * Governed Alert Lifecycle & Storm Suppression Engine
 *
 * Manages alerts across states (TRIGGERED, ACKNOWLEDGED, SUPPRESSED, ESCALATED, RESOLVED)
 * with deterministic deduplication keys and cooldown windows to prevent alert storms.
 */

import { SystemAlert, IncidentSeverity } from './types';
import { kernelAuditEngine } from '../kernel/AuditEngine';
import { kernelEventBus } from '../kernel/EventBus';
import { db, loadData, saveData } from '../data/db';

export class AlertEngine {
  private static instance: AlertEngine;
  private alerts: Map<string, SystemAlert> = new Map();
  private cooldownMap: Map<string, number> = new Map(); // deduplicationKey -> expiryTime

  private constructor() {
    this.seedInitialAlerts();
    this.hydrate();
  }

  public static getInstance(): AlertEngine {
    if (!AlertEngine.instance) {
      AlertEngine.instance = new AlertEngine();
    }
    return AlertEngine.instance;
  }

  private seedInitialAlerts(): void {
    const tenantId = 'org-tenant-a';
    const now = new Date().toISOString();

    const sampleAlert: SystemAlert = {
      id: 'alt-slo-01',
      tenantId,
      ruleId: 'rule-slo-integration-latency',
      title: 'Integration Gateway Latency Spike Warning',
      message: 'Integration Gateway 95th percentile latency reached 185ms (threshold: 100ms).',
      severity: 'SEV3',
      source: 'SloEngine',
      triggeredAt: now,
      deduplicationKey: `alt-${tenantId}-integration-latency-p95`,
      suppressed: false,
      acknowledged: false,
    };

    this.alerts.set(sampleAlert.id, sampleAlert);
  }

  private async hydrate(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const stored = await loadData<SystemAlert>(db.metadata);
        if (stored && stored.length > 0) {
          stored.forEach((a) => {
            if (a.id && a.deduplicationKey) this.alerts.set(a.id, a);
          });
        }
      }
    } catch (e) {
      console.warn('[AlertEngine] Hydration warning:', e);
    }
  }

  private async persist(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      await saveData(db.metadata, Array.from(this.alerts.values()));
    } catch (e) {
      console.warn('[AlertEngine] Persistence warning:', e);
    }
  }

  /**
   * Triggers an alert with automatic deduplication cooldown check
   */
  public triggerAlert(params: {
    tenantId?: string;
    ruleId: string;
    title: string;
    message: string;
    severity: IncidentSeverity;
    source: string;
    deduplicationKey?: string;
    cooldownMs?: number;
  }): SystemAlert & { alert: SystemAlert; suppressed: boolean; reason?: string } {
    const tenantId = params.tenantId || 'org-tenant-a';
    const dedupKey = params.deduplicationKey || `alt-${tenantId}-${params.ruleId}`;
    const cooldownMs = params.cooldownMs || 60000; // 1 minute default cooldown
    const lastTrigger = this.cooldownMap.get(dedupKey);
    const nowMs = Date.now();

    let suppressed = false;
    let reason: string | undefined = undefined;

    if (lastTrigger && nowMs - lastTrigger < cooldownMs) {
      suppressed = true;
      reason = 'COOLDOWN_WINDOW_ACTIVE';
    } else {
      this.cooldownMap.set(dedupKey, nowMs);
    }

    const alertId = `alt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const alert: SystemAlert = {
      id: alertId,
      tenantId,
      ruleId: params.ruleId,
      title: params.title,
      message: params.message,
      severity: params.severity,
      source: params.source,
      triggeredAt: new Date().toISOString(),
      deduplicationKey: dedupKey,
      suppressed,
      acknowledged: false,
    };

    this.alerts.set(alertId, alert);
    this.persist();

    kernelAuditEngine.record({
      action: suppressed ? 'ALERT_SUPPRESSED_COOLDOWN' : 'ALERT_TRIGGERED',
      actor: { id: 'AlertEngine', type: 'SYSTEM', name: 'Alert Engine' },
      entityId: alertId,
      entityType: 'OBSERVABILITY_ALERT',
      classification: 'INTERNAL',
      details: { tenantId, title: params.title, severity: params.severity, suppressed }
    });

    if (!suppressed) {
      kernelEventBus.publish('orion:observability:alert-triggered', {
        alertId,
        tenantId,
        severity: params.severity,
        title: params.title,
      }, { actor: { id: 'AlertEngine', type: 'SYSTEM', name: 'Alert Engine' } });
    }

    return Object.assign(alert, {
      alert,
      suppressed,
      reason,
    });
  }

  /**
   * Acknowledges an alert
   */
  public acknowledgeAlert(alertId: string, actorOrTenant: string, actorArg?: string): boolean | SystemAlert {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    const actor = actorArg || actorOrTenant;
    alert.acknowledged = true;
    alert.acknowledgedBy = actor;
    this.persist();

    kernelAuditEngine.record({
      action: 'ALERT_ACKNOWLEDGED',
      actor: { id: actor, type: 'USER', name: actor },
      entityId: alertId,
      entityType: 'OBSERVABILITY_ALERT',
      classification: 'INTERNAL',
      details: { tenantId: alert.tenantId }
    });

    return true;
  }

  /**
   * Returns all active unsuppressed or all alerts
   */
  public getActiveAlerts(tenantId?: string): SystemAlert[] {
    const list = Array.from(this.alerts.values());
    if (tenantId && tenantId !== 'GLOBAL') {
      return list.filter(a => a.tenantId === tenantId);
    }
    return list;
  }

  /**
   * Lists active alerts for a tenant
   */
  public listAlerts(tenantId: string): SystemAlert[] {
    return this.getActiveAlerts(tenantId);
  }
}

export const alertEngine = AlertEngine.getInstance();
