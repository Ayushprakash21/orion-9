/**
 * ORION-9 CUSTOMS & INTERNATIONAL TRADE COMPLIANCE ENGINE
 *
 * Implements:
 * 1. Customs declaration lifecycle and HS code classification.
 * 2. Commercial invoice, bill of lading, and certificate of origin references.
 * 3. Customs hold detection and clearance workflows.
 */

import { CustomsDeclarationRecord } from './types';
import { eventBus } from '../kernel/events/eventBus';

export class CustomsTradeEngine {
  private static instance: CustomsTradeEngine;
  private declarations: Map<string, CustomsDeclarationRecord[]> = new Map();

  public static getInstance(): CustomsTradeEngine {
    if (!CustomsTradeEngine.instance) {
      CustomsTradeEngine.instance = new CustomsTradeEngine();
    }
    return CustomsTradeEngine.instance;
  }

  public fileDeclaration(params: Omit<CustomsDeclarationRecord, 'declarationId' | 'updatedAt'>): CustomsDeclarationRecord {
    const record: CustomsDeclarationRecord = {
      ...params,
      declarationId: `CUST-DEC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      updatedAt: new Date().toISOString()
    };

    const list = this.declarations.get(params.tenantId) || [];
    list.unshift(record);
    this.declarations.set(params.tenantId, list);

    eventBus.emit({
      eventId: `EVT-CUST-DEC-${Date.now()}`,
      eventType: 'CUSTOMS_DECLARATION_FILED',
      tenantId: params.tenantId,
      timestamp: new Date().toISOString(),
      payload: record,
      actor: { userId: 'TRADE_COMPLIANCE_OFFICER', role: 'admin' }
    });

    return record;
  }

  public setCustomsHold(tenantId: string, declarationId: string, reason: string): CustomsDeclarationRecord {
    const list = this.declarations.get(tenantId) || [];
    const dec = list.find(d => d.declarationId === declarationId);
    if (!dec) throw new Error(`Customs declaration ${declarationId} not found`);

    dec.clearanceStatus = 'CUSTOMS_HOLD';
    dec.holdReason = reason;
    dec.updatedAt = new Date().toISOString();

    eventBus.emit({
      eventId: `EVT-CUST-HOLD-${Date.now()}`,
      eventType: 'CUSTOMS_HOLD_FLAGGED',
      tenantId,
      timestamp: new Date().toISOString(),
      payload: { declarationId, reason },
      actor: { userId: 'PORT_AUTHORITY_GATEWAY', role: 'system' }
    });

    return dec;
  }

  public releaseCustomsHold(tenantId: string, declarationId: string): CustomsDeclarationRecord {
    const list = this.declarations.get(tenantId) || [];
    const dec = list.find(d => d.declarationId === declarationId);
    if (!dec) throw new Error(`Customs declaration ${declarationId} not found`);

    dec.clearanceStatus = 'CLEARED';
    dec.holdReason = undefined;
    dec.clearedAt = new Date().toISOString();
    dec.updatedAt = new Date().toISOString();

    eventBus.emit({
      eventId: `EVT-CUST-REL-${Date.now()}`,
      eventType: 'CUSTOMS_CLEARED',
      tenantId,
      timestamp: new Date().toISOString(),
      payload: { declarationId, clearedAt: dec.clearedAt },
      actor: { userId: 'TRADE_OFFICER', role: 'admin' }
    });

    return dec;
  }

  public getDeclarations(tenantId: string): CustomsDeclarationRecord[] {
    return this.declarations.get(tenantId) || [];
  }
}

export const customsTradeEngine = CustomsTradeEngine.getInstance();
