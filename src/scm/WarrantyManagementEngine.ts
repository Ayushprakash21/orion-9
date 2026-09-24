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

  public getClaims(tenantId: string): WarrantyClaimRecord[] {
    return this.claims.get(tenantId) || [];
  }
}

export const warrantyManagementEngine = WarrantyManagementEngine.getInstance();
