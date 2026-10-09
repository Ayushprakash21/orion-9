/**
 * ORION-9 FINANCIAL LEDGER ENGINE (AR / AP / INVOICE MATCHING)
 *
 * Implements:
 * 1. Customer Invoicing with AR aging calculations (CURRENT, 1-30, 31-60, 61-90, 90+).
 * 2. Multi-invoice payment receipt allocation, partial payment, and reconciliation.
 * 3. Supplier Accounts Payable (AP) matching PO, Receipt (GRN), and Supplier Invoice.
 * 4. Three-Way Matching engine with line-item tolerance and discrepancy reporting.
 * 5. Payment scheduling, payment execution, and cash settlement.
 * 6. Authoritative persistence through ScmPersistenceService (Cloud Firestore + LocalForage).
 */

import {
  CustomerInvoiceRecord,
  CustomerInvoiceLineItem,
  CustomerPaymentRecord,
  CustomerPaymentAllocation,
  SupplierApLedgerRecord,
  SupplierInvoiceLineItem
} from './types';
import { KernelEventBus } from '../kernel/EventBus';
import { ScmPersistenceService } from '../services/scm/ScmPersistenceService';

export interface ThreeWayMatchResult {
  matchStatus: '3_WAY_MATCHED' | 'PRICE_VARIANCE' | 'QTY_VARIANCE' | 'MISMATCH';
  isMatched: boolean;
  totalPoAmount: number;
  totalGrnAmount: number;
  totalInvoicedAmount: number;
  priceVariance: number;
  quantityVariance: number;
  discrepancies: Array<{
    productId: string;
    productName: string;
    type: 'PRICE' | 'QUANTITY' | 'MISSING_GRN' | 'MISSING_PO';
    expected: number;
    actual: number;
    difference: number;
  }>;
  summary: string;
}

export interface ArAgingSummary {
  totalExposure: number;
  currentAmount: number;
  days1_30: number;
  days31_60: number;
  days61_90: number;
  days90Plus: number;
  overdueAmount: number;
  dueThisWeek: number;
  dueThisMonth: number;
  invoiceCount: number;
  customerExposures: Array<{ customerId: string; customerName: string; outstanding: number; overdue: number }>;
}

export interface ApAgingSummary {
  totalLiabilities: number;
  currentAmount: number;
  days1_30: number;
  days31_60: number;
  days61_90: number;
  days90Plus: number;
  overdueAmount: number;
  upcomingScheduled: number;
  unmatchedCount: number;
  awaitingApprovalCount: number;
  supplierLiabilities: Array<{ supplierId: string; supplierName: string; outstanding: number; scheduled: number }>;
}

export class FinancialLedgerEngine {
  private static instance: FinancialLedgerEngine;
  private customerInvoices: Map<string, CustomerInvoiceRecord[]> = new Map();
  private supplierApRecords: Map<string, SupplierApLedgerRecord[]> = new Map();
  private customerPayments: Map<string, CustomerPaymentRecord[]> = new Map();
  private initializedTenants: Set<string> = new Set();
  private hydrationPromises: Map<string, Promise<void>> = new Map();

  private constructor() {}

  public static getInstance(): FinancialLedgerEngine {
    if (!FinancialLedgerEngine.instance) {
      FinancialLedgerEngine.instance = new FinancialLedgerEngine();
    }
    return FinancialLedgerEngine.instance;
  }

