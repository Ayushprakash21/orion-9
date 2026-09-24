/**
 * ORION-9 DATABASE CONNECTION MANAGER & ENVIRONMENT RESOLVER
 * Controls multi-environment Firestore provider resolution, listener lifecycle,
 * cache namespacing, outbox validation, and governed environment switching.
 */

import {
  DatabaseEnvironmentMode,
  DatabaseEnvironmentConfig,
  DatabaseEnvironmentState,
  DatabaseConnectionStatus,
  LIVE_DATABASE_CONFIG,
  DEMO_DATABASE_CONFIG,
  EnvironmentSwitchRequest,
  EnvironmentSwitchResult,
} from './DatabaseEnvironment';
import { getFirebaseFirestore, getFirebaseAuth } from '../../lib/firebaseClient';
import { Firestore, doc, getDoc, setDoc } from 'firebase/firestore';

const STORAGE_ENV_KEY = 'orion9_database_environment';

export class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager;
  private currentEnvironment: DatabaseEnvironmentMode = 'LIVE';
  private firestoreInstance: Firestore | null = null;
  private activeListeners: Map<string, () => void> = new Map();
  private inMemoryCache: Map<string, any> = new Map();
  private lastVerifiedAt: string = new Date().toISOString();
  private measuredLatencyMs: number = 0;
  private connectionStatus: DatabaseConnectionStatus = 'CONNECTED';
  private lastError: string | null = null;

  private constructor() {
    this.restorePersistedEnvironment();
    this.initDatabaseProvider();
  }

  public static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager();
    }
    return DatabaseConnectionManager.instance;
  }

  private restorePersistedEnvironment(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem(STORAGE_ENV_KEY);
        if (saved === 'DEMO' || saved === 'LIVE') {
          this.currentEnvironment = saved;
        }
      } catch (e) {}
    }
  }

  private initDatabaseProvider(): void {
    try {
      this.firestoreInstance = getFirebaseFirestore(this.currentEnvironment);
      this.connectionStatus = 'CONNECTED';
      this.lastError = null;
    } catch (err: any) {
      this.connectionStatus = 'DEGRADED';
      this.lastError = err?.message || 'Database initialization notice';
      this.firestoreInstance = null;
    }
  }

  public getEnvironment(): DatabaseEnvironmentMode {
    return this.currentEnvironment;
  }

  public getConfig(): DatabaseEnvironmentConfig {
    return this.currentEnvironment === 'LIVE' ? LIVE_DATABASE_CONFIG : DEMO_DATABASE_CONFIG;
  }

  public getFirestore(environment?: DatabaseEnvironmentMode): Firestore | null {
    if (environment && environment !== this.currentEnvironment) {
      return getFirebaseFirestore(environment);
    }
    return this.firestoreInstance;
  }

  /**
   * Generates strictly namespaced cache keys to prevent cross-environment pollution.
   * Format: orion9:{environment}:{tenant}:{collection}:{id}
   */
  public getCacheKey(tenantId: string, collection: string, id: string): string {
    const env = this.currentEnvironment.toLowerCase();
    const cleanTenant = tenantId || 'global';
    return `orion9:${env}:${cleanTenant}:${collection}:${id}`;
  }

  /**
   * Memory cache read with environment isolation
   */
  public getCached<T>(tenantId: string, collection: string, id: string): T | null {
    const key = this.getCacheKey(tenantId, collection, id);
    return this.inMemoryCache.get(key) || null;
  }

  /**
   * Memory cache write with environment isolation
   */
  public setCached<T>(tenantId: string, collection: string, id: string, data: T): void {
    const key = this.getCacheKey(tenantId, collection, id);
    this.inMemoryCache.set(key, data);
  }

  /**
   * Memory cache clear for active environment
   */
  public clearEnvironmentCache(): void {
    const prefix = `orion9:${this.currentEnvironment.toLowerCase()}:`;
    for (const key of Array.from(this.inMemoryCache.keys())) {
      if (key.startsWith(prefix)) {
        this.inMemoryCache.delete(key);
      }
    }
  }

  /**
   * Register active Firestore listener to ensure clean teardown on environment switch
   */
  public registerListener(listenerId: string, unsubscribe: () => void): void {
    if (this.activeListeners.has(listenerId)) {
      try {
        this.activeListeners.get(listenerId)!();
      } catch (e) {}
    }
    this.activeListeners.set(listenerId, unsubscribe);
  }

  /**
   * Unregister and invoke a specific listener
   */
  public unregisterListener(listenerId: string): void {
    const unsub = this.activeListeners.get(listenerId);
    if (unsub) {
      try {
        unsub();
      } catch (e) {}
      this.activeListeners.delete(listenerId);
    }
  }

  /**
   * Cleanly terminate all active snapshot listeners to prevent cross-environment memory leaks
   */
  public unregisterAllListeners(): number {
    const count = this.activeListeners.size;
    this.activeListeners.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {}
    });
    this.activeListeners.clear();
    return count;
  }

  /**
   * Validates outbox payload environment matches active database environment before replay.
   * Strictly blocks DEMO -> LIVE and LIVE -> DEMO replays.
   */
  public validateOutboxPayload(payload: { environment?: string; tenantId: string }): boolean {
    if (!payload.environment) {
      console.error('[DB-OUTBOX-GUARD] Outbox payload rejected: missing environment tag.');
      return false;
    }
    if (payload.environment !== this.currentEnvironment) {
      console.error(
        `[DB-OUTBOX-GUARD] Environment mismatch rejection: payload belongs to ${payload.environment}, active environment is ${this.currentEnvironment}`
      );
      return false;
    }
    return true;
  }

  /**
   * Privileged Environment Switching with Kernel Authorization & Safety Checks
   */
  public async switchEnvironment(request: EnvironmentSwitchRequest): Promise<EnvironmentSwitchResult> {
    const { targetEnvironment, actorRole, callerType, stepUpConfirmed } = request;

    // 1. Block AI Agents from switching database environments
    if (callerType === 'ai_agent') {
      const err = '[DB-GUARD] AI Agents are strictly denied permission to alter database environments.';
      console.error(err);
      return {
        success: false,
        previousEnvironment: this.currentEnvironment,
        currentEnvironment: this.currentEnvironment,
        switchedAt: new Date().toISOString(),
        listenersRecreatedCount: 0,
        cacheNamespace: this.getConfig().cachePrefix,
        error: err,
      };
    }

    // 2. Block Non-Administrators
    const isPlatformAdmin = actorRole === 'platform_admin' || actorRole === 'super_admin';
    const isOrgAdmin = actorRole === 'organization_admin';
    if (!isPlatformAdmin && !isOrgAdmin) {
      const err = '[DB-GUARD] Unauthorized attempt: Only platform and organization administrators may switch database environments.';
      console.error(err);
      return {
        success: false,
        previousEnvironment: this.currentEnvironment,
        currentEnvironment: this.currentEnvironment,
        switchedAt: new Date().toISOString(),
        listenersRecreatedCount: 0,
        cacheNamespace: this.getConfig().cachePrefix,
        error: err,
      };
    }

    // 3. Step-Up Verification required for switching TO LIVE
    if (targetEnvironment === 'LIVE' && !stepUpConfirmed) {
      const err = '[DB-GUARD] Step-up confirmation is required before switching to the LIVE database environment.';
      console.error(err);
      return {
        success: false,
        previousEnvironment: this.currentEnvironment,
        currentEnvironment: this.currentEnvironment,
        switchedAt: new Date().toISOString(),
        listenersRecreatedCount: 0,
        cacheNamespace: this.getConfig().cachePrefix,
        error: err,
      };
    }

    // 4. Perform Clean Environment Transition
    const prev = this.currentEnvironment;
    const listenersClosed = this.unregisterAllListeners();
    this.clearEnvironmentCache();

    this.currentEnvironment = targetEnvironment;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_ENV_KEY, targetEnvironment);
      } catch (e) {}
    }

    this.initDatabaseProvider();
    await this.testConnectivity();

    // 5. Broadcast system-wide event for UI reactive updates
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('orion-database-environment-changed', {
            detail: {
              previous: prev,
              current: targetEnvironment,
              config: this.getConfig(),
              timestamp: new Date().toISOString(),
            },
          })
        );
      } catch (e) {}
    }

    return {
      success: true,
      previousEnvironment: prev,
      currentEnvironment: targetEnvironment,
      switchedAt: new Date().toISOString(),
      listenersRecreatedCount: listenersClosed,
      cacheNamespace: this.getConfig().cachePrefix,
    };
  }

  /**
   * Real latency measurement and connectivity probe on active environment
   */
  public async testConnectivity(): Promise<DatabaseEnvironmentState> {
    const start = performance.now();
    try {
      if (this.firestoreInstance) {
        const pingRef = doc(this.firestoreInstance, 'system_status', 'ping');
        await getDoc(pingRef);
      }
      this.measuredLatencyMs = Math.round(performance.now() - start);
      this.connectionStatus = 'CONNECTED';
      this.lastError = null;
    } catch (err: any) {
      this.measuredLatencyMs = Math.round(performance.now() - start);
      if (err?.code === 'permission-denied') {
        this.connectionStatus = 'PERMISSION_DENIED';
      } else if (err?.code === 'unauthenticated') {
        this.connectionStatus = 'AUTHENTICATION_REQUIRED';
      } else {
        this.connectionStatus = 'DEGRADED';
      }
      this.lastError = err?.message || 'Connectivity check error';
    }
    this.lastVerifiedAt = new Date().toISOString();

    return this.getState();
  }

  public getState(activeTenantId: string = 'ORION_PLATFORM', activeOrgId: string = 'ORG_GLOBAL'): DatabaseEnvironmentState {
    return {
      environment: this.currentEnvironment,
      config: this.getConfig(),
      status: this.connectionStatus,
      activeTenantId,
      activeOrganizationId: activeOrgId,
      activeListenersCount: this.activeListeners.size,
      lastVerifiedAt: this.lastVerifiedAt,
      measuredLatencyMs: this.measuredLatencyMs,
      lastError: this.lastError,
    };
  }
}

export const dbManager = DatabaseConnectionManager.getInstance();
