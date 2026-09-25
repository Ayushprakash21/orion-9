import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OrionMobileShell } from '../../os/mobile/OrionMobileShell';
import { OrionMobileHeader } from '../../os/mobile/OrionMobileHeader';
import { OrionMobileBottomNav } from '../../os/mobile/OrionMobileBottomNav';
import { OrionMobileHome } from '../../os/mobile/OrionMobileHome';
import { OrionMobileControlTower } from '../../os/mobile/OrionMobileControlTower';
import { OrionMobileAppLauncher } from '../../os/mobile/OrionMobileAppLauncher';
import { MobileNavigationProvider } from '../../os/mobile/OrionMobileNavigation';
import { dbManager } from '../../core/database/DatabaseConnectionManager';

// Mock Auth Context
vi.mock('../../store/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      id: 'usr-mob-001',
      fullName: 'Chief Supply Chain Officer',
      email: 'exec@orion9.enterprise',
      role: 'supply_chain_manager',
      organizationId: 'tenant-mob-001',
    },
    isAuthenticated: true,
    signOut: vi.fn(),
  }),
}));

// Mock Notification Context
vi.mock('../../store/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [
      { id: 'notif-1', title: 'Carrier delay', read: false }
    ],
    unreadCount: 2,
  }),
}));

// Mock Supply Chain Context
vi.mock('../../store/SupplyChainContext', () => ({
  useSupplyChain: () => ({
    currency: 'USD',
    inventory: [
      { id: 'inv-1', productId: 'SKU-001', warehouseId: 'WH-01', onHand: 1200, reserved: 200, safetyStock: 800, unitCost: 35 }
    ],
    shipments: [
      { id: 'shp-1', carrier: 'FedEx Freight', delayDays: 2, status: 'In Transit', origin: 'ORD', destination: 'FRA', freightCost: 4500 }
    ],
    purchaseOrders: [
      { id: 'po-1', orderNumber: 'PO-9001', totalValue: 48000, status: 'Confirmed' }
    ],
    exceptions: [
      { id: 'exc-1', title: 'Critical Stockout', severity: 'Critical', estimatedImpact: 25000, status: 'Active' }
    ],
    suppliers: [
      { id: 'sup-1', name: 'Alpha Logistics', otif: 82, riskLevel: 'High', country: 'US' }
    ],
    decisions: [],
    settings: {
      criticalStockOutDays: 3,
    }
  }),
}));

// Mock Toast Context
vi.mock('../../store/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

import { MemoryRouter } from 'react-router-dom';

describe('Orion-9 Mobile Application Shell Rebuild Architecture', () => {
  beforeEach(async () => {
    await dbManager.switchEnvironment({
      targetEnvironment: 'DEMO',
      actorUserId: 'admin-mob-001',
      actorRole: 'platform_admin',
      callerType: 'human_admin',
      stepUpConfirmed: true,
    });
  });

  describe('1. Mobile Header Architecture', () => {
    it('renders the dedicated mobile header with logo, title and environment badge', () => {
      const html = renderToString(
        <MemoryRouter>
          <MobileNavigationProvider>
            <OrionMobileHeader />
          </MobileNavigationProvider>
        </MemoryRouter>
      );

      // Verify Brand Logo is rendered
      expect(html).toContain('ORION');
      // Verify Title
      expect(html).toContain('ORION HOME');
      // Verify DEMO environment indicator
      expect(html).toContain('DEMO');
    });

    it('updates header to LIVE when environment switches to LIVE', async () => {
      await dbManager.switchEnvironment({
        targetEnvironment: 'LIVE',
        actorUserId: 'admin-mob-001',
        actorRole: 'platform_admin',
        callerType: 'human_admin',
        stepUpConfirmed: true,
      });

      const html = renderToString(
        <MemoryRouter>
          <MobileNavigationProvider>
            <OrionMobileHeader />
          </MobileNavigationProvider>
        </MemoryRouter>
      );

      expect(html).toContain('LIVE');
    });
  });

  describe('2. Mobile Bottom Navigation (5 Destinations)', () => {
    it('renders exactly 5 primary mobile destinations: Home, Control, AI, Alerts, Apps', () => {
      const html = renderToString(
        <MemoryRouter>
          <MobileNavigationProvider>
            <OrionMobileBottomNav />
          </MobileNavigationProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Home');
      expect(html).toContain('Control');
      expect(html).toContain('AI');
      expect(html).toContain('Alerts');
      expect(html).toContain('Apps');
    });

    it('renders unread notification badge count on the Alerts destination', () => {
      const html = renderToString(
        <MemoryRouter>
          <MobileNavigationProvider>
            <OrionMobileBottomNav />
          </MobileNavigationProvider>
        </MemoryRouter>
      );

      expect(html).toContain('2');
    });

    it('renders AI button with dedicated accessibility attributes and pointer events enabled', () => {
      const html = renderToString(
        <MemoryRouter>
          <MobileNavigationProvider>
            <OrionMobileBottomNav />
          </MobileNavigationProvider>
        </MemoryRouter>
      );

      expect(html).toContain('aria-label="Open ORION AI"');
      expect(html).toContain('role="button"');
      expect(html).toContain('z-50');
      expect(html).toContain('pointer-events-auto');
    });
  });

  describe('3. Mobile Shell Presentation Invariants', () => {
    it('renders the complete mobile shell container with no desktop dock', () => {
      const html = renderToString(
        <MemoryRouter>
          <OrionMobileShell />
        </MemoryRouter>
      );

      // Must have data-orion-mobile-shell attribute
      expect(html).toContain('data-orion-mobile-shell="true"');

      // Desktop Dock MUST NOT exist in the mobile shell
      expect(html).not.toContain('data-orion-dock="true"');

      // Desktop System Bar navigation (OPERATIONS / INTELLIGENCE / CONTROL / ADMIN) MUST NOT exist horizontally
      expect(html).not.toContain('OPERATIONS');
    });

    it('guarantees overflow-x-hidden to prevent horizontal scrolling', () => {
      const html = renderToString(
        <MemoryRouter>
          <OrionMobileShell />
        </MemoryRouter>
      );
      expect(html).toContain('overflow-x-hidden');
    });

    it('renders mobile-first Home command center and 2x2 KPI grid', () => {
      const html = renderToString(
        <MemoryRouter>
          <MobileNavigationProvider>
            <OrionMobileHome />
          </MobileNavigationProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Chief Supply Chain Officer');
      expect(html).toContain('System Operational');
      expect(html).toContain('Quick Access');
      expect(html).toContain('Control Tower Overview');
    });

    it('renders mobile Control Tower with disruption telemetry and stacked charts', () => {
      const html = renderToString(
        <MemoryRouter>
          <MobileNavigationProvider>
            <OrionMobileControlTower />
          </MobileNavigationProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Orion Control Tower');
      expect(html).toContain('Risks');
      expect(html).toContain('Active Disruption Telemetry');
    });

    it('renders mobile App Launcher with structured enterprise categories and search', () => {
      const html = renderToString(
        <MemoryRouter>
          <MobileNavigationProvider>
            <OrionMobileAppLauncher />
          </MobileNavigationProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Search enterprise apps...');
      expect(html.toUpperCase()).toContain('ENTERPRISE APPS');
      expect(html).toContain('Operations &amp; Execution');
      expect(html).toContain('Deep SCM Intelligence');
    });
  });
});
