/**
 * ORION-9 CENTRAL AI GATEWAY & ACTION PIPELINE
 * Layer 2: Centralized AI entry point enforcing the canonical AI Action Pipeline:
 * REQUEST → IDENTITY → TOOL AUTH → DATA AUTH → POLICY ENGINE → RISK ENGINE → APPROVAL CHECK → EXECUTE/STOP
 *
 * ARCHITECTURAL CONSTITUTION MANDATE:
 * "Where human approval is required, AI MUST STOP before execution."
 */

import {
  AIActionRequest,
  AIActionResponse,
  AIOperatingMode,
  AIInvocationContext,
} from './types';
import { toolRegistry } from './ToolRegistry';
import { agentRegistry } from './AgentRegistry';
import { kernelPolicyEngine } from '../kernel/PolicyEngine';
import { kernelAuditEngine } from '../kernel/AuditEngine';
import { kernelEventBus } from '../kernel/EventBus';
import { generateCorrelationId } from '../kernel/security/crypto';

export class AIGateway {
  private static instance: AIGateway;

  private constructor() {}

  public static getInstance(): AIGateway {
    if (!AIGateway.instance) {
      AIGateway.instance = new AIGateway();
    }
    return AIGateway.instance;
  }

  /**
   * Executes an AI Action through the full, unbypassable AI Action Pipeline
   */
  public async executeAction(request: AIActionRequest): Promise<AIActionResponse> {
    const timestamp = new Date().toISOString();
    const correlationId = request.context.correlationId || generateCorrelationId('ai-act');

    // 1. IDENTITY RESOLUTION & VALIDATION
    const agent = agentRegistry.getAgent(request.agentId);
    if (!agent) {
      return this.reject(request, correlationId, 'BLOCK', `Agent '${request.agentId}' is not registered in the Agent Registry.`);
    }

    if (agent.status !== 'ACTIVE') {
      return this.reject(request, correlationId, 'BLOCK', `Agent '${request.agentId}' is currently ${agent.status}.`);
    }

    // 2. TOOL AUTHORIZATION CHECK
    const tool = toolRegistry.getTool(request.toolId);
    if (!tool) {
      return this.reject(request, correlationId, 'BLOCK', `Tool '${request.toolId}' is not registered in the Tool Registry.`);
    }

    // Verify agent is permitted to use this tool
    if (!agent.allowedTools.includes(request.toolId)) {
      await kernelAuditEngine.record({
        eventId: request.requestId,
        correlationId,
        actor: {
          id: agent.agentId,
          type: 'AI_AGENT',
          name: agent.name,
          agentId: agent.agentId,
          model: agent.auditIdentity.model,
        },
        tenantId: request.context.tenant.organizationId,
        action: request.toolId,
        entityType: request.entityType || 'tool',
        entityId: request.entityId || request.toolId,
        result: 'BLOCKED',
        failureReason: `Agent '${agent.name}' is not authorized to use tool '${tool.name}'.`,
        classification: 'RESTRICTED',
      });

      return this.reject(
        request,
        correlationId,
        'BLOCK',
        `Agent '${agent.name}' does not possess authorization for tool '${tool.name}'.`
      );
    }

    // 3. OPERATING MODE CLASSIFICATION CHECK
    if (tool.operatingMode === 'PROHIBITED') {
      return this.reject(request, correlationId, 'BLOCK', `Tool '${tool.name}' is classified as PROHIBITED.`);
    }

    // 4. DATA AUTHORIZATION & POLICY EVALUATION
    const policyOutcome = kernelPolicyEngine.evaluate({
      actor: {
        id: agent.agentId,
        type: 'AI_AGENT',
        name: agent.name,
        agentId: agent.agentId,
      },
      tenantId: request.context.tenant.organizationId,
      action: request.toolId,
      entityType: request.entityType || 'generic',
      entityId: request.entityId,
      amount: request.estimatedMonetaryImpact,
    });

    if (policyOutcome.result === 'BLOCK') {
      await kernelAuditEngine.record({
        eventId: request.requestId,
        correlationId,
        actor: {
          id: agent.agentId,
          type: 'AI_AGENT',
          name: agent.name,
          agentId: agent.agentId,
          model: agent.auditIdentity.model,
        },
        tenantId: request.context.tenant.organizationId,
        action: request.toolId,
        entityType: request.entityType || 'generic',
        entityId: request.entityId || 'unknown',
        result: 'BLOCKED',
        failureReason: policyOutcome.reason,
        classification: 'RESTRICTED',
      });

      return this.reject(request, correlationId, 'BLOCK', policyOutcome.reason);
    }

    // 5. APPROVAL CHECK (Architectural Constitution Rule 9)
    // If tool is APPROVAL_GATED, or agent requires approval, or policy requires approval: STOP.
    const isApprovalRequired =
      tool.operatingMode === 'APPROVAL_GATED' ||
      tool.approvalRequired ||
      agent.approvalRequirements.alwaysRequireApproval ||
      policyOutcome.requiresApproval ||
      (request.estimatedMonetaryImpact &&
        agent.approvalRequirements.monetaryThreshold &&
        request.estimatedMonetaryImpact > agent.approvalRequirements.monetaryThreshold);

    if (isApprovalRequired) {
      const approvalId = `appr-ai-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

      // Publish APPROVAL_REQUIRED event to Event Fabric
      kernelEventBus.publish(
        'AI_ACTION_APPROVAL_REQUIRED',
        {
          approvalId,
          requestId: request.requestId,
          agentId: agent.agentId,
          agentName: agent.name,
          toolId: tool.toolId,
          toolName: tool.name,
          parameters: request.parameters,
          estimatedMonetaryImpact: request.estimatedMonetaryImpact,
          policyReason: policyOutcome.reason,
        },
        {
          actor: {
            id: agent.agentId,
            type: 'AI_AGENT',
            name: agent.name,
            agentId: agent.agentId,
          },
          tenant: request.context.tenant,
          correlationId,
          entityId: request.entityId,
          entityType: request.entityType,
        }
      );

      // Record in Audit Engine
      const auditRec = await kernelAuditEngine.record({
        eventId: request.requestId,
        correlationId,
        actor: {
          id: agent.agentId,
          type: 'AI_AGENT',
          name: agent.name,
          agentId: agent.agentId,
          model: agent.auditIdentity.model,
        },
        tenantId: request.context.tenant.organizationId,
        action: request.toolId,
        entityType: request.entityType || 'generic',
        entityId: request.entityId || 'unknown',
        approval: {
          required: true,
          approvalId,
        },
        result: 'PENDING_APPROVAL',
        classification: 'INTERNAL',
      });

      return {
        requestId: request.requestId,
        correlationId,
        agentId: request.agentId,
        toolId: request.toolId,
        status: 'HALTED_AWAITING_APPROVAL',
        policyOutcome: 'REQUIRE_APPROVAL',
        requiresApproval: true,
        approvalId,
        reason: `AI Action halted: Human manager approval required by policy [${policyOutcome.ruleName || 'AI Governance Rule'}].`,
        auditId: auditRec.auditId,
        timestamp,
      };
    }

    // 6. EXECUTE AUTHORIZED TOOL
    try {
      const result = await tool.handler(request.parameters, request.context);

      // Publish event
      kernelEventBus.publish(
        'AI_ACTION_EXECUTED',
        {
          requestId: request.requestId,
          agentId: agent.agentId,
          toolId: tool.toolId,
          result,
        },
        {
          actor: {
            id: agent.agentId,
            type: 'AI_AGENT',
            name: agent.name,
            agentId: agent.agentId,
          },
          tenant: request.context.tenant,
          correlationId,
          entityId: request.entityId,
          entityType: request.entityType,
        }
      );

      // Record Audit
      const auditRec = await kernelAuditEngine.record({
        eventId: request.requestId,
        correlationId,
        actor: {
          id: agent.agentId,
          type: 'AI_AGENT',
          name: agent.name,
          agentId: agent.agentId,
          model: agent.auditIdentity.model,
        },
        tenantId: request.context.tenant.organizationId,
        action: request.toolId,
        entityType: request.entityType || 'generic',
        entityId: request.entityId || 'unknown',
        afterState: result,
        result: 'SUCCESS',
        classification: 'INTERNAL',
      });

      return {
        requestId: request.requestId,
        correlationId,
        agentId: request.agentId,
        toolId: request.toolId,
        status: 'EXECUTED',
        result,
        policyOutcome: 'ALLOW',
        requiresApproval: false,
        auditId: auditRec.auditId,
        timestamp,
      };
    } catch (err: any) {
      await kernelAuditEngine.record({
        eventId: request.requestId,
        correlationId,
        actor: {
          id: agent.agentId,
          type: 'AI_AGENT',
          name: agent.name,
          agentId: agent.agentId,
          model: agent.auditIdentity.model,
        },
        tenantId: request.context.tenant.organizationId,
        action: request.toolId,
        entityType: request.entityType || 'generic',
        entityId: request.entityId || 'unknown',
        result: 'FAILED',
        failureReason: err.message || 'Tool execution failure',
        classification: 'INTERNAL',
      });

      return {
        requestId: request.requestId,
        correlationId,
        agentId: request.agentId,
        toolId: request.toolId,
        status: 'FAILED',
        policyOutcome: 'ALLOW',
        requiresApproval: false,
        reason: err.message || 'Execution failed',
        timestamp,
      };
    }
  }

  private reject(
    request: AIActionRequest,
    correlationId: string,
    policyOutcome: any,
    reason: string
  ): AIActionResponse {
    return {
      requestId: request.requestId,
      correlationId,
      agentId: request.agentId,
      toolId: request.toolId,
      status: 'BLOCKED',
      policyOutcome,
      requiresApproval: false,
      reason,
      timestamp: new Date().toISOString(),
    };
  }
}

export const aiGateway = AIGateway.getInstance();
