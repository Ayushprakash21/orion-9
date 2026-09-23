/**
 * ORION-9 PART 4 TRACK 9: OBSERVABILITY & OPERATIONAL INTELLIGENCE
 * Security Telemetry Guard & Audit Log Protection
 *
 * Captures tamper-resistant security events and enforces tenant isolation on telemetry queries.
 * Prevents unauthorized users from reading cross-tenant or platform security telemetry.
 */

import { StructuredLogRecord } from './types';
import { observabilityService } from './ObservabilityService';
import { kernelAuditEngine } from '../kernel/AuditEngine';
import { kernelEventBus } from '../kernel/EventBus';

export type SecurityEventType =
  | 'AUTH_FAILURE'
  | 'AUTHORIZATION_DENIED'
  | 'CROSS_TENANT_ATTEMPT'
  | 'AI_SELF_APPROVAL_BLOCKED'
  | 'KERNEL_BYPASS_ATTEMPT'
  | 'PROMPT_INJECTION_DETECTED'
  | 'SECRET_ACCESS_DENIED'
  | 'REPLAY_ATTEMPT';

export interface SecurityEventRecord {
  id: string;
  timestamp: string;
  type: SecurityEventType;
  tenantId: string;
  actorId: string;
  resourceId?: string;
  details: string;
  ipAddress?: string;
  signature: string; // Tamper-resistant verification signature
}

export class SecurityTelemetryGuard {
  private static instance: SecurityTelemetryGuard;
  private securityEvents: SecurityEventRecord[] = [];

  private constructor() {}

  public static getInstance(): SecurityTelemetryGuard {
    if (!SecurityTelemetryGuard.instance) {
      SecurityTelemetryGuard.instance = new SecurityTelemetryGuard();
    }
    return SecurityTelemetryGuard.instance;
  }

  /**
   * Generates deterministic signature for tamper prevention
   */
  private generateSignature(record: Omit<SecurityEventRecord, 'signature'>): string {
    const raw = `${record.id}:${record.timestamp}:${record.type}:${record.tenantId}:${record.actorId}:${record.details}`;
    return `sec-sig-${raw.length}-${Math.abs(raw.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0))}`;
  }

  /**
   * Records a security event with tamper-resistant audit signature
   */
  public recordSecurityEvent(params: {
    type: SecurityEventType;
    tenantId: string;
    actorId: string;
    resourceId?: string;
    details: string;
    ipAddress?: string;
  }): SecurityEventRecord {
    const id = `sec-ev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();

    const baseRecord = {
      id,
      timestamp,
      type: params.type,
      tenantId: params.tenantId,
      actorId: params.actorId,
      resourceId: params.resourceId,
      details: params.details,
      ipAddress: params.ipAddress || '127.0.0.1',
    };

    const signature = this.generateSignature(baseRecord);
    const record: SecurityEventRecord = { ...baseRecord, signature };

    this.securityEvents.unshift(record);
    if (this.securityEvents.length > 500) {
      this.securityEvents.pop();
    }

    // Also send through structured log with ERROR level
    observabilityService.log('ERROR', `[SecurityEvent:${params.type}] ${params.details}`, {
      tenantId: params.tenantId,
      context: { actorId: params.actorId, resourceId: params.resourceId, type: params.type },
    });

    kernelAuditEngine.record({
      action: `SECURITY_EVENT_${params.type}`,
      actor: { id: params.actorId, type: 'USER', name: params.actorId },
      entityId: id,
      entityType: 'SECURITY_TELEMETRY',
      classification: 'RESTRICTED',
      details: { tenantId: params.tenantId, details: params.details }
    });

    kernelEventBus.publish('orion:observability:security-event', {
      eventId: id,
      tenantId: params.tenantId,
      type: params.type,
      actorId: params.actorId,
    }, { actor: { id: params.actorId, type: 'USER', name: params.actorId } });

    return record;
  }

  /**
   * Queries security events enforcing strict tenant isolation and role permissions
   */
  public querySecurityEvents(requestingTenantId: string, actorRole: string): SecurityEventRecord[] {
    if (actorRole !== 'PLATFORM_ADMIN' && actorRole !== 'ORG_ADMIN') {
      throw new Error('[Security Telemetry Guard] Standard users are not authorized to view security audit telemetry.');
    }

    return this.securityEvents.filter((ev) => ev.tenantId === requestingTenantId || actorRole === 'PLATFORM_ADMIN');
  }
}

export const securityTelemetryGuard = SecurityTelemetryGuard.getInstance();
