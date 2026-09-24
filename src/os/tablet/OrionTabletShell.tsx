/**
 * ORION-9 DEDICATED TABLET OS SHELL
 * Provides intentional tablet presentation mode with adaptive navigation and zero desktop UI leakage.
 */

import React from 'react';
import { TabletNavigationProvider } from './OrionTabletNavigation';
import { OrionTabletHeader } from './OrionTabletHeader';
import { OrionTabletNavRail } from './OrionTabletNavRail';
import { OrionTabletContentRouter } from './OrionTabletContentRouter';
import { useResponsiveLayout } from '../../lib/useResponsiveLayout';
import { useAuth } from '../../store/AuthContext';

const WALLPAPER_IMAGE = '/orion-desktop-global-network.jpg';

function TabletShellLayout() {
  const { isLandscape } = useResponsiveLayout();

  return (
    <div 
      data-orion-tablet-shell="true"
      className="h-[100dvh] min-h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#07090e] text-os-text-primary flex flex-col select-none relative"
      style={{
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* 1. SUBDUED CINEMATIC TABLET BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <img
          src={WALLPAPER_IMAGE}
          alt=""
          className="w-full h-full object-cover object-center opacity-25 filter brightness-90 saturate-90"
        />
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(8, 12, 22, 0.4) 0%, rgba(6, 8, 14, 0.85) 75%, rgba(3, 4, 8, 0.98) 100%)'
          }}
        />
      </div>

      {/* 2. TABLET SYSTEM BAR (PERSISTENT TOP CHROME) */}
      <OrionTabletHeader />

      {/* 3. MAIN ADAPTIVE WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative z-10 min-h-0">
        {/* If Landscape: Render Left Rail Navigation */}
        {isLandscape && <OrionTabletNavRail isLandscapeMode={true} />}

        {/* Central Tablet Application Stage */}
        <main className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
          <OrionTabletContentRouter />
        </main>
      </div>

      {/* 4. If Portrait: Render Bottom Navigation Bar */}
      {!isLandscape && <OrionTabletNavRail isLandscapeMode={false} />}
    </div>
  );
}

export const OrionTabletShell: React.FC = () => {
  const { isAuthenticated, currentUser } = useAuth();

  if (!isAuthenticated || !currentUser) {
    return null;
  }

  return (
    <TabletNavigationProvider>
      <TabletShellLayout />
    </TabletNavigationProvider>
  );
};
