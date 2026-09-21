/**
 * ORION-9 WAVE 3.3 — DURABLE MESSAGE LIFECYCLE MANAGER
 */

import { DurableMessageRecord, MessageState } from '../types';

export class MessageLifecycleManager {
  private static instance: MessageLifecycleManager;
  private messages: Map<string, DurableMessageRecord> = new Map(); // key: `${tenantId}:${messageId}`

  private constructor() {}

  public static getInstance(): MessageLifecycleManager {
    if (!MessageLifecycleManager.instance) {
      MessageLifecycleManager.instance = new MessageLifecycleManager();
    }
    return MessageLifecycleManager.instance;
  }

  public createMessage(params: {
    tenantId: string;
    messageId?: string;
    partnerId?: string;
    connectorId?: string;
    transportId?: string;
    externalId?: string;
    controlNumber?: string;
    idempotencyKey: string;
    direction: 'INBOUND' | 'OUTBOUND';
    rawPayload?: string;
  }): DurableMessageRecord {
    const messageId = params.messageId || `MSG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const record: DurableMessageRecord = {
      messageId,
      tenantId: params.tenantId,
      partnerId: params.partnerId,
      connectorId: params.connectorId,
      transportId: params.transportId,
      externalId: params.externalId,
      controlNumber: params.controlNumber,
      idempotencyKey: params.idempotencyKey,
      direction: params.direction,
      state: 'RECEIVED',
      rawPayload: params.rawPayload,
      stateHistory: [{ state: 'RECEIVED', timestamp: now, detail: 'Message ingested into fabric' }],
      createdAt: now,
      updatedAt: now,
    };

    this.messages.set(`${params.tenantId}:${messageId}`, record);
    return record;
  }

  public updateState(tenantId: string, messageId: string, newState: MessageState, detail?: string): DurableMessageRecord | undefined {
    const key = `${tenantId}:${messageId}`;
    const record = this.messages.get(key);
    if (!record) return undefined;

    const now = new Date().toISOString();
    record.state = newState;
    record.stateHistory.push({ state: newState, timestamp: now, detail });
    record.updatedAt = now;

    this.messages.set(key, record);
    return record;
  }

  public setMappedPayload(tenantId: string, messageId: string, mappedPayload: any): void {
    const key = `${tenantId}:${messageId}`;
    const record = this.messages.get(key);
    if (record) {
      record.mappedPayload = mappedPayload;
      record.updatedAt = new Date().toISOString();
      this.messages.set(key, record);
    }
  }

  public getMessage(tenantId: string, messageId: string): DurableMessageRecord | undefined {
    return this.messages.get(`${tenantId}:${messageId}`);
  }

  public listMessages(tenantId: string): DurableMessageRecord[] {
    const result: DurableMessageRecord[] = [];
    for (const [key, msg] of this.messages.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        result.push({ ...msg });
      }
    }
    return result;
  }

  public clear(): void {
    this.messages.clear();
  }
}

export const messageLifecycleManager = MessageLifecycleManager.getInstance();
