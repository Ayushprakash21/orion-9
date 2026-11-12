import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useWindowManager } from '../WindowManagerContext';
import { ORION_REGISTRY } from '../OrionApplicationRegistry';
import { useOrionContextMenu, ContextMenuItem } from '../contextMenu/OrionContextMenuContext';
import { useToast } from '../../store/ToastContext';
import { useI18n } from '../../store/LanguageContext';
import { cn } from '../../lib/utils';
import { dockGeometryRegistry } from '../dock/DockGeometryRegistry';
import { isReducedMotionPreferred } from '../motion/OrionMotion';
import OrionAppIcon from '../../components/brand/OrionAppIcon';
import { useOSGeometry } from '../dock/DockGeometry';
import { useOrionTheme } from '../theme/useOrionTheme';
import { useOptionalSupplyChain } from '../../store/SupplyChainContext';
import {
  Grid,
  Pin,
  PinOff,
  X,
  Play,
  Layers,
  Minus,
  Square,
  Search,
} from 'lucide-react';

export type DockVisibilityState = 'visible' | 'hidden' | 'revealing' | 'hiding';

/**
 * INDEPENDENT APPLICATION DOCK (`OrionDock`)
 * Permanently floating application Dock anchored to the active edge (bottom by default).
 * Houses application icons, running indicators, launcher, search, and window controls.
 * Opacity is isolated strictly to a dedicated background layer so child icons and badges remain 100% vivid.
 */
