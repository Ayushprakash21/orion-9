/**
 * ORION-9 DYNAMIC ISLAND SYSTEM SURFACE
 * Single persistent bezel-anchored telemetry pill & interactive expansion panel.
 * UX interaction model inspired by Astraeus (https://github.com/Icetist/Astraeus),
 * engineered natively in React + Motion 2.0 with zero idle re-render churn.
 *
 * ARCHITECTURAL CONTRACT:
 * - Strictly ONE persistent mounted surface component across all states (COLLAPSED, EXPANDED, TRANSITIONING).
 * - Zero unmounting, zero component swaps, zero layout jumping.
 * - Flat flush top edge (0px radius, 0px border-top) anchored seamlessly to System Bar at 44px.
 * - Fluid spring width and height expansion with staggered body reveal.
 * - Shared system glass surface tokens (var(--orion-system-surface), var(--orion-system-backdrop-filter)).
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  Bell,
  Brain,
  CheckCircle2,
  ChevronUp,
  ExternalLink,
  Info,
  Pin,
  PinOff,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useDynamicIslandState } from './useDynamicIslandState';
import { useOptionalSupplyChain } from '../../../store/SupplyChainContext';
import { useOrionTheme } from '../../theme/useOrionTheme';
import { useToast } from '../../../store/ToastContext';
import { dbManager } from '../../../core/database/DatabaseConnectionManager';
import { ORION_OS_METADATA } from '../../constants/OrionOsMetadata';
import { isReducedMotionPreferred } from '../../motion/OrionMotion';
import { cn } from '../../../lib/utils';
import { DynamicIslandEventItem } from './DynamicIslandTypes';

export const DynamicIsland: React.FC = React.memo(() => {
  const {
    presentationMode,
    surfaceState,
    isExpanded,
    isPinned,
    isCompactOverMaximized,
    isFullscreenHidden,
    activity,
    activities,
    primaryEvent,
    activeNotification,
    metrics,
    toggleExpanded,
    collapse,
    togglePin,
    setIsHovered,
    handleAction,
    dismissActivity,
    dismissNotification,
  } = useDynamicIslandState();

  const containerRef = useRef<HTMLDivElement>(null);
  const { isDark } = useOrionTheme();
  const { showToast } = useToast();
  const supplyChain = useOptionalSupplyChain();

  const [dbEnv, setDbEnv] = useState<string>(() => {
    try {
      return dbManager.getEnvironment();
    } catch {
      return 'DEMO';
    }
  });

  useEffect(() => {
    const handleEnvChanged = () => {
      try {
        setDbEnv(dbManager.getEnvironment());
      } catch {}
    };
    window.addEventListener('orion-database-environment-changed', handleEnvChanged);
    return () => window.removeEventListener('orion-database-environment-changed', handleEnvChanged);
  }, []);

  const isReducedMotion = isReducedMotionPreferred(
    supplyChain?.settings?.reducedMotion ?? supplyChain?.settings?.personalization?.reducedMotion
  );

  // Authoritative Dynamic Island Availability Lifecycle Signal
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__ORION_DYNAMIC_ISLAND_MOUNTED__ = true;
      window.dispatchEvent(new CustomEvent('orion:dynamic-island-availability', { detail: { available: true } }));
    }
    return () => {
      if (typeof window !== 'undefined') {
        (window as any).__ORION_DYNAMIC_ISLAND_MOUNTED__ = false;
        window.dispatchEvent(new CustomEvent('orion:dynamic-island-availability', { detail: { available: false } }));
      }
    };
  }, []);

  // Synchronize expanded state with System Bar separator and surface bridge
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__ORION_DYNAMIC_ISLAND_EXPANDED__ = isExpanded;
      window.dispatchEvent(new CustomEvent('orion:dynamic-island-state', { detail: { isExpanded } }));
    }
  }, [isExpanded]);

  // Outside click to collapse when unpinned
  useEffect(() => {
    if (!isExpanded || isPinned) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        collapse();
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isExpanded, isPinned, collapse]);

  // Support Escape to collapse and global orion:dynamic-island-toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        collapse();
      }
    };
    const handleToggleEvent = () => {
      toggleExpanded();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('orion:dynamic-island-toggle', handleToggleEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('orion:dynamic-island-toggle', handleToggleEvent);
    };
  }, [isExpanded, collapse, toggleExpanded]);

  const exceptionsCount = metrics.activeExceptionsCount ?? supplyChain?.exceptions?.length ?? 120;
  const criticalCount = metrics.criticalExceptionsCount ?? supplyChain?.exceptions?.filter(e => e.severity === 'Critical')?.length ?? 16;
  const connectorsCount = metrics.connectedConnectorsCount ?? 5;

  const handleShare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(window.location.href);
      showToast('Control Tower session link copied to clipboard', 'info', 'Control Tower');
    } catch {
      showToast('Session link ready', 'info', 'Control Tower');
    }
  }, [showToast]);

  if (isFullscreenHidden || presentationMode === 'disabled') {
    return null;
  }

  const pillHeightClass =
    presentationMode === 'minimal'
      ? 'h-[26px] px-2.5'
      : isCompactOverMaximized && !isExpanded && surfaceState !== 'critical'
        ? 'h-[30px]'
        : 'h-[34px]';

  const statusToneClass = (() => {
    if (activeNotification) {
      const sev = activeNotification.severity;
      if (isDark) {
        if (sev === 'critical') return 'border-rose-500/45 bg-[rgba(34,12,18,0.95)] hover:border-rose-400/60 shadow-[0_8px_24px_rgba(244,63,94,0.25)]';
        if (sev === 'warning') return 'border-amber-500/45 bg-[rgba(32,24,14,0.95)] hover:border-amber-400/60 shadow-[0_8px_24px_rgba(245,158,11,0.20)]';
        if (sev === 'success') return 'border-emerald-500/40 bg-[rgba(12,28,20,0.95)] hover:border-emerald-400/55 shadow-[0_8px_24px_rgba(16,185,129,0.20)]';
        if (sev === 'info') return 'border-sky-500/40 bg-[rgba(14,24,38,0.95)] hover:border-sky-400/60 shadow-[0_8px_24px_rgba(56,189,248,0.20)]';
        return 'border-white/[0.18] bg-[rgba(20,24,34,0.94)] hover:border-white/30';
      } else {
        if (sev === 'critical') return 'border-rose-500/40 bg-[rgba(255,241,242,0.96)] hover:border-rose-600/50 shadow-[0_4px_16px_rgba(244,63,94,0.15)]';
        if (sev === 'warning') return 'border-amber-500/40 bg-[rgba(254,252,232,0.96)] hover:border-amber-600/50 shadow-[0_4px_16px_rgba(245,158,11,0.15)]';
        if (sev === 'success') return 'border-emerald-500/35 bg-[rgba(240,253,244,0.96)] hover:border-emerald-600/50 shadow-[0_4px_16px_rgba(16,185,129,0.15)]';
        if (sev === 'info') return 'border-sky-500/35 bg-[rgba(240,249,255,0.96)] hover:border-sky-600/50 shadow-[0_4px_16px_rgba(56,189,248,0.15)]';
        return 'border-[#E1E5EA] bg-white hover:border-[#CBD5E1] shadow-[0_4px_16px_rgba(15,23,42,0.08)]';
      }
    }

    if (isDark) {
      if (activity === 'critical-alert') return 'border-rose-500/45 bg-[rgba(34,12,18,0.94)] hover:border-rose-400/60';
      if (activity === 'copilot-thinking') return 'border-indigo-400/45 bg-[rgba(16,18,36,0.92)] hover:border-indigo-300/60';
      if (activity === 'connector-sync') return 'border-sky-400/40 bg-[rgba(12,24,36,0.92)] hover:border-sky-300/60';
      return 'border-white/[0.14] bg-[var(--orion-system-surface)] hover:border-white/30 shadow-[0_8px_24px_rgba(0,0,0,0.65)]';
    } else {
      if (activity === 'critical-alert') return 'border-rose-500/45 bg-[rgba(255,242,244,0.95)] hover:border-rose-600/60';
      if (activity === 'copilot-thinking') return 'border-indigo-500/40 bg-[rgba(245,247,255,0.95)] hover:border-indigo-600/55';
      if (activity === 'connector-sync') return 'border-sky-500/40 bg-[rgba(242,249,255,0.95)] hover:border-sky-600/55';
      return 'border-[#DCE1E7] bg-[var(--orion-system-surface)] hover:border-[#CBD5E1] shadow-[0_4px_16px_rgba(15,23,42,0.08)]';
    }
  })();

  const renderNotificationIcon = (item: DynamicIslandEventItem) => {
    if (item.iconUrl) {
      return <img src={item.iconUrl} alt="" className="w-3.5 h-3.5 rounded object-contain shrink-0" />;
    }
    const sev = item.severity;
    if (sev === 'success') {
      return <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />;
    }
    if (sev === 'warning') {
      return <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />;
    }
    if (sev === 'critical') {
      return <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-rose-400' : 'text-rose-700'}`} />;
    }
    return <Info className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-sky-400' : 'text-sky-700'}`} />;
  };

  const renderNotificationDot = (item: DynamicIslandEventItem) => {
    const sev = item.severity;
    if (sev === 'critical') {
      return <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.65)]" />;
    }
    if (sev === 'warning') {
      return <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />;
    }
    if (sev === 'success') {
      return <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />;
    }
    if (sev === 'info') {
      return <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0 shadow-[0_0_6px_rgba(56,189,248,0.5)]" />;
    }
    return <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />;
  };

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Orion-9 Dynamic Island System Telemetry"
      data-testid="dynamic-island-root"
      data-dynamic-island="true"
      data-surface-state={surfaceState}
      data-presentation-mode={presentationMode}
      data-expanded={isExpanded ? 'true' : 'false'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ zIndex: 10010 }}
      className="relative z-[10010] flex flex-col items-center pointer-events-auto"
    >
      {/* 
        ONE PERSISTENT CONTINUOUS SURFACE
        Animates width, corner radii, and expands downward seamlessly.
        Zero component unmounting, zero window destruction.
      */}
      <motion.div
        layout
        id={isExpanded ? "dynamic-island-expanded-surface" : "dynamic-island-capsule-surface"}
        data-testid={isExpanded ? "dynamic-island-expanded-panel" : "dynamic-island-surface"}
        data-surface-state={surfaceState}
        data-compact-over-maximized={isCompactOverMaximized ? 'true' : 'false'}
        initial={false}
        animate={{
          width: isExpanded
            ? 'min(580px, calc(100vw - 24px))'
            : isCompactOverMaximized
              ? 'min(480px, calc(100vw - 24px))'
              : 'min(520px, calc(100vw - 24px))',
          borderBottomLeftRadius: isExpanded ? 24 : 16,
          borderBottomRightRadius: isExpanded ? 24 : 16,
        }}
        transition={
          isReducedMotion
            ? { duration: 0.05 }
            : {
                type: 'spring',
                stiffness: 380,
                damping: 30,
                mass: 0.8,
              }
        }
        style={{
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          backdropFilter: 'var(--orion-system-backdrop-filter, blur(20px) saturate(150%))',
          WebkitBackdropFilter: 'var(--orion-system-backdrop-filter, blur(20px) saturate(150%))',
        }}
        className={cn(
          "relative overflow-hidden border-b border-l border-r border-t-0 select-none pointer-events-auto transition-colors duration-200",
          "bg-[var(--orion-system-surface)] border-[var(--orion-system-border)] shadow-[var(--orion-system-shadow)]",
          isDark ? "text-white" : "text-[#202631]"
        )}
      >
        {/* 
          1. HEADER ROW:
          - When collapsed: interactive telemetry capsule pill
          - When expanded: proprietary Orion system header controls
        */}
        <div
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Dynamic Island Controls" : "Expand Orion Dynamic Island"}
          data-testid="dynamic-island-capsule"
          data-surface-state={surfaceState}
          data-compact-over-maximized={isCompactOverMaximized ? 'true' : 'false'}
          {...(activeNotification ? { 'data-has-notification': 'true', 'data-notification-id': activeNotification.id } : {})}
          onClick={!isExpanded ? toggleExpanded : undefined}
          onKeyDown={(e) => {
            if (!isExpanded && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              toggleExpanded();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              if (activeNotification) dismissNotification?.(activeNotification.id);
              else if (isExpanded) collapse();
            }
          }}
          className={cn(
            "flex items-center justify-between px-3.5 sm:px-4 w-full transition-colors duration-150 select-none",
            isExpanded ? "pt-3 pb-2.5 cursor-default" : `cursor-pointer ${pillHeightClass} ${statusToneClass}`
          )}
        >
          {/* Collapsed vs Expanded Header Content with smooth cross-fade */}
          {!isExpanded ? (
            /* COLLAPSED HEADER CONTENT */
            <div className="flex items-center justify-between w-full min-w-0">
              <div className="sr-only" role="status" aria-live={activeNotification?.severity === 'critical' || activity === 'critical-alert' ? 'assertive' : 'polite'}>
                {activeNotification ? `${activeNotification.appName || 'Notification'}: ${activeNotification.title || activeNotification.message}` : activity === 'system-ready' ? 'System Ready' : activity}
              </div>

              {activeNotification ? (
                <div
                  data-testid="dynamic-island-notification-preview"
                  className="flex items-center justify-between w-full min-w-0 gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {renderNotificationDot(activeNotification)}
                    {renderNotificationIcon(activeNotification)}
                    <span className={`text-[11px] font-semibold uppercase tracking-wider shrink-0 max-w-[95px] truncate ${
                      isDark ? 'text-white/75' : 'text-slate-600'
                    }`}>
                      {activeNotification.appName || 'Desktop'}
                    </span>
                    <span className={`text-[11px] shrink-0 select-none ${isDark ? 'text-white/35' : 'text-slate-400'}`}>
                      ·
                    </span>
                    <span className={`text-[11px] font-medium truncate max-w-[210px] sm:max-w-[280px] ${
                      isDark ? 'text-white/95' : 'text-slate-900'
                    }`}>
                      {activeNotification.title || activeNotification.message}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    {activeNotification.dismissible !== false && (
                      <button
                        type="button"
                        data-testid="dynamic-island-dismiss-btn"
                        aria-label="Dismiss notification"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification?.(activeNotification.id);
                        }}
                        className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          isDark
                            ? 'hover:bg-white/15 text-white/50 hover:text-white'
                            : 'hover:bg-slate-900/10 text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full min-w-0">
                  {/* Left Anchor: State Indicator + System / Activity Status */}
                  <div className="flex items-center gap-2 min-w-0">
                    {activity === 'critical-alert' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.65)]" />
                        <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-rose-300' : 'text-rose-700'}`} />
                        <span className={`text-[11px] font-semibold truncate ${isDark ? 'text-rose-300' : 'text-rose-800'}`}>
                          {metrics.unreadNotificationsCount > 0
                            ? `${metrics.criticalExceptionsCount} ${metrics.criticalExceptionsCount === 1 ? 'Alert' : 'Alerts'}`
                            : `Shipment exception detected • ${metrics.criticalExceptionsCount} ${metrics.criticalExceptionsCount === 1 ? 'Alert' : 'Alerts'}`}
                        </span>
                      </>
                    ) : activity === 'copilot-thinking' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                        <Brain className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`} />
                        <span className={`text-[11px] font-semibold truncate ${isDark ? 'text-indigo-200' : 'text-indigo-900'}`}>
                          {primaryEvent?.title || 'Orion Copilot Active'}
                        </span>
                      </>
                    ) : activity === 'connector-sync' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                        <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-sky-300' : 'text-sky-700'}`} />
                        <span className={`text-[11px] font-semibold truncate ${isDark ? 'text-sky-300' : 'text-sky-900'}`}>
                          {`Syncing ${metrics.connectedConnectorsCount} connectors`}
                        </span>
                      </>
                    ) : activity === 'simulation-running' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                        <Activity className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-purple-300' : 'text-purple-700'}`} />
                        <span className={`text-[11px] font-semibold truncate ${isDark ? 'text-purple-200' : 'text-purple-900'}`}>
                          {primaryEvent?.title || 'Simulation Running'}
                        </span>
                      </>
                    ) : (
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Left: 09 badge + PULSAR RELEASE Branding */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold font-mono text-[9px] shadow-xs ${
                            isDark ? 'bg-white/10 border border-sky-400/50 text-sky-400' : 'bg-sky-50 border border-sky-300 text-sky-700'
                          }`}>
                            09
                          </span>
                          <div className="flex flex-col text-left leading-none">
                            <span className={`text-[11px] font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {ORION_OS_METADATA.displayTitle}
                            </span>
                            <span className={`text-[8.5px] font-semibold tracking-wider uppercase mt-0.5 ${isDark ? 'text-sky-400/90' : 'text-sky-600'}`}>
                              {ORION_OS_METADATA.displaySubtitle}
                            </span>
                          </div>
                        </div>

                        {/* Vertical Separator */}
                        <div className={`h-4.5 w-px mx-0.5 hidden xs:block ${isDark ? 'bg-white/15' : 'bg-slate-300'}`} />

                        {/* Center Status */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_#34D399]" />
                          <div className="flex flex-col text-left leading-none">
                            <span className={`text-[11px] font-medium truncate ${isDark ? 'text-white/95' : 'text-slate-900'}`}>
                              {metrics.activeAppName ? metrics.activeAppName : 'System Ready'}
                            </span>
                            <span className={`text-[8.5px] mt-0.5 hidden sm:block ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                              Optimal • Operational
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Telemetry Micro-Badge / Quick controls */}
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    {typeof primaryEvent?.progress === 'number' && (
                      <div className="hidden sm:flex items-center gap-1.5">
                        <div className={`w-10 h-1 rounded-full overflow-hidden ${isDark ? 'bg-white/15' : 'bg-slate-900/15'}`}>
                          <div
                            className="h-full bg-sky-500 rounded-full transition-[width] duration-200"
                            style={{ width: `${Math.max(0, Math.min(100, primaryEvent.progress))}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {metrics.unreadNotificationsCount > 0 ? (
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-semibold ${
                          isDark
                            ? 'bg-rose-500/20 border-rose-500/35 text-rose-200'
                            : 'bg-rose-600/12 border-rose-600/30 text-rose-800'
                        }`}
                        aria-label={`${metrics.unreadNotificationsCount} unread notification${metrics.unreadNotificationsCount === 1 ? '' : 's'}`}
                      >
                        <Bell className="w-2.5 h-2.5" />
                        <span>{metrics.unreadNotificationsCount}</span>
                      </span>
                    ) : (
                      <div className={`flex items-center gap-2 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                        <div className="relative">
                          <Bell className={`w-3.5 h-3.5 transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`} />
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
                        </div>
                        <Search className={`w-3.5 h-3.5 transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`} />
                        <div className={`w-5 h-5 rounded-full overflow-hidden border shrink-0 ${
                          isDark ? 'border-white/20 bg-white/10' : 'border-slate-300 bg-slate-100'
                        }`}>
                          <img
                            src="/orion-9-favicon.png"
                            alt="User Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* EXPANDED HEADER CONTENT (Proprietary Orion System Controls) */
            <div className="flex items-center justify-between w-full min-w-0">
              {/* Left: Orion Identity & Operational State */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn(
                  "w-6 h-6 rounded-lg flex items-center justify-center font-bold font-mono text-[11px] shadow-xs select-none shrink-0",
                  isDark
                    ? "bg-black/40 border border-white/20 text-[#E5A84B]"
                    : "bg-[#F7F8FA] border border-[#E1E5EA] text-[#D97706]"
                )}>
                  09
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn(
                    "text-[12px] font-bold tracking-tight uppercase font-mono truncate",
                    isDark ? "text-white/95" : "text-[#202631]"
                  )}>
                    ORION-9 • SUPPLY CHAIN OS
                  </span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border shrink-0",
                    isDark
                      ? "bg-[#E5A84B]/15 text-[#E5A84B] border-[#E5A84B]/35"
                      : "bg-[#E5A84B]/15 text-[#B45309] border-[#E5A84B]/40"
                  )}>
                    {dbEnv}
                  </span>
                </div>
              </div>

              {/* Right: Orion System Controls */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Alerts Pill */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent('orion:open-notifications'));
                  }}
                  aria-label={`${criticalCount} alerts pending`}
                  title="Open Notification Center"
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer mr-0.5",
                    isDark
                      ? "bg-rose-500/15 border-rose-500/35 text-rose-300 hover:bg-rose-500/25"
                      : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                  )}
                >
                  <Bell className="w-2.5 h-2.5" />
                  <span>{criticalCount}</span>
                </button>

                {/* Pin Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin();
                  }}
                  aria-label={isPinned ? 'Unpin Island' : 'Pin Island'}
                  title={isPinned ? 'Unpin Island (Collapses on blur)' : 'Pin Island (Stays Open)'}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors cursor-pointer",
                    isDark
                      ? "hover:bg-white/10 text-white/60 hover:text-white"
                      : "hover:bg-black/[0.05] text-[#596273] hover:text-[#202631]"
                  )}
                >
                  {isPinned ? <PinOff className="w-3.5 h-3.5 text-cyan-400" /> : <Pin className="w-3.5 h-3.5" />}
                </button>

                {/* Share Button */}
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share Session"
                  title="Share Control Tower Session"
                  className={cn(
                    "p-1.5 rounded-lg transition-colors cursor-pointer",
                    isDark
                      ? "hover:bg-white/10 text-white/60 hover:text-white"
                      : "hover:bg-black/[0.05] text-[#596273] hover:text-[#202631]"
                  )}
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>

                {/* Open Full Workspace Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction('command-center');
                  }}
                  aria-label="Open Full Control Tower"
                  title="Open Full Control Tower Workspace"
                  className={cn(
                    "p-1.5 rounded-lg transition-colors cursor-pointer",
                    isDark
                      ? "hover:bg-white/10 text-white/60 hover:text-white"
                      : "hover:bg-black/[0.05] text-[#596273] hover:text-[#202631]"
                  )}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                {/* Orion System Collapse Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    collapse();
                  }}
                  aria-label="Collapse Dynamic Island"
                  title="Collapse to System Bar (Esc)"
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ml-1",
                    isDark
                      ? "bg-white/[0.08] hover:bg-white/[0.15] text-white/80 hover:text-white"
                      : "bg-black/[0.04] hover:bg-black/[0.08] text-[#596273] hover:text-[#202631]"
                  )}
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span className="text-[10px] hidden xs:inline font-mono">Collapse</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 
          2. EXPANDED CONTROL TOWER BODY:
          Smoothly reveals downward with staggered contents.
          Contained entirely within this same persistent mounted surface.
        */}
        <motion.div
          initial={false}
          animate={{
            height: isExpanded ? 'auto' : 0,
            opacity: isExpanded ? 1 : 0,
          }}
          transition={
            isReducedMotion
              ? { duration: 0.04 }
              : {
                  height: { type: 'spring', stiffness: 380, damping: 30, mass: 0.8 },
                  opacity: { duration: isExpanded ? 0.24 : 0.16, delay: isExpanded ? 0.08 : 0 },
                }
          }
          className="overflow-hidden"
          style={{ pointerEvents: isExpanded ? 'auto' : 'none' }}
        >
          {/* Subtle separator line between header and Control Tower body */}
          <div className={cn(
            "h-px w-full",
            isDark ? "bg-white/[0.08]" : "bg-[#DCE1E7]"
          )} />

          <div className="pt-2 pb-3.5">
            {/* Subheader Row */}
            <div className="flex items-center justify-between px-4 pt-1 pb-1.5 text-xs">
              <span className={cn(
                "font-medium tracking-wide",
                isDark ? "text-white/70" : "text-[#596273]"
              )}>
                Enterprise Control Tower
              </span>
              <span className={cn(
                "font-mono text-[10px]",
                isDark ? "text-white/40" : "text-[#8C95A5]"
              )}>
                Real-time Telemetry
              </span>
            </div>

            {/* Hero Operational Status Banner with Pulsar Radar Graphic */}
            <div className={cn(
              "mx-4 mt-1 relative overflow-hidden rounded-2xl border p-4 flex items-center justify-between backdrop-blur-md",
              isDark
                ? "border-white/[0.10] bg-white/[0.04]"
                : "border-[#E1E5EA] bg-[#F7F8FA]"
            )}>
              {/* Left: System Status Shield & Headline */}
              <div className="flex items-center gap-3 z-10">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border",
                  isDark
                    ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.30)]"
                    : "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-[0_2px_8px_rgba(16,185,129,0.15)]"
                )}>
                  <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={cn(
                      "text-sm font-bold tracking-tight",
                      isDark ? "text-white" : "text-[#202631]"
                    )}>
                      System Nominal
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981] animate-pulse" />
                  </div>
                  <p className={cn(
                    "text-xs mt-0.5",
                    isDark ? "text-white/60" : "text-[#596273]"
                  )}>
                    {criticalCount > 0 
                      ? `${criticalCount} critical exceptions pending resolution` 
                      : 'All supply chain flows are healthy'}
                  </p>
                </div>
              </div>

              {/* Right: Version & Pulsar Radar Emission Waveform SVG */}
              <div className="flex items-center gap-3 z-10">
                <div className="text-right">
                  <div className={cn(
                    "text-xs font-bold tracking-wide font-mono",
                    isDark ? "text-white/90" : "text-[#202631]"
                  )}>
                    Version {ORION_OS_METADATA.version}
                  </div>
                  <div className={cn(
                    "text-[10px] font-bold tracking-wider uppercase font-mono",
                    isDark ? "text-sky-400" : "text-sky-600"
                  )}>
                    {ORION_OS_METADATA.releaseCodename} RELEASE
                  </div>
                </div>

                {/* Exact Radar Target Waveform */}
                <div className={cn(
                  "w-11 h-10 shrink-0 flex items-center justify-center",
                  isDark ? "text-sky-400" : "text-sky-600"
                )}>
                  <svg viewBox="0 0 48 48" fill="none" className="w-full h-full stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="24" cy="24" r="16" strokeDasharray="3 3" opacity="0.4" />
                    <circle cx="24" cy="24" r="11" opacity="0.8" />
                    <circle cx="24" cy="24" r="5" className={isDark ? "fill-sky-400/20" : "fill-sky-600/15"} />
                    <line x1="24" y1="4" x2="24" y2="12" />
                    <line x1="24" y1="36" x2="24" y2="44" />
                    <line x1="4" y1="24" x2="12" y2="24" />
                    <line x1="36" y1="24" x2="44" y2="24" />
                    <line x1="18" y1="24" x2="30" y2="24" strokeWidth="2" />
                    <line x1="24" y1="18" x2="24" y2="30" strokeWidth="2" />
                  </svg>
                </div>
              </div>

              {/* Ambient warm glow */}
              <div className={cn(
                "absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l via-transparent to-transparent pointer-events-none",
                isDark ? "from-[#E5A84B]/15" : "from-[#E5A84B]/10"
              )} />
            </div>

            {/* 4 Live Operational KPI Metric Cards */}
            <div className="grid grid-cols-4 gap-2 px-4 pt-3">
              {/* Card 1: Exceptions */}
              <div className={cn(
                "p-3 rounded-xl border flex flex-col justify-between backdrop-blur-sm",
                isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-[#E1E5EA] bg-[#F7F8FA]"
              )}>
                <span className={cn(
                  "text-[10px] font-medium uppercase tracking-wider",
                  isDark ? "text-white/50" : "text-[#596273]"
                )}>
                  Exceptions
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className={cn(
                    "text-base font-bold font-mono",
                    criticalCount > 0 
                      ? (isDark ? "text-rose-400" : "text-rose-600")
                      : (isDark ? "text-white/95" : "text-[#202631]")
                  )}>
                    {exceptionsCount}
                  </span>
                  <span className={cn(
                    "text-[10px] font-semibold flex items-center",
                    isDark ? "text-emerald-400" : "text-emerald-600"
                  )}>
                    ↓ 100%
                  </span>
                </div>
              </div>

              {/* Card 2: Stock Coverage */}
              <div className={cn(
                "p-3 rounded-xl border flex flex-col justify-between backdrop-blur-sm",
                isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-[#E1E5EA] bg-[#F7F8FA]"
              )}>
                <span className={cn(
                  "text-[10px] font-medium uppercase tracking-wider",
                  isDark ? "text-white/50" : "text-[#596273]"
                )}>
                  Stock Coverage
                </span>
                <div className="mt-1">
                  <span className={cn(
                    "text-xs font-bold font-mono",
                    isDark ? "text-emerald-400" : "text-emerald-600"
                  )}>
                    Optimal
                  </span>
                </div>
              </div>

              {/* Card 3: Shipments */}
              <div className={cn(
                "p-3 rounded-xl border flex flex-col justify-between backdrop-blur-sm",
                isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-[#E1E5EA] bg-[#F7F8FA]"
              )}>
                <span className={cn(
                  "text-[10px] font-medium uppercase tracking-wider",
                  isDark ? "text-white/50" : "text-[#596273]"
                )}>
                  Shipments
                </span>
                <div className="mt-1">
                  <span className={cn(
                    "text-xs font-bold",
                    isDark ? "text-white/95" : "text-[#202631]"
                  )}>
                    On Track
                  </span>
                </div>
              </div>

              {/* Card 4: Connectors */}
              <div className={cn(
                "p-3 rounded-xl border flex flex-col justify-between backdrop-blur-sm",
                isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-[#E1E5EA] bg-[#F7F8FA]"
              )}>
                <span className={cn(
                  "text-[10px] font-medium uppercase tracking-wider",
                  isDark ? "text-white/50" : "text-[#596273]"
                )}>
                  Connectors
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981]" />
                  <span className={cn(
                    "text-xs font-bold font-mono",
                    isDark ? "text-white/95" : "text-[#202631]"
                  )}>
                    {connectorsCount} Online
                  </span>
                </div>
              </div>
            </div>

            {/* Action Row Buttons */}
            <div className="grid grid-cols-3 gap-2.5 px-4 pt-3 pb-2">
              {/* Open Copilot */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction('ai-copilot');
                }}
                className={cn(
                  "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer",
                  isDark
                    ? "border-white/[0.12] bg-white/[0.06] hover:bg-white/[0.12] text-white"
                    : "border-[#E1E5EA] bg-[#F7F8FA] hover:bg-[#EDF0F3] text-[#202631]"
                )}
              >
                <Sparkles className={cn("w-3.5 h-3.5", isDark ? "text-purple-400" : "text-purple-600")} />
                <span>Open Copilot</span>
              </button>

              {/* Control Tower (Gold Button) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction('command-center');
                }}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#E5A84B] hover:bg-[#D6963B] text-[#0B0D13] font-bold text-xs shadow-[0_4px_16px_rgba(229,168,75,0.40)] transition-all active:scale-[0.98] cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Control Tower</span>
              </button>

              {/* Alerts */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent('orion:open-notifications'));
                }}
                className={cn(
                  "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer",
                  isDark
                    ? "border-white/[0.12] bg-white/[0.06] hover:bg-white/[0.12] text-white"
                    : "border-[#E1E5EA] bg-[#F7F8FA] hover:bg-[#EDF0F3] text-[#202631]"
                )}
              >
                <Bell className={cn("w-3.5 h-3.5", isDark ? "text-white/70" : "text-[#596273]")} />
                <span>Alerts ({criticalCount})</span>
              </button>
            </div>

            {/* Bottom Alert Banner (Matching Reference Design) */}
            {criticalCount > 0 && activities.length === 0 && (
              <div className="px-4 pt-2">
                <div className={cn(
                  "rounded-xl border px-3.5 py-2 flex items-center justify-between text-xs backdrop-blur-sm",
                  isDark
                    ? "border-rose-500/25 bg-rose-500/10 text-rose-200"
                    : "border-rose-200 bg-rose-50/90 text-rose-800"
                )}>
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span className="font-medium truncate">
                      Shipment exception detected • {criticalCount} Alerts
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction('command-center');
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer",
                        isDark
                          ? "bg-white/10 hover:bg-white/20 text-white"
                          : "bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-xs"
                      )}
                    >
                      Inspect Exceptions
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Active Transient Notifications Queue if any */}
            {activities.length > 0 && (
              <div className={cn(
                "flex flex-col gap-1.5 px-4 pb-2 pt-2 border-t mt-2 max-h-[140px] overflow-y-auto custom-scrollbar",
                isDark ? "border-white/[0.08]" : "border-[#EDF0F3]"
              )}>
                {activities.map((item) => (
                  <div
                    key={item.id}
                    data-testid={item.isNotification ? 'dynamic-island-notification-item' : 'dynamic-island-activity-item'}
                    className={cn(
                      "rounded-xl border p-2.5 flex items-start gap-2.5 text-xs backdrop-blur-sm",
                      isDark
                        ? "border-white/10 bg-white/[0.04]"
                        : "border-[#E1E5EA] bg-[#F7F8FA]"
                    )}
                  >
                    <div className="mt-0.5 shrink-0">
                      {item.severity === 'critical' ? (
                        <AlertTriangle className={cn("w-3.5 h-3.5", isDark ? "text-rose-400" : "text-rose-600")} />
                      ) : item.severity === 'success' ? (
                        <CheckCircle2 className={cn("w-3.5 h-3.5", isDark ? "text-emerald-400" : "text-emerald-600")} />
                      ) : (
                        <Info className={cn("w-3.5 h-3.5", isDark ? "text-sky-400" : "text-sky-600")} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {item.appName && (
                        <div className={cn(
                          "text-[9px] font-bold uppercase tracking-wider mb-0.5",
                          isDark ? "text-white/50" : "text-[#8C95A5]"
                        )}>
                          {item.appName}
                        </div>
                      )}
                      <div className={cn(
                        "font-semibold text-[11px] truncate",
                        isDark ? "text-white/95" : "text-[#202631]"
                      )}>
                        {item.title}
                      </div>
                      {item.message && (
                        <div className={cn(
                          "text-[10px] break-words",
                          isDark ? "text-white/60" : "text-[#596273]"
                        )}>
                          {item.message}
                        </div>
                      )}
                    </div>
                    {item.actionLabel && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.onAction) item.onAction();
                          else if (item.actionAppId) handleAction(item.actionAppId);
                        }}
                        className={cn(
                          "px-2 py-1 rounded-lg font-medium text-[10px] shrink-0 transition-colors cursor-pointer",
                          isDark
                            ? "bg-white/10 hover:bg-white/20 text-white"
                            : "bg-black/[0.06] hover:bg-black/[0.10] text-[#202631]"
                        )}
                      >
                        {item.actionLabel}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissActivity(item.id);
                      }}
                      className={cn(
                        "p-0.5 rounded cursor-pointer",
                        isDark
                          ? "text-white/40 hover:text-white"
                          : "text-[#8C95A5] hover:text-[#202631]"
                      )}
                      title="Dismiss"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
});

export default DynamicIsland;
