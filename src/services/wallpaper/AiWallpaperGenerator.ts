/**
 * ORION-9 AI WALLPAPER GENERATOR SERVICE
 * Generates exactly 3 high-resolution desktop wallpaper candidates (2560x1440 / 16:9)
 * optimized for Orion OS desktop visual space, zero auto-embedded logos, and live animation.
 */

import { AiGenerationParams, WallpaperCandidate, WallpaperStyle, DEFAULT_MOTION_PROFILE } from '../../types/wallpaper';
import { sceneAnalyzer } from './SceneAnalyzer';

export class AiWallpaperGenerator {
  private static instance: AiWallpaperGenerator;

  private constructor() {}

  public static getInstance(): AiWallpaperGenerator {
    if (!AiWallpaperGenerator.instance) {
      AiWallpaperGenerator.instance = new AiWallpaperGenerator();
    }
    return AiWallpaperGenerator.instance;
  }

  /**
   * Generates exactly 3 candidate desktop wallpapers for user selection.
   */
  public async generateCandidates(params: AiGenerationParams): Promise<WallpaperCandidate[]> {
    const width = params.width || 2560;
    const height = params.height || 1440;
    const style = params.style || 'Space';
    const prompt = params.prompt || 'Deep space cosmic nebula with subtle atmospheric horizon';

    // Simulate AI generation time (or call API)
    await new Promise(resolve => setTimeout(resolve, 800));

    const timestamp = Date.now();

    // 3 distinct candidates with unique color palettes & compositions
    const candidateAData = this.createProceduralWallpaperSvg(width, height, style, 'variant-A');
    const candidateBData = this.createProceduralWallpaperSvg(width, height, style, 'variant-B');
    const candidateCData = this.createProceduralWallpaperSvg(width, height, style, 'variant-C');

    const analysisA = sceneAnalyzer.analyzeScene({ style, prompt, atmosphereIntensity: params.atmosphereIntensity });

    const candidateA: WallpaperCandidate = {
      candidateId: `cand_${timestamp}_A`,
      name: `${style} Horizon Alpha`,
      assetUrl: candidateAData.fullSvg,
      thumbnailUrl: candidateAData.thumbSvg,
      width,
      height,
      prompt,
      style,
      suggestedMotionProfile: { ...analysisA.recommendedProfile, particles: 0.08 },
      createdAt: new Date().toISOString(),
    };

    const candidateB: WallpaperCandidate = {
      candidateId: `cand_${timestamp}_B`,
      name: `${style} Atmospheric Beta`,
      assetUrl: candidateBData.fullSvg,
      thumbnailUrl: candidateBData.thumbSvg,
      width,
      height,
      prompt,
      style,
      suggestedMotionProfile: { ...analysisA.recommendedProfile, atmosphere: 0.16 },
      createdAt: new Date().toISOString(),
    };

    const candidateC: WallpaperCandidate = {
      candidateId: `cand_${timestamp}_C`,
      name: `${style} Celestial Gamma`,
      assetUrl: candidateCData.fullSvg,
      thumbnailUrl: candidateCData.thumbSvg,
      width,
      height,
      prompt,
      style,
      suggestedMotionProfile: { ...analysisA.recommendedProfile, parallax: 0.20 },
      createdAt: new Date().toISOString(),
    };

    return [candidateA, candidateB, candidateC];
  }

  /**
   * Generates crisp 2560x1440 desktop vector wallpapers for immediate zero-latency presentation.
   */
  private createProceduralWallpaperSvg(width: number, height: number, style: WallpaperStyle, variant: 'variant-A' | 'variant-B' | 'variant-C') {
    let color1 = '%23010307';
    let color2 = '%230f172a';
    let color3 = '%231e3a8a';
    let color4 = '%2338bdf8';

    if (style === 'Aurora') {
      if (variant === 'variant-A') {
        color2 = '%23064e3b'; color3 = '%230d9488'; color4 = '%2334d399';
      } else if (variant === 'variant-B') {
        color2 = '%23311042'; color3 = '%237e22ce'; color4 = '%23c084fc';
      } else {
        color2 = '%230c4a6e'; color3 = '%230284c7'; color4 = '%2338bdf8';
      }
    } else if (style === 'Nature') {
      if (variant === 'variant-A') {
        color2 = '%23062c43'; color3 = '%2305595b'; color4 = '%2306b6d4';
      } else if (variant === 'variant-B') {
        color2 = '%231c1917'; color3 = '%2378350f'; color4 = '%23fbbf24';
      } else {
        color2 = '%230f291e'; color3 = '%23166534'; color4 = '%234ade80';
      }
    } else if (style === 'Abstract') {
      if (variant === 'variant-A') {
        color2 = '%23111827'; color3 = '%23374151'; color4 = '%2360a5fa';
      } else if (variant === 'variant-B') {
        color2 = '%2318181b'; color3 = '%2327272a'; color4 = '%23a855f7';
      } else {
        color2 = '%23022c22'; color3 = '%23065f46'; color4 = '%2334d399';
      }
    } else {
      // Space (default)
      if (variant === 'variant-A') {
        color2 = '%23090d16'; color3 = '%231e3a8a'; color4 = '%2360a5fa';
      } else if (variant === 'variant-B') {
        color2 = '%2313091f'; color3 = '%23581c87'; color4 = '%23c084fc';
      } else {
        color2 = '%230c1e28'; color3 = '%23115e59'; color4 = '%232dd4bf';
      }
    }

    const cx = variant === 'variant-A' ? '65%' : variant === 'variant-B' ? '35%' : '50%';
    const cy = variant === 'variant-A' ? '30%' : variant === 'variant-B' ? '60%' : '40%';

    const fullSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><radialGradient id="bg" cx="${cx}" cy="${cy}" r="75%"><stop offset="0%" stop-color="${color4}" stop-opacity="0.45"/><stop offset="40%" stop-color="${color3}" stop-opacity="0.80"/><stop offset="85%" stop-color="${color2}" stop-opacity="0.95"/><stop offset="100%" stop-color="${color1}"/></radialGradient></defs><rect width="${width}" height="${height}" fill="${color1}"/><rect width="${width}" height="${height}" fill="url(%23bg)"/><circle cx="1800" cy="400" r="1.5" fill="%23ffffff" opacity="0.8"/><circle cx="600" cy="900" r="2" fill="%23ffffff" opacity="0.6"/><circle cx="1200" cy="300" r="1" fill="%23ffffff" opacity="0.9"/></svg>`;

    const thumbSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="${color2}"/><circle cx="160" cy="90" r="70" fill="${color4}" opacity="0.4"/></svg>`;

    return { fullSvg, thumbSvg };
  }
}

export const aiWallpaperGenerator = AiWallpaperGenerator.getInstance();
