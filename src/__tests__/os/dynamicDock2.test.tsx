import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

const mockOpenApplication = vi.fn();
const mockSetCommandPaletteOpen = vi.fn();
const mockSetLauncherOpen = vi.fn();
const mockOpenContextMenu = vi.fn();

let mockExceptions: any[] = [];
let mockSyncJobs: any[] = [];
let mockUnreadCount = 0;
let mockActiveAppId: string | null = null;
let mockThemeId = 'graphite';

vi.mock('../../store/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'admin', displayName: 'Admin User', role: 'ADMIN' },
    isAdmin: true,
    hasRole: () => true,
    login: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock('../../os/WindowManagerContext', () => ({
  useWindowManager: () => ({
    windows: {},
    activeAppId: mockActiveAppId,
    activeWorkspaceId: 'operations',
    dockPinnedApps: ['command-center', 'inventory', 'ai-copilot'],
    openApplication: mockOpenApplication,
    focusApplication: vi.fn(),
    minimizeApplication: vi.fn(),
    maximizeApplication: vi.fn(),
    restoreApplication: vi.fn(),
    closeApplication: vi.fn(),
    pinToDock: vi.fn(),
    unpinFromDock: vi.fn(),
    reorderDock: vi.fn(),
    setLauncherOpen: mockSetLauncherOpen,
    setCommandPaletteOpen: mockSetCommandPaletteOpen,
    setWorkspace: vi.fn(),
  }),
  useOptionalWindowManager: () => ({
    windows: {},
    activeAppId: mockActiveAppId,
    activeWorkspaceId: 'operations',
    dockPinnedApps: ['command-center', 'inventory', 'ai-copilot'],
    openApplication: mockOpenApplication,
    setCommandPaletteOpen: mockSetCommandPaletteOpen,
    setLauncherOpen: mockSetLauncherOpen,
  }),
  WORKSPACES: {
    operations: { id: 'operations', name: 'Operations', icon: null },
  },
}));

vi.mock('../../os/theme/useOrionTheme', () => ({
  useOrionTheme: () => ({
    preferences: { themeId: mockThemeId, resolvedThemeId: mockThemeId, colorMode: mockThemeId === 'silver' ? 'light' : 'dark' },
    theme: { id: mockThemeId, isDark: mockThemeId !== 'silver' },
    resolvedTheme: { id: mockThemeId, isDark: mockThemeId !== 'silver' },
    isDark: mockThemeId !== 'silver',
  }),
}));

vi.mock('../../store/LanguageContext', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../os/contextMenu/OrionContextMenuContext', () => ({
  useOrionContextMenu: () => ({
    openContextMenu: mockOpenContextMenu,
  }),
}));

