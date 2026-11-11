import React from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  Brain,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import {
  DynamicIslandActivity,
  DynamicIslandEventItem,
  DynamicIslandMetrics,
  DynamicIslandSurfaceState,
} from './DynamicIslandTypes';

interface DynamicIslandCapsuleProps {
  activity: DynamicIslandActivity;
  surfaceState: DynamicIslandSurfaceState;
  metrics: DynamicIslandMetrics;
  primaryEvent: DynamicIslandEventItem | null;
  isExpanded: boolean;
  isCompactOverMaximized: boolean;
  onToggleExpand: () => void;
}

export const DynamicIslandCapsule: React.FC<DynamicIslandCapsuleProps> = React.memo(({
  activity,
  surfaceState,
  metrics,
  primaryEvent,
  isExpanded,
  isCompactOverMaximized,
  onToggleExpand,
}) => {
  const pillHeightClass = isCompactOverMaximized && !isExpanded && surfaceState !== 'critical'
    ? 'h-[30px]'
    : 'h-[34px]';

  const statusToneClass =
    activity === 'critical-alert'
      ? 'border-rose-500/45 bg-[rgba(34,12,18,0.94)]'
      : activity === 'copilot-thinking'
        ? 'border-indigo-400/45 bg-[rgba(16,18,36,0.92)]'
        : activity === 'connector-sync'
          ? 'border-sky-400/40 bg-[rgba(12,24,36,0.92)]'
          : 'border-white/[0.14] bg-[rgba(14,17,24,0.90)]';

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      aria-label="Expand Orion Dynamic Island"
      data-surface-state={surfaceState}
      data-compact-over-maximized={isCompactOverMaximized ? 'true' : 'false'}
      onClick={onToggleExpand}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggleExpand();
        }
      }}
      className={`group flex items-center justify-between px-3.5 sm:px-4 rounded-full cursor-pointer select-none border transition-colors duration-200 max-w-[min(420px,calc(100vw-24px))] shadow-[0_6px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.16)] ${pillHeightClass} ${statusToneClass} ${
        isExpanded ? 'opacity-90' : 'hover:border-white/25'
      }`}
    >
      {/* Left Anchor: State Indicator + System / Activity Status */}
      <div className="flex items-center gap-2 min-w-0">
        {activity === 'critical-alert' ? (
          <>
            <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 shadow-[0_0_8px_rgba(251,113,133,0.7)]" />
            <AlertTriangle className="w-3.5 h-3.5 text-rose-300 shrink-0" />
            <span className="text-[11px] font-semibold text-rose-300 truncate">
              {metrics.unreadNotificationsCount > 0
                ? `${metrics.criticalExceptionsCount} ${metrics.criticalExceptionsCount === 1 ? 'Alert' : 'Alerts'}`
                : `Shipment exception detected • ${metrics.criticalExceptionsCount} ${metrics.criticalExceptionsCount === 1 ? 'Alert' : 'Alerts'}`}
            </span>
          </>
        ) : activity === 'copilot-thinking' ? (
          <>
            <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
            <Brain className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
            <span className="text-[11px] font-semibold text-indigo-200 truncate">
              {primaryEvent?.title || 'Orion Copilot Active'}
            </span>
          </>
        ) : activity === 'connector-sync' ? (
          <>
            <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
            <RefreshCw className="w-3.5 h-3.5 text-sky-300 shrink-0" />
            <span className="text-[11px] font-semibold text-sky-300 truncate">
              {`Syncing ${metrics.connectedConnectorsCount} connectors`}
            </span>
          </>
        ) : activity === 'simulation-running' ? (
          <>
            <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
            <Activity className="w-3.5 h-3.5 text-purple-300 shrink-0" />
            <span className="text-[11px] font-semibold text-purple-200 truncate">
              {primaryEvent?.title || 'Simulation Running'}
            </span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-medium text-white/90 truncate">
              {metrics.activeAppName ? metrics.activeAppName : 'System Ready'}
            </span>
          </>
        )}
      </div>

      {/* Right Telemetry Micro-Badge */}
      <div className="flex items-center gap-2 ml-3 shrink-0">
        {typeof primaryEvent?.progress === 'number' && (
          <div className="hidden sm:flex items-center gap-1.5">
            <div className="w-10 h-1 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full bg-sky-400 rounded-full transition-[width] duration-200"
                style={{ width: `${Math.max(0, Math.min(100, primaryEvent.progress))}%` }}
              />
            </div>
          </div>
        )}

        {metrics.unreadNotificationsCount > 0 ? (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/35 text-[10px] font-semibold text-rose-200"
            aria-label={`${metrics.unreadNotificationsCount} unread notification${metrics.unreadNotificationsCount === 1 ? '' : 's'}`}
          >
            <Bell className="w-2.5 h-2.5" />
            <span>{metrics.unreadNotificationsCount}</span>
          </span>
        ) : (
          <span className="text-[10px] font-mono text-white/55">
            {activity === 'system-ready' ? 'Optimal' : metrics.runtimeMode === 'TAURI DESKTOP' ? 'DESKTOP' : 'LIVE'}
          </span>
        )}
      </div>
    </div>
  );
});
