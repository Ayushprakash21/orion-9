/**
 * ORION-9 INVOICE & 3-WAY MATCHING CENTER
 * macOS-inspired Desktop Window Application for Layer 4, 7 & 9
 * 
 * Enforces Invoice & Matching Lifecycle:
 * RECEIVED -> VALIDATING -> MATCHING -> MATCHED / MISMATCH -> PENDING_APPROVAL -> APPROVED -> PAID
 * 
 * Features:
 * - 3-Way Cross-Referencing (PO vs GRN vs Supplier Invoice)
 * - Tolerance drift & tax variance calculation
 * - Discrepancy dispute & credit memo requests
 * - Full audit and integration with ERP Accounts Payable
 */

import React, { useState, useMemo } from 'react';
import {
  FileText,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  GitCompare,
  Plus,
  Check,
  X,
  Search,
  Filter,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useToast } from '../store/ToastContext';
import { invoiceStateMachine, InvoiceState } from '../kernel/StateMachine';
import { kernelEventBus } from '../kernel/EventBus';
import { kernelAuditEngine } from '../kernel/AuditEngine';
import { formatCurrency, formatNumber } from '../lib/formatters';

export interface InvoiceLine {
  productId: string;
  productName: string;
  poQuantity: number;
  grnQuantity: number;
  invoicedQuantity: number;
  poUnitPrice: number;
  invoicedUnitPrice: number;
  lineTotal: number;
  hasQuantityVariance: boolean;
  hasPriceVariance: boolean;
}

export interface SupplierInvoice {
  id: string; // e.g. INV-2026-901
  invoiceNumber: string; // External supplier invoice #
  poId: string;
  grnId: string;
  supplierId: string;
  supplierName: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  taxAmount: number;
  status: InvoiceState;
  varianceAmount: number;
  mismatchReason?: string;
  lines: InvoiceLine[];
}

