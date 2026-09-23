import { describe, it, expect } from 'vitest';
import { masterDataValidationEngine } from '../../services/masterdata/ValidationEngine';
import { MasterDataEntityType } from '../../types';

describe('MasterDataValidationEngine', () => {
  it('validates a valid Product master record successfully', () => {
    const validProduct = {
      id: 'PROD-SKU-001',
      name: 'Titanium Fastener 10mm',
      category: 'FASTENERS',
      unitCost: 15.5,
      sellingPrice: 28.0,
      leadTime: 7,
      uom: 'EA',
      effectiveStartDate: '2026-01-01',
      effectiveEndDate: '2026-12-31',
    };

    const results = masterDataValidationEngine.validate('PRODUCT', validProduct);
    const blocking = results.filter(r => r.severity === 'BLOCKING');
    const errors = results.filter(r => r.severity === 'ERROR');

    expect(blocking.length).toBe(0);
    expect(errors.length).toBe(0);
  });

  it('fails with BLOCKING severity when mandatory fields are missing', () => {
    const invalidProduct = {
      // missing id, name, category, unitCost
      leadTime: 5,
    };

    const results = masterDataValidationEngine.validate('PRODUCT', invalidProduct);
    const blocking = results.filter(r => r.severity === 'BLOCKING');

    expect(blocking.length).toBeGreaterThan(0);
    expect(blocking.some(r => r.field === 'id')).toBe(true);
    expect(blocking.some(r => r.field === 'name')).toBe(true);
  });

  it('detects negative costs or invalid pricing consistency', () => {
    const negativeCostProduct = {
      id: 'PROD-NEG-01',
      name: 'Negative Cost Widget',
      category: 'WIDGETS',
      unitCost: -10,
      sellingPrice: 5,
    };

    const results = masterDataValidationEngine.validate('PRODUCT', negativeCostProduct);
    expect(results.some(r => r.field === 'unitCost' && r.severity === 'ERROR')).toBe(true);
  });

  it('detects inverted effective date ranges (endDate <= startDate)', () => {
    const invalidDatesProduct = {
      id: 'PROD-DATE-01',
      name: 'Date Inverted Part',
      category: 'ELECTRONICS',
      unitCost: 20,
      effectiveStartDate: '2026-06-01',
      effectiveEndDate: '2026-01-01',
    };

    const results = masterDataValidationEngine.validate('PRODUCT', invalidDatesProduct);
    expect(results.some(r => r.field === 'effectiveEndDate' && r.severity === 'ERROR')).toBe(true);
  });

  it('validates a Supplier master record', () => {
    const validSupplier = {
      id: 'SUP-001',
      name: 'Acme Precision Bearings',
      country: 'US',
      currency: 'USD',
      status: 'ACTIVE',
      taxId: 'US-987654321',
      email: 'procurement@acmebearings.com',
    };

    const results = masterDataValidationEngine.validate('SUPPLIER', validSupplier);
    const blocking = results.filter(r => r.severity === 'BLOCKING');
    expect(blocking.length).toBe(0);
  });

  it('detects illegal state transitions in lifecycle check', () => {
    const illegalTransition = masterDataValidationEngine.validateTransition('DRAFT', 'ACTIVE');
    expect(illegalTransition.valid).toBe(false);

    const validTransition = masterDataValidationEngine.validateTransition('DRAFT', 'VALIDATED');
    expect(validTransition.valid).toBe(true);

    const approvalTransition = masterDataValidationEngine.validateTransition('DUPLICATE_CHECKED', 'APPROVAL_PENDING');
    expect(approvalTransition.valid).toBe(true);

    const retiredFromActive = masterDataValidationEngine.validateTransition('ACTIVE', 'RETIRED');
    expect(retiredFromActive.valid).toBe(true);

    const retiredToActiveIllegal = masterDataValidationEngine.validateTransition('RETIRED', 'ACTIVE');
    expect(retiredToActiveIllegal.valid).toBe(false);
  });

  it('validates Warehouse, UOM, and Currency records', () => {
    const validUOM = {
      id: 'UOM-KG',
      code: 'KG',
      name: 'Kilogram',
      category: 'MASS',
      conversionFactor: 1.0,
    };
    const uomResults = masterDataValidationEngine.validate('UOM', validUOM);
    expect(uomResults.filter(r => r.severity === 'BLOCKING').length).toBe(0);

    const validCurrency = {
      id: 'CURR-USD',
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      decimalPlaces: 2,
    };
    const currResults = masterDataValidationEngine.validate('CURRENCY', validCurrency);
    expect(currResults.filter(r => r.severity === 'BLOCKING').length).toBe(0);
  });
});
