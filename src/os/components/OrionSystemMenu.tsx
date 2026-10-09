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
import { LiquidGlass } from '../../design-system/LiquidGlass';

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
      menuRef.current.classList.add('animate-in', 'fade-in', 'slide-in-from-top-1.5');
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
    <LiquidGlass 
      ref={menuRef}
      tier="menu"
      className="w-64 rounded-[10px] p-1.5 text-[12px] font-sans overflow-hidden origin-top-left shadow-[0_16px_40px_rgba(0,0,0,0.42)]"
    >
      <button 
        onClick={() => handleAction(() => openApplication('executive-overview'))}
        className="w-full text-left px-2.5 py-1 hover:bg-white/[0.08] active:bg-white/[0.12] text-[var(--orion-text-primary,#F2F2EF)] transition-colors font-medium cursor-pointer flex items-center justify-between rounded-[5px]"
      >
        <span>Executive Command Center</span>
        <span className="text-[9px] font-mono text-[#39C77A] px-1.5 py-0.2 rounded bg-[#39C77A]/10 border border-[#39C77A]/30">C3</span>
      </button>

      <button 
        onClick={() => handleAction(() => openApplication('about'))}
        className="w-full text-left px-2.5 py-1 hover:bg-white/[0.08] active:bg-white/[0.12] text-[var(--orion-text-primary,#F2F2EF)] transition-colors font-medium cursor-pointer rounded-[5px]"
      >
        {t('desktop.aboutOrion')}
      </button>
      
      {/* Operating UX Mode Switcher */}
      <div className="px-2.5 py-1.5 bg-white/[0.02] border-y border-white/[0.04] my-1 rounded-[6px]">
        <div className="text-[10px] font-mono text-[var(--orion-text-muted,#747875)] uppercase tracking-wider mb-1 flex justify-between items-center">
          <span>Operating Mode</span>
          <span className={cn("font-semibold text-[10px]", settings.userExperienceMode === 'ADVANCED' ? "text-purple-400" : "text-emerald-400")}>
            {settings.userExperienceMode === 'ADVANCED' ? 'ADVANCED SCM' : 'SIMPLE MODE'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 p-0.5 bg-black/40 rounded-[6px] border border-white/[0.06] text-[11px] font-mono">
          <button
            type="button"
            onClick={() => handleAction(() => updateSettings({ userExperienceMode: 'SIMPLE' }))}
            className={cn(
              "px-2 py-0.5 rounded-[4px] transition-all cursor-pointer text-center font-medium",
              settings.userExperienceMode !== 'ADVANCED' ? "bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30" : "text-[var(--orion-text-muted,#747875)] hover:text-white"
            )}
          >
            Simple
          </button>
          <button
            type="button"
            onClick={() => handleAction(() => updateSettings({ userExperienceMode: 'ADVANCED' }))}
            className={cn(
              "px-2 py-0.5 rounded-[4px] transition-all cursor-pointer text-center font-medium",
              settings.userExperienceMode === 'ADVANCED' ? "bg-purple-500/20 text-purple-400 font-semibold border border-purple-500/30" : "text-[var(--orion-text-muted,#747875)] hover:text-white"
            )}
          >
            Advanced
          </button>
        </div>
      </div>
      
      <div className="h-px bg-white/[0.06] my-1 mx-1.5" />
      
      <button 
        onClick={() => handleAction(() => setLauncherOpen(true))}
        className="w-full text-left px-2.5 py-1 hover:bg-white/[0.08] active:bg-white/[0.12] text-[var(--orion-text-primary,#F2F2EF)] transition-colors flex items-center justify-between cursor-pointer rounded-[5px]"
      >
        <span>{t('desktop.applications')}</span>
        <kbd className="text-[10px] font-mono text-white/50 bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/10">F4</kbd>
      </button>

      {/* Recent Applications sub-menu */}
      <div className="relative group w-full text-left px-2.5 py-1 hover:bg-white/[0.08] text-[var(--orion-text-primary,#F2F2EF)] transition-colors flex items-center justify-between cursor-default rounded-[5px]">
        <span>{t('desktop.recentApplications')}</span>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        
        {/* Sub-menu (appears on hover) */}
        <div className="absolute top-0 left-[100%] w-48 bg-black/85 backdrop-blur-2xl border border-white/10 rounded-[8px] shadow-2xl py-1 hidden group-hover:block ml-1">
          {recentApps.length > 0 ? (
            recentApps.map(app => (
              <button 
                key={app.id}
                onClick={(e) => { e.stopPropagation(); handleApp(app.id); }}
                className="w-full text-left px-2.5 py-1 hover:bg-white/[0.08] text-[var(--orion-text-primary,#F2F2EF)] transition-colors flex items-center gap-2 cursor-pointer rounded-[4px]"
              >
                <app.icon className="w-3.5 h-3.5" style={{ color: app.color }} />
                <span className="truncate">{app.name}</span>
              </button>
            ))
          ) : (
            <div className="px-2.5 py-1 text-white/40 text-[11px] italic">{t('desktop.noRecentApplications')}</div>
          )}
        </div>
      </div>

      <div className="h-px bg-white/[0.06] my-1 mx-1.5" />

      <button 
        onClick={() => handleAction(() => openApplication('settings'))}
        className="w-full text-left px-2.5 py-1 hover:bg-white/[0.08] active:bg-white/[0.12] text-[var(--orion-text-primary,#F2F2EF)] transition-colors cursor-pointer rounded-[5px]"
      >
        {t('desktop.systemSettings')}...
      </button>

      <button 
        onClick={() => handleAction(() => openApplication('observability'))}
        className="w-full text-left px-2.5 py-1 hover:bg-white/[0.08] active:bg-white/[0.12] text-[var(--orion-text-primary,#F2F2EF)] transition-colors cursor-pointer rounded-[5px]"
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
          className="w-full text-left px-2.5 py-1 hover:bg-white/[0.08] active:bg-white/[0.12] text-[var(--orion-text-primary,#F2F2EF)] transition-colors flex items-center gap-2 cursor-pointer rounded-[5px]"
        >
          <XSquare className="w-3.5 h-3.5 text-[var(--orion-text-muted,#747875)]" />
          <span>{t('desktop.closeAllWindows')}</span>
        </button>
      )}

      <div className="h-px bg-white/[0.06] my-1 mx-1.5" />

      <button 
        data-testid="system-menu-lock-btn"
        onClick={() => handleAction(() => triggerLock())}
        className="w-full text-left px-2.5 py-1 hover:bg-white/[0.08] active:bg-white/[0.12] text-[var(--orion-text-primary,#F2F2EF)] transition-colors flex items-center justify-between cursor-pointer rounded-[5px]"
      >
        <span>{t('desktop.lockWorkstation')}</span>
        <div className="flex gap-1 text-[10px] font-mono text-white/50">
          <kbd className="bg-white/[0.06] px-1 py-0.5 rounded border border-white/10">⌘</kbd>
          <kbd className="bg-white/[0.06] px-1 py-0.5 rounded border border-white/10">L</kbd>
        </div>
      </button>

      <button 
        onClick={() => handleAction(() => triggerSleep())}
        className="w-full text-left px-2.5 py-1 hover:bg-white/[0.08] active:bg-white/[0.12] text-[var(--orion-text-primary,#F2F2EF)] transition-colors cursor-pointer rounded-[5px]"
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
        className="w-full text-left px-2.5 py-1 hover:bg-white/[0.08] active:bg-white/[0.12] text-[var(--orion-text-primary,#F2F2EF)] transition-colors cursor-pointer rounded-[5px]"
      >
        {t('auth.restart')}...
      </button>

      <div className="h-px bg-white/[0.06] my-1 mx-1.5" />
      
      <button 
        onClick={() => handleAction(() => logout())}
        className="w-full text-left px-2.5 py-1 hover:bg-white/[0.08] active:bg-white/[0.12] text-[var(--orion-text-primary,#F2F2EF)] transition-colors cursor-pointer rounded-[5px]"
      >
        {t('auth.signOut')} {currentUser?.displayName || 'User'}...
      </button>

    </LiquidGlass>
  );
}
