import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // AI Tool Selection Route
  app.post("/api/ai/choose-tools", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key is not configured on the server." });
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const { prompt } = req.body;
      
      const fullPrompt = `You are a data router for a Supply Chain Control Tower.
Based on the user's prompt, determine which of the following data tools are needed to answer the question.
Available tools:
- getInventory
- getInventoryRisks
- getSuppliers
- getSupplierPerformance
- getPurchaseOrders
- getOverduePOs
- getShipments
- getDelayedShipments
- getExceptions
- getDashboardMetrics

Return a JSON array of string tool names. Only include tools that are absolutely necessary. If you are unsure, include 'getDashboardMetrics'.

User Prompt: ${prompt}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: fullPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING
            }
          }
        }
      });
      
      let tools = [];
      try {
        tools = JSON.parse(response.text || "[]");
      } catch (e) {
        tools = ["getDashboardMetrics"];
      }
      
      res.json({ toolsToCall: tools });
    } catch (error: any) {
      console.error("Error communicating with Gemini API (choose-tools):", error);
      res.status(500).json({ error: error.message || "Failed to choose tools." });
    }
  });

  // AI API Route
  app.post("/api/ai/insight", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key is not configured on the server." });
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const { prompt, dataContext } = req.body;
      
      const fullPrompt = `You are an expert Supply Chain AI Copilot analyzing the following supply chain context.
You must ground all your insights purely on the provided data. Do not fabricate any information.
Answer the user's prompt or provide executive insights as requested.

Context Data (JSON):
${JSON.stringify(dataContext)}

User Prompt: ${prompt}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: fullPrompt,
        config: {
          systemInstruction: "You are an expert AI Supply Chain assistant. Your responses must be grounded strictly in the provided data. Structure your response clearly. When appropriate, use the exact headers: EXECUTIVE SUMMARY, KEY FINDINGS, BUSINESS IMPACT, RECOMMENDED ACTIONS, CONFIDENCE, DATA USED. Never invent missing information."
        }
      });
      
      res.json({ response: response.text });
    } catch (error: any) {
      console.error("Error communicating with Gemini API:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI insights." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
