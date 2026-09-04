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
      <div className="p-12 text-center text-[#777777] font-mono text-xs space-y-3">
        <div>Product record <span className="text-[#F5F5F5] font-semibold">{cleanId}</span> not found.</div>
        <button 
          onClick={() => openEntity('product', 'SKU-1000')} 
          className="px-3 py-1.5 bg-[#1B1B1B] border border-[#2A2A2A] rounded-lg text-xs font-mono text-[#30D158] hover:border-[#777777] transition-colors"
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
      <div className="bg-[#151515] border border-[#2A2A2A] p-5 rounded-xl space-y-4">
        <div>
          <div className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">{category} / {product?.subcategory || 'Standard'}</div>
          <h2 className="text-xl font-medium text-[#F5F5F5] mt-0.5">{name}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Unit Cost</div>
            <div className="text-base font-mono text-[#F5F5F5]">{formatCurrency(unitCost, currency)}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Selling Price</div>
            <div className="text-base font-mono text-[#F5F5F5]">{formatCurrency(sellingPrice, currency)}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Lead Time</div>
            <div className="text-base font-mono text-[#F5F5F5]">{leadTime} days</div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-[#2A2A2A] gap-6 text-xs font-mono overflow-x-auto">
        {(['overview', 'inventory', 'supplier', 'pos', 'ai'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 uppercase tracking-wider transition-colors border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab ? 'border-[#F5F5F5] text-[#F5F5F5]' : 'border-transparent text-[#777777] hover:text-[#B3B3B3]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === 'overview' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-5 space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
              <span className="text-[#777777]">SKU</span>
              <span className="font-mono text-[#F5F5F5]">{sku}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
              <span className="text-[#777777]">ABC Class</span>
              <span className="font-mono text-[#F5F5F5]">{product?.abcClass || 'A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
              <span className="text-[#777777]">Criticality</span>
              <span className="font-mono text-[#F5F5F5]">{product?.criticality || 'Standard'}</span>
            </div>
            <div className="pt-2 flex gap-2">
              <button 
                onClick={() => openEntity('inventory', sku)}
                className="px-3 py-1.5 bg-[#1B1B1B] border border-[#2A2A2A] rounded-lg text-xs font-mono text-[#F5F5F5] hover:bg-[#202020] transition-colors"
              >
                View Inventory Detail
              </button>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-5">
            {inv ? (
              <button onClick={() => openEntity('inventory', inv.productId)} className="w-full text-left p-3 bg-[#111111] rounded-lg border border-[#2A2A2A] hover:border-[#777777] transition-colors">
                <div className="flex justify-between items-center">
                  <div className="text-xs font-mono text-[#F5F5F5]">View Full Inventory State for {inv.productId}</div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#1B1B1B] text-[#30D158] border border-[#2A2A2A]">Active</span>
                </div>
                <div className="text-[10px] text-[#777777] mt-1">On Hand: {formatNumber(inv.onHand)} | Reserved: {formatNumber(inv.reserved)} | Safety Stock: {formatNumber(inv.safetyStock)}</div>
              </button>
            ) : (
              <div className="text-center py-6 text-[#777777] font-mono text-xs">
                No active warehouse inventory recorded for this product.
              </div>
            )}
          </div>
        )}

        {activeTab === 'supplier' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-5">
            {supplier ? (
              <button onClick={() => openEntity('supplier', supplier.id)} className="w-full text-left p-3 bg-[#111111] rounded-lg border border-[#2A2A2A] hover:border-[#777777] transition-colors">
                <div className="text-xs font-mono text-[#F5F5F5]">{supplier.name} ({supplier.id})</div>
                <div className="text-[10px] text-[#777777] mt-1">OTIF: {supplier.otif}% | Quality: {supplier.qualityRate}% | Region: {supplier.region}</div>
              </button>
            ) : (
              <div className="text-center py-6 text-[#777777] font-mono text-xs">
                No primary supplier linked to this product.
              </div>
            )}
          </div>
        )}

        {activeTab === 'pos' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl overflow-hidden">
            {pos.length > 0 ? (
              <div className="divide-y divide-[#2A2A2A] text-xs">
                {pos.map(p => (
                  <div key={p.id} onClick={() => openEntity('po', p.id)} className="p-4 hover:bg-[#202020] cursor-pointer flex justify-between transition-colors">
                    <span className="font-mono text-[#F5F5F5]">{p.id}</span>
                    <span className="font-mono text-[#777777]">{p.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#777777] font-mono text-xs">
                No purchase orders recorded for this product.
              </div>
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-6 text-xs font-mono text-[#B3B3B3]">
            ORION AI Product Analysis: SKU {sku} ({name}) maintains active operations across supply channels with regular replenishment monitoring.
          </div>
        )}
      </div>
    </div>
  );
};
