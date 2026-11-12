import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  ExternalLink,
  Shuffle,
  Repeat,
  Battery,
  Home,
  Layers,
  BarChart2,
  ChevronUp,
} from 'lucide-react';
import { ORION_SPRING_SNAPPY } from '../../motion/OrionMotion';
import { useOrionTheme } from '../../theme/useOrionTheme';
import { DockPosition } from '../../../theme/themeTypes';
import {
  DynamicIslandActivity,
  DynamicIslandEventItem,
  DynamicIslandMetrics,
} from './DynamicIslandTypes';

interface Track {
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  gradient: string;
  badge: 'spotify' | 'apple';
}

const DEMO_TRACKS: Track[] = [
  {
    title: 'Lay Low',
    artist: 'Tiësto',
    album: 'Lay Low - Single',
    duration: 199, // 3:19
    gradient: 'from-rose-600 via-rose-700 to-amber-700',
    badge: 'spotify',
  },
  {
    title: 'After Hours',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 361, // 6:01
    gradient: 'from-red-800 via-stone-900 to-black',
    badge: 'spotify',
  },
  {
    title: 'Yellow Paper Daisy',
    artist: 'When Chai Met Toast',
    album: 'Van Kerala',
    duration: 199, // 3:19
    gradient: 'from-emerald-700 via-teal-800 to-amber-700',
    badge: 'spotify',
  },
];

interface DynamicIslandExpandedProps {
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
  const [activeTab, setActiveTab] = useState<'hub' | 'ops'>('hub');
  const [isPlaying, setIsPlaying] = useState(true);
  const [trackIndex, setTrackIndex] = useState(0);
  const [progressSeconds, setProgressSeconds] = useState(88); // 1:28 initial
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  const currentTrack = DEMO_TRACKS[trackIndex] ?? DEMO_TRACKS[0];

