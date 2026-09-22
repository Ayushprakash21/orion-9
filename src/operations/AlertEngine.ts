/**
 * ORION-9 WAVE 10: ENTERPRISE PRODUCTION CONTROL PLANE
 * AlertEngine: Alert Deduplication, Cooldown Suppression & Severity Routing
 */

import { SystemAlert, IncidentSeverity } from './types';
import { observabilityService } from './ObservabilityService';

export class AlertEngine {
  private static instance: AlertEngine;
  private alerts: SystemAlert[] = [];
  private deduplicationMap: Map<string, number> = new Map(); // deduplicationKey -> lastTriggeredTime
  private deduplicationWindowMs: number = 5 * 60 * 1000; // 5 minutes
  private maxAlertsPerMinute: number = 30;
  private alertTimestamps: number[] = [];

  private constructor() {
    this.seedInitialAlerts();
  }

  public static getInstance(): AlertEngine {
    if (!AlertEngine.instance) {
      AlertEngine.instance = new AlertEngine();
    }
    return AlertEngine.instance;
  }

  private seedInitialAlerts(): void {
    const defaultAlerts: SystemAlert[] = [
      {
        id: 'alt-001',
        tenantId: 'GLOBAL',
        ruleId: 'RULE_CONNECTOR_LATENCY',
        title: 'ERP Connector Latency Warning',
        message: 'External SAP connector roundtrip time peaked at 180ms (threshold: 150ms)',
        severity: 'SEV3',
        source: 'ConnectorFramework',
        triggeredAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        deduplicationKey: 'erp-connector-latency-warning',
        suppressed: false,
        acknowledged: true,
        acknowledgedBy: 'ops_lead@orion.internal',
      },
    ];
    this.alerts = defaultAlerts;
  }

  public triggerAlert(params: {
    tenantId?: string;
    ruleId: string;
    title: string;
    message: string;
    severity: IncidentSeverity;
    source: string;
  }): { alert?: SystemAlert; suppressed: boolean; reason?: string } {
    const now = Date.now();
    const dedupKey = `${params.source}:${params.ruleId}:${params.tenantId || 'GLOBAL'}`;

    // 1. Check Alert Storm suppression
    this.alertTimestamps = this.alertTimestamps.filter(t => now - t < 60000);
    if (this.alertTimestamps.length >= this.maxAlertsPerMinute) {
      observabilityService.warn(`[ALERT_STORM] Exceeded ${this.maxAlertsPerMinute} alerts/minute limit. Suppressing alert: ${params.title}`);
      return { suppressed: true, reason: 'ALERT_STORM_LIMIT_EXCEEDED' };
    }

    // 2. Check Deduplication & Cooldown window
    const lastTriggered = this.deduplicationMap.get(dedupKey);
    if (lastTriggered && now - lastTriggered < this.deduplicationWindowMs) {
      return { suppressed: true, reason: 'COOLDOWN_WINDOW_ACTIVE' };
    }

    // Register timestamp
    this.deduplicationMap.set(dedupKey, now);
    this.alertTimestamps.push(now);

    const alert: SystemAlert = {
      id: `alt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenantId || 'GLOBAL',
      ruleId: params.ruleId,
      title: params.title,
      message: params.message,
      severity: params.severity,
      source: params.source,
      triggeredAt: new Date().toISOString(),
      deduplicationKey: dedupKey,
      suppressed: false,
      acknowledged: false,
    };

    this.alerts.unshift(alert);
    if (this.alerts.length > 200) {
      this.alerts.pop();
    }

    observabilityService.info(`[SYSTEM_ALERT] [${alert.severity}] ${alert.title}: ${alert.message}`, {
      tenantId: alert.tenantId,
      context: { ruleId: alert.ruleId, source: alert.source },
    });

    return { alert, suppressed: false };
  }

  public getActiveAlerts(tenantId?: string): SystemAlert[] {
    let list = this.alerts;
    if (tenantId && tenantId !== 'GLOBAL') {
      list = list.filter(a => a.tenantId === tenantId || a.tenantId === 'GLOBAL');
    }
    return list;
  }

  public acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;
    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    return true;
  }
}

export const alertEngine = AlertEngine.getInstance();
