/**
 * ORION-9 CLOUDFLARE WORKER ENTRY POINT
 * Serves API routes (/api/ai/wallpaper-status, /api/ai/generate-wallpaper, /api/health)
 * and delegates all asset/SPA requests to Cloudflare Assets (env.ASSETS).
 */

import { checkGeminiWallpaperStatus, generateGeminiWallpapers } from "./server/geminiBackend";

interface Env {
  ASSETS: { fetch: (request: Request | string) => Promise<Response> };
  GEMINI_API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env, _ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const apiKey = env.GEMINI_API_KEY || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined);

    // 1. GET /api/ai/wallpaper-status
    if (url.pathname === "/api/ai/wallpaper-status" && request.method === "GET") {
      const result = await checkGeminiWallpaperStatus(apiKey);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
      });
    }

    // 2. POST /api/ai/generate-wallpaper
    if (url.pathname === "/api/ai/generate-wallpaper" && request.method === "POST") {
      let body: any = {};
      try {
        body = await request.json();
      } catch (e) {
        body = {};
      }
      const result = await generateGeminiWallpapers(apiKey, body);
      return new Response(JSON.stringify(result.body), {
        status: result.statusCode,
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
