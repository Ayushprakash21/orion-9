/**
 * ORION-9 SCM PERSISTENCE SERVICE
 * Authoritative persistence layer for all SCM entities via Cloud Firestore
 * with LocalForage/IndexedDB offline read cache and strict tenant isolation.
 */

import { getFirebaseFirestore } from '../../lib/firebaseClient';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Firestore,
} from 'firebase/firestore';
import { db, loadData, saveData } from '../../data/db';
import { InventoryTransactionRecord, InventoryTransactionType } from '../../scm/types';
import { Inventory } from '../../types';
import { DatabaseConnectionManager } from '../../core/database/DatabaseConnectionManager';
import { sanitizeFirestorePayload, validateDesktopItemRecord } from '../../core/database/firestoreSanitizer';

export class ScmPersistenceService {
  private static instance: ScmPersistenceService;
  private memoryCache: Map<string, any> = new Map();
  private firestore: Firestore | null = null;

  private constructor() {
    this.initFirestore();
  }

  public static getInstance(): ScmPersistenceService {
    if (!ScmPersistenceService.instance) {
      ScmPersistenceService.instance = new ScmPersistenceService();
    }
    return ScmPersistenceService.instance;
  }

  private initFirestore(): void {
    try {
      this.firestore = getFirebaseFirestore();
    } catch (err) {
      // In non-Firebase test environments, gracefully use in-memory and local cache
      this.firestore = null;
    }
  }

  private getCacheKey(collectionName: string, tenantId: string, id: string): string {
    return `${collectionName}:${tenantId}:${id}`;
  }

  /**
   * Authoritatively save an entity to Cloud Firestore, memory cache, and offline storage.
   */
  public async saveRecord<T extends { tenantId: string }>(
    collectionName: string,
    id: string,
    data: T
  ): Promise<T> {
    if (!id) {
      throw new Error(`[SCM-VALIDATION-ERROR] Document id is required for ${collectionName}`);
    }
    if (!data || !data.tenantId) {
      throw new Error(`[SCM-VALIDATION-ERROR] tenantId is required for ${collectionName}/${id}`);
    }

    // Collection-specific contract validation
    if (collectionName === 'desktop_items') {
      validateDesktopItemRecord(data);
    }

    // Sanitize payload: strip any undefined fields and reject non-serializable objects
    const sanitizedData = sanitizeFirestorePayload(data, `${collectionName}/${id}`);

    const env = DatabaseConnectionManager.getInstance().getEnvironment();
    if (env === 'LIVE') {
      const firestoreInstance = DatabaseConnectionManager.getInstance().getFirestore('LIVE') || this.firestore;
      if (!firestoreInstance) {
        throw new Error(`[SCM-AUTHORITATIVE-ERROR] LIVE environment requested but Firestore instance is unavailable for ${collectionName}/${id}. Unpersisted writes are rejected.`);
      }
      try {
        const ref = doc(firestoreInstance, collectionName, id);
        await setDoc(ref, sanitizedData, { merge: true });
      } catch (err: any) {
        console.error(`[SCM-PERSISTENCE] Authoritative Firestore write failed for ${collectionName}/${id}:`, err);
        throw new Error(`[SCM-AUTHORITATIVE-ERROR] Firestore persistence failed for ${collectionName}/${id}: ${err?.message || err}`);
      }
    }

    const key = this.getCacheKey(collectionName, data.tenantId, id);
    this.memoryCache.set(key, sanitizedData);

    // Offline cache sync (read cache & local persistence)
    try {
      await this.syncToOfflineCache(collectionName, data.tenantId);
    } catch {
      // Local cache silent fallback
    }

    return sanitizedData as T;
  }

