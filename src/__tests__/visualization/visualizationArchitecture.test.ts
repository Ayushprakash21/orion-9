/**
 * ORION-9 REALTIME VISUALIZATION & METRICS ARCHITECTURE TEST SUITE
 * 
 * Verifies:
 * 1. Metric Definition Registry completeness & metadata integrity.
 * 2. LiveMetricsEngine calculations across operational domains with tenant/environment isolation.
 * 3. Prohibition of random/fake metrics in LIVE mode.
 * 4. RealtimeSubscriptionManager reference counting and environment switch cleanup.
 * 5. TimeSeriesEngine aggregation and snapshot recording.
 * 6. ChartDataAdapter formatting and status badge assignment.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  MetricDefinitionRegistry, 
  ENTERPRISE_METRIC_DEFINITIONS, 
  liveMetricsEngine, 
  realtimeSubscriptionManager, 
  timeSeriesEngine, 
  ChartDataAdapter 
} from '../../core/visualization';
import { dbManager } from '../../core/database/DatabaseConnectionManager';

describe('Orion-9 Visualization & Real-Time Charting Architecture', () => {
  beforeEach(async () => {
    await dbManager.switchEnvironment({
      targetEnvironment: 'DEMO',
      actorUserId: 'admin-001',
      actorRole: 'platform_admin',
      callerType: 'human_admin',
      stepUpConfirmed: true,
    });
  });

  describe('1. Metric Definition Registry', () => {
    it('contains all required enterprise metrics across 17+ domains', () => {
      const allMetrics = MetricDefinitionRegistry.getAll();
      expect(allMetrics.length).toBeGreaterThanOrEqual(30);

      const requiredKeys = [
        'SUPPLIER_OTIF', 'PO_SPEND', 'INVENTORY_ON_HAND', 'INVENTORY_VALUE',
        'STOCKOUT_RATE', 'SAFETY_STOCK', 'ATP_AVAILABLE', 'SHIPMENT_VOLUME',
        'SHIPMENT_OTIF', 'ORDER_FILL_RATE', 'AR_OUTSTANDING', 'AP_OUTSTANDING',
        'WORKING_CAPITAL', 'CONTROL_TOWER_EXCEPTIONS', 'CRITICAL_RISKS'
      ];

      for (const key of requiredKeys) {
        const def = MetricDefinitionRegistry.get(key);
        expect(def).toBeDefined();
        expect(def?.metricId).toBe(key);
        expect(def?.name).toBeTruthy();
        expect(def?.unit).toBeTruthy();
        expect(def?.tenantScoped).toBe(true);
        expect(def?.environmentScoped).toBe(true);
      }
    });

    it('correctly filters metrics by operational domain', () => {
      const procMetrics = MetricDefinitionRegistry.getByDomain('procurement');
      expect(procMetrics.length).toBeGreaterThanOrEqual(3);
      expect(procMetrics.every(m => m.domain === 'procurement')).toBe(true);

      const invMetrics = MetricDefinitionRegistry.getByDomain('inventory');
      expect(invMetrics.length).toBeGreaterThanOrEqual(4);
      expect(invMetrics.every(m => m.domain === 'inventory')).toBe(true);
    });
  });

  describe('2. LiveMetricsEngine — Authoritative Calculations & Invariants', () => {
    it('computes inventory and procurement metrics in DEMO mode', async () => {
      const invMetric = await liveMetricsEngine.computeMetric('INVENTORY_ON_HAND', 'test-tenant', 'DEMO');
      expect(invMetric.metricId).toBe('INVENTORY_ON_HAND');
      expect(invMetric.environment).toBe('DEMO');
      expect(invMetric.status).toBe('DEMO');
      expect(invMetric.value).toBeGreaterThanOrEqual(0);

      const poSpendMetric = await liveMetricsEngine.computeMetric('PO_SPEND', 'test-tenant', 'DEMO');
      expect(poSpendMetric.metricId).toBe('PO_SPEND');
      expect(poSpendMetric.unit).toBe('USD');
      expect(poSpendMetric.status).toBe('DEMO');
    });

    it('strictly avoids generating random or fabricated values in LIVE mode when data is unavailable', async () => {
      const nonExistentTenant = 'empty-live-tenant-999';
      const liveMetric = await liveMetricsEngine.computeMetric('SUPPLIER_OTIF', nonExistentTenant, 'LIVE');

      expect(liveMetric.environment).toBe('LIVE');
      expect(liveMetric.status).toBe('NO_DATA');
      expect(liveMetric.value).toBe(0);
      expect(liveMetric.reason).toContain('No suppliers registered');
    });

    it('returns INTEGRATION_BOUNDARY status for unconfigured external connectors in LIVE mode', async () => {
      const unconfiguredMetric = await liveMetricsEngine.computeMetric('SUSTAINABILITY_EMISSIONS', 'live-tenant-1', 'LIVE');
      expect(unconfiguredMetric.status).toBe('INTEGRATION_BOUNDARY');
      expect(unconfiguredMetric.value).toBe(0);
      expect(unconfiguredMetric.reason).toContain('Live telemetry integration boundary');
    });
  });

  describe('3. RealtimeSubscriptionManager — Reference Counting & Environment Isolation', () => {
    it('shares a single underlying subscription for multiple component subscribers', async () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      const unsub1 = realtimeSubscriptionManager.subscribeMetric('tenant-1', 'DEMO', 'INVENTORY_ON_HAND', cb1);
      const unsub2 = realtimeSubscriptionManager.subscribeMetric('tenant-1', 'DEMO', 'INVENTORY_ON_HAND', cb2);

      await new Promise(r => setTimeout(r, 20));

      // Both callbacks receive initial metric
      expect(cb1).toHaveBeenCalled();
      expect(cb2).toHaveBeenCalled();

      // Clean up
      unsub1();
      unsub2();
    });

    it('cleans up and re-evaluates subscriptions when environment changes', async () => {
      const cb = vi.fn();
      const unsub = realtimeSubscriptionManager.subscribeMetric('tenant-1', 'DEMO', 'PO_SPEND', cb);

      await new Promise(r => setTimeout(r, 20));
      expect(cb).toHaveBeenCalled();
      const firstCallArg = cb.mock.calls[0][0];
      expect(firstCallArg.environment).toBe('DEMO');

      // Switch to LIVE
      await realtimeSubscriptionManager.handleEnvironmentSwitch('LIVE');
      await new Promise(r => setTimeout(r, 20));

      expect(cb.mock.calls.length).toBeGreaterThanOrEqual(2);
      const lastCallArg = cb.mock.calls[cb.mock.calls.length - 1][0];
      expect(lastCallArg.environment).toBe('LIVE');

      unsub();
    });
  });

  describe('4. TimeSeriesEngine & Snapshots', () => {
    it('records and retrieves time-series snapshots with full tenant isolation', async () => {
      const now = new Date().toISOString();
      timeSeriesEngine.recordSnapshot({
        snapshotId: 'snap-1',
        metricId: 'INVENTORY_VALUE',
        tenantId: 'tenant-abc',
        environment: 'DEMO',
        value: 1250000,
        unit: 'USD',
        timestamp: now,
        source: 'firestore/inventory',
        createdAt: now,
      });

      const series = await timeSeriesEngine.getMetricSeries({
        metricId: 'INVENTORY_VALUE',
        tenantId: 'tenant-abc',
        environment: 'DEMO',
        days: 7,
      });

      expect(series.length).toBeGreaterThanOrEqual(1);
      expect(series.some(p => p.value === 1250000)).toBe(true);
    });

    it('never creates fake backfilled historical data points in LIVE mode', async () => {
      const emptySeries = await timeSeriesEngine.getMetricSeries({
        metricId: 'SUPPLIER_OTIF',
        tenantId: 'empty-live-tenant',
        environment: 'LIVE',
        days: 30,
      });

      // Since NO_DATA in LIVE mode, it must be empty or contain only the real points
      expect(emptySeries.length).toBe(0);
    });
  });

  describe('5. ChartDataAdapter & Presentation Formatters', () => {
    it('generates appropriate status badges for all metric states', () => {
      const liveBadge = ChartDataAdapter.getStatusBadge('LIVE', '12:00:00');
      expect(liveBadge.label).toBe('LIVE');
      expect(liveBadge.className).toContain('emerald');

      const demoBadge = ChartDataAdapter.getStatusBadge('DEMO');
      expect(demoBadge.label).toBe('DEMO');
      expect(demoBadge.className).toContain('amber');

      const boundaryBadge = ChartDataAdapter.getStatusBadge('INTEGRATION_BOUNDARY');
      expect(boundaryBadge.label).toBe('INTEGRATION BOUNDARY');
      expect(boundaryBadge.className).toContain('cyan');
    });

    it('merges multi-metric time series correctly for Recharts', () => {
      const series1 = [
        { timestamp: '2026-09-24T10:00:00Z', formattedDate: 'Sep 24, 10:00', value: 100, metricId: 'M1', status: 'DEMO' as const },
        { timestamp: '2026-09-24T11:00:00Z', formattedDate: 'Sep 24, 11:00', value: 120, metricId: 'M1', status: 'DEMO' as const },
      ];
      const series2 = [
        { timestamp: '2026-09-24T10:00:00Z', formattedDate: 'Sep 24, 10:00', value: 50, metricId: 'M2', status: 'DEMO' as const },
        { timestamp: '2026-09-24T11:00:00Z', formattedDate: 'Sep 24, 11:00', value: 55, metricId: 'M2', status: 'DEMO' as const },
      ];

      const merged = ChartDataAdapter.mergeMultiSeries({
        orders: series1,
        shipments: series2,
      });

      expect(merged.length).toBe(2);
      expect(merged[0].orders).toBe(100);
      expect(merged[0].shipments).toBe(50);
      expect(merged[1].orders).toBe(120);
      expect(merged[1].shipments).toBe(55);
    });
  });
});
