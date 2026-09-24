import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ORION_REGISTRY, OrionApp } from '../OrionApplicationRegistry';

export type MobileTab = 'home' | 'control' | 'ai' | 'alerts' | 'apps' | 'app_view';

export interface MobileEntityDetail {
  type: 'shipment' | 'po' | 'inventory' | 'supplier' | 'exception' | 'alert' | 'custom';
  id: string;
  title: string;
  subtitle?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  impact?: number;
  data?: Record<string, any>;
}

interface MobileNavigationContextType {
  activeTab: MobileTab;
  openedAppId: string | null;
  activeApp: OrionApp | null;
  selectedEntity: MobileEntityDetail | null;
  isDetailSheetOpen: boolean;
  searchQuery: string;
  navigateToTab: (tab: MobileTab) => void;
  openApp: (appId: string) => void;
  closeApp: () => void;
  openOrionAI: () => void;
  openEntityDetail: (entity: MobileEntityDetail) => void;
  closeEntityDetail: () => void;
  setSearchQuery: (query: string) => void;
}

const MobileNavigationContext = createContext<MobileNavigationContextType | null>(null);

export const MobileNavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [openedAppId, setOpenedAppId] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<MobileEntityDetail | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const navigateToTab = useCallback((tab: MobileTab) => {
    setIsDetailSheetOpen(false);
    setSelectedEntity(null);
    setActiveTab(tab);
    if (tab !== 'app_view') {
      setOpenedAppId(null);
    }
    // Scroll to top on navigation change
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const openApp = useCallback((appId: string) => {
    setIsDetailSheetOpen(false);
    setSelectedEntity(null);
    setOpenedAppId(appId);
    setActiveTab('app_view');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const closeApp = useCallback(() => {
    setOpenedAppId(null);
    setActiveTab('apps');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const openOrionAI = useCallback(() => {
    setIsDetailSheetOpen(false);
    setSelectedEntity(null);
    setOpenedAppId(null);
    setActiveTab('ai');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const openEntityDetail = useCallback((entity: MobileEntityDetail) => {
    setSelectedEntity(entity);
    setIsDetailSheetOpen(true);
  }, []);

  const closeEntityDetail = useCallback(() => {
    setIsDetailSheetOpen(false);
    setTimeout(() => {
      setSelectedEntity(null);
    }, 250);
  }, []);

  // Back Button / ESC Key Interception for transient surfaces
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDetailSheetOpen) {
          closeEntityDetail();
        } else if (activeTab === 'app_view') {
          closeApp();
        } else if (activeTab === 'ai') {
          navigateToTab('home');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDetailSheetOpen, activeTab, closeEntityDetail, closeApp, navigateToTab]);

  const activeApp = openedAppId ? ORION_REGISTRY[openedAppId] || null : null;

  return (
    <MobileNavigationContext.Provider
      value={{
        activeTab,
        openedAppId,
        activeApp,
        selectedEntity,
        isDetailSheetOpen,
        searchQuery,
        navigateToTab,
        openApp,
        closeApp,
        openOrionAI,
        openEntityDetail,
        closeEntityDetail,
        setSearchQuery,
      }}
    >
      {children}
    </MobileNavigationContext.Provider>
  );
};

export function useMobileNavigation(): MobileNavigationContextType {
  const context = useContext(MobileNavigationContext);
  if (!context) {
    throw new Error('useMobileNavigation must be used within a MobileNavigationProvider');
  }
  return context;
}
