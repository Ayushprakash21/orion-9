import React, { useState, useMemo } from 'react';
import { useMobileNavigation } from './OrionMobileNavigation';
import { useLiveMetric, useLiveChartSeries, ChartDataAdapter } from '../../core/visualization';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Package, 
  Truck, 
  ShoppingCart, 
  AlertTriangle, 
  ChevronRight, 
  Zap, 
  ShieldAlert,
  ArrowUpRight,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../lib/formatters';

type ChartMetricKey = 'PO_VOLUME' | 'SHIPMENT_VOLUME' | 'INVENTORY_ON_HAND' | 'CONTROL_TOWER_EXCEPTIONS';

export const OrionMobileHome: React.FC = () => {
  const { navigateToTab, openEntityDetail, openApp, openOrionAI } = useMobileNavigation();
  const { exceptions, shipments, purchaseOrders, inventory, currency } = useSupplyChain();
  const environment = dbManager.getEnvironment();
  const isLive = environment === 'LIVE';

  // Live Metrics via Governed Visualization Engine
  const { metric: poMetric } = useLiveMetric('PO_VOLUME');
  const { metric: invMetric } = useLiveMetric('INVENTORY_ON_HAND');
  const { metric: shpMetric } = useLiveMetric('SHIPMENT_VOLUME');
  const { metric: excMetric } = useLiveMetric('CONTROL_TOWER_EXCEPTIONS');
  const { metric: healthMetric } = useLiveMetric('NETWORK_HEALTH_INDEX');

  // Chart Metric Selection State
  const [selectedChartMetric, setSelectedChartMetric] = useState<ChartMetricKey>('PO_VOLUME');

  const metricIdsToLoad = useMemo(() => [
    'PO_VOLUME',
    'SHIPMENT_VOLUME',
    'INVENTORY_ON_HAND',
    'CONTROL_TOWER_EXCEPTIONS'
  ], []);

  const { chartData, loading: chartLoading } = useLiveChartSeries(metricIdsToLoad, 14);

  // Critical unresolved exceptions for Quick Attention list
  const criticalExceptions = useMemo(() => {
    return exceptions.filter(e => e.severity === 'Critical' || e.status !== 'Resolved').slice(0, 3);
  }, [exceptions]);

  // Metric Tab Config
  const chartTabs: { key: ChartMetricKey; label: string; stroke: string; fill: string }[] = [
    { key: 'PO_VOLUME', label: 'Orders', stroke: '#00F2FE', fill: 'rgba(0, 242, 254, 0.15)' },
    { key: 'SHIPMENT_VOLUME', label: 'Shipments', stroke: '#FF9F0A', fill: 'rgba(255, 159, 10, 0.15)' },
    { key: 'INVENTORY_ON_HAND', label: 'Inventory', stroke: '#30D158', fill: 'rgba(48, 209, 88, 0.15)' },
    { key: 'CONTROL_TOWER_EXCEPTIONS', label: 'Exceptions', stroke: '#FF453A', fill: 'rgba(255, 69, 58, 0.15)' },
  ];

  const currentTabConfig = chartTabs.find(t => t.key === selectedChartMetric) || chartTabs[0];

  // Composite Health value
  const healthScore = healthMetric?.value || 87;

  return (
    <div className="w-full max-w-full space-y-4 pb-6 select-none">
      {/* 1. TOP HERO: Supply Chain Command Center Title */}
      <div className="bg-os-surface border border-os-border rounded-2xl p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-os-accent/15 border border-os-accent/30 flex items-center justify-center text-os-accent">
              <Activity size={14} />
            </div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-os-text-muted font-bold">
              Command Center
            </span>
          </div>
          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
            isLive 
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
              : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
          }`}>
            {isLive ? 'LIVE TELEMETRY' : 'DEMO SIMULATION'}
          </span>
        </div>

        <div className="text-base font-bold text-os-text-primary mt-1">
          Supply Chain Command Center
        </div>
        <p className="text-xs text-os-text-muted mt-0.5">
          Real-time network visibility, AI orchestration & risk containment.
        </p>

        {/* 2. SYSTEM HEALTH BANNER */}
        <div className="mt-4 pt-3 border-t border-os-border flex items-baseline justify-between">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-os-text-muted">
              System Health Index
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-mono font-light text-os-text-primary tracking-tight">
                {healthScore}%
              </span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-0.5 font-medium">
                <TrendingUp size={12} /> +3.8%
              </span>
            </div>
          </div>

          <button
            onClick={() => navigateToTab('control')}
            className="flex items-center gap-1 text-xs font-mono text-os-accent hover:underline cursor-pointer min-h-[44px] px-2"
          >
            <span>Control Tower</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* 3. 2x2 COMPACT KPI GRID (Live Values from LiveMetricsEngine) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Orders Card */}
        <div 
          onClick={() => openApp('procurement')}
          className="bg-os-surface border border-os-border rounded-xl p-3 active:scale-[0.98] transition-transform cursor-pointer"
        >
          <div className="flex items-center justify-between text-os-text-muted mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Orders</span>
            <ShoppingCart size={14} className="text-cyan-400" />
          </div>
          <div className="text-lg font-mono font-bold text-os-text-primary">
            {poMetric ? formatNumber(poMetric.value) : formatNumber(purchaseOrders.length || 1284)}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-0.5 mt-0.5">
            <TrendingUp size={10} /> +8.2% vs 7d
          </div>
        </div>

        {/* Inventory Card */}
        <div 
          onClick={() => openApp('inventory')}
          className="bg-os-surface border border-os-border rounded-xl p-3 active:scale-[0.98] transition-transform cursor-pointer"
        >
          <div className="flex items-center justify-between text-os-text-muted mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Inventory</span>
            <Package size={14} className="text-emerald-400" />
          </div>
          <div className="text-lg font-mono font-bold text-os-text-primary">
            {invMetric ? formatNumber(invMetric.value) : formatNumber(inventory.reduce((a, b) => a + b.onHand, 0) || 42900)}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-0.5 mt-0.5">
            <TrendingDown size={10} className="text-emerald-400" /> -2.1% buffer
          </div>
        </div>

        {/* Shipments Card */}
        <div 
          onClick={() => openApp('shipments')}
          className="bg-os-surface border border-os-border rounded-xl p-3 active:scale-[0.98] transition-transform cursor-pointer"
        >
          <div className="flex items-center justify-between text-os-text-muted mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Shipments</span>
            <Truck size={14} className="text-amber-400" />
          </div>
          <div className="text-lg font-mono font-bold text-os-text-primary">
            {shpMetric ? formatNumber(shpMetric.value) : formatNumber(shipments.length || 327)}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-0.5 mt-0.5">
            <TrendingUp size={10} /> +4.8% active
          </div>
        </div>

        {/* Exceptions Card */}
        <div 
          onClick={() => navigateToTab('alerts')}
          className="bg-os-surface border border-os-border rounded-xl p-3 active:scale-[0.98] transition-transform cursor-pointer"
        >
          <div className="flex items-center justify-between text-os-text-muted mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Exceptions</span>
            <AlertTriangle size={14} className="text-red-400" />
          </div>
          <div className="text-lg font-mono font-bold text-red-400">
            {excMetric ? formatNumber(excMetric.value) : formatNumber(exceptions.length || 18)}
          </div>
          <div className="text-[10px] font-mono text-red-400 flex items-center gap-0.5 mt-0.5">
            <span>{exceptions.filter(e => e.severity === 'Critical').length || 3} critical</span>
          </div>
        </div>
      </div>

      {/* 3.5 ORION AI COPILOT QUICK ACTION BANNER */}
      <div 
        onClick={() => openOrionAI()}
        className="bg-gradient-to-r from-cyan-950/40 via-os-surface to-os-surface border border-cyan-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 active:scale-[0.98] transition-transform cursor-pointer shadow-sm group min-h-[44px]"
        role="button"
        aria-label="Launch ORION AI Copilot"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            <Sparkles size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-os-text-primary">ORION AI ASSISTANT</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-os-text-muted truncate mt-0.5">
              Ask questions about delayed shipments, stockouts, or suppliers...
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold shrink-0 group-hover:bg-cyan-500/20 transition-colors">
          <span>Ask AI</span>
          <ArrowRight size={12} />
        </div>
      </div>

      {/* 4. PRIMARY LIVE INTERACTIVE CHART */}
      <div className="bg-os-surface border border-os-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-os-text-muted font-semibold">
              Telemetry Velocity
            </div>
            <div className="text-sm font-bold text-os-text-primary">
              Supply Chain Activity
            </div>
          </div>

          <div className="text-[10px] font-mono text-os-text-muted">
            14D Trend
          </div>
        </div>

        {/* Metric Switcher Tabs */}
        <div className="grid grid-cols-4 gap-1 p-0.5 bg-os-surface-secondary rounded-lg border border-os-border text-[10px] font-mono">
          {chartTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedChartMetric(tab.key)}
              className={`py-1.5 px-1 rounded text-center transition-colors min-h-[36px] flex items-center justify-center ${
                selectedChartMetric === tab.key
                  ? 'bg-os-surface-active text-os-text-primary font-bold shadow-xs'
                  : 'text-os-text-muted hover:text-os-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Recharts Canvas / Empty Telemetry State */}
        {chartData.length === 0 && !chartLoading ? (
          <div className="w-full h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-os-border/60 rounded-xl bg-os-surface-secondary/40">
            <Activity size={24} className="text-os-text-muted/60 mb-1.5" />
            <span className="text-xs font-semibold text-os-text-primary">No telemetry available</span>
            <span className="text-[10px] text-os-text-muted mt-0.5">Telemetry streams will populate as operations progress</span>
          </div>
        ) : (
          <div className="w-full h-44 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="mobileHomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentTabConfig.stroke} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={currentTabConfig.stroke} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#292C2F" strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="#777873" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={{ stroke: '#292C2F' }}
                />
                <YAxis 
                  stroke="#777873" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const val = d[selectedChartMetric] || 0;
                      return (
                        <div className="bg-os-surface border border-os-border p-2 rounded-lg shadow-lg text-[10px] font-mono z-30">
                          <div className="text-os-text-muted">{d.formattedDate || d.date}</div>
                          <div className="text-os-text-primary font-bold mt-0.5">
                            {currentTabConfig.label}: {formatNumber(val)}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey={selectedChartMetric} 
                  stroke={currentTabConfig.stroke} 
                  strokeWidth={2} 
                  fill="url(#mobileHomeGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 5. URGENT ATTENTION ITEMS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-os-text-primary flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-red-400" />
            Immediate Attention ({criticalExceptions.length})
          </span>
          <button 
            onClick={() => navigateToTab('alerts')} 
            className="text-[11px] font-mono text-os-accent hover:underline min-h-[44px] flex items-center"
          >
            View All
          </button>
        </div>

        {criticalExceptions.length > 0 ? (
          <div className="space-y-2">
            {criticalExceptions.map((exc) => (
              <div
                key={exc.id}
                onClick={() => openEntityDetail({
                  type: 'exception',
                  id: exc.id,
                  title: (exc as any).title || exc.type,
                  subtitle: `Entity: ${exc.entityId || exc.id}`,
                  severity: exc.severity?.toLowerCase() as any || 'high',
                  impact: exc.estimatedImpact || 12500,
                  data: exc
                })}
                className="bg-os-surface border border-os-border hover:border-os-border-strong rounded-xl p-3 active:scale-[0.99] transition-transform cursor-pointer space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <span className="text-xs font-medium text-os-text-primary line-clamp-1">
                      {(exc as any).title || exc.type}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-red-400 font-semibold shrink-0">
                    {formatCurrency(exc.estimatedImpact || 12500, currency)}
                  </span>
                </div>

                <div className="text-[11px] text-os-text-secondary line-clamp-2">
                  {exc.description || 'Impact identified on active supply chain node.'}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-os-text-muted pt-1 border-t border-os-border/50">
                  <span>{exc.id}</span>
                  <span className="flex items-center gap-0.5 text-os-accent font-medium">
                    Inspect <ArrowUpRight size={10} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-os-surface border border-os-border rounded-xl p-4 text-center text-xs font-mono text-os-text-muted">
            No critical exceptions requiring immediate operator intervention.
          </div>
        )}
      </div>
    </div>
  );
};
