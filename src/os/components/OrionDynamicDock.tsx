import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  Bell,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Grid,
  Layers,
  Minus,
  Pin,
  PinOff,
  Play,
  RefreshCw,
  Search,
  Square,
  X,
} from 'lucide-react';
import { useWindowManager } from '../WindowManagerContext';
import { ORION_REGISTRY } from '../OrionApplicationRegistry';
import { useOrionContextMenu, ContextMenuItem } from '../contextMenu/OrionContextMenuContext';
import { useToast } from '../../store/ToastContext';
import { useI18n } from '../../store/LanguageContext';
import { useOptionalSupplyChain } from '../../store/SupplyChainContext';
import { cn } from '../../lib/utils';
import { dockGeometryRegistry } from '../dock/DockGeometryRegistry';
import { isReducedMotionPreferred } from '../motion/OrionMotion';
import OrionAppIcon from '../../components/brand/OrionAppIcon';
import { useOSGeometry } from '../dock/DockGeometry';
import { useOrionTheme } from '../theme/useOrionTheme';
import { useDynamicIslandState } from './dynamicIsland/useDynamicIslandState';
import { DynamicIslandExpanded } from './dynamicIsland/DynamicIslandExpanded';

export type DockVisibilityState = 'visible' | 'hidden' | 'revealing' | 'hiding';

/**
 * UNIFIED DYNAMIC DOCK 2.0 (`OrionDynamicDock`)
 * Combines the macOS-inspired application Dock and interactive Dynamic Island
 * into a single continuous glass surface anchored to the active Dock edge.
 */
