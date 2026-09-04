import React, { useState, useMemo, useEffect } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { formatCurrency, formatNumber, formatDateOnly } from '../../lib/utils';
import { Package, Truck, ShieldAlert, BrainCircuit, ArrowRight, ExternalLink, Activity } from 'lucide-react';
import { AnalyticsEngine } from '../../services/AnalyticsEngine';
import { InventoryEngine } from '../../services/InventoryEngine';
import { ForecastEngine } from '../../services/ForecastEngine';

export const InventoryDetailContent: React.FC<{ id: string }> = ({ id }) => {
  const { inventory, products, suppliers, purchaseOrders, shipments, exceptions, currency, settings } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const [activeTab, setActiveTab] = useState<'overview' | 'demand' | 'pos' | 'supplier' | 'shipments' | 'exceptions' | 'ai'>('overview');

  const cleanId = (id || '').trim();
  const invItem = useMemo(() => {
    return inventory.find(i => 
      i.productId.toLowerCase() === cleanId.toLowerCase() || 
      i.id.toLowerCase() === cleanId.toLowerCase()
    );
  }, [inventory, cleanId]);

  const product = useMemo(() => {
    const targetSku = invItem?.productId || cleanId;
    return products.find(p => p.id.toLowerCase() === targetSku.toLowerCase());
  }, [products, invItem, cleanId]);

  const skuId = product?.id || invItem?.productId || cleanId;

  const [aiPrompt, setAiPrompt] = useState(`Analyze ${skuId} inventory status, risks, and recommendations.`);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    setAiPrompt(`Analyze ${skuId} inventory status, risks, and recommendations.`);
    setAiResponse(null);
  }, [skuId]);

  const relatedPOs = useMemo(() => {
    return purchaseOrders.filter(po => po.lines.some(l => l.productId.toLowerCase() === skuId.toLowerCase()));
  }, [purchaseOrders, skuId]);

  const relatedShipments = useMemo(() => {
    const poIds = new Set(relatedPOs.map(po => po.id));
    return shipments.filter(s => poIds.has(s.poId));
  }, [shipments, relatedPOs]);

  const relatedExceptions = useMemo(() => {
    return exceptions.filter(e => 
      e.entityId.toLowerCase() === skuId.toLowerCase() || 
      relatedPOs.some(po => po.id === e.entityId)
    );
  }, [exceptions, skuId, relatedPOs]);

  const supplier = useMemo(() => {
    if (product?.supplierId) {
      const found = suppliers.find(s => s.id === product.supplierId);
      if (found) return found;
    }
    if (relatedPOs.length > 0) {
      const poSupplierId = relatedPOs[0].supplierId;
      const found = suppliers.find(s => s.id === poSupplierId);
      if (found) return found;
    }
    return undefined;
  }, [suppliers, product, relatedPOs]);

  if (!invItem && !product) {
    return (
      <div className="p-12 text-center text-[#777777] font-mono text-xs space-y-3">
        <div>Inventory record <span className="text-[#F5F5F5] font-semibold">{cleanId}</span> not found.</div>
        <button 
          onClick={() => openEntity('inventory', 'SKU-1000')} 
          className="px-3 py-1.5 bg-[#1B1B1B] border border-[#2A2A2A] rounded-lg text-xs font-mono text-[#30D158] hover:border-[#777777] transition-colors"
        >
          View SKU-1000
        </button>
      </div>
    );
  }

  const metrics = invItem ? InventoryEngine.calculateMetrics(invItem, purchaseOrders, shipments, suppliers) : null;
  const forecast = invItem ? ForecastEngine.generateForecast(invItem) : null;

  const available = metrics ? metrics.available : ((invItem?.onHand ?? 0) - (invItem?.reserved ?? 0));
  const healthStats = invItem 
    ? AnalyticsEngine.calculateInventoryHealth(invItem, settings) 
    : { available, daysOfSupply: null, status: 'Healthy', risk: 'Low' };
  const unitCost = invItem?.unitCost ?? product?.unitCost ?? 0;
  const value = (invItem?.onHand ?? 0) * unitCost;
  const daysOfSupply = healthStats.daysOfSupply;
  const dailyDemand = invItem?.averageDailyDemand ?? invItem?.dailyDemand ?? null;

  const handleAskOrion = () => {
    setLoadingAi(true);
    setTimeout(() => {
      const formattedDos = daysOfSupply !== null && daysOfSupply !== undefined ? formatNumber(daysOfSupply, 1) : 'N/A';
      setAiResponse(`ORION Diagnostic for SKU ${skuId} (${product?.name || 'Inventory Item'}):
- Current Available Stock: ${formatNumber(available)} units across warehouses.
- Days of Supply: ${formattedDos} days (Threshold: ${settings.criticalStockOutDays} days).
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
            <h2 className="text-xl font-medium text-[#F5F5F5] mt-0.5">{product?.name || skuId}</h2>
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
            <div className="text-base font-mono text-[#F5F5F5]">
              {daysOfSupply !== null && daysOfSupply !== undefined ? `${formatNumber(daysOfSupply, 1)}d` : 'N/A'}
            </div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Inventory Value</div>
            <div className="text-base font-mono text-[#F5F5F5]">{formatCurrency(value, currency)}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Daily Demand</div>
            <div className="text-base font-mono text-[#F5F5F5]">
              {dailyDemand !== null && dailyDemand !== undefined ? formatNumber(dailyDemand, 1) : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2A2A2A] gap-6 text-xs font-mono overflow-x-auto">
        {(['overview', 'demand', 'pos', 'supplier', 'shipments', 'exceptions', 'ai'] as const).map(tab => (
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

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'overview' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-5 space-y-4">
            <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Inventory Parameters</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
              <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
                <span className="text-[#777777]">SKU</span>
                <span className="font-mono text-[#F5F5F5]">{skuId}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
                <span className="text-[#777777]">Warehouse ID</span>
                <span className="font-mono text-[#F5F5F5]">{invItem?.warehouseId || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
                <span className="text-[#777777]">On-Hand Stock</span>
                <span className="font-mono text-[#F5F5F5]">{invItem?.onHand !== undefined ? formatNumber(invItem.onHand) : 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
                <span className="text-[#777777]">Reserved Stock</span>
                <span className="font-mono text-[#F5F5F5]">{invItem?.reserved !== undefined ? formatNumber(invItem.reserved) : 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
                <span className="text-[#777777]">Available Stock</span>
                <span className="font-mono text-[#F5F5F5]">{formatNumber(available)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
                <span className="text-[#777777]">Safety Stock</span>
                <span className="font-mono text-[#F5F5F5]">{invItem?.safetyStock !== undefined ? formatNumber(invItem.safetyStock) : 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
                <span className="text-[#777777]">Reorder Point</span>
                <span className="font-mono text-[#F5F5F5]">{invItem?.reorderPoint !== undefined ? formatNumber(invItem.reorderPoint) : 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
                <span className="text-[#777777]">Days of Supply</span>
                <span className="font-mono text-[#F5F5F5]">
                  {daysOfSupply !== null && daysOfSupply !== undefined ? `${formatNumber(daysOfSupply, 1)} days` : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
                <span className="text-[#777777]">Daily Demand</span>
                <span className="font-mono text-[#F5F5F5]">
                  {dailyDemand !== null && dailyDemand !== undefined ? `${formatNumber(dailyDemand, 1)} units/day` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
                <span className="text-[#777777]">Projected Stock-Out Date</span>
                <span className={`font-mono ${metrics?.stockOutDate ? 'text-[#FF453A]' : 'text-[#30D158]'}`}>
                  {metrics?.stockOutDate ? formatDateOnly(metrics.stockOutDate) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
                <span className="text-[#777777]">Forecast Trend</span>
                <span className="font-mono text-[#F5F5F5]">
                  {forecast ? `${forecast.trend} (${forecast.trendPercentage}%)` : 'N/A'}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
                <span className="text-[#777777]">Inventory Value</span>
                <span className="font-mono text-[#F5F5F5]">{formatCurrency(value, currency)}</span>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-2">
              <button 
                onClick={() => openEntity('product', skuId)}
                className="px-3 py-1.5 bg-[#1B1B1B] border border-[#2A2A2A] rounded-lg text-xs font-mono text-[#F5F5F5] hover:bg-[#202020] transition-colors"
              >
                View Product Details
              </button>
              {supplier && (
                <button 
                  onClick={() => openEntity('supplier', supplier.id)}
                  className="px-3 py-1.5 bg-[#1B1B1B] border border-[#2A2A2A] rounded-lg text-xs font-mono text-[#F5F5F5] hover:bg-[#202020] transition-colors"
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
            {dailyDemand !== null && dailyDemand !== undefined ? (
              <div className="space-y-3">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#111111] p-4 rounded-lg border border-[#2A2A2A] space-y-1">
                    <span className="text-[10px] uppercase font-mono text-[#777777]">Average Daily Demand</span>
                    <div className="font-mono text-sm text-[#F5F5F5]">{formatNumber(dailyDemand, 1)} units/day</div>
                  </div>
                  <div className="bg-[#111111] p-4 rounded-lg border border-[#2A2A2A] space-y-1">
                    <span className="text-[10px] uppercase font-mono text-[#777777]">Demand Trend</span>
                    <div className="font-mono text-sm text-[#F5F5F5]">{forecast ? `${forecast.trend} (${forecast.trendPercentage}%)` : 'N/A'}</div>
                  </div>
                  <div className="bg-[#111111] p-4 rounded-lg border border-[#2A2A2A] space-y-1">
                    <span className="text-[10px] uppercase font-mono text-[#777777]">7-Day Forecast</span>
                    <div className="font-mono text-sm text-[#F5F5F5]">{forecast ? formatNumber(forecast.forecast7Day) : 'N/A'} units</div>
                  </div>
                  <div className="bg-[#111111] p-4 rounded-lg border border-[#2A2A2A] space-y-1">
                    <span className="text-[10px] uppercase font-mono text-[#777777]">30-Day Forecast</span>
                    <div className="font-mono text-sm text-[#F5F5F5]">{forecast ? formatNumber(forecast.forecast30Day) : formatNumber(Math.round(dailyDemand * 30))} units</div>
                  </div>
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
                  <div key={po.id} onClick={() => openEntity('po', po.id)} className="p-4 hover:bg-[#202020] cursor-pointer flex justify-between items-center transition-colors">
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
              <div className="bg-[#111111] p-4 rounded-lg border border-[#2A2A2A] space-y-3 cursor-pointer hover:border-[#777777] transition-colors" onClick={() => openEntity('supplier', supplier.id)}>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[#F5F5F5]">{supplier.name}</span>
                  <span className="font-mono text-xs text-[#30D158]">{supplier.otif}% OTIF</span>
                </div>
                <div className="text-xs text-[#777777]">Supplier ID: {supplier.id} | Region: {supplier.region} | Category: {supplier.category}</div>
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
                  <div key={s.id} onClick={() => openEntity('shipment', s.id)} className="p-4 hover:bg-[#202020] cursor-pointer flex justify-between items-center transition-colors">
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
                  <div key={e.id} onClick={() => openEntity('exception', e.id)} className="p-4 hover:bg-[#202020] cursor-pointer flex justify-between items-center transition-colors">
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
              className="px-4 py-2 bg-[#1B1B1B] border border-[#2A2A2A] text-[#F5F5F5] rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-[#202020] transition-colors disabled:opacity-50"
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
