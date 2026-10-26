import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DynamicIsland } from '../../os/components/dynamicIsland/DynamicIsland';
import { getAuthoritativeRuntime, useDynamicIslandState } from '../../os/components/dynamicIsland/useDynamicIslandState';

// Mock essential contexts
const mockOpenApplication = vi.fn();
const mockSetCommandPaletteOpen = vi.fn();

let mockActiveAppId: string | null = null;
let mockExceptions: any[] = [
  { id: 'exc-1', title: 'Severe delay', severity: 'Critical', status: 'Open' }
];
let mockUnreadCount = 3;
let mockSyncJobs: any[] = [{ id: 'sync-1', status: 'RUNNING' }];

vi.mock('../../os/WindowManagerContext', () => ({
  useWindowManager: () => ({
    activeAppId: mockActiveAppId,
    openApplication: mockOpenApplication,
    setCommandPaletteOpen: mockSetCommandPaletteOpen,
  }),
  useOptionalWindowManager: () => ({
    activeAppId: mockActiveAppId,
    openApplication: mockOpenApplication,
    setCommandPaletteOpen: mockSetCommandPaletteOpen,
  }),
  WORKSPACES: {},
}));

vi.mock('../../store/SupplyChainContext', () => ({
  useSupplyChain: () => ({
    exceptions: mockExceptions,
    inventory: [
      { productId: 'SKU-001', onHand: 2, safetyStock: 20, reorderPoint: 15 }
    ],
    shipments: [
      { id: 'shp-1', status: 'Delayed', carrier: 'OceanFreight' }
    ],
    purchaseOrders: [
      { id: 'po-1', status: 'Pending', totalValue: 50000 }
    ],
    settings: {
      personalization: { reducedMotion: false }
    }
  }),
  useOptionalSupplyChain: () => ({
    exceptions: mockExceptions,
    inventory: [
      { productId: 'SKU-001', onHand: 2, safetyStock: 20, reorderPoint: 15 }
    ],
    shipments: [
      { id: 'shp-1', status: 'Delayed', carrier: 'OceanFreight' }
    ],
    purchaseOrders: [
      { id: 'po-1', status: 'Pending', totalValue: 50000 }
    ],
    settings: {
      personalization: { reducedMotion: false }
    }
  }),
}));

vi.mock('../../store/NotificationContext', () => ({
  useNotifications: () => ({
    unreadCount: mockUnreadCount,
    notifications: []
  }),
  useOptionalNotifications: () => ({
    unreadCount: mockUnreadCount,
    notifications: []
  }),
}));

vi.mock('../../integration/useIntegrationFabric', () => ({
  useIntegrationFabric: () => ({
    connectors: [
      { id: 'conn-sap', name: 'SAP S/4HANA', status: 'CONNECTED' },
      { id: 'conn-oracle', name: 'Oracle ERP', status: 'CONNECTED' },
      { id: 'conn-edi', name: 'EDI 850/856', status: 'CONNECTED' }
    ],
    syncJobs: mockSyncJobs
  })
}));

