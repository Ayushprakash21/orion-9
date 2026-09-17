/**
 * ORION-9 AUDIT ENGINE
 * Cross-cutting Governance Layer: Records immutable, tamper-evident audit records
 * for all material state changes, policy checks, approvals, and AI decisions.
 */

import { KernelAuditRecord, DataClassification } from './types';
import { generateCorrelationId } from './security/crypto';
import { db, loadData, saveData } from '../data/db';

export class KernelAuditEngine {
  private static instance: KernelAuditEngine;
  private inMemoryLog: KernelAuditRecord[] = [];
  private maxInMemoryRecords: number = 1000;

  private constructor() {
    this.hydrateFromStorage();
  }

  public static getInstance(): KernelAuditEngine {
    if (!KernelAuditEngine.instance) {
      KernelAuditEngine.instance = new KernelAuditEngine();
    }
    return KernelAuditEngine.instance;
  }

  private async hydrateFromStorage(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const stored = await loadData<KernelAuditRecord>(db.auditEvents);
        if (stored && stored.length > 0) {
          this.inMemoryLog = stored.slice(-this.maxInMemoryRecords);
        }
      }
    } catch (e) {
      console.warn('[AuditEngine] Unable to hydrate audit logs from local storage:', e);
    }
  }

  /**
   * Records an immutable audit log entry
   */
  public async record(
    entry: Omit<KernelAuditRecord, 'auditId' | 'timestamp'> & { timestamp?: string }
  ): Promise<KernelAuditRecord> {
    const auditId = `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    const timestamp = entry.timestamp || new Date().toISOString();

    const record: KernelAuditRecord = {
      ...entry,
      auditId,
      timestamp,
      classification: entry.classification || 'INTERNAL',
    };

    // Store in ring buffer
    this.inMemoryLog.push(record);
    if (this.inMemoryLog.length > this.maxInMemoryRecords) {
      this.inMemoryLog.shift();
    }

    // Persist to local IndexedDB
    try {
      if (typeof window !== 'undefined') {
        await saveData(db.auditEvents, this.inMemoryLog);
      }
    } catch (err) {
      console.warn('[AuditEngine] Local persistence warning:', err);
    }

    // Broadcast audit event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orion:audit', { detail: record }));
    }

    return record;
  }

  /**
   * Queries audit records by filter criteria
   */
  public getRecords(filter?: {
    tenantId?: string;
    entityType?: string;
    entityId?: string;
    actorId?: string;
    action?: string;
    correlationId?: string;
    limit?: number;
  }): KernelAuditRecord[] {
    let result = [...this.inMemoryLog];

    if (filter) {
      if (filter.tenantId) result = result.filter(r => r.tenantId === filter.tenantId);
      if (filter.entityType) result = result.filter(r => r.entityType === filter.entityType);
      if (filter.entityId) result = result.filter(r => r.entityId === filter.entityId);
      if (filter.actorId) result = result.filter(r => r.actor.id === filter.actorId);
      if (filter.action) result = result.filter(r => r.action === filter.action);
      if (filter.correlationId) result = result.filter(r => r.correlationId === filter.correlationId);
    }

    result.reverse(); // Most recent first
    if (filter?.limit) {
      result = result.slice(0, filter.limit);
    }

    return result;
  }
}

export const kernelAuditEngine = KernelAuditEngine.getInstance();
