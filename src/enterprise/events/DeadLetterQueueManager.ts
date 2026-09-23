/**
 * ORION-9 WAVE 11: DEAD-LETTER QUEUE & POISON PILL QUARANTINE
 * Captures, quarantines, inspects, and re-drives malformed or repeatedly
 * failed integration and broker messages.
 */

import { DistributedEventEnvelope } from './EventEnvelope';
import { messageBroker } from './MessageBroker';

export type DeadLetterStatus = 'QUARANTINED' | 'INSPECTED' | 'REDRIVEN' | 'DISCARDED';

export interface DeadLetterRecord {
  dlqId: string;
  tenantId: string;
  originalTopic: string;
  envelope: DistributedEventEnvelope;
  failureReason: string;
  stackTrace?: string;
  attemptCount: number;
  maxAttempts: number;
  status: DeadLetterStatus;
  isPoisonPill: boolean;
  quarantinedAt: string;
  redrivenAt?: string;
  inspectedBy?: string;
  redriveTargetTopic?: string;
}

export interface RetryPolicy {
  maxRetries: number;
  initialBackoffMs: number;
  backoffMultiplier: number;
  maxBackoffMs: number;
  jitterMs: number;
}

export class DeadLetterQueueManager {
  private static instance: DeadLetterQueueManager;
  // Key: dlqId
  private deadLetters: Map<string, DeadLetterRecord> = new Map();

  private defaultRetryPolicy: RetryPolicy = {
    maxRetries: 3,
    initialBackoffMs: 1000,
    backoffMultiplier: 2,
    maxBackoffMs: 30000,
    jitterMs: 250
  };

  private constructor() {
    this.seedDefaultDeadLetters();
  }

  public static getInstance(): DeadLetterQueueManager {
    if (!DeadLetterQueueManager.instance) {
      DeadLetterQueueManager.instance = new DeadLetterQueueManager();
    }
    return DeadLetterQueueManager.instance;
  }

