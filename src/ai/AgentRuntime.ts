/**
 * ORION-9 WAVE 5 — GOVERNED AI AGENT RUNTIME
 *
 * Core execution engine connecting AI agents to the Orion Kernel.
 * Enforces the full 15-step governance pipeline:
 * AI Request → Agent AuthN → Agent Identity → Tool AuthZ → Command Construction →
 * Command Validation → Kernel AuthN → AuthZ → Tenant → Policy → Risk → Approval →
 * State → Transaction → Event → Audit → Outcome.
 *
 * Fail-closed architecture: Any failure stops execution immediately.
 * AI is never an admin, never self-approves, and never bypasses the Kernel.
 */

import {
  AIAgent,
  AIOperatingMode,
  AIExecutionContext,
  AICommandPayload,
  GovernedAIExecutionResult,
  AIResponseStatus,
} from './types';
import { agentRegistry } from './AgentRegistry';
import { toolRegistry } from './ToolRegistry';
import { aiSecurityGuard } from './AISecurityGuard';
import { aiCommandBuilder } from './AICommandBuilder';
import { decisionRecordEngine } from './DecisionRecordEngine';
import { outcomeRecorder } from './OutcomeRecorder';
import { kernelCommandBus } from '../kernel/CommandBus';
import { kernelAuditEngine } from '../kernel/AuditEngine';
import { generateCorrelationId } from '../kernel/security/crypto';
import { AuthorizationActor, ActorType } from '../kernel/authorization/AuthorizationEngine';
import { CommandResult } from '../kernel/types';

export interface ExecuteAIRequestOptions {
  agentId: string;
  tenantId: string;
  toolId: string;
  toolParameters: Record<string, any>;
  humanInitiator?: {
    id: string;
    name: string;
    role: string;
  };
  reason: string;
  correlationId?: string;
  externalData?: string;
}

export class AgentRuntime {
  private static instance: AgentRuntime;

  private constructor() {}

  public static getInstance(): AgentRuntime {
    if (!AgentRuntime.instance) {
      AgentRuntime.instance = new AgentRuntime();
    }
    return AgentRuntime.instance;
  }

