import { describe, it, expect } from 'vitest';
import { masterDataDuplicateDetectionEngine } from '../../services/masterdata/DuplicateDetectionEngine';

describe('MasterDataDuplicateDetectionEngine', () => {
  it('detects Tier 1 exact matches on primary identifier', () => {
    const candidate = {
      id: 'SKU-TITAN-100',
      name: 'Titanium Rod 100mm',
    };
    const corpus = [
      { id: 'SKU-TITAN-100', name: 'Existing Titanium Rod' },
      { id: 'SKU-TITAN-200', name: 'Titanium Rod 200mm' },
    ];

    const duplicates = masterDataDuplicateDetectionEngine.findDuplicates('PRODUCT', candidate, corpus, { includeSelf: true });
    expect(duplicates.length).toBeGreaterThan(0);
    expect(duplicates[0].matchTier).toBe('TIER_1_EXACT');
    expect(duplicates[0].similarityScore).toBe(1.0);
  });

  it('detects Tier 1 exact matches on tax ID for suppliers', () => {
    const candidate = {
      id: 'SUP-NEW-99',
      name: 'Global Fasteners Inc',
      taxId: 'US-12-3456789',
    };
    const corpus = [
      { id: 'SUP-OLD-01', name: 'Global Fasteners Corp', taxId: 'US-12-3456789' },
    ];

    const duplicates = masterDataDuplicateDetectionEngine.findDuplicates('SUPPLIER', candidate, corpus);
    expect(duplicates.length).toBe(1);
    expect(duplicates[0].matchedField).toBe('taxId');
    expect(duplicates[0].matchTier).toBe('TIER_1_EXACT');
  });

  it('detects Tier 2 probabilistic fuzzy matches using Jaro-Winkler string similarity', () => {
    const candidate = {
      id: 'PROD-A1',
      name: 'High Precision Hydraulic Actuator Model 5',
    };
    const corpus = [
      { id: 'PROD-B2', name: 'High Precision Hydraulic Actuator Model 5B' },
      { id: 'PROD-C3', name: 'Standard Steel Bearing 15mm' },
    ];

    const duplicates = masterDataDuplicateDetectionEngine.findDuplicates('PRODUCT', candidate, corpus);
    expect(duplicates.length).toBe(1);
    expect(duplicates[0].matchTier).toBe('TIER_2_PROBABILISTIC');
    expect(duplicates[0].similarityScore).toBeGreaterThanOrEqual(0.85);
  });

  it('strictly enforces human review flag and forbids automated merges', () => {
    const candidate = {
      id: 'PROD-EXACT-DUP',
      name: 'Identical Component Name',
    };
    const corpus = [
      { id: 'PROD-EXACT-DUP', name: 'Identical Component Name' },
    ];

    const duplicates = masterDataDuplicateDetectionEngine.findDuplicates('PRODUCT', candidate, corpus, { includeSelf: true });
    expect(duplicates.length).toBe(1);
    expect(duplicates[0].reviewRequired).toBe(true);
    expect(duplicates[0].autoMergeAllowed).toBe(false);
  });
});
