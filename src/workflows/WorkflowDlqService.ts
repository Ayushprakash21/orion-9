/**
 * ORION-9 PART 4 TRACK 6: ENTERPRISE WORKFLOW PLATFORM
 * Dead Letter Queue (DLQ) Service
 * 
 * Manages durable terminal workflow failures, inspection, human intervention assignment,
 * and governed re-drive operations with strict Kernel authorization.
 */

import { WorkflowDlqEntry } from './types';
import { db, saveData, loadData } from '../data/db';

export class WorkflowDlqService {
  private static instance: WorkflowDlqService;
  private dlqEntries: Map<string, WorkflowDlqEntry> = new Map();

  private constructor() {}

  public static getInstance(): WorkflowDlqService {
    if (!WorkflowDlqService.instance) {
      WorkflowDlqService.instance = new WorkflowDlqService();
    }
    return WorkflowDlqService.instance;
  }

  /**
   * Enqueues a failed workflow step execution into the DLQ
   */
  public async enqueue(entry: Omit<WorkflowDlqEntry, 'dlqId' | 'createdAt' | 'updatedAt' | 'status'>): Promise<WorkflowDlqEntry> {
    const dlqId = `DLQ-${entry.tenantId}-${entry.workflowId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const dlqEntry: WorkflowDlqEntry = {
      ...entry,
      dlqId,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.dlqEntries.set(dlqId, dlqEntry);

    try {
      await saveData<WorkflowDlqEntry>((db as any).workflow_dlq, [dlqEntry]);
    } catch (err) {
      console.warn(`[WorkflowDlqService] Failed to persist DLQ entry to Firestore:`, err);
    }

    return dlqEntry;
  }

  /**
   * Lists DLQ entries for a tenant
   */
  public async listEntries(tenantId: string, statusFilter?: WorkflowDlqEntry['status']): Promise<WorkflowDlqEntry[]> {
    try {
      const persisted = await loadData<WorkflowDlqEntry>((db as any).workflow_dlq);
      if (persisted && Array.isArray(persisted)) {
        for (const item of persisted) {
          if (item.tenantId === tenantId) {
            this.dlqEntries.set(item.dlqId, item);
          }
        }
      }
    } catch (err) {
      console.warn(`[WorkflowDlqService] Failed to load DLQ entries from Firestore:`, err);
    }

    return Array.from(this.dlqEntries.values()).filter(e => {
      if (e.tenantId !== tenantId) return false;
      if (statusFilter && e.status !== statusFilter) return false;
      return true;
    });
  }

  /**
   * Gets a specific DLQ entry
   */
  public getEntry(dlqId: string): WorkflowDlqEntry | undefined {
    return this.dlqEntries.get(dlqId);
  }

  /**
   * Assigns human operator intervention to a DLQ item
   */
  public async assignHumanIntervention(
    dlqId: string,
    operatorId: string,
    tenantId: string
  ): Promise<WorkflowDlqEntry> {
    const entry = this.dlqEntries.get(dlqId);
    if (!entry || entry.tenantId !== tenantId) {
      throw new Error(`DLQ entry ${dlqId} not found in tenant ${tenantId}`);
    }

    entry.assignedTo = operatorId;
    entry.updatedAt = new Date().toISOString();

    try {
      await saveData<WorkflowDlqEntry>((db as any).workflow_dlq, [entry]);
    } catch (err) {
      console.warn(`[WorkflowDlqService] Failed to update DLQ assignment:`, err);
    }

    return entry;
  }

  /**
   * Re-drives a DLQ entry for retry under governed authorization
   */
  public async redriveDlqEntry(
    dlqId: string,
    actor: { id: string; role: string; isAi: boolean },
    tenantId: string,
    notes?: string
  ): Promise<WorkflowDlqEntry> {
    if (actor.isAi) {
      throw new Error(`[Kernel Governance Violation] AI agents are prohibited from re-driving DLQ entries directly.`);
    }

    const entry = this.dlqEntries.get(dlqId);
    if (!entry || entry.tenantId !== tenantId) {
      throw new Error(`DLQ entry ${dlqId} not found in tenant ${tenantId}`);
    }

    entry.status = 'REDRIVEN';
    entry.resolutionNotes = notes || `Re-driven by human operator ${actor.id}`;
    entry.updatedAt = new Date().toISOString();

    try {
      await saveData<WorkflowDlqEntry>((db as any).workflow_dlq, [entry]);
    } catch (err) {
      console.warn(`[WorkflowDlqService] Failed to update redriven DLQ entry:`, err);
    }

    return entry;
  }

  /**
   * Cancels/resolves a DLQ entry
   */
  public async resolveEntry(
    dlqId: string,
    tenantId: string,
    resolutionNotes: string
  ): Promise<WorkflowDlqEntry> {
    const entry = this.dlqEntries.get(dlqId);
    if (!entry || entry.tenantId !== tenantId) {
      throw new Error(`DLQ entry ${dlqId} not found in tenant ${tenantId}`);
    }

    entry.status = 'RESOLVED';
    entry.resolutionNotes = resolutionNotes;
    entry.updatedAt = new Date().toISOString();

    try {
      await saveData<WorkflowDlqEntry>((db as any).workflow_dlq, [entry]);
    } catch (err) {
      console.warn(`[WorkflowDlqService] Failed to resolve DLQ entry:`, err);
    }

    return entry;
  }

  public clear(): void {
    this.dlqEntries.clear();
  }
}

export const workflowDlqService = WorkflowDlqService.getInstance();
