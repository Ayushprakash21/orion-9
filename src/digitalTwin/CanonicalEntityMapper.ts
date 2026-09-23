/**
 * ORION-9 WAVE 8: ENTERPRISE DIGITAL TWIN + SCENARIO INTELLIGENCE + SIMULATION
 * Canonical Entity Mapper & Adapter
 * 
 * Ingests and adapts canonical Orion entities (Product, Inventory, PO, Shipment, Supplier, etc.)
 * into standardized TwinEntity domain representations without duplicating authoritative models.
 */

import { TwinEntity, TwinEntityType } from './types';
import { Product, Inventory, PurchaseOrder, Shipment, Supplier } from '../types';

export class CanonicalEntityMapper {
  private static instance: CanonicalEntityMapper;

  public static getInstance(): CanonicalEntityMapper {
    if (!CanonicalEntityMapper.instance) {
      CanonicalEntityMapper.instance = new CanonicalEntityMapper();
    }
    return CanonicalEntityMapper.instance;
  }

  public fromProduct(product: Product, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapProduct(product, tenantId);
  }

  public fromInventory(inventory: Inventory, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapInventory(inventory, tenantId);
  }

  public fromPurchaseOrder(po: PurchaseOrder, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapPurchaseOrder(po, tenantId);
  }

  public fromShipment(shipment: Shipment, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapShipment(shipment, tenantId);
  }

  public fromSupplier(supplier: Supplier, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapSupplier(supplier, tenantId);
  }

  public fromCustomerOrder(order: any, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapCustomerOrder(order, tenantId);
  }

  public fromASN(asn: any, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapASN(asn, tenantId);
  }

  public fromGRN(grn: any, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapGRN(grn, tenantId);
  }

  public fromQualityInspection(inspection: any, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapQualityInspection(inspection, tenantId);
  }

  public fromInvoice(invoice: any, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapInvoice(invoice, tenantId);
  }

  public fromPaymentHandoff(handoff: any, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapPaymentHandoff(handoff, tenantId);
  }

  public fromPurchaseRequisition(pr: any, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapPurchaseRequisition(pr, tenantId);
  }

  public fromDemandPlan(plan: any, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapDemandPlan(plan, tenantId);
  }

  public fromWarehouse(warehouse: any, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapWarehouse(warehouse, tenantId);
  }

  public fromCustomer(customer: any, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapCustomer(customer, tenantId);
  }

  public mapProduct(product: Product, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapProduct(product, tenantId);
  }

  public mapInventory(inventory: Inventory, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapInventory(inventory, tenantId);
  }

  public mapPurchaseOrder(po: PurchaseOrder, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapPurchaseOrder(po, tenantId);
  }

  public mapShipment(shipment: Shipment, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapShipment(shipment, tenantId);
  }

  public mapSupplier(supplier: Supplier, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapSupplier(supplier, tenantId);
  }

  public mapCustomerOrder(order: any, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapCustomerOrder(order, tenantId);
  }

  public mapASN(asn: any, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapASN(asn, tenantId);
  }

  public mapGRN(grn: any, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapGRN(grn, tenantId);
  }

  public mapQualityInspection(inspection: any, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapQualityInspection(inspection, tenantId);
  }

  public mapInvoice(invoice: any, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapInvoice(invoice, tenantId);
  }

  public mapPaymentHandoff(handoff: any, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapPaymentHandoff(handoff, tenantId);
  }

  public mapPurchaseRequisition(pr: any, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapPurchaseRequisition(pr, tenantId);
  }

  public mapDemandPlan(plan: any, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapDemandPlan(plan, tenantId);
  }

  public mapWarehouse(warehouse: any, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapWarehouse(warehouse, tenantId);
  }

  public mapCustomer(customer: any, tenantId: string): TwinEntity {
    return CanonicalEntityMapper.mapCustomer(customer, tenantId);
  }

  public static mapProduct(product: Product, tenantId: string): TwinEntity {
    const rawProd = product as any;
    const attrs = {
      sku: rawProd.sku || product.id,
      category: product.category,
      unitPrice: rawProd.unitPrice || product.unitCost || product.sellingPrice || 0,
      costPrice: rawProd.costPrice || product.unitCost || 0,
      safetyStock: product.safetyStock,
      reorderPoint: product.reorderPoint,
      leadTime: product.leadTime,
    };
    return {
      entityId: product.id,
      id: product.id,
      tenantId,
      entityType: 'PRODUCT',
      type: 'PRODUCT',
      name: product.name,
      canonicalName: product.name,
      properties: attrs,
      attributes: attrs,
      state: attrs,
      riskScore: 0,
      status: 'ACTIVE',
      lastUpdated: new Date().toISOString(),
    } as any;
  }

