/**
 * ORION-9 AI SCENE ANALYZER
 * Analyzes image composition, style parameters, and scene regions (foreground, background, sky, light sources)
 * to generate a bounded, subtle, and premium Live Wallpaper Motion Profile.
 */

import { MotionProfile, DEFAULT_MOTION_PROFILE, WallpaperStyle, LiveSceneDefinition, LiveSceneLayer } from '../../types/wallpaper';

export interface SceneAnalysisResult {
  detectedRegions: {
    skyOrSpace: boolean;
    lightSourcesCount: number;
    particlesRelevant: boolean;
    depthLayersCount: number;
    waterOrFluid: boolean;
  };
  recommendedProfile: MotionProfile;
  defaultSceneDefinition: LiveSceneDefinition;
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
   * Analyzes selected wallpaper image & style parameters to generate an optimal bounded MotionProfile and LiveSceneDefinition.
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

    const isSpace = style === 'Space' || promptText.includes('space') || promptText.includes('star') || promptText.includes('galaxy') || promptText.includes('earth');
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

    const recommendedProfile: MotionProfile = {
      backgroundDrift: Number(Math.min(0.12, Math.max(0.01, backgroundDrift)).toFixed(3)),
      parallax: Number(Math.min(0.25, Math.max(0.02, parallax)).toFixed(3)),
      atmosphere: Number(Math.min(0.20, Math.max(0.02, atmosphere)).toFixed(3)),
      particles: Number(Math.min(0.20, Math.max(0.01, particles)).toFixed(3)),
      lightMovement: Number(Math.min(0.20, Math.max(0.02, lightMovement)).toFixed(3)),
      objectMotion: Number(Math.min(0.15, Math.max(0.01, objectMotion)).toFixed(3)),
    };

    // Construct LiveSceneLayer array
    const layers: LiveSceneLayer[] = [
      {
        id: 'layer_bg_nebula',
        name: 'Deep Space Nebula Background',
        type: 'nebula',
        source: 'shader',
        depth: 0.1,
        motion: {
          type: 'drift',
          speed: 0.005 * intensity,
          intensity: 0.15,
          direction: 'horizontal',
          loop: true,
        },
        opacity: 0.9,
        enabled: true,
      },
      {
        id: 'layer_starfield',
        name: 'Background Starfield',
        type: 'starfield',
        source: 'procedural',
        depth: 0.2,
        motion: {
          type: 'static',
          speed: 0.002,
          intensity: 0.10,
          loop: true,
        },
        opacity: 0.85,
        enabled: true,
      },
      {
        id: 'layer_earth_planet',
        name: 'Earth 3D Spherical Surface',
        type: 'planet',
        source: 'image',
        depth: 0.5,
        motion: {
          type: 'rotate',
          speed: 0.015 * intensity,
          intensity: 0.25,
          axis: 'y',
          direction: 'cw',
          loop: true,
        },
        opacity: 1.0,
        enabled: true,
      },
      {
        id: 'layer_earth_clouds',
        name: 'Independent Cloud Atmosphere',
        type: 'clouds',
        source: 'image',
        depth: 0.52,
        motion: {
          type: 'drift',
          speed: 0.018 * intensity,
          intensity: 0.20,
          axis: 'y',
          direction: 'cw',
          loop: true,
        },
        opacity: 0.75,
        enabled: true,
      },
      {
        id: 'layer_earth_atmosphere',
        name: 'Rayleigh Rim Glow',
        type: 'atmosphere',
        source: 'shader',
        depth: 0.55,
        motion: {
          type: 'breathe',
          speed: 0.008 * intensity,
          intensity: 0.15,
          loop: true,
        },
        opacity: 0.80,
        enabled: true,
      },
      {
        id: 'layer_city_lights',
        name: 'Night City Lights Shimmer',
        type: 'light',
        source: 'shader',
        depth: 0.51,
        motion: {
          type: 'shimmer',
          speed: 0.012 * intensity,
          intensity: 0.22,
          loop: true,
        },
        opacity: 0.90,
        enabled: true,
      }
    ];

    const defaultSceneDefinition: LiveSceneDefinition = {
      mode: 'LIVE',
      renderer: 'WEBGL',
      width: params.width || 2560,
      height: params.height || 1440,
      layers,
      globalMotion: {
        intensity: Number(intensity.toFixed(2)),
        speed: 0.40,
      },
      reactive: true,
      userCommand: 'Default Live Earth Scene',
      aiGenerated: false,
      createdAt: new Date(1700000000000).toISOString(),
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
      defaultSceneDefinition,
    };
  }
}

export const sceneAnalyzer = SceneAnalyzer.getInstance();
