/**
 * ORION-9 TABLET CONTENT ROUTER
 * Routes between primary tablet tabs (Home, Control, AI, Alerts, Apps) and single-screen active apps.
 */

import React from 'react';
import { useTabletNavigation } from './OrionTabletNavigation';
import { OrionTabletHome } from './OrionTabletHome';
import { OrionTabletControlTower } from './OrionTabletControlTower';
import { OrionTabletAICopilot } from './OrionTabletAICopilot';
import { OrionTabletAlerts } from './OrionTabletAlerts';
import { OrionTabletAppLauncher } from './OrionTabletAppLauncher';
import { ORION_REGISTRY } from '../OrionApplicationRegistry';
import { getAppComponent } from '../OrionComponentMap';
import { OrionTabletDetailSheet } from './OrionTabletDetailSheet';
import { ArrowLeft, X } from 'lucide-react';

export const OrionTabletContentRouter: React.FC = () => {
  const { activeTab, activeAppId, closeApp, selectedEntity } = useTabletNavigation();

  // If a specific application is active (e.g. launched from Apps tab)
  if (activeAppId) {
    const appConfig = ORION_REGISTRY[activeAppId];
    const AppComponent = getAppComponent(activeAppId);

    return (
      <div 
        data-orion-tablet-app-stage="true"
        className="flex flex-col h-full bg-os-bg overflow-hidden"
      >
        {/* App Top Action Bar */}
        <div className="bg-os-surface border-b border-os-border px-4 py-2.5 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={closeApp}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border text-xs font-mono text-cyan-400 font-bold active:scale-95 transition-all cursor-pointer min-h-[40px]"
            aria-label="Back to Applications"
          >
            <ArrowLeft size={16} />
            <span>Back to Apps</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-os-text-primary">
              {appConfig ? appConfig.name : activeAppId}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              TABLET VIEW
            </span>
          </div>

          <button
            type="button"
            onClick={closeApp}
            className="w-10 h-10 rounded-xl bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border flex items-center justify-center text-os-text-muted hover:text-os-text-primary active:scale-95 transition-all cursor-pointer"
            aria-label="Close Application"
          >
            <X size={16} />
          </button>
        </div>

        {/* Application Viewport */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {AppComponent ? (
            <AppComponent />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-2">
              <div className="text-sm font-bold text-os-text-primary">Application: {activeAppId}</div>
              <p className="text-xs text-os-text-muted">Dedicated Tablet view rendered</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 min-h-0">
      {activeTab === 'home' && <OrionTabletHome />}
      {activeTab === 'control' && <OrionTabletControlTower />}
      {activeTab === 'ai' && <OrionTabletAICopilot />}
      {activeTab === 'alerts' && <OrionTabletAlerts />}
      {activeTab === 'apps' && <OrionTabletAppLauncher />}

      {/* Entity Detail Sheet Modal */}
      {selectedEntity && <OrionTabletDetailSheet />}
    </div>
  );
};
