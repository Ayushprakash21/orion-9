import React, { useState, useMemo } from 'react';
import { useMobileNavigation } from './OrionMobileNavigation';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useLiveMetric, useLiveChartSeries } from '../../core/visualization';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { 
  Activity, 
  ShieldAlert, 
  AlertTriangle, 
  Truck, 
  Package, 
  Target, 
  Building2, 
  ArrowUpRight, 
  TrendingUp, 
  TrendingDown,
  Filter
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../lib/formatters';

export const OrionMobileControlTower: React.FC = () => {
  const { openEntityDetail } = useMobileNavigation();
  const { exceptions, shipments, purchaseOrders, inventory, suppliers, currency } = useSupplyChain();
  const environment = dbManager.getEnvironment();
  const isLive = environment === 'LIVE';

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'SHIPMENTS' | 'INVENTORY' | 'SUPPLIERS' | 'PROCUREMENT'>('ALL');

  // Load live chart series
  const metricKeys = useMemo(() => [
    'PO_VOLUME',
    'INVENTORY_ON_HAND',
    'SHIPMENT_VOLUME',
    'CONTROL_TOWER_EXCEPTIONS',
    'SUPPLIER_OTIF',
    'CRITICAL_RISKS'
  ], []);

  const { chartData } = useLiveChartSeries(metricKeys, 14);

  // Derive active exception & risk cards
  const activeExceptions = useMemo(() => {
    return exceptions.filter(e => e.status !== 'Resolved');
  }, [exceptions]);

  const delayedShipments = useMemo(() => {
    return shipments.filter(s => s.delayDays > 0 && s.status !== 'Delivered');
  }, [shipments]);

  const criticalInventory = useMemo(() => {
    return inventory.filter(i => (i.onHand - i.reserved) < i.safetyStock);
  }, [inventory]);

  const atRiskSuppliers = useMemo(() => {
    return suppliers.filter(s => (s.otif || 95) < 85 || s.riskLevel === 'High');
  }, [suppliers]);

  // Filtered operational list
  const operationalItems = useMemo(() => {
    const list: Array<{
      id: string;
      category: 'SHIPMENTS' | 'INVENTORY' | 'SUPPLIERS' | 'PROCUREMENT';
      title: string;
      entity: string;
      severity: 'critical' | 'high' | 'medium';
      impact: number;
      detail: string;
      raw: any;
    }> = [];

    // Delayed Shipments
    delayedShipments.forEach(s => {
      list.push({
        id: s.id,
        category: 'SHIPMENTS',
        title: `Shipment Delayed: ${s.trackingNumber || s.id}`,
        entity: `Carrier: ${s.carrier || 'Global Express'} • Route: ${s.origin} → ${s.destination}`,
        severity: s.delayDays > 3 ? 'critical' : 'high',
        impact: s.freightCost ? s.freightCost * 2 : 25000,
        detail: `Delay: +${s.delayDays} days. Status: ${s.status}`,
        raw: s,
      });
    });

    // Critical Inventory
    criticalInventory.forEach(inv => {
      list.push({
        id: inv.id,
        category: 'INVENTORY',
        title: `Stockout Risk: ${inv.productId}`,
        entity: `Location: ${inv.warehouseId} • On Hand: ${inv.onHand} (Safety: ${inv.safetyStock})`,
        severity: inv.onHand === 0 ? 'critical' : 'high',
        impact: (inv.safetyStock - inv.onHand) * (inv.unitCost || 50),
        detail: `Buffer deficit of ${inv.safetyStock - inv.onHand} units`,
        raw: inv,
      });
    });

    // Supplier Variances
    atRiskSuppliers.forEach(sup => {
      list.push({
        id: sup.id,
        category: 'SUPPLIERS',
        title: `Supplier OTIF Below Target: ${sup.name}`,
        entity: `Country: ${sup.country} • OTIF: ${sup.otif}%`,
        severity: (sup.otif || 95) < 75 ? 'critical' : 'high',
        impact: 45000,
        detail: `Historical OTIF dropped to ${sup.otif || 80}%`,
        raw: sup,
      });
    });

    // Exceptions
    activeExceptions.forEach(exc => {
      list.push({
        id: exc.id,
        category: 'PROCUREMENT',
        title: (exc as any).title || exc.type,
        entity: `Entity ID: ${exc.entityId || exc.id}`,
        severity: exc.severity?.toLowerCase() === 'critical' ? 'critical' : 'medium',
        impact: exc.estimatedImpact || 15000,
        detail: exc.description || 'Action required by SCM operator',
        raw: exc,
      });
    });

    if (activeFilter === 'ALL') return list;
    return list.filter(i => i.category === activeFilter);
  }, [delayedShipments, criticalInventory, atRiskSuppliers, activeExceptions, activeFilter]);

  // Risk Distribution Data
  const riskDistData = [
    { name: 'Logistics', value: delayedShipments.length * 15000, color: '#FF9F0A' },
    { name: 'Inventory', value: criticalInventory.length * 22000, color: '#FF453A' },
    { name: 'Supplier', value: atRiskSuppliers.length * 18000, color: '#0A84FF' },
    { name: 'Procurement', value: purchaseOrders.filter(p => p.status === 'Delayed').length * 12000, color: '#BF5AF2' },
  ];

  return (
    <div className="w-full max-w-full space-y-4 pb-8 select-none">
      {/* 1. CONTROL TOWER HEADER */}
      <div className="bg-os-surface border border-os-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-os-accent" />
            <span className="text-xs font-mono uppercase tracking-wider text-os-text-primary font-bold">
              Orion Control Tower
            </span>
          </div>
          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
            isLive 
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
              : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
          }`}>
            {isLive ? 'LIVE CONTROL' : 'DEMO SANDBOX'}
          </span>
        </div>
        <p className="text-xs text-os-text-muted mt-0.5">
          End-to-end exception telemetry, bottleneck isolation, and live risk containment.
        </p>

        {/* Quick KPI summary row */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-os-border text-center">
          <div className="p-1.5 bg-os-surface-secondary rounded-lg border border-os-border">
            <div className="text-[9px] font-mono uppercase text-os-text-muted">Risks</div>
            <div className="text-sm font-mono font-bold text-red-400">{operationalItems.length}</div>
          </div>
          <div className="p-1.5 bg-os-surface-secondary rounded-lg border border-os-border">
            <div className="text-[9px] font-mono uppercase text-os-text-muted">Delayed Cargo</div>
            <div className="text-sm font-mono font-bold text-amber-400">{delayedShipments.length}</div>
          </div>
          <div className="p-1.5 bg-os-surface-secondary rounded-lg border border-os-border">
            <div className="text-[9px] font-mono uppercase text-os-text-muted">Stockouts</div>
            <div className="text-sm font-mono font-bold text-emerald-400">{criticalInventory.length}</div>
          </div>
        </div>
      </div>

      {/* 2. CATEGORY FILTER CHIPS */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs font-mono">
        {(['ALL', 'SHIPMENTS', 'INVENTORY', 'SUPPLIERS', 'PROCUREMENT'] as const).map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors min-h-[44px] flex items-center ${
              activeFilter === f
                ? 'bg-os-accent/15 border-os-accent text-os-accent font-bold'
                : 'bg-os-surface border-os-border text-os-text-muted hover:text-os-text-primary'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 3. OPERATIONAL RISK CARDS STREAM */}
      <div className="space-y-2">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-os-text-primary px-1">
          Active Disruption Telemetry ({operationalItems.length})
        </div>

        {operationalItems.length > 0 ? (
          <div className="space-y-2.5">
            {operationalItems.map(item => (
              <div
                key={item.id}
                onClick={() => openEntityDetail({
                  type: item.category.toLowerCase() as any,
                  id: item.id,
                  title: item.title,
                  subtitle: item.entity,
                  severity: item.severity,
                  impact: item.impact,
                  data: item.raw
                })}
                className="bg-os-surface border border-os-border hover:border-os-border-strong rounded-xl p-3.5 space-y-2 active:scale-[0.99] transition-all cursor-pointer shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      item.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                    }`} />
                    <span className="text-xs font-bold text-os-text-primary line-clamp-1">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-red-400 shrink-0">
                    {formatCurrency(item.impact, currency)}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-os-text-secondary line-clamp-1">
                  {item.entity}
                </div>

                <div className="text-xs text-os-text-muted line-clamp-2">
                  {item.detail}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-os-text-muted pt-2 border-t border-os-border/60">
                  <span className="uppercase">{item.category}</span>
                  <span className="flex items-center gap-0.5 text-os-accent font-medium">
                    Inspect Resolution <ArrowUpRight size={10} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-os-surface border border-os-border rounded-xl p-6 text-center text-xs font-mono text-os-text-muted">
            No active risks in selected filter.
          </div>
        )}
      </div>

      {/* 4. VERTICALLY STACKED MOBILE CONTROL TOWER CHARTS */}
      <div className="space-y-4 pt-2">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-os-text-primary px-1">
          Telemetry Trajectories
        </div>

        {/* Chart 1: Order Volume Trend */}
        <div className="bg-os-surface border border-os-border rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-os-text-primary flex items-center gap-1.5">
              <Target size={14} className="text-cyan-400" />
              1. Purchase Order Volume (14D)
            </span>
            <span className="text-[10px] font-mono text-os-text-muted">Units</span>
          </div>
          <div className="w-full h-36 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#292C2F" strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="date" stroke="#777873" fontSize={9} tickLine={false} />
                <YAxis stroke="#777873" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="PO_VOLUME" stroke="#00F2FE" fill="rgba(0,242,254,0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Inventory Level Trajectory */}
        <div className="bg-os-surface border border-os-border rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-os-text-primary flex items-center gap-1.5">
              <Package size={14} className="text-emerald-400" />
              2. Total Inventory On-Hand (14D)
            </span>
            <span className="text-[10px] font-mono text-os-text-muted">Units</span>
          </div>
          <div className="w-full h-36 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#292C2F" strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="date" stroke="#777873" fontSize={9} tickLine={false} />
                <YAxis stroke="#777873" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="INVENTORY_ON_HAND" stroke="#30D158" fill="rgba(48,209,88,0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Shipment Velocity */}
        <div className="bg-os-surface border border-os-border rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-os-text-primary flex items-center gap-1.5">
              <Truck size={14} className="text-amber-400" />
              3. Shipment Velocity & Deliveries
            </span>
            <span className="text-[10px] font-mono text-os-text-muted">Active</span>
          </div>
          <div className="w-full h-36 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#292C2F" strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="date" stroke="#777873" fontSize={9} tickLine={false} />
                <YAxis stroke="#777873" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="SHIPMENT_VOLUME" stroke="#FF9F0A" fill="rgba(255,159,10,0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Exception Trend */}
        <div className="bg-os-surface border border-os-border rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-os-text-primary flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-red-400" />
              4. Exception Velocity & Escalation
            </span>
            <span className="text-[10px] font-mono text-os-text-muted">Count</span>
          </div>
          <div className="w-full h-36 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#292C2F" strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="date" stroke="#777873" fontSize={9} tickLine={false} />
                <YAxis stroke="#777873" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="CONTROL_TOWER_EXCEPTIONS" stroke="#FF453A" fill="rgba(255,69,58,0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Risk Distribution Bar */}
        <div className="bg-os-surface border border-os-border rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-os-text-primary">
              5. Capital Risk Distribution by Domain
            </span>
            <span className="text-[10px] font-mono text-os-text-muted">USD</span>
          </div>
          <div className="w-full h-40 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#292C2F" strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" stroke="#777873" fontSize={9} tickLine={false} />
                <YAxis stroke="#777873" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {riskDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
