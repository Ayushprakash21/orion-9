/**
 * ORION-9 WAVE 11: DATA RESIDENCY & SOVEREIGN BOUNDARY POLICY ENGINE
 * Enforces jurisdictional boundaries, cross-border data transfer controls,
 * and automated PII / commercial secrecy redaction.
 */

export type ResidencyBoundaryType = 
  | 'STRICT_SOVEREIGN'     // Data must never leave designated sovereign region
  | 'CONDITIONAL_TRANSFER' // Transfer allowed with field-level redaction & audit
  | 'GLOBAL_REPLICATED';   // Master catalog data freely distributable

export interface DataResidencyPolicy {
  policyId: string;
  tenantId: string;
  name: string;
  boundaryType: ResidencyBoundaryType;
  sovereignJurisdiction: string; // e.g. 'EU_GDPR', 'US_ITAR', 'CN_CSL'
  applicableEntities: string[]; // e.g. ['CUSTOMER', 'EMPLOYEE', 'ITAR_PART', 'FINANCIAL_LEDGER']
  restrictedFields: string[]; // Fields that cannot cross boundaries without masking
  allowedDestinationRegions: string[]; // Regions permitted to receive data
  enforceFailClosed: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResidencyEvaluationResult {
  allowed: boolean;
  policyId: string;
  boundaryType: ResidencyBoundaryType;
  requiresRedaction: boolean;
  redactedFields: string[];
  violationReason?: string;
  sanitizedPayload?: any;
  auditRecord: {
    sourceRegionId: string;
    destinationRegionId: string;
    evaluatedAt: string;
    tenantId: string;
  };
}

export class DataResidencyPolicyEngine {
  private static instance: DataResidencyPolicyEngine;
  private policies: Map<string, DataResidencyPolicy> = new Map(); // key: `${tenantId}:${policyId}`

  private constructor() {
    this.seedDefaultPolicies();
  }

  public static getInstance(): DataResidencyPolicyEngine {
    if (!DataResidencyPolicyEngine.instance) {
      DataResidencyPolicyEngine.instance = new DataResidencyPolicyEngine();
    }
    return DataResidencyPolicyEngine.instance;
  }

