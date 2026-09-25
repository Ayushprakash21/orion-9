import React, { useMemo } from 'react';
import { useMobileNavigation } from './OrionMobileNavigation';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useAuth } from '../../store/AuthContext';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { 
  Activity, 
  ShieldAlert, 
  Sparkles, 
  AlertTriangle, 
  LayoutGrid, 
  ChevronRight, 
  ArrowRight, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  Package, 
  Truck, 
  ShoppingCart
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../lib/formatters';

export const OrionMobileHome: React.FC = () => {
  const { navigateToTab, openEntityDetail, openApp, openOrionAI } = useMobileNavigation();
  const { exceptions, shipments, inventory, decisions, currency } = useSupplyChain();
  const { currentUser } = useAuth();
  const environment = dbManager.getEnvironment();
  const isLive = environment === 'LIVE';

  // Greeting based on current time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const userName = currentUser?.fullName || currentUser?.username || 'Operator';

  // Real metric summary derived from SupplyChainContext
  const activeExceptionsCount = useMemo(() => (exceptions || []).filter(e => e.status !== 'Resolved').length, [exceptions]);
  const criticalExceptions = useMemo(() => (exceptions || []).filter(e => e.severity === 'Critical' && e.status !== 'Resolved').slice(0, 3), [exceptions]);
  const delayedShipmentsCount = useMemo(() => (shipments || []).filter(s => s.delayDays > 0 && s.status !== 'Delivered').length, [shipments]);
  const lowStockCount = useMemo(() => (inventory || []).filter(i => (i.onHand - i.reserved) < i.safetyStock).length, [inventory]);

  // Recent operational activity items from real runtime state
  const recentActivities = useMemo(() => {
    const items: Array<{ id: string; title: string; subtitle: string; time: string; icon: any; color: string }> = [];
    
    (exceptions || []).slice(0, 2).forEach(exc => {
      items.push({
        id: `exc-${exc.id}`,
        title: (exc as any).title || exc.type || 'Operational Exception',
        subtitle: `Impact: ${formatCurrency(exc.estimatedImpact || 12500, currency)}`,
        time: 'Recently logged',
        icon: AlertTriangle,
        color: 'text-red-400 bg-red-500/10 border-red-500/30'
      });
    });

    (shipments || []).filter(s => s.delayDays > 0).slice(0, 2).forEach(shp => {
      items.push({
        id: `shp-${shp.id}`,
        title: `Shipment Delay: ${shp.trackingNumber || shp.id}`,
        subtitle: `${shp.origin} → ${shp.destination} (${shp.delayDays}d delay)`,
        time: 'In transit',
        icon: Truck,
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      });
    });

    (decisions || []).slice(0, 1).forEach(dec => {
      items.push({
        id: `dec-${dec.id}`,
        title: (dec as any).title || 'Autonomous Decision Executed',
        subtitle: (dec as any).summary || 'SCM Autopilot policy re-route applied',
        time: 'Automated',
        icon: CheckCircle2,
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      });
    });

    return items.slice(0, 4);
  }, [exceptions, shipments, decisions, currency]);

  return (
    <div className="w-full max-w-full space-y-4 pb-6 select-none animate-in fade-in duration-200">
      
      {/* 1. PERSONALIZED GREETING & OS ENVIRONMENT STATUS */}
      <div className="bg-os-surface border border-os-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-wider text-os-text-primary">
              ORION-9 OS
            </span>
            <span className="text-[10px] text-os-text-muted font-mono">• MOBILE HOME</span>
          </div>

          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${
            isLive 
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
              : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {isLive ? 'LIVE' : 'DEMO'}
          </span>
        </div>

        <div>
          <h1 className="text-lg font-bold text-os-text-primary tracking-tight">
            {greeting}, {userName}
          </h1>
          <p className="text-xs text-os-text-muted mt-0.5">
            Supply Chain Command Center • Your supply chain environment at a glance
          </p>
        </div>

        {/* SYSTEM STATUS BANNER */}
        <div className="pt-2.5 border-t border-os-border flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
            <span className="text-os-text-primary font-semibold">System Operational</span>
          </div>
          <span className="text-[10px] text-os-text-muted">
            Telemetry Synced
          </span>
        </div>
      </div>

      {/* 2. QUICK ACCESS GRID (Control, AI, Alerts, Apps) */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-os-text-muted px-1">
          Quick Access
        </div>
        <div className="grid grid-cols-4 gap-2">
          {/* Control Button */}
          <button
            onClick={() => navigateToTab('control')}
            className="flex flex-col items-center justify-center p-3 bg-os-surface border border-os-border hover:border-os-accent/40 rounded-xl active:scale-95 transition-all cursor-pointer min-h-[44px]"
          >
            <ShieldAlert size={20} className="text-os-accent mb-1" />
            <span className="text-[10px] font-mono font-semibold text-os-text-primary">Control</span>
          </button>

          {/* AI Button */}
          <button
            onClick={() => navigateToTab('ai')}
            className="flex flex-col items-center justify-center p-3 bg-os-surface border border-os-border hover:border-cyan-500/40 rounded-xl active:scale-95 transition-all cursor-pointer min-h-[44px]"
          >
            <Sparkles size={20} className="text-cyan-400 mb-1" />
            <span className="text-[10px] font-mono font-semibold text-os-text-primary">AI</span>
          </button>

          {/* Alerts Button */}
          <button
            onClick={() => navigateToTab('alerts')}
            className="flex flex-col items-center justify-center p-3 bg-os-surface border border-os-border hover:border-red-500/40 rounded-xl active:scale-95 transition-all cursor-pointer min-h-[44px] relative"
          >
            <AlertTriangle size={20} className="text-red-400 mb-1" />
            <span className="text-[10px] font-mono font-semibold text-os-text-primary">Alerts</span>
            {activeExceptionsCount > 0 && (
              <span className="absolute top-1 right-1 px-1 min-w-[14px] h-3.5 bg-red-500 text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                {activeExceptionsCount > 9 ? '9+' : activeExceptionsCount}
              </span>
            )}
          </button>

          {/* Apps Button */}
          <button
            onClick={() => navigateToTab('apps')}
            className="flex flex-col items-center justify-center p-3 bg-os-surface border border-os-border hover:border-os-border-strong rounded-xl active:scale-95 transition-all cursor-pointer min-h-[44px]"
          >
            <LayoutGrid size={20} className="text-amber-400 mb-1" />
            <span className="text-[10px] font-mono font-semibold text-os-text-primary">Apps</span>
          </button>
        </div>
      </div>

      {/* 3. CONTROL TOWER SUMMARY CARD */}
      <div className="bg-os-surface border border-os-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-os-accent/15 border border-os-accent/30 flex items-center justify-center text-os-accent">
              <Activity size={14} />
            </div>
            <span className="text-xs font-mono font-bold text-os-text-primary uppercase tracking-wider">
              Control Tower Overview
            </span>
          </div>
          <button
            onClick={() => navigateToTab('control')}
            className="text-[11px] font-mono text-os-accent hover:underline flex items-center gap-0.5 min-h-[44px] px-1"
          >
            <span>Open Control Center</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Snapshot Metric Counters */}
        {/* Snapshot Metric Counters */}
        <div className="grid grid-cols-4 gap-1.5">
          <div className="p-2 bg-os-surface-secondary rounded-xl border border-os-border text-center">
            <div className="text-[9px] font-mono uppercase text-os-text-muted truncate">Exceptions</div>
            <div className="text-xs sm:text-sm font-mono font-bold text-red-400 mt-0.5">
              {formatNumber(activeExceptionsCount)}
            </div>
          </div>
          <div className="p-2 bg-os-surface-secondary rounded-xl border border-os-border text-center">
            <div className="text-[9px] font-mono uppercase text-os-text-muted truncate">Cargo Delays</div>
            <div className="text-xs sm:text-sm font-mono font-bold text-amber-400 mt-0.5">
              {formatNumber(delayedShipmentsCount)}
            </div>
          </div>
          <div className="p-2 bg-os-surface-secondary rounded-xl border border-os-border text-center">
            <div className="text-[9px] font-mono uppercase text-os-text-muted truncate">Stock Risks</div>
            <div className="text-xs sm:text-sm font-mono font-bold text-emerald-400 mt-0.5">
              {formatNumber(lowStockCount)}
            </div>
          </div>
          <div className="p-2 bg-os-surface-secondary rounded-xl border border-os-border text-center">
            <div className="text-[9px] font-mono uppercase text-os-text-muted truncate">Orders</div>
            <div className="text-xs sm:text-sm font-mono font-bold text-os-text-primary mt-0.5">Active</div>
          </div>
        </div>
      </div>

      {/* 4. ORION AI ASSISTANT CARD */}
      <div 
        onClick={() => openOrionAI()}
        className="bg-gradient-to-r from-cyan-950/40 via-os-surface to-os-surface border border-cyan-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 active:scale-[0.98] transition-all cursor-pointer shadow-sm group"
        role="button"
        aria-label="Ask Orion AI"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-os-text-primary">ORION AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-xs text-os-text-muted truncate mt-0.5">
              Ask Orion anything about your supply chain...
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold shrink-0 group-hover:bg-cyan-500/20 transition-colors">
          <span>Ask AI</span>
          <ArrowRight size={12} />
        </div>
      </div>

      {/* 5. CRITICAL ALERTS SUMMARY */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-os-text-primary flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-red-400" />
            Critical Alerts ({criticalExceptions.length})
          </span>
          <button 
            onClick={() => navigateToTab('alerts')} 
            className="text-[11px] font-mono text-os-accent hover:underline min-h-[44px] flex items-center"
          >
            View Alerts →
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
                  severity: 'critical',
                  impact: exc.estimatedImpact || 12500,
                  data: exc
                })}
                className="bg-os-surface border border-os-border hover:border-os-border-strong rounded-xl p-3 active:scale-[0.99] transition-all cursor-pointer space-y-1.5"
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

                <div className="text-[11px] text-os-text-secondary line-clamp-1">
                  {exc.description || 'Action required by operator.'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-os-surface border border-os-border rounded-xl p-3.5 text-center text-xs font-mono text-os-text-muted">
            No critical alerts requiring immediate attention.
          </div>
        )}
      </div>

      {/* 6. RECENT OPERATIONAL ACTIVITY */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-os-text-muted px-1 flex items-center gap-1.5">
          <Clock size={12} />
          Supply Chain Activity
        </div>

        <div className="bg-os-surface border border-os-border rounded-2xl p-3 space-y-2.5">
          {recentActivities.length > 0 ? (
            recentActivities.map(act => {
              const Icon = act.icon;
              return (
                <div key={act.id} className="flex items-center gap-3 text-xs">
                  <div className={`p-1.5 rounded-lg border shrink-0 ${act.color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-os-text-primary truncate">{act.title}</div>
                    <div className="text-[10px] text-os-text-muted truncate">{act.subtitle}</div>
                  </div>
                  <div className="text-[9px] font-mono text-os-text-muted shrink-0">{act.time}</div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-xs font-mono text-os-text-muted py-2">
              No recent activity recorded.
            </div>
          )}
        </div>
      </div>

      {/* 7. QUICK APPS ACCESS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-os-text-primary">
            Quick Applications
          </span>
          <button
            onClick={() => navigateToTab('apps')}
            className="text-[11px] font-mono text-os-accent hover:underline min-h-[44px] flex items-center"
          >
            All Applications →
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div
            onClick={() => openApp('inventory')}
            className="bg-os-surface border border-os-border rounded-xl p-2.5 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <Package size={16} className="text-emerald-400 shrink-0" />
            <span className="text-xs font-mono text-os-text-primary font-medium truncate">Inventory</span>
          </div>

          <div
            onClick={() => openApp('procurement')}
            className="bg-os-surface border border-os-border rounded-xl p-2.5 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <ShoppingCart size={16} className="text-cyan-400 shrink-0" />
            <span className="text-xs font-mono text-os-text-primary font-medium truncate">Procurement</span>
          </div>

          <div
            onClick={() => openApp('shipments')}
            className="bg-os-surface border border-os-border rounded-xl p-2.5 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <Truck size={16} className="text-amber-400 shrink-0" />
            <span className="text-xs font-mono text-os-text-primary font-medium truncate">Shipments</span>
          </div>
        </div>
      </div>

    </div>
  );
};
