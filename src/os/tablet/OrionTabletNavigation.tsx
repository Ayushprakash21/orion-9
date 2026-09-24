/**
 * ORION-9 TABLET NAVIGATION CONTEXT & CONTROLLER
 * Authoritative state management for Orion Tablet OS presentation mode.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type TabletNavTab = 'home' | 'control' | 'ai' | 'alerts' | 'apps';

export interface TabletEntityDetail {
  type: 'order' | 'inventory' | 'shipment' | 'supplier' | 'exception' | 'decision';
  id: string;
  data?: any;
}

interface TabletNavigationContextType {
  activeTab: TabletNavTab;
  activeAppId: string | null;
  selectedEntity: TabletEntityDetail | null;
  navigateToTab: (tab: TabletNavTab) => void;
  openApp: (appId: string) => void;
  closeApp: () => void;
  openEntityDetail: (detail: TabletEntityDetail) => void;
  closeEntityDetail: () => void;
  openOrionAI: () => void;
}

const TabletNavigationContext = createContext<TabletNavigationContextType | null>(null);

export const TabletNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabletNavTab>('home');
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<TabletEntityDetail | null>(null);

  const navigateToTab = useCallback((tab: TabletNavTab) => {
    setSelectedEntity(null);
    setActiveAppId(null);
    setActiveTab(tab);
  }, []);

  const openApp = useCallback((appId: string) => {
    if (appId === 'orion-ai') {
      navigateToTab('ai');
      return;
    }
    setSelectedEntity(null);
    setActiveAppId(appId);
  }, [navigateToTab]);

  const closeApp = useCallback(() => {
    setActiveAppId(null);
  }, []);

  const openEntityDetail = useCallback((detail: TabletEntityDetail) => {
    setSelectedEntity(detail);
  }, []);

  const closeEntityDetail = useCallback(() => {
    setSelectedEntity(null);
  }, []);

  const openOrionAI = useCallback(() => {
    setSelectedEntity(null);
    setActiveAppId(null);
    setActiveTab('ai');
  }, []);

  // Keyboard navigation & back-stack handling (Escape key closes detail -> active app -> return home)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedEntity) {
          e.preventDefault();
          closeEntityDetail();
        } else if (activeAppId) {
          e.preventDefault();
          closeApp();
        } else if (activeTab !== 'home') {
          e.preventDefault();
          navigateToTab('home');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEntity, activeAppId, activeTab, closeEntityDetail, closeApp, navigateToTab]);

  return (
    <TabletNavigationContext.Provider
      value={{
        activeTab,
        activeAppId,
        selectedEntity,
        navigateToTab,
        openApp,
        closeApp,
        openEntityDetail,
        closeEntityDetail,
        openOrionAI,
      }}
    >
      {children}
    </TabletNavigationContext.Provider>
  );
};

export function useTabletNavigation(): TabletNavigationContextType {
  const context = useContext(TabletNavigationContext);
  if (!context) {
    throw new Error('useTabletNavigation must be used within a TabletNavigationProvider');
  }
  return context;
}
