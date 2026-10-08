/**
 * ORION-9 GATE 6: SCM FAILURE INJECTION & TRANSACTION RESILIENCE SUITE
 *
 * Injects failures at every stage of the SCM transaction lifecycle to prove
 * fail-closed semantics, absence of orphaned partial states, and invariant preservation.
 */

import { describe, it, expect } from 'vitest';
import { supplierLifecycleEngine } from '../../scm/SupplierLifecycleEngine';
import { poLifecycleEngine } from '../../scm/POLifecycleEngine';
import { inboundLogisticsEngine } from '../../scm/InboundLogisticsEngine';
import { receivingGRNEngine } from '../../scm/ReceivingGRNEngine';
import { invoicingMatchingEngine } from '../../scm/InvoicingMatchingEngine';
import { scmPersistenceService } from '../../services/scm/ScmPersistenceService';
import { AuthorizationActor } from '../../kernel/authorization/AuthorizationEngine';

describe('GATE 6: SCM Failure Injection & Resilience Suite', () => {
  const tenantId = 'tenant-scm-failure-injection';

  const validBuyer: AuthorizationActor = {
    id: 'user-buyer-failtest',
    type: 'USER',
    name: 'Authorized Buyer',
    roles: ['procurement_manager', 'organization_admin', 'buyer'],
    organizationId: tenantId,
  };

  const alienTenantActor: AuthorizationActor = {
    id: 'user-intruder',
    type: 'USER',
    name: 'Alien Actor',
    roles: ['procurement_manager'],
    organizationId: 'alien-tenant-xyz',
  };

  const unauthorizedActor: AuthorizationActor = {
    id: 'user-guest',
    type: 'USER',
    name: 'Guest User',
    roles: ['standard_viewer'],
    organizationId: tenantId,
  };

  // 1. Supplier Creation Failure: Tenant Isolation Violation
  it('1. rejects supplier creation when actor tenant does not match command tenant', async () => {
    const res = await supplierLifecycleEngine.registerSupplier({
      tenantId,
      actor: alienTenantActor,
      legalName: 'Alien Tech',
      supplierCode: 'SUP-ALIEN',
      taxIdentifier: 'TX-001',
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('DENIED_AUTHORIZATION');
    expect(res.message).toContain('Tenant isolation violation');
  });

  // 2. Supplier Creation Failure: Unauthorized Role
  it('2. rejects supplier creation when actor lacks required permission', async () => {
    const res = await supplierLifecycleEngine.registerSupplier({
      tenantId,
      actor: unauthorizedActor,
      legalName: 'Unauthorized Supplier Co',
      supplierCode: 'SUP-UNAUTH',
      taxIdentifier: 'TX-002',
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('DENIED_AUTHORIZATION');
  });

  // 3. PO Creation Failure: Cross-Tenant Isolation
  it('3. rejects purchase order creation across tenant boundaries', async () => {
    const res = await poLifecycleEngine.createPO({
      tenantId,
      actor: alienTenantActor,
      supplierId: 'SUP-TEST-100',
      items: [{
        lineId: 'L-1',
        productId: 'SKU-001',
        quantity: 10,
        unitPrice: 10,
        totalPrice: 100,
        unitOfMeasure: 'EA',
        expectedDeliveryDate: new Date().toISOString(),
      }],
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('DENIED_AUTHORIZATION');
    expect(res.message).toContain('Tenant isolation violation');
  });

  // 4. ASN Creation Failure: Tolerance Overdraw
  it('4. rejects ASN creation when shipped quantity breaches policy tolerance', async () => {
    const supp = await supplierLifecycleEngine.registerSupplier({
      tenantId,
      actor: validBuyer,
      legalName: 'Tolerance Supplier',
      supplierCode: 'SUP-TOL',
      taxIdentifier: 'TX-TOL',
    });

    const poRes = await poLifecycleEngine.createPO({
      tenantId,
      actor: validBuyer,
      supplierId: supp.data.supplierId,
      items: [{
        lineId: 'L-1',
        productId: 'PROD-RESISTOR',
        quantity: 100,
        unitPrice: 1,
        totalPrice: 100,
        unitOfMeasure: 'EA',
        expectedDeliveryDate: new Date().toISOString(),
      }],
    });
    await poLifecycleEngine.approvePO(tenantId, poRes.data.poId, validBuyer);

    // Over-shipped: 300 instead of ordered 100 (> 10% tolerance)
    const asnRes = await inboundLogisticsEngine.createASN({
      tenantId,
      actor: validBuyer,
      poId: poRes.data.poId,
      supplierId: supp.data.supplierId,
      carrier: 'FEDEX',
      trackingNumber: 'TRK-999',
      shippedDate: new Date().toISOString(),
      expectedArrivalDate: new Date().toISOString(),
      items: [{
        productId: 'PROD-RESISTOR',
        shippedQuantity: 300,
      }],
    });

    expect(asnRes.success).toBe(false);
    expect(asnRes.status).toBe('DENIED_POLICY');
    expect(asnRes.message).toContain('tolerance limit');
  });

  // 5. Inventory Failure Injection: Negative Overdraw Prevention
  it('5. strictly prevents inventory balance from dropping below 0', async () => {
    const invId = 'INV-WH-FAIL-SKU-OVERDRAW';
    // Initialize stock at 10
    await scmPersistenceService.adjustInventory({
      tenantId,
      productId: 'SKU-OVERDRAW',
      warehouseId: 'WH-FAIL',
      quantityDelta: 10,
      transactionType: 'CYCLE_COUNT_ADJUSTMENT',
      referenceEntityType: 'CYCLE_COUNT',
      referenceEntityId: 'CC-INIT',
      actor: validBuyer.id,
      correlationId: `CORR-INIT-${Date.now()}`,
    });

    const balanceBefore = (await scmPersistenceService.getRecord<any>('inventory', tenantId, invId))?.onHand;
    expect(balanceBefore).toBe(10);

    // Attempt to reduce stock by 50 (overdrawing below 0)
    await expect(
      scmPersistenceService.adjustInventory({
        tenantId,
        productId: 'SKU-OVERDRAW',
        warehouseId: 'WH-FAIL',
        quantityDelta: -50,
        transactionType: 'ORDER_FULFILLMENT',
        referenceEntityType: 'CUSTOMER_ORDER',
        referenceEntityId: 'ORD-FAIL',
        actor: validBuyer.id,
        correlationId: `CORR-OVERDRAW-${Date.now()}`,
      })
    ).rejects.toThrow(/Inventory overdraw rejected: cannot reduce stock .* below 0/i);

    // Assert that inventory remains unchanged at 10 (no corrupted partial state)
    const balanceAfter = (await scmPersistenceService.getRecord<any>('inventory', tenantId, invId))?.onHand;
    expect(balanceAfter).toBe(10);
  });

  // 6. Invoicing Failure Injection: Duplicate Ingestion Rejection
  it('6. rejects duplicate invoice ingestion for identical supplier and invoice number', async () => {
    const invNumber = 'INV-DUP-TEST-001';
    const suppId = 'SUP-DUP-TEST';

    const invRes1 = await invoicingMatchingEngine.ingestInvoice({
      tenantId,
      actor: validBuyer,
      invoiceNumber: invNumber,
      supplierId: suppId,
      poId: 'PO-DUMMY',
      amount: 1200,
      lineItems: [{ productId: 'PROD-A', quantity: 10, unitPrice: 120, lineTotal: 1200 }],
    });
    expect(invRes1.success).toBe(true);

    const invRes2 = await invoicingMatchingEngine.ingestInvoice({
      tenantId,
      actor: validBuyer,
      invoiceNumber: invNumber,
      supplierId: suppId,
      poId: 'PO-DUMMY',
      amount: 1200,
      lineItems: [{ productId: 'PROD-A', quantity: 10, unitPrice: 120, lineTotal: 1200 }],
    });
    expect(invRes2.success).toBe(false);
    expect(invRes2.status).toBe('DENIED_POLICY');
    expect(invRes2.message).toContain('Duplicate Invoice Protection');
  });

  // 7. 3-Way Match Failure Injection: Missing GRN Record
  it('7. fails 3-way match reconciliation when associated GRN record does not exist', async () => {
    const poRes = await poLifecycleEngine.createPO({
      tenantId,
      actor: validBuyer,
      supplierId: 'SUP-NOGRN',
      items: [{
        lineId: 'L-1',
        productId: 'PROD-NOGRN',
        quantity: 5,
        unitPrice: 100,
        totalPrice: 500,
        unitOfMeasure: 'EA',
        expectedDeliveryDate: new Date().toISOString(),
      }],
    });
    await poLifecycleEngine.approvePO(tenantId, poRes.data.poId, validBuyer);

    // Invoice claims GRN that was never recorded
    const invRes = await invoicingMatchingEngine.ingestInvoice({
      tenantId,
      actor: validBuyer,
      invoiceNumber: 'INV-GHOST-GRN',
      supplierId: 'SUP-NOGRN',
      poId: poRes.data.poId,
      grnId: 'GRN-NONEXISTENT',
      amount: poRes.data.totalAmount,
      lineItems: [{ productId: 'PROD-NOGRN', quantity: 5, unitPrice: 100, lineTotal: 500 }],
    });
    expect(invRes.success).toBe(true);

    const matchRes = await invoicingMatchingEngine.performMatch({
      tenantId,
      actor: validBuyer,
      invoiceId: invRes.data.invoiceId,
      matchMode: 'THREE_WAY',
    });

    expect(matchRes.success).toBe(true);
    expect(matchRes.data.status).toBe('MISMATCH');
    expect(matchRes.data.discrepancies).toContain('3-Way Match Failure: Missing associated GRN record');
  });
});
