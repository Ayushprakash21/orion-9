/**
 * ORION-9 PART 4 TRACK 2 — CUSTOMER ORDER & FULFILLMENT ENGINE
 * Authoritatively persisted via Cloud Firestore (customer_orders) & ScmPersistenceService.
 * Controls order allocation, picking, packing, and inventory stock decrement upon fulfillment.
 */

import { scmTransactionEngine } from '../kernel/scm/ScmTransactionEngine';
import { AuthorizationActor } from '../kernel/authorization/AuthorizationEngine';
import { scmPersistenceService } from '../services/scm/ScmPersistenceService';
import { CustomerOrderLineItem, CustomerOrderRecord } from './types';

export class CustomerOrderFulfillmentEngine {
  private static instance: CustomerOrderFulfillmentEngine;
  private orders: Map<string, CustomerOrderRecord> = new Map();

  private constructor() {}

  public static getInstance(): CustomerOrderFulfillmentEngine {
    if (!CustomerOrderFulfillmentEngine.instance) {
      CustomerOrderFulfillmentEngine.instance = new CustomerOrderFulfillmentEngine();
    }
    return CustomerOrderFulfillmentEngine.instance;
  }

  public async createCustomerOrder(params: {
    tenantId: string;
    actor: AuthorizationActor;
    customerId: string;
    customerName: string;
    items: CustomerOrderLineItem[];
    shippingAddress: string;
    deliveryDateRequested: string;
  }) {
    const orderId = `SO-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const orderNumber = `SO-500${Math.floor(Math.random() * 9000 + 1000)}`;
    const now = new Date().toISOString();

    const subtotal = params.items.reduce((acc, i) => acc + i.totalPrice, 0);
    const taxAmount = Math.round(subtotal * 0.08 * 100) / 100;
    const totalAmount = subtotal + taxAmount;

    const record: CustomerOrderRecord = {
      orderId,
      tenantId: params.tenantId,
      orderNumber,
      customerId: params.customerId,
      customerName: params.customerName,
      items: params.items,
      subtotal,
      taxAmount,
      totalAmount,
      shippingAddress: params.shippingAddress,
      deliveryDateRequested: params.deliveryDateRequested,
      status: 'CONFIRMED',
      createdBy: params.actor.id,
      createdAt: now,
      updatedAt: now,
    };

    return scmTransactionEngine.executeCommand({
      commandName: 'CustomerOrder:Create',
      tenantId: params.tenantId,
      actor: params.actor,
      entityType: 'CustomerOrder',
      entityId: orderId,
      targetState: 'CONFIRMED',
      requiredPermission: 'customer_order:create',
      estimatedValue: totalAmount,
      payload: record,
    }, async (rec) => {
      this.orders.set(`${params.tenantId}:${orderId}`, rec);
      await scmPersistenceService.saveRecord('customer_orders', orderId, rec);
      return rec;
    });
  }

  public async allocateOrder(tenantId: string, orderId: string, actor: AuthorizationActor) {
    const key = `${tenantId}:${orderId}`;
    const order = this.orders.get(key) || scmPersistenceService.getCachedRecord<CustomerOrderRecord>('customer_orders', tenantId, orderId);
    if (!order) throw new Error(`Customer Order ${orderId} not found`);

    return scmTransactionEngine.executeCommand({
      commandName: 'CustomerOrder:Allocate',
      tenantId,
      actor,
      entityType: 'CustomerOrder',
      entityId: orderId,
      currentState: order.status,
      targetState: 'ALLOCATED',
      requiredPermission: 'customer_order:allocate',
      payload: null,
    }, async () => {
      for (const item of order.items) {
        item.quantityAllocated = item.quantityOrdered;
      }
      order.status = 'ALLOCATED';
      order.allocationDate = new Date().toISOString();
      order.updatedAt = new Date().toISOString();
      this.orders.set(key, order);
      await scmPersistenceService.saveRecord('customer_orders', orderId, order);
      return order;
    });
  }

  public async fulfillOrder(tenantId: string, orderId: string, actor: AuthorizationActor, trackingNumber?: string) {
    const key = `${tenantId}:${orderId}`;
    const order = this.orders.get(key) || scmPersistenceService.getCachedRecord<CustomerOrderRecord>('customer_orders', tenantId, orderId);
    if (!order) throw new Error(`Customer Order ${orderId} not found`);

    return scmTransactionEngine.executeCommand({
      commandName: 'CustomerOrder:Fulfill',
      tenantId,
      actor,
      entityType: 'CustomerOrder',
      entityId: orderId,
      currentState: order.status,
      targetState: 'SHIPPED',
      requiredPermission: 'customer_order:fulfill',
      payload: null,
    }, async () => {
      const now = new Date().toISOString();
      order.status = 'SHIPPED';
      order.fulfilledDate = now;
      order.shippedDate = now;
      order.trackingNumber = trackingNumber || `TRK-SO-${Date.now().toString(36).toUpperCase()}`;
      order.updatedAt = now;

      // Decrement physical warehouse stock for each fulfilled item and post transaction
      for (const item of order.items) {
        item.quantityFulfilled = item.quantityOrdered;
        await scmPersistenceService.adjustInventory({
          tenantId,
          productId: item.productId,
          warehouseId: item.warehouseId,
          quantityDelta: -item.quantityFulfilled,
          transactionType: 'ORDER_FULFILLMENT',
          referenceEntityType: 'CUSTOMER_ORDER',
          referenceEntityId: orderId,
          actor: actor.id,
          correlationId: `CORR-SO-${orderId}`,
        });
      }

      this.orders.set(key, order);
      await scmPersistenceService.saveRecord('customer_orders', orderId, order);
      return order;
    });
  }

  public getOrder(tenantId: string, orderId: string): CustomerOrderRecord | undefined {
    return this.orders.get(`${tenantId}:${orderId}`) || scmPersistenceService.getCachedRecord<CustomerOrderRecord>('customer_orders', tenantId, orderId);
  }

  public listOrders(tenantId: string): CustomerOrderRecord[] {
    const result: CustomerOrderRecord[] = [];
    for (const [key, ord] of this.orders.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        result.push({ ...ord });
      }
    }
    if (result.length === 0) {
      return scmPersistenceService.listCachedRecords<CustomerOrderRecord>('customer_orders', tenantId);
    }
    return result;
  }

  public clear(): void {
    this.orders.clear();
    scmPersistenceService.clear('customer_orders');
  }
}

export const customerOrderFulfillmentEngine = CustomerOrderFulfillmentEngine.getInstance();
