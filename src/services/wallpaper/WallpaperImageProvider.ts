/**
 * ORION-9 WALLPAPER IMAGE PROVIDER ABSTRACT INTERFACE
 * Abstraction layer for AI Image Generation providers.
 * Active Implementation: Google Gemini (gemini-3.1-flash-image / Nano Banana 2).
 */

import { AiGenerationParams, WallpaperCandidate } from '../../types/wallpaper';

export interface WallpaperImageProviderStatus {
  providerConfigured: boolean;
  configured: boolean;
  providerName: string;
  model: string;
  available: boolean;
  status: string;
  error: string | null;
  supportedDimensions?: string[];
}

export interface WallpaperImageProvider {
  readonly name: string;
  readonly model: string;
  checkStatus(): Promise<WallpaperImageProviderStatus>;
  generateCandidates(params: AiGenerationParams): Promise<WallpaperCandidate[]>;
}
