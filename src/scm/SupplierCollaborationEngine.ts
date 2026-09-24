/**
 * ORION-9 SUPPLIER COLLABORATION & CPFR ENGINE
 *
 * Implements:
 * 1. Shared demand forecasts and supplier capacity commitments.
 * 2. Capacity constraint gap detection and resolution.
 * 3. Collaborative Planning, Forecasting and Replenishment (CPFR) agreements.
 */

import { SupplierCommitmentRecord } from './types';
import { eventBus } from '../kernel/events/eventBus';

export class SupplierCollaborationEngine {
  private static instance: SupplierCollaborationEngine;
  private commitments: Map<string, SupplierCommitmentRecord[]> = new Map();

  public static getInstance(): SupplierCollaborationEngine {
    if (!SupplierCollaborationEngine.instance) {
      SupplierCollaborationEngine.instance = new SupplierCollaborationEngine();
    }
    return SupplierCollaborationEngine.instance;
  }

  public recordCommitment(params: Omit<SupplierCommitmentRecord, 'commitmentId' | 'capacityConstraintGap' | 'committedAt'>): SupplierCommitmentRecord {
    const capacityConstraintGap = Math.max(0, params.sharedForecastUnits - params.supplierCommittedUnits);

    const record: SupplierCommitmentRecord = {
      ...params,
      commitmentId: `COLLAB-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      capacityConstraintGap,
      committedAt: new Date().toISOString()
    };

    const list = this.commitments.get(params.tenantId) || [];
    list.unshift(record);
    this.commitments.set(params.tenantId, list);

    eventBus.emit({
      eventId: `EVT-COLLAB-${Date.now()}`,
      eventType: 'SUPPLIER_COMMITMENT_RECORDED',
      tenantId: params.tenantId,
      timestamp: new Date().toISOString(),
      payload: record,
      actor: { userId: params.supplierId, role: 'supplier_partner' }
    });

    return record;
  }

  public getCommitments(tenantId: string): SupplierCommitmentRecord[] {
    return this.commitments.get(tenantId) || [];
  }
}

export const supplierCollaborationEngine = SupplierCollaborationEngine.getInstance();
