/**
 * ORION-9 CANONICAL MAPPER
 * Layer 8 Integration Fabric Foundation
 *
 * Maps raw external ERP / EDI / REST payloads into strict Canonical Orion Contracts:
 * - Supplier
 * - Product
 * - Inventory
 * - PurchaseOrder
 * - Shipment
 * - ASN (Advanced Shipping Notice)
 * - Invoice
 * - CustomerOrder
 *
 * Prevents ERP-specific structures (SAP BAPI, Oracle OTM, EDI X12) from leaking into Orion engines.
 */

import {
  CanonicalSupplier,
  CanonicalProduct,
  CanonicalInventory,
  CanonicalPurchaseOrder,
  CanonicalShipment,
  CanonicalASN,
  CanonicalInvoice,
  CanonicalCustomerOrder
} from './types';

export class CanonicalValidationError extends Error {
  constructor(message: string, public entityType: string, public missingField: string) {
    super(`[CanonicalMapper ${entityType}] Validation Error: Missing required field '${missingField}'. ${message}`);
    this.name = 'CanonicalValidationError';
  }
}

export class CanonicalMapper {

  /**
   * Maps external payload to Canonical Purchase Order
   */
  public static mapPurchaseOrder(payload: Record<string, any>, tenantId: string): CanonicalPurchaseOrder {
    const id = payload.id || payload.poId || payload.EBELN || payload.PO_NUMBER;
    if (!id) throw new CanonicalValidationError('PO ID is missing.', 'PurchaseOrder', 'id');

    const poNumber = payload.poNumber || payload.EBELN || payload.PO_NUMBER || id;
    const supplierId = payload.supplierId || payload.LIFNR || payload.VENDOR_ID;
    if (!supplierId) throw new CanonicalValidationError('Supplier ID is missing.', 'PurchaseOrder', 'supplierId');

    const totalValue = Number(payload.totalValue || payload.NETWR || payload.TOTAL_AMOUNT || 0);

    return {
      id: String(id).trim(),
      poNumber: String(poNumber).trim(),
      supplierId: String(supplierId).trim(),
      orderDate: payload.orderDate || payload.BEDAT || new Date().toISOString(),
      expectedDelivery: payload.expectedDelivery || payload.EINDT || new Date().toISOString(),
      totalValue,
      currency: (payload.currency || payload.WAERS || 'USD').toUpperCase(),
      status: this.normalizePOStatus(payload.status || payload.STATU),
      lineItems: Array.isArray(payload.lineItems) ? payload.lineItems.map(item => ({
        productId: String(item.productId || item.MATNR || item.SKU).trim(),
        quantity: Number(item.quantity || item.MENGE || 0),
        unitPrice: Number(item.unitPrice || item.NETPR || 0),
      })) : [],
      tenantId,
    };
  }

  /**
   * Maps external payload to Canonical Inventory
   */
  public static mapInventory(payload: Record<string, any>, tenantId: string): CanonicalInventory {
    const productId = payload.productId || payload.MATNR || payload.SKU;
    if (!productId) throw new CanonicalValidationError('Product ID is missing.', 'Inventory', 'productId');

    const warehouseId = payload.warehouseId || payload.WERKS || payload.LOCATION_ID || 'WH-MAIN';
    const onHand = Number(payload.onHand || payload.LABST || payload.QTY_ON_HAND || 0);

    return {
      id: `inv-${productId}-${warehouseId}`,
      productId: String(productId).trim(),
      warehouseId: String(warehouseId).trim(),
      onHand,
      allocated: Number(payload.allocated || payload.RESERVED || 0),
      available: Number(payload.available || Math.max(0, onHand - Number(payload.allocated || 0))),
      inTransit: Number(payload.inTransit || payload.UMLME || 0),
      unitCost: Number(payload.unitCost || payload.VERPR || 0),
      tenantId,
    };
  }

  /**
   * Maps external payload to Canonical Supplier
   */
  public static mapSupplier(payload: Record<string, any>, tenantId: string): CanonicalSupplier {
    const id = payload.id || payload.supplierId || payload.LIFNR || payload.VENDOR_ID;
    if (!id) throw new CanonicalValidationError('Supplier ID is missing.', 'Supplier', 'id');

    const name = payload.name || payload.NAME1 || payload.VENDOR_NAME || 'Unknown Supplier';

    return {
      id: String(id).trim(),
      name: String(name).trim(),
      code: String(payload.code || payload.LIFNR || id).trim(),
      status: payload.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      contactEmail: payload.contactEmail || payload.EMAIL,
      currency: (payload.currency || payload.WAERS || 'USD').toUpperCase(),
      rating: payload.rating ? Number(payload.rating) : 90,
      tenantId,
    };
  }

  /**
   * Maps external payload to Canonical Product
   */
  public static mapProduct(payload: Record<string, any>, tenantId: string): CanonicalProduct {
    const id = payload.id || payload.productId || payload.MATNR || payload.SKU;
    if (!id) throw new CanonicalValidationError('Product ID is missing.', 'Product', 'id');

    return {
      id: String(id).trim(),
      sku: String(payload.sku || payload.MATNR || id).trim(),
      name: String(payload.name || payload.MAKTX || payload.PRODUCT_NAME || id).trim(),
      category: payload.category || payload.MATKL || 'General Parts',
      unitOfMeasure: payload.unitOfMeasure || payload.MEINS || 'EA',
      unitCost: Number(payload.unitCost || payload.STPRS || 0),
      tenantId,
    };
  }

