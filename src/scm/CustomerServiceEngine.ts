/**
 * ORION-9 CUSTOMER SERVICE & CASE MANAGEMENT ENGINE
 *
 * Implements:
 * 1. Customer issue ticketing (Late delivery, damaged goods, short shipment, return inquiries).
 * 2. SLA deadline tracking and escalation.
 * 3. Cross-linking tickets to orders, shipments, returns, and replacement dispatches.
 */

import { CustomerServiceCaseRecord } from './types';
import { eventBus } from '../kernel/events/eventBus';
import { scmPersistenceService } from '../services/scm/ScmPersistenceService';

export class CustomerServiceEngine {
  private static instance: CustomerServiceEngine;
  private cases: Map<string, CustomerServiceCaseRecord[]> = new Map();

  public static getInstance(): CustomerServiceEngine {
    if (!CustomerServiceEngine.instance) {
      CustomerServiceEngine.instance = new CustomerServiceEngine();
    }
    return CustomerServiceEngine.instance;
  }

  public openCase(params: Omit<CustomerServiceCaseRecord, 'caseId' | 'caseNumber' | 'status' | 'createdAt' | 'updatedAt'>): CustomerServiceCaseRecord {
    const record: CustomerServiceCaseRecord = {
      ...params,
      caseId: `CASE-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      caseNumber: `CS-${Date.now().toString().slice(-6)}`,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const list = this.cases.get(params.tenantId) || [];
    list.unshift(record);
    this.cases.set(params.tenantId, list);

    // Durable persistence with transactional outbox event
    scmPersistenceService.saveRecord('customer_service_cases', record.caseId, record, {
      emitEvent: true,
      eventType: 'scm.customer_service.opened',
      partitionKey: `${params.tenantId}:${record.caseId}`,
      idempotencyKey: `cs-${params.tenantId}-${record.caseId}`
    }).catch((err) => {
      console.warn('[CS-ENGINE] Async persistence failed:', err);
    });

    eventBus.emit({
      eventId: `EVT-CS-OPEN-${Date.now()}`,
      eventType: 'CUSTOMER_SERVICE_CASE_OPENED',
      tenantId: params.tenantId,
      timestamp: new Date().toISOString(),
      payload: record,
      actor: { userId: 'CUSTOMER_CARE_AGENT', role: 'operator' }
    });

    return record;
  }

  public resolveCase(tenantId: string, caseId: string, status: CustomerServiceCaseRecord['status'], resolutionNotes: string): CustomerServiceCaseRecord {
    const list = this.cases.get(tenantId) || [];
    const csCase = list.find(c => c.caseId === caseId);
    if (!csCase) throw new Error(`Case ${caseId} not found`);

    csCase.status = status;
    csCase.resolutionNotes = resolutionNotes;
    csCase.updatedAt = new Date().toISOString();

    // Durable persistence of case resolution
    scmPersistenceService.saveRecord('customer_service_cases', csCase.caseId, csCase, {
      emitEvent: true,
      eventType: 'scm.customer_service.resolved',
      partitionKey: `${tenantId}:${csCase.caseId}`,
      idempotencyKey: `cs-res-${tenantId}-${csCase.caseId}`
    }).catch((err) => {
      console.warn('[CS-ENGINE] Async update failed:', err);
    });

    eventBus.emit({
      eventId: `EVT-CS-RES-${Date.now()}`,
      eventType: 'CUSTOMER_SERVICE_CASE_RESOLVED',
      tenantId,
      timestamp: new Date().toISOString(),
      payload: { caseId, status, resolutionNotes },
      actor: { userId: 'CUSTOMER_CARE_LEAD', role: 'admin' }
    });

    return csCase;
  }

  /**
   * Reconstruct authoritative state from storage for a fresh instance.
   */
  public async hydrateFromStorage(tenantId: string): Promise<CustomerServiceCaseRecord[]> {
    const stored = await scmPersistenceService.listRecords<CustomerServiceCaseRecord>('customer_service_cases', tenantId);
    if (stored.length > 0) {
      this.cases.set(tenantId, stored);
      return stored;
    }
    return this.cases.get(tenantId) || [];
  }

  public getCases(tenantId: string): CustomerServiceCaseRecord[] {
    const current = this.cases.get(tenantId);
    if (current && current.length > 0) {
      return current;
    }
    const cached = scmPersistenceService.listCachedRecords<CustomerServiceCaseRecord>('customer_service_cases', tenantId);
    if (cached.length > 0) {
      this.cases.set(tenantId, cached);
      return cached;
    }
    return [];
  }

  public clear(): void {
    this.cases.clear();
  }
}

export const customerServiceEngine = CustomerServiceEngine.getInstance();
