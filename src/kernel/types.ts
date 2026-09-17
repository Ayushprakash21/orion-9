/**
 * ORION-9 SUPPLY CHAIN OPERATING SYSTEM — KERNEL CORE TYPES
 * Canonical contracts for Commands, Events, State Machines, Policies, and Audits.
 */

import { RoleCode, PermissionCode } from '../types/auth';

/**
 * Data classification tiers governing visibility, AI context, and export
 */
export type DataClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';

/**
 * AI Operating Modes as defined in the Orion-9 Architectural Constitution
 */
export type AIOperatingMode =
  | 'OBSERVE'           // Mode 1: AI can analyze authorized data
  | 'ASSIST'            // Mode 2: AI can prepare drafts
  | 'RECOMMEND'         // Mode 3: AI recommends an action
  | 'APPROVAL_GATED'    // Mode 4: AI prepares the action and stops for human approval
  | 'GOVERNED_AUTOMATION' // Mode 5: AI/system can execute explicitly authorized low-risk actions
  | 'PROHIBITED';       // Mode 6: AI cannot perform the action

/**
 * Policy Evaluation Outcomes
 */
export type PolicyEvaluationResult =
  | 'ALLOW'
  | 'ALLOW_WITH_CONTROLS'
  | 'REQUIRE_APPROVAL'
  | 'MASK'
  | 'BLOCK'
  | 'ESCALATE';

/**
 * Standard Event Envelope (Layer 6 Event Fabric)
 */
export interface EventEnvelope<T = any> {
  eventId: string;
  eventType: string;
  version: string;
  timestamp: string;
  actor: {
    id: string;
    type: 'USER' | 'AI_AGENT' | 'SYSTEM' | 'EXTERNAL_INTEGRATION';
    role?: RoleCode | string;
    name?: string;
    agentId?: string;
    model?: string;
  };
  tenant: {
    organizationId: string;
    organizationName?: string;
  };
  source: string;
  correlationId: string;
  causationId?: string;
  entityId?: string;
  entityType?: string;
  payload: T;
  schemaVersion: string;
  classification?: DataClassification;
}

/**
 * Command Envelope (Layer 4 Orion Kernel)
 */
export interface CommandEnvelope<T = any> {
  commandId: string;
  commandType: string;
  timestamp: string;
  actor: {
    id: string;
    type: 'USER' | 'AI_AGENT' | 'SYSTEM' | 'EXTERNAL_INTEGRATION';
    role?: RoleCode | string;
    name?: string;
    agentId?: string;
  };
  tenant: {
    organizationId: string;
    organizationName?: string;
  };
  entityId?: string;
  entityType?: string;
  payload: T;
  correlationId: string;
  idempotencyKey?: string;
  requiredPermission?: PermissionCode | string;
  classification?: DataClassification;
}

/**
 * Command Execution Result
 */
export interface CommandResult<R = any> {
  success: boolean;
  commandId: string;
  correlationId: string;
  result?: R;
  policyResult?: PolicyEvaluationResult;
  requiresApproval?: boolean;
  approvalId?: string;
  error?: string;
  errorCode?: string;
  executionTimestamp: string;
}

/**
 * Immutable Kernel Audit Record
 */
export interface KernelAuditRecord {
  auditId: string;
  eventId: string;
  correlationId: string;
  timestamp: string;
  actor: {
    id: string;
    type: 'USER' | 'AI_AGENT' | 'SYSTEM' | 'EXTERNAL_INTEGRATION';
    role?: RoleCode | string;
    name?: string;
    agentId?: string;
    model?: string;
  };
  tenantId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: any;
  afterState?: any;
  policyEvaluation?: {
    policyId?: string;
    result: PolicyEvaluationResult;
    reason?: string;
  };
  approval?: {
    required: boolean;
    approvalId?: string;
    approverId?: string;
    approvedAt?: string;
  };
  result: 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'PENDING_APPROVAL';
  failureReason?: string;
  classification: DataClassification;
}

/**
 * State Transition Rule & Definition
 */
export interface StateTransitionRule<S extends string> {
  from: S | S[];
  to: S;
  allowedRoles?: (RoleCode | string)[];
  requiresApproval?: boolean;
  description?: string;
}

export interface StateMachineConfig<S extends string> {
  entityType: string;
  initialState: S;
  terminalStates: S[];
  transitions: StateTransitionRule<S>[];
}

export interface StateTransitionResult<S extends string> {
  valid: boolean;
  fromState: S;
  toState: S;
  reason?: string;
}

/**
 * Policy Rule Definition
 */
export interface PolicyRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  version: string;
  targetActions: string[];
  targetEntities: string[];
  conditions: {
    maxMonetaryAmount?: number;
    requiredRoles?: (RoleCode | string)[];
    restrictedRoles?: (RoleCode | string)[];
    supplierRiskThreshold?: number;
    criticalOnly?: boolean;
    dataClassification?: DataClassification[];
    tenantIds?: string[];
  };
  outcome: PolicyEvaluationResult;
  reason: string;
}

/**
 * Approval Record Definition
 */
export interface ApprovalRecord {
  approvalId: string;
  commandId: string;
  correlationId: string;
  requester: {
    id: string;
    type: 'USER' | 'AI_AGENT' | 'SYSTEM' | 'EXTERNAL_INTEGRATION';
    name?: string;
    role?: string;
  };
  approver?: {
    id: string;
    name: string;
    role: string;
  };
  policyId?: string;
  entityType: string;
  entityId: string;
  action: string;
  amount?: number;
  currency?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  decidedAt?: string;
  comments?: string;
  evidence?: any;
}
