/**
 * ORION-9 AI WALLPAPER GENERATOR
 * Production abstraction manager delegating AI image generation to WallpaperImageProvider
 * with Google Gemini (gemini-3.1-flash-image) as active primary implementation.
 */

import { AiGenerationParams, WallpaperCandidate } from '../../types/wallpaper';
import { WallpaperImageProvider, WallpaperImageProviderStatus } from './WallpaperImageProvider';
import { geminiWallpaperImageProvider } from './GeminiWallpaperImageProvider';

export type AiProviderStatusCode =
  | 'GEMINI_CONFIGURED'
  | 'GEMINI_SECRET_MISSING'
  | 'GEMINI_AUTH_ERROR'
  | 'GEMINI_RATE_LIMIT'
  | 'GEMINI_API_UNAVAILABLE'
  | 'BACKEND_UNREACHABLE';

export type AiWallpaperProviderStatus = WallpaperImageProviderStatus;

export class AiWallpaperGenerator {
  private static instance: AiWallpaperGenerator;
  private activeProvider: WallpaperImageProvider = geminiWallpaperImageProvider;

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
