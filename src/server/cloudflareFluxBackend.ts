/**
 * ORION-9 CLOUDFLARE WORKERS AI + FLUX BACKEND SERVICE
 *
 * Primary image-generation provider using Cloudflare Workers AI:
 * Models: @cf/black-forest-labs/flux-1-schnell, @cf/black-forest-labs/flux-2-klein-9b
 */

export type FluxStatusCode =
  | 'READY'
  | 'GENERATING'
  | 'CLOUDFLARE_AI_DAILY_LIMIT'
  | 'CLOUDFLARE_AI_CAPACITY'
  | 'CLOUDFLARE_AI_AUTH_ERROR'
  | 'CLOUDFLARE_AI_MODEL_ERROR'
  | 'CLOUDFLARE_AI_UNAVAILABLE'
  | 'GEMINI_FALLBACK'
  | 'BACKEND_UNREACHABLE';

export interface FluxStatusResult {
  provider: string;
  model: string;
  configured: boolean;
  freeAllocation: string;
  status: FluxStatusCode;
  geminiFallbackConfigured: boolean;
  error?: string | null;
}

export interface FluxGenerationParams {
  prompt: string;
  style?: string;
  width?: number;
  height?: number;
  inputImages?: string[];
  seed?: number;
}

export interface GeneratedImageCandidate {
  id: string;
  assetUrl: string;
  imageUrl: string;
  thumbnailUrl: string;
  mimeType: string;
  provider: string;
  model: string;
}

export interface FluxGenerationResponse {
  success: boolean;
  statusCode: number;
  provider: string;
  model: string;
  candidates?: GeneratedImageCandidate[];
  error?: string;
  code?: FluxStatusCode;
  status?: FluxStatusCode;
  fallbackUsed?: boolean;
}

/**
 * Checks Cloudflare Workers AI + FLUX Status
 */
export async function checkFluxWallpaperStatus(
  aiBinding?: any,
  geminiApiKey?: string
): Promise<FluxStatusResult> {
  const isAiConfigured = Boolean(aiBinding);
  const isGeminiConfigured = Boolean(geminiApiKey && geminiApiKey.trim());

  if (!isAiConfigured && !isGeminiConfigured) {
    return {
      provider: "Cloudflare Workers AI",
      model: "@cf/black-forest-labs/flux-2-klein-9b",
      configured: false,
      freeAllocation: "Cloudflare Workers AI daily allocation",
      status: "CLOUDFLARE_AI_UNAVAILABLE",
      geminiFallbackConfigured: false,
      error: "Cloudflare Workers AI binding is unconfigured."
    };
  }

  return {
    provider: "Cloudflare Workers AI",
    model: "@cf/black-forest-labs/flux-2-klein-9b",
    configured: isAiConfigured,
    freeAllocation: "Cloudflare Workers AI daily allocation",
    status: isAiConfigured ? "READY" : "GEMINI_FALLBACK",
    geminiFallbackConfigured: isGeminiConfigured,
    error: null
  };
}

/**
 * Converts ArrayBuffer / Uint8Array / ReadableStream / Blob or JSON from Workers AI into Base64 Data URL
 */
export async function bufferToBase64DataUrl(buffer: any, mimeType = "image/png"): Promise<string> {
  if (!buffer) {
    throw new Error("Empty buffer received from Workers AI.");
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

  if (typeof buffer === "object" && buffer.image) {
    return bufferToBase64DataUrl(buffer.image, mimeType);
  }

  if (typeof buffer === "object" && buffer.result?.image) {
    return bufferToBase64DataUrl(buffer.result.image, mimeType);
  }

  throw new Error(`Invalid image format returned from Workers AI: ${typeof buffer} (${Object.keys(buffer || {}).join(",")})`);
}

/**
 * Generates Base Wallpaper Image candidates using Cloudflare Workers AI + FLUX
 */
export async function generateFluxWallpaper(
  aiBinding: any,
  params: FluxGenerationParams
): Promise<FluxGenerationResponse> {
  const primaryModel = "@cf/black-forest-labs/flux-1-schnell";

  if (!aiBinding) {
    return {
      success: false,
      statusCode: 503,
      provider: "Cloudflare Workers AI",
      model: primaryModel,
      error: "Cloudflare Workers AI binding (env.AI) is not available.",
      code: "CLOUDFLARE_AI_UNAVAILABLE",
      status: "CLOUDFLARE_AI_UNAVAILABLE"
    };
  }

  const prompt = params.prompt?.trim();
  if (!prompt) {
    return {
      success: false,
      statusCode: 400,
      provider: "Cloudflare Workers AI",
      model: primaryModel,
      error: "Prompt is required and must be a non-empty string."
    };
  }

  const stylePrefix = params.style ? `[Style: ${params.style}] ` : "";
  const fullPrompt = `ORION-9 Space Wallpaper: ${stylePrefix}${prompt}. Deep space, Earth horizon, Orion constellation, 16:9 aspect ratio.`;

  try {
    const candidateResults: GeneratedImageCandidate[] = [];
    const timestamp = Date.now();
    const count = 3;

    for (let i = 0; i < count; i++) {
      // Clean payload with ONLY prompt to conform to Workers AI schema
      const inputPayload = {
        prompt: fullPrompt,
      };

      const rawResult = await aiBinding.run(primaryModel, inputPayload);
      const dataUrl = await bufferToBase64DataUrl(rawResult);

      const candidateId = `flux_wp_${timestamp}_${String.fromCharCode(65 + i)}`;
      candidateResults.push({
        id: candidateId,
        assetUrl: dataUrl,
        imageUrl: dataUrl,
        thumbnailUrl: dataUrl,
        mimeType: "image/png",
        provider: "Cloudflare Workers AI",
        model: primaryModel
      });
    }

    return {
      success: true,
      statusCode: 200,
      provider: "Cloudflare Workers AI",
      model: primaryModel,
      candidates: candidateResults
    };
  } catch (err: any) {
    const msg = (err?.message || String(err) || "").toLowerCase();
    const statusVal = err?.status;

    let code: FluxStatusCode = "CLOUDFLARE_AI_MODEL_ERROR";
    let errorMessage = err?.message || String(err) || "Failed to generate wallpaper with Cloudflare Workers AI.";

    if (statusVal === 429 || msg.includes("daily") || msg.includes("allocation") || msg.includes("quota") || msg.includes("limit")) {
      code = "CLOUDFLARE_AI_DAILY_LIMIT";
      errorMessage = "Today's free AI generation allocation has been reached.";
    } else if (statusVal === 503 || msg.includes("busy") || msg.includes("capacity") || msg.includes("overloaded")) {
      code = "CLOUDFLARE_AI_CAPACITY";
      errorMessage = "Cloudflare Workers AI is currently capacity busy.";
    } else if (statusVal === 401 || statusVal === 403 || msg.includes("unauthorized") || msg.includes("forbidden") || msg.includes("auth")) {
      code = "CLOUDFLARE_AI_AUTH_ERROR";
      errorMessage = "Cloudflare Workers AI authentication error.";
    }

    return {
      success: false,
      statusCode: statusVal || 500,
      provider: "Cloudflare Workers AI",
      model: primaryModel,
      error: errorMessage,
      code,
      status: code
    };
  }
}
