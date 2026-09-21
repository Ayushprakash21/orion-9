/**
 * ORION-9 DURABLE SYNC JOB ENGINE
 * Wave 3.2 Synchronization Engine Architecture
 *
 * Manages durable integration sync jobs, watermarking/cursors, pagination tracking,
 * kernel integration fabric dispatching, and reconciliation alignment.
 */

import {
  SyncJobRecord,
  SyncJobMode,
  SyncJobDirection,
  WatermarkCursor,
  PaginationState
} from './types';
import { connectorRegistry } from './ConnectorRegistry';
import { integrationFabric } from './IntegrationFabric';
import { reconciliationEngine } from './ReconciliationEngine';
import { kernelEventBus } from '../kernel/EventBus';
import { kernelAuditEngine } from '../kernel/AuditEngine';
import { db, loadData, saveData } from '../data/db';

export class SyncJobEngine {
  private static instance: SyncJobEngine;
  private syncJobs: Map<string, SyncJobRecord> = new Map();
  private watermarks: Map<string, WatermarkCursor> = new Map(); // key: tenantId:connectorId:entityType

  private constructor() {
    this.seedDefaultJobs();
    this.hydrate();
  }

  public static getInstance(): SyncJobEngine {
    if (!SyncJobEngine.instance) {
      SyncJobEngine.instance = new SyncJobEngine();
    }
    return SyncJobEngine.instance;
  }

  private seedDefaultJobs(): void {
    const tenantId = 'org-tenant-a';
    const now = new Date().toISOString();

    const initialJobs: SyncJobRecord[] = [
      {
        syncJobId: 'sync-job-sap-001',
        tenantId,
        connectorId: 'conn-sap-s4hana-01',
        entityType: 'PurchaseOrder',
        direction: 'INGRESS',
        mode: 'INCREMENTAL',
        status: 'COMPLETED',
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        completedAt: now,
        recordsRead: 150,
        recordsProcessed: 150,
        recordsSucceeded: 150,
        recordsFailed: 0,
        recordsSkipped: 0,
        errorCount: 0,
        correlationId: 'corr-sync-sap-1',
        watermark: { lastModifiedAt: now },
        pagination: { pageNumber: 1, recordsRead: 150, recordsProcessed: 150, hasMore: false },
      },
      {
        syncJobId: 'sync-job-oracle-002',
        tenantId,
        connectorId: 'conn-oracle-otm-01',
        entityType: 'Shipment',
        direction: 'INGRESS',
        mode: 'FULL',
        status: 'COMPLETED',
        startedAt: new Date(Date.now() - 7200000).toISOString(),
        completedAt: new Date(Date.now() - 7000000).toISOString(),
        recordsRead: 85,
        recordsProcessed: 85,
        recordsSucceeded: 85,
        recordsFailed: 0,
        recordsSkipped: 0,
        errorCount: 0,
        correlationId: 'corr-sync-ora-2',
        watermark: { pageToken: 'token_page_2' },
        pagination: { pageNumber: 2, recordsRead: 85, recordsProcessed: 85, hasMore: false },
      },
      {
        syncJobId: 'sync-job-edi-003',
        tenantId,
        connectorId: 'conn-edi-x12-01',
        entityType: 'ASN',
        direction: 'INGRESS',
        mode: 'EVENT_DRIVEN',
        status: 'COMPLETED',
        startedAt: new Date(Date.now() - 10800000).toISOString(),
        completedAt: new Date(Date.now() - 10750000).toISOString(),
        recordsRead: 42,
        recordsProcessed: 42,
        recordsSucceeded: 42,
        recordsFailed: 0,
        recordsSkipped: 0,
        errorCount: 0,
        correlationId: 'corr-sync-edi-3',
        watermark: { externalSequence: 1045 },
      }
    ];

    initialJobs.forEach(job => this.syncJobs.set(job.syncJobId, job));
  }

