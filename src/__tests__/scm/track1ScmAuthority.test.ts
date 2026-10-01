/**
 * ORION-9 TRACK 1 — SCM AUTHORITY & DATA FOUNDATION TEST SUITE
 *
 * Verifies:
 * 1. Canonical SCM Entity Registry coverage across all 31 core entities
 * 2. Referential integrity and active state enforcement
 * 3. Strict multi-tenant isolation and cache key segregation
 * 4. DEMO vs. LIVE environment boundaries
 * 5. Deterministic inventory transactions, non-negative stock guards, and idempotency
 * 6. Master data lifecycle progression and validation rules
 * 7. Executable data quality scoring and duplicate detection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { scmCanonicalRegistry, SCM_CANONICAL_ENTITIES } from '../../scm/canonical/ScmCanonicalRegistry';
import { scmReferentialIntegrityEngine } from '../../scm/canonical/ScmReferentialIntegrityEngine';
import { scmPersistenceService } from '../../services/scm/ScmPersistenceService';
import { DatabaseConnectionManager } from '../../core/database/DatabaseConnectionManager';
import { masterDataValidationEngine } from '../../services/masterdata/ValidationEngine';
import { masterDataQualityScoringEngine } from '../../services/masterdata/DataQualityScoringEngine';
import { masterDataDuplicateDetectionEngine } from '../../services/masterdata/DuplicateDetectionEngine';

describe('Track 1 — SCM Authority & Data Foundation', () => {
  const TENANT_A = 'TENANT_ALPHA_001';
  const TENANT_B = 'TENANT_BETA_002';

  beforeEach(() => {
    scmPersistenceService.clear();
    DatabaseConnectionManager.getInstance().clearEnvironmentCache();
  });

  describe('1. Canonical SCM Entity Registry & Metadata', () => {
    it('registers all 31 core SCM entities with canonical contracts', () => {
      const entities = scmCanonicalRegistry.listEntities();
      expect(entities.length).toBe(31);

      const requiredEntityNames = [
        'Tenant', 'Organization', 'User', 'Supplier', 'Customer', 'Product', 'Material',
        'Warehouse', 'Plant', 'Location', 'Inventory', 'PurchaseRequisition', 'RFQ',
        'SupplierQuote', 'PurchaseOrder', 'PurchaseOrderLine', 'SupplierConfirmation',
        'BOM', 'Routing', 'WorkCenter', 'ProductionOrder', 'ASN', 'Shipment', 'ShipmentLine',
        'Receiving', 'GRN', 'InventoryTransaction', 'CustomerOrder', 'CustomerOrderLine',
        'Fulfillment', 'Invoice',
      ];

      for (const name of requiredEntityNames) {
        const entity = scmCanonicalRegistry.getEntity(name);
        expect(entity, `Entity [${name}] must be defined in Canonical Registry`).toBeDefined();
        expect(entity!.primaryKey).toBeDefined();
        expect(entity!.collectionPath).toBeDefined();
        expect(entity!.lifecycleStates.length).toBeGreaterThan(0);
      }
    });

    it('enforces valid and invalid canonical lifecycle transitions', () => {
      // Valid transitions
      expect(scmCanonicalRegistry.isValidLifecycleTransition('Supplier', 'Draft', 'Pending Review')).toBe(true);
      expect(scmCanonicalRegistry.isValidLifecycleTransition('Supplier', 'Pending Review', 'Approved')).toBe(true);
      expect(scmCanonicalRegistry.isValidLifecycleTransition('Supplier', 'Approved', 'Active')).toBe(true);
      expect(scmCanonicalRegistry.isValidLifecycleTransition('Supplier', 'Active', 'Inactive')).toBe(true);
      expect(scmCanonicalRegistry.isValidLifecycleTransition('Supplier', 'Inactive', 'Archived')).toBe(true);

      // Invalid transitions
      expect(scmCanonicalRegistry.isValidLifecycleTransition('Supplier', 'Archived', 'Active')).toBe(false);
      expect(scmCanonicalRegistry.isValidLifecycleTransition('Supplier', 'Draft', 'Active')).toBe(false);
    });
  });

  describe('2. Strict Multi-Tenant Isolation & Persistence Layer', () => {
    it('segregates records by tenantId in persistence and memory cache', async () => {
      const supplierTenantA = {
        supplierId: 'SUP-A1',
        tenantId: TENANT_A,
        legalName: 'Alpha Logistics Inc',
        supplierCode: 'SUP-A1',
        status: 'Active',
      };

      const supplierTenantB = {
        supplierId: 'SUP-B1',
        tenantId: TENANT_B,
        legalName: 'Beta Fasteners Ltd',
        supplierCode: 'SUP-B1',
        status: 'Active',
      };

      await scmPersistenceService.saveRecord('suppliers', 'SUP-A1', supplierTenantA);
      await scmPersistenceService.saveRecord('suppliers', 'SUP-B1', supplierTenantB);

      // Cross-tenant read must return null / not be exposed to wrong tenant
      const readTenantA = await scmPersistenceService.getRecord<any>('suppliers', TENANT_A, 'SUP-A1');
      expect(readTenantA).toBeDefined();
      expect(readTenantA?.legalName).toBe('Alpha Logistics Inc');

      const crossTenantRead = await scmPersistenceService.getRecord<any>('suppliers', TENANT_B, 'SUP-A1');
      expect(crossTenantRead).toBeNull();

      // List records must strictly return only tenant-specific records
      const listTenantA = await scmPersistenceService.listRecords<any>('suppliers', TENANT_A);
      expect(listTenantA.length).toBe(1);
      expect(listTenantA[0].supplierId).toBe('SUP-A1');

      const listTenantB = await scmPersistenceService.listRecords<any>('suppliers', TENANT_B);
      expect(listTenantB.length).toBe(1);
      expect(listTenantB[0].supplierId).toBe('SUP-B1');
    });

    it('rejects saving records without tenantId', async () => {
      await expect(
        scmPersistenceService.saveRecord('products', 'PRD-ERR', {
          productId: 'PRD-ERR',
          name: 'Invalid Item',
        } as any)
      ).rejects.toThrow(/tenantId is required/);
    });
  });

  describe('3. DEMO vs. LIVE Environment Isolation', () => {
    it('generates namespaced cache keys separating DEMO and LIVE data', () => {
      const dbMgr = DatabaseConnectionManager.getInstance();
      dbMgr.setEnvironment('LIVE');
      const keyLive = dbMgr.getCacheKey(TENANT_A, 'products', 'PRD-01');
      expect(keyLive).toContain('live');
      expect(keyLive).toContain(TENANT_A);
      expect(keyLive).toContain('PRD-01');
      dbMgr.setEnvironment('DEMO');
    });

    it('blocks cross-environment outbox payload replay', () => {
      const dbMgr = DatabaseConnectionManager.getInstance();
      dbMgr.setEnvironment('LIVE');
      // Active environment is LIVE
      const validLivePayload = { environment: 'LIVE', tenantId: TENANT_A };
      const invalidDemoPayload = { environment: 'DEMO', tenantId: TENANT_A };

      expect(dbMgr.validateOutboxPayload(validLivePayload)).toBe(true);
      expect(dbMgr.validateOutboxPayload(invalidDemoPayload)).toBe(false);
      dbMgr.setEnvironment('DEMO');
    });
  });

  describe('4. Referential Integrity & Relationship Engine', () => {
    it('detects missing foreign keys and unpersisted referenced entities', async () => {
      // PO referencing a non-existent supplier
      const orphanPo = {
        poId: 'PO-ORPHAN-001',
        tenantId: TENANT_A,
        supplierId: 'SUP-NON-EXISTENT',
        totalAmount: 15000,
        status: 'Draft',
      };

      const result = await scmReferentialIntegrityEngine.validateIntegrity({
        entityName: 'PurchaseOrder',
        record: orphanPo,
        tenantId: TENANT_A,
      });

      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].violationType).toBe('TARGET_NOT_FOUND');
    });

    it('detects inactive referenced entities for active-only constraints', async () => {
      // Save an INACTIVE supplier
      await scmPersistenceService.saveRecord('suppliers', 'SUP-INACTIVE-01', {
        supplierId: 'SUP-INACTIVE-01',
        tenantId: TENANT_A,
        legalName: 'Inactive Vendor LLC',
        supplierCode: 'SUP-INACTIVE-01',
        status: 'Inactive',
      });

      const po = {
        poId: 'PO-TEST-002',
        tenantId: TENANT_A,
        supplierId: 'SUP-INACTIVE-01',
        totalAmount: 5000,
        status: 'Draft',
      };

      const result = await scmReferentialIntegrityEngine.validateIntegrity({
        entityName: 'PurchaseOrder',
        record: po,
        tenantId: TENANT_A,
      });

      expect(result.isValid).toBe(false);
      expect(result.violations.some((v) => v.violationType === 'TARGET_INACTIVE')).toBe(true);
    });

    it('passes when all referenced entities exist and are active in the same tenant', async () => {
      // Save active supplier
      await scmPersistenceService.saveRecord('suppliers', 'SUP-VALID-01', {
        supplierId: 'SUP-VALID-01',
        tenantId: TENANT_A,
        legalName: 'Prime Global Logistics',
        supplierCode: 'SUP-VALID-01',
        status: 'Active',
      });

      const po = {
        poId: 'PO-VALID-001',
        tenantId: TENANT_A,
        supplierId: 'SUP-VALID-01',
        totalAmount: 25000,
        status: 'Draft',
      };

      const result = await scmReferentialIntegrityEngine.validateIntegrity({
        entityName: 'PurchaseOrder',
        record: po,
        tenantId: TENANT_A,
      });

      expect(result.isValid).toBe(true);
      expect(result.violations.length).toBe(0);
    });
  });

  describe('5. Deterministic Inventory Transactions & Idempotency', () => {
    it('adjusts stock, updates balance, and records immutable inventory transaction', async () => {
      const initialAdjustment = await scmPersistenceService.adjustInventory({
        tenantId: TENANT_A,
        productId: 'PRD-CHIP-99',
        warehouseId: 'WH-MAIN-01',
        quantityDelta: 200,
        transactionType: 'GRN_RECEIPT',
        referenceEntityType: 'GRN',
        referenceEntityId: 'GRN-9901',
        actor: 'dock_manager',
        correlationId: 'CORR-TX-001',
      });

      expect(initialAdjustment.balanceBefore).toBe(0);
      expect(initialAdjustment.balanceAfter).toBe(200);
      expect(initialAdjustment.transactionId).toBeDefined();

      // Check persisted inventory record
      const invRecord = await scmPersistenceService.getRecord<any>('inventory', TENANT_A, 'INV-WH-MAIN-01-PRD-CHIP-99');
      expect(invRecord?.onHand).toBe(200);

      // Perform deduction
      const issueAdjustment = await scmPersistenceService.adjustInventory({
        tenantId: TENANT_A,
        productId: 'PRD-CHIP-99',
        warehouseId: 'WH-MAIN-01',
        quantityDelta: -50,
        transactionType: 'ORDER_FULFILLMENT',
        referenceEntityType: 'CUSTOMER_ORDER',
        referenceEntityId: 'ORD-101',
        actor: 'fulfillment_agent',
        correlationId: 'CORR-TX-002',
      });

      expect(issueAdjustment.balanceBefore).toBe(200);
      expect(issueAdjustment.balanceAfter).toBe(150);
    });

    it('strictly prevents inventory overdraw below zero', async () => {
      await expect(
        scmPersistenceService.adjustInventory({
          tenantId: TENANT_A,
          productId: 'PRD-OVERDRAW',
          warehouseId: 'WH-MAIN-01',
          quantityDelta: -10,
          transactionType: 'ORDER_FULFILLMENT',
          referenceEntityType: 'CUSTOMER_ORDER',
          referenceEntityId: 'ORD-ERR',
          actor: 'agent',
          correlationId: 'CORR-OVERDRAW-1',
        })
      ).rejects.toThrow(/Inventory overdraw rejected/);
    });

    it('enforces idempotency on duplicate correlationId submission', async () => {
      const firstRun = await scmPersistenceService.adjustInventory({
        tenantId: TENANT_A,
        productId: 'PRD-IDEM-01',
        warehouseId: 'WH-IDEM-01',
        quantityDelta: 100,
        transactionType: 'GRN_RECEIPT',
        referenceEntityType: 'GRN',
        referenceEntityId: 'GRN-IDEM-1',
        actor: 'dock_receiver',
        correlationId: 'IDEMPOTENT-CORRELATION-KEY-77',
      });

      expect(firstRun.balanceAfter).toBe(100);
      expect(firstRun.isDuplicate).toBeUndefined();

      // Re-submit with same correlationId
      const secondRun = await scmPersistenceService.adjustInventory({
        tenantId: TENANT_A,
        productId: 'PRD-IDEM-01',
        warehouseId: 'WH-IDEM-01',
        quantityDelta: 100,
        transactionType: 'GRN_RECEIPT',
        referenceEntityType: 'GRN',
        referenceEntityId: 'GRN-IDEM-1',
        actor: 'dock_receiver',
        correlationId: 'IDEMPOTENT-CORRELATION-KEY-77',
      });

      expect(secondRun.isDuplicate).toBe(true);
      expect(secondRun.balanceAfter).toBe(100);
      expect(secondRun.transactionId).toBe(firstRun.transactionId);

      // Verify on-hand stock remained 100, not 200
      const invRecord = await scmPersistenceService.getRecord<any>('inventory', TENANT_A, 'INV-WH-IDEM-01-PRD-IDEM-01');
      expect(invRecord?.onHand).toBe(100);
    });
  });

  describe('6. Data Quality Scoring & Duplicate Detection Engine', () => {
    it('computes 7-dimensional data quality score with explainable metrics', () => {
      const supplierRecord = {
        id: 'SUP-DQS-01',
        tenantId: TENANT_A,
        supplierCode: 'SUP-DQS-01',
        legalName: 'Apex Semiconductor Corp',
        displayName: 'Apex Semi',
        status: 'Active',
        supplierType: 'DIRECT_MATERIAL',
        country: 'US',
        paymentTerms: 'NET30',
        currency: 'USD',
        contacts: [{ name: 'Jane Doe', email: 'jane@apexsemi.com', role: 'Account Exec' }],
        addresses: [{ type: 'HQ', street: '100 Silicon Way', city: 'San Jose', country: 'US', postalCode: '95134' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const validationResults = masterDataValidationEngine.validate('SUPPLIER', supplierRecord);
      const duplicates = masterDataDuplicateDetectionEngine.findDuplicates('SUPPLIER', supplierRecord, []);

      const score = masterDataQualityScoringEngine.computeScore({
        entityType: 'SUPPLIER',
        entity: supplierRecord,
        validationResults,
        duplicates,
        referenceLookups: {
          hasValidCurrency: true,
          hasValidPartner: true,
        },
      } as any);

      expect(score.overallScore).toBeGreaterThanOrEqual(80);
      expect(score.dimensions.completeness.score).toBeGreaterThanOrEqual(80);
      expect(score.dimensions.validity.score).toBe(100);
    });

    it('flags potential duplicate supplier entities by fuzzy match and tax identifier', () => {
      const existingSuppliers = [
        {
          id: 'SUP-EXISTING-1',
          tenantId: TENANT_A,
          supplierCode: 'SUP-EX-1',
          legalName: 'Apex Global Logistics Corp',
          taxIdentifier: 'TAX-998877',
        },
      ];

      const newSupplier = {
        id: 'SUP-NEW-2',
        tenantId: TENANT_A,
        supplierCode: 'SUP-NEW-2',
        legalName: 'Apex Global Logistics Corporation',
        taxIdentifier: 'TAX-998877',
      };

      const duplicates = masterDataDuplicateDetectionEngine.findDuplicates('SUPPLIER', newSupplier, existingSuppliers as any);
      expect(duplicates.length).toBeGreaterThan(0);
      expect(duplicates[0].matchType).toBe('EXACT_TAX_ID');
    });
  });
});