vi.mock('../../store/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

vi.mock('../../store/SupplyChainContext', () => ({
  useSupplyChain: () => ({
    exceptions: mockExceptions,
    inventory: [{ productId: 'SKU-1', onHand: 2, safetyStock: 20, reorderPoint: 15 }],
    shipments: [{ id: 'shp-1', status: 'Delayed', carrier: 'Maersk' }],
    purchaseOrders: [{ id: 'po-1', status: 'Pending', totalValue: 25000 }],
    settings: {
      personalization: {
        dockAutoHide: false,
        dockSize: 'medium',
        dockMagnification: true,
        dockPosition: 'bottom',
        dockOpacity: 40,
        dockTint: 'auto',
        dockBlur: true,
        reducedMotion: false,
      },
    },
    setCommandPaletteOpen: mockSetCommandPaletteOpen,
  }),
  useOptionalSupplyChain: () => ({
    exceptions: mockExceptions,
    inventory: [{ productId: 'SKU-1', onHand: 2, safetyStock: 20, reorderPoint: 15 }],
    shipments: [{ id: 'shp-1', status: 'Delayed', carrier: 'Maersk' }],
    purchaseOrders: [{ id: 'po-1', status: 'Pending', totalValue: 25000 }],
    settings: {
      personalization: {
        dockAutoHide: false,
        dockSize: 'medium',
        dockMagnification: true,
        dockPosition: 'bottom',
        dockOpacity: 40,
        dockTint: 'auto',
        dockBlur: true,
        reducedMotion: false,
      },
    },
  }),
}));

vi.mock('../../store/NotificationContext', () => ({
  useNotifications: () => ({
    unreadCount: mockUnreadCount,
    notifications: [],
  }),
  useOptionalNotifications: () => ({
    unreadCount: mockUnreadCount,
    notifications: [],
  }),
}));

vi.mock('../../store/ConnectivityContext', () => ({
  useConnectivity: () => ({
    isOnline: true,
    statusLabel: 'Online',
  }),
}));

vi.mock('../../integration/useIntegrationFabric', () => ({
  useIntegrationFabric: () => ({
    connectors: [
      { id: 'conn-1', name: 'SAP S/4HANA', status: 'CONNECTED' },
      { id: 'conn-2', name: 'Oracle ERP', status: 'CONNECTED' },
    ],
    syncJobs: mockSyncJobs,
  }),
}));

vi.mock('../../os/dock/DockGeometry', () => ({
  useOSGeometry: () => ({
    viewport: { width: 1440, height: 900 },
    systemBarHeight: 44,
    settings: {
      dockAutoHide: false,
      dockSize: 'medium',
      dockMagnification: true,
      dockPosition: 'bottom',
      dockOpacity: 40,
      dockTint: 'auto',
      dockBlur: true,
      reducedMotion: false,
    },
    dock: {
      iconSize: 44,
      iconRadius: 12,
      gap: 10,
      padding: 10,
      thickness: 66,
      magnificationScale: 1.38,
      magnificationEnabled: true,
      position: 'bottom',
      isVertical: false,
      autoHide: false,
      autoHideEnabled: false,
      alignment: 'center',
      maxWidth: 1320,
      maxHeight: 800,
      safeArea: { top: 44, bottom: 0, left: 0, right: 0 },
      dockRect: { x: 400, y: 820, width: 640, height: 66 },
      usableRect: { x: 0, y: 44, width: 1440, height: 856 },
    },
  }),
}));

import { OrionSystemBar } from '../../os/components/OrionSystemBar';
import { OrionDynamicDock } from '../../os/components/OrionDynamicDock';
import { OrionDock } from '../../os/components/OrionDock';

describe('ORION-9 Dynamic Dock 2.0: Unified Island + Dock Architecture', () => {
  let storageMap: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    mockExceptions = [];
    mockSyncJobs = [];
    mockUnreadCount = 0;
    mockActiveAppId = null;
    mockThemeId = 'graphite';
    storageMap = {};
    (global as any).localStorage = {
      getItem: (k: string) => storageMap[k] ?? null,
      setItem: (k: string, v: string) => { storageMap[k] = String(v); },
      removeItem: (k: string) => { delete storageMap[k]; },
      clear: () => { storageMap = {}; },
    };
  });

  it('DD2-01: OrionSystemBar contains ZERO separate top-center Dynamic Island capsule or expanded card', () => {
    const html = renderToString(
      <MemoryRouter>
        <OrionSystemBar />
      </MemoryRouter>
    );
    expect(html).not.toContain('Expand Orion Dynamic Island');
    expect(html).not.toContain('dynamic-island-expanded-panel');
    expect(html).not.toContain('data-surface-state=');
  });

  it('DD2-02: OrionDock re-exports OrionDynamicDock as single unified component', () => {
    expect(OrionDock).toBe(OrionDynamicDock);
  });

  it('DD2-03: Isolates dock opacity strictly onto [data-testid="dock-glass-backdrop"] so parent shelf never dims icons', () => {
    const html = renderToString(<OrionDynamicDock />);
    expect(html).toContain('data-testid="dock-glass-backdrop"');
    expect(html).toContain('orion-dock-glass-backdrop');
    expect(html).toContain('var(--orion-dock-opacity');

    // Inspect exact opening tag for orion-dock-shelf and ensure it has NO inline opacity property
    const shelfMatch = html.match(/<div[^>]*orion-dock-shelf[^>]*>/);
    expect(shelfMatch).not.toBeNull();
    expect(shelfMatch?.[0]).not.toMatch(/style="[^"]*opacity:/);
  });

  it('DD2-04: Compact bottom dock integrates Dynamic Island activity trigger and critical alert badge', () => {
    mockExceptions = [{ id: 'exc-1', title: 'Port Congestion', severity: 'Critical', status: 'Open' }];
    const html = renderToString(<OrionDynamicDock />);
    expect(html).toContain('data-testid="dynamic-dock-trigger"');
    expect(html).toContain('aria-label="Expand Orion Dynamic Island"');
    expect(html).toContain('1 Alert');
    expect(html).toContain('data-surface-state="critical"');
  });

  it('DD2-05: Compact dock reflects active connector sync activity inside the bottom shelf', () => {
    mockSyncJobs = [{ id: 'sync-1', status: 'RUNNING' }];
    const html = renderToString(<OrionDynamicDock />);
    expect(html).toContain('Syncing');
    expect(html).toContain('data-surface-state="activity"');
  });

  it('DD2-06: Expanded Dynamic Dock renders upward inside the SAME unified glass shell when expanded', () => {
    storageMap['orion_dynamic_island_mode'] = 'expanded';
    mockSyncJobs = [{ id: 'sync-1', status: 'RUNNING' }];

    const html = renderToString(<OrionDynamicDock />);
    expect(html).toContain('data-testid="dynamic-island-expanded-panel"');
    expect(html).toContain('WEB OS');
    expect(html).toContain('Exceptions');
    expect(html).toContain('Stock Coverage');
    expect(html).toContain('Shipments');
    expect(html).toContain('Open Copilot');
    expect(html).toContain('Control Tower');
    expect(html).toContain('Alerts');
    expect(html).toContain('data-surface-state="expanded"');
  });

  it('DD2-07: Silver Light Mode renders light-mode surface styling inside expanded Dynamic Dock panel', () => {
    mockThemeId = 'silver';
    storageMap['orion_dynamic_island_mode'] = 'expanded';
    const html = renderToString(<OrionDynamicDock />);
    expect(html).toContain('data-testid="dynamic-island-expanded-panel"');
    expect(html).toContain('bg-slate-900/[0.04]');
    expect(html).toContain('text-indigo-700');
    expect(html).not.toContain('bg-white/[0.05]');
  });
});
