import React, { useEffect, useState, useMemo, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../../types/auth';
import { 
  Lock, 
  Unlock, 
  Shield, 
  Clock, 
  CloudSun, 
  Bell, 
  Settings2, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  X, 
  Calendar,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { userService } from '../../services/userService';
import { lockScreenVariants } from '../motion/OrionMotionVariants';
import { useIsReducedMotion } from '../motion/OrionMotion';
import { NotificationContext } from '../../store/NotificationContext';
import { cn } from '../../lib/utils';

export type LockScreenWidgetId = 'time-date' | 'weather' | 'notifications';

export interface LockScreenWidgetConfig {
  id: LockScreenWidgetId;
  enabled: boolean;
  order: number;
}

export interface LockScreenPreferences {
  widgets: LockScreenWidgetConfig[];
  privacyMode: boolean;
}

export const DEFAULT_LOCK_PREFERENCES: LockScreenPreferences = {
  widgets: [
    { id: 'time-date', enabled: true, order: 0 },
    { id: 'weather', enabled: true, order: 1 },
    { id: 'notifications', enabled: true, order: 2 },
  ],
  privacyMode: true,
};

export function loadLockScreenPreferences(): LockScreenPreferences {
  if (typeof localStorage === 'undefined') return DEFAULT_LOCK_PREFERENCES;
  try {
    const raw = localStorage.getItem('orion-lock-widgets-config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.widgets)) {
        return {
          widgets: parsed.widgets,
          privacyMode: parsed.privacyMode ?? true,
        };
      }
    }
  } catch {}
  return DEFAULT_LOCK_PREFERENCES;
}

export function saveLockScreenPreferences(prefs: LockScreenPreferences): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem('orion-lock-widgets-config', JSON.stringify(prefs));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orion-lock-preferences-changed', { detail: prefs }));
    }
  } catch {}
}

interface OrionLockScreenProps {
  onUnlock: () => void;
  currentUser: UserProfile | null;
}

