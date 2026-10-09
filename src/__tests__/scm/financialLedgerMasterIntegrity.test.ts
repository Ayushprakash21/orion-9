import { describe, it, expect, beforeEach } from 'vitest';
import { FinancialLedgerEngine } from '../../scm/FinancialLedgerEngine';
import { ScmPersistenceService } from '../../services/scm/ScmPersistenceService';

describe('FinancialLedgerEngine Master Integrity Suite', () => {
  const engine = FinancialLedgerEngine.getInstance();
  const persistence = ScmPersistenceService.getInstance();
  const TENANT_A = 'tenant_fin_alpha';
  const TENANT_B = 'tenant_fin_beta';

  beforeEach(() => {
    persistence.clear();
    engine.clear();
  });

  it('generates customer invoice with calculated line items and persists record', async () => {
    const inv = engine.generateCustomerInvoice({
      tenantId: TENANT_A,
      orderId: 'SO-1001',
      customerId: 'CUST-01',
      customerName: 'AeroCorp Global',
      subtotal: 10000,
      taxAmount: 800,
      freightAmount: 200,
      discountAmount: 500,
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      lineItems: [
        {
          productId: 'PRD-1',
          productName: 'Titanium Fastener',
          quantity: 100,
          unitPrice: 100,
          lineTotal: 10000,
          taxRate: 8,
        }
      ]
    });

    expect(inv.totalAmount).toBe(10500); // 10000 + 800 + 200 - 500
    expect(inv.outstandingBalance).toBe(10500);
    expect(inv.paidAmount).toBe(0);
    expect(inv.status).toBe('ISSUED');
  });

  it('rejects non-positive payment amounts', () => {
    const inv = engine.generateCustomerInvoice({
      tenantId: TENANT_A,
      orderId: 'SO-1002',
      customerId: 'CUST-02',
      subtotal: 5000,
      taxAmount: 0,
      dueDate: '2026-11-01',
    });

    expect(() => {
      engine.recordCustomerPayment(TENANT_A, inv.invoiceId, 0, 'WIRE-BAD-0');
    }).toThrow(/Payment amount must be strictly greater than 0/);

    expect(() => {
      engine.recordCustomerPayment(TENANT_A, inv.invoiceId, -500, 'WIRE-BAD-NEG');
    }).toThrow(/Payment amount must be strictly greater than 0/);
  });

  it('rejects overpayments exceeding outstanding balance', () => {
    const inv = engine.generateCustomerInvoice({
      tenantId: TENANT_A,
      orderId: 'SO-1003',
      customerId: 'CUST-03',
      subtotal: 2000,
      taxAmount: 0,
      dueDate: '2026-11-01',
    });

    expect(() => {
      engine.recordCustomerPayment(TENANT_A, inv.invoiceId, 2500, 'WIRE-OVERPAY');
    }).toThrow(/exceeds outstanding balance/);
  });

  it('rejects duplicate payment references', () => {
    const inv = engine.generateCustomerInvoice({
      tenantId: TENANT_A,
      orderId: 'SO-1004',
      customerId: 'CUST-04',
      subtotal: 3000,
      taxAmount: 0,
      dueDate: '2026-11-01',
    });

    engine.recordCustomerPayment(TENANT_A, inv.invoiceId, 1000, 'WIRE-DUP-1');

    expect(() => {
      engine.recordCustomerPayment(TENANT_A, inv.invoiceId, 1000, 'WIRE-DUP-1');
    }).toThrow(/has already been recorded/);
  });

  it('enforces exact match and discrepancy detection in Three-Way Matching', () => {
    // 1. Exact match
    const exact = engine.performThreeWayMatch(TENANT_A, {
      poLines: [
        { productId: 'P-1', productName: 'Composite', quantity: 100, unitPrice: 50 }
      ],
      grnLines: [
        { productId: 'P-1', productName: 'Composite', receivedQuantity: 100 }
      ],
      invoiceLines: [
        { productId: 'P-1', productName: 'Composite', invoicedQuantity: 100, invoicedUnitPrice: 50 }
      ],
      priceTolerancePercentage: 1.0,
      quantityTolerancePercentage: 1.0,
    });
    expect(exact.isMatched).toBe(true);
    expect(exact.matchStatus).toBe('3_WAY_MATCHED');

    // 2. Quantity variance
    const qtyVar = engine.performThreeWayMatch(TENANT_A, {
      poLines: [
        { productId: 'P-1', productName: 'Composite', quantity: 100, unitPrice: 50 }
      ],
      grnLines: [
        { productId: 'P-1', productName: 'Composite', receivedQuantity: 80 }
      ],
      invoiceLines: [
        { productId: 'P-1', productName: 'Composite', invoicedQuantity: 100, invoicedUnitPrice: 50 }
      ],
      quantityTolerancePercentage: 1.0,
    });
    expect(qtyVar.isMatched).toBe(false);
    expect(qtyVar.hasQuantityVariance).toBe(true);

    // 3. Price variance
    const priceVar = engine.performThreeWayMatch(TENANT_A, {
      poLines: [
        { productId: 'P-1', productName: 'Composite', quantity: 100, unitPrice: 50 }
      ],
      grnLines: [
        { productId: 'P-1', productName: 'Composite', receivedQuantity: 100 }
      ],
      invoiceLines: [
        { productId: 'P-1', productName: 'Composite', invoicedQuantity: 100, invoicedUnitPrice: 65 }
      ],
      priceTolerancePercentage: 2.0,
    });
    expect(priceVar.isMatched).toBe(false);
    expect(priceVar.hasPriceVariance).toBe(true);
  });

  it('maintains strict tenant isolation across financial ledgers', async () => {
    engine.generateCustomerInvoice({
      tenantId: TENANT_A,
      orderId: 'SO-A',
      customerId: 'CUST-A',
      subtotal: 50000,
      taxAmount: 0,
      dueDate: '2026-11-01',
    });

    engine.generateCustomerInvoice({
      tenantId: TENANT_B,
      orderId: 'SO-B',
      customerId: 'CUST-B',
      subtotal: 12000,
      taxAmount: 0,
      dueDate: '2026-11-01',
    });

    const agingA = engine.calculateArAging(TENANT_A);
    const agingB = engine.calculateArAging(TENANT_B);

    expect(agingA.totalExposure).toBe(50000);
    expect(agingB.totalExposure).toBe(12000);
    expect(agingA.customerExposures.some(c => c.customerId === 'CUST-B')).toBe(false);
  });
});
