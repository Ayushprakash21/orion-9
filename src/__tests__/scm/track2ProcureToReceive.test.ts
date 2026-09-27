/**
 * ORION-9 TRACK 2 — GOLDEN JOURNEY #1: PROCURE-TO-RECEIVE
 *
 * Full End-to-End Execution:
 * Demand/PR -> PR Approval -> RFQ -> Supplier Quotation -> Sourcing Award ->
 * Purchase Order -> PO Approval -> Supplier Confirmation -> ASN ->
 * Shipment -> Dock Receiving -> GRN Posting -> Authoritative Inventory Update
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { sourcingEngine } from '../../scm/SourcingEngine';
import { poLifecycleEngine } from '../../scm/POLifecycleEngine';
import { inboundLogisticsEngine } from '../../scm/InboundLogisticsEngine';
import { receivingGRNEngine } from '../../scm/ReceivingGRNEngine';
import { scmPersistenceService } from '../../services/scm/ScmPersistenceService';
import { scmReconciliationEngine } from '../../scm/ScmReconciliationEngine';
import { AuthorizationActor } from '../../kernel/authorization/AuthorizationEngine';
import { PurchaseOrderRecord, SupplierQuotationRecord } from '../../scm/types';

describe('Track 2 — Golden Journey #1: Procure-to-Receive', () => {
  const TENANT = 'TENANT_PROCURE_01';

  const buyerActor: AuthorizationActor = {
    id: 'buyer_user_101',
    name: 'Sarah Buyer',
    roles: ['procurement_specialist'],
    permissions: [
      'pr:create',
      'rfq:create',
      'rfq:publish',
      'quotation:submit',
      'rfq:evaluate',
      'supplier_selection:approve',
      'purchase_order:create',
      'purchase_order:release',
    ],
    organizationId: TENANT,
  };

  const approverActor: AuthorizationActor = {
    id: 'manager_user_202',
    name: 'David Manager',
    roles: ['procurement_manager', 'admin'],
    permissions: [
      'pr:approve',
      'purchase_order:approve',
      'supplier_selection:approve',
    ],
    organizationId: TENANT,
  };

  const supplierActor: AuthorizationActor = {
    id: 'supplier_portal_user',
    name: 'Hans Supplier',
    roles: ['supplier_representative'],
    permissions: [
      'quotation:submit',
      'asn:create',
      'shipment:update',
    ],
    organizationId: TENANT,
  };

  const dockActor: AuthorizationActor = {
    id: 'warehouse_dock_operator',
    name: 'Mike Warehouse',
    roles: ['warehouse_operator', 'admin'],
    permissions: [
      'receiving:create',
      'grn:post',
    ],
    organizationId: TENANT,
  };

  beforeEach(() => {
    sourcingEngine.clear();
    poLifecycleEngine.clear();
    inboundLogisticsEngine.clear();
    receivingGRNEngine.clear();
    scmPersistenceService.clear();
  });

  it('authoritatively executes complete Procure-to-Receive lifecycle with full reconciliation and inventory update', async () => {
    // 0. Seed Master Data: Supplier, Product, Warehouse
    const supplierId = 'SUP-AERO-TURBO';
    const productId = 'PRD-TURBO-FAN-01';
    const warehouseId = 'WH-CENTRAL-01';

    await scmPersistenceService.saveRecord('suppliers', supplierId, {
      supplierId,
      tenantId: TENANT,
      supplierCode: 'SUP-AERO-TURBO',
      legalName: 'Turbo Aero Components Inc',
      status: 'Active',
      currency: 'USD',
      paymentTerms: 'NET30',
    });

    await scmPersistenceService.saveRecord('products', productId, {
      productId,
      tenantId: TENANT,
      productCode: 'PRD-TURBO-FAN-01',
      name: 'High-Efficiency Turbine Fan Blade',
      unitOfMeasure: 'EA',
      status: 'Active',
    });

    await scmPersistenceService.saveRecord('warehouses', warehouseId, {
      warehouseId,
      tenantId: TENANT,
      warehouseCode: 'WH-CENTRAL-01',
      name: 'Main Distribution Hub',
      status: 'Active',
    });

    // =========================================================================
    // STEP 1: Create Purchase Requisition (PR)
    // =========================================================================
    const prResult = await sourcingEngine.createPR({
      tenantId: TENANT,
      actor: buyerActor,
      department: 'Aerospace Propulsion',
      costCenter: 'CC-AERO-900',
      priority: 'HIGH',
      items: [
        {
          lineId: 'PRLINE-1',
          productId,
          description: 'Titanium Turbine Blade Assembly',
          quantity: 100,
          unitOfMeasure: 'EA',
          estimatedUnitCost: 250.0,
          requiredDate: '2026-11-01T00:00:00Z',
          deliveryLocation: warehouseId,
        },
      ],
      justification: 'Critical demand for Q4 engine overhaul program',
    });

    expect(prResult.success).toBe(true);
    const pr = prResult.data;
    expect(pr.status).toBe('DRAFT');
    expect(pr.totalEstimatedValue).toBe(25000);

    // =========================================================================
    // STEP 2: Submit and Approve PR (with SoD verification)
    // =========================================================================
    await sourcingEngine.submitPR(TENANT, pr.prId, buyerActor);
    const approvedPrResult = await sourcingEngine.approvePR(TENANT, pr.prId, approverActor);
    expect(approvedPrResult.success).toBe(true);
    expect(approvedPrResult.data?.status).toBe('APPROVED');

    // =========================================================================
    // STEP 3: Create and Publish RFQ from PR
    // =========================================================================
    const rfqResult = await sourcingEngine.createRFQ({
      tenantId: TENANT,
      actor: buyerActor,
      title: 'Sourcing RFP: High-Efficiency Turbine Fan Blades',
      prId: pr.prId,
      invitedSupplierIds: [supplierId],
      items: pr.items,
      submissionDeadline: '2026-10-15T23:59:59Z',
    });

    expect(rfqResult.success).toBe(true);
    const rfq = rfqResult.data;
    await sourcingEngine.publishRFQ(TENANT, rfq.rfqId, buyerActor);

    // =========================================================================
    // STEP 4: Submit Supplier Quotation
    // =========================================================================
    const quoteResult = await sourcingEngine.submitQuotation({
      tenantId: TENANT,
      actor: supplierActor,
      rfqId: rfq.rfqId,
      supplierId,
      items: [
        {
          productId,
          unitPrice: 240.0,
          moq: 50,
          leadTimeDays: 10,
        },
      ],
      currency: 'USD',
      paymentTerms: 'NET30',
    });

    expect(quoteResult.success).toBe(true);
    const quote = quoteResult.data as SupplierQuotationRecord;
    expect(quote.totalAmount).toBe(12000); // 240 * 50 MOQ base

    // =========================================================================
    // STEP 5: Sourcing Bid Evaluation & Supplier Award
    // =========================================================================
    const evalResult = await sourcingEngine.evaluateBids({
      tenantId: TENANT,
      rfqId: rfq.rfqId,
      actor: buyerActor,
      justification: 'Best price and certified AS9100 quality rating',
    });
    expect(evalResult.success).toBe(true);

    const awardResult = await sourcingEngine.awardSupplier({
      tenantId: TENANT,
      rfqId: rfq.rfqId,
      supplierId,
      quotationId: quote.quotationId,
      actor: approverActor,
    });
    expect(awardResult.success).toBe(true);

    // =========================================================================
    // STEP 6: Create, Approve and Release Purchase Order (PO)
    // =========================================================================
    const poResult = await poLifecycleEngine.createPO({
      tenantId: TENANT,
      actor: buyerActor,
      supplierId,
      prId: pr.prId,
      rfqId: rfq.rfqId,
      quotationId: quote.quotationId,
      items: [
        {
          lineId: 'POLINE-01',
          productId,
          quantity: 100,
          unitPrice: 240.0,
          totalPrice: 24000.0,
          unitOfMeasure: 'EA',
          expectedDeliveryDate: '2026-11-01T00:00:00Z',
        },
      ],
      paymentTerms: 'NET30',
      incoterms: 'DDP',
      deliveryLocation: warehouseId,
    });

    expect(poResult.success).toBe(true);
    const po = poResult.data as PurchaseOrderRecord;
    expect(po.status).toBe('DRAFT');

    // Submit for approval and approve
    await poLifecycleEngine.submitPOForApproval(TENANT, po.poId, buyerActor);
    const poApproveResult = await poLifecycleEngine.approvePO(TENANT, po.poId, approverActor);
    expect(poApproveResult.success).toBe(true);

    // Release to supplier
    const poReleaseResult = await poLifecycleEngine.releasePO(TENANT, po.poId, buyerActor);
    expect(poReleaseResult.success).toBe(true);
    expect(poReleaseResult.data?.status).toBe('RELEASED');

    // =========================================================================
    // STEP 7: Supplier Acknowledges & Formally Confirms PO
    // =========================================================================
    await poLifecycleEngine.acknowledgePO(TENANT, po.poId, supplierActor);
    const poConfirmResult = await poLifecycleEngine.confirmPO({
      tenantId: TENANT,
      poId: po.poId,
      actor: supplierActor,
      confirmedLines: [
        {
          lineId: 'POLINE-01',
          confirmedQuantity: 100,
          confirmedDeliveryDate: '2026-11-01T00:00:00Z',
        },
      ],
    });
    expect(poConfirmResult.success).toBe(true);
    expect(poConfirmResult.data?.status).toBe('CONFIRMED');

    // =========================================================================
    // STEP 8: Supplier Creates Advance Shipping Notice (ASN) & Shipment
    // =========================================================================
    const asnResult = await inboundLogisticsEngine.createASN({
      tenantId: TENANT,
      actor: supplierActor,
      poId: po.poId,
      supplierId,
      carrier: 'FEDEX_FREIGHT',
      trackingNumber: 'FDX-AERO-998811',
      shippedDate: new Date().toISOString(),
      expectedArrivalDate: '2026-10-28T00:00:00Z',
      items: [
        {
          productId,
          shippedQuantity: 100,
          lotNumber: 'LOT-TURBINE-2026-01',
        },
      ],
    });
    expect(asnResult.success).toBe(true);
    const asn = asnResult.data;

    const shipmentResult = await inboundLogisticsEngine.createShipment({
      tenantId: TENANT,
      actor: supplierActor,
      carrier: 'FEDEX_FREIGHT',
      trackingNumber: 'FDX-AERO-998811',
      origin: 'Munich Facility',
      destination: warehouseId,
      poId: po.poId,
      asnId: asn.asnId,
      expectedArrival: '2026-10-28T00:00:00Z',
      items: [{ productId, quantity: 100 }],
    });
    expect(shipmentResult.success).toBe(true);

    // =========================================================================
    // STEP 9: Warehouse Dock Receiving & Inspection
    // =========================================================================
    const rcvResult = await receivingGRNEngine.recordReceiving({
      tenantId: TENANT,
      actor: dockActor,
      poId: po.poId,
      asnId: asn.asnId,
      shipmentId: shipmentResult.data.shipmentId,
      warehouseId,
      receivedItems: [
        {
          productId,
          receivedQuantity: 100,
          damagedQuantity: 0,
          shortQuantity: 0,
        },
      ],
    });
    expect(rcvResult.success).toBe(true);
    const receiving = rcvResult.data;

    // =========================================================================
    // STEP 10: Post Goods Receipt Note (GRN) & Verify Authoritative Stock
    // =========================================================================
    const grnResult = await receivingGRNEngine.postGRN({
      tenantId: TENANT,
      actor: dockActor,
      poId: po.poId,
      receivingId: receiving.receivingId,
      warehouseId,
      items: [
        {
          productId,
          acceptedQuantity: 100,
          unitCost: 240.0,
        },
      ],
    });
    expect(grnResult.success).toBe(true);

    // Verify final physical on-hand inventory stock
    const inv = await scmPersistenceService.getRecord<any>('inventory', TENANT, `INV-${warehouseId}-${productId}`);
    expect(inv).toBeDefined();
    expect(inv?.onHand).toBe(100);

    // Reconcile complete PO document tree
    const reconciliation = await scmReconciliationEngine.reconcilePO(TENANT, po.poId);
    expect(reconciliation.totalOrderedQuantity).toBe(100);
    expect(reconciliation.totalAcceptedQuantity).toBe(100);
    expect(reconciliation.totalOpenQuantity).toBe(0);
    expect(reconciliation.fulfillmentStatus).toBe('COMPLETED');
  });
});
