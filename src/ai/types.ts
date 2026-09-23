/**
 * ORION-9 WAVE 5 — AI AGENT RUNTIME & GOVERNANCE TYPES
 *
 * Core Principle:
 * AI IS A GOVERNED ACTOR. AI IS NOT AN ADMIN. AI IS NOT A SUPERUSER.
 * AI MUST NEVER BYPASS THE ORION KERNEL.
 */

import { AuthorizationActor } from '../kernel/authorization/AuthorizationEngine';
import { CommandEnvelope, CommandResult, DataClassification } from '../kernel/types';

export type AgentStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'SUSPENDED'
  | 'DISABLED'
  | 'QUARANTINED'
  | 'ERROR';

export type AgentDomain =
  | 'CONTROL_TOWER'
  | 'PROCUREMENT'
  | 'SUPPLIER_INTELLIGENCE'
  | 'INVENTORY'
  | 'DEMAND_PLANNING'
  | 'SOP'
  | 'LOGISTICS'
  | 'WAREHOUSE'
  | 'CUSTOMER_FULFILLMENT'
  | 'FINANCE_MATCHING'
  | 'RISK'
  | 'MASTER_DATA'
  | 'QUALITY'
  | 'INTEGRATION_OPERATIONS'
  | 'SCENARIO_PLANNING'
  | 'EXECUTIVE_INTELLIGENCE'
  | 'COMPLIANCE'
  | 'KNOWLEDGE'
  | 'WORKFLOW'
  | 'OBSERVABILITY_INCIDENT';

export type AIOperatingMode =
  | 'OBSERVE'         // Inspect permitted data only; no execution
  | 'ASSIST'          // Prepare drafts; no material transaction without human action
  | 'RECOMMEND'       // Generate recommendations; no execution
  | 'APPROVAL_GATED'  // Prepare command; Kernel requires human approval before execution
  | 'GOVERNED'        // May execute explicitly authorized low-risk commands via Kernel
  | 'PROHIBITED';     // Execution strictly denied regardless of AI request

export type AIRiskClass = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AIMemoryType = 'SESSION' | 'TASK' | 'DECISION' | 'OUTCOME' | 'EPISODIC' | 'SEMANTIC';

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
  domain?: AgentDomain;
  version: string;
  status: AgentStatus;
  operatingMode: AIOperatingMode;
  capabilities: string[];
  allowedTools: string[];
  allowedCommands: string[];
  riskClass: AIRiskClass;
  autonomyLevel?: number;
  quarantineReason?: string;
  quarantinedAt?: string;
  reinstatedAt?: string;
  reinstatedBy?: string;
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
  requestId?: string;
  conversationId?: string;
  startedAt?: string;
  timeoutMs?: number;
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

/**
 * Explicit Reasoning Categories
 */
export type ReasoningCategory =
  | 'FACT'
  | 'OBSERVATION'
  | 'MODELLED'
  | 'PREDICTION'
  | 'ASSUMPTION'
  | 'RECOMMENDATION';

/**
 * Typed Reasoning Step in an AI Proposal
 */
export interface ReasoningStep {
  stepNumber: number;
  category: ReasoningCategory;
  statement: string;
  confidence: number; // 0.0 to 1.0
  evidenceSources?: string[];
}

/**
 * AI Proposal Status Lifecycle
 */
export type AIProposalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_HUMAN_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTED'
  | 'EXPIRED'
  | 'REVOKED';

/**
 * Factual and Metric Evidence Supporting an AI Proposal
 */
export interface AIProposalEvidence {
  facts: string[];
  signals: string[];
  metrics: Record<string, number | string>;
  entities: Array<{ entityType: string; entityId: string }>;
  dataFreshnessMs: number;
}

/**
 * Rigorous Multi-Vector Risk Assessment for AI Proposal
 */
export interface AIProposalRisk {
  score: number; // 0 - 100
  blastRadius: 'LOCAL' | 'REGIONAL' | 'GLOBAL';
  financialExposure: number;
  reversibility: 'REVERSIBLE' | 'IRREVERSIBLE';
  riskClass: AIRiskClass;
}

/**
 * Enterprise AI Proposal Model
 * Formulates decisions without direct database mutation
 */
export interface AIProposal {
  proposalId: string;
  tenantId: string;
  agentId: string;
  agentName: string;
  domain: AgentDomain;
  intent: string;
  proposedCommand: AICommandPayload;
  evidence: AIProposalEvidence;
  reasoningChain: ReasoningStep[];
  riskAssessment: AIProposalRisk;
  confidence: number; // 0.0 - 1.0
  approvalStatus: AIProposalStatus;
  requiredApproverRoles: string[];
  workflowId?: string;
  outcomeId?: string;
  createdAt: string;
  expiresAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  approverComment?: string;
  executedAt?: string;
  executionCommandId?: string;
}

/**
 * Governed Agent-to-Agent Collaboration Messages
 */
export type CollaborationMessageType =
  | 'QUERY'
  | 'RESPONSE'
  | 'ALERT'
  | 'DELEGATION'
  | 'EVIDENCE_REQUEST';

export interface AgentCollaborationMessage {
  messageId: string;
  tenantId: string;
  sourceAgentId: string;
  sourceAgentName: string;
  targetAgentId: string;
  targetAgentName: string;
  conversationId: string;
  correlationId: string;
  messageType: CollaborationMessageType;
  intent: string;
  payload: Record<string, any>;
  securityContext: {
    traceToken: string;
    originalHumanInitiator?: string;
  };
  timestamp: string;
}

/**
 * Agent Quarantine Engine Records
 */
export type QuarantineReason =
  | 'PROMPT_INJECTION'
  | 'POLICY_VIOLATION'
  | 'ATTEMPTED_SELF_APPROVAL'
  | 'UNAUTHORIZED_TOOL'
  | 'CROSS_TENANT_ACCESS'
  | 'EXCESSIVE_FAILURES'
  | 'MANUAL_QUARANTINE';

export interface AgentQuarantineRecord {
  quarantineId: string;
  tenantId: string;
  agentId: string;
  agentName: string;
  reason: QuarantineReason;
  severity: 'WARNING' | 'CRITICAL' | 'FATAL';
  details: string;
  quarantinedAt: string;
  reinstatedAt?: string;
  reinstatedBy?: string;
  reinstatementJustification?: string;
  evidence?: any;
}

/**
 * Comprehensive Agent Health & Calibration Telemetry
 */
export interface AgentHealthMetrics {
  agentId: string;
  agentName: string;
  tenantId: string;
  domain: AgentDomain;
  status: AgentStatus;
  operatingMode: AIOperatingMode;
  successRate: number; // 0.0 - 100.0
  avgLatencyMs: number;
  totalExecutions: number;
  activeProposalsCount: number;
  quarantineCount: number;
  lastActiveAt: string;
  healthScore: number; // 0 - 100
  calibrationScore: number; // 0 - 100
}

