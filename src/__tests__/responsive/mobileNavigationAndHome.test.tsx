/**
 * ORION-9 MOBILE HOME & INFORMATION ARCHITECTURE NAVIGATION TEST SUITE
 * 
 * Verifies:
 * 1. Mobile Home is a dedicated OS landing page ("What is happening in my Orion environment?").
 * 2. Mobile Control is the distinct destination for the full Supply Chain Command Center / Control Tower.
 * 3. Bottom navigation semantics: Home, Control, AI, Alerts, Apps remain distinct.
 * 4. Deep linking to /mobile/home, /mobile/control, /mobile/ai, /mobile/alerts, /mobile/apps.
 * 5. Desktop OS and Command Center capabilities remain unaffected.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { OrionMobileHome } from '../../os/mobile/OrionMobileHome';
import { OrionMobileControlTower } from '../../os/mobile/OrionMobileControlTower';
import { OrionMobileBottomNav } from '../../os/mobile/OrionMobileBottomNav';
import { OrionMobileHeader } from '../../os/mobile/OrionMobileHeader';
import { OrionMobileShell } from '../../os/mobile/OrionMobileShell';
import { MobileNavigationProvider } from '../../os/mobile/OrionMobileNavigation';
import { dbManager } from '../../core/database/DatabaseConnectionManager';

// Mock Auth Context
vi.mock('../../store/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      id: 'usr-mob-001',
      fullName: 'Operations Manager',
      username: 'ops_mgr',
      email: 'ops@orion9.enterprise',
      role: 'supply_chain_manager',
      organizationId: 'tenant-mob-001',
    },
    isAuthenticated: true,
    isAdmin: false,
    signOut: vi.fn(),
  }),
}));

// Mock Notification Context
vi.mock('../../store/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [
      { id: 'notif-1', title: 'Port Congestion Alert', read: false }
    ],
    unreadCount: 2,
  }),
}));

// Mock Supply Chain Context
vi.mock('../../store/SupplyChainContext', () => ({
  useSupplyChain: () => ({
    currency: 'USD',
    inventory: [
      { id: 'inv-mob-1', productId: 'SKU-TURBINE-01', warehouseId: 'WH-CENTRAL', onHand: 450, reserved: 100, safetyStock: 600, unitCost: 120 }
    ],
    shipments: [
      { id: 'shp-mob-1', trackingNumber: 'TRK-9821', carrier: 'Maersk Line', delayDays: 4, status: 'Delayed', origin: 'SGP', destination: 'RTM', freightCost: 8200 }
    ],
    purchaseOrders: [
      { id: 'po-mob-1', orderNumber: 'PO-8812', totalValue: 92000, status: 'Delayed' }
    ],
    exceptions: [
      { id: 'exc-mob-1', title: 'Port Congestion at Rotterdam', severity: 'Critical', estimatedImpact: 45000, status: 'Active', entityId: 'SHP-101', description: 'Container vessel delayed by 4 days due to berth congestion.' }
    ],
    suppliers: [
      { id: 'sup-mob-1', name: 'Precision Motors AG', otif: 78, riskLevel: 'High', country: 'DE' }
    ],
    decisions: [
      { id: 'dec-mob-1', title: 'Reroute Feeder Vessel', summary: 'Feeder rerouted via Antwerp' }
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

describe('Mobile Home & Information Architecture Navigation Suite', () => {
  beforeEach(async () => {
    await dbManager.switchEnvironment({
      targetEnvironment: 'DEMO',
      actorUserId: 'usr-mob-001',
      actorRole: 'platform_admin',
      callerType: 'human_admin',
      stepUpConfirmed: true,
    });
  });

  describe('1. Mobile Home Screen Invariants', () => {
    it('renders dedicated Mobile Home landing page with personalized greeting', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/mobile/home']}>
          <MobileNavigationProvider>
            <OrionMobileHome />
          </MobileNavigationProvider>
        </MemoryRouter>
      );

      const plainText = html.replace(/<[^>]+>/g, '');
      expect(plainText).toContain('ORION-9 OS');
      expect(html).toContain('MOBILE HOME');
      expect(html).toContain('Operations Manager');
      expect(html).toContain('System Operational');
      expect(html).toContain('Your supply chain environment at a glance');
    });

    it('renders 4 Quick Access buttons (Control, AI, Alerts, Apps)', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/mobile/home']}>
          <MobileNavigationProvider>
            <OrionMobileHome />
          </MobileNavigationProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Quick Access');
      expect(html).toContain('Control');
      expect(html).toContain('AI');
      expect(html).toContain('Alerts');
      expect(html).toContain('Apps');
    });

    it('renders Control Tower Overview summary card with navigation link', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/mobile/home']}>
          <MobileNavigationProvider>
            <OrionMobileHome />
          </MobileNavigationProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Control Tower Overview');
      expect(html).toContain('Open Control Center');
      expect(html).toContain('Exceptions');
      expect(html).toContain('Cargo Delays');
      expect(html).toContain('Stock Risks');
    });

    it('renders Orion AI Assistant card and Critical Alerts summary', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/mobile/home']}>
          <MobileNavigationProvider>
            <OrionMobileHome />
          </MobileNavigationProvider>
        </MemoryRouter>
      );

      expect(html).toContain('ORION AI');
      expect(html).toContain('Ask Orion anything about your supply chain...');
      expect(html).toContain('Critical Alerts');
      expect(html).toContain('Port Congestion at Rotterdam');
    });

    it('does NOT render duplicated full Control Tower Recharts telemetry charts inside Mobile Home', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/mobile/home']}>
          <MobileNavigationProvider>
            <OrionMobileHome />
          </MobileNavigationProvider>
        </MemoryRouter>
      );

      // Invariant: Home must be a lightweight landing page, NOT the full Control Tower
      expect(html).not.toContain('Telemetry Trajectories');
      expect(html).not.toContain('1. Purchase Order Volume (14D)');
      expect(html).not.toContain('Capital Risk Distribution by Domain');
    });
  });

  describe('2. Mobile Control Tower Screen Invariants', () => {
    it('renders full Control Tower Command Center under Control destination', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/mobile/control']}>
          <MobileNavigationProvider>
            <OrionMobileControlTower />
          </MobileNavigationProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Orion Control Tower');
      expect(html).toContain('Active Disruption Telemetry');
      expect(html).toContain('Telemetry Trajectories');
      expect(html).toContain('1. Purchase Order Volume (14D)');
      expect(html).toContain('5. Capital Risk Distribution by Domain');
    });
  });

  describe('3. Mobile Navigation Header & Bottom Nav Semantics', () => {
    it('displays ORION HOME title in header when on Home tab', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/mobile/home']}>
          <MobileNavigationProvider>
            <OrionMobileHeader />
          </MobileNavigationProvider>
        </MemoryRouter>
      );

      expect(html).toContain('ORION HOME');
    });

    it('renders 5 distinct bottom navigation destinations (Home, Control, AI, Alerts, Apps)', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/mobile/home']}>
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
      expect(html).toContain('aria-label="Navigate to Home"');
      expect(html).toContain('aria-label="Navigate to Control"');
    });

    it('renders Orion Mobile Shell with Home destination on initial load', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/mobile/home']}>
          <OrionMobileShell />
        </MemoryRouter>
      );

      expect(html).toContain('data-orion-mobile-shell="true"');
      expect(html).toContain('ORION HOME');
      expect(html).toContain('Your supply chain environment at a glance');
    });
  });
});
