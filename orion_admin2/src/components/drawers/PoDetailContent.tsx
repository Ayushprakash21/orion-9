import React, { useState, useMemo } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { formatCurrency, formatNumber, formatDateOnly, formatCurrencyPair } from '../../lib/utils';
import { ArrowDown, Truck, Package, ShieldAlert, BrainCircuit } from 'lucide-react';

export const PoDetailContent: React.FC<{ id: string }> = ({ id }) => {
  const { purchaseOrders, suppliers, products, shipments, exceptions, currency, timezone } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const [activeTab, setActiveTab] = useState<'overview' | 'lines' | 'supplier' | 'shipment' | 'inbound' | 'exceptions' | 'ai'>('overview');

  const po = useMemo(() => purchaseOrders.find(p => p.id === id), [purchaseOrders, id]);
  const supplier = useMemo(() => suppliers.find(s => s.id === po?.supplierId), [suppliers, po]);
  const primaryLine = po?.lines[0];
  const product = useMemo(() => products.find(p => p.id === primaryLine?.productId), [products, primaryLine]);
  const shipment = useMemo(() => shipments.find(s => s.poId === id), [shipments, id]);
  const poExceptions = useMemo(() => exceptions.filter(e => e.entityId === id || e.entityId === supplier?.id || e.entityId === product?.id), [exceptions, id, supplier, product]);

  if (!po) {
    return <div className="p-12 text-center text-os-text-muted font-mono text-xs">Purchase order record not found.</div>;
  }

  const totalOrdered = po.lines.reduce((acc, l) => acc + l.quantity, 0);
  const totalReceived = po.lines.reduce((acc, l) => acc + l.receivedQuantity, 0);

  return (
    <div className="space-y-6">
      <div className="bg-os-surface border border-os-border p-5 rounded-xl space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-mono text-os-text-muted uppercase tracking-wider">Purchase Order</div>
            <h2 className="text-xl font-medium text-os-text-primary mt-0.5">{po.id}</h2>
          </div>
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase border ${
            po.status === 'Overdue' || po.status === 'Delayed' ? 'bg-os-surface-elevated text-[#FF453A] border-os-border' : 'bg-os-surface-elevated text-[#30D158] border-os-border'
          }`}>
            {po.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Total Value</div>
            {(() => {
              const valPair = formatCurrencyPair(po.totalValue, currency);
              return (
                <div>
                  <div className="text-base font-mono text-os-text-primary" title={`Exact: ${valPair.exact}`}>
                    {valPair.compact}
                  </div>
                  <div className="text-[10px] font-mono text-os-text-muted truncate select-all">
                    {valPair.exact}
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Ordered Qty</div>
            <div className="text-base font-mono text-os-text-primary">{formatNumber(totalOrdered)}</div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Received Qty</div>
            <div className="text-base font-mono text-os-text-primary">{formatNumber(totalReceived)}</div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Expected Delivery</div>
            <div className="text-base font-mono text-os-text-primary">{formatDateOnly(po.expectedDelivery, timezone)}</div>
          </div>
        </div>

        {/* Relationship Chain */}
        <div className="pt-3 border-t border-os-border">
          <div className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold mb-2">Entity Relationship Chain</div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="px-2 py-1 bg-os-surface border border-os-border rounded text-os-text-primary">PO: {po.id}</span>
            <ArrowDown size={12} className="text-os-text-muted" />
            {supplier && (
              <button onClick={() => openEntity('supplier', supplier.id)} className="px-2 py-1 bg-os-surface border border-os-border rounded text-[#30D158] hover:border-os-border">
                Supplier: {supplier.name}
              </button>
            )}
            <ArrowDown size={12} className="text-os-text-muted" />
            {product && (
              <button onClick={() => openEntity('product', product.id)} className="px-2 py-1 bg-os-surface border border-os-border rounded text-[#30D158] hover:border-os-border">
                SKU: {product.id}
              </button>
            )}
            {shipment && (
              <>
                <ArrowDown size={12} className="text-os-text-muted" />
                <button onClick={() => openEntity('shipment', shipment.id)} className="px-2 py-1 bg-os-surface border border-os-border rounded text-[#30D158] hover:border-os-border">
                  Shipment: {shipment.id}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex border-b border-os-border gap-6 text-xs font-mono">
        {(['overview', 'lines', 'supplier', 'shipment', 'inbound', 'exceptions', 'ai'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 uppercase tracking-wider transition-colors border-b-2 -mb-px ${
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
              <span className="text-os-text-muted">Order Date</span>
              <span className="font-mono text-os-text-primary">{formatDateOnly(po.orderDate, timezone)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-os-border">
              <span className="text-os-text-muted">Buyer</span>
              <span className="font-mono text-os-text-primary">{po.buyer || 'Global Procurement'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-os-border">
              <span className="text-os-text-muted">Currency</span>
              <span className="font-mono text-os-text-primary">{currency}</span>
            </div>
          </div>
        )}

        {activeTab === 'lines' && (
          <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-os-border text-[11px] uppercase tracking-wider text-os-text-muted font-semibold">Order Lines ({po.lines.length})</div>
            <div className="divide-y divide-[#2A2A2A] text-xs">
              {po.lines.map((l, idx) => (
                <div key={idx} className="p-4 flex justify-between items-center">
                  <div>
                    <div className="font-mono text-os-text-primary">{l.productId}</div>
                    <div className="text-[10px] text-os-text-muted">Ordered: {l.quantity} | Received: {l.receivedQuantity}</div>
                  </div>
                  <div className="font-mono text-os-text-primary">{formatCurrency(l.unitPrice * l.quantity, currency)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'supplier' && supplier && (
          <div className="bg-os-surface border border-os-border rounded-xl p-5">
            <button onClick={() => openEntity('supplier', supplier.id)} className="w-full text-left p-3 bg-os-surface rounded-lg border border-os-border hover:border-os-border">
              <div className="text-xs font-mono text-os-text-primary">{supplier.name}</div>
              <div className="text-[10px] text-os-text-muted mt-1">OTIF: {supplier.otif}% | Region: {supplier.region}</div>
            </button>
          </div>
        )}

        {activeTab === 'shipment' && (
          <div className="bg-os-surface border border-os-border rounded-xl p-5">
            {shipment ? (
              <button onClick={() => openEntity('shipment', shipment.id)} className="w-full text-left p-3 bg-os-surface rounded-lg border border-os-border hover:border-os-border">
                <div className="text-xs font-mono text-os-text-primary">Shipment {shipment.id}</div>
                <div className="text-[10px] text-os-text-muted mt-1">Status: {shipment.status} | Carrier: {shipment.carrier}</div>
              </button>
            ) : (
              <div className="text-center py-6 text-os-text-muted font-mono text-xs">No shipment dispatched for this PO yet.</div>
            )}
          </div>
        )}

        {activeTab === 'inbound' && (
          <div className="bg-os-surface border border-os-border rounded-xl p-5 text-center text-os-text-muted font-mono text-xs">
            {shipment ? 'ASN / Inbound tracking active.' : 'Inbound ASN not yet created.'}
          </div>
        )}

        {activeTab === 'exceptions' && (
          <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden">
            <div className="divide-y divide-[#2A2A2A] text-xs">
              {poExceptions.map(e => (
                <div key={e.id} onClick={() => openEntity('exception', e.id)} className="p-4 hover:bg-os-surface-hover cursor-pointer">
                  <div className="text-[#FF453A] font-medium">{e.type}</div>
                  <div className="text-[10px] text-os-text-muted">{e.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="bg-os-surface border border-os-border rounded-xl p-6 text-xs font-mono text-os-text-secondary">
            ORION PO Review: PO {po.id} is currently {po.status}. Monitor delivery confirmation.
          </div>
        )}
      </div>
    </div>
  );
};
