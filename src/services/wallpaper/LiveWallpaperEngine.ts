import { MotionProfile, QualityTier, WallpaperMode } from '../../types/wallpaper';

export interface LiveWallpaperUniforms {
  uEarthMotion: number;
  uNebulaSpeed: number;
  uStarTwinkle: number;
  uSunGlint: number;
  uParallax: number;
  uGlow: number;
  uParticles: number;
  uReactive: number;
  uTime: number;
}

export interface LiveEngineTelemetry {
  fps: number;
  status: 'RUNNING' | 'PAUSED' | 'STILL' | 'FALLBACK';
  rendererType: 'WebGL2' | 'WebGL' | 'STATIC';
  gpuMemoryEstimateMb?: number;
  mode?: WallpaperMode;
  activeLayersCount?: number;
}

export class LiveWallpaperEngine {
  private static instance: LiveWallpaperEngine;
  private currentTelemetry: LiveEngineTelemetry = {
    fps: 60,
    status: 'RUNNING',
    rendererType: 'WebGL2',
    mode: 'LIVE',
    activeLayersCount: 6,
  };

  private constructor() {}

  public static getInstance(): LiveWallpaperEngine {
    if (!LiveWallpaperEngine.instance) {
      LiveWallpaperEngine.instance = new LiveWallpaperEngine();
    }
    return LiveWallpaperEngine.instance;
  }

  public mapMotionProfileToUniforms(
    motion: MotionProfile,
    quality: QualityTier = 'HIGH',
    isReactive: boolean = true
  ): LiveWallpaperUniforms {
    const qualityScale = quality === 'HIGH' ? 1.0 : quality === 'MEDIUM' ? 0.75 : 0.50;

    return {
      uEarthMotion: (motion.backgroundDrift || 0.05) * qualityScale,
      uNebulaSpeed: (motion.lightMovement || 0.08) * qualityScale,
      uStarTwinkle: (motion.particles || 0.05) * qualityScale,
      uSunGlint: (motion.atmosphere || 0.10) * qualityScale,
      uParallax: (motion.parallax || 0.12) * qualityScale,
      uGlow: (motion.atmosphere || 0.10) * qualityScale,
      uParticles: (motion.particles || 0.05) * qualityScale,
      uReactive: isReactive ? 1.0 : 0.0,
      uTime: 0,
    };
  }

  public getTelemetry(): LiveEngineTelemetry {
    return { ...this.currentTelemetry };
  }

  public updateTelemetry(t: Partial<LiveEngineTelemetry>): void {
    this.currentTelemetry = {
      ...this.currentTelemetry,
      ...t,
    };
  }

  public updateFps(fps: number): void {
    this.currentTelemetry.fps = Math.round(fps);
  }

  public setStatus(status: 'RUNNING' | 'PAUSED' | 'STILL' | 'FALLBACK'): void {
    this.currentTelemetry.status = status;
  }
}

export const liveWallpaperEngine = LiveWallpaperEngine.getInstance();