  private seedDefaultPolicies(): void {
    const tenantId = 'demo-tenant';
    const now = new Date().toISOString();

    const defaultPolicies: DataResidencyPolicy[] = [
      {
        policyId: 'pol-gdpr-strict',
        tenantId,
        name: 'EU GDPR Sovereign Data Protection Policy',
        boundaryType: 'STRICT_SOVEREIGN',
        sovereignJurisdiction: 'EU_GDPR',
        applicableEntities: ['CUSTOMER_PII', 'PAYMENT_DETAILS', 'EMPLOYEE_RECORD'],
        restrictedFields: ['iban', 'taxId', 'email', 'personalAddress', 'passportNumber'],
        allowedDestinationRegions: ['reg-eu-central'],
        enforceFailClosed: true,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        policyId: 'pol-itar-defense',
        tenantId,
        name: 'US ITAR Aerospace Defense Export Control Policy',
        boundaryType: 'STRICT_SOVEREIGN',
        sovereignJurisdiction: 'US_DOMESTIC',
        applicableEntities: ['ITAR_ASSEMBLY', 'DEFENSE_CONTRACT', 'MUNITIONS_BOM'],
        restrictedFields: ['cadDrawingUrl', 'materialComposition', 'clearanceLevel'],
        allowedDestinationRegions: ['reg-us-east', 'reg-us-west-dr'],
        enforceFailClosed: true,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        policyId: 'pol-commercial-order-sync',
        tenantId,
        name: 'Commercial Order Sync with Redaction Policy',
        boundaryType: 'CONDITIONAL_TRANSFER',
        sovereignJurisdiction: 'GLOBAL',
        applicableEntities: ['PURCHASE_ORDER', 'SHIPMENT_STATUS', 'INVOICE'],
        restrictedFields: ['internalCostMargin', 'supplierRebatePercentage'],
        allowedDestinationRegions: ['reg-us-east', 'reg-eu-central', 'reg-apac-sg', 'reg-us-west-dr'],
        enforceFailClosed: true,
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    const seedTenants = ['demo-tenant', 'ORION_PLATFORM'];
    for (const t of seedTenants) {
      for (const p of defaultPolicies) {
        this.policies.set(`${t}:${p.policyId}`, { ...p, tenantId: t });
      }
    }
  }

  public registerPolicy(policy: DataResidencyPolicy): DataResidencyPolicy {
    const key = `${policy.tenantId}:${policy.policyId}`;
    this.policies.set(key, { ...policy, updatedAt: new Date().toISOString() });
    return this.policies.get(key)!;
  }

  public getPolicy(tenantId: string, policyId: string): DataResidencyPolicy | undefined {
    return this.policies.get(`${tenantId}:${policyId}`);
  }

  public listPolicies(tenantId: string): DataResidencyPolicy[] {
    const results: DataResidencyPolicy[] = [];
    for (const [key, policy] of this.policies.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        results.push({ ...policy });
      }
    }
    return results;
  }

  /**
   * Determine whether a payload or entity is sensitive based on explicit classification,
   * flags, known sensitive entity patterns, or restricted field content.
   */
  public isSensitiveRecord(params: {
    entityType: string;
    payload: any;
    dataClassification?: string;
    isSensitive?: boolean;
  }): boolean {
    if (params.isSensitive === true) return true;
    if (params.isSensitive === false) return false;

    const classification = params.dataClassification || params.payload?.classification || params.payload?.dataClassification;
    if (classification) {
      const upper = String(classification).toUpperCase();
      if (['RESTRICTED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'].includes(upper)) {
        return true;
      }
      if (['PUBLIC'].includes(upper)) {
        return false;
      }
    }

    if (params.payload?.isSensitive === true || params.payload?.sensitive === true) {
      return true;
    }

    const sensitivePatterns = [
      'PII', 'GDPR', 'ITAR', 'CONFIDENTIAL', 'RESTRICTED', 'SECRET', 'PAYMENT', 
      'BANK', 'IBAN', 'PASSPORT', 'CREDENTIAL', 'HEALTH', 'DEFENSE', 'MUNITIONS',
      'CUSTOMER_PII', 'PAYMENT_DETAILS', 'EMPLOYEE_RECORD', 'ITAR_ASSEMBLY', 'DEFENSE_CONTRACT', 'MUNITIONS_BOM'
    ];
    const upperEntity = (params.entityType || '').toUpperCase();
    if (sensitivePatterns.some(pattern => upperEntity.includes(pattern))) {
      return true;
    }

    // Inspect payload keys for sensitive fields like iban, passport, ssn, taxId, etc.
    if (params.payload && typeof params.payload === 'object') {
      const sensitiveKeys = ['iban', 'taxId', 'passportNumber', 'ssn', 'creditCard', 'cadDrawingUrl', 'clearanceLevel'];
      for (const key of sensitiveKeys) {
        if (key in params.payload && params.payload[key] !== undefined && params.payload[key] !== null) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Evaluate a cross-region data transfer payload against active residency policies
   */
  public evaluateTransfer(params: {
    tenantId: string;
    entityType: string;
    sourceRegionId: string;
    destinationRegionId: string;
    payload: any;
    dataClassification?: string;
    isSensitive?: boolean;
  }): ResidencyEvaluationResult {
    const { tenantId, entityType, sourceRegionId, destinationRegionId, payload } = params;
    const now = new Date().toISOString();

    // Intra-region transfer is always permitted
    if (sourceRegionId === destinationRegionId) {
      return {
        allowed: true,
        policyId: 'INTRA_REGION_IMPLICIT',
        boundaryType: 'GLOBAL_REPLICATED',
        requiresRedaction: false,
        redactedFields: [],
        sanitizedPayload: payload,
        auditRecord: {
          sourceRegionId,
          destinationRegionId,
          evaluatedAt: now,
          tenantId
        }
      };
    }

    // Find applicable active policy
    const applicable = this.listPolicies(tenantId).filter(
      p => p.isActive && (p.applicableEntities.includes(entityType) || p.applicableEntities.includes('*'))
    );

    // If no explicit policy matches, fail-closed by default for sensitive or unknown records
    if (applicable.length === 0) {
      const isSensitive = this.isSensitiveRecord({
        entityType,
        payload,
        dataClassification: params.dataClassification,
        isSensitive: params.isSensitive
      });

      const rawClassification = params.dataClassification || payload?.classification || payload?.dataClassification;
      const isUnknownClassification = rawClassification !== undefined && !['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED', 'GLOBAL', 'GLOBAL_REPLICATED'].includes(String(rawClassification).toUpperCase());

      if (isSensitive || isUnknownClassification) {
        const violationReason = isUnknownClassification
          ? `Cross-border transfer blocked: Entity ${entityType} has unknown/unsupported classification [${rawClassification}]. Failing closed by default.`
          : `Cross-border transfer blocked: Entity ${entityType} is classified as sensitive (classification: ${rawClassification || 'SENSITIVE_INFERRED'}) and no explicit residency policy matches. Failing closed by default.`;

        return {
          allowed: false,
          policyId: 'DEFAULT_FAIL_CLOSED_NO_POLICY',
          boundaryType: 'STRICT_SOVEREIGN',
          requiresRedaction: false,
          redactedFields: [],
          violationReason,
          auditRecord: {
            sourceRegionId,
            destinationRegionId,
            evaluatedAt: now,
            tenantId
          }
        };
      }

      // Non-sensitive data without explicit restriction falls back to global replication
      return {
        allowed: true,
        policyId: 'DEFAULT_OPEN_BORDER',
        boundaryType: 'GLOBAL_REPLICATED',
        requiresRedaction: false,
        redactedFields: [],
        sanitizedPayload: payload,
        auditRecord: {
          sourceRegionId,
          destinationRegionId,
          evaluatedAt: now,
          tenantId
        }
      };
    }

    // Check each policy
    for (const policy of applicable) {
      // 1. Strict Sovereign check
      if (policy.boundaryType === 'STRICT_SOVEREIGN') {
        if (!policy.allowedDestinationRegions.includes(destinationRegionId)) {
          return {
            allowed: false,
            policyId: policy.policyId,
            boundaryType: policy.boundaryType,
            requiresRedaction: false,
            redactedFields: [],
            violationReason: `Cross-border transfer blocked: Entity ${entityType} is governed by STRICT_SOVEREIGN policy ${policy.name} and destination ${destinationRegionId} is not in allowed regions [${policy.allowedDestinationRegions.join(', ')}]`,
            auditRecord: {
              sourceRegionId,
              destinationRegionId,
              evaluatedAt: now,
              tenantId
            }
          };
        }
      }

      // 2. Conditional Transfer with Redaction
      if (policy.boundaryType === 'CONDITIONAL_TRANSFER') {
        if (!policy.allowedDestinationRegions.includes(destinationRegionId)) {
          return {
            allowed: false,
            policyId: policy.policyId,
            boundaryType: policy.boundaryType,
            requiresRedaction: false,
            redactedFields: [],
            violationReason: `Destination region ${destinationRegionId} not approved for conditional transfer under policy ${policy.name}`,
            auditRecord: {
              sourceRegionId,
              destinationRegionId,
              evaluatedAt: now,
              tenantId
            }
          };
        }

        // Apply field redaction
        const sanitized = this.applyFieldRedaction(payload, policy.restrictedFields);
        return {
          allowed: true,
          policyId: policy.policyId,
          boundaryType: policy.boundaryType,
          requiresRedaction: policy.restrictedFields.length > 0,
          redactedFields: policy.restrictedFields,
          sanitizedPayload: sanitized,
          auditRecord: {
            sourceRegionId,
            destinationRegionId,
            evaluatedAt: now,
            tenantId
          }
        };
      }
    }

    // Passed all policies
    const primaryPolicy = applicable[0];
    return {
      allowed: true,
      policyId: primaryPolicy ? primaryPolicy.policyId : 'MULTI_POLICY_SATISFIED',
      boundaryType: primaryPolicy ? primaryPolicy.boundaryType : 'GLOBAL_REPLICATED',
      requiresRedaction: false,
      redactedFields: [],
      sanitizedPayload: payload,
      auditRecord: {
        sourceRegionId,
        destinationRegionId,
        evaluatedAt: now,
        tenantId
      }
    };
  }

  private applyFieldRedaction(payload: any, restrictedFields: string[]): any {
    if (!payload || typeof payload !== 'object') return payload;

    const copy = Array.isArray(payload) ? [...payload] : { ...payload };

    for (const key of Object.keys(copy)) {
      if (restrictedFields.includes(key)) {
        copy[key] = '[REDACTED_BY_SOVEREIGN_RESIDENCY_POLICY]';
      } else if (typeof copy[key] === 'object' && copy[key] !== null) {
        copy[key] = this.applyFieldRedaction(copy[key], restrictedFields);
      }
    }

    return copy;
  }

  public clear(): void {
    this.policies.clear();
  }
}

export const dataResidencyPolicyEngine = DataResidencyPolicyEngine.getInstance();
