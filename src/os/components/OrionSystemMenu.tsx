import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useWindowManager } from '../WindowManagerContext';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { useToast } from '../../store/ToastContext';
import { useBranding } from '../../store/BrandingContext';
import { LogOut, Settings, Monitor, Activity, Lock, RefreshCw, Moon, ChevronRight, XSquare } from 'lucide-react';
import { ORION_REGISTRY } from '../OrionApplicationRegistry';
import { useI18n } from '../../store/LanguageContext';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { cn } from '../../lib/utils';

interface OrionSystemMenuProps {
  onClose: () => void;
}

export function OrionSystemMenu({ onClose }: OrionSystemMenuProps) {
  const { branding } = useBranding();
  const appName = branding.appName || 'ORION-9';
  const { t } = useI18n();
  const { settings, updateSettings } = useSupplyChain();
  
  const { logout, triggerRestart, triggerSleep, triggerLock, currentUser } = useAuth();
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
        onClick={() => handleAction(() => openApplication('executive-overview'))}
        className="w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors font-medium cursor-pointer flex items-center justify-between"
      >
        <span>Executive Command Center</span>
        <span className="text-[10px] font-mono text-[#39C77A] px-1.5 py-0.2 rounded bg-[#39C77A]/10 border border-[#39C77A]/30">C3</span>
      </button>

      <button 
        onClick={() => handleAction(() => openApplication('about'))}
        className="w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors font-medium cursor-pointer"
      >
        {t('desktop.aboutOrion')}
      </button>
      
      {/* Operating UX Mode Switcher */}
      <div className="px-4 py-2 bg-white/[0.02] border-y border-white/[0.04]">
        <div className="text-[10px] font-mono text-os-text-muted uppercase tracking-wider mb-1.5 flex justify-between items-center">
          <span>Operating Mode</span>
          <span className={cn("font-bold text-[10px]", settings.userExperienceMode === 'ADVANCED' ? "text-purple-400" : "text-emerald-400")}>
            {settings.userExperienceMode === 'ADVANCED' ? 'ADVANCED SCM' : 'SIMPLE MODE'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 p-0.5 bg-black/40 rounded-lg border border-os-border text-[11px] font-mono">
          <button
            type="button"
            onClick={() => handleAction(() => updateSettings({ userExperienceMode: 'SIMPLE' }))}
            className={cn(
              "px-2 py-1 rounded-md transition-all cursor-pointer text-center font-medium",
              settings.userExperienceMode !== 'ADVANCED' ? "bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30" : "text-os-text-muted hover:text-white"
            )}
          >
            Simple
          </button>
          <button
            type="button"
            onClick={() => handleAction(() => updateSettings({ userExperienceMode: 'ADVANCED' }))}
            className={cn(
              "px-2 py-1 rounded-md transition-all cursor-pointer text-center font-medium",
              settings.userExperienceMode === 'ADVANCED' ? "bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30" : "text-os-text-muted hover:text-white"
            )}
          >
            Advanced
          </button>
        </div>
      </div>
      
      <div className="h-px bg-white/[0.06] my-1.5 mx-2" />
      
      <button 
        onClick={() => handleAction(() => setLauncherOpen(true))}
        className="w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors flex items-center justify-between cursor-pointer"
      >
        <span>{t('desktop.applications')}</span>
        <kbd className="text-[10px] font-mono text-slate-500 bg-os-surface-hover px-1.5 py-0.5 rounded border border-os-border">F4</kbd>
      </button>

      {/* Recent Applications sub-menu */}
      <div className="relative group w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors flex items-center justify-between cursor-default">
        <span>{t('desktop.recentApplications')}</span>
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
            <div className="px-4 py-1.5 text-slate-500 text-xs italic">{t('desktop.noRecentApplications')}</div>
          )}
        </div>
      </div>

      <div className="h-px bg-white/[0.06] my-1.5 mx-2" />

      <button 
        onClick={() => handleAction(() => openApplication('settings'))}
        className="w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors cursor-pointer"
      >
        {t('desktop.systemSettings')}...
      </button>

      <button 
        onClick={() => handleAction(() => openApplication('observability'))}
        className="w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors cursor-pointer"
      >
        {t('desktop.activityMonitor')}...
      </button>

      {hasOpenWindows && (
        <button 
          onClick={() => handleAction(() => {
            showConfirmModal(
              t('desktop.closeAllWindows'),
              'Are you sure you want to close all open application windows? Any unsaved edits will be discarded.',
              () => {
                closeAllWindows();
              },
              'Close All'
            );
          })}
          className="w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors flex items-center gap-2 cursor-pointer"
        >
          <XSquare className="w-3.5 h-3.5 text-os-text-muted" />
          <span>{t('desktop.closeAllWindows')}</span>
        </button>
      )}

      <div className="h-px bg-white/[0.06] my-1.5 mx-2" />

      <button 
        onClick={() => handleAction(() => triggerLock())}
        className="w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors flex items-center justify-between cursor-pointer"
      >
        <span>{t('desktop.lockWorkstation')}</span>
        <div className="flex gap-1 text-[10px] font-mono text-slate-500">
          <kbd className="bg-os-surface-hover px-1 py-0.5 rounded border border-os-border">⌘</kbd>
          <kbd className="bg-os-surface-hover px-1 py-0.5 rounded border border-os-border">L</kbd>
        </div>
      </button>

      <button 
        onClick={() => handleAction(() => triggerSleep())}
        className="w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors cursor-pointer"
      >
        {t('desktop.sleep')}
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
        {t('auth.restart')}...
      </button>

      <div className="h-px bg-white/[0.06] my-1.5 mx-2" />
      
      <button 
        onClick={() => handleAction(() => logout())}
        className="w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors cursor-pointer"
      >
        {t('auth.signOut')} {currentUser?.displayName || 'User'}...
      </button>

    </div>
  );
}
