import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  Pin,
  PinOff,
  Share2,
  MoreHorizontal,
  Sparkles,
  ShieldCheck,
  X,
  ExternalLink,
} from 'lucide-react';
import { ORION_SPRING_SNAPPY } from '../../motion/OrionMotion';
import { useOrionTheme } from '../../theme/useOrionTheme';
import { useToast } from '../../../store/ToastContext';
import { useOptionalSupplyChain } from '../../../store/SupplyChainContext';
import { dbManager } from '../../../core/database/DatabaseConnectionManager';
import { ORION_OS_METADATA } from '../../constants/OrionOsMetadata';
import { DockPosition } from '../../../theme/themeTypes';
import {
  DynamicIslandActivity,
  DynamicIslandEventItem,
  DynamicIslandMetrics,
} from './DynamicIslandTypes';

export interface DynamicIslandExpandedProps {
  activity: DynamicIslandActivity;
  activities: DynamicIslandEventItem[];
  metrics: DynamicIslandMetrics;
  isPinned: boolean;
  isReducedMotion: boolean;
  dockPosition?: DockPosition;
  activeNotification?: DynamicIslandEventItem | null;
  onTogglePin: () => void;
  onCollapse: () => void;
  onAction: (appIdOrCb: string | (() => void)) => void;
  onDismissActivity: (id: string) => void;
  onDismissNotification?: (id: string) => void;
}

