/**
 * ORION-9 ENTERPRISE INCIDENT MANAGEMENT LEDGER & REPOSITORY
 * 
 * Authoritative persistence layer for enterprise incidents backed by Cloud Firestore (`incidents` collection).
 * Follows the proven security architecture of GovernancePolicyRepository:
 * - Deterministic tenant-scoped keying: `${tenantId}_${incidentId}`
 * - Strict FAIL-CLOSED semantics in LIVE mode if Firestore is unavailable
 * - Non-authoritative, short-lived (60s TTL), tenant-scoped read-through cache
 * - Enforces valid incident state transitions
 * - Monotonic versioning & optimistic concurrency guards (stale update rejection)
 * - Append-only immutable timeline subcollections (`incidents/{docId}/timeline/{eventId}`)
 * - Cross-tenant isolation verification and prevention of cross-tenant leakage
 * - Immutable audit logging via kernelAuditEngine
 * - Safe operational telemetry for System Status Engine
 */

import {
  IncidentRecord,
  IncidentStatus,
  IncidentSeverity,
  IncidentTimelineEvent,
  IncidentEvidenceRecord,
} from '../../operations/types';
import { dbManager } from '../database/DatabaseConnectionManager';
import { kernelEventBus } from '../../kernel/EventBus';
import { kernelAuditEngine } from '../../kernel/AuditEngine';
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
} from 'firebase/firestore';

interface CachedIncident {
  incident: IncidentRecord;
  cachedAt: number;
}

// Allowed state transitions graph
const VALID_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  DETECTED: ['ACKNOWLEDGED', 'INVESTIGATING', 'CLOSED'],
  OPEN: ['ACKNOWLEDGED', 'INVESTIGATING', 'CLOSED'],
  ACKNOWLEDGED: ['INVESTIGATING', 'MITIGATING', 'MITIGATED', 'CLOSED'],
  INVESTIGATING: ['MITIGATING', 'MITIGATED', 'RESOLVED', 'CLOSED'],
  MITIGATING: ['MITIGATED', 'RESOLVED', 'CLOSED'],
  MITIGATED: ['RESOLVED', 'CLOSED', 'INVESTIGATING'],
  RESOLVED: ['CLOSED', 'INVESTIGATING'],
  CLOSED: ['INVESTIGATING'], // Authorized reopening only
};

function sanitizeFirestorePayload(data: any, path: string): any {
  if (data === undefined) return null;
  if (data === null || typeof data !== 'object') return data;
  if (data instanceof Date) return data.toISOString();

  if (Array.isArray(data)) {
    return data.map((item, index) => sanitizeFirestorePayload(item, `${path}[${index}]`));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      sanitized[key] = sanitizeFirestorePayload(value, `${path}.${key}`);
    }
  }
  return sanitized;
}

export class IncidentRepository {
  private static instance: IncidentRepository;
  private nonAuthoritativeCache: Map<string, CachedIncident> = new Map();
  private readonly CACHE_TTL_MS = 60_000; // 60 seconds TTL

  // Telemetry metadata
  private lastSuccessfulLoadAt: number | null = null;
  private lastIncidentUpdateAt: number | null = null;
  private lastError: string | null = null;

  private constructor() {
    // Invalidate non-authoritative cache on realtime events
    kernelEventBus.subscribe('INCIDENT_UPDATED', (event: any) => {
      const tenantId =
        event?.payload?.tenantId ||
        event?.tenant?.tenantId ||
        event?.tenant?.organizationId ||
        event?.tenantId;
      if (tenantId) {
        this.invalidateCache(tenantId);
      } else {
        this.invalidateCache();
      }
    });

    kernelEventBus.subscribe('DATABASE_ENVIRONMENT_CHANGED', () => {
      this.invalidateCache();
    });
  }

  public static getInstance(): IncidentRepository {
    if (!IncidentRepository.instance) {
      IncidentRepository.instance = new IncidentRepository();
    }
    return IncidentRepository.instance;
  }

