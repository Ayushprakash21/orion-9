import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWindowManager, WORKSPACES, WorkspaceId } from '../WindowManagerContext';
import { ORION_REGISTRY } from '../OrionApplicationRegistry';
import { Search, Brain, Bell, Wifi, WifiOff, RefreshCw, Maximize2 } from 'lucide-react';
import { AccountMenu } from '../../components/layout/AccountMenu';
import { useNotifications } from '../../store/NotificationContext';
import { useConnectivity } from '../../store/ConnectivityContext';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useAuth } from '../../store/AuthContext';
import { OrionSystemMenu } from './OrionSystemMenu';
import { NotificationCenter } from '../../components/modals/NotificationCenter';
import { SystemStatusModal } from '../../components/modals/SystemStatusModal';
import { NetworkConnectionPopover } from './NetworkConnectionPopover';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { useBranding } from '../../store/BrandingContext';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { DatabaseEnvironmentMode } from '../../core/database/DatabaseEnvironment';
import { cn } from '../../lib/utils';

export function OrionSystemBar() {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const { isAdmin } = useAuth();
  const { activeAppId, setCommandPaletteOpen, activeWorkspaceId, setWorkspace, openApplication } = useWindowManager();
  const { unreadCount } = useNotifications();
  const { isOnline, statusLabel, isLocalMode } = useConnectivity();
  const { exceptions } = useSupplyChain();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [networkOpen, setNetworkOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [dbEnv, setDbEnv] = useState<DatabaseEnvironmentMode>(() => dbManager.getEnvironment());
  
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<HTMLDivElement>(null);

  // Check for critical exceptions to inform notification badge status
  const hasCriticalExceptions = exceptions?.some(e => e.severity === 'Critical') ?? false;

  useEffect(() => {
    const handleEnvChanged = () => {
      setDbEnv(dbManager.getEnvironment());
    };
    window.addEventListener('orion-database-environment-changed', handleEnvChanged);
    return () => window.removeEventListener('orion-database-environment-changed', handleEnvChanged);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcuts for workspaces: Alt+1, Alt+2, Alt+3
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        setWorkspace('operations');
      } else if ((e.altKey || e.metaKey) && e.key === '2') {
        e.preventDefault();
        setWorkspace('intelligence');
      } else if ((e.altKey || e.metaKey) && e.key === '3') {
        e.preventDefault();
        setWorkspace('control');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setWorkspace]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (networkRef.current && !networkRef.current.contains(e.target as Node)) {
        // Network popover also handles its internal outside click
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeApp = activeAppId ? ORION_REGISTRY[activeAppId] : null;

  return (
    <header className="orion-global-topbar relative top-auto left-auto right-auto h-[44px] min-h-[44px] w-full z-[10000] flex items-center justify-between px-3 md:px-4 text-[12px] font-medium text-os-text-secondary select-none bg-[#12151a]/85 dark:bg-[#0c0e11]/90 backdrop-blur-2xl border-b border-white/[0.08] shadow-xs pointer-events-auto shrink-0 transition-colors">
      
      {/* LEFT: ORION HOME BUTTON & MENU */}
      <div className="flex items-center h-full min-w-0 gap-1.5" ref={menuRef}>
        {/* ORION SYSTEM MENU TRIGGER */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className={cn(
            "flex items-center h-[32px] px-2.5 gap-2 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer rounded-lg shrink-0 group",
            menuOpen && "bg-white/[0.12] text-white"
          )}
          title="Orion System Menu"
          aria-label="Open ORION System Menu"
          aria-expanded={menuOpen}
        >
          <BrandLogo sizePreset="sm" variant="mark" />
          <span className="font-semibold text-[13px] tracking-wide text-os-text-primary group-hover:text-white transition-all hidden sm:inline-block shrink-0">
            Orion OS
          </span>
          <span 
            onClick={(e) => {
              if (isAdmin) {
                e.stopPropagation();
                navigate('/admin/database');
              }
            }}
            className={cn(
              "text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-md border uppercase tracking-wider select-none transition-all",
              dbEnv === 'LIVE'
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-400 border-amber-500/30",
              isAdmin && "hover:border-sky-400 hover:text-white"
            )}
            title={isAdmin ? `Database: ${dbEnv}. Click to open Control Plane.` : `Database: ${dbEnv}`}
          >
            {dbEnv}
          </span>
        </button>

        {/* Sync/Refresh Action */}
        <button 
          onClick={() => {
            window.dispatchEvent(new CustomEvent('orion:desktop-refresh', { detail: { timestamp: Date.now() } }));
          }}
          className="hidden sm:flex items-center justify-center w-8 h-8 text-os-text-muted hover:bg-white/[0.06] hover:text-os-text-primary transition-colors cursor-pointer rounded-lg"
          title="Refresh State"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Fullscreen Action */}
        <button 
          onClick={() => {
            if (typeof document !== 'undefined') {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              } else {
                document.documentElement.requestFullscreen().catch(() => {});
              }
            }
          }}
          className="hidden md:flex items-center justify-center w-8 h-8 text-os-text-muted hover:bg-white/[0.06] hover:text-os-text-primary transition-colors cursor-pointer rounded-lg"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {menuOpen && (
          <div className="absolute top-[48px] left-2 z-[2147483600]">
            <OrionSystemMenu onClose={() => setMenuOpen(false)} />
          </div>
        )}
      </div>

      {/* CENTER: CONTEXTUAL ACTIVE APPLICATION INDICATOR (OS-Level System Bar) */}
      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-2 max-w-[40vw] min-w-0 pointer-events-none">
        {activeApp ? (
          <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.04] border border-white/[0.08] rounded-xl backdrop-blur-md shadow-xs">
            <span className="w-2 h-2 rounded-full shadow-xs shrink-0" style={{ backgroundColor: activeApp.color || '#38bdf8' }} />
            <span className="text-[12px] font-semibold text-os-text-primary truncate max-w-[180px]">
              {activeApp.name}
            </span>
          </div>
        ) : (
          <div className="text-[11px] font-medium text-os-text-muted/60 tracking-wider uppercase">
            Orion OS Desktop
          </div>
        )}
      </div>

      {/* RIGHT: SYSTEM TRAY */}
      <div className="flex items-center h-full gap-1 shrink-0 min-w-0">
        {/* Orion Copilot AI Quick Launch */}
        <button 
          onClick={() => openApplication('ai-copilot')}
          data-testid="orion-copilot-button"
          className="flex items-center gap-1.5 px-2.5 py-1 text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-lg transition-all cursor-pointer text-[11px] font-medium"
          title="Open Orion AI Copilot"
          aria-label="Open Orion AI Copilot"
          type="button"
        >
          <Brain className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Copilot</span>
        </button>

        {/* Global Search */}
        <button 
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center justify-center w-8 h-8 hover:bg-white/[0.06] hover:text-os-text-primary rounded-lg transition-colors text-os-text-muted cursor-pointer"
          title="Search (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Notifications */}
        <div className="relative flex items-center notification-anchor" ref={notifRef}>
          <button 
            type="button"
            onClick={() => setNotificationsOpen(v => !v)}
            className={cn(
              "relative flex items-center justify-center w-8 h-8 hover:bg-white/[0.06] hover:text-os-text-primary rounded-lg transition-colors cursor-pointer outline-none",
              hasCriticalExceptions ? "text-red-400" : "text-os-text-muted",
              notificationsOpen && "bg-white/[0.12] text-os-text-primary"
            )}
            title={hasCriticalExceptions ? "Critical exceptions detected" : "Notifications"}
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
          >
            <Bell className="w-3.5 h-3.5" />
            {(unreadCount > 0 || hasCriticalExceptions) && (
              <span
                className={cn(
                  "absolute top-1.5 right-1.5 w-2 h-2 rounded-full",
                  hasCriticalExceptions ? "bg-red-500 shadow-sm shadow-red-500/50 animate-pulse" : "bg-sky-500 shadow-sm shadow-sky-500/50"
                )}
              />
            )}
          </button>
          {notificationsOpen && (
            <div className="notification-popover fixed sm:absolute right-2 sm:right-0 top-[calc(env(safe-area-inset-top,0px)+46px)] sm:top-[calc(100%+6px)] w-[min(calc(100vw-16px),420px)] max-h-[calc(100dvh-120px)] sm:max-h-[480px] z-40 bg-os-surface border border-os-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              <NotificationCenter isOpen={true} onClose={() => setNotificationsOpen(false)} />
            </div>
          )}
        </div>

        {/* Network status */}
        <div className="relative flex items-center network-anchor" ref={networkRef}>
          <button 
            type="button"
            onClick={() => setNetworkOpen(v => !v)}
            className={cn(
              "relative flex items-center justify-center w-8 h-8 hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer outline-none",
              isOnline ? (isLocalMode ? "text-amber-400" : "text-emerald-400") : "text-red-400",
              networkOpen && "bg-white/[0.12] text-os-text-primary"
            )}
            title={statusLabel}
            aria-label="Network Connections"
            aria-expanded={networkOpen}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Clock */}
        <button
          type="button"
          onClick={() => openApplication('time-world')}
          className="hidden sm:flex group relative items-center px-2 py-1 text-[12px] font-medium text-os-text-secondary hover:text-os-text-primary hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
          aria-label="Open Time & World settings"
          title="Open Time & World"
        >
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          <span className="pointer-events-none absolute right-0 top-[calc(100%+7px)] z-[2147483600] min-w-[190px] rounded-xl border border-white/[0.08] bg-[#12151a]/95 backdrop-blur-2xl px-3.5 py-2.5 text-left opacity-0 translate-y-[-3px] group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 shadow-2xl">
            <span className="block font-mono text-[12px] font-medium text-os-text-primary">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            <span className="block mt-1 text-[11px] text-os-text-secondary">{new Intl.DateTimeFormat(undefined, { timeZoneName: 'long' }).formatToParts(currentTime).find(p => p.type === 'timeZoneName')?.value || 'Local Time'}</span>
            <span className="block mt-0.5 text-[10px] text-sky-400">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
          </span>
        </button>

        <div className="flex items-center h-full pl-1">
          <AccountMenu />
        </div>
      </div>

      {/* Network Connection OS Overlay Popover */}
      <NetworkConnectionPopover
        isOpen={networkOpen}
        anchorRect={networkRef.current ? networkRef.current.getBoundingClientRect() : null}
        onClose={() => setNetworkOpen(false)}
        onOpenSystemStatus={() => setStatusOpen(true)}
      />

      <SystemStatusModal isOpen={statusOpen} onClose={() => setStatusOpen(false)} />
    </header>
  );
}
