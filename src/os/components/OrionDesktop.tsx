import React, { useState, useCallback } from 'react';
import { OrionSystemBar } from './OrionSystemBar';
import { OrionDock } from './OrionDock';
import { OrionApplicationLauncher } from './OrionApplicationLauncher';
import { OrionCommandPalette } from './OrionCommandPalette';
import { OrionLiveWallpaper } from './OrionLiveWallpaper';
import { OrionWindow } from './OrionWindow';
import { AnimatePresence } from 'motion/react';
import { OrionContextMenu } from '../contextMenu/OrionContextMenu';
import { useContextMenuTrigger, ContextMenuItem } from '../contextMenu/OrionContextMenuContext';
import { EntityDrawer } from '../../components/drawers/EntityDrawer';
import { ConfirmModal } from '../../components/drawers/ConfirmModal';
import { useWindowManager, WORKSPACES } from '../WindowManagerContext';
import { ORION_REGISTRY } from '../OrionApplicationRegistry';
import { useToast } from '../../store/ToastContext';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { useAuth } from '../../store/AuthContext';
import { useSupplyChain } from '../../store/SupplyChainContext';
import OrionAppIcon from '../../components/brand/OrionAppIcon';
import { cn } from '../../lib/utils';
import { 
  Search, 
  Sparkles, 
  LayoutGrid, 
  RefreshCw, 
  Layers, 
  Monitor, 
  Maximize2, 
  Activity, 
  Settings, 
  XSquare, 
  Palette 
} from 'lucide-react';

