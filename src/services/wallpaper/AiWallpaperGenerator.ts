/**
 * ORION-9 AI WALLPAPER GENERATOR
 * Production abstraction manager delegating AI image generation to WallpaperImageProvider
 * with Cloudflare Workers AI (@cf/black-forest-labs/flux-2-klein-4b) as active primary implementation.
 */

import { AiGenerationParams, WallpaperCandidate } from '../../types/wallpaper';
import { WallpaperImageProvider, WallpaperImageProviderStatus } from './WallpaperImageProvider';
import { cloudflareWallpaperImageProvider } from './CloudflareWallpaperImageProvider';

export type AiProviderStatusCode =
  | 'READY'
  | 'GENERATING'
  | 'SUCCESS'
  | 'CLOUDFLARE_CONFIGURED'
  | 'CLOUDFLARE_QUOTA_EXCEEDED'
  | 'CLOUDFLARE_AUTH_ERROR'
  | 'CLOUDFLARE_MODEL_ERROR'
  | 'CLOUDFLARE_AI_UNAVAILABLE'
  | 'NETWORK_ERROR';

export type AiWallpaperProviderStatus = WallpaperImageProviderStatus;

export class AiWallpaperGenerator {
  private static instance: AiWallpaperGenerator;
  private activeProvider: WallpaperImageProvider = cloudflareWallpaperImageProvider;

  private constructor() {}

  public static getInstance(): AiWallpaperGenerator {
    if (!AiWallpaperGenerator.instance) {
      AiWallpaperGenerator.instance = new AiWallpaperGenerator();
    }
    return AiWallpaperGenerator.instance;
  }

  public setProvider(provider: WallpaperImageProvider): void {
    this.activeProvider = provider;
  }

  public getProvider(): WallpaperImageProvider {
    return this.activeProvider;
  }

  public async checkProviderStatus(): Promise<WallpaperImageProviderStatus> {
    return this.activeProvider.checkStatus();
  }

  public async generateCandidates(params: AiGenerationParams): Promise<WallpaperCandidate[]> {
    return this.activeProvider.generateCandidates(params);
  }
}

export const aiWallpaperGenerator = AiWallpaperGenerator.getInstance();
