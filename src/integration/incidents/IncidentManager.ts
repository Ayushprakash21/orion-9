/**
 * ORION-9 WAVE 3.3 — INTEGRATION INCIDENT MANAGER
 */

import { IncidentCategory, IncidentRecord, IncidentSeverity } from '../types';

export class IncidentManager {
  private static instance: IncidentManager;
  private incidents: Map<string, IncidentRecord> = new Map(); // key: `${tenantId}:${incidentId}`

  private constructor() {}

  public static getInstance(): IncidentManager {
    if (!IncidentManager.instance) {
      IncidentManager.instance = new IncidentManager();
    }
    return IncidentManager.instance;
  }

  public reportIncident(params: {
    tenantId: string;
    connectorId?: string;
    transportId?: string;
    partnerId?: string;
    severity: IncidentSeverity;
    category: IncidentCategory;
    title: string;
    description: string;
    autoCreated?: boolean;
  }): IncidentRecord {
    const incidentId = `INC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const record: IncidentRecord = {
      incidentId,
      tenantId: params.tenantId,
      connectorId: params.connectorId,
      transportId: params.transportId,
      partnerId: params.partnerId,
      severity: params.severity,
      category: params.category,
      title: params.title,
      description: params.description,
      status: 'OPEN',
      autoCreated: params.autoCreated !== undefined ? params.autoCreated : true,
      createdAt: now,
    };

    this.incidents.set(`${params.tenantId}:${incidentId}`, record);
    return record;
  }

  public resolveIncident(tenantId: string, incidentId: string, resolvedBy: string): boolean {
    const key = `${tenantId}:${incidentId}`;
    const incident = this.incidents.get(key);
    if (!incident) return false;

    incident.status = 'RESOLVED';
    incident.resolvedAt = new Date().toISOString();
    incident.resolvedBy = resolvedBy;
    this.incidents.set(key, incident);
    return true;
  }

  public updateStatus(tenantId: string, incidentId: string, status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'MUTED'): boolean {
    const key = `${tenantId}:${incidentId}`;
    const incident = this.incidents.get(key);
    if (!incident) return false;

    incident.status = status;
    this.incidents.set(key, incident);
    return true;
  }

  public getIncident(tenantId: string, incidentId: string): IncidentRecord | undefined {
    return this.incidents.get(`${tenantId}:${incidentId}`);
  }

  public listIncidents(tenantId: string): IncidentRecord[] {
    const result: IncidentRecord[] = [];
    for (const [key, incident] of this.incidents.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        result.push({ ...incident });
      }
    }
    return result;
  }

  public clear(): void {
    this.incidents.clear();
  }
}

export const incidentManager = IncidentManager.getInstance();
