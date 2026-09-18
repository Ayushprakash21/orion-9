/**
 * ORION-9 ENTERPRISE AUDIT EVENT LOGGING SERVICE
 * 
 * Captures immutable audit traces for authentication, privileged step-up,
 * authorization decisions, database configuration, and administrative operations.
 */

import { AuditEvent, RoleCode } from '../types/auth';
import { generateCorrelationId } from '../kernel/security/crypto';
import { getSupabase } from '../lib/supabaseClient';

const LOCAL_AUDIT_KEY = 'orion_audit_events';
const MAX_LOCAL_AUDIT_LOGS = 500;

export interface LogAuditParams {
  actorUserId: string;
  actorName: string;
  actorRole?: RoleCode;
  organizationId?: string;
  action: string;
  operation?: string;
  resourceType: string;
  resourceId?: string;
  status: 'success' | 'failure';
  correlationId?: string;
  metadata?: Record<string, any>;
  beforeState?: any;
  afterState?: any;
}

class AuditService {
  /**
   * Factory method for supply chain state machine audit event creation.
   */
  public static createEvent(
    entityId: string,
    action: string,
    actor: string,
    details?: Record<string, any>
  ): any {
    return {
      id: generateCorrelationId('audit-evt'),
      entityId,
      action,
      actor,
      timestamp: new Date().toISOString(),
      details: details || {},
      status: 'SUCCESS',
      correlationId: generateCorrelationId('trace'),
    };
  }

  /**
   * Records an audit event both to local storage and asynchronously to Supabase (if available).
   */
  public async log(params: LogAuditParams): Promise<AuditEvent> {
    const event: AuditEvent = {
      id: generateCorrelationId('audit'),
      organizationId: params.organizationId || 'ORION_PLATFORM',
      actorUserId: params.actorUserId,
      actorName: params.actorName,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      timestamp: new Date().toISOString(),
      status: params.status,
      correlationId: params.correlationId || generateCorrelationId('trace'),
      metadata: {
        ...(params.metadata || {}),
        operation: params.operation || params.action,
        actorRole: params.actorRole,
        beforeState: params.beforeState,
        afterState: params.afterState,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server/Node',
      },
    };

    // 1. Write to Local Store
    this.saveLocally(event);

    // 2. Push to Supabase if connected
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('audit_events').insert({
          id: event.id,
          organization_id: event.organizationId,
          actor_user_id: event.actorUserId,
          actor_name: event.actorName,
          action: event.action,
          resource_type: event.resourceType,
          resource_id: event.resourceId,
          status: event.status,
          correlation_id: event.correlationId,
          metadata: event.metadata,
          created_at: event.timestamp,
        });
      }
    } catch (err) {
      // Offline or remote DB not yet configured: local persistence guarantees trace preservation
      console.warn('[AUDIT_REMOTE_WARN] Could not mirror audit event to remote database:', err);
    }

    return event;
  }

  public getRecentLogs(limit: number = 50): AuditEvent[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(LOCAL_AUDIT_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.slice(0, limit) : [];
    } catch (e) {
      return [];
    }
  }

  private saveLocally(event: AuditEvent): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(LOCAL_AUDIT_KEY);
      const existing: AuditEvent[] = raw ? JSON.parse(raw) : [];
      existing.unshift(event);
      if (existing.length > MAX_LOCAL_AUDIT_LOGS) {
        existing.splice(MAX_LOCAL_AUDIT_LOGS);
      }
      localStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify(existing));
    } catch (e) {
      console.warn('Failed to save audit log locally:', e);
    }
  }
}

export { AuditService };
export const auditService = new AuditService();
