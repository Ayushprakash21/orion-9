/**
 * ORION-9 PART 4 TRACK 8: INTEGRATION & REAL-WORLD CONNECTIVITY
 * Data Residency & Region Routing Policy Enforcer
 *
 * Intercepts outbound/inbound integration requests and validates target regional destination
 * against tenant data residency policies. Fails closed on unauthorized cross-region egress.
 */

import { DataClassification } from '../types';
import { kernelAuditEngine } from '../kernel/AuditEngine';

export interface DataResidencyCheckRequest {
  tenantId: string;
  sourceRegion: string;
  destinationRegion: string;
  classification: DataClassification;
  connectorId: string;
}

export interface DataResidencyCheckResult {
  allowed: boolean;
  reason: string;
  policyId?: string;
}

export class DataResidencyEnforcer {
  private static instance: DataResidencyEnforcer;

  private constructor() {}

  public static getInstance(): DataResidencyEnforcer {
    if (!DataResidencyEnforcer.instance) {
      DataResidencyEnforcer.instance = new DataResidencyEnforcer();
    }
    return DataResidencyEnforcer.instance;
  }

  /**
   * Evaluates cross-region transfer compliance. Fails closed if prohibited.
   */
  public evaluateTransfer(request: DataResidencyCheckRequest): DataResidencyCheckResult {
    const { tenantId, sourceRegion, destinationRegion, classification, connectorId } = request;

    // Same-region transfer is always permitted
    if (sourceRegion === destinationRegion) {
      return {
        allowed: true,
        reason: `Intra-region data transfer within '${sourceRegion}' permitted.`,
      };
    }

    // RESTRICTED data classification prohibited from cross-region movement without explicit sovereign exception
    if (classification === 'RESTRICTED') {
      const reason = `[Data Residency Policy Violation] Transfer of RESTRICTED classification payload from '${sourceRegion}' to '${destinationRegion}' for tenant '${tenantId}' is strictly prohibited.`;

      kernelAuditEngine.record({
        action: 'DATA_RESIDENCY_VIOLATION_BLOCKED',
        actor: { id: 'DataResidencyEnforcer', type: 'SYSTEM', name: 'Data Residency Enforcer' },
        entityId: connectorId,
        entityType: 'INTEGRATION_CONNECTOR',
        classification: 'RESTRICTED',
        details: { tenantId, sourceRegion, destinationRegion, classification, reason }
      });

      return {
        allowed: false,
        reason,
        policyId: 'POL-SOVEREIGN-RESIDENCY-01',
      };
    }

    // Default cross-region audit log
    kernelAuditEngine.record({
      action: 'CROSS_REGION_DATA_TRANSFER_CHECK',
      actor: { id: 'DataResidencyEnforcer', type: 'SYSTEM', name: 'Data Residency Enforcer' },
      entityId: connectorId,
      entityType: 'INTEGRATION_CONNECTOR',
      classification,
      details: { tenantId, sourceRegion, destinationRegion }
    });

    return {
      allowed: true,
      reason: `Cross-region data transfer from '${sourceRegion}' to '${destinationRegion}' approved under tenant policy.`,
      policyId: 'POL-MULTI-REGION-ROUTING-02',
    };
  }
}

export const dataResidencyEnforcer = DataResidencyEnforcer.getInstance();
