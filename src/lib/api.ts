export const generateInsight = async (prompt: string, dataContext: any) => {
  try {
    const response = await fetch('/api/ai/insight', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, dataContext }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate insight');
    }

    const data = await response.json();
    return data.response;
  } catch (error: any) {
    console.error("AI Insight Error:", error);
    throw error;
  }
};

export const generateCopilotResponse = async (prompt: string, localDataTools: Record<string, () => any>) => {
  try {
    // Step 1: Choose tools
    const toolResponse = await fetch('/api/ai/choose-tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    
    if (!toolResponse.ok) {
      throw new Error('Failed to choose tools');
    }
    
    const { toolsToCall } = await toolResponse.json();
    console.log("AI selected tools:", toolsToCall);

    // Step 2: Execute tools
    const dataContext: any = {};
    for (const tool of toolsToCall) {
      if (localDataTools[tool]) {
        dataContext[tool] = localDataTools[tool]();
      }
    }

    // Step 3: Get insight
    return await generateInsight(prompt, dataContext);
  } catch (error: any) {
    console.error("Copilot Error:", error);
    throw error;
  }
};
