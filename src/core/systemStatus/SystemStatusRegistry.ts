/**
 * ORION-9 UNIFIED SYSTEM STATUS REGISTRY
 * Centralized registry for subsystem status providers, signals, and event dispatching.
 */

import {
  RuntimeSubsystemStatus,
  SchedulerSubsystemStatus,
  FirestoreSubsystemStatus,
  ListenerSubsystemStatus,
  FreshnessSubsystemStatus,
  GraphSubsystemStatus,
  AutomationSubsystemStatus,
} from './SystemStatusTypes';

export type ProviderFn<T> = (tenantId: string, environment: 'DEMO' | 'LIVE', orgId?: string) => Partial<T> | null;

export class SystemStatusRegistry {
  private static instance: SystemStatusRegistry;

  private runtimeProvider: ProviderFn<RuntimeSubsystemStatus> | null = null;
  private schedulerProvider: ProviderFn<SchedulerSubsystemStatus> | null = null;
  private firestoreProvider: ProviderFn<FirestoreSubsystemStatus> | null = null;
  private listenerProvider: ProviderFn<{
    inventory?: Partial<ListenerSubsystemStatus>;
    purchaseOrders?: Partial<ListenerSubsystemStatus>;
    shipments?: Partial<ListenerSubsystemStatus>;
    exceptions?: Partial<ListenerSubsystemStatus>;
    controlTower?: Partial<ListenerSubsystemStatus>;
  }> | null = null;
  private freshnessProvider: ProviderFn<{
    inventory?: Partial<FreshnessSubsystemStatus>;
    purchaseOrders?: Partial<FreshnessSubsystemStatus>;
    shipments?: Partial<FreshnessSubsystemStatus>;
    exceptions?: Partial<FreshnessSubsystemStatus>;
    controlTower?: Partial<FreshnessSubsystemStatus>;
  }> | null = null;
  private graphProvider: ProviderFn<GraphSubsystemStatus> | null = null;
  private automationProvider: ProviderFn<AutomationSubsystemStatus> | null = null;

  private subscribers: Set<() => void> = new Set();

  private constructor() {}

  public static getInstance(): SystemStatusRegistry {
    if (!SystemStatusRegistry.instance) {
      SystemStatusRegistry.instance = new SystemStatusRegistry();
    }
    return SystemStatusRegistry.instance;
  }

  public setRuntimeProvider(provider: ProviderFn<RuntimeSubsystemStatus> | null): void {
    this.runtimeProvider = provider;
    this.notify();
  }

  public getRuntimeOverride(tenantId: string, environment: 'DEMO' | 'LIVE', orgId?: string): Partial<RuntimeSubsystemStatus> | null {
    return this.runtimeProvider ? this.runtimeProvider(tenantId, environment, orgId) : null;
  }

  public setSchedulerProvider(provider: ProviderFn<SchedulerSubsystemStatus> | null): void {
    this.schedulerProvider = provider;
    this.notify();
  }

  public getSchedulerOverride(tenantId: string, environment: 'DEMO' | 'LIVE', orgId?: string): Partial<SchedulerSubsystemStatus> | null {
    return this.schedulerProvider ? this.schedulerProvider(tenantId, environment, orgId) : null;
  }

  public setFirestoreProvider(provider: ProviderFn<FirestoreSubsystemStatus> | null): void {
    this.firestoreProvider = provider;
    this.notify();
  }

  public getFirestoreOverride(tenantId: string, environment: 'DEMO' | 'LIVE', orgId?: string): Partial<FirestoreSubsystemStatus> | null {
    return this.firestoreProvider ? this.firestoreProvider(tenantId, environment, orgId) : null;
  }

  public setListenerProvider(provider: ProviderFn<{
    inventory?: Partial<ListenerSubsystemStatus>;
    purchaseOrders?: Partial<ListenerSubsystemStatus>;
    shipments?: Partial<ListenerSubsystemStatus>;
    exceptions?: Partial<ListenerSubsystemStatus>;
    controlTower?: Partial<ListenerSubsystemStatus>;
  }> | null): void {
    this.listenerProvider = provider;
    this.notify();
  }

  public getListenerOverride(tenantId: string, environment: 'DEMO' | 'LIVE', orgId?: string) {
    return this.listenerProvider ? this.listenerProvider(tenantId, environment, orgId) : null;
  }

  public setFreshnessProvider(provider: ProviderFn<{
    inventory?: Partial<FreshnessSubsystemStatus>;
    purchaseOrders?: Partial<FreshnessSubsystemStatus>;
    shipments?: Partial<FreshnessSubsystemStatus>;
    exceptions?: Partial<FreshnessSubsystemStatus>;
    controlTower?: Partial<FreshnessSubsystemStatus>;
  }> | null): void {
    this.freshnessProvider = provider;
    this.notify();
  }

  public getFreshnessOverride(tenantId: string, environment: 'DEMO' | 'LIVE', orgId?: string) {
    return this.freshnessProvider ? this.freshnessProvider(tenantId, environment, orgId) : null;
  }

  public setGraphProvider(provider: ProviderFn<GraphSubsystemStatus> | null): void {
    this.graphProvider = provider;
    this.notify();
  }

  public getGraphOverride(tenantId: string, environment: 'DEMO' | 'LIVE', orgId?: string): Partial<GraphSubsystemStatus> | null {
    return this.graphProvider ? this.graphProvider(tenantId, environment, orgId) : null;
  }

  public setAutomationProvider(provider: ProviderFn<AutomationSubsystemStatus> | null): void {
    this.automationProvider = provider;
    this.notify();
  }

  public getAutomationOverride(tenantId: string, environment: 'DEMO' | 'LIVE', orgId?: string): Partial<AutomationSubsystemStatus> | null {
    return this.automationProvider ? this.automationProvider(tenantId, environment, orgId) : null;
  }

  public subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public notify(): void {
    this.subscribers.forEach(cb => {
      try { cb(); } catch (e) {}
    });
  }

  public reset(): void {
    this.runtimeProvider = null;
    this.schedulerProvider = null;
    this.firestoreProvider = null;
    this.listenerProvider = null;
    this.freshnessProvider = null;
    this.graphProvider = null;
    this.automationProvider = null;
    this.notify();
  }
}

export const systemStatusRegistry = SystemStatusRegistry.getInstance();
