import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronUp,
  ExternalLink,
  Info,
  Pin,
  PinOff,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useOrionTheme } from '../../theme/useOrionTheme';
import { useToast } from '../../../store/ToastContext';
import { useOptionalSupplyChain } from '../../../store/SupplyChainContext';
import { dbManager } from '../../../core/database/DatabaseConnectionManager';
import { ORION_OS_METADATA } from '../../constants/OrionOsMetadata';
import { DockPosition } from '../../../theme/themeTypes';
import { cn } from '../../../lib/utils';
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
  activities,
  metrics,
  isPinned,
  isReducedMotion,
  onTogglePin,
  onCollapse,
  onAction,
  onDismissActivity,
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
    : { opacity: 0, scaleY: 0.90, transformOrigin: 'top center' };

  const motionAnimate = isReducedMotion
    ? { opacity: 1 }
    : { opacity: 1, scaleY: 1, transformOrigin: 'top center' };

  const motionExit = isReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, scaleY: 0.90, transformOrigin: 'top center' };

  return (
    <motion.div
      id="dynamic-island-expanded-surface"
      data-testid="dynamic-island-expanded-panel"
      initial={motionInitial}
      animate={motionAnimate}
      exit={motionExit}
      transition={
        isReducedMotion
          ? { duration: 0.08 }
          : { type: 'spring', stiffness: 420, damping: 32 }
      }
      style={{ zIndex: 10020 }}
      className={cn(
        "relative overflow-visible rounded-b-[24px] rounded-t-none border-b border-l border-r border-t-0 select-none pointer-events-auto transition-colors w-[min(580px,calc(100vw-24px))]",
        isDark
          ? "bg-[#181B22] text-white border-white/[0.12] shadow-[0_24px_54px_rgba(0,0,0,0.75)]"
          : "bg-white text-[#202631] border-[#E1E5EA] shadow-[0_20px_48px_rgba(15,23,42,0.12),0_0_0_1px_rgba(15,23,42,0.04)]"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Seamless Left Concave Fillet connecting to top System Bar at top-0 */}
      <svg
        className={cn(
          "absolute -left-3 top-0 w-3 h-3 pointer-events-none hidden sm:block",
          isDark ? "text-[#181B22] fill-current" : "text-white fill-current"
        )}
        viewBox="0 0 12 12"
        aria-hidden="true"
      >
        <path d="M 0,0 L 12,0 L 12,12 Q 12,0 0,0 Z" />
      </svg>

      {/* Seamless Right Concave Fillet connecting to top System Bar at top-0 */}
      <svg
        className={cn(
          "absolute -right-3 top-0 w-3 h-3 pointer-events-none hidden sm:block",
          isDark ? "text-[#181B22] fill-current" : "text-white fill-current"
        )}
        viewBox="0 0 12 12"
        aria-hidden="true"
      >
        <path d="M 0,12 L 0,0 L 12,0 Q 0,0 0,12 Z" />
      </svg>

      {/* 1. Orion System Header Row (Proprietary Orion System Controls — Zero Traffic Lights) */}
      <div className={cn(
        "flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b",
        isDark ? "border-white/[0.08]" : "border-[#EDF0F3]"
      )}>
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
              onTogglePin();
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
              onAction('command-center');
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
              onCollapse();
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

      {/* 2. Subheader Row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 text-xs">
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

      {/* 3. Hero Operational Status Banner with Pulsar Radar Graphic */}
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

          {/* Exact Radar Target Waveform matching reference */}
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

        {/* Background ambient warm sunset glow */}
        <div className={cn(
          "absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l via-transparent to-transparent pointer-events-none",
          isDark ? "from-[#E5A84B]/15" : "from-[#E5A84B]/10"
        )} />
      </div>

      {/* 4. Live Operational KPI Metric Cards (4 Grid Columns) */}
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

      {/* 5. Action Row Buttons */}
      <div className="grid grid-cols-3 gap-2.5 px-4 pt-3 pb-4">
        {/* Open Copilot */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAction('ai-copilot');
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

      {/* 6. Active Transient Notifications Queue (if present, renders cleanly) */}
      {activities.length > 0 && (
        <div className={cn(
          "flex flex-col gap-1.5 px-4 pb-3 pt-1 border-t max-h-[140px] overflow-y-auto custom-scrollbar",
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
                    else if (item.actionAppId) onAction(item.actionAppId);
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
                  onDismissActivity(item.id);
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
    </motion.div>
  );
});

export default DynamicIslandExpanded;
