/**
 * ORION-9 DEDICATED TABLET OS SHELL
 * Provides intentional tablet presentation mode with adaptive navigation and zero desktop UI leakage.
 */

import React from 'react';
import { TabletNavigationProvider } from './OrionTabletNavigation';
import { OrionTabletHeader } from './OrionTabletHeader';
import { OrionTabletNavRail } from './OrionTabletNavRail';
import { OrionTabletContentRouter } from './OrionTabletContentRouter';
import { OrionLiveWallpaper } from '../components/OrionLiveWallpaper';
import { useResponsiveLayout } from '../../lib/useResponsiveLayout';
import { useAuth } from '../../store/AuthContext';

function TabletShellLayout() {
  const { isLandscape } = useResponsiveLayout();

  return (
    <div 
      data-orion-tablet-shell="true"
      className="relative h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full max-w-full overflow-hidden bg-[#07090e] text-os-text-primary flex flex-col select-none pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]"
    >
      {/* 1. SUBDUED AUTHORITATIVE ORION LIVE WALLPAPER */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-25" aria-hidden="true">
        <OrionLiveWallpaper
          target="desktop"
          showLogo={false}
          hasOpenWindows={false}
        />
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(8, 12, 22, 0.4) 0%, rgba(6, 8, 14, 0.85) 75%, rgba(3, 4, 8, 0.98) 100%)'
          }}
        />
      </div>

      {/* 2. TABLET SYSTEM BAR (PERSISTENT TOP CHROME - LAYER 30) */}
      <OrionTabletHeader />

      {/* 3. MAIN ADAPTIVE WORKSPACE (LAYER 20) */}
      <div className="relative z-20 flex-1 flex overflow-hidden min-h-0 w-full max-w-full">
        {/* If Landscape: Render Left Rail Navigation */}
        {isLandscape && <OrionTabletNavRail isLandscapeMode={true} />}

        {/* Central Tablet Application Stage */}
        <main className="flex-1 flex flex-col overflow-hidden min-h-0 relative w-full max-w-full">
          <OrionTabletContentRouter />
        </main>
      </div>

      {/* 4. If Portrait: Render Bottom Navigation Bar (LAYER 50) */}
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
