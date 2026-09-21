/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Workflow Idempotency Engine
 * 
 * Ensures at-most-once execution for all workflow actions and material Kernel commands.
 * Deduplicates repeated action requests and returns cached results.
 */

export interface IdempotencyRecord {
  idempotencyKey: string;
  tenantId: string;
  workflowInstanceId: string;
  workflowStepId: string;
  actionId: string;
  commandEnvelopeId?: string;
  status: 'PENDING' | 'EXECUTED' | 'FAILED';
  result?: any;
  createdAt: string;
  updatedAt: string;
}

export class WorkflowIdempotency {
  private static instance: WorkflowIdempotency;
  private store: Map<string, IdempotencyRecord> = new Map(); // key: `${tenantId}:${idempotencyKey}`

  private constructor() {}

  public static getInstance(): WorkflowIdempotency {
    if (!WorkflowIdempotency.instance) {
      WorkflowIdempotency.instance = new WorkflowIdempotency();
    }
    return WorkflowIdempotency.instance;
  }

  public generateKey(
    tenantId: string,
    workflowInstanceId: string,
    stepId: string,
    actionId: string
  ): string {
    return `IDEMP-${tenantId}-${workflowInstanceId}-${stepId}-${actionId}`;
  }

  public getRecord(tenantId: string, key: string): IdempotencyRecord | undefined {
    return this.store.get(`${tenantId}:${key}`);
  }

  public registerPending(
    tenantId: string,
    idempotencyKey: string,
    workflowInstanceId: string,
    stepId: string,
    actionId: string
  ): boolean {
    const compositeKey = `${tenantId}:${idempotencyKey}`;
    const existing = this.store.get(compositeKey);
    if (existing) {
      return false; // Already registered
    }

    this.store.set(compositeKey, {
      idempotencyKey,
      tenantId,
      workflowInstanceId,
      workflowStepId: stepId,
      actionId,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return true;
  }

  public markExecuted(
    tenantId: string,
    idempotencyKey: string,
    result: any,
    commandEnvelopeId?: string
  ): void {
    const compositeKey = `${tenantId}:${idempotencyKey}`;
    const existing = this.store.get(compositeKey);
    if (existing) {
      existing.status = 'EXECUTED';
      existing.result = result;
      existing.commandEnvelopeId = commandEnvelopeId;
      existing.updatedAt = new Date().toISOString();
    }
  }

  public markFailed(
    tenantId: string,
    idempotencyKey: string,
    error: any
  ): void {
    const compositeKey = `${tenantId}:${idempotencyKey}`;
    const existing = this.store.get(compositeKey);
    if (existing) {
      existing.status = 'FAILED';
      existing.result = { error: String(error) };
      existing.updatedAt = new Date().toISOString();
    }
  }

  public clear(): void {
    this.store.clear();
  }
}

export const workflowIdempotency = WorkflowIdempotency.getInstance();