  /**
   * Retrieve a single record by collection and ID, enforcing strict tenant isolation.
   */
  public async getRecord<T extends { tenantId: string }>(
    collectionName: string,
    tenantId: string,
    id: string
  ): Promise<T | null> {
    const key = this.getCacheKey(collectionName, tenantId, id);
    if (this.memoryCache.has(key)) {
      const cached = this.memoryCache.get(key) as T;
      if (cached.tenantId === tenantId) {
        return cached;
      }
    }

    const currentEnv = DatabaseConnectionManager.getInstance().getEnvironment();
    if (currentEnv === 'LIVE' && this.firestore) {
      try {
        const ref = doc(this.firestore, collectionName, id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as T;
          if (data.tenantId === tenantId) {
            this.memoryCache.set(key, data);
            return data;
          }
          console.warn(`[SCM-PERSISTENCE] Tenant isolation violation: ${id} belongs to ${data.tenantId}, not ${tenantId}`);
          return null;
        }
      } catch (err) {
        console.warn(`[SCM-PERSISTENCE] Firestore read failed for ${collectionName}/${id}, falling back to cache.`, err);
      }
    }

    // Hydrate single record from offline LocalForage store if available
    const store = (db as any)[collectionName];
    if (store) {
      try {
        const offlineRecords = await loadData<T>(store);
        if (Array.isArray(offlineRecords)) {
          const match = offlineRecords.find(item => item && item.tenantId === tenantId && ((item as any).id === id || (item as any).targetId === id));
          if (match) {
            this.memoryCache.set(key, match);
            return match;
          }
        }
      } catch {
        // Fall back
      }
    }

    return null;
  }

  /**
   * List all records in a collection for a given tenant.
   */
  public async listRecords<T extends { tenantId: string }>(
    collectionName: string,
    tenantId: string
  ): Promise<T[]> {
    const currentEnv = DatabaseConnectionManager.getInstance().getEnvironment();
    if (currentEnv === 'LIVE' && this.firestore) {
      try {
        const colRef = collection(this.firestore, collectionName);
        const q = query(colRef, where('tenantId', '==', tenantId));
        const snap = await getDocs(q);
        const results: T[] = [];
        snap.forEach((d) => {
          const item = d.data() as T;
          const key = this.getCacheKey(collectionName, tenantId, (item as any).id || (item as any)[Object.keys(item)[0]]);
          this.memoryCache.set(key, item);
          results.push(item);
        });
        if (results.length > 0) {
          return results;
        }
      } catch (err) {
        // Fall back to memory cache
      }
    }

    const cached = this.listCachedRecords<T>(collectionName, tenantId);
    if (cached.length > 0) {
      return cached;
    }

    // Hydrate from LocalForage offline storage when memory cache is empty (e.g. after page refresh)
    const store = (db as any)[collectionName];
    if (store) {
      try {
        const offlineRecords = await loadData<T>(store);
        if (Array.isArray(offlineRecords) && offlineRecords.length > 0) {
          for (const item of offlineRecords) {
            if (item && item.tenantId === tenantId) {
              const itemId = (item as any).id || (item as any)[Object.keys(item)[0]];
              if (itemId) {
                const key = this.getCacheKey(collectionName, tenantId, itemId);
                this.memoryCache.set(key, item);
              }
            }
          }
          return this.listCachedRecords<T>(collectionName, tenantId);
        }
      } catch (err) {
        console.warn(`[SCM-PERSISTENCE] Offline hydration failed for ${collectionName}:`, err);
      }
    }

    return [];
  }

