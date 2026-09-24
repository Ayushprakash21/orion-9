/**
 * ORION-9 AUTHORITATIVE TIME SERIES ENGINE
 * 
 * Provides governed time-series data aggregation, snapshot persistence, and windowing.
 * ZERO FAKE HISTORICAL BACKFILLS.
 */

import { DatabaseEnvironmentMode } from '../database/DatabaseEnvironment';
import { liveMetricsEngine } from './LiveMetricsEngine';
import { format, subDays, subHours } from 'date-fns';

export interface TimeSeriesQuery {
  metricId: string;
  tenantId: string;
  environment: DatabaseEnvironmentMode;
  days?: number;
  hours?: number;
  interval?: 'hour' | 'day' | 'week';
}

export interface TimeSeriesPoint {
  timestamp: string;
  formattedDate: string;
  value: number;
  metricId: string;
  status: 'LIVE' | 'DEMO' | 'NO_DATA';
}

export interface MetricSnapshotRecord {
  snapshotId: string;
  metricId: string;
  tenantId: string;
  environment: DatabaseEnvironmentMode;
  value: number;
  unit: string;
  timestamp: string;
  source: string;
  createdAt: string;
}

export class TimeSeriesEngine {
  private static instance: TimeSeriesEngine;
  private inMemorySnapshots: Map<string, MetricSnapshotRecord[]> = new Map();

  private constructor() {}

  public static getInstance(): TimeSeriesEngine {
    if (!TimeSeriesEngine.instance) {
      TimeSeriesEngine.instance = new TimeSeriesEngine();
    }
    return TimeSeriesEngine.instance;
  }

  /**
   * Record a governed KPI snapshot for time-series persistence.
   */
  public recordSnapshot(snapshot: MetricSnapshotRecord) {
    const key = `${snapshot.tenantId}:${snapshot.environment}:${snapshot.metricId}`;
    if (!this.inMemorySnapshots.has(key)) {
      this.inMemorySnapshots.set(key, []);
    }
    const list = this.inMemorySnapshots.get(key)!;
    list.push(snapshot);
    if (list.length > 500) {
      list.shift(); // Keep bounded memory
    }
  }

  /**
   * Retrieve authoritative time series series for a metric over requested window.
   */
  public async getMetricSeries(query: TimeSeriesQuery): Promise<TimeSeriesPoint[]> {
    const { metricId, tenantId, environment, days = 14 } = query;
    const currentMetric = await liveMetricsEngine.computeMetric(metricId, tenantId, environment);

    const points: TimeSeriesPoint[] = [];
    const now = new Date();

    // Check if we have recorded historical snapshots
    const key = `${tenantId}:${environment}:${metricId}`;
    const snapshots = this.inMemorySnapshots.get(key) || [];

    if (snapshots.length > 0) {
      return snapshots.map(s => ({
        timestamp: s.timestamp,
        formattedDate: format(new Date(s.timestamp), 'MMM dd, HH:mm'),
        value: s.value,
        metricId,
        status: s.environment === 'LIVE' ? 'LIVE' : 'DEMO',
      }));
    }

    // If in LIVE mode and no snapshots exist yet: return only the current authoritative data point
    if (environment === 'LIVE') {
      if (currentMetric.status === 'NO_DATA') {
        return [];
      }
      return [{
        timestamp: currentMetric.calculatedAt,
        formattedDate: format(new Date(currentMetric.calculatedAt), 'MMM dd, HH:mm'),
        value: currentMetric.value,
        metricId,
        status: 'LIVE',
      }];
    }

    // In DEMO mode: derive deterministic, governed historical baseline anchored to the current value
    const baseValue = currentMetric.value;
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dayFactor = ((i % 5) - 2) * (baseValue * 0.02); // Deterministic variance (+/- 4%)
      const value = Math.max(0, Math.round(baseValue + dayFactor));

      points.push({
        timestamp: date.toISOString(),
        formattedDate: format(date, 'MMM dd'),
        value,
        metricId,
        status: 'DEMO',
      });
    }

    return points;
  }
}

export const timeSeriesEngine = TimeSeriesEngine.getInstance();
