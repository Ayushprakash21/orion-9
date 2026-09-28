import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SystemStatusModal } from '../../components/modals/SystemStatusModal';
import {
  ORION_CHART_COLORS,
  InventoryRealtimeGraphSuite,
  ProcurementRealtimeGraphSuite,
  LogisticsRealtimeGraphSuite,
  ManufacturingRealtimeGraphSuite,
  FinanceRealtimeGraphSuite,
  ControlTowerRealtimeGraphSuite
} from '../../core/visualization/RealtimeGraphFabric';
import { realtimeSubscriptionManager } from '../../core/visualization/RealtimeSubscriptionManager';
import { DemoPersistentSchedulerService } from '../../services/demo/DemoPersistentSchedulerService';

// Mock ConnectivityContext
vi.mock('../../store/ConnectivityContext', () => ({
  useConnectivity: () => ({
    isOnline: true,
    statusLabel: 'Operational',
    isLocalMode: false,
  }),
}));

// Mock ResponsiveContainer for server-side testing of Recharts
vi.mock('recharts', async () => {
  const actual = await vi.importActual<any>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => React.createElement('div', { className: 'recharts-responsive-container' }, children),
  };
});

describe('System Status Modal & Real-Time Visualization Fabric Specification', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. SystemStatusModal Subsystem Health & Diagnostics', () => {
    it('renders all 8 operational health layers truthfully', () => {
      const html = renderToString(React.createElement(SystemStatusModal, {
        isOpen: true,
        onClose: vi.fn(),
      }));

      // 8 Subsystems Matrix
      expect(html).toContain('1. Runtime');
      expect(html).toContain('2. Firestore');
      expect(html).toContain('3. Cloud Scheduler');
      expect(html).toContain('4. Listeners');
      expect(html).toContain('5. Data Freshness');
      expect(html).toContain('6. Real-Time Graphs');
      expect(html).toContain('7. Automation');
      expect(html).toContain('8. System Status');

      // Derived status badge
      expect(html).toMatch(/OPERATIONAL|DEGRADED/);
    });

    it('renders tabs for deep diagnostic inspection', () => {
      const html = renderToString(React.createElement(SystemStatusModal, {
        isOpen: true,
        onClose: vi.fn(),
      }));

      expect(html).toContain('Overview &amp; Subsystems');
      expect(html).toContain('Firestore &amp; Listeners');
      expect(html).toContain('Cloud Scheduler');
      expect(html).toContain('Data Freshness &amp; Graphs');
    });
  });

  describe('2. RealtimeGraphFabric Palette Consistency', () => {
    it('provides standardized semantic OS chart colors', () => {
      expect(ORION_CHART_COLORS.series1).toBe('#30D158'); // Green / Healthy
      expect(ORION_CHART_COLORS.series2).toBe('#0A84FF'); // Blue / In-Transit / Orders
      expect(ORION_CHART_COLORS.series3).toBe('#FF9F0A'); // Amber / Warning
      expect(ORION_CHART_COLORS.series4).toBe('#FF453A'); // Red / Critical
      expect(ORION_CHART_COLORS.series5).toBe('#BF5AF2'); // Purple / Finance / Asset
      expect(ORION_CHART_COLORS.series6).toBe('#64D2FF'); // Cyan / ATP / Available
    });
  });

  describe('3. Command Center Graph Suites', () => {
    it('renders InventoryRealtimeGraphSuite with data and fallback on empty', () => {
      // Empty data fallback
      const emptyHtml = renderToString(React.createElement(InventoryRealtimeGraphSuite, {
        inventory: [],
        warehouses: [],
        exceptions: [],
      }));
      expect(emptyHtml).toContain('NO DATA AVAILABLE');

      // With authoritative records
      const filledHtml = renderToString(React.createElement(InventoryRealtimeGraphSuite, {
        inventory: [
          { id: 'INV-1', productId: 'SKU-100', onHand: 500, reserved: 100, safetyStock: 80, unitCost: 25 },
          { id: 'INV-2', productId: 'SKU-200', onHand: 200, reserved: 50, safetyStock: 40, unitCost: 50 },
        ],
        warehouses: [{ id: 'WH-1', name: 'Main Hub' }],
        exceptions: [],
      }));
      expect(filledHtml).toContain('Inventory Positioning Trend');
      expect(filledHtml).toContain('Inventory Health State');
      expect(filledHtml).toContain('Warehouse Asset Valuation');
    });

    it('renders ProcurementRealtimeGraphSuite with pipeline and supplier performance', () => {
      const html = renderToString(React.createElement(ProcurementRealtimeGraphSuite, {
        purchaseOrders: [
          { id: 'PO-1', supplierId: 'SUP-1', status: 'CONFIRMED', totalValue: 45000 },
          { id: 'PO-2', supplierId: 'SUP-2', status: 'Draft', totalValue: 12000 },
        ],
        suppliers: [
          { id: 'SUP-1', name: 'Acme Corp', otifScore: 96, qualityRating: 98 },
        ],
      }));

      expect(html).toContain('Procurement Pipeline Funnel');
      expect(html).toContain('Committed PO Spend Stages');
      expect(html).toContain('Supplier On-Time &amp; Quality');
      expect(html).toContain('Lead Time &amp; Cycle Milestones');
      expect(html).toContain('Top Supplier Spend Ranking');
    });

    it('renders LogisticsRealtimeGraphSuite with freight pipeline and valuation', () => {
      const html = renderToString(React.createElement(LogisticsRealtimeGraphSuite, {
        shipments: [
          { id: 'SH-1', status: 'IN_TRANSIT', declaredValue: 80000, transitDays: 3 },
          { id: 'SH-2', status: 'DELIVERED', declaredValue: 40000, transitDays: 2 },
        ],
      }));

      expect(html).toContain('Global Freight Pipeline');
      expect(html).toContain('In-Transit Freight Valuation');
      expect(html).toContain('Transit Reliability Split');
    });

    it('renders ManufacturingRealtimeGraphSuite with work orders and OEE', () => {
      const html = renderToString(React.createElement(ManufacturingRealtimeGraphSuite, {
        workOrders: [
          { id: 'WO-1', orderNumber: 'WO-101', plannedQuantity: 100, completedQuantity: 95, scrapQuantity: 2, status: 'In Production' },
        ],
      }));

      expect(html).toContain('Work Order Output vs Planned');
      expect(html).toContain('Work-in-Progress (WIP) Stages');
      expect(html).toContain('Equipment Effectiveness (OEE)');
    });

    it('renders FinanceRealtimeGraphSuite with cash flow and AP aging', () => {
      const html = renderToString(React.createElement(FinanceRealtimeGraphSuite, {
        invoices: [
          { id: 'INV-1', amount: 50000, daysOutstanding: 15 },
          { id: 'INV-2', amount: 20000, daysOutstanding: 45 },
        ],
        purchaseOrders: [
          { id: 'PO-1', totalValue: 60000 },
        ],
      }));

      expect(html).toContain('Working Capital &amp; Cash Flow');
      expect(html).toContain('Accounts Payable (AP) Aging');
      expect(html).toContain('Category Spend vs Budget');
    });

    it('renders ControlTowerRealtimeGraphSuite with network health index and risk radar', () => {
      const html = renderToString(React.createElement(ControlTowerRealtimeGraphSuite, {
        kpis: { networkHealthScore: 96.5 },
        exceptions: [
          { id: 'EX-1', severity: 'CRITICAL', type: 'Shortage' },
          { id: 'EX-2', severity: 'HIGH', type: 'Delay' },
        ],
      }));

      expect(html).toContain('Network Health Index Trend');
      expect(html).toContain('Active Disruptions by Severity');
      expect(html).toContain('Multi-Domain Risk Radar');
    });
  });
});