  /**
   * Delete a record by collection, tenantId, and ID.
   */
  public async deleteRecord(
    collectionName: string,
    tenantId: string,
    id: string
  ): Promise<boolean> {
    const currentEnv = DatabaseConnectionManager.getInstance().getEnvironment();
    if (currentEnv === 'LIVE') {
      const firestoreInstance = DatabaseConnectionManager.getInstance().getFirestore('LIVE') || this.firestore;
      if (!firestoreInstance) {
        throw new Error(`[SCM-AUTHORITATIVE-ERROR] LIVE environment requested but Firestore instance is unavailable for delete ${collectionName}/${id}.`);
      }
      try {
        const ref = doc(firestoreInstance, collectionName, id);
        await deleteDoc(ref);
      } catch (err: any) {
        console.error(`[SCM-PERSISTENCE] Firestore delete failed for ${collectionName}/${id}:`, err);
        throw new Error(`[SCM-AUTHORITATIVE-ERROR] Firestore delete failed for ${collectionName}/${id}: ${err?.message || err}`);
      }
    }

    const key = this.getCacheKey(collectionName, tenantId, id);
    this.memoryCache.delete(key);
    try {
      await this.syncToOfflineCache(collectionName, tenantId);
    } catch {
      // Local cache silent fallback
    }
    return true;
  }

  /**
   * Synchronous cached retrieval for fast UI reads.
   */
  public getCachedRecord<T extends { tenantId: string }>(
    collectionName: string,
    tenantId: string,
    id: string
  ): T | undefined {
    const key = this.getCacheKey(collectionName, tenantId, id);
    const item = this.memoryCache.get(key);
    return item && item.tenantId === tenantId ? item : undefined;
  }

  /**
   * Synchronous cached list for fast UI reads.
   */
  public listCachedRecords<T extends { tenantId: string }>(
    collectionName: string,
    tenantId: string
  ): T[] {
    const prefix = `${collectionName}:${tenantId}:`;
    const results: T[] = [];
    for (const [k, v] of this.memoryCache.entries()) {
      if (k.startsWith(prefix) && v.tenantId === tenantId) {
        results.push(v);
      }
    }
    return results;
  }

  /**
   * Authoritative inventory stock adjustment with immutable inventory transaction posting.
   * Guarantees idempotency via correlationId tracking and strictly prevents negative inventory balances.
   */
  private inventoryLocks: Map<string, Promise<any>> = new Map();

  public async adjustInventory(params: {
    tenantId: string;
    productId: string;
    warehouseId: string;
    quantityDelta: number;
    transactionType: InventoryTransactionType;
    referenceEntityType: 'GRN' | 'PUTAWAY' | 'CUSTOMER_ORDER' | 'CYCLE_COUNT' | 'TRANSFER' | 'PRODUCTION_ORDER' | 'RMA';
    referenceEntityId: string;
    actor: string;
    correlationId: string;
    lotNumber?: string;
    batchNumber?: string;
  }): Promise<{ balanceBefore: number; balanceAfter: number; transactionId: string; isDuplicate?: boolean }> {
    if (!params.tenantId) {
      throw new Error('[SCM-VALIDATION-ERROR] tenantId is required for inventory adjustment');
    }
    if (!params.productId) {
      throw new Error('[SCM-VALIDATION-ERROR] productId is required for inventory adjustment');
    }
    if (!params.warehouseId) {
      throw new Error('[SCM-VALIDATION-ERROR] warehouseId is required for inventory adjustment');
    }

    const lockKey = `${params.tenantId}:${params.warehouseId}:${params.productId}`;
    const previous = this.inventoryLocks.get(lockKey) || Promise.resolve();

    const op = (async () => {
      await previous;
      return this.executeInventoryAdjustment(params);
    })();

    this.inventoryLocks.set(lockKey, op.catch(() => {}));
    return op;
  }

