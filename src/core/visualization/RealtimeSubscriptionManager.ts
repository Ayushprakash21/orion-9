/**
 * ORION-9 REALTIME SUBSCRIPTION MANAGER
 * 
 * Shared metric subscription registry with reference counting, automatic deduplication,
 * environment switching cleanup, and reactive Event Fabric integration.
 */

import { GovernedMetricValue, liveMetricsEngine } from './LiveMetricsEngine';
import { DatabaseEnvironmentMode } from '../database/DatabaseEnvironment';
import { dbManager } from '../database/DatabaseConnectionManager';

export type MetricSubscriptionCallback = (metric: GovernedMetricValue) => void;

interface ActiveSubscriptionEntry {
  key: string;
  tenantId: string;
  environment: DatabaseEnvironmentMode;
  metricId: string;
  callbacks: Set<MetricSubscriptionCallback>;
  lastValue?: GovernedMetricValue;
  timerId?: any;
}

export class RealtimeSubscriptionManager {
  private static instance: RealtimeSubscriptionManager;
  private subscriptions: Map<string, ActiveSubscriptionEntry> = new Map();

  private constructor() {
    this.initGlobalListeners();
  }

  public static getInstance(): RealtimeSubscriptionManager {
    if (!RealtimeSubscriptionManager.instance) {
      RealtimeSubscriptionManager.instance = new RealtimeSubscriptionManager();
    }
    return RealtimeSubscriptionManager.instance;
  }

  private initGlobalListeners() {
    if (typeof window === 'undefined') return;

    // 1. Environment Switch Listener: teardown old environment listeners, reinitialize
    window.addEventListener('orion-database-environment-changed', (e: any) => {
      const newEnv: DatabaseEnvironmentMode = e.detail?.environment || dbManager.getEnvironment();
      this.handleEnvironmentSwitch(newEnv);
    });

    // 2. Event Fabric & Invalidation Triggers
    const handleDataEvent = () => {
      this.refreshAllActiveSubscriptions();
    };

    window.addEventListener('orion:data-imported', handleDataEvent);
    window.addEventListener('orion:desktop-refresh', handleDataEvent);
    window.addEventListener('orion:synthetic-batch-generated', handleDataEvent);
    window.addEventListener('orion:demo-data-reset', handleDataEvent);
    window.addEventListener('orion:transaction-created', handleDataEvent);
  }

  /**
   * Subscribe a chart/component to live metric updates.
   * Multiple callers for the same (tenantId, environment, metricId) share the pipeline.
   * Returns a teardown function.
   */
  public subscribeMetric(
    tenantId: string,
    environment: DatabaseEnvironmentMode,
    metricId: string,
    callback: MetricSubscriptionCallback
  ): () => void {
    const key = `${tenantId}:${environment}:${metricId}`;

    let entry = this.subscriptions.get(key);
    if (!entry) {
      entry = {
        key,
        tenantId,
        environment,
        metricId,
        callbacks: new Set(),
      };
      this.subscriptions.set(key, entry);

      // Trigger initial calculation
      this.executeMetricFetch(entry);
    }

    entry.callbacks.add(callback);

    // If we already have a cached value, deliver it immediately
    if (entry.lastValue) {
      callback(entry.lastValue);
    }

    // Teardown function (Reference counted)
    return () => {
      const currentEntry = this.subscriptions.get(key);
      if (currentEntry) {
        currentEntry.callbacks.delete(callback);
        if (currentEntry.callbacks.size === 0) {
          if (currentEntry.timerId) {
            clearInterval(currentEntry.timerId);
          }
          this.subscriptions.delete(key);
        }
      }
    };
  }

  private async executeMetricFetch(entry: ActiveSubscriptionEntry) {
    try {
      const metric = await liveMetricsEngine.computeMetric(entry.metricId, entry.tenantId, entry.environment);
      entry.lastValue = metric;
      entry.callbacks.forEach(cb => {
        try {
          cb(metric);
        } catch (err) {
          console.error(`[RealtimeSubscriptionManager] Callback error on metric ${entry.metricId}:`, err);
        }
      });
    } catch (err) {
      console.error(`[RealtimeSubscriptionManager] Failed calculating ${entry.metricId}:`, err);
    }
  }

  /**
   * Refresh all active subscriptions across the OS (e.g. after transaction or batch generation).
   */
  public async refreshAllActiveSubscriptions() {
    const entries = Array.from(this.subscriptions.values());
    await Promise.all(entries.map(entry => this.executeMetricFetch(entry)));
  }

  /**
   * Handle environment switch: clear old environment state, re-evaluate active subscriptions.
   */
  public async handleEnvironmentSwitch(newEnv: DatabaseEnvironmentMode) {
    const allEntries = Array.from(this.subscriptions.values());
    this.subscriptions.clear();

    for (const oldEntry of allEntries) {
      const newKey = `${oldEntry.tenantId}:${newEnv}:${oldEntry.metricId}`;
      const newEntry: ActiveSubscriptionEntry = {
        key: newKey,
        tenantId: oldEntry.tenantId,
        environment: newEnv,
        metricId: oldEntry.metricId,
        callbacks: oldEntry.callbacks,
      };
      this.subscriptions.set(newKey, newEntry);
      this.executeMetricFetch(newEntry);
    }
  }
}

export const realtimeSubscriptionManager = RealtimeSubscriptionManager.getInstance();
