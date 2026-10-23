/**
 * ORION-9 SCM PERSISTENCE SERVICE
 * Authoritative persistence layer for all SCM entities via Cloud Firestore
 * with LocalForage/IndexedDB offline read cache, strict tenant isolation,
 * and Transactional Outbox for Distributed Event Fabric.
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
  runTransaction,
  Firestore,
} from 'firebase/firestore';
import { db, loadData, saveData } from '../../data/db';
import { InventoryTransactionRecord, InventoryTransactionType } from '../../scm/types';
import { Inventory } from '../../types';
import { DatabaseConnectionManager } from '../../core/database/DatabaseConnectionManager';
import { sanitizeFirestorePayload, validateDesktopItemRecord } from '../../core/database/firestoreSanitizer';
import { createDistributedEventEnvelope, DistributedEventEnvelope } from '../../enterprise/events/EventEnvelope';

export interface SaveRecordOptions {
  emitEvent?: boolean;
  eventType?: string;
  partitionKey?: string;
  correlationId?: string;
  causationId?: string;
  idempotencyKey?: string;
}

export interface OutboxEventRecord {
  id: string;
  tenantId: string;
  collectionName: string;
  entityId: string;
  environment: 'LIVE' | 'DEMO' | 'STAGING';
  status: 'PENDING' | 'CLAIMED' | 'PUBLISHED' | 'FAILED' | 'DEAD_LETTER';
  envelope: DistributedEventEnvelope;
  idempotencyKey: string;
  attempts: number;
  maxAttempts: number;
  claimedBy: string | null;
  claimedAt: string | null;
  leaseExpiresAt: number | null;
  fenceToken?: number;
  createdAt: string;
  publishedAt: string | null;
  lastError: string | null;
}

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
    } catch {
      // In non-Firebase test environments, gracefully use in-memory and local cache
      this.firestore = null;
    }
  }

  private getCacheKey(collectionName: string, tenantId: string, id: string): string {
    return `${collectionName}:${tenantId}:${id}`;
  }

  /**
   * Authoritatively save an entity to Cloud Firestore, memory cache, and offline storage.
   * When options.emitEvent is true, atomically creates a Transactional Outbox record
   * in the exact same Firestore transaction as the business write.
   */
  public async saveRecord<T extends { tenantId: string }>(
    collectionName: string,
    id: string,
    data: T,
    options?: SaveRecordOptions | boolean,
    legacyIdempotencyKey?: string
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

    // Normalize options
    const opts: SaveRecordOptions = typeof options === 'boolean'
      ? { emitEvent: options, idempotencyKey: legacyIdempotencyKey }
      : (options || {});

    const env = DatabaseConnectionManager.getInstance().getEnvironment();

    let outboxRecord: OutboxEventRecord | null = null;
    if (opts.emitEvent) {
      const idempotencyKey = opts.idempotencyKey || `${data.tenantId}:${collectionName}:${id}:${Date.now()}`;
      const envelope = createDistributedEventEnvelope({
        tenantId: data.tenantId,
        eventType: opts.eventType || `scm.${collectionName}.saved`,
        partitionKey: opts.partitionKey || `${data.tenantId}:${id}`,
        correlationId: opts.correlationId,
        causationId: opts.causationId,
        producer: 'orion-scm-persistence',
        idempotencyKey,
        payload: sanitizedData,
      });

      const outboxId = `outbox_${idempotencyKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      outboxRecord = {
        id: outboxId,
        tenantId: data.tenantId,
        collectionName,
        entityId: id,
        environment: env,
        status: 'PENDING',
        envelope,
        idempotencyKey,
        attempts: 0,
        maxAttempts: 5,
        claimedBy: null,
        claimedAt: null,
        leaseExpiresAt: null,
        createdAt: new Date().toISOString(),
        publishedAt: null,
        lastError: null,
      };
    }

    if (env === 'LIVE' || env === 'STAGING') {
      const firestoreInstance = DatabaseConnectionManager.getInstance().getFirestore(env) || this.firestore;
      if (!firestoreInstance) {
        throw new Error(`[SCM-AUTHORITATIVE-ERROR] ${env} environment requested but Firestore instance is unavailable for ${collectionName}/${id}. Unpersisted writes are rejected.`);
      }

      if (opts.emitEvent && outboxRecord) {
        // Atomic transaction: business write + outbox record in the same commit
        const businessRef = doc(firestoreInstance, collectionName, id);
        const outboxRef = doc(firestoreInstance, 'outbox_events', outboxRecord.id);

        try {
          await runTransaction(firestoreInstance, async (transaction) => {
            transaction.set(businessRef, sanitizedData, { merge: true });
            transaction.set(outboxRef, outboxRecord);
          });
        } catch (err: any) {
          console.error(`[SCM-PERSISTENCE] Atomic Firestore write + outbox failed for ${collectionName}/${id}:`, err);
          throw new Error(`[SCM-AUTHORITATIVE-ERROR] Firestore persistence failed for ${collectionName}/${id}: ${err?.message || err}`);
        }
      } else {
        try {
          const ref = doc(firestoreInstance, collectionName, id);
          await setDoc(ref, sanitizedData, { merge: true });
        } catch (err: any) {
          console.error(`[SCM-PERSISTENCE] Authoritative Firestore write failed for ${collectionName}/${id}:`, err);
          throw new Error(`[SCM-AUTHORITATIVE-ERROR] Firestore persistence failed for ${collectionName}/${id}: ${err?.message || err}`);
        }
      }
    }

    const key = this.getCacheKey(collectionName, data.tenantId, id);
    this.memoryCache.set(key, sanitizedData);

    if (opts.emitEvent && outboxRecord) {
      const outboxKey = this.getCacheKey('outbox_events', data.tenantId, outboxRecord.id);
      this.memoryCache.set(outboxKey, outboxRecord);
    }

    // Offline cache sync (read cache & local persistence)
    try {
      await this.syncToOfflineCache(collectionName, data.tenantId);
    } catch {
      // Local cache silent fallback
    }

    return sanitizedData as T;
  }

  /**
   * Retrieve pending or expired-lease outbox events.
   */
  public async getPendingOutboxEvents(tenantId?: string, limitCount: number = 50): Promise<OutboxEventRecord[]> {
    const currentEnv = DatabaseConnectionManager.getInstance().getEnvironment();
    const candidates: OutboxEventRecord[] = [];
    const now = Date.now();

    const isDurable = currentEnv === 'LIVE' || currentEnv === 'STAGING';
    const firestoreInstance = isDurable ? (DatabaseConnectionManager.getInstance().getFirestore(currentEnv) || this.firestore) : null;

    if (isDurable) {
      if (!firestoreInstance) {
        throw new Error(`[SCM-PERSISTENCE] Firestore instance unavailable in ${currentEnv} mode for getPendingOutboxEvents. In-memory fallback rejected.`);
      }
      try {
        const colRef = collection(firestoreInstance, 'outbox_events');
        const q = tenantId
          ? query(colRef, where('tenantId', '==', tenantId))
          : query(colRef);
        const snap = await getDocs(q);
        snap.forEach((d) => {
          const item = d.data() as OutboxEventRecord;
          const isExpiredClaim = item.status === 'CLAIMED' && (!item.leaseExpiresAt || item.leaseExpiresAt <= now);
          if (item.status === 'PENDING' || isExpiredClaim) {
            candidates.push(item);
          }
        });
        return candidates.slice(0, limitCount);
      } catch (err: any) {
        console.error(`[SCM-PERSISTENCE] Firestore read outbox_events failed in ${currentEnv} mode:`, err);
        throw err;
      }
    }

    // Fallback to in-memory cache
    for (const [key, value] of this.memoryCache.entries()) {
      if (key.startsWith('outbox_events:')) {
        const rec = value as OutboxEventRecord;
        if (!tenantId || rec.tenantId === tenantId) {
          const isExpiredClaim = rec.status === 'CLAIMED' && (!rec.leaseExpiresAt || rec.leaseExpiresAt <= now);
          if (rec.status === 'PENDING' || isExpiredClaim) {
            candidates.push(rec);
          }
        }
      }
    }

    return candidates.slice(0, limitCount);
  }

  /**
   * Concurrency-safe outbox event claim using a lease with ownership and expiry.
   * Prevents two workers from claiming or publishing the same event simultaneously.
   */
  public async claimOutboxEvent(
    outboxId: string,
    workerId: string,
    leaseDurationMs: number = 60000
  ): Promise<OutboxEventRecord | null> {
    const currentEnv = DatabaseConnectionManager.getInstance().getEnvironment();
    const isDurable = currentEnv === 'LIVE' || currentEnv === 'STAGING';
    const firestoreInstance = isDurable ? (DatabaseConnectionManager.getInstance().getFirestore(currentEnv) || this.firestore) : null;
    const now = Date.now();

    if (isDurable) {
      if (!firestoreInstance) {
        throw new Error(`[SCM-PERSISTENCE] Firestore instance unavailable in ${currentEnv} mode for claimOutboxEvent. In-memory claim rejected.`);
      }
      try {
        const outboxRef = doc(firestoreInstance, 'outbox_events', outboxId);
        return await runTransaction(firestoreInstance, async (transaction) => {
          const snap = await transaction.get(outboxRef);
          if (!snap.exists()) {
            return null;
          }
          const data = snap.data() as OutboxEventRecord;
          const isExpiredClaim = data.status === 'CLAIMED' && (!data.leaseExpiresAt || data.leaseExpiresAt <= now);
          const isEligible = data.status === 'PENDING' || isExpiredClaim;
          if (!isEligible) {
            return null;
          }

          if ((data.attempts || 0) >= (data.maxAttempts || 5)) {
            transaction.set(outboxRef, { ...data, status: 'DEAD_LETTER', lastError: 'Max retries exhausted prior to claim' }, { merge: true });
            return null;
          }

          const nextFenceToken = (data.fenceToken || 0) + 1;
          const claimed: OutboxEventRecord = {
            ...data,
            status: 'CLAIMED',
            claimedBy: workerId,
            claimedAt: new Date(now).toISOString(),
            leaseExpiresAt: now + leaseDurationMs,
            fenceToken: nextFenceToken,
            attempts: (data.attempts || 0) + 1,
          };
          transaction.set(outboxRef, claimed, { merge: true });
          return claimed;
        });
      } catch (err) {
        console.warn(`[SCM-PERSISTENCE] Transactional claimOutboxEvent failed for ${outboxId}:`, err);
        return null;
      }
      return null;
    }

    // In-memory claim
    for (const [key, value] of this.memoryCache.entries()) {
      if (key.startsWith('outbox_events:') && (value as OutboxEventRecord).id === outboxId) {
        const data = value as OutboxEventRecord;
        const isExpiredClaim = data.status === 'CLAIMED' && (!data.leaseExpiresAt || data.leaseExpiresAt <= now);
        const isEligible = data.status === 'PENDING' || isExpiredClaim;
        if (!isEligible) {
          return null;
        }
        if ((data.attempts || 0) >= (data.maxAttempts || 5)) {
          data.status = 'DEAD_LETTER';
          data.lastError = 'Max retries exhausted prior to claim';
          return null;
        }
        const nextFenceToken = (data.fenceToken || 0) + 1;
        data.status = 'CLAIMED';
        data.claimedBy = workerId;
        data.claimedAt = new Date(now).toISOString();
        data.leaseExpiresAt = now + leaseDurationMs;
        data.fenceToken = nextFenceToken;
        data.attempts = (data.attempts || 0) + 1;
        return { ...data };
      }
    }

    return null;
  }

  /**
   * Mark an outbox event as successfully published.
   * STRICT LEASE OWNERSHIP: Verifies that the outbox event is currently claimed by workerId.
   * If a stale worker lost its lease to a newer worker, the update is rejected (returns false).
   */
  public async markOutboxPublished(outboxId: string, workerId: string, fenceToken?: number): Promise<boolean> {
    const currentEnv = DatabaseConnectionManager.getInstance().getEnvironment();
    const isDurable = currentEnv === 'LIVE' || currentEnv === 'STAGING';
    const firestoreInstance = isDurable ? (DatabaseConnectionManager.getInstance().getFirestore(currentEnv) || this.firestore) : null;
    const nowIso = new Date().toISOString();

    if (isDurable) {
      if (!firestoreInstance) {
        throw new Error(`[SCM-PERSISTENCE] Firestore instance unavailable in ${currentEnv} mode for markOutboxPublished. In-memory update rejected.`);
      }
      try {
        const outboxRef = doc(firestoreInstance, 'outbox_events', outboxId);
        return await runTransaction(firestoreInstance, async (transaction) => {
          const snap = await transaction.get(outboxRef);
          if (!snap.exists()) {
            return false;
          }
          const data = snap.data() as OutboxEventRecord;
          if (data.status === 'PUBLISHED') {
            return true;
          }
          if (data.claimedBy !== workerId) {
            console.warn(`[SCM-PERSISTENCE] Stale worker ${workerId} denied from marking ${outboxId} published. Current owner is ${data.claimedBy}`);
            return false;
          }
          if (fenceToken !== undefined && data.fenceToken !== undefined && data.fenceToken !== fenceToken) {
            console.warn(`[SCM-PERSISTENCE] Fence token mismatch for ${outboxId}: current fence ${data.fenceToken}, worker fence ${fenceToken}`);
            return false;
          }
          transaction.update(outboxRef, {
            status: 'PUBLISHED',
            publishedAt: nowIso,
            claimedBy: null,
            leaseExpiresAt: null,
          });
          return true;
        });
      } catch (err) {
        console.warn(`[SCM-PERSISTENCE] markOutboxPublished firestore update failed for ${outboxId}:`, err);
        return false;
      }
      return false;
    }

    for (const [key, value] of this.memoryCache.entries()) {
      if (key.startsWith('outbox_events:') && (value as OutboxEventRecord).id === outboxId) {
        const rec = value as OutboxEventRecord;
        if (rec.status === 'PUBLISHED') {
          return true;
        }
        if (rec.claimedBy !== workerId) {
          console.warn(`[SCM-PERSISTENCE] Stale worker ${workerId} denied from marking ${outboxId} published. Current owner is ${rec.claimedBy}`);
          return false;
        }
        if (fenceToken !== undefined && rec.fenceToken !== undefined && rec.fenceToken !== fenceToken) {
          console.warn(`[SCM-PERSISTENCE] Fence token mismatch for ${outboxId}: current fence ${rec.fenceToken}, worker fence ${fenceToken}`);
          return false;
        }
        rec.status = 'PUBLISHED';
        rec.publishedAt = nowIso;
        rec.claimedBy = null;
        rec.leaseExpiresAt = null;
        return true;
      }
    }
    return false;
  }

  /**
   * Mark an outbox event as failed or permanently dead-lettered.
   * STRICT LEASE OWNERSHIP: Only allows update if the outbox event is currently claimed by workerId.
   */
  public async markOutboxFailed(
    outboxId: string,
    workerId: string,
    error: string,
    isPermanent: boolean = false,
    fenceToken?: number
  ): Promise<boolean> {
    const currentEnv = DatabaseConnectionManager.getInstance().getEnvironment();
    const isDurable = currentEnv === 'LIVE' || currentEnv === 'STAGING';
    const firestoreInstance = isDurable ? (DatabaseConnectionManager.getInstance().getFirestore(currentEnv) || this.firestore) : null;
    const newStatus = isPermanent ? 'DEAD_LETTER' : 'PENDING';

    if (isDurable) {
      if (!firestoreInstance) {
        throw new Error(`[SCM-PERSISTENCE] Firestore instance unavailable in ${currentEnv} mode for markOutboxFailed. In-memory update rejected.`);
      }
      try {
        const outboxRef = doc(firestoreInstance, 'outbox_events', outboxId);
        return await runTransaction(firestoreInstance, async (transaction) => {
          const snap = await transaction.get(outboxRef);
          if (!snap.exists()) return false;
          const data = snap.data() as OutboxEventRecord;
          if (data.status === 'PUBLISHED') return false;
          if (data.claimedBy !== workerId) {
            console.warn(`[SCM-PERSISTENCE] Stale worker ${workerId} denied from failing ${outboxId}. Current owner is ${data.claimedBy}`);
            return false;
          }
          if (fenceToken !== undefined && data.fenceToken !== undefined && data.fenceToken !== fenceToken) {
            console.warn(`[SCM-PERSISTENCE] Fence token mismatch for ${outboxId}: current fence ${data.fenceToken}, worker fence ${fenceToken}`);
            return false;
          }
          transaction.update(outboxRef, {
            status: newStatus,
            lastError: error,
            claimedBy: null,
            leaseExpiresAt: null,
          });
          return true;
        });
      } catch (err) {
        console.warn(`[SCM-PERSISTENCE] markOutboxFailed firestore update failed for ${outboxId}:`, err);
        return false;
      }
      return false;
    }

    for (const [key, value] of this.memoryCache.entries()) {
      if (key.startsWith('outbox_events:') && (value as OutboxEventRecord).id === outboxId) {
        const rec = value as OutboxEventRecord;
        if (rec.status === 'PUBLISHED') return false;
        if (rec.claimedBy !== workerId) {
          console.warn(`[SCM-PERSISTENCE] Stale worker ${workerId} denied from failing ${outboxId}. Current owner is ${rec.claimedBy}`);
          return false;
        }
        if (fenceToken !== undefined && rec.fenceToken !== undefined && rec.fenceToken !== fenceToken) {
          console.warn(`[SCM-PERSISTENCE] Fence token mismatch for ${outboxId}: current fence ${rec.fenceToken}, worker fence ${fenceToken}`);
          return false;
        }
        rec.status = newStatus;
        rec.lastError = error;
        rec.claimedBy = null;
        rec.leaseExpiresAt = null;
        return true;
      }
    }
    return false;
  }

  /**
   * Safe operational outbox metrics for system status and health endpoints.
   * Never leaks payloads, customer data, or internal credentials.
   */
  public getOutboxMetrics(tenantId?: string): {
    pendingCount: number;
    claimedCount: number;
    publishedCount: number;
    deadLetterCount: number;
    oldestPendingAgeSeconds: number | null;
  } {
    let pendingCount = 0;
    let claimedCount = 0;
    let publishedCount = 0;
    let deadLetterCount = 0;
    let oldestPendingTimestamp: number | null = null;
    const now = Date.now();

    for (const [key, value] of this.memoryCache.entries()) {
      if (key.startsWith('outbox_events:')) {
        const rec = value as OutboxEventRecord;
        if (tenantId && rec.tenantId !== tenantId) continue;
        if (rec.status === 'PENDING') {
          pendingCount++;
          const created = Date.parse(rec.createdAt);
          if (!isNaN(created)) {
            if (oldestPendingTimestamp === null || created < oldestPendingTimestamp) {
              oldestPendingTimestamp = created;
            }
          }
        } else if (rec.status === 'CLAIMED') {
          claimedCount++;
        } else if (rec.status === 'PUBLISHED') {
          publishedCount++;
        } else if (rec.status === 'DEAD_LETTER') {
          deadLetterCount++;
        }
      }
    }

    const oldestPendingAgeSeconds = oldestPendingTimestamp !== null
      ? Math.max(0, Math.floor((now - oldestPendingTimestamp) / 1000))
      : null;

    return {
      pendingCount,
      claimedCount,
      publishedCount,
      deadLetterCount,
      oldestPendingAgeSeconds
    };
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
      } catch {
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
    operationId?: string;
    correlationId?: string;
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
    const stableOpId = (params.operationId || params.correlationId || '').trim();
    if (!stableOpId) {
      throw new Error('[SCM-IDEMPOTENCY-ERROR] Stable operationId or correlationId is required for inventory adjustment. Omission is rejected to prevent silent duplicate mutations on retry.');
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
    operationId?: string;
    correlationId?: string;
    lotNumber?: string;
    batchNumber?: string;
  }): Promise<{ balanceBefore: number; balanceAfter: number; transactionId: string; isDuplicate?: boolean }> {
    const stableOpId = (params.operationId || params.correlationId || '').trim();

    // 0a. Idempotency pre-check via stable operationId / correlationId
    if (stableOpId) {
      const existingTxs = this.listCachedRecords<InventoryTransactionRecord>('inventory_transactions', params.tenantId);
      const matched = existingTxs.find((tx) => tx.correlationId === stableOpId || (tx as any).operationId === stableOpId);
      if (matched) {
        return {
          balanceBefore: matched.balanceBefore,
          balanceAfter: matched.balanceAfter,
          transactionId: matched.transactionId,
          isDuplicate: true,
        };
      }
    }

    // 0b. Command-level conflict detection: prevent retrying the same business command under an altered operation ID
    if (params.referenceEntityType && params.referenceEntityId) {
      const commandKey = `cmd:${params.tenantId}:${params.referenceEntityType}:${params.referenceEntityId}:${params.productId}`;
      const existingCmd = this.memoryCache.get(commandKey) as any;
      if (existingCmd) {
        if (existingCmd.operationId === stableOpId) {
          return {
            balanceBefore: existingCmd.balanceBefore,
            balanceAfter: existingCmd.balanceAfter,
            transactionId: existingCmd.transactionId,
            isDuplicate: true,
          };
        } else {
          throw new Error(`[SCM-DUPLICATE-OPERATION-CONFLICT] Business operation for ${params.referenceEntityType}:${params.referenceEntityId} on product ${params.productId} was already executed under operation ID '${existingCmd.operationId}'. Retrying without original correlation ID is rejected to prevent duplicate mutations.`);
        }
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

    // Operation-level stable idempotency key
    // Distinguishes legitimate separate adjustments while preserving key on retries
    const inventoryAdjustmentIdempotencyKey = `inv-op:${params.tenantId}:${invId}:${stableOpId}`;

    // Save inventory mutation with transactional outbox event
    await this.saveRecord('inventory', invId, updatedInv, {
      emitEvent: true,
      eventType: 'scm.inventory.adjusted',
      partitionKey: `${params.tenantId}:${invId}`,
      correlationId: stableOpId,
      idempotencyKey: inventoryAdjustmentIdempotencyKey
    });

    // 2. Post immutable inventory transaction
    const transactionId = `TX-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const txRecord: InventoryTransactionRecord & { operationId?: string } = {
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
      correlationId: stableOpId,
      operationId: stableOpId,
      lotNumber: params.lotNumber,
      batchNumber: params.batchNumber,
      timestamp: now,
    };

    await this.saveRecord('inventory_transactions', transactionId, txRecord, {
      emitEvent: true,
      eventType: 'scm.inventory_transaction.created',
      partitionKey: `${params.tenantId}:${transactionId}`,
      correlationId: stableOpId,
      idempotencyKey: `tx-${params.tenantId}-${stableOpId}`
    });

    // Persist canonical command record in cache for conflict detection
    if (params.referenceEntityType && params.referenceEntityId) {
      const commandKey = `cmd:${params.tenantId}:${params.referenceEntityType}:${params.referenceEntityId}:${params.productId}`;
      this.memoryCache.set(commandKey, {
        operationId: stableOpId,
        balanceBefore,
        balanceAfter,
        transactionId,
        timestamp: now,
      });
    }

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
