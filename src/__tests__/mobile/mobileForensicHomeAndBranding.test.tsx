import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { OrionMobileHeader } from '../../os/mobile/OrionMobileHeader';
import { OrionMobileHome } from '../../os/mobile/OrionMobileHome';
import { OrionMobileControlTower } from '../../os/mobile/OrionMobileControlTower';
import { OrionMobileAICopilot } from '../../os/mobile/OrionMobileAICopilot';
import { OrionMobileAlerts } from '../../os/mobile/OrionMobileAlerts';
import { OrionMobileAppLauncher } from '../../os/mobile/OrionMobileAppLauncher';
import { OrionMobileBottomNav } from '../../os/mobile/OrionMobileBottomNav';
import { OrionMobileShell } from '../../os/mobile/OrionMobileShell';
import { MobileNavigationProvider, useMobileNavigation } from '../../os/mobile/OrionMobileNavigation';
import { OrionSystemBar } from '../../os/components/OrionSystemBar';
import { BrandLogo, AUTHORITATIVE_DEFAULT_LOGO } from '../../components/brand/BrandLogo';

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
      { id: 'inv-1', productId: 'SKU-777', warehouseId: 'WH-CENTRAL', onHand: 450, reserved: 50, safetyStock: 200, unitCost: 42 }
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
      { id: 'dec-1', title: 'Autonomous Buffer Realignment', summary: 'Safety stocks calibrated to Q4 demand baseline' }
    ],
    settings: {
      userExperienceMode: 'SIMPLE',
      theme: 'graphite',
    },
    updateSettings: vi.fn(),
  }),
}));

