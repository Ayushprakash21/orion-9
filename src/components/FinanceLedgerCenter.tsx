import React, { useState, useMemo } from 'react';
import { 
  CreditCard, DollarSign, Calendar, RefreshCw, CheckCircle2, 
  AlertCircle, ArrowUpRight, ArrowDownLeft, FileText, PieChart,
  Plus, Check, X, ShieldCheck, AlertTriangle, Layers, Split
} from 'lucide-react';
import { 
  financialLedgerEngine, 
  CustomerInvoiceRecord, 
  SupplierApLedgerRecord,
  CustomerInvoiceLineItem 
} from '../scm';
import { useAuth } from '../store/AuthContext';
import { formatCurrency } from '../lib/formatters';

export const FinanceLedgerCenter: React.FC = () => {
  const { profile } = useAuth();
  const tenantId = profile?.organizationId || 'demo-tenant';

  const [customerInvoices, setCustomerInvoices] = useState<CustomerInvoiceRecord[]>(() => 
    financialLedgerEngine.getCustomerInvoices(tenantId)
  );
  const [supplierAp, setSupplierAp] = useState<SupplierApLedgerRecord[]>(() => 
    financialLedgerEngine.getSupplierApRecords(tenantId)
  );

  const [activeTab, setActiveTab] = useState<'AR' | 'AP'>('AR');

  // Modals
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showMatchModal, setShowMatchModal] = useState<boolean>(false);
  const [selectedAp, setSelectedAp] = useState<SupplierApLedgerRecord | null>(null);

  // Invoice Form State
  const [invOrderId, setInvOrderId] = useState<string>('SO-2026-904');
  const [invCustomerId, setInvCustomerId] = useState<string>('CUST-APEX-HEALTH');
  const [invDueDate, setInvDueDate] = useState<string>('2026-11-15');
  const [invLines, setInvLines] = useState<CustomerInvoiceLineItem[]>([
    {
      lineItemId: 'line-1',
      sku: 'SKU-MED-9901',
      description: 'Sterile Bioreactor Cassettes 500mL',
      quantity: 50,
      unitPrice: 240,
      taxRate: 0.08,
      lineTotal: 12960,
    },
    {
      lineItemId: 'line-2',
      sku: 'SKU-MED-9904',
      description: 'Cryogenic Transfer Vials (Pack of 100)',
      quantity: 20,
      unitPrice: 110,
      taxRate: 0.08,
      lineTotal: 2376,
    },
  ]);

  // Payment Form State
  const [payCustomerId, setPayCustomerId] = useState<string>('CUST-APEX-HEALTH');
  const [payAmount, setPayAmount] = useState<number>(10000);
  const [payRef, setPayRef] = useState<string>('WIRE-TX-99012');
  const [payMethod, setPayMethod] = useState<'WIRE' | 'ACH' | 'CHECK' | 'CARD'>('WIRE');
  const [selectedInvoicesForPay, setSelectedInvoicesForPay] = useState<Record<string, number>>({});

  // 3-Way Match State
  const [matchPoQty, setMatchPoQty] = useState<number>(100);
  const [matchGrnQty, setMatchGrnQty] = useState<number>(100);
  const [matchInvQty, setMatchInvQty] = useState<number>(100);
  const [matchPoPrice, setMatchPoPrice] = useState<number>(84);
  const [matchInvPrice, setMatchInvPrice] = useState<number>(84);
  const [matchResult, setMatchResult] = useState<any>(null);

  const refreshAll = () => {
    setCustomerInvoices(financialLedgerEngine.getCustomerInvoices(tenantId));
    setSupplierAp(financialLedgerEngine.getSupplierApRecords(tenantId));
  };

  const agingReport = useMemo(() => {
    return financialLedgerEngine.calculateArAging(tenantId);
  }, [customerInvoices, tenantId]);

  const totalArExposure = useMemo(() => {
    return customerInvoices.reduce((acc, i) => acc + i.outstandingBalance, 0);
  }, [customerInvoices]);

  const totalApLiability = useMemo(() => {
    return supplierAp.reduce((acc, a) => acc + a.outstandingBalance, 0);
  }, [supplierAp]);

  const handleCreateCustomerInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = invLines.reduce((acc, l) => acc + (l.quantity * l.unitPrice), 0);
    const taxAmount = invLines.reduce((acc, l) => acc + (l.quantity * l.unitPrice * (l.taxRate || 0)), 0);

    financialLedgerEngine.generateCustomerInvoice({
      tenantId,
      orderId: invOrderId,
      customerId: invCustomerId,
      subtotal,
      taxAmount,
      dueDate: invDueDate,
      currency: 'USD',
      lineItems: invLines,
    });

    setShowInvoiceModal(false);
    refreshAll();
  };

  const handleExecutePaymentAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    const allocations = Object.entries(selectedInvoicesForPay)
      .filter(([_, amt]) => amt > 0)
      .map(([invoiceId, amount]) => ({ invoiceId, amount }));

    if (allocations.length === 0) return;

    financialLedgerEngine.allocateCustomerPayment(tenantId, {
      customerId: payCustomerId,
      paymentAmount: Number(payAmount),
      referenceNumber: payRef,
      paymentMethod: payMethod,
      allocations,
    });

    setShowPaymentModal(false);
    setSelectedInvoicesForPay({});
    refreshAll();
  };

  const handlePerformMatch = () => {
    if (!selectedAp) return;
    const result = financialLedgerEngine.performThreeWayMatch(tenantId, {
      poId: selectedAp.poId,
      grnId: `GRN-${selectedAp.poId.slice(-4)}`,
      supplierInvoiceId: selectedAp.supplierInvoiceId,
      lines: [
        {
          poQuantity: Number(matchPoQty),
          grnAcceptedQuantity: Number(matchGrnQty),
          invoiceQuantity: Number(matchInvQty),
          poUnitPrice: Number(matchPoPrice),
          invoiceUnitPrice: Number(matchInvPrice),
        },
      ],
      priceTolerancePercentage: 2.0,
      quantityTolerancePercentage: 1.0,
    });
    setMatchResult(result);
    refreshAll();
  };

  const handleScheduleApPayment = (apId: string) => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    financialLedgerEngine.scheduleApPayment(tenantId, apId, tomorrow, 'WIRE');
    refreshAll();
  };

  const handleExecuteApPayment = (apId: string) => {
    financialLedgerEngine.executeApPayment(tenantId, apId, `DISBURSE-TX-${Date.now().toString().slice(-6)}`);
    refreshAll();
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6 p-6 bg-[#03060E] text-white overflow-y-auto font-sans" data-testid="finance-ledger-center">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              Customer & Supplier Financial Ledger (AR / AP)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              5-BUCKET AR AGING & 3-WAY MATCH
            </span>
          </div>
          <p className="text-xs text-white/60 mt-1">
            Reconciliation Engine: Customer Billing, Multi-Invoice Payment Allocation, 3-Way Matching, and AP Disbursement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={refreshAll}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          {activeTab === 'AR' ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                Allocate Receipt
              </button>
              <button 
                onClick={() => setShowInvoiceModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium transition-colors"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Issue Customer Invoice
              </button>
            </div>
          ) : (
            <button 
              onClick={() => {
                financialLedgerEngine.createSupplierApRecord({
                  tenantId,
                  supplierInvoiceId: `SINV-${Date.now().toString().slice(-5)}`,
                  supplierId: 'SUP-TITANIUM-METALS',
                  poId: 'PO-2026-0098',
                  totalPayableAmount: 8400,
                  dueDate: '2026-11-20',
                  matchStatus: 'PENDING_MATCH'
                });
                refreshAll();
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium transition-colors"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Log Supplier Payable
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <span className="text-xs text-white/50 block">Total AR Outstanding</span>
          <span className="text-xl font-bold text-emerald-400 mt-1 block">${totalArExposure.toLocaleString()}</span>
          <span className="text-[10px] text-white/40">Incoming cash assets</span>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <span className="text-xs text-white/50 block">Total AP Liability</span>
          <span className="text-xl font-bold text-amber-400 mt-1 block">${totalApLiability.toLocaleString()}</span>
          <span className="text-[10px] text-white/40">Committed supplier liabilities</span>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <span className="text-xs text-white/50 block">Active Invoices Issued</span>
          <span className="text-xl font-bold text-white mt-1 block">{customerInvoices.length}</span>
          <span className="text-[10px] text-emerald-400">100% Tax Compliant</span>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <span className="text-xs text-white/50 block">3-Way Match Rate</span>
          <span className="text-xl font-bold text-emerald-400 mt-1 block">98.4%</span>
          <span className="text-[10px] text-white/40">PO-GRN-Invoice automated match</span>
        </div>
      </div>

      {/* 5-Bucket AR Aging Visual Breakdown (Active in AR Tab) */}
      {activeTab === 'AR' && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              Accounts Receivable Aging Analysis (5-Bucket Standard)
            </span>
            <span className="text-xs text-white/50">Total AR: ${agingReport.totalOutstanding.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-semibold text-emerald-300 block">CURRENT</span>
              <span className="text-base font-bold text-white mt-1 block">${agingReport.CURRENT.toLocaleString()}</span>
              <span className="text-[9px] text-emerald-300/70">Not yet due</span>
            </div>
            <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20">
              <span className="text-[10px] font-semibold text-sky-300 block">1 - 30 DAYS</span>
              <span className="text-base font-bold text-white mt-1 block">${agingReport.BUCKET_1_30.toLocaleString()}</span>
              <span className="text-[9px] text-sky-300/70">Past due</span>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] font-semibold text-amber-300 block">31 - 60 DAYS</span>
              <span className="text-base font-bold text-white mt-1 block">${agingReport.BUCKET_31_60.toLocaleString()}</span>
              <span className="text-[9px] text-amber-300/70">Early delinquency</span>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <span className="text-[10px] font-semibold text-orange-300 block">61 - 90 DAYS</span>
              <span className="text-base font-bold text-white mt-1 block">${agingReport.BUCKET_61_90.toLocaleString()}</span>
              <span className="text-[9px] text-orange-300/70">Late delinquency</span>
            </div>
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <span className="text-[10px] font-semibold text-rose-300 block">90+ DAYS</span>
              <span className="text-base font-bold text-white mt-1 block">${agingReport.BUCKET_90_PLUS.toLocaleString()}</span>
              <span className="text-[9px] text-rose-300/70">Collections alert</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-2">
        <button 
          onClick={() => setActiveTab('AR')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'AR' ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' : 'text-white/60 hover:text-white'
          }`}
        >
          Customer Invoices & Collections ({customerInvoices.length})
        </button>
        <button 
          onClick={() => setActiveTab('AP')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'AP' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-white/60 hover:text-white'
          }`}
        >
          Supplier Accounts Payable & 3-Way Match ({supplierAp.length})
        </button>
      </div>

      {/* Ledger Lists */}
      {activeTab === 'AR' ? (
        <div className="space-y-3">
          {customerInvoices.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-white/40 text-xs">
              No customer invoices generated yet. Click "Issue Customer Invoice" to simulate billing.
            </div>
          ) : (
            customerInvoices.map(inv => (
              <div key={inv.invoiceId} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{inv.invoiceNumber}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/80">{inv.customerId}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        inv.arAgingBucket === 'CURRENT' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                        inv.arAgingBucket === '1_30' ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20' :
                        inv.arAgingBucket === '31_60' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                      }`}>
                        Bucket: {inv.arAgingBucket}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        inv.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-300' :
                        inv.status === 'PARTIALLY_PAID' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-white/10 text-white/70'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 mt-1">
                      Order: {inv.orderId} • Issued: {inv.issueDate} • Due: {inv.dueDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-sm font-bold text-white">${inv.totalAmount.toLocaleString()}</span>
                      <span className="text-[10px] text-amber-300 block">Balance: ${inv.outstandingBalance.toLocaleString()}</span>
                    </div>

                    {inv.outstandingBalance > 0 && (
                      <button 
                        onClick={() => {
                          setSelectedInvoicesForPay({ [inv.invoiceId]: inv.outstandingBalance });
                          setPayCustomerId(inv.customerId);
                          setPayAmount(inv.outstandingBalance);
                          setShowPaymentModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-colors"
                      >
                        Record Payment
                      </button>
                    )}
                  </div>
                </div>

                {inv.lineItems && inv.lineItems.length > 0 && (
                  <div className="pt-2 border-t border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-white/40">Line Items ({inv.lineItems.length})</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      {inv.lineItems.map(item => (
                        <div key={item.lineItemId} className="p-2 rounded bg-white/[0.02] border border-white/5 text-[11px] flex justify-between">
                          <div>
                            <span className="font-medium text-white">{item.sku}</span>
                            <span className="text-white/50 block text-[10px]">{item.description}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-medium">${item.lineTotal.toLocaleString()}</span>
                            <span className="text-white/40 block text-[10px]">{item.quantity} @ ${item.unitPrice}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {supplierAp.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-white/40 text-xs">
              No supplier AP records logged. Click "Log Supplier Payable" above.
            </div>
          ) : (
            supplierAp.map(ap => (
              <div key={ap.apId} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{ap.supplierInvoiceId}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/80">{ap.supplierId}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                        ap.matchStatus === '3_WAY_MATCHED' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                        ap.matchStatus === 'DISCREPANCY_QUANTITY' || ap.matchStatus === 'DISCREPANCY_PRICE' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' :
                        'bg-blue-500/10 text-blue-300 border-blue-500/20'
                      }`}>
                        {ap.matchStatus}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/70">
                        {ap.paymentStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 mt-1">
                      PO Reference: {ap.poId} • Payment Due: {ap.dueDate}
                      {ap.scheduledPaymentDate && ` • Scheduled: ${ap.scheduledPaymentDate}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-sm font-bold text-white">${ap.totalPayableAmount.toLocaleString()}</span>
                      <span className="text-[10px] text-emerald-400 block">{ap.paymentStatus}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedAp(ap);
                          setShowMatchModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium transition-colors"
                      >
                        3-Way Match
                      </button>

                      {ap.paymentStatus === 'UNPAID' && (
                        <button
                          onClick={() => handleScheduleApPayment(ap.apId)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors"
                        >
                          Schedule
                        </button>
                      )}

                      {ap.paymentStatus === 'SCHEDULED' && (
                        <button
                          onClick={() => handleExecuteApPayment(ap.apId)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                        >
                          Disburse
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ISSUE INVOICE MODAL */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b101b] border border-white/20 rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Generate Customer Invoice with Line Items</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomerInvoice} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 block mb-1">Sales Order ID</label>
                  <input
                    type="text"
                    value={invOrderId}
                    onChange={(e) => setInvOrderId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60 block mb-1">Customer Identifier</label>
                  <input
                    type="text"
                    value={invCustomerId}
                    onChange={(e) => setInvCustomerId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={invDueDate}
                  onChange={(e) => setInvDueDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <span className="text-xs font-semibold text-white/70 block mb-2">Line Items</span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {invLines.map((line, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white">{line.sku}</span>
                        <span className="text-white/50 block text-[11px]">{line.description}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-400">${line.lineTotal.toLocaleString()}</span>
                        <span className="text-white/40 block text-[10px]">{line.quantity} units @ ${line.unitPrice}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-3 py-1.5 text-xs text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                >
                  Confirm & Post Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MULTI-INVOICE PAYMENT RECEIPT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b101b] border border-white/20 rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Record & Allocate Customer Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleExecutePaymentAllocation} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 block mb-1">Customer</label>
                  <input
                    type="text"
                    value={payCustomerId}
                    onChange={(e) => setPayCustomerId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60 block mb-1">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="WIRE">WIRE Transfer</option>
                    <option value="ACH">ACH Transfer</option>
                    <option value="CHECK">Check</option>
                    <option value="CARD">Credit Card</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 block mb-1">Remittance Reference</label>
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60 block mb-1">Payment Total Amount</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Allocate to Open Invoices</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {customerInvoices.filter(i => i.outstandingBalance > 0).map(inv => (
                    <div key={inv.invoiceId} className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium text-white">{inv.invoiceNumber}</span>
                        <span className="text-white/40 block text-[10px]">Due: {inv.dueDate} • Balance: ${inv.outstandingBalance.toLocaleString()}</span>
                      </div>
                      <input
                        type="number"
                        placeholder="Allocated $"
                        value={selectedInvoicesForPay[inv.invoiceId] || ''}
                        onChange={(e) => setSelectedInvoicesForPay({
                          ...selectedInvoicesForPay,
                          [inv.invoiceId]: Number(e.target.value)
                        })}
                        className="w-28 bg-white/10 border border-white/20 rounded px-2 py-1 text-right text-xs text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3 py-1.5 text-xs text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                >
                  Post & Allocate Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3-WAY MATCH INSPECTOR MODAL */}
      {showMatchModal && selectedAp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b101b] border border-white/20 rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                3-Way Match Verification
              </h3>
              <button onClick={() => setShowMatchModal(false)} className="text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs">
                <div className="font-semibold text-white">{selectedAp.supplierInvoiceId} • {selectedAp.supplierId}</div>
                <div className="text-white/50 mt-1">PO: {selectedAp.poId} • Amount: ${selectedAp.totalPayableAmount.toLocaleString()}</div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-white/60 block mb-1">PO Quantity</label>
                  <input
                    type="number"
                    value={matchPoQty}
                    onChange={(e) => setMatchPoQty(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/60 block mb-1">GRN Received Qty</label>
                  <input
                    type="number"
                    value={matchGrnQty}
                    onChange={(e) => setMatchGrnQty(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/60 block mb-1">Invoice Qty</label>
                  <input
                    type="number"
                    value={matchInvQty}
                    onChange={(e) => setMatchInvQty(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/60 block mb-1">PO Unit Price ($)</label>
                  <input
                    type="number"
                    value={matchPoPrice}
                    onChange={(e) => setMatchPoPrice(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/60 block mb-1">Invoice Unit Price ($)</label>
                  <input
                    type="number"
                    value={matchInvPrice}
                    onChange={(e) => setMatchInvPrice(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                Tolerances: 1.0% quantity variance allowed • 2.0% unit price variance allowed
              </div>

              {matchResult && (
                <div className={`p-3 rounded-lg border text-xs ${
                  matchResult.matchStatus === '3_WAY_MATCHED'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="font-bold">Result: {matchResult.matchStatus}</div>
                  <div className="mt-1">{matchResult.notes}</div>
                  <div className="mt-1 font-mono">Variance: ${matchResult.varianceAmount.toLocaleString()}</div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowMatchModal(false)}
                  className="px-3 py-1.5 text-xs text-white/60 hover:text-white"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handlePerformMatch}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
                >
                  Run 3-Way Match Check
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default FinanceLedgerCenter;
