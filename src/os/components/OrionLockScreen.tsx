import React, { useEffect, useState, useMemo, useContext, useRef } from 'react';
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
  EyeOff,
  Globe,
  Power,
  RotateCcw,
  Moon,
  LogOut,
  ChevronDown,
  User,
  AlertCircle
} from 'lucide-react';
import { userService } from '../../services/userService';
import { lockScreenVariants } from '../motion/OrionMotionVariants';
import { useIsReducedMotion } from '../motion/OrionMotion';
import { NotificationContext } from '../../store/NotificationContext';
import { useAuth } from '../../store/AuthContext';
import { useI18n } from '../../store/LanguageContext';
import { SUPPORTED_LOCALES } from '../../i18n';
import { WorldLanguagePanel } from '../../components/i18n/WorldLanguagePanel';
import { OrionLiveWallpaper } from './OrionLiveWallpaper';
import { cn } from '../../lib/utils';
import { weatherService, WeatherCondition, DEFAULT_WEATHER_LOCATIONS } from '../../services/weather/OpenMeteoWeatherService';
import { databaseHealthService, DatabaseHealthReport } from '../../services/databaseHealthService';
import { ProcurementEngine } from '../../services/ProcurementEngine';
import { Server, Package } from 'lucide-react';

export type LockScreenWidgetId = 'time-date' | 'weather' | 'notifications' | 'calendar' | 'system-status' | 'operations-summary';

export interface LockScreenWidgetConfig {
  id: LockScreenWidgetId;
  enabled: boolean;
  order: number;
}

export interface LockScreenPreferences {
  widgets: LockScreenWidgetConfig[];
  privacyMode: boolean;
  weatherLocationCity?: string;
}

export const DEFAULT_LOCK_PREFERENCES: LockScreenPreferences = {
  widgets: [
    { id: 'time-date', enabled: true, order: 0 },
    { id: 'weather', enabled: true, order: 1 },
    { id: 'notifications', enabled: true, order: 2 },
    { id: 'calendar', enabled: false, order: 3 },
  ],
  privacyMode: true,
  weatherLocationCity: 'New York',
};

export function getLockScreenStorageKey(userId?: string): string {
  return userId ? `orion-lock-widgets-config-${userId}` : 'orion-lock-widgets-config';
}

export function loadLockScreenPreferences(userId?: string): LockScreenPreferences {
  if (typeof localStorage === 'undefined') return DEFAULT_LOCK_PREFERENCES;
  try {
    const key = getLockScreenStorageKey(userId);
    const raw = localStorage.getItem(key) || (userId ? localStorage.getItem('orion-lock-widgets-config') : null);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.widgets)) {
        const knownIds: LockScreenWidgetId[] = ['time-date', 'weather', 'notifications', 'calendar'];
        const validatedWidgets: LockScreenWidgetConfig[] = [];
        const seenIds = new Set<string>();

        parsed.widgets.forEach((w: any) => {
          if (w && knownIds.includes(w.id) && !seenIds.has(w.id)) {
            seenIds.add(w.id);
            validatedWidgets.push({
              id: w.id,
              enabled: Boolean(w.enabled),
              order: typeof w.order === 'number' ? w.order : validatedWidgets.length,
            });
          }
        });

        // Ensure missing known widgets exist (disabled)
        knownIds.forEach((kid) => {
          if (!seenIds.has(kid)) {
            validatedWidgets.push({ id: kid, enabled: false, order: validatedWidgets.length });
          }
        });

        return {
          widgets: validatedWidgets.sort((a, b) => a.order - b.order),
          privacyMode: typeof parsed.privacyMode === 'boolean' ? parsed.privacyMode : true,
          weatherLocationCity: typeof parsed.weatherLocationCity === 'string' && parsed.weatherLocationCity.trim().length > 0 ? parsed.weatherLocationCity.trim() : 'New York',
        };
      }
    }
  } catch {}
  return DEFAULT_LOCK_PREFERENCES;
}

