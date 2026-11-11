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
  DynamicIslandPresentationMode,
  DynamicIslandSurfaceState,
} from './DynamicIslandTypes';
import { useOrionTheme } from '../../theme/useOrionTheme';

interface DynamicIslandCapsuleProps {
  activity: DynamicIslandActivity;
  surfaceState: DynamicIslandSurfaceState;
  presentationMode?: DynamicIslandPresentationMode;
  metrics: DynamicIslandMetrics;
  primaryEvent: DynamicIslandEventItem | null;
  isExpanded: boolean;
  isCompactOverMaximized: boolean;
  onToggleExpand: () => void;
}

export const DynamicIslandCapsule: React.FC<DynamicIslandCapsuleProps> = React.memo(({
  activity,
  surfaceState,
  presentationMode = 'compact',
  metrics,
  primaryEvent,
  isExpanded,
  isCompactOverMaximized,
  onToggleExpand,
}) => {
  const { isDark } = useOrionTheme();

  const pillHeightClass =
    presentationMode === 'minimal'
      ? 'h-[26px] px-2.5'
      : isCompactOverMaximized && !isExpanded && surfaceState !== 'critical'
        ? 'h-[30px]'
        : 'h-[34px]';

  const statusToneClass = isDark
    ? activity === 'critical-alert'
      ? 'border-rose-500/45 bg-[rgba(34,12,18,0.94)] hover:border-rose-400/60'
      : activity === 'copilot-thinking'
        ? 'border-indigo-400/45 bg-[rgba(16,18,36,0.92)] hover:border-indigo-300/60'
        : activity === 'connector-sync'
          ? 'border-sky-400/40 bg-[rgba(12,24,36,0.92)] hover:border-sky-300/60'
          : 'border-white/[0.14] bg-[rgba(14,17,24,0.90)] hover:border-white/25'
    : activity === 'critical-alert'
      ? 'border-rose-500/45 bg-[rgba(255,242,244,0.95)] hover:border-rose-600/60'
      : activity === 'copilot-thinking'
        ? 'border-indigo-500/40 bg-[rgba(245,247,255,0.95)] hover:border-indigo-600/55'
        : activity === 'connector-sync'
          ? 'border-sky-500/40 bg-[rgba(242,249,255,0.95)] hover:border-sky-600/55'
          : 'border-[rgba(15,23,42,0.16)] bg-[rgba(255,255,255,0.94)] hover:border-[rgba(15,23,42,0.28)]';

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
      className={`group flex items-center justify-between px-3.5 sm:px-4 rounded-full cursor-pointer select-none border transition-colors duration-200 max-w-[min(420px,calc(100vw-24px))] ${
        isDark
          ? 'shadow-[0_6px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.16)]'
          : 'shadow-[0_4px_16px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.9)]'
      } ${pillHeightClass} ${statusToneClass} ${
        isExpanded ? 'opacity-90' : ''
      }`}
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
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
            <span className={`text-[11px] font-medium truncate ${isDark ? 'text-white/90' : 'text-slate-900'}`}>
              {metrics.activeAppName ? metrics.activeAppName : 'System Ready'}
            </span>
          </>
        )}
      </div>

      {/* Right Telemetry Micro-Badge */}
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
          <span className={`text-[10px] font-mono ${isDark ? 'text-white/55' : 'text-slate-600'}`}>
            {activity === 'system-ready' ? 'Optimal' : metrics.runtimeMode === 'TAURI DESKTOP' ? 'DESKTOP' : 'LIVE'}
          </span>
        )}
      </div>
    </div>
  );
});
