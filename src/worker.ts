/**
 * ORION-9 CLOUDFLARE WORKER ENTRY POINT
 * Serves API routes (/api/wallpaper/cloudflare/status, /api/wallpaper/status, /api/wallpaper/generate, /api/health)
 * with Cloudflare Workers AI (@cf/black-forest-labs/flux-2-klein-4b) as the sole AI image provider.
 */

import { checkCloudflareWallpaperStatus, generateCloudflareWallpapers } from "./server/cloudflareAiBackend";

export interface Env {
  ASSETS: { fetch: (request: Request | string) => Promise<Response> };
  AI?: any; // Cloudflare Workers AI Binding
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
}

export default {
  async fetch(request: Request, env: Env, _ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // 1. GET /api/wallpaper/cloudflare/status or /api/wallpaper/status or /api/ai/wallpaper-status
    if (
      (url.pathname === "/api/wallpaper/cloudflare/status" ||
        url.pathname === "/api/wallpaper/status" ||
        url.pathname === "/api/ai/wallpaper-status") &&
      request.method === "GET"
    ) {
      const status = await checkCloudflareWallpaperStatus(env.AI, env.CLOUDFLARE_API_TOKEN, env.CLOUDFLARE_ACCOUNT_ID);
      return new Response(JSON.stringify(status), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
      });
    }

    // 2. POST /api/wallpaper/generate or /api/ai/generate-wallpaper (Cloudflare Workers AI FLUX)
    if (
      (url.pathname === "/api/wallpaper/generate" || url.pathname === "/api/ai/generate-wallpaper") &&
      request.method === "POST"
    ) {
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

      return new Response(JSON.stringify(result), {
        status: result.statusCode,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. GET /api/health
    if (url.pathname === "/api/health" && request.method === "GET") {
      return new Response(
        JSON.stringify({
          status: "ok",
          environment: "CLOUDFLARE_WORKER",
          aiProvider: "Cloudflare Workers AI",
          model: "@cf/black-forest-labs/flux-2-klein-4b"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return env.ASSETS.fetch(request);
  }
};