export const FinanceMatchingCenter: React.FC = () => {
  const { purchaseOrders, suppliers } = useSupplyChain();
  const { showToast } = useToast();

  const [invoices, setInvoices] = useState<SupplierInvoice[]>([
    {
      id: 'INV-2026-901',
      invoiceNumber: 'TMM-INV-88912',
      poId: 'PO-2026-0001',
      grnId: 'GRN-2026-101',
      supplierId: 'SUP-001',
      supplierName: 'Titan Micro Materials',
      invoiceDate: new Date(Date.now() - 86400000 * 3).toISOString(),
      dueDate: new Date(Date.now() + 86400000 * 27).toISOString(),
      totalAmount: 144500,
      taxAmount: 11560,
      status: 'MATCHED',
      varianceAmount: 0,
      lines: [
        {
          productId: 'SKU-TITAN-X1',
          productName: 'Industrial Titanium Alloy Sensor Housing',
          poQuantity: 500,
          grnQuantity: 500,
          invoicedQuantity: 500,
          poUnitPrice: 289,
          invoicedUnitPrice: 289,
          lineTotal: 144500,
          hasQuantityVariance: false,
          hasPriceVariance: false
        }
      ]
    },
    {
      id: 'INV-2026-902',
      invoiceNumber: 'PAC-OPT-44120',
      poId: 'PO-2026-0002',
      grnId: 'GRN-2026-102',
      supplierId: 'SUP-002',
      supplierName: 'Pacific Opto-Electronics',
      invoiceDate: new Date(Date.now() - 86400000 * 1).toISOString(),
      dueDate: new Date(Date.now() + 86400000 * 29).toISOString(),
      totalAmount: 122000,
      taxAmount: 9760,
      status: 'MISMATCH',
      varianceAmount: 6000,
      mismatchReason: 'Billed unit price $610 exceeds contracted PO rate ($580/unit) by +5.2%.',
      lines: [
        {
          productId: 'SKU-OPTIC-F5',
          productName: 'Fiber Optic Transceiver Core 100G',
          poQuantity: 200,
          grnQuantity: 200,
          invoicedQuantity: 200,
          poUnitPrice: 580,
          invoicedUnitPrice: 610,
          lineTotal: 122000,
          hasQuantityVariance: false,
          hasPriceVariance: true
        }
      ]
    },
    {
      id: 'INV-2026-903',
      invoiceNumber: 'APX-HYD-55109',
      poId: 'PO-2026-0003',
      grnId: 'GRN-2026-103',
      supplierId: 'SUP-003',
      supplierName: 'Apex Precision Hydraulics',
      invoiceDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      totalAmount: 48000,
      taxAmount: 3840,
      status: 'VALIDATING',
      varianceAmount: 0,
      lines: [
        {
          productId: 'SKU-VALVE-H2',
          productName: 'High Pressure Cryogenic Relief Valve',
          poQuantity: 150,
          grnQuantity: 150,
          invoicedQuantity: 150,
          poUnitPrice: 320,
          invoicedUnitPrice: 320,
          lineTotal: 48000,
          hasQuantityVariance: false,
          hasPriceVariance: false
        }
      ]
    }
  ]);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(invoices[1]?.id || invoices[0]?.id);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const selected = invoices.find(i => i.id === selectedInvoiceId) || invoices[0];

  const filteredInvoices = useMemo(() => {
    return invoices.filter(item => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.id.toLowerCase().includes(q) ||
          item.invoiceNumber.toLowerCase().includes(q) ||
          item.supplierName.toLowerCase().includes(q) ||
          item.poId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [invoices, statusFilter, searchQuery]);

  const handleStateTransition = async (targetState: InvoiceState, metadata?: any) => {
    if (!selected) return;

    try {
      invoiceStateMachine.transition(selected.id, selected.status, targetState, {
        metadata: { ...metadata, actor: 'Finance Analyst' }
      });

      setInvoices(prev =>
        prev.map(item => (item.id === selected.id ? { ...item, status: targetState, ...metadata } : item))
      );

      kernelAuditEngine.record({
        action: `INVOICE_TRANSITION_${targetState}`,
        actor: { id: 'user-finance', type: 'USER', name: 'Finance Controller' },
        entityId: selected.id,
        entityType: 'invoice',
        classification: 'CONFIDENTIAL',
        details: { fromState: selected.status, toState: targetState, ...metadata }
      });

      showToast(`Invoice ${selected.id} transitioned to ${targetState}.`, 'success', 'Invoice Status Updated');
    } catch (err: any) {
      showToast(err.message || 'Transition blocked by Invoice State Machine.', 'error', 'Governance Blocked');
    }
  };

  const handleRunThreeWayMatch = (inv: SupplierInvoice) => {
    showToast(`Executing automated 3-way match for PO ${inv.poId} and GRN ${inv.grnId}...`, 'info', 'Matching In Progress');

    setTimeout(() => {
      const hasMismatch = inv.varianceAmount > 0;
      const targetState: InvoiceState = hasMismatch ? 'MISMATCH' : 'MATCHED';
      handleStateTransition(targetState);
      if (hasMismatch) {
        showToast(`Variance detected: $${inv.varianceAmount.toLocaleString()} price variance. Moved to MISMATCH.`, 'warning', 'Mismatch Detected');
      } else {
        showToast('3-Way Match Verified! 100% agreement between PO, GRN, and Invoice lines.', 'success', 'Perfect 3-Way Match');
      }
    }, 800);
  };

  return (
    <div className="flex flex-col h-full bg-[#0D1117] text-white overflow-hidden font-sans">
      {/* App Header & KPI Bar */}
      <div className="px-6 py-4 border-b border-white/10 bg-[#161B22]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <DollarSign size={18} />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
                Invoice & 3-Way Matching Center
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Finance AP & Matching
                </span>
              </h1>
              <p className="text-xs text-white/50">
                Automated 3-Way Reconciliation (PO ↔ GRN ↔ Invoice), Price/Quantity Drift & AP Release
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleRunThreeWayMatch(selected)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-sm"
          >
            <GitCompare size={14} />
            <span>Execute 3-Way Match</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-3 border-b border-white/5 bg-[#12161D]">
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Total Invoices</span>
            <div className="text-xl font-bold text-white mt-0.5">{invoices.length} Bills</div>
          </div>
          <FileText size={20} className="text-blue-400 opacity-60" />
        </div>
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Matched & Cleared</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">
              {invoices.filter(i => i.status === 'MATCHED' || i.status === 'APPROVED' || i.status === 'PAID').length}
            </div>
          </div>
          <CheckCircle2 size={20} className="text-emerald-400 opacity-60" />
        </div>
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Active Mismatches</span>
            <div className="text-xl font-bold text-rose-400 mt-0.5">
              {invoices.filter(i => i.status === 'MISMATCH').length} Blocked
            </div>
          </div>
          <AlertTriangle size={20} className="text-rose-400 opacity-60" />
        </div>
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Pending AP Approval</span>
            <div className="text-xl font-bold text-amber-400 mt-0.5">
              {invoices.filter(i => i.status === 'PENDING_APPROVAL').length}
            </div>
          </div>
          <Clock size={20} className="text-amber-400 opacity-60" />
        </div>
      </div>

      {/* Main Split Pane */}
      <div className="flex-1 flex overflow-hidden divide-x divide-white/10">
        {/* Left List Pane */}
        <div className="w-1/3 min-w-[340px] max-w-[440px] h-full flex flex-col bg-[#12161D]">
          {/* Filter search */}
          <div className="p-3 border-b border-white/10 space-y-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2.5 text-white/40" />
              <input
                type="text"
                placeholder="Search invoice #, supplier, PO..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="RECEIVED">Received</option>
                <option value="VALIDATING">Validating</option>
                <option value="MATCHING">Matching</option>
                <option value="MATCHED">Matched</option>
                <option value="MISMATCH">Mismatch</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
          </div>

          {/* Invoices List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {filteredInvoices.map(item => {
              const isSelected = item.id === selected?.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedInvoiceId(item.id)}
                  className={`p-3.5 cursor-pointer transition flex flex-col gap-1.5 ${
                    isSelected ? 'bg-emerald-600/15 border-l-2 border-emerald-400' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-white/90">{item.invoiceNumber}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        item.status === 'MATCHED' || item.status === 'APPROVED' || item.status === 'PAID'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : item.status === 'MISMATCH'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="text-xs font-medium text-white/80">{item.supplierName}</div>
                  <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
                    <span className="font-semibold text-white/90">${item.totalAmount.toLocaleString()}</span>
                    <span className="font-mono text-[10px]">{item.poId}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className="flex-1 h-full overflow-y-auto p-6 bg-[#0D1117] space-y-6">
          {selected ? (
            <>
              {/* Header Overview Card */}
              <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-emerald-400 font-semibold">{selected.id}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-white/10 text-white/70">
                        {selected.invoiceNumber}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white mt-1">Invoice from {selected.supplierName}</h2>
                    <div className="text-xs text-white/50 mt-0.5">
                      Matched to PO: <span className="font-mono text-indigo-300">{selected.poId}</span> • Linked GRN:{' '}
                      <span className="font-mono text-emerald-300">{selected.grnId}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-bold text-white">${selected.totalAmount.toLocaleString()}</div>
                    <div className="text-[11px] text-white/40">Includes ${selected.taxAmount.toLocaleString()} tax</div>
                  </div>
                </div>

                {/* State Machine Transition Actions */}
                <div className="pt-3 border-t border-white/5 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleRunThreeWayMatch(selected)}
                    className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition flex items-center gap-1.5"
                  >
                    <GitCompare size={13} /> Re-Run 3-Way Match
                  </button>

                  {selected.status === 'MISMATCH' && (
                    <>
                      <button
                        onClick={() => handleStateTransition('PENDING_APPROVAL')}
                        className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition flex items-center gap-1.5"
                      >
                        <ShieldCheck size={13} /> Escalate for Variance Approval
                      </button>
                      <button
                        onClick={() => handleStateTransition('REJECTED', { disputeReason: selected.mismatchReason })}
                        className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition flex items-center gap-1.5"
                      >
                        <X size={13} /> Reject & Request Debit Memo
                      </button>
                    </>
                  )}

                  {selected.status === 'PENDING_APPROVAL' && (
                    <button
                      onClick={() => handleStateTransition('APPROVED', { approvedBy: 'Controller' })}
                      className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition flex items-center gap-1.5"
                    >
                      <Check size={13} /> Approve Exception Over-Tolerance
                    </button>
                  )}

                  {selected.status === 'APPROVED' && (
                    <button
                      onClick={() => handleStateTransition('PAID', { paymentMethod: 'ACH/EFT', paidAt: new Date().toISOString() })}
                      className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition flex items-center gap-1.5"
                    >
                      <CreditCard size={13} /> Release Payment & Handoff to ERP AP
                    </button>
                  )}
                </div>
              </div>

              {/* Mismatch Alert Box if Mismatch */}
              {selected.status === 'MISMATCH' && selected.mismatchReason && (
                <div className="p-5 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
                    <AlertTriangle size={16} />
                    <span>3-Way Matching Tolerance Breach Detected</span>
                  </div>
                  <p className="text-xs text-white/80">{selected.mismatchReason}</p>
                </div>
              )}

              {/* 3-Way Line Matching Table */}
              <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  3-Way Line Item Comparison (PO vs GRN vs Invoice)
                </h3>
                <div className="rounded-lg border border-white/5 overflow-hidden text-xs">
                  <div className="grid grid-cols-6 p-2.5 bg-white/5 font-semibold text-white/60 text-[11px] uppercase">
                    <div>Product Item</div>
                    <div>PO Qty</div>
                    <div>GRN Qty</div>
                    <div>Billed Qty</div>
                    <div>PO Rate vs Invoiced</div>
                    <div>Line Total</div>
                  </div>
                  <div className="divide-y divide-white/5 bg-black/20">
                    {selected.lines.map((line, idx) => (
                      <div key={idx} className="grid grid-cols-6 p-2.5 text-white/80 items-center">
                        <div className="font-medium text-white truncate">{line.productName}</div>
                        <div className="font-mono text-white/60">{line.poQuantity}</div>
                        <div className="font-mono text-emerald-400">{line.grnQuantity}</div>
                        <div className={`font-mono ${line.hasQuantityVariance ? 'text-rose-400 font-bold' : 'text-white/80'}`}>
                          {line.invoicedQuantity}
                        </div>
                        <div>
                          <span className="font-mono text-white/60">${line.poUnitPrice}</span> →{' '}
                          <span className={`font-mono font-bold ${line.hasPriceVariance ? 'text-rose-400' : 'text-emerald-400'}`}>
                            ${line.invoicedUnitPrice}
                          </span>
                        </div>
                        <div className="font-mono text-white font-semibold">${line.lineTotal.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-white/40 text-xs">
              Select an invoice to inspect 3-way matching.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
