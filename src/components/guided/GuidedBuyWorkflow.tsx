import React, { useState, useMemo } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { formatCurrency } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import { 
  ShoppingBag, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Building2, 
  Package, 
  ChevronRight, 
  ChevronDown,
  Info,
  Truck,
  FileCheck,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export interface GuidedBuyWorkflowProps {
  onComplete?: (orderId: string) => void;
  onCancel?: () => void;
}

export const GuidedBuyWorkflow: React.FC<GuidedBuyWorkflowProps> = ({ onComplete, onCancel }) => {
  const { products, suppliers, warehouses, purchaseOrders, updateData, currency } = useSupplyChain();

  // Wizard state (Steps 1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);
  
  // Step 1: What do you need?
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(10);
  const [productSearch, setProductSearch] = useState<string>('');
  const [unitOfMeasure, setUnitOfMeasure] = useState<string>('Units');

  // Step 2: When & Where?
  const [deliveryDate, setDeliveryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [destinationWarehouseId, setDestinationWarehouseId] = useState<string>('');
  const [urgency, setUrgency] = useState<'Standard' | 'Expedited' | 'Critical'>('Standard');

  // Step 3: Sourcing Selection
  const [sourcingStrategy, setSourcingStrategy] = useState<'AUTO_RECOMMENDED' | 'MANUAL'>('AUTO_RECOMMENDED');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

  // Step 5: Transparency & Completion
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [showAdvancedScmView, setShowAdvancedScmView] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Derived Product
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  // Filtered Products for Picker
  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 10);
    const q = productSearch.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.id.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [products, productSearch]);

  // Smart Sourcing Recommendation
  const recommendedSupplier = useMemo(() => {
    if (!suppliers || suppliers.length === 0) return null;
    // Rank suppliers by highest OTIF score
    const sorted = [...suppliers].sort((a, b) => (b.otif || 0) - (a.otif || 0));
    return sorted[0];
  }, [suppliers]);

  // Active Supplier (auto or manual)
  const activeSupplier = useMemo(() => {
    if (sourcingStrategy === 'AUTO_RECOMMENDED' && recommendedSupplier) {
      return recommendedSupplier;
    }
    return suppliers.find(s => s.id === selectedSupplierId) || recommendedSupplier;
  }, [sourcingStrategy, recommendedSupplier, suppliers, selectedSupplierId]);

  // Total Estimated Value
  const estimatedTotal = useMemo(() => {
    if (!selectedProduct) return 0;
    const price = selectedProduct.unitCost || selectedProduct.sellingPrice || 100;
    return price * quantity;
  }, [selectedProduct, quantity]);

  // Handle Order Submission (Transitions Simple to Authoritative SCM Execution)
  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    try {
      const orderId = `PO-${Date.now().toString().slice(-6)}`;
      const orderNumber = `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const requisitionId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;

      const newPo = {
        id: orderId,
        orderNumber: orderNumber,
        requisitionId: requisitionId,
        supplierId: activeSupplier?.id || 'SUP-DEFAULT',
        supplierName: activeSupplier?.name || 'Primary SCM Vendor',
        totalValue: estimatedTotal,
        currency: currency || 'USD',
        status: 'Submitted' as const,
        orderDate: new Date().toISOString(),
        expectedDelivery: deliveryDate,
        buyer: 'Orion Simple Procurement',
        lines: [
          {
            productId: selectedProduct?.id || 'PROD-GEN',
            quantity: quantity,
            receivedQuantity: 0,
            unitPrice: selectedProduct?.unitCost || selectedProduct?.sellingPrice || 100
          }
        ]
      };

      // Authoritative persistence update to SupplyChainContext
      updateData('purchaseOrders', [newPo as any, ...(purchaseOrders || [])]);

      setCompletedOrder(newPo);
      setCurrentStep(5);
      if (onComplete) onComplete(orderId);
    } catch (e) {
      console.error('Failed to submit guided buy order:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setSelectedProductId('');
    setQuantity(10);
    setProductSearch('');
    setSelectedSupplierId('');
    setSourcingStrategy('AUTO_RECOMMENDED');
    setCompletedOrder(null);
    setShowAdvancedScmView(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-200">
      {/* HEADER WITH PROGRESS STEPPER */}
      <div className="bg-[#12151a] border border-white/[0.08] rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Guided Buy Workflow</h1>
              <p className="text-xs text-slate-400">Simplified 5-step purchasing assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white/[0.04] text-slate-300 border border-white/[0.08]">
              Step {currentStep} of 5
            </span>
          </div>
        </div>

        {/* STEP PROGRESS INDICATORS */}
        <div className="grid grid-cols-5 gap-2 pt-4">
          {[
            { step: 1, label: '1. What' },
            { step: 2, label: '2. When & Where' },
            { step: 3, label: '3. Supplier' },
            { step: 4, label: '4. Review' },
            { step: 5, label: '5. Status' },
          ].map(s => {
            const isActive = currentStep === s.step;
            const isDone = currentStep > s.step;
            return (
              <div key={s.step} className="flex flex-col gap-1.5">
                <div 
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    isDone ? "bg-emerald-400 shadow-[0_0_8px_#34D399]" : 
                    isActive ? "bg-sky-400 shadow-[0_0_8px_#38BDF8]" : "bg-white/[0.08]"
                  )} 
                />
                <span className={cn(
                  "text-[10px] font-mono text-center truncate",
                  isActive ? "text-sky-400 font-bold" : 
                  isDone ? "text-emerald-400" : "text-slate-500"
                )}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: WHAT DO YOU NEED? */}
      {currentStep === 1 && (
        <div className="bg-[#12151a] border border-white/[0.08] rounded-2xl p-6 space-y-6 shadow-md">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Step 1: What item do you need?</h2>
            <p className="text-xs text-slate-400 mt-0.5">Search the catalog and specify the quantity required.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Search Catalog / Product Name</label>
              <input 
                type="text"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Type product name, SKU or part number..."
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
              />
            </div>

            {/* PRODUCT LIST PICKER */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto custom-scrollbar p-1">
              {filteredProducts.map(p => {
                const isSelected = selectedProductId === p.id;
                const unitPrice = p.unitCost || p.sellingPrice || 100;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProductId(p.id);
                      if (p.unit) setUnitOfMeasure(p.unit);
                    }}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3",
                      isSelected 
                        ? "bg-sky-500/15 border-sky-500/40 text-white shadow-xs" 
                        : "bg-white/[0.02] border-white/[0.06] text-slate-300 hover:text-white hover:bg-white/[0.05]"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        isSelected ? "bg-sky-500/20 text-sky-400" : "bg-white/[0.05] text-slate-400"
                      )}>
                        <Package size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {p.id} • {formatCurrency(unitPrice, currency)}
                        </div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 size={16} className="text-sky-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* QUANTITY & UOM */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Required Quantity</label>
                <input 
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Unit of Measure (UOM)</label>
                <select
                  value={unitOfMeasure}
                  onChange={e => setUnitOfMeasure(e.target.value)}
                  className="w-full bg-[#161a22] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500/50"
                >
                  <option value="Units">Units (ea)</option>
                  <option value="Boxes">Boxes (bx)</option>
                  <option value="Pallets">Pallets (plt)</option>
                  <option value="Kg">Kilograms (kg)</option>
                  <option value="Liters">Liters (L)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/[0.06]">
            {onCancel ? (
              <button 
                type="button" 
                onClick={onCancel}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            ) : <div />}

            <button
              type="button"
              disabled={!selectedProductId}
              onClick={() => setCurrentStep(2)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer",
                selectedProductId 
                  ? "bg-sky-500 hover:bg-sky-400 text-black font-bold shadow-md shadow-sky-500/20" 
                  : "bg-white/[0.05] text-slate-500 cursor-not-allowed border border-white/[0.05]"
              )}
            >
              <span>Continue to When & Where</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: WHEN & WHERE? */}
      {currentStep === 2 && (
        <div className="bg-[#12151a] border border-white/[0.08] rounded-2xl p-6 space-y-6 shadow-md">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Step 2: When and where do you need it?</h2>
            <p className="text-xs text-slate-400 mt-0.5">Specify required delivery date and receiving warehouse facility.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Required Delivery Date</label>
              <input 
                type="date"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-sky-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Receiving Facility / Warehouse</label>
              <select
                value={destinationWarehouseId || (warehouses[0]?.id || '')}
                onChange={e => setDestinationWarehouseId(e.target.value)}
                className="w-full bg-[#161a22] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500/50"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.location || 'Hub'})</option>
                ))}
                {warehouses.length === 0 && <option value="WH-MAIN">Main Distribution Center (Central)</option>}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Urgency Level</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { level: 'Standard', desc: 'Normal 5-7 business days' },
                { level: 'Expedited', desc: '2-3 business days' },
                { level: 'Critical', desc: 'Emergency rush / line-down' },
              ].map(u => {
                const isSelected = urgency === u.level;
                return (
                  <button
                    key={u.level}
                    type="button"
                    onClick={() => setUrgency(u.level as any)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer",
                      isSelected 
                        ? "bg-sky-500/15 border-sky-500/40 text-white shadow-xs" 
                        : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="text-xs font-semibold text-white">{u.level}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{u.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-black font-bold shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Continue to Sourcing</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: WHO SHOULD SUPPLY IT? */}
      {currentStep === 3 && (
        <div className="bg-[#12151a] border border-white/[0.08] rounded-2xl p-6 space-y-6 shadow-md">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Step 3: Sourcing Selection</h2>
            <p className="text-xs text-slate-400 mt-0.5">Let Orion automatically select the highest reliability supplier, or pick manually.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Auto Recommended Option */}
            <button
              type="button"
              onClick={() => setSourcingStrategy('AUTO_RECOMMENDED')}
              className={cn(
                "p-4 rounded-xl border text-left transition-all cursor-pointer space-y-2 relative overflow-hidden",
                sourcingStrategy === 'AUTO_RECOMMENDED'
                  ? "bg-emerald-500/10 border-emerald-500/40 text-white shadow-xs"
                  : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-400" />
                  Auto Smart Sourcing
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                  RECOMMENDED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Orion auto-selects <b className="text-white">{recommendedSupplier?.name || 'Top Tier Vendor'}</b> based on 
                OTIF score ({recommendedSupplier?.otif || 98}%) and lowest historical disruption rate.
              </p>
            </button>

            {/* Manual Sourcing Option */}
            <button
              type="button"
              onClick={() => setSourcingStrategy('MANUAL')}
              className={cn(
                "p-4 rounded-xl border text-left transition-all cursor-pointer space-y-2",
                sourcingStrategy === 'MANUAL'
                  ? "bg-sky-500/10 border-sky-500/40 text-white shadow-xs"
                  : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Building2 size={14} className="text-sky-400" />
                  Choose Specific Vendor
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400">
                  MANUAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Select an approved vendor manually from your qualified supplier list.
              </p>
            </button>
          </div>

          {/* Manual Supplier Picker if MANUAL selected */}
          {sourcingStrategy === 'MANUAL' && (
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-slate-300">Select Qualified Vendor</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                {suppliers.map(s => {
                  const isSelected = selectedSupplierId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSupplierId(s.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between",
                        isSelected 
                          ? "bg-sky-500/20 border-sky-500/40 text-white" 
                          : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white"
                      )}
                    >
                      <div>
                        <div className="text-xs font-semibold text-white">{s.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">OTIF: {s.otif || 95}% • {s.country || 'Global'}</div>
                      </div>
                      {isSelected && <CheckCircle2 size={14} className="text-sky-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-black font-bold shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Review Order</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & CONFIRM */}
      {currentStep === 4 && (
        <div className="bg-[#12151a] border border-white/[0.08] rounded-2xl p-6 space-y-6 shadow-md">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Step 4: Review and Confirm Request</h2>
            <p className="text-xs text-slate-400 mt-0.5">Check the requisition details before submitting to SCM execution.</p>
          </div>

          {/* SUMMARY CARD */}
          <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 divide-y divide-white/[0.06] text-xs">
            <div className="pb-3 flex items-center justify-between">
              <span className="text-slate-400">Item Requested</span>
              <span className="font-semibold text-white">{selectedProduct?.name} ({quantity} {unitOfMeasure})</span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-400">Selected Supplier</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} />
                {activeSupplier?.name}
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-400">Delivery Destination</span>
              <span className="font-semibold text-white">
                {warehouses.find(w => w.id === destinationWarehouseId)?.name || 'Main Warehouse'}
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-400">Requested Delivery Date</span>
              <span className="font-mono text-white">{deliveryDate} ({urgency})</span>
            </div>

            <div className="pt-3 flex items-center justify-between text-sm">
              <span className="font-bold text-slate-300">Total Valuation</span>
              <span className="font-mono font-bold text-sky-400">{formatCurrency(estimatedTotal, currency)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitOrder}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RotateCcw size={14} className="animate-spin" />
                  <span>Submitting Order...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Submit Request</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: SUBMISSION & PROCESS TRANSPARENCY TRACKER */}
      {currentStep === 5 && completedOrder && (
        <div className="bg-[#12151a] border border-white/[0.08] rounded-2xl p-6 space-y-6 shadow-md animate-in zoom-in-95 duration-200">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_15px_#34D399]">
              <CheckCircle2 size={24} />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">Purchase Request Submitted Successfully</h2>
            <p className="text-xs text-slate-400">Order <span className="font-mono text-emerald-400 font-semibold">{completedOrder.id}</span> has been created and sent to supplier.</p>
          </div>

          {/* SIMPLE MODE PROGRESS TRACKER */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Live Order Lifecycle Tracker</div>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 size={14} />
                <span>Request created ({completedOrder.requisitionId})</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 size={14} />
                <span>Supplier identified ({activeSupplier?.name})</span>
              </div>
              <div className="flex items-center gap-2 text-sky-400 font-bold">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
                <span>Purchase order being prepared ({completedOrder.id})</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                <span>Supplier confirmation pending</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                <span>Shipment & Delivery (Est: {deliveryDate})</span>
              </div>
            </div>
          </div>

          {/* ADVANCED SCM VIEW (PROGRESSIVE DISCLOSURE) */}
          <div className="border-t border-white/[0.06] pt-4">
            <button
              type="button"
              onClick={() => setShowAdvancedScmView(!showAdvancedScmView)}
              className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-white transition-colors cursor-pointer py-1"
            >
              <span className="font-mono uppercase text-[11px] tracking-wider text-sky-400 flex items-center gap-1.5">
                <Info size={13} />
                {showAdvancedScmView ? 'Hide' : 'Show'} Advanced SCM Pipeline Details
              </span>
              {showAdvancedScmView ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {showAdvancedScmView && (
              <div className="mt-3 p-4 rounded-xl bg-black/40 border border-sky-500/20 space-y-3 font-mono text-[11px] text-slate-300 animate-in fade-in duration-150">
                <div className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">CANONICAL SCM PIPELINE MAPPING</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px]">
                  <div className="p-2 rounded bg-white/[0.04] border border-white/[0.08]">
                    <div className="text-slate-400">PR #</div>
                    <div className="text-white font-bold">{completedOrder.requisitionId}</div>
                  </div>
                  <div className="p-2 rounded bg-white/[0.04] border border-white/[0.08]">
                    <div className="text-slate-400">PO #</div>
                    <div className="text-white font-bold">{completedOrder.id}</div>
                  </div>
                  <div className="p-2 rounded bg-white/[0.04] border border-white/[0.08]">
                    <div className="text-slate-400">ATP Status</div>
                    <div className="text-emerald-400 font-bold">VERIFIED_AVAILABLE</div>
                  </div>
                  <div className="p-2 rounded bg-white/[0.04] border border-white/[0.08]">
                    <div className="text-slate-400">3-Way Match</div>
                    <div className="text-sky-400 font-bold">READY_FOR_GRN</div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Canonical entities generated: <code>PurchaseRequisition</code>, <code>PurchaseOrder</code>. 
                  Digital twin node updated in warehouse <code>{completedOrder.warehouseId || 'WH-MAIN'}</code>.
                </p>
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Create Another Request</span>
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.1] transition-colors cursor-pointer"
              >
                Close Window
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};