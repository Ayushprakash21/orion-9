import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  Bell,
  Brain,
  CheckCircle2,
  Info,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import {
  DynamicIslandActivity,
  DynamicIslandEventItem,
  DynamicIslandMetrics,
  DynamicIslandPresentationMode,
  DynamicIslandSurfaceState,
} from './DynamicIslandTypes';
import { useOrionTheme } from '../../theme/useOrionTheme';
import { ORION_OS_METADATA } from '../../constants/OrionOsMetadata';

interface DynamicIslandCapsuleProps {
  activity: DynamicIslandActivity;
  surfaceState: DynamicIslandSurfaceState;
  presentationMode?: DynamicIslandPresentationMode;
  metrics: DynamicIslandMetrics;
  primaryEvent: DynamicIslandEventItem | null;
  activeNotification: DynamicIslandEventItem | null;
  isExpanded: boolean;
  isCompactOverMaximized: boolean;
  isReducedMotion?: boolean;
  onToggleExpand: () => void;
  onDismissNotification?: (id: string) => void;
}

export const DynamicIslandCapsule: React.FC<DynamicIslandCapsuleProps> = React.memo(({
  activity,
  surfaceState,
  presentationMode = 'compact',
  metrics,
  primaryEvent,
  activeNotification,
  isExpanded,
  isCompactOverMaximized,
  isReducedMotion = false,
  onToggleExpand,
  onDismissNotification,
}) => {
  const { isDark } = useOrionTheme();

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
        return 'border-slate-300 bg-[rgba(255,255,255,0.96)] hover:border-slate-400';
      }
    }

    if (isDark) {
      if (activity === 'critical-alert') return 'border-rose-500/45 bg-[rgba(34,12,18,0.94)] hover:border-rose-400/60';
      if (activity === 'copilot-thinking') return 'border-indigo-400/45 bg-[rgba(16,18,36,0.92)] hover:border-indigo-300/60';
      if (activity === 'connector-sync') return 'border-sky-400/40 bg-[rgba(12,24,36,0.92)] hover:border-sky-300/60';
      return 'border-white/[0.14] border-t-0 bg-[#181B22] hover:border-white/30 shadow-[0_8px_24px_rgba(0,0,0,0.65)]';
    } else {
      if (activity === 'critical-alert') return 'border-rose-500/45 bg-[rgba(255,242,244,0.95)] hover:border-rose-600/60';
      if (activity === 'copilot-thinking') return 'border-indigo-500/40 bg-[rgba(245,247,255,0.95)] hover:border-indigo-600/55';
      if (activity === 'connector-sync') return 'border-sky-500/40 bg-[rgba(242,249,255,0.95)] hover:border-sky-600/55';
      return 'border-[rgba(15,23,42,0.16)] border-t-0 bg-[rgba(255,255,255,0.94)] hover:border-[rgba(15,23,42,0.28)] shadow-[0_4px_16px_rgba(15,23,42,0.10)]';
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
    if (sev === 'info') {
      return <Info className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-sky-400' : 'text-sky-700'}`} />;
    }
    return <Bell className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-700'}`} />;
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
    <motion.div
      layout
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      aria-label="Expand Orion Dynamic Island"
      data-testid="dynamic-island-capsule"
      data-surface-state={surfaceState}
      data-compact-over-maximized={isCompactOverMaximized ? 'true' : 'false'}
      {...(activeNotification ? { 'data-has-notification': 'true', 'data-notification-id': activeNotification.id } : {})}
      onClick={onToggleExpand}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggleExpand();
        } else if (e.key === 'Escape' && activeNotification) {
          e.preventDefault();
          onDismissNotification?.(activeNotification.id);
        }
      }}
      transition={
        isReducedMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 450, damping: 32 }
      }
      style={{ zIndex: 10015 }}
      className={`group relative flex items-center justify-between px-3.5 sm:px-4 rounded-full sm:rounded-t-none sm:rounded-b-2xl cursor-pointer select-none border transition-colors duration-200 pointer-events-auto w-[min(520px,calc(100vw-24px))] min-w-[320px] ${
        isDark
          ? 'shadow-[0_8px_24px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.12)]'
          : 'shadow-[0_4px_16px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.9)]'
      } ${pillHeightClass} ${statusToneClass} ${
        isExpanded ? 'opacity-90' : ''
      }`}
    >
      {/* Seamless Left Concave Transition Fillet connecting to top System Bar */}
      <svg
        className={`absolute -left-2.5 top-0 w-2.5 h-2.5 pointer-events-none hidden sm:block ${
          isDark ? 'text-[#181B22] fill-current' : 'text-white fill-current'
        }`}
        viewBox="0 0 10 10"
        aria-hidden="true"
      >
        <path d="M 0,0 L 10,0 L 10,10 Q 10,0 0,0 Z" />
      </svg>

      {/* Seamless Right Concave Transition Fillet connecting to top System Bar */}
      <svg
        className={`absolute -right-2.5 top-0 w-2.5 h-2.5 pointer-events-none hidden sm:block ${
          isDark ? 'text-[#181B22] fill-current' : 'text-white fill-current'
        }`}
        viewBox="0 0 10 10"
        aria-hidden="true"
      >
        <path d="M 0,10 L 0,0 L 10,0 Q 0,0 0,10 Z" />
      </svg>
      <div className="sr-only" role="status" aria-live={activeNotification?.severity === 'critical' || activity === 'critical-alert' ? 'assertive' : 'polite'}>
        {activeNotification ? `${activeNotification.appName || 'Notification'}: ${activeNotification.title || activeNotification.message}` : activity === 'system-ready' ? 'System Ready' : activity}
      </div>

      <AnimatePresence mode="wait">
        {activeNotification ? (
          <motion.div
            key={`notif-${activeNotification.id}`}
            data-testid="dynamic-island-notification-preview"
            initial={isReducedMotion ? false : { opacity: 0, scale: 0.96, y: -2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={isReducedMotion ? undefined : { opacity: 0, scale: 0.96, y: 2 }}
            transition={{ duration: isReducedMotion ? 0.04 : 0.18 }}
            className="flex items-center justify-between w-full min-w-0 gap-2"
          >
            {/* Left Anchor: Icon + Source App Name + Separator + Message Preview */}
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

            {/* Right: Dismiss button or micro-badge */}
            <div className="flex items-center gap-1.5 shrink-0 ml-1">
              {activeNotification.dismissible !== false && (
                <button
                  type="button"
                  data-testid="dynamic-island-dismiss-btn"
                  aria-label="Dismiss notification"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismissNotification?.(activeNotification.id);
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
          </motion.div>
        ) : (
          <motion.div
            key={activity}
            initial={isReducedMotion ? false : { opacity: 0, scale: 0.96, y: -2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={isReducedMotion ? undefined : { opacity: 0, scale: 0.96, y: 2 }}
            transition={{ duration: isReducedMotion ? 0.04 : 0.18 }}
            className="flex items-center justify-between w-full min-w-0"
          >
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
                    <span className="w-5 h-5 rounded-full bg-white/10 border border-sky-400/50 flex items-center justify-center font-bold font-mono text-[9px] text-sky-400 shadow-xs">
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
                  <div className="h-4.5 w-px bg-white/15 mx-0.5 hidden xs:block" />

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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
