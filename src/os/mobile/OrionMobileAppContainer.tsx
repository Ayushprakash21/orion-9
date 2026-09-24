import React from 'react';
import { useMobileNavigation } from './OrionMobileNavigation';
import { getAppComponent } from '../OrionComponentMap';
import OrionAppIcon from '../../components/brand/OrionAppIcon';
import { ChevronLeft, Maximize2, Share2, MoreVertical } from 'lucide-react';

export const OrionMobileAppContainer: React.FC = () => {
  const { openedAppId, activeApp, closeApp } = useMobileNavigation();

  if (!openedAppId || !activeApp) {
    return null;
  }

  const AppComponent = getAppComponent(openedAppId);

  return (
    <div className="w-full max-w-full min-h-[calc(100vh-120px)] flex flex-col bg-os-bg select-none">
      {/* 1. APP TOP BAR */}
      <div className="sticky top-13 z-30 bg-os-surface/95 backdrop-blur-md border-b border-os-border px-3.5 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={closeApp}
            className="flex items-center gap-1 py-1.5 px-2.5 -ml-1 rounded-lg bg-os-surface-secondary text-os-text-primary active:bg-os-surface-hover text-xs font-mono font-medium border border-os-border transition-colors touch-manipulation min-h-[44px] min-w-[44px] justify-center"
            aria-label="Back to App Launcher"
          >
            <ChevronLeft size={16} />
            <span>Apps</span>
          </button>

          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <OrionAppIcon app={openedAppId} size={30} active={false} />
          </div>

          <div className="min-w-0">
            <h2 className="text-xs font-bold text-os-text-primary truncate">
              {activeApp.name}
            </h2>
            <div className="text-[10px] font-mono text-os-text-muted uppercase truncate">
              {activeApp.category}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-os-surface-secondary border border-os-border text-os-accent font-semibold">
            MOBILE VIEW
          </span>
        </div>
      </div>

      {/* 2. APP FULL-SCREEN CONTENT VIEW */}
      <div className="flex-1 w-full max-w-full overflow-x-hidden p-2 sm:p-4 pb-16">
        {AppComponent ? (
          <div className="orion-mobile-app-wrapper w-full max-w-full">
            <AppComponent />
          </div>
        ) : (
          <div className="p-8 text-center bg-os-surface border border-os-border rounded-2xl text-xs font-mono text-os-text-muted">
            Application "{activeApp.name}" component is initializing...
          </div>
        )}
      </div>
    </div>
  );
};
