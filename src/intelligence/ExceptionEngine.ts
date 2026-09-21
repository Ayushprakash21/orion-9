/**
 * ORION-9 WAVE 6 — EXCEPTION INTELLIGENCE ENGINE
 *
 * Re-architected, tenant-isolated exception lifecycle engine.
 * Converts operational signals into governed exceptions with:
 * - 9 standard lifecycle statuses (OPEN -> ACKNOWLEDGED -> INVESTIGATING -> ACTION_PROPOSED -> PENDING_APPROVAL -> RESOLVED -> CLOSED)
 * - Explainable financial and service impact calculations
 * - SLA due date management
 * - Multi-tenant Firestore persistence in 'exceptions' collection
 */

import { ExceptionIntelligence, ExceptionStatus, ExceptionCategory, Signal, SignalSeverity } from './types';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export interface CreateExceptionParams {
  tenantId: string;
  type: string;
  category: ExceptionCategory;
  severity: SignalSeverity;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  owner?: string;
  entityReferences: Array<{ entityType: string; entityId: string }>;
  businessImpact: string;
  financialImpact: number;
  customerImpact: string;
  serviceImpact: string;
  slaHours?: number;
  recommendedAction?: string;
  correlationId?: string;
  signalIds?: string[];
}

export class ExceptionEngine {
  private static instance: ExceptionEngine;
  private exceptions: Map<string, ExceptionIntelligence> = new Map();

  private constructor() {}

  public static getInstance(): ExceptionEngine {
    if (!ExceptionEngine.instance) {
      ExceptionEngine.instance = new ExceptionEngine();
    }
    return ExceptionEngine.instance;
  }

  /**
   * Promotes an operational signal to a governed exception
   */
  public async createFromSignal(signal: Signal, additionalContext?: Partial<CreateExceptionParams>): Promise<ExceptionIntelligence> {
    const categoryMap: Record<string, ExceptionCategory> = {
      LOW_INVENTORY: 'INVENTORY',
      STOCKOUT_RISK: 'INVENTORY',
      SUPPLIER_DELAY: 'PROCUREMENT',
      SHIPMENT_DELAY: 'LOGISTICS',
      ETA_DEVIATION: 'LOGISTICS',
      PO_CONFIRMATION_DELAY: 'PROCUREMENT',
      QUALITY_DETERIORATION: 'QUALITY',
      DEMAND_SPIKE: 'INVENTORY',
      DEMAND_DROP: 'INVENTORY',
      CAPACITY_SHORTAGE: 'SUPPLIER',
      SERVICE_RISK: 'SERVICE',
      COST_SPIKE: 'FINANCIAL',
      LEAD_TIME_INCREASE: 'SUPPLIER',
    };

    const category = categoryMap[signal.signalType] || 'INVENTORY';

    // Calculate baseline financial impact based on severity
    let financialImpact = additionalContext?.financialImpact || 0;
    if (!financialImpact) {
      if (signal.severity === 'CRITICAL') financialImpact = 50000;
      else if (signal.severity === 'HIGH') financialImpact = 15000;
      else if (signal.severity === 'MEDIUM') financialImpact = 5000;
      else financialImpact = 1000;
    }

    const priority = signal.severity === 'CRITICAL' ? 'CRITICAL' : (signal.severity === 'HIGH' ? 'HIGH' : 'MEDIUM');
    const slaHours = signal.severity === 'CRITICAL' ? 4 : (signal.severity === 'HIGH' ? 24 : 72);

    return this.createException({
      tenantId: signal.tenantId,
      type: signal.signalType.replace(/_/g, ' '),
      category,
      severity: signal.severity,
      priority,
      entityReferences: [{ entityType: signal.entityType, entityId: signal.entityId }],
      businessImpact: signal.evidence.join(' '),
      financialImpact,
      customerImpact: signal.severity === 'CRITICAL' ? 'Immediate SLA breach and line stoppage risk' : 'Elevated risk of service level degradation',
      serviceImpact: `${signal.signalType} active on ${signal.entityType}:${signal.entityId}`,
      slaHours,
      recommendedAction: additionalContext?.recommendedAction || `Investigate ${signal.signalType} condition.`,
      correlationId: signal.correlationId || signal.signalId,
      signalIds: [signal.signalId],
    });
  }

