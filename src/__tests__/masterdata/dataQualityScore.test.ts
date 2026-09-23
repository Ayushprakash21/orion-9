import { describe, it, expect } from 'vitest';
import { masterDataQualityScoringEngine } from '../../services/masterdata/DataQualityScoringEngine';
import { ValidationResult } from '../../types';
import { DuplicateCandidate } from '../../services/masterdata/DuplicateDetectionEngine';

describe('MasterDataQualityScoringEngine', () => {
  it('computes explainable 7-dimension score with standard weights summing to 1.0', () => {
    const perfectProduct = {
      id: 'SKU-PERFECT-01',
      name: 'High Precision Servo Actuator',
      category: 'ELECTRONICS',
      unitCost: 150,
      sellingPrice: 300,
      leadTime: 14,
      uom: 'EA',
      currency: 'USD',
      updatedAt: new Date().toISOString(),
      sourceSystem: 'SAP',
    };

    const score = masterDataQualityScoringEngine.computeScore({
      entityType: 'PRODUCT',
      entity: perfectProduct,
      validationResults: [],
      duplicates: [],
      referenceLookups: {
        hasValidUom: true,
        hasValidCurrency: true,
      },
    });

    expect(score.overallScore).toBeGreaterThanOrEqual(95);

    const dims = score.dimensions;
    expect(dims.completeness.score).toBeGreaterThanOrEqual(90);
    expect(dims.validity.score).toBe(100);
    expect(dims.consistency.score).toBe(100);
    expect(dims.uniqueness.score).toBe(100);
    expect(dims.referentialIntegrity.score).toBe(100);
    expect(dims.freshness.score).toBe(100);
    expect(dims.provenance.score).toBe(100);

    const weightSum =
      dims.completeness.weight +
      dims.validity.weight +
      dims.consistency.weight +
      dims.uniqueness.weight +
      dims.referentialIntegrity.weight +
      dims.freshness.weight +
      dims.provenance.weight;

    expect(weightSum).toBe(100);
  });

  it('penalizes validity score proportionally to blocking and error validation results', () => {
    const defectiveProduct = {
      id: 'SKU-DEFECT-01',
      // missing name, unitCost, uom
    };

    const validationResults: ValidationResult[] = [
      {
        status: 'INVALID',
        field: 'name',
        code: 'REQUIRED',
        message: 'Name is required',
        severity: 'BLOCKING',
        entityType: 'PRODUCT',
        entityId: 'SKU-DEFECT-01',
      },
      {
        status: 'INVALID',
        field: 'unitCost',
        code: 'REQUIRED',
        message: 'Unit cost is required',
        severity: 'ERROR',
        entityType: 'PRODUCT',
        entityId: 'SKU-DEFECT-01',
      },
    ];

    const score = masterDataQualityScoringEngine.computeScore({
      entityType: 'PRODUCT',
      entity: defectiveProduct,
      validationResults,
      duplicates: [],
    });

    expect(score.dimensions.validity.score).toBeLessThan(70);
    expect(score.dimensions.completeness.score).toBeLessThan(70);
    expect(score.overallScore).toBeLessThan(80);
  });

  it('penalizes uniqueness score when duplicates are detected', () => {
    const product = {
      id: 'SKU-DUP-01',
      name: 'Duplicate Component',
      unitCost: 50,
      sellingPrice: 100,
    };

    const duplicateCandidate: DuplicateCandidate = {
      candidateId: 'dup-1',
      sourceRecordId: 'SKU-DUP-01',
      targetRecordId: 'SKU-EXISTING-01',
      entityType: 'PRODUCT',
      tenantId: 'TENANT-01',
      matchType: 'EXACT_IDENTIFIER',
      matchTier: 'TIER_1_EXACT',
      similarityScore: 0.95,
      matchedField: 'name',
      reason: 'Exact match on name',
      status: 'PENDING_REVIEW',
      reviewRequired: true,
      autoMergeAllowed: false,
      detectedAt: new Date().toISOString(),
    };

    const score = masterDataQualityScoringEngine.computeScore({
      entityType: 'PRODUCT',
      entity: product,
      validationResults: [],
      duplicates: [duplicateCandidate],
    });

    expect(score.dimensions.uniqueness.score).toBeLessThan(50);
  });
});
