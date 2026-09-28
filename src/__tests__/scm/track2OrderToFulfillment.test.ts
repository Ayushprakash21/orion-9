/**
 * ORION-9 TRACK 2 — GOLDEN JOURNEY #3: ORDER-TO-FULFILLMENT
 *
 * Full End-to-End Execution:
 * Customer Order Ingestion -> Authoritative ATP Calculation ->
 * Inventory Allocation -> Warehouse Pick & Pack -> Carrier Dispatch ->
 * Delivery Verification -> Exact Quantity Reconciliation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { customerOrderFulfillmentEngine } from '../../scm/CustomerOrderFulfillmentEngine';
import { availableToPromiseEngine } from '../../scm/AvailableToPromiseEngine';
import { scmPersistenceService } from '../../services/scm/ScmPersistenceService';
import { scmReconciliationEngine } from '../../scm/ScmReconciliationEngine';
import { AuthorizationActor } from '../../kernel/authorization/AuthorizationEngine';

describe('Track 2 — Golden Journey #3: Order-to-Fulfillment', () => {
  const TENANT = 'TENANT_SALES_01';
  const WAREHOUSE = 'WH-NORTH-EAST-01';
  const PRODUCT = 'PRD-AI-SERVER-8U';
  const CUSTOMER = 'CUST-HYPERSCALE-CLOUD';

  const salesActor: AuthorizationActor = {
    id: 'sales_rep_01',
    name: 'Alex Sales',
    roles: ['sales_representative'],
    permissions: ['customer_order:create'],
    organizationId: TENANT,
  };

  const fulfillmentActor: AuthorizationActor = {
    id: 'fulfillment_lead_01',
    name: 'Chris Logistics',
    roles: ['fulfillment_manager', 'admin'],
    permissions: ['customer_order:allocate', 'customer_order:fulfill'],
    organizationId: TENANT,
  };

  beforeEach(async () => {
    scmPersistenceService.clear();

    // 0. Seed Warehouse Inventory with 100 units on-hand
    await scmPersistenceService.adjustInventory({
      tenantId: TENANT,
      productId: PRODUCT,
      warehouseId: WAREHOUSE,
      quantityDelta: 100,
      transactionType: 'GRN_RECEIPT',
      referenceEntityType: 'GRN',
      referenceEntityId: 'GRN-INIT-SERVERS',
      actor: 'system',
      correlationId: 'INIT-SERVERS-100',
    });
  });

  it('authoritatively executes complete Order-to-Fulfillment journey with ATP, allocation, fulfillment, and delivery', async () => {
    // =========================================================================
    // STEP 1: Calculate Available-To-Promise (ATP)
    // =========================================================================
    const requestedQty = 40;
    const atpCheck = availableToPromiseEngine.calculateAtp({
      tenantId: TENANT,
      productId: PRODUCT,
      warehouseId: WAREHOUSE,
      requestedQuantity: requestedQty,
      requestedDeliveryDate: '2026-11-15',
      onHandQuantity: 100,
      reservedQuantity: 10,
      confirmedIncomingSupply: 20,
      safetyStockProtected: 10,
    });

    // ATP = (100 - 10) + 20 - 10 = 100 available
    expect(atpCheck.availableToPromiseQuantity).toBe(100);
    expect(atpCheck.fulfillmentStatus).toBe('FULL_PROMISE');
    expect(atpCheck.promisedDeliveryDate).toBe('2026-11-15');

    // =========================================================================
    // STEP 2: Ingest and Create Customer Sales Order
    // =========================================================================
    const orderResult = await customerOrderFulfillmentEngine.createCustomerOrder({
      tenantId: TENANT,
      actor: salesActor,
      customerId: CUSTOMER,
      customerName: 'Hyperscale Cloud Systems Corp',
      shippingAddress: '700 Data Center Blvd, Ashburn, VA 20147',
      deliveryDateRequested: '2026-11-15',
      items: [
        {
          lineId: 'SOLINE-01',
          productId: PRODUCT,
          quantityOrdered: requestedQty,
          quantityAllocated: 0,
          quantityFulfilled: 0,
          unitPrice: 12500.0,
          totalPrice: requestedQty * 12500.0, // $500,000
          warehouseId: WAREHOUSE,
        },
      ],
    });

    expect(orderResult.success).toBe(true);
    const order = orderResult.data;
    expect(order.status).toBe('CONFIRMED');
    expect(order.totalAmount).toBe(540000); // 500,000 + 8% tax

    // =========================================================================
    // STEP 3: Allocate Inventory to Sales Order
    // =========================================================================
    const allocResult = await customerOrderFulfillmentEngine.allocateOrder(
      TENANT,
      order.orderId,
      fulfillmentActor
    );
    expect(allocResult.success).toBe(true);
    expect(allocResult.data?.status).toBe('ALLOCATED');
    expect(allocResult.data?.items[0].quantityAllocated).toBe(40);

    // =========================================================================
    // STEP 4: Fulfill Order (Pick, Pack, Dispatch & Decrement Stock)
    // =========================================================================
    const trackingNo = 'TRK-EXPEDITE-99001122';
    const fulfillResult = await customerOrderFulfillmentEngine.fulfillOrder(
      TENANT,
      order.orderId,
      fulfillmentActor,
      trackingNo
    );

    expect(fulfillResult.success).toBe(true);
    const fulfilledOrder = fulfillResult.data;
    expect(fulfilledOrder?.status).toBe('SHIPPED');
    expect(fulfilledOrder?.trackingNumber).toBe(trackingNo);
    expect(fulfilledOrder?.items[0].quantityFulfilled).toBe(40);

    // Verify physical warehouse stock is decremented from 100 to 60
    const invStock = await scmPersistenceService.getRecord<any>(
      'inventory',
      TENANT,
      `INV-${WAREHOUSE}-${PRODUCT}`
    );
    expect(invStock).toBeDefined();
    expect(invStock?.onHand).toBe(60); // 100 - 40 fulfilled

    // =========================================================================
    // STEP 5: Reconcile Customer Order Document Flow
    // =========================================================================
    const reconciliation = await scmReconciliationEngine.reconcileCustomerOrder(
      TENANT,
      order.orderId
    );
    expect(reconciliation.totalOrdered).toBe(40);
    expect(reconciliation.totalShipped).toBe(40);
    expect(reconciliation.lines[0].openQuantity).toBe(0);
    expect(reconciliation.fulfillmentStatus).toBe('IN_TRANSIT');
  });
});
