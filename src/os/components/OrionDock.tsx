import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useWindowManager } from '../WindowManagerContext';
import { ORION_REGISTRY } from '../OrionApplicationRegistry';
import { useOrionContextMenu, ContextMenuItem } from '../contextMenu/OrionContextMenuContext';
import { useToast } from '../../store/ToastContext';
import { cn } from '../../lib/utils';
import OrionAppIcon from '../../components/brand/OrionAppIcon';
import { 
  Grid, 
  Pin, 
  PinOff, 
  X, 
  Play, 
  Layers, 
  Minus, 
  Square, 
  RotateCcw,
  Search,
  RefreshCw
} from 'lucide-react';

export function OrionDock() {
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
    setCommandPaletteOpen
  } = useWindowManager();

  const { openContextMenu } = useOrionContextMenu();
  const { showToast } = useToast();

  const [hoveredApp, setHoveredApp] = useState<string | null>(null);
  const [draggedApp, setDraggedApp] = useState<string | null>(null);
  const [dragOverApp, setDragOverApp] = useState<string | null>(null);
  const [dockVisible, setDockVisible] = useState(true);
  const dockVisibleRef = useRef(true);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const openAppIdsForDock = Object.keys(windows).filter(id => id !== 'orion-ai' && windows[id]?.state !== 'closed' && windows[id]?.workspace === activeWorkspaceId);
  // Dock visibility is contextual to the OS workspace, not the focused window.
  // Home/Desktop (no open windows) ALWAYS shows the Dock. Any open application
  // enables contextual auto-hide, including when the active window is minimized.
  const hasOpenApplication = Object.values(windows).some(
    win => win?.id !== 'orion-ai' && win?.state !== 'closed'
  );
  const activeWindow = activeAppId ? windows[activeAppId] : undefined;
  const hasActiveApplication = !!activeWindow && activeWindow.state !== 'closed' && activeWindow.workspace === activeWorkspaceId;
  const setDockVisibility = useCallback((visible: boolean) => {
    dockVisibleRef.current = visible;
    setDockVisible(visible);
  }, []);

  // OS-style contextual auto-hide. Home/Desktop always shows the Dock;
  // application mode uses the bottom-edge reveal handle.
  const clearDockHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleDockHide = useCallback(() => {
    clearDockHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      const el = dockRef.current;
      if (!el?.matches(':hover')) setDockVisibility(false);
    }, 900);
  }, [clearDockHideTimer]);

  useEffect(() => {
    clearDockHideTimer();

    // HOME MODE: the Dock is a permanent part of the desktop. Never hide it.
    if (!hasOpenApplication) {
      setDockVisibility(true);
      return;
    }

    // APPLICATION MODE: reveal immediately while entering an application, then
    // allow the edge-triggered auto-hide behavior to take over.
    setDockVisibility(true);

    const onPointerMove = (e: PointerEvent) => {
      const edge = Math.max(20, Math.min(40, Math.round(window.innerHeight * 0.02)));
      const atBottomEdge = e.clientY >= window.innerHeight - edge;
      const hoveringDock = !!dockRef.current?.matches(':hover');

      if (atBottomEdge || hoveringDock) {
        clearDockHideTimer();
        setDockVisibility(true);
      } else {
        scheduleDockHide();
      }
    };

    const onWindowBlur = () => {
      clearDockHideTimer();
      setDockVisibility(false);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('blur', onWindowBlur);

    const initial = window.setTimeout(() => {
      if (hasOpenApplication && !dockRef.current?.matches(':hover')) {
        setDockVisibility(false);
      }
    }, 1200);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('blur', onWindowBlur);
      window.clearTimeout(initial);
      clearDockHideTimer();
    };
  }, [hasOpenApplication, clearDockHideTimer, scheduleDockHide, setDockVisibility]);

  // Combine pinned apps and unpinned open apps (excluding closed)
  const openAppIds = openAppIdsForDock;
  const unpinnedOpenApps = openAppIds.filter(id => !dockPinnedApps.includes(id));
  const dockApps = [...dockPinnedApps.filter(id => id !== 'orion-ai'), ...unpinnedOpenApps];

  const handleAppClick = (id: string) => {
    if (!id || !ORION_REGISTRY[id]) return;
    const win = windows[id];
    if (!win || win.state === 'closed') {
      openApplication(id);
    } else if (win.state === 'minimized') {
      restoreApplication(id);
    } else if (activeAppId === id) {
      minimizeApplication(id);
    } else {
      focusApplication(id);
    }
  };

  const getDockContextMenuItems = useCallback((id: string): ContextMenuItem[] => {
    const app = ORION_REGISTRY[id];
    const win = windows[id];
    const isRunning = !!win && win.state !== 'closed';
    const isMinimized = isRunning && win.state === 'minimized';
    const isPinned = dockPinnedApps.includes(id);

    const items: ContextMenuItem[] = [];

    if (isRunning) {
      if (isMinimized) {
        items.push({
          id: 'dock-restore',
          label: 'Restore',
          icon: Square,
          action: () => restoreApplication(id),
        });
      } else {
        items.push({
          id: 'dock-minimize',
          label: 'Minimize',
          icon: Minus,
          action: () => minimizeApplication(id),
        });
      }
    } else {
      items.push({
        id: 'dock-open',
        label: 'Open',
        icon: Play,
        action: () => openApplication(id),
      });
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

    items.push({
      id: 'sep-pin',
      label: '',
      separator: true,
    });

    items.push({
      id: 'dock-pin',
      label: isPinned ? 'Remove from Dock' : 'Pin to Dock',
      icon: isPinned ? PinOff : Pin,
      action: () => {
        if (isPinned) {
          unpinFromDock(id);
          showToast(`Removed ${app.name} from Dock`, 'info', 'Dock');
        } else {
          pinToDock(id);
          showToast(`Pinned ${app.name} to Dock`, 'success', 'Dock');
        }
      },
    });

    if (isRunning) {
      items.push({
        id: 'sep-close',
        label: '',
        separator: true,
      });

      items.push({
        id: 'dock-close',
        label: 'Close Window',
        icon: X,
        danger: true,
        action: () => {
          closeApplication(id);
        },
      });
    }

    return items;
  }, [
    windows, 
    dockPinnedApps, 
    openApplication, 
    restoreApplication, 
    minimizeApplication, 
    maximizeApplication, 
    focusApplication, 
    pinToDock, 
    unpinFromDock, 
    closeApplication, 
    showToast
  ]);

  const handleDockItemContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const app = ORION_REGISTRY[id];
    if (!app) return;

    const win = windows[id];
    const isRunning = !!win && win.state !== 'closed';
    const isMinimized = isRunning && win.state === 'minimized';

    const items = getDockContextMenuItems(id);

    // Windows-style taskbar behavior: right-clicking an app icon opens its
    // window actions at the pointer. The context-menu renderer handles
    // viewport clamping/flip so the menu never gets pushed off-screen.
    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetType: 'dock',
      targetId: id,
      title: app.name,
      subtitle: isMinimized ? 'Minimized application' : (isRunning ? 'Running application' : 'Pinned application'),
      items,
    });
  };

  const handleLauncherContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    openContextMenu({
      x: e.clientX - 60,
      y: e.clientY - 100,
      targetType: 'dock',
      targetId: 'launcher',
      items: [
      {
        id: 'launch-all',
        label: 'Open Applications...',
        icon: Grid,
        shortcut: 'F4',
        action: () => setLauncherOpen(true),
      },
      {
        id: 'launch-palette',
        label: 'Command Palette...',
        icon: Search,
        shortcut: '⌘K',
        action: () => setCommandPaletteOpen(true),
      },
      {
        id: 'sep-l1',
        label: '',
        separator: true,
      },
      {
        id: 'launch-refresh',
        label: 'Refresh Desktop',
        icon: RefreshCw,
        shortcut: 'F5',
        action: () => {
          window.dispatchEvent(new CustomEvent('orion:desktop-refresh', { detail: { timestamp: Date.now() } }));
          showToast('Desktop telemetry refreshed', 'success', 'Desktop');
        },
      },
    ]});
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    if (!dockPinnedApps.includes(id)) {
      e.preventDefault();
      return;
    }
    setDraggedApp(id);
    e.dataTransfer.effectAllowed = 'move';
    // Small delay to allow drag image to render before applying styles
    setTimeout(() => {
      // Any specific styling can go here if needed via classes, but React state takes care of most
    }, 0);
  };

  const onDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (!draggedApp || draggedApp === id) return;
    if (!dockPinnedApps.includes(id)) return;
    
    setDragOverApp(id);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverApp(null);
  };

  const handleDockSurfaceContextMenu = (e: React.MouseEvent) => {
    // The ORION Dock owns its own Windows-style context menu. Never allow the
    // browser's native context menu to leak through when the user right-clicks
    // the dock background/gaps. Individual app buttons have their own menu.
    e.preventDefault();
    e.stopPropagation();

    const activeWin = activeAppId ? windows[activeAppId] : undefined;
    const activeApp = activeAppId ? ORION_REGISTRY[activeAppId] : undefined;
    const activeIsRunning = !!activeWin && activeWin.state !== 'closed';
    const activeIsMinimized = activeIsRunning && activeWin?.state === 'minimized';
    const activeIsMaximized = activeIsRunning && activeWin?.state === 'maximized';

    const items: ContextMenuItem[] = [];

    if (activeApp && activeIsRunning) {
      if (activeIsMinimized) {
        items.push({
          id: 'surface-restore',
          label: 'Restore',
          icon: RotateCcw,
          action: () => restoreApplication(activeAppId!),
        });
      } else {
        items.push({
          id: 'surface-minimize',
          label: 'Minimize',
          icon: Minus,
          action: () => minimizeApplication(activeAppId!),
        });
        items.push({
          id: 'surface-maximize',
          label: activeIsMaximized ? 'Maximize (Already Full Screen)' : 'Maximize',
          icon: Square,
          disabled: !!activeIsMaximized,
          action: () => maximizeApplication(activeAppId!),
        });
      }

      items.push({
        id: 'surface-close',
        label: `Close ${activeApp.name}`,
        icon: X,
        danger: true,
        action: () => closeApplication(activeAppId!),
      });
      items.push({ id: 'surface-window-sep', label: '', separator: true });
    }

    items.push({
      id: 'surface-launch',
      label: 'Open Applications...',
      icon: Grid,
      shortcut: 'F4',
      action: () => setLauncherOpen(true),
    });
    items.push({
      id: 'surface-palette',
      label: 'Command Palette...',
      icon: Search,
      shortcut: '⌘K',
      action: () => setCommandPaletteOpen(true),
    });
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
      title: activeApp ? activeApp.name : 'ORION Dock',
      subtitle: activeApp ? `${activeApp.category} • ${activeWin?.state || 'closed'}` : 'System taskbar',
      items,
    });
  };

  const onDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverApp(null);
    
    if (!draggedApp || draggedApp === id) {
      setDraggedApp(null);
      return;
    }

    if (!dockPinnedApps.includes(id)) {
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

    if (reorderDock) {
      reorderDock(newOrder);
    }
    
    setDraggedApp(null);
  };

  return (
    <>
      {/* Contextual reveal handle: only shown while an application is open and the Dock is hidden. */}
      {hasOpenApplication && !dockVisible && (
        <div
          aria-label="Reveal Dock"
          role="button"
          tabIndex={0}
          className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[61] w-[140px] h-[8px] rounded-t-full bg-white/20 border border-white/10 shadow-[0_0_16px_rgba(0,242,254,0.16)] backdrop-blur-sm cursor-pointer transition-all duration-200 hover:bg-[#00F2FE]/40 hover:h-[10px]"
          onMouseEnter={() => { clearDockHideTimer(); setDockVisibility(true); }}
          onPointerEnter={() => { clearDockHideTimer(); setDockVisibility(true); }}
          onFocus={() => { clearDockHideTimer(); setDockVisibility(true); }}
        />
      )}
      <div
      ref={dockRef}
      data-dock="true"
      data-dock-visible={dockVisible ? 'true' : 'false'}
      aria-hidden={!dockVisible}
      className={cn(
        "fixed bottom-3 left-1/2 -translate-x-1/2 z-[60] select-none max-w-[calc(100vw-24px)] transition-transform duration-300 ease-out will-change-transform",
        !hasOpenApplication || dockVisible ? "translate-y-0 pointer-events-auto" : "translate-y-[calc(100%+28px)] pointer-events-none"
      )}
      onContextMenu={handleDockSurfaceContextMenu}
      onMouseEnter={() => { clearDockHideTimer(); setDockVisibility(true); }}
      onMouseLeave={() => scheduleDockHide()}
    >
      <div 
        className="flex items-center gap-2 p-2 backdrop-blur-2xl bg-os-surface/75 dark:bg-[#121316]/75 border border-os-border/60 shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.55)] rounded-2xl transition-all duration-300 overflow-x-auto max-w-[calc(100vw-24px)]"
        style={{ scrollbarWidth: 'none' }}
        onMouseLeave={() => { setHoveredApp(null); scheduleDockHide(); }}
      >
        
        {dockApps.map((id, index) => {
          const app = ORION_REGISTRY[id];
          if (!app) return null;
          
          const isOpen = !!windows[id] && windows[id]?.state !== 'closed';
          const isMinimized = isOpen && windows[id]?.state === 'minimized';
          const isActive = isOpen && activeAppId === id && !isMinimized;
          const isPinned = dockPinnedApps.includes(id);

          // Smooth magnification
          const hoveredIndex = hoveredApp ? dockApps.indexOf(hoveredApp) : -1;
          const distance = hoveredIndex !== -1 ? Math.abs(hoveredIndex - index) : 100;
          const scale = distance === 0 ? 1.08 : distance === 1 ? 1.03 : 1;

          return (
            <button
              type="button"
              key={id}
              data-dock-item={id}
              aria-label={app.name}
              tabIndex={0}
              draggable={isPinned}
              onDragStart={(e) => onDragStart(e, id)}
              onDragOver={(e) => onDragOver(e, id)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, id)}
              onDragEnd={() => { setDraggedApp(null); setDragOverApp(null); }}
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
                "relative group flex flex-col items-center justify-center transition-all duration-300 origin-bottom cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-os-accent hover:-translate-y-1.5",
                draggedApp === id && "opacity-50",
                dragOverApp === id && "scale-110 mx-4"
              )}
              style={{ transform: dragOverApp !== id && hoveredApp ? `scale(${scale})` : undefined, width: '48px', height: '48px' }}
              title={app.name}
            >
              <div className={cn(
                "flex items-center justify-center w-full h-full transition-all duration-200",
                isMinimized && "opacity-50 saturate-50",
                isActive && "scale-105"
              )}>
                <OrionAppIcon
                  app={id}
                  size={46}
                  active={isActive}
                  showContainer={true}
                />
              </div>
              
              {/* Active / Open / Minimized Indicator Dot */}
              {isOpen && (
                <div 
                  className={cn(
                    "absolute -bottom-1.5 transition-all duration-200",
                    isActive 
                      ? "w-2 h-1.5 rounded-full bg-os-accent shadow-[0_0_8px_var(--os-accent)]" 
                      : isMinimized
                      ? "w-1 h-1 rounded-full bg-os-text-muted/40"
                      : "w-1.5 h-1.5 rounded-full bg-os-text-secondary"
                  )}
                />
              )}

              {/* Tooltip */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-os-surface/95 backdrop-blur-md text-os-text-primary text-[11px] font-medium tracking-wide whitespace-nowrap rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity border border-os-border shadow-xl z-50">
                {app.name}
                {isMinimized && <span className="text-os-text-muted ml-1.5 text-[10px]">(Minimized)</span>}
              </div>
            </button>
          );
        })}

        <div className="w-px h-8 bg-os-surface-active mx-1 shrink-0" />

        {/* All Applications launcher button */}
        <button
          type="button"
          aria-label="All Applications"
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
          className="relative group flex flex-col items-center justify-center transition-all duration-300 origin-bottom cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F2FE] hover:-translate-y-1"
          style={{ 
            transform: `scale(${hoveredApp === 'launcher' ? 1.05 : 1})`,
            width: '48px', height: '48px' 
          }}
          title="All Applications"
        >
          <div className="flex items-center justify-center w-full h-full rounded-[16px] bg-gradient-to-b from-black/5 to-transparent dark:from-white/10 dark:to-white/5 border border-black/10 dark:border-white/[0.08] group-hover:border-black/20 dark:group-hover:border-white/[0.2] text-os-text-primary shadow-inner">
            <Grid className="w-5 h-5 drop-shadow-sm transition-transform duration-300 group-hover:scale-110" />
          </div>

          <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-os-surface/95 backdrop-blur-md text-os-text-primary text-[11px] font-medium tracking-wide whitespace-nowrap rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity border border-os-border shadow-xl z-50">
            All Applications
          </div>
        </button>

      </div>
      </div>
    </>
  );
}
