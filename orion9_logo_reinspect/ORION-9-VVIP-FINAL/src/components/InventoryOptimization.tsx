import React, { useMemo, useState } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { InventoryOptimizationEngine } from '../core/planning/InventoryOptimizationEngine';
import { DemandForecastEngine } from '../core/planning/DemandForecastEngine';
import { ShieldAlert, CheckCircle2, TrendingDown, Filter, Box, ArrowRight, Activity, Percent } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis, ReferenceLine } from 'recharts';

export const InventoryOptimization = () => {
  const { inventory, products, purchaseOrders, suppliers, settings } = useSupplyChain();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('All');
  const [selectedSku, setSelectedSku] = useState<any>(null);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['All', ...Array.from(cats)];
  }, [products]);

  const warehouses = useMemo(() => {
    const locs = new Set(inventory.map(i => i.warehouseId));
    return ['All', ...Array.from(locs)];
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(inv => {
      const product = products.find(p => p.id === inv.productId);
      if (selectedCategory !== 'All' && product?.category !== selectedCategory) return false;
      if (selectedWarehouse !== 'All' && inv.warehouseId !== selectedWarehouse) return false;
      return true;
    });
  }, [inventory, products, selectedCategory, selectedWarehouse]);

  const optimizationResults = useMemo(() => {
    const forecasts = DemandForecastEngine.generateForecast(filteredInventory, products, 30, 0);
    return InventoryOptimizationEngine.optimize(filteredInventory, forecasts, purchaseOrders, suppliers, settings);
  }, [filteredInventory, products, purchaseOrders, suppliers, settings]);

  const stockoutRisks = optimizationResults.filter(r => ['CRITICAL', 'HIGH'].includes(r.stockoutRisk)).length;
  const overstockRisks = optimizationResults.filter(r => ['CRITICAL', 'HIGH'].includes(r.overstockRisk)).length;
  const avgHealth = optimizationResults.length > 0 
    ? optimizationResults.reduce((sum, r) => sum + r.inventoryHealthScore, 0) / optimizationResults.length 
    : 0;

  // Chart Data: Health Matrix (X: Stock, Y: Demand)
  const matrixData = useMemo(() => {
    return optimizationResults.map(r => {
      const inv = inventory.find(i => i.id === r.inventoryId);
      const prod = products.find(p => p.id === r.productId);
      return {
        id: r.inventoryId,
        productId: r.productId,
        name: prod?.name,
        demand: r.forecastedDemand,
        stock: inv?.onHand || 0,
        health: r.inventoryHealthScore,
        fill: r.stockoutRisk === 'CRITICAL' ? '#FF453A' : r.overstockRisk === 'CRITICAL' ? '#FF9F0A' : '#30D158'
      };
    });
  }, [optimizationResults, inventory, products]);

  // Handle selected item details
  const selectedDetails = useMemo(() => {
    if (!selectedSku) return null;
    const r = optimizationResults.find(opt => opt.inventoryId === selectedSku.id);
    const inv = inventory.find(i => i.id === selectedSku.id);
    const prod = products.find(p => p.id === selectedSku.productId);
    if (!r || !inv || !prod) return null;
    return { r, inv, prod };
  }, [selectedSku, optimizationResults, inventory, products]);

  // Projected vs Current Chart Data for the selected SKU
  const projectionData = useMemo(() => {
    if (!selectedDetails) return [];
    return Array.from({length: 30}).map((_, i) => {
      return {
        day: `Day ${i+1}`,
        projectedStock: Math.max(0, selectedDetails.inv.onHand - (selectedDetails.r.forecastedDemand / 30) * i),
        optimizedStock: Math.max(0, (selectedDetails.r.recommendedSafetyStock + selectedDetails.r.recommendedReorderPoint) - (selectedDetails.r.forecastedDemand / 30) * i),
        demand: selectedDetails.r.forecastedDemand / 30
      }
    });
  }, [selectedDetails]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-os-bg overflow-hidden">
      {/* COMMAND BAR */}
      <div className="flex-none p-4 sm:p-6 lg:px-8 border-b border-os-border bg-os-surface z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 max-w-[1600px] mx-auto w-full">
          <div>
            <h2 className="text-xl font-light text-os-text-primary tracking-tight uppercase flex items-center gap-2">
              <Activity className="text-[#00F2FE]" />
              INVENTORY OPTIMIZATION
            </h2>
            <p className="text-[10px] font-mono text-os-text-muted tracking-widest uppercase mt-1">Optimize position, service level, and working capital</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#0A0C0E] border border-os-border rounded-md px-3 py-1.5">
              <Filter size={14} className="text-os-text-muted" />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-[11px] font-mono text-os-text-primary outline-none uppercase"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-[#0A0C0E] border border-os-border rounded-md px-3 py-1.5">
              <Box size={14} className="text-os-text-muted" />
              <select 
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="bg-transparent text-[11px] font-mono text-os-text-primary outline-none uppercase"
              >
                {warehouses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* KPI ROW */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-os-surface border border-os-border rounded-xl p-5 hover:border-[#30D158]/50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="text-[10px] font-mono text-os-text-secondary uppercase tracking-widest">Avg Health Score</div>
                <CheckCircle2 size={16} className="text-[#30D158]" />
              </div>
              <div className="text-3xl font-light text-os-text-primary">{avgHealth.toFixed(1)}<span className="text-lg text-os-text-muted">/100</span></div>
            </div>
            
            <div className="bg-os-surface border border-os-border rounded-xl p-5 hover:border-[#FF453A]/50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="text-[10px] font-mono text-os-text-secondary uppercase tracking-widest">Stockout Risks</div>
                <ShieldAlert size={16} className="text-[#FF453A]" />
              </div>
              <div className="text-3xl font-light text-os-text-primary">{stockoutRisks}</div>
            </div>

            <div className="bg-os-surface border border-os-border rounded-xl p-5 hover:border-[#FF9F0A]/50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="text-[10px] font-mono text-os-text-secondary uppercase tracking-widest">Excess Risks</div>
                <TrendingDown size={16} className="text-[#FF9F0A]" />
              </div>
              <div className="text-3xl font-light text-os-text-primary">{overstockRisks}</div>
            </div>

            <div className="bg-os-surface border border-os-border rounded-xl p-5 hover:border-[#00F2FE]/50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="text-[10px] font-mono text-os-text-secondary uppercase tracking-widest">Service Level Est.</div>
                <Percent size={16} className="text-[#00F2FE]" />
              </div>
              <div className="text-3xl font-light text-os-text-primary">{(100 - (stockoutRisks / (optimizationResults.length || 1) * 100)).toFixed(1)}<span className="text-lg text-os-text-muted">%</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* INVENTORY HEALTH MAP */}
            <div className="lg:col-span-2 bg-os-surface border border-os-border rounded-xl p-6 flex flex-col">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-os-text-primary uppercase tracking-widest">INVENTORY HEALTH MATRIX</h3>
                  <div className="text-[10px] font-mono text-os-text-muted uppercase">Stock vs Demand Risk Positioning</div>
                </div>
              </div>
              <div className="flex-1 min-h-[350px]">
                {matrixData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis type="number" dataKey="stock" name="On Hand Stock" stroke="#555" fontSize={10} label={{ value: 'CURRENT STOCK ➔', position: 'insideBottom', offset: -10, fill: '#888', fontSize: 10 }} />
                      <YAxis type="number" dataKey="demand" name="30d Demand" stroke="#555" fontSize={10} label={{ value: 'FORECAST DEMAND ➔', angle: -90, position: 'insideLeft', offset: -5, fill: '#888', fontSize: 10 }} />
                      <ZAxis type="number" dataKey="health" range={[60, 400]} name="Health Score" />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-os-surface border border-os-border p-3 rounded-lg shadow-xl">
                                <p className="text-xs font-mono font-bold text-white mb-1">{data.name}</p>
                                <p className="text-[10px] font-mono text-os-text-muted mb-2">{data.productId}</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono text-os-text-secondary">
                                  <span>Stock: <span className="text-white">{data.stock}</span></span>
                                  <span>Demand: <span className="text-white">{data.demand}</span></span>
                                  <span>Health: <span style={{ color: data.fill }}>{data.health}/100</span></span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ReferenceLine y={50} stroke="#333" strokeDasharray="3 3" />
                      <ReferenceLine x={50} stroke="#333" strokeDasharray="3 3" />
                      <Scatter data={matrixData} onClick={(e) => setSelectedSku(e)} className="cursor-pointer" />
                    </ScatterChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-os-text-muted text-xs font-mono">No data available for the selected filters</div>
                )}
              </div>
            </div>

            {/* OPTIMIZATION RECOMMENDATION PANEL */}
            <div className="bg-[#0A0C0E] border border-os-border rounded-xl flex flex-col h-[450px]">
              <div className="p-4 border-b border-os-border bg-os-surface/50">
                <h3 className="text-sm font-medium text-os-text-primary uppercase tracking-widest">SKU OPTIMIZATION</h3>
              </div>
              <div className="p-5 flex-1 overflow-y-auto">
                {selectedDetails ? (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div>
                      <div className="text-lg font-light text-white mb-1">{selectedDetails.prod.name}</div>
                      <div className="text-[10px] font-mono tracking-widest text-[#00F2FE] uppercase">{selectedDetails.prod.id} • {selectedDetails.inv.warehouseId}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-4">
                      <div>
                        <div className="text-[9px] font-mono text-os-text-secondary uppercase mb-1">Current Stock</div>
                        <div className="text-lg font-mono text-white">{selectedDetails.inv.onHand}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-os-text-secondary uppercase mb-1">Forecast (30d)</div>
                        <div className="text-lg font-mono text-white">{selectedDetails.r.forecastedDemand}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-os-text-secondary uppercase mb-1">Days of Supply</div>
                        <div className="text-lg font-mono text-white">{selectedDetails.r.daysOfSupply}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-os-text-secondary uppercase mb-1">Inbound (DOS)</div>
                        <div className="text-lg font-mono text-white">+{selectedDetails.r.inboundCoverage}</div>
                      </div>
                    </div>

                    <div className="bg-os-surface border border-os-border rounded-lg p-4 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#00F2FE]" />
                      <div className="text-[10px] font-mono text-os-text-secondary uppercase tracking-widest mb-3">ORION RECOMMENDATION</div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-[9px] font-mono text-[#00F2FE]/70 uppercase mb-1">Target Safety Stock</div>
                          <div className="text-base font-mono text-[#00F2FE]">{selectedDetails.r.recommendedSafetyStock}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-mono text-[#00F2FE]/70 uppercase mb-1">Target Reorder Point</div>
                          <div className="text-base font-mono text-[#00F2FE]">{selectedDetails.r.recommendedReorderPoint}</div>
                        </div>
                      </div>

                      <div className="text-xs text-white leading-relaxed bg-[#0A0C0E] p-3 rounded border border-white/5">
                        {selectedDetails.r.recommendedAction}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-os-text-muted space-y-3">
                    <Box size={24} className="opacity-20" />
                    <p className="text-[10px] font-mono uppercase tracking-widest">Select a node on the matrix<br/>to view optimization strategy</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* SCENARIO PROJECTION GRAPH */}
          {selectedDetails && (
            <div className="bg-os-surface border border-os-border rounded-xl p-6 animate-in slide-in-from-bottom-4 duration-300">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-os-text-primary uppercase tracking-widest">POSITION TRAJECTORY vs OPTIMIZED STATE</h3>
                  <div className="text-[10px] font-mono text-os-text-muted uppercase">30-Day Simulation based on Orion Recommendations</div>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono tracking-widest uppercase">
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#FF453A]" /> Current</div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#00F2FE]" /> Optimized</div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#888]" /> Daily Demand</div>
                </div>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projectionData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="day" stroke="#555" fontSize={10} tickMargin={10} />
                    <YAxis yAxisId="left" stroke="#555" fontSize={10} />
                    <YAxis yAxisId="right" orientation="right" stroke="#555" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--os-surface)', border: '1px solid var(--os-border)', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '12px' }}
                      labelStyle={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}
                    />
                    <Line yAxisId="left" type="monotone" dataKey="projectedStock" name="Current Strategy Stock" stroke="#FF453A" strokeWidth={2} dot={false} />
                    <Line yAxisId="left" type="monotone" dataKey="optimizedStock" name="Optimized Strategy Stock" stroke="#00F2FE" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="demand" name="Daily Demand" stroke="#888" strokeDasharray="3 3" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
