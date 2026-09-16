import React, { useMemo, useState } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { DemandForecastEngine } from '../core/planning/DemandForecastEngine';
import { LineChart as LineChartIcon, TrendingUp, AlertCircle, Calendar, Filter } from 'lucide-react';
import { formatNumber } from '../lib/formatters';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export const DemandForecasting = () => {
  const { inventory, products } = useSupplyChain();
  const [horizon, setHorizon] = useState(30);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['All', ...Array.from(cats)];
  }, [products]);

  const filteredInventory = useMemo(() => {
    if (selectedCategory === 'All') return inventory;
    return inventory.filter(inv => {
      const product = products.find(p => p.id === inv.productId);
      return product?.category === selectedCategory;
    });
  }, [inventory, products, selectedCategory]);

  const forecasts = useMemo(() => {
    return DemandForecastEngine.generateForecast(filteredInventory, products, horizon, 30);
  }, [filteredInventory, products, horizon]);

  // Aggregate by date for the chart
  const chartData = useMemo(() => {
    const dateMap = new Map();
    forecasts.forEach(f => {
      const date = f.forecastDate.split('T')[0];
      if (!dateMap.has(date)) {
        dateMap.set(date, { 
          date, 
          historical: 0, 
          forecast: 0, 
          lowerBound: 0, 
          upperBound: 0,
          isHistorical: f.isHistorical 
        });
      }
      const entry = dateMap.get(date);
      if (f.isHistorical) {
        entry.historical += f.predictedDemand;
      } else {
        entry.forecast += f.predictedDemand;
        entry.lowerBound += f.lowerBound;
        entry.upperBound += f.upperBound;
      }
    });

    // Sort by date
    return Array.from(dateMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [forecasts]);

  // Group by product for overview table (only include forecast data in total)
  const productOverview = useMemo(() => {
    const overview = new Map();
    forecasts.forEach(f => {
      if (!overview.has(f.productId)) {
        overview.set(f.productId, {
          productId: f.productId,
          totalDemand: 0,
          anomalies: 0,
          confidence: f.confidence
        });
      }
      const data = overview.get(f.productId);
      if (!f.isHistorical) {
        data.totalDemand += f.predictedDemand;
      }
      if (f.anomalyFlag) data.anomalies++;
    });
    return Array.from(overview.values());
  }, [forecasts]);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 w-full max-w-[1680px] mx-auto space-y-4 sm:space-y-6 box-border min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-os-border">
        <div>
          <h2 className="text-xl font-medium text-os-text-primary tracking-tight">Demand Forecasting</h2>
          <p className="text-xs text-os-text-muted mt-1">AI-driven predictive demand intelligence.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-os-text-muted" />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-os-surface border border-os-border text-xs text-os-text-primary rounded-md px-2 py-1.5 outline-none"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex bg-os-surface-elevated p-1 rounded-lg border border-os-border">
            {[7, 14, 30, 60, 90].map(days => (
              <button
                key={days}
                onClick={() => setHorizon(days)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${horizon === days ? 'bg-os-surface-active text-os-text-primary' : 'text-os-text-muted hover:text-os-text-secondary'}`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-os-surface border border-os-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <LineChartIcon className="text-[#34C759]" size={20} />
            <h3 className="text-sm font-medium text-os-text-primary">Total Forecast Demand</h3>
          </div>
          <div className="text-2xl font-semibold text-os-text-primary">
            {formatNumber(productOverview.reduce((sum, p) => sum + p.totalDemand, 0))}
          </div>
          <div className="text-xs text-os-text-muted mt-1">Over next {horizon} days</div>
        </div>
        
        <div className="bg-os-surface border border-os-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="text-[#FF9F0A]" size={20} />
            <h3 className="text-sm font-medium text-os-text-primary">Anomalies Detected</h3>
          </div>
          <div className="text-2xl font-semibold text-os-text-primary">
            {productOverview.reduce((sum, p) => sum + p.anomalies, 0)}
          </div>
          <div className="text-xs text-os-text-muted mt-1">Unusual demand patterns in window</div>
        </div>

        <div className="bg-os-surface border border-os-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-[#0A84FF]" size={20} />
            <h3 className="text-sm font-medium text-os-text-primary">High Confidence</h3>
          </div>
          <div className="text-2xl font-semibold text-os-text-primary">
            {productOverview.filter(p => p.confidence === 'HIGH').length}
          </div>
          <div className="text-xs text-os-text-muted mt-1">Products with stable history</div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-os-surface border border-os-border rounded-xl p-6 h-[400px]">
        <h3 className="text-sm font-medium text-os-text-primary mb-4">Aggregate Demand Projection</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#777777" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#777777" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorFore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34C759" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#34C759" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#777777" 
              fontSize={10} 
              tickFormatter={(val) => {
                const d = new Date(val);
                return `${d.getMonth()+1}/${d.getDate()}`;
              }}
              tickMargin={10}
            />
            <YAxis 
              stroke="#777777" 
              fontSize={10}
              tickFormatter={(val) => formatNumber(val)}
              width={60}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--os-surface)', borderColor: '#2A2A2A', borderRadius: '8px' }}
              itemStyle={{ fontSize: '12px' }}
              labelStyle={{ fontSize: '12px', color: '#777777', marginBottom: '4px' }}
            />
            <ReferenceLine x={todayStr} stroke="#0A84FF" strokeDasharray="3 3" label={{ position: 'top', value: 'Today', fill: '#0A84FF', fontSize: 10 }} />
            <Area 
              type="monotone" 
              dataKey="historical" 
              name="Historical Actuals"
              stroke="#777777" 
              fillOpacity={1} 
              fill="url(#colorHist)" 
              strokeWidth={2}
              activeDot={{ r: 4 }}
            />
            <Area 
              type="monotone" 
              dataKey="forecast" 
              name="Forecast Demand"
              stroke="#34C759" 
              fillOpacity={1} 
              fill="url(#colorFore)" 
              strokeWidth={2}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-os-border">
          <h3 className="text-sm font-medium text-os-text-primary">Product Forecasts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-os-border bg-os-surface">
                <th className="p-4 text-xs font-medium text-os-text-muted uppercase tracking-wider">Product</th>
                <th className="p-4 text-xs font-medium text-os-text-muted uppercase tracking-wider">Expected Demand (Next {horizon} Days)</th>
                <th className="p-4 text-xs font-medium text-os-text-muted uppercase tracking-wider">Confidence</th>
                <th className="p-4 text-xs font-medium text-os-text-muted uppercase tracking-wider">Anomalies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {productOverview.map(p => {
                const productInfo = products.find(prod => prod.id === p.productId);
                return (
                  <tr key={p.productId} className="hover:bg-os-surface-hover transition-colors">
                    <td className="p-4">
                      <div className="text-sm font-medium text-os-text-primary">{productInfo?.name || p.productId}</div>
                      <div className="text-xs text-os-text-muted">{p.productId}</div>
                    </td>
                    <td className="p-4 text-sm font-mono text-os-text-primary">{formatNumber(p.totalDemand)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-[10px] uppercase font-mono rounded border ${
                        p.confidence === 'HIGH' ? 'text-[#34C759] border-[#34C759]/30 bg-[#34C759]/10' :
                        p.confidence === 'MEDIUM' ? 'text-[#FF9F0A] border-[#FF9F0A]/30 bg-[#FF9F0A]/10' :
                        'text-[#FF453A] border-[#FF453A]/30 bg-[#FF453A]/10'
                      }`}>
                        {p.confidence}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-os-text-primary">
                      {p.anomalies > 0 ? (
                         <span className="flex items-center gap-2 text-[#FF9F0A]">
                           <AlertCircle size={14} /> {p.anomalies}
                         </span>
                      ) : (
                         <span className="text-os-text-muted">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
