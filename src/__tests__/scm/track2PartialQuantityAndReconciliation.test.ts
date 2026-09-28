/**
 * ORION-9 TRACK 2 — PARTIAL QUANTITY & MULTI-STEP RECONCILIATION TEST
 *
 * Mandated Scenario (Phases 18 & 30):
 * PO = 100
 * Confirmation = 100
 * ASN 1 = 60 -> Shipment 1 = 60 -> GRN 1 = 55 accepted (5 rejected)
 * State 1: Received = 55, Open = 45, Stock = +55
 * ASN 2 = 40 -> Shipment 2 = 40 -> GRN 2 = 40 accepted
 * Final State: Received = 95, Open = 5, Stock = +95
 *
 * Invariants:
 * - Never produce Received = 155 or Received = 100 twice
 * - Never produce negative open quantities
 * - Never double-count inventory stock
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { poLifecycleEngine } from '../../scm/POLifecycleEngine';
import { inboundLogisticsEngine } from '../../scm/InboundLogisticsEngine';
import { receivingGRNEngine } from '../../scm/ReceivingGRNEngine';
import { scmPersistenceService } from '../../services/scm/ScmPersistenceService';
import { scmReconciliationEngine } from '../../scm/ScmReconciliationEngine';
import { AuthorizationActor } from '../../kernel/authorization/AuthorizationEngine';
import { PurchaseOrderRecord } from '../../scm/types';

describe('Track 2 — Partial Quantity & Reconciliation (Phases 18 & 30)', () => {
  const TENANT = 'TENANT_PARTIAL_01';
  const SUPPLIER = 'SUP-MICRO-CHIPS';
  const PRODUCT = 'PRD-MICRO-CONTROLLER-32';
  const WAREHOUSE = 'WH-EAST-01';

  const buyerActor: AuthorizationActor = {
    id: 'buyer_01',
    name: 'Buyer',
    roles: ['procurement_specialist', 'admin'],
    permissions: ['purchase_order:create', 'purchase_order:approve', 'purchase_order:release'],
    organizationId: TENANT,
  };

  const supplierActor: AuthorizationActor = {
    id: 'supplier_01',
    name: 'Supplier Rep',
    roles: ['supplier_representative'],
    permissions: ['asn:create', 'shipment:update'],
    organizationId: TENANT,
  };

  const dockActor: AuthorizationActor = {
    id: 'dock_01',
    name: 'Dock Inspector',
    roles: ['warehouse_operator', 'admin'],
    permissions: ['receiving:create', 'grn:post'],
    organizationId: TENANT,
  };

  beforeEach(() => {
    poLifecycleEngine.clear();
    inboundLogisticsEngine.clear();
    receivingGRNEngine.clear();
    scmPersistenceService.clear();
  });

  it('correctly calculates partial ASNs, short receipts, and multi-delivery reconciliation with zero quantity leakage', async () => {
    // =========================================================================
    // 1. Create and Release PO for 100 Units
    // =========================================================================
    const poResult = await poLifecycleEngine.createPO({
      tenantId: TENANT,
      actor: buyerActor,
      supplierId: SUPPLIER,
      items: [
        {
          lineId: 'LINE-1',
          productId: PRODUCT,
          quantity: 100,
          unitPrice: 50.0,
          totalPrice: 5000.0,
          unitOfMeasure: 'EA',
          expectedDeliveryDate: '2026-11-10',
        },
      ],
      deliveryLocation: WAREHOUSE,
    });

    const po = poResult.data as PurchaseOrderRecord;
    await poLifecycleEngine.approvePO(TENANT, po.poId, buyerActor);
    await poLifecycleEngine.releasePO(TENANT, po.poId, buyerActor);
    await poLifecycleEngine.confirmPO({
      tenantId: TENANT,
      poId: po.poId,
      actor: supplierActor,
    });

    // =========================================================================
    // 2. PARTIAL DELIVERY #1: ASN 1 = 60, Shipment 1 = 60
    // =========================================================================
    const asn1 = (await inboundLogisticsEngine.createASN({
      tenantId: TENANT,
      actor: supplierActor,
      poId: po.poId,
      supplierId: SUPPLIER,
      carrier: 'DHL',
      trackingNumber: 'TRK-DHL-BATCH-1',
      shippedDate: new Date().toISOString(),
      expectedArrivalDate: '2026-10-30',
      items: [{ productId: PRODUCT, shippedQuantity: 60 }],
    })).data;

    const shp1 = (await inboundLogisticsEngine.createShipment({
      tenantId: TENANT,
      actor: supplierActor,
      carrier: 'DHL',
      trackingNumber: 'TRK-DHL-BATCH-1',
      origin: 'Supplier Plant',
      destination: WAREHOUSE,
      poId: po.poId,
      asnId: asn1.asnId,
      expectedArrival: '2026-10-30',
      items: [{ productId: PRODUCT, quantity: 60 }],
    })).data;

    // Receiving 1: 55 accepted, 5 damaged/short
    const rcv1 = (await receivingGRNEngine.recordReceiving({
      tenantId: TENANT,
      actor: dockActor,
      poId: po.poId,
      asnId: asn1.asnId,
      shipmentId: shp1.shipmentId,
      warehouseId: WAREHOUSE,
      receivedItems: [
        {
          productId: PRODUCT,
          receivedQuantity: 55,
          damagedQuantity: 5,
          shortQuantity: 0,
        },
      ],
    })).data;

    // Post GRN 1 with 55 accepted items
    await receivingGRNEngine.postGRN({
      tenantId: TENANT,
      actor: dockActor,
      poId: po.poId,
      receivingId: rcv1.receivingId,
      warehouseId: WAREHOUSE,
      items: [{ productId: PRODUCT, acceptedQuantity: 55, unitCost: 50.0 }],
    });

    // Verify State 1: Inventory stock = 55
    const stock1 = await scmPersistenceService.getRecord<any>('inventory', TENANT, `INV-${WAREHOUSE}-${PRODUCT}`);
    expect(stock1?.onHand).toBe(55);

    // Verify State 1 Reconciliation
    const recon1 = await scmReconciliationEngine.reconcilePO(TENANT, po.poId);
    expect(recon1.totalOrderedQuantity).toBe(100);
    expect(recon1.totalShippedQuantity).toBe(60);
    expect(recon1.totalAcceptedQuantity).toBe(55);
    expect(recon1.totalOpenQuantity).toBe(45); // 100 - 55 = 45 open
    expect(recon1.fulfillmentStatus).toBe('PARTIALLY_RECEIVED');

    // =========================================================================
    // 3. PARTIAL DELIVERY #2: ASN 2 = 40, Shipment 2 = 40
    // =========================================================================
    const asn2 = (await inboundLogisticsEngine.createASN({
      tenantId: TENANT,
      actor: supplierActor,
      poId: po.poId,
      supplierId: SUPPLIER,
      carrier: 'DHL',
      trackingNumber: 'TRK-DHL-BATCH-2',
      shippedDate: new Date().toISOString(),
      expectedArrivalDate: '2026-11-05',
      items: [{ productId: PRODUCT, shippedQuantity: 40 }],
    })).data;

    const shp2 = (await inboundLogisticsEngine.createShipment({
      tenantId: TENANT,
      actor: supplierActor,
      carrier: 'DHL',
      trackingNumber: 'TRK-DHL-BATCH-2',
      origin: 'Supplier Plant',
      destination: WAREHOUSE,
      poId: po.poId,
      asnId: asn2.asnId,
      expectedArrival: '2026-11-05',
      items: [{ productId: PRODUCT, quantity: 40 }],
    })).data;

    // Receiving 2: 40 accepted (0 damaged)
    const rcv2 = (await receivingGRNEngine.recordReceiving({
      tenantId: TENANT,
      actor: dockActor,
      poId: po.poId,
      asnId: asn2.asnId,
      shipmentId: shp2.shipmentId,
      warehouseId: WAREHOUSE,
      receivedItems: [
        {
          productId: PRODUCT,
          receivedQuantity: 40,
          damagedQuantity: 0,
          shortQuantity: 0,
        },
      ],
    })).data;

    // Post GRN 2 with 40 accepted items
    await receivingGRNEngine.postGRN({
      tenantId: TENANT,
      actor: dockActor,
      poId: po.poId,
      receivingId: rcv2.receivingId,
      warehouseId: WAREHOUSE,
      items: [{ productId: PRODUCT, acceptedQuantity: 40, unitCost: 50.0 }],
    });

    // =========================================================================
    // 4. FINAL RECONCILIATION & INVENTORY VERIFICATION
    // =========================================================================
    // Total physical on-hand stock = 55 + 40 = 95
    const finalStock = await scmPersistenceService.getRecord<any>('inventory', TENANT, `INV-${WAREHOUSE}-${PRODUCT}`);
    expect(finalStock?.onHand).toBe(95);

    // Final PO Document Flow Reconciliation
    const finalRecon = await scmReconciliationEngine.reconcilePO(TENANT, po.poId);
    expect(finalRecon.totalOrderedQuantity).toBe(100);
    expect(finalRecon.totalConfirmedQuantity).toBe(100);
    expect(finalRecon.totalShippedQuantity).toBe(100); // 60 + 40
    expect(finalRecon.totalAcceptedQuantity).toBe(95); // 55 + 40
    expect(finalRecon.totalOpenQuantity).toBe(5); // 5 remaining due to damaged items in batch 1
    expect(finalRecon.fulfillmentStatus).toBe('PARTIALLY_RECEIVED');

    // Ensure impossible states never occur
    expect(finalRecon.totalAcceptedQuantity).not.toBe(155);
    expect(finalRecon.totalAcceptedQuantity).not.toBe(100);
    expect(finalRecon.totalOpenQuantity).toBeGreaterThanOrEqual(0);
  });
});
