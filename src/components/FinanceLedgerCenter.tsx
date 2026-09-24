import React, { useState } from 'react';
import { 
  CreditCard, DollarSign, Calendar, RefreshCw, CheckCircle2, 
  AlertCircle, ArrowUpRight, ArrowDownLeft, FileText, PieChart
} from 'lucide-react';
import { 
  financialLedgerEngine, 
  CustomerInvoiceRecord, 
  SupplierApLedgerRecord 
} from '../scm';
import { useAuth } from '../store/AuthContext';

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

  const refreshAll = () => {
    setCustomerInvoices(financialLedgerEngine.getCustomerInvoices(tenantId));
    setSupplierAp(financialLedgerEngine.getSupplierApRecords(tenantId));
  };

  const handleSimulateInvoice = () => {
    financialLedgerEngine.generateCustomerInvoice({
      tenantId,
      orderId: `ORD-${Date.now().toString().slice(-5)}`,
      customerId: 'CUST-GLOBAL-AEROSPACE',
      subtotal: 12500,
      taxAmount: 1125,
      dueDate: '2026-11-01',
      currency: 'USD'
    });
    refreshAll();
  };

  const handleSimulateAp = () => {
    financialLedgerEngine.createSupplierApRecord({
      tenantId,
      supplierInvoiceId: `SINV-${Date.now().toString().slice(-5)}`,
      supplierId: 'SUP-TITANIUM-METALS',
      poId: 'PO-2026-0098',
      totalPayableAmount: 8400,
      dueDate: '2026-10-30',
      matchStatus: '3_WAY_MATCHED'
    });
    refreshAll();
  };

  const handlePayInvoice = (invoiceId: string, amount: number) => {
    financialLedgerEngine.recordCustomerPayment(tenantId, invoiceId, amount, `WIRE-TX-${Date.now().toString().slice(-6)}`);
    refreshAll();
  };

  // Compute AR Aging totals
  const totalArExposure = customerInvoices.reduce((acc, i) => acc + i.outstandingBalance, 0);
  const totalApLiability = supplierAp.reduce((acc, a) => acc + a.outstandingBalance, 0);

  return (
    <div className="w-full h-full flex flex-col space-y-6 p-6 bg-[#03060E] text-white overflow-y-auto font-sans" data-testid="finance-ledger-center">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
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
            Reconciliation Engine: Customer Billing, Collections, Supplier Payables, and Cash Settlement.
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
            <button 
              onClick={handleSimulateInvoice}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium transition-colors"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Issue Customer Invoice
            </button>
          ) : (
            <button 
              onClick={handleSimulateAp}
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

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-2">
        <button 
          onClick={() => setActiveTab('AR')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'AR' ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' : 'text-white/60 hover:text-white'
          }`}
        >
          Customer Invoices & AR Aging ({customerInvoices.length})
        </button>
        <button 
          onClick={() => setActiveTab('AP')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'AP' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-white/60 hover:text-white'
          }`}
        >
          Supplier Accounts Payable ({supplierAp.length})
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
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                        Bucket: {inv.arAgingBucket}
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
                        onClick={() => handlePayInvoice(inv.invoiceId, inv.outstandingBalance)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-colors"
                      >
                        Record Payment
                      </button>
                    )}
                  </div>
                </div>
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
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-semibold">
                        {ap.matchStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 mt-1">
                      PO Reference: {ap.poId} • Payment Due: {ap.dueDate}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-white">${ap.totalPayableAmount.toLocaleString()}</span>
                    <span className="text-[10px] text-emerald-400 block">{ap.paymentStatus}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
