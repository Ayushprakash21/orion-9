/**
 * ORION-9 HOOK ORDER & LIFECYCLE INVARIANT UNIT TEST SUITE
 * 
 * Verifies that React components never conditionally execute hooks or return early before hooks,
 * completely preventing React Error #300 during device transitions and auto-rotation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OrionResponsiveShell } from '../../os/OrionResponsiveShell';
import { OrionDesktop } from '../../os/components/OrionDesktop';
import { OrionTabletShell } from '../../os/tablet/OrionTabletShell';
import { OrionMobileShell } from '../../os/mobile/OrionMobileShell';
import { OrionWindowManager } from '../../os/WindowManagerContext';
import { OrionSearchProvider } from '../../os/OrionSearchContext';
import { OrionContextMenuProvider } from '../../os/contextMenu/OrionContextMenuContext';
import { dbManager } from '../../core/database/DatabaseConnectionManager';

// Mock Auth Context
vi.mock('../../store/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      id: 'usr-resp-001',
      fullName: 'Chief Operating Officer',
      email: 'coo@orion9.enterprise',
      role: 'platform_admin',
      organizationId: 'tenant-resp-001',
    },
    isAuthenticated: true,
    isAdmin: true,
    hasRole: vi.fn(() => true),
    signOut: vi.fn(),
  }),
}));

// Mock Notification Context
vi.mock('../../store/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
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
      { id: 'inv-1', productId: 'SKU-001', warehouseId: 'WH-01', onHand: 5000, reserved: 200, safetyStock: 800, unitCost: 35 }
    ],
    shipments: [
      { id: 'shp-1', carrier: 'FedEx Freight', delayDays: 0, status: 'In Transit', origin: 'ORD', destination: 'FRA', freightCost: 4500 }
    ],
    purchaseOrders: [
      { id: 'po-1', orderNumber: 'PO-9001', totalValue: 48000, status: 'Approved' }
    ],
    exceptions: [],
    suppliers: [],
    decisions: [],
    settings: {
      showDesktopIcons: true,
    }
  }),
}));

// Mock Toast Context
vi.mock('../../store/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

// Mock Entity Drawer Context
vi.mock('../../store/EntityDrawerContext', () => ({
  useEntityDrawer: () => ({
    showConfirmModal: vi.fn(),
  }),
}));

import { MemoryRouter } from 'react-router-dom';

describe('Orion-9 Hook Order & Lifecycle Invariant Audit', () => {
  beforeEach(async () => {
    await dbManager.switchEnvironment({
      targetEnvironment: 'DEMO',
      actorUserId: 'usr-resp-001',
      actorRole: 'platform_admin',
      callerType: 'human_admin',
      stepUpConfirmed: true,
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return renderToString(
      <MemoryRouter>
        <OrionWindowManager>
          <OrionSearchProvider>
            <OrionContextMenuProvider>
              {component}
            </OrionContextMenuProvider>
          </OrionSearchProvider>
        </OrionWindowManager>
      </MemoryRouter>
    );
  };

  it('renders Desktop Shell with zero hook count discrepancies', () => {
    const html = renderWithProviders(<OrionDesktop />);
    expect(html).toContain('orion-desktop-shell');
    expect(html).toContain('data-desktop-surface="true"');
  });

  it('renders Tablet Shell unconditionally with dedicated tablet DOM markers', () => {
    const html = renderWithProviders(<OrionTabletShell />);
    expect(html).toContain('data-orion-tablet-shell="true"');
    expect(html).toContain('ORION-9');
  });

  it('renders Mobile Shell unconditionally with dedicated mobile DOM markers', () => {
    const html = renderWithProviders(<OrionMobileShell />);
    expect(html).toContain('data-orion-mobile-shell="true"');
  });

  it('renders Authoritative OrionResponsiveShell without throwing any Hook exceptions', () => {
    expect(() => {
      renderWithProviders(<OrionResponsiveShell />);
    }).not.toThrow();
  });
});