export const OrionLockScreen: React.FC<OrionLockScreenProps> = ({ onUnlock, currentUser }) => {
  const isReduced = useIsReducedMotion();
  const notifCtx = useContext(NotificationContext);
  const unreadCount = notifCtx?.unreadCount ?? 0;
  const notifications = notifCtx?.notifications ?? [];

  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prefs, setPrefs] = useState<LockScreenPreferences>(() => loadLockScreenPreferences());
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Keep clock updated
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync external preference changes
  useEffect(() => {
    const handlePrefChange = (e: any) => {
      if (e.detail) setPrefs(e.detail);
    };
    window.addEventListener('orion-lock-preferences-changed', handlePrefChange as EventListener);
    return () => window.removeEventListener('orion-lock-preferences-changed', handlePrefChange as EventListener);
  }, []);

  const handleUnlockAttempt = async () => {
    if (!password || !password.trim() || !currentUser?.id) {
      setError(true);
      setTimeout(() => setError(false), 1200);
      return;
    }

    setIsVerifying(true);
    try {
      const isValid = await userService.verifyUserPassword(currentUser.id, password);
      if (isValid) {
        setPassword('');
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => setError(false), 1200);
      }
    } catch (e) {
      setError(true);
      setTimeout(() => setError(false), 1200);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isConfigOpen) {
        handleUnlockAttempt();
      } else if (e.key === 'Escape' && isConfigOpen) {
        setIsConfigOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUnlock, password, currentUser, isConfigOpen]);

  const initials = currentUser?.displayName
    ? currentUser.displayName.substring(0, 2).toUpperCase()
    : 'OR';

  // Sort and filter active widgets (max 3)
  const activeWidgets = useMemo(() => {
    return [...prefs.widgets]
      .filter(w => w.enabled)
      .sort((a, b) => a.order - b.order)
      .slice(0, 3);
  }, [prefs]);

  const toggleWidget = (id: LockScreenWidgetId) => {
    const currentEnabled = prefs.widgets.filter(w => w.enabled).length;
    const target = prefs.widgets.find(w => w.id === id);
    if (!target) return;

    if (!target.enabled && currentEnabled >= 3) {
      // Max 3 reached
      return;
    }

    const nextWidgets = prefs.widgets.map(w => 
      w.id === id ? { ...w, enabled: !w.enabled } : w
    );
    const nextPrefs = { ...prefs, widgets: nextWidgets };
    setPrefs(nextPrefs);
    saveLockScreenPreferences(nextPrefs);
  };

  const moveWidget = (id: LockScreenWidgetId, direction: 'up' | 'down') => {
    const list = [...prefs.widgets].sort((a, b) => a.order - b.order);
    const index = list.findIndex(w => w.id === id);
    if (index === -1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= list.length) return;

    const temp = list[index].order;
    list[index].order = list[swapIndex].order;
    list[swapIndex].order = temp;

    const nextPrefs = { ...prefs, widgets: list };
    setPrefs(nextPrefs);
    saveLockScreenPreferences(nextPrefs);
  };

  const togglePrivacy = () => {
    const nextPrefs = { ...prefs, privacyMode: !prefs.privacyMode };
    setPrefs(nextPrefs);
    saveLockScreenPreferences(nextPrefs);
  };

  // Format macOS style Date & Time
  const formattedDay = currentTime.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = currentTime.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <motion.div
      data-testid="orion-lock-screen"
      variants={lockScreenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="fixed inset-0 bg-os-bg z-[100000] flex flex-col items-center justify-between font-sans overflow-hidden select-none p-6 sm:p-10"
    >
      {/* Ambient background lighting */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-white/[0.025] rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[35vw] h-[35vw] bg-white/[0.02] rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(56,189,248,0.06),transparent_60%)]" />
      </div>

      {/* TOP: macOS Sonoma Large Lock Clock & Date */}
      <div className="relative z-10 flex flex-col items-center text-center mt-2 sm:mt-6">
        <span className="text-white/80 font-medium text-base sm:text-lg tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          {formattedDay}
        </span>
        <h1 className="text-white font-bold text-6xl sm:text-7xl md:text-8xl tracking-tight leading-none drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] my-1">
          {formattedTime}
        </h1>

        {/* Configurable Lock Screen Widgets Row (max 3) */}
        <div 
          data-testid="lock-screen-widgets"
          className="flex items-center justify-center gap-3 mt-4 flex-wrap max-w-2xl"
        >
          {activeWidgets.map(w => {
            if (w.id === 'time-date') {
              return (
                <div
                  key="time-date"
                  data-testid="widget-time-date"
                  className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 backdrop-blur-2xl shadow-lg transition-all"
                  title="Time and Date Widget"
                >
                  <Clock className="w-4 h-4 text-[var(--orion-accent,#38BDF8)] shrink-0" />
                  <div className="text-left">
                    <div className="text-[11px] font-semibold text-white tabular-nums leading-tight">
                      {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div className="text-[10px] text-white/60 font-mono leading-tight">
                      {Intl.DateTimeFormat().resolvedOptions().timeZone.split('/')[1]?.replace('_', ' ') || 'UTC'}
                    </div>
                  </div>
                </div>
              );
            }

            if (w.id === 'weather') {
              return (
                <div
                  key="weather"
                  data-testid="widget-weather"
                  className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 backdrop-blur-2xl shadow-lg transition-all"
                  title="Weather Widget"
                >
                  <CloudSun className="w-4 h-4 text-amber-300 shrink-0" />
                  <div className="text-left">
                    <div className="text-[11px] font-semibold text-white tabular-nums leading-tight">
                      21°C • Sunny
                    </div>
                    <div className="text-[10px] text-white/60 font-mono leading-tight">
                      H: 24° L: 16°
                    </div>
                  </div>
                </div>
              );
            }

            if (w.id === 'notifications') {
              return (
                <div
                  key="notifications"
                  data-testid="widget-notifications"
                  className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 backdrop-blur-2xl shadow-lg transition-all"
                  title="System Notifications Widget"
                >
                  <div className="relative">
                    <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-[11px] font-semibold text-white leading-tight">
                      {unreadCount > 0 ? `${unreadCount} Alerts Pending` : 'System Clear'}
                    </div>
                    <div className="text-[10px] text-white/60 font-mono leading-tight">
                      {prefs.privacyMode ? 'Protected Mode' : (notifications[0]?.title || 'No Exceptions')}
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}

          {/* Customize Widgets Button right on the Lock Screen */}
          <button
            type="button"
            data-testid="customize-lock-widgets-btn"
            onClick={() => setIsConfigOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/70 hover:text-white text-[11px] font-medium backdrop-blur-md transition-all cursor-pointer shadow-xs active:scale-95"
            title="Configure lock-screen widgets without unlocking"
            aria-label="Customize Lock Screen Widgets"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Customize</span>
          </button>
        </div>
      </div>

      {/* CENTER: User Authentication Capsule (matches reference screenshot) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: isReduced ? 0.1 : 0.4 }}
        className="relative z-10 flex flex-col items-center max-w-sm w-full px-6 text-center my-auto"
      >
        {/* User Avatar / Logo */}
        <div className="relative mb-5">
          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-white/[0.08] border border-white/20 flex items-center justify-center shadow-2xl backdrop-blur-2xl overflow-hidden p-1">
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt="Identity"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-xl font-semibold text-white tracking-wider font-mono">
                {initials}
              </span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[rgba(20,24,32,0.9)] border border-white/20 flex items-center justify-center text-white shadow-lg z-10">
            <Lock className="w-3.5 h-3.5 text-white/80" />
          </div>
        </div>

        {/* User Identity */}
        <h2 className="text-white text-xl font-medium tracking-wide mb-0.5 drop-shadow-md">
          {currentUser?.displayName || currentUser?.fullName || 'Operator'}
        </h2>
        <p className="text-white/60 text-xs tracking-wider mb-2 font-mono">
          {currentUser?.email || 'ORION-9'}
        </p>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[10px] font-mono text-white/70 uppercase tracking-widest mb-6">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>Workstation Locked</span>
        </div>

        {/* Password Credential Capsule */}
        <div className="w-full mb-5">
          <div className={cn(
            "orion-login-capsule relative flex items-center h-[46px] rounded-full",
            "bg-[rgba(45,50,60,0.65)] hover:bg-[rgba(55,60,72,0.70)] transition-all duration-300",
            "backdrop-blur-2xl border shadow-[0_12px_36px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.25)]",
            error ? "border-red-500 ring-4 ring-red-500/25" : "border-emerald-500/80 ring-4 ring-emerald-500/25"
          )}>
            <div className="pl-4 pr-1.5 flex items-center pointer-events-none text-white/70">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              autoFocus
              data-orion-glass-input="true"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Enter password..."
              className="flex-1 bg-transparent border-none text-white text-[14px] placeholder:text-white/50 focus:outline-none focus:ring-0 px-2 font-normal selection:bg-emerald-500/35 selection:text-white text-center"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUnlockAttempt();
              }}
            />
          </div>
        </div>

        {/* Unlock Action Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleUnlockAttempt}
          disabled={isVerifying}
          className="group relative px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-full transition-all duration-200 shadow-[0_8px_24px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] border border-emerald-400/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Unlock className="w-4 h-4 text-white transition-transform duration-300 group-hover:scale-110" />
          <span className="text-xs tracking-[0.15em] font-medium uppercase text-white">
            {isVerifying ? 'VERIFYING...' : 'UNLOCK SESSION'}
          </span>
        </motion.button>

        <span className="text-[10px] text-white/40 font-mono mt-5">
          Press Enter or Space to resume
        </span>
      </motion.div>

      {/* BOTTOM SPACER */}
      <div className="h-6" />

      {/* IN-PLACE LOCK SCREEN WIDGET CONFIGURATION MODAL */}
      <AnimatePresence>
        {isConfigOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setIsConfigOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-[rgba(24,28,36,0.92)] border border-white/20 shadow-2xl p-6 backdrop-blur-3xl text-left select-none space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-[var(--orion-accent,#38BDF8)]" />
                  <h3 className="text-sm font-semibold text-white tracking-wide">
                    Lock Screen Widgets
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close widget settings"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-white/70">
                Choose up to 3 widgets to display on the lock screen. You can reorder their priority and toggle notification privacy without unlocking the workstation.
              </p>

              {/* Widget Toggles & Order */}
              <div className="space-y-2.5">
                {[...prefs.widgets].sort((a, b) => a.order - b.order).map((w, idx) => {
                  const label = w.id === 'time-date' 
                    ? 'Time & Date (Digital & Timezone)' 
                    : w.id === 'weather' 
                    ? 'Weather (Conditions & Forecast)' 
                    : 'System Notifications (Alerts Summary)';

                  const IconComp = w.id === 'time-date' ? Clock : w.id === 'weather' ? CloudSun : Bell;

                  return (
                    <div
                      key={w.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border transition-all",
                        w.enabled 
                          ? "bg-white/[0.08] border-white/20 text-white" 
                          : "bg-white/[0.02] border-white/5 text-white/40"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={w.enabled}
                          onChange={() => toggleWidget(w.id)}
                          className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                        />
                        <IconComp className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-medium">{label}</span>
                      </div>

                      {/* Reorder Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveWidget(w.id, 'up')}
                          className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-20 text-white transition-colors"
                          title="Move Left / Earlier"
                          aria-label={`Move ${w.id} earlier`}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === prefs.widgets.length - 1}
                          onClick={() => moveWidget(w.id, 'down')}
                          className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-20 text-white transition-colors"
                          title="Move Right / Later"
                          aria-label={`Move ${w.id} later`}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Privacy Toggle */}
              <label className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.04] cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-white block">Privacy Mode</span>
                  <span className="text-[11px] text-white/60">
                    Mask notification content and recipient details on lock screen
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.privacyMode}
                  onChange={togglePrivacy}
                  className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                />
              </label>

              {/* Done button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/10 shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
