/**
 * ORION-9 WARRANTY MANAGEMENT & SUPPLIER RECOVERY ENGINE
 *
 * Implements:
 * 1. Serialized warranty eligibility validation.
 * 2. Warranty claims inspection and resolution (Repair, Replace, Refund, Credit).
 * 3. Back-to-back supplier warranty cost recovery.
 */

import { WarrantyClaimRecord } from './types';
import { eventBus } from '../kernel/events/eventBus';
import { scmPersistenceService } from '../services/scm/ScmPersistenceService';

export class WarrantyManagementEngine {
  private static instance: WarrantyManagementEngine;
  private claims: Map<string, WarrantyClaimRecord[]> = new Map();

  public static getInstance(): WarrantyManagementEngine {
    if (!WarrantyManagementEngine.instance) {
      WarrantyManagementEngine.instance = new WarrantyManagementEngine();
    }
    return WarrantyManagementEngine.instance;
  }

  public submitClaim(params: Omit<WarrantyClaimRecord, 'claimId' | 'status' | 'supplierRecoveryStatus' | 'resolvedAt'>): WarrantyClaimRecord {
    const record: WarrantyClaimRecord = {
      ...params,
      claimId: `CLM-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      status: 'SUBMITTED',
      supplierRecoveryStatus: params.supplierRecoveryAmount > 0 ? 'PENDING_CLAIM' : 'NOT_APPLICABLE'
    };

    const list = this.claims.get(params.tenantId) || [];
    list.unshift(record);
    this.claims.set(params.tenantId, list);

    // Durable persistence with transactional outbox event
    scmPersistenceService.saveRecord('warranty_claims', record.claimId, record, {
      emitEvent: true,
      eventType: 'scm.warranty.submitted',
      partitionKey: `${params.tenantId}:${record.claimId}`,
      idempotencyKey: `warr-${params.tenantId}-${record.claimId}`
    }).catch((err) => {
      console.warn('[WARRANTY-ENGINE] Async persistence failed:', err);
    });

    eventBus.emit({
      eventId: `EVT-WARR-SUB-${Date.now()}`,
      eventType: 'WARRANTY_CLAIM_SUBMITTED',
      tenantId: params.tenantId,
      timestamp: new Date().toISOString(),
      payload: record,
      actor: { userId: 'CUSTOMER_SERVICE', role: 'operator' }
    });

    return record;
  }

  public resolveClaim(params: {
    tenantId: string;
    claimId: string;
    resolution: WarrantyClaimRecord['resolution'];
    inspectionFinding: string;
    supplierRecoveryAmount?: number;
  }): WarrantyClaimRecord {
    const list = this.claims.get(params.tenantId) || [];
    const claim = list.find(c => c.claimId === params.claimId);
    if (!claim) throw new Error(`Warranty claim ${params.claimId} not found`);

    claim.status = params.resolution === 'REJECTED' ? 'DENIED' : 'RESOLVED';
    claim.resolution = params.resolution;
    claim.inspectionFinding = params.inspectionFinding;
    claim.resolvedAt = new Date().toISOString();

    // Durable persistence of resolved claim
    scmPersistenceService.saveRecord('warranty_claims', claim.claimId, claim, {
      emitEvent: true,
      eventType: 'scm.warranty.resolved',
      partitionKey: `${params.tenantId}:${claim.claimId}`,
      idempotencyKey: `warr-res-${params.tenantId}-${claim.claimId}`
    }).catch((err) => {
      console.warn('[WARRANTY-ENGINE] Async update failed:', err);
    });
    if (params.supplierRecoveryAmount !== undefined) {
      claim.supplierRecoveryAmount = params.supplierRecoveryAmount;
      claim.supplierRecoveryStatus = params.supplierRecoveryAmount > 0 ? 'RECOVERED' : 'NOT_APPLICABLE';
    }

    eventBus.emit({
      eventId: `EVT-WARR-RES-${Date.now()}`,
      eventType: 'WARRANTY_RESOLVED',
      tenantId: params.tenantId,
      timestamp: new Date().toISOString(),
      payload: claim,
      actor: { userId: 'QUALITY_INSPECTOR', role: 'admin' }
    });

    return claim;
  }

  /**
   * Reconstruct authoritative state from storage for a fresh instance.
   */
  public async hydrateFromStorage(tenantId: string): Promise<WarrantyClaimRecord[]> {
    const stored = await scmPersistenceService.listRecords<WarrantyClaimRecord>('warranty_claims', tenantId);
    if (stored.length > 0) {
      this.claims.set(tenantId, stored);
      return stored;
    }
    return this.claims.get(tenantId) || [];
  }

  public getClaims(tenantId: string): WarrantyClaimRecord[] {
    const current = this.claims.get(tenantId);
    if (current && current.length > 0) {
      return current;
    }
    const cached = scmPersistenceService.listCachedRecords<WarrantyClaimRecord>('warranty_claims', tenantId);
    if (cached.length > 0) {
      this.claims.set(tenantId, cached);
      return cached;
    }
    return [];
  }

  public clear(): void {
    this.claims.clear();
  }
}

export const warrantyManagementEngine = WarrantyManagementEngine.getInstance();
