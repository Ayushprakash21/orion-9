const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Ensure Gemini is imported
if (!code.includes('@google/genai')) {
  code = code.replace('import OpenAI from "openai";', 'import OpenAI from "openai";\nimport { GoogleGenAI } from "@google/genai";');
}

// Ensure geminiClient is defined
if (!code.includes('let geminiClient')) {
  code = code.replace('// Lazy initialization of OpenAI client', '// Lazy initialization of Gemini client\nlet geminiClient: GoogleGenAI | null = null;\nconst getGemini = () => {\n  const apiKey = process.env.GEMINI_API_KEY;\n  if (!apiKey) return null;\n  if (!geminiClient) {\n    geminiClient = new GoogleGenAI({ apiKey });\n  }\n  return geminiClient;\n};\n\n// Lazy initialization of OpenAI client');
}

// Fix the extra `});`
code = code.replace(/  \}\);\n  \}\);\n  \/\/ AI Tool Selection Route/g, '  });\n\n  // AI Tool Selection Route');

// Replace choose-tools logic
code = code.replace(
  /const openai = getOpenAI\(\);\n    if \(\!openai\) \{[\s\S]*?res\.json\(\{[\s\S]*?fallback: true[\s\S]*?\}\);\n    \}\n  \}\);/m,
  `const gemini = getGemini();
    const openai = getOpenAI();
    
    if (!gemini && !openai) {
      const prompt = (req.body?.prompt || "").toLowerCase();
      const tools = ['getDashboardMetrics'];
      if (prompt.includes('inventory') || prompt.includes('stock') || prompt.includes('sku')) {
        tools.push('getInventory', 'getInventoryRisks');
      }
      return res.json({ toolsToCall: tools, fallback: true });
    }

    try {
      const { prompt } = req.body;
      const systemPrompt = \`You are a data router for the Orion Supply Chain Operating System.
Based on the user's query, determine which of the following operational data tools are needed to answer the question:
\${allowlist.join(', ')}

Return ONLY a valid JSON array of string tool names. Only include tools that are absolutely relevant. If unsure, include 'getDashboardMetrics'.\`;

      let responseText = "";
      
      if (gemini) {
         const response = await gemini.models.generateContent({
           model: 'gemini-2.5-flash',
           contents: \`\${systemPrompt}\\n\\nUser Prompt: \${prompt}\`,
           config: { temperature: 0.1 }
         });
         responseText = response.text || "{}";
      } else if (openai) {
         const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
         const completion = await openai.chat.completions.create({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: \`User Prompt: \${prompt}\` }
            ],
            temperature: 0.1,
            response_format: { type: "json_object" }
         });
         responseText = completion.choices[0]?.message?.content || "{}";
      }

      let tools = [];
      try {
        let cleanText = responseText.replace(/\\s*\`\`\`json\\s*/g, '').replace(/\\s*\`\`\`\\s*/g, '').trim();
        const parsed = JSON.parse(cleanText);
        const list = Array.isArray(parsed) ? parsed : (parsed.tools || parsed.toolsToCall || Object.values(parsed).flat());
        if (Array.isArray(list)) {
          tools = list.filter(t => typeof t === 'string' && allowlist.includes(t));
        }
      } catch (e) {
        tools = ["getDashboardMetrics"];
      }
      
      if (tools.length === 0) tools = ["getDashboardMetrics"];
      res.json({ toolsToCall: tools });
    } catch (error) {
      console.warn("AI choose-tools error, falling back to default tools:", error.message);
      res.json({ toolsToCall: ["getDashboardMetrics", "getInventoryRisks", "getExceptions", "getPendingDecisions"], fallback: true });
    }
  });`
);

// Replace insight logic
code = code.replace(
  /app\.post\("\/api\/ai\/insight", async \(req, res\) => \{[\s\S]*?message: "Falling back to deterministic Orion reasoning."\n      \}\);\n    \}\n  \}\);/m,
  `app.post("/api/ai/insight", async (req, res) => {
    const gemini = getGemini();
    const openai = getOpenAI();
    
    if (!gemini && !openai) {
      return res.status(200).json({
        fallback: true,
        error: "No AI provider configured on the server.",
        message: "Using local deterministic reasoning engine grounded in live data."
      });
    }

    try {
      const { prompt, dataContext, specializedMode } = req.body;
      const systemInstruction = \`You are ORION AI, the native cognitive layer of the Orion Supply Chain Operating System.
You operate on the core loop: SENSE → UNDERSTAND → PREDICT → DECIDE → ACT → LEARN.
Grounded Principle: You must ground all insights strictly and exclusively in the provided operational data context.
Do NOT invent fake SKUs, fabricated inventory numbers, imaginary supplier names, or false metrics.
When data is missing or incomplete, explicitly state "DATA NOT AVAILABLE" or "INSUFFICIENT DATA".
Structure your response clearly using markdown with these standard OS sections where appropriate:
- **EXECUTIVE SUMMARY**
- **OPERATIONAL SIGNALS & ROOT CAUSES** (Categorize clearly as KNOWN, CALCULATED, or INFERRED)
- **DOWNSTREAM RISK & BUSINESS IMPACT** (Quantify financial exposure, service level impact, stockout risk)
- **RECOMMENDED DECISIONS & ACTIONS** (Actionable, specific next steps)
- **CONFIDENCE & EVIDENCE GROUNDING**\`;

      const userContent = \`OPERATIONAL CONTEXT (Live SCM Data):
\${JSON.stringify(dataContext, null, 2)}

SPECIALIZED COGNITIVE MODE: \${specializedMode || 'General Copilot'}

USER PROMPT:
\${prompt}\`;

      let responseText = "";
      let provider = "none";
      let usedModel = "none";

      if (gemini) {
        provider = "gemini";
        usedModel = "gemini-2.5-flash";
        const response = await gemini.models.generateContent({
          model: usedModel,
          contents: \`\${systemInstruction}\\n\\n\${userContent}\`,
          config: { temperature: 0.2 }
        });
        responseText = response.text || "No response generated.";
      } else if (openai) {
        provider = "openai";
        usedModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
        const completion = await openai.chat.completions.create({
          model: usedModel,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userContent }
          ],
          temperature: 0.2
        });
        responseText = completion.choices[0]?.message?.content || "No response generated.";
      }

      res.json({ response: responseText, provider, model: usedModel });
    } catch (error) {
      console.error("Error communicating with AI API:", error);
      res.status(200).json({
        fallback: true,
        error: error.message || "Failed to generate AI insights.",
        message: "Falling back to deterministic Orion reasoning."
      });
    }
  });`
);

fs.writeFileSync('server.ts', code);
