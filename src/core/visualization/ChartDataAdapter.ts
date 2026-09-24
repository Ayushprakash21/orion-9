/**
 * ORION-9 CHART DATA ADAPTER
 * 
 * Prepares and formats live operational metrics and time-series for Recharts UI components.
 * Enforces strict color palettes, statuses, and tooltips.
 */

import { MetricDefinitionRegistry } from './MetricDefinitionRegistry';
import { GovernedMetricValue, MetricValueStatus } from './LiveMetricsEngine';
import { TimeSeriesPoint } from './TimeSeriesEngine';
import { formatCurrency, formatNumber, formatPercentage } from '../../lib/formatters';

export interface ChartStatusBadge {
  label: string;
  className: string;
  tooltip: string;
}

export class ChartDataAdapter {
  public static getStatusBadge(status: MetricValueStatus, lastUpdated?: string): ChartStatusBadge {
    switch (status) {
      case 'LIVE':
        return {
          label: 'LIVE',
          className: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]',
          tooltip: `Authoritative Live Production Data. Last updated: ${lastUpdated || 'now'}`,
        };
      case 'DEMO':
        return {
          label: 'DEMO',
          className: 'bg-amber-950/80 text-amber-400 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.2)]',
          tooltip: 'Governed Synthetic Simulation Environment',
        };
      case 'STALE':
        return {
          label: 'STALE',
          className: 'bg-purple-950/80 text-purple-400 border-purple-500/50',
          tooltip: 'Metric telemetry has not refreshed in over 30 minutes',
        };
      case 'INTEGRATION_BOUNDARY':
        return {
          label: 'INTEGRATION BOUNDARY',
          className: 'bg-cyan-950/80 text-cyan-400 border-cyan-500/50',
          tooltip: 'External ERP/Carrier integration connector not yet configured',
        };
      case 'NO_DATA':
      default:
        return {
          label: 'NO DATA',
          className: 'bg-slate-900 text-slate-400 border-slate-700',
          tooltip: 'No operational records available for selected tenant context',
        };
    }
  }

  public static formatMetricValue(value: number, metricId: string): string {
    const def = MetricDefinitionRegistry.get(metricId);
    if (!def) return formatNumber(value);

    if (def.unit === 'USD') {
      return formatCurrency(value);
    }
    if (def.unit === '%') {
      return `${value.toFixed(1)}%`;
    }
    if (def.unit === 'days' || def.unit === 'hours') {
      return `${value} ${def.unit}`;
    }
    return `${formatNumber(value)} ${def.unit}`;
  }

  /**
   * Merge multiple time series arrays into a single unified time-aligned chart payload.
   */
  public static mergeMultiSeries(seriesMap: Record<string, TimeSeriesPoint[]>): any[] {
    const timeMap = new Map<string, any>();

    for (const [key, points] of Object.entries(seriesMap)) {
      points.forEach(p => {
        if (!timeMap.has(p.formattedDate)) {
          timeMap.set(p.formattedDate, {
            formattedDate: p.formattedDate,
            timestamp: p.timestamp,
          });
        }
        const row = timeMap.get(p.formattedDate);
        row[key] = p.value;
      });
    }

    return Array.from(timeMap.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }
}
