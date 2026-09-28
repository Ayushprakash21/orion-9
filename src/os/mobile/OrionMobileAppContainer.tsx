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
    <div className="w-full max-w-full flex flex-col select-none">
      {/* Application Content View — global header already provides back nav + app title */}
      <div className="w-full max-w-full overflow-x-hidden px-2 sm:px-4 pt-2">
        {AppComponent ? (
          <div className="orion-mobile-app-wrapper w-full max-w-full">
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
