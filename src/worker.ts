/**
 * ORION-9 CLOUDFLARE WORKER ENTRY POINT
 * Serves API routes (/api/wallpaper/cloudflare/status, /api/wallpaper/status, /api/wallpaper/generate, /api/health)
 * with Cloudflare Workers AI (@cf/black-forest-labs/flux-2-klein-4b) as the sole AI image provider.
 * Enforces provider privacy by returning minimal clean responses to the client.
 */

import { checkCloudflareWallpaperStatus, generateCloudflareWallpapers } from "./server/cloudflareAiBackend";
import { demoPersistentSchedulerService } from "./services/demo/DemoPersistentSchedulerService";
import { dbManager } from "./core/database/DatabaseConnectionManager";

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
  ORION_RUNTIME_ENVIRONMENT?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

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

    // 3. GET /api/demo/scheduler/state or /api/admin/demo/scheduler/status
    if (
      (url.pathname === "/api/demo/scheduler/state" ||
        url.pathname === "/api/admin/demo/scheduler/status") &&
      request.method === "GET"
    ) {
      const state = demoPersistentSchedulerService.getSchedulerState();
      return new Response(JSON.stringify({ success: true, state, runtime: "CLOUDFLARE_WORKER" }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
    }

    // 4. POST /api/admin/demo/scheduler/trigger (Manual Admin Trigger)
    if (
      (url.pathname === "/api/demo/scheduler/generate" ||
        url.pathname === "/api/admin/demo/scheduler/trigger") &&
      request.method === "POST"
    ) {
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

    // 5. POST /api/admin/demo/scheduler/toggle (Pause/Resume control)
    if (url.pathname === "/api/admin/demo/scheduler/toggle" && request.method === "POST") {
      let body: any = {};
      try {
        body = await request.json();
      } catch (e) {}

      const action = body.action || "toggle";
      const currentState = demoPersistentSchedulerService.getSchedulerState();
      let newState;

      if (action === "pause" || (action === "toggle" && currentState.status === "RUNNING")) {
        newState = await demoPersistentSchedulerService.pauseScheduler("admin", "platform_admin");
      } else {
        newState = await demoPersistentSchedulerService.resumeScheduler("admin", "platform_admin");
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
            hourlyRate: 25,
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
   * Generates EXACTLY 25 enterprise synthetic packages into DEMO Firestore.
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