export function saveLockScreenPreferences(prefs: LockScreenPreferences, userId?: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const key = getLockScreenStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(prefs));
    if (userId) {
      localStorage.setItem('orion-lock-widgets-config', JSON.stringify(prefs));
    }
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
  const { triggerShutdown, triggerRestart, triggerSleep, signOut } = useAuth();
  const { locale, setLocale } = useI18n();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prefs, setPrefs] = useState<LockScreenPreferences>(() => loadLockScreenPreferences(currentUser?.id));
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isPowerMenuOpen, setIsPowerMenuOpen] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherCondition | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(true);

  const powerMenuRef = useRef<HTMLDivElement>(null);

  // Keep clock updated
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch live weather data from Open-Meteo
  useEffect(() => {
    let isCancelled = false;
    const fetchWeather = async () => {
      setWeatherLoading(true);
      try {
        const selectedCity = prefs.weatherLocationCity || 'New York';
        const loc = DEFAULT_WEATHER_LOCATIONS.find(l => l.city === selectedCity) || DEFAULT_WEATHER_LOCATIONS[0];
        const data = await weatherService.fetchCurrentWeather(loc);
        if (!isCancelled) {
          setWeatherData(data);
          setWeatherLoading(false);
        }
      } catch {
        if (!isCancelled) setWeatherLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [prefs.weatherLocationCity]);

  // Sync external preference changes
  useEffect(() => {
    const handlePrefChange = (e: any) => {
      if (e.detail) setPrefs(e.detail);
    };
    window.addEventListener('orion-lock-preferences-changed', handlePrefChange as EventListener);
    return () => window.removeEventListener('orion-lock-preferences-changed', handlePrefChange as EventListener);
  }, []);

  // Close power menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (powerMenuRef.current && !powerMenuRef.current.contains(e.target as Node)) {
        setIsPowerMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUnlockAttempt = async () => {
    if (isVerifying) return;
    if (!password || !password.trim() || !currentUser?.id) {
      setErrorMsg('Please enter your password.');
      setTimeout(() => setErrorMsg(null), 2000);
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);
    try {
      const isValid = await userService.verifyUserPassword(currentUser.id, password);
      if (isValid) {
        setPassword('');
        onUnlock();
      } else {
        setErrorMsg('Invalid password.');
        setTimeout(() => setErrorMsg(null), 2500);
      }
    } catch (e: any) {
      if (e?.message && (e.message.includes('network') || e.message.includes('fetch') || e.message.includes('offline'))) {
        setErrorMsg('Authentication service unavailable. Please check connectivity.');
      } else {
        setErrorMsg('Invalid password.');
      }
      setTimeout(() => setErrorMsg(null), 2500);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isConfigOpen && !isLangMenuOpen && !isPowerMenuOpen) {
        handleUnlockAttempt();
      } else if (e.key === 'Escape') {
        if (isConfigOpen) setIsConfigOpen(false);
        if (isLangMenuOpen) setIsLangMenuOpen(false);
        if (isPowerMenuOpen) setIsPowerMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUnlock, password, currentUser, isConfigOpen, isLangMenuOpen, isPowerMenuOpen]);

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
      return;
    }

    const nextWidgets = prefs.widgets.map(w => 
      w.id === id ? { ...w, enabled: !w.enabled } : w
    );
    const nextPrefs = { ...prefs, widgets: nextWidgets };
    setPrefs(nextPrefs);
    saveLockScreenPreferences(nextPrefs, currentUser?.id);
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
    saveLockScreenPreferences(nextPrefs, currentUser?.id);
  };

  const togglePrivacy = () => {
    const nextPrefs = { ...prefs, privacyMode: !prefs.privacyMode };
    setPrefs(nextPrefs);
    saveLockScreenPreferences(nextPrefs, currentUser?.id);
  };

  const restoreDefaults = () => {
    setPrefs(DEFAULT_LOCK_PREFERENCES);
    saveLockScreenPreferences(DEFAULT_LOCK_PREFERENCES, currentUser?.id);
    const loc = DEFAULT_WEATHER_LOCATIONS[0];
    weatherService.setLocation(loc);
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
      {/* 1. CINEMATIC EARTH WALLPAPER BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <OrionLiveWallpaper target="login" showLogo={false} />
        {/* Darkening & vignette overlay */}
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.50)_75%,rgba(0,0,0,0.85)_100%)]" />
      </div>

      {/* 2. TOP OS HEADER: Language Selector & Status */}
      <header className="relative z-30 w-full flex items-center justify-between">
        <div />

        {/* Top Right Language Selector Dropdown */}
        <div className="relative" data-testid="lock-language-selector">
          <button
            type="button"
            onClick={() => setIsLangMenuOpen(prev => !prev)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 backdrop-blur-2xl transition-all duration-200 cursor-pointer text-white/90 hover:text-white text-xs font-medium shadow-lg"
            aria-label="Select Language"
            aria-expanded={isLangMenuOpen}
          >
            <Globe className="w-3.5 h-3.5 text-white/70" />
            <span>{SUPPORTED_LOCALES[locale]?.nativeName || 'English'}</span>
            <ChevronDown className={cn("w-3 h-3 text-white/50 transition-transform", isLangMenuOpen && "rotate-180")} />
          </button>

          <WorldLanguagePanel
            isOpen={isLangMenuOpen}
            onClose={() => setIsLangMenuOpen(false)}
            currentLocale={locale}
            onSelectLocale={(loc) => {
              setLocale(loc as any);
              setIsLangMenuOpen(false);
            }}
          />
        </div>
      </header>

      {/* 3. CLOCK & WIDGETS ROW */}
      <div className="relative z-10 flex flex-col items-center text-center mt-1 sm:mt-4">
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
              const city = weatherData?.city || prefs.weatherLocationCity || 'Local';
              const tempText = weatherData 
                ? `${weatherData.temperatureC}°C • ${weatherData.description}` 
                : weatherLoading 
                ? 'Updating…' 
                : 'Weather unavailable';
              const subText = weatherData && weatherData.highC !== undefined && weatherData.lowC !== undefined
                ? `H: ${weatherData.highC}° L: ${weatherData.lowC}° • ${city}`
                : city;

              return (
                <div
                  key="weather"
                  data-testid="widget-weather"
                  className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 backdrop-blur-2xl shadow-lg transition-all"
                  title={`Live Weather for ${city}`}
                >
                  <CloudSun className="w-4 h-4 text-amber-300 shrink-0" />
                  <div className="text-left">
                    <div className="text-[11px] font-semibold text-white tabular-nums leading-tight">
                      {tempText}
                    </div>
                    <div className="text-[10px] text-white/60 font-mono leading-tight">
                      {subText}
                    </div>
                  </div>
                </div>
              );
            }

            if (w.id === 'calendar') {
              const dayStr = currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
              return (
                <div
                  key="calendar"
                  data-testid="widget-calendar"
                  className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 backdrop-blur-2xl shadow-lg transition-all"
                  title="Calendar Schedule"
                >
                  <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
                  <div className="text-left">
                    <div className="text-[11px] font-semibold text-white leading-tight">
                      {dayStr}
                    </div>
                    <div className="text-[10px] text-white/60 font-mono leading-tight">
                      No conflicting events
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

      {/* 4. CENTER: User Authentication Capsule */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: isReduced ? 0.1 : 0.4 }}
        className="relative z-10 flex flex-col items-center max-w-sm w-full px-6 text-center my-auto"
      >
        {/* User Avatar */}
        <div className="relative mb-4">
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

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[10px] font-mono text-white/70 uppercase tracking-widest mb-5">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>Workstation Locked</span>
        </div>

        {/* Password Credential Capsule */}
        <div className="w-full mb-3">
          <div className={cn(
            "orion-login-capsule relative flex items-center h-[48px] rounded-full",
            "bg-[rgba(45,50,60,0.65)] hover:bg-[rgba(55,60,72,0.70)] transition-all duration-300",
            "backdrop-blur-2xl border shadow-[0_12px_36px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.25)]",
            errorMsg ? "border-red-500 ring-4 ring-red-500/25" : "border-emerald-500/80 ring-4 ring-emerald-500/25"
          )}>
            <div className="pl-4 pr-1.5 flex items-center pointer-events-none text-white/70">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              autoFocus
              data-orion-glass-input="true"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Enter password..."
              className="flex-1 bg-transparent border-none text-white text-[14px] placeholder:text-white/50 focus:outline-none focus:ring-0 px-2 font-normal selection:bg-emerald-500/35 selection:text-white text-center"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUnlockAttempt();
              }}
            />
            {/* Password visibility toggle */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="pr-4 text-white/60 hover:text-white transition-colors cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Inline Error Message */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mb-4 text-xs text-red-300 flex items-center justify-center gap-1.5 font-medium"
            >
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

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

        <span className="text-[10px] text-white/40 font-mono mt-4">
          Press Enter to resume session
        </span>
      </motion.div>

      {/* 5. FOOTER: Power & Session Controls */}
      <footer className="relative z-20 w-full flex items-center justify-between pb-1">
        {/* Power Menu on Bottom Left */}
        <div className="relative" ref={powerMenuRef}>
          <button
            type="button"
            onClick={() => setIsPowerMenuOpen(prev => !prev)}
            title="Power Controls"
            aria-label="Power Controls"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 transition-all duration-200 backdrop-blur-2xl cursor-pointer text-white/70 hover:text-white shadow-lg active:scale-95"
          >
            <Power className="w-4 h-4 shrink-0 text-white/80" />
          </button>

          <AnimatePresence>
            {isPowerMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-12 left-0 w-44 rounded-2xl bg-[rgba(24,28,36,0.95)] border border-white/20 shadow-2xl p-2 backdrop-blur-3xl space-y-1 text-left z-50"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsPowerMenuOpen(false);
                    triggerSleep();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Moon className="w-3.5 h-3.5 text-sky-400" />
                  <span>Sleep</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPowerMenuOpen(false);
                    triggerRestart();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Restart</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPowerMenuOpen(false);
                    triggerShutdown();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-300 hover:text-red-200 hover:bg-red-500/20 transition-colors cursor-pointer"
                >
                  <Power className="w-3.5 h-3.5 text-red-400" />
                  <span>Shut Down</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Switch User / Log Out on Bottom Right */}
        <button
          type="button"
          onClick={() => signOut()}
          title="Switch User / Sign Out"
          aria-label="Switch User / Sign Out"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 transition-all duration-200 backdrop-blur-2xl cursor-pointer text-white/70 hover:text-white shadow-lg active:scale-95"
        >
          <User className="w-4 h-4 shrink-0 text-white/80" />
        </button>
      </footer>

      {/* 6. IN-PLACE LOCK SCREEN WIDGET CONFIGURATION MODAL */}
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
              className="w-full max-w-md rounded-2xl bg-[rgba(24,28,36,0.95)] border border-white/20 shadow-2xl p-6 backdrop-blur-3xl text-left select-none space-y-5"
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
                  className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close widget settings"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-white/70">
                Choose up to 3 widgets to display on the lock screen. You can reorder their priority, select your weather city, and toggle notification privacy without unlocking the workstation.
              </p>

              {/* Widget Toggles & Order */}
              <div className="space-y-2.5">
                {[...prefs.widgets].sort((a, b) => a.order - b.order).map((w, idx) => {
                  const label = w.id === 'time-date' 
                    ? 'Time & Date (Digital & Timezone)' 
                    : w.id === 'weather' 
                    ? `Weather (${prefs.weatherLocationCity || 'Live'} Conditions)` 
                    : w.id === 'calendar'
                    ? 'Calendar (Upcoming & Today)'
                    : 'System Notifications (Alerts Summary)';

                  const IconComp = w.id === 'time-date' ? Clock : w.id === 'weather' ? CloudSun : w.id === 'calendar' ? Calendar : Bell;

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
                          className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-20 text-white transition-colors cursor-pointer"
                          title="Move Left / Earlier"
                          aria-label={`Move ${w.id} earlier`}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === prefs.widgets.length - 1}
                          onClick={() => moveWidget(w.id, 'down')}
                          className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-20 text-white transition-colors cursor-pointer"
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

              {/* Weather Location Selector */}
              <div className="p-3 rounded-xl border border-white/10 bg-white/[0.04] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Weather Location</span>
                  <span className="text-[10px] text-white/50 font-mono">Open-Meteo Live</span>
                </div>
                <select
                  value={prefs.weatherLocationCity || 'New York'}
                  onChange={(e) => {
                    const nextCity = e.target.value;
                    const nextPrefs = { ...prefs, weatherLocationCity: nextCity };
                    setPrefs(nextPrefs);
                    saveLockScreenPreferences(nextPrefs, currentUser?.id);
                    const matchedLoc = DEFAULT_WEATHER_LOCATIONS.find(l => l.city === nextCity);
                    if (matchedLoc) weatherService.setLocation(matchedLoc);
                  }}
                  className="w-full text-xs bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
                >
                  {DEFAULT_WEATHER_LOCATIONS.map(loc => (
                    <option key={loc.city} value={loc.city} className="bg-slate-900 text-white">
                      {loc.city} ({loc.timezone})
                    </option>
                  ))}
                </select>
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

              {/* Action Buttons: Restore Defaults & Done */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={restoreDefaults}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Restore Defaults
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md cursor-pointer"
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
export default OrionLockScreen;
