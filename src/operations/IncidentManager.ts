/**
 * ORION-9 WAVE 10: ENTERPRISE PRODUCTION CONTROL PLANE
 * IncidentManager: SEV1-SEV4 Incident Management, Blast Radius & Timeline Ledgers
 */

import { IncidentRecord, IncidentSeverity, IncidentStatus, IncidentTimelineEvent } from './types';
import { observabilityService } from './ObservabilityService';

export class IncidentManager {
  private static instance: IncidentManager;
  private incidents: Map<string, IncidentRecord> = new Map();

  private constructor() {
    this.seedInitialIncidents();
  }

  public static getInstance(): IncidentManager {
    if (!IncidentManager.instance) {
      IncidentManager.instance = new IncidentManager();
    }
    return IncidentManager.instance;
  }

  private seedInitialIncidents(): void {
    const defaultIncident: IncidentRecord = {
      id: 'inc-2026-09-001',
      tenantId: 'TENANT_A',
      title: 'Upstream Carrier EDI Feed Intermittent Timeout',
      description: 'Carrier 3PL webhook dropped 4% of real-time shipment updates over 15 minutes',
      severity: 'SEV3',
      status: 'RESOLVED',
      impactedTenants: ['TENANT_A', 'TENANT_B'],
      impactedModules: ['shipments', 'logistics', 'digital-twin'],
      blastRadiusScore: 18,
      rootCause: 'Transient DNS lookup degradation at carrier API gateway',
      declaredBy: 'platform_ops@orion.internal',
      declaredAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      mitigatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      timeline: [
        {
          id: 'ev-1',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          description: 'Incident declared following repeated webhook timeout alerts',
          actor: 'platform_ops@orion.internal',
          statusChange: 'DETECTED',
        },
        {
          id: 'ev-2',
          timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
          description: 'Circuit breaker engaged for Carrier 3PL gateway; traffic routed via fallback queue',
          actor: 'platform_ops@orion.internal',
          actionTaken: 'CIRCUIT_BREAKER_ENGAGED',
          statusChange: 'INVESTIGATING',
        },
        {
          id: 'ev-3',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          description: 'Carrier upstream resolved; webhook delivery acknowledged and DLQ flushed',
          actor: 'platform_ops@orion.internal',
          actionTaken: 'DLQ_FLUSHED',
          statusChange: 'MITIGATED',
        },
        {
          id: 'ev-4',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          description: 'Telemetry verified normal; incident closed',
          actor: 'platform_ops@orion.internal',
          statusChange: 'RESOLVED',
        },
      ],
    };

    this.incidents.set(defaultIncident.id, defaultIncident);
  }

  public declareIncident(params: {
    tenantId: string;
    title: string;
    description: string;
    severity: IncidentSeverity;
    declaredBy: string;
    impactedTenants?: string[];
    impactedModules?: string[];
    rootCause?: string;
  }): IncidentRecord {
    const id = `inc-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).substring(2, 6)}`;
    const declaredAt = new Date().toISOString();

    const impactedTenants = params.impactedTenants || [params.tenantId];
    const impactedModules = params.impactedModules || ['system'];
    const blastRadiusScore = this.calculateBlastRadius(params.severity, impactedTenants, impactedModules);

    const initialEvent: IncidentTimelineEvent = {
      id: `ev-${Date.now()}-1`,
      timestamp: declaredAt,
      description: `Incident declared with severity ${params.severity}`,
      actor: params.declaredBy,
      statusChange: 'DETECTED',
    };

    const record: IncidentRecord = {
      id,
      tenantId: params.tenantId,
      title: params.title,
      description: params.description,
      severity: params.severity,
      status: 'DETECTED',
      impactedTenants,
      impactedModules,
      blastRadiusScore,
      rootCause: params.rootCause,
      declaredBy: params.declaredBy,
      declaredAt,
      timeline: [initialEvent],
    };

    this.incidents.set(id, record);

    observabilityService.error(`[INCIDENT_DECLARED] [${record.severity}] ${record.title}`, {
      tenantId: record.tenantId,
      context: { incidentId: id, blastRadius: blastRadiusScore },
    });

    return record;
  }

  public updateIncidentStatus(
    incidentId: string,
    newStatus: IncidentStatus,
    actor: string,
    description: string,
    actionTaken?: string
  ): IncidentRecord | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    incident.status = newStatus;
    const now = new Date().toISOString();

    if (newStatus === 'MITIGATED') incident.mitigatedAt = now;
    if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') incident.resolvedAt = now;

    const event: IncidentTimelineEvent = {
      id: `ev-${Date.now()}`,
      timestamp: now,
      description,
      actor,
      actionTaken,
      statusChange: newStatus,
    };

    incident.timeline.push(event);
    this.incidents.set(incidentId, incident);

    observabilityService.info(`[INCIDENT_STATUS_CHANGE] Incident ${incidentId} transitioned to ${newStatus}`, {
      tenantId: incident.tenantId,
      context: { actor, actionTaken },
    });

    return incident;
  }

  public getIncident(id: string): IncidentRecord | undefined {
    return this.incidents.get(id);
  }

  public getAllIncidents(tenantId?: string): IncidentRecord[] {
    const list = Array.from(this.incidents.values()).sort(
      (a, b) => new Date(b.declaredAt).getTime() - new Date(a.declaredAt).getTime()
    );
    if (tenantId && tenantId !== 'GLOBAL') {
      return list.filter(i => i.tenantId === tenantId || i.impactedTenants.includes(tenantId));
    }
    return list;
  }

  private calculateBlastRadius(
    severity: IncidentSeverity,
    tenants: string[],
    modules: string[]
  ): number {
    const sevWeights: Record<IncidentSeverity, number> = {
      SEV1: 50,
      SEV2: 30,
      SEV3: 15,
      SEV4: 5,
    };
    const base = sevWeights[severity] || 10;
    const tenantFactor = Math.min(tenants.length * 10, 30);
    const moduleFactor = Math.min(modules.length * 5, 20);
    return Math.min(base + tenantFactor + moduleFactor, 100);
  }
}

export const incidentManager = IncidentManager.getInstance();
