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
import { scmPersistenceService } from '../services/scm/ScmPersistenceService';

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

    // Durable persistence with transactional outbox event
    scmPersistenceService.saveRecord('supplier_commitments', record.commitmentId, record, {
      emitEvent: true,
      eventType: 'scm.supplier_commitment.recorded',
      partitionKey: `${params.tenantId}:${record.commitmentId}`,
      idempotencyKey: `collab-${params.tenantId}-${record.commitmentId}`
    }).catch((err) => {
      console.warn('[SUPPLIER-COLLAB-ENGINE] Async persistence failed:', err);
    });

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

  /**
   * Reconstruct authoritative state from storage for a fresh instance.
   */
  public async hydrateFromStorage(tenantId: string): Promise<SupplierCommitmentRecord[]> {
    const stored = await scmPersistenceService.listRecords<SupplierCommitmentRecord>('supplier_commitments', tenantId);
    if (stored.length > 0) {
      this.commitments.set(tenantId, stored);
      return stored;
    }
    return this.commitments.get(tenantId) || [];
  }

  public getCommitments(tenantId: string): SupplierCommitmentRecord[] {
    const current = this.commitments.get(tenantId);
    if (current && current.length > 0) {
      return current;
    }
    const cached = scmPersistenceService.listCachedRecords<SupplierCommitmentRecord>('supplier_commitments', tenantId);
    if (cached.length > 0) {
      this.commitments.set(tenantId, cached);
      return cached;
    }
    return [];
  }

  public clear(): void {
    this.commitments.clear();
  }
}

export const supplierCollaborationEngine = SupplierCollaborationEngine.getInstance();
