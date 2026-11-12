import React, { useState, useMemo } from 'react';
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
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  Calendar as CalendarIcon,
  Settings as SettingsIcon,
  Sparkles,
  ExternalLink
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
  const [activeTab, setActiveTab] = useState<'hub' | 'ops'>('hub');
  const [isPlaying, setIsPlaying] = useState(true);

  // Compute dynamic calendar 5-day strip around today (matching reference image)
  const calendarData = useMemo(() => {
    const now = new Date();
    const monthShort = now.toLocaleDateString('en', { month: 'short' });
    const currentDay = now.getDate();
    const weekdayShort = now.toLocaleDateString('en', { weekday: 'short' }).toUpperCase();
    
    // Generate 5 days: today - 2, today - 1, today, today + 1, today + 2
    const days: { dayNumber: number; isToday: boolean }[] = [];
    for (let offset = -2; offset <= 2; offset++) {
      const d = new Date(now);
      d.setDate(currentDay + offset);
      days.push({
        dayNumber: d.getDate(),
        isToday: offset === 0,
      });
    }
    return { monthShort, currentDay, weekdayShort, days };
  }, []);

  const motionInitial = isReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.95, y: -6 };

  const motionAnimate = isReducedMotion
    ? { opacity: 1 }
    : { opacity: 1, scale: 1, y: 0 };

  const motionExit = isReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.95, y: -6 };

  const neutralCardClass = isDark
    ? 'bg-white/[0.05] border-white/[0.10]'
    : 'bg-slate-900/[0.04] border-slate-900/[0.10]';

  return (
    <motion.div
      id="dynamic-island-expanded-surface"
      data-testid="dynamic-island-expanded-panel"
      initial={motionInitial}
      animate={motionAnimate}
      exit={motionExit}
      transition={isReducedMotion ? { duration: 0.08 } : ORION_SPRING_SNAPPY}
      className={`overflow-hidden text-white rounded-[26px] border border-white/[0.14] shadow-[0_24px_64px_rgba(0,0,0,0.72),0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-[36px] w-[min(540px,calc(100vw-24px))] transition-colors select-none ${
        isDark ? 'bg-[#0A0D14]/96 text-white' : 'bg-[#121620]/96 text-white'
      }`}
    >
      <div className="px-3.5 pt-2 pb-3 flex flex-col gap-2">
        {/* Top Header Row with Centered Indicator Dot & Action Buttons */}
        <div className="relative flex items-center justify-between pb-1 border-b border-white/[0.08]">
          {/* Left: Hub & Ops Tabs */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('hub')}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'hub'
                  ? 'bg-white/20 text-white shadow-xs'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/10'
              }`}
            >
              <span>🎯 Hub</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ops')}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ops'
                  ? 'bg-white/20 text-white shadow-xs'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/10'
              }`}
            >
              <span>⚡ Telemetry</span>
              {metrics.criticalExceptionsCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          </div>

          {/* Centered Camera / Status Sensor Glowing Dot (Exact match to reference photo) */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
          </div>

          {/* Right: Settings, Pin & Collapse */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onAction('settings')}
              title="Open System Settings"
              aria-label="Settings"
              className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onTogglePin}
              title={isPinned ? 'Unpin island' : 'Pin island open'}
              aria-label={isPinned ? 'Unpin island' : 'Pin island'}
              className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              {isPinned ? <PinOff className="w-3.5 h-3.5 text-[#D6A65C]" /> : <Pin className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onCollapse}
              title="Collapse island"
              aria-label="Collapse"
              className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3-Section Primary Surface (Exact reproduction of uploaded reference image) */}
        {activeTab === 'hub' ? (
          <div className="grid grid-cols-12 gap-2 items-center py-1">
            {/* SECTION A: Left Section (Music / Audio Media Player Tile) */}
            <div className="col-span-5 flex items-center gap-2.5 min-w-0 pr-1">
              {/* Red / Crimson Album Artwork with Music badge */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-600 via-rose-700 to-amber-700 shadow-md flex items-center justify-center relative shrink-0 overflow-hidden border border-white/20">
                <div className="flex flex-col items-center justify-center text-center leading-none">
                  <span className="text-[7.5px] font-mono tracking-widest text-white/70">TIËSTO</span>
                  <span className="text-[10px] font-black tracking-tight text-white mt-0.5">LAY LOW</span>
                </div>
                {/* Small music note badge */}
                <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-black/60 flex items-center justify-center">
                  <Music className="w-2 h-2 text-rose-300" />
                </div>
              </div>

              {/* Track Info + Playback Controls */}
              <div className="flex flex-col min-w-0 flex-1 justify-center leading-tight">
                <span className="text-[12px] font-bold text-white truncate tracking-tight">
                  Lay Low
                </span>
                <span className="text-[10px] text-white/60 truncate mt-0.5">
                  Lay Low - Single
                </span>
                <span className="text-[9px] text-white/40 truncate">
                  Tiësto
                </span>

                {/* Playback Controls: Previous, Play/Pause, Next */}
                <div className="flex items-center gap-2.5 mt-1 text-white/70">
                  <button
                    type="button"
                    onClick={() => {}}
                    className="hover:text-white transition-colors cursor-pointer"
                    title="Previous Track"
                  >
                    <SkipBack className="w-3 h-3 fill-current" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPlaying(prev => !prev)}
                    className="hover:text-white transition-colors cursor-pointer"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <Pause className="w-3 h-3 fill-current" />
                    ) : (
                      <Play className="w-3 h-3 fill-current" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {}}
                    className="hover:text-white transition-colors cursor-pointer"
                    title="Next Track"
                  >
                    <SkipForward className="w-3 h-3 fill-current" />
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION B: Center Section (Calendar & Date Timeline) */}
            <div className="col-span-5 flex flex-col items-center justify-center min-w-0 px-2 border-x border-white/10">
              <div className="flex items-baseline gap-2">
                {/* Month Name */}
                <span className="text-[14px] font-bold text-white tracking-tight">
                  {calendarData.monthShort}
                </span>

                {/* 5-Day Horizontal Timeline Strip */}
                <div className="flex items-center gap-1.5">
                  {calendarData.days.map((item) => (
                    <div key={item.dayNumber} className="flex flex-col items-center">
                      {item.isToday && (
                        <span className="text-[7.5px] font-bold text-blue-400 font-mono leading-none mb-0.5">
                          {calendarData.weekdayShort}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-mono leading-none ${
                          item.isToday
                            ? 'bg-blue-600 text-white font-bold px-1 py-0.5 rounded shadow-xs'
                            : 'text-white/45'
                        }`}
                      >
                        {String(item.dayNumber).padStart(2, '0')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status / Calendar Event */}
              <div className="flex items-center gap-1.5 mt-2 text-white/50 text-[9.5px]">
                <CalendarIcon className="w-3 h-3 text-white/40" />
                <span>Nothing for today</span>
              </div>
            </div>

            {/* SECTION C: Right Section (User Profile Avatar) */}
            <div className="col-span-2 flex items-center justify-center pl-1">
              <div className="relative group cursor-pointer" onClick={() => onAction('settings')}>
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 shadow-md bg-white/10 flex items-center justify-center">
                  <img
                    src="/orion-9-favicon.png"
                    alt="User Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black" />
              </div>
            </div>
          </div>
        ) : (
          /* Ops / Telemetry Matrix */
          <div className="flex flex-col gap-2 py-1">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <div className="text-[9px] uppercase tracking-wider text-white/50 font-semibold">Exceptions</div>
                <div className={`text-sm font-bold font-mono mt-0.5 ${metrics.criticalExceptionsCount > 0 ? 'text-rose-400' : 'text-white'}`}>
                  {metrics.activeExceptionsCount}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <div className="text-[9px] uppercase tracking-wider text-white/50 font-semibold">Stock Coverage</div>
                <div className="text-sm font-bold font-mono mt-0.5 text-emerald-400">
                  {metrics.stockoutRisksCount > 0 ? `${metrics.stockoutRisksCount} Low` : 'Optimal'}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <div className="text-[9px] uppercase tracking-wider text-white/50 font-semibold">Shipments</div>
                <div className="text-sm font-bold font-mono mt-0.5 text-white/95">
                  {metrics.delayedShipmentsCount > 0 ? `${metrics.delayedShipmentsCount} Delay` : 'On Track'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Activity / Notification Items */}
        {activities.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-1 border-t border-white/[0.08] max-h-[140px] overflow-y-auto custom-scrollbar">
            {activities.map(item => (
              <div
                key={item.id}
                data-testid={item.isNotification ? 'dynamic-island-notification-item' : 'dynamic-island-activity-item'}
                className="rounded-xl border border-white/10 p-2 bg-white/[0.04] flex items-start gap-2 text-xs"
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
                    onClick={() => {
                      if (item.onAction) {
                        item.onAction();
                        onDismissActivity(item.id);
                      } else if (item.actionAppId) {
                        onAction(item.actionAppId);
                      }
                    }}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
                  >
                    {item.actionLabel}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDismissActivity(item.id)}
                  className="text-white/40 hover:text-white p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Action Buttons (Preserving DYNAMIC-ISLAND-12 and all actions) */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/[0.08]">
          <button
            onClick={() => onAction('ai-copilot')}
            className="flex-1 py-1.5 px-2 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.10] rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-semibold text-white transition-all cursor-pointer"
            type="button"
            aria-label="Open Orion Copilot"
          >
            <Brain className="w-3 h-3 text-purple-400" />
            <span>Open Copilot</span>
          </button>

          <button
            onClick={() => onAction('command-center')}
            className="flex-1 py-1.5 px-2 bg-[#E5A84B] hover:bg-[#D6963B] text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 text-[11px] shadow-sm transition-all cursor-pointer"
            type="button"
            aria-label="Open Control Tower"
          >
            <Activity className="w-3 h-3" />
            <span>Control Tower</span>
          </button>

          <button
            onClick={() => onAction('notifications')}
            className="py-1.5 px-2.5 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.10] rounded-xl flex items-center justify-center gap-1 text-[11px] font-medium text-white transition-all cursor-pointer shrink-0"
            type="button"
            aria-label="Open Notifications"
            title="Notifications"
          >
            <Bell className="w-3 h-3 text-white/70" />
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

export default DynamicIslandExpanded;
