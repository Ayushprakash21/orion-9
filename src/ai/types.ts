/**
 * ORION-9 WAVE 5 — AI AGENT RUNTIME & GOVERNANCE TYPES
 *
 * Core Principle:
 * AI IS A GOVERNED ACTOR. AI IS NOT AN ADMIN. AI IS NOT A SUPERUSER.
 * AI MUST NEVER BYPASS THE ORION KERNEL.
 */

import { AuthorizationActor } from '../kernel/authorization/AuthorizationEngine';
import { CommandEnvelope, CommandResult, DataClassification } from '../kernel/types';

export type AgentStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'SUSPENDED' | 'DISABLED';

export type AIOperatingMode =
  | 'OBSERVE'         // Inspect permitted data only; no execution
  | 'ASSIST'          // Prepare drafts; no material transaction without human action
  | 'RECOMMEND'       // Generate recommendations; no execution
  | 'APPROVAL_GATED'  // Prepare command; Kernel requires human approval before execution
  | 'GOVERNED'        // May execute explicitly authorized low-risk commands via Kernel
  | 'PROHIBITED';     // Execution strictly denied regardless of AI request

export type AIRiskClass = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AIMemoryType = 'SESSION' | 'TASK' | 'DECISION' | 'OUTCOME';

export type AIResponseStatus =
  | 'ANSWER'
  | 'RECOMMENDATION'
  | 'DRAFT'
  | 'ACTION_REQUEST'
  | 'PENDING_APPROVAL'
  | 'EXECUTED'
  | 'REJECTED';

/**
 * Tenant-Scoped AI Agent Definition
 */
export interface AIAgent {
  agentId: string;
  tenantId: string;
  name: string;
  description: string;
  version: string;
  status: AgentStatus;
  operatingMode: AIOperatingMode;
  capabilities: string[];
  allowedTools: string[];
  allowedCommands: string[];
  riskClass: AIRiskClass;
  createdAt: string;
  updatedAt: string;
}

/**
 * Governed AI Tool Definition
 */
export interface AITool {
  toolId: string;
  name: string;
  description: string;
  version: string;
  tenantScope: boolean;
  requiredPermissions: string[];
  riskLevel: AIRiskClass;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  allowedModes: AIOperatingMode[];
  enabled: boolean;
  execute?: (params: any, context: AIExecutionContext) => Promise<any>;
}

/**
 * AI Execution Context
 */
export interface AIExecutionContext {
  actor: AuthorizationActor;
  agent: AIAgent;
  tenantId: string;
  humanInitiatorId?: string;
  correlationId: string;
  mode: AIOperatingMode;
  causationId?: string;
}

/**
 * Typed AI Command Payload for Kernel Command Builder
 */
export interface AICommandPayload<T = any> {
  commandType: string;
  actor: AuthorizationActor;
  tenantId: string;
  targetEntity: string;
  targetId: string;
  parameters: T;
  correlationId: string;
  reason: string;
  requestedByAgent: string;
  humanInitiatorId?: string;
  classification?: DataClassification;
}

/**
 * Durable Agent Memory Entry
 */
export interface AgentMemoryEntry {
  memoryId: string;
  tenantId: string;
  agentId: string;
  type: AIMemoryType;
  source: string;
  contentReference: Record<string, any>;
  createdAt: string;
  retentionPolicy: string;
}

/**
 * Material AI Decision Record
 */
export interface AIDecisionRecord {
  decisionId: string;
  tenantId: string;
  agentId: string;
  humanInitiatorId?: string;
  commandId?: string;
  reason: string;
  recommendation: string;
  evidenceReferences: string[];
  risk: AIRiskClass;
  policy: string;
  approvalRequired: boolean;
  outcome: string;
  createdAt: string;
}

/**
 * Empirical Outcome Loop Record
 */
export interface AIOutcomeRecord {
  outcomeId: string;
  tenantId: string;
  agentId: string;
  decisionId: string;
  action: string;
  expectedOutcome: string;
  actualOutcome: string;
  success: boolean;
  failureReason?: string;
  variance?: Record<string, any>;
  timestamp: string;
}

/**
 * AI Action Audit Record
 */
export interface AIActionAudit {
  auditId: string;
  tenantId: string;
  agentId: string;
  humanInitiatorId?: string;
  toolId?: string;
  commandId?: string;
  targetEntity?: string;
  targetId?: string;
  policyName?: string;
  riskClass: AIRiskClass;
  approvalRequired: boolean;
  approverId?: string;
  executionStatus: string;
  outcomeResult: string;
  timestamp: string;
}

/**
 * Standard Governed AI Execution Result
 */
export interface GovernedAIExecutionResult {
  status: AIResponseStatus;
  message: string;
  agentId: string;
  tenantId: string;
  correlationId: string;
  commandId?: string;
  approvalId?: string;
  data?: any;
  decisionRecordId?: string;
  kernelResult?: CommandResult;
  error?: string;
}
