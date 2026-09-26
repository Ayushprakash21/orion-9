/**
 * ORION-9 STATIC WALLPAPER ARCHITECTURE TYPES
 * Strict static wallpaper type definitions for AI generation, user uploads,
 * system gallery defaults, and deterministic dual-target policy governance.
 */

export type WallpaperSource = 'SYSTEM' | 'UPLOAD' | 'AI';
export type WallpaperOwnerType = 'SYSTEM' | 'ADMIN' | 'USER';
export type WallpaperStatus = 'APPROVED' | 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type WallpaperStyle = 'Aurora' | 'Space' | 'Nature' | 'Abstract' | 'Custom';
export type QualityTier = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * WallpaperMode is strictly STILL.
 * All dynamic, live, 3D, canvas, WebGL, and Three.js rendering is removed.
 */
export type WallpaperMode = 'STILL';

export type WallpaperTarget = 'login' | 'desktop';

export interface WallpaperRecord {
  wallpaperId: string;
  tenantId: string;
  organizationId?: string;
  ownerType: WallpaperOwnerType;
  ownerId: string;
  name: string;
  assetUrl: string;
  thumbnailUrl?: string;
  source: WallpaperSource;
  aiGenerated: boolean;
  prompt?: string;
  style?: WallpaperStyle;
  candidateId?: string;
  width: number;
  height: number;
  aspectRatio: string; // '16:9'
  mode?: WallpaperMode;
  environment: 'DEMO' | 'LIVE';
  status: WallpaperStatus;
  isSystemDefault?: boolean;
  createdAt: string;
  updatedAt: string;

  // Deprecated backward-compatibility fields for legacy database records (NEVER EXECUTED)
  motionProfile?: any;
  liveScene?: any;
  motionCommand?: string;
  motionVersion?: number;
  runtimeReactive?: boolean;
}

export interface WallpaperCandidate {
  candidateId: string;
  name: string;
  assetUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  prompt: string;
  style: WallpaperStyle;
  createdAt: string;

  // Deprecated legacy field (optional)
  suggestedMotionProfile?: any;
}

export interface AiGenerationParams {
  prompt: string;
  style: WallpaperStyle;
  width?: number;  // Default 2560
  height?: number; // Default 1440
  atmosphereIntensity?: number; // Optional legacy parameter
  motionPreference?: string;    // Optional legacy parameter
}

export interface WallpaperPolicy {
  allowUserCustomization: boolean;
  allowAiGeneration: boolean;
  allowUserUpload: boolean;
  defaultWallpaperId: string;
  environment: 'DEMO' | 'LIVE';
  updatedAt: string;

  // Deprecated legacy limits preserved for backward-compatibility only
  allowRuntimeReactive?: boolean;
  maxParticleCount?: number;
  maxParallaxDepth?: number;
}

export const DEFAULT_WALLPAPER_POLICY: WallpaperPolicy = {
  allowUserCustomization: true,
  allowAiGeneration: true,
  allowUserUpload: true,
  defaultWallpaperId: 'sys-orion-aurora-space',
  environment: 'DEMO',
  updatedAt: new Date().toISOString(),
};
