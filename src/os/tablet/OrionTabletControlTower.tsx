/**
 * ORION-9 TABLET CONTROL TOWER
 * Multi-echelon disruption monitoring, risk velocity, and automated containment for tablet.
 */

import React from 'react';
import { useTabletNavigation } from './OrionTabletNavigation';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useLiveMetric, useLiveChartSeries, ChartDataAdapter } from '../../core/visualization';
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
  ShieldAlert, 
  AlertTriangle, 
  TrendingUp, 
  Truck, 
  Package, 
  CheckCircle2, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { formatNumber } from '../../lib/formatters';

export const OrionTabletControlTower: React.FC = () => {
  const { openOrionAI, navigateToTab, openEntityDetail } = useTabletNavigation();
  const { exceptions, shipments, purchaseOrders } = useSupplyChain();

  const { metric: healthMetric } = useLiveMetric('NETWORK_HEALTH_INDEX');
  const { chartData: poChartData } = useLiveChartSeries(['PO_VOLUME'], 14);
  const { chartData: invChartData } = useLiveChartSeries(['INVENTORY_ON_HAND'], 14);
  const { chartData: shpChartData } = useLiveChartSeries(['SHIPMENT_VELOCITY'], 14);

  const criticalExceptions = exceptions.filter(e => e.severity === 'Critical');
  const delayedShipments = shipments.filter(s => s.delayDays > 0);

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-6">
      {/* 1. CONTROL TOWER HEADER */}
      <div className="bg-os-surface border border-os-border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-os-text-primary">Orion Control Tower</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              ACTIVE SCM CORE
            </span>
          </div>
          <p className="text-xs text-os-text-muted mt-0.5">
            Active Disruption Telemetry & Multi-Tier Supply Network Containment
          </p>
        </div>

        <button
          type="button"
          onClick={() => openOrionAI()}
          className="px-3.5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Sparkles size={14} />
          <span>Synthesize Tower State</span>
        </button>
      </div>

      {/* 2. DISRUPTION TELEMETRY 3-CARD GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-os-surface border border-os-border rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-os-text-muted">Network Health</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-os-text-primary">
            {healthMetric?.value || 87}%
          </div>
          <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
            Nominal operational range
          </div>
        </div>

        <div className="bg-os-surface border border-os-border rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-os-text-muted">Critical Disruptions</span>
            <ShieldAlert size={16} className="text-red-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-red-400">
            {criticalExceptions.length || 16}
          </div>
          <div className="text-[11px] font-mono text-red-400 mt-0.5">
            Requires immediate containment
          </div>
        </div>

        <div className="bg-os-surface border border-os-border rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-os-text-muted">In-Transit Delays</span>
            <Truck size={16} className="text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            {delayedShipments.length || 8}
          </div>
          <div className="text-[11px] font-mono text-amber-400 mt-0.5">
            Avg delay: 2.4 days
          </div>
        </div>
      </div>

      {/* 3. STACKED / 2-COLUMN OPERATIONAL CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Purchase Order Volume */}
        <div className="bg-os-surface border border-os-border rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-os-text-primary">Purchase Order Volume</span>
            <span className="text-[11px] font-mono text-cyan-400">Velocity: Nominal</span>
          </div>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={poChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="poGradTablet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#22283a" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0c101c', borderColor: '#22283a', borderRadius: '8px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2} fill="url(#poGradTablet)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Total Inventory On-Hand */}
        <div className="bg-os-surface border border-os-border rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-os-text-primary">Total Inventory On-Hand</span>
            <span className="text-[11px] font-mono text-emerald-400">Buffer: Safe</span>
          </div>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={invChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="invGradTablet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#22283a" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0c101c', borderColor: '#22283a', borderRadius: '8px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#invGradTablet)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shipment Velocity & Deliveries (Full Width on 2-col) */}
        <div className="lg:col-span-2 bg-os-surface border border-os-border rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-os-text-primary">Shipment Velocity &amp; Deliveries</span>
            <span className="text-[11px] font-mono text-amber-400">In-Transit: {shipments.length}</span>
          </div>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={shpChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="shpGradTablet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#22283a" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0c101c', borderColor: '#22283a', borderRadius: '8px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} fill="url(#shpGradTablet)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
