/**
 * ORION-9 WAVE 3.3 — EDI ACKNOWLEDGEMENT MANAGER (997/999)
 */

import { AckType, EDIAckRecord } from '../types';

export class AcknowledgementManager {
  private static instance: AcknowledgementManager;
  private acks: Map<string, EDIAckRecord> = new Map(); // key: `${tenantId}:${ackId}`

  private constructor() {}

  public static getInstance(): AcknowledgementManager {
    if (!AcknowledgementManager.instance) {
      AcknowledgementManager.instance = new AcknowledgementManager();
    }
    return AcknowledgementManager.instance;
  }

  public generate997Ack(params: {
    tenantId: string;
    originalMessageId: string;
    controlNumber: string;
    senderId: string;
    receiverId: string;
    accepted: boolean;
    errors?: Array<{ code: string; message: string; segmentPosition?: number }>;
  }): EDIAckRecord {
    const ackId = `ACK997-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const status = params.accepted
      ? params.errors && params.errors.length > 0
        ? 'ACCEPTED_WITH_ERRORS'
        : 'ACCEPTED'
      : 'REJECTED';

    const ackCode = status === 'ACCEPTED' ? 'A' : status === 'ACCEPTED_WITH_ERRORS' ? 'E' : 'R';

    // Construct X12 997 payload snippet
    const generatedPayload = [
      `ISA*00*          *00*          *ZZ*${params.receiverId.padEnd(15)}*ZZ*${params.senderId.padEnd(15)}*${new Date().toISOString().substring(2, 10).replace(/-/g, '')}*1200*U*00401*${params.controlNumber.padStart(9, '0')}*0*P*>~`,
      `GS*FA*${params.receiverId}*${params.senderId}*20260921*1200*1*X*004010~`,
      `ST*997*0001~`,
      `AK1*PO*${params.controlNumber}~`,
      `AK2*850*${params.controlNumber}~`,
      `AK5*${ackCode}~`,
      `AK9*${ackCode}*1*1*${params.accepted ? 1 : 0}~`,
      `SE*6*0001~`,
      `GE*1*1~`,
      `IEA*1*${params.controlNumber.padStart(9, '0')}~`,
    ].join('\n');

    const record: EDIAckRecord = {
      ackId,
      tenantId: params.tenantId,
      originalMessageId: params.originalMessageId,
      originalControlNumber: params.controlNumber,
      ackType: 'TRANSPORT_997',
      status,
      errorDetails: params.errors,
      generatedPayload,
      createdAt: new Date().toISOString(),
    };

    this.acks.set(`${params.tenantId}:${ackId}`, record);
    return record;
  }

  public generate999Ack(params: {
    tenantId: string;
    originalMessageId: string;
    controlNumber: string;
    accepted: boolean;
    errors?: Array<{ code: string; message: string; segmentPosition?: number }>;
  }): EDIAckRecord {
    const ackId = `ACK999-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const status = params.accepted ? 'ACCEPTED' : 'REJECTED';

    const record: EDIAckRecord = {
      ackId,
      tenantId: params.tenantId,
      originalMessageId: params.originalMessageId,
      originalControlNumber: params.controlNumber,
      ackType: 'FUNCTIONAL_999',
      status,
      errorDetails: params.errors,
      generatedPayload: `ST*999*0001~\nAK9*${status === 'ACCEPTED' ? 'A' : 'R'}~\nSE*3*0001~`,
      createdAt: new Date().toISOString(),
    };

    this.acks.set(`${params.tenantId}:${ackId}`, record);
    return record;
  }

  public getAck(tenantId: string, ackId: string): EDIAckRecord | undefined {
    return this.acks.get(`${tenantId}:${ackId}`);
  }

  public listAcks(tenantId: string): EDIAckRecord[] {
    const result: EDIAckRecord[] = [];
    for (const [key, ack] of this.acks.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        result.push({ ...ack });
      }
    }
    return result;
  }

  public clear(): void {
    this.acks.clear();
  }
}

export const acknowledgementManager = AcknowledgementManager.getInstance();
