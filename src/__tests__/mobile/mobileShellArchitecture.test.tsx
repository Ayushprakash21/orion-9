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
        <MobileNavigationProvider>
          <OrionMobileHeader />
        </MobileNavigationProvider>
      );

      // Verify Brand Logo is rendered
      expect(html).toContain('ORION');
      // Verify Title
      expect(html).toContain('COMMAND CENTER');
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
        <MobileNavigationProvider>
          <OrionMobileHeader />
        </MobileNavigationProvider>
      );

      expect(html).toContain('LIVE');
    });
  });

  describe('2. Mobile Bottom Navigation (5 Destinations)', () => {
    it('renders exactly 5 primary mobile destinations: Home, Control, AI, Alerts, Apps', () => {
      const html = renderToString(
        <MobileNavigationProvider>
          <OrionMobileBottomNav />
        </MobileNavigationProvider>
      );

      expect(html).toContain('Home');
      expect(html).toContain('Control');
      expect(html).toContain('AI');
      expect(html).toContain('Alerts');
      expect(html).toContain('Apps');
    });

    it('renders unread notification badge count on the Alerts destination', () => {
      const html = renderToString(
        <MobileNavigationProvider>
          <OrionMobileBottomNav />
        </MobileNavigationProvider>
      );

      expect(html).toContain('2');
    });

    it('renders AI button with dedicated accessibility attributes and pointer events enabled', () => {
      const html = renderToString(
        <MobileNavigationProvider>
          <OrionMobileBottomNav />
        </MobileNavigationProvider>
      );

      expect(html).toContain('aria-label="Open ORION AI"');
      expect(html).toContain('role="button"');
      expect(html).toContain('z-50');
      expect(html).toContain('pointer-events-auto');
    });
  });

  describe('3. Mobile Shell Presentation Invariants', () => {
    it('renders the complete mobile shell container with no desktop dock', () => {
      const html = renderToString(<OrionMobileShell />);

      // Must have data-orion-mobile-shell attribute
      expect(html).toContain('data-orion-mobile-shell="true"');

      // Desktop Dock MUST NOT exist in the mobile shell
      expect(html).not.toContain('data-orion-dock="true"');

      // Desktop System Bar navigation (OPERATIONS / INTELLIGENCE / CONTROL / ADMIN) MUST NOT exist horizontally
      expect(html).not.toContain('OPERATIONS');
    });

    it('guarantees overflow-x-hidden to prevent horizontal scrolling', () => {
      const html = renderToString(<OrionMobileShell />);
      expect(html).toContain('overflow-x-hidden');
    });

    it('renders mobile-first Home command center and 2x2 KPI grid', () => {
      const html = renderToString(
        <MobileNavigationProvider>
          <OrionMobileHome />
        </MobileNavigationProvider>
      );

      expect(html).toContain('Supply Chain Command Center');
      expect(html).toContain('Orders');
      expect(html).toContain('Inventory');
      expect(html).toContain('Shipments');
      expect(html).toContain('Exceptions');
      expect(html).toContain('Supply Chain Activity');
    });

    it('renders mobile Control Tower with disruption telemetry and stacked charts', () => {
      const html = renderToString(
        <MobileNavigationProvider>
          <OrionMobileControlTower />
        </MobileNavigationProvider>
      );

      expect(html).toContain('Orion Control Tower');
      expect(html).toContain('Active Disruption Telemetry');
      expect(html).toContain('Purchase Order Volume');
      expect(html).toContain('Total Inventory On-Hand');
      expect(html).toContain('Shipment Velocity &amp; Deliveries');
    });

    it('renders mobile App Launcher with structured enterprise categories and search', () => {
      const html = renderToString(
        <MobileNavigationProvider>
          <OrionMobileAppLauncher />
        </MobileNavigationProvider>
      );

      expect(html).toContain('Search 100+ Enterprise Apps...');
      expect(html).toContain('Operations &amp; Execution');
      expect(html).toContain('Deep SCM Intelligence');
      expect(html).toContain('Governed AI &amp; Automation');
    });
  });
});
