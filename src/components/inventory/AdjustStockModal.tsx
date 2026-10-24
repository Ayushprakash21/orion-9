import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, Package, Warehouse, Layers } from 'lucide-react';
import { scmPersistenceService } from '../../services/scm/ScmPersistenceService';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { formatNumber } from '../../lib/formatters';

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdjusted?: (res: any) => void;
  initialProductId?: string;
  initialWarehouseId?: string;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  isOpen,
  onClose,
  onAdjusted,
  initialProductId,
  initialWarehouseId
}) => {
  const { inventory, products, warehouses, updateData } = useSupplyChain();
  const { currentUser, role } = useAuth();
  const { showToast } = useToast();

  const tenantId = (currentUser as any)?.tenantId || 'org-tenant-a';
  const actor = currentUser?.displayName || currentUser?.fullName || currentUser?.id || 'Inventory Controller';

  const [productId, setProductId] = useState<string>(initialProductId || products[0]?.id || 'SKU-TITAN-X1');
  const [warehouseId, setWarehouseId] = useState<string>(initialWarehouseId || warehouses[0]?.id || 'WH-001');
  const [deltaStr, setDeltaStr] = useState<string>('10');
  const [reasonCode, setReasonCode] = useState<
    'CYCLE_COUNT' | 'TRANSFER' | 'CUSTOMER_ORDER' | 'GRN' | 'RMA'
  >('CYCLE_COUNT');
  const [referenceId, setReferenceId] = useState<string>(`CC-${Date.now().toString(36).toUpperCase()}`);
  const [lotNumber, setLotNumber] = useState<string>('LOT-PRIMARY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentItem = inventory.find(i => i.productId === productId && i.warehouseId === warehouseId);
  const currentOnHand = currentItem?.onHand || 0;
  const delta = Number(deltaStr) || 0;
  const projectedOnHand = currentOnHand + delta;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (delta === 0) {
      setErrorMsg('Adjustment quantity delta cannot be zero.');
      return;
    }

    if (projectedOnHand < 0) {
      setErrorMsg(`Adjustment would result in negative inventory balance (${projectedOnHand} units). Disallowed by enterprise governance.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const stableOpId = `op-adj-${tenantId}-${warehouseId}-${productId}-${Date.now().toString(36)}`;
      const txType = delta > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT';

      const result = await scmPersistenceService.adjustInventory({
        tenantId,
        productId,
        warehouseId,
        quantityDelta: delta,
        transactionType: txType as any,
        referenceEntityType: reasonCode,
        referenceEntityId: referenceId,
        actor,
        operationId: stableOpId,
        lotNumber
      });

      // Optimistically update SupplyChainContext inventory state
      const nextInventory = [...inventory];
      const idx = nextInventory.findIndex(i => i.productId === productId && i.warehouseId === warehouseId);
      if (idx >= 0) {
        nextInventory[idx] = { ...nextInventory[idx], onHand: result.balanceAfter };
      } else {
        nextInventory.push({
          id: `inv-${productId}-${warehouseId}`,
          productId,
          warehouseId,
          onHand: result.balanceAfter,
          reserved: 0,
          safetyStock: 50,
          reorderPoint: 100,
          averageDailyDemand: 10,
          unitCost: 100,
          leadTime: 7
        } as any);
      }
      await updateData('inventory', nextInventory);

      showToast(
        `Stock adjusted by ${delta > 0 ? '+' : ''}${delta} units. New balance: ${result.balanceAfter}.`,
        'success',
        'Inventory Adjusted'
      );

      if (onAdjusted) onAdjusted(result);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to adjust inventory stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="w-full max-w-lg rounded-xl bg-[rgba(18,22,30,0.95)] backdrop-blur-md border border-white/15 shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adjust-stock-title"
      >
        <div className="px-6 py-4 border-b border-os-border flex items-center justify-between bg-os-surface/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Package size={20} />
            </div>
            <div>
              <h2 id="adjust-stock-title" className="text-base font-semibold text-os-text-primary">
                Adjust Inventory Stock
              </h2>
              <p className="text-xs text-os-text-muted">
                Atomic Firestore lock + Transactional Outbox publication via ScmPersistenceService
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-sans">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono text-os-text-muted mb-1">
                Target Product / SKU *
              </label>
              <select
                value={productId}
                onChange={e => setProductId(e.target.value)}
                className="w-full rounded-lg border border-os-border bg-os-surface px-3 py-2 text-os-text-primary focus:outline-none focus:border-emerald-500/50"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.id} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-os-text-muted mb-1">
                Facility / Warehouse *
              </label>
              <select
                value={warehouseId}
                onChange={e => setWarehouseId(e.target.value)}
                className="w-full rounded-lg border border-os-border bg-os-surface px-3 py-2 text-os-text-primary focus:outline-none focus:border-emerald-500/50"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-os-text-muted mb-1">
                  Reason Code
                </label>
                <select
                  value={reasonCode}
                  onChange={e => setReasonCode(e.target.value as any)}
                  className="w-full rounded-lg border border-os-border bg-os-surface px-3 py-2 text-os-text-primary focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="CYCLE_COUNT">Cycle Count Variance</option>
                  <option value="TRANSFER">Warehouse Transfer</option>
                  <option value="GRN">Goods Receipt Note</option>
                  <option value="RMA">Return Restock</option>
                  <option value="CUSTOMER_ORDER">Customer Allocation</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-os-text-muted mb-1">
                  Quantity Delta (+ or -) *
                </label>
                <input
                  type="number"
                  step="1"
                  value={deltaStr}
                  onChange={e => setDeltaStr(e.target.value)}
                  className="w-full rounded-lg border border-os-border bg-os-surface px-3 py-2 text-os-text-primary font-mono focus:outline-none focus:border-emerald-500/50"
                  placeholder="e.g. +25 or -10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-os-text-muted mb-1">
                  Reference Entity / Batch ID
                </label>
                <input
                  type="text"
                  value={referenceId}
                  onChange={e => setReferenceId(e.target.value)}
                  className="w-full rounded-lg border border-os-border bg-os-surface px-3 py-2 text-os-text-primary font-mono focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-os-text-muted mb-1">
                  Lot / Serial Number
                </label>
                <input
                  type="text"
                  value={lotNumber}
                  onChange={e => setLotNumber(e.target.value)}
                  className="w-full rounded-lg border border-os-border bg-os-surface px-3 py-2 text-os-text-primary font-mono focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* Current vs Projected Balance */}
            <div className="p-3 rounded-lg bg-os-surface/60 border border-os-border font-mono text-xs space-y-1">
              <div className="flex justify-between text-os-text-muted">
                <span>Current On Hand:</span>
                <span className="font-semibold text-os-text-primary">{formatNumber(currentOnHand)} units</span>
              </div>
              <div className="flex justify-between text-os-text-muted">
                <span>Adjustment Delta:</span>
                <span className={`font-semibold ${delta >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {delta >= 0 ? '+' : ''}{formatNumber(delta)} units
                </span>
              </div>
              <div className="flex justify-between border-t border-os-border pt-1 font-bold">
                <span className="text-os-text-primary">Projected New Balance:</span>
                <span className={projectedOnHand < 0 ? 'text-red-400' : 'text-emerald-400'}>
                  {formatNumber(projectedOnHand)} units
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-os-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-os-border text-xs text-os-text-muted hover:text-os-text-primary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors cursor-pointer shadow-lg shadow-emerald-900/30 flex items-center gap-1.5"
            >
              <ShieldCheck size={14} />
              {isSubmitting ? 'Adjusting...' : 'Execute Stock Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
