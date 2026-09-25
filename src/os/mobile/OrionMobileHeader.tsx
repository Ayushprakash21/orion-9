import React, { useState } from 'react';
import { useMobileNavigation } from './OrionMobileNavigation';
import { useAuth } from '../../store/AuthContext';
import { useNotifications } from '../../store/NotificationContext';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { Bell, User, ChevronLeft, ShieldCheck, Database, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { OrionMark } from '../../components/brand/OrionLogo';
import { NotificationCenter } from '../../components/modals/NotificationCenter';

export const OrionMobileHeader: React.FC = () => {
  const { activeTab, activeApp, closeApp, navigateToTab } = useMobileNavigation();
  const { currentUser, signOut } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const environment = dbManager.getEnvironment();
  const isLive = environment === 'LIVE';

  // Determine current screen title
  let displayTitle = 'ORION HOME';
  if (activeTab === 'home') displayTitle = 'ORION HOME';
  else if (activeTab === 'control') displayTitle = 'CONTROL TOWER';
  else if (activeTab === 'ai') displayTitle = 'ORION AI';
  else if (activeTab === 'alerts') displayTitle = 'ALERTS & RISKS';
  else if (activeTab === 'apps') displayTitle = 'ALL APPLICATIONS';
  else if (activeTab === 'app_view' && activeApp) displayTitle = activeApp.name.toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full bg-os-surface/95 backdrop-blur-md border-b border-os-border pt-[env(safe-area-inset-top,0px)] select-none">
      <div className="h-13 px-3.5 flex items-center justify-between gap-2 max-w-full">
        {/* LEFT: Logo or Back Button */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          {activeTab === 'app_view' ? (
            <button
              onClick={closeApp}
              className="flex items-center gap-1 py-1.5 px-2 -ml-1 rounded-lg bg-os-surface-secondary text-os-text-primary active:bg-os-surface-hover text-xs font-mono font-medium border border-os-border transition-colors touch-manipulation min-h-[44px] min-w-[44px] justify-center"
              aria-label="Back to Applications"
            >
              <ChevronLeft size={16} />
              <span className="hidden xs:inline">Back</span>
            </button>
          ) : (
            <button 
              onClick={() => navigateToTab('home')}
              className="flex items-center gap-2 touch-manipulation focus:outline-none min-h-[44px] items-center"
            >
              <OrionMark size={22} />
              <span className="text-xs font-mono font-bold tracking-wider text-os-text-primary">
                ORION<span className="text-os-accent">-9</span>
              </span>
            </button>
          )}
        </div>

        {/* CENTER: Current View / App Title */}
        <div className="flex-1 min-w-0 text-center px-1">
          <h1 className="text-xs font-mono font-bold tracking-wider text-os-text-primary truncate uppercase">
            {displayTitle}
          </h1>
        </div>

        {/* RIGHT: Live/Demo Indicator + Notifications + Profile */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Environment Indicator Badge */}
          <div 
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-mono font-semibold border ${
              isLive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
            title={`Database Environment: ${environment}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>{isLive ? 'LIVE' : 'DEMO'}</span>
          </div>

          {/* Notifications Trigger */}
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`relative p-2 rounded-lg transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ${
              isNotificationsOpen 
                ? 'bg-os-surface-hover text-os-text-primary' 
                : 'text-os-text-secondary active:text-os-text-primary active:bg-os-surface-hover'
            }`}
            aria-label="View Notifications"
            aria-expanded={isNotificationsOpen}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-os-surface shadow-[0_0_6px_#EF4444]" />
            )}
          </button>

          {/* User Profile / Menu Trigger */}
          <button
            onClick={() => {
              setIsNotificationsOpen(false);
              setIsProfileMenuOpen(!isProfileMenuOpen);
            }}
            className="p-1.5 rounded-lg border border-os-border bg-os-surface-secondary active:bg-os-surface-hover transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="User Menu"
            aria-expanded={isProfileMenuOpen}
          >
            {currentUser?.avatarUrl ? (
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.fullName || 'User'} 
                className="w-6 h-6 rounded-full object-cover" 
              />
            ) : (
              <User size={15} className="text-os-text-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Notifications Popover for Mobile Header */}
      {isNotificationsOpen && (
        <div 
          className="fixed right-2 top-[calc(env(safe-area-inset-top,0px)+52px)] w-[min(calc(100vw-16px),420px)] max-h-[calc(100dvh-env(safe-area-inset-top,0px)-54px-64px-env(safe-area-inset-bottom,0px)-16px)] z-40 bg-os-surface border border-os-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2"
          onClick={(e) => e.stopPropagation()}
        >
          <NotificationCenter isOpen={true} onClose={() => setIsNotificationsOpen(false)} />
        </div>
      )}

      {/* Profile Dropdown Drawer/Modal */}
      {isProfileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 z-35 bg-black/40 backdrop-blur-xs" 
            onClick={() => setIsProfileMenuOpen(false)} 
            aria-hidden="true"
          />
          <div className="absolute right-2 top-full mt-1 w-64 bg-os-surface border border-os-border rounded-xl shadow-2xl p-3 z-40 animate-in fade-in slide-in-from-top-2 font-mono text-xs space-y-2">
            <div className="pb-2 border-b border-os-border">
              <div className="font-bold text-os-text-primary truncate">{currentUser?.fullName || currentUser?.username || 'Operator'}</div>
              <div className="text-[10px] text-os-text-muted truncate">{currentUser?.email}</div>
              <div className="mt-1 inline-block px-1.5 py-0.5 rounded bg-os-surface-secondary text-[9px] text-os-accent font-semibold uppercase">
                {currentUser?.role || 'User'}
              </div>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  navigateToTab('apps');
                }}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-os-surface-hover text-os-text-secondary hover:text-os-text-primary text-left transition-colors min-h-[44px] cursor-pointer"
              >
                <Database size={14} className="text-os-accent" />
                <span>All Applications</span>
              </button>

              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  signOut();
                }}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-red-500/10 text-red-400 text-left transition-colors min-h-[44px] cursor-pointer"
              >
                <LogOut size={14} />
                <span>Sign Out of Orion-9</span>
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
