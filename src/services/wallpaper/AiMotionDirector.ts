/**
 * ORION-9 AI MOTION DIRECTOR SERVICE
 * Converts natural language motion commands and scene descriptions into
 * safe, validated, structured LiveSceneDefinitions for WebGL GPU execution.
 *
 * Security Guarantee: DATA ONLY. Clamps speed, intensity, and layer bounds.
 * Never parses or executes arbitrary code or scripts.
 */

import { 
  LiveSceneDefinition, 
  LiveSceneLayer, 
  LiveMotionInstruction, 
  WallpaperMode, 
  WallpaperStyle, 
  WallpaperRecord 
} from '../../types/wallpaper';
import { sceneAnalyzer } from './SceneAnalyzer';

export interface MotionDirectorRequest {
  userCommand?: string;
  assetUrl?: string;
  style?: WallpaperStyle;
  prompt?: string;
  existingRecord?: WallpaperRecord;
  mode?: WallpaperMode;
}

export class AiMotionDirector {
  private static instance: AiMotionDirector;

  private constructor() {}

  public static getInstance(): AiMotionDirector {
    if (!AiMotionDirector.instance) {
      AiMotionDirector.instance = new AiMotionDirector();
    }
    return AiMotionDirector.instance;
  }

  /**
   * Generates a structured LiveSceneDefinition from natural language command or scene context.
   */
  public async generateMotionPlan(req: MotionDirectorRequest): Promise<LiveSceneDefinition> {
    const rawCommand = (req.userCommand || '').toLowerCase().trim();
    const mode: WallpaperMode = req.mode || (rawCommand.includes('still') ? 'STILL' : 'LIVE');

    // Default baseline scene layers from SceneAnalyzer
    const defaultScene = sceneAnalyzer.analyzeScene({
      style: req.style,
      prompt: req.prompt || req.userCommand,
      atmosphereIntensity: 0.8,
    }).defaultSceneDefinition;

    // Apply NLP command rules over scene layers
    let globalIntensity = 0.35;
    let globalSpeed = 0.40;

    if (rawCommand.includes('subtle') || rawCommand.includes('gentle') || rawCommand.includes('slow')) {
      globalIntensity = 0.15;
      globalSpeed = 0.20;
    } else if (rawCommand.includes('dynamic') || rawCommand.includes('intense') || rawCommand.includes('fast')) {
      globalIntensity = 0.60;
      globalSpeed = 0.75;
    }

    const layers: LiveSceneLayer[] = defaultScene.layers.map(layer => {
      const updatedMotion: LiveMotionInstruction = { ...layer.motion };

      // NLP Planet / Earth rules
      if (layer.type === 'planet') {
        if (rawCommand.includes('rotate') || rawCommand.includes('earth') || rawCommand.includes('planet')) {
          updatedMotion.type = 'rotate';
          updatedMotion.axis = 'y';
          updatedMotion.speed = rawCommand.includes('slow') ? 0.008 : 0.018;
          updatedMotion.intensity = 0.30;
        }
        if (rawCommand.includes('earth still') || rawCommand.includes('keep earth still')) {
          updatedMotion.type = 'static';
          updatedMotion.speed = 0;
          updatedMotion.intensity = 0;
        }
      }

      // NLP Starfield rules
      if (layer.type === 'starfield') {
        if (rawCommand.includes('stars still') || rawCommand.includes('keep stars still') || rawCommand.includes('stationary stars')) {
          updatedMotion.type = 'static';
          updatedMotion.speed = 0;
          updatedMotion.intensity = 0;
        } else if (rawCommand.includes('twinkle') || rawCommand.includes('shimmer stars')) {
          updatedMotion.type = 'shimmer';
          updatedMotion.speed = 0.02;
          updatedMotion.intensity = 0.25;
        }
      }

      // NLP Cloud rules
      if (layer.type === 'clouds') {
        if (rawCommand.includes('clouds move') || rawCommand.includes('independent clouds') || rawCommand.includes('drift clouds')) {
          updatedMotion.type = 'drift';
          updatedMotion.speed = 0.012;
          updatedMotion.intensity = 0.25;
        }
        if (rawCommand.includes('clouds still')) {
          updatedMotion.type = 'static';
          updatedMotion.speed = 0;
          updatedMotion.intensity = 0;
        }
      }

      // NLP Atmosphere rules
      if (layer.type === 'atmosphere') {
        if (rawCommand.includes('breathe') || rawCommand.includes('pulse') || rawCommand.includes('atmosphere')) {
          updatedMotion.type = 'breathe';
          updatedMotion.speed = 0.006;
          updatedMotion.intensity = 0.20;
        }
      }

      // NLP City Lights rules
      if (layer.type === 'light') {
        if (rawCommand.includes('shimmer') || rawCommand.includes('city lights') || rawCommand.includes('lights')) {
          updatedMotion.type = 'shimmer';
          updatedMotion.speed = 0.015;
          updatedMotion.intensity = 0.30;
        }
      }

      // NLP Nebula rules
      if (layer.type === 'nebula') {
        if (rawCommand.includes('flow') || rawCommand.includes('nebula') || rawCommand.includes('drift')) {
          updatedMotion.type = 'flow';
          updatedMotion.speed = 0.006;
          updatedMotion.intensity = 0.25;
        }
      }

      return {
        ...layer,
        motion: updatedMotion,
      };
    });

    const rawDefinition: LiveSceneDefinition = {
      mode,
      renderer: mode === 'STILL' ? 'STATIC' : 'WEBGL',
      width: 2560,
      height: 1440,
      layers,
      globalMotion: {
        intensity: globalIntensity,
        speed: globalSpeed,
      },
      reactive: true,
      userCommand: req.userCommand || 'Make it live.',
      aiGenerated: true,
      createdAt: new Date().toISOString(),
    };

    return this.validateAndClampDefinition(rawDefinition);
  }

  /**
   * Hard bounds & security validation for scene definitions.
   * Clamps layer count, speed, and intensity values to safe runtime parameters.
   */
  public validateAndClampDefinition(def: LiveSceneDefinition): LiveSceneDefinition {
    const clampedLayers = (def.layers || []).slice(0, 32).map(l => ({
      ...l,
      opacity: Math.max(0, Math.min(1.0, l.opacity ?? 1.0)),
      depth: Math.max(0, Math.min(1.0, l.depth ?? 0.5)),
      motion: {
        type: l.motion?.type || 'static',
        speed: Math.max(0, Math.min(1.0, l.motion?.speed ?? 0.01)),
        intensity: Math.max(0, Math.min(1.0, l.motion?.intensity ?? 0.2)),
        axis: l.motion?.axis || 'y',
        direction: l.motion?.direction || 'cw',
        phase: l.motion?.phase || 0,
        loop: l.motion?.loop !== false,
      }
    }));

    return {
      mode: def.mode === 'STILL' ? 'STILL' : 'LIVE',
      renderer: def.mode === 'STILL' ? 'STATIC' : 'WEBGL',
      width: def.width || 2560,
      height: def.height || 1440,
      layers: clampedLayers,
      globalMotion: {
        intensity: Math.max(0, Math.min(1.0, def.globalMotion?.intensity ?? 0.3)),
        speed: Math.max(0, Math.min(1.0, def.globalMotion?.speed ?? 0.4)),
      },
      reactive: def.reactive !== false,
      userCommand: def.userCommand || 'Default Live Scene',
      aiGenerated: !!def.aiGenerated,
      createdAt: def.createdAt || new Date().toISOString(),
    };
  }
}

export const aiMotionDirector = AiMotionDirector.getInstance();
