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
  configured: boolean;
  provider: string;
  providerConfigured: boolean;
  providerName: string;
  model: string;
  imageGeneration: boolean;
  available: boolean;
  status: GeminiBackendStatusCode;
  error: string | null;
  supportedDimensions?: string[];
}

export const PRIMARY_GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";
export const FALLBACK_GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image";

/**
 * Safe Authoritative Check for Gemini Wallpaper Status (Health Check)
 * NEVER returns the API key.
 */
export async function checkGeminiWallpaperStatus(apiKey?: string): Promise<WallpaperStatusResult> {
  if (!apiKey || !apiKey.trim()) {
    return {
      configured: false,
      provider: "google-gemini",
      providerConfigured: false,
      providerName: "Google Gemini",
      model: PRIMARY_GEMINI_IMAGE_MODEL,
      imageGeneration: false,
      available: false,
      status: "GEMINI_SECRET_MISSING",
      error: "GEMINI_SECRET_MISSING",
      supportedDimensions: ["16:9", "2560x1440", "2K", "4K"]
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    await ai.models.list();
    return {
      configured: true,
      provider: "google-gemini",
      providerConfigured: true,
      providerName: "Google Gemini",
      model: PRIMARY_GEMINI_IMAGE_MODEL,
      imageGeneration: true,
      available: true,
      status: "GEMINI_CONFIGURED",
      error: null,
      supportedDimensions: ["16:9", "2560x1440", "2K", "4K"]
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
      configured: true,
      provider: "google-gemini",
      providerConfigured: true,
      providerName: "Google Gemini",
      model: PRIMARY_GEMINI_IMAGE_MODEL,
      imageGeneration: false,
      available: false,
      status: code,
      error: code,
      supportedDimensions: ["16:9", "2560x1440", "2K", "4K"]
    };
  }
}

/**
 * Authoritative Gemini Wallpaper Candidate Generation (3 Candidates)
 */
export async function generateGeminiWallpapers(
  apiKey: string | undefined,
  body: { prompt?: string; style?: string; count?: number; width?: number; height?: number }
) {
  if (!apiKey || !apiKey.trim()) {
    return {
      success: false,
      statusCode: 503,
      body: { 
        error: "Gemini API is not configured on the ORION-9 server.", 
        status: "GEMINI_SECRET_MISSING", 
        code: "GEMINI_SECRET_MISSING" 
      }
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

  const generateSingleCandidate = async (idx: number) => {
    const candidatePrompt = buildCandidatePrompt(prompt, resolvedStyle, idx);
    const modelsToTry = [PRIMARY_GEMINI_IMAGE_MODEL, FALLBACK_GEMINI_IMAGE_MODEL];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        // 1. Try SDK call
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: candidatePrompt,
            config: { 
              responseModalities: ["IMAGE"], 
              imageConfig: { aspectRatio: "16:9" } 
            }
          });

          const candidates = response.candidates || [];
          if (candidates.length > 0 && candidates[0].content?.parts) {
            for (const part of candidates[0].content.parts) {
              const inlineData = part.inlineData || (part as any).inline_data;
              if (inlineData && inlineData.data) {
                const mimeType = inlineData.mimeType || inlineData.mime_type || "image/png";
                const dataUrl = `data:${mimeType};base64,${inlineData.data}`;
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
        } catch (sdkErr: any) {
          // Fall back to direct REST fetch
          const restRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey,
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [{ text: candidatePrompt }]
                  }
                ],
                generationConfig: {
                  responseModalities: ["IMAGE"],
                  imageConfig: {
                    aspectRatio: "16:9"
                  }
                }
              })
            }
          );

          if (restRes.ok) {
            const json: any = await restRes.json();
            const parts = json?.candidates?.[0]?.content?.parts || [];
            for (const part of parts) {
              const inlineData = part.inlineData || part.inline_data;
              if (inlineData && inlineData.data) {
                const mimeType = inlineData.mimeType || inlineData.mime_type || "image/png";
                const dataUrl = `data:${mimeType};base64,${inlineData.data}`;
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
          } else {
            const errBody: any = await restRes.json().catch(() => ({}));
            const errObj = new Error(errBody?.error?.message || `HTTP ${restRes.status}`);
            (errObj as any).status = restRes.status;
            throw errObj;
          }
        }
      } catch (err: any) {
        lastError = err;
        const msg = (err?.message || '').toLowerCase();
        // If auth or rate limit, fail fast instead of trying next model
        if (err?.status === 401 || err?.status === 403 || msg.includes("api key") || msg.includes("unauthorized") || msg.includes("invalid_api_key")) {
          const error: any = new Error("Gemini API authentication failed.");
          error.statusCode = 401;
          error.code = "GEMINI_AUTH_ERROR";
          throw error;
        }
        if (err?.status === 429 || msg.includes("quota") || msg.includes("rate") || msg.includes("resource_exhausted")) {
          const error: any = new Error("Gemini image generation quota has been reached.");
          error.statusCode = 429;
          error.code = "GEMINI_RATE_LIMIT";
          throw error;
        }
        // Try fallback model
      }
    }

    // If both models failed
    const msg = (lastError?.message || '').toLowerCase();
    if (lastError?.status === 429 || msg.includes("quota") || msg.includes("rate") || msg.includes("resource_exhausted")) {
      const error: any = new Error("Gemini image generation quota has been reached.");
      error.statusCode = 429;
      error.code = "GEMINI_RATE_LIMIT";
      throw error;
    }
    if (lastError?.status === 401 || lastError?.status === 403 || msg.includes("api key") || msg.includes("unauthorized") || msg.includes("invalid_api_key")) {
      const error: any = new Error("Gemini API authentication failed.");
      error.statusCode = 401;
      error.code = "GEMINI_AUTH_ERROR";
      throw error;
    }
    if (lastError?.status === 404 || msg.includes("not found")) {
      const error: any = new Error("Selected Gemini image model is unavailable.");
      error.statusCode = 502;
      error.code = "GEMINI_API_UNAVAILABLE";
      throw error;
    }
    const error: any = new Error("Gemini image generation failed. Please try again.");
    error.statusCode = lastError?.status || 502;
    error.code = "GEMINI_API_UNAVAILABLE";
    throw error;
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
          mimeType: c.mimeType,
          width: 2560,
          height: 1440,
          aspectRatio: "16:9",
          mode: "STILL"
        })),
        provider: "google-gemini",
        providerName: "Google Gemini",
        model: PRIMARY_GEMINI_IMAGE_MODEL
      }
    };
  } catch (err: any) {
    const statusCode = err.statusCode || 502;
    const errorCode = err.code || "GEMINI_API_UNAVAILABLE";
    return {
      success: false,
      statusCode,
      body: { 
        error: err.message || "Gemini image generation failed. Please try again.", 
        code: errorCode, 
        status: errorCode 
      }
    };
  }
}

