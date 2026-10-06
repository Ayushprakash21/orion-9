import { orionAI } from '../services/ai/AIProvider';
import { conversationMemoryService } from '../ai/ConversationMemoryService';
import { agentMemoryManager } from '../ai/AgentMemory';
import { knowledgeRetrievalEngine } from '../knowledge/KnowledgeRetrievalEngine';
import { outcomeRecorder } from '../ai/OutcomeRecorder';

export const generateInsight = async (
  prompt: string, 
  dataContext: any, 
  specializedMode?: any,
  options?: { tenantId?: string; userId?: string }
) => {
  try {
    const result = await orionAI.generateInsight({
      prompt,
      dataContext,
      specializedMode,
      tenantId: options?.tenantId,
      userId: options?.userId,
    });
    return result.response;
  } catch (error: any) {
    console.warn("AI Insight using fallback reasoning:", error);
    const result = await orionAI.generateInsight({ prompt, dataContext, specializedMode, tenantId: options?.tenantId, userId: options?.userId });
    return result.response;
  }
};

export const generateCopilotResponse = async (
  prompt: string,
  localDataTools: Record<string, () => any>,
  specializedMode?: 'Control Tower' | 'Decision Copilot' | 'Scenario Copilot' | 'Executive Copilot' | 'Root Cause Copilot',
  options?: { tenantId?: string; userId?: string; conversationId?: string; agentId?: string }
) => {
  const tenantId = options?.tenantId || 'global';
  const userId = options?.userId || 'user';
  const agentId = options?.agentId || 'control-tower-copilot';

  try {
    // 1. Choose required tools via AI router or fallback
    const toolsToCall = await orionAI.chooseTools(prompt);

    // 2. Execute selected operational tools
    const dataContext: any = {};
    for (const tool of toolsToCall) {
      if (localDataTools[tool]) {
        try {
          dataContext[tool] = localDataTools[tool]();
        } catch (e) {
          console.warn(`Tool execution failed for ${tool}:`, e);
        }
      }
    }

    // Always include dashboard metrics if not present
    if (!dataContext.getDashboardMetrics && localDataTools.getDashboardMetrics) {
      dataContext.getDashboardMetrics = localDataTools.getDashboardMetrics();
    }

    // 3. Assemble Conversation Memory (Multi-turn continuity & User preferences/corrections)
    const conversationContext = conversationMemoryService.getConversationContext(tenantId, userId, options?.conversationId);
    if (conversationContext) {
      dataContext._conversationMemory = conversationContext;
    }

    // 4. Query Persistent Agent Memory (Tenant & Agent isolated, ranked)
    const persistentMemories = agentMemoryManager.queryRelevantMemories(tenantId, agentId, prompt, 5);
    if (persistentMemories.length > 0) {
      dataContext._persistentMemories = persistentMemories.map(m => ({
        type: m.type,
        ref: m.contentReference,
        createdAt: m.createdAt,
      }));
    }

    // 5. Query Governed RAG Knowledge Base
    try {
      const ragResponse = await knowledgeRetrievalEngine.retrieveKnowledge({
        tenantId,
        userId,
        userRole: 'user',
        query: prompt,
        maxResults: 3,
        minSimilarityScore: 0.1,
      });

      if (ragResponse.citations && ragResponse.citations.length > 0) {
        dataContext._ragEvidence = {
          summary: ragResponse.answerSummary,
          citations: ragResponse.citations,
          text: ragResponse.retrievedText,
        };
      }
    } catch (ragErr) {
      console.warn('[RAG] Knowledge retrieval warning:', ragErr);
    }

    // 6. Query Historical Decision Outcomes for Feedback Learning
    const pastOutcomes = outcomeRecorder.getOutcomes(tenantId).slice(-5);
    if (pastOutcomes.length > 0) {
      dataContext._pastOutcomes = pastOutcomes.map(o => ({
        decisionId: o.decisionId,
        action: o.action,
        success: o.success,
        expectedOutcome: o.expectedOutcome,
        actualOutcome: o.actualOutcome,
        reason: o.failureReason,
        variance: o.variance,
      }));
    }

    // 7. Execute inference via Gemini or deterministic engine
    return await generateInsight(prompt, dataContext, specializedMode, { tenantId, userId });
  } catch (error: any) {
    console.error("Copilot Error:", error);
    // Grounded fallback reasoning
    const fallbackCtx: any = {
      getDashboardMetrics: localDataTools.getDashboardMetrics ? localDataTools.getDashboardMetrics() : {}
    };
    return await generateInsight(prompt, fallbackCtx, specializedMode, { tenantId, userId });
  }
};

