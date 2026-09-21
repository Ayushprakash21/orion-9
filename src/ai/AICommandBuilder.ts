/**
 * ORION-9 WAVE 5 — TYPED AI COMMAND BUILDER
 *
 * Converts validated AI action requests into strongly-typed, verifiable
 * Kernel CommandEnvelopes.
 *
 * AI actor identity is strictly tagged as 'AI_AGENT' and never poses as ADMIN.
 */

import { AIAgent, AICommandPayload, AIOperatingMode } from './types';
import { CommandEnvelope } from '../kernel/types';
import { AuthorizationActor, ActorType } from '../kernel/authorization/AuthorizationEngine';
import { generateCorrelationId } from '../kernel/security/crypto';

export class AICommandBuilder {
  private static instance: AICommandBuilder;

  private constructor() {}

  public static getInstance(): AICommandBuilder {
    if (!AICommandBuilder.instance) {
      AICommandBuilder.instance = new AICommandBuilder();
    }
    return AICommandBuilder.instance;
  }

  /**
   * Build a typed Kernel CommandEnvelope for an AI action
   */
  public buildCommand<T = any>(
    payload: AICommandPayload<T>,
    agent: AIAgent
  ): CommandEnvelope<T> {
    // 1. Verify agent authorization for this command
    if (!agent.allowedCommands.includes(payload.commandType)) {
      throw new Error(
        `AI Command Builder Violation: Agent '${agent.agentId}' is not authorized for command '${payload.commandType}'.`
      );
    }

    // 2. Strict AI Actor construction: AI identity is distinct from human identity
    const aiActor: AuthorizationActor = {
      id: agent.agentId,
      type: ActorType.AI_AGENT,
      name: agent.name,
      roles: ['ai_agent'],
      organizationId: payload.tenantId,
    };

    const correlationId = payload.correlationId || generateCorrelationId('ai-cmd');
    const commandId = `cmd-ai-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;

    // 3. Construct Envelope matching Orion Kernel standards
    const envelope: CommandEnvelope<T> = {
      commandId,
      commandType: payload.commandType,
      timestamp: new Date().toISOString(),
      actor: {
        id: aiActor.id,
        type: 'AI_AGENT',
        role: 'ai_agent',
        name: aiActor.name,
        agentId: agent.agentId,
      },
      tenant: {
        organizationId: payload.tenantId,
      },
      entityId: payload.targetId,
      entityType: payload.targetEntity,
      payload: {
        ...payload.parameters,
        _aiMetadata: {
          requestedByAgent: agent.agentId,
          operatingMode: agent.operatingMode,
          humanInitiatorId: payload.humanInitiatorId,
          reason: payload.reason,
          riskClass: agent.riskClass,
        },
      },
      correlationId,
      idempotencyKey: `idemp-${agent.agentId}-${payload.commandType}-${payload.targetId || Date.now()}`,
      classification: payload.classification || 'INTERNAL',
    };

    return envelope;
  }
}

export const aiCommandBuilder = AICommandBuilder.getInstance();
