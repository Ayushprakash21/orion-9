/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Workflow Trigger Engine
 * 
 * Ingests intelligence events (Signals, Exceptions, Predictions, Decisions, Schedules, Recommendations)
 * and correlates them against active registered workflow definitions within the tenant.
 */

import { WorkflowTrigger, WorkflowDefinition, WorkflowTriggerSourceType } from './types';
import { workflowVersionService } from './WorkflowVersionService';
import { workflowAuditEngine } from './WorkflowAuditEngine';

export class WorkflowTriggerEngine {
  private static instance: WorkflowTriggerEngine;
  private activeTriggers: Map<string, WorkflowTrigger[]> = new Map(); // key: tenantId

  private constructor() {}

  public static getInstance(): WorkflowTriggerEngine {
    if (!WorkflowTriggerEngine.instance) {
      WorkflowTriggerEngine.instance = new WorkflowTriggerEngine();
    }
    return WorkflowTriggerEngine.instance;
  }

  /**
   * Constructs and validates a standardized WorkflowTrigger
   */
  public createTrigger(
    tenantId: string,
    sourceType: WorkflowTriggerSourceType,
    sourceId: string,
    eventType: string,
    payload: Record<string, any>,
    correlationId?: string,
    causationId?: string
  ): WorkflowTrigger {
    if (!tenantId) throw new Error('Trigger validation error: tenantId is required');
    if (!sourceType) throw new Error('Trigger validation error: sourceType is required');
    if (!eventType) throw new Error('Trigger validation error: eventType is required');

    const triggerId = `TRIG-${tenantId}-${eventType}-${Date.now()}`;
    const trigger: WorkflowTrigger = {
      triggerId,
      tenantId,
      sourceType,
      sourceId,
      eventType,
      correlationId: correlationId || `CORR-${Date.now()}-${Math.floor(Date.now() % 10000)}`,
      causationId,
      timestamp: new Date().toISOString(),
      payloadReference: JSON.parse(JSON.stringify(payload || {}))
    };

    const list = this.activeTriggers.get(tenantId) || [];
    list.push(trigger);
    this.activeTriggers.set(tenantId, list);

    return trigger;
  }

  /**
   * Matches an incoming trigger to active workflow definitions for that tenant
   */
  public matchWorkflows(trigger: WorkflowTrigger, definitions: WorkflowDefinition[]): WorkflowDefinition[] {
    return definitions.filter(def => {
      if (def.tenantId !== trigger.tenantId) return false;
      if (def.status !== 'ACTIVE') return false;
      if (def.trigger.eventType !== trigger.eventType) return false;
      if (def.trigger.sourceType && def.trigger.sourceType !== trigger.sourceType) return false;
      return true;
    });
  }

  public getTriggers(tenantId: string): WorkflowTrigger[] {
    return JSON.parse(JSON.stringify(this.activeTriggers.get(tenantId) || []));
  }

  public clear(): void {
    this.activeTriggers.clear();
  }
}

export const workflowTriggerEngine = WorkflowTriggerEngine.getInstance();
