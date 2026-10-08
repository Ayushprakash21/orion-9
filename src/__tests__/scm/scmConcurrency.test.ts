/**
 * ORION-9 GATE 6: SCM CONCURRENCY & RACE CONDITION TEST SUITE
 *
 * Simulates parallel operations across SCM transaction endpoints:
 * - Concurrent receipts & inventory increments
 * - Concurrent duplicate invoice submissions
 * - Concurrent PO updates
 * - Concurrent reconciliation matching
 */

import { describe, it, expect } from 'vitest';
import { poLifecycleEngine } from '../../scm/POLifecycleEngine';
import { receivingGRNEngine } from '../../scm/ReceivingGRNEngine';
import { invoicingMatchingEngine } from '../../scm/InvoicingMatchingEngine';
import { scmPersistenceService } from '../../services/scm/ScmPersistenceService';
import { AuthorizationActor } from '../../kernel/authorization/AuthorizationEngine';

describe('GATE 6: SCM Concurrency & Race Condition Suite', () => {
  const tenantId = 'tenant-scm-concurrency';

  const actor: AuthorizationActor = {
    id: 'user-concurrency-tester',
    type: 'USER',
    name: 'Concurrency Tester',
    roles: ['procurement_manager', 'organization_admin', 'warehouse_manager', 'warehouse_operator', 'organization_member', 'finance_manager'],
    organizationId: tenantId,
  };

  // 1. Concurrent Inventory Increments
  it('1. processes concurrent inventory adjustments accurately without lost updates', async () => {
    const invId = 'INV-WH-CONCUR-SKU-PARALLEL';
    const initialInv = await scmPersistenceService.getRecord<any>('inventory', tenantId, invId);
    const startBalance = initialInv?.onHand || 0;

    // Dispatch 5 concurrent inventory increments of +10 each
    const promises = Array.from({ length: 5 }, (_, i) =>
      scmPersistenceService.adjustInventory({
        tenantId,
        productId: 'SKU-PARALLEL',
        warehouseId: 'WH-CONCUR',
        quantityDelta: 10,
        transactionType: 'GRN_RECEIPT',
        referenceEntityType: 'GRN',
        referenceEntityId: `GRN-PARALLEL-${i}`,
        actor: actor.id,
        correlationId: `CORR-CONCUR-${i}-${Date.now()}`,
      })
    );

    const results = await Promise.all(promises);
    expect(results).toHaveLength(5);

    // Verify final inventory onHand is startBalance + 50
    const finalInv = await scmPersistenceService.getRecord<any>('inventory', tenantId, invId);
    expect(finalInv?.onHand).toBe(startBalance + 50);

    // Verify all 5 transactions recorded
    const allTxs = scmPersistenceService.listCachedRecords<any>('inventory_transactions', tenantId);
    const concurrentTxs = allTxs.filter(tx => tx.productId === 'SKU-PARALLEL' && tx.warehouseId === 'WH-CONCUR');
    expect(concurrentTxs.length).toBeGreaterThanOrEqual(5);
  });

  // 2. Concurrent Duplicate Invoices Ingestion
  it('2. safely deduplicates concurrent invoice submissions with identical invoice number', async () => {
    const invoiceNumber = `INV-CONCUR-RACE-${Date.now()}`;
    const supplierId = 'SUP-RACE-01';

    // Dispatch two identical invoices concurrently
    const [inv1, inv2] = await Promise.all([
      invoicingMatchingEngine.ingestInvoice({
        tenantId,
        actor,
        invoiceNumber,
        supplierId,
        poId: 'PO-RACE-01',
        amount: 2500,
        lineItems: [{ productId: 'PROD-RACE', quantity: 10, unitPrice: 250, lineTotal: 2500 }],
      }),
      invoicingMatchingEngine.ingestInvoice({
        tenantId,
        actor,
        invoiceNumber,
        supplierId,
        poId: 'PO-RACE-01',
        amount: 2500,
        lineItems: [{ productId: 'PROD-RACE', quantity: 10, unitPrice: 250, lineTotal: 2500 }],
      }),
    ]);

    // Exactly one must succeed, and one must be rejected as duplicate
    const successes = [inv1, inv2].filter(r => r.success);
    const duplicates = [inv1, inv2].filter(r => !r.success && r.status === 'DENIED_POLICY');

    expect(successes).toHaveLength(1);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].message).toContain('Duplicate Invoice Protection');
  });

  // 3. Concurrent Reconciliation Operations
  it('3. maintains deterministic status during concurrent matching operations on same invoice', async () => {
    const poRes = await poLifecycleEngine.createPO({
      tenantId,
      actor,
      supplierId: 'SUP-RECON-PARALLEL',
      items: [{
        lineId: 'L-1',
        productId: 'PROD-RECON',
        quantity: 20,
        unitPrice: 50,
        totalPrice: 1000,
        unitOfMeasure: 'EA',
        expectedDeliveryDate: new Date().toISOString(),
      }],
    });
    await poLifecycleEngine.approvePO(tenantId, poRes.data.poId, actor);

    const rcvRes = await receivingGRNEngine.recordReceiving({
      tenantId,
      actor,
      poId: poRes.data.poId,
      warehouseId: 'WH-MAIN',
      receivedItems: [{ productId: 'PROD-RECON', receivedQuantity: 20, damagedQuantity: 0, shortQuantity: 0 }],
    });

    const grnRes = await receivingGRNEngine.postGRN({
      tenantId,
      actor,
      poId: poRes.data.poId,
      receivingId: rcvRes.data.receivingId,
      warehouseId: 'WH-MAIN',
      items: [{ productId: 'PROD-RECON', acceptedQuantity: 20, unitCost: 50 }],
    });

    const invRes = await invoicingMatchingEngine.ingestInvoice({
      tenantId,
      actor,
      invoiceNumber: `INV-RECON-PAR-${Date.now()}`,
      supplierId: 'SUP-RECON-PARALLEL',
      poId: poRes.data.poId,
      grnId: grnRes.data.grnId,
      amount: poRes.data.totalAmount,
      lineItems: [{ productId: 'PROD-RECON', quantity: 20, unitPrice: 50, lineTotal: 1000 }],
    });

    // Run 3 concurrent match requests on the same invoice
    const matchPromises = [
      invoicingMatchingEngine.performMatch({ tenantId, actor, invoiceId: invRes.data.invoiceId, matchMode: 'THREE_WAY' }),
      invoicingMatchingEngine.performMatch({ tenantId, actor, invoiceId: invRes.data.invoiceId, matchMode: 'THREE_WAY' }),
      invoicingMatchingEngine.performMatch({ tenantId, actor, invoiceId: invRes.data.invoiceId, matchMode: 'THREE_WAY' }),
    ];

    const matchResults = await Promise.all(matchPromises);
    for (const res of matchResults) {
      expect(res.success).toBe(true);
      expect(res.data.status).toBe('MATCHED');
      expect(res.data.priceVariance).toBe(0);
      expect(res.data.quantityVariance).toBe(0);
    }
  });
});