export function OrionDock() {
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

  const [hoveredApp, setHoveredApp] = useState<string | null>(null);
  const [draggedApp, setDraggedApp] = useState<string | null>(null);
  const [dragOverApp, setDragOverApp] = useState<string | null>(null);
  const [bouncingAppId, setBouncingAppId] = useState<string | null>(null);

  const isVertical = dock.orientation === 'vertical';
  const dockPosition = dock.position;
  const autoHideEnabled = Boolean(settings.dockAutoHide);
  const magnificationEnabled = Boolean(settings.dockMagnification) && !isReducedMotion;

  const [visibilityState, setVisibilityState] = useState<DockVisibilityState>(() => {
    return autoHideEnabled ? 'hidden' : 'visible';
  });
  const visibilityStateRef = useRef<DockVisibilityState>(visibilityState);
  visibilityStateRef.current = visibilityState;

  const [dockVisible, setDockVisible] = useState(!autoHideEnabled);
  const dockVisibleRef = useRef(!autoHideEnabled);
  const dockRef = useRef<HTMLDivElement | null>(null);

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
      const visible = !autoHideEnabled || nextState === 'visible' || nextState === 'revealing';
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
    [autoHideEnabled]
  );

  const scheduleDockHide = useCallback(() => {
    if (!autoHideEnabled) return;
    clearTimers();
    const currentGen = ++visibilityGenerationRef.current;
    setDockState('hiding');
    hideTimerRef.current = window.setTimeout(() => {
      if (visibilityGenerationRef.current === currentGen) {
        setDockState('hidden');
      }
    }, 400);
  }, [autoHideEnabled, clearTimers, setDockState]);

  const handleActivationTrigger = useCallback(() => {
    if (!autoHideEnabled) return;
    clearTimers();
    const currentGen = ++visibilityGenerationRef.current;
    setDockState('revealing');
    revealTimerRef.current = window.setTimeout(() => {
      if (visibilityGenerationRef.current === currentGen) {
        setDockState('visible');
      }
    }, 50);
  }, [autoHideEnabled, clearTimers, setDockState]);

  const handleDockEnter = useCallback(() => {
    if (!autoHideEnabled) return;
    clearTimers();
    setDockState('visible');
  }, [autoHideEnabled, clearTimers, setDockState]);

  useEffect(() => {
    setDockState(autoHideEnabled ? 'hidden' : 'visible');
  }, [autoHideEnabled, setDockState]);

  // Global pointer tracking for reveal edge trigger and auto-hide
  useEffect(() => {
    if (!autoHideEnabled) return;

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
      if (autoHideEnabled) {
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
    dockPosition,
    systemBarHeight,
    clearTimers,
    handleActivationTrigger,
    scheduleDockHide,
    setDockState,
  ]);

  const dockApps = Array.from(new Set([...dockPinnedApps, ...openAppIdsForDock]));

  const handleAppClick = (id: string) => {
    const win = windows[id];
    if (!win || win.state === 'closed') {
      setBouncingAppId(id);
      window.setTimeout(() => setBouncingAppId((curr) => (curr === id ? null : curr)), 1200);
      openApplication(id);
      return;
    }

    if (win.workspace !== activeWorkspaceId) {
      openApplication(id);
      return;
    }

    if (win.state === 'minimized') {
      restoreApplication(id);
      focusApplication(id);
    } else if (activeAppId === id) {
      minimizeApplication(id);
    } else {
      focusApplication(id);
    }
  };

  const handleDockItemContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const app = ORION_REGISTRY[id];
    if (!app) return;

    const win = windows[id];
    const isOpen = !!win && win.state !== 'closed';
    const isMinimized = isOpen && win.state === 'minimized';
    const isPinnedApp = dockPinnedApps.includes(id);

    const menuItems: ContextMenuItem[] = [
      {
        id: 'open',
        label: isOpen ? (isMinimized ? t('desktop.restore') : t('desktop.bringToFront')) : t('desktop.open'),
        icon: Play,
        action: () => handleAppClick(id),
      },
      ...(isOpen
        ? [
            {
              id: 'min-max',
              label: isMinimized ? t('desktop.restore') : t('desktop.minimize'),
              icon: isMinimized ? Square : Minus,
              action: () => {
                if (isMinimized) restoreApplication(id);
                else minimizeApplication(id);
              },
            },
            ...(win.state === 'maximized'
              ? [
                  {
                    id: 'restore',
                    label: t('desktop.restoreDown'),
                    icon: Square,
                    action: () => restoreApplication(id),
                  },
                ]
              : [
                  {
                    id: 'maximize',
                    label: t('desktop.maximize'),
                    icon: Square,
                    action: () => maximizeApplication(id),
                  },
                ]),
            { id: 'sep-win', label: '', separator: true },
            {
              id: 'close',
              label: t('desktop.close'),
              icon: X,
              danger: true,
              action: () => closeApplication(id),
            },
          ]
        : []),
      { id: 'sep-pin', label: '', separator: true },
      {
        id: 'pin-toggle',
        label: isPinnedApp ? t('desktop.unpinFromDock') : t('desktop.pinToDock'),
        icon: isPinnedApp ? PinOff : Pin,
        action: () => {
          if (isPinnedApp) {
            unpinFromDock(id);
            showToast({ title: t('desktop.unpinned'), message: `${app.name} ${t('desktop.unpinnedMessage')}`, type: 'info' });
          } else {
            pinToDock(id);
            showToast({ title: t('desktop.pinned'), message: `${app.name} ${t('desktop.pinnedMessage')}`, type: 'success' });
          }
        },
      },
    ];

    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetType: 'dock',
      targetId: id,
      title: app.name,
      items: menuItems,
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
      items: [
        { id: 'launcher', label: t('desktop.applications'), icon: Grid, action: () => setLauncherOpen(true) },
        { id: 'search', label: t('common.search'), icon: Search, action: () => setCommandPaletteOpen(true) },
      ],
    });
  };

  const handleDockSurfaceContextMenu = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget && (e.target as HTMLElement).closest('button')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetType: 'dock',
      items: [
        {
          id: 'auto-hide-toggle',
          label: autoHideEnabled ? t('desktop.disableAutoHide') : t('desktop.enableAutoHide'),
          icon: autoHideEnabled ? Pin : PinOff,
          action: () => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('orion-set-preference', {
                  detail: { key: 'dockAutoHide', value: !autoHideEnabled },
                })
              );
            }
          },
        },
      ],
    });
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedApp(id);
  };

  const onDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverApp !== id) {
      setDragOverApp(id);
    }
  };

  const onDragLeave = () => {
    setDragOverApp(null);
  };

  const onDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedApp;
    setDraggedApp(null);
    setDragOverApp(null);

    if (!sourceId || sourceId === targetId) return;
    const oldIndex = dockPinnedApps.indexOf(sourceId);
    const newIndex = dockPinnedApps.indexOf(targetId);

    if (oldIndex !== -1 && newIndex !== -1) {
      const updated = [...dockPinnedApps];
      updated.splice(oldIndex, 1);
      updated.splice(newIndex, 0, sourceId);
      reorderDock(updated);
    }
  };

  const isHidden = visibilityState === 'hidden' || visibilityState === 'hiding';

  const containerPositionStyle: React.CSSProperties = (() => {
    const hiddenOffset = dock.thickness + 24;
    switch (dockPosition) {
      case 'bottom':
        return {
          position: 'fixed',
          bottom: `calc(12px + env(safe-area-inset-bottom, 0px))`,
          left: '50%',
          transform: isHidden ? `translate3d(-50%, ${hiddenOffset}px, 0)` : 'translate3d(-50%, 0, 0)',
          maxWidth: 'calc(100vw - 24px)',
        };
      case 'top':
        return {
          position: 'fixed',
          top: `calc(${systemBarHeight + 8}px + env(safe-area-inset-top, 0px))`,
          left: '50%',
          transform: isHidden ? `translate3d(-50%, -${hiddenOffset}px, 0)` : 'translate3d(-50%, 0, 0)',
          maxWidth: 'calc(100vw - 24px)',
        };
      case 'left':
        return {
          position: 'fixed',
          top: '50%',
          left: `calc(12px + env(safe-area-inset-left, 0px))`,
          transform: isHidden ? `translate3d(-${hiddenOffset}px, -50%, 0)` : 'translate3d(0, -50%, 0)',
          maxHeight: 'calc(100vh - 48px)',
        };
      case 'right':
        return {
          position: 'fixed',
          top: '50%',
          right: `calc(12px + env(safe-area-inset-right, 0px))`,
          transform: isHidden ? `translate3d(${hiddenOffset}px, -50%, 0)` : 'translate3d(0, -50%, 0)',
          maxHeight: 'calc(100vh - 48px)',
        };
    }
  })();

  const revealHandleStyle: React.CSSProperties = (() => {
    const thickness = 14;
    switch (dockPosition) {
      case 'bottom':
        return { bottom: 0, left: '20%', right: '20%', height: `${thickness}px` };
      case 'top':
        return { top: `${systemBarHeight}px`, left: '20%', right: '20%', height: `${thickness}px` };
      case 'left':
        return { left: 0, top: '20%', bottom: '20%', width: `${thickness}px` };
      case 'right':
        return { right: 0, top: '20%', bottom: '20%', width: `${thickness}px` };
    }
  })();

  const tooltipClasses = isVertical
    ? dockPosition === 'left'
      ? 'absolute left-full top-1/2 -translate-y-1/2 ml-3'
      : 'absolute right-full top-1/2 -translate-y-1/2 mr-3'
    : dockPosition === 'top'
      ? 'absolute -bottom-11 left-1/2 -translate-x-1/2'
      : 'absolute -top-11 left-1/2 -translate-x-1/2';

  const utilityButtonClass = isDark
    ? 'bg-white/[0.11] hover:bg-white/[0.19] active:bg-white/[0.24] border border-white/[0.20] hover:border-white/[0.34] text-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]'
    : 'bg-slate-900/[0.06] hover:bg-slate-900/[0.12] active:bg-slate-900/[0.18] border border-slate-900/[0.14] hover:border-slate-900/[0.26] text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]';

  const tooltipSurfaceClass = isDark
    ? 'bg-[#161B24]/95 text-white border-white/15 shadow-2xl'
    : 'bg-white/95 text-slate-900 border-slate-900/15 shadow-xl';

  const activationEdgeClass = (() => {
    switch (dockPosition) {
      case 'bottom':
        return 'bottom-0 left-0 w-full h-[14px]';
      case 'top':
        return 'top-0 left-0 w-full h-[14px]';
      case 'left':
        return 'top-0 left-0 w-[14px] h-full';
      case 'right':
        return 'top-0 right-0 w-[14px] h-full';
    }
  })();

  return (
    <>
      {autoHideEnabled && (
        <div
          data-testid="dock-activation-zone"
          aria-hidden="true"
          className={`fixed pointer-events-auto z-[9980] bg-transparent hidden md:block ${activationEdgeClass}`}
          style={revealHandleStyle}
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
        aria-label="Application Dock"
        data-dock="true"
        data-dock-position={dockPosition}
        data-dock-orientation={dock.orientation}
        data-dock-visible={!isHidden ? 'true' : 'false'}
        data-dock-visibility-state={visibilityState}
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
        {/* Single Unified Glass Shell (Dock shelf parent never dims children via opacity) */}
        <div
          className={cn(
            'orion-dock-shelf relative flex p-2.5 border transition-all duration-300 rounded-[24px]',
            isVertical ? 'flex-col items-center gap-2.5 overflow-y-auto max-h-[80vh]' : 'items-center gap-2.5 overflow-x-auto max-w-[calc(100vw-24px)]'
          )}
          style={{
            borderColor: 'var(--orion-dock-border, rgba(255, 255, 255, 0.22))',
            boxShadow: 'var(--orion-dock-shadow, 0 24px 60px rgba(0, 0, 0, 0.55))',
            scrollbarWidth: 'none',
          }}
          onMouseLeave={() => {
            setHoveredApp(null);
            scheduleDockHide();
          }}
        >
          {/* Dedicated Translucent Glass Material Layer: opacity ONLY applies here */}
          <div
            data-testid="dock-glass-backdrop"
            aria-hidden="true"
            className="orion-dock-glass-backdrop pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{
              opacity: 'var(--orion-dock-opacity, 0.90)',
              backgroundColor: 'var(--orion-dock-tint-bg, var(--orion-dock-surface, var(--orion-morph-surface-elevated)))',
              backdropFilter: 'blur(var(--orion-dock-blur, 32px)) saturate(175%)',
              WebkitBackdropFilter: 'blur(var(--orion-dock-blur, 32px)) saturate(175%)',
              boxShadow: isDark
                ? 'inset 0 1px 1.5px rgba(255, 255, 255, 0.30), inset 0 0 0 0.5px rgba(255, 255, 255, 0.14)'
                : 'inset 0 1px 1.5px rgba(255, 255, 255, 0.95), inset 0 0 0 0.5px rgba(15, 23, 42, 0.08)',
            }}
          />

          {/* LAUNCHER BUTTON */}
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
              'relative z-10 group flex flex-col items-center justify-center transition-all duration-200 cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orion-accent)]',
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

          {/* SEARCH BUTTON */}
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
              'relative z-10 group flex flex-col items-center justify-center transition-all duration-200 cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orion-accent)]',
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

          <div className={cn('bg-[var(--orion-border-strong)] shrink-0 z-10', isVertical ? 'w-7 h-px my-0.5' : 'w-px h-7 mx-0.5')} />

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
                  'relative z-10 group flex flex-col items-center justify-center cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orion-accent)]',
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
                    isMinimized && 'opacity-55 saturate-60',
                    isActive && 'scale-105'
                  )}
                >
                  <OrionAppIcon
                    app={id}
                    size={dock.iconSize}
                    theme={iconTheme}
                    active={isActive}
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
                          ? 'h-3 w-1 rounded-full bg-[var(--orion-accent)] shadow-[0_0_8px_var(--orion-accent)]'
                          : 'w-3 h-1 rounded-full bg-[var(--orion-accent)] shadow-[0_0_8px_var(--orion-accent)]'
                        : isMinimized
                          ? isVertical
                            ? 'h-1 w-1 rounded-full bg-[var(--orion-text-muted)]'
                            : 'w-1 h-1 rounded-full bg-[var(--orion-text-muted)]'
                          : isVertical
                            ? 'h-1.5 w-1.5 rounded-full bg-[var(--orion-text-secondary)]'
                            : 'w-1.5 h-1.5 rounded-full bg-[var(--orion-text-secondary)]'
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

          <div className={cn('bg-[var(--orion-border-strong)] shrink-0 z-10', isVertical ? 'w-7 h-px my-0.5' : 'w-px h-7 mx-0.5')} />

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
              'relative z-10 group flex flex-col items-center justify-center transition-all duration-200 cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orion-accent)]',
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
    </>
  );
}
