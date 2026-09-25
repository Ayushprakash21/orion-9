import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { wallpaperRepository, SYSTEM_DEFAULT_WALLPAPERS } from '../../repositories/WallpaperRepository';
import { WallpaperRecord, MotionProfile, DEFAULT_MOTION_PROFILE, QualityTier } from '../../types/wallpaper';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { HealthService } from '../../operations/HealthService';
import { DemoPersistentSchedulerService } from '../../services/demo/DemoPersistentSchedulerService';

interface OrionLiveWallpaperProps {
  hasOpenWindows?: boolean;
  showLogo?: boolean;
  overrideWallpaper?: WallpaperRecord;
  overrideMotionProfile?: MotionProfile;
  overrideRuntimeReactive?: boolean;
  quality?: QualityTier;
}

export function OrionLiveWallpaper({ 
  hasOpenWindows = false, 
  showLogo = true,
  overrideWallpaper,
  overrideMotionProfile,
  overrideRuntimeReactive,
  quality = 'MEDIUM'
}: OrionLiveWallpaperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active Wallpaper & Config state
  const [activeWallpaper, setActiveWallpaper] = useState<WallpaperRecord>(() => overrideWallpaper || SYSTEM_DEFAULT_WALLPAPERS[0]);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [dbEnv, setDbEnv] = useState<'DEMO' | 'LIVE'>(() => dbManager.getEnvironment());
  const [runtimeSignalPulse, setRuntimeSignalPulse] = useState(0);

  // Load Active Wallpaper from Repository
  useEffect(() => {
    if (overrideWallpaper) {
      setActiveWallpaper(overrideWallpaper);
      return;
    }

    let mounted = true;
    const loadActive = async () => {
      try {
        const wp = await wallpaperRepository.getActiveWallpaper();
        if (mounted) setActiveWallpaper(wp);
      } catch (err) {
        console.warn('Failed to load active wallpaper:', err);
      }
    };

    loadActive();

    const handleActiveChange = (e: any) => {
      if (mounted && e.detail?.wallpaper) {
        setActiveWallpaper(e.detail.wallpaper);
      }
    };

    const handleEnvChange = () => {
      if (mounted) setDbEnv(dbManager.getEnvironment());
    };

    window.addEventListener('orion-active-wallpaper-changed', handleActiveChange as EventListener);
    window.addEventListener('orion-wallpaper-updated', handleActiveChange as EventListener);
    window.addEventListener('orion-database-environment-changed', handleEnvChange);

    return () => {
      mounted = false;
      window.removeEventListener('orion-active-wallpaper-changed', handleActiveChange as EventListener);
      window.removeEventListener('orion-wallpaper-updated', handleActiveChange as EventListener);
      window.removeEventListener('orion-database-environment-changed', handleEnvChange);
    };
  }, [overrideWallpaper]);

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

  // Canvas 2D Motion Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 1;
    let height = 1;
    let dpr = 1;
    let raf = 0;
    let running = true;

    const motion: MotionProfile = overrideMotionProfile || activeWallpaper.motionProfile || DEFAULT_MOTION_PROFILE;

    // Seed particle array based on particles factor and quality
    const particleMultiplier = quality === 'HIGH' ? 1.5 : quality === 'LOW' ? 0.5 : 1.0;
    const particleCount = Math.round(35 * motion.particles * particleMultiplier);
    
    const particles = Array.from({ length: particleCount }, (_, i) => ({
      x: (i * 73 + 17) % 100 / 100,
      y: (i * 37 + 43) % 100 / 100,
      radius: 0.8 + ((i * 13) % 15) / 10,
      alpha: 0.15 + ((i * 19) % 35) / 100,
      vx: ((((i * 7) % 11) - 5) / 100) * 0.0002,
      vy: -0.0001 - (((i * 5) % 9) / 100) * 0.0002,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      if (!running) return;
      const time = now * 0.001;
      const reduced = document.documentElement.classList.contains('reduced-motion');

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const intensityFactor = hasOpenWindows ? 0.55 : 0.90;
      const pX = parallaxOffset.x * motion.parallax * 30;
      const pY = parallaxOffset.y * motion.parallax * 30;

      // 1. Atmospheric Ambient Glow Drift
      if (!reduced && motion.atmosphere > 0.01) {
        const sweepX = width * (0.5 + Math.sin(time * 0.02 * motion.backgroundDrift) * 0.35) + pX;
        const sweepY = height * (0.45 + Math.cos(time * 0.025) * 0.15) + pY;
        const atmRadius = width * (0.2 + motion.atmosphere * 0.6);

        const atmGrad = ctx.createRadialGradient(sweepX, sweepY, 0, sweepX, sweepY, atmRadius);
        const pulseAlpha = (0.04 + runtimeSignalPulse * 0.08) * intensityFactor;
        
        atmGrad.addColorStop(0, `rgba(56, 189, 248, ${pulseAlpha * motion.atmosphere * 4})`);
        atmGrad.addColorStop(0.5, `rgba(30, 58, 138, ${pulseAlpha * 0.5})`);
        atmGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = atmGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Micro-Particles Floating Shimmer
      if (!reduced && motion.particles > 0.01) {
        ctx.fillStyle = '#93c5fd';
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x += 1;
          if (p.x > 1) p.x -= 1;
          if (p.y < 0) p.y += 1;
          if (p.y > 1) p.y -= 1;

          const px = p.x * width + pX * 1.5;
          const py = p.y * height + pY * 1.5;

          const shimmer = Math.sin(time * 2 + p.x * 10) * 0.15;
          const finalAlpha = Math.max(0.05, Math.min(0.65, p.alpha + shimmer + runtimeSignalPulse * 0.15)) * intensityFactor;

          ctx.globalAlpha = finalAlpha;
          ctx.beginPath();
          ctx.arc(px, py, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [hasOpenWindows, activeWallpaper, overrideMotionProfile, quality, parallaxOffset, runtimeSignalPulse]);

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
