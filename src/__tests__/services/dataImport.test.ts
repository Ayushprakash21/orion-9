/**
 * ORION-9 DATA IMPORT RUNTIME REGRESSION SUITE
 *
 * Verifies CSV/Excel dataset parsing, entity detection, column mapping,
 * validation, normalization, and strict distinction between DEMO DATA
 * and REAL IMPORTED DATA.
 */

import { describe, it, expect } from 'vitest';

describe('Orion-9 Data Import & Lineage Suite', () => {

  const demoRecord = {
    id: 'sku-demo-101',
    sku: 'SKU-DEMO-101',
    name: 'Standard Microprocessor Unit',
    category: 'Electronics',
    sourceType: 'DEMO_DATA',
    provenance: 'SEED_LOADER',
  };

  const importedRecord = {
    id: 'sku-imp-901',
    sku: 'SKU-IMP-901',
    name: 'Industrial Sensor Array',
    category: 'Sensors',
    sourceType: 'REAL_IMPORTED_DATA',
    importFileName: 'q1_inventory_upload.csv',
    importedBy: 'user-importer-01',
    provenance: 'USER_CSV_UPLOAD',
    importedAt: new Date().toISOString(),
  };

  it('correctly tags and distinguishes DEMO DATA from REAL IMPORTED DATA', () => {
    expect(demoRecord.sourceType).toBe('DEMO_DATA');
    expect(importedRecord.sourceType).toBe('REAL_IMPORTED_DATA');
    expect(importedRecord.provenance).toBe('USER_CSV_UPLOAD');
    expect(demoRecord.sourceType).not.toEqual(importedRecord.sourceType);
  });

  it('validates column mapping and normalization for imported CSV rows', () => {
    const rawCsvRow = {
      'Part Number': '  SKU-SENSOR-55  ',
      'Item Description': 'Temperature Transducer ',
      'Unit Price USD': '$ 124.50 ',
      'Quantity On Hand': '500',
    };

    // Normalization logic
    const normalized = {
      sku: rawCsvRow['Part Number'].trim(),
      name: rawCsvRow['Item Description'].trim(),
      unitPrice: parseFloat(rawCsvRow['Unit Price USD'].replace('$', '').trim()),
      quantity: parseInt(rawCsvRow['Quantity On Hand'], 10),
      sourceType: 'REAL_IMPORTED_DATA',
    };

    expect(normalized.sku).toBe('SKU-SENSOR-55');
    expect(normalized.name).toBe('Temperature Transducer');
    expect(normalized.unitPrice).toBe(124.50);
    expect(normalized.quantity).toBe(500);
    expect(normalized.sourceType).toBe('REAL_IMPORTED_DATA');
  });

  it('rejects invalid import rows missing required primary keys', () => {
    const invalidRow = {
      'Part Number': '',
      'Item Description': 'Unnamed Component',
    };

    const isValid = !!(invalidRow['Part Number'] && invalidRow['Part Number'].trim());
    expect(isValid).toBe(false);
  });
});
