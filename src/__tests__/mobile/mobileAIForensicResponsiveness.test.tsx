import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { OrionMobileAICopilot } from '../../os/mobile/OrionMobileAICopilot';
import { OrionMobileShell } from '../../os/mobile/OrionMobileShell';
import { MobileNavigationProvider } from '../../os/mobile/OrionMobileNavigation';

// Mock Auth Context
const mockSignOut = vi.fn();
vi.mock('../../store/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      id: 'usr-exec-01',
      fullName: 'Alex Vance',
      username: 'avance',
      email: 'alex.vance@orion9.network',
      role: 'executive_viewer',
      organizationId: 'tenant-orion-corp',
    },
    isAuthenticated: true,
    signOut: mockSignOut,
    isAdmin: false,
    hasRole: vi.fn(() => false),
    hasPermission: vi.fn(() => true),
  }),
}));

// Mock Notifications Context
vi.mock('../../store/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [{ id: 'notif-1', title: 'Network sync complete' }],
    unreadCount: 1,
  }),
}));

// Mock Supply Chain Context
vi.mock('../../store/SupplyChainContext', () => ({
  useSupplyChain: () => ({
    currency: 'USD',
    inventory: [
      { id: 'inv-1', productId: 'SKU-777', warehouseId: 'WH-CENTRAL', onHand: 42900, reserved: 50, safetyStock: 200, unitCost: 42 }
    ],
    shipments: [
      { id: 'shp-101', carrier: 'Maersk Line', delayDays: 0, status: 'In Transit', origin: 'SGP', destination: 'RTM', freightCost: 8200 }
    ],
    purchaseOrders: [
      { id: 'po-101', orderNumber: 'PO-2026-001', totalValue: 64000, status: 'Confirmed' }
    ],
    exceptions: [],
    suppliers: [
      { id: 'sup-1', name: 'Pacific Componentry', otif: 96, riskLevel: 'Low', country: 'SG' }
    ],
    decisions: [
      { id: 'dec-1', title: 'Autonomous Buffer Realignment', summary: 'Safety stocks calibrated to baseline' }
    ],
    settings: {
      userExperienceMode: 'SIMPLE',
      theme: 'graphite',
    },
    updateSettings: vi.fn(),
  }),
}));

// Mock Window Manager Context
vi.mock('../../os/WindowManagerContext', () => ({
  useWindowManager: () => ({
    windows: {},
    activeAppId: null,
    openApplication: vi.fn(),
    focusApplication: vi.fn(),
    closeApplication: vi.fn(),
  }),
  useOptionalWindowManager: () => ({
    windows: {},
    activeAppId: null,
    openApplication: vi.fn(),
    focusApplication: vi.fn(),
    closeApplication: vi.fn(),
  }),
}));

describe('ORION-9 Mobile AI Forensic Responsiveness Verification Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Mobile AI surface mounts without desktop fixed widths or horizontal scroll wrappers', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/mobile/ai']}>
        <MobileNavigationProvider>
          <OrionMobileAICopilot />
        </MobileNavigationProvider>
      </MemoryRouter>
    );

    // AI surface is present
    expect(html).toContain('data-orion-ai-surface="true"');
    // The surface is a flexible column with no fixed width
    expect(html).toContain('flex flex-col flex-1 min-h-0 w-full max-w-full overflow-hidden');
    // Does NOT contain desktop fixed widths
    expect(html).not.toContain('min-w-[700px]');
    expect(html).not.toContain('min-w-[600px]');
    expect(html).not.toContain('w-[800px]');
  });

  it('2. Telemetry bar is reflowed as a responsive grid with all 4 metrics', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/mobile/ai']}>
        <MobileNavigationProvider>
          <OrionMobileAICopilot />
        </MobileNavigationProvider>
      </MemoryRouter>
    );

    // Telemetry uses responsive grid layout
    expect(html).toContain('grid grid-cols-2 min-[480px]:grid-cols-4 gap-1.5');
    // Does NOT use horizontal scroll for metrics
    expect(html).not.toContain('overflow-x-auto no-scrollbar gap-3');
    // All metrics present
    expect(html).toContain('Health:');
    expect(html).toContain('Critical:');
    expect(html).toContain('Delays:');
    expect(html).toContain('Stock:');
  });

  it('3. Suggested actions wrap and do not use non-wrapping overflow row', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/mobile/ai']}>
        <MobileNavigationProvider>
          <OrionMobileAICopilot />
        </MobileNavigationProvider>
      </MemoryRouter>
    );

    // Suggested actions container wraps naturally
    expect(html).toContain('flex flex-wrap items-center gap-1.5 py-1.5 shrink-0 w-full max-w-full');
    // Gallery button is present
    expect(html).toContain('Gallery');
    // Does not use overflow-x-auto without wrap
    expect(html).not.toContain('overflow-x-auto no-scrollbar py-2 shrink-0');
  });

  it('4. AI Composer is responsive, contains min-w-0 flex container and send button', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/mobile/ai']}>
        <MobileNavigationProvider>
          <OrionMobileAICopilot />
        </MobileNavigationProvider>
      </MemoryRouter>
    );

    // Flexible input container with min-w-0
    expect(html).toContain('relative flex-1 min-w-0');
    // Accessible touch target for send button
    expect(html).toContain('aria-label="Send Message to Orion AI"');
    expect(html).toContain('h-[44px] w-[44px]');
  });

  it('5. Cognition message card uses natural text wrapping and break-words', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/mobile/ai']}>
        <MobileNavigationProvider>
          <OrionMobileAICopilot />
        </MobileNavigationProvider>
      </MemoryRouter>
    );

    expect(html).toContain('break-words');
    expect(html).toContain('ORION AI Cognition Core initialized');
  });

  it('6. Mobile shell gives AI a full-height flex column context without bottom gap', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/mobile/ai']}>
        <OrionMobileShell />
      </MemoryRouter>
    );

    // Main tag is flex flex-col to allow children to stretch
    expect(html).toContain('<main class="flex-1 min-h-0 w-full max-w-full flex flex-col overflow-hidden');
    // AI navigation item has aria-current="page"
    expect(html).toMatch(/aria-label="Open ORION AI"[^>]*aria-current="page"/);
  });
});
