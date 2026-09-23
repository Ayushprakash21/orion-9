/**
 * ORION-9 WAVE 4 / PART 4 TRACK 2 — SCM TRANSACTION TRACEABILITY ENGINE
 * Constructs end-to-end transaction lineage trees across the entire supply chain lifecycle:
 * Demand → Plan → PR → RFQ → Quote → Award → PO → ASN → Shipment → Gate → Receiving → GRN → Quality → Putaway → Inventory → Order → Invoice → Match → Payment
 */

import { poLifecycleEngine } from './POLifecycleEngine';
import { sourcingEngine } from './SourcingEngine';
import { inboundLogisticsEngine } from './InboundLogisticsEngine';
import { receivingGRNEngine } from './ReceivingGRNEngine';
import { invoicingMatchingEngine } from './InvoicingMatchingEngine';
import { scmPersistenceService } from '../services/scm/ScmPersistenceService';

export interface ScmTraceNode {
  type: string;
  id: string;
  status: string;
  referenceId?: string;
  details?: Record<string, any>;
  children?: ScmTraceNode[];
}

export class ScmTraceabilityEngine {
  private static instance: ScmTraceabilityEngine;

  private constructor() {}

  public static getInstance(): ScmTraceabilityEngine {
    if (!ScmTraceabilityEngine.instance) {
      ScmTraceabilityEngine.instance = new ScmTraceabilityEngine();
    }
    return ScmTraceabilityEngine.instance;
  }

  public getTraceForPO(tenantId: string, poId: string): ScmTraceNode | undefined {
    const po = poLifecycleEngine.getPO(tenantId, poId) ||
      scmPersistenceService.getCachedRecord<any>('purchase_orders', tenantId, poId);
    if (!po) return undefined;

    const node: ScmTraceNode = {
      type: 'PurchaseOrder',
      id: po.poId,
      status: po.status,
      details: { poNumber: po.poNumber, totalAmount: po.totalAmount, supplierId: po.supplierId },
      children: [],
    };

    // Upstream: PR
    if (po.prId) {
      const pr = sourcingEngine.getPR(tenantId, po.prId);
      if (pr) {
        node.children!.push({
          type: 'PurchaseRequisition',
          id: pr.prId,
          status: pr.status,
          details: { department: pr.department, priority: pr.priority, totalEstimatedValue: pr.totalEstimatedValue },
        });
      }
    }

    // Upstream: RFQ
    if (po.rfqId) {
      const rfq = sourcingEngine.getRFQ(tenantId, po.rfqId);
      if (rfq) {
        node.children!.push({
          type: 'RFQ',
          id: rfq.rfqId,
          status: rfq.status,
          details: { title: rfq.title, submissionDeadline: rfq.submissionDeadline },
        });
      }
    }

    // Upstream: Quotation
    if (po.quotationId) {
      const quot = sourcingEngine.getQuotation(tenantId, po.quotationId);
      if (quot) {
        node.children!.push({
          type: 'Quotation',
          id: quot.quotationId,
          status: quot.status,
          details: { supplierId: quot.supplierId, totalAmount: quot.totalAmount },
        });
      }
    }

    // Downstream: Inbound ASNs
    const asns = scmPersistenceService.listCachedRecords<any>('asns', tenantId).filter((a) => a.poId === poId);
    for (const asn of asns) {
      node.children!.push({
        type: 'ASN',
        id: asn.asnId,
        status: asn.status,
        details: { asnNumber: asn.asnNumber, carrier: asn.carrier, trackingNumber: asn.trackingNumber },
      });
    }

    // Downstream: Shipments
    const shipments = scmPersistenceService.listCachedRecords<any>('shipments', tenantId).filter((s) => s.poId === poId);
    for (const shp of shipments) {
      node.children!.push({
        type: 'Shipment',
        id: shp.shipmentId,
        status: shp.status,
        details: { carrier: shp.carrier, trackingNumber: shp.trackingNumber, origin: shp.origin, destination: shp.destination },
      });
    }

    // Downstream: Receipts & GRNs
    const grns = scmPersistenceService.listCachedRecords<any>('grns', tenantId).filter((g) => g.poId === poId);
    for (const grn of grns) {
      const grnNode: ScmTraceNode = {
        type: 'GRN',
        id: grn.grnId,
        status: grn.status,
        details: { grnNumber: grn.grnNumber, warehouseId: grn.warehouseId, itemsCount: grn.items?.length },
        children: [],
      };

      // Quality Inspections on this GRN
      const inspections = scmPersistenceService.listCachedRecords<any>('quality_inspections', tenantId).filter((q) => q.grnId === grn.grnId);
      for (const q of inspections) {
        grnNode.children!.push({
          type: 'QualityInspection',
          id: q.inspectionId,
          status: q.decision,
          details: { quantityPassed: q.quantityPassed, quantityFailed: q.quantityFailed },
        });
      }

      // Putaways on this GRN
      const putaways = scmPersistenceService.listCachedRecords<any>('putaways', tenantId).filter((p) => p.grnId === grn.grnId);
      for (const p of putaways) {
        grnNode.children!.push({
          type: 'Putaway',
          id: p.putawayId,
          status: p.status,
          details: { source: p.sourceLocation, destination: p.destinationLocation, quantity: p.quantity },
        });
      }

      node.children!.push(grnNode);
    }

    // Downstream: Invoices, Matching, and Payment Handoff
    const invoices = scmPersistenceService.listCachedRecords<any>('invoices', tenantId).filter((i) => i.poId === poId);
    for (const inv of invoices) {
      const invNode: ScmTraceNode = {
        type: 'Invoice',
        id: inv.invoiceId,
        status: inv.status,
        details: { invoiceNumber: inv.invoiceNumber, amount: inv.amount, dueDate: inv.dueDate },
        children: [],
      };

      const matches = scmPersistenceService.listCachedRecords<any>('invoice_matches', tenantId).filter((m) => m.invoiceId === inv.invoiceId);
      for (const m of matches) {
        invNode.children!.push({
          type: 'InvoiceMatch',
          id: m.matchId,
          status: m.status,
          details: { matchMode: m.matchMode, priceVariance: m.priceVariance, quantityVariance: m.quantityVariance },
        });
      }

      const handoffs = scmPersistenceService.listCachedRecords<any>('payment_handoffs', tenantId).filter((h) => h.invoiceId === inv.invoiceId);
      for (const h of handoffs) {
        invNode.children!.push({
          type: 'PaymentHandoff',
          id: h.handoffId,
          status: h.status,
          details: { approvedAmount: h.approvedAmount, currency: h.currency, dueDate: h.dueDate },
        });
      }

      node.children!.push(invNode);
    }

    return node;
  }
}

export const scmTraceabilityEngine = ScmTraceabilityEngine.getInstance();
