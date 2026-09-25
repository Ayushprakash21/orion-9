import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  let pathname = '/mobile/home';
  let navigate = (path: string, options?: any) => {};
  try {
    const location = useLocation();
    const nav = useNavigate();
    pathname = location.pathname;
    navigate = nav;
  } catch (err) {
    // Router context fallback for isolated component testing
  }

  const getTabFromPath = useCallback((pathname: string): MobileTab => {
    const p = pathname.toLowerCase();
    if (p.startsWith('/mobile/control') || p === '/control') return 'control';
    if (p.startsWith('/mobile/ai') || p === '/copilot' || p === '/ai') return 'ai';
    if (p.startsWith('/mobile/alerts') || p === '/exceptions' || p === '/alerts') return 'alerts';
    if (p.startsWith('/mobile/apps') || p === '/apps') return 'apps';
    if (p.startsWith('/mobile/home') || p === '/mobile' || p === '/') return 'home';
    return 'home';
  }, []);

  const [activeTab, setActiveTabState] = useState<MobileTab>(() => getTabFromPath(pathname));
  const [openedAppId, setOpenedAppId] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<MobileEntityDetail | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const tabFromUrl = getTabFromPath(pathname);
    if (tabFromUrl !== activeTab && activeTab !== 'app_view') {
      setActiveTabState(tabFromUrl);
    }
  }, [pathname, getTabFromPath, activeTab]);

  const navigateToTab = useCallback((tab: MobileTab) => {
    setIsDetailSheetOpen(false);
    setSelectedEntity(null);
    setActiveTabState(tab);
    if (tab !== 'app_view') {
      setOpenedAppId(null);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });

    const targetRoute = tab === 'home' ? '/mobile/home' : `/mobile/${tab}`;
    if (pathname !== targetRoute) {
      try {
        navigate(targetRoute, { replace: true });
      } catch (e) {}
    }
  }, [pathname, navigate]);

  const openApp = useCallback((appId: string) => {
    setIsDetailSheetOpen(false);
    setSelectedEntity(null);
    setOpenedAppId(appId);
    setActiveTabState('app_view');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const closeApp = useCallback(() => {
    setOpenedAppId(null);
    setActiveTabState('apps');
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (pathname !== '/mobile/apps') {
      try {
        navigate('/mobile/apps', { replace: true });
      } catch (e) {}
    }
  }, [pathname, navigate]);

  const openOrionAI = useCallback(() => {
    setIsDetailSheetOpen(false);
    setSelectedEntity(null);
    setOpenedAppId(null);
    setActiveTabState('ai');
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (pathname !== '/mobile/ai') {
      try {
        navigate('/mobile/ai', { replace: true });
      } catch (e) {}
    }
  }, [pathname, navigate]);

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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDetailSheetOpen) {
          closeEntityDetail();
        } else if (activeTab === 'app_view') {
          closeApp();
        } else if (activeTab !== 'home') {
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
