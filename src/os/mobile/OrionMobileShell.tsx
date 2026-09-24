import React from 'react';
import { MobileNavigationProvider, useMobileNavigation } from './OrionMobileNavigation';
import { OrionMobileHeader } from './OrionMobileHeader';
import { OrionMobileBottomNav } from './OrionMobileBottomNav';
import { OrionMobileHome } from './OrionMobileHome';
import { OrionMobileControlTower } from './OrionMobileControlTower';
import { OrionMobileAICopilot } from './OrionMobileAICopilot';
import { OrionMobileAlerts } from './OrionMobileAlerts';
import { OrionMobileAppLauncher } from './OrionMobileAppLauncher';
import { OrionMobileAppContainer } from './OrionMobileAppContainer';
import { OrionMobileDetailSheet } from './OrionMobileDetailSheet';
import { OrionLiveWallpaper } from '../components/OrionLiveWallpaper';

const OrionMobileContentRouter: React.FC = () => {
  const { activeTab } = useMobileNavigation();

  return (
    <main className="flex-1 w-full max-w-full overflow-x-hidden px-3.5 pt-3 pb-20">
      {activeTab === 'home' && <OrionMobileHome />}
      {activeTab === 'control' && <OrionMobileControlTower />}
      {activeTab === 'ai' && <OrionMobileAICopilot />}
      {activeTab === 'alerts' && <OrionMobileAlerts />}
      {activeTab === 'apps' && <OrionMobileAppLauncher />}
      {activeTab === 'app_view' && <OrionMobileAppContainer />}
    </main>
  );
};

export const OrionMobileShell: React.FC = () => {
  return (
    <MobileNavigationProvider>
      <div 
        data-orion-mobile-shell="true"
        className="relative min-h-screen w-full max-w-full bg-os-bg text-os-text-primary flex flex-col overflow-x-hidden"
      >
        {/* Subtle Atmospheric World Map Background (Reduced Opacity for Mobile Readability) */}
        <div 
          className="fixed inset-0 pointer-events-none z-0 opacity-10 overflow-hidden"
          aria-hidden="true"
        >
          <OrionLiveWallpaper hasOpenWindows={false} />
        </div>

        {/* Mobile Header (Fixed/Sticky Top) */}
        <OrionMobileHeader />

        {/* Dynamic Mobile View Router */}
        <div className="relative z-10 flex-1 flex flex-col w-full max-w-full">
          <OrionMobileContentRouter />
        </div>

        {/* Mobile Bottom Navigation (Fixed Bottom) */}
        <OrionMobileBottomNav />

        {/* Mobile Detail Sheet Drawer */}
        <OrionMobileDetailSheet />
      </div>
    </MobileNavigationProvider>
  );
};
