import React, { useState, useMemo } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { formatCurrency, formatNumber, formatDateOnly } from '../../lib/utils';
import { ArrowDown, Truck, Package, ShieldAlert, BrainCircuit } from 'lucide-react';

export const PoDetailContent: React.FC<{ id: string }> = ({ id }) => {
  const { purchaseOrders, suppliers, products, shipments, exceptions, currency } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const [activeTab, setActiveTab] = useState<'overview' | 'lines' | 'supplier' | 'shipment' | 'inbound' | 'exceptions' | 'ai'>('overview');

  const po = useMemo(() => purchaseOrders.find(p => p.id === id), [purchaseOrders, id]);
  const supplier = useMemo(() => suppliers.find(s => s.id === po?.supplierId), [suppliers, po]);
  const primaryLine = po?.lines[0];
  const product = useMemo(() => products.find(p => p.id === primaryLine?.productId), [products, primaryLine]);
  const shipment = useMemo(() => shipments.find(s => s.poId === id), [shipments, id]);
  const poExceptions = useMemo(() => exceptions.filter(e => e.entityId === id || e.entityId === supplier?.id || e.entityId === product?.id), [exceptions, id, supplier, product]);

  if (!po) {
    return <div className="p-12 text-center text-[#777777] font-mono text-xs">Purchase order record not found.</div>;
  }

  const totalOrdered = po.lines.reduce((acc, l) => acc + l.quantity, 0);
  const totalReceived = po.lines.reduce((acc, l) => acc + l.receivedQuantity, 0);

  return (
    <div className="space-y-6">
      <div className="bg-[#151515] border border-[#2A2A2A] p-5 rounded-xl space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">Purchase Order</div>
            <h2 className="text-xl font-medium text-[#F5F5F5] mt-0.5">{po.id}</h2>
          </div>
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase border ${
            po.status === 'Overdue' || po.status === 'Delayed' ? 'bg-[#1B1B1B] text-[#FF453A] border-[#2A2A2A]' : 'bg-[#1B1B1B] text-[#30D158] border-[#2A2A2A]'
          }`}>
            {po.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Total Value</div>
            <div className="text-base font-mono text-[#F5F5F5]">{formatCurrency(po.totalValue, currency)}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Ordered Qty</div>
            <div className="text-base font-mono text-[#F5F5F5]">{formatNumber(totalOrdered)}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Received Qty</div>
            <div className="text-base font-mono text-[#F5F5F5]">{formatNumber(totalReceived)}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Expected Delivery</div>
            <div className="text-base font-mono text-[#F5F5F5]">{formatDateOnly(po.expectedDelivery)}</div>
          </div>
        </div>

        {/* Relationship Chain */}
        <div className="pt-3 border-t border-[#2A2A2A]">
          <div className="text-[10px] uppercase tracking-wider text-[#777777] font-semibold mb-2">Entity Relationship Chain</div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="px-2 py-1 bg-[#111111] border border-[#2A2A2A] rounded text-[#F5F5F5]">PO: {po.id}</span>
            <ArrowDown size={12} className="text-[#777777]" />
            {supplier && (
              <button onClick={() => openEntity('supplier', supplier.id)} className="px-2 py-1 bg-[#111111] border border-[#2A2A2A] rounded text-[#30D158] hover:border-[#777777]">
                Supplier: {supplier.name}
              </button>
            )}
            <ArrowDown size={12} className="text-[#777777]" />
            {product && (
              <button onClick={() => openEntity('product', product.id)} className="px-2 py-1 bg-[#111111] border border-[#2A2A2A] rounded text-[#30D158] hover:border-[#777777]">
                SKU: {product.id}
              </button>
            )}
            {shipment && (
              <>
                <ArrowDown size={12} className="text-[#777777]" />
                <button onClick={() => openEntity('shipment', shipment.id)} className="px-2 py-1 bg-[#111111] border border-[#2A2A2A] rounded text-[#30D158] hover:border-[#777777]">
                  Shipment: {shipment.id}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex border-b border-[#2A2A2A] gap-6 text-xs font-mono">
        {(['overview', 'lines', 'supplier', 'shipment', 'inbound', 'exceptions', 'ai'] as const).map(tab => (
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
              <span className="text-[#777777]">Order Date</span>
              <span className="font-mono text-[#F5F5F5]">{formatDateOnly(po.orderDate)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
              <span className="text-[#777777]">Buyer</span>
              <span className="font-mono text-[#F5F5F5]">{po.buyer || 'Global Procurement'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
              <span className="text-[#777777]">Currency</span>
              <span className="font-mono text-[#F5F5F5]">{currency}</span>
            </div>
          </div>
        )}

        {activeTab === 'lines' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#2A2A2A] text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Order Lines ({po.lines.length})</div>
            <div className="divide-y divide-[#2A2A2A] text-xs">
              {po.lines.map((l, idx) => (
                <div key={idx} className="p-4 flex justify-between items-center">
                  <div>
                    <div className="font-mono text-[#F5F5F5]">{l.productId}</div>
                    <div className="text-[10px] text-[#777777]">Ordered: {l.quantity} | Received: {l.receivedQuantity}</div>
                  </div>
                  <div className="font-mono text-[#F5F5F5]">{formatCurrency(l.unitPrice * l.quantity, currency)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'supplier' && supplier && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-5">
            <button onClick={() => openEntity('supplier', supplier.id)} className="w-full text-left p-3 bg-[#111111] rounded-lg border border-[#2A2A2A] hover:border-[#777777]">
              <div className="text-xs font-mono text-[#F5F5F5]">{supplier.name}</div>
              <div className="text-[10px] text-[#777777] mt-1">OTIF: {supplier.otif}% | Region: {supplier.region}</div>
            </button>
          </div>
        )}

        {activeTab === 'shipment' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-5">
            {shipment ? (
              <button onClick={() => openEntity('shipment', shipment.id)} className="w-full text-left p-3 bg-[#111111] rounded-lg border border-[#2A2A2A] hover:border-[#777777]">
                <div className="text-xs font-mono text-[#F5F5F5]">Shipment {shipment.id}</div>
                <div className="text-[10px] text-[#777777] mt-1">Status: {shipment.status} | Carrier: {shipment.carrier}</div>
              </button>
            ) : (
              <div className="text-center py-6 text-[#777777] font-mono text-xs">No shipment dispatched for this PO yet.</div>
            )}
          </div>
        )}

        {activeTab === 'inbound' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-5 text-center text-[#777777] font-mono text-xs">
            {shipment ? 'ASN / Inbound tracking active.' : 'Inbound ASN not yet created.'}
          </div>
        )}

        {activeTab === 'exceptions' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl overflow-hidden">
            <div className="divide-y divide-[#2A2A2A] text-xs">
              {poExceptions.map(e => (
                <div key={e.id} onClick={() => openEntity('exception', e.id)} className="p-4 hover:bg-[#202020] cursor-pointer">
                  <div className="text-[#FF453A] font-medium">{e.type}</div>
                  <div className="text-[10px] text-[#777777]">{e.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-6 text-xs font-mono text-[#B3B3B3]">
            ORION PO Review: PO {po.id} is currently {po.status}. Monitor delivery confirmation.
          </div>
        )}
      </div>
    </div>
  );
};