export function OrionDesktop() {
  const { isAuthenticated, currentUser } = useAuth();

  const {
    activeAppId,
    windows,
    activeWorkspaceId,
    openApplication,
    closeAllWindows,
    setWorkspace,
    setCommandPaletteOpen,
    setLauncherOpen
  } = useWindowManager();

  const { showToast } = useToast();
  const { showConfirmModal } = useEntityDrawer();
  const supplyChain = useSupplyChain();
  const showDesktopIcons = supplyChain?.settings?.showDesktopIcons ?? true;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDesktopApp, setSelectedDesktopApp] = useState<string | null>(null);

  // Invariant Guard: Desktop MUST NOT render if unauthenticated
  if (!isAuthenticated || !currentUser) {
    return null;
  }

  // Filter windows to current workspace and non-closed
  const currentWorkspaceWindows = Object.values(windows).filter(
    w => w.workspace === activeWorkspaceId && w.state !== 'closed'
  );
  
  const currentWorkspace = WORKSPACES.find(w => w.id === activeWorkspaceId) || WORKSPACES[0];

  // Refresh Desktop real implementation (Requirement 3)
  const handleRefreshDesktop = useCallback(() => {
    setIsRefreshing(true);
    window.dispatchEvent(new CustomEvent('orion:desktop-refresh', { detail: { timestamp: Date.now() } }));
    showToast('Desktop refreshed — telemetry and registries synchronized', 'success', 'Desktop');
    setTimeout(() => {
      setIsRefreshing(false);
    }, 450);
  }, [showToast]);

  // Desktop context menu generator (Requirements 2-10)
  const getDesktopContextMenuItems = useCallback((): ContextMenuItem[] => {
    return [
      {
        id: 'desktop-refresh',
        label: 'Refresh Desktop',
        icon: RefreshCw,
        shortcut: 'F5',
        action: handleRefreshDesktop,
      },
      {
        id: 'sep-workspace',
        label: '',
        separator: true,
      },
      {
        id: 'desktop-workspace',
        label: 'Switch Workspace',
        icon: Layers,
        submenu: WORKSPACES.map(ws => ({
          id: `ws-${ws.id}`,
          label: `${ws.name} Workspace`,
          checked: activeWorkspaceId === ws.id,
          shortcut: ws.id === 'operations' ? 'Alt+1' : ws.id === 'intelligence' ? 'Alt+2' : 'Alt+3',
          action: () => setWorkspace(ws.id),
        })),
      },
      {
        id: 'desktop-display',
        label: 'Display & Performance',
        icon: Monitor,
        submenu: [
          {
            id: 'disp-fullscreen',
            label: typeof document !== 'undefined' && document.fullscreenElement ? 'Exit Fullscreen' : 'Toggle Fullscreen',
            icon: Maximize2,
            shortcut: 'F11',
            action: () => {
              if (typeof document === 'undefined') return;
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              } else {
                document.documentElement.requestFullscreen().catch(() => {});
              }
            },
          },
          {
            id: 'disp-activity',
            label: 'Activity & Telemetry',
            icon: Activity,
            action: () => openApplication('observability'),
          },
          {
            id: 'disp-settings',
            label: 'System Settings',
            icon: Settings,
            action: () => openApplication('settings'),
          },
        ],
      },
      {
        id: 'sep-launcher',
        label: '',
        separator: true,
      },
      {
        id: 'desktop-command-center',
        label: 'Open Command Center',
        icon: Sparkles,
        action: () => openApplication('command-center'),
      },
      {
        id: 'desktop-launcher',
        label: 'Applications...',
        icon: LayoutGrid,
        shortcut: 'F4',
        action: () => setLauncherOpen(true),
      },
      {
        id: 'desktop-palette',
        label: 'Command Palette...',
        icon: Search,
        shortcut: '⌘K',
        action: () => setCommandPaletteOpen(true),
      },
      ...(currentWorkspaceWindows.length > 0
        ? [
            {
              id: 'sep-close-all',
              label: '',
              separator: true,
            },
            {
              id: 'desktop-close-all',
              label: 'Close All Windows',
              icon: XSquare,
              danger: true,
              action: () => {
                showConfirmModal(
                  'Close All Windows',
                  'Are you sure you want to close all active windows in this workspace? Unsaved changes will be cleared.',
                  () => {
                    closeAllWindows();
                  },
                  'Close All'
                );
              },
            },
          ]
        : []),
      {
        id: 'sep-personalize',
        label: '',
        separator: true,
      },
      {
        id: 'desktop-personalize',
        label: 'Personalize ORION...',
        icon: Palette,
        action: () => openApplication('settings'),
      },
    ];
  }, [
    activeWorkspaceId,
    setWorkspace,
    openApplication,
    setLauncherOpen,
    setCommandPaletteOpen,
    currentWorkspaceWindows.length,
    showConfirmModal,
    closeAllWindows,
    showToast,
    handleRefreshDesktop,
  ]);

  const desktopTriggerProps = useContextMenuTrigger({
    getItems: getDesktopContextMenuItems,
    targetType: 'desktop',
    title: 'ORION 9 Desktop',
    subtitle: `${currentWorkspace.name} Workspace`,
  });

  return (
    <div className="orion-desktop-shell bg-transparent text-os-text-primary font-sans select-none">
      
      {/* OS Layer 0.5: Interactive Desktop Backdrop Surface for right-click & touch */}
      <div
        data-desktop-surface="true"
        className="orion-desktop-backdrop absolute inset-0 z-0 pointer-events-auto"
        onClick={() => setSelectedDesktopApp(null)}
        {...desktopTriggerProps}
      >
        {isRefreshing && (
          <div className="absolute inset-0 bg-os-accent/[0.03] animate-pulse pointer-events-none transition-opacity duration-300" />
        )}

        {/* Desktop Application Icons Grid */}
        {showDesktopIcons && (
          <div className="absolute top-12 left-6 bottom-20 flex flex-col flex-wrap gap-4 p-2 pointer-events-auto z-10 max-h-[calc(100vh-140px)] overflow-hidden">
            {currentWorkspace.pinnedApps.map(id => {
              const app = ORION_REGISTRY[id];
              if (!app) return null;
              const isSelected = selectedDesktopApp === id;

              return (
                <button
                  type="button"
                  key={`desktop-icon-${id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDesktopApp(id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    openApplication(id);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center w-24 p-2 rounded-xl transition-all group cursor-pointer focus:outline-none",
                    isSelected
                      ? "bg-os-accent/20 border border-os-accent/40 shadow-sm"
                      : "hover:bg-os-surface-hover/30 border border-transparent"
                  )}
                >
                  <OrionAppIcon app={id} size={52} active={isSelected} />
                  <span className={cn(
                    "mt-1.5 text-[11px] font-medium text-center line-clamp-2 px-1 rounded transition-colors drop-shadow-sm",
                    isSelected ? "text-os-accent font-semibold" : "text-os-text-primary group-hover:text-os-text-primary"
                  )}>
                    {app.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* OS Layer 1: Top System Bar (PERSISTENT DESKTOP SHELL CHROME) */}
      <OrionSystemBar />

      {/* OS Layer 2: Desktop Window Manager Stage (Workspace Below Top Bar) */}
      <div data-orion-workspace="true" className="orion-app-viewport z-10 min-h-0 pointer-events-none">

      {/* OS Layer 0: Premium Desktop Background & Live Supply Chain Network */}
      <div className="orion-desktop-wallpaper-layer absolute inset-0 z-0 pointer-events-none">
        {/* Live Supply Chain Network Canvas — HOME DESKTOP ONLY */}
        <OrionLiveWallpaper hasOpenWindows={currentWorkspaceWindows.some(w => w.state !== 'minimized')} />
        
      </div>

        
        {/* Render all open windows for the current workspace */}
        <AnimatePresence>
          {currentWorkspaceWindows.map(win => (
            <OrionWindow
              key={win.id}
              window={win}
              isActive={win.id === activeAppId}
            />
          ))}
        </AnimatePresence>

      </div>

      {/* OS Layer 3: Core Desktop Taskbar — always visible, including with maximized apps. */}
      <OrionDock />

      {/* OS Layer 4: Floating Transient Overlays */}
      <OrionApplicationLauncher />
      <OrionCommandPalette />
      <EntityDrawer />
      <ConfirmModal />
      <OrionContextMenu />
    </div>
  );
}

