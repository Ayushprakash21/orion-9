/**
 * ORION-9 LIVE CHART SERIES REACT HOOK
 * 
 * Provides unified time-series data streams for multiple enterprise metrics.
 * Connects directly to TimeSeriesEngine and RealtimeSubscriptionManager.
 */

import { useState, useEffect, useCallback } from 'react';
import { timeSeriesEngine, TimeSeriesPoint } from './TimeSeriesEngine';
import { ChartDataAdapter } from './ChartDataAdapter';
import { liveMetricsEngine, GovernedMetricValue } from './LiveMetricsEngine';
import { useAuth } from '../../store/AuthContext';
import { dbManager } from '../database/DatabaseConnectionManager';

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

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('orion:synthetic-batch-generated', handleUpdate);
    window.addEventListener('orion:data-imported', handleUpdate);
    window.addEventListener('orion:desktop-refresh', handleUpdate);
    window.addEventListener('orion-database-environment-changed', handleUpdate);

    return () => {
      window.removeEventListener('orion:synthetic-batch-generated', handleUpdate);
      window.removeEventListener('orion:data-imported', handleUpdate);
      window.removeEventListener('orion:desktop-refresh', handleUpdate);
      window.removeEventListener('orion-database-environment-changed', handleUpdate);
    };
  }, [loadData]);

  return { chartData, metricValues, loading, refresh: loadData };
}
