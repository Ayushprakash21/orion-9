/**
 * ORION-9 LOCAL-FIRST OUTBOX SYNCHRONIZATION ENGINE
 * 
 * Implements the robust local-first conceptual model:
 * USER ACTION -> LOCAL STATE (IndexedDB) -> LOCAL OUTBOX -> SUPABASE -> 
 * SERVER VALIDATION -> DATABASE COMMIT -> EVENT -> LOCAL SYNC.
 * 
 * In offline mode:
 * Actions are queued transactionally in `SC_OUTBOX` IndexedDB.
 * When a connection is re-established, the queue revalidates against Supabase and commits.
 */

import localforage from 'localforage';
import { getSupabase } from '../../lib/supabaseClient';
import { generateCorrelationId } from '../../kernel/security/crypto';

export interface OutboxItem {
  id: string;
  entityType: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'RPC';
  payload: any;
  tenantId: string;
  actorUserId: string;
  createdAt: string;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  lastError?: string;
  correlationId: string;
}

class OutboxSyncEngine {
  private outboxStore: LocalForage | null = null;
  private isProcessing = false;
  private lastSyncedAt: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.outboxStore = localforage.createInstance({
        name: 'SC_DB',
        storeName: 'SC_OUTBOX'
      });
      // Listen for network reconnection
      window.addEventListener('online', () => {
        this.processQueue();
      });
    }
  }

  private getStore(): LocalForage | null {
    if (!this.outboxStore && typeof window !== 'undefined') {
      this.outboxStore = localforage.createInstance({
        name: 'SC_DB',
        storeName: 'SC_OUTBOX'
      });
    }
    return this.outboxStore;
  }

  /**
   * Enqueues a local user mutation into the persistent outbox table.
   */
  public async enqueue(
    entityType: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'RPC',
    payload: any,
    tenantId: string = 'ORION_PLATFORM',
    actorUserId: string = 'system'
  ): Promise<OutboxItem> {
    const store = this.getStore();
    const item: OutboxItem = {
      id: generateCorrelationId('outbox'),
      entityType,
      operation,
      payload,
      tenantId,
      actorUserId,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      retryCount: 0,
      correlationId: generateCorrelationId('sync'),
    };

    if (store) {
      await store.setItem(item.id, item);
    }

    // Trigger queue processing asynchronously
    this.processQueue().catch(err => console.warn('[OUTBOX_PROCESS_WARN]:', err));

    return item;
  }

  /**
   * Processes all pending items in the outbox against Supabase PostgreSQL.
   */
  public async processQueue(): Promise<{ processed: number; failed: number }> {
    if (this.isProcessing) return { processed: 0, failed: 0 };
    const store = this.getStore();
    if (!store) return { processed: 0, failed: 0 };

    const supabase = getSupabase();
    if (!supabase) {
      // Remote DB is not configured; items remain safely in local outbox
      return { processed: 0, failed: 0 };
    }

    this.isProcessing = true;
    let processed = 0;
    let failed = 0;

    try {
      const keys = await store.keys();
      for (const key of keys) {
        const item = (await store.getItem(key)) as OutboxItem | null;
        if (!item || item.status === 'SYNCED') continue;

        try {
          item.status = 'SYNCING';
          await store.setItem(key, item);

          // Perform remote mutation with tenant isolation check
          const table = item.entityType;
          let remoteResult;

          if (item.operation === 'INSERT') {
            remoteResult = await supabase.from(table).insert({
              ...item.payload,
              organization_id: item.tenantId,
            });
          } else if (item.operation === 'UPDATE') {
            const { id, ...updates } = item.payload;
            remoteResult = await supabase.from(table).update(updates).eq('id', id).eq('organization_id', item.tenantId);
          } else if (item.operation === 'DELETE') {
            remoteResult = await supabase.from(table).delete().eq('id', item.payload.id).eq('organization_id', item.tenantId);
          }

          if (remoteResult?.error) {
            throw remoteResult.error;
          }

          // Marked as synced and remove from queue
          await store.removeItem(key);
          processed++;
          this.lastSyncedAt = new Date().toISOString();
        } catch (itemErr: any) {
          item.status = 'FAILED';
          item.retryCount += 1;
          item.lastError = itemErr.message || 'Remote sync failed';
          await store.setItem(key, item);
          failed++;
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return { processed, failed };
  }

  /**
   * Retrieves summary statistics of the outbox.
   */
  public async getSyncStatus(): Promise<{ pendingCount: number; lastSyncedAt: string | null; isProcessing: boolean }> {
    const store = this.getStore();
    if (!store) {
      return { pendingCount: 0, lastSyncedAt: this.lastSyncedAt, isProcessing: false };
    }

    try {
      const keys = await store.keys();
      let pending = 0;
      for (const k of keys) {
        const item = (await store.getItem(k)) as OutboxItem | null;
        if (item && item.status !== 'SYNCED') pending++;
      }
      return {
        pendingCount: pending,
        lastSyncedAt: this.lastSyncedAt,
        isProcessing: this.isProcessing,
      };
    } catch (e) {
      return { pendingCount: 0, lastSyncedAt: this.lastSyncedAt, isProcessing: false };
    }
  }

  public async getPendingItems(): Promise<OutboxItem[]> {
    const store = this.getStore();
    if (!store) return [];
    try {
      const keys = await store.keys();
      const items: OutboxItem[] = [];
      for (const k of keys) {
        const item = (await store.getItem(k)) as OutboxItem | null;
        if (item) items.push(item);
      }
      return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) {
      return [];
    }
  }
}

export const outboxSyncEngine = new OutboxSyncEngine();