export function OrionDynamicDock() {
  const { t } = useI18n();
  const { isDark } = useOrionTheme();
  const iconTheme = isDark ? 'dark' : 'light';
  const supplyChain = useOptionalSupplyChain();
  const isReducedMotion = isReducedMotionPreferred(
    supplyChain?.settings?.reducedMotion ?? supplyChain?.settings?.personalization?.reducedMotion
  );

  const {
    windows,
    activeAppId,
    activeWorkspaceId,
    dockPinnedApps,
    openApplication,
    focusApplication,
    minimizeApplication,
    maximizeApplication,
    restoreApplication,
    closeApplication,
    pinToDock,
    unpinFromDock,
    reorderDock,
    setLauncherOpen,
    setCommandPaletteOpen,
  } = useWindowManager();

  const { openContextMenu } = useOrionContextMenu();
  const { showToast } = useToast();
  const { dock, settings, systemBarHeight } = useOSGeometry();

  const {
    presentationMode,
    surfaceState,
    isExpanded,
    isPinned,
    isCompactOverMaximized,
    isFullscreenHidden,
    activity,
    activities,
    primaryEvent,
    metrics,
    toggleExpanded,
    collapse,
    togglePin,
    setIsHovered: setIslandHovered,
    handleAction,
    dismissActivity,
  } = useDynamicIslandState();

  const telemetryEnabled = presentationMode !== 'disabled';
  const effectiveExpanded = telemetryEnabled && isExpanded;

  const [hoveredApp, setHoveredApp] = useState<string | null>(null);
  const [draggedApp, setDraggedApp] = useState<string | null>(null);
  const [dragOverApp, setDragOverApp] = useState<string | null>(null);
  const [bouncingAppId, setBouncingAppId] = useState<string | null>(null);

  const isVertical = dock.orientation === 'vertical';
  const dockPosition = dock.position;
  const autoHideEnabled = Boolean(settings.dockAutoHide);
  const magnificationEnabled = Boolean(settings.dockMagnification) && !isReducedMotion;

  const [visibilityState, setVisibilityState] = useState<DockVisibilityState>(() => {
    return autoHideEnabled && !effectiveExpanded && !isPinned ? 'hidden' : 'visible';
  });
  const visibilityStateRef = useRef<DockVisibilityState>(visibilityState);
  visibilityStateRef.current = visibilityState;

  const [dockVisible, setDockVisible] = useState(!autoHideEnabled || effectiveExpanded || isPinned);
  const dockVisibleRef = useRef(dockVisible);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const dynamicTriggerRef = useRef<HTMLDivElement | null>(null);
  const wasExpandedRef = useRef<boolean>(effectiveExpanded);

  // Generation counter to invalidate stale hide/reveal timers
  const visibilityGenerationRef = useRef<number>(0);
  const hideTimerRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);

  const openAppIdsForDock = Object.keys(windows).filter(
    (id) => id !== 'orion-ai' && windows[id]?.state !== 'closed' && windows[id]?.workspace === activeWorkspaceId
  );

  const clearTimers = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (revealTimerRef.current !== null) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }, []);

  const setDockState = useCallback(
    (nextState: DockVisibilityState) => {
      visibilityStateRef.current = nextState;
      setVisibilityState(nextState);
      const visible = !autoHideEnabled || effectiveExpanded || isPinned || nextState === 'visible' || nextState === 'revealing';
      dockVisibleRef.current = visible;
      setDockVisible(visible);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('orion-dock-visibility-changed', {
            detail: { visible, state: nextState },
          })
        );
      }
    },
    [autoHideEnabled, effectiveExpanded, isPinned]
  );

  const handleActivationTrigger = useCallback(() => {
    if (!autoHideEnabled || effectiveExpanded || isPinned) {
      setDockState('visible');
      return;
    }
    clearTimers();
    const generation = ++visibilityGenerationRef.current;
    setDockState('revealing');
    revealTimerRef.current = window.setTimeout(() => {
      if (generation !== visibilityGenerationRef.current) return;
      setDockState('visible');
    }, 40);
  }, [autoHideEnabled, effectiveExpanded, isPinned, clearTimers, setDockState]);

  const handleDockEnter = useCallback(() => {
    clearTimers();
    ++visibilityGenerationRef.current;
    setIslandHovered(true);
    setDockState('visible');
  }, [clearTimers, setDockState, setIslandHovered]);

  const scheduleDockHide = useCallback(() => {
    setIslandHovered(false);
    if (!autoHideEnabled || effectiveExpanded || isPinned) {
      setDockState('visible');
      return;
    }
    clearTimers();

    if (dockRef.current?.matches(':focus-within')) {
      return;
    }

    if (visibilityStateRef.current === 'revealing') {
      const hideGen = ++visibilityGenerationRef.current;
      setDockState('hiding');
      hideTimerRef.current = window.setTimeout(() => {
        if (hideGen !== visibilityGenerationRef.current) return;
        setDockState('hidden');
      }, 200);
      return;
    }

    const generation = ++visibilityGenerationRef.current;
    hideTimerRef.current = window.setTimeout(() => {
      if (generation !== visibilityGenerationRef.current) return;
      const el = dockRef.current;
      if (!el?.matches(':hover') && !el?.matches(':focus-within')) {
        setDockState('hiding');
        const hideGen = ++visibilityGenerationRef.current;
        hideTimerRef.current = window.setTimeout(() => {
          if (hideGen !== visibilityGenerationRef.current) return;
          setDockState('hidden');
        }, 200);
      }
    }, 250);
  }, [autoHideEnabled, effectiveExpanded, isPinned, clearTimers, setDockState, setIslandHovered]);

  // Keep Dock visible while Dynamic Activity panel is expanded or pinned; resume auto-hide on collapse
  useEffect(() => {
    if (effectiveExpanded || isPinned) {
      clearTimers();
      ++visibilityGenerationRef.current;
      setDockState('visible');
    } else if (wasExpandedRef.current && autoHideEnabled) {
      scheduleDockHide();
    }
    wasExpandedRef.current = effectiveExpanded;
  }, [effectiveExpanded, isPinned, autoHideEnabled, clearTimers, setDockState, scheduleDockHide]);

  // Outside click collapses expanded panel when unpinned
  useEffect(() => {
    if (!effectiveExpanded || isPinned) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        collapse();
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [effectiveExpanded, isPinned, collapse]);

  // Wrap collapse to restore keyboard focus cleanly to the Dynamic Dock trigger
  const handleCollapseWithFocusRestore = useCallback(() => {
    const activeInsidePanel =
      typeof document !== 'undefined' &&
      document.activeElement instanceof HTMLElement &&
      dockRef.current?.contains(document.activeElement);
    collapse();
    if (activeInsidePanel) {
      window.requestAnimationFrame(() => {
        dynamicTriggerRef.current?.focus();
      });
    }
  }, [collapse]);

  // Restore focus when Escape collapses expanded Dynamic Dock while focus is inside the panel
  useEffect(() => {
    if (!effectiveExpanded) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const activeInside =
          typeof document !== 'undefined' &&
          document.activeElement instanceof HTMLElement &&
          dockRef.current?.contains(document.activeElement);
        if (activeInside) {
          window.requestAnimationFrame(() => {
            dynamicTriggerRef.current?.focus();
          });
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [effectiveExpanded]);

  // Synchronize when autoHideEnabled preference changes
  useEffect(() => {
    clearTimers();
    ++visibilityGenerationRef.current;
    if (!autoHideEnabled || effectiveExpanded || isPinned) {
      setDockState('visible');
    } else if (!dockRef.current?.matches(':hover') && !dockRef.current?.matches(':focus-within')) {
      setDockState('hidden');
    } else {
      setDockState('visible');
    }
  }, [autoHideEnabled, effectiveExpanded, isPinned, clearTimers, setDockState]);

  // Invalidate timers on dock position changes or unmount
  useEffect(() => {
    clearTimers();
    ++visibilityGenerationRef.current;
    return () => {
      clearTimers();
      ++visibilityGenerationRef.current;
    };
  }, [dockPosition, clearTimers]);

  // Pointer move detection across all 4 screen edges for auto-hide
  useEffect(() => {
    if (!autoHideEnabled || effectiveExpanded || isPinned) {
      setDockState('visible');
      return;
    }

    const onPointerMove = (e: PointerEvent) => {
      const edgeThreshold = 14;
      let atEdge = false;

      switch (dockPosition) {
        case 'bottom':
          atEdge = e.clientY >= window.innerHeight - edgeThreshold;
          break;
        case 'top':
          atEdge = e.clientY <= systemBarHeight + edgeThreshold && e.clientY >= systemBarHeight;
          break;
        case 'left':
          atEdge = e.clientX <= edgeThreshold;
          break;
        case 'right':
          atEdge = e.clientX >= window.innerWidth - edgeThreshold;
          break;
      }

      const hoveringDock = !!dockRef.current?.matches(':hover');

      if (atEdge || hoveringDock) {
        if (visibilityStateRef.current === 'hidden' || visibilityStateRef.current === 'hiding') {
          handleActivationTrigger();
        } else if (visibilityStateRef.current === 'visible' && hideTimerRef.current) {
          window.clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
      } else if (visibilityStateRef.current === 'visible' || visibilityStateRef.current === 'revealing') {
        scheduleDockHide();
      }
    };

    const onWindowBlur = () => {
      if (autoHideEnabled && !effectiveExpanded && !isPinned) {
        clearTimers();
        ++visibilityGenerationRef.current;
        setDockState('hidden');
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('blur', onWindowBlur);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('blur', onWindowBlur);
      clearTimers();
      ++visibilityGenerationRef.current;
    };
  }, [
    autoHideEnabled,
    effectiveExpanded,
    isPinned,
    dockPosition,
    systemBarHeight,
    clearTimers,
    handleActivationTrigger,
    scheduleDockHide,
    setDockState,
  ]);

  const unpinnedOpenApps = openAppIdsForDock.filter((id) => !dockPinnedApps.includes(id));
  const dockApps = [...dockPinnedApps.filter((id) => id !== 'orion-ai'), ...unpinnedOpenApps];

  const handleAppClick = (id: string) => {
    if (!id || !ORION_REGISTRY[id]) return;
    const win = windows[id];
    if (!win || win.state === 'closed') {
      setBouncingAppId(id);
      window.setTimeout(() => setBouncingAppId((prev) => (prev === id ? null : prev)), 850);
      openApplication(id);
    } else if (win.state === 'minimized') {
      restoreApplication(id);
    } else if (activeAppId === id) {
      minimizeApplication(id);
    } else {
      focusApplication(id);
    }
  };

  const getDockContextMenuItems = useCallback(
    (id: string): ContextMenuItem[] => {
      const win = windows[id];
      const isRunning = !!win && win.state !== 'closed';
      const isMinimized = isRunning && win.state === 'minimized';
      const isPinnedApp = dockPinnedApps.includes(id);

      const items: ContextMenuItem[] = [];

      if (isRunning) {
        items.push(
          isMinimized
            ? { id: 'dock-restore', label: 'Restore', icon: Square, action: () => restoreApplication(id) }
            : { id: 'dock-minimize', label: 'Minimize', icon: Minus, action: () => minimizeApplication(id) }
        );
      } else {
        items.push({ id: 'dock-open', label: 'Open', icon: Play, action: () => openApplication(id) });
      }

      if (isRunning && !isMinimized) {
        items.push({
          id: 'dock-maximize',
          label: 'Maximize',
          icon: Square,
          disabled: win?.state === 'maximized',
          action: () => maximizeApplication(id),
        });
      }

      items.push(
        isPinnedApp
          ? { id: 'dock-unpin', label: 'Unpin from Dock', icon: PinOff, action: () => unpinFromDock(id) }
          : { id: 'dock-pin', label: 'Pin to Dock', icon: Pin, action: () => pinToDock(id) }
      );

      if (isRunning) {
        items.push({ id: 'dock-sep', label: '', separator: true });
        items.push({
          id: 'dock-close',
          label: 'Quit',
          icon: X,
          danger: true,
          action: () => closeApplication(id),
        });
      }

      return items;
    },
    [windows, dockPinnedApps, restoreApplication, minimizeApplication, openApplication, maximizeApplication, unpinFromDock, pinToDock, closeApplication]
  );

  const handleDockItemContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const app = ORION_REGISTRY[id];
    if (!app) return;

    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetType: 'dock',
      targetId: id,
      title: app.name,
      subtitle: `${app.category} • ${windows[id]?.state || 'closed'}`,
      items: getDockContextMenuItems(id),
    });
  };

  const handleLauncherContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetType: 'dock',
      targetId: 'launcher',
      title: t('desktop.startMenu'),
      subtitle: 'Applications & System Tools',
      items: [
        { id: 'launcher-open', label: 'Open Launcher', icon: Grid, action: () => setLauncherOpen(true) },
        { id: 'launcher-search', label: 'Command Palette', icon: Search, shortcut: '⌘K', action: () => setCommandPaletteOpen(true) },
        { id: 'launcher-sep', label: '', separator: true },
        { id: 'launcher-settings', label: 'Personalization...', action: () => openApplication('settings') },
      ],
    });
  };

  const handleDockSurfaceContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const activeApp = activeAppId ? ORION_REGISTRY[activeAppId] : undefined;
    const activeWin = activeAppId ? windows[activeAppId] : undefined;

    const items: ContextMenuItem[] = [];
    if (activeApp && activeWin && activeWin.state !== 'closed') {
      items.push({ id: 'surface-active-app', label: `${activeApp.name} (${activeWin.state})`, icon: Play, disabled: true });
      items.push({ id: 'surface-active-sep', label: '', separator: true });
    }
    items.push({ id: 'surface-launch', label: 'Open Applications...', icon: Grid, shortcut: 'F4', action: () => setLauncherOpen(true) });
    items.push({ id: 'surface-palette', label: 'Command Palette...', icon: Search, shortcut: '⌘K', action: () => setCommandPaletteOpen(true) });
    if (telemetryEnabled) {
      items.push({
        id: 'surface-toggle-activity',
        label: effectiveExpanded ? 'Collapse Activity Panel' : 'Expand Activity Panel',
        icon: Activity,
        action: () => toggleExpanded(),
      });
    }
    items.push({ id: 'surface-desktop-sep', label: '', separator: true });
    items.push({
      id: 'surface-refresh',
      label: 'Refresh Desktop',
      icon: RefreshCw,
      shortcut: 'F5',
      action: () => {
        window.dispatchEvent(new CustomEvent('orion:desktop-refresh', { detail: { timestamp: Date.now() } }));
        showToast('Desktop telemetry refreshed', 'success', 'Desktop');
      },
    });

    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetType: 'dock',
      targetId: activeAppId || 'dock',
      title: activeApp ? activeApp.name : 'ORION Dynamic Dock',
      subtitle: activeApp ? `${activeApp.category} • ${activeWin?.state || 'closed'}` : 'Unified Dock & Activity Surface',
      items,
    });
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedApp(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverApp !== id) {
      setDragOverApp(id);
    }
  };

  const onDragLeave = () => setDragOverApp(null);

  const onDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverApp(null);
    if (!draggedApp || draggedApp === id || !dockPinnedApps.includes(id)) {
      setDraggedApp(null);
      return;
    }
    const draggedIdx = dockPinnedApps.indexOf(draggedApp);
    const dropIdx = dockPinnedApps.indexOf(id);
    if (draggedIdx === -1 || dropIdx === -1) {
      setDraggedApp(null);
      return;
    }
    const newOrder = [...dockPinnedApps];
    newOrder.splice(draggedIdx, 1);
    newOrder.splice(dropIdx, 0, draggedApp);
    reorderDock?.(newOrder);
    setDraggedApp(null);
  };

  if (isFullscreenHidden) {
    return null;
  }

  const isHidden = !effectiveExpanded && !isPinned && autoHideEnabled && (visibilityState === 'hidden' || visibilityState === 'hiding');

  const containerPositionStyle: React.CSSProperties = useMemo(() => {
    switch (dockPosition) {
      case 'bottom':
        return {
          position: 'fixed',
          bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          left: '50%',
          transform: isHidden ? dock.hiddenTransform : 'translate3d(-50%, 0, 0)',
          maxWidth: 'calc(100vw - 24px)',
        };
      case 'top':
        return {
          position: 'fixed',
          top: `${systemBarHeight + 8}px`,
          left: '50%',
          transform: isHidden ? dock.hiddenTransform : 'translate3d(-50%, 0, 0)',
          maxWidth: 'calc(100vw - 24px)',
        };
      case 'left':
        return {
          position: 'fixed',
          left: 'calc(12px + env(safe-area-inset-left, 0px))',
          top: `calc(${systemBarHeight}px + (100dvh - ${systemBarHeight}px) / 2)`,
          transform: isHidden ? dock.hiddenTransform : 'translate3d(0, -50%, 0)',
          maxHeight: `calc(100dvh - ${systemBarHeight + 24}px)`,
        };
      case 'right':
        return {
          position: 'fixed',
          right: 'calc(12px + env(safe-area-inset-right, 0px))',
          top: `calc(${systemBarHeight}px + (100dvh - ${systemBarHeight}px) / 2)`,
          transform: isHidden ? dock.hiddenTransform : 'translate3d(0, -50%, 0)',
          maxHeight: `calc(100dvh - ${systemBarHeight + 24}px)`,
        };
    }
  }, [dockPosition, isHidden, dock.hiddenTransform, systemBarHeight]);

  const revealHandleStyle: React.CSSProperties = useMemo(() => {
    switch (dockPosition) {
      case 'bottom':
        return { bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '140px', height: '6px', borderRadius: '9999px 9999px 0 0' };
      case 'top':
        return { top: `${systemBarHeight}px`, left: '50%', transform: 'translateX(-50%)', width: '140px', height: '6px', borderRadius: '0 0 9999px 9999px' };
      case 'left':
        return { left: 0, top: '50%', transform: 'translateY(-50%)', width: '6px', height: '140px', borderRadius: '0 9999px 9999px 0' };
      case 'right':
        return { right: 0, top: '50%', transform: 'translateY(-50%)', width: '6px', height: '140px', borderRadius: '9999px 0 0 9999px' };
    }
  }, [dockPosition, systemBarHeight]);

  const getTooltipStyle = (placement: 'top' | 'bottom' | 'left' | 'right'): string => {
    switch (placement) {
      case 'top':
        return 'absolute -top-11 left-1/2 -translate-x-1/2';
      case 'bottom':
        return 'absolute -bottom-11 left-1/2 -translate-x-1/2';
      case 'left':
        return 'absolute -left-28 top-1/2 -translate-y-1/2';
      case 'right':
        return 'absolute -right-28 top-1/2 -translate-y-1/2';
    }
  };
  const tooltipClasses = getTooltipStyle(dock.tooltipPlacement);

  const utilityButtonClass = isDark
    ? 'bg-white/[0.11] hover:bg-white/[0.19] active:bg-white/[0.24] border border-white/[0.20] hover:border-white/[0.34] text-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]'
    : 'bg-slate-900/[0.06] hover:bg-slate-900/[0.12] active:bg-slate-900/[0.18] border border-slate-900/[0.14] hover:border-slate-900/[0.26] text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]';

  const tooltipSurfaceClass = isDark
    ? 'bg-[#161B24]/95 text-white border-white/15 shadow-2xl'
    : 'bg-white/95 text-slate-900 border-slate-900/15 shadow-xl';

  const dynamicTriggerToneClass = isDark
    ? activity === 'critical-alert'
      ? 'bg-rose-500/20 border-rose-400/45 hover:border-rose-300/65 text-rose-200'
      : activity === 'copilot-thinking'
        ? 'bg-indigo-500/20 border-indigo-400/45 hover:border-indigo-300/65 text-indigo-200'
        : activity === 'connector-sync'
          ? 'bg-sky-500/20 border-sky-400/45 hover:border-sky-300/65 text-sky-200'
          : activity === 'simulation-running'
            ? 'bg-purple-500/20 border-purple-400/45 hover:border-purple-300/65 text-purple-200'
            : 'bg-white/[0.10] border-white/[0.20] hover:bg-white/[0.16] hover:border-white/[0.32] text-white'
    : activity === 'critical-alert'
      ? 'bg-rose-500/12 border-rose-600/35 hover:border-rose-700/55 text-rose-800'
      : activity === 'copilot-thinking'
        ? 'bg-indigo-500/12 border-indigo-600/35 hover:border-indigo-700/55 text-indigo-800'
        : activity === 'connector-sync'
          ? 'bg-sky-500/12 border-sky-600/35 hover:border-sky-700/55 text-sky-800'
          : activity === 'simulation-running'
            ? 'bg-purple-500/12 border-purple-600/35 hover:border-purple-700/55 text-purple-800'
            : 'bg-slate-900/[0.06] border-slate-900/[0.15] hover:bg-slate-900/[0.11] hover:border-slate-900/[0.28] text-slate-900';

  const shelfFlexDirection = (() => {
    switch (dockPosition) {
      case 'bottom':
        return 'flex-col items-stretch';
      case 'top':
        return 'flex-col-reverse items-stretch';
      case 'left':
        return 'flex-row items-stretch';
      case 'right':
        return 'flex-row-reverse items-stretch';
    }
  })();

  const compactTriggerLabel = (() => {
    if (activity === 'critical-alert') {
      return `${metrics.criticalExceptionsCount} ${metrics.criticalExceptionsCount === 1 ? 'Alert' : 'Alerts'}`;
    }
    if (activity === 'copilot-thinking') {
      const copilotEvent = activities.find((item) => item.source === 'copilot');
      return copilotEvent?.title || 'Copilot Active';
    }
    if (activity === 'connector-sync') {
      return `Syncing ${metrics.connectedConnectorsCount}`;
    }
    if (activity === 'simulation-running') {
      return 'Simulating';
    }
    return metrics.activeAppName || 'System Ready';
  })();

  const expandChevron = isVertical
    ? dockPosition === 'left'
      ? effectiveExpanded
        ? <ChevronLeft className="w-3.5 h-3.5" />
        : <ChevronRight className="w-3.5 h-3.5" />
      : effectiveExpanded
        ? <ChevronRight className="w-3.5 h-3.5" />
        : <ChevronLeft className="w-3.5 h-3.5" />
    : dockPosition === 'top'
      ? effectiveExpanded
        ? <ChevronUp className="w-3.5 h-3.5 opacity-80" />
        : <ChevronDown className="w-3.5 h-3.5 opacity-80" />
      : effectiveExpanded
        ? <ChevronDown className="w-3.5 h-3.5 opacity-80" />
        : <ChevronUp className="w-3.5 h-3.5 opacity-80" />;

  return (
    <>
      {autoHideEnabled && (
        <div
          data-testid="dock-activation-zone"
          aria-label="Dock Activation Zone"
          className={cn(
            'fixed z-[9991] pointer-events-auto opacity-0 bg-transparent hidden md:block',
            dockPosition === 'bottom' && 'bottom-0 left-0 w-full h-[14px]',
            dockPosition === 'top' && 'left-0 w-full h-[14px]',
            dockPosition === 'left' && 'top-0 left-0 w-[14px] h-full',
            dockPosition === 'right' && 'top-0 right-0 w-[14px] h-full'
          )}
          style={dockPosition === 'top' ? { top: `${systemBarHeight}px` } : undefined}
          onPointerEnter={handleActivationTrigger}
          onMouseEnter={handleActivationTrigger}
          onTouchStart={handleActivationTrigger}
        />
      )}

      {autoHideEnabled && isHidden && (
        <div
          data-testid="dock-reveal-handle"
          aria-label="Reveal Dock"
          role="button"
          tabIndex={0}
          className="fixed z-[9991] opacity-0 pointer-events-auto bg-transparent hidden md:block"
          style={revealHandleStyle}
          onClick={handleActivationTrigger}
          onMouseEnter={handleActivationTrigger}
          onPointerEnter={handleActivationTrigger}
          onFocus={handleActivationTrigger}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleActivationTrigger();
            }
          }}
        />
      )}

      <div
        ref={dockRef}
        role="region"
        aria-label="Orion-9 Dynamic Island System Telemetry"
        data-dock="true"
        data-dynamic-dock="true"
        data-dock-position={dockPosition}
        data-dock-orientation={dock.orientation}
        data-dock-visible={!isHidden ? 'true' : 'false'}
        data-dock-visibility-state={visibilityState}
        data-surface-state={surfaceState}
        data-presentation-mode={presentationMode}
        aria-hidden={isHidden}
        className={cn(
          'fixed z-[9990] select-none transition-transform duration-200 ease-out will-change-transform hidden md:block',
          !isHidden ? 'pointer-events-auto' : 'pointer-events-none'
        )}
        style={containerPositionStyle}
        onContextMenu={handleDockSurfaceContextMenu}
        onMouseEnter={handleDockEnter}
        onMouseLeave={scheduleDockHide}
        onFocus={handleDockEnter}
        onBlur={(e) => {
          if (!dockRef.current?.contains(e.relatedTarget as Node)) {
            scheduleDockHide();
          }
        }}
      >
        {/* Single Unified Glass Shell (never dims children via parent opacity) */}
        <div
          className={cn(
            'orion-dock-shelf relative flex border rounded-[24px] transition-shadow duration-300',
            shelfFlexDirection,
            isVertical ? 'max-h-[calc(100dvh-84px)]' : 'w-fit min-w-[min(420px,calc(100vw-24px))] max-w-[calc(100vw-24px)]'
          )}
          style={{
            borderColor: 'var(--orion-dock-border, rgba(255, 255, 255, 0.22))',
            boxShadow: 'var(--orion-dock-shadow, 0 24px 60px rgba(0, 0, 0, 0.55))',
          }}
        >
          {/* Dedicated Translucent Glass Material Layer: transparency ONLY applies here */}
          <div
            data-testid="dock-glass-backdrop"
            aria-hidden="true"
            className="orion-dock-glass-backdrop pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{
              opacity: 'var(--orion-dock-opacity, 0.88)',
              backgroundColor: 'var(--orion-dock-tint-bg, var(--orion-dock-surface, var(--orion-morph-surface-elevated)))',
              backdropFilter: 'blur(var(--orion-dock-blur, 32px)) saturate(175%)',
              WebkitBackdropFilter: 'blur(var(--orion-dock-blur, 32px)) saturate(175%)',
              boxShadow: isDark
                ? 'inset 0 1px 1.5px rgba(255, 255, 255, 0.30), inset 0 0 0 0.5px rgba(255, 255, 255, 0.14)'
                : 'inset 0 1px 1.5px rgba(255, 255, 255, 0.95), inset 0 0 0 0.5px rgba(15, 23, 42, 0.08)',
            }}
          />

          {/* Connected Expanded Operational Activity Panel (grows upward/inward seamlessly from same glass surface) */}
          <AnimatePresence initial={false}>
            {effectiveExpanded && (
              <div className="relative z-10 min-w-0">
                <DynamicIslandExpanded
                  activity={activity}
                  activities={activities}
                  metrics={metrics}
                  isPinned={isPinned}
                  isReducedMotion={isReducedMotion}
                  dockPosition={dockPosition}
                  onTogglePin={togglePin}
                  onCollapse={handleCollapseWithFocusRestore}
                  onAction={handleAction}
                  onDismissActivity={dismissActivity}
                />
                <div
                  className={cn(
                    'bg-[var(--orion-border)] shrink-0',
                    isVertical ? 'w-px h-full my-0' : 'h-px mx-3'
                  )}
                />
              </div>
            )}
          </AnimatePresence>

          {/* Compact Dock Icon & Activity Shelf */}
          <div
            data-testid="dock-icon-shelf"
            className={cn(
              'relative z-10 p-2.5 flex items-center gap-2.5 cursor-pointer',
              isVertical ? 'flex-col overflow-y-auto max-h-[82vh]' : 'flex-row justify-between min-w-0'
            )}
            onClick={(e) => {
              if (e.target === e.currentTarget && telemetryEnabled) {
                toggleExpanded();
              }
            }}
            onMouseLeave={() => {
              setHoveredApp(null);
            }}
          >
            {/* Left / Top Utility + Running Application Strip */}
            <div
              className={cn(
                'flex items-center gap-2.5',
                isVertical ? 'flex-col' : 'overflow-x-auto overflow-y-visible min-w-0 py-0.5'
              )}
              style={{ scrollbarWidth: 'none' }}
            >
              {/* START / LAUNCHER BUTTON */}
              <button
                type="button"
                data-testid="dock-start-menu-button"
                aria-label={`${t('desktop.startMenu')} (All Applications)`}
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setLauncherOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setLauncherOpen(true);
                  }
                }}
                onContextMenu={handleLauncherContextMenu}
                onMouseEnter={() => setHoveredApp('launcher')}
                className={cn(
                  'relative group flex flex-col items-center justify-center transition-all duration-200 cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orion-accent)]',
                  isVertical ? 'hover:scale-105' : 'hover:-translate-y-1'
                )}
                style={{
                  transformOrigin: dock.magnificationOrigin,
                  transform: `scale(${hoveredApp === 'launcher' && magnificationEnabled ? 1.06 : 1})`,
                  width: `${dock.iconContainerSize}px`,
                  height: `${dock.iconContainerSize}px`,
                }}
                title={`${t('desktop.startMenu')} (All Applications)`}
              >
                <div className={cn('flex items-center justify-center w-full h-full rounded-[15px] transition-colors', utilityButtonClass)}>
                  <Grid className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />
                </div>

                <div className={cn(tooltipClasses, 'px-3 py-1 text-[11px] font-medium whitespace-nowrap rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity border z-50', tooltipSurfaceClass)}>
                  {t('desktop.startMenu')}
                </div>
              </button>

              {/* COMMAND PALETTE SEARCH BUTTON */}
              <button
                type="button"
                aria-label={t('common.search')}
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setCommandPaletteOpen(true);
                }}
                onMouseEnter={() => setHoveredApp('search')}
                className={cn(
                  'relative group flex flex-col items-center justify-center transition-all duration-200 cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orion-accent)]',
                  isVertical ? 'hover:scale-105' : 'hover:-translate-y-1'
                )}
                style={{
                  transformOrigin: dock.magnificationOrigin,
                  transform: `scale(${hoveredApp === 'search' && magnificationEnabled ? 1.06 : 1})`,
                  width: `${dock.iconContainerSize}px`,
                  height: `${dock.iconContainerSize}px`,
                }}
                title={`${t('common.search')} (Ctrl+Space / ⌘K)`}
              >
                <div className={cn('flex items-center justify-center w-full h-full rounded-[15px] transition-colors', utilityButtonClass)}>
                  <Search className="w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-105" />
                </div>

                <div className={cn(tooltipClasses, 'px-3 py-1 text-[11px] font-medium whitespace-nowrap rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity border z-50', tooltipSurfaceClass)}>
                  {t('common.search')} (Ctrl+Space)
                </div>
              </button>

              <div className={cn('bg-[var(--orion-border-strong)] shrink-0', isVertical ? 'w-7 h-px my-0.5' : 'w-px h-7 mx-0.5')} />

              {/* PINNED & RUNNING APPLICATIONS */}
              {dockApps.map((id, index) => {
                const app = ORION_REGISTRY[id];
                if (!app) return null;

                const isOpen = !!windows[id] && windows[id]?.state !== 'closed';
                const isMinimized = isOpen && windows[id]?.state === 'minimized';
                const isActive = isOpen && activeAppId === id && !isMinimized;
                const isPinnedApp = dockPinnedApps.includes(id);

                const hoveredIndex = hoveredApp ? dockApps.indexOf(hoveredApp) : -1;
                const distance = hoveredIndex !== -1 ? Math.abs(hoveredIndex - index) : 100;
                const targetScale = magnificationEnabled
                  ? distance === 0
                    ? 1.25
                    : distance === 1
                      ? 1.14
                      : distance === 2
                        ? 1.05
                        : 1
                  : 1;
                const isBouncing = bouncingAppId === id;

                return (
                  <button
                    type="button"
                    key={id}
                    ref={(el) => dockGeometryRegistry.registerIcon(id, el)}
                    data-dock-item={id}
                    aria-label={app.name}
                    tabIndex={0}
                    draggable={isPinnedApp}
                    onDragStart={(e) => onDragStart(e, id)}
                    onDragOver={(e) => onDragOver(e, id)}
                    onDragLeave={onDragLeave}
                    onDrop={(e) => onDrop(e, id)}
                    onDragEnd={() => {
                      setDraggedApp(null);
                      setDragOverApp(null);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAppClick(id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleAppClick(id);
                      }
                    }}
                    onContextMenu={(e) => handleDockItemContextMenu(e, id)}
                    onMouseEnter={() => setHoveredApp(id)}
                    className={cn(
                      'relative group flex flex-col items-center justify-center cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orion-accent)]',
                      draggedApp === id && 'opacity-50',
                      dragOverApp === id && (isVertical ? 'scale-110 my-4' : 'scale-110 mx-4')
                    )}
                    style={{
                      transformOrigin: dock.magnificationOrigin,
                      transform:
                        dragOverApp !== id && hoveredApp && targetScale !== 1
                          ? `translate3d(${isVertical ? -(targetScale - 1) * 14 : 0}px, ${!isVertical ? -(targetScale - 1) * 14 : 0}px, 0) scale(${targetScale})`
                          : undefined,
                      width: `${dock.iconContainerSize}px`,
                      height: `${dock.iconContainerSize}px`,
                      animation: isBouncing ? 'orion-dock-launch-bounce 0.8s ease-in-out infinite' : undefined,
                      transition: isReducedMotion
                        ? undefined
                        : 'transform 0.16s cubic-bezier(0.22, 1, 0.36, 1), margin 0.16s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                    title={app.name}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center w-full h-full transition-transform duration-200',
                        isMinimized && 'opacity-55 saturate-50',
                        isActive && 'scale-105'
                      )}
                    >
                      <OrionAppIcon
                        app={id}
                        size={dock.iconSize}
                        theme={iconTheme}
                        active={isActive}
                        badge={id === 'orion-ai' && metrics.copilotStatus !== 'idle' && metrics.copilotStatus !== 'ready'}
                        notificationCount={id === 'exceptions' ? metrics.criticalExceptionsCount : 0}
                        showContainer={true}
                      />
                    </div>

                    {/* Active / Open / Minimized Indicator Dot */}
                    {isOpen && (
                      <div
                        className={cn(
                          'absolute transition-all duration-200',
                          isVertical
                            ? dockPosition === 'left'
                              ? '-left-1.5 top-1/2 -translate-y-1/2'
                              : '-right-1.5 top-1/2 -translate-y-1/2'
                            : dockPosition === 'top'
                              ? '-top-1.5 left-1/2 -translate-x-1/2'
                              : '-bottom-1.5 left-1/2 -translate-x-1/2',
                          isActive
                            ? isVertical
                              ? 'h-3 w-1 rounded-full bg-[var(--orion-accent)] shadow-[0_0_6px_var(--orion-accent)]'
                              : 'w-3 h-1 rounded-full bg-[var(--orion-accent)] shadow-[0_0_6px_var(--orion-accent)]'
                            : isMinimized
                              ? 'w-1 h-1 rounded-full bg-[var(--orion-text-muted)]'
                              : 'w-1.5 h-1.5 rounded-full bg-[var(--orion-text-primary)]/80'
                        )}
                      />
                    )}

                    {/* Tooltip */}
                    <div
                      className={cn(
                        tooltipClasses,
                        'px-3 py-1 text-[11px] font-medium whitespace-nowrap rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity border z-50',
                        tooltipSurfaceClass
                      )}
                    >
                      {app.name}
                      {isMinimized && <span className="text-[var(--orion-text-muted)] ml-1.5 text-[10px]">(Minimized)</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right / Bottom Unified Dynamic Island Activity Control + Task Switcher */}
            <div className={cn('flex items-center gap-2 shrink-0', isVertical ? 'flex-col' : 'flex-row')}>
              <div className={cn('bg-[var(--orion-border-strong)] shrink-0', isVertical ? 'w-7 h-px my-0.5' : 'w-px h-7 mx-0.5')} />

              {telemetryEnabled && (
                <div
                  ref={dynamicTriggerRef}
                  data-testid="dynamic-dock-trigger"
                  role="button"
                  tabIndex={0}
                  aria-expanded={effectiveExpanded}
                  aria-controls="dynamic-dock-expanded-surface"
                  aria-label="Expand Orion Dynamic Island"
                  data-surface-state={surfaceState}
                  data-compact-over-maximized={isCompactOverMaximized ? 'true' : 'false'}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleExpanded();
                    }
                  }}
                  className={cn(
                    'flex items-center justify-center gap-2 border cursor-pointer select-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orion-accent)]',
                    dynamicTriggerToneClass,
                    isVertical
                      ? 'rounded-[15px]'
                      : 'rounded-full px-3 max-w-[205px]'
                  )}
                  style={
                    isVertical
                      ? { width: `${dock.iconContainerSize}px`, height: `${dock.iconContainerSize}px` }
                      : { height: `${Math.max(38, dock.iconContainerSize - 6)}px` }
                  }
                  title={effectiveExpanded ? 'Collapse Dynamic Dock (Esc)' : 'Expand Dynamic Dock Activity & System Health'}
                >
                  {isVertical ? (
                    <div className="relative flex items-center justify-center">
                      {activity === 'critical-alert' ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : activity === 'copilot-thinking' ? (
                        <Brain className="w-4 h-4" />
                      ) : activity === 'connector-sync' ? (
                        <RefreshCw className="w-4 h-4" />
                      ) : activity === 'simulation-running' ? (
                        <Activity className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                      {metrics.unreadNotificationsCount > 0 && (
                        <span className="absolute -top-2 -right-2 px-1 min-w-[14px] h-[14px] rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                          {metrics.unreadNotificationsCount}
                        </span>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Status indicator dot & icon */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        {activity === 'critical-alert' ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          </>
                        ) : activity === 'copilot-thinking' ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                            <Brain className="w-3.5 h-3.5 shrink-0" />
                          </>
                        ) : activity === 'connector-sync' ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                          </>
                        ) : activity === 'simulation-running' ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                            <Activity className="w-3.5 h-3.5 shrink-0" />
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                          </>
                        )}

                        <span className="text-[11px] font-semibold truncate">{compactTriggerLabel}</span>
                      </div>

                      {/* Progress, Notification Pill or Optimal status */}
                      {typeof primaryEvent?.progress === 'number' && (
                        <div className={`w-8 h-1 rounded-full overflow-hidden shrink-0 ${isDark ? 'bg-white/20' : 'bg-slate-900/15'}`}>
                          <div
                            className="h-full bg-sky-500 rounded-full transition-[width] duration-200"
                            style={{ width: `${Math.max(0, Math.min(100, primaryEvent.progress))}%` }}
                          />
                        </div>
                      )}

                      {metrics.unreadNotificationsCount > 0 ? (
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            isDark ? 'bg-rose-500/25 text-rose-200' : 'bg-rose-600/15 text-rose-800'
                          }`}
                          aria-label={`${metrics.unreadNotificationsCount} unread notification${metrics.unreadNotificationsCount === 1 ? '' : 's'}`}
                        >
                          <Bell className="w-2.5 h-2.5" />
                          <span>{metrics.unreadNotificationsCount}</span>
                        </span>
                      ) : activity === 'system-ready' ? (
                        <span className="hidden lg:inline text-[10px] text-[var(--orion-text-secondary)] font-medium shrink-0">
                          Optimal
                        </span>
                      ) : null}

                      {expandChevron}
                    </>
                  )}
                </div>
              )}

              {/* TASK SWITCHER BUTTON */}
              <button
                type="button"
                aria-label="Task Switcher"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent('orion:open-task-switcher'));
                }}
                onMouseEnter={() => setHoveredApp('switcher')}
                className={cn(
                  'relative group flex flex-col items-center justify-center transition-all duration-200 cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orion-accent)]',
                  isVertical ? 'hover:scale-105' : 'hover:-translate-y-1'
                )}
                style={{
                  transformOrigin: dock.magnificationOrigin,
                  transform: `scale(${hoveredApp === 'switcher' && magnificationEnabled ? 1.06 : 1})`,
                  width: `${dock.iconContainerSize}px`,
                  height: `${dock.iconContainerSize}px`,
                }}
                title="Task Switcher (Alt+Tab)"
              >
                <div className={cn('flex items-center justify-center w-full h-full rounded-[15px] transition-colors', utilityButtonClass)}>
                  <Layers className="w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-105" />
                </div>

                <div className={cn(tooltipClasses, 'px-3 py-1 text-[11px] font-medium whitespace-nowrap rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity border z-50', tooltipSurfaceClass)}>
                  Task Switcher (Alt+Tab)
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