  public static mapInventory(inventory: Inventory, tenantId: string): TwinEntity {
    const available = (inventory.onHand || 0) - (inventory.reserved || 0);
    const attrs = {
      sku: inventory.productId,
      productId: inventory.productId,
      warehouseId: inventory.warehouseId,
      onHand: inventory.onHand,
      reserved: inventory.reserved,
      allocated: inventory.reserved,
      available,
      safetyStock: inventory.safetyStock,
      reorderPoint: inventory.reorderPoint,
      unitCost: inventory.unitCost,
      averageDailyDemand: inventory.averageDailyDemand || 10,
      leadTime: inventory.leadTime || 14,
    };
    return {
      entityId: inventory.id,
      id: inventory.id,
      tenantId,
      entityType: 'INVENTORY',
      type: 'INVENTORY',
      name: inventory.productId || inventory.id,
      canonicalName: inventory.productId || inventory.id,
      properties: attrs,
      attributes: attrs,
      state: attrs,
      riskScore: available < inventory.safetyStock ? 75 : 15,
      status: 'ACTIVE',
      lastUpdated: new Date().toISOString(),
    } as any;
  }

  public static mapPurchaseOrder(po: PurchaseOrder, tenantId: string): TwinEntity {
    const rawPo = po as any;
    const attrs = {
      supplierId: po.supplierId,
      orderNumber: rawPo.orderNumber || po.id,
      totalAmount: rawPo.totalAmount ?? po.totalValue,
      totalValue: po.totalValue,
      currency: po.currency || 'USD',
      buyerId: rawPo.buyerId || 'BUYER-01',
      items: rawPo.items || po.lines,
    };
    return {
      entityId: po.id,
      id: po.id,
      tenantId,
      entityType: 'PURCHASE_ORDER',
      type: 'PURCHASE_ORDER',
      name: rawPo.orderNumber || po.id,
      canonicalName: rawPo.orderNumber || po.id,
      properties: attrs,
      attributes: attrs,
      state: attrs,
      riskScore: po.status === 'Cancelled' ? 80 : 20,
      status: po.status || 'CONFIRMED',
      lastUpdated: new Date().toISOString(),
    } as any;
  }

  public static mapShipment(shipment: Shipment, tenantId: string): TwinEntity {
    const attrs = {
      origin: shipment.origin,
      destination: shipment.destination,
      carrier: shipment.carrier,
      trackingNumber: shipment.trackingNumber,
      delayDays: shipment.delayDays || 0,
      freightCost: shipment.freightCost,
    };
    return {
      entityId: shipment.id,
      id: shipment.id,
      tenantId,
      entityType: 'SHIPMENT',
      type: 'SHIPMENT',
      name: shipment.trackingNumber || shipment.id,
      canonicalName: shipment.trackingNumber || shipment.id,
      properties: attrs,
      attributes: attrs,
      state: attrs,
      riskScore: (shipment.delayDays || 0) > 3 ? 85 : (shipment.delayDays || 0) > 0 ? 50 : 10,
      status: shipment.status || 'IN_TRANSIT',
      lastUpdated: new Date().toISOString(),
    } as any;
  }

  public static mapSupplier(supplier: Supplier, tenantId: string): TwinEntity {
    const rawSup = supplier as any;
    const attrs = {
      name: supplier.name,
      otif: supplier.otif,
      qualityRate: supplier.qualityRate,
      leadTime: supplier.leadTime,
      spend: supplier.spend,
      riskScore: rawSup.riskScore ?? (supplier.score ? 100 - supplier.score : 25),
    };
    return {
      entityId: supplier.id,
      id: supplier.id,
      tenantId,
      entityType: 'SUPPLIER',
      type: 'SUPPLIER',
      name: supplier.name,
      canonicalName: supplier.name,
      properties: attrs,
      attributes: attrs,
      state: attrs,
      riskScore: rawSup.riskScore ?? 25,
      status: supplier.status || 'ACTIVE',
      lastUpdated: new Date().toISOString(),
    } as any;
  }

