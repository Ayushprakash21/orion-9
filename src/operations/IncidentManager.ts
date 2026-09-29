/**
 * ORION-9 WAVE 10: ENTERPRISE PRODUCTION CONTROL PLANE
 * IncidentManager: SEV1-SEV4 Incident Management, Blast Radius & Timeline Ledgers
 * 
 * Refactored to delegate authoritative persistence to IncidentRepository (Cloud Firestore).
 * In LIVE mode, in-memory state is strictly a non-authoritative cache.
 * In DEMO mode, deterministic fixtures are scoped exclusively to DEMO.
 */

import { IncidentRecord, IncidentSeverity, IncidentStatus, IncidentTimelineEvent } from './types';
import { observabilityService } from './ObservabilityService';
import { incidentRepository } from '../core/incidents/IncidentRepository';
import { dbManager } from '../core/database/DatabaseConnectionManager';

export class IncidentManager {
  private static instance: IncidentManager;
  // Non-authoritative in-memory cache
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

  /**
   * Seeds demo incidents strictly for DEMO environment mode.
   * LIVE mode explicitly blocks in-memory seed creation.
   */
  private seedInitialIncidents(): void {
    if (dbManager.getEnvironment() !== 'DEMO') {
      return;
    }

    const defaultIncident: IncidentRecord = {
      id: 'inc-2026-09-001',
      tenantId: 'TENANT_A',
      environment: 'DEMO',
      title: 'Upstream Carrier EDI Feed Intermittent Timeout',
      description: 'Carrier 3PL webhook dropped 4% of real-time shipment updates over 15 minutes',
      severity: 'SEV3',
      status: 'RESOLVED',
      version: 1,
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
          eventId: 'ev-1',
          incidentId: 'inc-2026-09-001',
          tenantId: 'TENANT_A',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          description: 'Incident declared following repeated webhook timeout alerts',
          actor: 'platform_ops@orion.internal',
          statusChange: 'DETECTED',
          newStatus: 'DETECTED',
        },
        {
          id: 'ev-2',
          eventId: 'ev-2',
          incidentId: 'inc-2026-09-001',
          tenantId: 'TENANT_A',
          timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
          description: 'Circuit breaker engaged for Carrier 3PL gateway; traffic routed via fallback queue',
          actor: 'platform_ops@orion.internal',
          actionTaken: 'CIRCUIT_BREAKER_ENGAGED',
          statusChange: 'INVESTIGATING',
          newStatus: 'INVESTIGATING',
        },
        {
          id: 'ev-3',
          eventId: 'ev-3',
          incidentId: 'inc-2026-09-001',
          tenantId: 'TENANT_A',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          description: 'Carrier upstream resolved; webhook delivery acknowledged and DLQ flushed',
          actor: 'platform_ops@orion.internal',
          actionTaken: 'DLQ_FLUSHED',
          statusChange: 'MITIGATED',
          newStatus: 'MITIGATED',
        },
        {
          id: 'ev-4',
          eventId: 'ev-4',
          incidentId: 'inc-2026-09-001',
          tenantId: 'TENANT_A',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          description: 'Telemetry verified normal; incident closed',
          actor: 'platform_ops@orion.internal',
          statusChange: 'RESOLVED',
          newStatus: 'RESOLVED',
        },
      ],
    };

    this.incidents.set(defaultIncident.id, defaultIncident);
  }

  /**
   * Declares an incident authoritatively via IncidentRepository.
   */
  public async declareIncidentAsync(params: {
    tenantId: string;
    title: string;
    description: string;
    severity: IncidentSeverity;
    declaredBy: string;
    impactedTenants?: string[];
    impactedModules?: string[];
    rootCause?: string;
    actorRole?: string;
  }): Promise<IncidentRecord> {
    const id = `inc-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).substring(2, 6)}`;
    const declaredAt = new Date().toISOString();

    const impactedTenants = params.impactedTenants || [params.tenantId];
    const impactedModules = params.impactedModules || ['system'];
    const blastRadiusScore = this.calculateBlastRadius(params.severity, impactedTenants, impactedModules);

    const initialEvent: IncidentTimelineEvent = {
      id: `ev-${Date.now()}-1`,
      eventId: `ev-${Date.now()}-1`,
      incidentId: id,
      tenantId: params.tenantId,
      timestamp: declaredAt,
      description: `Incident declared with severity ${params.severity}`,
      actor: params.declaredBy,
      actionTaken: 'INCIDENT_DECLARED',
      statusChange: 'DETECTED',
      newStatus: 'DETECTED',
    };

    const record: IncidentRecord = {
      id,
      tenantId: params.tenantId,
      title: params.title,
      description: params.description,
      severity: params.severity,
      status: 'DETECTED',
      version: 1,
      impactedTenants,
      impactedModules,
      blastRadiusScore,
      rootCause: params.rootCause,
      declaredBy: params.declaredBy,
      declaredAt,
      timeline: [initialEvent],
    };

    // Authoritative persistence via IncidentRepository
    const persisted = await incidentRepository.createIncident(record, params.actorRole, params.declaredBy);
    this.incidents.set(id, persisted);

    observabilityService.error(`[INCIDENT_DECLARED] [${record.severity}] ${record.title}`, {
      tenantId: record.tenantId,
      context: { incidentId: id, blastRadius: blastRadiusScore },
    });

    return persisted;
  }

  /**
   * Synchronous backwards-compatible declaration method.
   * Dispatches asynchronously to IncidentRepository and updates cache.
   */
  public declareIncident(params: {
    tenantId: string;
    title: string;
    description: string;
    severity: IncidentSeverity;
    declaredBy: string;
    impactedTenants?: string[];
    impactedModules?: string[];
    rootCause?: string;
    actorRole?: string;
  }): IncidentRecord {
    const id = `inc-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).substring(2, 6)}`;
    const declaredAt = new Date().toISOString();

    const impactedTenants = params.impactedTenants || [params.tenantId];
    const impactedModules = params.impactedModules || ['system'];
    const blastRadiusScore = this.calculateBlastRadius(params.severity, impactedTenants, impactedModules);

    const initialEvent: IncidentTimelineEvent = {
      id: `ev-${Date.now()}-1`,
      eventId: `ev-${Date.now()}-1`,
      incidentId: id,
      tenantId: params.tenantId,
      timestamp: declaredAt,
      description: `Incident declared with severity ${params.severity}`,
      actor: params.declaredBy,
      actionTaken: 'INCIDENT_DECLARED',
      statusChange: 'DETECTED',
      newStatus: 'DETECTED',
    };

    const record: IncidentRecord = {
      id,
      tenantId: params.tenantId,
      title: params.title,
      description: params.description,
      severity: params.severity,
      status: 'DETECTED',
      version: 1,
      impactedTenants,
      impactedModules,
      blastRadiusScore,
      rootCause: params.rootCause,
      declaredBy: params.declaredBy,
      declaredAt,
      timeline: [initialEvent],
    };

    this.incidents.set(id, record);

    // Asynchronously commit to authoritative repository
    incidentRepository.createIncident(record, params.actorRole, params.declaredBy).catch((err) => {
      observabilityService.error(`[INCIDENT_PERSISTENCE_FAILED] Failed to persist incident ${id}: ${err.message}`, {
        tenantId: record.tenantId,
        context: { error: err.message },
      });
    });

    observabilityService.error(`[INCIDENT_DECLARED] [${record.severity}] ${record.title}`, {
      tenantId: record.tenantId,
      context: { incidentId: id, blastRadius: blastRadiusScore },
    });

    return record;
  }

  /**
   * Updates incident status asynchronously via IncidentRepository.
   */
  public async updateIncidentStatusAsync(
    incidentId: string,
    newStatus: IncidentStatus,
    actor: string,
    description: string,
    actionTaken?: string,
    tenantId?: string,
    actorRole?: string
  ): Promise<IncidentRecord | null> {
    const effectiveTenantId = tenantId || this.incidents.get(incidentId)?.tenantId || 'GLOBAL';
    const updated = await incidentRepository.transitionStatus(
      effectiveTenantId,
      incidentId,
      newStatus,
      actor,
      description,
      actionTaken,
      actorRole
    );
    this.incidents.set(incidentId, updated);
    return updated;
  }

  /**
   * Synchronous backwards-compatible status update.
   */
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
      eventId: `ev-${Date.now()}`,
      incidentId,
      tenantId: incident.tenantId,
      timestamp: now,
      description,
      actor,
      actionTaken,
      statusChange: newStatus,
      newStatus,
    };

    incident.timeline.push(event);
    this.incidents.set(incidentId, incident);

    // Asynchronously update repository
    incidentRepository
      .transitionStatus(incident.tenantId, incidentId, newStatus, actor, description, actionTaken)
      .catch((err) => {
        observabilityService.error(`[INCIDENT_STATUS_SYNC_FAILED] Failed to persist status transition: ${err.message}`, {
          tenantId: incident.tenantId,
        });
      });

    observabilityService.info(`[INCIDENT_STATUS_CHANGE] Incident ${incidentId} transitioned to ${newStatus}`, {
      tenantId: incident.tenantId,
      context: { actor, actionTaken },
    });

    return incident;
  }

  public getIncident(id: string): IncidentRecord | undefined {
    return this.incidents.get(id);
  }

  public async getIncidentAsync(tenantId: string, id: string): Promise<IncidentRecord | null> {
    return incidentRepository.getIncident(tenantId, id);
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

  public async getAllIncidentsAsync(tenantId: string): Promise<IncidentRecord[]> {
    return incidentRepository.listIncidents(tenantId);
  }

  public calculateBlastRadius(
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
