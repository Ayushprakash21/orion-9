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
  Package,
  Truck,
  ShoppingCart,
  Search,
  Layers
} from 'lucide-react';


export const OrionMobileHome: React.FC = () => {
  const { navigateToTab, openApp, openOrionAI } = useMobileNavigation();
  const { exceptions } = useSupplyChain();
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

  // Quick Launch active shortcuts count (optional for UI badge)
  const activeExceptionsCount = useMemo(() => (exceptions || []).filter(e => e.status !== 'Resolved').length, [exceptions]);

  return (
    <div className="w-full max-w-full space-y-4 pb-6 select-none animate-in fade-in duration-200">
      {/* 1. OS LANDING HEADER */}
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
      </div>

      {/* 2. COMMAND / SEARCH ENTRY */}
      <button
        onClick={() => openApp('search')}
        className="flex items-center w-full p-3 bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border rounded-xl transition-colors"
        aria-label="Search or run a command"
      >
        <Search size={16} className="text-os-text-muted mr-2" />
        <span className="text-sm text-os-text-muted">Search Orion or run a command</span>
      </button>

      {/* 3. QUICK LAUNCH */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-os-text-muted px-1">
          Quick Launch
        </div>
        <div className="grid grid-cols-2 gap-2">
          {/* Inventory */}
          <button
            onClick={() => openApp('inventory')}
            className="flex items-center gap-2.5 p-3 bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border rounded-xl text-left transition-all active:scale-[0.98] cursor-pointer min-h-[44px]"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Package size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-os-text-primary truncate">Inventory</div>
            </div>
          </button>
          {/* Shipments */}
          <button
            onClick={() => openApp('shipments')}
            className="flex items-center gap-2.5 p-3 bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border rounded-xl text-left transition-all active:scale-[0.98] cursor-pointer min-h-[44px]"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Truck size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-os-text-primary truncate">Shipments</div>
            </div>
          </button>
          {/* Procurement */}
          <button
            onClick={() => openApp('procurement')}
            className="flex items-center gap-2.5 p-3 bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border rounded-xl text-left transition-all active:scale-[0.98] cursor-pointer min-h-[44px]"
          >
            <div className="w-8 h-8 rounded-lg bg-os-surface border border-os-border flex items-center justify-center text-os-text-primary shrink-0">
              <ShoppingCart size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-os-text-primary truncate">Procurement</div>
            </div>
          </button>
          {/* Suppliers */}
          <button
            onClick={() => openApp('suppliers')}
            className="flex items-center gap-2.5 p-3 bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border rounded-xl text-left transition-all active:scale-[0.98] cursor-pointer min-h-[44px]"
          >
            <div className="w-8 h-8 rounded-lg bg-os-surface border border-os-border flex items-center justify-center text-os-text-primary shrink-0">
              <Layers size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-os-text-primary truncate">Suppliers</div>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Favorites / Navigation shortcuts row */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-os-text-muted px-1">
          Favorites
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
            className="flex flex-col items-center justify-center p-3 bg-os-surface border border-os-border hover:border-os-accent/40 rounded-xl active:scale-95 transition-all cursor-pointer min-h-[44px]"
            aria-label="Open AI Copilot"
          >
            <Sparkles size={20} className="text-os-accent mb-1" />
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
    </div>
  );
};
