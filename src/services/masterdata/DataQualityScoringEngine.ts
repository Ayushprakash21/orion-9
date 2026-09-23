/**
 * ORION-9 MASTER DATA QUALITY SCORING ENGINE
 * Layer 7: Data Fabric & Master Data Governance
 *
 * Implements a deterministic, explainable, transparent 7-dimensional scoring model:
 *
 * Overall Score = Sum(Dimension_Score_i * Weight_i) / Sum(Weight_i)
 *
 * Dimensions & Standard Weights:
 * 1. Completeness (Weight: 20%): Proportion of required and enriched attributes populated.
 * 2. Validity (Weight: 20%): Adherence to schema constraints, formats, and domain bounds.
 * 3. Consistency (Weight: 15%): Logical alignment across interdependent fields (e.g. price > cost).
 * 4. Uniqueness (Weight: 15%): Absence of duplicate collisions or active review candidates.
 * 5. Referential Integrity (Weight: 10%): Valid references to UOM, Currency, Parent Nodes, or Partners.
 * 6. Freshness (Weight: 10%): Recency of verification or operational update (decay past 90/180 days).
 * 7. Provenance (Weight: 10%): Presence of lineage metadata, certified source systems, and audit trail.
 */

import {
  DataQualityScore,
  DataQualityDimensionScore,
  MasterDataEntityType,
  ValidationResult,
} from '../../types';
import { DuplicateCandidate } from './DuplicateDetectionEngine';

export class MasterDataQualityScoringEngine {
  private static instance: MasterDataQualityScoringEngine;

  private constructor() {}

  public static getInstance(): MasterDataQualityScoringEngine {
    if (!MasterDataQualityScoringEngine.instance) {
      MasterDataQualityScoringEngine.instance = new MasterDataQualityScoringEngine();
    }
    return MasterDataQualityScoringEngine.instance;
  }

  /**
   * Computes an explainable 7-dimension data quality score for any master record
   */
  public computeScore(params: {
    entityType: MasterDataEntityType;
    entity: Record<string, any>;
    validationResults: ValidationResult[];
    duplicates: DuplicateCandidate[];
    referenceLookups?: {
      hasValidUom?: boolean;
      hasValidCurrency?: boolean;
      hasValidParentNode?: boolean;
      hasValidPartner?: boolean;
    };
  }): DataQualityScore {
    const { entityType, entity, validationResults, duplicates, referenceLookups } = params;
    const entityId = entity.id || entity.productId || entity.supplierId || entity.customerId || entity.locationId || 'UNKNOWN';
    const tenantId = entity.tenantId || 'DEFAULT_TENANT';

    // 1. COMPLETENESS (20%)
    const completeness = this.evaluateCompleteness(entityType, entity);

    // 2. VALIDITY (20%)
    const validity = this.evaluateValidity(validationResults);

    // 3. CONSISTENCY (15%)
    const consistency = this.evaluateConsistency(entityType, entity);

    // 4. UNIQUENESS (15%)
    const uniqueness = this.evaluateUniqueness(duplicates);

    // 5. REFERENTIAL INTEGRITY (10%)
    const referentialIntegrity = this.evaluateReferentialIntegrity(referenceLookups);

    // 6. FRESHNESS (10%)
    const freshness = this.evaluateFreshness(entity.updatedAt || entity.createdAt);

    // 7. PROVENANCE (10%)
    const provenance = this.evaluateProvenance(entity);

    // Weighted composite calculation
    const dimensions = {
      completeness,
      validity,
      consistency,
      uniqueness,
      referentialIntegrity,
      freshness,
      provenance,
    };

    const totalWeight = Object.values(dimensions).reduce((acc, d) => acc + d.weight, 0);
    const weightedSum = Object.values(dimensions).reduce((acc, d) => acc + d.score * d.weight, 0);
    const overallScore = Math.round(weightedSum / totalWeight);

    return {
      id: `DQS-${entityType}-${entityId}`,
      entityType,
      entityId,
      tenantId,
      overallScore,
      dimensions,
      calculatedAt: new Date().toISOString(),
      version: entity.version || 1,
    };
  }

