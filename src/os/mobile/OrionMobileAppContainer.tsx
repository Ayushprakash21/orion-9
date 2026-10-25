import React from 'react';
import { useMobileNavigation } from './OrionMobileNavigation';
import { getAppComponent } from '../OrionComponentMap';

export const OrionMobileAppContainer: React.FC = () => {
  const { openedAppId, activeApp } = useMobileNavigation();

  if (!openedAppId || !activeApp) {
    return null;
  }

  const AppComponent = getAppComponent(openedAppId);

  return (
    <div className="w-full max-w-full flex-1 flex flex-col min-h-[calc(100dvh-112px)] h-full select-none">
      {/* Application Content View — global header already provides back nav + app title */}
      <div className="w-full max-w-full flex-1 flex flex-col min-h-0 overflow-x-hidden px-1 sm:px-2 pt-1">
        {AppComponent ? (
          <div className="orion-mobile-app-wrapper w-full max-w-full flex-1 flex flex-col min-h-0 h-full">
            <AppComponent />
          </div>
        ) : (
          <div className="p-8 text-center bg-os-surface border border-os-border rounded-2xl text-xs font-mono text-os-text-muted">
            Application &quot;{activeApp.name}&quot; component is initializing...
          </div>
        )}
      </div>
    </div>
  );
};
