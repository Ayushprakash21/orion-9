/**
 * ORION-9 CLOUDFLARE WORKERS AI + FLUX.2 KLEIN 9B BACKEND SERVICE
 *
 * Primary image-generation provider using Cloudflare Workers AI:
 * Model: @cf/black-forest-labs/flux-2-klein-9b
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
  inputImages?: string[]; // Up to 4 reference image base64 strings
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
 * Checks Cloudflare Workers AI + FLUX.2 Klein 9B Status
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
    configured: true,
    freeAllocation: "Cloudflare Workers AI daily allocation",
    status: isAiConfigured ? "READY" : "GEMINI_FALLBACK",
    geminiFallbackConfigured: isGeminiConfigured,
    error: null
  };
}

/**
 * Converts ArrayBuffer / Uint8Array or JSON from Workers AI into Base64 Data URL
 */
function bufferToBase64DataUrl(buffer: any, mimeType = "image/png"): string {
  if (typeof buffer === "string") {
    if (buffer.startsWith("data:")) return buffer;
    return `data:${mimeType};base64,${buffer}`;
  }
  
  if (buffer instanceof Uint8Array || buffer instanceof ArrayBuffer || ArrayBuffer.isView(buffer)) {
    const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as ArrayBuffer);
    let binary = "";
    const len = uint8.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const base64 = btoa(binary);
    return `data:${mimeType};base64,${base64}`;
  }

  if (buffer && typeof buffer === "object" && buffer.image) {
    return bufferToBase64DataUrl(buffer.image, mimeType);
  }

  throw new Error("Invalid image buffer format returned from Workers AI.");
}

/**
 * Generates Base Wallpaper Image using Cloudflare Workers AI + FLUX.2 Klein 9B
 */
export async function generateFluxWallpaper(
  aiBinding: any,
  params: FluxGenerationParams
): Promise<FluxGenerationResponse> {
  const modelName = "@cf/black-forest-labs/flux-2-klein-9b";

  if (!aiBinding) {
    return {
      success: false,
      statusCode: 503,
      provider: "Cloudflare Workers AI",
      model: modelName,
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
      model: modelName,
      error: "Prompt is required and must be a non-empty string."
    };
  }

  if (prompt.length > 1000) {
    return {
      success: false,
      statusCode: 400,
      provider: "Cloudflare Workers AI",
      model: modelName,
      error: "Prompt length must not exceed 1000 characters."
    };
  }

  // FLUX.2 Klein 9B model payload specification
  const stylePrefix = params.style ? `[Style: ${params.style}] ` : "";
  const fullPrompt = `ORION-9 Enterprise Space Wallpaper: ${stylePrefix}${prompt}. Cinematic, realistic 16:9 space background, Orion constellation, atmospheric Earth rim, deep space, high resolution, ultra detail, no text, no logos.`;

  const inputPayload: Record<string, any> = {
    prompt: fullPrompt,
    num_steps: 4, // Fixed 4-step inference per Klein 9b spec
  };

  if (params.seed !== undefined) {
    inputPayload.seed = params.seed;
  }

  // Support up to 4 reference input images if provided
  if (Array.isArray(params.inputImages) && params.inputImages.length > 0) {
    const validRefs = params.inputImages.slice(0, 4);
    inputPayload.input_images = validRefs;
  }

  try {
    const candidateResults: GeneratedImageCandidate[] = [];
    const timestamp = Date.now();

    // Generate 3 wallpaper candidate variants
    for (let i = 0; i < 3; i++) {
      const variantPayload = {
        ...inputPayload,
        seed: (params.seed || timestamp) + i * 100,
      };

      const rawResult = await aiBinding.run(modelName, variantPayload);
      const dataUrl = bufferToBase64DataUrl(rawResult);

      const candidateId = `flux_wp_${timestamp}_${String.fromCharCode(65 + i)}`;
      candidateResults.push({
        id: candidateId,
        assetUrl: dataUrl,
        imageUrl: dataUrl,
        thumbnailUrl: dataUrl,
        mimeType: "image/png",
        provider: "Cloudflare Workers AI",
        model: modelName
      });
    }

    return {
      success: true,
      statusCode: 200,
      provider: "Cloudflare Workers AI",
      model: modelName,
      candidates: candidateResults
    };
  } catch (err: any) {
    const msg = (err?.message || "").toLowerCase();
    const statusVal = err?.status;

    let code: FluxStatusCode = "CLOUDFLARE_AI_UNAVAILABLE";
    let errorMessage = err?.message || "Failed to generate wallpaper with FLUX.2 Klein 9B.";

    if (statusVal === 429 || msg.includes("daily") || msg.includes("allocation") || msg.includes("quota") || msg.includes("limit")) {
      code = "CLOUDFLARE_AI_DAILY_LIMIT";
      errorMessage = "Today's free AI generation allocation has been reached. Live wallpaper rendering continues normally.";
    } else if (statusVal === 503 || msg.includes("busy") || msg.includes("capacity") || msg.includes("overloaded")) {
      code = "CLOUDFLARE_AI_CAPACITY";
      errorMessage = "Cloudflare Workers AI is currently capacity busy. Retrying fallback provider.";
    } else if (statusVal === 401 || statusVal === 403 || msg.includes("unauthorized") || msg.includes("forbidden")) {
      code = "CLOUDFLARE_AI_AUTH_ERROR";
      errorMessage = "Cloudflare Workers AI authentication error.";
    }

    return {
      success: false,
      statusCode: statusVal || 503,
      provider: "Cloudflare Workers AI",
      model: modelName,
      error: errorMessage,
      code,
      status: code
    };
  }
}