  public static mapCustomerOrder(order: any, tenantId: string): TwinEntity {
    const attrs = {
      ...order,
      orderNumber: order.orderNumber || order.id,
      customerId: order.customerId,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      subtotal: order.subtotal,
      deliveryDateRequested: order.deliveryDateRequested,
      items: order.items || [],
      shippingAddress: order.shippingAddress,
      priority: order.priority || 'STANDARD',
    };
    return {
      entityId: order.orderId || order.id,
      id: order.orderId || order.id,
      tenantId,
      entityType: 'CUSTOMER_ORDER',
      type: 'CUSTOMER_ORDER',
      name: order.orderNumber || order.id,
      canonicalName: order.orderNumber || order.id,
      properties: attrs,
      attributes: attrs,
      state: attrs,
      riskScore: order.status === 'CANCELLED' ? 85 : 10,
      status: order.status || 'CONFIRMED',
      sourceSystem: 'SCM_CORE',
      sourceEntityId: order.orderId || order.id,
      statePlane: 'CURRENT_STATE',
      relationships: [order.customerId].filter(Boolean),
      lastUpdated: order.updatedAt || new Date().toISOString(),
    } as any;
  }

  public static mapASN(asn: any, tenantId: string): TwinEntity {
    const attrs = {
      ...asn,
      asnNumber: asn.asnNumber || asn.id,
      poId: asn.poId || asn.purchaseOrderId,
      purchaseOrderId: asn.purchaseOrderId || asn.poId,
      supplierId: asn.supplierId,
      shipmentId: asn.shipmentId,
      carrier: asn.carrier || asn.carrierId,
      carrierId: asn.carrierId || asn.carrier,
      trackingNumber: asn.trackingNumber,
      shippedDate: asn.shippedDate || asn.shipmentDate,
      expectedArrivalDate: asn.expectedArrivalDate || asn.estimatedDeliveryDate,
      items: asn.items || [],
      status: asn.status || 'VALIDATED',
    };
    return {
      entityId: asn.asnId || asn.id,
      id: asn.asnId || asn.id,
      tenantId,
      entityType: 'ASN',
      type: 'ASN',
      name: asn.asnNumber || asn.id,
      canonicalName: asn.asnNumber || asn.id,
      properties: attrs,
      attributes: attrs,
      state: attrs,
      riskScore: asn.status === 'REJECTED' ? 90 : 15,
      status: asn.status || 'VALIDATED',
      sourceSystem: 'SCM_CORE',
      sourceEntityId: asn.asnId || asn.id,
      statePlane: 'CURRENT_STATE',
      relationships: [asn.purchaseOrderId || asn.poId, asn.supplierId, asn.carrierId || asn.carrier].filter(Boolean),
      lastUpdated: asn.updatedAt || new Date().toISOString(),
    } as any;
  }

  public static mapGRN(grn: any, tenantId: string): TwinEntity {
    const attrs = {
      ...grn,
      grnNumber: grn.grnNumber || grn.id,
      poId: grn.poId || grn.purchaseOrderId,
      purchaseOrderId: grn.purchaseOrderId || grn.poId,
      supplierId: grn.supplierId,
      warehouseId: grn.warehouseId,
      receiptDate: grn.receiptDate,
      status: grn.status,
      totalItemsReceived: grn.totalItemsReceived ?? (grn.items ? grn.items.reduce((sum: number, it: any) => sum + (it.quantityReceived || 0), 0) : 0),
      items: grn.items || [],
    };
    return {
      entityId: grn.grnId || grn.id,
      id: grn.grnId || grn.id,
      tenantId,
      entityType: 'GRN',
      type: 'GRN',
      name: grn.grnNumber || grn.id,
      canonicalName: grn.grnNumber || grn.id,
      properties: attrs,
      attributes: attrs,
      state: attrs,
      riskScore: grn.status === 'REJECTED' ? 95 : 10,
      status: grn.status || 'ACCEPTED',
      sourceSystem: 'SCM_CORE',
      sourceEntityId: grn.grnId || grn.id,
      statePlane: 'CURRENT_STATE',
      relationships: [grn.purchaseOrderId || grn.poId, grn.warehouseId].filter(Boolean),
      lastUpdated: grn.updatedAt || new Date().toISOString(),
    } as any;
  }

