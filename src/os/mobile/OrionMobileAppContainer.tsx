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
    <div className="w-full max-w-full flex-1 flex flex-col min-h-0 h-full overflow-y-auto overflow-x-hidden select-none">
      {/* Application Content View — mobile header provides back nav + title */}
      <div className="orion-mobile-app-wrapper w-full max-w-full flex-1 flex flex-col min-h-0 px-1 sm:px-2 pt-1 pb-6 box-border">
        {AppComponent ? (
          <AppComponent />
        ) : (
          <div className="p-8 text-center bg-os-surface border border-os-border rounded-2xl text-xs font-mono text-os-text-muted">
            Application &quot;{activeApp.name}&quot; component is initializing...
          </div>
        )}
      </div>
    </div>
  );
};