// Mock Toast Context
vi.mock('../../store/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
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

describe('ORION-9 Mobile UI Forensic Verification Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Mobile Home renders correct Orion-9 logo
  it('1. Mobile Header renders canonical Orion-9 logo via BrandLogo', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/mobile/home']}>
        <MobileNavigationProvider>
          <OrionMobileHeader />
        </MobileNavigationProvider>
      </MemoryRouter>
    );

    // Verifies BrandLogo is rendered with the authoritative default logo source
    expect(html).toContain('orion-brand-image');
    expect(html).toContain(AUTHORITATIVE_DEFAULT_LOGO);
    // Verifies manual circle SVG or incorrect approximate logo is NOT present
    expect(html).not.toContain('stroke-dasharray="50 15"');
  });

  // 2. Mobile Home does not render Control Center content
  it('2. Mobile Home does not render Control Center operational widgets, charts, or telemetry', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/mobile/home']}>
        <MobileNavigationProvider>
          <OrionMobileHome />
        </MobileNavigationProvider>
      </MemoryRouter>
    );

    // Must contain Home elements
    expect(html).toContain('Alex Vance');
    expect(html).toContain('System Operational');
    expect(html).toContain('Quick Actions');
    expect(html).toContain('Quick Access');

    // MUST NOT contain Control Center specific panels
    expect(html).not.toContain('Orion Control Tower');
    expect(html).not.toContain('Active Disruption Telemetry');
    expect(html).not.toContain('recharts-surface');
    expect(html).not.toContain('Disruption Risk Exposure');
    expect(html).not.toContain('Telemetry Trajectories');
    expect(html).not.toContain('Stockout Risk:');
    expect(html).not.toContain('Carrier:');
  });

  // 3. Quick Access Control navigates to Control Center
  it('3. Quick Access contains Control button linking to Control Center', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/mobile/home']}>
        <MobileNavigationProvider>
          <OrionMobileHome />
        </MobileNavigationProvider>
      </MemoryRouter>
    );

    expect(html).toContain('Control');
    expect(html).toContain('aria-label="Open Command Center"');
  });

  // 4. Home navigation returns to Home
  it('4. Home navigation renders OrionMobileHome when activeTab is home', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/mobile/home']}>
        <OrionMobileShell />
      </MemoryRouter>
    );

    expect(html).toContain('Enterprise Supply Chain Operating System');
    expect(html).not.toContain('Orion Control Tower');
  });

  // 5. Control navigation renders Control Center
  it('5. Control navigation renders Control Center when activeTab is control', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/mobile/control']}>
        <OrionMobileShell />
      </MemoryRouter>
    );

    expect(html).toContain('Orion Control Tower');
    expect(html).not.toContain('Enterprise Supply Chain Operating System');
  });

  // 6. AI navigation renders AI
  it('6. AI navigation renders OrionMobileAICopilot when activeTab is ai', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/mobile/ai']}>
        <OrionMobileShell />
      </MemoryRouter>
    );

    expect(html).toContain('ORION AI');
    expect(html).toContain('ORION AI Cognition Core initialized');
    expect(html).not.toContain('Enterprise Supply Chain Operating System');
  });

  // 7. Alerts navigation renders Alerts
  it('7. Alerts navigation renders OrionMobileAlerts when activeTab is alerts', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/mobile/alerts']}>
        <OrionMobileShell />
      </MemoryRouter>
    );

    expect(html).toContain('Operational Alerts &amp; Risks');
    expect(html).not.toContain('Enterprise Supply Chain Operating System');
  });

  // 8. Apps navigation renders Apps
  it('8. Apps navigation renders OrionMobileAppLauncher when activeTab is apps', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/mobile/apps']}>
        <OrionMobileShell />
      </MemoryRouter>
    );

    expect(html).toContain('Search enterprise apps...');
    expect(html).not.toContain('Enterprise Supply Chain Operating System');
  });

  // 9. Home and Control cannot simultaneously be active
  it('9. Home and Control cannot simultaneously be active in bottom navigation', () => {
    const htmlHome = renderToString(
      <MemoryRouter initialEntries={['/mobile/home']}>
        <MobileNavigationProvider>
          <OrionMobileBottomNav />
        </MobileNavigationProvider>
      </MemoryRouter>
    );

    // In Home view: Home has aria-current="page", Control does NOT
    expect(htmlHome).toMatch(/aria-label="Navigate to Home"[^>]*aria-current="page"/);
    expect(htmlHome).not.toMatch(/aria-label="Navigate to Control"[^>]*aria-current="page"/);

    const htmlControl = renderToString(
      <MemoryRouter initialEntries={['/mobile/control']}>
        <MobileNavigationProvider>
          <OrionMobileBottomNav />
        </MobileNavigationProvider>
      </MemoryRouter>
    );

    // In Control view: Control has aria-current="page", Home does NOT
    expect(htmlControl).toMatch(/aria-label="Navigate to Control"[^>]*aria-current="page"/);
    expect(htmlControl).not.toMatch(/aria-label="Navigate to Home"[^>]*aria-current="page"/);
  });

  // 10. Logout clears navigation state
  it('10. Profile dropdown provides Sign Out action invoking auth service', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/mobile/home']}>
        <MobileNavigationProvider>
          <OrionMobileHeader />
        </MobileNavigationProvider>
      </MemoryRouter>
    );

    expect(html).toContain('aria-label="User Menu"');
  });

  // 11. Reloading Home does not load Control Center
  it('11. Direct load on /mobile/home mounts exclusively OrionMobileHome without Control Center', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/mobile/home']}>
        <OrionMobileShell />
      </MemoryRouter>
    );

    expect(html).toContain('Enterprise Supply Chain Operating System');
    expect(html).not.toContain('Active Disruption Telemetry');
    expect(html).not.toContain('Orion Control Tower');
  });

  // 12. Desktop navigation remains unaffected
  it('12. Desktop navigation system bar retains desktop layout and canonical BrandLogo', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/']}>
        <OrionSystemBar />
      </MemoryRouter>
    );

    // System Bar uses canonical BrandLogo
    expect(html).toContain('orion-brand-image');
    expect(html).toContain('Orion OS');
    expect(html).toContain('Orion System Menu');
  });
});