  /**
   * Maps external payload to Canonical Shipment
   */
  public static mapShipment(payload: Record<string, any>, tenantId: string): CanonicalShipment {
    const id = payload.id || payload.shipmentId || payload.SHIPMENT_GID;
    if (!id) throw new CanonicalValidationError('Shipment ID is missing.', 'Shipment', 'id');

    return {
      id: String(id).trim(),
      trackingNumber: payload.trackingNumber || payload.PRO_NUMBER || String(id).trim(),
      poId: payload.poId || payload.ORDER_RELEASE_GID,
      carrier: payload.carrier || payload.SERVPROV_GID || 'Global Freight',
      origin: payload.origin || payload.SOURCE_LOCATION || 'Origin Port',
      destination: payload.destination || payload.DEST_LOCATION || 'Destination DC',
      status: this.normalizeShipmentStatus(payload.status),
      shipDate: payload.shipDate || payload.START_TIME || new Date().toISOString(),
      expectedArrival: payload.expectedArrival || payload.END_TIME || new Date().toISOString(),
      actualArrival: payload.actualArrival,
      delayDays: Number(payload.delayDays || 0),
      tenantId,
    };
  }

  /**
   * Maps external payload to Canonical ASN
   */
  public static mapASN(payload: Record<string, any>, tenantId: string): CanonicalASN {
    const id = payload.id || payload.asnId || payload.ASN_NUMBER;
    if (!id) throw new CanonicalValidationError('ASN ID is missing.', 'ASN', 'id');

    return {
      id: String(id).trim(),
      asnNumber: String(payload.asnNumber || id).trim(),
      shipmentId: String(payload.shipmentId || payload.SHIPMENT_REF || 'SHP-UNKNOWN').trim(),
      poNumber: String(payload.poNumber || payload.PO_REF || 'PO-UNKNOWN').trim(),
      supplierId: String(payload.supplierId || payload.VENDOR_REF || 'SUP-UNKNOWN').trim(),
      shippedDate: payload.shippedDate || new Date().toISOString(),
      expectedDeliveryDate: payload.expectedDeliveryDate || new Date().toISOString(),
      itemCount: Number(payload.itemCount || payload.TOTAL_UNITS || 1),
      status: payload.status || 'ISSUED',
      tenantId,
    };
  }

  /**
   * Maps external payload to Canonical Invoice
   */
  public static mapInvoice(payload: Record<string, any>, tenantId: string): CanonicalInvoice {
    const id = payload.id || payload.invoiceId || payload.BELNR;
    if (!id) throw new CanonicalValidationError('Invoice ID is missing.', 'Invoice', 'id');

    return {
      id: String(id).trim(),
      invoiceNumber: String(payload.invoiceNumber || id).trim(),
      poNumber: String(payload.poNumber || payload.EBELN || 'PO-UNKNOWN').trim(),
      supplierId: String(payload.supplierId || payload.LIFNR || 'SUP-UNKNOWN').trim(),
      amount: Number(payload.amount || payload.WRBTR || 0),
      currency: (payload.currency || payload.WAERS || 'USD').toUpperCase(),
      taxAmount: Number(payload.taxAmount || payload.WMWST || 0),
      status: payload.status || 'SUBMITTED',
      dueDate: payload.dueDate || payload.ZFBDT || new Date().toISOString(),
      tenantId,
    };
  }

  /**
   * Maps external payload to Canonical Customer Order
   */
  public static mapCustomerOrder(payload: Record<string, any>, tenantId: string): CanonicalCustomerOrder {
    const id = payload.id || payload.orderNumber || payload.VBELN;
    if (!id) throw new CanonicalValidationError('Order Number is missing.', 'CustomerOrder', 'id');

    return {
      id: String(id).trim(),
      orderNumber: String(payload.orderNumber || id).trim(),
      customerId: String(payload.customerId || payload.KUNNR || 'CUST-001').trim(),
      orderDate: payload.orderDate || payload.AUDAT || new Date().toISOString(),
      totalAmount: Number(payload.totalAmount || payload.NETWR || 0),
      currency: (payload.currency || payload.WAERS || 'USD').toUpperCase(),
      fulfillmentStatus: payload.fulfillmentStatus || 'UNFULFILLED',
      tenantId,
    };
  }

  private static normalizePOStatus(raw: any): CanonicalPurchaseOrder['status'] {
    if (!raw) return 'Draft';
    const s = String(raw).toUpperCase();
    if (s.includes('APPROV') || s === '02') return 'Approved';
    if (s.includes('TRANSIT') || s.includes('DISPATCH') || s === '03') return 'In Transit';
    if (s.includes('RECEIV') || s === '04') return 'Received';
    if (s.includes('CANCEL') || s === '99') return 'Cancelled';
    if (s.includes('PEND')) return 'Pending Approval';
    return 'Draft';
  }

  private static normalizeShipmentStatus(raw: any): CanonicalShipment['status'] {
    if (!raw) return 'Pending';
    const s = String(raw).toUpperCase();
    if (s.includes('TRANSIT')) return 'In Transit';
    if (s.includes('DELIVER')) return 'Delivered';
    if (s.includes('DELAY')) return 'Delayed';
    if (s.includes('EXCEPT') || s.includes('HOLD')) return 'Exception';
    return 'Pending';
  }
}
