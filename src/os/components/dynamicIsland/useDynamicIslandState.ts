/**
 * ORION-9 DYNAMIC ISLAND STATE ENGINE
 * Event-driven telemetry & deduplicated activity queue with zero idle polling.
 * Inspired by Astraeus (https://github.com/Icetist/Astraeus) interaction efficiency:
 * - Zero idle 1s clock intervals when collapsed
 * - Condenses cleanly over maximized windows
 * - Suppresses heavy surfaces during OS fullscreen
 * - Single nearest-expiration timer instead of background loops
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ORION_REGISTRY } from '../../OrionApplicationRegistry';
import { useOptionalWindowManager } from '../../WindowManagerContext';
import { useOptionalSupplyChain } from '../../../store/SupplyChainContext';
import { useOptionalNotifications } from '../../../store/NotificationContext';
import { useConnectivity } from '../../../store/ConnectivityContext';
import { dbManager } from '../../../core/database/DatabaseConnectionManager';
import { useIntegrationFabric } from '../../../integration/useIntegrationFabric';
import {
  DynamicIslandActivity,
  DynamicIslandCopilotStatus,
  DynamicIslandEventItem,
  DynamicIslandMetrics,
  DynamicIslandPresentationMode,
  DynamicIslandState,
  DynamicIslandSurfaceState,
} from './DynamicIslandTypes';

const PINNED_STORAGE_KEY = 'orion_dynamic_island_pinned';
const MODE_STORAGE_KEY = 'orion_dynamic_island_mode';
const MAX_TRANSIENT_EVENTS = 6;
const RETURNING_TRANSITION_MS = 220;

function readStoredPresentationMode(): DynamicIslandPresentationMode {
  if (typeof localStorage === 'undefined') return 'compact';
  const raw = localStorage.getItem(MODE_STORAGE_KEY);
  if (raw === 'compact' || raw === 'expanded' || raw === 'minimal' || raw === 'disabled') {
    return raw;
  }
  return 'compact';
}

export function getAuthoritativeRuntime(): { runtimeMode: 'TAURI DESKTOP' | 'WEB OS'; isNativeDesktop: boolean } {
  const win = typeof window !== 'undefined' ? (window as any) : null;
  const isNativeDesktop = Boolean(win?.__TAURI__?.core?.invoke || win?.__TAURI_INTERNALS__);
  return {
    runtimeMode: isNativeDesktop ? 'TAURI DESKTOP' : 'WEB OS',
    isNativeDesktop,
  };
}

export function emitDynamicIslandEvent(item: DynamicIslandEventItem): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('orion:dynamic-island-event', { detail: item }));
}

export function useDynamicIslandState(): DynamicIslandState {
  const windowManager = useOptionalWindowManager();
  const supplyChain = useOptionalSupplyChain();
  const notifications = useOptionalNotifications();
  const connectivity = useConnectivity();
  const integration = useIntegrationFabric();
  const [environmentLabel, setEnvironmentLabel] = useState<string>(() => {
    try {
      return dbManager.getEnvironment();
    } catch {
      return 'DEMO';
    }
  });

  const [presentationMode, setPresentationMode] = useState<DynamicIslandPresentationMode>(() => readStoredPresentationMode());
  const [isExpanded, setIsExpanded] = useState(() => readStoredPresentationMode() === 'expanded');
  const [isReturning, setIsReturning] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFullscreenHidden, setIsFullscreenHidden] = useState(false);
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(PINNED_STORAGE_KEY) === 'true';
  });

  const [copilotStatus, setCopilotStatus] = useState<DynamicIslandCopilotStatus>('idle');
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [customEvents, setCustomEvents] = useState<DynamicIslandEventItem[]>([]);

  const autoCollapseTimeoutRef = useRef<number | null>(null);
  const returningTimeoutRef = useRef<number | null>(null);

  const pushActivity = useCallback((incoming: DynamicIslandEventItem) => {
    setCustomEvents(prev => {
      const idx = prev.findIndex(e => e.id === incoming.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...incoming };
        return updated;
      }
      return [incoming, ...prev].slice(0, MAX_TRANSIENT_EVENTS);
    });
  }, []);

  const dismissActivity = useCallback((id: string) => {
    setCustomEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  // Single nearest-expiration cleanup timer (zero polling loops)
  useEffect(() => {
    const now = Date.now();
    const withExpiry = customEvents.filter(e => typeof e.expiresAt === 'number');
    if (withExpiry.length === 0) return;

    const expiredNow = withExpiry.some(e => (e.expiresAt as number) <= now);
    if (expiredNow) {
      setCustomEvents(prev => prev.filter(e => !e.expiresAt || e.expiresAt > now));
      return;
    }

    const nextExpiry = Math.min(...withExpiry.map(e => e.expiresAt as number));
    const delayMs = Math.max(50, nextExpiry - now + 10);
    const timerId = globalThis.setTimeout(() => {
      const ts = Date.now();
      setCustomEvents(prev => prev.filter(e => !e.expiresAt || e.expiresAt > ts));
    }, delayMs);

    return () => globalThis.clearTimeout(timerId);
  }, [customEvents]);

  // Listen for fullscreen changes (Astraeus-inspired fullscreen media/game yield)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const updateFullscreen = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreenHidden(active);
      if (active) setIsExpanded(false);
    };
    updateFullscreen();
    document.addEventListener('fullscreenchange', updateFullscreen);
    return () => document.removeEventListener('fullscreenchange', updateFullscreen);
  }, []);

  // Event-driven listeners for AI Copilot, Simulation & Custom Activity Queue
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleCopilotState = (e: CustomEvent<{ status?: DynamicIslandCopilotStatus; detail?: string }>) => {
      const next = e.detail?.status || 'idle';
      setCopilotStatus(next);
      if (next === 'thinking' || next === 'analyzing') {
        pushActivity({
          id: 'sys-copilot-active',
          source: 'copilot',
          title: next === 'analyzing' ? 'Copilot Analyzing Graph' : 'Orion Copilot Reasoning',
          subtitle: e.detail?.detail || 'Synthesizing supply chain telemetry',
          severity: 'active',
          timestamp: Date.now(),
          actionLabel: 'Open Copilot',
          actionAppId: 'ai-copilot',
        });
      } else {
        dismissActivity('sys-copilot-active');
      }
    };

    const handleSimulationState = (e: CustomEvent<{ running?: boolean; name?: string }>) => {
      const running = Boolean(e.detail?.running);
      setSimulationRunning(running);
      if (running) {
        pushActivity({
          id: 'sys-simulation-active',
          source: 'simulation',
          title: 'Scenario Simulation Active',
          subtitle: e.detail?.name || 'Evaluating demand shock propagation',
          severity: 'active',
          timestamp: Date.now(),
          actionLabel: 'Inspect',
          actionAppId: 'scenarios',
        });
      } else {
        dismissActivity('sys-simulation-active');
      }
    };

    const handleDynamicEvent = (e: CustomEvent<DynamicIslandEventItem>) => {
      if (e.detail && e.detail.id && e.detail.title) {
        pushActivity(e.detail);
      }
    };

    const handleDynamicConfig = (e: CustomEvent<{ mode?: DynamicIslandPresentationMode; pinned?: boolean }>) => {
      const nextMode = e.detail?.mode || readStoredPresentationMode();
      setPresentationMode(nextMode);
      if (typeof e.detail?.pinned === 'boolean') {
        setIsPinned(e.detail.pinned);
      }
      if (nextMode === 'disabled') {
        setIsExpanded(false);
      } else if (nextMode === 'expanded') {
        setIsExpanded(true);
      } else if (nextMode === 'compact' || nextMode === 'minimal') {
        setIsExpanded(false);
      }
    };

    window.addEventListener('orion:copilot-state' as any, handleCopilotState as EventListener);
    window.addEventListener('orion:demo-simulation-state-changed' as any, handleSimulationState as EventListener);
    window.addEventListener('orion:dynamic-island-event' as any, handleDynamicEvent as EventListener);
    window.addEventListener('orion:dynamic-island-config-changed' as any, handleDynamicConfig as EventListener);
    const handleEnvChanged = () => {
      try {
        setEnvironmentLabel(dbManager.getEnvironment());
      } catch {}
    };
    window.addEventListener('orion-database-environment-changed', handleEnvChanged);

    return () => {
      window.removeEventListener('orion:copilot-state' as any, handleCopilotState as EventListener);
      window.removeEventListener('orion:demo-simulation-state-changed' as any, handleSimulationState as EventListener);
      window.removeEventListener('orion:dynamic-island-event' as any, handleDynamicEvent as EventListener);
      window.removeEventListener('orion:dynamic-island-config-changed' as any, handleDynamicConfig as EventListener);
      window.removeEventListener('orion-database-environment-changed', handleEnvChanged);
    };
  }, [pushActivity, dismissActivity]);

  const activeExceptions = supplyChain?.exceptions || [];
  const inventory = supplyChain?.inventory || [];
  const shipments = supplyChain?.shipments || [];
  const purchaseOrders = supplyChain?.purchaseOrders || [];
  const connectors = integration?.connectors || [];
  const syncJobs = integration?.syncJobs || [];

  const activeAppId = windowManager?.activeAppId ?? null;
  const activeWorkspaceId = windowManager?.activeWorkspaceId;
  const windowsRecord = windowManager?.windows || {};

  const isCompactOverMaximized = useMemo(() => {
    if (!windowsRecord || typeof windowsRecord !== 'object') return false;
    return Object.values(windowsRecord).some(
      w => w && w.state === 'maximized' && (!activeWorkspaceId || w.workspace === activeWorkspaceId)
    );
  }, [windowsRecord, activeWorkspaceId]);

  const metrics: DynamicIslandMetrics = useMemo(() => {
    const activeExceptionsCount = activeExceptions.filter((e: any) => e.status !== 'Resolved').length;
    const criticalExceptionsCount = activeExceptions.filter(
      (e: any) => e.severity === 'Critical' && e.status !== 'Resolved'
    ).length;

    const stockoutRisksCount = inventory.filter(
      (i: any) => i.onHand <= (i.safetyStock || i.reorderPoint || 10)
    ).length;

    const delayedShipmentsCount = shipments.filter((s: any) => s.status === 'Delayed').length;
    const openPurchaseOrdersCount = purchaseOrders.filter(
      (po: any) => po.status === 'Pending' || po.status === 'Approved'
    ).length;

    const connectedConnectorsCount = connectors.filter((c: any) => c.status === 'CONNECTED').length;
    const activeSyncJobsCount = syncJobs.filter((j: any) => j.status === 'RUNNING').length;
    const unreadNotificationsCount = notifications?.unreadCount || 0;

    const runtime = getAuthoritativeRuntime();
    const activeAppName = activeAppId ? ORION_REGISTRY[activeAppId]?.name || activeAppId : null;

    return {
      activeExceptionsCount,
      criticalExceptionsCount,
      stockoutRisksCount,
      delayedShipmentsCount,
      openPurchaseOrdersCount,
      connectedConnectorsCount,
      activeSyncJobsCount,
      unreadNotificationsCount,
      runtimeMode: runtime.runtimeMode,
      isNativeDesktop: runtime.isNativeDesktop,
      environmentLabel,
      connectivityLabel: connectivity.statusLabel,
      isOnline: connectivity.isOnline,
      activeAppName,
      copilotStatus,
      simulationRunning,
    };
  }, [
    activeExceptions,
    inventory,
    shipments,
    purchaseOrders,
    connectors,
    syncJobs,
    notifications?.unreadCount,
    activeAppId,
    copilotStatus,
    simulationRunning,
    environmentLabel,
    connectivity.statusLabel,
    connectivity.isOnline,
  ]);

  // Unified Priority Activity State (live AI Copilot reasoning surfaces immediately over static alerts)
  const activity: DynamicIslandActivity = useMemo(() => {
    if (metrics.copilotStatus === 'thinking' || metrics.copilotStatus === 'analyzing') return 'copilot-thinking';
    if (metrics.criticalExceptionsCount > 0) return 'critical-alert';
    if (metrics.activeSyncJobsCount > 0) return 'connector-sync';
    if (metrics.simulationRunning) return 'simulation-running';
    if (metrics.unreadNotificationsCount > 0) return 'unread-notifications';
    return 'system-ready';
  }, [
    metrics.criticalExceptionsCount,
    metrics.copilotStatus,
    metrics.activeSyncJobsCount,
    metrics.simulationRunning,
    metrics.unreadNotificationsCount,
  ]);

  // Unified Deduplicated Event Queue (derived + custom events)
  const activities: DynamicIslandEventItem[] = useMemo(() => {
    const derived: DynamicIslandEventItem[] = [];

    if (metrics.criticalExceptionsCount > 0) {
      derived.push({
        id: 'sys-critical-exceptions',
        source: 'exception',
        title: `Shipment exception detected • ${metrics.criticalExceptionsCount} ${metrics.criticalExceptionsCount === 1 ? 'Alert' : 'Alerts'}`,
        subtitle: 'Immediate supply chain review recommended',
        severity: 'critical',
        timestamp: 0,
        actionLabel: 'Inspect Exceptions',
        actionAppId: 'exceptions',
      });
    }

    if (metrics.activeSyncJobsCount > 0) {
      derived.push({
        id: 'sys-connector-sync',
        source: 'connector',
        title: `Syncing ${metrics.connectedConnectorsCount} connectors`,
        subtitle: `${metrics.activeSyncJobsCount} live ERP data pipeline${metrics.activeSyncJobsCount > 1 ? 's' : ''} active`,
        severity: 'active',
        timestamp: 0,
        actionLabel: 'Sync Monitor',
        actionAppId: 'sync',
      });
    }

    const combined = [...derived];
    for (const item of customEvents) {
      if (!combined.some(existing => existing.id === item.id)) {
        combined.push(item);
      }
    }
    return combined.slice(0, MAX_TRANSIENT_EVENTS);
  }, [metrics.criticalExceptionsCount, metrics.activeSyncJobsCount, metrics.connectedConnectorsCount, customEvents]);

  const primaryEvent = activities[0] || null;

  // 5-state surface model
  const surfaceState: DynamicIslandSurfaceState = useMemo(() => {
    if (isExpanded) return 'expanded';
    if (isReturning) return 'returning';
    if (activity === 'copilot-thinking') return 'activity';
    if (activity === 'critical-alert' || primaryEvent?.severity === 'critical') return 'critical';
    if (activity === 'connector-sync' || activity === 'simulation-running' || customEvents.length > 0) {
      return 'activity';
    }
    return 'idle';
  }, [isExpanded, isReturning, activity, primaryEvent, customEvents.length]);

  const triggerReturningTransition = useCallback(() => {
    if (returningTimeoutRef.current !== null) {
      globalThis.clearTimeout(returningTimeoutRef.current);
    }
    setIsReturning(true);
    returningTimeoutRef.current = globalThis.setTimeout(() => {
      setIsReturning(false);
      returningTimeoutRef.current = null;
    }, RETURNING_TRANSITION_MS) as unknown as number;
  }, []);

  const expand = useCallback(() => {
    setIsReturning(false);
    setIsExpanded(true);
  }, []);

  const collapse = useCallback(() => {
    setIsExpanded(false);
    triggerReturningTransition();
  }, [triggerReturningTransition]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => {
      if (prev) {
        triggerReturningTransition();
        return false;
      }
      setIsReturning(false);
      return true;
    });
  }, [triggerReturningTransition]);

  const togglePin = useCallback(() => {
    setIsPinned(prev => {
      const next = !prev;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(PINNED_STORAGE_KEY, String(next));
      }
      return next;
    });
  }, []);

  // Auto-collapse after 8s inactivity when expanded and unpinned
  useEffect(() => {
    if (autoCollapseTimeoutRef.current !== null) {
      globalThis.clearTimeout(autoCollapseTimeoutRef.current);
      autoCollapseTimeoutRef.current = null;
    }

    if (isExpanded && !isPinned && !isHovered) {
      autoCollapseTimeoutRef.current = globalThis.setTimeout(() => {
        setIsExpanded(false);
        triggerReturningTransition();
      }, 8000) as unknown as number;
    }

    return () => {
      if (autoCollapseTimeoutRef.current !== null) {
        globalThis.clearTimeout(autoCollapseTimeoutRef.current);
        autoCollapseTimeoutRef.current = null;
      }
    };
  }, [isExpanded, isPinned, isHovered, triggerReturningTransition]);

  useEffect(() => {
    return () => {
      if (returningTimeoutRef.current !== null) {
        globalThis.clearTimeout(returningTimeoutRef.current);
      }
    };
  }, []);

  // Escape closes expanded card
  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
        triggerReturningTransition();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, triggerReturningTransition]);

  const handleAction = useCallback((appId: string) => {
    if (appId === 'search') {
      windowManager?.setCommandPaletteOpen?.(true);
    } else if (appId === 'notifications') {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('orion:open-notifications'));
      }
    } else {
      windowManager?.openApplication?.(appId);
    }
    if (!isPinned) {
      setIsExpanded(false);
      triggerReturningTransition();
    }
  }, [windowManager, isPinned, triggerReturningTransition]);

  return useMemo(() => ({
    mode: isExpanded ? 'expanded' : 'compact',
    presentationMode,
    surfaceState,
    isExpanded,
    isPinned,
    isHovered,
    isCompactOverMaximized,
    isFullscreenHidden,
    activity,
    activities,
    primaryEvent,
    metrics,
    toggleExpanded,
    expand,
    collapse,
    togglePin,
    setIsHovered,
    handleAction,
    pushActivity,
    dismissActivity,
  }), [
    presentationMode,
    isExpanded,
    surfaceState,
    isPinned,
    isHovered,
    isCompactOverMaximized,
    isFullscreenHidden,
    activity,
    activities,
    primaryEvent,
    metrics,
    toggleExpanded,
    expand,
    collapse,
    togglePin,
    handleAction,
    pushActivity,
    dismissActivity,
  ]);
}
