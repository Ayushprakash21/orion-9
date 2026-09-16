import React, {  createContext, useContext, useState, useCallback, useEffect, useMemo, useRef  } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { ORION_REGISTRY, OrionApp } from './OrionApplicationRegistry';
import { useLocation, useNavigate } from 'react-router-dom';

export type WindowState = 'open' | 'active' | 'inactive' | 'minimized' | 'maximized' | 'closed';
export type WorkspaceId = 'operations' | 'intelligence' | 'control';

export interface AppWindow {
  id: string; // registry id
  state: WindowState;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  workspace: WorkspaceId;
  isFocused: boolean;
  openedAt: number;
  prevGeometry?: {
    position: { x: number; y: number };
    size: { width: number; height: number };
  };
}

export interface WorkspaceConfig {
  id: WorkspaceId;
  name: string;
  pinnedApps: string[]; // default dock apps for this workspace
}

export const WORKSPACES: WorkspaceConfig[] = [
  {
    id: 'operations',
    name: 'OPERATIONS',
    pinnedApps: ['command-center', 'inventory', 'procurement', 'suppliers', 'shipments', 'inbound', 'outbound', 'warehouse', 'logistics', 'integrations']
  },
  {
    id: 'intelligence',
    name: 'INTELLIGENCE',
    pinnedApps: ['world-model', 'predictions', 'demand-forecasting', 'inventory-optimization', 'scenarios', 'digital-twin', 'risk-radar', 'memory', 'intelligence-center', 'signal-language']
  },
  {
    id: 'control',
    name: 'CONTROL',
    pinnedApps: ['exceptions', 'decisions', 'action-center', 'workflows', 'autopilot', 'attention-center', 'outcomes', 'decision-replay', 'policies', 'vital-signs']
  }
];

interface WindowManagerContextProps {
  windows: Record<string, AppWindow>;
  activeAppId: string | null;
  activeWorkspaceId: WorkspaceId;
  dockPinnedApps: string[];
  reorderDock: (newOrder: string[]) => void;
  
  openApplication: (id: string, workspace?: WorkspaceId) => void;
  closeApplication: (id: string) => void;
  closeWindow: (id: string) => void;
  closeAllWindows: () => void;
  minimizeApplication: (id: string) => void;
  maximizeApplication: (id: string) => void;
  restoreApplication: (id: string) => void;
  focusApplication: (id: string) => void;
  moveApplication: (id: string, position: { x: number; y: number }) => void;
  resizeApplication: (id: string, size: { width: number; height: number }, position?: { x: number; y: number }) => void;
  
  pinToDock: (id: string) => void;
  unpinFromDock: (id: string) => void;
  
  setWorkspace: (id: WorkspaceId) => void;
  
  launcherOpen: boolean;
  setLauncherOpen: (open: boolean) => void;
  
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
}

const WindowManagerContext = createContext<WindowManagerContextProps | undefined>(undefined);

const DEFAULT_DOCK_PINNED = [
  'command-center',
  'inventory',
  'procurement',
  'suppliers',
  'shipments',
  'exceptions',
  'world-model',
  'reports',
  'settings',
  'integrations'
];

const normalizeAppId = (id: string): string => {
  if (id === 'about-orion') return 'about';
  return id;
};

// Requirement 15: Windows are strictly bounded between z-index 10 and 45.
// Dock is at z-60, overlays at z-70+. Active window is always 45.
const normalizeWindowZIndexes = (
  prev: Record<string, AppWindow>,
  focusedId?: string | null
): Record<string, AppWindow> => {
  const windowList = Object.values(prev);
  if (windowList.length === 0) return {};

  const others = windowList
    .filter(w => w.id !== focusedId)
    .sort((a, b) => a.zIndex - b.zIndex);

  const next: Record<string, AppWindow> = {};
  others.forEach((w, idx) => {
    next[w.id] = {
      ...w,
      zIndex: 10 + Math.min(idx, 30),
      isFocused: false,
      state: w.state === 'active' ? 'inactive' : w.state
    };
  });

  if (focusedId && prev[focusedId]) {
    const cur = prev[focusedId];
    next[focusedId] = {
      ...cur,
      zIndex: 45,
      isFocused: true,
      state: cur.state === 'minimized' ? 'active' : (cur.state === 'maximized' ? 'maximized' : 'active')
    };
  }

  return next;
};

