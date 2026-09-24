/**
 * ORION-9 ADAPTIVE TABLET NAVIGATION
 * Renders an ergonomic left rail in landscape or bottom bar in portrait.
 */

import React from 'react';
import { useTabletNavigation, TabletNavTab } from './OrionTabletNavigation';
import { useNotifications } from '../../store/NotificationContext';
import { useResponsiveLayout } from '../../lib/useResponsiveLayout';
import { 
  Home, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle, 
  LayoutGrid 
} from 'lucide-react';

interface NavItem {
  id: TabletNavTab;
  label: string;
  icon: React.ElementType;
  badge?: number;
  highlight?: boolean;
}

export const OrionTabletNavRail: React.FC<{ isLandscapeMode: boolean }> = ({ isLandscapeMode }) => {
  const { activeTab, navigateToTab, openOrionAI } = useTabletNavigation();
  const { unreadCount } = useNotifications();

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'control', label: 'Control', icon: ShieldCheck },
    { id: 'ai', label: 'AI', icon: Sparkles, highlight: true },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: unreadCount },
    { id: 'apps', label: 'Apps', icon: LayoutGrid },
  ];

  const handleSelectTab = (tab: TabletNavTab) => {
    if (tab === 'ai') {
      openOrionAI();
    } else {
      navigateToTab(tab);
    }
  };

  if (isLandscapeMode) {
    // Left Navigation Rail for Tablet Landscape (68px wide)
    return (
      <nav 
        data-orion-tablet-nav="rail"
        className="w-[68px] bg-os-surface/95 backdrop-blur-md border-r border-os-border flex flex-col items-center justify-between py-4 shrink-0 select-none z-30"
        aria-label="Tablet Landscape Navigation"
      >
        <div className="flex flex-col items-center gap-3 w-full">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="button"
                onClick={() => handleSelectTab(item.id)}
                className={`relative w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer min-h-[48px] min-w-[48px] ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-xs'
                    : item.highlight
                    ? 'text-cyan-400 hover:bg-cyan-500/10'
                    : 'text-os-text-muted hover:text-os-text-primary hover:bg-os-surface-hover'
                }`}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                title={item.label}
              >
                <Icon size={20} />
                <span className="text-[9px] font-mono tracking-tight font-semibold">
                  {item.label}
                </span>

                {/* Badge for Alerts */}
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute top-1.5 right-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-red-500 text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}

                {/* Active Indicator Pip */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-cyan-400" />
                )}
              </button>
            );
          })}
        </div>

        <div className="text-[9px] font-mono text-os-text-muted text-center opacity-60">
          ORION-9
        </div>
      </nav>
    );
  }

  // Bottom Navigation Bar for Tablet Portrait (60px high)
  return (
    <nav 
      data-orion-tablet-nav="bottom"
      className="bg-os-surface/95 backdrop-blur-md border-t border-os-border h-[60px] px-6 flex items-center justify-around shrink-0 select-none z-30 pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Tablet Portrait Navigation"
    >
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="button"
            onClick={() => handleSelectTab(item.id)}
            className={`relative flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-xl active:scale-95 transition-all cursor-pointer min-h-[48px] ${
              isActive
                ? 'text-cyan-400 font-bold'
                : item.highlight
                ? 'text-cyan-400'
                : 'text-os-text-muted hover:text-os-text-primary'
            }`}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={20} />
            <span className="text-[10px] font-mono tracking-tight">
              {item.label}
            </span>

            {/* Badge for Alerts */}
            {Boolean(item.badge && item.badge > 0) && (
              <span className="absolute top-1 right-3 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-xs">
                {item.badge}
              </span>
            )}

            {/* Active Bottom Glow Pip */}
            {isActive && (
              <span className="absolute -bottom-1 w-6 h-1 rounded-full bg-cyan-400" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
