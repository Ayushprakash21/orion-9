import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OrionMobileAICopilot } from '../../os/mobile/OrionMobileAICopilot';
import { OrionMobileAlerts } from '../../os/mobile/OrionMobileAlerts';
import { OrionMobileDetailSheet } from '../../os/mobile/OrionMobileDetailSheet';
import { MobileNavigationProvider } from '../../os/mobile/OrionMobileNavigation';
import { dbManager } from '../../core/database/DatabaseConnectionManager';

// Mock Auth Context
vi.mock('../../store/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      id: 'usr-mob-002',
      fullName: 'Operations Director',
      email: 'ops@orion9.enterprise',
      role: 'supply_chain_manager',
      organizationId: 'tenant-mob-002',
    },
    isAuthenticated: true,
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

// Mock Supply Chain Context
vi.mock('../../store/SupplyChainContext', () => ({
  useSupplyChain: () => ({
    currency: 'USD',
    inventory: [
      { id: 'inv-101', productId: 'SKU-TURBINE-01', warehouseId: 'WH-CENTRAL', onHand: 450, reserved: 100, safetyStock: 600, unitCost: 120 }
    ],
    shipments: [
      { id: 'shp-101', trackingNumber: 'TRK-9821', carrier: 'Maersk Line', delayDays: 4, status: 'Delayed', origin: 'SGP', destination: 'RTM', freightCost: 8200 }
    ],
    purchaseOrders: [
      { id: 'po-101', orderNumber: 'PO-8812', totalValue: 92000, status: 'Delayed' }
    ],
    exceptions: [
      { id: 'exc-101', title: 'Port Congestion at Rotterdam', severity: 'Critical', estimatedImpact: 45000, status: 'Active', entityId: 'SHP-101', description: 'Container vessel delayed by 4 days due to berth congestion.', recommendation: 'Reroute secondary feeder vessels to Antwerp.' }
    ],
    suppliers: [
      { id: 'sup-101', name: 'Precision Motors AG', otif: 78, riskLevel: 'High', country: 'DE' }
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

describe('Orion-9 Mobile Navigation, Workflows & Telemetry Integration', () => {
  beforeEach(async () => {
    await dbManager.switchEnvironment({
      targetEnvironment: 'DEMO',
      actorUserId: 'admin-mob-002',
      actorRole: 'platform_admin',
      callerType: 'human_admin',
      stepUpConfirmed: true,
    });
  });

  it('renders Governed AI Copilot with live telemetry integration', () => {
    const html = renderToString(
      <MobileNavigationProvider>
        <OrionMobileAICopilot />
      </MobileNavigationProvider>
    );

    expect(html).toContain('ORION AI');
    expect(html).toContain('Health:');
    expect(html).toContain('Critical:');
    expect(html).toContain('Delays:');
    expect(html).toContain('Stock:');
    // Quick Actions
    expect(html).toContain('Show critical inventory risks');
    expect(html).toContain('Which purchase orders are delayed?');
  });

  it('renders Mobile Alerts stream with severity chips and impact calculations', () => {
    const html = renderToString(
      <MobileNavigationProvider>
        <OrionMobileAlerts />
      </MobileNavigationProvider>
    );

    expect(html).toContain('Operational Alerts &amp; Risks');
    expect(html).toContain('CRITICAL');
    expect(html).toContain('HIGH');
    expect(html).toContain('Port Congestion at Rotterdam');
  });

  it('preserves multi-tenant and DEMO/LIVE environment isolation', async () => {
    const htmlDemo = renderToString(
      <MobileNavigationProvider>
        <OrionMobileAICopilot />
      </MobileNavigationProvider>
    );
    expect(htmlDemo).toContain('DEMO');

    await dbManager.switchEnvironment({
      targetEnvironment: 'LIVE',
      actorUserId: 'admin-mob-002',
      actorRole: 'platform_admin',
      callerType: 'human_admin',
      stepUpConfirmed: true,
    });

    const htmlLive = renderToString(
      <MobileNavigationProvider>
        <OrionMobileAICopilot />
      </MobileNavigationProvider>
    );
    expect(htmlLive).toContain('LIVE');
  });
});
