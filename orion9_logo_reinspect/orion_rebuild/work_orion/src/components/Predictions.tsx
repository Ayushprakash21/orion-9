import React, { useMemo, useState } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { Lightbulb, TrendingDown, Clock, ShieldAlert, Activity, AlertTriangle, ArrowRight, Zap, Target, Truck, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { PredictionEngine } from '../services/PredictionEngine';
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';

export const Predictions = () => {
  const { exceptions, inventory, purchaseOrders, shipments, suppliers, settings, currency } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const [activePeriods, setActivePeriods] = useState<Record<string, number>>({});

  const predictions = useMemo(() => {
    return PredictionEngine.generatePredictions(inventory, purchaseOrders, shipments, suppliers);
  }, [inventory, purchaseOrders, shipments, suppliers]);

  const setPeriod = (predId: string, days: number) => {
    setActivePeriods(prev => ({ ...prev, [predId]: days }));
  };

  const getGraphData = (pred: any, days: number) => {
    if (!pred.metrics) return null;
    const { available, dailyDemand, incomingPos } = pred.metrics;
    
    // Create deterministic mock data based on real metrics
    const data = [];
    const today = new Date();
    
    // Historical (last 7 days just to show context)
    for (let i = 7; i > 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      data.push({
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        type: 'historical',
        inventory: available + (i * dailyDemand), // mock historical drawdown
        demand: dailyDemand * (1 + (Math.sin(i) * 0.2)) // minor variation
      });
    }
    
    // Forecast
    let currentStock = available;
    for (let i = 0; i <= days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      
      // Add incoming shipments if projected
      let arrived = 0;
      if (incomingPos) {
        incomingPos.forEach((po: any) => {
          const expected = new Date(po.expectedDelivery);
          if (expected.toDateString() === d.toDateString()) {
             po.lines.forEach((l: any) => {
               if (l.productId === pred.entity) arrived += l.quantity;
             });
          }
        });
      }
      
      currentStock += arrived;
      currentStock -= dailyDemand;
      
      data.push({
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        type: 'forecast',
        inventory: Math.max(0, currentStock),
        demand: dailyDemand,
        arrived
      });
    }
    return data;
  };

  // Summary Metrics
  const stockoutRiskCount = predictions.filter(p => p.predictionType === 'Projected Stock-Out').length;
  const highRiskCount = predictions.filter(p => p.probability === 'High').length;
  const totalExposure = predictions.reduce((sum, p) => sum + (p.impact || 0), 0);
  const supplierDelays = predictions.filter(p => p.predictionType === 'Supplier Delay').length;

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 w-full max-w-[1680px] mx-auto space-y-6 box-border min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-os-border">
        <div>
          <h2 className="text-xl font-medium text-os-text-primary tracking-tight">Predictive Intelligence</h2>
          <p className="text-xs text-os-text-muted mt-1 hidden sm:block">AI reasoning engine forecasting risks, stock-outs, and anomalies.</p>
        </div>
      </div>
      
      {/* Predictive Outlook Summary */}
      <div className="bg-os-surface border border-os-border p-5 rounded-xl">
        <h3 className="text-[11px] font-bold text-os-text-muted uppercase tracking-widest mb-4">Predictive Outlook</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
           <div className="flex flex-col">
             <span className="text-[10px] text-os-text-secondary uppercase tracking-wider mb-1 flex items-center gap-1.5"><AlertCircle size={12} className="text-[#FF453A]" /> Forecasted Stockouts</span>
             <span className="text-lg font-mono font-bold text-os-text-primary">{stockoutRiskCount}</span>
           </div>
           <div className="flex flex-col">
             <span className="text-[10px] text-os-text-secondary uppercase tracking-wider mb-1 flex items-center gap-1.5"><Target size={12} className="text-[#FF9F0A]" /> High-Risk SKUs</span>
             <span className="text-lg font-mono font-bold text-os-text-primary">{highRiskCount}</span>
           </div>
           <div className="flex flex-col">
             <span className="text-[10px] text-os-text-secondary uppercase tracking-wider mb-1 flex items-center gap-1.5"><Zap size={12} className="text-[#0A84FF]" /> Inventory Exposure</span>
             <span className="text-lg font-mono font-bold text-os-text-primary">{formatCurrency(totalExposure, currency)}</span>
           </div>
           <div className="flex flex-col">
             <span className="text-[10px] text-os-text-secondary uppercase tracking-wider mb-1 flex items-center gap-1.5"><Truck size={12} className="text-[#BF5AF2]" /> Lead-Time Anomalies</span>
             <span className="text-lg font-mono font-bold text-os-text-primary">{supplierDelays}</span>
           </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {predictions.map(pred => {
          let confColor = "text-os-text-secondary bg-os-surface-elevated border-os-border";
          if (pred.confidence === 'High') confColor = "text-[#30D158] bg-os-surface-elevated border-os-border";
          if (pred.confidence === 'Medium') confColor = "text-[#FF9F0A] bg-os-surface-elevated border-os-border";
          
          const period = activePeriods[pred.id] || 30;
          const graphData = getGraphData(pred, period);

          return (
            <div 
              key={pred.id} 
              className="bg-os-surface border border-os-border rounded-xl hover:border-os-border transition-colors group flex flex-col min-w-0"
            >
              <div className="p-6 pb-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-os-surface-elevated border border-os-border flex items-center justify-center text-os-text-secondary">
                      {pred.predictionType === 'Projected Stock-Out' ? <TrendingDown size={18} className="text-[#FF453A]" /> : <Lightbulb size={18} className="text-[#0A84FF]" />}
                    </div>
                    <div>
                      <h3 className="text-sm text-os-text-primary font-bold truncate max-w-[200px]">{pred.entity}</h3>
                      <div className="text-[10px] text-os-text-muted mt-0.5 uppercase tracking-wider">{pred.predictionType}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    {[7, 14, 30, 60, 90].map(d => (
                      <button 
                        key={d}
                        onClick={() => setPeriod(pred.id, d)}
                        className={`text-[9px] px-1.5 py-0.5 rounded ${period === d ? 'bg-os-border-strong text-os-text-primary' : 'text-os-text-muted hover:bg-os-surface-hover'}`}
                      >
                        {d}D
                      </button>
                    ))}
                  </div>
                </div>
                
                {pred.metrics && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-os-surface-secondary/50 rounded p-2">
                      <div className="text-[9px] uppercase tracking-wider text-os-text-muted mb-0.5">Available</div>
                      <div className="font-mono text-sm text-os-text-primary">{Math.round(pred.metrics.available)}</div>
                    </div>
                    <div className="bg-os-surface-secondary/50 rounded p-2">
                      <div className="text-[9px] uppercase tracking-wider text-os-text-muted mb-0.5">Demand</div>
                      <div className="font-mono text-sm text-os-text-primary">{Math.round(pred.metrics.dailyDemand)}<span className="text-[10px] text-os-text-secondary">/day</span></div>
                    </div>
                    <div className="bg-os-surface-secondary/50 rounded p-2">
                      <div className="text-[9px] uppercase tracking-wider text-os-text-muted mb-0.5">Days Supply</div>
                      <div className="font-mono text-sm text-os-text-primary">{pred.metrics.daysOfSupply ? pred.metrics.daysOfSupply.toFixed(1) : (pred.metrics.available / pred.metrics.dailyDemand).toFixed(1)}</div>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-os-text-secondary mb-4 min-h-[40px] leading-relaxed border-l-2 border-os-border-strong pl-3">
                  {pred.evidence}
                </div>
              </div>

              {/* Individual Prediction Graph */}
              <div className="h-32 w-full border-t border-b border-os-border bg-os-surface-secondary/30 relative">
                {graphData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={graphData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`invGrad-${pred.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0A84FF" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0A84FF" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 2" stroke="#292C2F" vertical={false} opacity={0.5} />
                      <XAxis dataKey="date" hide />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-os-surface border border-os-border-strong p-2 rounded shadow-xl text-[10px] font-mono z-50">
                                <div className="text-os-text-muted mb-1 pb-1 border-b border-os-border">{label} <span className="uppercase text-[#FF9F0A] ml-2">{d.type}</span></div>
                                <div className="text-blue-400">Inventory: {Math.round(d.inventory)}</div>
                                <div className="text-os-text-secondary">Demand: {Math.round(d.demand)}</div>
                                {d.arrived > 0 && <div className="text-emerald-400">Replenishment: +{d.arrived}</div>}
                                {pred.metrics?.safetyStock > d.inventory && d.inventory > 0 && <div className="text-amber-400 mt-1">Below Safety Stock</div>}
                                {d.inventory <= 0 && <div className="text-red-400 mt-1 font-bold">Stockout Risk</div>}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {pred.metrics?.safetyStock && (
                        <ReferenceLine y={pred.metrics.safetyStock} stroke="#FF9F0A" strokeDasharray="3 3" opacity={0.5} />
                      )}
                      <Area 
                        type="monotone" 
                        dataKey="inventory" 
                        stroke="#0A84FF" 
                        fill={`url(#invGrad-${pred.id})`}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] uppercase font-mono text-os-text-muted tracking-widest text-center px-4">
                    Forecast visualization unavailable<br/>insufficient historical data
                  </div>
                )}
                <div className="absolute bottom-1 left-2 text-[9px] font-mono text-os-text-muted tracking-widest uppercase">Historical</div>
                <div className="absolute bottom-1 right-2 text-[9px] font-mono text-os-text-muted tracking-widest uppercase">Forecast</div>
                <div className="absolute top-0 bottom-0 left-[25%] w-px bg-os-border-strong border-r border-os-border-strong border-dashed opacity-50 z-10" />
              </div>

              <div className="p-6 pt-4">
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-os-border">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-os-text-muted mb-1">Exposure</div>
                    <div className="text-sm font-mono text-os-text-primary">{formatCurrency(pred.impact, currency)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-os-text-muted mb-1">Confidence</div>
                    <div className={`inline-block text-[10px] uppercase font-mono px-2 py-1 border rounded-md ${confColor}`}>
                      {pred.confidence}
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => openEntity({ type: 'prediction', id: pred.id })}
                  className="flex justify-between items-center text-os-text-muted hover:text-os-text-primary transition-colors cursor-pointer group-hover:text-blue-400"
                >
                  <span className="text-xs font-mono uppercase tracking-wider font-bold">View Related Events</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