  /**
   * Deterministic document ID format for incidents collection:
   * Format: `${tenantId}_${incidentId}`
   */
  public getDocumentId(tenantId: string, incidentId: string): string {
    if (incidentId.startsWith(`${tenantId}_`)) {
      return incidentId;
    }
    return `${tenantId}_${incidentId}`;
  }

  /**
   * Clears the non-authoritative in-memory cache
   */
  public invalidateCache(tenantId?: string): void {
    if (!tenantId) {
      this.nonAuthoritativeCache.clear();
      return;
    }
    for (const [key, entry] of this.nonAuthoritativeCache.entries()) {
      if (entry.incident.tenantId === tenantId || key.startsWith(`${tenantId}_`)) {
        this.nonAuthoritativeCache.delete(key);
      }
    }
  }

  /**
   * Validates incident structure, required tenant scope, and metadata.
   */
  public validateIncidentPayload(
    incident: IncidentRecord,
    targetTenantId?: string,
    actorRole?: string,
    actorId?: string
  ): void {
    if (!incident) {
      throw new Error('INCIDENT_VALIDATION_ERROR: Incident payload is required.');
    }

    if (!incident.id || !incident.id.trim()) {
      throw new Error('INCIDENT_VALIDATION_ERROR: Missing incident id.');
    }

    if (!incident.tenantId || incident.tenantId === 'UNRESOLVED' || !incident.tenantId.trim()) {
      throw new Error('INCIDENT_VALIDATION_ERROR: Valid tenantId is required.');
    }

    if (targetTenantId && incident.tenantId !== targetTenantId) {
      throw new Error(
        `TENANT_ACCESS_DENIED: Incident tenant '${incident.tenantId}' does not match target tenant '${targetTenantId}'.`
      );
    }

    if (!incident.title || !incident.title.trim()) {
      throw new Error('INCIDENT_VALIDATION_ERROR: Incident title is required.');
    }

    if (!incident.severity) {
      throw new Error('INCIDENT_VALIDATION_ERROR: Incident severity is required.');
    }

    if (!incident.status) {
      throw new Error('INCIDENT_VALIDATION_ERROR: Incident status is required.');
    }

    if (actorRole) {
      const validRoles = [
        'platform_admin',
        'organization_admin',
        'admin',
        'incident_commander',
        'sre_lead',
        'operator',
      ];
      if (!validRoles.includes(actorRole)) {
        throw new Error(
          `INCIDENT_ACCESS_DENIED: Actor '${actorId || 'unknown'}' with role '${actorRole}' lacks required authority.`
        );
      }
    }
  }

