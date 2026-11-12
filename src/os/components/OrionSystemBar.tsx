import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWindowManager, WORKSPACES, WorkspaceId } from '../WindowManagerContext';
import { ORION_REGISTRY } from '../OrionApplicationRegistry';
import { 
  Search, 
  Brain, 
  Bell, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Maximize2, 
  Sliders,
  Cloud,
  Volume2,
  Battery,
  Activity,
  Layers,
  Sparkles,
  ChevronDown,
  Info
} from 'lucide-react';
import { AccountMenu } from '../../components/layout/AccountMenu';
import { useNotifications } from '../../store/NotificationContext';
import { useConnectivity } from '../../store/ConnectivityContext';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useAuth } from '../../store/AuthContext';
import { OrionSystemMenu } from './OrionSystemMenu';
import { NotificationCenter } from '../../components/modals/NotificationCenter';
import { SystemStatusModal } from '../../components/modals/SystemStatusModal';
import { NetworkConnectionPopover } from './NetworkConnectionPopover';
import { OrionControlCenterPopover } from './OrionControlCenterPopover';
import { useBranding } from '../../store/BrandingContext';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { DatabaseEnvironmentMode } from '../../core/database/DatabaseEnvironment';
import { cn } from '../../lib/utils';
import { ORION_OS_METADATA } from '../constants/OrionOsMetadata';
import { useOrionTheme } from '../theme/useOrionTheme';

const SystemBarClock = React.memo(function SystemBarClock({
  onOpenTimeWorld,
}: {
  onOpenTimeWorld: () => void;
}) {
  const { isDark } = useOrionTheme();
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    let timerId: number | null = null;
    if (hovered) {
      setCurrentTime(new Date());
      timerId = window.setInterval(() => setCurrentTime(new Date()), 1000);
      return () => {
        if (timerId !== null) window.clearInterval(timerId);
      };
    }

    const scheduleNextMinute = () => {
      const now = new Date();
      setCurrentTime(now);
      const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 50;
      timerId = window.setTimeout(scheduleNextMinute, Math.max(1000, msUntilNextMinute));
    };

    const now = new Date();
    const msFirst = (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 50;
    timerId = window.setTimeout(scheduleNextMinute, Math.max(1000, msFirst));

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        setCurrentTime(new Date());
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (timerId !== null) window.clearTimeout(timerId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [hovered]);

  const weekdayStr = currentTime.toLocaleDateString([], { weekday: 'short' });
  const monthStr = currentTime.toLocaleDateString([], { month: 'short' });
  const dayNum = currentTime.getDate();
  const timeStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const fullDateTimeDisplay = `${weekdayStr} ${monthStr} ${dayNum} ${timeStr}`;

  return (
    <button
      type="button"
      onClick={onOpenTimeWorld}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "hidden sm:flex group relative items-center px-2 h-[26px] text-[12px] font-medium rounded-md transition-colors cursor-pointer",
        isDark ? "text-white/90 hover:text-white hover:bg-white/[0.08]" : "text-[#202631] hover:text-black hover:bg-black/[0.06]"
      )}
      aria-label="Open Time & World settings"
      title="Open Time & World"
    >
      <span>{fullDateTimeDisplay}</span>
      <span className={cn(
        "pointer-events-none absolute right-0 top-[calc(100%+7px)] z-[2147483600] min-w-[210px] rounded-xl border px-3.5 py-2.5 text-left opacity-0 translate-y-[-3px] group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 shadow-2xl",
        isDark ? "border-white/[0.14] bg-[#161a22]/95" : "border-[#DCE1E7] bg-white/95"
      )}>
        <span className="block font-mono tabular-nums text-[12px] font-medium text-[var(--orion-text-primary)]">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
        <span className="block mt-1 text-[11px] text-[var(--orion-text-secondary)]">
          {Intl.DateTimeFormat().resolvedOptions().timeZone}
        </span>
      </span>
    </button>
  );
});

