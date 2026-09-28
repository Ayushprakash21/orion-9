/**
 * ORION-9 CENTRAL REAL-TIME STATE STORE
 * 
 * Exposes authoritative live state across canonical domains:
 * - Inventory
 * - Purchase Orders
 * - Shipments
 * - Exceptions
 * - Control Tower
 * 
 * Provides truthful connection and telemetry status:
 * - LOADING
 * - CONNECTED
 * - STALE
 * - ERROR
 * - EMPTY
 * - OFFLINE
 * 
 * Enforces strict reference counting, deduplication, tenant isolation,
 * and DEMO/LIVE environment separation.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  realtimeSubscriptionManager, 
  RealtimeSubscriptionState, 
  RealtimeDomain, 
  TruthfulConnectionState, 
  ControlTowerRealtimeState, 
  getTruthfulConnectionState 
} from './RealtimeSubscriptionManager';
import { DatabaseEnvironmentMode } from '../database/DatabaseEnvironment';
import { dbManager } from '../database/DatabaseConnectionManager';
import { useAuth } from '../../store/AuthContext';
import { Inventory, PurchaseOrder, Shipment, Exception } from '../../types';

export interface DomainRealtimeSnapshot<T> {
  data: T[];
  state: RealtimeSubscriptionState | null;
  status: TruthfulConnectionState;
  lastUpdated: string | null;
  error: string | null;
  loading: boolean;
}

export interface RealtimeStoreSnapshot {
  tenantId: string;
  environment: DatabaseEnvironmentMode;
  inventory: DomainRealtimeSnapshot<Inventory>;
  purchaseOrders: DomainRealtimeSnapshot<PurchaseOrder>;
  shipments: DomainRealtimeSnapshot<Shipment>;
  exceptions: DomainRealtimeSnapshot<Exception>;
  controlTower: ControlTowerRealtimeState | null;
  overallStatus: TruthfulConnectionState;
  loading: boolean;
}

export class RealtimeStateStore {
  private static instance: RealtimeStateStore;

  private constructor() {
    this.initStore();
  }

  public static getInstance(): RealtimeStateStore {
    if (!RealtimeStateStore.instance) {
      RealtimeStateStore.instance = new RealtimeStateStore();
    }
    return RealtimeStateStore.instance;
  }

  private initStore(): void {
    // Listen for system events to keep store synchronized
    if (typeof window !== 'undefined') {
      window.addEventListener('orion:auth-logout', () => {
        this.cleanup();
      });
    }
  }

  /**
   * Subscribe to Inventory live updates (Section 3)
   */
  public subscribeInventory(
    tenantId: string,
    environment: DatabaseEnvironmentMode,
    callback: (items: Inventory[], state: RealtimeSubscriptionState) => void,
    organizationId?: string
  ): () => void {
    return realtimeSubscriptionManager.subscribeInventory(tenantId, environment, callback, organizationId);
  }

  /**
   * Subscribe to Purchase Orders live updates (Section 4)
   */
  public subscribePurchaseOrders(
    tenantId: string,
    environment: DatabaseEnvironmentMode,
    callback: (orders: PurchaseOrder[], state: RealtimeSubscriptionState) => void,
    organizationId?: string
  ): () => void {
    return realtimeSubscriptionManager.subscribePurchaseOrders(tenantId, environment, callback, organizationId);
  }

  /**
   * Subscribe to Shipments live updates (Section 5)
   */
  public subscribeShipments(
    tenantId: string,
    environment: DatabaseEnvironmentMode,
    callback: (shipments: Shipment[], state: RealtimeSubscriptionState) => void,
    organizationId?: string
  ): () => void {
    return realtimeSubscriptionManager.subscribeShipments(tenantId, environment, callback, organizationId);
  }

  /**
   * Subscribe to Exceptions live updates (Section 6)
   */
  public subscribeExceptions(
    tenantId: string,
    environment: DatabaseEnvironmentMode,
    callback: (exceptions: Exception[], state: RealtimeSubscriptionState) => void,
    organizationId?: string
  ): () => void {
    return realtimeSubscriptionManager.subscribeExceptions(tenantId, environment, callback, organizationId);
  }

  /**
   * Subscribe to Control Tower live aggregation (Section 7)
   */
  public subscribeControlTower(
    tenantId: string,
    environment: DatabaseEnvironmentMode,
    callback: (state: ControlTowerRealtimeState) => void,
    organizationId?: string
  ): () => void {
    return realtimeSubscriptionManager.subscribeControlTower(tenantId, environment, callback, organizationId);
  }

  /**
   * Synchronous Getters
   */
  public getInventory(tenantId: string, environment?: DatabaseEnvironmentMode): Inventory[] {
    return realtimeSubscriptionManager.getDomainData<Inventory>('inventory', tenantId, environment);
  }

  public getPurchaseOrders(tenantId: string, environment?: DatabaseEnvironmentMode): PurchaseOrder[] {
    return realtimeSubscriptionManager.getDomainData<PurchaseOrder>('purchase_orders', tenantId, environment);
  }

  public getShipments(tenantId: string, environment?: DatabaseEnvironmentMode): Shipment[] {
    return realtimeSubscriptionManager.getDomainData<Shipment>('shipments', tenantId, environment);
  }

  public getExceptions(tenantId: string, environment?: DatabaseEnvironmentMode): Exception[] {
    return realtimeSubscriptionManager.getDomainData<Exception>('exceptions', tenantId, environment);
  }

  public getDomainStatus(domain: RealtimeDomain, tenantId: string, environment?: DatabaseEnvironmentMode): TruthfulConnectionState {
    const state = realtimeSubscriptionManager.getSubscriptionState(domain, tenantId, environment);
    return getTruthfulConnectionState(state);
  }

  public getOverallStatus(tenantId: string, environment?: DatabaseEnvironmentMode): TruthfulConnectionState {
    const domains: RealtimeDomain[] = ['inventory', 'purchase_orders', 'shipments', 'exceptions'];
    const statuses = domains.map(d => this.getDomainStatus(d, tenantId, environment));

    if (statuses.some(s => s === 'ERROR')) return 'ERROR';
    if (statuses.some(s => s === 'LOADING')) return 'LOADING';
    if (statuses.every(s => s === 'CONNECTED')) return 'CONNECTED';
    if (statuses.some(s => s === 'CONNECTED')) return 'CONNECTED';
    if (statuses.every(s => s === 'EMPTY')) return 'EMPTY';
    if (statuses.every(s => s === 'STALE')) return 'STALE';
    return 'OFFLINE';
  }

  /**
   * Teardown all store resources
   */
  public cleanup(): void {
    realtimeSubscriptionManager.cleanupUserSubscriptions();
  }
}