  // Live progress simulation when playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setProgressSeconds(prev => {
        if (prev >= currentTrack.duration) {
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isPlaying, currentTrack.duration]);

  const handleNextTrack = () => {
    setTrackIndex(prev => (prev + 1) % DEMO_TRACKS.length);
    setProgressSeconds(0);
  };

  const handlePrevTrack = () => {
    setTrackIndex(prev => (prev - 1 + DEMO_TRACKS.length) % DEMO_TRACKS.length);
    setProgressSeconds(0);
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${String(rem).padStart(2, '0')}`;
  };

  // Compute dynamic calendar 7-day strip around today (matching reference images)
  const calendarData = useMemo(() => {
    const now = new Date();
    const monthShort = now.toLocaleDateString('en', { month: 'short' });
    const year = now.getFullYear();
    const currentDay = now.getDate();
    const weekdayShort = now.toLocaleDateString('en', { weekday: 'short' }).toUpperCase();
    
    // Generate 7 days: today - 3 to today + 3
    const days: { dayNumber: number; weekday: string; isToday: boolean }[] = [];
    for (let offset = -3; offset <= 3; offset++) {
      const d = new Date(now);
      d.setDate(currentDay + offset);
      days.push({
        dayNumber: d.getDate(),
        weekday: d.toLocaleDateString('en', { weekday: 'short' }),
        isToday: offset === 0,
      });
    }
    return { monthShort, year, currentDay, weekdayShort, days };
  }, []);

  const motionInitial = isReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.98, y: -4 };

  const motionAnimate = isReducedMotion
    ? { opacity: 1 }
    : { opacity: 1, scale: 1, y: 0 };

  const motionExit = isReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.98, y: -4 };

  const progressPercent = Math.min(100, Math.max(0, (progressSeconds / currentTrack.duration) * 100));

  return (
    <motion.div
      id="dynamic-island-expanded-surface"
      data-testid="dynamic-island-expanded-panel"
      initial={motionInitial}
      animate={motionAnimate}
      exit={motionExit}
      transition={isReducedMotion ? { duration: 0.08 } : ORION_SPRING_SNAPPY}
      style={{ zIndex: 10020 }}
      className="relative overflow-visible text-white border-b border-l border-r border-white/[0.14] border-t-0 rounded-b-[30px] rounded-t-none shadow-[0_24px_64px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.06)] bg-[#050505] w-[min(560px,calc(100vw-24px))] transition-colors select-none pointer-events-auto"
    >
      {/* Seamless Left Concave Fillet connecting to top System Bar at 44px */}
      <svg
        className="absolute -left-3 top-[44px] w-3 h-3 text-[#050505] fill-current pointer-events-none hidden sm:block"
        viewBox="0 0 12 12"
        aria-hidden="true"
      >
        <path d="M 0,0 L 12,0 L 12,12 Q 12,0 0,0 Z" />
      </svg>

      {/* Seamless Right Concave Fillet connecting to top System Bar at 44px */}
      <svg
        className="absolute -right-3 top-[44px] w-3 h-3 text-[#050505] fill-current pointer-events-none hidden sm:block"
        viewBox="0 0 12 12"
        aria-hidden="true"
      >
        <path d="M 0,12 L 0,0 L 12,0 Q 0,0 0,12 Z" />
      </svg>

      <div className="px-3.5 pt-1.5 pb-2.5 flex flex-col gap-1.5">
        {/* Top Utility Header Row */}
        <div className="relative flex items-center justify-between pb-1 border-b border-white/[0.08] min-h-[26px]">
          {/* Left: App Shortcuts & View Tabs */}
          <div className="flex items-center gap-1.5">
            {/* Quick App Shortcut Icons */}
            <div className="flex items-center gap-1 pr-1 border-r border-white/10 hidden xs:flex">
              <button
                type="button"
                onClick={() => onAction('search')}
                className="w-5 h-5 rounded flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Search & Launcher"
                aria-label="Search"
              >
                <Home className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onAction('scm-twin')}
                className="w-5 h-5 rounded flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Digital Twin Workspace"
                aria-label="Digital Twin"
              >
                <Layers className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onAction('command-center')}
                className="w-5 h-5 rounded flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Control Tower Radar"
                aria-label="Control Tower"
              >
                <BarChart2 className="w-3 h-3" />
              </button>
            </div>

            {/* Nook / Tray Tabs (Matching Reference Images 1, 3, 8, 9) */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('hub')}
                className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'hub'
                    ? 'bg-white/20 text-white shadow-xs'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/10'
                }`}
              >
                <Pin className="w-2.5 h-2.5 rotate-45" />
                <span>Nook</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ops')}
                className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'ops'
                    ? 'bg-white/20 text-white shadow-xs'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/10'
                }`}
              >
                <Layers className="w-2.5 h-2.5" />
                <span>Tray</span>
                {metrics.criticalExceptionsCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
            </div>
          </div>

          {/* Center: Glowing Waveform Visualizer or System Sensor Dot */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
            {isPlaying && activeTab === 'hub' ? (
              <div className="flex items-center gap-0.5 h-3 px-2 py-0.5 rounded-full bg-white/[0.04] border border-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
                <span className="w-0.5 h-1.5 bg-cyan-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
                <span className="w-0.5 h-2.5 bg-sky-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.1s]" />
                <span className="w-0.5 h-3 bg-blue-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.2s]" />
                <span className="w-0.5 h-2 bg-indigo-400 rounded-full animate-[pulse_0.9s_ease-in-out_infinite_0.15s]" />
                <span className="w-0.5 h-2.5 bg-fuchsia-400 rounded-full animate-[pulse_0.75s_ease-in-out_infinite_0.05s]" />
                <span className="w-0.5 h-1.5 bg-rose-400 rounded-full animate-[pulse_0.65s_ease-in-out_infinite_0.25s]" />
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
                <span className="text-[9px] font-medium text-emerald-300 hidden md:inline">System Ready</span>
              </div>
            )}
          </div>

          {/* Right: Battery, Settings, Pin & Collapse */}
          <div className="flex items-center gap-1.5">
            {/* Battery Indicator (matching ref 2/4) */}
            <div className="hidden xs:flex items-center gap-1 text-white/70 px-1 py-0.5 text-[10px] font-mono">
              <Battery className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/40" />
              <span>98%</span>
            </div>

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
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Inline Active Notification Banner (if any) */}
        {activeNotification && (
          <div className="p-2 rounded-xl bg-white/[0.06] border border-sky-400/30 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-sky-300 uppercase tracking-wider block">
                  {activeNotification.appName || 'ORION SYSTEM'}
                </span>
                <span className="text-[11px] font-medium text-white truncate block">
                  {activeNotification.title || activeNotification.message}
                </span>
              </div>
            </div>
            {onDismissNotification && (
              <button
                type="button"
                onClick={() => onDismissNotification(activeNotification.id)}
                className="text-white/40 hover:text-white p-1 cursor-pointer"
                aria-label="Dismiss"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* 3-Section Primary Surface (Exact Reproduction of Uploaded Reference Images) */}
        {activeTab === 'hub' ? (
          <div className="grid grid-cols-12 gap-2.5 items-center py-0.5">
            {/* SECTION A: Left Section (Advanced Media Player - 5 Cols) */}
            <div className="col-span-5 flex items-center gap-2.5 min-w-0 pr-1">
              {/* Album Artwork with Spotify Badge */}
              <div className={`w-[52px] h-[52px] rounded-xl bg-gradient-to-br ${currentTrack.gradient} shadow-md flex items-center justify-center relative shrink-0 overflow-hidden border border-white/20`}>
                <div className="flex flex-col items-center justify-center text-center leading-none px-0.5">
                  <span className="text-[7px] font-mono tracking-widest text-white/70 uppercase truncate max-w-[48px]">
                    {currentTrack.artist}
                  </span>
                  <span className="text-[9px] font-black tracking-tight text-white mt-0.5 uppercase truncate max-w-[48px]">
                    {currentTrack.title}
                  </span>
                </div>
                {/* Streaming badge in bottom right corner (Spotify style) */}
                <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#1DB954] shadow-xs flex items-center justify-center">
                  <Music className="w-2 h-2 text-black" />
                </div>
              </div>

              {/* Track Info + Seek Bar + Controls */}
              <div className="flex flex-col min-w-0 flex-1 justify-center leading-tight">
                <span className="text-[12px] font-bold text-white truncate tracking-tight">
                  {currentTrack.title}
                </span>
                <span className="text-[9.5px] text-white/60 truncate mt-0.5">
                  {currentTrack.artist}
                </span>

                {/* Progress Seek Bar with Timestamps (matching ref 2/4) */}
                <div className="w-full mt-1">
                  <div
                    className="w-full h-1 bg-white/15 rounded-full overflow-hidden relative cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const pct = clickX / rect.width;
                      setProgressSeconds(Math.floor(pct * currentTrack.duration));
                    }}
                  >
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-200"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[8px] font-mono text-white/40 mt-0.5">
                    <span>{formatTime(progressSeconds)}</span>
                    <span>{formatTime(currentTrack.duration)}</span>
                  </div>
                </div>

                {/* Transport Controls: Shuffle, Previous, Play/Pause, Next, Repeat */}
                <div className="flex items-center gap-2 mt-0.5 text-white/75">
                  <button
                    type="button"
                    onClick={() => setIsShuffle(v => !v)}
                    className={`hover:text-white transition-colors cursor-pointer ${isShuffle ? 'text-cyan-400' : 'text-white/40'}`}
                    title="Shuffle"
                  >
                    <Shuffle className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handlePrevTrack}
                    className="hover:text-white transition-colors cursor-pointer"
                    title="Previous Track"
                  >
                    <SkipBack className="w-3 h-3 fill-current" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPlaying(prev => !prev)}
                    className="w-5 h-5 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <Pause className="w-2.5 h-2.5 fill-current" />
                    ) : (
                      <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleNextTrack}
                    className="hover:text-white transition-colors cursor-pointer"
                    title="Next Track"
                  >
                    <SkipForward className="w-3 h-3 fill-current" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRepeat(v => !v)}
                    className={`hover:text-white transition-colors cursor-pointer ${isRepeat ? 'text-cyan-400' : 'text-white/40'}`}
                    title="Repeat"
                  >
                    <Repeat className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION B: Center Section (Advanced Calendar & Timeline - 5 Cols) */}
            <div className="col-span-5 flex flex-col items-center justify-center min-w-0 px-2 border-x border-white/10">
              <div className="flex items-center gap-2 w-full justify-between">
                {/* Month & Year */}
                <div className="flex flex-col text-left leading-none shrink-0">
                  <span className="text-[12px] font-bold text-white tracking-tight">
                    {calendarData.monthShort}
                  </span>
                  <span className="text-[8.5px] font-mono text-white/40 mt-0.5">
                    {calendarData.year}
                  </span>
                </div>

                {/* 7-Day Horizontal Timeline Strip (Exact match to ref 2/4) */}
                <div className="flex items-center gap-1">
                  {calendarData.days.map((item) => (
                    <div key={`${item.weekday}-${item.dayNumber}`} className="flex flex-col items-center min-w-[17px]">
                      <span className={`text-[7px] font-mono leading-none mb-0.5 uppercase ${
                        item.isToday ? 'font-bold text-blue-400' : 'text-white/40'
                      }`}>
                        {item.weekday.slice(0, 2)}
                      </span>
                      <span
                        className={`text-[9.5px] font-mono leading-none flex items-center justify-center ${
                          item.isToday
                            ? 'bg-blue-600 text-white font-bold w-4.5 h-4.5 rounded-full shadow-xs'
                            : 'text-white/50'
                        }`}
                      >
                        {String(item.dayNumber).padStart(2, '0')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status / Calendar Event */}
              <button
                type="button"
                onClick={() => onAction('time-world')}
                className="flex items-center gap-1.5 mt-2 text-white/55 hover:text-white/80 transition-colors text-[9px] cursor-pointer"
                title="Open Calendar"
              >
                <CalendarIcon className="w-2.5 h-2.5 text-blue-400" />
                <span>No events today • Enjoy your free time!</span>
              </button>
            </div>

            {/* SECTION C: Right Section (Profile Avatar & Quick Actions - 2 Cols) */}
            <div className="col-span-2 flex flex-col items-center justify-center pl-1 gap-1">
              <div
                className="relative group cursor-pointer"
                onClick={() => onAction('settings')}
                title="Account Settings"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 shadow-md bg-white/10 flex items-center justify-center hover:scale-105 transition-transform">
                  <img
                    src="/orion-9-favicon.png"
                    alt="User Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-black shadow-xs" />
              </div>
              <button
                type="button"
                onClick={() => onAction('ai-copilot')}
                className="px-1.5 py-0.5 rounded-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-200 text-[8.5px] font-semibold flex items-center gap-0.5 transition-colors cursor-pointer"
                title="Launch Copilot"
              >
                <Sparkles className="w-2 h-2 text-purple-300" />
                <span>Copilot</span>
              </button>
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
          <div className="flex flex-col gap-1.5 pt-1 border-t border-white/[0.08] max-h-[120px] overflow-y-auto custom-scrollbar">
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
