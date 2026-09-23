/**
 * ORION-9 PART 4 TRACK 9: OBSERVABILITY & OPERATIONAL INTELLIGENCE
 * SLI / SLO Framework Engine
 *
 * Configures, calculates, and evaluates Service Level Indicators (SLIs) and Service Level Objectives (SLOs)
 * across all Orion domains. Emits telemetry events and breach signals on threshold violations.
 */

import { kernelEventBus } from '../kernel/EventBus';
import { kernelAuditEngine } from '../kernel/AuditEngine';
import { db, loadData, saveData } from '../data/db';

export interface SloDefinition {
  sloId: string;
  tenantId: string;
  domain: 'WORKFLOW' | 'INTEGRATION' | 'KNOWLEDGE' | 'EVENT_FABRIC' | 'CONTROL_TOWER' | 'AI_WORKFORCE' | 'SCM_CORE';
  name: string;
  description: string;
  metricName: string;
  targetPercent: number; // e.g. 99.5 for 99.5%
  thresholdValue?: number; // e.g. 250 for 250ms
  windowPeriodMs: number; // e.g. 24h in ms
  status: 'MEETING' | 'BREACHED' | 'WARNING' | 'NO_DATA';
  currentValue: number;
  lastEvaluatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SloEvaluationResult {
  sloId: string;
  tenantId: string;
  domain: string;
  name: string;
  meeting: boolean;
  targetPercent: number;
  currentValue: number;
  timestamp: string;
  breached: boolean;
}

export class SloEngine {
  private static instance: SloEngine;
  private slos: Map<string, SloDefinition> = new Map();

  private constructor() {
    this.seedDefaultSlos();
    this.hydrate();
  }

  public static getInstance(): SloEngine {
    if (!SloEngine.instance) {
      SloEngine.instance = new SloEngine();
    }
    return SloEngine.instance;
  }

  private seedDefaultSlos(): void {
    const tenantId = 'org-tenant-a';
    const now = new Date().toISOString();
    const dayMs = 86400000;

    const defaults: SloDefinition[] = [
      {
        sloId: 'slo-workflow-success-01',
        tenantId,
        domain: 'WORKFLOW',
        name: 'Workflow Execution Success Rate',
        description: 'Percentage of business workflows completing cleanly without unhandled failure.',
        metricName: 'workflow.completed.rate',
        targetPercent: 99.5,
        windowPeriodMs: dayMs,
        status: 'MEETING',
        currentValue: 99.8,
        lastEvaluatedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        sloId: 'slo-integration-latency-02',
        tenantId,
        domain: 'INTEGRATION',
        name: 'Integration Gateway Inbound Latency',
        description: '95th percentile latency of integration gateway inbound payload processing.',
        metricName: 'integration.latency.p95',
        targetPercent: 99.0,
        thresholdValue: 100, // < 100ms
        windowPeriodMs: dayMs,
        status: 'MEETING',
        currentValue: 42,
        lastEvaluatedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        sloId: 'slo-knowledge-rag-03',
        tenantId,
        domain: 'KNOWLEDGE',
        name: 'RAG Knowledge Retrieval Latency',
        description: 'Hybrid vector + keyword knowledge retrieval response latency.',
        metricName: 'knowledge.retrieval.latency.p95',
        targetPercent: 98.0,
        thresholdValue: 250, // < 250ms
        windowPeriodMs: dayMs,
        status: 'MEETING',
        currentValue: 185,
        lastEvaluatedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        sloId: 'slo-ai-proposal-04',
        tenantId,
        domain: 'AI_WORKFORCE',
        name: 'AI Agent Proposal Governance Compliance',
        description: 'Percentage of AI agent proposals passing policy evaluation without safety block.',
        metricName: 'ai.proposal.compliance.rate',
        targetPercent: 99.9,
        windowPeriodMs: dayMs,
        status: 'MEETING',
        currentValue: 100.0,
        lastEvaluatedAt: now,
        createdAt: now,
        updatedAt: now,
      }
    ];

    defaults.forEach((s) => this.slos.set(s.sloId, s));
  }

  private async hydrate(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const stored = await loadData<SloDefinition>(db.metadata);
        if (stored && stored.length > 0) {
          stored.forEach((s) => {
            if (s.sloId) this.slos.set(s.sloId, s);
          });
        }
      }
    } catch (e) {
      console.warn('[SloEngine] Hydration warning:', e);
    }
  }

  private async persist(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      await saveData(db.metadata, Array.from(this.slos.values()));
    } catch (e) {
      console.warn('[SloEngine] Persistence warning:', e);
    }
  }

  /**
   * Registers a new domain SLO definition
   */
  public registerSlo(slo: Omit<SloDefinition, 'createdAt' | 'updatedAt' | 'lastEvaluatedAt'>): SloDefinition {
    const now = new Date().toISOString();
    const record: SloDefinition = {
      ...slo,
      lastEvaluatedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    this.slos.set(record.sloId, record);
    this.persist();

    kernelAuditEngine.record({
      action: 'REGISTER_SLO_DEFINITION',
      actor: { id: 'SloEngine', type: 'SYSTEM', name: 'SLO Engine' },
      entityId: record.sloId,
      entityType: 'OBSERVABILITY_SLO',
      classification: 'INTERNAL',
      details: { tenantId: record.tenantId, name: record.name, targetPercent: record.targetPercent }
    });

    return record;
  }

  /**
   * Evaluates an SLO against a current observed metric value
   */
  public evaluateSlo(sloId: string, observedValue: number): SloEvaluationResult {
    const slo = this.slos.get(sloId);
    if (!slo) throw new Error(`SLO '${sloId}' not found.`);

    const now = new Date().toISOString();
    let meeting = true;

    if (slo.thresholdValue !== undefined) {
      // Latency or numerical threshold (e.g. observed latency <= thresholdValue)
      meeting = observedValue <= slo.thresholdValue;
    } else {
      // Percentage success rate (e.g. observed success % >= targetPercent)
      meeting = observedValue >= slo.targetPercent;
    }

    const wasBreached = slo.status === 'BREACHED';
    slo.currentValue = observedValue;
    slo.status = meeting ? 'MEETING' : 'BREACHED';
    slo.lastEvaluatedAt = now;
    slo.updatedAt = now;

    this.persist();

    if (!meeting && !wasBreached) {
      kernelEventBus.publish('orion:observability:slo-breached', {
        sloId: slo.sloId,
        tenantId: slo.tenantId,
        domain: slo.domain,
        name: slo.name,
        targetPercent: slo.targetPercent,
        currentValue: observedValue,
      }, { actor: { id: 'SloEngine', type: 'SYSTEM', name: 'SLO Engine' } });

      kernelAuditEngine.record({
        action: 'SLO_BREACH_DETECTED',
        actor: { id: 'SloEngine', type: 'SYSTEM', name: 'SLO Engine' },
        entityId: slo.sloId,
        entityType: 'OBSERVABILITY_SLO',
        classification: 'INTERNAL',
        details: { tenantId: slo.tenantId, name: slo.name, observedValue }
      });
    }

    return {
      sloId: slo.sloId,
      tenantId: slo.tenantId,
      domain: slo.domain,
      name: slo.name,
      meeting,
      targetPercent: slo.targetPercent,
      currentValue: observedValue,
      timestamp: now,
      breached: !meeting,
    };
  }

  /**
   * Lists all SLOs for a tenant
   */
  public listSlos(tenantId: string): SloDefinition[] {
    return Array.from(this.slos.values()).filter((s) => s.tenantId === tenantId);
  }
}

export const sloEngine = SloEngine.getInstance();
