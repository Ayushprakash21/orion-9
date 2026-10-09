import React, { useState, useEffect, useRef } from 'react';
import { 
  Sliders, 
  Sun, 
  Volume2, 
  VolumeX, 
  Moon, 
  Wifi, 
  WifiOff, 
  Database, 
  BellOff, 
  Bell, 
  Layers, 
  Settings, 
  Folder,
  Monitor
} from 'lucide-react';
import { useOrionTheme } from '../theme/useOrionTheme';
import { useWindowManager } from '../WindowManagerContext';
import { useToast } from '../../store/ToastContext';
import { DatabaseConnectionManager } from '../../core/database/DatabaseConnectionManager';
import { cn } from '../../lib/utils';

interface OrionControlCenterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrionControlCenterPopover({ isOpen, onClose }: OrionControlCenterPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const { preferences, setPreference, isDark } = useOrionTheme();
  const { openApplication, toggleMissionControl } = useWindowManager();
  const { showToast } = useToast();

  // Genuine display brightness state (100% default, min 40%, max 120%)
  const [brightness, setBrightness] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orion_display_brightness');
      return saved ? Number(saved) : 100;
    }
    return 100;
  });

  // Genuine sound volume state (80% default, 0% to 100%)
  const [volume, setVolume] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orion_sound_volume');
      return saved ? Number(saved) : 80;
    }
    return 80;
  });

  const [isMuted, setIsMuted] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('orion_focus_mode') === 'true';
    }
    return false;
  });

  // Database environment
  const dbManager = DatabaseConnectionManager.getInstance();
  const currentEnv = dbManager.getEnvironment();

  // Apply real brightness to document root filter
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const bRatio = brightness / 100;
      document.documentElement.style.filter = brightness === 100 ? '' : `brightness(${bRatio})`;
      localStorage.setItem('orion_display_brightness', String(brightness));
    }
  }, [brightness]);

  // Volume persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('orion_sound_volume', String(volume));
    }
  }, [volume]);

  // Outside click to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleFocusMode = () => {
    const next = !isFocusMode;
    setIsFocusMode(next);
    localStorage.setItem('orion_focus_mode', String(next));
    showToast(next ? 'Focus Mode enabled (Do Not Disturb)' : 'Focus Mode disabled', 'info', 'Control Center');
  };

  const toggleAppearance = () => {
    const nextMode = isDark ? 'light' : 'dark';
    setPreference('appearanceMode', nextMode);
    showToast(`Switched to ${nextMode} mode`, 'info', 'Appearance');
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    showToast(!isMuted ? 'Muted audio' : 'Unmuted audio', 'info', 'Sound');
  };

  const effectiveVolume = isMuted ? 0 : volume;

  return (
    <div
      ref={popoverRef}
      data-testid="orion-control-center-popover"
      className="fixed sm:absolute right-2 sm:right-12 top-[calc(env(safe-area-inset-top,0px)+46px)] sm:top-[calc(100%+6px)] w-[min(calc(100vw-16px),340px)] z-50 bg-[#161a22]/90 backdrop-blur-2xl border border-white/[0.14] rounded-2xl shadow-2xl p-3 flex flex-col gap-2.5 text-white select-none animate-in fade-in zoom-in-95"
    >
      {/* 2x2 Grid of Quick Modules */}
      <div className="grid grid-cols-2 gap-2">
        {/* Module 1: Network & Database */}
        <div className="p-2.5 rounded-xl bg-white/[0.06] border border-white/10 flex flex-col justify-between h-[84px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">Network</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wifi className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-white truncate">Connected</div>
            <div className="text-[10px] text-white/50 flex items-center gap-1 mt-0.5">
              <Database className="w-2.5 h-2.5 text-cyan-400" />
              <span>ENV: <strong className="text-white/80">{currentEnv}</strong></span>
            </div>
          </div>
        </div>

        {/* Module 2: Focus / Do Not Disturb */}
        <button
          type="button"
          onClick={toggleFocusMode}
          className={cn(
            "p-2.5 rounded-xl border flex flex-col justify-between h-[84px] text-left transition-all cursor-pointer",
            isFocusMode
              ? "bg-purple-600/30 border-purple-400/50 shadow-md shadow-purple-900/30"
              : "bg-white/[0.06] border-white/10 hover:bg-white/[0.10]"
          )}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">Focus</span>
            <div className={cn(
              "w-6 h-6 rounded-lg flex items-center justify-center transition-colors",
              isFocusMode ? "bg-purple-500 text-white" : "bg-white/10 text-white/70"
            )}>
              {isFocusMode ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-white">
              {isFocusMode ? 'Do Not Disturb' : 'Notifications On'}
            </div>
            <div className="text-[10px] text-white/50 mt-0.5">
              {isFocusMode ? 'Muting Alerts' : 'Normal Priority'}
            </div>
          </div>
        </button>

        {/* Module 3: Dark / Light Mode */}
        <button
          type="button"
          onClick={toggleAppearance}
          className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 flex flex-col justify-between h-[84px] text-left transition-all cursor-pointer col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">Theme</span>
            <div className="w-6 h-6 rounded-lg bg-white/10 text-white/80 flex items-center justify-center">
              {isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-300" />}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-white">
              {isDark ? 'Dark Surface' : 'Light Surface'}
            </div>
            <div className="text-[10px] text-white/50 capitalize mt-0.5">
              Theme: {preferences.themeId}
            </div>
          </div>
        </button>

        {/* Module 4: Spaces / Mission Control shortcut */}
        <button
          type="button"
          onClick={() => {
            onClose();
            toggleMissionControl();
          }}
          className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 flex flex-col justify-between h-[84px] text-left transition-all cursor-pointer col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">Spaces</span>
            <div className="w-6 h-6 rounded-lg bg-white/10 text-white/80 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-white">Mission Control</div>
            <div className="text-[10px] text-white/50 mt-0.5">Switch & Manage Desktops</div>
          </div>
        </button>
      </div>

      {/* Sliders: Display Brightness & Sound Volume */}
      <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-white/[0.06] border border-white/10">
        {/* Brightness */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-white/70">
            <span className="flex items-center gap-1.5 font-medium">
              <Sun className="w-3.5 h-3.5 text-amber-300" /> Display Brightness
            </span>
            <span className="font-mono text-[10px] text-white/50">{brightness}%</span>
          </div>
          <input
            type="range"
            min="40"
            max="120"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="w-full accent-white/90 h-1.5 bg-white/20 rounded-lg cursor-pointer"
          />
        </div>

        <div className="h-px bg-white/10 my-1" />

        {/* Sound Volume */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-white/70">
            <button
              type="button"
              onClick={toggleMute}
              className="flex items-center gap-1.5 font-medium hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-white/80" />
              )}
              Sound Volume
            </button>
            <span className="font-mono text-[10px] text-white/50">{effectiveVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={effectiveVolume}
            onChange={(e) => {
              if (isMuted) setIsMuted(false);
              setVolume(Number(e.target.value));
            }}
            className="w-full accent-white/90 h-1.5 bg-white/20 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Quick Settings & Navigation Links */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        <button
          type="button"
          onClick={() => {
            onClose();
            openApplication('settings');
          }}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-medium text-white transition-colors"
        >
          <Settings className="w-3.5 h-3.5 text-white/70" />
          Settings
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            openApplication('file-manager');
          }}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-medium text-white transition-colors"
        >
          <Folder className="w-3.5 h-3.5 text-amber-300" />
          Files
        </button>
      </div>
    </div>
  );
}
