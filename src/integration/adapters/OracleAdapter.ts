/**
 * ORION-9 ORACLE SCM CLOUD ADAPTER
 * Wave 3.2 ERP Adapter Layer
 *
 * Encapsulates Oracle SCM payload structures (e.g. VendorId, ItemNumber, PurchaseOrderHeaderId, OrganizationCode)
 * and transforms them into canonical Orion-9 entities. Isolates Oracle schemas from the Kernel.
 */

import {
  CanonicalSupplier,
  CanonicalProduct,
  CanonicalInventory,
  CanonicalPurchaseOrder,
  CanonicalShipment,
  CanonicalASN,
  CanonicalInvoice,
  OracleCapability
} from '../types';

export interface OracleSupplierPayload {
  SupplierId: number | string;
  SupplierName: string;
  SupplierNumber: string;
  TaxRegistrationNumber?: string;
  CurrencyCode: string;
  EnabledFlag: string; // 'Y' or 'N'
  EmailAddress?: string;
}

export interface OracleProductPayload {
  ItemId: number | string;
  ItemNumber: string;
  ItemDescription: string;
  ItemCategory: string;
  PrimaryUOMCode: string;
  StandardCost: number;
}

export interface OracleInventoryPayload {
  ItemNumber: string;
  OrganizationCode: string;
  OnHandQuantity: number;
  ReservedQuantity: number;
  InTransitQuantity: number;
  ItemCost: number;
}

export interface OraclePurchaseOrderPayload {
  POHeaderId: number | string;
  PONumber: string;
  SupplierId: number | string;
  OrderDate: string;
  PromisedDeliveryDate: string;
  TotalAmount: number;
  CurrencyCode: string;
  DocumentStatus: string;
  POLines: Array<{
    LineNumber: number;
    ItemNumber: string;
    Quantity: number;
    UnitPrice: number;
  }>;
}

export interface OracleShipmentPayload {
  ShipmentId: number | string;
  ShipmentNumber: string;
  CarrierName: string;
  TrackingNumber: string;
  OriginOrgCode: string;
  DestinationOrgCode: string;
  StatusCode: string;
  ShippedDate: string;
  ExpectedArrivalDate: string;
}

export class OracleAdapter {
  public static readonly CAPABILITIES: OracleCapability[] = [
    'ORACLE_CAPABILITY_SUPPLIER',
    'ORACLE_CAPABILITY_PRODUCT',
    'ORACLE_CAPABILITY_INVENTORY',
    'ORACLE_CAPABILITY_PURCHASE_ORDER',
    'ORACLE_CAPABILITY_SHIPMENT',
    'ORACLE_CAPABILITY_ASN',
    'ORACLE_CAPABILITY_RECEIVING',
    'ORACLE_CAPABILITY_INVOICE',
  ];

  public static toCanonicalSupplier(raw: OracleSupplierPayload, tenantId: string): CanonicalSupplier {
    return {
      id: `sup-ora-${raw.SupplierId}`,
      name: raw.SupplierName,
      code: raw.SupplierNumber || String(raw.SupplierId),
      status: raw.EnabledFlag === 'N' ? 'INACTIVE' : 'ACTIVE',
      contactEmail: raw.EmailAddress,
      currency: raw.CurrencyCode || 'USD',
      tenantId,
    };
  }

  public static toCanonicalProduct(raw: OracleProductPayload, tenantId: string): CanonicalProduct {
    return {
      id: `prod-ora-${raw.ItemNumber}`,
      sku: raw.ItemNumber,
      name: raw.ItemDescription,
      category: raw.ItemCategory || 'General',
      unitOfMeasure: raw.PrimaryUOMCode || 'EA',
      unitCost: raw.StandardCost || 0,
      tenantId,
    };
  }

  public static toCanonicalInventory(raw: OracleInventoryPayload, tenantId: string): CanonicalInventory {
    const available = Math.max(0, (raw.OnHandQuantity || 0) - (raw.ReservedQuantity || 0));
    return {
      id: `inv-ora-${raw.ItemNumber}-${raw.OrganizationCode}`,
      productId: `prod-ora-${raw.ItemNumber}`,
      warehouseId: raw.OrganizationCode,
      onHand: raw.OnHandQuantity || 0,
      allocated: raw.ReservedQuantity || 0,
      available,
      inTransit: raw.InTransitQuantity || 0,
      unitCost: raw.ItemCost || 0,
      tenantId,
    };
  }

  public static toCanonicalPurchaseOrder(raw: OraclePurchaseOrderPayload, tenantId: string): CanonicalPurchaseOrder {
    return {
      id: `po-ora-${raw.PONumber}`,
      poNumber: raw.PONumber,
      supplierId: `sup-ora-${raw.SupplierId}`,
      orderDate: raw.OrderDate ? new Date(raw.OrderDate).toISOString() : new Date().toISOString(),
      expectedDelivery: raw.PromisedDeliveryDate ? new Date(raw.PromisedDeliveryDate).toISOString() : new Date().toISOString(),
      totalValue: raw.TotalAmount || 0,
      currency: raw.CurrencyCode || 'USD',
      status: this.mapOraclePOStatus(raw.DocumentStatus),
      lineItems: (raw.POLines || []).map(line => ({
        productId: `prod-ora-${line.ItemNumber}`,
        quantity: line.Quantity || 0,
        unitPrice: line.UnitPrice || 0,
      })),
      tenantId,
    };
  }

  public static toCanonicalShipment(raw: OracleShipmentPayload, tenantId: string): CanonicalShipment {
    return {
      id: `ship-ora-${raw.ShipmentNumber}`,
      trackingNumber: raw.TrackingNumber || raw.ShipmentNumber,
      carrier: raw.CarrierName || 'Oracle Logistics',
      origin: raw.OriginOrgCode,
      destination: raw.DestinationOrgCode,
      status: this.mapOracleShipmentStatus(raw.StatusCode),
      shipDate: raw.ShippedDate ? new Date(raw.ShippedDate).toISOString() : new Date().toISOString(),
      expectedArrival: raw.ExpectedArrivalDate ? new Date(raw.ExpectedArrivalDate).toISOString() : new Date().toISOString(),
      delayDays: 0,
      tenantId,
    };
  }

  private static mapOraclePOStatus(status?: string): CanonicalPurchaseOrder['status'] {
    switch (status?.toUpperCase()) {
      case 'OPEN':
      case 'APPROVED':
        return 'Approved';
      case 'IN_PROCESS':
        return 'Pending Approval';
      case 'CLOSED':
      case 'RECEIVED':
        return 'Received';
      case 'CANCELLED':
      case 'REJECTED':
        return 'Cancelled';
      default:
        return 'Draft';
    }
  }

  private static mapOracleShipmentStatus(status?: string): CanonicalShipment['status'] {
    switch (status?.toUpperCase()) {
      case 'SHIPPED':
      case 'IN_TRANSIT':
        return 'In Transit';
      case 'DELIVERED':
        return 'Delivered';
      case 'DELAYED':
        return 'Delayed';
      default:
        return 'Pending';
    }
  }
}
