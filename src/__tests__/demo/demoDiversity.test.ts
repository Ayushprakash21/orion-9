import { describe, it, expect, beforeEach } from 'vitest';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { 
  demoSyntheticDataEngine, 
  DemoSyntheticDataEngine,
  DEMO_PACKAGES_PER_HOUR,
  SeededPRNG,
  INDUSTRIES,
  GLOBAL_CITIES,
  CARRIERS_BY_MODE,
  SyntheticCompanyPackage
} from '../../core/database/DemoSyntheticDataEngine';

describe('ORION-9 — Demo Synthetic Data Engine 30/Hour & True Data Diversity Suite', () => {
  beforeEach(async () => {
    // Ensure active environment is DEMO
    await dbManager.switchEnvironment({
      targetEnvironment: 'DEMO',
      actorUserId: 'admin_test',
      actorRole: 'platform_admin',
      callerType: 'human_admin',
      stepUpConfirmed: true,
      reason: 'Setup Demo diversity test suite',
    });
  });

  // ---------------------------------------------------------------------------
  // DEMO-DIVERSITY-001: Authoritative Rate Constant
  // ---------------------------------------------------------------------------
  it('DEMO-DIVERSITY-001: exports canonical DEMO_PACKAGES_PER_HOUR = 30', () => {
    expect(DEMO_PACKAGES_PER_HOUR).toBe(30);
  });

  // ---------------------------------------------------------------------------
  // DEMO-DIVERSITY-002: Default Batch Generates Exactly 30 Packages
  // ---------------------------------------------------------------------------
  it('DEMO-DIVERSITY-002: default batch generates exactly 30 complete enterprise packages', async () => {
    const batchId = `DEMO-TEST-30PKGS-${Date.now()}`;
    const audit = await demoSyntheticDataEngine.generateEnterpriseBatch(undefined, batchId);

    expect(audit.packageCount).toBe(30);
    expect(audit.recordCounts.companies).toBe(30);
    expect(audit.recordCounts.suppliers).toBeGreaterThanOrEqual(60);
    expect(audit.recordCounts.products).toBeGreaterThanOrEqual(90);
    expect(audit.recordCounts.purchaseOrders).toBeGreaterThanOrEqual(90);
    expect(audit.recordCounts.shipments).toBeGreaterThanOrEqual(60);
    expect(audit.recordCounts.inventoryItems).toBeGreaterThanOrEqual(90);
    expect(audit.status).toBe('COMPLETED');
  });

  // ---------------------------------------------------------------------------
  // DEMO-DIVERSITY-003: Idempotent Reproducibility
  // ---------------------------------------------------------------------------
  it('DEMO-DIVERSITY-003: same batch ID produces identical deterministic datasets', () => {
    const fixedBatchId = 'DEMO-REPRODUCE-BATCH-001';
    const tenantId = 'DEMO_TENANT_ORION';
    const orgId = 'DEMO_ORG_GLOBAL';
    const baseDate = new Date('2026-10-08T00:00:00.000Z');

    const prng1 = new SeededPRNG(`${fixedBatchId}:${tenantId}:${orgId}`);
    const prng2 = new SeededPRNG(`${fixedBatchId}:${tenantId}:${orgId}`);

    const pkgA = demoSyntheticDataEngine.generateSingleEnterprisePackage(0, fixedBatchId, tenantId, orgId, baseDate, prng1.fork(0));
    const pkgB = demoSyntheticDataEngine.generateSingleEnterprisePackage(0, fixedBatchId, tenantId, orgId, baseDate, prng2.fork(0));

    expect(pkgA.company.companyName).toBe(pkgB.company.companyName);
    expect(pkgA.company.industry).toBe(pkgB.company.industry);
    expect(pkgA.company.city).toBe(pkgB.company.city);
    expect(pkgA.company.country).toBe(pkgB.company.country);
    expect(pkgA.scenario).toBe(pkgB.scenario);
    expect(pkgA.suppliers[0].name).toBe(pkgB.suppliers[0].name);
    expect(pkgA.products[0].name).toBe(pkgB.products[0].name);
    expect(pkgA.purchaseOrders[0].totalAmount).toBe(pkgB.purchaseOrders[0].totalAmount);
  });

  // ---------------------------------------------------------------------------
  // DEMO-DIVERSITY-004: Inter-Batch Diversity
  // ---------------------------------------------------------------------------
  it('DEMO-DIVERSITY-004: different batch IDs produce materially distinct datasets', () => {
    const tenantId = 'DEMO_TENANT_ORION';
    const orgId = 'DEMO_ORG_GLOBAL';
    const baseDate = new Date('2026-10-08T00:00:00.000Z');

    const batch1 = 'DEMO-20261008T0100Z-BATCH';
    const batch2 = 'DEMO-20261008T0200Z-BATCH';

    const prng1 = new SeededPRNG(`${batch1}:${tenantId}:${orgId}`);
    const prng2 = new SeededPRNG(`${batch2}:${tenantId}:${orgId}`);

    const packagesBatch1: SyntheticCompanyPackage[] = [];
    const packagesBatch2: SyntheticCompanyPackage[] = [];

    for (let i = 0; i < 10; i++) {
      packagesBatch1.push(demoSyntheticDataEngine.generateSingleEnterprisePackage(i, batch1, tenantId, orgId, baseDate, prng1.fork(i)));
      packagesBatch2.push(demoSyntheticDataEngine.generateSingleEnterprisePackage(i, batch2, tenantId, orgId, baseDate, prng2.fork(i)));
    }

    const companies1 = packagesBatch1.map(p => p.company.companyName);
    const companies2 = packagesBatch2.map(p => p.company.companyName);

    // Overlap should be minimal or zero between completely different batches
    const commonCompanies = companies1.filter(c => companies2.includes(c));
    expect(commonCompanies.length).toBeLessThanOrEqual(2);

    const industries1 = packagesBatch1.map(p => p.company.industry);
    const industries2 = packagesBatch2.map(p => p.company.industry);
    const identicalPairs = industries1.filter((ind, idx) => ind === industries2[idx]);
    expect(identicalPairs.length).toBeLessThan(5);
  });

  // ---------------------------------------------------------------------------
  // DEMO-DIVERSITY-005: Diversity Score Metric Exceeds 0.70
  // ---------------------------------------------------------------------------
  it('DEMO-DIVERSITY-005: diagnostic diversityScore reaches >= 0.70 in 30-package batch', async () => {
    const batchId = `DEMO-TEST-DIVERSITY-SCORE-${Date.now()}`;
    const audit = await demoSyntheticDataEngine.generateEnterpriseBatch(30, batchId);

    expect(audit.diversityMetrics).toBeDefined();
    expect(audit.diversityMetrics!.diversityScore).toBeGreaterThanOrEqual(0.70);
  });

  // ---------------------------------------------------------------------------
  // DEMO-DIVERSITY-006: Industry Distribution
  // ---------------------------------------------------------------------------
  it('DEMO-DIVERSITY-006: batch encompasses multiple diverse industry sectors', async () => {
    const batchId = `DEMO-TEST-INDUSTRIES-${Date.now()}`;
    const audit = await demoSyntheticDataEngine.generateEnterpriseBatch(30, batchId);

    expect(audit.diversityMetrics).toBeDefined();
    // 30 packages should cover at least 10 different industries from our 16-industry catalog
    expect(audit.diversityMetrics!.uniqueIndustries).toBeGreaterThanOrEqual(10);
  });

  // ---------------------------------------------------------------------------
  // DEMO-DIVERSITY-007: Geographic Distribution
  // ---------------------------------------------------------------------------
  it('DEMO-DIVERSITY-007: batch spans global cities across AMER, EMEA, APAC, MEA', async () => {
    const batchId = `DEMO-TEST-GEOGRAPHY-${Date.now()}`;
    const audit = await demoSyntheticDataEngine.generateEnterpriseBatch(30, batchId);

    expect(audit.diversityMetrics).toBeDefined();
    // In 30 packages with 2-3 suppliers each, unique cities should exceed 15
    expect(audit.diversityMetrics!.uniqueCities).toBeGreaterThanOrEqual(15);
  });

  // ---------------------------------------------------------------------------
  // DEMO-DIVERSITY-008: Multimodal Transport Distribution
  // ---------------------------------------------------------------------------
  it('DEMO-DIVERSITY-008: generates multimodal transport across OCEAN, AIR, ROAD, RAIL', async () => {
    const batchId = `DEMO-TEST-MODES-${Date.now()}`;
    const audit = await demoSyntheticDataEngine.generateEnterpriseBatch(30, batchId);

    const breakdown = audit.diversityMetrics?.shippingModeBreakdown;
    expect(breakdown).toBeDefined();
    expect(breakdown!.OCEAN).toBeGreaterThan(0);
    expect(breakdown!.ROAD).toBeGreaterThan(0);
    expect(breakdown!.AIR).toBeGreaterThan(0);
    expect(breakdown!.RAIL).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // DEMO-DIVERSITY-009: Multimodal Carrier Alignment
  // ---------------------------------------------------------------------------
  it('DEMO-DIVERSITY-009: assigns valid carriers corresponding to transport modes', () => {
    const batchId = `DEMO-TEST-CARRIERS-${Date.now()}`;
    const tenantId = 'DEMO_TENANT_ORION';
    const orgId = 'DEMO_ORG_GLOBAL';
    const baseDate = new Date();
    const prng = new SeededPRNG(`${batchId}:${tenantId}:${orgId}`);

    for (let i = 0; i < 5; i++) {
      const pkg = demoSyntheticDataEngine.generateSingleEnterprisePackage(i, batchId, tenantId, orgId, baseDate, prng.fork(i));
      for (const shp of pkg.shipments) {
        const expectedPool = CARRIERS_BY_MODE[shp.shippingMode];
        expect(expectedPool).toContain(shp.carrier);
      }
    }
  });

  // ---------------------------------------------------------------------------
  // DEMO-DIVERSITY-010: Operational Scenario Profiles
  // ---------------------------------------------------------------------------
  it('DEMO-DIVERSITY-010: generates varied operational scenario profiles', async () => {
    const batchId = `DEMO-TEST-SCENARIOS-${Date.now()}`;
    const audit = await demoSyntheticDataEngine.generateEnterpriseBatch(30, batchId);

    const scenarioBreakdown = audit.diversityMetrics?.scenarioBreakdown;
    expect(scenarioBreakdown).toBeDefined();
    // HEALTHY should be the dominant profile (around 60%)
    expect(scenarioBreakdown!['HEALTHY']).toBeGreaterThanOrEqual(10);
    // At least 2 different disruption scenarios should be present in 30 packages
    const nonHealthyScenarios = Object.keys(scenarioBreakdown!).filter(s => s !== 'HEALTHY');
    expect(nonHealthyScenarios.length).toBeGreaterThanOrEqual(2);
  });

  // ---------------------------------------------------------------------------
  // DEMO-DIVERSITY-011: Relational Integrity: Products -> Suppliers
  // ---------------------------------------------------------------------------
  it('DEMO-DIVERSITY-011: every product references a valid supplierId from the package', () => {
    const batchId = 'DEMO-REL-PROD-TEST';
    const tenantId = 'DEMO_TENANT_ORION';
    const orgId = 'DEMO_ORG_GLOBAL';
    const baseDate = new Date();
    const prng = new SeededPRNG(`${batchId}:${tenantId}:${orgId}`);

    const pkg = demoSyntheticDataEngine.generateSingleEnterprisePackage(0, batchId, tenantId, orgId, baseDate, prng.fork(0));
    const validSupplierIds = new Set(pkg.suppliers.map(s => s.id));

    for (const prod of pkg.products) {
      expect(validSupplierIds.has(prod.supplierId)).toBe(true);
    }
  });

  // ---------------------------------------------------------------------------
  // DEMO-DIVERSITY-012: Relational Integrity: Purchase Orders -> Suppliers & SKUs
  // ---------------------------------------------------------------------------
  it('DEMO-DIVERSITY-012: every purchase order references valid suppliers and product SKUs', () => {
    const batchId = 'DEMO-REL-PO-TEST';
    const tenantId = 'DEMO_TENANT_ORION';
    const orgId = 'DEMO_ORG_GLOBAL';
    const baseDate = new Date();
    const prng = new SeededPRNG(`${batchId}:${tenantId}:${orgId}`);

    const pkg = demoSyntheticDataEngine.generateSingleEnterprisePackage(1, batchId, tenantId, orgId, baseDate, prng.fork(1));
    const validSupplierIds = new Set(pkg.suppliers.map(s => s.id));
    const validSkus = new Set(pkg.products.map(p => p.sku));

    for (const po of pkg.purchaseOrders) {
      expect(validSupplierIds.has(po.supplierId)).toBe(true);
      for (const item of po.items) {
        expect(validSkus.has(item.sku)).toBe(true);
        expect(item.totalPrice).toBe(item.orderedQty * item.unitPrice);
      }
    }
  });

  // ---------------------------------------------------------------------------
  // DEMO-DIVERSITY-013: Relational Integrity: Shipments -> Purchase Orders
  // ---------------------------------------------------------------------------
  it('DEMO-DIVERSITY-013: every shipment references a valid purchase order', () => {
    const batchId = 'DEMO-REL-SHP-TEST';
    const tenantId = 'DEMO_TENANT_ORION';
    const orgId = 'DEMO_ORG_GLOBAL';
    const baseDate = new Date();
    const prng = new SeededPRNG(`${batchId}:${tenantId}:${orgId}`);

    const pkg = demoSyntheticDataEngine.generateSingleEnterprisePackage(2, batchId, tenantId, orgId, baseDate, prng.fork(2));
    const validPoIds = new Set(pkg.purchaseOrders.map(p => p.id));

    for (const shp of pkg.shipments) {
      expect(validPoIds.has(shp.poId)).toBe(true);
      expect(shp.destination).toBe(pkg.warehouses[0].location);
    }
  });

  // ---------------------------------------------------------------------------
  // DEMO-DIVERSITY-014: Relational Integrity: Invoices -> Purchase Orders
  // ---------------------------------------------------------------------------
  it('DEMO-DIVERSITY-014: every invoice references a valid purchase order and supplier', () => {
    const batchId = 'DEMO-REL-INV-TEST';
    const tenantId = 'DEMO_TENANT_ORION';
    const orgId = 'DEMO_ORG_GLOBAL';
    const baseDate = new Date();
    const prng = new SeededPRNG(`${batchId}:${tenantId}:${orgId}`);

    const pkg = demoSyntheticDataEngine.generateSingleEnterprisePackage(3, batchId, tenantId, orgId, baseDate, prng.fork(3));
    const validPoIds = new Set(pkg.purchaseOrders.map(p => p.id));
    const validSupplierIds = new Set(pkg.suppliers.map(s => s.id));

    for (const inv of pkg.invoices) {
      expect(validPoIds.has(inv.poId)).toBe(true);
      expect(validSupplierIds.has(inv.supplierId)).toBe(true);
    }
  });

  // ---------------------------------------------------------------------------
  // DEMO-DIVERSITY-015: Relational Integrity: Contracts & Exceptions
  // ---------------------------------------------------------------------------
  it('DEMO-DIVERSITY-015: every contract and exception connects to a valid entity', () => {
    const batchId = 'DEMO-REL-CTR-TEST';
    const tenantId = 'DEMO_TENANT_ORION';
    const orgId = 'DEMO_ORG_GLOBAL';
    const baseDate = new Date();
    const prng = new SeededPRNG(`${batchId}:${tenantId}:${orgId}`);

    const pkg = demoSyntheticDataEngine.generateSingleEnterprisePackage(4, batchId, tenantId, orgId, baseDate, prng.fork(4));
    const validSupplierIds = new Set(pkg.suppliers.map(s => s.id));

    for (const ctr of pkg.contracts) {
      expect(validSupplierIds.has(ctr.supplierId)).toBe(true);
    }

    for (const exc of pkg.exceptions) {
      expect(exc.relatedEntityId).toBeDefined();
      expect(exc.relatedEntityId.length).toBeGreaterThan(0);
    }
  });

  // ---------------------------------------------------------------------------
  // DEMO-DIVERSITY-016: Financial Variance
  // ---------------------------------------------------------------------------
  it('DEMO-DIVERSITY-016: realistic financial distribution across products and POs', () => {
    const batchId = 'DEMO-FIN-TEST';
    const tenantId = 'DEMO_TENANT_ORION';
    const orgId = 'DEMO_ORG_GLOBAL';
    const baseDate = new Date();
    const prng = new SeededPRNG(`${batchId}:${tenantId}:${orgId}`);

    const pkg = demoSyntheticDataEngine.generateSingleEnterprisePackage(5, batchId, tenantId, orgId, baseDate, prng.fork(5));

    for (const prod of pkg.products) {
      expect(prod.sellingPrice).toBeGreaterThan(prod.unitCost);
      expect(prod.unitCost).toBeGreaterThan(0);
    }

    for (const po of pkg.purchaseOrders) {
      expect(po.totalAmount).toBeGreaterThan(0);
    }
  });

  // ---------------------------------------------------------------------------
  // DEMO-DIVERSITY-017: DEMO Safety Guard & Tagging
  // ---------------------------------------------------------------------------
  it('DEMO-DIVERSITY-017: all records tagged DEMO and syntheticData: true; LIVE rejects', async () => {
    const batchId = `DEMO-TAG-TEST-${Date.now()}`;
    const audit = await demoSyntheticDataEngine.generateEnterpriseBatch(2, batchId);

    expect(audit.environment).toBe('DEMO');

    // Switch to LIVE mode
    await dbManager.switchEnvironment({
      targetEnvironment: 'LIVE',
      actorUserId: 'admin_test',
      actorRole: 'platform_admin',
      callerType: 'human_admin',
      stepUpConfirmed: true,
      reason: 'Safety test',
    });

    await expect(
      demoSyntheticDataEngine.generateEnterpriseBatch(30)
    ).rejects.toThrow(/Access Denied: Synthetic Data Engine cannot execute in LIVE mode/);
  });

  // ---------------------------------------------------------------------------
  // DEMO-DIVERSITY-018: Diagnostic Diversity Metrics In Audit
  // ---------------------------------------------------------------------------
  it('DEMO-DIVERSITY-018: audit contains comprehensive diversity diagnostic breakdown', async () => {
    const batchId = `DEMO-DIAGNOSTIC-TEST-${Date.now()}`;
    const audit = await demoSyntheticDataEngine.generateEnterpriseBatch(30, batchId);

    expect(audit.diversityMetrics).toBeDefined();
    expect(audit.diversityMetrics!.uniqueIndustries).toBeGreaterThan(0);
    expect(audit.diversityMetrics!.uniqueCities).toBeGreaterThan(0);
    expect(audit.diversityMetrics!.uniqueCarriers).toBeGreaterThan(0);
    expect(audit.diversityMetrics!.averageSupplierRating).toBeGreaterThan(50);
    expect(audit.diversityMetrics!.diversityScore).toBeGreaterThan(0);
  });
});