  /**
   * Helper to compute dynamic aging bucket based on due date.
   */
  public computeAgingBucket(dueDateStr: string): 'CURRENT' | '1_30' | '31_60' | '61_90' | '90_PLUS' {
    if (!dueDateStr) return 'CURRENT';
    const dueTime = new Date(dueDateStr).getTime();
    const nowTime = new Date().getTime();
    const diffDays = Math.floor((nowTime - dueTime) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'CURRENT';
    if (diffDays <= 30) return '1_30';
    if (diffDays <= 60) return '31_60';
    if (diffDays <= 90) return '61_90';
    return '90_PLUS';
  }

  /**
   * Hydrates tenant financial records from authoritative durable storage.
   * Concurrency-safe: concurrent calls for the same tenant await the same in-flight promise.
   */
  public async hydrateTenant(tenantId: string): Promise<void> {
    if (this.initializedTenants.has(tenantId)) return;
    const existing = this.hydrationPromises.get(tenantId);
    if (existing) return existing;

    const promise = (async () => {
      try {
        const persistence = ScmPersistenceService.getInstance();
        const [invoices, apRecords, payments] = await Promise.all([
          persistence.listRecords<CustomerInvoiceRecord>('customer_invoices', tenantId),
          persistence.listRecords<SupplierApLedgerRecord>('supplier_ap_records', tenantId),
          persistence.listRecords<CustomerPaymentRecord>('customer_payments', tenantId).catch(() => [])
        ]);

        if (invoices.length > 0) {
          // Recalculate dynamic aging on hydration
          const updated = invoices.map(i => ({
            ...i,
            arAgingBucket: i.outstandingBalance > 0 ? this.computeAgingBucket(i.dueDate) : 'CURRENT'
          }));
          this.customerInvoices.set(tenantId, updated);
        } else {
          this.customerInvoices.set(tenantId, []);
        }

        if (apRecords.length > 0) {
          const updated = apRecords.map(a => ({
            ...a,
            apAgingBucket: a.outstandingBalance > 0 ? this.computeAgingBucket(a.dueDate) : 'CURRENT'
          }));
          this.supplierApRecords.set(tenantId, updated);
        } else {
          this.supplierApRecords.set(tenantId, []);
        }

        if (payments.length > 0) {
          this.customerPayments.set(tenantId, payments);
        } else {
          this.customerPayments.set(tenantId, []);
        }

        this.initializedTenants.add(tenantId);
      } catch (err) {
        console.warn(`[FINANCIAL-LEDGER] Hydration warning for tenant ${tenantId}:`, err);
        this.initializedTenants.add(tenantId);
      } finally {
        this.hydrationPromises.delete(tenantId);
      }
    })();

    this.hydrationPromises.set(tenantId, promise);
    return promise;
  }

  /**
   * Generates and durably records a customer invoice with verified line calculations.
   */
  public generateCustomerInvoice(params: {
    tenantId: string;
    orderId: string;
    customerId: string;
    customerName?: string;
    billingAddress?: string;
    subtotal: number;
    taxAmount: number;
    freightAmount?: number;
    discountAmount?: number;
    dueDate: string;
    currency?: string;
    paymentTerms?: string;
    lineItems?: CustomerInvoiceLineItem[];
    notes?: string;
    status?: CustomerInvoiceRecord['status'];
  }): CustomerInvoiceRecord {
    // Validate line items if provided
    let calculatedSubtotal = params.subtotal;
    if (params.lineItems && params.lineItems.length > 0) {
      calculatedSubtotal = params.lineItems.reduce((acc, item) => {
        const lineVal = item.quantity * item.unitPrice * (1 - (item.discountRate || 0) / 100);
        return acc + lineVal;
      }, 0);
    }

    const freight = params.freightAmount || 0;
    const discount = params.discountAmount || 0;
    const tax = params.taxAmount || 0;
    const totalAmount = Math.max(0, calculatedSubtotal + tax + freight - discount);

    const agingBucket = this.computeAgingBucket(params.dueDate);
    const invoiceId = `INV-CUST-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    const record: CustomerInvoiceRecord = {
      invoiceId,
      tenantId: params.tenantId,
      invoiceNumber,
      orderId: params.orderId,
      customerId: params.customerId,
      customerName: params.customerName || params.customerId,
      billingAddress: params.billingAddress || 'Default Enterprise Billing',
      currency: params.currency || 'USD',
      subtotal: calculatedSubtotal,
      taxAmount: tax,
      freightAmount: freight,
      discountAmount: discount,
      totalAmount,
      paidAmount: 0,
      outstandingBalance: totalAmount,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: params.dueDate,
      paymentTerms: params.paymentTerms || 'NET_30',
      status: params.status || 'ISSUED',
      arAgingBucket: agingBucket,
      lineItems: params.lineItems,
      notes: params.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const list = this.customerInvoices.get(params.tenantId) || [];
    list.unshift(record);
    this.customerInvoices.set(params.tenantId, list);

    // Durable persistence asynchronously
    ScmPersistenceService.getInstance().saveRecord('customer_invoices', invoiceId, record).catch(err => {
      console.warn(`[FINANCIAL-LEDGER] Customer invoice persistence notice:`, err);
    });

    KernelEventBus.getInstance().publish('CUSTOMER_INVOICE_CREATED', record, {
      tenant: { organizationId: params.tenantId, organizationName: params.tenantId },
      actor: { id: 'FINANCE_ENGINE', type: 'SYSTEM', name: 'Finance Engine' }
    });

    return record;
  }

  /**
   * Records payment receipt from a customer with allocation across invoices.
   */
  public recordCustomerPayment(
    tenantId: string,
    invoiceId: string,
    paymentAmount: number,
    paymentRef: string
  ): CustomerInvoiceRecord {
    if (!paymentAmount || paymentAmount <= 0) {
      throw new Error(`[FINANCIAL-VALIDATION-ERROR] Payment amount must be strictly greater than 0 (received: ${paymentAmount})`);
    }

    const list = this.customerInvoices.get(tenantId) || [];
    const inv = list.find(i => i.invoiceId === invoiceId);
    if (!inv) throw new Error(`Invoice ${invoiceId} not found`);

    if (paymentAmount > inv.outstandingBalance) {
      throw new Error(`[FINANCIAL-OVERPAYMENT-REJECTED] Payment of ${paymentAmount} exceeds outstanding balance of ${inv.outstandingBalance}`);
    }

    // Check duplicate payment reference
    const pmtList = this.customerPayments.get(tenantId) || [];
    if (paymentRef && pmtList.some(p => p.paymentReference === paymentRef)) {
      throw new Error(`[FINANCIAL-DUPLICATE-PAYMENT] Payment reference ${paymentRef} has already been recorded`);
    }

    inv.paidAmount += paymentAmount;
    inv.outstandingBalance = Math.max(0, inv.totalAmount - inv.paidAmount);
    inv.paymentReference = paymentRef;
    inv.status = inv.outstandingBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';
    inv.arAgingBucket = inv.outstandingBalance === 0 ? 'CURRENT' : this.computeAgingBucket(inv.dueDate);
    inv.updatedAt = new Date().toISOString();

    // Durable persistence
    ScmPersistenceService.getInstance().saveRecord('customer_invoices', invoiceId, inv).catch(err => {
      console.warn(`[FINANCIAL-LEDGER] Invoice payment persistence notice:`, err);
    });

    // Create payment receipt record
    const paymentRecord: CustomerPaymentRecord = {
      paymentId: `PMT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId,
      paymentReference: paymentRef,
      customerId: inv.customerId,
      customerName: inv.customerName || inv.customerId,
      amount: paymentAmount,
      currency: inv.currency,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'WIRE',
      allocations: [{ invoiceId, allocatedAmount: paymentAmount, invoiceNumber: inv.invoiceNumber }],
      unallocatedAmount: 0,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    pmtList.unshift(paymentRecord);
    this.customerPayments.set(tenantId, pmtList);

    ScmPersistenceService.getInstance().saveRecord('customer_payments', paymentRecord.paymentId, paymentRecord).catch(() => {});

    KernelEventBus.getInstance().publish('PAYMENT_RECEIVED', {
      invoiceId,
      paymentAmount,
      outstandingBalance: inv.outstandingBalance,
      paymentRef,
      customerId: inv.customerId
    }, {
      tenant: { organizationId: tenantId, organizationName: tenantId },
      actor: { id: 'AR_TREASURY', type: 'USER', name: 'Treasury Admin' }
    });

    return inv;
  }

  /**
   * Multi-invoice payment allocation receipt.
   */
  public allocateCustomerPayment(
    tenantIdOrParams: string | any,
    maybeParams?: any
  ): any {
    let tenantId: string;
    let params: any;

    if (typeof tenantIdOrParams === 'string') {
      tenantId = tenantIdOrParams;
      params = maybeParams || {};
    } else {
      tenantId = tenantIdOrParams.tenantId;
      params = tenantIdOrParams;
    }

    const list = this.customerInvoices.get(tenantId) || [];
    let allocatedTotal = 0;
    const resolvedAllocations: CustomerPaymentAllocation[] = [];
    const allocationsList = params.allocations || [];
    const paymentRef = params.paymentReference || params.referenceNumber || `WIRE-TX-${Date.now()}`;
    const totalAmount = params.totalAmount !== undefined ? params.totalAmount : params.paymentAmount !== undefined ? params.paymentAmount : 0;
    
    if (totalAmount <= 0) {
      throw new Error(`[FINANCIAL-VALIDATION-ERROR] Allocation payment amount must be strictly greater than 0 (received: ${totalAmount})`);
    }

    const pmtList = this.customerPayments.get(tenantId) || [];
    if (paymentRef && pmtList.some(p => p.paymentReference === paymentRef)) {
      throw new Error(`[FINANCIAL-DUPLICATE-PAYMENT] Payment reference ${paymentRef} has already been recorded`);
    }

    const customerId = params.customerId || 'CUST-DEFAULT';
    const customerName = params.customerName || customerId;
    const paymentMethod = params.paymentMethod || 'WIRE';

    for (const alloc of allocationsList) {
      const inv = list.find(i => i.invoiceId === alloc.invoiceId);
      if (inv) {
        const canPay = Math.min(alloc.amount, inv.outstandingBalance);
        inv.paidAmount += canPay;
        inv.outstandingBalance = Math.max(0, inv.totalAmount - inv.paidAmount);
        inv.paymentReference = paymentRef;
        inv.status = inv.outstandingBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';
        inv.arAgingBucket = inv.outstandingBalance === 0 ? 'CURRENT' : this.computeAgingBucket(inv.dueDate);
        inv.updatedAt = new Date().toISOString();
        allocatedTotal += canPay;

        resolvedAllocations.push({
          invoiceId: inv.invoiceId,
          allocatedAmount: canPay,
          invoiceNumber: inv.invoiceNumber
        });

        ScmPersistenceService.getInstance().saveRecord('customer_invoices', inv.invoiceId, inv).catch(() => {});
      }
    }

    const unallocated = Math.max(0, totalAmount - allocatedTotal);
    const paymentRecord: any = {
      paymentId: `PMT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId,
      paymentReference: paymentRef,
      customerId,
      customerName,
      amount: totalAmount,
      totalAmount,
      currency: params.currency || 'USD',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod,
      allocations: resolvedAllocations,
      unallocatedAmount: unallocated,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    pmtList.unshift(paymentRecord);
    this.customerPayments.set(tenantId, pmtList);

    ScmPersistenceService.getInstance().saveRecord('customer_payments', paymentRecord.paymentId, paymentRecord).catch(() => {});

    KernelEventBus.getInstance().publish('PAYMENT_ALLOCATED', paymentRecord, {
      tenant: { organizationId: tenantId, organizationName: tenantId },
      actor: { id: 'AR_TREASURY', type: 'USER', name: 'Treasury Admin' }
    });

    const updatedInvoices = resolvedAllocations.map(a => list.find(i => i.invoiceId === a.invoiceId)!).filter(Boolean);
    const result: any = {
      ...paymentRecord,
      paymentRecord,
      updatedInvoices
    };

    return result;
  }

  /**
   * Computes authoritative Accounts Receivable (AR) aging summary from actual active records.
   */
  public calculateArAging(tenantId: string, asOfDate?: string): any {
    const list = this.customerInvoices.get(tenantId) || [];
    const now = asOfDate ? new Date(asOfDate) : new Date();
    const nowTime = now.getTime();
    const oneWeekLater = nowTime + 7 * 86400000;
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();

    let totalExposure = 0;
    let currentAmount = 0;
    let days1_30 = 0;
    let days31_60 = 0;
    let days61_90 = 0;
    let days90Plus = 0;
    let overdueAmount = 0;
    let dueThisWeek = 0;
    let dueThisMonth = 0;

    const customerMap: Map<string, { customerId: string; customerName: string; outstanding: number; overdue: number }> = new Map();

    for (const inv of list) {
      if (inv.outstandingBalance <= 0 || inv.status === 'CANCELLED' || inv.status === 'CREDITED') continue;

      totalExposure += inv.outstandingBalance;
      const dueTime = new Date(inv.dueDate).getTime();
      const diffDays = Math.floor((nowTime - dueTime) / 86400000);

      if (diffDays <= 0) {
        currentAmount += inv.outstandingBalance;
      } else {
        overdueAmount += inv.outstandingBalance;
        if (diffDays <= 30) days1_30 += inv.outstandingBalance;
        else if (diffDays <= 60) days31_60 += inv.outstandingBalance;
        else if (diffDays <= 90) days61_90 += inv.outstandingBalance;
        else days90Plus += inv.outstandingBalance;
      }

      if (dueTime >= nowTime && dueTime <= oneWeekLater) {
        dueThisWeek += inv.outstandingBalance;
      }
      if (dueTime >= nowTime && dueTime <= endOfMonth) {
        dueThisMonth += inv.outstandingBalance;
      }

      // Customer exposure breakdown
      const custKey = inv.customerId;
      const existing = customerMap.get(custKey) || {
        customerId: inv.customerId,
        customerName: inv.customerName || inv.customerId,
        outstanding: 0,
        overdue: 0
      };
      existing.outstanding += inv.outstandingBalance;
      if (diffDays > 0) existing.overdue += inv.outstandingBalance;
      customerMap.set(custKey, existing);
    }

    const customerExposures = Array.from(customerMap.values())
      .sort((a, b) => b.outstanding - a.outstanding);

    return {
      totalExposure: Math.round(totalExposure * 100) / 100,
      totalOutstanding: Math.round(totalExposure * 100) / 100,
      currentAmount: Math.round(currentAmount * 100) / 100,
      CURRENT: Math.round(currentAmount * 100) / 100,
      days1_30: Math.round(days1_30 * 100) / 100,
      BUCKET_1_30: Math.round(days1_30 * 100) / 100,
      days31_60: Math.round(days31_60 * 100) / 100,
      BUCKET_31_60: Math.round(days31_60 * 100) / 100,
      days61_90: Math.round(days61_90 * 100) / 100,
      BUCKET_61_90: Math.round(days61_90 * 100) / 100,
      days90Plus: Math.round(days90Plus * 100) / 100,
      BUCKET_90_PLUS: Math.round(days90Plus * 100) / 100,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
      dueThisWeek: Math.round(dueThisWeek * 100) / 100,
      dueThisMonth: Math.round(dueThisMonth * 100) / 100,
      invoiceCount: list.filter(i => i.outstandingBalance > 0).length,
      customerExposures
    };
  }

  /**
   * Creates a Supplier AP record from an ingested invoice.
   */
  public createSupplierApRecord(params: {
    tenantId: string;
    supplierInvoiceId: string;
    supplierInvoiceNumber?: string;
    supplierId: string;
    supplierName?: string;
    poId: string;
    grnId?: string;
    totalPayableAmount: number;
    dueDate: string;
    matchStatus?: SupplierApLedgerRecord['matchStatus'];
    paymentTerms?: string;
    currency?: string;
    lineItems?: SupplierInvoiceLineItem[];
    discrepancyDetails?: string;
  }): SupplierApLedgerRecord {
    const apId = `AP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const agingBucket = this.computeAgingBucket(params.dueDate);

    const record: SupplierApLedgerRecord = {
      apId,
      tenantId: params.tenantId,
      supplierInvoiceId: params.supplierInvoiceId,
      supplierInvoiceNumber: params.supplierInvoiceNumber || params.supplierInvoiceId,
      supplierId: params.supplierId,
      supplierName: params.supplierName || params.supplierId,
      poId: params.poId,
      grnId: params.grnId,
      totalPayableAmount: params.totalPayableAmount,
      paidAmount: 0,
      outstandingBalance: params.totalPayableAmount,
      currency: params.currency || 'USD',
      dueDate: params.dueDate,
      paymentTerms: params.paymentTerms || 'NET_30',
      matchStatus: params.matchStatus || '3_WAY_MATCHED',
      paymentStatus: 'UNPAID',
      apAgingBucket: agingBucket,
      lineItems: params.lineItems,
      discrepancyDetails: params.discrepancyDetails,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const list = this.supplierApRecords.get(params.tenantId) || [];
    list.unshift(record);
    this.supplierApRecords.set(params.tenantId, list);

    ScmPersistenceService.getInstance().saveRecord('supplier_ap_records', apId, record).catch(err => {
      console.warn(`[FINANCIAL-LEDGER] Supplier AP persistence notice:`, err);
    });

    KernelEventBus.getInstance().publish('SUPPLIER_AP_CREATED', record, {
      tenant: { organizationId: params.tenantId, organizationName: params.tenantId },
      actor: { id: 'AP_ENGINE', type: 'SYSTEM', name: 'AP Engine' }
    });

    return record;
  }

  /**
   * Executes authoritative Three-Way Matching comparing PO lines vs GRN lines vs Invoice lines.
   */
  public performThreeWayMatch(
    tenantIdOrParams: string | any,
    maybeParams?: any
  ): any {
    let tenantId = 'demo-tenant';
    let params: any;

    if (typeof tenantIdOrParams === 'string') {
      tenantId = tenantIdOrParams;
      params = maybeParams || {};
    } else {
      params = tenantIdOrParams;
      tenantId = params.tenantId || tenantId;
    }

    if (params.lines && Array.isArray(params.lines)) {
      params.poLines = params.lines.map((l: any, idx: number) => ({
        productId: l.productId || `PROD-${idx + 1}`,
        productName: l.productName || `Item ${idx + 1}`,
        quantity: l.poQuantity !== undefined ? l.poQuantity : 0,
        unitPrice: l.poUnitPrice !== undefined ? l.poUnitPrice : 0,
      }));
      params.grnLines = params.lines.map((l: any, idx: number) => ({
        productId: l.productId || `PROD-${idx + 1}`,
        receivedQuantity: l.grnAcceptedQuantity !== undefined ? l.grnAcceptedQuantity : l.receivedQuantity !== undefined ? l.receivedQuantity : 0,
      }));
      params.invoiceLines = params.lines.map((l: any, idx: number) => ({
        productId: l.productId || `PROD-${idx + 1}`,
        productName: l.productName || `Item ${idx + 1}`,
        invoicedQuantity: l.invoiceQuantity !== undefined ? l.invoiceQuantity : 0,
        invoicedUnitPrice: l.invoiceUnitPrice !== undefined ? l.invoiceUnitPrice : 0,
      }));
    }

    const priceTol = params.priceTolerancePercentage !== undefined ? params.priceTolerancePercentage : (params.tolerancePercent !== undefined ? params.tolerancePercent : 2.0);
    const qtyTol = params.quantityTolerancePercentage !== undefined ? params.quantityTolerancePercentage : (params.tolerancePercent !== undefined ? params.tolerancePercent : 1.0);
    const discrepancies: ThreeWayMatchResult['discrepancies'] = [];

    let totalPoAmount = 0;
    let totalGrnAmount = 0;
    let totalInvoicedAmount = 0;
    let hasPriceVariance = false;
    let hasQtyVariance = false;

    const poLines = params.poLines || [];
    const grnLines = params.grnLines || [];
    const invoiceLines = params.invoiceLines || [];

    // Map for fast lookup
    const poMap = new Map<string, any>(poLines.map((p: any) => [p.productId, p]));
    const grnMap = new Map<string, any>(grnLines.map((g: any) => [g.productId, g]));

    for (const invLine of invoiceLines) {
      const lineTotal = invLine.invoicedQuantity * invLine.invoicedUnitPrice;
      totalInvoicedAmount += lineTotal;

      const poLine = poMap.get(invLine.productId);
      const grnLine = grnMap.get(invLine.productId);

      if (!poLine) {
        discrepancies.push({
          productId: invLine.productId,
          productName: invLine.productName || invLine.productId,
          type: 'MISSING_PO',
          expected: 0,
          actual: invLine.invoicedQuantity,
          difference: invLine.invoicedQuantity
        });
        hasQtyVariance = true;
        continue;
      }

      totalPoAmount += poLine.quantity * poLine.unitPrice;

      if (!grnLine) {
        discrepancies.push({
          productId: invLine.productId,
          productName: invLine.productName || poLine.productName || invLine.productId,
          type: 'MISSING_GRN',
          expected: 0,
          actual: invLine.invoicedQuantity,
          difference: invLine.invoicedQuantity
        });
        hasQtyVariance = true;
        continue;
      }

      totalGrnAmount += grnLine.receivedQuantity * poLine.unitPrice;

      // Quantity comparison: Invoiced qty cannot exceed Received accepted qty beyond tolerance
      const qtyDiff = invLine.invoicedQuantity - grnLine.receivedQuantity;
      const qtyDiffPct = grnLine.receivedQuantity > 0 ? (Math.abs(qtyDiff) / grnLine.receivedQuantity) * 100 : 100;
      if (qtyDiffPct > qtyTol && qtyDiff > 0) {
        discrepancies.push({
          productId: invLine.productId,
          productName: invLine.productName || poLine.productName || invLine.productId,
          type: 'QUANTITY',
          expected: grnLine.receivedQuantity,
          actual: invLine.invoicedQuantity,
          difference: qtyDiff
        });
        hasQtyVariance = true;
      }

      // Price comparison: Invoiced unit price cannot exceed PO agreed unit price beyond tolerance
      const priceDiff = invLine.invoicedUnitPrice - poLine.unitPrice;
      const priceDiffPct = poLine.unitPrice > 0 ? (Math.abs(priceDiff) / poLine.unitPrice) * 100 : 100;
      if (priceDiffPct > priceTol && priceDiff > 0) {
        discrepancies.push({
          productId: invLine.productId,
          productName: invLine.productName || poLine.productName || invLine.productId,
          type: 'PRICE',
          expected: poLine.unitPrice,
          actual: invLine.invoicedUnitPrice,
          difference: priceDiff
        });
        hasPriceVariance = true;
      }
    }

    let matchStatus: string = '3_WAY_MATCHED';
    if (hasPriceVariance && hasQtyVariance) {
      matchStatus = 'DISCREPANCY_UNRESOLVED';
    } else if (hasPriceVariance) {
      matchStatus = 'DISCREPANCY_PRICE';
    } else if (hasQtyVariance) {
      matchStatus = 'DISCREPANCY_QUANTITY';
    }

    const priceVariance = Math.max(0, totalInvoicedAmount - totalPoAmount);
    const quantityVariance = Math.max(0, totalInvoicedAmount - totalGrnAmount);
    const varianceAmount = priceVariance || quantityVariance;

    const summary = matchStatus === '3_WAY_MATCHED'
      ? '3-Way Match Passed within configured tolerance limits.'
      : `Discrepancies identified: ${discrepancies.length} variance items (${matchStatus}).`;

    return {
      matchStatus: matchStatus as any,
      isMatched: matchStatus === '3_WAY_MATCHED',
      hasPriceVariance,
      hasQuantityVariance: hasQtyVariance,
      varianceAmount: Math.round(varianceAmount * 100) / 100,
      totalPoAmount: Math.round(totalPoAmount * 100) / 100,
      totalGrnAmount: Math.round(totalGrnAmount * 100) / 100,
      totalInvoicedAmount: Math.round(totalInvoicedAmount * 100) / 100,
      priceVariance: Math.round(priceVariance * 100) / 100,
      quantityVariance: Math.round(quantityVariance * 100) / 100,
      discrepancies,
      summary,
      notes: summary
    };
  }

  /**
   * Schedules an approved AP payment.
   */
  public scheduleApPayment(tenantId: string, apId: string, scheduledDate: string, paymentBatchRef?: string): SupplierApLedgerRecord {
    const list = this.supplierApRecords.get(tenantId) || [];
    const ap = list.find(a => a.apId === apId);
    if (!ap) throw new Error(`Supplier AP Record ${apId} not found`);

    if (ap.matchStatus === 'MISMATCH' || ap.matchStatus === 'PRICE_VARIANCE') {
      throw new Error(`Cannot schedule payment for AP record with unresolved variance (${ap.matchStatus}).`);
    }

    ap.paymentStatus = 'SCHEDULED';
    ap.scheduledPaymentDate = scheduledDate;
    ap.paymentBatchReference = paymentBatchRef || `BATCH-${Date.now().toString().slice(-5)}`;
    ap.updatedAt = new Date().toISOString();

    ScmPersistenceService.getInstance().saveRecord('supplier_ap_records', apId, ap).catch(() => {});

    KernelEventBus.getInstance().publish('SUPPLIER_PAYMENT_SCHEDULED', ap, {
      tenant: { organizationId: tenantId, organizationName: tenantId },
      actor: { id: 'AP_TREASURY', type: 'USER', name: 'AP Treasury' }
    });

    return ap;
  }

  /**
   * Executes/confirms payment for an AP record.
   */
  public executeApPayment(tenantId: string, apId: string, paymentRef: string, paidAmount?: number): SupplierApLedgerRecord {
    const list = this.supplierApRecords.get(tenantId) || [];
    const ap = list.find(a => a.apId === apId);
    if (!ap) throw new Error(`Supplier AP Record ${apId} not found`);

    const amount = paidAmount !== undefined ? paidAmount : ap.outstandingBalance;
    ap.paidAmount += amount;
    ap.outstandingBalance = Math.max(0, ap.totalPayableAmount - ap.paidAmount);
    ap.paymentStatus = ap.outstandingBalance === 0 ? 'PAID' : 'SCHEDULED';
    ap.paymentBatchReference = paymentRef;
    ap.apAgingBucket = ap.outstandingBalance === 0 ? 'CURRENT' : this.computeAgingBucket(ap.dueDate);
    ap.updatedAt = new Date().toISOString();

    ScmPersistenceService.getInstance().saveRecord('supplier_ap_records', apId, ap).catch(() => {});

    KernelEventBus.getInstance().publish('SUPPLIER_PAYMENT_EXECUTED', {
      apId,
      paidAmount: amount,
      outstandingBalance: ap.outstandingBalance,
      paymentRef,
      supplierId: ap.supplierId
    }, {
      tenant: { organizationId: tenantId, organizationName: tenantId },
      actor: { id: 'AP_DISBURSEMENT', type: 'USER', name: 'Disbursement Admin' }
    });

    return ap;
  }

  /**
   * Computes authoritative Accounts Payable (AP) aging summary.
   */
  public calculateApAging(tenantId: string): ApAgingSummary {
    const list = this.supplierApRecords.get(tenantId) || [];
    const now = new Date();
    const nowTime = now.getTime();

    let totalLiabilities = 0;
    let currentAmount = 0;
    let days1_30 = 0;
    let days31_60 = 0;
    let days61_90 = 0;
    let days90Plus = 0;
    let overdueAmount = 0;
    let upcomingScheduled = 0;
    let unmatchedCount = 0;
    let awaitingApprovalCount = 0;

    const supplierMap: Map<string, { supplierId: string; supplierName: string; outstanding: number; scheduled: number }> = new Map();

    for (const ap of list) {
      if (ap.outstandingBalance <= 0 || ap.paymentStatus === 'PAID') continue;

      totalLiabilities += ap.outstandingBalance;
      const dueTime = new Date(ap.dueDate).getTime();
      const diffDays = Math.floor((nowTime - dueTime) / 86400000);

      if (diffDays <= 0) {
        currentAmount += ap.outstandingBalance;
      } else {
        overdueAmount += ap.outstandingBalance;
        if (diffDays <= 30) days1_30 += ap.outstandingBalance;
        else if (diffDays <= 60) days31_60 += ap.outstandingBalance;
        else if (diffDays <= 90) days61_90 += ap.outstandingBalance;
        else days90Plus += ap.outstandingBalance;
      }

      if (ap.paymentStatus === 'SCHEDULED') {
        upcomingScheduled += ap.outstandingBalance;
      }
      if (ap.matchStatus !== '3_WAY_MATCHED') {
        unmatchedCount++;
      }
      if (ap.paymentStatus === 'UNPAID' && ap.matchStatus === '3_WAY_MATCHED') {
        awaitingApprovalCount++;
      }

      const suppKey = ap.supplierId;
      const existing = supplierMap.get(suppKey) || {
        supplierId: ap.supplierId,
        supplierName: ap.supplierName || ap.supplierId,
        outstanding: 0,
        scheduled: 0
      };
      existing.outstanding += ap.outstandingBalance;
      if (ap.paymentStatus === 'SCHEDULED') existing.scheduled += ap.outstandingBalance;
      supplierMap.set(suppKey, existing);
    }

    return {
      totalLiabilities: Math.round(totalLiabilities * 100) / 100,
      currentAmount: Math.round(currentAmount * 100) / 100,
      days1_30: Math.round(days1_30 * 100) / 100,
      days31_60: Math.round(days31_60 * 100) / 100,
      days61_90: Math.round(days61_90 * 100) / 100,
      days90Plus: Math.round(days90Plus * 100) / 100,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
      upcomingScheduled: Math.round(upcomingScheduled * 100) / 100,
      unmatchedCount,
      awaitingApprovalCount,
      supplierLiabilities: Array.from(supplierMap.values()).sort((a, b) => b.outstanding - a.outstanding)
    };
  }

  public getCustomerInvoices(tenantId: string): CustomerInvoiceRecord[] {
    return this.customerInvoices.get(tenantId) || [];
  }

  public getSupplierApRecords(tenantId: string): SupplierApLedgerRecord[] {
    return this.supplierApRecords.get(tenantId) || [];
  }

  public getCustomerPayments(tenantId: string): CustomerPaymentRecord[] {
    return this.customerPayments.get(tenantId) || [];
  }

  public clear(): void {
    this.customerInvoices.clear();
    this.supplierApRecords.clear();
    this.customerPayments.clear();
    this.initializedTenants.clear();
    this.hydrationPromises.clear();
  }
}

export const financialLedgerEngine = FinancialLedgerEngine.getInstance();
