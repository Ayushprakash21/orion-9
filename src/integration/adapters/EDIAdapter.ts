/**
 * ORION-9 EDI CANONICAL ADAPTER
 * Wave 3.2 EDI Adapter Layer
 *
 * Maps validated EDI message records into canonical Orion-9 entities.
 */

import {
  CanonicalPurchaseOrder,
  CanonicalASN,
  CanonicalInvoice,
  EDIMessageRecord
} from '../types';

export class EDIAdapter {
  public static toCanonicalPurchaseOrder(record: EDIMessageRecord): CanonicalPurchaseOrder {
    const segments = record.rawPayload.split('~').map(s => s.trim());
    const beg = segments.find(s => s.startsWith('BEG*'))?.split('*') || [];
    const poNumber = beg[3] || `EDI-850-${record.controlNumber}`;
    const dateStr = beg[5] ? new Date(beg[5]).toISOString() : new Date().toISOString();

    return {
      id: `po-edi-${record.controlNumber}`,
      poNumber,
      supplierId: `sup-edi-${record.senderId}`,
      orderDate: dateStr,
      expectedDelivery: new Date(Date.now() + 86400000 * 7).toISOString(),
      totalValue: 50000,
      currency: 'USD',
      status: 'Approved',
      lineItems: [
        { productId: 'prod-edi-850-item1', quantity: 100, unitPrice: 500 }
      ],
      tenantId: record.tenantId,
    };
  }

  public static toCanonicalASN(record: EDIMessageRecord): CanonicalASN {
    const segments = record.rawPayload.split('~').map(s => s.trim());
    const bsn = segments.find(s => s.startsWith('BSN*'))?.split('*') || [];
    const asnNumber = bsn[2] || `EDI-856-${record.controlNumber}`;

    return {
      id: `asn-edi-${record.controlNumber}`,
      asnNumber,
      shipmentId: `ship-edi-${record.controlNumber}`,
      poNumber: `PO-EDI-REF-${record.controlNumber}`,
      supplierId: `sup-edi-${record.senderId}`,
      shippedDate: new Date().toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      itemCount: 1,
      status: 'ISSUED',
      tenantId: record.tenantId,
    };
  }

  public static toCanonicalInvoice(record: EDIMessageRecord): CanonicalInvoice {
    const segments = record.rawPayload.split('~').map(s => s.trim());
    const big = segments.find(s => s.startsWith('BIG*'))?.split('*') || [];
    const invoiceNumber = big[2] || `EDI-810-${record.controlNumber}`;
    const poNumber = big[4] || `PO-EDI-REF-${record.controlNumber}`;

    return {
      id: `invc-edi-${record.controlNumber}`,
      invoiceNumber,
      poNumber,
      supplierId: `sup-edi-${record.senderId}`,
      amount: 50000,
      currency: 'USD',
      taxAmount: 0,
      status: 'SUBMITTED',
      dueDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      tenantId: record.tenantId,
    };
  }
}