  public static mapQualityInspection(inspection: any, tenantId: string): TwinEntity {
    const attrs = {
      ...inspection,
      poId: inspection.poId || inspection.purchaseOrderId,
      purchaseOrderId: inspection.purchaseOrderId || inspection.poId,
      grnId: inspection.grnId,
      productId: inspection.productId,
      decision: inspection.decision,
      defectRate: inspection.defectRate,
      sampleSize: inspection.sampleSize,
      defectsFound: inspection.defectsFound,
      status: inspection.status || inspection.decision || 'PENDING',
    };
    return {
      entityId: inspection.inspectionId || inspection.id,
      id: inspection.inspectionId || inspection.id,
      tenantId,
      entityType: 'QUALITY_INSPECTION',
      type: 'QUALITY_INSPECTION',
      name: `QC-${inspection.productId || inspection.id}`,
      canonicalName: `QC-${inspection.productId || inspection.id}`,
      properties: attrs,
      attributes: attrs,
      state: attrs,
      riskScore: inspection.decision === 'REJECTED' ? 90 : 15,
      status: inspection.status || inspection.decision || 'PENDING',
      sourceSystem: 'SCM_CORE',
      sourceEntityId: inspection.inspectionId || inspection.id,
      statePlane: 'CURRENT_STATE',
      relationships: [inspection.grnId, inspection.purchaseOrderId || inspection.poId].filter(Boolean),
      lastUpdated: inspection.updatedAt || new Date().toISOString(),
    } as any;
  }

  public static mapInvoice(invoice: any, tenantId: string): TwinEntity {
    const isMatched = invoice.isThreeWayMatched ?? (invoice.status === 'MATCHED_3_WAY' || invoice.matchStatus === 'MATCHED');
    const attrs = {
      ...invoice,
      invoiceNumber: invoice.invoiceNumber || invoice.id,
      poId: invoice.poId || invoice.purchaseOrderId,
      purchaseOrderId: invoice.purchaseOrderId || invoice.poId,
      grnId: invoice.grnId,
      invoiceAmount: invoice.invoiceAmount || invoice.totalAmount,
      currency: invoice.currency || 'USD',
      matchStatus: invoice.matchStatus || invoice.status,
      discrepancyReasons: invoice.discrepancyReasons || [],
      isThreeWayMatched: isMatched,
    };
    return {
      entityId: invoice.invoiceId || invoice.id,
      id: invoice.invoiceId || invoice.id,
      tenantId,
      entityType: 'INVOICE',
      type: 'INVOICE',
      name: invoice.invoiceNumber || invoice.id,
      canonicalName: invoice.invoiceNumber || invoice.id,
      properties: attrs,
      attributes: attrs,
      state: attrs,
      riskScore: invoice.status === 'BLOCKED' || invoice.status === 'DISCREPANT' ? 80 : 10,
      status: invoice.status || 'MATCHED',
      sourceSystem: 'SCM_CORE',
      sourceEntityId: invoice.invoiceId || invoice.id,
      statePlane: 'CURRENT_STATE',
      relationships: [invoice.purchaseOrderId || invoice.poId, invoice.supplierId].filter(Boolean),
      lastUpdated: invoice.updatedAt || new Date().toISOString(),
    } as any;
  }

  public static mapPaymentHandoff(handoff: any, tenantId: string): TwinEntity {
    const attrs = {
      ...handoff,
      invoiceId: handoff.invoiceId,
      poId: handoff.poId,
      supplierId: handoff.supplierId,
      amount: handoff.amount,
      scheduledDate: handoff.scheduledDate,
      bankReference: handoff.bankReference,
    };
    return {
      entityId: handoff.handoffId || handoff.id,
      id: handoff.handoffId || handoff.id,
      tenantId,
      entityType: 'PAYMENT_HANDOFF',
      type: 'PAYMENT_HANDOFF',
      name: `PAY-${handoff.invoiceId || handoff.id}`,
      canonicalName: `PAY-${handoff.invoiceId || handoff.id}`,
      properties: attrs,
      attributes: attrs,
      state: attrs,
      riskScore: handoff.status === 'FAILED' ? 85 : 5,
      status: handoff.status || 'RELEASED',
      sourceSystem: 'SCM_CORE',
      sourceEntityId: handoff.handoffId || handoff.id,
      statePlane: 'CURRENT_STATE',
      relationships: [handoff.invoiceId, handoff.poId, handoff.supplierId].filter(Boolean),
      lastUpdated: handoff.updatedAt || new Date().toISOString(),
    } as any;
  }