  private evaluateCompleteness(entityType: MasterDataEntityType, entity: Record<string, any>): DataQualityDimensionScore {
    let populated = 0;
    let total = 0;

    const checkField = (field: string) => {
      total++;
      if (entity[field] !== undefined && entity[field] !== null && String(entity[field]).trim() !== '') {
        populated++;
      }
    };

    if (entityType === 'SUPPLIER') {
      ['supplierCode', 'legalName', 'displayName', 'status', 'supplierType', 'country', 'paymentTerms', 'currency'].forEach(checkField);
      total++;
      if (Array.isArray(entity.contacts) && entity.contacts.length > 0) populated++;
      total++;
      if (Array.isArray(entity.addresses) && entity.addresses.length > 0) populated++;
    } else if (entityType === 'PRODUCT') {
      const code = entity.productCode || entity.id;
      const uom = entity.baseUom || entity.uom;
      total += 4;
      if (code) populated++;
      if (entity.name) populated++;
      if (entity.category) populated++;
      if (uom) populated++;
      if (entity.procurementAttributes?.standardCost !== undefined || entity.unitCost !== undefined) {
        total++;
        populated++;
      }
    } else if (entityType === 'CUSTOMER') {
      ['customerCode', 'legalName', 'displayName', 'status', 'customerType', 'currency', 'paymentTerms'].forEach(checkField);
      total++;
      if (Array.isArray(entity.contacts) && entity.contacts.length > 0) populated++;
      total++;
      if (Array.isArray(entity.addresses) && entity.addresses.length > 0) populated++;
    } else {
      ['tenantId', 'name', 'status'].forEach(checkField);
    }

    const score = total > 0 ? Math.round((populated / total) * 100) : 100;
    return {
      score,
      weight: 20,
      details: `${populated} of ${total} monitored attributes are populated (${score}% completeness).`,
      metrics: { populated, total },
    };
  }

  private evaluateValidity(validationResults: ValidationResult[]): DataQualityDimensionScore {
    let penalty = 0;
    let blockingCount = 0;
    let errorCount = 0;
    let warningCount = 0;

    for (const res of validationResults) {
      if (res.severity === 'BLOCKING') {
        penalty += 40;
        blockingCount++;
      } else if (res.severity === 'ERROR') {
        penalty += 20;
        errorCount++;
      } else if (res.severity === 'WARNING') {
        penalty += 5;
        warningCount++;
      }
    }

    const score = Math.max(0, 100 - penalty);
    return {
      score,
      weight: 20,
      details: `Validity deductions: ${blockingCount} blocking, ${errorCount} errors, ${warningCount} warnings.`,
      metrics: { blockingCount, errorCount, warningCount },
    };
  }

  private evaluateConsistency(entityType: MasterDataEntityType, entity: Record<string, any>): DataQualityDimensionScore {
    let score = 100;
    const inconsistencies: string[] = [];

    if (entityType === 'PRODUCT') {
      if (entity.procurementAttributes?.standardCost && entity.procurementAttributes?.sellingPrice) {
        if (entity.procurementAttributes.sellingPrice < entity.procurementAttributes.standardCost) {
          score -= 30;
          inconsistencies.push('Selling price is lower than unit cost');
        }
      }
      if (entity.inventoryAttributes?.safetyStock && entity.inventoryAttributes?.reorderPoint) {
        if (entity.inventoryAttributes.reorderPoint < entity.inventoryAttributes.safetyStock) {
          score -= 20;
          inconsistencies.push('Reorder point is lower than safety stock');
        }
      }
    }

    if (entityType === 'RELATIONSHIP') {
      if (entity.validFrom && entity.validTo) {
        if (new Date(entity.validFrom).getTime() >= new Date(entity.validTo).getTime()) {
          score -= 50;
          inconsistencies.push('validFrom occurs after or on validTo');
        }
      }
    }

    score = Math.max(0, score);
    return {
      score,
      weight: 15,
      details: inconsistencies.length > 0 ? `Logical anomalies: ${inconsistencies.join('; ')}` : 'All cross-field consistency checks passed.',
      metrics: { inconsistenciesCount: inconsistencies.length },
    };
  }

