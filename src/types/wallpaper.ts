/**
 * ORION-9 WALLPAPER STUDIO & LIVE WALLPAPER ENGINE TYPES
 * Authoritative type definitions for wallpapers, motion profiles, AI candidates, and policy governance.
 */

export type WallpaperSource = 'SYSTEM' | 'UPLOAD' | 'AI';
export type WallpaperOwnerType = 'SYSTEM' | 'ADMIN' | 'USER';
export type WallpaperStatus = 'APPROVED' | 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type WallpaperStyle = 'Aurora' | 'Space' | 'Nature' | 'Abstract' | 'Custom';
export type QualityTier = 'LOW' | 'MEDIUM' | 'HIGH';

export type WallpaperMode = 'STILL' | 'LIVE';

export type LiveLayerType =
  | 'background'
  | 'starfield'
  | 'nebula'
  | 'planet'
  | 'clouds'
  | 'atmosphere'
  | 'water'
  | 'aurora'
  | 'light'
  | 'particle'
  | 'object'
  | 'foreground'
  | 'custom';

export type MotionType =
  | 'static'
  | 'rotate'
  | 'orbit'
  | 'drift'
  | 'flow'
  | 'pulse'
  | 'shimmer'
  | 'breathe'
  | 'parallax'
  | 'float'
  | 'wave'
  | 'custom';

export interface LiveMotionInstruction {
  type: MotionType;
  speed: number;        // 0.0 to 1.0 (clamped)
  intensity: number;    // 0.0 to 1.0 (clamped)
  direction?: string;
  axis?: 'x' | 'y' | 'z';
  phase?: number;
  loop?: boolean;
}

export interface LiveSceneLayer {
  id: string;
  name: string;
  type: LiveLayerType;
  source: 'image' | 'procedural' | 'shader' | 'generated' | 'depth';
  depth: number;
  motion: LiveMotionInstruction;
  opacity: number;
  enabled: boolean;
}

export interface LiveSceneDefinition {
  mode: WallpaperMode;
  renderer: 'STATIC' | 'WEBGL' | 'VIDEO';
  width: number;
  height: number;
  layers: LiveSceneLayer[];
  globalMotion: {
    intensity: number;
    speed: number;
  };
  reactive: boolean;
  userCommand?: string;
  aiGenerated: boolean;
  createdAt: string;
}

export interface MotionProfile {
  backgroundDrift: number; // 0.0 to 0.20
  parallax: number;        // 0.0 to 0.30
  atmosphere: number;      // 0.0 to 0.25
  particles: number;       // 0.0 to 0.30
  lightMovement: number;   // 0.0 to 0.25
  objectMotion: number;    // 0.0 to 0.20
}

export const DEFAULT_MOTION_PROFILE: MotionProfile = {
  backgroundDrift: 0.04,
  parallax: 0.12,
  atmosphere: 0.08,
  particles: 0.04,
  lightMovement: 0.06,
  objectMotion: 0.03,
};

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
  motionProfile: MotionProfile;
  mode?: WallpaperMode;
  liveScene?: LiveSceneDefinition;
  motionCommand?: string;
  motionVersion?: number;
  runtimeReactive: boolean;
  environment: 'DEMO' | 'LIVE';
  status: WallpaperStatus;
  isSystemDefault?: boolean;
  createdAt: string;
  updatedAt: string;
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
  suggestedMotionProfile: MotionProfile;
  createdAt: string;
}

export interface AiGenerationParams {
  prompt: string;
  style: WallpaperStyle;
  atmosphereIntensity: number; // 0.0 to 1.0
  motionPreference: 'Subtle' | 'Atmospheric' | 'Dynamic';
  width?: number;  // Default 2560
  height?: number; // Default 1440
}

export interface WallpaperPolicy {
  allowUserCustomization: boolean;
  allowAiGeneration: boolean;
  allowUserUpload: boolean;
  allowRuntimeReactive: boolean;
  maxParticleCount: number;
  maxParallaxDepth: number;
  defaultWallpaperId: string;
  environment: 'DEMO' | 'LIVE';
  updatedAt: string;
}

export const DEFAULT_WALLPAPER_POLICY: WallpaperPolicy = {
  allowUserCustomization: true,
  allowAiGeneration: true,
  allowUserUpload: true,
  allowRuntimeReactive: true,
  maxParticleCount: 50,
  maxParallaxDepth: 0.3,
  defaultWallpaperId: 'sys-orion-aurora-space',
  environment: 'DEMO',
  updatedAt: new Date().toISOString(),
};
