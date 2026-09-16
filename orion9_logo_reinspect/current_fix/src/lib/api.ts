import { orionAI } from '../services/ai/AIProvider';

export const generateInsight = async (prompt: string, dataContext: any, specializedMode?: any) => {
  try {
    const result = await orionAI.generateInsight({
      prompt,
      dataContext,
      specializedMode
    });
    return result.response;
  } catch (error: any) {
    console.warn("AI Insight using fallback reasoning:", error);
    const result = await orionAI.generateInsight({ prompt, dataContext, specializedMode });
    return result.response;
  }
};

export const generateCopilotResponse = async (
  prompt: string,
  localDataTools: Record<string, () => any>,
  specializedMode?: 'Control Tower' | 'Decision Copilot' | 'Scenario Copilot' | 'Executive Copilot' | 'Root Cause Copilot'
) => {
  try {
    // Step 1: Choose tools through AI router or fallback
    const toolsToCall = await orionAI.chooseTools(prompt);

    // Step 2: Execute selected tools
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

    // Step 3: Get insight via Gemini or deterministic engine
    return await generateInsight(prompt, dataContext, specializedMode);
  } catch (error: any) {
    console.error("Copilot Error:", error);
    // Provide grounded deterministic answer rather than crashing
    return await generateInsight(prompt, {
      getDashboardMetrics: localDataTools.getDashboardMetrics ? localDataTools.getDashboardMetrics() : {}
    }, specializedMode);
  }
};