export function OrionWindowManager({ children }: { children: React.ReactNode }) {
  const supplyChain = useSupplyChain();
  
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize dock from localStorage with validation against ORION_REGISTRY
  
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<WorkspaceId>('operations');

  const [dockPinnedAppsRecord, setDockPinnedAppsRecord] = useState<Record<WorkspaceId, string[]>>(() => {
    let saved: Record<WorkspaceId, string[]> | null = null;
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('orion_dock_workspaces');
        if (raw) saved = JSON.parse(raw);
      } catch (e) {}
    }
    if (saved) {
      // Normalize persisted dock state. ORION AI is never a dock item.
      // Preserve user choices, then fill from the workspace's canonical defaults to ten icons.
      const cleaned = { ...saved };
      WORKSPACES.forEach(ws => {
        const persisted = (cleaned[ws.id] || []).filter(id => id !== 'orion-ai' && ORION_REGISTRY[id]);
        const merged = [...persisted, ...(ws.pinnedApps || [])].filter((id, index, arr) => arr.indexOf(id) === index);
        cleaned[ws.id] = merged.slice(0, 10);
      });
      return cleaned;
    }
    
    const record = {} as Record<WorkspaceId, string[]>;
    WORKSPACES.forEach(ws => {
      record[ws.id] = ws.pinnedApps || [];
    });
    return record;
  });

  const dockPinnedApps = dockPinnedAppsRecord[activeWorkspaceId] || [];

  const setDockPinnedApps = useCallback((updater: string[] | ((prev: string[]) => string[])) => {
    setDockPinnedAppsRecord(prev => {
      const current = prev[activeWorkspaceId] || [];
      const nextArr = typeof updater === 'function' ? updater(current) : updater;
      const next = { ...prev, [activeWorkspaceId]: nextArr };
      if (typeof window !== 'undefined') {
        localStorage.setItem('orion_dock_workspaces', JSON.stringify(next));
      }
      return next;
    });
  }, [activeWorkspaceId]);




  // Windows start empty: root '/' means authenticated desktop, not auto-creation of windows
  const [windows, setWindows] = useState<Record<string, AppWindow>>({});
  const windowsRef = useRef<Record<string, AppWindow>>({});
  const [activeAppId, setActiveAppIdState] = useState<string | null>(null);
  const activeAppIdRef = useRef<string | null>(null);
  const closedAppIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    windowsRef.current = windows;
  }, [windows]);

  const setActiveAppId = useCallback((id: string | null) => {
    activeAppIdRef.current = id;
    setActiveAppIdState(id);
  }, []);

  const [launcherOpen, setLauncherOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Guards to prevent navigation / synchronization loops
  const lastProcessedPathRef = useRef<string>(location.pathname);
  const hasInitializedDesktopRef = useRef<boolean>(false);

  // Safe navigation wrapper to intercept and silence aborted navigation rejections
  const safeNavigate = useCallback((to: string, options?: any) => {
    try {
      const res = navigate(to, options);
      if (res && typeof (res as any).catch === 'function') {
        (res as any).catch(() => {});
      }
    } catch {}
  }, [navigate]);

  

  // Compute sensible default geometry for a newly opened window
  const computeDefaultGeometry = useCallback((existingCount: number) => {
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const screenH = typeof window !== 'undefined' ? window.innerHeight : 900;

    // ORION behaves like a desktop OS: a newly opened application gets a
    // display-aware native window, with no hard 1680px/1800px web-page cap.
    // Small screens become full-screen; larger displays use the full workspace
    // by default while retaining a modest desktop margin for window chrome.
    const topChrome = 48;
    const margin = screenW < 1100 ? 0 : Math.max(8, Math.round(Math.min(screenW, screenH) * 0.012));
    const availableW = Math.max(360, screenW - margin * 2);
    const availableH = Math.max(300, screenH - topChrome - margin * 2);

    if (screenW < 900 || screenH < 620) {
      return {
        position: { x: 0, y: 0 },
        size: { width: screenW, height: Math.max(300, screenH - topChrome) }
      };
    }

    const stagger = (existingCount % 4) * Math.min(24, Math.round(screenW * 0.008));
    const width = Math.min(availableW, Math.max(900, Math.round(availableW * (screenW >= 2560 ? 0.96 : 0.94))));
    const height = Math.min(availableH, Math.max(560, Math.round(availableH * 0.94)));
    const x = Math.max(0, Math.min(screenW - width, Math.round((screenW - width) / 2) + stagger - 24));
    const y = Math.max(0, Math.min(screenH - topChrome - height, margin + Math.round(stagger / 2)));

    return {
      position: { x, y },
      size: { width, height }
    };
  }, []);

  // 1. OPEN APPLICATION
  const openApplication = useCallback((rawId: string, targetWorkspace?: WorkspaceId) => {
        const id = normalizeAppId(rawId);
    const app = ORION_REGISTRY[id];
    if (!app) return;

    // Explicit user action to open app: unblock if previously closed
    closedAppIdsRef.current.delete(id);

    // Map application category to workspace
    let mappedWorkspace: WorkspaceId = activeWorkspaceId;
    const cat = app.category.toLowerCase();
    if (cat === 'operations' || cat === 'intelligence' || cat === 'control') {
      mappedWorkspace = cat as WorkspaceId;
    } else if (cat === 'ai' || cat === 'platform' || cat === 'administration') {
      mappedWorkspace = 'control'; // Fallback mapping for system apps
    }

    let destWorkspace: WorkspaceId = targetWorkspace || mappedWorkspace;

    setWindows(prev => {
      const existing = prev[id];
      if (existing) {
        destWorkspace = targetWorkspace || existing.workspace;
        return normalizeWindowZIndexes({
          ...prev,
          [id]: {
            ...existing,
            workspace: destWorkspace,
            state: existing.state === 'minimized' ? 'maximized' : existing.state
          }
        }, id);
      } else {
        const geom = computeDefaultGeometry(Object.keys(prev).length);
        return normalizeWindowZIndexes({
          ...prev,
          [id]: {
            id,
            state: 'maximized',
            zIndex: 45,
            position: geom.position,
            size: geom.size,
            workspace: destWorkspace,
            isFocused: true,
            openedAt: Date.now()
          }
        }, id);
      }
    });

    if (destWorkspace !== activeWorkspaceId) {
      setActiveWorkspaceId(destWorkspace);
    }

    setActiveAppId(id);
    setLauncherOpen(false);

    if (location.pathname !== app.route) {
      lastProcessedPathRef.current = app.route;
      safeNavigate(app.route);
    }
  }, [activeWorkspaceId, computeDefaultGeometry, location.pathname, safeNavigate, setActiveAppId]);

  // 2. FOCUS APPLICATION
  const focusApplication = useCallback((rawId: string) => {
    const id = normalizeAppId(rawId);
    const app = ORION_REGISTRY[id];
    if (!app) return;

    let targetWorkspace: WorkspaceId | null = null;

    setWindows(prev => {
      const targetWindow = prev[id];
      if (!targetWindow) return prev;
      targetWorkspace = targetWindow.workspace;
      return normalizeWindowZIndexes(prev, id);
    });

    if (targetWorkspace && targetWorkspace !== activeWorkspaceId) {
      setActiveWorkspaceId(targetWorkspace);
    }

    setActiveAppId(id);
    setLauncherOpen(false);

    if (location.pathname !== app.route) {
      lastProcessedPathRef.current = app.route;
      safeNavigate(app.route);
    }
  }, [activeWorkspaceId, location.pathname, safeNavigate, setActiveAppId]);

  // 3. CLOSE APPLICATION
  // Compute the next state synchronously from a ref.  React state updater
  // functions must remain pure; navigation and active-window side effects are
  // performed only after the next window set has been committed to state.
  const closeApplication = useCallback((rawId: string) => {
    const id = normalizeAppId(rawId);
    const current = windowsRef.current;
    const target = current[id];
    if (!target) return;

    closedAppIdsRef.current.add(id);

    const next = { ...current };
    delete next[id];

    const isTargetActive = target.isFocused || activeAppIdRef.current === id;
    let nextActiveId: string | null = null;
    let nextRoute = '/';

    if (isTargetActive) {
      const remaining = Object.values(next)
        .filter(w => w.workspace === target.workspace && w.state !== 'minimized')
        .sort((a, b) => b.zIndex - a.zIndex);

      if (remaining.length > 0) {
        nextActiveId = remaining[0].id;
        nextRoute = ORION_REGISTRY[nextActiveId]?.route || '/';
      }
    } else {
      nextActiveId = activeAppIdRef.current;
    }

    const normalized = nextActiveId ? normalizeWindowZIndexes(next, nextActiveId) : next;
    windowsRef.current = normalized;
    setWindows(normalized);
    setActiveAppId(nextActiveId);

    if (isTargetActive) {
      lastProcessedPathRef.current = nextRoute;
      if (location.pathname !== nextRoute) {
        safeNavigate(nextRoute, { replace: true });
      }
    }
  }, [location.pathname, safeNavigate, setActiveAppId]);

  const closeWindow = closeApplication;

  // 4. CLOSE ALL WINDOWS
  const closeAllWindows = useCallback(() => {
    Object.keys(windowsRef.current).forEach(id => closedAppIdsRef.current.add(id));
    windowsRef.current = {};
    setWindows({});
    setActiveAppId(null);
    lastProcessedPathRef.current = '/';
    if (location.pathname !== '/') {
      safeNavigate('/', { replace: true });
    }
  }, [location.pathname, safeNavigate, setActiveAppId]);

  // 5. MINIMIZE APPLICATION
  const minimizeApplication = useCallback((rawId: string) => {
    const id = normalizeAppId(rawId);
    const current = windowsRef.current;
    const cur = current[id];
    if (!cur || cur.state === 'minimized') return;

    const targetWorkspace = cur.workspace;
    const isTargetActive = activeAppIdRef.current === id || cur.isFocused;
    const next: Record<string, AppWindow> = {
      ...current,
      [id]: { ...cur, state: 'minimized', isFocused: false }
    };

    let nextActiveId: string | null = isTargetActive ? null : activeAppIdRef.current;
    let nextRoute = location.pathname;

    if (isTargetActive) {
      const remaining = Object.values(next)
        .filter(w => w.id !== id && w.workspace === targetWorkspace && w.state !== 'minimized')
        .sort((a, b) => b.zIndex - a.zIndex);

      if (remaining.length > 0) {
        nextActiveId = remaining[0].id;
        nextRoute = ORION_REGISTRY[nextActiveId]?.route || '/';
      }
    }

    const normalized = nextActiveId ? normalizeWindowZIndexes(next, nextActiveId) : next;
    windowsRef.current = normalized;
    setWindows(normalized);
    setActiveAppId(nextActiveId);

    if (isTargetActive && nextActiveId && location.pathname !== nextRoute) {
      lastProcessedPathRef.current = nextRoute;
      safeNavigate(nextRoute, { replace: true });
    }
  }, [location.pathname, safeNavigate, setActiveAppId]);

  // 6. MAXIMIZE APPLICATION
  const maximizeApplication = useCallback((rawId: string) => {
    const id = normalizeAppId(rawId);
    const app = ORION_REGISTRY[id];

    let targetWorkspace: WorkspaceId | null = null;

    setWindows(prev => {
      const cur = prev[id];
      if (!cur) return prev;
      targetWorkspace = cur.workspace;
      const updated = {
        ...prev,
        [id]: {
          ...cur,
          prevGeometry: cur.state === 'maximized' ? cur.prevGeometry : { position: cur.position, size: cur.size },
          state: 'maximized' as const
        }
      };
      return normalizeWindowZIndexes(updated, id);
    });

    if (targetWorkspace && targetWorkspace !== activeWorkspaceId) {
      setActiveWorkspaceId(targetWorkspace);
    }

    setActiveAppId(id);
    setLauncherOpen(false);

    if (app && location.pathname !== app.route) {
      lastProcessedPathRef.current = app.route;
      safeNavigate(app.route);
    }
  }, [activeWorkspaceId, location.pathname, safeNavigate, setActiveAppId]);

  // 7. RESTORE APPLICATION
  const restoreApplication = useCallback((rawId: string) => {
    const id = normalizeAppId(rawId);
    const app = ORION_REGISTRY[id];

    let targetWorkspace: WorkspaceId | null = null;

    setWindows(prev => {
      const cur = prev[id];
      if (!cur) return prev;
      targetWorkspace = cur.workspace;
      const restoredPosition = cur.prevGeometry?.position || cur.position;
      const restoredSize = cur.prevGeometry?.size || cur.size;

      const updated = {
        ...prev,
        [id]: {
          ...cur,
          position: restoredPosition,
          size: restoredSize,
          state: 'active' as const
        }
      };
      return normalizeWindowZIndexes(updated, id);
    });

    if (targetWorkspace && targetWorkspace !== activeWorkspaceId) {
      setActiveWorkspaceId(targetWorkspace);
    }

    setActiveAppId(id);
    setLauncherOpen(false);

    if (app && location.pathname !== app.route) {
      lastProcessedPathRef.current = app.route;
      safeNavigate(app.route);
    }
  }, [activeWorkspaceId, location.pathname, safeNavigate, setActiveAppId]);

  // 8. MOVE APPLICATION
  const moveApplication = useCallback((rawId: string, position: { x: number; y: number }) => {
    const id = normalizeAppId(rawId);
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const screenH = typeof window !== 'undefined' ? window.innerHeight - 48 : 852;

    setWindows(prev => {
      const target = prev[id];
      if (!target || target.state === 'maximized') return prev;

      const clampedX = Math.max(-target.size.width + 120, Math.min(screenW - 120, position.x));
      const clampedY = Math.max(0, Math.min(Math.max(0, screenH - 32), position.y));

      return {
        ...prev,
        [id]: {
          ...target,
          position: { x: clampedX, y: clampedY }
        }
      };
    });
  }, []);

  // 9. RESIZE APPLICATION
  const resizeApplication = useCallback((
    rawId: string, 
    size: { width: number; height: number }, 
    position?: { x: number; y: number }
  ) => {
    const id = normalizeAppId(rawId);
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const screenH = typeof window !== 'undefined' ? window.innerHeight - 48 : 852;

    setWindows(prev => {
      const target = prev[id];
      if (!target || target.state === 'maximized') return prev;

      const minW = Math.min(480, Math.max(320, Math.round(screenW * 0.55)));
      const minH = Math.min(340, Math.max(240, Math.round(screenH * 0.45)));
      const clampedW = Math.max(minW, Math.min(screenW - 8, size.width));
      const clampedH = Math.max(minH, Math.min(screenH - 8, size.height));

      const updatedPos = position ? {
        x: Math.max(-clampedW + 120, Math.min(screenW - 120, position.x)),
        y: Math.max(0, Math.min(Math.max(0, screenH - 32), position.y))
      } : target.position;

      return {
        ...prev,
        [id]: {
          ...target,
          size: { width: clampedW, height: clampedH },
          position: updatedPos
        }
      };
    });
  }, []);

  // 10. DOCK MANAGEMENT
  const pinToDock = useCallback((id: string) => {
    setDockPinnedApps(prev => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  const unpinFromDock = useCallback((id: string) => {
    setDockPinnedApps(prev => prev.filter(appId => appId !== id));
  }, []);

  const reorderDock = useCallback((newOrder: string[]) => {
    setDockPinnedApps(newOrder);
  }, []);


  const setWorkspace = useCallback((id: WorkspaceId) => {
    setActiveWorkspaceId(id);

    const current = windowsRef.current;
    const inNewWs = Object.values(current)
      .filter(w => w.workspace === id && w.state !== 'minimized')
      .sort((a, b) => b.zIndex - a.zIndex);

    const topId = inNewWs.length > 0 ? inNewWs[0].id : null;
    const topRoute = topId ? (ORION_REGISTRY[topId]?.route || '/') : '/';
    const normalized = normalizeWindowZIndexes(current, topId);

    windowsRef.current = normalized;
    setWindows(normalized);
    setActiveAppId(topId);

    if (location.pathname !== topRoute) {
      lastProcessedPathRef.current = topRoute;
      safeNavigate(topRoute, { replace: true });
    }
  }, [location.pathname, safeNavigate, setActiveAppId]);

  // 12. INITIAL DESKTOP LAUNCH
  // Runs exactly once when the authenticated desktop window manager mounts:
  // If destination is '/', opens Command Center once.
  // If destination is '/inventory', opens Inventory once.
  useEffect(() => {
    if (hasInitializedDesktopRef.current) return;
    hasInitializedDesktopRef.current = true;

    const currentPath = location.pathname;
    if (currentPath.startsWith('/admin') || currentPath.startsWith('/login') || currentPath.startsWith('/admin-login')) {
      return;
    }

    if (currentPath === '/' || currentPath === '') {
      return;
    }

    let matchedAppId: string | null = null;
    for (const [id, app] of Object.entries(ORION_REGISTRY)) {
      if (app.route === currentPath) {
        matchedAppId = id;
        break;
      }
    }
    if (matchedAppId) {
      openApplication(matchedAppId);
    }
  }, ); // eslint-disable-line react-hooks/exhaustive-deps

  // 13. SAFE ROUTER SYNCHRONIZATION
  // Synchronizes external route changes (e.g. address bar navigation, browser back/forward)
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath === lastProcessedPathRef.current) return;
    lastProcessedPathRef.current = currentPath;

    if (currentPath.startsWith('/admin') || currentPath.startsWith('/login') || currentPath.startsWith('/admin-login')) return;

    // Direct root URL '/' means calm desktop when no windows are open or when user closed windows
    if (currentPath === '/' || currentPath === '') {
      return;
    }

    let matchedAppId: string | null = null;
    for (const [id, app] of Object.entries(ORION_REGISTRY)) {
      if (app.route === currentPath) {
        matchedAppId = id;
        break;
      }
    }

    if (matchedAppId) {
      if (closedAppIdsRef.current.has(matchedAppId)) {
        return;
      }
      openApplication(matchedAppId);
    }
  }, [location.pathname, openApplication]);

  // 14. GLOBAL EVENT DISPATCHER SUPPORT (for launcher / tests / deep links)
  useEffect(() => {
    (window as any).__orion_open_app = openApplication;
    (window as any).__orion_close_app = closeApplication;

    const handleOpenAppEvent = (e: CustomEvent<{ appId: string; workspace?: WorkspaceId }>) => {
      if (e.detail?.appId) {
        openApplication(e.detail.appId, e.detail.workspace);
      }
    };
    const handleCloseAppEvent = (e: CustomEvent<{ appId: string }>) => {
      if (e.detail?.appId) {
        closeApplication(e.detail.appId);
      }
    };

    window.addEventListener('orion:open-app', handleOpenAppEvent as EventListener);
    window.addEventListener('orion:close-app', handleCloseAppEvent as EventListener);

    return () => {
      window.removeEventListener('orion:open-app', handleOpenAppEvent as EventListener);
      window.removeEventListener('orion:close-app', handleCloseAppEvent as EventListener);
      delete (window as any).__orion_open_app;
      delete (window as any).__orion_close_app;
    };
  }, [openApplication, closeApplication]);

  const value = useMemo(() => ({
    windows,
    activeAppId,
    activeWorkspaceId,
    dockPinnedApps,
    openApplication,
    closeApplication,
    closeWindow,
    closeAllWindows,
    minimizeApplication,
    maximizeApplication,
    restoreApplication,
    focusApplication,
    moveApplication,
    resizeApplication,
    pinToDock,
    unpinFromDock,
    reorderDock,
    setWorkspace,
    launcherOpen,
    setLauncherOpen,
    commandPaletteOpen,
    setCommandPaletteOpen
  }), [
    windows, activeAppId, activeWorkspaceId, dockPinnedApps,
    openApplication, closeApplication, closeWindow, closeAllWindows,
    minimizeApplication, maximizeApplication, restoreApplication,
    focusApplication, moveApplication, resizeApplication,
    pinToDock, unpinFromDock, reorderDock, setWorkspace,
    launcherOpen, commandPaletteOpen
  ]);

  return (
    <WindowManagerContext.Provider value={value}>
      {children}
    </WindowManagerContext.Provider>
  );
}

export const useOptionalWindowManager = () => {
  return useContext(WindowManagerContext);
};

export const useWindowManager = () => {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error('useWindowManager must be used within OrionWindowManager');
  }
  return context;
};
