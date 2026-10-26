/**
 * ORION-9 DYNAMIC ISLAND
 * Polished macOS/iOS-inspired interactive Dynamic Island for both Web OS and Native Tauri Desktop.
 * Provides real-time system telemetry, Copilot intelligence status, and 1-click supply chain navigation.
 */

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  Activity, 
  Search, 
  Sliders, 
  Pin, 
  PinOff, 
  ChevronUp, 
  ChevronDown, 
  Monitor, 
  Cloud, 
  AlertTriangle, 
  Box, 
  Truck, 
  FileText, 
  RefreshCw, 
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Bell
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

  // Outside click handler to collapse when not pinned
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

  return (
    <div 
      ref={islandRef}
      className="absolute left-1/2 -translate-x-1/2 top-1.5 z-[2147483640] flex flex-col items-center select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label="Orion-9 Dynamic Island System Telemetry"
    >
      <motion.div
        layout
        transition={springConfig}
        className={`relative overflow-hidden bg-[#07090e]/92 backdrop-blur-2xl backdrop-saturate-[180%] border border-white/[0.14] shadow-[0_16px_40px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.20)] text-white transition-colors duration-200 ${
          isExpanded 
            ? 'w-[min(calc(100vw-24px),460px)] rounded-[22px] p-3.5 sm:p-4' 
            : 'h-[30px] sm:h-[32px] rounded-full px-3 sm:px-3.5 flex items-center gap-2 cursor-pointer hover:bg-[#07090e]/98 hover:border-white/[0.22] hover:shadow-[0_8px_24px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.25)]'
        }`}
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            /* COMPACT MODE PILL */
            <motion.div
              key="compact"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
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
              className="flex items-center gap-2 w-full h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-full"
            >
              {/* Orion Star Symbol */}
              <div className="relative flex items-center justify-center w-3.5 h-3.5 shrink-0 text-cyan-400">
                <Sparkles className="w-3.5 h-3.5 drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]" />
              </div>

              {/* Status Pulse Dot */}
              <div className="relative flex items-center justify-center w-2 h-2 shrink-0">
                {activity === 'copilot-thinking' && (
                  <>
                    <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
                  </>
                )}
                {activity === 'critical-alerts' && (
                  <>
                    <span className="absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]" />
                  </>
                )}
                {activity === 'syncing' && (
                  <RefreshCw className="w-2.5 h-2.5 text-blue-400 animate-spin" />
                )}
                {activity === 'notification' && (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
                )}
                {activity === 'idle' && (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                )}
              </div>

              {/* Dynamic Activity Label */}
              <div className="flex items-center gap-1.5 truncate min-w-0">
                {activity === 'copilot-thinking' ? (
                  <span className="text-[11px] font-semibold tracking-wider text-cyan-300 uppercase truncate">
                    Copilot Thinking
                  </span>
                ) : activity === 'critical-alerts' ? (
                  <span className="text-[11px] font-semibold tracking-wider text-rose-300 uppercase truncate">
                    {metrics.criticalExceptionsCount} Alert{metrics.criticalExceptionsCount > 1 ? 's' : ''}
                  </span>
                ) : activity === 'syncing' ? (
                  <span className="text-[11px] font-semibold tracking-wider text-blue-300 uppercase truncate">
                    Fabric Syncing
                  </span>
                ) : metrics.activeAppName ? (
                  <span className="text-[11px] font-medium tracking-wide text-white/90 truncate max-w-[140px] sm:max-w-[200px]">
                    {metrics.activeAppName}
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold tracking-wider text-white/80 uppercase truncate">
                    System Ready
                  </span>
                )}
              </div>

              {/* Unread Notifications Pill */}
              {metrics.unreadNotificationsCount > 0 && (
                <div 
                  className="flex items-center gap-0.5 px-1.5 py-0.2 bg-rose-500/80 rounded-full text-[9px] font-bold text-white shadow-xs shrink-0"
                  title={`${metrics.unreadNotificationsCount} unread notification${metrics.unreadNotificationsCount > 1 ? 's' : ''}`}
                >
                  <Bell className="w-2.5 h-2.5" />
                  <span>{metrics.unreadNotificationsCount}</span>
                </div>
              )}

              {/* Expand Indicator */}
              <div className="ml-0.5 text-white/40 hover:text-white/80 shrink-0">
                <ChevronDown className="w-3 h-3" />
              </div>
            </motion.div>
          ) : (
            /* EXPANDED MODE PANEL */
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={springConfig}
              className="flex flex-col gap-3 w-full"
            >
              {/* SECTION A: SYSTEM BAR & TELEMETRY */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-cyan-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-mono font-bold tracking-wider text-white">
                        {metrics.currentTime}
                      </span>
                      <span className="text-[10px] text-white/40 font-medium">
                        • {metrics.currentDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400/90">
                        {metrics.systemHealth}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Runtime Pill & Action Controls */}
                <div className="flex items-center gap-1.5">
                  <div 
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border ${
                      metrics.isNativeDesktop
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                    }`}
                    title={metrics.isNativeDesktop ? 'Running in Native Tauri Desktop Runtime' : 'Running in Web Cloud OS Runtime'}
                  >
                    {metrics.isNativeDesktop ? (
                      <>
                        <Monitor className="w-2.5 h-2.5" />
                        <span>Tauri Desktop</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-2.5 h-2.5" />
                        <span>Web Cloud OS</span>
                      </>
                    )}
                  </div>

                  {/* Pin Toggle Button */}
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

              {/* SECTION B: ORION AI COPILOT INTELLIGENCE */}
              <div className="bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.08] rounded-[16px] p-2.5 sm:p-3 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-[10px] bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold tracking-wide text-white">
                          Orion Copilot AI
                        </span>
                        <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded-full ${
                          metrics.copilotStatus === 'thinking' || metrics.copilotStatus === 'analyzing'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {metrics.copilotStatus}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/50 leading-tight">
                        {metrics.copilotStatus === 'thinking' || metrics.copilotStatus === 'analyzing'
                          ? 'Evaluating supply chain parameters...'
                          : 'Intelligence core standby. Ask questions or run scenarios.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAction('ai-copilot')}
                    className="px-2.5 py-1 bg-white/[0.08] hover:bg-white/[0.16] active:bg-white/[0.22] text-white text-[10px] font-semibold rounded-lg border border-white/[0.12] transition-all cursor-pointer flex items-center gap-1 shrink-0"
                    type="button"
                  >
                    <span>Launch</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

              {/* SECTION C: OPERATIONS RADAR */}
              <div>
                <div className="flex items-center justify-between px-1 mb-1.5">
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/50">
                    <Activity className="w-3 h-3 text-cyan-400" />
                    <span>Operations Radar</span>
                  </div>
                  <span className="text-[9px] text-white/40">Live Telemetry</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {/* Card 1: Exceptions */}
                  <button
                    onClick={() => handleAction('exceptions')}
                    className={`p-2 rounded-[12px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      metrics.criticalExceptionsCount > 0
                        ? 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20'
                        : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.07]'
                    }`}
                    type="button"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <AlertTriangle className={`w-3.5 h-3.5 ${metrics.criticalExceptionsCount > 0 ? 'text-rose-400' : 'text-white/40'}`} />
                      <span className={`text-[12px] font-bold font-mono ${metrics.criticalExceptionsCount > 0 ? 'text-rose-300' : 'text-white/90'}`}>
                        {metrics.activeExceptionsCount}
                      </span>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-white/90">Exceptions</div>
                      <div className="text-[9px] text-white/40 truncate">
                        {metrics.criticalExceptionsCount > 0 ? `${metrics.criticalExceptionsCount} critical` : 'All nominal'}
                      </div>
                    </div>
                  </button>

                  {/* Card 2: Stockout Risks */}
                  <button
                    onClick={() => handleAction('inventory')}
                    className={`p-2 rounded-[12px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      metrics.stockoutRisksCount > 0
                        ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
                        : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.07]'
                    }`}
                    type="button"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Box className={`w-3.5 h-3.5 ${metrics.stockoutRisksCount > 0 ? 'text-amber-400' : 'text-white/40'}`} />
                      <span className={`text-[12px] font-bold font-mono ${metrics.stockoutRisksCount > 0 ? 'text-amber-300' : 'text-white/90'}`}>
                        {metrics.stockoutRisksCount}
                      </span>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-white/90">Stock Risks</div>
                      <div className="text-[9px] text-white/40 truncate">
                        {metrics.stockoutRisksCount > 0 ? 'Low coverage' : 'Optimal stock'}
                      </div>
                    </div>
                  </button>

                  {/* Card 3: Delayed Shipments */}
                  <button
                    onClick={() => handleAction('shipments')}
                    className={`p-2 rounded-[12px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      metrics.delayedShipmentsCount > 0
                        ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
                        : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.07]'
                    }`}
                    type="button"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Truck className={`w-3.5 h-3.5 ${metrics.delayedShipmentsCount > 0 ? 'text-amber-400' : 'text-white/40'}`} />
                      <span className={`text-[12px] font-bold font-mono ${metrics.delayedShipmentsCount > 0 ? 'text-amber-300' : 'text-white/90'}`}>
                        {metrics.delayedShipmentsCount}
                      </span>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-white/90">Delayed</div>
                      <div className="text-[9px] text-white/40 truncate">
                        {metrics.delayedShipmentsCount > 0 ? 'Transit lag' : 'On schedule'}
                      </div>
                    </div>
                  </button>

                  {/* Card 4: Open Purchase Orders */}
                  <button
                    onClick={() => handleAction('procurement')}
                    className="p-2 rounded-[12px] border bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.07] text-left transition-all cursor-pointer flex flex-col justify-between"
                    type="button"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <FileText className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-[12px] font-bold font-mono text-white/90">
                        {metrics.openPurchaseOrdersCount}
                      </span>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-white/90">Open POs</div>
                      <div className="text-[9px] text-white/40 truncate">Active orders</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* SECTION D: INTEGRATION FABRIC STATUS */}
              <div 
                onClick={() => handleAction('integrations')}
                className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-[14px] p-2 sm:p-2.5 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-300 shrink-0">
                    <RefreshCw className={`w-3 h-3 ${metrics.activeSyncJobsCount > 0 ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-white/90 flex items-center gap-1.5">
                      <span>Integration Fabric</span>
                      <span className="text-[9px] text-white/40">• {metrics.connectedConnectorsCount} Connectors</span>
                    </div>
                    <div className="text-[9px] text-white/40">
                      {metrics.activeSyncJobsCount > 0 
                        ? `${metrics.activeSyncJobsCount} sync jobs currently processing` 
                        : `Synchronized ${metrics.lastSyncTimestamp ? `(${metrics.lastSyncTimestamp})` : ''}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-medium shrink-0">
                  <span>Connectors</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </div>
              </div>

              {/* SECTION E: QUICK ACTION COMMAND BAR */}
              <div className="border-t border-white/[0.08] pt-2.5 flex items-center justify-between gap-1">
                <button
                  onClick={() => handleAction('ai-copilot')}
                  className="flex-1 py-1.5 px-2 bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] rounded-[10px] flex items-center justify-center gap-1.5 text-[10px] font-medium text-white/90 transition-all cursor-pointer"
                  type="button"
                >
                  <Brain className="w-3 h-3 text-indigo-400" />
                  <span>Copilot</span>
                </button>

                <button
                  onClick={() => handleAction('command-center')}
                  className="flex-1 py-1.5 px-2 bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] rounded-[10px] flex items-center justify-center gap-1.5 text-[10px] font-medium text-white/90 transition-all cursor-pointer"
                  type="button"
                >
                  <Activity className="w-3 h-3 text-cyan-400" />
                  <span>Control Tower</span>
                </button>

                <button
                  onClick={() => handleAction('search')}
                  className="flex-1 py-1.5 px-2 bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] rounded-[10px] flex items-center justify-center gap-1.5 text-[10px] font-medium text-white/90 transition-all cursor-pointer"
                  type="button"
                >
                  <Search className="w-3 h-3 text-white/60" />
                  <span>Search</span>
                </button>

                <button
                  onClick={() => handleAction('settings')}
                  className="flex-1 py-1.5 px-2 bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] rounded-[10px] flex items-center justify-center gap-1.5 text-[10px] font-medium text-white/90 transition-all cursor-pointer"
                  type="button"
                >
                  <Sliders className="w-3 h-3 text-white/60" />
                  <span>Settings</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
