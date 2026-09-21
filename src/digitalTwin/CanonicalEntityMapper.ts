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
