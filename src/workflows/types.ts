/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Domain Types & Schemas
 * 
 * Strict enterprise-grade typing for multi-tenant, versioned, policy-gated,
 * Kernel-integrated autonomous workflows.
 */

export type AutonomyLevel =
  | 'LEVEL_0_OBSERVE'
  | 'LEVEL_1_RECOMMEND'
  | 'LEVEL_2_DRAFT'
  | 'LEVEL_3_APPROVAL_GATED'
  | 'LEVEL_4_GOVERNED_AUTONOMOUS'
  | 'LEVEL_5_PROHIBITED';

export const AUTONOMY_LEVEL_VALUES: Record<AutonomyLevel, number> = {
  LEVEL_0_OBSERVE: 0,
  LEVEL_1_RECOMMEND: 1,
  LEVEL_2_DRAFT: 2,
  LEVEL_3_APPROVAL_GATED: 3,
  LEVEL_4_GOVERNED_AUTONOMOUS: 4,
  LEVEL_5_PROHIBITED: 5,
};

export type WorkflowDefinitionStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'SUSPENDED'
  | 'DISABLED'
  | 'ARCHIVED';

export type WorkflowInstanceStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'WAITING_APPROVAL'
  | 'WAITING_RETRY'
  | 'WAITING_EXTERNAL'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'TIMED_OUT'
  | 'COMPENSATING'
  | 'COMPENSATED'
  | 'ESCALATED';

export interface WorkflowTransition {
  from: WorkflowInstanceStatus;
  to: WorkflowInstanceStatus;
  allowed: boolean;
  reason?: string;
}

export type WorkflowRiskClass = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type WorkflowStepType =
  | 'CONDITION'
  | 'ACTION'
  | 'APPROVAL'
  | 'WAIT_EXTERNAL'
  | 'SUB_WORKFLOW'
  | 'COMPENSATION'
  | 'FORK'
  | 'JOIN';

export type WorkflowTriggerSourceType =
  | 'SIGNAL'
  | 'EXCEPTION'
  | 'PREDICTION'
  | 'DECISION'
  | 'EVENT'
  | 'SCHEDULE'
  | 'MANUAL'
  | 'RECOMMENDATION';

export type WorkflowActionType =
  | 'CREATE_ACTION_REQUEST'
  | 'REQUEST_APPROVAL'
  | 'CREATE_EXCEPTION'
  | 'SEND_NOTIFICATION'
  | 'CREATE_TASK'
  | 'REQUEST_SUPPLIER_CONFIRMATION'
  | 'DRAFT_PO_CHANGE'
  | 'DRAFT_REROUTE'
  | 'DRAFT_EXPEDITE'
  | 'UPDATE_WORKFLOW_STATE'
  | 'ESCALATE'
  | 'RETRY'
  | 'COMPENSATE';

export interface WorkflowConditionClause {
  field: string;
  operator:
    | 'EQUALS'
    | 'NOT_EQUALS'
    | 'GREATER_THAN'
    | 'LESS_THAN'
    | 'GREATER_THAN_OR_EQUAL'
    | 'LESS_THAN_OR_EQUAL'
    | 'IN'
    | 'CONTAINS';
  value: any;
}

export interface WorkflowCondition {
  id: string;
  operator?: 'AND' | 'OR' | 'NOT';
  clauses?: WorkflowConditionClause[];
  subConditions?: WorkflowCondition[];
}

export interface WorkflowAction {
  actionId: string;
  type: WorkflowActionType;
  targetEntity?: string;
  entityId?: string;
  payload: Record<string, any>;
  riskClass: WorkflowRiskClass;
  commandType?: string;
  isMaterial: boolean;
}

export interface WorkflowApprovalRequirement {
  requiredRole: string;
  timeoutMs?: number;
  autoEscalateToRole?: string;
}

export interface WorkflowWaitConfig {
  eventType: string;
  correlationKey: string;
  timeoutMs: number;
  onTimeoutAction: 'RETRY' | 'ESCALATE' | 'COMPENSATE' | 'FAIL';
}

export interface WorkflowRetryPolicy {
  maxRetries: number;
  backoffStrategy: 'FIXED' | 'LINEAR' | 'EXPONENTIAL';
  initialDelayMs: number;
  maxDelayMs?: number;
  retryableErrorCodes?: string[];
}

export interface WorkflowTimeoutPolicy {
  workflowTimeoutMs?: number;
  stepTimeoutMs?: number;
  onTimeout: 'FAIL' | 'COMPENSATE' | 'ESCALATE';
}

export interface WorkflowCompensationPolicy {
  autoCompensateOnFailure: boolean;
  compensationOrder: 'REVERSE' | 'PARALLEL';
}

export interface WorkflowStep {
  stepId: string;
  name: string;
  description?: string;
  order: number;
  type: WorkflowStepType;
  condition?: WorkflowCondition;
  action?: WorkflowAction;
  approval?: WorkflowApprovalRequirement;
  waitConfig?: WorkflowWaitConfig;
  onSuccessStepId?: string;
  onFailureStepId?: string;
  timeoutMs?: number;
  retryPolicy?: WorkflowRetryPolicy;
  compensatingStepId?: string;
}

export interface WorkflowTrigger {
  triggerId: string;
  tenantId: string;
  sourceType: WorkflowTriggerSourceType;
  sourceId: string;
  eventType: string;
  correlationId: string;
  causationId?: string;
  timestamp: string;
  payloadReference: Record<string, any>;
}

export interface WorkflowApprovalPolicy {
  requireApprovalForRisk: WorkflowRiskClass[];
  disallowAiSelfApproval: boolean;
  dualAuthorizationRequired?: boolean;
}

