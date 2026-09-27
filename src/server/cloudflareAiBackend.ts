/**
 * ORION-9 CLOUDFLARE WORKERS AI BACKEND SERVICE
 *
 * Authoritative backend service for AI Wallpaper Generation via Cloudflare Workers AI:
 * Target Model: @cf/black-forest-labs/flux-2-klein-4b
 * Secondary Fallback: @cf/black-forest-labs/flux-1-schnell
 *
 * NEVER uses Gemini or OpenAI for wallpaper generation.
 */

export type CloudflareAiStatusCode =
  | 'READY'
  | 'GENERATING'
  | 'SUCCESS'
  | 'CLOUDFLARE_CONFIGURED'
  | 'CLOUDFLARE_QUOTA_EXCEEDED'
  | 'CLOUDFLARE_AUTH_ERROR'
  | 'CLOUDFLARE_MODEL_ERROR'
  | 'CLOUDFLARE_AI_UNAVAILABLE'
  | 'NETWORK_ERROR';

export interface WallpaperStatusResult {
  provider: string;
  providerName: string;
  model: string;
  configured: boolean;
  providerConfigured: boolean;
  available: boolean;
  imageGeneration: boolean;
  status: CloudflareAiStatusCode;
  error: string | null;
  supportedDimensions: string[];
}

export interface GeneratedImageCandidate {
  id: string;
  candidateId: string;
  name: string;
  assetUrl: string;
  imageUrl: string;
  thumbnailUrl: string;
  mimeType: string;
  provider: string;
  model: string;
  width: number;
  height: number;
  prompt: string;
  style: string;
  createdAt: string;
}

export interface WallpaperGenerationResponse {
  success: boolean;
  statusCode: number;
  provider: string;
  model: string;
  candidates?: GeneratedImageCandidate[];
  error?: string;
  code?: CloudflareAiStatusCode;
  status?: CloudflareAiStatusCode;
}

export const PRIMARY_CLOUDFLARE_MODEL = "@cf/black-forest-labs/flux-2-klein-4b";
export const FALLBACK_CLOUDFLARE_MODEL = "@cf/black-forest-labs/flux-1-schnell";

/**
 * Checks Cloudflare Workers AI Wallpaper Generator Status
 */
export async function checkCloudflareWallpaperStatus(
  aiBinding?: any,
  apiToken?: string,
  accountId?: string
): Promise<WallpaperStatusResult> {
  const isBindingAvailable = Boolean(aiBinding);
  const isRestAvailable = Boolean(apiToken && accountId);
  const isConfigured = isBindingAvailable || isRestAvailable;

  if (!isConfigured) {
    return {
      provider: "cloudflare-workers-ai",
      providerName: "Cloudflare Workers AI",
      model: PRIMARY_CLOUDFLARE_MODEL,
      configured: false,
      providerConfigured: false,
      available: false,
      imageGeneration: false,
      status: "CLOUDFLARE_AI_UNAVAILABLE",
      error: "Cloudflare Workers AI binding (env.AI) is not configured.",
      supportedDimensions: ["16:9", "2560x1440", "2K", "4K"]
    };
  }

  return {
    provider: "cloudflare-workers-ai",
    providerName: "Cloudflare Workers AI",
    model: PRIMARY_CLOUDFLARE_MODEL,
    configured: true,
    providerConfigured: true,
    available: true,
    imageGeneration: true,
    status: "READY",
    error: null,
    supportedDimensions: ["16:9", "2560x1440", "2K", "4K"]
  };
}

/**
 * Converts ArrayBuffer / Uint8Array / ReadableStream / Blob / JSON to Base64 PNG/JPEG Data URL
 */