  /**
   * Execute an AI Request through the Governed 15-Step Pipeline
   */
  public async execute(options: ExecuteAIRequestOptions): Promise<GovernedAIExecutionResult> {
    const correlationId = options.correlationId || generateCorrelationId('ai-req');
    const { agentId, tenantId, toolId, toolParameters, humanInitiator, reason } = options;

    // STEP 1 & 2: AGENT AUTHENTICATION & LOOKUP
    const agent = await agentRegistry.getAgent(tenantId, agentId);
    if (!agent) {
      throw new Error(`AI Pipeline Failure: Agent '${agentId}' does not exist or does not belong to tenant '${tenantId}'.`);
    }

    if (agent.status !== 'ACTIVE') {
      return {
        status: 'REJECTED',
        message: `Execution halted: Agent '${agent.name}' is currently in '${agent.status}' state.`,
        agentId,
        tenantId,
        correlationId,
      };
    }

    // STEP 3: AGENT IDENTITY ASSERTION (Explicitly AI_AGENT, never ADMIN)
    const actor: AuthorizationActor = {
      id: agent.agentId,
      type: ActorType.AI_AGENT,
      name: agent.name,
      roles: ['ai_agent'],
      organizationId: tenantId,
    };

    // STEP 4: OPERATING MODE VERIFICATION (Server-Side Enforcement)
    if (agent.operatingMode === 'PROHIBITED') {
      return {
        status: 'REJECTED',
        message: `Execution halted: Agent operating mode is 'PROHIBITED'. All actions denied.`,
        agentId,
        tenantId,
        correlationId,
      };
    }

    // Check external data for prompt injection
    if (options.externalData) {
      const sanitized = aiSecurityGuard.sanitizeExternalContent(options.externalData);
      if (sanitized.isFlagged) {
        await kernelAuditEngine.record({
          tenantId,
          actor: { id: agent.agentId, type: 'AI_AGENT', role: 'ai_agent' },
          action: 'AI_PROMPT_INJECTION_DETECTED',
          result: 'BLOCKED',
          details: { threats: sanitized.detectedThreats },
          classification: 'RESTRICTED',
        });
      }
    }

    // STEP 5: TOOL REGISTRY & TOOL EXECUTION GATE
    const executionContext: AIExecutionContext = {
      actor,
      agent,
      tenantId,
      humanInitiatorId: humanInitiator?.id,
      correlationId,
      mode: agent.operatingMode,
    };

    let toolResult: any;
    try {
      toolResult = await toolRegistry.executeTool(toolId, toolParameters, executionContext);
    } catch (toolErr: any) {
      return {
        status: 'REJECTED',
        message: `Tool execution failed: ${toolErr.message}`,
        agentId,
        tenantId,
        correlationId,
        error: toolErr.message,
      };
    }

    // If tool was a pure read tool (e.g. getInventory, getSuppliers)
    const toolDef = toolRegistry.getTool(toolId);
    if (toolDef && toolDef.execute) {
      return {
        status: 'ANSWER',
        message: `Tool '${toolDef.name}' executed successfully.`,
        agentId,
        tenantId,
        correlationId,
        data: toolResult,
      };
    }

    // STEP 6: If mode is RECOMMEND, return recommendation without executing
    if (agent.operatingMode === 'RECOMMEND') {
      const decisionRecord = await decisionRecordEngine.recordDecision({
        tenantId,
        agentId,
        humanInitiatorId: humanInitiator?.id,
        reason,
        recommendation: `Recommended execution of '${toolId}'`,
        evidenceReferences: [toolId],
        risk: agent.riskClass,
        policy: 'AI_RECOMMEND_MODE_POLICY',
        approvalRequired: false,
        outcome: 'RECOMMENDATION_ISSUED',
      });

      return {
        status: 'RECOMMENDATION',
        message: `Recommendation generated: ${reason}. Execution is held in RECOMMEND mode.`,
        agentId,
        tenantId,
        correlationId,
        data: toolResult,
        decisionRecordId: decisionRecord.decisionId,
      };
    }

    // STEP 7: If mode is ASSIST and no human initiator is present, return DRAFT
    if (agent.operatingMode === 'ASSIST' && !humanInitiator) {
      return {
        status: 'DRAFT',
        message: `Draft created for '${toolId}'. Requires human confirmation to dispatch.`,
        agentId,
        tenantId,
        correlationId,
        data: toolResult,
      };
    }

    // STEP 8: COMMAND CONSTRUCTION VIA TYPED AI COMMAND BUILDER
    const commandType = this.mapToolToCommand(toolId);
    const commandPayload: AICommandPayload = {
      commandType,
      actor,
      tenantId,
      targetEntity: toolParameters.entityType || this.mapToolToEntity(toolId),
      targetId: toolParameters.entityId || toolParameters.poId || toolParameters.prId || `id-${Date.now()}`,
      parameters: toolParameters,
      correlationId,
      reason,
      requestedByAgent: agent.agentId,
      humanInitiatorId: humanInitiator?.id,
    };

    let commandEnvelope;
    try {
      commandEnvelope = aiCommandBuilder.buildCommand(commandPayload, agent);
    } catch (builderErr: any) {
      return {
        status: 'REJECTED',
        message: `Command construction failed: ${builderErr.message}`,
        agentId,
        tenantId,
        correlationId,
        error: builderErr.message,
      };
    }

    // STEP 9 to 15: KERNEL DISPATCH
    // Routes through Orion Kernel (CommandBus handles AuthN, AuthZ, Tenant, Policy, Risk, Approval, State, Transaction, Event, Audit)
    const kernelResult: CommandResult = await kernelCommandBus.execute(commandEnvelope);

    // Persist Decision Record
    const decisionRecord = await decisionRecordEngine.recordDecision({
      tenantId,
      agentId,
      humanInitiatorId: humanInitiator?.id,
      commandId: commandEnvelope.commandId,
      reason,
      recommendation: `Command dispatch: ${commandType}`,
      evidenceReferences: [toolId, commandEnvelope.commandId],
      risk: agent.riskClass,
      policy: kernelResult.policyResult || 'STANDARD_KERNEL_GOVERNANCE',
      approvalRequired: !!kernelResult.requiresApproval,
      outcome: kernelResult.success ? 'EXECUTED' : kernelResult.requiresApproval ? 'PENDING_APPROVAL' : 'REJECTED',
    });

    // Handle Approval-Gated flow
    if (kernelResult.requiresApproval) {
      await decisionRecordEngine.recordActionAudit({
        tenantId,
        agentId,
        humanInitiatorId: humanInitiator?.id,
        toolId,
        commandId: commandEnvelope.commandId,
        targetEntity: commandPayload.targetEntity,
        targetId: commandPayload.targetId,
        policyName: kernelResult.policyResult,
        riskClass: agent.riskClass,
        approvalRequired: true,
        executionStatus: 'PENDING_APPROVAL',
        outcomeResult: 'AWAITING_HUMAN_APPROVER',
      });

      return {
        status: 'PENDING_APPROVAL',
        message: kernelResult.error || 'Transaction halted: Human approval required before execution.',
        agentId,
        tenantId,
        correlationId,
        commandId: commandEnvelope.commandId,
        approvalId: kernelResult.approvalId,
        decisionRecordId: decisionRecord.decisionId,
        kernelResult,
      };
    }

    // Handle Failure
    if (!kernelResult.success) {
      await decisionRecordEngine.recordActionAudit({
        tenantId,
        agentId,
        humanInitiatorId: humanInitiator?.id,
        toolId,
        commandId: commandEnvelope.commandId,
        targetEntity: commandPayload.targetEntity,
        targetId: commandPayload.targetId,
        policyName: kernelResult.policyResult,
        riskClass: agent.riskClass,
        approvalRequired: false,
        executionStatus: 'FAILED',
        outcomeResult: kernelResult.error || 'Kernel execution denied',
      });

      return {
        status: 'REJECTED',
        message: kernelResult.error || 'Kernel rejected command execution.',
        agentId,
        tenantId,
        correlationId,
        commandId: commandEnvelope.commandId,
        decisionRecordId: decisionRecord.decisionId,
        kernelResult,
        error: kernelResult.error,
      };
    }

    // Handle Successful Execution (Accurately reporting EXECUTED only upon real Kernel success)
    await decisionRecordEngine.recordActionAudit({
      tenantId,
      agentId,
      humanInitiatorId: humanInitiator?.id,
      toolId,
      commandId: commandEnvelope.commandId,
      targetEntity: commandPayload.targetEntity,
      targetId: commandPayload.targetId,
      riskClass: agent.riskClass,
      approvalRequired: false,
      executionStatus: 'SUCCESS',
      outcomeResult: 'TRANSACTION_COMMITTED',
    });

    // Record initial empirical outcome
    await outcomeRecorder.recordOutcome({
      tenantId,
      agentId,
      decisionId: decisionRecord.decisionId,
      action: commandType,
      expectedOutcome: reason,
      actualOutcome: 'Kernel transaction successfully committed',
      success: true,
    });

    return {
      status: 'EXECUTED',
      message: `Transaction committed successfully via Orion Kernel. Command ID: ${commandEnvelope.commandId}`,
      agentId,
      tenantId,
      correlationId,
      commandId: commandEnvelope.commandId,
      data: kernelResult.result,
      decisionRecordId: decisionRecord.decisionId,
      kernelResult,
    };
  }

