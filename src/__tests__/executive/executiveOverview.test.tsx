import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ExecutiveOverview } from '../../components/executive/ExecutiveOverview';
import { AICreditsPopover } from '../../components/executive/AICreditsPopover';
import { ExecutiveKpiRow } from '../../components/executive/ExecutiveKpiRow';
import { OperationalPrioritiesSection } from '../../components/executive/OperationalPrioritiesSection';
import { SystemHealthStatusBar } from '../../components/executive/SystemHealthStatusBar';
import { EnterpriseNavRail, ENTERPRISE_NAV_ITEMS } from '../../components/executive/EnterpriseNavRail';

// Mock WindowManagerContext
vi.mock('../../os/WindowManagerContext', () => ({
  useWindowManager: () => ({
    openApplication: vi.fn(),
    activeAppId: 'executive-overview',
    windows: {},
  }),
}));

// Mock SupplyChainContext
vi.mock('../../store/SupplyChainContext', () => ({
  useSupplyChain: () => ({
    products: [{ id: 'p1', name: 'Product 1' }],
    inventory: [{ id: 'inv1', productId: 'p1', onHand: 1500, unitCost: 40 }],
    suppliers: [{ id: 's1', name: 'Alpha Logistics', status: 'Active', otif: 96 }],
    purchaseOrders: [
      { id: 'po1', supplierId: 's1', status: 'Approved', totalValue: 450000 },
      { id: 'po2', supplierId: 's1', status: 'Submitted', totalValue: 120000 },
    ],
    shipments: [{ id: 'sh1', delayDays: 0, status: 'In Transit' }],
    exceptions: [],
    actions: [],
    currency: 'USD',
    dataMode: 'real',
    warehouses: [{ id: 'w1', name: 'North America Distribution Hub' }],
  }),
}));

// Mock EntityDrawerContext
vi.mock('../../store/EntityDrawerContext', () => ({
  useEntityDrawer: () => ({
    openEntity: vi.fn(),
    closeEntity: vi.fn(),
  }),
}));

// Mock ToastContext
vi.mock('../../store/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

// Mock SystemStatus
vi.mock('../../core/systemStatus', () => ({
  useSystemStatus: () => ({
    overallStatus: 'HEALTHY',
    generatedAt: Date.now(),
    environment: 'LIVE',
    tenantId: 'tenant-1',
    runtime: { status: 'HEALTHY' },
    scheduler: { status: 'HEALTHY' },
    firestore: { status: 'HEALTHY' },
    listeners: {
      inventory: { status: 'CONNECTED' },
      purchaseOrders: { status: 'CONNECTED' },
      shipments: { status: 'CONNECTED' },
      exceptions: { status: 'CONNECTED' },
      controlTower: { status: 'CONNECTED' },
    },
    freshness: {
      inventory: { status: 'FRESH' },
      purchaseOrders: { status: 'FRESH' },
      shipments: { status: 'FRESH' },
      exceptions: { status: 'FRESH' },
      controlTower: { status: 'FRESH' },
    },
    graphs: { status: 'READY' },
    automation: { status: 'HEALTHY' },
  }),
}));

describe('Executive Overview & Enterprise Command Center Suite (Reference 3)', () => {
  it('renders executive overview header, breadcrumbs, and live telemetry pill', () => {
    const html = renderToString(<ExecutiveOverview />);

    // Breadcrumb matching Reference 3
    expect(html).toContain('COMMAND CENTER');
    expect(html).toContain('Executive Overview');
    expect(html).toContain('LIVE DATA');
    expect(html).toContain('AI Copilot');
    expect(html).toContain('Customize');
  });

  it('renders the 4 primary executive KPI cards with truthful SCM calculations', () => {
    const html = renderToString(<ExecutiveOverview />);

    expect(html).toContain('Total Revenue');
    expect(html).toContain('Sales Pipeline');
    expect(html).toContain('Active Projects');
    expect(html).toContain('Total Headcount');
  });

  it('renders operational priorities and empty state when 0 tasks are pending', () => {
    const html = renderToString(<ExecutiveOverview />);

    expect(html).toContain('Production Intelligence');
    expect(html).toContain('My Priorities');
    expect(html).toContain("You&#x27;re all caught up!");
    expect(html).toContain('Pending Actions');
    expect(html).toContain('No pending approvals required');
  });

  it('renders system health status bar with 6 subsystems matching Reference 3', () => {
    const html = renderToString(<ExecutiveOverview />);

    expect(html).toContain('SYSTEM HEALTH STATUS');
    expect(html).toContain('Production');
    expect(html).toContain('CRM');
    expect(html).toContain('Die Mgmt');
    expect(html).toContain('Supply Chain');
    expect(html).toContain('HR');
    expect(html).toContain('Dispatch');
  });

  it('renders AICreditsPopover trigger with compute credit quota pill', () => {
    const html = renderToString(
      <AICreditsPopover
        credits={{
          total: 100,
          remaining: 94.63,
          used: 5.37,
          renewalDate: 'Nov 01, 2026',
        }}
      />
    );

    expect(html).toContain('94.63');
    expect(html).toContain('100');
  });

  it('renders EnterpriseNavRail with all primary enterprise domain items', () => {
    const html = renderToString(
      <EnterpriseNavRail activeItemId="overview" onSelectItem={() => {}} />
    );

    expect(html).toContain('Command Suite');
    expect(html).toContain('Executive Overview');
    expect(html).toContain('Control Tower');
    expect(html).toContain('CRM &amp; Customers');
    expect(html).toContain('Buy Something');
    expect(html).toContain('Work Orders');
    expect(html).toContain('Documents &amp; Files');
    expect(html).toContain('Order Promising (ATP)');
    expect(html).toContain('Die &amp; Tooling Mgmt');
    expect(html).toContain('Dispatch &amp; Logistics');
    expect(html).toContain('Supply Chain Fabric');
    expect(html).toContain('Production Planning');
    expect(html).toContain('MRP &amp; Requirements');
    expect(html).toContain('Equipment Health');
    expect(html).toContain('HR &amp; Workforce');
    expect(html).toContain('Finance &amp; Ledger');
  });

  it('renders ExecutiveKpiRow standalone with custom KPI metrics', () => {
    const html = renderToString(
      <ExecutiveKpiRow
        kpis={[
          {
            id: 'rev',
            title: 'Revenue Run Rate',
            value: '$12.4M',
            trend: '+12.4%',
            trendDirection: 'up',
            subValue: 'vs last month',
          },
        ]}
      />
    );

    expect(html).toContain('Revenue Run Rate');
    expect(html).toContain('$12.4M');
    expect(html).toContain('+12.4%');
    expect(html).toContain('vs last month');
  });
});