  public static mapPurchaseRequisition(pr: any, tenantId: string): TwinEntity {
    const attrs = {
      ...pr,
      requisitionNumber: pr.requisitionNumber || pr.prNumber || pr.id,
      title: pr.title,
      totalEstimatedAmount: pr.totalEstimatedAmount || pr.estimatedTotal,
      estimatedTotal: pr.estimatedTotal || pr.totalEstimatedAmount,
      departmentId: pr.departmentId,
      items: pr.items || [],
      status: pr.status || 'DRAFT',
    };
    return {
      entityId: pr.requisitionId || pr.id,
      id: pr.requisitionId || pr.id,
      tenantId,
      entityType: 'PURCHASE_REQUISITION',
      type: 'PURCHASE_REQUISITION',
      name: pr.requisitionNumber || pr.prNumber || pr.id,
      canonicalName: pr.requisitionNumber || pr.prNumber || pr.id,
      properties: attrs,
      attributes: attrs,
      state: attrs,
      riskScore: 10,
      status: pr.status || 'DRAFT',
      sourceSystem: 'SCM_CORE',
      sourceEntityId: pr.requisitionId || pr.id,
      statePlane: 'CURRENT_STATE',
      relationships: [pr.departmentId].filter(Boolean),
      lastUpdated: pr.updatedAt || new Date().toISOString(),
    } as any;
  }

  public static mapDemandPlan(plan: any, tenantId: string): TwinEntity {
    const attrs = {
      title: plan.title,
      horizonStart: plan.horizonStart,
      horizonEnd: plan.horizonEnd,
      items: plan.items || [],
    };
    return {
      entityId: plan.planId || plan.id,
      id: plan.planId || plan.id,
      tenantId,
      entityType: 'DEMAND_PLAN',
      type: 'DEMAND_PLAN',
      name: plan.title || plan.id,
      canonicalName: plan.title || plan.id,
      properties: attrs,
      attributes: attrs,
      state: attrs,
      riskScore: plan.status === 'REJECTED' ? 70 : 10,
      status: plan.status || 'APPROVED',
      sourceSystem: 'SCM_CORE',
      sourceEntityId: plan.planId || plan.id,
      statePlane: 'CURRENT',
      lastUpdated: plan.updatedAt || new Date().toISOString(),
    } as any;
  }

  public static mapWarehouse(warehouse: any, tenantId: string): TwinEntity {
    const attrs = {
      code: warehouse.code || warehouse.id,
      location: warehouse.location || warehouse.region,
      capacity: warehouse.capacity,
      currentUtilization: warehouse.currentUtilization || 0.75,
    };
    return {
      entityId: warehouse.id || warehouse.code,
      id: warehouse.id || warehouse.code,
      tenantId,
      entityType: 'WAREHOUSE',
      type: 'WAREHOUSE',
      name: warehouse.name || warehouse.code || warehouse.id,
      canonicalName: warehouse.name || warehouse.code || warehouse.id,
      properties: attrs,
      attributes: attrs,
      state: attrs,
      riskScore: (warehouse.currentUtilization || 0) > 0.9 ? 80 : 15,
      status: 'ACTIVE',
      sourceSystem: 'SCM_CORE',
      sourceEntityId: warehouse.id || warehouse.code,
      statePlane: 'CURRENT',
      lastUpdated: new Date().toISOString(),
    } as any;
  }

  public static mapCustomer(customer: any, tenantId: string): TwinEntity {
    const attrs = {
      customerCode: customer.customerCode || customer.id,
      industry: customer.industry,
      region: customer.region,
      creditLimit: customer.creditLimit,
    };
    return {
      entityId: customer.id || customer.customerCode,
      id: customer.id || customer.customerCode,
      tenantId,
      entityType: 'CUSTOMER',
      type: 'CUSTOMER',
      name: customer.name || customer.id,
      canonicalName: customer.name || customer.id,
      properties: attrs,
      attributes: attrs,
      state: attrs,
      riskScore: 10,
      status: 'ACTIVE',
      sourceSystem: 'SCM_CORE',
      sourceEntityId: customer.id || customer.customerCode,
      statePlane: 'CURRENT',
      lastUpdated: new Date().toISOString(),
    } as any;
  }

  public static mapGenericEntity(
    id: string,
    tenantId: string,
    entityType: TwinEntityType,
    name: string,
    properties: Record<string, any>,
    riskScore: number = 0,
    status: string = 'ACTIVE'
  ): TwinEntity {
    return {
      entityId: id,
      id,
      tenantId,
      entityType,
      type: entityType,
      name,
      canonicalName: name,
      properties,
      attributes: properties,
      state: properties,
      riskScore,
      status,
      lastUpdated: new Date().toISOString(),
    } as any;
  }
}

export const canonicalEntityMapper = CanonicalEntityMapper.getInstance();
