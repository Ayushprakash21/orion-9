import React from 'react';
import { useMobileNavigation, MobileTab } from './OrionMobileNavigation';
import { useNotifications } from '../../store/NotificationContext';
import { 
  Home, 
  ShieldAlert, 
  Sparkles, 
  AlertTriangle, 
  LayoutGrid 
} from 'lucide-react';

interface NavItem {
  id: MobileTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
}

export const OrionMobileBottomNav: React.FC = () => {
  const { activeTab, navigateToTab } = useMobileNavigation();
  const { unreadCount } = useNotifications();

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'control', label: 'Control', icon: ShieldAlert },
    { id: 'ai', label: 'AI', icon: Sparkles },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: unreadCount },
    { id: 'apps', label: 'Apps', icon: LayoutGrid },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 bg-os-surface/95 backdrop-blur-xl border-t border-os-border pb-[env(safe-area-inset-bottom,8px)] select-none"
      aria-label="Mobile Navigation"
    >
      <div className="h-14 max-w-md mx-auto grid grid-cols-5 items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === 'apps' && activeTab === 'app_view');

          return (
            <button
              key={item.id}
              onClick={() => navigateToTab(item.id)}
              className={`relative flex flex-col items-center justify-center h-full min-h-[44px] py-1 transition-all rounded-lg touch-manipulation cursor-pointer ${
                isActive 
                  ? 'text-os-accent font-bold' 
                  : 'text-os-text-muted hover:text-os-text-secondary active:scale-95'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active Indicator Top Glow */}
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 bg-os-accent rounded-full shadow-[0_0_8px_var(--os-accent)]" />
              )}

              <div className="relative flex items-center justify-center">
                <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.75px]'} />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-3.5 bg-red-500 text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center ring-2 ring-os-surface">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : null}
              </div>

              <span className={`text-[10px] font-mono tracking-tight mt-0.5 ${isActive ? 'text-os-text-primary' : 'text-os-text-muted'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
