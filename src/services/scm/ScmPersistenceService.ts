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
    const key = this.getCacheKey(collectionName, data.tenantId, id);
    this.memoryCache.set(key, { ...data });

    if (this.firestore) {
      try {
        const ref = doc(this.firestore, collectionName, id);
        await setDoc(ref, { ...data }, { merge: true });
      } catch (err) {
        console.warn(`[SCM-PERSISTENCE] Firestore write failed for ${collectionName}/${id}, cached locally.`, err);
      }
    }

    // Offline cache sync
    this.syncToOfflineCache(collectionName, data.tenantId).catch(() => {});

    return data;
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

    if (this.firestore) {
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

    return null;
  }

  /**
   * List all records in a collection for a given tenant.
   */
  public async listRecords<T extends { tenantId: string }>(
    collectionName: string,
    tenantId: string
  ): Promise<T[]> {
    if (this.firestore) {
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

    return this.listCachedRecords<T>(collectionName, tenantId);
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
   */
  public async adjustInventory(params: {
    tenantId: string;
    productId: string;
    warehouseId: string;
    quantityDelta: number;
    transactionType: InventoryTransactionType;
    referenceEntityType: 'GRN' | 'PUTAWAY' | 'CUSTOMER_ORDER' | 'CYCLE_COUNT' | 'TRANSFER';
    referenceEntityId: string;
    actor: string;
    correlationId: string;
    lotNumber?: string;
    batchNumber?: string;
  }): Promise<{ balanceBefore: number; balanceAfter: number; transactionId: string }> {
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
      const records = this.listCachedRecords(collectionName, tenantId);
      const store = (db as any)[collectionName];
      if (store) {
        await saveData(store, records);
      }
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
