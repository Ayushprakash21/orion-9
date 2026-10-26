/**
 * ORION-9 DYNAMIC ISLAND
 * Refined macOS-inspired system-level Dynamic Island for Web OS and Native Tauri Desktop.
 * Provides compact idle capsule, contextual live event activities, and progressive disclosure
 * into a single cohesive, compact floating panel.
 */

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles,
  Brain, 
  Activity, 
  AlertTriangle, 
  RefreshCw, 
  Pin, 
  PinOff, 
  ChevronUp, 
  ChevronDown, 
  ExternalLink,
  Bell,
  CheckCircle2
} from 'lucide-react';
import { useDynamicIslandState } from './useDynamicIslandState';
import { ORION_SPRING_SMOOTH, isReducedMotionPreferred } from '../../motion/OrionMotion';
import { useOptionalSupplyChain } from '../../../store/SupplyChainContext';

export const DynamicIsland: React.FC = () => {
  const islandRef = useRef<HTMLDivElement>(null);
  const supplyChain = useOptionalSupplyChain();
  const prefersReduced = isReducedMotionPreferred(supplyChain?.settings?.personalization?.reducedMotion);

  const {
    isExpanded,
    isPinned,
    activity,
    metrics,
    toggleExpanded,
    collapse,
    togglePin,
    setIsHovered,
    handleAction
  } = useDynamicIslandState();

  // Outside click listener to collapse when not pinned
  useEffect(() => {
    if (!isExpanded || isPinned) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (islandRef.current && !islandRef.current.contains(e.target as Node)) {
        collapse();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isExpanded, isPinned, collapse]);

  const springConfig = prefersReduced 
    ? { duration: 0.01 } 
    : ORION_SPRING_SMOOTH;

  // Compute primary event-driven activity label for State B
  const activityLabel = (() => {
    switch (activity) {
      case 'copilot-thinking':
        return metrics.copilotStatus === 'analyzing' ? 'Copilot is analyzing' : 'Copilot is thinking';
      case 'critical-alerts':
        return metrics.criticalExceptionsCount === 1 
          ? 'Shipment exception detected • 1 Alert' 
          : `${metrics.criticalExceptionsCount} Alerts • Shipment exceptions detected`;
      case 'syncing':
        return `Syncing ${metrics.connectedConnectorsCount || 5} connectors`;
      case 'simulation-running':
        return 'Scenario simulation running';
      case 'notification':
        return `${metrics.unreadNotificationsCount} new notification${metrics.unreadNotificationsCount > 1 ? 's' : ''}`;
      default:
        return 'Optimal';
    }
  })();

  return (
    <div 
      ref={islandRef}
      className="absolute left-1/2 -translate-x-1/2 top-[5px] z-[2147483640] flex flex-col items-center select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label="Orion-9 Dynamic Island System Telemetry"
    >
      <motion.div
        layout
        transition={springConfig}
        className={`relative overflow-hidden bg-[#06070a]/92 backdrop-blur-2xl backdrop-saturate-[180%] border border-white/[0.10] shadow-[0_8px_32px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.15)] text-white transition-colors duration-200 ${
          isExpanded 
            ? 'w-[min(calc(100vw-32px),390px)] rounded-[24px] p-3.5 sm:p-4' 
            : 'h-[34px] rounded-full px-3 sm:px-3.5 flex items-center cursor-pointer hover:bg-[#07080d]/98 hover:border-white/[0.18] hover:shadow-[0_12px_28px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.22)]'
        }`}
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            /* STATE A (IDLE) & STATE B (ACTIVITY) — COMPACT PILL */
            <motion.div
              key="compact"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={springConfig}
              onClick={toggleExpanded}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleExpanded();
                }
              }}
              tabIndex={0}
              role="button"
              aria-expanded={false}
              aria-label="Expand Orion Dynamic Island"
              className="flex items-center gap-2 w-full h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 rounded-full group"
            >
              {/* Left: Subtle Orion symbol & activity beacon */}
              <div className="relative flex items-center justify-center shrink-0">
                {activity === 'copilot-thinking' ? (
                  <div className="relative flex items-center justify-center w-3.5 h-3.5 text-cyan-400">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400/40 animate-ping" />
                    <Sparkles className="w-3.5 h-3.5 drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                  </div>
                ) : activity === 'critical-alerts' ? (
                  <div className="relative flex items-center justify-center w-3.5 h-3.5 text-rose-400">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-rose-500/40 animate-ping" />
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                  </div>
                ) : activity === 'syncing' ? (
                  <RefreshCw className="w-3 h-3 text-sky-400 animate-spin" />
                ) : activity === 'simulation-running' ? (
                  <Activity className="w-3 h-3 text-purple-400 animate-pulse" />
                ) : (
                  <div className="relative flex items-center justify-center w-3.5 h-3.5 text-cyan-400/90">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  </div>
                )}
              </div>

              {/* Middle: Status label or live event */}
              <div className="flex items-center gap-1.5 truncate min-w-0">
                {activity === 'copilot-thinking' ? (
                  <span className="text-[11px] font-medium tracking-tight text-cyan-300 truncate">
                    {activityLabel}
                  </span>
                ) : activity === 'critical-alerts' ? (
                  <span className="text-[11px] font-medium tracking-tight text-rose-300 truncate">
                    {activityLabel}
                  </span>
                ) : activity === 'syncing' ? (
                  <span className="text-[11px] font-medium tracking-tight text-sky-300 truncate">
                    {activityLabel}
                  </span>
                ) : activity === 'simulation-running' ? (
                  <span className="text-[11px] font-medium tracking-tight text-purple-300 truncate">
                    {activityLabel}
                  </span>
                ) : metrics.activeAppName ? (
                  <span className="text-[11px] font-medium tracking-tight text-white/90 truncate max-w-[140px] sm:max-w-[200px]">
                    {metrics.activeAppName}
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-[11px] font-medium tracking-tight text-white/90">
                      Optimal
                    </span>
                    <span className="text-[10px] text-white/40 hidden md:inline">
                      • System Ready
                    </span>
                  </div>
                )}
              </div>

              {/* Right: Unread Notifications badge or subtle interactive chevron */}
              <div className="flex items-center gap-1 shrink-0 ml-auto pl-1">
                {metrics.unreadNotificationsCount > 0 && (
                  <div 
                    className="flex items-center gap-0.5 px-1.5 py-0.2 bg-rose-500/80 rounded-full text-[9px] font-bold text-white shadow-xs shrink-0"
                    title={`${metrics.unreadNotificationsCount} unread notification${metrics.unreadNotificationsCount > 1 ? 's' : ''}`}
                  >
                    <Bell className="w-2.5 h-2.5" />
                    <span>{metrics.unreadNotificationsCount}</span>
                  </div>
                )}
                <div className="text-white/30 group-hover:text-white/70 transition-colors">
                  <ChevronDown className="w-3 h-3" />
                </div>
              </div>
            </motion.div>
          ) : (
            /* STATE C — EXPANDED FLOATING PANEL (SINGLE COHESIVE SURFACE) */
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={springConfig}
              className="flex flex-col gap-3 w-full"
            >
              {/* 1. Header Row: System Status & Quick Controls */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-cyan-400 shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold tracking-wide text-white">
                        ORION-9
                      </span>
                      <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded-full border ${
                        metrics.systemHealth === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : metrics.systemHealth === 'DEGRADED'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
                      }`}>
                        {metrics.systemHealth}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-white/50">
                    {metrics.currentTime}
                  </span>

                  {/* Pin Toggle */}
                  <button
                    onClick={togglePin}
                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                      isPinned 
                        ? 'bg-white/20 text-white' 
                        : 'text-white/40 hover:text-white/80 hover:bg-white/[0.08]'
                    }`}
                    title={isPinned ? 'Unpin island' : 'Pin island open'}
                    aria-label={isPinned ? 'Unpin island' : 'Pin island open'}
                    type="button"
                  >
                    {isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                  </button>

                  {/* Collapse Button */}
                  <button
                    onClick={collapse}
                    className="w-6 h-6 rounded-md text-white/40 hover:text-white/80 hover:bg-white/[0.08] flex items-center justify-center transition-colors cursor-pointer"
                    title="Collapse island"
                    aria-label="Collapse island"
                    type="button"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 2. Active Operation or Notification (1-2 real items max, progressive disclosure) */}
              <div className="rounded-xl p-2.5 bg-white/[0.03] border border-white/[0.06] transition-colors">
                {activity === 'copilot-thinking' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
                      <Brain className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-cyan-200">
                        Copilot Reasoning Active
                      </div>
                      <p className="text-[10px] text-white/50 truncate">
                        Analyzing supply chain telemetry and generating scenario proposals
                      </p>
                    </div>
                  </div>
                ) : activity === 'critical-alerts' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300 shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-rose-200">
                        {metrics.criticalExceptionsCount} High-Severity Alert{metrics.criticalExceptionsCount > 1 ? 's' : ''}
                      </div>
                      <p className="text-[10px] text-white/50 truncate">
                        Logistics exception requires operational review
                      </p>
                    </div>
                  </div>
                ) : activity === 'syncing' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-300 shrink-0">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-sky-200">
                        Synchronizing Enterprise Fabric
                      </div>
                      <p className="text-[10px] text-white/50 truncate">
                        {metrics.connectedConnectorsCount} ERP connectors actively updating
                      </p>
                    </div>
                  </div>
                ) : activity === 'simulation-running' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                      <Activity className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-purple-200">
                        Scenario Simulation Running
                      </div>
                      <p className="text-[10px] text-white/50 truncate">
                        Digital twin stress testing demand shock parameters
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="text-[11px] font-medium text-white/80">
                        All supply chain flows nominal
                      </div>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono">
                      0 disruptions
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Concise Supply-Chain Health Summary (Single Cohesive Horizontal Strip) */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2.5 flex items-center justify-around text-center">
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] uppercase tracking-wider font-semibold text-white/40 mb-0.5">
                    Exceptions
                  </div>
                  <div className={`text-[12px] font-bold font-mono ${
                    metrics.criticalExceptionsCount > 0 ? 'text-rose-300' : 'text-white/90'
                  }`}>
                    {metrics.activeExceptionsCount}
                  </div>
                </div>

                <div className="w-[1px] h-6 bg-white/[0.08]" />

                <div className="flex-1 min-w-0">
                  <div className="text-[9px] uppercase tracking-wider font-semibold text-white/40 mb-0.5">
                    Stock Coverage
                  </div>
                  <div className={`text-[12px] font-bold ${
                    metrics.stockoutRisksCount > 0 ? 'text-amber-300' : 'text-emerald-300'
                  }`}>
                    {metrics.stockoutRisksCount > 0 ? `${metrics.stockoutRisksCount} Low` : 'Optimal'}
                  </div>
                </div>

                <div className="w-[1px] h-6 bg-white/[0.08]" />

                <div className="flex-1 min-w-0">
                  <div className="text-[9px] uppercase tracking-wider font-semibold text-white/40 mb-0.5">
                    Shipments
                  </div>
                  <div className={`text-[12px] font-bold ${
                    metrics.delayedShipmentsCount > 0 ? 'text-amber-300' : 'text-white/90'
                  }`}>
                    {metrics.delayedShipmentsCount > 0 ? `${metrics.delayedShipmentsCount} Delay` : 'On Track'}
                  </div>
                </div>
              </div>

              {/* 4. Quick Actions: Open Copilot & Control Tower */}
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  onClick={() => handleAction('ai-copilot')}
                  className="flex-1 py-2 px-3 bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/[0.18] border border-white/[0.09] rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-medium text-white transition-all cursor-pointer shadow-xs"
                  type="button"
                  aria-label="Open Orion Copilot"
                >
                  <Brain className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Open Copilot</span>
                </button>

                <button
                  onClick={() => handleAction('command-center')}
                  className="flex-1 py-2 px-3 bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/[0.18] border border-white/[0.09] rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-medium text-white transition-all cursor-pointer shadow-xs"
                  type="button"
                  aria-label="Open Control Tower"
                >
                  <Activity className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Control Tower</span>
                </button>
              </div>

              {/* 5. State D — Detailed View Action */}
              <div className="border-t border-white/[0.06] pt-2 flex items-center justify-center">
                <button
                  onClick={() => handleAction('command-center')}
                  className="text-[10px] text-white/50 hover:text-white/90 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                  type="button"
                  aria-label="Open full Control Tower workspace"
                >
                  <span>Open Full Control Tower</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
