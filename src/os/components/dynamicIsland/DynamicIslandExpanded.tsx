import React from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  Bell,
  Brain,
  CheckCircle2,
  Info,
  Pin,
  PinOff,
  RefreshCw,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { ORION_SPRING_SNAPPY } from '../../motion/OrionMotion';
import { useOrionTheme } from '../../theme/useOrionTheme';
import { DockPosition } from '../../../theme/themeTypes';
import {
  DynamicIslandActivity,
  DynamicIslandEventItem,
  DynamicIslandMetrics,
} from './DynamicIslandTypes';

interface DynamicIslandExpandedProps {
  activity: DynamicIslandActivity;
  activities: DynamicIslandEventItem[];
  metrics: DynamicIslandMetrics;
  isPinned: boolean;
  isReducedMotion: boolean;
  dockPosition?: DockPosition;
  onTogglePin: () => void;
  onCollapse: () => void;
  onAction: (appIdOrCb: string | (() => void)) => void;
  onDismissActivity: (id: string) => void;
}

export const DynamicIslandExpanded: React.FC<DynamicIslandExpandedProps> = React.memo(({
  activity,
  activities,
  metrics,
  isPinned,
  isReducedMotion,
  dockPosition = 'bottom',
  onTogglePin,
  onCollapse,
  onAction,
  onDismissActivity,
}) => {
  const { isDark } = useOrionTheme();
  const isVerticalDock = dockPosition === 'left' || dockPosition === 'right';

  const motionInitial = isReducedMotion
    ? { opacity: 0 }
    : isVerticalDock
      ? { opacity: 0, width: 0 }
      : { opacity: 0, height: 0 };

  const motionAnimate = isReducedMotion
    ? { opacity: 1 }
    : isVerticalDock
      ? { opacity: 1, width: 'auto' }
      : { opacity: 1, height: 'auto' };

  const motionExit = isReducedMotion
    ? { opacity: 0 }
    : isVerticalDock
      ? { opacity: 0, width: 0 }
      : { opacity: 0, height: 0 };

  const neutralCardClass = isDark
    ? 'bg-white/[0.05] border-white/[0.10]'
    : 'bg-slate-900/[0.04] border-slate-900/[0.10]';

  const statusToneBadge = (() => {
    if (activity === 'critical-alert') {
      return isDark
        ? 'bg-rose-500/15 border-rose-400/35 text-rose-300'
        : 'bg-rose-500/12 border-rose-600/30 text-rose-800';
    }
    if (activity === 'copilot-thinking') {
      return isDark
        ? 'bg-indigo-500/15 border-indigo-400/35 text-indigo-300'
        : 'bg-indigo-500/12 border-indigo-600/30 text-indigo-800';
    }
    if (activity === 'connector-sync') {
      return isDark
        ? 'bg-sky-500/15 border-sky-400/35 text-sky-300'
        : 'bg-sky-500/12 border-sky-600/30 text-sky-800';
    }
    if (activity === 'simulation-running') {
      return isDark
        ? 'bg-purple-500/15 border-purple-400/35 text-purple-300'
        : 'bg-purple-500/12 border-purple-600/30 text-purple-800';
    }
    return isDark
      ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
      : 'bg-emerald-600/10 border-emerald-700/25 text-emerald-800';
  })();

  const statusLabel =
    activity === 'critical-alert'
      ? `${metrics.criticalExceptionsCount} Critical`
      : activity === 'copilot-thinking'
        ? 'Copilot Active'
        : activity === 'connector-sync'
          ? 'Syncing ERP'
          : activity === 'simulation-running'
            ? 'Simulation'
            : 'Nominal';

  return (
    <motion.div
      id="dynamic-island-expanded-surface"
      data-testid="dynamic-island-expanded-panel"
      initial={motionInitial}
      animate={motionAnimate}
      exit={motionExit}
      transition={isReducedMotion ? { duration: 0.08 } : ORION_SPRING_SNAPPY}
      className={`overflow-hidden text-[var(--orion-text-primary)] rounded-[20px] border shadow-[0_24px_60px_rgba(0,0,0,0.60)] backdrop-blur-[36px] ${
        isDark
          ? 'bg-[#141824]/92 border-white/[0.16]'
          : 'bg-white/94 border-slate-900/[0.14] shadow-[0_20px_48px_rgba(15,23,42,0.18)]'
      } w-[min(460px,calc(100vw-32px))] max-h-[min(540px,calc(100dvh-120px))]`}
    >
      <div className="px-3.5 pt-3 pb-2.5 flex flex-col gap-2.5 overflow-y-auto custom-scrollbar max-h-[inherit]">
        {/* 1. Connected System Header Row */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--orion-border)]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[var(--orion-surface-hover)] border border-[var(--orion-border-strong)] text-[10px] font-bold text-[var(--orion-text-primary)] shrink-0">
              O9
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[11px] font-semibold tracking-wide text-[var(--orion-text-primary)] truncate">
                  ORION-9 OS 21.1 • {metrics.runtimeMode}
                </span>
                {metrics.environmentLabel && (
                  <span
                    className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded border uppercase ${
                      metrics.environmentLabel === 'LIVE'
                        ? isDark
                          ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                          : 'bg-emerald-600/10 border-emerald-700/25 text-emerald-800'
                        : isDark
                          ? 'bg-amber-500/15 border-amber-400/30 text-amber-300'
                          : 'bg-amber-600/12 border-amber-700/25 text-amber-900'
                    }`}
                  >
                    {metrics.environmentLabel}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--orion-text-secondary)] truncate">
                {metrics.isOnline !== false ? (
                  <Wifi className={`w-2.5 h-2.5 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                ) : (
                  <WifiOff className={`w-2.5 h-2.5 shrink-0 ${isDark ? 'text-rose-400' : 'text-rose-700'}`} />
                )}
                <span className="truncate">
                  {metrics.connectivityLabel || 'Operational'} •{' '}
                  {metrics.activeAppName ? `Active: ${metrics.activeAppName}` : 'Desktop Shell Nominal'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusToneBadge}`}>
              {statusLabel}
            </span>
            <button
              type="button"
              onClick={onTogglePin}
              aria-label={isPinned ? 'Unpin Dynamic Island' : 'Pin Dynamic Island'}
              title={isPinned ? 'Unpin Dynamic Dock' : 'Pin Dynamic Dock open'}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isPinned
                  ? 'bg-[var(--orion-accent)] border-[var(--orion-border-strong)] text-[var(--orion-on-accent)]'
                  : 'bg-[var(--orion-surface-hover)] border-[var(--orion-border)] text-[var(--orion-text-secondary)] hover:text-[var(--orion-text-primary)]'
              }`}
            >
              {isPinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
            </button>
            <button
              type="button"
              onClick={onCollapse}
              aria-label="Collapse Dynamic Island"
              title="Collapse (Esc)"
              className="p-1.5 rounded-lg bg-[var(--orion-surface-hover)] hover:bg-[var(--orion-surface-active)] border border-[var(--orion-border)] text-[var(--orion-text-secondary)] hover:text-[var(--orion-text-primary)] transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 2. Live Activity & Operational Event Stream */}
        <div className="space-y-1.5 max-h-[156px] overflow-y-auto custom-scrollbar">
          {activities.length > 0 ? (
            activities.map(item => (
              <div
                key={item.id}
                data-testid={item.isNotification ? 'dynamic-island-notification-item' : 'dynamic-island-activity-item'}
                className={`rounded-xl border p-2.5 flex items-start gap-2.5 transition-colors ${
                  item.severity === 'critical'
                    ? isDark
                      ? 'bg-rose-500/14 border-rose-500/35'
                      : 'bg-rose-500/10 border-rose-600/30'
                    : item.severity === 'warning'
                      ? isDark
                        ? 'bg-amber-500/14 border-amber-500/35'
                        : 'bg-amber-500/10 border-amber-600/30'
                      : item.severity === 'success'
                        ? isDark
                          ? 'bg-emerald-500/14 border-emerald-500/35'
                          : 'bg-emerald-500/10 border-emerald-600/30'
                        : item.severity === 'active' || item.severity === 'info'
                          ? isDark
                            ? 'bg-sky-500/12 border-sky-400/30'
                            : 'bg-sky-500/10 border-sky-600/25'
                          : neutralCardClass
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {item.iconUrl ? (
                    <img src={item.iconUrl} alt="" className="w-4 h-4 rounded object-contain" />
                  ) : item.severity === 'critical' ? (
                    <AlertTriangle className={`w-4 h-4 ${isDark ? 'text-rose-300' : 'text-rose-700'}`} />
                  ) : item.severity === 'warning' ? (
                    <AlertTriangle className={`w-4 h-4 ${isDark ? 'text-amber-300' : 'text-amber-700'}`} />
                  ) : item.severity === 'success' ? (
                    <CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                  ) : item.severity === 'info' ? (
                    <Info className={`w-4 h-4 ${isDark ? 'text-sky-300' : 'text-sky-700'}`} />
                  ) : item.source === 'copilot' ? (
                    <Brain className={`w-4 h-4 ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`} />
                  ) : item.source === 'connector' ? (
                    <RefreshCw className={`w-4 h-4 ${isDark ? 'text-sky-300' : 'text-sky-700'}`} />
                  ) : (
                    <Activity className={`w-4 h-4 ${isDark ? 'text-purple-300' : 'text-purple-700'}`} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  {item.appName && (
                    <div className="flex items-center justify-between text-[10px] text-[var(--orion-text-secondary)] mb-0.5">
                      <span className="font-semibold uppercase tracking-wider">{item.appName}</span>
                      <span className="font-mono text-[9px] opacity-75">
                        {item.timestamp ? 'recent' : 'active'}
                      </span>
                    </div>
                  )}
                  <div className="text-[11px] font-semibold text-[var(--orion-text-primary)] leading-tight">{item.title}</div>
                  {(item.message && item.message !== item.title) ? (
                    <div className="text-[10px] text-[var(--orion-text-secondary)] leading-relaxed mt-0.5 break-words">{item.message}</div>
                  ) : item.subtitle ? (
                    <div className="text-[10px] text-[var(--orion-text-secondary)] leading-relaxed mt-0.5 break-words">{item.subtitle}</div>
                  ) : null}
                  {typeof item.progress === 'number' && (
                    <div className="mt-1.5 h-1 rounded-full bg-[var(--orion-surface-active)] overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full transition-[width] duration-200"
                        style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {(item.actionLabel && (item.onAction || item.actionAppId)) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (item.onAction) {
                          item.onAction();
                          onDismissActivity(item.id);
                        } else if (item.actionAppId) {
                          onAction(item.actionAppId);
                        }
                      }}
                      className="px-2 py-1 rounded-lg bg-[var(--orion-surface-hover)] hover:bg-[var(--orion-surface-active)] border border-[var(--orion-border)] text-[10px] font-medium text-[var(--orion-text-primary)] cursor-pointer transition-colors"
                    >
                      {item.actionLabel}
                    </button>
                  )}
                  {item.dismissible !== false && (
                    <button
                      type="button"
                      onClick={() => onDismissActivity(item.id)}
                      aria-label={`Dismiss ${item.title}`}
                      className="p-1 rounded-md text-[var(--orion-text-secondary)] hover:text-[var(--orion-text-primary)] cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className={`rounded-xl border p-2.5 flex items-center justify-between gap-2 ${neutralCardClass}`}>
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                <span className="text-[11px] font-medium text-[var(--orion-text-primary)] truncate">
                  All supply chain flows nominal
                </span>
              </div>
              <span className="text-[10px] text-[var(--orion-text-secondary)] font-mono shrink-0">
                {metrics.connectedConnectorsCount} connectors online
              </span>
            </div>
          )}
        </div>

        {/* 3. Supply-Chain & System Health Matrix */}
        <div className={`border rounded-xl p-2 grid grid-cols-3 gap-2 text-center ${neutralCardClass}`}>
          <div className="min-w-0 px-1">
            <div className="text-[9px] uppercase tracking-wider font-semibold text-[var(--orion-text-secondary)] mb-0.5">
              Exceptions
            </div>
            <div className={`text-[12px] font-bold font-mono ${metrics.criticalExceptionsCount > 0 ? 'text-[var(--orion-danger)]' : 'text-[var(--orion-text-primary)]'}`}>
              {metrics.activeExceptionsCount}
            </div>
          </div>

          <div className="min-w-0 px-1 border-x border-[var(--orion-border)]">
            <div className="text-[9px] uppercase tracking-wider font-semibold text-[var(--orion-text-secondary)] mb-0.5">
              Stock Coverage
            </div>
            <div className={`text-[12px] font-bold ${metrics.stockoutRisksCount > 0 ? 'text-[var(--orion-warning)]' : 'text-[var(--orion-success)]'}`}>
              {metrics.stockoutRisksCount > 0 ? `${metrics.stockoutRisksCount} Low` : 'Optimal'}
            </div>
          </div>

          <div className="min-w-0 px-1">
            <div className="text-[9px] uppercase tracking-wider font-semibold text-[var(--orion-text-secondary)] mb-0.5">
              Shipments
            </div>
            <div className={`text-[12px] font-bold ${metrics.delayedShipmentsCount > 0 ? 'text-[var(--orion-warning)]' : 'text-[var(--orion-text-primary)]'}`}>
              {metrics.delayedShipmentsCount > 0 ? `${metrics.delayedShipmentsCount} Delay` : 'On Track'}
            </div>
          </div>
        </div>

        {/* 4. Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAction('ai-copilot')}
            className="flex-1 py-1.5 px-2.5 bg-[var(--orion-surface-hover)] hover:bg-[var(--orion-surface-active)] border border-[var(--orion-border)] rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-medium text-[var(--orion-text-primary)] transition-colors cursor-pointer"
            type="button"
            aria-label="Open Orion Copilot"
          >
            <Brain className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`} />
            <span>Open Copilot</span>
          </button>

          <button
            onClick={() => onAction('command-center')}
            className="flex-1 py-1.5 px-2.5 bg-[var(--orion-accent)] hover:bg-[var(--orion-accent-hover)] border border-[var(--orion-border-strong)] rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[var(--orion-on-accent)] transition-colors cursor-pointer"
            type="button"
            aria-label="Open Control Tower"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Control Tower</span>
          </button>

          <button
            onClick={() => onAction('notifications')}
            className="py-1.5 px-2.5 bg-[var(--orion-surface-hover)] hover:bg-[var(--orion-surface-active)] border border-[var(--orion-border)] rounded-xl flex items-center justify-center gap-1 text-[11px] font-medium text-[var(--orion-text-primary)] transition-colors cursor-pointer shrink-0"
            type="button"
            aria-label="Open Notifications"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Alerts</span>
            {metrics.unreadNotificationsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold tabular-nums">
                {metrics.unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
});
