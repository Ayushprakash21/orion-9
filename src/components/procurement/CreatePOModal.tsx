import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle2, AlertTriangle, ShieldCheck, DollarSign, Calendar, Building2 } from 'lucide-react';
import { poLifecycleEngine } from '../../scm/POLifecycleEngine';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { POLineItem, PurchaseOrderRecord } from '../../scm/types';
import { AuthorizationActor } from '../../kernel/authorization/AuthorizationEngine';
import { formatCurrency } from '../../lib/formatters';

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (newPO: any) => void;
}

export const CreatePOModal: React.FC<CreatePOModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { suppliers, products, purchaseOrders, updateData, currency } = useSupplyChain();
  const { currentUser, role } = useAuth();
  const { showToast } = useToast();

  const tenantId = (currentUser as any)?.tenantId || 'org-tenant-a';
  const actorId = currentUser?.id || 'usr-current-planner';
  const actorName = currentUser?.displayName || currentUser?.fullName || 'Supply Chain Planner';
  const actorRoles = [role ? String(role) : 'PLANNER'];

  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id || 'SUP-001');
  const [deliveryLocation, setDeliveryLocation] = useState('Central Warehouse Hub - Bay 4');
  const [paymentTerms, setPaymentTerms] = useState('NET30');
  const [incoterms, setIncoterms] = useState('FOB');
  const [targetCurrency, setTargetCurrency] = useState(currency || 'USD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const defaultExpectedDate = new Date(Date.now() + 14 * 86400000).toISOString();

  const [items, setItems] = useState<POLineItem[]>([
    {
      lineId: 'line-1',
      productId: products[0]?.id || 'SKU-TITAN-X1',
      quantity: 100,
      unitPrice: products[0]?.unitCost || 250,
      totalPrice: 100 * (products[0]?.unitCost || 250),
      unitOfMeasure: 'EA',
      expectedDeliveryDate: defaultExpectedDate
    }
  ]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const defaultProd = products[items.length % products.length] || products[0];
    const newLineId = `line-${items.length + 1}`;
    setItems(prev => [
      ...prev,
      {
        lineId: newLineId,
        productId: defaultProd?.id || `SKU-ITEM-${items.length + 1}`,
        quantity: 50,
        unitPrice: defaultProd?.unitCost || 100,
        totalPrice: 50 * (defaultProd?.unitCost || 100),
        unitOfMeasure: 'EA',
        expectedDeliveryDate: defaultExpectedDate
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof POLineItem, value: any) => {
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = field === 'quantity' ? Number(value) || 0 : item.quantity;
        const price = field === 'unitPrice' ? Number(value) || 0 : item.unitPrice;
        item.totalPrice = Math.round(qty * price * 100) / 100;
      }
      if (field === 'productId') {
        const found = products.find(p => p.id === value);
        if (found) {
          item.unitPrice = found.unitCost || item.unitPrice;
          item.totalPrice = Math.round(item.quantity * item.unitPrice * 100) / 100;
        }
      }
      next[index] = item;
      return next;
    });
  };

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxAmount = Math.round(subtotal * 0.08 * 100) / 100;
  const freightAmount = 150.0;
  const grandTotal = subtotal + taxAmount + freightAmount;

  const handleSubmit = async (submitForApproval: boolean) => {
    setErrorMsg(null);
    if (!supplierId) {
      setErrorMsg('Please select an authorized supplier.');
      return;
    }
    if (items.some(i => i.quantity <= 0)) {
      setErrorMsg('All line items must have a quantity greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const actor: AuthorizationActor = {
        id: actorId,
        name: actorName,
        roles: actorRoles,
        organizationId: tenantId
      };

      // 1. Create PO via POLifecycleEngine (governed business transaction + Firestore outbox)
      const res = await poLifecycleEngine.createPO({
        tenantId,
        actor,
        supplierId,
        items,
        deliveryLocation,
        paymentTerms,
        incoterms,
        currency: targetCurrency
      });

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to create governed purchase order.');
      }

      let finalPo = res.data;

      // 2. Submit for approval if requested
      if (submitForApproval) {
        const submitRes = await poLifecycleEngine.submitPOForApproval(tenantId, finalPo.poId, actor);
        if (submitRes.success && submitRes.data) {
          finalPo = submitRes.data;
        }
      }

      // 3. Adapt to UI PurchaseOrder model and update SupplyChainContext
      const supplierObj = suppliers.find(s => s.id === supplierId);
      const uiPO = {
        id: finalPo.poId,
        supplierId: finalPo.supplierId,
        orderDate: finalPo.createdAt,
        expectedDelivery: defaultExpectedDate,
        status: (finalPo.status === 'APPROVED' ? 'Approved' : 'Draft') as any,
        totalValue: finalPo.totalAmount,
        currency: finalPo.currency,
        lines: finalPo.items.map(it => ({
          productId: it.productId,
          quantity: it.quantity,
          receivedQuantity: 0,
          unitPrice: it.unitPrice
        })),
        buyer: actorName,
        supplierName: supplierObj?.name || 'Authorized Supplier'
      };

      await updateData('purchaseOrders', [uiPO, ...purchaseOrders]);

      showToast(
        `Purchase Order ${finalPo.poNumber || finalPo.poId} persisted and outbox event published.`,
        'success',
        submitForApproval ? 'PO Submitted for Approval' : 'PO Draft Created'
      );

      if (onCreated) {
        onCreated(finalPo);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during purchase order creation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="w-full max-w-3xl rounded-xl bg-[rgba(18,22,30,0.95)] backdrop-blur-md border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-po-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-os-border flex items-center justify-between bg-os-surface/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 id="create-po-title" className="text-base font-semibold text-os-text-primary">
                Create Governed Purchase Order
              </h2>
              <p className="text-xs text-os-text-muted">
                Atomic Firestore write + transactional outbox event emission via POLifecycleEngine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-os-text-muted hover:text-os-text-primary hover:bg-os-surface transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs font-sans">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Supplier & Logistics Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono text-os-text-muted mb-1">
                Authorized Supplier *
              </label>
              <select
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                className="w-full rounded-lg border border-os-border bg-os-surface px-3 py-2 text-os-text-primary focus:outline-none focus:border-emerald-500/50"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-os-text-muted mb-1">
                Delivery Location
              </label>
              <input
                type="text"
                value={deliveryLocation}
                onChange={e => setDeliveryLocation(e.target.value)}
                className="w-full rounded-lg border border-os-border bg-os-surface px-3 py-2 text-os-text-primary focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-os-text-muted mb-1">
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={e => setPaymentTerms(e.target.value)}
                className="w-full rounded-lg border border-os-border bg-os-surface px-3 py-2 text-os-text-primary focus:outline-none focus:border-emerald-500/50"
              >
                <option value="NET30">NET 30 Days</option>
                <option value="NET60">NET 60 Days</option>
                <option value="NET90">NET 90 Days</option>
                <option value="DUE_ON_RECEIPT">Due on Receipt</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-os-text-muted mb-1">
                Incoterms & Currency
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={incoterms}
                  onChange={e => setIncoterms(e.target.value)}
                  className="rounded-lg border border-os-border bg-os-surface px-2.5 py-2 text-os-text-primary focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="FOB">FOB</option>
                  <option value="CIF">CIF</option>
                  <option value="EXW">EXW</option>
                  <option value="DDP">DDP</option>
                </select>
                <select
                  value={targetCurrency}
                  onChange={e => setTargetCurrency(e.target.value)}
                  className="rounded-lg border border-os-border bg-os-surface px-2.5 py-2 text-os-text-primary focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-os-text-muted uppercase tracking-wider">
                Line Items ({items.length})
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 text-xs text-emerald-400 border border-emerald-500/30 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} />
                Add Item
              </button>
            </div>

            <div className="border border-os-border rounded-lg overflow-hidden bg-os-surface/30">
              <table className="w-full text-left">
                <thead className="bg-os-surface/60 border-b border-os-border text-[10px] font-mono text-os-text-muted uppercase">
                  <tr>
                    <th className="py-2 px-3">Product</th>
                    <th className="py-2 px-3 w-24">Qty</th>
                    <th className="py-2 px-3 w-28">Unit Price</th>
                    <th className="py-2 px-3 w-28 text-right">Total</th>
                    <th className="py-2 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-os-border text-xs">
                  {items.map((it, idx) => (
                    <tr key={it.lineId} className="hover:bg-os-surface/40">
                      <td className="py-2 px-3">
                        <select
                          value={it.productId}
                          onChange={e => handleItemChange(idx, 'productId', e.target.value)}
                          className="w-full rounded border border-os-border bg-os-surface px-2 py-1 text-xs text-os-text-primary"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.id} — {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full rounded border border-os-border bg-os-surface px-2 py-1 text-xs text-os-text-primary font-mono"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={it.unitPrice}
                          onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-full rounded border border-os-border bg-os-surface px-2 py-1 text-xs text-os-text-primary font-mono"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-medium text-os-text-primary">
                        {formatCurrency(it.totalPrice, targetCurrency)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="text-os-text-muted hover:text-red-400 disabled:opacity-30 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-os-surface/40 border border-os-border rounded-lg p-3 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-os-text-muted">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal, targetCurrency)}</span>
            </div>
            <div className="flex justify-between text-os-text-muted">
              <span>Estimated Tax (8%):</span>
              <span>{formatCurrency(taxAmount, targetCurrency)}</span>
            </div>
            <div className="flex justify-between text-os-text-muted">
              <span>Freight Surcharge:</span>
              <span>{formatCurrency(freightAmount, targetCurrency)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-emerald-400 border-t border-os-border pt-1.5">
              <span>Grand Total:</span>
              <span>{formatCurrency(grandTotal, targetCurrency)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-os-border bg-os-surface/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-os-border text-xs text-os-text-muted hover:text-os-text-primary transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 rounded-lg border border-os-border bg-os-surface hover:bg-os-surface-hover text-xs font-medium text-os-text-primary transition-colors cursor-pointer flex items-center gap-1.5"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(true)}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors cursor-pointer shadow-lg shadow-emerald-900/30 flex items-center gap-1.5"
            >
              <ShieldCheck size={14} />
              {isSubmitting ? 'Persisting...' : 'Create & Submit for Approval'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