export async function bufferToBase64DataUrl(buffer: any, mimeType = "image/png"): Promise<string> {
  if (!buffer) {
    throw new Error("Empty buffer received from Cloudflare Workers AI.");
  }

  if (typeof buffer === "string") {
    if (buffer.startsWith("data:")) return buffer;
    return `data:${mimeType};base64,${buffer}`;
  }

  if (buffer instanceof ReadableStream || (typeof buffer === "object" && typeof buffer.getReader === "function")) {
    const reader = buffer.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    let totalLen = 0;
    for (const chunk of chunks) totalLen += chunk.length;
    const merged = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    return bufferToBase64DataUrl(merged, mimeType);
  }

  if (typeof Blob !== "undefined" && buffer instanceof Blob) {
    const arrayBuffer = await buffer.arrayBuffer();
    return bufferToBase64DataUrl(arrayBuffer, mimeType);
  }

  if (buffer instanceof Uint8Array || buffer instanceof ArrayBuffer || ArrayBuffer.isView(buffer)) {
    const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as ArrayBuffer);
    let binary = "";
    const len = uint8.byteLength;
    const chunkSize = 0x8000;
    for (let i = 0; i < len; i += chunkSize) {
      binary += String.fromCharCode.apply(null, Array.from(uint8.subarray(i, i + chunkSize)));
    }
    const base64 = btoa(binary);
    return `data:${mimeType};base64,${base64}`;
  }

  if (typeof buffer === "object") {
    if (buffer.image) {
      return bufferToBase64DataUrl(buffer.image, mimeType);
    }
    if (buffer.result?.image) {
      return bufferToBase64DataUrl(buffer.result.image, mimeType);
    }
  }

  throw new Error(`Invalid image format returned from Cloudflare Workers AI: ${typeof buffer}`);
}

/**
 * Generate 3 AI Wallpaper Candidates using Cloudflare Workers AI
 */
