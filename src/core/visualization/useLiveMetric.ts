/**
 * ORION-9 LIVE METRIC REACT HOOK
 * 
 * Provides reactive subscription to a governed enterprise metric.
 * Automatically handles deduplication, tenant isolation, environment switching, and cleanup.
 */

import { useState, useEffect, useCallback } from 'react';
import { GovernedMetricValue, liveMetricsEngine } from './LiveMetricsEngine';
import { realtimeSubscriptionManager } from './RealtimeSubscriptionManager';
import { useAuth } from '../../store/AuthContext';
import { dbManager } from '../database/DatabaseConnectionManager';

export function useLiveMetric(metricId: string, customTenantId?: string) {
  const { currentUser } = useAuth();
  const effectiveTenantId = customTenantId || currentUser?.organizationId || 'default-tenant';
  const environment = dbManager.getEnvironment();

  const [metric, setMetric] = useState<GovernedMetricValue | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const val = await liveMetricsEngine.computeMetric(metricId, effectiveTenantId, environment);
      setMetric(val);
    } finally {
      setLoading(false);
    }
  }, [metricId, effectiveTenantId, environment]);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = realtimeSubscriptionManager.subscribeMetric(
      effectiveTenantId,
      environment,
      metricId,
      (updatedMetric) => {
        setMetric(updatedMetric);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [metricId, effectiveTenantId, environment]);

  return { metric, loading, refresh };
}
