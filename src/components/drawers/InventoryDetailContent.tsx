import React, { useState, useMemo } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { formatCurrency, formatNumber, formatDateOnly } from '../../lib/utils';
import { Package, Truck, ShieldAlert, BrainCircuit, ArrowRight, ExternalLink, Activity } from 'lucide-react';
import { AnalyticsEngine } from '../../services/AnalyticsEngine';

export const InventoryDetailContent: React.FC<{ id: string }> = ({ id }) => {
  const { inventory, products, suppliers, purchaseOrders, shipments, exceptions, currency, settings } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const [activeTab, setActiveTab] = useState<'overview' | 'demand' | 'pos' | 'supplier' | 'shipments' | 'exceptions' | 'ai'>('overview');
  const [aiPrompt, setAiPrompt] = useState(`Analyze SKU-${id} inventory status, risks, and recommendations.`);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const invItem = useMemo(() => inventory.find(i => i.productId === id || i.id === id), [inventory, id]);
  const product = useMemo(() => products.find(p => p.id === (invItem?.productId || id)), [products, invItem, id]);
  const supplier = useMemo(() => suppliers.find(s => s.id === product?.supplierId), [suppliers, product]);
  
  const relatedPOs = useMemo(() => purchaseOrders.filter(po => po.lines.some(l => l.productId === (product?.id || id))), [purchaseOrders, product, id]);
  const relatedShipments = useMemo(() => {
    const poIds = new Set(relatedPOs.map(po => po.id));
    return shipments.filter(s => poIds.has(s.poId));
  }, [shipments, relatedPOs]);
  const relatedExceptions = useMemo(() => exceptions.filter(e => e.entityId === (product?.id || id) || relatedPOs.some(po => po.id === e.entityId)), [exceptions, product, id, relatedPOs]);

  if (!invItem && !product) {
    return (
      <div className="p-12 text-center text-[#777777] font-mono text-xs">
        Unable to load this record. <button onClick={() => window.location.reload()} className="underline text-[#F5F5F5] ml-1">Retry</button>
      </div>
    );
  }

  const available = (invItem?.onHand || 0) - (invItem?.reserved || 0);
  const healthStats = invItem ? AnalyticsEngine.calculateInventoryHealth(invItem, settings) : { daysOfSupply: 15, status: 'Healthy' };
  const value = (invItem?.onHand || 0) * (invItem?.unitCost || product?.unitCost || 0);

  const handleAskOrion = () => {
    setLoadingAi(true);
    setTimeout(() => {
      setAiResponse(`ORION Diagnostic for SKU ${product?.id || id} (${product?.name || 'Inventory Item'}):
- Current Available Stock: ${formatNumber(available)} units across warehouses.
- Days of Supply: ${healthStats.daysOfSupply} days (Threshold: ${settings.criticalStockOutDays} days).
- Risk Status: ${healthStats.status.toUpperCase()}.
- Linked POs: ${relatedPOs.length} active purchase orders.
- Recommendation: Maintain safety stock threshold and monitor inbound transit delays from ${supplier?.name || 'primary supplier'}.`);
      setLoadingAi(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-[#151515] border border-[#2A2A2A] p-5 rounded-xl space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">{product?.category || 'Inventory Item'}</div>
            <h2 className="text-xl font-medium text-[#F5F5F5] mt-0.5">{product?.name || id}</h2>
          </div>
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase border ${
            healthStats.status === 'Critical' ? 'bg-[#1B1B1B] text-[#FF453A] border-[#2A2A2A]' :
            healthStats.status === 'Low Stock' ? 'bg-[#1B1B1B] text-[#FF9F0A] border-[#2A2A2A]' :
            'bg-[#1B1B1B] text-[#30D158] border-[#2A2A2A]'
          }`}>
            {healthStats.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Available Stock</div>
            <div className="text-base font-mono text-[#F5F5F5]">{formatNumber(available)}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Days of Supply</div>
            <div className="text-base font-mono text-[#F5F5F5]">{healthStats.daysOfSupply}d</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Inventory Value</div>
            <div className="text-base font-mono text-[#F5F5F5]">{formatCurrency(value, currency)}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Daily Demand</div>
            <div className="text-base font-mono text-[#F5F5F5]">{invItem?.averageDailyDemand || 12}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2A2A2A] gap-6 text-xs font-mono">
        {(['overview', 'demand', 'pos', 'supplier', 'shipments', 'exceptions', 'ai'] as const).map(tab => (
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

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'overview' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-5 space-y-4">
            <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Inventory Parameters</div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
                <span className="text-[#777777]">SKU</span>
                <span className="font-mono text-[#F5F5F5]">{product?.id || id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
                <span className="text-[#777777]">Warehouse ID</span>
                <span className="font-mono text-[#F5F5F5]">{invItem?.warehouseId || 'WH-01'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
                <span className="text-[#777777]">On-Hand Stock</span>
                <span className="font-mono text-[#F5F5F5]">{formatNumber(invItem?.onHand || 0)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
                <span className="text-[#777777]">Reserved Stock</span>
                <span className="font-mono text-[#F5F5F5]">{formatNumber(invItem?.reserved || 0)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
                <span className="text-[#777777]">Safety Stock</span>
                <span className="font-mono text-[#F5F5F5]">{formatNumber(invItem?.safetyStock || 0)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
                <span className="text-[#777777]">Reorder Point</span>
                <span className="font-mono text-[#F5F5F5]">{formatNumber(invItem?.reorderPoint || 0)}</span>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-2">
              <button 
                onClick={() => openEntity('product', product?.id || id)}
                className="px-3 py-1.5 bg-[#1B1B1B] border border-[#2A2A2A] rounded-lg text-xs font-mono text-[#F5F5F5] hover:bg-[#202020]"
              >
                View Product Details
              </button>
              {supplier && (
                <button 
                  onClick={() => openEntity('supplier', supplier.id)}
                  className="px-3 py-1.5 bg-[#1B1B1B] border border-[#2A2A2A] rounded-lg text-xs font-mono text-[#F5F5F5] hover:bg-[#202020]"
                >
                  View Supplier ({supplier.name})
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'demand' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-6 space-y-4">
            <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Demand History & Forecast</div>
            {invItem?.averageDailyDemand ? (
              <div className="space-y-3">
                <div className="bg-[#111111] p-4 rounded-lg border border-[#2A2A2A] flex justify-between items-center">
                  <span className="text-xs text-[#777777]">Average Daily Demand</span>
                  <span className="font-mono text-sm text-[#F5F5F5]">{invItem.averageDailyDemand} units/day</span>
                </div>
                <div className="bg-[#111111] p-4 rounded-lg border border-[#2A2A2A] flex justify-between items-center">
                  <span className="text-xs text-[#777777]">30-Day Projected Consumption</span>
                  <span className="font-mono text-sm text-[#F5F5F5]">{Math.round(invItem.averageDailyDemand * 30)} units</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-[#777777] font-mono text-xs">
                Demand data is not configured for this SKU.
              </div>
            )}
          </div>
        )}

        {activeTab === 'pos' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#2A2A2A] text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Linked Purchase Orders ({relatedPOs.length})</div>
            {relatedPOs.length > 0 ? (
              <div className="divide-y divide-[#2A2A2A] text-xs">
                {relatedPOs.map(po => (
                  <div key={po.id} onClick={() => openEntity('po', po.id)} className="p-4 hover:bg-[#202020] cursor-pointer flex justify-between items-center">
                    <div>
                      <div className="font-mono text-[#F5F5F5] font-medium">{po.id}</div>
                      <div className="text-[10px] text-[#777777]">Status: {po.status}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-[#F5F5F5]">{formatCurrency(po.totalValue, currency)}</div>
                      <div className="text-[10px] text-[#777777]">ETA: {formatDateOnly(po.expectedDelivery)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-[#777777] font-mono text-xs">No purchase orders found for this SKU.</div>
            )}
          </div>
        )}

        {activeTab === 'supplier' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-6 space-y-4">
            <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Primary Supplier</div>
            {supplier ? (
              <div className="bg-[#111111] p-4 rounded-lg border border-[#2A2A2A] space-y-3 cursor-pointer hover:border-[#777777]" onClick={() => openEntity('supplier', supplier.id)}>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[#F5F5F5]">{supplier.name}</span>
                  <span className="font-mono text-xs text-[#30D158]">{supplier.otif}% OTIF</span>
                </div>
                <div className="text-xs text-[#777777]">Region: {supplier.region} | Category: {supplier.category}</div>
              </div>
            ) : (
              <div className="text-center py-8 text-[#777777] font-mono text-xs">No supplier linked directly to this product.</div>
            )}
          </div>
        )}

        {activeTab === 'shipments' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#2A2A2A] text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Linked Shipments ({relatedShipments.length})</div>
            {relatedShipments.length > 0 ? (
              <div className="divide-y divide-[#2A2A2A] text-xs">
                {relatedShipments.map(s => (
                  <div key={s.id} onClick={() => openEntity('shipment', s.id)} className="p-4 hover:bg-[#202020] cursor-pointer flex justify-between items-center">
                    <div>
                      <div className="font-mono text-[#F5F5F5] font-medium">{s.id}</div>
                      <div className="text-[10px] text-[#777777]">Carrier: {s.carrier}</div>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <span className="text-[#F5F5F5]">{s.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-[#777777] font-mono text-xs">No shipments found.</div>
            )}
          </div>
        )}

        {activeTab === 'exceptions' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#2A2A2A] text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Linked Exceptions ({relatedExceptions.length})</div>
            {relatedExceptions.length > 0 ? (
              <div className="divide-y divide-[#2A2A2A] text-xs">
                {relatedExceptions.map(e => (
                  <div key={e.id} onClick={() => openEntity('exception', e.id)} className="p-4 hover:bg-[#202020] cursor-pointer flex justify-between items-center">
                    <div>
                      <div className="text-[#FF453A] font-medium">{e.type}</div>
                      <div className="text-[10px] text-[#777777]">{e.description}</div>
                    </div>
                    <div className="font-mono text-[#F5F5F5]">{formatCurrency(e.estimatedImpact, currency)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-[#777777] font-mono text-xs">No exceptions found for this SKU.</div>
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#F5F5F5]">
              <BrainCircuit size={16} />
              ORION AI Diagnostic
            </div>
            <textarea
              className="w-full bg-[#111111] border border-[#2A2A2A] rounded-lg p-3 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]"
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            <button
              onClick={handleAskOrion}
              disabled={loadingAi}
              className="px-4 py-2 bg-[#1B1B1B] border border-[#2A2A2A] text-[#F5F5F5] rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-[#202020] transition-colors"
            >
              {loadingAi ? 'Analyzing...' : 'Ask ORION About This'}
            </button>
            {aiResponse && (
              <div className="bg-[#111111] p-4 rounded-lg border border-[#2A2A2A] text-xs font-mono whitespace-pre-line text-[#B3B3B3]">
                {aiResponse}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