export interface WorkflowDefinition {
  workflowId: string;
  tenantId: string;
  name: string;
  description: string;
  version: string;
  status: WorkflowDefinitionStatus;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  variables?: Record<string, any>;
  policyReferences?: string[];
  riskClass: WorkflowRiskClass;
  autonomyLevel: AutonomyLevel;
  approvalPolicy?: WorkflowApprovalPolicy;
  timeoutPolicy?: WorkflowTimeoutPolicy;
  retryPolicy?: WorkflowRetryPolicy;
  compensationPolicy?: WorkflowCompensationPolicy;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowVersion {
  versionId: string;
  workflowId: string;
  tenantId: string;
  version: string;
  definitionSnapshot: WorkflowDefinition;
  immutable: boolean;
  publishedBy: string;
  publishedAt: string;
  changelog?: string;
}

export interface WorkflowStepExecution {
  executionId: string;
  tenantId: string;
  workflowInstanceId: string;
  stepId: string;
  stepName: string;
  actionId?: string;
  actorId: string;
  actorType: 'USER' | 'AGENT' | 'WORKFLOW_KERNEL';
  correlationId: string;
  causationId?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'WAITING' | 'REJECTED';
  output?: any;
  errorCode?: string;
  errorMessage?: string;
  commandEnvelopeId?: string;
}

export interface WorkflowInstance {
  workflowInstanceId: string;
  workflowId: string;
  workflowVersion: string;
  tenantId: string;
  status: WorkflowInstanceStatus;
  currentStepIndex: number;
  currentStepId?: string;
  triggerReference: WorkflowTrigger;
  contextData: Record<string, any>;
  correlationId: string;
  causationId?: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  failureReason?: string;
  waitingReason?: string;
  activeApprovalId?: string;
  retryCount: number;
  history: WorkflowStepExecution[];
}

export interface WorkflowApproval {
  approvalId: string;
  tenantId: string;
  workflowInstanceId: string;
  stepId: string;
  actionId: string;
  requiredRole: string;
  requestedBy: {
    id: string;
    type: 'USER' | 'AGENT' | 'WORKFLOW';
    name: string;
  };
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  approvedBy?: {
    id: string;
    role: string;
    name: string;
  };
  approvedAt?: string;
  rejectionReason?: string;
  expiresAt?: string;
}

export interface WorkflowRetry {
  retryId: string;
  tenantId: string;
  workflowInstanceId: string;
  stepId: string;
  retryCount: number;
  maxRetries: number;
  backoffStrategy: 'FIXED' | 'LINEAR' | 'EXPONENTIAL';
  nextRetryAt: string;
  lastError: string;
  status: 'PENDING' | 'EXHAUSTED' | 'CANCELLED' | 'COMPLETED';
}

export interface WorkflowCompensation {
  compensationId: string;
  tenantId: string;
  workflowInstanceId: string;
  originalStepId: string;
  compensatingStepId: string;
  actionType: WorkflowActionType;
  commandType: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface WorkflowOutcome {
  outcomeId: string;
  tenantId: string;
  workflowInstanceId: string;
  workflowId: string;
  finalStatus: WorkflowInstanceStatus;
  totalDurationMs: number;
  stepsExecuted: number;
  commandsDispatched: number;
  approvalsGranted: number;
  compensationsExecuted: number;
  businessImpactSummary?: string;
  recordedAt: string;
}

export interface WorkflowSchedule {
  scheduleId: string;
  tenantId: string;
  workflowId: string;
  instanceId?: string;
  stepId?: string;
  scheduleType?: 'WAIT_FOR_TIMER' | 'STEP_TIMEOUT' | 'APPROVAL_TIMEOUT' | 'TASK_TIMEOUT' | 'SLA_DEADLINE' | 'RETRY_DELAY' | 'CRON';
  cronExpression?: string;
  delayMs?: number;
  executeAt?: string;
  runAt?: string;
  nextRunAt?: string;
  lastRunAt?: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DISABLED' | 'EXPIRED';
  attempt?: number;
  correlationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowCheckpoint {
  checkpointId: string;
  tenantId: string;
  workflowId: string;
  instanceId: string;
  stepId: string;
  stepVersion?: string;
  currentStepIndex: number;
  state: WorkflowInstanceStatus;
  status: WorkflowInstanceStatus;
  input?: Record<string, any>;
  output?: Record<string, any>;
  attempt: number;
  correlationId: string;
  causationId?: string;
  createdAt: string;
  updatedAt: string;
  previousCheckpointId?: string;
  idempotencyKey?: string;
  error?: {
    code?: string;
    message?: string;
    stack?: string;
  };
}

export interface WorkflowDlqEntry {
  dlqId: string;
  tenantId: string;
  workflowId: string;
  instanceId: string;
  stepId: string;
  failureCode: string;
  failureMessage: string;
  attemptCount: number;
  lastAttemptAt: string;
  originalPayloadReference: Record<string, any>;
  checkpointId?: string;
  correlationId: string;
  causationId?: string;
  status: 'OPEN' | 'RETRYING' | 'REDRIVEN' | 'RESOLVED' | 'CANCELLED';
  assignedTo?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowForkJoinBranch {
  branchId: string;
  stepIds: string[];
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  completedAt?: string;
  output?: Record<string, any>;
}

export interface WorkflowJoinState {
  joinStepId: string;
  forkStepId: string;
  tenantId: string;
  instanceId: string;
  branches: WorkflowForkJoinBranch[];
  requiredBranchCount: number;
  status: 'WAITING' | 'SATISFIED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