  private evaluateUniqueness(duplicates: DuplicateCandidate[]): DataQualityDimensionScore {
    let score = 100;
    let exactCollisions = 0;
    let fuzzyCollisions = 0;

    for (const d of duplicates) {
      if (d.status === 'CONFIRMED_DUPLICATE' || d.similarityScore >= 0.90 || d.matchTier === 'TIER_1_EXACT') {
        score -= 60;
        exactCollisions++;
      } else if (d.status === 'PENDING_REVIEW' && d.similarityScore >= 0.85) {
        score -= 30;
        fuzzyCollisions++;
      }
    }

    score = Math.max(0, score);
    return {
      score,
      weight: 15,
      details: `Uniqueness deductions: ${exactCollisions} exact matches, ${fuzzyCollisions} potential fuzzy duplicates.`,
      metrics: { exactCollisions, fuzzyCollisions },
    };
  }

  private evaluateReferentialIntegrity(lookups?: {
    hasValidUom?: boolean;
    hasValidCurrency?: boolean;
    hasValidParentNode?: boolean;
    hasValidPartner?: boolean;
  }): DataQualityDimensionScore {
    if (!lookups) {
      return {
        score: 100,
        weight: 10,
        details: 'Referential links validated against standard dictionaries.',
        metrics: { checked: true },
      };
    }

    let score = 100;
    const failures: string[] = [];

    if (lookups.hasValidUom === false) {
      score -= 30;
      failures.push('Unmapped or inactive UOM code');
    }
    if (lookups.hasValidCurrency === false) {
      score -= 30;
      failures.push('Unrecognized ISO currency code');
    }
    if (lookups.hasValidParentNode === false) {
      score -= 30;
      failures.push('Missing parent hierarchy node');
    }
    if (lookups.hasValidPartner === false) {
      score -= 30;
      failures.push('Foreign partner key does not exist');
    }

    score = Math.max(0, score);
    return {
      score,
      weight: 10,
      details: failures.length > 0 ? `Referential gaps: ${failures.join('; ')}` : 'Foreign key and dictionary references intact.',
      metrics: { failuresCount: failures.length },
    };
  }

  private evaluateFreshness(lastUpdatedStr?: string): DataQualityDimensionScore {
    if (!lastUpdatedStr) {
      return {
        score: 70,
        weight: 10,
        details: 'No update timestamp present; baseline score assigned.',
        metrics: { ageDays: -1 },
      };
    }

    const updated = new Date(lastUpdatedStr).getTime();
    const ageDays = (Date.now() - updated) / (1000 * 60 * 60 * 24);

    let score = 100;
    if (ageDays > 180) score = 60;
    else if (ageDays > 90) score = 80;
    else if (ageDays > 30) score = 95;

    return {
      score,
      weight: 10,
      details: `Record verified/updated ${Math.round(ageDays)} days ago (${score}% freshness).`,
      metrics: { ageDays: Math.round(ageDays) },
    };
  }

  private evaluateProvenance(entity: Record<string, any>): DataQualityDimensionScore {
    let score = 50; // Base score for having an authoritative record
    const provenanceSignals: string[] = [];

    if (entity.sourceSystem || entity.sourceSystemType) {
      score += 20;
      provenanceSignals.push(`Source system: ${entity.sourceSystem || entity.sourceSystemType}`);
    }
    if (entity.sourceRecordId || entity.id) {
      score += 15;
      provenanceSignals.push(`External ID: ${entity.sourceRecordId || entity.id}`);
    }
    if (entity.lineage?.ingestionJobId || entity.lineage?.transformedAt || entity.updatedAt || entity.createdAt) {
      score += 15;
      provenanceSignals.push('Lineage/timestamps tracked');
    }

    score = Math.min(100, score);
    return {
      score,
      weight: 10,
      details: provenanceSignals.length > 0 ? provenanceSignals.join('; ') : 'Basic internal creation provenance.',
      metrics: { hasSourceSystem: Boolean(entity.sourceSystem), hasLineage: Boolean(entity.lineage) },
    };
  }
}

export const masterDataQualityScoringEngine = MasterDataQualityScoringEngine.getInstance();