export const OrionSystemBar = React.memo(function OrionSystemBar() {
  const navigate = useNavigate();
  const { isDark } = useOrionTheme();
  const { branding } = useBranding();
  const { isAdmin } = useAuth();
  const { 
    activeAppId, 
    setCommandPaletteOpen, 
    activeWorkspaceId, 
    setWorkspace, 
    openApplication, 
    closeApplication,
    closeAllWindows,
    missionControlOpen, 
    setLauncherOpen 
  } = useWindowManager();
  const { unreadCount } = useNotifications();
  const { isOnline, statusLabel, isLocalMode } = useConnectivity();
  const { exceptions, settings, updateSettings } = useSupplyChain();
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTopMenu, setActiveTopMenu] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [networkOpen, setNetworkOpen] = useState(false);
  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [dbEnv, setDbEnv] = useState<DatabaseEnvironmentMode>(() => dbManager.getEnvironment());
  
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<HTMLDivElement>(null);
  const controlCenterRef = useRef<HTMLDivElement>(null);

  // Automatically dismiss popovers when Mission Control opens
  useEffect(() => {
    if (missionControlOpen) {
      setControlCenterOpen(false);
      setNotificationsOpen(false);
      setNetworkOpen(false);
      setMenuOpen(false);
      setActiveTopMenu(null);
    }
  }, [missionControlOpen]);

  const hasCriticalExceptions = exceptions?.some(e => e.severity === 'Critical') ?? false;

  useEffect(() => {
    const handleEnvChanged = () => {
      setDbEnv(dbManager.getEnvironment());
    };
    const handleOpenNotifications = () => {
      setNotificationsOpen(true);
    };
    window.addEventListener('orion-database-environment-changed', handleEnvChanged);
    window.addEventListener('orion:open-notifications', handleOpenNotifications);
    return () => {
      window.removeEventListener('orion-database-environment-changed', handleEnvChanged);
      window.removeEventListener('orion:open-notifications', handleOpenNotifications);
    };
  }, []);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setActiveTopMenu(null);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={cn(
      "orion-global-topbar relative top-auto left-auto right-auto h-[44px] min-h-[44px] w-full z-[10000] flex items-center justify-between px-3 md:px-4 text-[13px] font-medium select-none backdrop-blur-[20px] backdrop-saturate-[150%] pointer-events-auto shrink-0 transition-colors",
      isDark
        ? "bg-[rgba(18,22,28,0.78)] text-white/90 border-b border-white/[0.10] shadow-[0_2px_12px_rgba(0,0,0,0.18)]"
        : "bg-[rgba(255,255,255,0.85)] text-[#202631] border-b border-[#DCE1E7] shadow-[0_2px_12px_rgba(15,23,42,0.06)]"
    )}>
      
      {/* LEFT: Orion-9 Brand Mark, Title & Menus */}
      <div className="flex items-center h-full min-w-0 gap-1" ref={menuRef}>
        {/* Orion System Menu Trigger Button */}
        <button 
          onClick={() => {
            setMenuOpen(!menuOpen);
            setActiveTopMenu(null);
          }}
          data-testid="orion-brand-trigger-btn"
          className={cn(
            "flex items-center h-[26px] px-2 gap-1.5 rounded transition-colors cursor-pointer shrink-0",
            isDark
              ? "text-white/95 hover:bg-white/[0.12]"
              : "text-[#202631] hover:bg-black/[0.06]",
            menuOpen && (isDark ? "bg-white/[0.16] text-white" : "bg-black/[0.08] text-black")
          )}
          title="Orion System Menu"
          aria-label="Open ORION System Menu"
          aria-expanded={menuOpen}
        >
          {/* Orion-9 Official Brand Logo Mark */}
          <span className="orion-brand-image flex items-center justify-center">
            <BrandLogo sizePreset="xs" variant="mark" />
          </span>
          <span 
            onClick={(e) => {
              if (isAdmin) {
                e.stopPropagation();
                navigate('/admin/database');
              }
            }}
            className={cn(
              "text-[9px] font-mono font-medium px-1.5 py-0.2 rounded border uppercase tracking-wider select-none transition-all hidden xs:inline-block",
              dbEnv === 'DEMO' 
                ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
              isAdmin ? "cursor-pointer hover:scale-105" : "cursor-default"
            )}
          >
            {dbEnv}
          </span>
        </button>

        {/* Brand OS Name */}
        <span 
          onClick={() => openApplication('about')}
          className={cn(
            "font-bold text-[13px] tracking-tight px-1.5 py-0.5 rounded transition-colors cursor-pointer",
            isDark ? "text-white hover:bg-white/[0.08]" : "text-[#202631] hover:bg-black/[0.06]"
          )}
        >
          <span className="sr-only">Orion OS</span>
          Orion-9 OS
        </span>

        {/* Top Menus */}
        <div className={cn("hidden lg:flex items-center gap-0.5 text-[13px]", isDark ? "text-white/85" : "text-[#596273]")}>
          {['File', 'Edit', 'View', 'Go', 'Window', 'Help'].map((item) => (
            <div key={item} className="relative">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setActiveTopMenu(activeTopMenu === item ? null : item);
                }}
                className={cn(
                  "px-2.5 py-0.5 rounded text-[12px] font-normal transition-colors cursor-pointer",
                  isDark
                    ? "hover:bg-white/[0.12] hover:text-white"
                    : "hover:bg-black/[0.06] hover:text-[#202631]",
                  activeTopMenu === item && (isDark ? "bg-white/[0.16] text-white" : "bg-black/[0.08] text-[#202631]")
                )}
              >
                {item}
              </button>

              {activeTopMenu === item && (
                <div 
                  className={cn(
                    "absolute top-[32px] left-0 min-w-[200px] rounded-xl border py-1.5 shadow-2xl z-[2147483600] flex flex-col text-left text-xs backdrop-blur-2xl animate-in fade-in zoom-in-95",
                    isDark
                      ? "border-white/[0.14] bg-[#161a22]/95 text-white/90"
                      : "border-[#DCE1E7] bg-white/98 text-[#202631] shadow-[0_16px_36px_rgba(15,23,42,0.12)]"
                  )}
                >
                  {item === 'File' && (
                    <>
                      <button onClick={() => { openApplication('file-manager'); setActiveTopMenu(null); }} className={cn("px-3 py-1.5 text-left cursor-pointer flex justify-between", isDark ? "hover:bg-white/10" : "hover:bg-black/[0.05]")}>
                        <span>New Window</span> <span className={isDark ? "text-white/40" : "text-[#8C95A5]"}>⌘N</span>
                      </button>
                      <button onClick={() => { openApplication('orion-documents'); setActiveTopMenu(null); }} className={cn("px-3 py-1.5 text-left cursor-pointer", isDark ? "hover:bg-white/10" : "hover:bg-black/[0.05]")}>
                        New Document
                      </button>
                      <div className={cn("h-px my-1", isDark ? "bg-white/10" : "bg-[#DCE1E7]")} />
                      <button onClick={() => { if (activeAppId) closeApplication(activeAppId); setActiveTopMenu(null); }} className={cn("px-3 py-1.5 text-left cursor-pointer flex justify-between", isDark ? "hover:bg-white/10" : "hover:bg-black/[0.05]")}>
                        <span>Close Window</span> <span className={isDark ? "text-white/40" : "text-[#8C95A5]"}>⌘W</span>
                      </button>
                    </>
                  )}
                  {item === 'Edit' && (
                    <>
                      <div className={cn("px-3 py-1.5 text-left flex justify-between", isDark ? "text-white/40" : "text-[#8C95A5]")}><span>Undo</span> <span>⌘Z</span></div>
                      <div className={cn("px-3 py-1.5 text-left flex justify-between", isDark ? "text-white/40" : "text-[#8C95A5]")}><span>Redo</span> <span>⇧⌘Z</span></div>
                      <div className={cn("h-px my-1", isDark ? "bg-white/10" : "bg-[#DCE1E7]")} />
                      <div className={cn("px-3 py-1.5 text-left cursor-pointer flex justify-between", isDark ? "hover:bg-white/10" : "hover:bg-black/[0.05]")}><span>Cut</span> <span>⌘X</span></div>
                      <div className={cn("px-3 py-1.5 text-left cursor-pointer flex justify-between", isDark ? "hover:bg-white/10" : "hover:bg-black/[0.05]")}><span>Copy</span> <span>⌘C</span></div>
                      <div className={cn("px-3 py-1.5 text-left cursor-pointer flex justify-between", isDark ? "hover:bg-white/10" : "hover:bg-black/[0.05]")}><span>Paste</span> <span>⌘V</span></div>
                    </>
                  )}
                  {item === 'View' && (
                    <>
                      <button onClick={() => { window.dispatchEvent(new CustomEvent('orion:desktop-refresh')); setActiveTopMenu(null); }} className={cn("px-3 py-1.5 text-left cursor-pointer flex justify-between", isDark ? "hover:bg-white/10" : "hover:bg-black/[0.05]")}>
                        <span>Reload Desktop</span> <span className={isDark ? "text-white/40" : "text-[#8C95A5]"}>⌘R</span>
                      </button>
                      <button onClick={() => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else document.documentElement.requestFullscreen().catch(() => {}); setActiveTopMenu(null); }} className={cn("px-3 py-1.5 text-left cursor-pointer flex justify-between", isDark ? "hover:bg-white/10" : "hover:bg-black/[0.05]")}>
                        <span>Enter Full Screen</span> <span className={isDark ? "text-white/40" : "text-[#8C95A5]"}>⌃⌘F</span>
                      </button>
                    </>
                  )}
                  {item === 'Go' && (
                    <>
                      <button onClick={() => { openApplication('command-center'); setActiveTopMenu(null); }} className={cn("px-3 py-1.5 text-left cursor-pointer", isDark ? "hover:bg-white/10" : "hover:bg-black/[0.05]")}>Control Tower</button>
                      <button onClick={() => { setLauncherOpen(true); setActiveTopMenu(null); }} className={cn("px-3 py-1.5 text-left cursor-pointer", isDark ? "hover:bg-white/10" : "hover:bg-black/[0.05]")}>Applications</button>
                      <button onClick={() => { openApplication('file-manager'); setActiveTopMenu(null); }} className={cn("px-3 py-1.5 text-left cursor-pointer", isDark ? "hover:bg-white/10" : "hover:bg-black/[0.05]")}>Documents</button>
                      <button onClick={() => { openApplication('settings'); setActiveTopMenu(null); }} className={cn("px-3 py-1.5 text-left cursor-pointer", isDark ? "hover:bg-white/10" : "hover:bg-black/[0.05]")}>System Settings</button>
                    </>
                  )}
                  {item === 'Window' && (
                    <>
                      <button onClick={() => { if (activeAppId) closeApplication(activeAppId); setActiveTopMenu(null); }} className={cn("px-3 py-1.5 text-left cursor-pointer flex justify-between", isDark ? "hover:bg-white/10" : "hover:bg-black/[0.05]")}>
                        <span>Minimize</span> <span className={isDark ? "text-white/40" : "text-[#8C95A5]"}>⌘M</span>
                      </button>
                      <button onClick={() => { closeAllWindows(); setActiveTopMenu(null); }} className={cn("px-3 py-1.5 text-left cursor-pointer", isDark ? "hover:bg-white/10" : "hover:bg-black/[0.05]")}>Close All Windows</button>
                    </>
                  )}
                  {item === 'Help' && (
                    <>
                      <button onClick={() => { openApplication('about'); setActiveTopMenu(null); }} className={cn("px-3 py-1.5 text-left cursor-pointer", isDark ? "hover:bg-white/10" : "hover:bg-black/[0.05]")}>
                        About {ORION_OS_METADATA.fullVersionName}
                      </button>
                      <button onClick={() => { setStatusOpen(true); setActiveTopMenu(null); }} className={cn("px-3 py-1.5 text-left cursor-pointer", isDark ? "hover:bg-white/10" : "hover:bg-black/[0.05]")}>
                        System Diagnostic Status
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Database Env Indicator */}
        <span 
          onClick={(e) => {
            if (isAdmin) {
              e.stopPropagation();
              navigate('/admin/database');
            }
          }}
          className={cn(
            "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider select-none transition-all ml-1",
            dbEnv === 'LIVE'
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-amber-500/10 text-amber-400 border-amber-500/30",
            isAdmin && "hover:border-[var(--orion-accent)] hover:text-white cursor-pointer"
          )}
          title={isAdmin ? `Database: ${dbEnv}. Click to open Control Plane.` : `Database: ${dbEnv}`}
        >
          {dbEnv}
        </span>

        {menuOpen && (
          <div className="absolute top-[42px] left-2 z-[2147483600]">
            <OrionSystemMenu onClose={() => setMenuOpen(false)} />
          </div>
        )}
      </div>

      {/* CENTER: Clean Gap Reserved for Top-Centred Dynamic Island */}
      <div className="flex-1 min-w-4 pointer-events-none" aria-hidden="true" />

      {/* RIGHT: macOS System Status & Action Bar */}
      <div className={cn("flex items-center h-full gap-2 shrink-0 min-w-0", isDark ? "text-white/90" : "text-[#596273]")}>
        {/* Sound Waveform Visualizer Icon */}
        <div className={cn("hidden sm:flex items-center justify-center w-6 h-6 transition-colors cursor-pointer", isDark ? "text-white/70 hover:text-white" : "text-[#596273] hover:text-[#202631]")} title="Sound Output">
          <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="9" x2="4" y2="15" />
            <line x1="8" y1="6" x2="8" y2="18" />
            <line x1="12" y1="3" x2="12" y2="21" />
            <line x1="16" y1="7" x2="16" y2="17" />
            <line x1="20" y1="10" x2="20" y2="14" />
          </svg>
        </div>

        {/* Siri / Copilot Quick Action Orb */}
        <button
          type="button"
          onClick={() => openApplication('ai-copilot')}
          data-testid="orion-copilot-button"
          className={cn("flex items-center justify-center w-6 h-6 rounded-full transition-colors cursor-pointer text-purple-400", isDark ? "hover:bg-white/10" : "hover:bg-black/[0.06]")}
          title="Orion Copilot AI"
          aria-label="Open Orion AI Copilot"
        >
          <Sparkles className="w-3.5 h-3.5 fill-purple-400/30" />
        </button>

        {/* Cloud Sync Status */}
        <div className={cn("hidden sm:flex items-center justify-center w-6 h-6 transition-colors cursor-pointer", isDark ? "text-white/70 hover:text-white" : "text-[#596273] hover:text-[#202631]")} title="Cloud Sync Active">
          <Cloud className="w-3.5 h-3.5" />
        </div>

        {/* Wi-Fi Status */}
        <div className="relative flex items-center network-anchor" ref={networkRef}>
          <button 
            type="button"
            onClick={() => setNetworkOpen(v => !v)}
            className={cn("flex items-center justify-center w-6 h-6 transition-colors cursor-pointer outline-none", isDark ? "text-white/80 hover:text-white" : "text-[#596273] hover:text-[#202631]")}
            title={statusLabel}
            aria-label="Network Connections"
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
          </button>
        </div>

        {/* Volume */}
        <div className={cn("hidden md:flex items-center justify-center w-6 h-6 transition-colors cursor-pointer", isDark ? "text-white/70 hover:text-white" : "text-[#596273] hover:text-[#202631]")} title="Volume">
          <Volume2 className="w-3.5 h-3.5" />
        </div>

        {/* Battery 79% */}
        <div className={cn("hidden sm:flex items-center gap-1.5 px-1", isDark ? "text-white/85" : "text-[#596273]")} title="Battery: 79% (Power Adapter Connected)">
          <span className="text-[11px] font-mono font-medium">79%</span>
          <svg className={cn("w-4 h-4 stroke-current", isDark ? "fill-white/80" : "fill-[#596273]")} viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
            <rect x="2" y="7" width="16" height="10" rx="2" />
            <rect x="4" y="9" width="10" height="6" rx="1" fill="currentColor" />
            <path d="M21 11v2" />
          </svg>
        </div>

        {/* System Bar Clock (Mon Nov 16 18:45) */}
        <SystemBarClock onOpenTimeWorld={() => openApplication('time-world')} />

        {/* Account Menu */}
        <div className="flex items-center h-full pl-0.5">
          <AccountMenu />
        </div>
      </div>

      {/* Network Connection Popover */}
      <NetworkConnectionPopover
        isOpen={networkOpen}
        anchorRect={networkRef.current ? networkRef.current.getBoundingClientRect() : null}
        onClose={() => setNetworkOpen(false)}
        onOpenSystemStatus={() => setStatusOpen(true)}
      />

      <SystemStatusModal isOpen={statusOpen} onClose={() => setStatusOpen(false)} />
    </header>
  );
});

export default OrionSystemBar;