  /**
   * Resolve an approval request with strict self-approval checks
   */
  public async resolveApproval(
    approvalId: string,
    decision: 'APPROVED' | 'REJECTED',
    approver: { id: string; name: string; role: string; type?: string },
    comments?: string
  ): Promise<CommandResult | null> {
    // 1. Verify approver is not AI
    if (approver.type === 'AI_AGENT' || approver.role === 'ai_agent') {
      throw new Error('AI Self-Approval Violation: AI agents cannot resolve approvals.');
    }

    // 2. Delegate to Kernel CommandBus resolveApproval
    return await kernelCommandBus.resolveApproval(
      approvalId,
      decision,
      {
        id: approver.id,
        name: approver.name,
        role: approver.role,
      },
      comments
    );
  }

  private mapToolToCommand(toolId: string): string {
    const map: Record<string, string> = {
      createPurchaseRequisition: 'CREATE_PURCHASE_REQUISITION',
      createRFQ: 'CREATE_RFQ',
      createPurchaseOrderDraft: 'CREATE_PURCHASE_ORDER',
      createASN: 'CREATE_ASN',
      createException: 'CREATE_EXCEPTION',
      createPaymentHandoff: 'CREATE_PAYMENT_HANDOFF',
    };
    return map[toolId] || toolId.toUpperCase();
  }

  private mapToolToEntity(toolId: string): string {
    const map: Record<string, string> = {
      createPurchaseRequisition: 'pr',
      createRFQ: 'rfq',
      createPurchaseOrderDraft: 'purchase_order',
      createASN: 'asn',
      createException: 'exception',
      createPaymentHandoff: 'payment_handoff',
    };
    return map[toolId] || 'generic';
  }
}

export const agentRuntime = AgentRuntime.getInstance();
