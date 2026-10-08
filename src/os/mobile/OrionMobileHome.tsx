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
  Search,
  ShoppingCart,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';

export const OrionMobileHome: React.FC = () => {
  const { navigateToTab, openApp, openOrionAI } = useMobileNavigation();
  const { exceptions, decisions } = useSupplyChain();
  const { currentUser } = useAuth();
  const environment = dbManager.getEnvironment();
  const isLive = environment === 'LIVE';

  // 1. Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const userName = currentUser?.fullName || currentUser?.username || 'Operator';
  const activeExceptionsCount = useMemo(() => (exceptions || []).filter(e => e.status !== 'Resolved').length, [exceptions]);

  // High-level recent enterprise activities (executive activity feed, NOT a raw operational dispatch table)
  const recentActivities = useMemo(() => {
    const items: Array<{ id: string; title: string; subtitle: string; time: string; icon: any; color: string }> = [
      {
        id: 'sys-act-1',
        title: 'Autonomous Policy Rebalance',
        subtitle: 'Dynamic safety buffers calibrated across primary distribution nodes',
        time: 'Just now',
        icon: CheckCircle2,
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      },
      {
        id: 'sys-act-2',
        title: 'Enterprise ERP Telemetry Synced',
        subtitle: 'Inbound PO receipts & goods issues reconciled with ledger',
        time: '12m ago',
        icon: Layers,
        color: 'text-sky-400 bg-sky-500/10 border-sky-500/30'
      },
      {
        id: 'sys-act-3',
        title: 'Security & Session Verification',
        subtitle: 'Cryptographic policy enforcement gate active for active tenant',
        time: '45m ago',
        icon: Activity,
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
      }
    ];

    if ((decisions || []).length > 0) {
      const latestDec = decisions[0];
      items[0] = {
        id: `dec-${latestDec.id}`,
        title: (latestDec as any).title || 'Autonomous Action Executed',
        subtitle: (latestDec as any).summary || 'Enterprise policy rules applied',
        time: 'Automated',
        icon: CheckCircle2,
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      };
    }

    return items;
  }, [decisions]);

  return (
    <div className="w-full max-w-full space-y-4 pb-6 select-none animate-in fade-in duration-200">
      
      {/* 1. GREETING & OS IDENTITY */}
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

        {/* 2. SYSTEM STATUS */}
        <div className="pt-2.5 border-t border-os-border flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
            <span className="text-os-text-primary font-semibold">System Operational</span>
          </div>
          <span className="text-[10px] text-os-text-muted">
            Autonomous Kernel Active
          </span>
        </div>
      </div>

      {/* 3. IMMEDIATE ACTIONS (HIGH-LEVEL MOBILE ACTIONS) */}
      <div className="bg-os-surface border border-os-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-os-text-primary">
            Quick Actions
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Action 1: Search Network */}
          <button
            onClick={() => navigateToTab('apps')}
            className="flex items-center gap-2.5 p-3 bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border hover:border-os-border-strong rounded-xl text-left transition-all active:scale-[0.98] cursor-pointer min-h-[44px]"
            aria-label="Search Enterprise Network"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Search size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-os-text-primary truncate">Search Network</div>
              <div className="text-[10px] text-os-text-muted truncate">Explore ecosystem</div>
            </div>
          </button>

          {/* Action 2: Guided Requisition */}
          <button
            onClick={() => openApp('buy-workflow')}
            className="flex items-center gap-2.5 p-3 bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border hover:border-os-border-strong rounded-xl text-left transition-all active:scale-[0.98] cursor-pointer min-h-[44px]"
            aria-label="New Purchase Requisition"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShoppingCart size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-os-text-primary truncate">New Requisition</div>
              <div className="text-[10px] text-os-text-muted truncate">Guided order wizard</div>
            </div>
          </button>

          {/* Action 3: System Status */}
          <button
            onClick={() => openApp('observability')}
            className="flex items-center gap-2.5 p-3 bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border hover:border-os-border-strong rounded-xl text-left transition-all active:scale-[0.98] cursor-pointer min-h-[44px]"
            aria-label="View System Status"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Activity size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-os-text-primary truncate">System Health</div>
              <div className="text-[10px] text-os-text-muted truncate">Diagnostics & logs</div>
            </div>
          </button>

          {/* Action 4: Ask AI */}
          <button
            onClick={() => openOrionAI()}
            className="flex items-center gap-2.5 p-3 bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border hover:border-os-border-strong rounded-xl text-left transition-all active:scale-[0.98] cursor-pointer min-h-[44px]"
            aria-label="Ask Orion AI"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Sparkles size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-os-text-primary truncate">Ask Orion AI</div>
              <div className="text-[10px] text-os-text-muted truncate">Cognitive reasoning</div>
            </div>
          </button>
        </div>
      </div>

      {/* 4. AI ENTRY POINT */}
      <div 
        onClick={() => openOrionAI()}
        className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3 active:scale-[0.98] transition-all cursor-pointer shadow-sm group"
        role="button"
        aria-label="Open Orion AI"
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

      {/* 5. HIGH-LEVEL ALERTS SUMMARY (IF ANY ACTIVE) */}
      {activeExceptionsCount > 0 && (
        <div 
          onClick={() => navigateToTab('alerts')}
          className="bg-red-500/10 border border-red-500/20 hover:border-red-500/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all"
          role="button"
          aria-label="View Active Alerts"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
              <AlertTriangle size={15} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-red-300 truncate">
                {activeExceptionsCount} Active Alert{activeExceptionsCount > 1 ? 's' : ''} Requiring Review
              </div>
              <div className="text-[10px] text-red-400/80 truncate">
                Tap to inspect in Alerts & Exceptions
              </div>
            </div>
          </div>
          <ChevronRight size={16} className="text-red-400 shrink-0" />
        </div>
      )}

      {/* 6. RECENT ACTIVITY (EXECUTIVE ACTIVITY FEED) */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-os-text-muted px-1 flex items-center gap-1.5">
          <Clock size={12} />
          Recent Activity
        </div>

        <div className="bg-os-surface border border-os-border rounded-2xl p-3 space-y-2.5">
          {recentActivities.map(act => {
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
          })}
        </div>
      </div>

      {/* 7. QUICK ACCESS NAVIGATION SHORTCUTS */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-os-text-muted px-1">
          Quick Access
        </div>
        <div className="grid grid-cols-4 gap-2">
          {/* Control Shortcut: Navigates cleanly to Control Center */}
          <button
            onClick={() => navigateToTab('control')}
            className="flex flex-col items-center justify-center p-3 bg-os-surface border border-os-border hover:border-os-accent/40 rounded-xl active:scale-95 transition-all cursor-pointer min-h-[44px]"
            aria-label="Open Command Center"
          >
            <ShieldAlert size={20} className="text-os-accent mb-1" />
            <span className="text-[10px] font-mono font-semibold text-os-text-primary">Control</span>
          </button>

          {/* AI Shortcut */}
          <button
            onClick={() => openOrionAI()}
            className="flex flex-col items-center justify-center p-3 bg-os-surface border border-os-border hover:border-cyan-500/40 rounded-xl active:scale-95 transition-all cursor-pointer min-h-[44px]"
            aria-label="Open AI Copilot"
          >
            <Sparkles size={20} className="text-cyan-400 mb-1" />
            <span className="text-[10px] font-mono font-semibold text-os-text-primary">AI</span>
          </button>

          {/* Alerts Shortcut */}
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

          {/* Apps Shortcut */}
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
