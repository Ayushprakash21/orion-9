/**
 * ORION-9 INTEGRATION DEAD LETTER QUEUE (DLQ)
 * Layer 8 Integration Fabric Foundation
 *
 * Persists unprocessable integration messages, manages DLQ lifecycle,
 * and provides audited RETRY / DISCARD / RESOLVE capabilities.
 */

import { DLQRecord } from './types';
import { kernelEventBus } from '../kernel/EventBus';
import { kernelAuditEngine } from '../kernel/AuditEngine';
import { db, loadData, saveData } from '../data/db';

export class IntegrationDLQ {
  private static instance: IntegrationDLQ;
  private dlqRecords: Map<string, DLQRecord> = new Map();

  private constructor() {
    this.seedInitialDLQ();
    this.hydrate();
  }

  public static getInstance(): IntegrationDLQ {
    if (!IntegrationDLQ.instance) {
      IntegrationDLQ.instance = new IntegrationDLQ();
    }
    return IntegrationDLQ.instance;
  }

  private seedInitialDLQ(): void {
    const defaultTenant = 'org-tenant-a';
    const now = new Date().toISOString();

    const seed: DLQRecord = {
      messageId: 'dlq-msg-850-001',
      tenantId: defaultTenant,
      connectorId: 'conn-edi-x12-01',
      entityType: 'PurchaseOrder',
      payloadReference: {
        rawEdiSegment: 'ISA*00*          *00*          *ZZ*PARTNER        *ZZ*ORION9         *260921*2300*U*00401*000000101*0*P*>~',
        errorDetails: 'Missing MANDATORY REF segment for Supplier Tax ID',
      },
      errorCode: 'EDI_SCHEMA_VALIDATION_FAILED',
      errorMessage: 'Missing mandatory REF segment for Supplier Tax ID in X12 850 loop',
      attemptCount: 3,
      firstFailedAt: new Date(Date.now() - 3600000).toISOString(),
      lastFailedAt: now,
      status: 'UNRESOLVED',
    };

    this.dlqRecords.set(seed.messageId, seed);
  }

  private async hydrate(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const stored = await loadData<DLQRecord>(db.dlqMessages);
        if (stored && stored.length > 0) {
          stored.forEach(r => this.dlqRecords.set(r.messageId, r));
        }
      }
    } catch (e) {
      console.warn('[IntegrationDLQ] Hydration error:', e);
    }
  }

  private async persist(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      await saveData(db.dlqMessages, Array.from(this.dlqRecords.values()));
    } catch (e) {
      console.warn('[IntegrationDLQ] Persistence error:', e);
    }
  }

  /**
   * Enqueues a failed integration payload into the Dead Letter Queue
   */
  public enqueue(params: {
    tenantId: string;
    connectorId: string;
    entityType: string;
    payloadReference: any;
    errorCode: string;
    errorMessage: string;
    attemptCount: number;
    actor?: string;
  }): DLQRecord {
    if (!params.tenantId) throw new Error('Tenant ID is required for DLQ entry.');

    const messageId = `dlq-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const actor = params.actor || 'Integration Engine';

    const record: DLQRecord = {
      messageId,
      tenantId: params.tenantId,
      connectorId: params.connectorId,
      entityType: params.entityType,
      payloadReference: params.payloadReference,
      errorCode: params.errorCode,
      errorMessage: params.errorMessage,
      attemptCount: params.attemptCount,
      firstFailedAt: now,
      lastFailedAt: now,
      status: 'UNRESOLVED',
    };

    this.dlqRecords.set(messageId, record);
    this.persist();

    kernelAuditEngine.record({
      action: 'INTEGRATION_DLQ_ENQUEUE',
      actor: { id: actor, type: 'SYSTEM', name: actor },
      entityId: messageId,
      entityType: 'INTEGRATION_DLQ',
      classification: 'INTERNAL',
      details: {
        tenantId: params.tenantId,
        connectorId: params.connectorId,
        errorCode: params.errorCode,
        errorMessage: params.errorMessage
      }
    });

    kernelEventBus.publish('orion:integration:dlq-enqueued', {
      messageId,
      tenantId: params.tenantId,
      connectorId: params.connectorId,
      errorCode: params.errorCode
    }, {
      actor: { id: actor, type: 'SYSTEM', name: actor }
    });

    return record;
  }

  /**
   * Alias for enqueue
   */
  public enqueueMessage(params: {
    tenantId: string;
    connectorId: string;
    entityType: string;
    payloadReference: any;
    errorCode: string;
    errorMessage: string;
    attemptCount?: number;
    actor?: string;
  }): DLQRecord {
    return this.enqueue({
      ...params,
      attemptCount: params.attemptCount || 1,
    });
  }

  /**
   * Action: RETRY — Attempts re-processing of a DLQ message
   */
  public retryMessage(
    messageId: string,
    tenantId: string,
    actor: string,
    handler: (record: DLQRecord) => Promise<boolean>
  ): Promise<boolean> {
    const record = this.getRecord(messageId, tenantId);

    return handler(record).then((success) => {
      const now = new Date().toISOString();
      record.attemptCount += 1;
      record.lastFailedAt = now;

      if (success) {
        record.status = 'RETRIED';
      }

      this.persist();

      kernelAuditEngine.record({
        action: 'INTEGRATION_DLQ_RETRY',
        actor: { id: actor, type: 'USER', name: actor },
        entityId: messageId,
        entityType: 'INTEGRATION_DLQ',
        classification: 'INTERNAL',
        details: { tenantId, success, newAttemptCount: record.attemptCount }
      });

      return success;
    });
  }

  /**
   * Action: DISCARD — Ignores and discards a unprocessable DLQ message
   */
  public discardMessage(messageId: string, tenantId: string, actor: string, reason?: string): DLQRecord {
    const record = this.getRecord(messageId, tenantId);
    record.status = 'DISCARDED';
    this.persist();

    kernelAuditEngine.record({
      action: 'INTEGRATION_DLQ_DISCARD',
      actor: { id: actor, type: 'USER', name: actor },
      entityId: messageId,
      entityType: 'INTEGRATION_DLQ',
      classification: 'INTERNAL',
      details: { tenantId, reason: reason || 'Manual operator discard' }
    });

    return record;
  }

  /**
   * Action: RESOLVE — Marks a DLQ message resolved manually
   */
  public resolveMessage(messageId: string, tenantId: string, actor: string, resolutionComment?: string): DLQRecord {
    const record = this.getRecord(messageId, tenantId);
    record.status = 'RESOLVED';
    this.persist();

    kernelAuditEngine.record({
      action: 'INTEGRATION_DLQ_RESOLVE',
      actor: { id: actor, type: 'USER', name: actor },
      entityId: messageId,
      entityType: 'INTEGRATION_DLQ',
      classification: 'INTERNAL',
      details: { tenantId, resolutionComment }
    });

    return record;
  }

  /**
   * Retrieves single DLQ record enforcing tenant isolation
   */
  public getRecord(messageId: string, tenantId: string): DLQRecord {
    const record = this.dlqRecords.get(messageId);
    if (!record) throw new Error(`DLQ Record ${messageId} not found.`);
    if (record.tenantId !== tenantId) {
      throw new Error(`Tenant '${tenantId}' is not authorized to access DLQ message '${messageId}'.`);
    }
    return record;
  }

  /**
   * Lists DLQ records for a tenant
   */
  public listDLQ(tenantId: string): DLQRecord[] {
    if (!tenantId) return [];
    return Array.from(this.dlqRecords.values()).filter(r => r.tenantId === tenantId);
  }
}

export const integrationDLQ = IntegrationDLQ.getInstance();