  private async executeInventoryAdjustment(params: {
    tenantId: string;
    productId: string;
    warehouseId: string;
    quantityDelta: number;
    transactionType: InventoryTransactionType;
    referenceEntityType: 'GRN' | 'PUTAWAY' | 'CUSTOMER_ORDER' | 'CYCLE_COUNT' | 'TRANSFER' | 'PRODUCTION_ORDER' | 'RMA';
    referenceEntityId: string;
    actor: string;
    correlationId: string;
    lotNumber?: string;
    batchNumber?: string;
  }): Promise<{ balanceBefore: number; balanceAfter: number; transactionId: string; isDuplicate?: boolean }> {
    // 0. Idempotency pre-check via correlationId
    if (params.correlationId) {
      const existingTxs = this.listCachedRecords<InventoryTransactionRecord>('inventory_transactions', params.tenantId);
      const matched = existingTxs.find((tx) => tx.correlationId === params.correlationId);
      if (matched) {
        return {
          balanceBefore: matched.balanceBefore,
          balanceAfter: matched.balanceAfter,
          transactionId: matched.transactionId,
          isDuplicate: true,
        };
      }
    }

    const invId = `INV-${params.warehouseId}-${params.productId}`;
    const now = new Date().toISOString();

    // 1. Fetch current inventory
    let currentInv = await this.getRecord<Inventory & { tenantId: string }>('inventory', params.tenantId, invId);
    let balanceBefore = currentInv ? currentInv.onHand : 0;
    if (balanceBefore + params.quantityDelta < 0) {
      throw new Error(`Inventory overdraw rejected: cannot reduce stock for product [${params.productId}] at warehouse [${params.warehouseId}] below 0 (current on-hand: ${balanceBefore}, requested delta: ${params.quantityDelta})`);
    }
    let balanceAfter = balanceBefore + params.quantityDelta;

    const updatedInv: Inventory & { tenantId: string } = {
      id: invId,
      productId: params.productId,
      warehouseId: params.warehouseId,
      tenantId: params.tenantId,
      onHand: balanceAfter,
      reserved: currentInv?.reserved || 0,
      safetyStock: currentInv?.safetyStock || 50,
      reorderPoint: currentInv?.reorderPoint || 100,
      averageDailyDemand: currentInv?.averageDailyDemand || 10,
      unitCost: currentInv?.unitCost || 25,
      leadTime: currentInv?.leadTime || 7,
      lastUpdated: now,
    };

    await this.saveRecord('inventory', invId, updatedInv);

    // 2. Post immutable inventory transaction
    const transactionId = `TX-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const txRecord: InventoryTransactionRecord = {
      transactionId,
      tenantId: params.tenantId,
      transactionType: params.transactionType,
      productId: params.productId,
      warehouseId: params.warehouseId,
      quantityDelta: params.quantityDelta,
      balanceBefore,
      balanceAfter,
      referenceEntityType: params.referenceEntityType,
      referenceEntityId: params.referenceEntityId,
      actor: params.actor,
      correlationId: params.correlationId,
      lotNumber: params.lotNumber,
      batchNumber: params.batchNumber,
      timestamp: now,
    };

    await this.saveRecord('inventory_transactions', transactionId, txRecord);

    return { balanceBefore, balanceAfter, transactionId };
  }

  /**
   * Offline localforage sync helper.
   */
  private async syncToOfflineCache(collectionName: string, tenantId: string): Promise<void> {
    try {
      const store = (db as any)[collectionName];
      if (!store) return;

      const currentTenantRecords = this.listCachedRecords(collectionName, tenantId);
      let existingRecords: any[] = [];
      try {
        existingRecords = await loadData(store);
      } catch {
        existingRecords = [];
      }

      const otherTenantRecords = Array.isArray(existingRecords)
        ? existingRecords.filter((r: any) => r && r.tenantId !== tenantId)
        : [];

      const merged = [...otherTenantRecords, ...currentTenantRecords];
      await saveData(store, merged);
    } catch {
      // Local cache silent fallback
    }
  }

  /**
   * Clear in-memory cache for unit test isolation.
   */
  public clear(collectionName?: string): void {
    if (collectionName) {
      const prefix = `${collectionName}:`;
      for (const k of this.memoryCache.keys()) {
        if (k.startsWith(prefix)) {
          this.memoryCache.delete(k);
        }
      }
    } else {
      this.memoryCache.clear();
    }
  }
}

export const scmPersistenceService = ScmPersistenceService.getInstance();