  private async hydrate(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const stored = await loadData<SyncJobRecord>('syncJobs' as any);
        if (stored && stored.length > 0) {
          stored.forEach(j => this.syncJobs.set(j.syncJobId, j));
        }
      }
    } catch (e) {
      console.warn('[SyncJobEngine] Hydration error:', e);
    }
  }

  private async persist(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      await saveData('syncJobs' as any, Array.from(this.syncJobs.values()));
    } catch (e) {
      console.warn('[SyncJobEngine] Persistence error:', e);
    }
  }

  /**
   * Starts a new synchronization job for a connector
   */
  public async createAndRunSyncJob(params: {
    tenantId: string;
    connectorId: string;
    entityType: 'Supplier' | 'Product' | 'Inventory' | 'PurchaseOrder' | 'Shipment' | 'ASN' | 'Invoice' | 'CustomerOrder';
    direction?: SyncJobDirection;
    mode?: SyncJobMode;
    actor?: string;
  }): Promise<SyncJobRecord> {
    if (!params.tenantId) throw new Error('Tenant ID is required for sync job execution.');

    // Validate tenant ownership of connector
    const connectorRecord = connectorRegistry.getConnector(params.connectorId, params.tenantId);
    const runtime = connectorRegistry.getRuntimeInstance(params.connectorId, params.tenantId);

    const syncJobId = `sync-job-${Date.now().toString(36)}`;
    const correlationId = `corr-job-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const actor = params.actor || 'System Operator';

    const watermarkKey = `${params.tenantId}:${params.connectorId}:${params.entityType}`;
    const currentWatermark = this.watermarks.get(watermarkKey) || { lastModifiedAt: '1970-01-01T00:00:00Z' };

    const syncJob: SyncJobRecord = {
      syncJobId,
      tenantId: params.tenantId,
      connectorId: params.connectorId,
      entityType: params.entityType,
      direction: params.direction || 'INGRESS',
      mode: params.mode || 'INCREMENTAL',
      status: 'RUNNING',
      startedAt: now,
      recordsRead: 0,
      recordsProcessed: 0,
      recordsSucceeded: 0,
      recordsFailed: 0,
      recordsSkipped: 0,
      errorCount: 0,
      correlationId,
      watermark: currentWatermark,
      pagination: {
        pageNumber: 1,
        recordsRead: 0,
        recordsProcessed: 0,
        hasMore: false,
      },
    };

    this.syncJobs.set(syncJobId, syncJob);
    this.persist();

    // Event & Audit
    kernelAuditEngine.record({
      action: 'SYNC_JOB_STARTED',
      actor: { id: actor, type: 'USER', name: actor },
      entityId: syncJobId,
      entityType: 'INTEGRATION_SYNC_JOB',
      classification: 'INTERNAL',
      details: { tenantId: params.tenantId, connectorId: params.connectorId, mode: syncJob.mode }
    });

    try {
      // Execute retrieval via connector runtime if available
      let fetchedItems: any[] = [];
      if (runtime) {
        fetchedItems = await runtime.poll({ entityType: params.entityType });
      } else {
        // Fallback default fixture
        fetchedItems = [{ id: `${params.entityType.toLowerCase()}-sync-item-1`, name: 'Sync Ingestion Sample' }];
      }

      syncJob.recordsRead = fetchedItems.length;

      // Dispatch through IntegrationFabric to enforce Kernel auth & commands
      for (const item of fetchedItems) {
        try {
          const res = await integrationFabric.ingest({
            connectorId: params.connectorId,
            tenantId: params.tenantId,
            externalSystemId: connectorRecord.type,
            externalMessageId: item.id || `msg-${Date.now().toString(36)}`,
            idempotencyKey: `sync-idem-${Date.now()}-${Math.random()}`,
            entityType: params.entityType as any,
            payload: item,
            actor: {
              id: actor,
              type: 'USER' as any,
              name: actor,
              roles: ['organization_admin'],
              organizationId: params.tenantId,
            },

          });
          if (res.success || res.status === 'PROCESSED' || res.status === 'DUPLICATE_SKIPPED') {
            syncJob.recordsSucceeded++;
          } else {
            syncJob.recordsFailed++;
            syncJob.errorCount++;
          }
          syncJob.recordsProcessed++;
        } catch (err: any) {
          syncJob.recordsFailed++;
          syncJob.errorCount++;
        }
      }

      syncJob.status = syncJob.recordsFailed > 0 ? 'PARTIAL' : 'COMPLETED';
      syncJob.completedAt = new Date().toISOString();
      syncJob.watermark = { lastModifiedAt: syncJob.completedAt };
      this.watermarks.set(watermarkKey, syncJob.watermark);

      // Trigger reconciliation pass against state
      reconciliationEngine.generateReconciliationReport({
        tenantId: params.tenantId,
        sourceSystem: connectorRecord.type as any,
        entityType: params.entityType,
        sourceRecords: fetchedItems,
        actor,
      });

      connectorRegistry.updateHealth(params.connectorId, params.tenantId, {
        success: true,
        recordsProcessedDelta: syncJob.recordsSucceeded,
      });
    } catch (err: any) {
      syncJob.status = 'FAILED';
      syncJob.errorMessage = err.message || 'Sync job execution failed';
      syncJob.completedAt = new Date().toISOString();

      connectorRegistry.updateHealth(params.connectorId, params.tenantId, {
        success: false,
        error: syncJob.errorMessage,
      });
    }

    this.persist();

    kernelEventBus.publish('orion:sync_job:completed' as any, {
      syncJobId,
      tenantId: params.tenantId,
      status: syncJob.status,
      recordsSucceeded: syncJob.recordsSucceeded,
    }, {
      actor: { id: actor, type: 'USER', name: actor }
    });

    return { ...syncJob };
  }

  /**
   * Retrieves a single sync job record enforcing tenant isolation
   */
  public getSyncJob(syncJobId: string, tenantId: string): SyncJobRecord {
    const job = this.syncJobs.get(syncJobId);
    if (!job) throw new Error(`Sync job '${syncJobId}' not found.`);
    if (job.tenantId !== tenantId) {
      throw new Error(`Tenant '${tenantId}' is not authorized to access sync job '${syncJobId}'.`);
    }
    return { ...job };
  }

  /**
   * Lists all sync jobs for a tenant
   */
  public listSyncJobs(tenantId: string): SyncJobRecord[] {
    if (!tenantId) return [];
    return Array.from(this.syncJobs.values()).filter(j => j.tenantId === tenantId);
  }
}

export const syncJobEngine = SyncJobEngine.getInstance();
