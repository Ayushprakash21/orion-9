import React, { useState, useMemo, useEffect } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { formatCurrency, formatNumber, formatDateOnly, formatCurrencyPair } from '../../lib/utils';
import { Package, Truck, ShieldAlert, BrainCircuit, ArrowRight, ExternalLink, Activity } from 'lucide-react';
import { AnalyticsEngine } from '../../services/AnalyticsEngine';
import { InventoryEngine } from '../../services/InventoryEngine';
import { ForecastEngine } from '../../services/ForecastEngine';

export const InventoryDetailContent: React.FC<{ id: string }> = ({ id }) => {
  const { inventory, products, suppliers, purchaseOrders, shipments, exceptions, currency, settings, timezone } = useSupplyChain();
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
      <div className="p-12 text-center text-os-text-muted font-mono text-xs space-y-3">
        <div>Inventory record <span className="text-os-text-primary font-semibold">{cleanId}</span> not found.</div>
        <button 
          onClick={() => openEntity('inventory', 'SKU-1000')} 
          className="px-3 py-1.5 bg-os-surface-elevated border border-os-border rounded-lg text-xs font-mono text-[#30D158] hover:border-os-border transition-colors"
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
      <div className="bg-os-surface border border-os-border p-5 rounded-xl space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-mono text-os-text-muted uppercase tracking-wider">{product?.category || 'Inventory Item'}</div>
            <h2 className="text-xl font-medium text-os-text-primary mt-0.5">{product?.name || skuId}</h2>
          </div>
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase border ${
            healthStats.status === 'Critical' ? 'bg-os-surface-elevated text-[#FF453A] border-os-border' :
            healthStats.status === 'Low Stock' ? 'bg-os-surface-elevated text-[#FF9F0A] border-os-border' :
            'bg-os-surface-elevated text-[#30D158] border-os-border'
          }`}>
            {healthStats.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Available Stock</div>
            <div className="text-base font-mono text-os-text-primary">{formatNumber(available)}</div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Days of Supply</div>
            <div className="text-base font-mono text-os-text-primary">
              {daysOfSupply !== null && daysOfSupply !== undefined ? `${formatNumber(daysOfSupply, 1)}d` : 'N/A'}
            </div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Inventory Value</div>
            {(() => {
              const valPair = formatCurrencyPair(value, currency);
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
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Daily Demand</div>
            <div className="text-base font-mono text-os-text-primary">
              {dailyDemand !== null && dailyDemand !== undefined ? formatNumber(dailyDemand, 1) : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-os-border gap-6 text-xs font-mono overflow-x-auto">
        {(['overview', 'demand', 'pos', 'supplier', 'shipments', 'exceptions', 'ai'] as const).map(tab => (
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

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'overview' && (
          <div className="bg-os-surface border border-os-border rounded-xl p-5 space-y-4">
            <div className="text-[11px] uppercase tracking-wider text-os-text-muted font-semibold">Inventory Parameters</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
              <div className="flex justify-between py-2 border-b border-os-border">
                <span className="text-os-text-muted">SKU</span>
                <span className="font-mono text-os-text-primary">{skuId}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-os-border">
                <span className="text-os-text-muted">Warehouse ID</span>
                <span className="font-mono text-os-text-primary">{invItem?.warehouseId || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-os-border">
                <span className="text-os-text-muted">On-Hand Stock</span>
                <span className="font-mono text-os-text-primary">{invItem?.onHand !== undefined ? formatNumber(invItem.onHand) : 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-os-border">
                <span className="text-os-text-muted">Reserved Stock</span>
                <span className="font-mono text-os-text-primary">{invItem?.reserved !== undefined ? formatNumber(invItem.reserved) : 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-os-border">
                <span className="text-os-text-muted">Available Stock</span>
                <span className="font-mono text-os-text-primary">{formatNumber(available)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-os-border">
                <span className="text-os-text-muted">Safety Stock</span>
                <span className="font-mono text-os-text-primary">{invItem?.safetyStock !== undefined ? formatNumber(invItem.safetyStock) : 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-os-border">
                <span className="text-os-text-muted">Reorder Point</span>
                <span className="font-mono text-os-text-primary">{invItem?.reorderPoint !== undefined ? formatNumber(invItem.reorderPoint) : 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-os-border">
                <span className="text-os-text-muted">Days of Supply</span>
                <span className="font-mono text-os-text-primary">
                  {daysOfSupply !== null && daysOfSupply !== undefined ? `${formatNumber(daysOfSupply, 1)} days` : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-os-border">
                <span className="text-os-text-muted">Daily Demand</span>
                <span className="font-mono text-os-text-primary">
                  {dailyDemand !== null && dailyDemand !== undefined ? `${formatNumber(dailyDemand, 1)} units/day` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-os-border">
                <span className="text-os-text-muted">Projected Stock-Out Date</span>
                <span className={`font-mono ${metrics?.stockOutDate ? 'text-[#FF453A]' : 'text-[#30D158]'}`}>
                  {metrics?.stockOutDate ? formatDateOnly(metrics.stockOutDate, timezone) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-os-border">
                <span className="text-os-text-muted">Forecast Trend</span>
                <span className="font-mono text-os-text-primary">
                  {forecast ? `${forecast.trend} (${forecast.trendPercentage}%)` : 'N/A'}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-os-border">
                <span className="text-os-text-muted">Inventory Value</span>
                <span className="font-mono text-os-text-primary">{formatCurrency(value, currency)}</span>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-2">
              <button 
                onClick={() => openEntity('product', skuId)}
                className="px-3 py-1.5 bg-os-surface-elevated border border-os-border rounded-lg text-xs font-mono text-os-text-primary hover:bg-os-surface-hover transition-colors"
              >
                View Product Details
              </button>
              {supplier && (
                <button 
                  onClick={() => openEntity('supplier', supplier.id)}
                  className="px-3 py-1.5 bg-os-surface-elevated border border-os-border rounded-lg text-xs font-mono text-os-text-primary hover:bg-os-surface-hover transition-colors"
                >
                  View Supplier ({supplier.name})
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'demand' && (
          <div className="bg-os-surface border border-os-border rounded-xl p-6 space-y-4">
            <div className="text-[11px] uppercase tracking-wider text-os-text-muted font-semibold">Demand History & Forecast</div>
            {dailyDemand !== null && dailyDemand !== undefined ? (
              <div className="space-y-3">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-os-surface p-4 rounded-lg border border-os-border space-y-1">
                    <span className="text-[10px] uppercase font-mono text-os-text-muted">Average Daily Demand</span>
                    <div className="font-mono text-sm text-os-text-primary">{formatNumber(dailyDemand, 1)} units/day</div>
                  </div>
                  <div className="bg-os-surface p-4 rounded-lg border border-os-border space-y-1">
                    <span className="text-[10px] uppercase font-mono text-os-text-muted">Demand Trend</span>
                    <div className="font-mono text-sm text-os-text-primary">{forecast ? `${forecast.trend} (${forecast.trendPercentage}%)` : 'N/A'}</div>
                  </div>
                  <div className="bg-os-surface p-4 rounded-lg border border-os-border space-y-1">
                    <span className="text-[10px] uppercase font-mono text-os-text-muted">7-Day Forecast</span>
                    <div className="font-mono text-sm text-os-text-primary">{forecast ? formatNumber(forecast.forecast7Day) : 'N/A'} units</div>
                  </div>
                  <div className="bg-os-surface p-4 rounded-lg border border-os-border space-y-1">
                    <span className="text-[10px] uppercase font-mono text-os-text-muted">30-Day Forecast</span>
                    <div className="font-mono text-sm text-os-text-primary">{forecast ? formatNumber(forecast.forecast30Day) : formatNumber(Math.round(dailyDemand * 30))} units</div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-12 text-os-text-muted font-mono text-xs">
                Demand data is not configured for this SKU.
              </div>
            )}
          </div>
        )}

        {activeTab === 'pos' && (
          <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-os-border text-[11px] uppercase tracking-wider text-os-text-muted font-semibold">Linked Purchase Orders ({relatedPOs.length})</div>
            {relatedPOs.length > 0 ? (
              <div className="divide-y divide-[#2A2A2A] text-xs">
                {relatedPOs.map(po => (
                  <div key={po.id} onClick={() => openEntity('po', po.id)} className="p-4 hover:bg-os-surface-hover cursor-pointer flex justify-between items-center transition-colors">
                    <div>
                      <div className="font-mono text-os-text-primary font-medium">{po.id}</div>
                      <div className="text-[10px] text-os-text-muted">Status: {po.status}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-os-text-primary">{formatCurrency(po.totalValue, currency)}</div>
                      <div className="text-[10px] text-os-text-muted">ETA: {formatDateOnly(po.expectedDelivery, timezone)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-os-text-muted font-mono text-xs">No purchase orders found for this SKU.</div>
            )}
          </div>
        )}

        {activeTab === 'supplier' && (
          <div className="bg-os-surface border border-os-border rounded-xl p-6 space-y-4">
            <div className="text-[11px] uppercase tracking-wider text-os-text-muted font-semibold">Primary Supplier</div>
            {supplier ? (
              <div className="bg-os-surface p-4 rounded-lg border border-os-border space-y-3 cursor-pointer hover:border-os-border transition-colors" onClick={() => openEntity('supplier', supplier.id)}>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-os-text-primary">{supplier.name}</span>
                  <span className="font-mono text-xs text-[#30D158]">{supplier.otif}% OTIF</span>
                </div>
                <div className="text-xs text-os-text-muted">Supplier ID: {supplier.id} | Region: {supplier.region} | Category: {supplier.category}</div>
              </div>
            ) : (
              <div className="text-center py-8 text-os-text-muted font-mono text-xs">No supplier linked directly to this product.</div>
            )}
          </div>
        )}

        {activeTab === 'shipments' && (
          <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-os-border text-[11px] uppercase tracking-wider text-os-text-muted font-semibold">Linked Shipments ({relatedShipments.length})</div>
            {relatedShipments.length > 0 ? (
              <div className="divide-y divide-[#2A2A2A] text-xs">
                {relatedShipments.map(s => (
                  <div key={s.id} onClick={() => openEntity('shipment', s.id)} className="p-4 hover:bg-os-surface-hover cursor-pointer flex justify-between items-center transition-colors">
                    <div>
                      <div className="font-mono text-os-text-primary font-medium">{s.id}</div>
                      <div className="text-[10px] text-os-text-muted">Carrier: {s.carrier}</div>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <span className="text-os-text-primary">{s.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-os-text-muted font-mono text-xs">No shipments found.</div>
            )}
          </div>
        )}

        {activeTab === 'exceptions' && (
          <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-os-border text-[11px] uppercase tracking-wider text-os-text-muted font-semibold">Linked Exceptions ({relatedExceptions.length})</div>
            {relatedExceptions.length > 0 ? (
              <div className="divide-y divide-[#2A2A2A] text-xs">
                {relatedExceptions.map(e => (
                  <div key={e.id} onClick={() => openEntity('exception', e.id)} className="p-4 hover:bg-os-surface-hover cursor-pointer flex justify-between items-center transition-colors">
                    <div>
                      <div className="text-[#FF453A] font-medium">{e.type}</div>
                      <div className="text-[10px] text-os-text-muted">{e.description}</div>
                    </div>
                    <div className="font-mono text-os-text-primary">{formatCurrency(e.estimatedImpact, currency)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-os-text-muted font-mono text-xs">No exceptions found for this SKU.</div>
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="bg-os-surface border border-os-border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-os-text-primary">
              <BrainCircuit size={16} />
              ORION AI Diagnostic
            </div>
            <textarea
              className="w-full bg-os-surface border border-os-border rounded-lg p-3 text-xs text-os-text-primary focus:outline-none focus:border-os-border"
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            <button
              onClick={handleAskOrion}
              disabled={loadingAi}
              className="px-4 py-2 bg-os-surface-elevated border border-os-border text-os-text-primary rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-os-surface-hover transition-colors disabled:opacity-50"
            >
              {loadingAi ? 'Analyzing...' : 'Ask ORION About This'}
            </button>
            {aiResponse && (
              <div className="bg-os-surface p-4 rounded-lg border border-os-border text-xs font-mono whitespace-pre-line text-os-text-secondary">
                {aiResponse}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
