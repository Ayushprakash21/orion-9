/**
 * ORION-9 WALLPAPER IMAGE PROVIDER ABSTRACT INTERFACE
 * Abstraction layer for AI Image Generation providers.
 * Active Implementation: Cloudflare Workers AI (@cf/black-forest-labs/flux-2-klein-4b).
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
