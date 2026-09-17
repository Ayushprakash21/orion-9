/**
 * ORION-9 INTELLIGENCE LAYER — REACT HOOK
 * Provides unified access to AI Gateway, Agent Registry, Tool Registry,
 * and Decision Record Services.
 */

import { useMemo } from 'react';
import { aiGateway } from './AIGateway';
import { toolRegistry } from './ToolRegistry';
import { agentRegistry } from './AgentRegistry';
import { decisionRecordService } from './DecisionRecordService';

export function useIntelligence() {
  return useMemo(() => ({
    gateway: aiGateway,
    toolRegistry,
    agentRegistry,
    decisionRecordService,
    executeAIAction: aiGateway.executeAction.bind(aiGateway),
    getAgents: agentRegistry.getAllAgents.bind(agentRegistry),
    getAgent: agentRegistry.getAgent.bind(agentRegistry),
    getTools: toolRegistry.getAllTools.bind(toolRegistry),
    getTool: toolRegistry.getTool.bind(toolRegistry),
    getDecisionRecords: decisionRecordService.getRecords.bind(decisionRecordService),
    recordOutcome: decisionRecordService.recordActualOutcome.bind(decisionRecordService),
  }), []);
}
