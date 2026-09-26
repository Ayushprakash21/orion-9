/**
 * ORION-9 GEMINI BACKEND SERVICES
 * Shared, modular server logic for both Node.js Express (npm run dev)
 * and Cloudflare Workers (production deployment).
 */

import { GoogleGenAI } from "@google/genai";

export type GeminiBackendStatusCode =
  | 'GEMINI_CONFIGURED'
  | 'GEMINI_SECRET_MISSING'
  | 'GEMINI_AUTH_ERROR'
  | 'GEMINI_RATE_LIMIT'
  | 'GEMINI_API_UNAVAILABLE';

export interface WallpaperStatusResult {
  providerConfigured: boolean;
  configured: boolean;
  providerName: string;
  model: string;
  available: boolean;
  status: GeminiBackendStatusCode;
  error: string | null;
  supportedDimensions?: string[];
}

/**
 * Authoritative check for Gemini Wallpaper Status
 */
export async function checkGeminiWallpaperStatus(apiKey?: string): Promise<WallpaperStatusResult> {
  if (!apiKey || !apiKey.trim()) {
    return {
      providerConfigured: false,
      configured: false,
      providerName: "Google Gemini",
      model: "gemini-3.1-flash-image",
      available: false,
      status: "GEMINI_SECRET_MISSING",
      error: "GEMINI_SECRET_MISSING",
      supportedDimensions: ["16:9", "2K", "4K"]
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    await ai.models.list();
    return {
      providerConfigured: true,
      configured: true,
      providerName: "Google Gemini",
      model: "gemini-3.1-flash-image",
      available: true,
      status: "GEMINI_CONFIGURED",
      error: null,
      supportedDimensions: ["16:9", "2K", "4K"]
    };
  } catch (err: any) {
    const statusVal = err?.status;
    const msg = (err?.message || '').toLowerCase();

    let code: GeminiBackendStatusCode = "GEMINI_API_UNAVAILABLE";
    if (
      statusVal === 401 ||
      statusVal === 403 ||
      msg.includes('api key') ||
      msg.includes('unauthorized') ||
      msg.includes('forbidden') ||
      msg.includes('invalid_api_key') ||
      msg.includes('api_key_invalid')
    ) {
      code = "GEMINI_AUTH_ERROR";
    } else if (
      statusVal === 429 ||
      msg.includes('quota') ||
      msg.includes('rate') ||
      msg.includes('resource_exhausted')
    ) {
      code = "GEMINI_RATE_LIMIT";
    }

    return {
      providerConfigured: true,
      configured: true,
      providerName: "Google Gemini",
      model: "gemini-3.1-flash-image",
      available: false,
      status: code,
      error: code,
      supportedDimensions: ["16:9", "2K", "4K"]
    };
  }
}

/**
 * Authoritative Gemini Wallpaper Candidate Generation
 */
export async function generateGeminiWallpapers(
  apiKey: string | undefined,
  body: { prompt?: string; style?: string; count?: number; width?: number; height?: number }
) {
  if (!apiKey || !apiKey.trim()) {
    return {
      success: false,
      statusCode: 503,
      body: { error: "Gemini image provider is not configured.", status: "GEMINI_SECRET_MISSING", code: "GEMINI_SECRET_MISSING" }
    };
  }

  const { prompt, style, count } = body || {};
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return {
      success: false,
      statusCode: 400,
      body: { error: "Prompt is required and must be a non-empty string." }
    };
  }
  if (prompt.trim().length > 1000) {
    return {
      success: false,
      statusCode: 400,
      body: { error: "Prompt length must not exceed 1000 characters." }
    };
  }

  const reqCount = typeof count === "number" ? count : 3;
  if (reqCount !== 3) {
    return {
      success: false,
      statusCode: 400,
      body: { error: "Candidate count must be exactly 3." }
    };
  }

  const resolvedStyle = (typeof style === "string" && style.trim()) ? style.trim() : "Space";

  const buildCandidatePrompt = (userPrompt: string, styleName: string, candidateIndex: number) => {
    const baseSystemInstruction = `You are generating a premium desktop operating-system wallpaper for Orion-9, an enterprise Supply Chain Operating System. Create a cinematic, realistic 16:9 desktop environment. No text. No logos. No UI. No buttons. No cards. No dashboards. No watermark. Visual direction: deep space, recognizable Orion constellation, subtle astronomical atmosphere, premium cinematic lighting, restrained blue/cyan palette, deep blacks, subtle depth, large negative space for OS UI, high-quality photographic/cinematic rendering. The image must work as a desktop wallpaper and must not look like a website hero image.`;
    const candidateVariations = [
      "cinematic deep-space composition, Orion constellation emphasized",
      "deep-space composition with subtle Earth atmosphere and Orion constellation",
      "deep-space enterprise network environment with restrained astronomical topology and Orion constellation"
    ];
    const variation = candidateVariations[candidateIndex % 3];
    return `${baseSystemInstruction}\n\nUser Request: ${userPrompt} (Style: ${styleName}).\nCandidate Variant Direction: ${variation}.`;
  };

  const ai = new GoogleGenAI({ apiKey });
  const modelName = "gemini-3.1-flash-image";

  const generateSingleCandidate = async (idx: number) => {
    const candidatePrompt = buildCandidatePrompt(prompt, resolvedStyle, idx);
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: candidatePrompt,
        config: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "16:9" } }
      });
      const candidates = response.candidates || [];
      if (candidates.length > 0 && candidates[0].content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const mimeType = part.inlineData.mimeType || "image/png";
            const dataUrl = `data:${mimeType};base64,${part.inlineData.data}`;
            return {
              id: `ai_wp_${Date.now()}_${String.fromCharCode(65 + idx)}`,
              name: `${resolvedStyle} Vision ${String.fromCharCode(65 + idx)}`,
              imageUrl: dataUrl,
              thumbnailUrl: dataUrl,
              mimeType,
              modelUsed: modelName
            };
          }
        }
      }
      throw new Error("No image data in response.");
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (err?.status === 429 || msg.includes("quota") || msg.includes("rate") || msg.includes("resource_exhausted")) {
        const error: any = new Error("Gemini image generation rate limit reached.");
        error.statusCode = 429;
        error.code = "GEMINI_RATE_LIMIT";
        throw error;
      }
      if (err?.status === 401 || err?.status === 403 || msg.includes("api key") || msg.includes("unauthorized") || msg.includes("invalid_api_key")) {
        const error: any = new Error("Gemini authentication failed.");
        error.statusCode = 401;
        error.code = "GEMINI_AUTH_ERROR";
        throw error;
      }
      const error: any = new Error(`Gemini returned no image candidate for candidate ${idx + 1}.`);
      error.statusCode = err?.status || 502;
      error.code = "GEMINI_API_UNAVAILABLE";
      throw error;
    }
  };

  try {
    const candidateResults = [];
    for (let i = 0; i < 3; i++) {
      candidateResults.push(await generateSingleCandidate(i));
    }
    return {
      success: true,
      statusCode: 200,
      body: {
        candidates: candidateResults.map((c: any) => ({
          candidateId: c.id,
          id: c.id,
          name: c.name,
          assetUrl: c.imageUrl,
          imageUrl: c.imageUrl,
          thumbnailUrl: c.thumbnailUrl,
          mimeType: c.mimeType
        })),
        provider: "Google Gemini",
        model: modelName
      }
    };
  } catch (err: any) {
    const statusCode = err.statusCode || 502;
    const errorCode = err.code || "GEMINI_API_UNAVAILABLE";
    return {
      success: false,
      statusCode,
      body: { error: err.message || "Failed to generate AI wallpapers.", code: errorCode, status: errorCode }
    };
  }
}
