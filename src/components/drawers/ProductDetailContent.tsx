import React, { useState } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { formatCurrency } from '../../lib/utils';
import { Package, BrainCircuit } from 'lucide-react';

export const ProductDetailContent: React.FC<{ id: string }> = ({ id }) => {
  const { products, inventory, suppliers, purchaseOrders, currency } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'supplier' | 'pos' | 'ai'>('overview');

  const product = products.find(p => p.id === id);
  const inv = inventory.find(i => i.productId === id);
  const supplier = suppliers.find(s => s.id === product?.supplierId);
  const pos = purchaseOrders.filter(po => po.lines.some(l => l.productId === id));

  if (!product) {
    return <div className="p-12 text-center text-[#777777] font-mono text-xs">Product record not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#151515] border border-[#2A2A2A] p-5 rounded-xl space-y-4">
        <div>
          <div className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">{product.category} / {product.subcategory || 'General'}</div>
          <h2 className="text-xl font-medium text-[#F5F5F5] mt-0.5">{product.name}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Unit Cost</div>
            <div className="text-base font-mono text-[#F5F5F5]">{formatCurrency(product.unitCost || 0, currency)}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Selling Price</div>
            <div className="text-base font-mono text-[#F5F5F5]">{formatCurrency(product.sellingPrice || 0, currency)}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Lead Time</div>
            <div className="text-base font-mono text-[#F5F5F5]">{product.leadTime || 14} days</div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-[#2A2A2A] gap-6 text-xs font-mono">
        {(['overview', 'inventory', 'supplier', 'pos', 'ai'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 uppercase tracking-wider transition-colors border-b-2 -mb-px ${
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
              <span className="font-mono text-[#F5F5F5]">{product.id}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
              <span className="text-[#777777]">ABC Class</span>
              <span className="font-mono text-[#F5F5F5]">{product.abcClass || 'A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
              <span className="text-[#777777]">Criticality</span>
              <span className="font-mono text-[#F5F5F5]">{product.criticality || 'Standard'}</span>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && inv && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-5">
            <button onClick={() => openEntity('inventory', inv.productId)} className="w-full text-left p-3 bg-[#111111] rounded-lg border border-[#2A2A2A] hover:border-[#777777]">
              <div className="text-xs font-mono text-[#F5F5F5]">View Full Inventory State for {inv.productId}</div>
              <div className="text-[10px] text-[#777777] mt-1">On Hand: {inv.onHand} | Safety Stock: {inv.safetyStock}</div>
            </button>
          </div>
        )}

        {activeTab === 'supplier' && supplier && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-5">
            <button onClick={() => openEntity('supplier', supplier.id)} className="w-full text-left p-3 bg-[#111111] rounded-lg border border-[#2A2A2A] hover:border-[#777777]">
              <div className="text-xs font-mono text-[#F5F5F5]">{supplier.name} ({supplier.id})</div>
              <div className="text-[10px] text-[#777777] mt-1">OTIF: {supplier.otif}% | Quality: {supplier.qualityRate}%</div>
            </button>
          </div>
        )}

        {activeTab === 'pos' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl overflow-hidden">
            <div className="divide-y divide-[#2A2A2A] text-xs">
              {pos.map(p => (
                <div key={p.id} onClick={() => openEntity('po', p.id)} className="p-4 hover:bg-[#202020] cursor-pointer flex justify-between">
                  <span className="font-mono text-[#F5F5F5]">{p.id}</span>
                  <span className="font-mono text-[#777777]">{p.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-6 text-xs font-mono text-[#B3B3B3]">
            ORION AI Product Analysis: SKU {product.id} maintains consistent consumption rates with standard replenishment lead times.
          </div>
        )}
      </div>
    </div>
  );
};
