/**
 * ORION-9 LIVE CHART SERIES REACT HOOK
 * 
 * Provides unified time-series data streams for multiple enterprise metrics.
 * Connects directly to TimeSeriesEngine and RealtimeSubscriptionManager.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { timeSeriesEngine, TimeSeriesPoint } from './TimeSeriesEngine';
import { ChartDataAdapter } from './ChartDataAdapter';
import { liveMetricsEngine, GovernedMetricValue } from './LiveMetricsEngine';
import { realtimeSubscriptionManager, RealtimeDomain } from './RealtimeSubscriptionManager';
import { MetricDefinitionRegistry } from './MetricDefinitionRegistry';
import { useAuth } from '../../store/AuthContext';
import { dbManager } from '../database/DatabaseConnectionManager';

const METRIC_DOMAIN_LOOKUP: Record<string, RealtimeDomain> = {
  INVENTORY_ON_HAND: 'inventory',
  INVENTORY_VALUE: 'inventory',
  STOCKOUT_RATE: 'inventory',
  SAFETY_STOCK: 'inventory',
  INVENTORY_TURNS: 'inventory',
  ATP_AVAILABLE: 'inventory',
  DAYS_OF_SUPPLY: 'inventory',
  INVENTORY_HEALTH: 'inventory',

  PO_SPEND: 'purchase_orders',
  PO_CYCLE_TIME: 'purchase_orders',
  PO_VOLUME: 'purchase_orders',
  PO_CONFIRMATION_RATE: 'purchase_orders',

  SHIPMENT_VOLUME: 'shipments',
  IN_TRANSIT_VALUE: 'shipments',
  SHIPMENT_OTIF: 'shipments',
  ON_TIME_TRANSIT_RATE: 'shipments',

  CONTROL_TOWER_EXCEPTIONS: 'exceptions',
  CRITICAL_RISKS: 'exceptions',
  NETWORK_HEALTH_INDEX: 'exceptions',
  EXCEPTION_RESOLUTION_TIME: 'exceptions',
};

export function useLiveChartSeries(metricIds: string[], days: number = 14, customTenantId?: string) {
  const { currentUser } = useAuth();
  const effectiveTenantId = customTenantId || currentUser?.organizationId || 'default-tenant';
  const environment = dbManager.getEnvironment();

  const [chartData, setChartData] = useState<any[]>([]);
  const [metricValues, setMetricValues] = useState<Record<string, GovernedMetricValue>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const seriesMap: Record<string, TimeSeriesPoint[]> = {};
      const valuesMap: Record<string, GovernedMetricValue> = {};

      await Promise.all(
        metricIds.map(async (metricId) => {
          const [series, metricVal] = await Promise.all([
            timeSeriesEngine.getMetricSeries({
              metricId,
              tenantId: effectiveTenantId,
              environment,
              days,
            }),
            liveMetricsEngine.computeMetric(metricId, effectiveTenantId, environment),
          ]);
          seriesMap[metricId] = series;
          valuesMap[metricId] = metricVal;
        })
      );

      const merged = ChartDataAdapter.mergeMultiSeries(seriesMap);
      setChartData(merged);
      setMetricValues(valuesMap);
    } catch (err) {
      console.error('[useLiveChartSeries] Error fetching time series:', err);
    } finally {
      setLoading(false);
    }
  }, [metricIds, days, effectiveTenantId, environment]);

  // Determine unique domains affected by these metrics
  const affectedDomains = useMemo(() => {
    const domains = new Set<RealtimeDomain>();
    metricIds.forEach(id => {
      const d = METRIC_DOMAIN_LOOKUP[id];
      if (d) {
        domains.add(d);
      } else {
        const def = MetricDefinitionRegistry.get(id);
        if (def?.domain === 'inventory') domains.add('inventory');
        else if (def?.domain === 'procurement') domains.add('purchase_orders');
        else if (def?.domain === 'logistics') domains.add('shipments');
        else if (def?.domain === 'risk' || def?.domain === 'control_tower') domains.add('exceptions');
      }
    });
    return Array.from(domains);
  }, [metricIds]);

  useEffect(() => {
    loadData();

    // 1. Subscribe to each affected domain in RealtimeSubscriptionManager
    const unsubs: Array<() => void> = [];
    affectedDomains.forEach(domain => {
      const unsub = realtimeSubscriptionManager.subscribeDomain(
        domain,
        effectiveTenantId,
        environment,
        () => {
          loadData();
        }
      );
      unsubs.push(unsub);
    });

    // 2. Also listen for window events
    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('orion:realtime-domain-updated', handleUpdate);
    window.addEventListener('orion:synthetic-batch-generated', handleUpdate);
    window.addEventListener('orion:data-imported', handleUpdate);
    window.addEventListener('orion:desktop-refresh', handleUpdate);
    window.addEventListener('orion-database-environment-changed', handleUpdate);

    return () => {
      unsubs.forEach(u => {
        try { u(); } catch (e) {}
      });
      window.removeEventListener('orion:realtime-domain-updated', handleUpdate);
      window.removeEventListener('orion:synthetic-batch-generated', handleUpdate);
      window.removeEventListener('orion:data-imported', handleUpdate);
      window.removeEventListener('orion:desktop-refresh', handleUpdate);
      window.removeEventListener('orion-database-environment-changed', handleUpdate);
    };
  }, [loadData, affectedDomains, effectiveTenantId, environment]);

  return { chartData, metricValues, loading, refresh: loadData };
}
