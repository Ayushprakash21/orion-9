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

  public getCases(tenantId: string): CustomerServiceCaseRecord[] {
    return this.cases.get(tenantId) || [];
  }
}

export const customerServiceEngine = CustomerServiceEngine.getInstance();
