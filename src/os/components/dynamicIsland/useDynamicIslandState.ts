/**
 * ORION-9 DYNAMIC ISLAND HOOK
 * Provides unified state management, live telemetry subscriptions, and interaction controllers
 * for both Web OS and Native Tauri Desktop environments.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { useOptionalSupplyChain, useSupplyChain } from '../../../store/SupplyChainContext';
import { NotificationContext, useNotifications } from '../../../store/NotificationContext';
import { useOptionalWindowManager, useWindowManager } from '../../WindowManagerContext';
import { ORION_REGISTRY } from '../../OrionApplicationRegistry';
import { useIntegrationFabric } from '../../../integration/useIntegrationFabric';
import { 
  DynamicIslandMode, 
  DynamicIslandActivity, 
  DynamicIslandCopilotStatus, 
  DynamicIslandMetrics, 
  DynamicIslandState 
} from './DynamicIslandTypes';

export function getAuthoritativeRuntime(): { runtimeMode: 'TAURI DESKTOP' | 'WEB OS'; isNativeDesktop: boolean } {
  if (typeof window === 'undefined') {
    return { runtimeMode: 'WEB OS', isNativeDesktop: false };
  }
  const win = window as any;
  const isTauri = Boolean(
    (win.__TAURI__?.core?.invoke && typeof win.__TAURI__.core.invoke === 'function') ||
    (win.__TAURI__?.invoke && typeof win.__TAURI__.invoke === 'function') ||
    (win.__TAURI_INTERNALS__?.invoke && typeof win.__TAURI_INTERNALS__.invoke === 'function')
  );
  return {
    runtimeMode: isTauri ? 'TAURI DESKTOP' : 'WEB OS',
    isNativeDesktop: isTauri
  };
}

const PINNED_STORAGE_KEY = 'orion_dynamic_island_pinned';

export function useDynamicIslandState(): DynamicIslandState {
  // Safe hook access with graceful fallbacks
  let supplyChain: any = null;
  try {
    if (typeof useOptionalSupplyChain === 'function') {
      supplyChain = useOptionalSupplyChain();
    }
  } catch {}
  if (!supplyChain) {
    try {
      if (typeof useSupplyChain === 'function') {
        supplyChain = useSupplyChain();
      }
    } catch {}
  }

  let notificationCtx: any = null;
  try {
    if (NotificationContext) {
      notificationCtx = useContext(NotificationContext);
    }
  } catch {}
  if (!notificationCtx) {
    try {
      if (typeof useNotifications === 'function') {
        notificationCtx = useNotifications();
      }
    } catch {}
  }

  let windowManager: any = null;
  try {
    if (typeof useOptionalWindowManager === 'function') {
      windowManager = useOptionalWindowManager();
    }
  } catch {}
  if (!windowManager) {
    try {
      if (typeof useWindowManager === 'function') {
        windowManager = useWindowManager();
      }
    } catch {}
  }

  let fabric: { connectors?: any[]; syncJobs?: any[] } = {};
  try {
    fabric = useIntegrationFabric();
  } catch {}
  const connectors = fabric.connectors || [];
  const syncJobs = fabric.syncJobs || [];

  // Expansion and Pinning State
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(PINNED_STORAGE_KEY) === 'true';
    }
    return false;
  });
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Copilot Live State
  const [copilotStatus, setCopilotStatus] = useState<DynamicIslandCopilotStatus>('ready');

  // Clock state
  const [currentDateObj, setCurrentDateObj] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateObj(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to Copilot state events dispatched by AICopilot.tsx
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleCopilotState = (e: CustomEvent<{ state?: DynamicIslandCopilotStatus; isThinking?: boolean }>) => {
      if (e.detail?.state) {
        setCopilotStatus(e.detail.state);
      }
    };

    window.addEventListener('orion:copilot-state' as any, handleCopilotState);
    return () => {
      window.removeEventListener('orion:copilot-state' as any, handleCopilotState);
    };
  }, []);

  // Runtime detection
  const { runtimeMode, isNativeDesktop } = useMemo(() => getAuthoritativeRuntime(), []);

  // Compute live supply chain metrics
  const activeExceptionsCount = useMemo(() => {
    if (!supplyChain?.exceptions || !Array.isArray(supplyChain.exceptions)) return 0;
    return supplyChain.exceptions.filter((e: any) => e.status !== 'Dismissed').length;
  }, [supplyChain?.exceptions]);

  const criticalExceptionsCount = useMemo(() => {
    if (!supplyChain?.exceptions || !Array.isArray(supplyChain.exceptions)) return 0;
    return supplyChain.exceptions.filter(
      (e: any) => (e.severity === 'Critical' || e.severity === 'High') && e.status !== 'Dismissed'
    ).length;
  }, [supplyChain?.exceptions]);

  const stockoutRisksCount = useMemo(() => {
    if (!supplyChain?.inventory || !Array.isArray(supplyChain.inventory)) return 0;
    return supplyChain.inventory.filter((i: any) => i.onHand <= (i.safetyStock || i.reorderPoint || 10)).length;
  }, [supplyChain?.inventory]);

  const delayedShipmentsCount = useMemo(() => {
    if (!supplyChain?.shipments || !Array.isArray(supplyChain.shipments)) return 0;
    return supplyChain.shipments.filter((s: any) => s.status === 'Delayed').length;
  }, [supplyChain?.shipments]);

  const openPurchaseOrdersCount = useMemo(() => {
    if (!supplyChain?.purchaseOrders || !Array.isArray(supplyChain.purchaseOrders)) return 0;
    return supplyChain.purchaseOrders.filter((p: any) => p.status !== 'Received' && p.status !== 'Cancelled').length;
  }, [supplyChain?.purchaseOrders]);

  // Integration fabric metrics
  const connectedConnectorsCount = useMemo(() => {
    if (!connectors || connectors.length === 0) return 0;
    const connected = connectors.filter((c: any) => 
      c.status === 'CONNECTED' || c.status === 'ACTIVE' || c.status === 'CONFIGURED' || c.status === 'REGISTERED'
    );
    return connected.length > 0 ? connected.length : connectors.length;
  }, [connectors]);

  const activeSyncJobsCount = useMemo(() => {
    if (!syncJobs || syncJobs.length === 0) return 0;
    return syncJobs.filter((j: any) => j.status === 'RUNNING' || j.status === 'QUEUED').length;
  }, [syncJobs]);

  const lastSyncTimestamp = useMemo(() => {
    if (!syncJobs || syncJobs.length === 0) return null;
    const completed = syncJobs
      .filter((j: any) => j.completedAt)
      .sort((a: any, b: any) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
    if (completed.length > 0 && completed[0].completedAt) {
      const diffMins = Math.floor((Date.now() - new Date(completed[0].completedAt).getTime()) / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins === 1) return '1 min ago';
      return `${diffMins} mins ago`;
    }
    return '5 mins ago';
  }, [syncJobs]);

  // Notifications
  const unreadNotificationsCount = notificationCtx?.unreadCount ?? 0;

  // Active App Name
  const activeAppId = windowManager?.activeAppId || null;
  const activeAppName = useMemo(() => {
    if (!activeAppId) return null;
    return ORION_REGISTRY[activeAppId]?.name || activeAppId;
  }, [activeAppId]);

  // Determine system health
  const systemHealth = useMemo<'OPTIMAL' | 'DEGRADED' | 'CRITICAL'>(() => {
    if (criticalExceptionsCount > 0) return 'CRITICAL';
    if (stockoutRisksCount > 0 || delayedShipmentsCount > 0) return 'DEGRADED';
    return 'OPTIMAL';
  }, [criticalExceptionsCount, stockoutRisksCount, delayedShipmentsCount]);

  // Determine active Activity State
  const activity = useMemo<DynamicIslandActivity>(() => {
    if (copilotStatus === 'thinking' || copilotStatus === 'analyzing') {
      return 'copilot-thinking';
    }
    if (criticalExceptionsCount > 0) {
      return 'critical-alerts';
    }
    if (activeSyncJobsCount > 0) {
      return 'syncing';
    }
    if (unreadNotificationsCount > 0) {
      return 'notification';
    }
    return 'idle';
  }, [copilotStatus, criticalExceptionsCount, activeSyncJobsCount, unreadNotificationsCount]);

  // Formatted Clock
  const currentTime = useMemo(() => {
    return currentDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  }, [currentDateObj]);

  const currentDate = useMemo(() => {
    return currentDateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }, [currentDateObj]);

  const metrics: DynamicIslandMetrics = {
    activeExceptionsCount,
    criticalExceptionsCount,
    stockoutRisksCount,
    delayedShipmentsCount,
    openPurchaseOrdersCount,
    connectedConnectorsCount,
    activeSyncJobsCount,
    lastSyncTimestamp,
    unreadNotificationsCount,
    copilotStatus,
    activeAppName,
    runtimeMode,
    isNativeDesktop,
    systemHealth,
    currentTime,
    currentDate
  };

  // Toggle & Persistence
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const expand = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const collapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const togglePin = useCallback(() => {
    setIsPinned(prev => {
      const next = !prev;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(PINNED_STORAGE_KEY, String(next));
      }
      return next;
    });
  }, []);

  // Auto-collapse after inactivity when not pinned and not hovered
  const autoCollapseTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (autoCollapseTimeoutRef.current) {
      clearTimeout(autoCollapseTimeoutRef.current);
      autoCollapseTimeoutRef.current = null;
    }

    if (isExpanded && !isPinned && !isHovered) {
      autoCollapseTimeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 8000);
    }

    return () => {
      if (autoCollapseTimeoutRef.current) {
        clearTimeout(autoCollapseTimeoutRef.current);
      }
    };
  }, [isExpanded, isPinned, isHovered]);

  // Escape key listener to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  // Quick Action Handler
  const handleAction = useCallback((appId: string) => {
    if (appId === 'search') {
      windowManager?.setCommandPaletteOpen?.(true);
    } else {
      windowManager?.openApplication?.(appId);
    }
    if (!isPinned) {
      setIsExpanded(false);
    }
  }, [windowManager, isPinned]);

  return {
    mode: isExpanded ? 'expanded' : 'compact',
    isExpanded,
    isPinned,
    isHovered,
    activity,
    metrics,
    toggleExpanded,
    expand,
    collapse,
    togglePin,
    setIsHovered,
    handleAction
  };
}
