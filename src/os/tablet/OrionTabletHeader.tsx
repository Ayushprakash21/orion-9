/**
 * ORION-9 TABLET SYSTEM BAR
 * Clean, touch-safe 52px header with responsive grouping and no colliding navigation links.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useNotifications } from '../../store/NotificationContext';
import { useConnectivity } from '../../store/ConnectivityContext';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { useTabletNavigation } from './OrionTabletNavigation';
import { NotificationCenter } from '../../components/modals/NotificationCenter';
import { 
  Infinity, 
  Search, 
  Bell, 
  Wifi, 
  WifiOff, 
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';

export const OrionTabletHeader: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  const { isOnline } = useConnectivity();
  const { openOrionAI, navigateToTab } = useTabletNavigation();
  
  const environment = dbManager.getEnvironment();
  const isLive = environment === 'LIVE';

  const [currentTime, setCurrentTime] = useState<string>('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header 
      className="relative z-40 bg-os-surface/90 backdrop-blur-md border-b border-os-border h-[52px] px-4 flex items-center justify-between shrink-0 select-none pt-[env(safe-area-inset-top,0px)]"
      style={{ minHeight: '52px' }}
    >
      {/* 1. BRAND & ENVIRONMENT */}
      <div className="flex items-center gap-3 min-w-0">
        <div 
          onClick={() => navigateToTab('home')}
          className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Infinity size={16} />
          </div>
          <span className="font-mono text-sm font-bold tracking-wider text-os-text-primary">
            ORION-9
          </span>
        </div>

        {/* Truthful Database Environment Badge */}
        <div className="flex items-center">
          <span 
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border transition-colors ${
              isLive
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/40'
            }`}
          >
            {environment}
          </span>
        </div>

        {/* Workspace Context Tag */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-os-surface-secondary border border-os-border text-[11px] font-mono text-os-text-secondary">
          <Layers size={12} className="text-cyan-400" />
          <span>OPERATIONS WORKSPACE</span>
        </div>
      </div>

      {/* 2. TABLET ACTIONS & SYSTEM STATUS */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Search Quick Action */}
        <button
          type="button"
          onClick={() => navigateToTab('apps')}
          className="w-10 h-10 rounded-xl bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border flex items-center justify-center text-os-text-secondary hover:text-os-text-primary active:scale-95 transition-all cursor-pointer"
          aria-label="Search Applications"
          title="Search (⌘K)"
        >
          <Search size={16} />
        </button>

        {/* AI Quick Button */}
        <button
          type="button"
          onClick={() => openOrionAI()}
          className="px-3 h-10 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center gap-1.5 text-xs font-mono font-bold active:scale-95 transition-all cursor-pointer"
          aria-label="Launch ORION AI"
          title="Open ORION AI"
        >
          <Sparkles size={14} />
          <span className="hidden sm:inline">AI</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(prev => !prev)}
            className="relative w-10 h-10 rounded-xl bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border flex items-center justify-center text-os-text-secondary hover:text-os-text-primary active:scale-95 transition-all cursor-pointer"
            aria-label="Open Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>

          {/* Notification Popover */}
          {isNotificationsOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50">
              <NotificationCenter
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
              />
            </div>
          )}
        </div>

        {/* Network Indicator */}
        <div className="w-9 h-9 rounded-xl bg-os-surface-secondary border border-os-border flex items-center justify-center text-os-text-muted">
          {isOnline ? (
            <Wifi size={14} className="text-emerald-400" />
          ) : (
            <WifiOff size={14} className="text-red-400" />
          )}
        </div>

        {/* System Time */}
        <div className="hidden md:flex items-center px-2.5 h-9 rounded-xl bg-os-surface-secondary border border-os-border font-mono text-xs font-medium text-os-text-secondary">
          {currentTime || '00:00'}
        </div>

        {/* User Identity / Avatar */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold shadow-xs">
            {currentUser?.fullName?.charAt(0) || 'A'}
          </div>
        </div>
      </div>
    </header>
  );
};
