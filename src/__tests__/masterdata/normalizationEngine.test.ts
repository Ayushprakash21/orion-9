import { describe, it, expect } from 'vitest';
import { masterDataNormalizationEngine } from '../../services/masterdata/NormalizationEngine';

describe('MasterDataNormalizationEngine', () => {
  it('normalizes string casing, whitespace, and codes deterministically', () => {
    const raw = {
      id: '  sku-abc-123  ',
      name: '   High Precision    Valve   ',
      category: '  valves & pipes  ',
    };

    const res = masterDataNormalizationEngine.normalizeRecord(raw, 'PRODUCT');
    expect(res.normalized.id).toBe('SKU-ABC-123');
    expect(res.normalized.name).toBe('High Precision Valve');
  });

  it('normalizes ISO country codes from Alpha-3 and names to Alpha-2', () => {
    const rawSupplier = {
      id: 'SUP-002',
      name: 'Bavaria Motor Works',
      country: 'DEU',
    };
    const res = masterDataNormalizationEngine.normalizeRecord(rawSupplier, 'SUPPLIER');
    expect(res.normalized.country).toBe('DE');

    const rawSupplierUSA = {
      id: 'SUP-003',
      name: 'Pacific Steel',
      country: 'United States',
    };
    const resUSA = masterDataNormalizationEngine.normalizeRecord(rawSupplierUSA, 'SUPPLIER');
    expect(resUSA.normalized.country).toBe('US');
  });

  it('normalizes UOM synonyms to standard ISO/UN-CEFACT representations', () => {
    const synonyms = ['pieces', 'pcs', 'each', 'EA', 'pc'];
    synonyms.forEach(syn => {
      const record = { id: 'P-1', name: 'Item', uom: syn };
      const res = masterDataNormalizationEngine.normalizeRecord(record, 'PRODUCT');
      expect(res.normalized.uom).toBe('EA');
    });

    const kgSynonyms = ['kilogram', 'kilograms', 'kgs', 'kg'];
    kgSynonyms.forEach(syn => {
      const record = { id: 'P-2', name: 'Bulk Powder', uom: syn };
      const res = masterDataNormalizationEngine.normalizeRecord(record, 'PRODUCT');
      expect(res.normalized.uom).toBe('KG');
    });
  });

  it('normalizes currency codes to ISO 4217 3-letter codes', () => {
    const raw = {
      id: 'P-3',
      name: 'Imported Widget',
      currency: 'usd',
    };
    const res = masterDataNormalizationEngine.normalizeRecord(raw, 'PRODUCT');
    expect(res.normalized.currency).toBe('USD');
  });

  it('preserves field provenance and original value when normalized', () => {
    const raw = {
      id: 'sup-99',
      name: '  Alpha Corp  ',
      country: 'Germany',
    };
    const res = masterDataNormalizationEngine.normalizeRecord(raw, 'SUPPLIER');
    expect(res.provenance.length).toBeGreaterThan(0);
    const countryProv = res.provenance.find(p => p.fieldName === 'country');
    expect(countryProv).toBeDefined();
    expect(countryProv?.originalValue).toBe('Germany');
    expect(countryProv?.normalizedValue).toBe('DE');
  });
});
