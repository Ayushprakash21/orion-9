import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useWindowManager } from '../WindowManagerContext';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { useToast } from '../../store/ToastContext';
import { useBranding } from '../../store/BrandingContext';
import { LogOut, Power, Settings, Monitor, Activity, Lock, RefreshCw, Moon, ChevronRight, XSquare } from 'lucide-react';
import { ORION_REGISTRY } from '../OrionApplicationRegistry';

interface OrionSystemMenuProps {
  onClose: () => void;
}

export function OrionSystemMenu({ onClose }: OrionSystemMenuProps) {
  const { branding } = useBranding();
  const appName = branding.appName || 'ORION-9';
  
  const { logout, triggerRestart, triggerSleep, triggerLock, triggerShutdown, currentUser } = useAuth();
  const { setLauncherOpen, windows, openApplication, focusApplication, closeAllWindows } = useWindowManager();
  const { showConfirmModal } = useEntityDrawer();
  const { showToast } = useToast();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (menuRef.current) {
      menuRef.current.classList.add('animate-in', 'fade-in', 'slide-in-from-top-2');
    }
  }, []);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const hasOpenWindows = Object.values(windows).some(w => w.state !== 'closed');

  // Get recently opened apps from the window registry
  const recentApps = Object.keys(windows).slice(0, 3).map(id => ORION_REGISTRY[id]).filter(Boolean);

  const handleApp = (id: string) => {
    if (windows[id]) {
      focusApplication(id);
    } else {
      openApplication(id);
    }
    onClose();
  };

  return (
    <div 
      ref={menuRef}
      className="w-64 bg-os-surface/95 backdrop-blur-2xl border border-os-border rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.02)] py-1.5 text-[13px] font-sans overflow-hidden origin-top-left"
    >
      <button 
        onClick={() => handleAction(() => openApplication('about'))}
        className="w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors font-medium cursor-pointer"
      >
        About {appName}
      </button>
      
      <div className="h-px bg-white/[0.06] my-1.5 mx-2" />
      
      <button 
        onClick={() => handleAction(() => setLauncherOpen(true))}
        className="w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors flex items-center justify-between cursor-pointer"
      >
        <span>Applications...</span>
        <kbd className="text-[10px] font-mono text-slate-500 bg-os-surface-hover px-1.5 py-0.5 rounded border border-os-border">F4</kbd>
      </button>

      {/* Recent Applications sub-menu */}
      <div className="relative group w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors flex items-center justify-between cursor-default">
        <span>Recent Applications</span>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        
        {/* Sub-menu (appears on hover) */}
        <div className="absolute top-0 left-[100%] w-48 bg-os-surface/95 backdrop-blur-2xl border border-os-border rounded-xl shadow-2xl py-1.5 hidden group-hover:block ml-1">
          {recentApps.length > 0 ? (
            recentApps.map(app => (
              <button 
                key={app.id}
                onClick={(e) => { e.stopPropagation(); handleApp(app.id); }}
                className="w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors flex items-center gap-2 cursor-pointer"
              >
                <app.icon className="w-3.5 h-3.5" style={{ color: app.color }} />
                <span className="truncate">{app.name}</span>
              </button>
            ))
          ) : (
            <div className="px-4 py-1.5 text-slate-500 text-xs italic">No recent applications</div>
          )}
        </div>
      </div>

      <div className="h-px bg-white/[0.06] my-1.5 mx-2" />

      <button 
        onClick={() => handleAction(() => openApplication('settings'))}
        className="w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors cursor-pointer"
      >
        System Settings...
      </button>

      <button 
        onClick={() => handleAction(() => openApplication('observability'))}
        className="w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors cursor-pointer"
      >
        Activity Monitor...
      </button>

      {hasOpenWindows && (
        <button 
          onClick={() => handleAction(() => {
            showConfirmModal(
              'Close All Windows',
              'Are you sure you want to close all open application windows? Any unsaved edits will be discarded.',
              () => {
                closeAllWindows();
                showToast('All active windows closed', 'info', 'Window Manager');
              },
              'Close All'
            );
          })}
          className="w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors flex items-center gap-2 cursor-pointer"
        >
          <XSquare className="w-3.5 h-3.5 text-os-text-muted" />
          <span>Close All Windows</span>
        </button>
      )}

      <div className="h-px bg-white/[0.06] my-1.5 mx-2" />

      <button 
        onClick={() => handleAction(() => triggerLock())}
        className="w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors flex items-center justify-between cursor-pointer"
      >
        <span>Lock Workstation</span>
        <div className="flex gap-1 text-[10px] font-mono text-slate-500">
          <kbd className="bg-os-surface-hover px-1 py-0.5 rounded border border-os-border">⌘</kbd>
          <kbd className="bg-os-surface-hover px-1 py-0.5 rounded border border-os-border">L</kbd>
        </div>
      </button>

      <button 
        onClick={() => handleAction(() => triggerSleep())}
        className="w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors cursor-pointer"
      >
        Sleep
      </button>

      <button 
        onClick={() => handleAction(() => {
          showConfirmModal(
            `Restart ${appName}`,
            'Are you sure you want to reboot the system kernel? All active sessions and workspace windows will be reinitialized.',
            () => triggerRestart(),
            'Restart'
          );
        })}
        className="w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors cursor-pointer"
      >
        Restart...
      </button>

      <div className="h-px bg-white/[0.06] my-1.5 mx-2" />
      
      <button 
        onClick={() => handleAction(() => logout())}
        className="w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors cursor-pointer"
      >
        Log Out {currentUser?.displayName || 'User'}...
      </button>

      <button 
        onClick={() => handleAction(() => {
          window.dispatchEvent(new CustomEvent('orion:request-shutdown'));
        })}
        className="w-full text-left px-4 py-1.5 hover:bg-red-500/20 hover:text-red-400 text-os-text-secondary transition-colors cursor-pointer"
      >
        Shut Down...
      </button>
    </div>
  );
}
