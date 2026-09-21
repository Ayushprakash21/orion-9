/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Workflow External Wait Engine
 * 
 * Manages WAITING_EXTERNAL states for external asynchronous events (ASNs, EDI 855 acknowledgements,
 * carrier milestones, webhook callbacks) with strict tenant boundary enforcement.
 */

export interface ExternalWaitRegistration {
  waitId: string;
  tenantId: string;
  workflowInstanceId: string;
  stepId: string;
  eventType: string;
  correlationKey: string;
  timeoutAt: string;
  createdAt: string;
}

export class WorkflowExternalWaitEngine {
  private static instance: WorkflowExternalWaitEngine;
  private waits: Map<string, ExternalWaitRegistration> = new Map(); // key: `${tenantId}:${correlationKey}`

  private constructor() {}

  public static getInstance(): WorkflowExternalWaitEngine {
    if (!WorkflowExternalWaitEngine.instance) {
      WorkflowExternalWaitEngine.instance = new WorkflowExternalWaitEngine();
    }
    return WorkflowExternalWaitEngine.instance;
  }

  public registerWait(
    tenantId: string,
    workflowInstanceId: string,
    stepId: string,
    eventType: string,
    correlationKey: string,
    timeoutMs: number = 24 * 60 * 60 * 1000
  ): ExternalWaitRegistration {
    const waitId = `WAIT-${tenantId}-${workflowInstanceId}-${stepId}-${Date.now()}`;
    const reg: ExternalWaitRegistration = {
      waitId,
      tenantId,
      workflowInstanceId,
      stepId,
      eventType,
      correlationKey,
      timeoutAt: new Date(Date.now() + timeoutMs).toISOString(),
      createdAt: new Date().toISOString()
    };

    this.waits.set(`${tenantId}:${correlationKey}`, reg);
    return reg;
  }

  public resolveWait(
    tenantId: string,
    correlationKey: string,
    eventType: string
  ): ExternalWaitRegistration | undefined {
    const key = `${tenantId}:${correlationKey}`;
    const wait = this.waits.get(key);

    if (!wait) {
      return undefined;
    }

    // Strict tenant isolation: cannot resolve wait of another tenant
    if (wait.tenantId !== tenantId) {
      throw new Error(`Cross-tenant security violation: Cannot resolve external wait across tenants`);
    }

    if (wait.eventType !== eventType) {
      return undefined;
    }

    // Remove wait registration upon successful match
    this.waits.delete(key);
    return wait;
  }

  public clear(): void {
    this.waits.clear();
  }
}

export const workflowExternalWaitEngine = WorkflowExternalWaitEngine.getInstance();