export const realtimeStateStore = RealtimeStateStore.getInstance();

/**
 * React Hook for full central realtime state (Section 8)
 */
export function useRealtimeStore(customTenantId?: string): RealtimeStoreSnapshot {
  const { currentUser } = useAuth();
  const effectiveTenantId = customTenantId || currentUser?.organizationId || 'default-tenant';
  const environment = dbManager.getEnvironment();

  const [inventory, setInventory] = useState<DomainRealtimeSnapshot<Inventory>>({
    data: realtimeStateStore.getInventory(effectiveTenantId, environment),
    state: realtimeSubscriptionManager.getSubscriptionState('inventory', effectiveTenantId, environment),
    status: realtimeStateStore.getDomainStatus('inventory', effectiveTenantId, environment),
    lastUpdated: null,
    error: null,
    loading: true,
  });

  const [purchaseOrders, setPurchaseOrders] = useState<DomainRealtimeSnapshot<PurchaseOrder>>({
    data: realtimeStateStore.getPurchaseOrders(effectiveTenantId, environment),
    state: realtimeSubscriptionManager.getSubscriptionState('purchase_orders', effectiveTenantId, environment),
    status: realtimeStateStore.getDomainStatus('purchase_orders', effectiveTenantId, environment),
    lastUpdated: null,
    error: null,
    loading: true,
  });

  const [shipments, setShipments] = useState<DomainRealtimeSnapshot<Shipment>>({
    data: realtimeStateStore.getShipments(effectiveTenantId, environment),
    state: realtimeSubscriptionManager.getSubscriptionState('shipments', effectiveTenantId, environment),
    status: realtimeStateStore.getDomainStatus('shipments', effectiveTenantId, environment),
    lastUpdated: null,
    error: null,
    loading: true,
  });

  const [exceptions, setExceptions] = useState<DomainRealtimeSnapshot<Exception>>({
    data: realtimeStateStore.getExceptions(effectiveTenantId, environment),
    state: realtimeSubscriptionManager.getSubscriptionState('exceptions', effectiveTenantId, environment),
    status: realtimeStateStore.getDomainStatus('exceptions', effectiveTenantId, environment),
    lastUpdated: null,
    error: null,
    loading: true,
  });

  const [controlTower, setControlTower] = useState<ControlTowerRealtimeState | null>(null);

  useEffect(() => {
    // 1. Subscribe to Inventory
    const unsubInv = realtimeStateStore.subscribeInventory(
      effectiveTenantId,
      environment,
      (data, state) => {
        setInventory({
          data,
          state,
          status: getTruthfulConnectionState(state),
          lastUpdated: state.lastSnapshotAt,
          error: state.error,
          loading: state.status === 'CONNECTING',
        });
      }
    );

    // 2. Subscribe to Purchase Orders
    const unsubPos = realtimeStateStore.subscribePurchaseOrders(
      effectiveTenantId,
      environment,
      (data, state) => {
        setPurchaseOrders({
          data,
          state,
          status: getTruthfulConnectionState(state),
          lastUpdated: state.lastSnapshotAt,
          error: state.error,
          loading: state.status === 'CONNECTING',
        });
      }
    );

    // 3. Subscribe to Shipments
    const unsubShip = realtimeStateStore.subscribeShipments(
      effectiveTenantId,
      environment,
      (data, state) => {
        setShipments({
          data,
          state,
          status: getTruthfulConnectionState(state),
          lastUpdated: state.lastSnapshotAt,
          error: state.error,
          loading: state.status === 'CONNECTING',
        });
      }
    );

    // 4. Subscribe to Exceptions
    const unsubExc = realtimeStateStore.subscribeExceptions(
      effectiveTenantId,
      environment,
      (data, state) => {
        setExceptions({
          data,
          state,
          status: getTruthfulConnectionState(state),
          lastUpdated: state.lastSnapshotAt,
          error: state.error,
          loading: state.status === 'CONNECTING',
        });
      }
    );

    // 5. Subscribe to Control Tower
    const unsubCt = realtimeStateStore.subscribeControlTower(
      effectiveTenantId,
      environment,
      (ctState) => {
        setControlTower(ctState);
      }
    );

    return () => {
      unsubInv();
      unsubPos();
      unsubShip();
      unsubExc();
      unsubCt();
    };
  }, [effectiveTenantId, environment]);

  const overallStatus = useMemo(() => {
    return realtimeStateStore.getOverallStatus(effectiveTenantId, environment);
  }, [effectiveTenantId, environment, inventory.status, purchaseOrders.status, shipments.status, exceptions.status]);

  const loading = inventory.loading || purchaseOrders.loading || shipments.loading || exceptions.loading;

  return {
    tenantId: effectiveTenantId,
    environment,
    inventory,
    purchaseOrders,
    shipments,
    exceptions,
    controlTower,
    overallStatus,
    loading,
  };
}