export const DynamicIslandExpanded: React.FC<DynamicIslandExpandedProps> = React.memo(({
  activity,
  activities,
  metrics,
  isPinned,
  isReducedMotion,
  dockPosition = 'bottom',
  activeNotification,
  onTogglePin,
  onCollapse,
  onAction,
  onDismissActivity,
  onDismissNotification,
}) => {
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

  const motionInitial = isReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.96, y: -6 };

  const motionAnimate = isReducedMotion
    ? { opacity: 1 }
    : { opacity: 1, scale: 1, y: 0 };

  const motionExit = isReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.96, y: -6 };

  return (
    <motion.div
      id="dynamic-island-expanded-surface"
      data-testid="dynamic-island-expanded-panel"
      initial={motionInitial}
      animate={motionAnimate}
      exit={motionExit}
      transition={isReducedMotion ? { duration: 0.08 } : ORION_SPRING_SNAPPY}
      style={{ zIndex: 10020 }}
      className="relative overflow-visible text-white border-b border-l border-r border-white/[0.14] border-t-0 rounded-b-[24px] shadow-[0_24px_64px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.06)] bg-[#181B22]/96 backdrop-blur-[28px] w-[min(580px,calc(100vw-24px))] transition-colors select-none pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Seamless Left Concave Fillet connecting to top System Bar at 44px */}
      <svg
        className="absolute -left-3 top-[44px] w-3 h-3 text-[#181B22] fill-current pointer-events-none hidden sm:block"
        viewBox="0 0 12 12"
        aria-hidden="true"
      >
        <path d="M 0,0 L 12,0 L 12,12 Q 12,0 0,0 Z" />
      </svg>

      {/* Seamless Right Concave Fillet connecting to top System Bar at 44px */}
      <svg
        className="absolute -right-3 top-[44px] w-3 h-3 text-[#181B22] fill-current pointer-events-none hidden sm:block"
        viewBox="0 0 12 12"
        aria-hidden="true"
      >
        <path d="M 0,12 L 0,0 L 12,0 Q 0,0 0,12 Z" />
      </svg>

      {/* 1. Island Header (Chrome Row matching reference) */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-white/[0.08]">
        {/* Left: Traffic Lights & Orion-9 Identity */}
        <div className="flex items-center gap-3">
          {/* Traffic Lights */}
          <div className="flex items-center gap-1.5 group" data-no-drag="true">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCollapse();
              }}
              aria-label="Collapse Dynamic Island"
              title="Collapse Dynamic Island"
              className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center text-[8px] text-black/60 font-bold leading-none"
            >
              <span className="opacity-0 group-hover:opacity-100">×</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCollapse();
              }}
              aria-label="Minimize"
              title="Minimize Dynamic Island"
              className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center text-[8px] text-black/60 font-bold leading-none"
            >
              <span className="opacity-0 group-hover:opacity-100">–</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAction('command-center');
              }}
              aria-label="Open Full Control Tower"
              title="Open Full Workspace"
              className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center text-[8px] text-black/60 font-bold leading-none"
            >
              <span className="opacity-0 group-hover:opacity-100">+</span>
            </button>
          </div>

          {/* O9 App Icon Badge & Title */}
          <div className="flex items-center gap-2 pl-1 pointer-events-none">
            <div className="w-6 h-6 rounded-lg bg-black/40 border border-white/20 flex items-center justify-center font-bold font-mono text-[11px] text-[#D6A65C] shadow-xs">
              09
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold tracking-tight text-white/95 uppercase font-mono">
                ORION-9 • SUPPLY CHAIN OS
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-[#D6A65C]/15 text-[#D6A65C] border border-[#D6A65C]/35">
                {dbEnv}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions (Pin, Share, More) */}
        <div className="flex items-center gap-1 text-white/60">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            aria-label={isPinned ? 'Unpin Island' : 'Pin Island'}
            title={isPinned ? 'Unpin Island (Collapses on blur)' : 'Pin Island (Stays Open)'}
            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            {isPinned ? <PinOff className="w-3.5 h-3.5 text-cyan-400" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share Session"
            title="Share Session"
            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAction('command-center');
            }}
            aria-label="Open Full Control Tower"
            title="Open Full Workspace"
            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Subheader Row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 text-xs text-white/60">
        <span className="font-medium tracking-wide text-white/70">Enterprise Control Tower</span>
        <span className="font-mono text-[10px] text-white/40">Real-time Telemetry</span>
      </div>

      {/* 3. Hero Operational Status Banner with Pulsar Radar Graphic */}
      <div className="mx-4 mt-1 relative overflow-hidden rounded-2xl border border-white/[0.10] bg-white/[0.04] p-4 flex items-center justify-between backdrop-blur-md">
        {/* Left: System Status Shield & Headline */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.30)]">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">System Nominal</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399] animate-pulse" />
            </div>
            <p className="text-xs text-white/60 mt-0.5">
              {criticalCount > 0 
                ? `${criticalCount} critical exceptions pending resolution` 
                : 'All supply chain flows are healthy'}
            </p>
          </div>
        </div>

        {/* Right: Version & Pulsar Radar Emission Waveform SVG */}
        <div className="flex items-center gap-3 z-10">
          <div className="text-right">
            <div className="text-xs font-bold text-white/90 tracking-wide font-mono">
              Version {ORION_OS_METADATA.version}
            </div>
            <div className="text-[10px] text-sky-400 font-bold tracking-wider uppercase font-mono">
              {ORION_OS_METADATA.releaseCodename} RELEASE
            </div>
          </div>

          {/* Exact Radar Target Waveform matching reference */}
          <div className="w-11 h-10 text-sky-400 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 48 48" fill="none" className="w-full h-full stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="24" cy="24" r="16" strokeDasharray="3 3" opacity="0.4" />
              <circle cx="24" cy="24" r="11" opacity="0.8" />
              <circle cx="24" cy="24" r="5" className="fill-sky-400/20" />
              <line x1="24" y1="4" x2="24" y2="12" />
              <line x1="24" y1="36" x2="24" y2="44" />
              <line x1="4" y1="24" x2="12" y2="24" />
              <line x1="36" y1="24" x2="44" y2="24" />
              <line x1="18" y1="24" x2="30" y2="24" strokeWidth="2" />
              <line x1="24" y1="18" x2="24" y2="30" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Background ambient warm sunset glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-[#E5A84B]/15 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* 4. Live Operational KPI Metric Cards (4 Grid Columns) */}
      <div className="grid grid-cols-4 gap-2 px-4 pt-3">
        {/* Card 1: Exceptions */}
        <div className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm flex flex-col justify-between">
          <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
            Exceptions
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-base font-bold font-mono ${criticalCount > 0 ? 'text-rose-400' : 'text-white/95'}`}>
              {exceptionsCount}
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center">
              ↓ 100%
            </span>
          </div>
        </div>

        {/* Card 2: Stock Coverage */}
        <div className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm flex flex-col justify-between">
          <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
            Stock Coverage
          </span>
          <div className="mt-1">
            <span className="text-xs font-bold text-emerald-400 font-mono">
              Optimal
            </span>
          </div>
        </div>

        {/* Card 3: Shipments */}
        <div className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm flex flex-col justify-between">
          <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
            Shipments
          </span>
          <div className="mt-1">
            <span className="text-xs font-bold text-white/95">
              On Track
            </span>
          </div>
        </div>

        {/* Card 4: Connectors */}
        <div className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm flex flex-col justify-between">
          <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
            Connectors
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399]" />
            <span className="text-xs font-bold text-white/95 font-mono">
              {connectorsCount} Online
            </span>
          </div>
        </div>
      </div>

      {/* 5. Action Row Buttons */}
      <div className="grid grid-cols-3 gap-2.5 px-4 pt-3 pb-4">
        {/* Open Copilot */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAction('ai-copilot');
          }}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.12] bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Open Copilot</span>
        </button>

        {/* Control Tower (Active Glowing Gold Button) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAction('command-center');
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
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.12] bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
        >
          <Bell className="w-3.5 h-3.5 text-white/70" />
          <span>Alerts ({criticalCount})</span>
        </button>
      </div>

      {/* 6. Active Transient Notifications Queue (if present, renders cleanly) */}
      {activities.length > 0 && (
        <div className="flex flex-col gap-1.5 px-4 pb-3 pt-1 border-t border-white/[0.08] max-h-[140px] overflow-y-auto custom-scrollbar">
          {activities.map((item) => (
            <div
              key={item.id}
              data-testid={item.isNotification ? 'dynamic-island-notification-item' : 'dynamic-island-activity-item'}
              className="rounded-xl border border-white/10 p-2.5 bg-white/[0.04] flex items-start gap-2.5 text-xs backdrop-blur-sm"
            >
              <div className="mt-0.5 shrink-0">
                {item.severity === 'critical' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                ) : item.severity === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Info className="w-3.5 h-3.5 text-sky-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                {item.appName && (
                  <div className="text-[9px] font-bold text-white/50 uppercase tracking-wider mb-0.5">
                    {item.appName}
                  </div>
                )}
                <div className="font-semibold text-white/95 text-[11px] truncate">{item.title}</div>
                {item.message && <div className="text-white/60 text-[10px] break-words">{item.message}</div>}
              </div>
              {item.actionLabel && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.onAction) item.onAction();
                    else if (item.actionAppId) onAction(item.actionAppId);
                  }}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[10px] shrink-0 transition-colors cursor-pointer"
                >
                  {item.actionLabel}
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismissActivity(item.id);
                }}
                className="text-white/40 hover:text-white p-0.5 rounded cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
});

export default DynamicIslandExpanded;
