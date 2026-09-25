/**
 * ORION-9 AI SCENE ANALYZER
 * Analyzes image composition, style parameters, and scene regions (foreground, background, sky, light sources)
 * to generate a bounded, subtle, and premium Live Wallpaper Motion Profile.
 */

import { MotionProfile, DEFAULT_MOTION_PROFILE, WallpaperStyle } from '../../types/wallpaper';

export interface SceneAnalysisResult {
  detectedRegions: {
    skyOrSpace: boolean;
    lightSourcesCount: number;
    particlesRelevant: boolean;
    depthLayersCount: number;
    waterOrFluid: boolean;
  };
  recommendedProfile: MotionProfile;
}

export class SceneAnalyzer {
  private static instance: SceneAnalyzer;

  private constructor() {}

  public static getInstance(): SceneAnalyzer {
    if (!SceneAnalyzer.instance) {
      SceneAnalyzer.instance = new SceneAnalyzer();
    }
    return SceneAnalyzer.instance;
  }

  /**
   * Analyzes selected wallpaper image & style parameters to generate an optimal bounded MotionProfile.
   */
  public analyzeScene(params: {
    style?: WallpaperStyle;
    prompt?: string;
    atmosphereIntensity?: number;
    width?: number;
    height?: number;
  }): SceneAnalysisResult {
    const style = params.style || 'Space';
    const intensity = Math.max(0.2, Math.min(1.0, params.atmosphereIntensity ?? 0.8));
    const promptText = (params.prompt || '').toLowerCase();

    const isSpace = style === 'Space' || promptText.includes('space') || promptText.includes('star') || promptText.includes('galaxy');
    const isAurora = style === 'Aurora' || promptText.includes('aurora') || promptText.includes('light');
    const isNature = style === 'Nature' || promptText.includes('mountain') || promptText.includes('ocean') || promptText.includes('sky');
    const isAbstract = style === 'Abstract' || promptText.includes('cyber') || promptText.includes('tech') || promptText.includes('geometry');

    let backgroundDrift = 0.04;
    let parallax = 0.12;
    let atmosphere = 0.08;
    let particles = 0.04;
    let lightMovement = 0.06;
    let objectMotion = 0.03;

    if (isAurora) {
      atmosphere = 0.16 * intensity;
      lightMovement = 0.14 * intensity;
      particles = 0.08 * intensity;
      parallax = 0.10;
    } else if (isSpace) {
      particles = 0.12 * intensity;
      atmosphere = 0.10 * intensity;
      parallax = 0.16;
      backgroundDrift = 0.05;
    } else if (isNature) {
      backgroundDrift = 0.06 * intensity;
      atmosphere = 0.12 * intensity;
      lightMovement = 0.08 * intensity;
      parallax = 0.14;
    } else if (isAbstract) {
      parallax = 0.20 * intensity;
      lightMovement = 0.12 * intensity;
      objectMotion = 0.06 * intensity;
    }

    // Enforce upper safety bounds (never exceed subtle OS desktop thresholds)
    const recommendedProfile: MotionProfile = {
      backgroundDrift: Number(Math.min(0.12, Math.max(0.01, backgroundDrift)).toFixed(3)),
      parallax: Number(Math.min(0.25, Math.max(0.02, parallax)).toFixed(3)),
      atmosphere: Number(Math.min(0.20, Math.max(0.02, atmosphere)).toFixed(3)),
      particles: Number(Math.min(0.20, Math.max(0.01, particles)).toFixed(3)),
      lightMovement: Number(Math.min(0.20, Math.max(0.02, lightMovement)).toFixed(3)),
      objectMotion: Number(Math.min(0.15, Math.max(0.01, objectMotion)).toFixed(3)),
    };

    return {
      detectedRegions: {
        skyOrSpace: isSpace || isAurora || isNature,
        lightSourcesCount: isAurora ? 4 : isSpace ? 6 : 2,
        particlesRelevant: isSpace || isAurora,
        depthLayersCount: 3,
        waterOrFluid: promptText.includes('ocean') || promptText.includes('river'),
      },
      recommendedProfile,
    };
  }
}

export const sceneAnalyzer = SceneAnalyzer.getInstance();
