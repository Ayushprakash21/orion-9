import React, { useState, useMemo } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { formatCurrency, formatNumber } from '../../lib/utils';
import { Package, BrainCircuit } from 'lucide-react';

export const ProductDetailContent: React.FC<{ id: string }> = ({ id }) => {
  const { products, inventory, suppliers, purchaseOrders, currency } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'supplier' | 'pos' | 'ai'>('overview');

  const cleanId = (id || '').trim();
  const inv = useMemo(() => {
    return inventory.find(i => 
      i.productId.toLowerCase() === cleanId.toLowerCase() || 
      i.id.toLowerCase() === cleanId.toLowerCase()
    );
  }, [inventory, cleanId]);

  const targetSku = inv?.productId || cleanId;
  const product = useMemo(() => {
    return products.find(p => p.id.toLowerCase() === targetSku.toLowerCase());
  }, [products, targetSku]);

  const pos = useMemo(() => {
    return purchaseOrders.filter(po => po.lines.some(l => l.productId.toLowerCase() === targetSku.toLowerCase()));
  }, [purchaseOrders, targetSku]);

  const supplier = useMemo(() => {
    if (product?.supplierId) {
      const found = suppliers.find(s => s.id === product.supplierId);
      if (found) return found;
    }
    if (pos.length > 0) {
      const found = suppliers.find(s => s.id === pos[0].supplierId);
      if (found) return found;
    }
    return undefined;
  }, [suppliers, product, pos]);

  if (!product && !inv) {
    return (
      <div className="p-12 text-center text-os-text-muted font-mono text-xs space-y-3">
        <div>Product record <span className="text-os-text-primary font-semibold">{cleanId}</span> not found.</div>
        <button 
          onClick={() => openEntity('product', 'SKU-1000')} 
          className="px-3 py-1.5 bg-os-surface-elevated border border-os-border rounded-lg text-xs font-mono text-[#30D158] hover:border-os-border transition-colors"
        >
          View SKU-1000
        </button>
      </div>
    );
  }

  const sku = product?.id || inv?.productId || cleanId;
  const name = product?.name || `Product ${sku}`;
  const category = product?.category || 'General';
  const unitCost = product?.unitCost ?? inv?.unitCost ?? 0;
  const sellingPrice = product?.sellingPrice ?? (unitCost > 0 ? Math.round(unitCost * 1.35) : 0);
  const leadTime = product?.leadTime ?? inv?.leadTime ?? 14;

  return (
    <div className="space-y-6">
      <div className="bg-os-surface border border-os-border p-5 rounded-xl space-y-4">
        <div>
          <div className="text-[10px] font-mono text-os-text-muted uppercase tracking-wider">{category} / {product?.subcategory || 'Standard'}</div>
          <h2 className="text-xl font-medium text-os-text-primary mt-0.5">{name}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Unit Cost</div>
            <div className="text-base font-mono text-os-text-primary">{formatCurrency(unitCost, currency)}</div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Selling Price</div>
            <div className="text-base font-mono text-os-text-primary">{formatCurrency(sellingPrice, currency)}</div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Lead Time</div>
            <div className="text-base font-mono text-os-text-primary">{leadTime} days</div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-os-border gap-6 text-xs font-mono overflow-x-auto">
        {(['overview', 'inventory', 'supplier', 'pos', 'ai'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 uppercase tracking-wider transition-colors border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab ? 'border-os-border-inverse text-os-text-primary' : 'border-transparent text-os-text-muted hover:text-os-text-secondary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === 'overview' && (
          <div className="bg-os-surface border border-os-border rounded-xl p-5 space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-os-border">
              <span className="text-os-text-muted">SKU</span>
              <span className="font-mono text-os-text-primary">{sku}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-os-border">
              <span className="text-os-text-muted">ABC Class</span>
              <span className="font-mono text-os-text-primary">{product?.abcClass || 'A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-os-border">
              <span className="text-os-text-muted">Criticality</span>
              <span className="font-mono text-os-text-primary">{product?.criticality || 'Standard'}</span>
            </div>
            <div className="pt-2 flex gap-2">
              <button 
                onClick={() => openEntity('inventory', sku)}
                className="px-3 py-1.5 bg-os-surface-elevated border border-os-border rounded-lg text-xs font-mono text-os-text-primary hover:bg-os-surface-hover transition-colors"
              >
                View Inventory Detail
              </button>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="bg-os-surface border border-os-border rounded-xl p-5">
            {inv ? (
              <button onClick={() => openEntity('inventory', inv.productId)} className="w-full text-left p-3 bg-os-surface rounded-lg border border-os-border hover:border-os-border transition-colors">
                <div className="flex justify-between items-center">
                  <div className="text-xs font-mono text-os-text-primary">View Full Inventory State for {inv.productId}</div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-os-surface-elevated text-[#30D158] border border-os-border">Active</span>
                </div>
                <div className="text-[10px] text-os-text-muted mt-1">On Hand: {formatNumber(inv.onHand)} | Reserved: {formatNumber(inv.reserved)} | Safety Stock: {formatNumber(inv.safetyStock)}</div>
              </button>
            ) : (
              <div className="text-center py-6 text-os-text-muted font-mono text-xs">
                No active warehouse inventory recorded for this product.
              </div>
            )}
          </div>
        )}

        {activeTab === 'supplier' && (
          <div className="bg-os-surface border border-os-border rounded-xl p-5">
            {supplier ? (
              <button onClick={() => openEntity('supplier', supplier.id)} className="w-full text-left p-3 bg-os-surface rounded-lg border border-os-border hover:border-os-border transition-colors">
                <div className="text-xs font-mono text-os-text-primary">{supplier.name} ({supplier.id})</div>
                <div className="text-[10px] text-os-text-muted mt-1">OTIF: {supplier.otif}% | Quality: {supplier.qualityRate}% | Region: {supplier.region}</div>
              </button>
            ) : (
              <div className="text-center py-6 text-os-text-muted font-mono text-xs">
                No primary supplier linked to this product.
              </div>
            )}
          </div>
        )}

        {activeTab === 'pos' && (
          <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden">
            {pos.length > 0 ? (
              <div className="divide-y divide-[#2A2A2A] text-xs">
                {pos.map(p => (
                  <div key={p.id} onClick={() => openEntity('po', p.id)} className="p-4 hover:bg-os-surface-hover cursor-pointer flex justify-between transition-colors">
                    <span className="font-mono text-os-text-primary">{p.id}</span>
                    <span className="font-mono text-os-text-muted">{p.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-os-text-muted font-mono text-xs">
                No purchase orders recorded for this product.
              </div>
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="bg-os-surface border border-os-border rounded-xl p-6 text-xs font-mono text-os-text-secondary">
            ORION AI Product Analysis: SKU {sku} ({name}) maintains active operations across supply channels with regular replenishment monitoring.
          </div>
        )}
      </div>
    </div>
  );
};
