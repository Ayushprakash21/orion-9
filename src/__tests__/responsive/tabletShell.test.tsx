/**
 * ORION-9 TABLET PRESENTATION SHELL ARCHITECTURE TEST SUITE
 * 
 * Verifies that the Tablet presentation mode is an intentional, dedicated tablet OS
 * with compact touch-safe headers, adaptive navigation rails, and no leaking desktop UI.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OrionTabletShell } from '../../os/tablet/OrionTabletShell';
import { OrionTabletHeader } from '../../os/tablet/OrionTabletHeader';
import { OrionTabletNavRail } from '../../os/tablet/OrionTabletNavRail';
import { OrionTabletHome } from '../../os/tablet/OrionTabletHome';
import { OrionTabletControlTower } from '../../os/tablet/OrionTabletControlTower';
import { OrionTabletAICopilot } from '../../os/tablet/OrionTabletAICopilot';
import { OrionTabletAlerts } from '../../os/tablet/OrionTabletAlerts';
import { OrionTabletAppLauncher } from '../../os/tablet/OrionTabletAppLauncher';
import { TabletNavigationProvider } from '../../os/tablet/OrionTabletNavigation';
import { dbManager } from '../../core/database/DatabaseConnectionManager';

// Mock Auth Context
vi.mock('../../store/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      id: 'usr-tab-001',
      fullName: 'VP Global Operations',
      email: 'ops@orion9.enterprise',
      role: 'supply_chain_manager',
      organizationId: 'tenant-tab-001',
    },
    isAuthenticated: true,
    isAdmin: true,
    signOut: vi.fn(),
  }),
}));

// Mock Notification Context
vi.mock('../../store/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [
      { id: 'notif-1', title: 'Port Congestion Alert', read: false }
    ],
    unreadCount: 3,
  }),
}));

// Mock Connectivity Context
vi.mock('../../store/ConnectivityContext', () => ({
  useConnectivity: () => ({
    isOnline: true,
  }),
}));

// Mock Supply Chain Context
vi.mock('../../store/SupplyChainContext', () => ({
  useSupplyChain: () => ({
    currency: 'USD',
    inventory: [
      { id: 'inv-tab-1', productId: 'SKU-TURBINE-01', warehouseId: 'WH-CENTRAL', onHand: 450, reserved: 100, safetyStock: 600, unitCost: 120 }
    ],
    shipments: [
      { id: 'shp-tab-1', trackingNumber: 'TRK-9821', carrier: 'Maersk Line', delayDays: 4, status: 'Delayed', origin: 'SGP', destination: 'RTM', freightCost: 8200 }
    ],
    purchaseOrders: [
      { id: 'po-tab-1', orderNumber: 'PO-8812', totalValue: 92000, status: 'Delayed' }
    ],
    exceptions: [
      { id: 'exc-tab-1', title: 'Port Congestion at Rotterdam', severity: 'Critical', estimatedImpact: 45000, status: 'Active', entityId: 'SHP-101', description: 'Container vessel delayed by 4 days due to berth congestion.', recommendation: 'Reroute secondary feeder vessels to Antwerp.' }
    ],
    suppliers: [
      { id: 'sup-tab-1', name: 'Precision Motors AG', otif: 78, riskLevel: 'High', country: 'DE' }
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

describe('Orion-9 Tablet OS Presentation Shell', () => {
  beforeEach(async () => {
    await dbManager.switchEnvironment({
      targetEnvironment: 'DEMO',
      actorUserId: 'usr-tab-001',
      actorRole: 'platform_admin',
      callerType: 'human_admin',
      stepUpConfirmed: true,
    });
  });

  describe('1. Tablet Header & Navigation Invariants', () => {
    it('renders dedicated Tablet Header without desktop navigation menu collisions', () => {
      const html = renderToString(
        <TabletNavigationProvider>
          <OrionTabletHeader />
        </TabletNavigationProvider>
      );

      expect(html).toContain('ORION-9');
      expect(html).toContain('DEMO');
      expect(html).toContain('OPERATIONS WORKSPACE');
      // Invariant: Desktop horizontal nav menus (OPERATIONS INTELLIGENCE CONTROL) MUST NOT collide
      expect(html).not.toContain('id="desktop-nav-operations"');
    });

    it('renders Landscape Navigation Rail with 5 primary destinations and unread badge', () => {
      const html = renderToString(
        <TabletNavigationProvider>
          <OrionTabletNavRail isLandscapeMode={true} />
        </TabletNavigationProvider>
      );

      expect(html).toContain('data-orion-tablet-nav="rail"');
      expect(html).toContain('Home');
      expect(html).toContain('Control');
      expect(html).toContain('AI');
      expect(html).toContain('Alerts');
      expect(html).toContain('Apps');
      expect(html).toContain('3'); // unread badge
    });

    it('renders Portrait Bottom Navigation Bar with 5 primary destinations', () => {
      const html = renderToString(
        <TabletNavigationProvider>
          <OrionTabletNavRail isLandscapeMode={false} />
        </TabletNavigationProvider>
      );

      expect(html).toContain('data-orion-tablet-nav="bottom"');
      expect(html).toContain('Home');
      expect(html).toContain('Control');
      expect(html).toContain('AI');
      expect(html).toContain('Alerts');
      expect(html).toContain('Apps');
    });
  });

  describe('2. Tablet Screen Composition & Content Modules', () => {
    it('renders Tablet Command Center with 4-grid KPIs and live charts', () => {
      const html = renderToString(
        <TabletNavigationProvider>
          <OrionTabletHome />
        </TabletNavigationProvider>
      );

      expect(html).toContain('Supply Chain Command Center');
      expect(html).toContain('TABLET OS');
      expect(html).toContain('System Health Index');
      expect(html).toContain('Orders');
      expect(html).toContain('Inventory');
      expect(html).toContain('Shipments');
      expect(html).toContain('Exceptions');
      expect(html).toContain('ORION AI ASSISTANT');
    });

    it('renders Tablet Control Tower with disruption telemetry', () => {
      const html = renderToString(
        <TabletNavigationProvider>
          <OrionTabletControlTower />
        </TabletNavigationProvider>
      );

      expect(html).toContain('Orion Control Tower');
      expect(html).toContain('ACTIVE SCM CORE');
      expect(html).toContain('Network Health');
      expect(html).toContain('Critical Disruptions');
      expect(html).toContain('In-Transit Delays');
      expect(html).toContain('Purchase Order Volume');
      expect(html).toContain('Total Inventory On-Hand');
    });

    it('renders Tablet AI Copilot Workspace with SCM telemetry and quick prompt chips', () => {
      const html = renderToString(
        <TabletNavigationProvider>
          <OrionTabletAICopilot />
        </TabletNavigationProvider>
      );

      expect(html).toContain('ORION AI COPILOT');
      expect(html).toContain('Health:');
      expect(html).toContain('Critical:');
      expect(html).toContain('Delays:');
      expect(html).toContain('Stock:');
      expect(html).toContain('Show critical inventory risks');
      expect(html).toContain('Which purchase orders are delayed?');
    });

    it('renders Tablet App Launcher with 3-column enterprise categories and search', () => {
      const html = renderToString(
        <TabletNavigationProvider>
          <OrionTabletAppLauncher />
        </TabletNavigationProvider>
      );

      expect(html).toContain('Search 100+ Enterprise Apps...');
      expect(html).toContain('Operations &amp; Execution');
      expect(html).toContain('Deep SCM Intelligence');
      expect(html).toContain('Governed AI &amp; Automation');
    });

    it('renders Tablet Shell root container without desktop dock leakage', () => {
      const html = renderToString(<OrionTabletShell />);

      expect(html).toContain('data-orion-tablet-shell="true"');
      // Invariant: Desktop Dock MUST NOT exist in tablet shell
      expect(html).not.toContain('data-orion-dock="true"');
    });
  });
});
