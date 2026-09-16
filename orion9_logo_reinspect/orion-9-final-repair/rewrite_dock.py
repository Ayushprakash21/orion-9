import re

with open('src/os/components/OrionDock.tsx', 'r') as f:
    content = f.read()

# I want to add HTML5 Drag and Drop reordering.
# First, the dock apps list shouldn't just be the current dockApps because unpinned apps are dynamically added to the end.
# We should only allow dragging pinned apps. Unpinned apps always stay at the end.

# The current loop maps over `dockApps`. Let's modify the map to support dragging.
new_content = """import React, { useState, useCallback, useRef } from 'react';
import { useWindowManager } from '../WindowManagerContext';
import { ORION_REGISTRY } from '../OrionApplicationRegistry';
import { useOrionContextMenu, ContextMenuItem } from '../contextMenu/OrionContextMenuContext';
import { useToast } from '../../store/ToastContext';
import { cn } from '../../lib/utils';
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

  // Combine pinned apps and unpinned open apps (excluding closed)
  const openAppIds = Object.keys(windows).filter(id => windows[id]?.state !== 'closed');
  const unpinnedOpenApps = openAppIds.filter(id => !dockPinnedApps.includes(id));
  const dockApps = [...dockPinnedApps, ...unpinnedOpenApps];

  const handleAppClick = (id: string) => {
    if (!id || !ORION_REGISTRY[id]) return;
    const win = windows[id];
    if (!win || win.state === 'closed') {
      openApplication(id);
    } else if (win.state === 'minimized') {
      restoreApplication(id);
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
          showToast(`Closed ${app.name}`, 'info', 'Window Manager');
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

    openContextMenu(e, items);
  };

  const handleLauncherContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    openContextMenu(e, [
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
    ]);
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
    <div 
      data-dock="true"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[60] select-none pointer-events-auto max-w-[calc(100vw-24px)]"
    >
      <div 
        className="flex items-center gap-2 p-2 rounded-[24px] bg-[#0A0D14]/85 backdrop-blur-2xl border border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.06)] transition-all duration-300 overflow-x-auto max-w-full"
        style={{ scrollbarWidth: 'none' }}
        onMouseLeave={() => setHoveredApp(null)}
      >
        
        {dockApps.map((id, index) => {
          const app = ORION_REGISTRY[id];
          if (!app) return null;
          
          const isOpen = !!windows[id] && windows[id]?.state !== 'closed';
          const isMinimized = isOpen && windows[id]?.state === 'minimized';
          const isActive = isOpen && activeAppId === id && !isMinimized;
          const isPinned = dockPinnedApps.includes(id);

          const Icon = app.icon;

          // Smooth magnification
          const hoveredIndex = hoveredApp ? dockApps.indexOf(hoveredApp) : -1;
          const distance = hoveredIndex !== -1 ? Math.abs(hoveredIndex - index) : 100;
          const scale = distance === 0 ? 1.15 : distance === 1 ? 1.05 : 1;

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
                "relative group flex flex-col items-center justify-center transition-transform duration-200 origin-bottom cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F2FE]",
                draggedApp === id && "opacity-50",
                dragOverApp === id && "scale-110 mx-4" // Visual feedback for drop target
              )}
              style={{ transform: dragOverApp !== id ? `scale(${scale})` : undefined, width: '48px', height: '48px' }}
              title={app.name}
            >
              <div 
                className={cn(
                  "flex items-center justify-center w-full h-full rounded-[16px] shadow-inner transition-all duration-200",
                  "border border-white/[0.08] group-hover:border-white/[0.2] bg-gradient-to-b",
                  isMinimized && "opacity-50 saturate-50",
                  isActive && "border-[#00F2FE]/50 ring-1 ring-[#00F2FE]/30 shadow-[0_0_12px_rgba(0,242,254,0.2)]"
                )}
                style={{ 
                  backgroundColor: `${app.color}15`, 
                  color: app.color,
                  backgroundImage: `linear-gradient(180deg, ${app.color}25 0%, transparent 100%)`
                }}
              >
                <Icon className="w-5 h-5 drop-shadow-sm transition-transform duration-300 group-hover:scale-110" />
              </div>
              
              {/* Active / Open / Minimized Indicator */}
              {isOpen && (
                <div 
                  className={cn(
                    "absolute -bottom-1.5 transition-all duration-200 rounded-full",
                    isActive 
                      ? "w-1.5 h-1.5 bg-[#00F2FE] shadow-[0_0_8px_#00F2FE]" 
                      : isMinimized
                      ? "w-1 h-1 bg-slate-500"
                      : "w-1 h-1 bg-white/60"
                  )}
                />
              )}

              {/* Tooltip */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#05070D]/95 backdrop-blur-md text-slate-100 text-[11px] font-medium tracking-wide whitespace-nowrap rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 shadow-xl z-50">
                {app.name}
                {isMinimized && <span className="text-slate-400 ml-1.5 text-[10px]">(Minimized)</span>}
              </div>
            </button>
          );
        })}

        <div className="w-px h-8 bg-white/10 mx-1 shrink-0" />

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
          className="relative group flex flex-col items-center justify-center transition-transform duration-200 origin-bottom cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F2FE]"
          style={{ 
            transform: `scale(${hoveredApp === 'launcher' ? 1.15 : 1})`,
            width: '48px', height: '48px' 
          }}
          title="All Applications"
        >
          <div className="flex items-center justify-center w-full h-full rounded-[16px] bg-gradient-to-b from-white/10 to-white/5 border border-white/[0.08] group-hover:border-white/[0.2] text-slate-200 shadow-inner">
            <Grid className="w-5 h-5 drop-shadow-sm transition-transform duration-300 group-hover:scale-110" />
          </div>

          <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#05070D]/95 backdrop-blur-md text-slate-100 text-[11px] font-medium tracking-wide whitespace-nowrap rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 shadow-xl z-50">
            All Applications
          </div>
        </button>

      </div>
    </div>
  );
}
"""

with open('src/os/components/OrionDock.tsx', 'w') as f:
    f.write(new_content)