export async function generateCloudflareWallpapers(
  aiBinding: any,
  body: {
    prompt?: string;
    style?: string;
    count?: number;
    width?: number;
    height?: number;
    apiToken?: string;
    accountId?: string;
  }
): Promise<WallpaperGenerationResponse> {
  const primaryModel = PRIMARY_CLOUDFLARE_MODEL;
  const fallbackModel = FALLBACK_CLOUDFLARE_MODEL;
  const { prompt, style, count = 3, width = 2560, height = 1440, apiToken, accountId } = body || {};

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return {
      success: false,
      statusCode: 400,
      provider: "Cloudflare Workers AI",
      model: primaryModel,
      error: "Prompt is required and must be a non-empty string.",
      code: "CLOUDFLARE_MODEL_ERROR",
      status: "CLOUDFLARE_MODEL_ERROR"
    };
  }

  if (prompt.trim().length > 1000) {
    return {
      success: false,
      statusCode: 400,
      provider: "Cloudflare Workers AI",
      model: primaryModel,
      error: "Prompt length must not exceed 1000 characters.",
      code: "CLOUDFLARE_MODEL_ERROR",
      status: "CLOUDFLARE_MODEL_ERROR"
    };
  }

  const reqCount = typeof count === "number" ? count : 3;
  if (reqCount !== 3) {
    return {
      success: false,
      statusCode: 400,
      provider: "Cloudflare Workers AI",
      model: primaryModel,
      error: "Candidate count must be exactly 3.",
      code: "CLOUDFLARE_MODEL_ERROR",
      status: "CLOUDFLARE_MODEL_ERROR"
    };
  }

  const hasBinding = Boolean(aiBinding);
  const hasRest = Boolean(apiToken && accountId);

  if (!hasBinding && !hasRest) {
    return {
      success: false,
      statusCode: 503,
      provider: "Cloudflare Workers AI",
      model: primaryModel,
      error: "Cloudflare Workers AI is not configured (binding env.AI or credentials missing).",
      code: "CLOUDFLARE_AI_UNAVAILABLE",
      status: "CLOUDFLARE_AI_UNAVAILABLE"
    };
  }

  const stylePrefix = style ? `[Style: ${style}] ` : "";
  const fullPrompt = `ORION-9 Wallpaper: ${stylePrefix}${prompt.trim()}. High resolution static 16:9 wallpaper, 2560x1440 composition.`;

  try {
    const candidates: GeneratedImageCandidate[] = [];
    const timestamp = Date.now();
    let usedModel = primaryModel;

    for (let i = 0; i < 3; i++) {
      const seedVal = timestamp + i * 277;
      let rawResult: any;

      if (hasBinding) {
        try {
          rawResult = await aiBinding.run(primaryModel, {
            prompt: fullPrompt,
            num_steps: 4,
            seed: seedVal,
          });
          usedModel = primaryModel;
        } catch (bindingErr: any) {
          const msg = (bindingErr?.message || String(bindingErr) || "").toLowerCase();
          const statusVal = bindingErr?.status;
          
          if (
            statusVal === 429 ||
            msg.includes("quota") ||
            msg.includes("limit") ||
            msg.includes("daily") ||
            msg.includes("allocation")
          ) {
            throw { status: 429, message: "Cloudflare Workers AI generation quota has been reached.", code: "CLOUDFLARE_QUOTA_EXCEEDED" };
          }
          if (
            statusVal === 401 ||
            statusVal === 403 ||
            msg.includes("unauthorized") ||
            msg.includes("forbidden") ||
            msg.includes("auth")
          ) {
            throw { status: 401, message: "Cloudflare Workers AI authentication failed.", code: "CLOUDFLARE_AUTH_ERROR" };
          }

          // Try secondary fallback model if schema/inference error on primary
          try {
            rawResult = await aiBinding.run(fallbackModel, { prompt: fullPrompt });
            usedModel = fallbackModel;
          } catch (fbErr: any) {
            throw bindingErr;
          }
        }
      } else {
        // Cloudflare REST API execution (for dev server when REST credentials provided)
        const restUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${primaryModel}`;
        const restRes = await fetch(restUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: fullPrompt, num_steps: 4, seed: seedVal }),
        });

        if (!restRes.ok) {
          if (restRes.status === 429) {
            throw { status: 429, message: "Cloudflare Workers AI generation quota has been reached.", code: "CLOUDFLARE_QUOTA_EXCEEDED" };
          }
          if (restRes.status === 401 || restRes.status === 403) {
            throw { status: 401, message: "Cloudflare Workers AI authentication failed.", code: "CLOUDFLARE_AUTH_ERROR" };
          }
          throw { status: restRes.status, message: `Cloudflare REST API failed (HTTP ${restRes.status})`, code: "CLOUDFLARE_MODEL_ERROR" };
        }

        rawResult = await restRes.arrayBuffer();
        usedModel = primaryModel;
      }

      const dataUrl = await bufferToBase64DataUrl(rawResult);
      const candId = `cf_flux_${timestamp}_${String.fromCharCode(65 + i)}`;

      candidates.push({
        id: candId,
        candidateId: candId,
        name: `${style || 'Space'} Concept ${String.fromCharCode(65 + i)}`,
        assetUrl: dataUrl,
        imageUrl: dataUrl,
        thumbnailUrl: dataUrl,
        mimeType: "image/png",
        provider: "Cloudflare Workers AI",
        model: usedModel,
        width,
        height,
        prompt: prompt.trim(),
        style: (style as any) || 'Space',
        createdAt: new Date().toISOString(),
      });
    }

    return {
      success: true,
      statusCode: 200,
      provider: "Cloudflare Workers AI",
      model: usedModel,
      candidates,
    };
  } catch (err: any) {
    const statusVal = err?.status || (err?.statusCode ? Number(err.statusCode) : 500);
    const msg = (err?.message || String(err) || "").toLowerCase();
    const explicitCode = err?.code as CloudflareAiStatusCode | undefined;

    let code: CloudflareAiStatusCode = explicitCode || "CLOUDFLARE_MODEL_ERROR";
    let errorMessage = err?.message || "Failed to generate wallpaper with Cloudflare Workers AI.";

    if (
      statusVal === 429 ||
      msg.includes("quota") ||
      msg.includes("limit") ||
      msg.includes("daily") ||
      msg.includes("allocation")
    ) {
      code = "CLOUDFLARE_QUOTA_EXCEEDED";
      errorMessage = "CLOUDFLARE_QUOTA_EXCEEDED: Cloudflare Workers AI image generation quota has been reached.";
    } else if (
      statusVal === 401 ||
      statusVal === 403 ||
      msg.includes("unauthorized") ||
      msg.includes("forbidden") ||
      msg.includes("auth")
    ) {
      code = "CLOUDFLARE_AUTH_ERROR";
      errorMessage = "CLOUDFLARE_AUTH_ERROR: Cloudflare Workers AI authentication failed.";
    } else if (msg.includes("network") || msg.includes("fetch") || msg.includes("timeout") || msg.includes("unreachable")) {
      code = "NETWORK_ERROR";
      errorMessage = "NETWORK_ERROR: Network error reaching AI wallpaper generation service.";
    }

    return {
      success: false,
      statusCode: statusVal,
      provider: "Cloudflare Workers AI",
      model: primaryModel,
      error: errorMessage,
      code,
      status: code,
    };
  }
}