  /**
   * Validates that state transition complies with valid state machine.
   */
  public validateStateTransition(currentStatus: IncidentStatus, newStatus: IncidentStatus): void {
    if (currentStatus === newStatus) return; // No-op transition
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `INVALID_STATE_TRANSITION: Cannot transition incident from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${allowed.join(', ') || 'none'}`
      );
    }
  }

  /**
   * Retrieves authoritative incident from Cloud Firestore with non-authoritative read-through cache.
   * In LIVE mode: FAILS CLOSED if Firestore is unavailable.
   */
  public async getIncident(tenantId: string, incidentId: string): Promise<IncidentRecord | null> {
    if (!tenantId || tenantId === 'UNRESOLVED') {
      throw new Error('INCIDENT_ACCESS_DENIED: Unresolved tenant.');
    }
    if (!incidentId) return null;

    // Check if incidentId contains a foreign tenant prefix
    if (incidentId.includes('_')) {
      const prefix = incidentId.split('_')[0];
      if (prefix.startsWith('tenant-') && prefix !== tenantId) {
        throw new Error(`TENANT_ACCESS_DENIED: Incident prefix '${prefix}' does not match requester tenant '${tenantId}'.`);
      }
    }

    const cacheKey = `${tenantId}_${incidentId}`;
    const cached = this.nonAuthoritativeCache.get(cacheKey);
    const now = Date.now();

    const activeEnv = dbManager.getEnvironment();

    // Check non-authoritative cache freshness
    if (cached && now - cached.cachedAt < this.CACHE_TTL_MS) {
      if (cached.incident.tenantId !== tenantId) {
        this.nonAuthoritativeCache.delete(cacheKey);
        throw new Error('TENANT_ACCESS_DENIED: Cached incident tenant mismatch.');
      }
      return cached.incident;
    }

    // Check cross-tenant isolation in in-memory cache
    for (const entry of this.nonAuthoritativeCache.values()) {
      if (entry.incident.id === incidentId && entry.incident.tenantId !== tenantId) {
        throw new Error(`TENANT_ACCESS_DENIED: Incident '${incidentId}' belongs to tenant '${entry.incident.tenantId}'.`);
      }
    }

    const firestore = dbManager.getFirestore();

    // FAIL-CLOSED invariant for LIVE environment:
    if (activeEnv === 'LIVE' && !firestore) {
      this.lastError = 'Authoritative Firestore connection unavailable in LIVE mode.';
      throw new Error('INCIDENT_STORE_UNAVAILABLE: Authoritative Firestore connection unavailable in LIVE mode.');
    }

    if (firestore) {
      try {
        const docId = this.getDocumentId(tenantId, incidentId);
        const ref = doc(firestore, 'incidents', docId);
        const snapshot = await getDoc(ref);

        if (snapshot.exists()) {
          const raw = snapshot.data() as IncidentRecord;
          if (raw.tenantId !== tenantId) {
            throw new Error(`TENANT_ACCESS_DENIED: Incident belongs to tenant '${raw.tenantId}'.`);
          }

          const record: IncidentRecord = { ...raw, id: raw.id || incidentId };
          this.nonAuthoritativeCache.set(cacheKey, { incident: record, cachedAt: now });
          this.lastSuccessfulLoadAt = now;
          this.lastError = null;
          return record;
        } else {
          // If not found for current tenant, verify if this incidentId exists for another tenant
          const crossCheckQuery = query(
            collection(firestore, 'incidents'),
            where('id', '==', incidentId)
          );
          const crossSnap = await getDocs(crossCheckQuery);
          if (!crossSnap.empty) {
            const otherIncident = crossSnap.docs[0].data() as IncidentRecord;
            if (otherIncident.tenantId !== tenantId) {
              throw new Error(`TENANT_ACCESS_DENIED: Incident '${incidentId}' belongs to tenant '${otherIncident.tenantId}'.`);
            }
          }
        }
      } catch (err: any) {
        if (err.message && (err.message.includes('TENANT_ACCESS_DENIED') || err.message.includes('INCIDENT_ACCESS_DENIED'))) {
          throw err;
        }
        if (activeEnv === 'LIVE') {
          this.lastError = err?.message || 'Firestore getDoc failed';
          throw new Error(`INCIDENT_STORE_UNAVAILABLE: Failed to read authoritative incident from Firestore: ${err?.message || err}`);
        }
      }
    }

    // In DEMO environment: Check if cached in memory
    if (activeEnv === 'DEMO') {
      if (cached) return cached.incident;
    }

    return null;
  }

  /**
   * Lists all authoritative incidents for the authorized tenant scope.
   */
  public async listIncidents(tenantId: string): Promise<IncidentRecord[]> {
    if (!tenantId || tenantId === 'UNRESOLVED') {
      throw new Error('INCIDENT_ACCESS_DENIED: Unresolved tenant.');
    }

    const activeEnv = dbManager.getEnvironment();
    const firestore = dbManager.getFirestore();

    if (activeEnv === 'LIVE' && !firestore) {
      this.lastError = 'Authoritative Firestore unavailable in LIVE mode.';
      throw new Error('INCIDENT_STORE_UNAVAILABLE: Authoritative Firestore unavailable in LIVE mode.');
    }

    const results: IncidentRecord[] = [];
    const now = Date.now();

    if (firestore) {
      try {
        const q = query(
          collection(firestore, 'incidents'),
          where('tenantId', '==', tenantId)
        );
        const snapshot = await getDocs(q);

        snapshot.forEach((d) => {
          const item = d.data() as IncidentRecord;
          if (item.tenantId === tenantId) {
            const recordWithId = { ...item, id: item.id || d.id };
            results.push(recordWithId);
            this.nonAuthoritativeCache.set(`${tenantId}_${item.id}`, {
              incident: recordWithId,
              cachedAt: now,
            });
          }
        });

        this.lastSuccessfulLoadAt = now;
        this.lastError = null;
        return results;
      } catch (err: any) {
        if (activeEnv === 'LIVE') {
          this.lastError = err?.message || 'Firestore query failed';
          throw new Error(`INCIDENT_STORE_UNAVAILABLE: Failed to query authoritative incidents: ${err?.message || err}`);
        }
      }
    }

    // DEMO fallback: Return cached incidents matching tenantId
    if (activeEnv === 'DEMO') {
      for (const entry of this.nonAuthoritativeCache.values()) {
        if (entry.incident.tenantId === tenantId) {
          results.push(entry.incident);
        }
      }
    }

    return results;
  }

  /**
   * Persists a newly declared incident to Firestore `incidents` and initializes append-only timeline.
   */
  public async createIncident(
    incident: IncidentRecord,
    actorRole?: string,
    actorId?: string
  ): Promise<IncidentRecord> {
    this.validateIncidentPayload(incident, incident.tenantId, actorRole, actorId);

    const activeEnv = dbManager.getEnvironment();

    // Prevent DEMO incidents from leaking into LIVE
    if (activeEnv === 'LIVE' && incident.environment === 'DEMO') {
      throw new Error('INCIDENT_ACCESS_DENIED: DEMO incident cannot be declared in LIVE environment.');
    }

    incident.environment = activeEnv;
    incident.version = 1;
    incident.declaredAt = incident.declaredAt || new Date().toISOString();
    incident.updatedAt = new Date().toISOString();
    incident.updatedBy = actorId || incident.declaredBy;

    const docId = this.getDocumentId(incident.tenantId, incident.id);
    const firestore = dbManager.getFirestore();

    if (activeEnv === 'LIVE' && !firestore) {
      throw new Error('INCIDENT_STORE_UNAVAILABLE: Cannot persist incident. Firestore is unavailable in LIVE mode.');
    }

    // Initialize first timeline event if empty
    if (!incident.timeline || incident.timeline.length === 0) {
      const initialEvent: IncidentTimelineEvent = {
        id: `ev-${Date.now()}-1`,
        eventId: `ev-${Date.now()}-1`,
        incidentId: incident.id,
        tenantId: incident.tenantId,
        timestamp: incident.declaredAt,
        description: `Incident declared with severity ${incident.severity}: ${incident.title}`,
        actor: actorId || incident.declaredBy,
        actionTaken: 'INCIDENT_DECLARED',
        statusChange: incident.status,
        newStatus: incident.status,
      };
      incident.timeline = [initialEvent];
    } else {
      // Ensure all timeline events have incidentId and tenantId
      incident.timeline = incident.timeline.map((ev, idx) => ({
        ...ev,
        id: ev.id || `ev-${Date.now()}-${idx}`,
        eventId: ev.eventId || ev.id || `ev-${Date.now()}-${idx}`,
        incidentId: incident.id,
        tenantId: incident.tenantId,
      }));
    }

    const sanitized = sanitizeFirestorePayload(incident, `incidents/${docId}`);

    if (firestore) {
      const ref = doc(firestore, 'incidents', docId);
      await setDoc(ref, sanitized);

      // Persist timeline event into append-only subcollection: incidents/{docId}/timeline/{eventId}
      for (const ev of incident.timeline) {
        const evId = ev.eventId || ev.id;
        const timelineRef = doc(firestore, 'incidents', docId, 'timeline', evId);
        await setDoc(timelineRef, sanitizeFirestorePayload(ev, `incidents/${docId}/timeline/${evId}`));
      }
    }

    // Update non-authoritative cache
    const now = Date.now();
    this.nonAuthoritativeCache.set(`${incident.tenantId}_${incident.id}`, {
      incident,
      cachedAt: now,
    });
    this.lastIncidentUpdateAt = now;

    // Publish cluster event
    kernelEventBus.publish('INCIDENT_CREATED', incident, {
      actor: { id: actorId || incident.declaredBy, type: 'USER' },
      tenant: { tenantId: incident.tenantId, organizationId: incident.organizationId || incident.tenantId },
      entityId: incident.id,
      entityType: 'incident',
    });

    // Record immutable audit ledger event
    await kernelAuditEngine.record({
      action: 'DECLARE_INCIDENT',
      actor: { id: actorId || incident.declaredBy, type: 'USER', name: actorId || incident.declaredBy },
      entityId: incident.id,
      entityType: 'INCIDENT',
      classification: incident.severity === 'SEV1' ? 'RESTRICTED' : 'INTERNAL',
      result: 'SUCCESS',
      details: {
        severity: incident.severity,
        status: incident.status,
        title: incident.title,
        blastRadiusScore: incident.blastRadiusScore,
      },
    });

    return incident;
  }

  /**
   * Updates an existing incident authoritatively.
   * Strictly enforces monotonic versioning and optimistic concurrency guards.
   */
  public async updateIncident(
    tenantId: string,
    incidentId: string,
    updates: Partial<IncidentRecord>,
    actorRole?: string,
    actorId?: string
  ): Promise<IncidentRecord> {
    const existing = await this.getIncident(tenantId, incidentId);
    if (!existing) {
      throw new Error(`INCIDENT_NOT_FOUND: Incident '${incidentId}' not found for tenant '${tenantId}'.`);
    }

    // Enforce tenant boundary
    if (existing.tenantId !== tenantId) {
      throw new Error('TENANT_ACCESS_DENIED: Cannot modify an incident belonging to another tenant.');
    }

    // Role-based verification
    if (actorRole) {
      const validRoles = [
        'platform_admin',
        'organization_admin',
        'admin',
        'incident_commander',
        'sre_lead',
        'operator',
      ];
      if (!validRoles.includes(actorRole)) {
        throw new Error(
          `INCIDENT_ACCESS_DENIED: Actor '${actorId || 'unknown'}' with role '${actorRole}' lacks required authority.`
        );
      }
    }

    // Enforce optimistic concurrency / versioning check
    const currentVersion = existing.version || 1;
    if (updates.version !== undefined && updates.version !== currentVersion + 1) {
      throw new Error(
        `INCIDENT_VERSION_CONFLICT: Stale incident update. Current version is ${currentVersion}, update must be ${currentVersion + 1} (received ${updates.version}).`
      );
    }

    // Verify state transition validity if status is being updated
    if (updates.status && updates.status !== existing.status) {
      this.validateStateTransition(existing.status, updates.status);
    }

    const activeEnv = dbManager.getEnvironment();
    const now = new Date().toISOString();
    const updatedVersion = currentVersion + 1;

    const merged: IncidentRecord = {
      ...existing,
      ...updates,
      id: existing.id,
      tenantId: existing.tenantId, // Tenant is permanently immutable
      version: updatedVersion,
      environment: activeEnv,
      updatedAt: now,
      updatedBy: actorId || updates.updatedBy || 'operator',
    };

    if (updates.status === 'MITIGATED' && !merged.mitigatedAt) {
      merged.mitigatedAt = now;
    }
    if ((updates.status === 'RESOLVED' || updates.status === 'CLOSED') && !merged.resolvedAt) {
      merged.resolvedAt = now;
    }
    if (updates.status === 'CLOSED' && !merged.closedAt) {
      merged.closedAt = now;
      merged.closedBy = actorId || updates.updatedBy || 'operator';
    }

    const docId = this.getDocumentId(tenantId, incidentId);
    const firestore = dbManager.getFirestore();

    if (activeEnv === 'LIVE' && !firestore) {
      throw new Error('INCIDENT_STORE_UNAVAILABLE: Cannot persist incident update. Firestore is unavailable in LIVE mode.');
    }

    const sanitized = sanitizeFirestorePayload(merged, `incidents/${docId}`);

    if (firestore) {
      const ref = doc(firestore, 'incidents', docId);
      await setDoc(ref, sanitized, { merge: true });
    }

    // Update non-authoritative cache
    const cacheTime = Date.now();
    this.nonAuthoritativeCache.set(`${tenantId}_${incidentId}`, {
      incident: merged,
      cachedAt: cacheTime,
    });
    this.lastIncidentUpdateAt = cacheTime;

    // Publish event
    kernelEventBus.publish('INCIDENT_UPDATED', merged, {
      actor: { id: actorId || merged.updatedBy || 'operator', type: 'USER' },
      tenant: { tenantId: merged.tenantId, organizationId: merged.organizationId || merged.tenantId },
      entityId: merged.id,
      entityType: 'incident',
    });

    // Immutable audit record
    await kernelAuditEngine.record({
      action: 'UPDATE_INCIDENT',
      actor: { id: actorId || merged.updatedBy || 'operator', type: 'USER', name: actorId || merged.updatedBy || 'operator' },
      entityId: merged.id,
      entityType: 'INCIDENT',
      classification: merged.severity === 'SEV1' ? 'RESTRICTED' : 'INTERNAL',
      result: 'SUCCESS',
      details: {
        newStatus: merged.status,
        version: updatedVersion,
      },
    });

    return merged;
  }

  /**
   * Appends an immutable timeline event to both the incident record and the subcollection.
   * Historical events are permanent and cannot be modified or deleted.
   */
  public async appendTimelineEvent(
    tenantId: string,
    incidentId: string,
    event: IncidentTimelineEvent,
    actorRole?: string,
    actorId?: string
  ): Promise<IncidentTimelineEvent> {
    const existing = await this.getIncident(tenantId, incidentId);
    if (!existing) {
      throw new Error(`INCIDENT_NOT_FOUND: Incident '${incidentId}' not found for tenant '${tenantId}'.`);
    }

    if (existing.tenantId !== tenantId) {
      throw new Error('TENANT_ACCESS_DENIED: Cannot append timeline event to an incident belonging to another tenant.');
    }

    const eventId = event.eventId || event.id || `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fullEvent: IncidentTimelineEvent = {
      ...event,
      id: eventId,
      eventId,
      incidentId,
      tenantId,
      timestamp: event.timestamp || new Date().toISOString(),
      actor: event.actor || actorId || 'operator',
    };

    const docId = this.getDocumentId(tenantId, incidentId);
    const firestore = dbManager.getFirestore();
    const activeEnv = dbManager.getEnvironment();

    if (activeEnv === 'LIVE' && !firestore) {
      throw new Error('INCIDENT_STORE_UNAVAILABLE: Cannot persist timeline event. Firestore is unavailable in LIVE mode.');
    }

    if (firestore) {
      const timelineRef = doc(firestore, 'incidents', docId, 'timeline', eventId);
      const snapshot = await getDoc(timelineRef);
      if (snapshot.exists()) {
        throw new Error(`IMMUTABLE_TIMELINE_VIOLATION: Timeline event '${eventId}' already exists and cannot be overwritten.`);
      }
      await setDoc(timelineRef, sanitizeFirestorePayload(fullEvent, `incidents/${docId}/timeline/${eventId}`));
    }

    // Append to incident in-memory / record timeline
    const updatedTimeline = [...(existing.timeline || []), fullEvent];
    await this.updateIncident(tenantId, incidentId, { timeline: updatedTimeline }, actorRole, actorId);

    // Audit log
    await kernelAuditEngine.record({
      action: 'APPEND_INCIDENT_TIMELINE',
      actor: { id: fullEvent.actor, type: 'USER', name: fullEvent.actor },
      entityId: incidentId,
      entityType: 'INCIDENT_TIMELINE',
      classification: 'INTERNAL',
      result: 'SUCCESS',
      details: {
        eventId,
        actionTaken: fullEvent.actionTaken,
        statusChange: fullEvent.statusChange,
      },
    });

    return fullEvent;
  }

  /**
   * Retrieves all immutable timeline events for an incident from subcollection.
   */
  public async getTimeline(tenantId: string, incidentId: string): Promise<IncidentTimelineEvent[]> {
    const existing = await this.getIncident(tenantId, incidentId);
    if (!existing) {
      throw new Error(`INCIDENT_NOT_FOUND: Incident '${incidentId}' not found for tenant '${tenantId}'.`);
    }

    const firestore = dbManager.getFirestore();
    const docId = this.getDocumentId(tenantId, incidentId);

    if (firestore) {
      try {
        const q = collection(firestore, 'incidents', docId, 'timeline');
        const snap = await getDocs(q);
        const events: IncidentTimelineEvent[] = [];
        snap.forEach((d) => {
          events.push(d.data() as IncidentTimelineEvent);
        });
        if (events.length > 0) {
          return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        }
      } catch (err: any) {
        // Fall back to record's timeline
      }
    }

    return existing.timeline || [];
  }

  /**
   * Transitions status of an incident through valid state machine.
   */
  public async transitionStatus(
    tenantId: string,
    incidentId: string,
    newStatus: IncidentStatus,
    actor: string,
    description: string,
    actionTaken?: string,
    actorRole?: string
  ): Promise<IncidentRecord> {
    const existing = await this.getIncident(tenantId, incidentId);
    if (!existing) {
      throw new Error(`INCIDENT_NOT_FOUND: Incident '${incidentId}' not found for tenant '${tenantId}'.`);
    }

    this.validateStateTransition(existing.status, newStatus);

    const timelineEvent: IncidentTimelineEvent = {
      id: `ev-${Date.now()}`,
      eventId: `ev-${Date.now()}`,
      incidentId,
      tenantId,
      timestamp: new Date().toISOString(),
      description,
      actor,
      actionTaken,
      previousStatus: existing.status,
      newStatus,
      statusChange: newStatus,
    };

    const updated = await this.updateIncident(
      tenantId,
      incidentId,
      {
        status: newStatus,
        version: (existing.version || 1) + 1,
      },
      actorRole,
      actor
    );

    await this.appendTimelineEvent(tenantId, incidentId, timelineEvent, actorRole, actor);
    return updated;
  }

  /**
   * Safe operational telemetry for System Status Engine (zero secrets, zero customer data).
   */
  public getIncidentTelemetry(): {
    incidentStoreAvailable: boolean;
    activeIncidentCount: number;
    incidentListenerState: 'ACTIVE' | 'IDLE' | 'UNINITIALIZED' | 'ERROR';
    incidentTimelineHealth: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
    incidentStatus: 'INCIDENT_HEALTHY' | 'INCIDENT_DEGRADED' | 'INCIDENT_UNAVAILABLE' | 'INCIDENT_ERROR';
    lastIncidentAt: number | null;
  } {
    const activeEnv = dbManager.getEnvironment();
    const firestore = dbManager.getFirestore();
    const storeAvailable = activeEnv === 'DEMO' ? true : firestore !== null;

    let activeIncidentCount = 0;
    for (const cached of this.nonAuthoritativeCache.values()) {
      if (['OPEN', 'DETECTED', 'ACKNOWLEDGED', 'INVESTIGATING', 'MITIGATING'].includes(cached.incident.status)) {
        activeIncidentCount++;
      }
    }

    let status: 'INCIDENT_HEALTHY' | 'INCIDENT_DEGRADED' | 'INCIDENT_UNAVAILABLE' | 'INCIDENT_ERROR' = 'INCIDENT_HEALTHY';
    if (!storeAvailable) {
      status = activeEnv === 'LIVE' ? 'INCIDENT_UNAVAILABLE' : 'INCIDENT_DEGRADED';
    } else if (this.lastError) {
      status = 'INCIDENT_DEGRADED';
    }

    return {
      incidentStoreAvailable: storeAvailable,
      activeIncidentCount,
      incidentListenerState: storeAvailable ? 'ACTIVE' : 'ERROR',
      incidentTimelineHealth: storeAvailable ? 'HEALTHY' : 'UNAVAILABLE',
      incidentStatus: status,
      lastIncidentAt: this.lastIncidentUpdateAt,
    };
  }
}

export const incidentRepository = IncidentRepository.getInstance();
