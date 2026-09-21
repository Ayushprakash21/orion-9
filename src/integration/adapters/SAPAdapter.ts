/**
 * ORION-9 SAP S/4HANA ADAPTER
 * Wave 3.2 ERP Adapter Layer
 *
 * Encapsulates SAP-specific BAPI/IDoc payloads (e.g. LIFNR, MATNR, EBELN, WERKS, MEINS)
 * and transforms them into canonical Orion-9 entities. Isolates SAP schema details from the Kernel.
 */

import {
  CanonicalSupplier,
  CanonicalProduct,
  CanonicalInventory,
  CanonicalPurchaseOrder,
  CanonicalASN,
  CanonicalInvoice,
  SAPCapability
} from '../types';

export interface SAPVendorPayload {
  LIFNR: string; // Vendor Number
  NAME1: string; // Vendor Name
  LAND1?: string; // Country
  STCEG?: string; // VAT Registration
  WAERS: string; // Currency
  LOEKZ?: string; // Deletion Indicator
  SMTP_ADDR?: string; // Email
}

export interface SAPMaterialPayload {
  MATNR: string; // Material Number
  MAKTX: string; // Material Description
  MATKL: string; // Material Group/Category
  MEINS: string; // Base Unit of Measure
  STPRS: number; // Standard Price / Unit Cost
}

export interface SAPStockPayload {
  MATNR: string;
  WERKS: string; // Plant / Warehouse ID
  LABST: number; // Unrestricted Stock
  INSME: number; // Quality Inspection Stock
  SPEME: number; // Blocked Stock
  STPRS: number;
}

export interface SAPPurchaseOrderPayload {
  EBELN: string; // PO Number
  LIFNR: string; // Vendor Number
  AEDAT: string; // Creation Date
  EINDT: string; // Delivery Date
  NETWR: number; // Net Amount
  WAERS: string; // Currency
  STATU: string; // PO Status
  ITEMS: Array<{
    EBELP: string; // Item Number
    MATNR: string;
    MENGE: number; // Quantity
    NETPR: number; // Price
  }>;
}

export interface SAPASNPayload {
  VBELN: string; // Delivery / ASN Number
  EBELN: string; // PO Number
  LIFNR: string;
  WADAT: string; // Dispatch Date
  LFDAT: string; // Delivery Date
  ANZPK: number; // Package Count
  STATUS: string;
}

export interface SAPInvoicePayload {
  BELNR: string; // Document Number
  GJBJA: string; // Fiscal Year
  EBELN: string; // PO Reference
  LIFNR: string;
  WRBTR: number; // Invoice Amount
  WAERS: string;
  WMWST: number; // Tax Amount
  ZFBDT: string; // Due Date
  STATUS: string;
}

export class SAPAdapter {
  public static readonly CAPABILITIES: SAPCapability[] = [
    'SAP_CAPABILITY_SUPPLIER',
    'SAP_CAPABILITY_MATERIAL',
    'SAP_CAPABILITY_INVENTORY',
    'SAP_CAPABILITY_PURCHASE_ORDER',
    'SAP_CAPABILITY_ASN',
    'SAP_CAPABILITY_GRN',
    'SAP_CAPABILITY_INVOICE',
  ];

  public static toCanonicalSupplier(raw: SAPVendorPayload, tenantId: string): CanonicalSupplier {
    return {
      id: `sup-sap-${raw.LIFNR}`,
      name: raw.NAME1,
      code: raw.LIFNR,
      status: raw.LOEKZ === 'X' ? 'INACTIVE' : 'ACTIVE',
      contactEmail: raw.SMTP_ADDR || undefined,
      currency: raw.WAERS || 'USD',
      tenantId,
    };
  }

  public static toCanonicalProduct(raw: SAPMaterialPayload, tenantId: string): CanonicalProduct {
    return {
      id: `prod-sap-${raw.MATNR}`,
      sku: raw.MATNR,
      name: raw.MAKTX,
      category: raw.MATKL || 'General',
      unitOfMeasure: raw.MEINS || 'EA',
      unitCost: raw.STPRS || 0,
      tenantId,
    };
  }

  public static toCanonicalInventory(raw: SAPStockPayload, tenantId: string): CanonicalInventory {
    return {
      id: `inv-sap-${raw.MATNR}-${raw.WERKS}`,
      productId: `prod-sap-${raw.MATNR}`,
      warehouseId: raw.WERKS,
      onHand: raw.LABST || 0,
      allocated: raw.INSME || 0,
      available: Math.max(0, (raw.LABST || 0) - (raw.INSME || 0)),
      inTransit: 0,
      unitCost: raw.STPRS || 0,
      tenantId,
    };
  }

  public static toCanonicalPurchaseOrder(raw: SAPPurchaseOrderPayload, tenantId: string): CanonicalPurchaseOrder {
    return {
      id: `po-sap-${raw.EBELN}`,
      poNumber: raw.EBELN,
      supplierId: `sup-sap-${raw.LIFNR}`,
      orderDate: raw.AEDAT ? new Date(raw.AEDAT).toISOString() : new Date().toISOString(),
      expectedDelivery: raw.EINDT ? new Date(raw.EINDT).toISOString() : new Date().toISOString(),
      totalValue: raw.NETWR || 0,
      currency: raw.WAERS || 'USD',
      status: this.mapSAPPOStatus(raw.STATU),
      lineItems: (raw.ITEMS || []).map(item => ({
        productId: `prod-sap-${item.MATNR}`,
        quantity: item.MENGE || 0,
        unitPrice: item.NETPR || 0,
      })),
      tenantId,
    };
  }

  public static toCanonicalASN(raw: SAPASNPayload, tenantId: string): CanonicalASN {
    return {
      id: `asn-sap-${raw.VBELN}`,
      asnNumber: raw.VBELN,
      shipmentId: `ship-sap-${raw.VBELN}`,
      poNumber: raw.EBELN,
      supplierId: `sup-sap-${raw.LIFNR}`,
      shippedDate: raw.WADAT ? new Date(raw.WADAT).toISOString() : new Date().toISOString(),
      expectedDeliveryDate: raw.LFDAT ? new Date(raw.LFDAT).toISOString() : new Date().toISOString(),
      itemCount: raw.ANZPK || 1,
      status: 'ISSUED',
      tenantId,
    };
  }

  public static toCanonicalInvoice(raw: SAPInvoicePayload, tenantId: string): CanonicalInvoice {
    return {
      id: `invc-sap-${raw.BELNR}`,
      invoiceNumber: raw.BELNR,
      poNumber: raw.EBELN,
      supplierId: `sup-sap-${raw.LIFNR}`,
      amount: raw.WRBTR || 0,
      currency: raw.WAERS || 'USD',
      taxAmount: raw.WMWST || 0,
      status: 'SUBMITTED',
      dueDate: raw.ZFBDT ? new Date(raw.ZFBDT).toISOString() : new Date().toISOString(),
      tenantId,
    };
  }

  private static mapSAPPOStatus(status?: string): CanonicalPurchaseOrder['status'] {
    switch (status) {
      case 'RELEASED':
      case 'APPROVED':
        return 'Approved';
      case 'IN_TRANSIT':
        return 'In Transit';
      case 'DELIVERED':
        return 'Received';
      case 'BLOCKED':
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'Pending Approval';
    }
  }
}
