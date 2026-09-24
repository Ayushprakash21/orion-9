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
    <header className="orion-global-topbar relative top-auto left-auto right-auto h-[44px] min-h-[44px] w-full z-[10000] flex items-center justify-between px-3 md:px-4 text-[12px] font-medium text-os-text-secondary select-none bg-os-surface/80 dark:bg-[#0c0d10]/80 backdrop-blur-xl border-b border-os-border shadow-xs pointer-events-auto shrink-0">
      
      {/* LEFT: ORION HOME BUTTON & MENU */}
      <div className="flex items-center h-full min-w-0" ref={menuRef}>
        {/* ORION SYSTEM MENU TRIGGER — the branded logo area is the system menu. */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className={cn("flex items-center h-full px-2.5 gap-2.5 hover:bg-os-surface-active hover:text-white transition-all cursor-pointer rounded-sm shrink-0 group", menuOpen && "bg-os-surface-active text-white")}
          title="System Menu"
          aria-label="Open ORION System Menu"
          aria-expanded={menuOpen}
        >
          <BrandLogo sizePreset="sm" variant="mark" />
          <span className="font-mono font-bold text-[13px] md:text-[14px] tracking-wider uppercase hidden sm:inline-block shrink-0 whitespace-nowrap text-os-text-primary group-hover:text-os-text-primary transition-all">
            ORION
          </span>
          <span 
            onClick={(e) => {
              if (isAdmin) {
                e.stopPropagation();
                navigate('/admin/database');
              }
            }}
            className={cn(
              "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider select-none transition-all",
              dbEnv === 'LIVE'
                ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                : "bg-amber-950/80 text-amber-400 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.2)]",
              isAdmin && "hover:border-cyan-400 hover:text-white"
            )}
            title={isAdmin ? `Database: ${dbEnv}. Click to open Control Plane.` : `Database: ${dbEnv}`}
          >
            {dbEnv}
          </span>
          {isAdmin && (
            <>
              <span className="text-white/20 font-mono text-[10px] select-none mx-1">|</span>
              <span className="text-[11px] font-mono tracking-widest text-os-text-muted uppercase whitespace-nowrap hidden sm:inline">
                PLATFORM CONTROL PLANE
              </span>
            </>
          )}
        </button>

        {/* Separator / */}
        <span className="text-os-text-primary/20 mx-1 font-mono text-[10px] select-none">/</span>

        {/* Refresh/Sync Icon */}
        <button 
          onClick={() => {
            window.dispatchEvent(new CustomEvent('orion:desktop-refresh', { detail: { timestamp: Date.now() } }));
          }}
          className="hidden sm:flex items-center h-full px-2 text-os-text-muted hover:bg-os-surface-active hover:text-os-accent transition-colors cursor-pointer rounded-sm"
          title="Refresh State"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Fullscreen Icon */}
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
          className="hidden md:flex items-center h-full px-2 text-os-text-muted hover:bg-os-surface-active hover:text-os-accent transition-colors cursor-pointer rounded-sm"
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

      {/* CENTER: WORKSPACE SWITCHER & ACTIVE APP (Tablet / Desktop) */}
      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-2 max-w-[42vw] min-w-0">
        <div className="flex items-center bg-os-surface-active/60 p-0.5 rounded-lg border border-os-border/40">
          {WORKSPACES.map(ws => (
            <button
              key={ws.id}
              onClick={() => setWorkspace(ws.id)}
              className={cn(
                "px-2.5 py-0.5 text-[10px] font-mono tracking-wider transition-all cursor-pointer",
                activeWorkspaceId === ws.id
                  ? "bg-os-surface text-os-text-primary shadow-xs rounded-md font-semibold"
                  : "text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover/50 rounded-md"
              )}
            >
              {ws.name}
            </button>
          ))}
        </div>

        {activeApp && (
          <div className="hidden lg:flex items-center gap-1.5 pl-1.5 text-os-text-muted border-l border-os-border">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeApp.color }} />
            <span className="text-[11px] font-medium text-os-text-primary truncate max-w-[160px]">
              {activeApp.name}
            </span>
          </div>
        )}
      </div>

      {/* RIGHT: SYSTEM TRAY */}
      <div className="flex items-center h-full gap-0.5 sm:gap-1 shrink-0 min-w-0">
        <button 
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center hover:bg-os-surface-hover hover:text-os-text-primary rounded-md p-1.5 transition-colors text-os-text-muted cursor-pointer"
          title="Search (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        <div className="relative flex items-center notification-anchor" ref={notifRef}>
          <button 
            type="button"
            onClick={() => setNotificationsOpen(v => !v)}
            className={cn(
              "relative flex items-center hover:bg-os-surface-hover hover:text-os-text-primary rounded-md p-1.5 transition-colors cursor-pointer outline-none",
              hasCriticalExceptions ? "text-red-400" : "text-os-text-muted",
              notificationsOpen && "bg-os-surface-active text-os-text-primary shadow-inner"
            )}
            title={hasCriticalExceptions ? "Critical exceptions detected" : "Notifications"}
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
          >
            <Bell className="w-3.5 h-3.5" />
            {(unreadCount > 0 || hasCriticalExceptions) && (
              <span
                className={cn(
                  "absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full",
                  hasCriticalExceptions ? "bg-red-500 shadow-[0_0_5px_#EF4444] animate-pulse" : "bg-os-accent shadow-md shadow-os-accent/20"
                )}
              />
            )}
          </button>
          {notificationsOpen && (
            <div className="notification-popover absolute right-0 top-[calc(100%+6px)] w-[min(390px,calc(100vw-24px))] max-h-[calc(100vh-66px)] z-[2147483600] bg-os-surface border border-os-border rounded-lg shadow-2xl overflow-hidden">
              <NotificationCenter isOpen={true} onClose={() => setNotificationsOpen(false)} />
            </div>
          )}
        </div>

        <div className="relative flex items-center network-anchor" ref={networkRef}>
          <button 
            type="button"
            onClick={() => setNetworkOpen(v => !v)}
            className={cn(
              "relative flex items-center hover:bg-os-surface-hover rounded-md p-1.5 transition-colors cursor-pointer outline-none",
              isOnline ? (isLocalMode ? "text-amber-400" : "text-emerald-400") : "text-red-400",
              networkOpen && "bg-os-surface-active text-os-text-primary shadow-inner"
            )}
            title={statusLabel}
            aria-label="Network Connections"
            aria-expanded={networkOpen}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          </button>
        </div>

        <button
          type="button"
          onClick={() => openApplication('time-world')}
          className="hidden sm:flex group relative items-center font-mono text-[11px] text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover rounded-md p-1.5 transition-colors cursor-pointer"
          aria-label="Open Time & World settings"
          title="Open Time & World"
        >
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          <span className="pointer-events-none absolute right-0 top-[calc(100%+7px)] z-[2147483600] min-w-[190px] rounded-md border border-os-border bg-os-surface/95 backdrop-blur-xl px-3 py-2 text-left opacity-0 translate-y-[-3px] group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 shadow-2xl">
            <span className="block font-mono text-[12px] text-os-text-primary">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            <span className="block mt-1 text-[10px] text-os-text-secondary">{new Intl.DateTimeFormat(undefined, { timeZoneName: 'long' }).formatToParts(currentTime).find(p => p.type === 'timeZoneName')?.value || 'Local Time'}</span>
            <span className="block mt-0.5 text-[9px] font-mono text-cyan-300">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
          </span>
        </button>

        <div className="flex items-center h-full pl-0.5 sm:pl-1">
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
