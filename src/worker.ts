/**
 * ORION-9 CLOUDFLARE WORKER ENTRY POINT
 * Serves API routes (/api/wallpaper/cloudflare/status, /api/wallpaper/status, /api/wallpaper/generate, /api/health)
 * with Cloudflare Workers AI (@cf/black-forest-labs/flux-2-klein-4b) as the sole AI image provider.
 * Enforces provider privacy by returning minimal clean responses to the client.
 */

import { checkCloudflareWallpaperStatus, generateCloudflareWallpapers } from "./server/cloudflareAiBackend";
import { demoPersistentSchedulerService } from "./services/demo/DemoPersistentSchedulerService";
import { DEMO_PACKAGES_PER_HOUR } from "./core/database/DemoSyntheticDataEngine";
import { dbManager } from "./core/database/DatabaseConnectionManager";
import { GoogleGenAI } from "@google/genai";
import {
  extractBearerToken,
  verifyWorkerAuthToken,
  applyWorkerRateLimit,
  createSecurityErrorResponse,
} from "./server/workerSecurity";

export interface ScheduledController {
  scheduledTime: number;
  cron: string;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export interface Env {
  ASSETS: { fetch: (request: Request | string) => Promise<Response> };
  AI?: any; // Cloudflare Workers AI Binding
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  GEMINI_API_KEY?: string;
  ORION_RUNTIME_ENVIRONMENT?: string;
}

const getWorkerGeminiClient = (apiKey?: string) => {
  const key = apiKey || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined);
  if (!key) return null;
  try {
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } catch (e) {
    return null;
  }
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const activeEnv = ((env.ORION_RUNTIME_ENVIRONMENT || dbManager.getEnvironment() || "DEMO").toUpperCase() === "LIVE" ? "LIVE" : "DEMO") as 'DEMO' | 'LIVE';

    // AI status route (Public, rate-limited)
    if (url.pathname === "/api/ai/status" && request.method === "GET") {
      const rateLimitErr = applyWorkerRateLimit(request, 'ai');
      if (rateLimitErr) return rateLimitErr;

      const apiKey = env.GEMINI_API_KEY || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined);
      return new Response(
        JSON.stringify({
          configured: !!apiKey,
          provider: apiKey ? "gemini" : "deterministic_engine",
          model: apiKey ? "gemini-3.8-flash" : "local_scm_rules",
        }),
        { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
      );
    }

    // AI choose tools route (Authenticated & rate-limited)
    if (url.pathname === "/api/ai/choose-tools" && request.method === "POST") {
      const rateLimitErr = applyWorkerRateLimit(request, 'ai');
      if (rateLimitErr) return rateLimitErr;

      const token = extractBearerToken(request);
      const auth = verifyWorkerAuthToken(token, activeEnv);
      if (!auth.authorized) {
        return createSecurityErrorResponse(auth.error || 'Authentication required.', auth.statusCode);
      }

      let body: any = {};
      try { body = await request.json(); } catch (e) {}
      const rawPrompt = (body.prompt || "").trim();
      const p = rawPrompt.toLowerCase();
      const allowlist = [
        'getInventory', 'getInventoryRisks', 'getSuppliers', 'getSupplierPerformance',
        'getPurchaseOrders', 'getOverduePOs', 'getShipments', 'getDelayedShipments',
        'getExceptions', 'getPendingDecisions', 'getDecisions', 'getDashboardMetrics',
        'getDemandForecasts', 'getInventoryOptimization', 'getContracts', 'getTransportationPlans'
      ];

      // Fast-path for simple greetings or capability queries
      if (p === 'hello' || p === 'hi' || p === 'hey' || p === 'good morning' || p === 'help' || p === 'what can you do') {
        return new Response(JSON.stringify({ toolsToCall: [] }), {
          status: 200, headers: { "Content-Type": "application/json" }
        });
      }

      const apiKey = env.GEMINI_API_KEY || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined);
      const gemini = getWorkerGeminiClient(apiKey);

