import React, { useMemo } from 'react';
import { useMobileNavigation } from './OrionMobileNavigation';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useAuth } from '../../store/AuthContext';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { 
  ShieldAlert, 
  Sparkles, 
  AlertTriangle, 
  LayoutGrid, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Package, 
  Truck, 
  ShoppingCart,
  Search,
  FileQuestion,
  Layers
} from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';

export const OrionMobileHome: React.FC = () => {
  const { navigateToTab, openApp, openOrionAI } = useMobileNavigation();
  const { exceptions, shipments, decisions, currency } = useSupplyChain();
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
  const activeExceptionsCount = useMemo(() => (exceptions || []).filter(e => e.status !== 'Resolved').length, [exceptions]);

  // Recent operational activity feed (compact activity feed, NOT a dashboard)
  const recentActivities = useMemo(() => {
    const items: Array<{ id: string; title: string; subtitle: string; time: string; icon: any; color: string }> = [];
    
    (exceptions || []).slice(0, 2).forEach(exc => {
      items.push({
        id: `exc-${exc.id}`,
        title: (exc as any).title || exc.type || 'Operational Issue',
        subtitle: `Impact: ${formatCurrency(exc.estimatedImpact || 12500, currency)}`,
        time: 'Logged recently',
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
        title: (dec as any).title || 'Autonomous Policy Applied',
        subtitle: (dec as any).summary || 'SCM Autopilot policy re-route applied',
        time: 'Automated',
        icon: CheckCircle2,
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      });
    });

    return items.slice(0, 3);
  }, [exceptions, shipments, decisions, currency]);

  return (
    <div className="w-full max-w-full space-y-4 pb-6 select-none animate-in fade-in duration-200">
      
      {/* 1. OS LANDING HEADER & ENVIRONMENT STATUS */}
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
            Enterprise Supply Chain Operating System
          </p>
        </div>

        {/* System Operational Banner */}
        <div className="pt-2.5 border-t border-os-border flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
            <span className="text-os-text-primary font-semibold">System Operational</span>
          </div>
          <span className="text-[10px] text-os-text-muted">
            Live Edge Connected
          </span>
        </div>
      </div>

      {/* 2. PRIMARY ACTION: WHAT DO YOU WANT TO DO? */}
      <div className="bg-os-surface border border-os-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-os-text-primary">
            What do you want to do?
          </span>
        </div>

        {/* Primary Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => openApp('inventory')}
            className="flex items-center gap-2.5 p-3 bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border hover:border-os-border-strong rounded-xl text-left transition-all active:scale-[0.98] cursor-pointer min-h-[44px]"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Package size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-os-text-primary truncate">Check Inventory</div>
              <div className="text-[10px] text-os-text-muted truncate">Stock & ATP</div>
            </div>
          </button>

          <button
            onClick={() => openApp('shipments')}
            className="flex items-center gap-2.5 p-3 bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border hover:border-os-border-strong rounded-xl text-left transition-all active:scale-[0.98] cursor-pointer min-h-[44px]"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Truck size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-os-text-primary truncate">Track Shipment</div>
              <div className="text-[10px] text-os-text-muted truncate">Cargo in transit</div>
            </div>
          </button>

          <button
            onClick={() => openApp('procurement')}
            className="flex items-center gap-2.5 p-3 bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border hover:border-os-border-strong rounded-xl text-left transition-all active:scale-[0.98] cursor-pointer min-h-[44px]"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <ShoppingCart size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-os-text-primary truncate">Check Order</div>
              <div className="text-[10px] text-os-text-muted truncate">POs & requisitions</div>
            </div>
          </button>

          <button
            onClick={() => navigateToTab('alerts')}
            className="flex items-center gap-2.5 p-3 bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border hover:border-os-border-strong rounded-xl text-left transition-all active:scale-[0.98] cursor-pointer min-h-[44px]"
          >
            <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <FileQuestion size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-os-text-primary truncate">Report Issue</div>
              <div className="text-[10px] text-os-text-muted truncate">Exceptions & risks</div>
            </div>
          </button>
        </div>

        {/* Guided Buy Action Wizard Entry */}
        <button
          onClick={() => openApp('buy-workflow')}
          className="w-full p-3 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl flex items-center justify-between transition-all cursor-pointer group active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <ShoppingCart size={16} />
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                Buy Something
                <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-normal">Guided Wizard</span>
              </div>
              <div className="text-[10px] text-slate-400">Step-by-step requisition, sourcing & order creation</div>
            </div>
          </div>
          <ArrowRight size={14} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* 3. QUICK ACCESS DESTINATIONS */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-os-text-muted px-1">
          Quick Access
        </div>
        <div className="grid grid-cols-4 gap-2">
          {/* Control Destination */}
          <button
            onClick={() => navigateToTab('control')}
            className="flex flex-col items-center justify-center p-3 bg-os-surface border border-os-border hover:border-os-accent/40 rounded-xl active:scale-95 transition-all cursor-pointer min-h-[44px]"
            aria-label="Open Command Center"
          >
            <ShieldAlert size={20} className="text-os-accent mb-1" />
            <span className="text-[10px] font-mono font-semibold text-os-text-primary">Control</span>
          </button>

          {/* AI Destination */}
          <button
            onClick={() => openOrionAI()}
            className="flex flex-col items-center justify-center p-3 bg-os-surface border border-os-border hover:border-cyan-500/40 rounded-xl active:scale-95 transition-all cursor-pointer min-h-[44px]"
            aria-label="Open AI Copilot"
          >
            <Sparkles size={20} className="text-cyan-400 mb-1" />
            <span className="text-[10px] font-mono font-semibold text-os-text-primary">AI</span>
          </button>

          {/* Alerts Destination */}
          <button
            onClick={() => navigateToTab('alerts')}
            className="flex flex-col items-center justify-center p-3 bg-os-surface border border-os-border hover:border-red-500/40 rounded-xl active:scale-95 transition-all cursor-pointer min-h-[44px] relative"
            aria-label="Open Alerts"
          >
            <AlertTriangle size={20} className="text-red-400 mb-1" />
            <span className="text-[10px] font-mono font-semibold text-os-text-primary">Alerts</span>
            {activeExceptionsCount > 0 && (
              <span className="absolute top-1 right-1 px-1 min-w-[14px] h-3.5 bg-red-500 text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                {activeExceptionsCount > 9 ? '9+' : activeExceptionsCount}
              </span>
            )}
          </button>

          {/* Apps Destination */}
          <button
            onClick={() => navigateToTab('apps')}
            className="flex flex-col items-center justify-center p-3 bg-os-surface border border-os-border hover:border-os-border-strong rounded-xl active:scale-95 transition-all cursor-pointer min-h-[44px]"
            aria-label="Browse Applications"
          >
            <LayoutGrid size={20} className="text-amber-400 mb-1" />
            <span className="text-[10px] font-mono font-semibold text-os-text-primary">Apps</span>
          </button>
        </div>
      </div>

      {/* 4. COMPACT ORION AI ASSISTANT ENTRY */}
      <div 
        onClick={() => openOrionAI()}
        className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3 active:scale-[0.98] transition-all cursor-pointer shadow-sm group"
        role="button"
        aria-label="Ask Orion AI"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-os-text-primary shrink-0">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-os-text-primary">ORION AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <p className="text-xs text-os-text-muted truncate mt-0.5">
              Ask ORION about your supply chain
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium shrink-0 group-hover:bg-sky-500/20 transition-colors">
          <span>Ask AI</span>
          <ArrowRight size={12} />
        </div>
      </div>

      {/* 5. RECENT OPERATIONAL ACTIVITY FEED (COMPACT) */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-os-text-muted px-1 flex items-center gap-1.5">
          <Clock size={12} />
          Recent Activity
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

    </div>
  );
};
