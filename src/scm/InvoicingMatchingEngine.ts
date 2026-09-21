/**
 * ORION-9 WAVE 4 — INVOICING, 2-WAY / 3-WAY MATCHING & PAYMENT HANDOFF ENGINE
 */

import { scmTransactionEngine } from '../kernel/scm/ScmTransactionEngine';
import { AuthorizationActor } from '../kernel/authorization/AuthorizationEngine';
import { poLifecycleEngine } from './POLifecycleEngine';
import { receivingGRNEngine } from './ReceivingGRNEngine';
import {
  InvoiceLineItem,
  InvoiceMatchRecord,
  InvoiceRecord,
  MatchMode,
  MatchStatus,
  PaymentHandoffRecord,
} from './types';

export class InvoicingMatchingEngine {
  private static instance: InvoicingMatchingEngine;

  private invoices: Map<string, InvoiceRecord> = new Map();
  private matches: Map<string, InvoiceMatchRecord> = new Map();
  private paymentHandoffs: Map<string, PaymentHandoffRecord> = new Map();
  private processedInvoiceNumbers: Set<string> = new Set(); // duplicate detection

  private constructor() {}

  public static getInstance(): InvoicingMatchingEngine {
    if (!InvoicingMatchingEngine.instance) {
      InvoicingMatchingEngine.instance = new InvoicingMatchingEngine();
    }
    return InvoicingMatchingEngine.instance;
  }

  // 1. INVOICE INGEST & VALIDATION
  public async ingestInvoice(params: {
    tenantId: string;
    actor: AuthorizationActor;
    invoiceNumber: string;
    supplierId: string;
    poId: string;
    grnId?: string;
    amount: number;
    taxAmount?: number;
    freightAmount?: number;
    currency?: string;
    lineItems: InvoiceLineItem[];
    dueDate?: string;
  }) {
    const invoiceId = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const dupKey = `${params.tenantId}:${params.supplierId}:${params.invoiceNumber}`;

    // Duplicate Invoice Protection
    if (this.processedInvoiceNumbers.has(dupKey)) {
      return {
        success: false,
        status: 'DENIED_POLICY' as const,
        message: `Duplicate Invoice Protection: Invoice '${params.invoiceNumber}' for supplier '${params.supplierId}' has already been processed`,
        correlationId: `CORR-INV-DUP-${Date.now()}`,
      };
    }

    const record: InvoiceRecord = {
      invoiceId,
      tenantId: params.tenantId,
      invoiceNumber: params.invoiceNumber,
      supplierId: params.supplierId,
      poId: params.poId,
      grnId: params.grnId,
      amount: params.amount,
      taxAmount: params.taxAmount || 0,
      freightAmount: params.freightAmount || 0,
      currency: params.currency || 'USD',
      lineItems: params.lineItems,
      dueDate: params.dueDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      status: 'RECEIVED',
      createdAt: new Date().toISOString(),
    };

    return scmTransactionEngine.executeCommand({
      commandName: 'Invoice:Ingest',
      tenantId: params.tenantId,
      actor: params.actor,
      entityType: 'Invoice',
      entityId: invoiceId,
      targetState: 'RECEIVED',
      requiredPermission: 'invoice:create',
      estimatedValue: params.amount,
      payload: record,
    }, async (rec) => {
      this.invoices.set(`${params.tenantId}:${invoiceId}`, rec);
      this.processedInvoiceNumbers.add(dupKey);
      return rec;
    });
  }