  /**
   * Create a new governed exception
   */
  public async createException(params: CreateExceptionParams): Promise<ExceptionIntelligence> {
    const now = new Date();
    const exceptionId = `ex-${params.tenantId}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const dueAt = new Date(now.getTime() + (params.slaHours || 24) * 60 * 60 * 1000).toISOString();

    const riskScore = params.severity === 'CRITICAL' ? 95 : (params.severity === 'HIGH' ? 75 : (params.severity === 'MEDIUM' ? 50 : 25));

    const ex: ExceptionIntelligence = {
      exceptionId,
      tenantId: params.tenantId,
      type: params.type,
      category: params.category,
      severity: params.severity,
      priority: params.priority || 'MEDIUM',
      status: 'OPEN',
      owner: params.owner || 'unassigned',
      entityReferences: params.entityReferences,
      businessImpact: params.businessImpact,
      financialImpact: params.financialImpact,
      customerImpact: params.customerImpact,
      serviceImpact: params.serviceImpact,
      detectedAt: now.toISOString(),
      dueAt,
      rootCauseStatus: 'UNKNOWN',
      recommendedAction: params.recommendedAction,
      riskScore,
      confidence: 0.95,
      correlationId: params.correlationId || exceptionId,
      signalIds: params.signalIds || [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.exceptions.set(`${ex.tenantId}:${ex.exceptionId}`, ex);

    // Persist to Firestore
    try {
      const db = getFirebaseFirestore();
      if (db) {
        await setDoc(doc(db, 'exceptions', `${ex.tenantId}_${ex.exceptionId}`), ex);
      }
    } catch (err) {
      // Non-fatal if offline
    }

    return ex;
  }

  /**
   * Transition exception lifecycle status
   */
  public async transitionStatus(
    tenantId: string,
    exceptionId: string,
    newStatus: ExceptionStatus,
    reason?: string
  ): Promise<ExceptionIntelligence> {
    const key = `${tenantId}:${exceptionId}`;
    const ex = this.exceptions.get(key);
    if (!ex) {
      throw new Error(`Exception not found: ${exceptionId} in tenant ${tenantId}`);
    }

    // State transition guardrails
    const allowableTransitions: Record<ExceptionStatus, ExceptionStatus[]> = {
      OPEN: ['ACKNOWLEDGED', 'INVESTIGATING', 'SUPPRESSED', 'REJECTED'],
      ACKNOWLEDGED: ['INVESTIGATING', 'ACTION_PROPOSED', 'SUPPRESSED'],
      INVESTIGATING: ['ACTION_PROPOSED', 'PENDING_APPROVAL', 'RESOLVED', 'REJECTED'],
      ACTION_PROPOSED: ['PENDING_APPROVAL', 'INVESTIGATING', 'REJECTED'],
      PENDING_APPROVAL: ['RESOLVED', 'ACTION_PROPOSED', 'REJECTED'],
      RESOLVED: ['CLOSED', 'INVESTIGATING'],
      CLOSED: [],
      REJECTED: ['INVESTIGATING'],
      SUPPRESSED: ['OPEN', 'INVESTIGATING'],
    };

    if (!allowableTransitions[ex.status].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${ex.status} to ${newStatus} for exception ${exceptionId}`);
    }

    ex.status = newStatus;
    ex.updatedAt = new Date().toISOString();

    this.exceptions.set(key, ex);

    try {
      const db = getFirebaseFirestore();
      if (db) {
        await setDoc(doc(db, 'exceptions', `${ex.tenantId}_${ex.exceptionId}`), ex);
      }
    } catch (err) {}

    return ex;
  }

  public getExceptions(tenantId: string): ExceptionIntelligence[] {
    const results: ExceptionIntelligence[] = [];
    for (const [key, ex] of this.exceptions.entries()) {
      if (ex.tenantId === tenantId) {
        results.push(ex);
      }
    }
    return results;
  }

  public getException(tenantId: string, exceptionId: string): ExceptionIntelligence | undefined {
    return this.exceptions.get(`${tenantId}:${exceptionId}`);
  }

  public reset(): void {
    this.exceptions.clear();
  }
}

export const exceptionEngine = ExceptionEngine.getInstance();
