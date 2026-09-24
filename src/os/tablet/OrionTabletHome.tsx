/**
 * ORION-9 TABLET COMMAND CENTER
 * Optimized 2-column & 4-grid responsive telemetry command center for tablet screens.
 */

import React, { useState, useMemo } from 'react';
import { useTabletNavigation } from './OrionTabletNavigation';
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
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../lib/formatters';

type ChartMetricKey = 'PO_VOLUME' | 'SHIPMENT_VOLUME' | 'INVENTORY_ON_HAND' | 'CONTROL_TOWER_EXCEPTIONS';

export const OrionTabletHome: React.FC = () => {
  const { navigateToTab, openEntityDetail, openApp, openOrionAI } = useTabletNavigation();
  const { exceptions, shipments, purchaseOrders, inventory, currency } = useSupplyChain();
  const environment = dbManager.getEnvironment();
  const isLive = environment === 'LIVE';

  // Live Metrics
  const { metric: poMetric } = useLiveMetric('PO_VOLUME');
  const { metric: invMetric } = useLiveMetric('INVENTORY_ON_HAND');
  const { metric: shpMetric } = useLiveMetric('SHIPMENT_VELOCITY');
  const { metric: excMetric } = useLiveMetric('CONTROL_TOWER_EXCEPTIONS');
  const { metric: healthMetric } = useLiveMetric('NETWORK_HEALTH_INDEX');

  // Chart Metric Selection
  const [activeChartMetric, setActiveChartMetric] = useState<ChartMetricKey>('PO_VOLUME');
  const metricIdsToLoad = useMemo(() => [
    'PO_VOLUME',
    'SHIPMENT_VOLUME',
    'INVENTORY_ON_HAND',
    'CONTROL_TOWER_EXCEPTIONS'
  ], []);

  const { chartData } = useLiveChartSeries(metricIdsToLoad, 14);

  const immediateExceptions = useMemo(() => {
    return exceptions.filter(e => e.status !== 'Resolved' && e.status !== 'Dismissed').slice(0, 4);
  }, [exceptions]);

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-6">
      {/* 1. TOP HEADER & SYSTEM HEALTH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-os-surface border border-os-border rounded-2xl p-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-os-text-primary tracking-tight">
              Supply Chain Command Center
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              TABLET OS
            </span>
          </div>
          <p className="text-xs text-os-text-muted mt-0.5">
            Real-time network visibility, AI orchestration & risk containment.
          </p>
        </div>

        <div 
          onClick={() => navigateToTab('control')}
          className="flex items-center gap-3 bg-os-surface-secondary border border-os-border hover:border-cyan-500/40 rounded-xl px-4 py-2 cursor-pointer active:scale-98 transition-all"
        >
          <div>
            <div className="text-[10px] font-mono uppercase text-os-text-muted">
              System Health Index
            </div>
            <div className="text-xl font-bold font-mono text-os-text-primary flex items-center gap-1.5">
              <span>{healthMetric?.value || 87}%</span>
              <span className="text-xs font-mono text-emerald-400 flex items-center font-normal">
                <TrendingUp size={12} /> +3.8%
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="text-cyan-400" />
        </div>
      </div>

      {/* 2. 4-GRID KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Orders Card */}
        <div 
          onClick={() => openApp('procurement')}
          className="bg-os-surface border border-os-border hover:border-cyan-500/40 rounded-2xl p-3.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between min-h-[92px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-os-text-muted font-medium">Orders</span>
            <ShoppingCart size={15} className="text-cyan-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-os-text-primary">
              {formatNumber(poMetric?.value || purchaseOrders.length || 142)}
            </div>
            <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-0.5 mt-0.5">
              <TrendingUp size={10} />
              <span>+8.2% vs 7d</span>
            </div>
          </div>
        </div>

        {/* Inventory Card */}
        <div 
          onClick={() => openApp('inventory')}
          className="bg-os-surface border border-os-border hover:border-cyan-500/40 rounded-2xl p-3.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between min-h-[92px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-os-text-muted font-medium">Inventory</span>
            <Package size={15} className="text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-os-text-primary">
              {formatNumber(invMetric?.value || 130510)}
            </div>
            <div className="text-[10px] font-mono text-amber-400 flex items-center gap-0.5 mt-0.5">
              <TrendingDown size={10} />
              <span>-2.1% buffer</span>
            </div>
          </div>
        </div>

        {/* Shipments Card */}
        <div 
          onClick={() => openApp('shipments')}
          className="bg-os-surface border border-os-border hover:border-cyan-500/40 rounded-2xl p-3.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between min-h-[92px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-os-text-muted font-medium">Shipments</span>
            <Truck size={15} className="text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-os-text-primary">
              {formatNumber(shpMetric?.value || shipments.length || 67)}
            </div>
            <div className="text-[10px] font-mono text-cyan-400 flex items-center gap-0.5 mt-0.5">
              <Activity size={10} />
              <span>{shipments.filter(s => s.status === 'In Transit').length || 42} active</span>
            </div>
          </div>
        </div>

        {/* Exceptions Card */}
        <div 
          onClick={() => navigateToTab('alerts')}
          className="bg-os-surface border border-os-border hover:border-cyan-500/40 rounded-2xl p-3.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between min-h-[92px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-os-text-muted font-medium">Exceptions</span>
            <AlertTriangle size={15} className="text-red-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-red-400">
              {formatNumber(excMetric?.value || exceptions.length || 35)}
            </div>
            <div className="text-[10px] font-mono text-red-400 flex items-center gap-0.5 mt-0.5">
              <span>{exceptions.filter(e => e.severity === 'Critical').length || 16} critical</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ORION AI ASSISTANT QUICK BANNER */}
      <div 
        onClick={() => openOrionAI()}
        className="bg-gradient-to-r from-cyan-950/40 via-os-surface to-os-surface border border-cyan-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 active:scale-[0.99] transition-transform cursor-pointer shadow-sm group"
        role="button"
        aria-label="Launch ORION AI"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-os-text-primary tracking-wide">
                ORION AI ASSISTANT
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                LIVE
              </span>
            </div>
            <p className="text-xs text-os-text-muted truncate mt-0.5">
              Ask questions about inventory risks, delayed purchase orders, or supplier OTIF...
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold shrink-0 group-hover:bg-cyan-500/20 transition-colors">
          <span>Ask Orion AI</span>
          <ArrowRight size={14} />
        </div>
      </div>

      {/* 4. PRIMARY TELEMETRY CHART */}
      <div className="bg-os-surface border border-os-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-os-text-muted font-semibold">
              Telemetry Velocity
            </div>
            <div className="text-sm font-bold text-os-text-primary">
              Supply Chain Network Activity
            </div>
          </div>

          {/* Metric Selector Pills */}
          <div className="flex items-center gap-1 bg-os-surface-secondary p-1 rounded-xl border border-os-border overflow-x-auto no-scrollbar">
            {(['PO_VOLUME', 'SHIPMENT_VOLUME', 'INVENTORY_ON_HAND', 'CONTROL_TOWER_EXCEPTIONS'] as ChartMetricKey[]).map(key => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveChartMetric(key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all whitespace-nowrap cursor-pointer ${
                  activeChartMetric === key
                    ? 'bg-os-surface text-cyan-400 font-bold shadow-xs border border-os-border'
                    : 'text-os-text-muted hover:text-os-text-primary'
                }`}
              >
                {key === 'PO_VOLUME' ? 'Orders' : key === 'SHIPMENT_VOLUME' ? 'Shipments' : key === 'INVENTORY_ON_HAND' ? 'Inventory' : 'Exceptions'}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Surface */}
        <div className="h-[220px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tabletChartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#22283a" vertical={false} />
              <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0c101c', borderColor: '#22283a', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#06b6d4' }}
              />
              <Area type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#tabletChartGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. IMMEDIATE ATTENTION EXCEPTIONS */}
      <div className="bg-os-surface border border-os-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-os-text-primary">
              Immediate Attention ({immediateExceptions.length})
            </span>
          </div>
          <button 
            type="button"
            onClick={() => navigateToTab('alerts')}
            className="text-xs font-mono text-cyan-400 hover:underline cursor-pointer"
          >
            View All Alerts
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {immediateExceptions.map(exc => (
            <div 
              key={exc.id}
              onClick={() => openEntityDetail({ type: 'exception', id: exc.id, data: exc })}
              className="bg-os-surface-secondary/70 hover:bg-os-surface-secondary border border-os-border/70 hover:border-cyan-500/30 rounded-xl p-3 flex flex-col justify-between gap-2 active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${exc.severity === 'Critical' ? 'bg-red-400' : 'bg-amber-400'}`} />
                    <span className="text-xs font-bold text-os-text-primary truncate">{exc.type}</span>
                  </div>
                  <p className="text-[11px] text-os-text-muted line-clamp-2 mt-1">{exc.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-red-400">
                    {formatCurrency(exc.estimatedImpact || 0, currency)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-os-border/40 text-[10px] font-mono text-os-text-muted">
                <span>{exc.entityId}</span>
                <span className="text-cyan-400 font-semibold flex items-center gap-0.5">
                  Inspect <ChevronRight size={10} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