  // 2. 2-WAY & 3-WAY MATCHING ENGINE
  public async performMatch(params: {
    tenantId: string;
    actor: AuthorizationActor;
    invoiceId: string;
    matchMode: MatchMode;
  }) {
    const matchId = `MATCH-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const invoice = this.invoices.get(`${params.tenantId}:${params.invoiceId}`);
    if (!invoice) throw new Error(`Invoice ${params.invoiceId} not found`);

    const po = poLifecycleEngine.getPO(params.tenantId, invoice.poId);
    if (!po) throw new Error(`PO ${invoice.poId} not found for Invoice matching`);

    const grn = invoice.grnId ? receivingGRNEngine.getGRN(params.tenantId, invoice.grnId) : undefined;

    let priceVariance = 0;
    let quantityVariance = 0;
    const discrepancies: string[] = [];

    // Calculate Variances
    const priceDiff = Math.abs(invoice.amount - po.totalAmount);
    if (priceDiff > 0.01) {
      priceVariance = priceDiff;
      discrepancies.push(`Price Variance: Invoice Total $${invoice.amount} vs PO Total $${po.totalAmount}`);
    }

    if (params.matchMode === 'THREE_WAY') {
      if (!grn) {
        discrepancies.push('3-Way Match Failure: Missing associated GRN record');
      } else {
        const totalGrnQty = grn.items.reduce((acc, i) => acc + i.acceptedQuantity, 0);
        const totalInvQty = invoice.lineItems.reduce((acc, i) => acc + i.quantity, 0);
        if (totalGrnQty !== totalInvQty) {
          quantityVariance = Math.abs(totalGrnQty - totalInvQty);
          discrepancies.push(`Quantity Variance: Invoice Qty ${totalInvQty} vs GRN Qty ${totalGrnQty}`);
        }
      }
    }

    const matchStatus: MatchStatus = discrepancies.length === 0 ? 'MATCHED' : 'MISMATCH';

    const matchRecord: InvoiceMatchRecord = {
      matchId,
      tenantId: params.tenantId,
      invoiceId: params.invoiceId,
      poId: invoice.poId,
      grnId: invoice.grnId,
      matchMode: params.matchMode,
      status: matchStatus,
      priceVariance,
      quantityVariance,
      discrepancies,
      matchedAt: new Date().toISOString(),
    };

    return scmTransactionEngine.executeCommand({
      commandName: 'Invoice:Match',
      tenantId: params.tenantId,
      actor: params.actor,
      entityType: 'InvoiceMatch',
      entityId: matchId,
      targetState: matchStatus,
      requiredPermission: 'invoice:approve',
      payload: matchRecord,
    }, async (rec) => {
      this.matches.set(`${params.tenantId}:${matchId}`, rec);
      if (matchStatus === 'MATCHED') {
        invoice.status = 'APPROVED';
        this.invoices.set(`${params.tenantId}:${params.invoiceId}`, invoice);
      } else {
        invoice.status = 'BLOCKED';
        this.invoices.set(`${params.tenantId}:${params.invoiceId}`, invoice);
      }
      return rec;
    });
  }

  // 3. PAYMENT HANDOFF GENERATION
  public async createPaymentHandoff(params: {
    tenantId: string;
    actor: AuthorizationActor;
    invoiceId: string;
    matchId: string;
  }) {
    const handoffId = `HND-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const invoice = this.invoices.get(`${params.tenantId}:${params.invoiceId}`);
    if (!invoice || invoice.status !== 'APPROVED') {
      return {
        success: false,
        status: 'DENIED_POLICY' as const,
        message: 'Policy Violation: Cannot create Payment Handoff for unapproved or mismatched invoice',
        correlationId: `CORR-HANDOFF-${Date.now()}`,
      };
    }

    const record: PaymentHandoffRecord = {
      handoffId,
      tenantId: params.tenantId,
      invoiceId: params.invoiceId,
      supplierId: invoice.supplierId,
      approvedAmount: invoice.amount,
      currency: invoice.currency,
      paymentTerms: 'NET30',
      dueDate: invoice.dueDate,
      matchingId: params.matchId,
      status: 'READY_FOR_HANDOFF',
      createdAt: new Date().toISOString(),
    };

    return scmTransactionEngine.executeCommand({
      commandName: 'PaymentHandoff:Create',
      tenantId: params.tenantId,
      actor: params.actor,
      entityType: 'PaymentHandoff',
      entityId: handoffId,
      targetState: 'READY_FOR_HANDOFF',
      requiredPermission: 'payment_handoff:create',
      estimatedValue: invoice.amount,
      payload: record,
    }, async (rec) => {
      this.paymentHandoffs.set(`${params.tenantId}:${handoffId}`, rec);
      invoice.status = 'PAYMENT_HANDOFF';
      this.invoices.set(`${params.tenantId}:${params.invoiceId}`, invoice);
      return rec;
    });
  }

  public getInvoice(tenantId: string, invoiceId: string) { return this.invoices.get(`${tenantId}:${invoiceId}`); }
  public getMatch(tenantId: string, matchId: string) { return this.matches.get(`${tenantId}:${matchId}`); }
  public getPaymentHandoff(tenantId: string, handoffId: string) { return this.paymentHandoffs.get(`${tenantId}:${handoffId}`); }
  public clear(): void {
    this.invoices.clear();
    this.matches.clear();
    this.paymentHandoffs.clear();
    this.processedInvoiceNumbers.clear();
  }
}

export const invoicingMatchingEngine = InvoicingMatchingEngine.getInstance();
