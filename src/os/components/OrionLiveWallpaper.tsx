import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { wallpaperRepository, SYSTEM_DEFAULT_WALLPAPERS, WallpaperTarget } from '../../repositories/WallpaperRepository';
import { WallpaperRecord, MotionProfile, DEFAULT_MOTION_PROFILE, QualityTier, WallpaperMode } from '../../types/wallpaper';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { HealthService } from '../../operations/HealthService';
import { DemoPersistentSchedulerService } from '../../services/demo/DemoPersistentSchedulerService';
import { liveWallpaperRenderer } from '../../services/wallpaper/LiveWallpaperRenderer';
import { liveWallpaperEngine } from '../../services/wallpaper/LiveWallpaperEngine';
import { sceneAnalyzer } from '../../services/wallpaper/SceneAnalyzer';

interface OrionLiveWallpaperProps {
  hasOpenWindows?: boolean;
  showLogo?: boolean;
  overrideWallpaper?: WallpaperRecord;
  overrideMotionProfile?: MotionProfile;
  overrideRuntimeReactive?: boolean;
  quality?: QualityTier;
  target?: WallpaperTarget;
  userId?: string;
  tenantId?: string;
}

export function OrionLiveWallpaper({ 
  hasOpenWindows = false, 
  showLogo = true,
  overrideWallpaper,
  overrideMotionProfile,
  overrideRuntimeReactive,
  quality = 'MEDIUM',
  target = 'desktop',
  userId,
  tenantId
}: OrionLiveWallpaperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active Wallpaper & Config state
  const [activeWallpaper, setActiveWallpaper] = useState<WallpaperRecord>(() => overrideWallpaper || SYSTEM_DEFAULT_WALLPAPERS[0]);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [dbEnv, setDbEnv] = useState<'DEMO' | 'LIVE'>(() => dbManager.getEnvironment());
  const [runtimeSignalPulse, setRuntimeSignalPulse] = useState(0);

  // Load Active Wallpaper from Repository for specific target & user identity
  useEffect(() => {
    if (overrideWallpaper) {
      setActiveWallpaper(overrideWallpaper);
      return;
    }

    let mounted = true;
    const activeUserId = userId;
    const activeTenantId = tenantId || 'global';

    const loadActive = async () => {
      try {
        const wp = await wallpaperRepository.getActiveWallpaper(activeUserId, activeTenantId, target);
        if (mounted) setActiveWallpaper(wp);
      } catch (err) {
        console.warn(`Failed to load active ${target} wallpaper:`, err);
      }
    };

    loadActive();

    const handleActiveChange = (e: any) => {
      if (
        mounted &&
        e.detail?.wallpaper &&
        e.detail?.target === target
      ) {
        setActiveWallpaper(e.detail.wallpaper);
      }
    };

    const handleEnvChange = () => {
      if (mounted) setDbEnv(dbManager.getEnvironment());
    };

    window.addEventListener('orion-active-wallpaper-changed', handleActiveChange as EventListener);
    window.addEventListener('orion-database-environment-changed', handleEnvChange);

    return () => {
      mounted = false;
      window.removeEventListener('orion-active-wallpaper-changed', handleActiveChange as EventListener);
      window.removeEventListener('orion-database-environment-changed', handleEnvChange);
    };
  }, [overrideWallpaper, target, userId, tenantId]);

  // Mouse Move Lerped Parallax Tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      setParallaxOffset({ x: dx, y: dy });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Real Runtime Reaction Listener (NO Fake Data)
  useEffect(() => {
    const isReactive = overrideRuntimeReactive !== undefined 
      ? overrideRuntimeReactive 
      : activeWallpaper.runtimeReactive;

    if (!isReactive) return;

    let mounted = true;
    const triggerPulse = () => {
      if (mounted) {
        setRuntimeSignalPulse(1.0);
        setTimeout(() => {
          if (mounted) setRuntimeSignalPulse(0);
        }, 1200);
      }
    };

    // Environment Isolation: DEMO triggers on DEMO scheduler; LIVE triggers on real system events
    let interval: any;
    if (dbEnv === 'DEMO') {
      interval = setInterval(() => {
        const state = DemoPersistentSchedulerService.getInstance().getSchedulerState();
        if (state.status === 'RUNNING') {
          triggerPulse();
        }
      }, 15000);
    } else {
      interval = setInterval(async () => {
        try {
          const health = await HealthService.getInstance().runHealthCheck();
          if (health.readinessProbe) triggerPulse();
        } catch (e) {}
      }, 20000);
    }

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, [activeWallpaper.runtimeReactive, overrideRuntimeReactive, dbEnv]);

  // Live Engine V2 WebGL Renderer Integration
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Resolve LiveSceneDefinition & Mode
    const activeMode: WallpaperMode = activeWallpaper.mode || 'LIVE';
    let sceneDef = activeWallpaper.liveScene;

    if (!sceneDef) {
      sceneDef = sceneAnalyzer.analyzeScene({
        style: activeWallpaper.style,
        prompt: activeWallpaper.prompt || activeWallpaper.name,
      }).defaultSceneDefinition;
      sceneDef.mode = activeMode;
    }

    // Initialize WebGL Renderer
    liveWallpaperRenderer.initialize(canvas, sceneDef, quality, (t) => {
      liveWallpaperEngine.updateTelemetry({
        fps: t.fps,
        status: t.status,
        rendererType: t.rendererType,
        mode: t.mode,
        activeLayersCount: t.activeLayersCount,
      });
    });

    return () => {
      liveWallpaperRenderer.dispose();
    };
  }, [activeWallpaper, quality]);

  // Update Parallax Offset in Renderer
  useEffect(() => {
    liveWallpaperRenderer.setParallax(parallaxOffset.x, parallaxOffset.y);
  }, [parallaxOffset]);

  return (
    <div 
      data-testid="orion-live-wallpaper-container"
      className={cn(
        "orion-live-wallpaper absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[#06080e]",
        "transition-all duration-700 ease-out"
      )} 
      aria-hidden="true"
    >
      {/* 1. Base Wallpaper Image Asset */}
      <img
        src={activeWallpaper.assetUrl || SYSTEM_DEFAULT_WALLPAPERS[0].assetUrl}
        alt={activeWallpaper.name || 'Orion Desktop Wallpaper'}
        onError={(e) => {
          // If image fails to load or decode, gracefully fall back to primary system default
          const target = e.currentTarget;
          if (target.src !== SYSTEM_DEFAULT_WALLPAPERS[0].assetUrl) {
            target.src = SYSTEM_DEFAULT_WALLPAPERS[0].assetUrl;
          }
        }}
        className={cn(
          "orion-live-wallpaper-reference absolute inset-0 w-full h-full object-cover object-center",
          "transition-all duration-700 ease-out",
          hasOpenWindows 
            ? "opacity-70 brightness-[0.80] saturate-[0.85]" 
            : "opacity-95 brightness-100 saturate-100"
        )}
        draggable={false}
      />

      {/* 2. Soft Atmospheric Grading Overlay */}
      <div 
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-700",
          hasOpenWindows ? "opacity-85" : "opacity-65"
        )}
        style={{
          background: `
            radial-gradient(ellipse at 50% 48%, rgba(8, 12, 22, 0.10) 0%, rgba(6, 8, 14, 0.55) 60%, rgba(3, 4, 8, 0.90) 100%),
            linear-gradient(to bottom, rgba(7, 10, 18, 0.35) 0%, transparent 20%, transparent 80%, rgba(4, 6, 12, 0.65) 100%)
          `
        }}
      />

      {/* 3. Live Renderer Canvas (Drift, Parallax, Particles, Light Sweeps) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />

      {/* 4. Official Orion-9 Logo (Only shown if specified by container) */}
      {showLogo && (
        <div className="hidden md:block absolute top-14 left-8 z-[2] select-none pointer-events-none transition-all duration-700">
          <img
            src="/orion-9-official-logo.png"
            alt="ORION-9"
            className="w-44 sm:w-48 lg:w-52 h-auto object-contain drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] filter brightness-105"
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}