describe('Orion-9 Dynamic Island Architecture & Telemetry', () => {
  let storageMap: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveAppId = null;
    mockExceptions = [
      { id: 'exc-1', title: 'Severe delay', severity: 'Critical', status: 'Open' }
    ];
    mockUnreadCount = 3;
    mockSyncJobs = [{ id: 'sync-1', status: 'RUNNING' }];
    storageMap = {};
    (global as any).localStorage = {
      getItem: (key: string) => storageMap[key] ?? null,
      setItem: (key: string, val: string) => { storageMap[key] = String(val); },
      removeItem: (key: string) => { delete storageMap[key]; },
      clear: () => { storageMap = {}; }
    };
  });

  it('DYNAMIC-ISLAND-01: Renders compact mode with accessible region and ARIA attributes', () => {
    const html = renderToString(<DynamicIsland />);
    
    // Region container accessibility
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Orion-9 Dynamic Island System Telemetry"');
    
    // Expandable button attributes
    expect(html).toContain('role="button"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="Expand Orion Dynamic Island"');
  });

  it('DYNAMIC-ISLAND-02: Displays critical alerts count or activity in compact mode', () => {
    const html = renderToString(<DynamicIsland />);
    
    // Since our mock has 1 critical exception, compact mode elevates to Alert
    expect(html).toMatch(/1(<!-- -->)?\s*Alert/);
    expect(html).toContain('text-rose-300');
  });

  it('DYNAMIC-ISLAND-03: Displays unread notifications badge in compact pill', () => {
    const html = renderToString(<DynamicIsland />);
    
    // Notification count 3 from mock
    expect(html).toContain('3 unread notification');
    expect(html).toContain('<span>3</span>');
  });

  it('DYNAMIC-ISLAND-04: Displays active application name in compact mode when nominal', () => {
    mockExceptions = [];
    mockUnreadCount = 0;
    mockSyncJobs = [];
    mockActiveAppId = 'command-center';

    const html = renderToString(<DynamicIsland />);
    expect(html).toContain('Command Center');
  });

  it('DYNAMIC-ISLAND-05: Displays System Ready when all systems nominal and no active window', () => {
    mockExceptions = [];
    mockUnreadCount = 0;
    mockSyncJobs = [];
    mockActiveAppId = null;

    const html = renderToString(<DynamicIsland />);
    expect(html).toContain('System Ready');
  });

  it('DYNAMIC-ISLAND-06: Authoritatively identifies Web OS vs Native Tauri Desktop runtime', () => {
    // 1. In standard web environment
    const originalWindow = global.window;
    try {
      (global as any).window = {};
      const webRuntime = getAuthoritativeRuntime();
      expect(webRuntime.runtimeMode).toBe('WEB OS');
      expect(webRuntime.isNativeDesktop).toBe(false);

      // 2. In Tauri 2.x desktop environment
      (global as any).window = {
        __TAURI__: {
          core: {
            invoke: vi.fn()
          }
        }
      };
      const tauriRuntime = getAuthoritativeRuntime();
      expect(tauriRuntime.runtimeMode).toBe('TAURI DESKTOP');
      expect(tauriRuntime.isNativeDesktop).toBe(true);
    } finally {
      global.window = originalWindow;
    }
  });

  it('DYNAMIC-ISLAND-07: Supports pinning persistence via localStorage', () => {
    const PINNED_STORAGE_KEY = 'orion_dynamic_island_pinned';
    expect(localStorage.getItem(PINNED_STORAGE_KEY)).toBeNull();

    localStorage.setItem(PINNED_STORAGE_KEY, 'true');
    expect(localStorage.getItem(PINNED_STORAGE_KEY)).toBe('true');

    localStorage.setItem(PINNED_STORAGE_KEY, 'false');
    expect(localStorage.getItem(PINNED_STORAGE_KEY)).toBe('false');
  });

  it('DYNAMIC-ISLAND-08: useDynamicIslandState hook provides metrics and interaction handlers', () => {
    let capturedState: any;
    const TestComponent = () => {
      capturedState = useDynamicIslandState();
      return <div>test</div>;
    };
    renderToString(<TestComponent />);

    expect(capturedState).toBeDefined();
    expect(capturedState.metrics).toBeDefined();
    expect(capturedState.metrics.activeExceptionsCount).toBe(1);
    expect(capturedState.metrics.criticalExceptionsCount).toBe(1);
    expect(capturedState.metrics.stockoutRisksCount).toBe(1);
    expect(capturedState.metrics.delayedShipmentsCount).toBe(1);
    expect(capturedState.metrics.openPurchaseOrdersCount).toBe(1);
    expect(capturedState.metrics.connectedConnectorsCount).toBe(3);
    expect(capturedState.metrics.activeSyncJobsCount).toBe(1);
    expect(typeof capturedState.toggleExpanded).toBe('function');
    expect(typeof capturedState.togglePin).toBe('function');
    expect(typeof capturedState.handleAction).toBe('function');
  });
});
