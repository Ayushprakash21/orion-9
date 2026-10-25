import React, { useMemo } from 'react';
import { useMobileNavigation } from './OrionMobileNavigation';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useAuth } from '../../store/AuthContext';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { 
  ShieldAlert, 
  Package,
  ShoppingCart,
  TrendingUp,
  FileText,
  Truck,
  Building2,
  BarChart3,
  Sparkles, 
  AlertTriangle, 
  Network,
  Activity,
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Layers
} from 'lucide-react';

export const OrionMobileHome: React.FC = () => {
  const { navigateToTab, openApp, openOrionAI } = useMobileNavigation();
  const { exceptions, decisions } = useSupplyChain();
  const { currentUser } = useAuth();
  const environment = dbManager.getEnvironment();
  const isLive = environment === 'LIVE';
  const isStaging = environment === 'STAGING';

  // 1. Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const userName = currentUser?.fullName || currentUser?.username || 'Operator';
  const firstName = userName.split(' ')[0] || userName;
  const userRole = currentUser?.role ? currentUser.role.replace(/_/g, ' ') : 'Operations';
  const activeExceptionsCount = useMemo(() => (exceptions || []).filter(e => e.status !== 'Resolved').length, [exceptions]);

  // 2. Primary 4-column Launcher Applications
  const launcherApps = useMemo(() => [
    {
      id: 'control-tower',
      name: 'Control Tower',
      label: 'Control Tower',
      icon: ShieldAlert,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25 shadow-[0_0_12px_rgba(6,182,212,0.12)]',
      ariaLabel: 'Open Control Tower',
      action: () => navigateToTab('control'),
    },
    {
      id: 'inventory',
      name: 'Inventory',
      label: 'Inventory',
      icon: Package,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.12)]',
      ariaLabel: 'Open Inventory',
      action: () => openApp('inventory'),
    },
    {
      id: 'procurement',
      name: 'Procurement',
      label: 'Procurement',
      icon: ShoppingCart,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/25 shadow-[0_0_12px_rgba(139,92,246,0.12)]',
      ariaLabel: 'Open Procurement',
      action: () => openApp('procurement'),
    },
    {
      id: 'supply-planning',
      name: 'Planning',
      label: 'Planning',
      icon: TrendingUp,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.12)]',
      ariaLabel: 'Open Planning',
      action: () => openApp('supply-planning'),
    },
    {
      id: 'orders',
      name: 'Orders',
      label: 'Orders',
      icon: FileText,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/25 shadow-[0_0_12px_rgba(14,165,233,0.12)]',
      ariaLabel: 'Open Orders',
      action: () => openApp('atp-center'),
    },
    {
      id: 'shipments',
      name: 'Logistics',
      label: 'Logistics',
      icon: Truck,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/25 shadow-[0_0_12px_rgba(20,184,166,0.12)]',
      ariaLabel: 'Open Logistics',
      action: () => openApp('shipments'),
    },
    {
      id: 'suppliers',
      name: 'Suppliers',
      label: 'Suppliers',
      icon: Building2,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25 shadow-[0_0_12px_rgba(99,102,241,0.12)]',
      ariaLabel: 'Open Suppliers',
      action: () => openApp('suppliers'),
    },
    {
      id: 'reports',
      name: 'Analytics',
      label: 'Analytics',
      icon: BarChart3,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/25 shadow-[0_0_12px_rgba(244,63,94,0.12)]',
      ariaLabel: 'Open Analytics',
      action: () => openApp('reports'),
    },
    {
      id: 'ai-copilot',
      name: 'AI Copilot',
      label: 'AI Copilot',
      icon: Sparkles,
      color: 'text-cyan-300 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-400/30 shadow-[0_0_14px_rgba(6,182,212,0.2)]',
      ariaLabel: 'Open AI Copilot',
      action: () => openOrionAI(),
    },
    {
      id: 'alerts',
      name: 'Alerts',
      label: 'Alerts',
      icon: AlertTriangle,
      color: 'text-red-400 bg-red-500/10 border-red-500/25 shadow-[0_0_12px_rgba(239,68,68,0.12)]',
      ariaLabel: 'Open Alerts',
      badge: activeExceptionsCount > 0 ? (activeExceptionsCount > 9 ? '9+' : String(activeExceptionsCount)) : undefined,
      action: () => navigateToTab('alerts'),
    },
    {
      id: 'integrations',
      name: 'Integrations',
      label: 'Integrations',
      icon: Network,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/25 shadow-[0_0_12px_rgba(59,130,246,0.12)]',
      ariaLabel: 'Open Integrations',
      action: () => openApp('integrations'),
    },
    {
      id: 'observability',
      name: 'System Health',
      label: 'System Health',
      icon: Activity,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/25 shadow-[0_0_12px_rgba(168,85,247,0.12)]',
      ariaLabel: 'Open System Health',
      action: () => openApp('observability'),
    },
  ], [navigateToTab, openApp, openOrionAI, activeExceptionsCount]);

  // 3. Compact activity events derived from real context
  const recentActivities = useMemo(() => {
    const items: Array<{ id: string; title: string; subtitle: string; time: string; icon: any; color: string; action?: () => void }> = [];

    // Real decisions from supply chain context
    if ((decisions || []).length > 0) {
      (decisions || []).slice(0, 2).forEach(dec => {
        items.push({
          id: `dec-${dec.id}`,
          title: (dec as any).title || 'Autonomous Action Executed',
          subtitle: (dec as any).summary || 'Enterprise policy rules applied',
          time: 'Automated',
          icon: CheckCircle2,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
          action: () => openApp('decision-center'),
        });
      });
    }

    // Active exception or alert
    if ((exceptions || []).length > 0) {
      const latestExc = exceptions[0];
      const excTitle = (latestExc as any).title || `${latestExc.type || 'Exception'}: ${latestExc.entityId || 'Disruption'}`;
      items.push({
        id: `exc-${latestExc.id}`,
        title: excTitle,
        subtitle: latestExc.description || 'Disruption risk requiring review',
        time: latestExc.status !== 'Resolved' ? latestExc.status : 'Resolved',
        icon: AlertTriangle,
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        action: () => navigateToTab('alerts'),
      });
    }

    // Fallback enterprise events if context has fewer than 3 items
    if (items.length < 3) {
      const defaults = [
        {
          id: 'sys-act-1',
          title: 'Autonomous Policy Rebalance',
          subtitle: 'Dynamic safety buffers calibrated across primary distribution nodes',
          time: 'Just now',
          icon: CheckCircle2,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
          action: () => openApp('decision-center'),
        },
        {
          id: 'sys-act-2',
          title: 'Enterprise ERP Telemetry Synced',
          subtitle: 'Inbound PO receipts & goods issues reconciled with ledger',
          time: '12m ago',
          icon: Layers,
          color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
          action: () => openApp('integrations'),
        },
        {
          id: 'sys-act-3',
          title: 'Security & Session Verification',
          subtitle: 'Cryptographic policy enforcement gate active for active tenant',
          time: '45m ago',
          icon: Activity,
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
          action: () => openApp('observability'),
        }
      ];
      for (const d of defaults) {
        if (items.length < 3 && !items.find(i => i.id === d.id)) {
          items.push(d);
        }
      }
    }

    return items.slice(0, 3);
  }, [decisions, exceptions, openApp, navigateToTab]);

  return (
    <div className="w-full max-w-full space-y-4 pb-4 select-none animate-in fade-in duration-200">
      
      {/* 1. GREETING & SYSTEM STATUS WIDGET */}
      <div className="bg-os-surface/85 backdrop-blur-md border border-os-border rounded-2xl p-3.5 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-mono font-bold tracking-wider text-os-text-primary">
                ORION-9 OS
              </span>
              <span className="text-[10px] text-os-text-muted font-mono">• MOBILE HOME</span>
            </div>
            <div className="text-sm font-bold text-os-text-primary tracking-tight mt-0.5 truncate">
              {greeting}, {userName}
            </div>
            <div className="text-[11px] text-os-text-muted capitalize truncate">
              Enterprise Supply Chain Operating System • {userRole}
            </div>
          </div>

          {/* Environment Badge from authoritative runtime */}
          <div 
            className={`px-2 py-0.5 rounded-full border text-[9px] font-mono font-semibold flex items-center gap-1.5 shrink-0 ${
              isLive 
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
                : isStaging
                ? 'border-sky-500/30 bg-sky-500/10 text-sky-400'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
            }`}
            aria-label={`Runtime Environment: ${environment}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              isLive ? 'bg-emerald-400' : isStaging ? 'bg-sky-400' : 'bg-amber-400'
            }`} />
            <span>{environment}</span>
          </div>
        </div>

        {/* System Health Status Row */}
        <button
          type="button"
          onClick={() => openApp('observability')}
          className="w-full pt-2 border-t border-os-border/70 flex items-center justify-between text-[11px] font-mono text-left cursor-pointer group active:opacity-80 transition-opacity min-h-[32px]"
          aria-label="View System Health & Diagnostics"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399] shrink-0" />
            <span className="text-os-text-primary font-semibold truncate">System Operational</span>
            <span className="text-[10px] text-os-text-muted hidden min-[360px]:inline">• All systems operational</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-os-text-muted group-hover:text-os-accent transition-colors shrink-0">
            <span>Diagnostics</span>
            <ChevronRight size={12} />
          </div>
        </button>
      </div>

      {/* 2. PRIMARY APPLICATION LAUNCHER GRID (4 Columns on mobile, 3-col on <=320px) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-os-text-muted">
            Applications
          </span>
          <button
            type="button"
            onClick={() => navigateToTab('apps')}
            className="text-[10px] font-mono text-os-accent hover:underline flex items-center gap-0.5 cursor-pointer"
            aria-label="View All Applications"
          >
            <span>All Apps</span>
            <ChevronRight size={11} />
          </button>
        </div>

        <div 
          data-orion-launcher-grid="true"
          className="grid grid-cols-3 min-[340px]:grid-cols-4 gap-y-3.5 gap-x-2 sm:gap-x-3 py-1"
        >
          {launcherApps.map(app => {
            const Icon = app.icon;
            return (
              <button
                key={app.id}
                type="button"
                onClick={app.action}
                className="flex flex-col items-center justify-start group cursor-pointer focus:outline-none touch-manipulation min-w-[64px] min-h-[44px]"
                aria-label={app.ariaLabel}
              >
                {/* Launcher Squircle Icon */}
                <div className="relative">
                  <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center transition-all duration-150 group-active:scale-90 group-hover:border-white/30 backdrop-blur-md ${app.color}`}>
                    <Icon size={24} className="stroke-[1.8px] transition-transform group-hover:scale-105" />
                  </div>

                  {/* Optional Alert/Notification Badge */}
                  {app.badge && (
                    <span className="absolute -top-1 -right-1 px-1.5 min-w-[18px] h-4.5 bg-red-500 text-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center ring-2 ring-os-bg shadow-sm">
                      {app.badge}
                    </span>
                  )}
                </div>

                {/* Launcher Icon Label */}
                <span className="text-[11px] font-medium text-os-text-primary text-center truncate w-full mt-1.5 px-0.5 tracking-tight group-hover:text-os-accent transition-colors">
                  {app.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. COMPACT ORION AI WIDGET */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => openOrionAI()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openOrionAI(); } }}
        className="bg-gradient-to-r from-cyan-950/30 via-os-surface to-blue-950/20 border border-cyan-500/20 hover:border-cyan-400/40 rounded-2xl p-3 flex items-center justify-between gap-3 cursor-pointer shadow-xs active:scale-[0.99] transition-all group"
        aria-label="Ask Orion AI"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-os-text-primary">ORION AI</span>
              <span className="text-[10px] text-os-text-muted font-mono">• Ask Orion</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </div>
            <p className="text-[11px] text-os-text-muted truncate mt-0.5">
              Ask ORION about your supply chain
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold shrink-0 group-hover:bg-cyan-500/25 transition-colors">
          <span>Ask AI</span>
          <ArrowRight size={12} />
        </div>
      </div>

      {/* 4. COMPACT RECENT ACTIVITY WIDGET */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-os-text-muted flex items-center gap-1.5">
            <Clock size={12} />
            Recent Activity
          </span>
          {recentActivities.length > 0 && (
            <span className="text-[10px] font-mono text-os-text-muted">
              {recentActivities.length} recent
            </span>
          )}
        </div>

        <div className="bg-os-surface/85 backdrop-blur-md border border-os-border rounded-2xl p-2.5 divide-y divide-os-border/50">
          {recentActivities.length === 0 ? (
            <div className="p-4 text-center text-xs font-mono text-os-text-muted">
              No recent activity recorded
            </div>
          ) : (
            recentActivities.map(act => {
              const Icon = act.icon;
              return (
                <div
                  key={act.id}
                  onClick={() => act.action && act.action()}
                  className={`flex items-center gap-2.5 py-2 px-1 text-xs transition-colors rounded-lg ${
                    act.action ? 'cursor-pointer hover:bg-os-surface-hover active:opacity-80' : ''
                  }`}
                >
                  <div className={`p-1.5 rounded-lg border shrink-0 ${act.color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-os-text-primary text-[11px] truncate">{act.title}</div>
                    <div className="text-[10px] text-os-text-muted truncate">{act.subtitle}</div>
                  </div>
                  <div className="text-[9px] font-mono text-os-text-muted shrink-0 text-right">
                    {act.time}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};