      if (!gemini) {
        const tools: string[] = ['getDashboardMetrics'];
        if (p.includes('inventory') || p.includes('stock') || p.includes('sku')) tools.push('getInventory', 'getInventoryRisks');
        if (p.includes('supplier') || p.includes('vendor')) tools.push('getSuppliers', 'getSupplierPerformance');
        if (p.includes('po') || p.includes('purchase') || p.includes('order')) tools.push('getPurchaseOrders', 'getOverduePOs');
        if (p.includes('shipment') || p.includes('carrier') || p.includes('delay')) tools.push('getShipments', 'getDelayedShipments');
        if (p.includes('exception') || p.includes('alert')) tools.push('getExceptions');
        if (p.includes('decision') || p.includes('approve')) tools.push('getDecisions', 'getPendingDecisions');
        return new Response(JSON.stringify({ toolsToCall: Array.from(new Set(tools)), fallback: true }), {
          status: 200, headers: { "Content-Type": "application/json" }
        });
      }

      try {
        const systemPrompt = `You are a data router for the Orion Supply Chain Operating System.
Based on the user's query, determine which of the following operational data tools are needed to answer the question:
${allowlist.join(', ')}

Return ONLY a valid JSON array of string tool names. Only include tools that are strictly relevant to fetching data needed for the query.
If the query is a simple greeting (e.g. "hello", "hi") or general capability query (e.g. "what can you do"), return an empty array [].
If unsure for operational queries, include 'getDashboardMetrics'.`;

        const response = await gemini.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `${systemPrompt}\n\nUser Prompt: ${rawPrompt}`,
          config: { temperature: 0.1 }
        });
        const responseText = response.text || "[]";
        let tools: string[] = [];
        try {
          let cleanText = responseText.replace(/\s*```json\s*/g, '').replace(/\s*```\s*/g, '').trim();
          const parsed = JSON.parse(cleanText);
          const list = Array.isArray(parsed) ? parsed : (parsed.tools || parsed.toolsToCall || Object.values(parsed).flat());
          if (Array.isArray(list)) {
            tools = list.filter((t: any) => typeof t === 'string' && allowlist.includes(t));
          }
        } catch (e) {
          tools = ["getDashboardMetrics"];
        }
        return new Response(JSON.stringify({ toolsToCall: tools }), {
          status: 200, headers: { "Content-Type": "application/json" }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ toolsToCall: ["getDashboardMetrics", "getInventoryRisks", "getExceptions", "getPendingDecisions"], fallback: true }), {
          status: 200, headers: { "Content-Type": "application/json" }
        });
      }
    }

    // AI insight route (Authenticated & rate-limited)
    if (url.pathname === "/api/ai/insight" && request.method === "POST") {
      const rateLimitErr = applyWorkerRateLimit(request, 'ai');
      if (rateLimitErr) return rateLimitErr;

      const token = extractBearerToken(request);
      const auth = verifyWorkerAuthToken(token, activeEnv);
      if (!auth.authorized) {
        return createSecurityErrorResponse(auth.error || 'Authentication required.', auth.statusCode);
      }

      let body: any = {};
      try { body = await request.json(); } catch (e) {}
      const { prompt, dataContext, specializedMode } = body;

      const apiKey = env.GEMINI_API_KEY || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined);
      const gemini = getWorkerGeminiClient(apiKey);

      if (!gemini) {
        return new Response(
          JSON.stringify({
            fallback: true,
            error: "No AI provider configured on the server.",
            message: "Using local deterministic reasoning engine grounded in live data."
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      try {
        const systemInstruction = `You are ORION AI, the native cognitive layer of the Orion Supply Chain Operating System.
You operate on the core loop: SENSE → UNDERSTAND → PREDICT → DECIDE → ACT → LEARN.
Grounded Principle: Ground all insights strictly and exclusively in the provided operational data context.
Do NOT invent fake SKUs, fabricated inventory numbers, imaginary supplier names, or false metrics.
When data is missing or incomplete, explicitly state "DATA NOT AVAILABLE" or "INSUFFICIENT DATA".

Instructions:
1. Answer the user's specific prompt directly, accurately, and concisely.
2. If the user asks a simple question, greeting, or specific query (e.g. about a single SKU, PO, or supplier), provide a direct targeted response without forcing unnecessary multi-section templates.
3. For comprehensive risk overviews, executive reports, or multi-domain SCM analysis, structure your response using markdown with standard OS sections where appropriate:
- **EXECUTIVE SUMMARY**
- **OPERATIONAL SIGNALS & ROOT CAUSES** (Categorize clearly as KNOWN, CALCULATED, or INFERRED)
- **DOWNSTREAM RISK & BUSINESS IMPACT** (Quantify financial exposure, service level impact, stockout risk)
- **RECOMMENDED DECISIONS & ACTIONS** (Actionable, specific next steps)
- **CONFIDENCE & EVIDENCE GROUNDING**`;

        const userContent = `OPERATIONAL CONTEXT (Live SCM Data):
${JSON.stringify(dataContext || {}, null, 2)}

SPECIALIZED COGNITIVE MODE: ${specializedMode || 'General Copilot'}

USER PROMPT:
${prompt || ''}`;

        const response = await gemini.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `${systemInstruction}\n\n${userContent}`,
          config: { temperature: 0.2 }
        });

        return new Response(
          JSON.stringify({ response: response.text || "No response generated.", provider: "gemini", model: "gemini-3.8-flash" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({
            fallback: true,
            error: err?.message || "Failed to generate AI insights.",
            message: "Falling back to deterministic Orion reasoning."
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // AI platform intelligence route (Admin Authorized & rate-limited)
    if (url.pathname === "/api/ai/platform-intelligence" && request.method === "POST") {
      const rateLimitErr = applyWorkerRateLimit(request, 'admin');
      if (rateLimitErr) return rateLimitErr;

      const token = extractBearerToken(request);
      const auth = verifyWorkerAuthToken(token, activeEnv);
      if (!auth.authorized) {
        return createSecurityErrorResponse(auth.error || 'Authentication required.', auth.statusCode);
      }
      if (auth.user?.role !== 'platform_admin' && auth.user?.role !== 'organization_admin') {
        return createSecurityErrorResponse('Access denied. Administrator privileges required.', 403);
      }

      let body: any = {};
      try { body = await request.json(); } catch (e) {}
      const { dataContext, scope, horizon, customPrompt } = body;

      const apiKey = env.GEMINI_API_KEY || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined);
      const gemini = getWorkerGeminiClient(apiKey);

      if (!gemini) {
        return new Response(
          JSON.stringify({
            fallback: true,
            error: "No AI provider configured on the server.",
            message: "Using local deterministic reasoning engine grounded in live data."
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      try {
        const systemInstruction = `You are ORION-9 PLATFORM INTELLIGENCE, the strategic cognitive engine for enterprise platform administrators.
Analyze the supplied live operational supply chain context (inventory, suppliers, shipments, exceptions, decisions, purchase orders, contracts).
Adhere strictly to deterministic reality:
1. All metrics, entities, and impacts MUST derive directly from the provided dataContext.
2. Root causes MUST be explicitly tagged with [KNOWN], [CALCULATED], or [INFERRED].
3. DO NOT invent fictitious suppliers, imaginary SKUs, or false data.
4. Provide structured, executive-grade analysis with dollar-quantified risk exposure.

Return a STRICT JSON object conforming to exact platform intelligence schema.`;

        const userContent = `ADMINISTRATOR CONTEXT:
Admin: ${auth.user?.email || auth.user?.userId || 'Platform Administrator'} (${auth.user?.role || 'platform_admin'})
Scope: ${scope || 'full_chain'}
Planning Horizon: ${horizon || 'realtime'}
Custom Query: ${customPrompt || 'Execute end-to-end strategic platform intelligence analysis'}

LIVE SUPPLY CHAIN TELEMETRY:
${JSON.stringify(dataContext || {}, null, 2)}`;

        const response = await gemini.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `${systemInstruction}\n\n${userContent}`,
          config: { temperature: 0.15, responseMimeType: "application/json" }
        });

        const responseText = response.text || "{}";
        let parsed: any = {};
        try {
          let cleanText = responseText.replace(/\s*```json\s*/g, '').replace(/\s*```\s*/g, '').trim();
          parsed = JSON.parse(cleanText);
        } catch (e) {
          parsed = { executiveSummary: responseText, systemHealthScore: 82 };
        }
        return new Response(JSON.stringify(parsed), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ fallback: true, error: err?.message || "Failed to generate strategic platform intelligence." }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 1. GET /api/wallpaper/cloudflare/status or /api/wallpaper/status or /api/ai/wallpaper-status
    if (
      (url.pathname === "/api/wallpaper/cloudflare/status" ||
        url.pathname === "/api/wallpaper/status" ||
        url.pathname === "/api/ai/wallpaper-status") &&
      request.method === "GET"
    ) {
      const status = await checkCloudflareWallpaperStatus(env.AI, env.CLOUDFLARE_API_TOKEN, env.CLOUDFLARE_ACCOUNT_ID);
      const clientStatus = {
        available: status.available,
        configured: status.configured,
        status: status.status,
        error: status.error,
        supportedDimensions: status.supportedDimensions,
      };
      return new Response(JSON.stringify(clientStatus), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
      });
    }

    // 2. POST /api/wallpaper/generate or /api/ai/generate-wallpaper (Cloudflare Workers AI FLUX - Authenticated & rate-limited)
    if (
      (url.pathname === "/api/wallpaper/generate" || url.pathname === "/api/ai/generate-wallpaper") &&
      request.method === "POST"
    ) {
      const rateLimitErr = applyWorkerRateLimit(request, 'wallpaper');
      if (rateLimitErr) return rateLimitErr;

      const token = extractBearerToken(request);
      const auth = verifyWorkerAuthToken(token, activeEnv);
      if (!auth.authorized) {
        return createSecurityErrorResponse(auth.error || 'Authentication required.', auth.statusCode);
      }

      let body: any = {};
      try {
        body = await request.json();
      } catch (e) {
        body = {};
      }

      const result = await generateCloudflareWallpapers(env.AI, {
        ...body,
        apiToken: env.CLOUDFLARE_API_TOKEN,
        accountId: env.CLOUDFLARE_ACCOUNT_ID,
      });

      const clientResponse = result.success
        ? {
            success: true,
            candidates: (result.candidates || []).map(c => ({
              id: c.candidateId || c.id,
              candidateId: c.candidateId || c.id,
              name: c.name,
              assetUrl: c.assetUrl,
              thumbnailUrl: c.thumbnailUrl,
              width: c.width,
              height: c.height,
              sourceWidth: c.sourceWidth,
              sourceHeight: c.sourceHeight,
              finalWidth: c.finalWidth,
              finalHeight: c.finalHeight,
              prompt: c.prompt,
              style: c.style,
              createdAt: c.createdAt,
            }))
          }
        : {
            success: false,
            error: result.error || "Wallpaper generation failed. Please try again.",
            status: result.status || "ERROR",
          };

      return new Response(JSON.stringify(clientResponse), {
        status: result.statusCode,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. GET /api/demo/scheduler/state or /api/admin/demo/scheduler/status or /api/demo/scheduler-status
    if (
      (url.pathname === "/api/demo/scheduler/state" ||
        url.pathname === "/api/admin/demo/scheduler/status" ||
        url.pathname === "/api/demo/scheduler-status") &&
      request.method === "GET"
    ) {
      const token = extractBearerToken(request);
      const auth = verifyWorkerAuthToken(token, activeEnv);
      if (!auth.authorized) {
        return createSecurityErrorResponse(auth.error || 'Authentication required.', auth.statusCode);
      }

      const state = demoPersistentSchedulerService.getSchedulerState();
      return new Response(JSON.stringify({ success: true, state, scheduler: state, runtime: "CLOUDFLARE_WORKER" }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
    }

    // 4. POST /api/admin/demo/scheduler/trigger or /api/demo/generate-hourly-batch (Manual Admin Trigger)
    if (
      (url.pathname === "/api/demo/scheduler/generate" ||
        url.pathname === "/api/demo/generate-hourly-batch" ||
        url.pathname === "/api/admin/demo/scheduler/trigger") &&
      request.method === "POST"
    ) {
      const rateLimitErr = applyWorkerRateLimit(request, 'admin');
      if (rateLimitErr) return rateLimitErr;

      const token = extractBearerToken(request);
      const auth = verifyWorkerAuthToken(token, activeEnv);
      if (!auth.authorized) {
        return createSecurityErrorResponse(auth.error || 'Authentication required.', auth.statusCode);
      }
      if (auth.user?.role !== 'platform_admin' && auth.user?.role !== 'organization_admin') {
        return createSecurityErrorResponse('Access denied. Administrator privileges required.', 403);
      }

      const serverEnv = (env.ORION_RUNTIME_ENVIRONMENT || dbManager.getEnvironment() || "DEMO").toUpperCase();
      if (serverEnv !== "DEMO") {
        return new Response(
          JSON.stringify({
            success: false,
            error: `[DEMO-ENGINE-GUARD] Access Denied: Synthetic Data Engine cannot execute in LIVE mode (Active: ${serverEnv}).`,
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      try {
        const audit = await demoPersistentSchedulerService.executeScheduledHourlyGeneration(undefined, true);
        return new Response(
          JSON.stringify({
            success: true,
            action: "MANUAL_TRIGGER_COMPLETED",
            batch: audit,
            state: demoPersistentSchedulerService.getSchedulerState(),
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({
            success: false,
            error: err.message || "Failed to trigger demo generation batch",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 5. POST /api/admin/demo/scheduler/toggle or /api/demo/scheduler-control (Admin Pause/Resume control)
    if (
      (url.pathname === "/api/admin/demo/scheduler/toggle" ||
        url.pathname === "/api/demo/scheduler-control") &&
      request.method === "POST"
    ) {
      const rateLimitErr = applyWorkerRateLimit(request, 'admin');
      if (rateLimitErr) return rateLimitErr;

      const token = extractBearerToken(request);
      const auth = verifyWorkerAuthToken(token, activeEnv);
      if (!auth.authorized) {
        return createSecurityErrorResponse(auth.error || 'Authentication required.', auth.statusCode);
      }
      if (auth.user?.role !== 'platform_admin' && auth.user?.role !== 'organization_admin') {
        return createSecurityErrorResponse('Access denied. Administrator privileges required.', 403);
      }

      let body: any = {};
      try {
        body = await request.json();
      } catch (e) {}

      const rawAction = (body.action || "toggle").toLowerCase();
      const currentState = demoPersistentSchedulerService.getSchedulerState();
      let newState;

      if (rawAction === "pause" || (rawAction === "toggle" && currentState.status === "RUNNING")) {
        newState = await demoPersistentSchedulerService.pauseScheduler(auth.user?.userId || "admin", auth.user?.role || "platform_admin");
      } else {
        newState = await demoPersistentSchedulerService.resumeScheduler(auth.user?.userId || "admin", auth.user?.role || "platform_admin");
      }

      return new Response(
        JSON.stringify({ success: true, state: newState }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 6. GET /api/health
    if (url.pathname === "/api/health" && request.method === "GET") {
      return new Response(
        JSON.stringify({
          status: "ok",
          environment: "CLOUDFLARE_WORKER",
          scheduler: {
            mode: "CLOUDFLARE_CRON",
            cron: "0 * * * *",
            hourlyRate: DEMO_PACKAGES_PER_HOUR,
            state: demoPersistentSchedulerService.getSchedulerState(),
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return env.ASSETS.fetch(request);
  },

  /**
   * CLOUDFLARE WORKER CRON TRIGGER HANDLER (0 * * * *)
   * Runs once every hour at minute 0 UTC.
   * Generates EXACTLY 30 enterprise synthetic packages into DEMO Firestore.
   */
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const scheduledTime = controller.scheduledTime ? new Date(controller.scheduledTime) : new Date();
    const currentHourUtc = new Date(Date.UTC(scheduledTime.getUTCFullYear(), scheduledTime.getUTCMonth(), scheduledTime.getUTCDate(), scheduledTime.getUTCHours(), 0, 0, 0));
    const scheduledHourIso = currentHourUtc.toISOString();

    console.log(`[ORION-SCHEDULER] Cloudflare Cron Trigger invoked scheduledTime=${scheduledTime.toISOString()} cron="${controller.cron}"`);

    // 1. Authoritative Server-Side Environment Safety Guard
    const serverEnv = (env.ORION_RUNTIME_ENVIRONMENT || dbManager.getEnvironment() || "DEMO").toUpperCase();
    if (serverEnv !== "DEMO") {
      console.error(`[ORION-SCHEDULER] [DEMO-ENGINE-GUARD] Access Denied: Cloudflare Cron cannot execute in LIVE mode (Active: ${serverEnv}). Execution aborted.`);
      return;
    }

    // 2. Execute scheduled hourly generation inside Worker execution context
    const scheduledTask = async () => {
      try {
        console.log(`[ORION-SCHEDULER] processing scheduledHour=${scheduledHourIso}`);
        const result = await demoPersistentSchedulerService.executeScheduledHourlyGeneration(scheduledHourIso, false);
        console.log(`[ORION-SCHEDULER] scheduled execution finished: batchId=${result.batchId} status=${result.status} packages=${result.packagesCount}`);
      } catch (err: any) {
        console.error(`[ORION-SCHEDULER] scheduled execution failed scheduledHour=${scheduledHourIso} error:`, err);
      }
    };

    const taskPromise = scheduledTask();
    if (ctx && typeof ctx.waitUntil === "function") {
      ctx.waitUntil(taskPromise);
    }
    await taskPromise;
  }
};