  private seedDefaultDeadLetters(): void {
    const tenantId = 'demo-tenant';
    const now = new Date(Date.now() - 3600000).toISOString();

    const sampleDLQ: DeadLetterRecord = {
      dlqId: 'dlq-sample-01',
      tenantId,
      originalTopic: 'enterprise.events.edi.inbound',
      envelope: {
        eventId: 'evt-edi-malformed-001',
        tenantId,
        regionId: 'reg-us-east',
        eventType: 'edi.x12.850.inbound',
        correlationId: 'corr-edi-bad-seg',
        producer: 'edi-fabric',
        occurredAt: now,
        idempotencyKey: 'idemp-bad-isa-01',
        partitionKey: 'PARTNER-ACME',
        schemaVersion: '1.0.0',
        payload: {
          rawEdi: 'ISA*00*          *00*          *ZZ*ACME           *ZZ*ORION9         *260922*1200*U*00401*000000001*0*T*:~GS*PO*ACME*ORION9*20260922*1200*1*X*004010~ST*850*0001~BEG*00*SA*PO-9999**20260922~SE*4*0001~GE*1*1~IEA*1*000000001~'
        }
      },
      failureReason: 'Mandatory Segment PO1 missing in Purchase Order transaction set ST*850*0001',
      stackTrace: 'Error: EDIParserException: Segment PO1 mandatory for X12 850 line items\n  at EDIParser.parse (EDIParser.ts:42)',
      attemptCount: 3,
      maxAttempts: 3,
      status: 'QUARANTINED',
      isPoisonPill: true,
      quarantinedAt: now
    };

    this.deadLetters.set(sampleDLQ.dlqId, sampleDLQ);
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  public calculateBackoffMs(attempt: number, policy: RetryPolicy = this.defaultRetryPolicy): number {
    const exponential = policy.initialBackoffMs * Math.pow(policy.backoffMultiplier, attempt);
    const capped = Math.min(exponential, policy.maxBackoffMs);
    const jitter = Math.floor(Math.random() * policy.jitterMs);
    return capped + jitter;
  }

  /**
   * Enqueue a failed message into the Dead Letter Queue
   */
  public async quarantineMessage(params: {
    tenantId: string;
    originalTopic: string;
    envelope: DistributedEventEnvelope;
    failureReason: string;
    stackTrace?: string;
    attemptCount: number;
    maxAttempts?: number;
    isPoisonPill?: boolean;
  }): Promise<DeadLetterRecord> {
    const dlqId = `dlq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const record: DeadLetterRecord = {
      dlqId,
      tenantId: params.tenantId,
      originalTopic: params.originalTopic,
      envelope: params.envelope,
      failureReason: params.failureReason,
      stackTrace: params.stackTrace,
      attemptCount: params.attemptCount,
      maxAttempts: params.maxAttempts || this.defaultRetryPolicy.maxRetries,
      status: 'QUARANTINED',
      isPoisonPill: params.isPoisonPill ?? (params.attemptCount >= (params.maxAttempts || this.defaultRetryPolicy.maxRetries)),
      quarantinedAt: now
    };

    this.deadLetters.set(dlqId, record);

    // Publish quarantine notification to dlq topic
    await messageBroker.publish('enterprise.events.dlq', {
      eventId: `dlq-evt-${dlqId}`,
      tenantId: params.tenantId,
      regionId: params.envelope.regionId || 'reg-us-east',
      eventType: 'dlq.message.quarantined',
      correlationId: params.envelope.correlationId,
      producer: 'dlq-manager',
      occurredAt: now,
      idempotencyKey: `dlq-publish-${dlqId}`,
      partitionKey: params.tenantId,
      schemaVersion: '1.0.0',
      payload: {
        dlqId,
        originalTopic: params.originalTopic,
        failureReason: params.failureReason,
        isPoisonPill: record.isPoisonPill
      }
    });

    return record;
  }

  public getRecord(dlqId: string): DeadLetterRecord | undefined {
    return this.deadLetters.get(dlqId);
  }

  public listRecords(tenantId: string, status?: DeadLetterStatus): DeadLetterRecord[] {
    const records: DeadLetterRecord[] = [];
    for (const record of this.deadLetters.values()) {
      if (record.tenantId === tenantId) {
        if (!status || record.status === status) {
          records.push({ ...record });
        }
      }
    }
    return records.sort((a, b) => new Date(b.quarantinedAt).getTime() - new Date(a.quarantinedAt).getTime());
  }

  public markInspected(dlqId: string, inspectedBy: string): boolean {
    const record = this.deadLetters.get(dlqId);
    if (!record) return false;
    record.status = 'INSPECTED';
    record.inspectedBy = inspectedBy;
    this.deadLetters.set(dlqId, record);
    return true;
  }

  /**
   * Re-drive a quarantined message back to its original or alternate topic
   */
  public async redriveMessage(dlqId: string, targetTopic?: string): Promise<{ success: boolean; redriveOffset?: number }> {
    const record = this.deadLetters.get(dlqId);
    if (!record) return { success: false };

    const topic = targetTopic || record.originalTopic;
    // Generate fresh idempotency key to bypass previous dedup rejection
    const redrivenEnvelope: DistributedEventEnvelope = {
      ...record.envelope,
      idempotencyKey: `redrive-${record.dlqId}-${Date.now()}`,
      headers: {
        ...(record.envelope.headers || {}),
        'x-redriven-from-dlq': record.dlqId,
        'x-redrive-timestamp': new Date().toISOString()
      }
    };

    const pubResult = await messageBroker.publish(topic, redrivenEnvelope);

    record.status = 'REDRIVEN';
    record.redrivenAt = new Date().toISOString();
    record.redriveTargetTopic = topic;
    this.deadLetters.set(dlqId, record);

    return { success: true, redriveOffset: pubResult.offset };
  }

  public discardMessage(dlqId: string): boolean {
    const record = this.deadLetters.get(dlqId);
    if (!record) return false;
    record.status = 'DISCARDED';
    this.deadLetters.set(dlqId, record);
    return true;
  }

  public clear(): void {
    this.deadLetters.clear();
  }
}

export const deadLetterQueueManager = DeadLetterQueueManager.getInstance();
