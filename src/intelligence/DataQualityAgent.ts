export interface DataAnomaly {
  anomalyId: string;
  entityType: 'PRODUCT' | 'SUPPLIER' | 'PURCHASE_ORDER' | 'LOCATION' | 'FORECAST';
  entityId: string;
  anomalyType: 'DUPLICATE_RECORD' | 'INVALID_UNIT' | 'STALE_DATA' | 'SCHEMA_VIOLATION' | 'MISSING_RELATIONSHIP';
  description: string;
  isLowRiskRepairable: boolean;
  proposedFixPayload: Record<string, any>;
}

export interface DataRepairResult {
  anomalyId: string;
  repairedAutonomously: boolean;
  requiresHumanApproval: boolean;
  status: 'REPAIRED' | 'PENDING_APPROVAL' | 'FAILED';
  actionSummary: string;
}

export class DataQualityAgent {
  private static detectedAnomalies: DataAnomaly[] = [];

  /**
   * Scans master data entities for anomalies
   */
  public static scanEntity(entityType: DataAnomaly['entityType'], entityData: Record<string, any>): DataAnomaly | null {
    if (!entityData) return null;

    // 1. Check Unit of Measure
    if (entityData.uom && typeof entityData.uom === 'string' && entityData.uom.toLowerCase() === 'pcs') {
      const anomaly: DataAnomaly = {
        anomalyId: `anom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        entityType,
        entityId: entityData.id || 'UNKNOWN',
        anomalyType: 'INVALID_UNIT',
        description: `Legacy unit notation 'pcs' detected for ${entityData.id}; standardize to 'UNITS'`,
        isLowRiskRepairable: true,
        proposedFixPayload: { uom: 'UNITS' }
      };
      this.detectedAnomalies.push(anomaly);
      return anomaly;
    }

    // 2. Check Missing Supplier Location Relationship
    if (entityType === 'SUPPLIER' && (!entityData.country || entityData.country === '')) {
      const anomaly: DataAnomaly = {
        anomalyId: `anom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        entityType,
        entityId: entityData.id || 'UNKNOWN',
        anomalyType: 'MISSING_RELATIONSHIP',
        description: `Supplier ${entityData.name || entityData.id} missing primary country classification`,
        isLowRiskRepairable: false, // Material fix requires approval
        proposedFixPayload: { country: 'US' }
      };
      this.detectedAnomalies.push(anomaly);
      return anomaly;
    }

    return null;
  }

  /**
   * Processes data repair: low-risk issues execute autonomously; material corrections require approval
   */
  public static processRepair(anomaly: DataAnomaly): DataRepairResult {
    if (anomaly.isLowRiskRepairable) {
      return {
        anomalyId: anomaly.anomalyId,
        repairedAutonomously: true,
        requiresHumanApproval: false,
        status: 'REPAIRED',
        actionSummary: `Autonomously repaired ${anomaly.anomalyType} for ${anomaly.entityId} using standardized payload.`
      };
    }

    return {
      anomalyId: anomaly.anomalyId,
      repairedAutonomously: false,
      requiresHumanApproval: true,
      status: 'PENDING_APPROVAL',
      actionSummary: `Material data repair for ${anomaly.entityId} queued for human approval.`
    };
  }

  public static getDetectedAnomalies(): DataAnomaly[] {
    return [...this.detectedAnomalies];
  }
}
