/**
 * ORION-9 CLOUDFLARE WORKER ENTRY POINT
 * Serves API routes (/api/ai/wallpaper-status, /api/ai/generate-wallpaper, /api/health)
 * with Cloudflare Workers AI + FLUX.2 Klein 9B as primary provider.
 */

import { checkFluxWallpaperStatus, generateFluxWallpaper } from "./server/cloudflareFluxBackend";
import { generateGeminiWallpapers } from "./server/geminiBackend";

export interface WorkersAiBinding {
  run(model: string, inputs: Record<string, any>): Promise<any>;
}

export interface Env {
  ASSETS: { fetch: (request: Request | string) => Promise<Response> };
  AI?: WorkersAiBinding;
  GEMINI_API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env, _ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const apiKey = env.GEMINI_API_KEY || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined);

    // 1. GET /api/ai/wallpaper-status
    if (url.pathname === "/api/ai/wallpaper-status" && request.method === "GET") {
      const status = await checkFluxWallpaperStatus(env.AI, apiKey);
      return new Response(JSON.stringify(status), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
      });
    }

    // 2. POST /api/ai/generate-wallpaper (FLUX Direct Path)
    if (url.pathname === "/api/ai/generate-wallpaper" && request.method === "POST") {
      let body: any = {};
      try {
        body = await request.json();
      } catch (e) {
        body = {};
      }

      // Execute Cloudflare Workers AI + FLUX.2 Klein 9B
      if (env.AI) {
        const fluxResult = await generateFluxWallpaper(env.AI, body);
        if (fluxResult.success) {
          return new Response(JSON.stringify(fluxResult), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }

        // Return detailed raw server-side diagnostic error from FLUX / Cloudflare Workers AI
        return new Response(JSON.stringify({
          success: false,
          statusCode: fluxResult.statusCode || 500,
          provider: "Cloudflare Workers AI",
          model: "@cf/black-forest-labs/flux-2-klein-9b",
          error: fluxResult.error,
          code: fluxResult.code || "CLOUDFLARE_AI_MODEL_ERROR",
          status: fluxResult.status || "CLOUDFLARE_AI_MODEL_ERROR"
        }), {
          status: fluxResult.statusCode || 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      // If env.AI binding is absent, fallback to Gemini
      if (apiKey && apiKey.trim()) {
        const geminiResult = await generateGeminiWallpapers(apiKey, body);
        if (geminiResult.success) {
          return new Response(JSON.stringify({
            ...geminiResult.body,
            fallbackUsed: true,
            provider: "Google Gemini (Fallback)"
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }
      }

      return new Response(JSON.stringify({
        success: false,
        statusCode: 503,
        provider: "Cloudflare Workers AI",
        model: "@cf/black-forest-labs/flux-2-klein-9b",
        error: "Cloudflare Workers AI binding (env.AI) is not configured in Worker runtime.",
        code: "CLOUDFLARE_AI_UNAVAILABLE",
        status: "CLOUDFLARE_AI_UNAVAILABLE"
      }), {
        status: 503,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. GET /api/health
    if (url.pathname === "/api/health" && request.method === "GET") {
      return new Response(JSON.stringify({ status: "ok", environment: "CLOUDFLARE_WORKER" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 4. Fallback to Cloudflare Assets for SPA & static files
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  }
};
