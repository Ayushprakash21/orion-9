/**
 * ORION-9 CLOUDFLARE WORKER ENTRY POINT
 * Serves API routes (/api/ai/wallpaper-status, /api/ai/generate-wallpaper, /api/health)
 * with Google Gemini (gemini-3.1-flash-image) as primary AI provider.
 */

import { checkGeminiWallpaperStatus, generateGeminiWallpapers } from "./server/geminiBackend";

export interface Env {
  ASSETS: { fetch: (request: Request | string) => Promise<Response> };
  GEMINI_API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env, _ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const apiKey = env.GEMINI_API_KEY || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined);

    // 1. GET /api/ai/wallpaper-status
    if (url.pathname === "/api/ai/wallpaper-status" && request.method === "GET") {
      const status = await checkGeminiWallpaperStatus(apiKey);
      return new Response(JSON.stringify(status), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
      });
    }

    // 2. POST /api/ai/generate-wallpaper (Gemini Primary Path)
    if (url.pathname === "/api/ai/generate-wallpaper" && request.method === "POST") {
      let body: any = {};
      try {
        body = await request.json();
      } catch (e) {
        body = {};
      }

      const geminiResult = await generateGeminiWallpapers(apiKey, body);
      return new Response(JSON.stringify(geminiResult.body), {
        status: geminiResult.statusCode,
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

    return env.ASSETS.fetch(request);
  }
};
