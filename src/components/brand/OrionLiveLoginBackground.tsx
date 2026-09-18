import React, { useEffect, useRef, useState } from 'react';

/**
 * ORION-9 LIVE CINEMATIC LOGIN BACKGROUND
 *
 * Premium Minimal Operating System Login Environment:
 * - Natural sunset mountain landscape wallpaper base (/orion-login-wallpaper.jpg)
 * - Warm golden horizon light breathing gently (150s prime period)
 * - Sky atmospheric drift (240s / 4-min prime period)
 * - Soft water reflection shimmer and ripple distortion (70s prime period)
 * - Mountain mist & depth haze drift (110s prime period)
 * - Subtle mouse parallax (1–3px depth offset across sky, mountain, water layers)
 * - Automatic hardware quality tiering (HIGH, MEDIUM, LOW, STATIC)
 * - Centralized Live Background Configuration object
 * - UI & Auth State Coupling: INITIAL -> FOCUSED -> TYPING -> SIGNING_IN -> SUCCESS / ERROR
 * - Respects prefers-reduced-motion & mobile power optimization
 * - Strictly NO sci-fi grids, NO HUD cards, NO neon particles, NO gaming visuals
 */

export type QualityTier = 'HIGH' | 'MEDIUM' | 'LOW' | 'STATIC';
export type LoginAuthState = 'INITIAL' | 'FOCUSED' | 'TYPING' | 'SIGNING_IN' | 'SUCCESS' | 'ERROR';

export interface LiveBackgroundConfig {
  enabled: boolean;
  quality: QualityTier | 'auto';
  parallax: boolean;
  intensity: number; // 0.0 to 1.0
  periods: {
    water: number;    // 70s prime cycle
    haze: number;     // 110s prime cycle
    horizon: number;  // 150s prime cycle
    sky: number;      // 240s prime cycle (4 min)
  };
}

export const DEFAULT_LIVE_BACKGROUND_CONFIG: LiveBackgroundConfig = {
  enabled: true,
  quality: 'auto',
  parallax: true,
  intensity: 1.0,
  periods: {
    water: 70,
    haze: 110,
    horizon: 150,
    sky: 240,
  },
};

export interface OrionLiveLoginBackgroundProps {
  /** Current authentication UI interaction state */
  authState?: LoginAuthState;
  /** Whether an input field on the login form is currently focused */
  isInputFocused?: boolean;
  /** Whether the user is actively typing */
  isTyping?: boolean;
  /** Centralized configuration override */
  config?: Partial<LiveBackgroundConfig>;
  /** Forced quality tier (optional) */
  quality?: QualityTier;
  /** Class name for root container */
  className?: string;
}

const WALLPAPER_IMAGE = '/orion-login-wallpaper.jpg';
const FALLBACK_IMAGE = '/orion-9-live-wallpaper-reference.png';

export const OrionLiveLoginBackground: React.FC<OrionLiveLoginBackgroundProps> = ({
  authState = 'INITIAL',
  isInputFocused = false,
  isTyping = false,
  config: userConfig,
  quality: forcedQuality,
  className = '',
}) => {
  const mergedConfig: LiveBackgroundConfig = {
    ...DEFAULT_LIVE_BACKGROUND_CONFIG,
    ...userConfig,
    periods: {
      ...DEFAULT_LIVE_BACKGROUND_CONFIG.periods,
      ...(userConfig?.periods || {}),
    },
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qualityTier, setQualityTier] = useState<QualityTier>('HIGH');
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const targetParallax = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);

  // Auto-detect Hardware Quality Tier & Reduced Motion
  useEffect(() => {
    if (!mergedConfig.enabled) {
      setQualityTier('STATIC');
      return;
    }

    if (forcedQuality) {
      setQualityTier(forcedQuality);
      return;
    }

    if (mergedConfig.quality !== 'auto') {
      setQualityTier(mergedConfig.quality);
      return;
    }

    // 1. Check prefers-reduced-motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setQualityTier('STATIC');
      return;
    }

    // 2. Mobile / Touch device check
    const isMobile = window.innerWidth < 768 || window.matchMedia('(hover: none)').matches;

    // 3. Hardware Concurrency & Memory heuristics
    const concurrency = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 8;

    if (isMobile) {
      setQualityTier(concurrency >= 8 && memory >= 4 ? 'MEDIUM' : 'LOW');
    } else if (concurrency >= 4 && memory >= 4) {
      setQualityTier('HIGH');
    } else if (concurrency >= 2 && memory >= 2) {
      setQualityTier('MEDIUM');
    } else {
      setQualityTier('LOW');
    }
  }, [forcedQuality, mergedConfig.enabled, mergedConfig.quality]);

  // Mouse Parallax Event Listener (1–3px subtle multi-depth movement)
  useEffect(() => {
    if (
      qualityTier === 'STATIC' ||
      !mergedConfig.parallax ||
      window.matchMedia('(hover: none)').matches
    ) {
      return;
    }

    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      // Clamp normalized offset between -1 and +1
      targetParallax.current = {
        x: Math.min(Math.max((e.clientX - centerX) / centerX, -1), 1),
        y: Math.min(Math.max((e.clientY - centerY) / centerY, -1), 1),
      };
    };

    const updateParallax = () => {
      setParallax(prev => {
        const dx = targetParallax.current.x - prev.x;
        const dy = targetParallax.current.y - prev.y;
        if (Math.abs(dx) < 0.0005 && Math.abs(dy) < 0.0005) return prev;
        return {
          x: prev.x + dx * 0.035, // Smooth lerp
          y: prev.y + dy * 0.035,
        };
      });
      rafId = requestAnimationFrame(updateParallax);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafId = requestAnimationFrame(updateParallax);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [qualityTier, mergedConfig.parallax]);

  // Main Canvas Rendering Loop (Horizon Breathing, Sky Drift, Water Reflection Shimmer, Mist Drift)
  useEffect(() => {
    if (qualityTier === 'STATIC') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 1;
    let height = 1;
    let dpr = 1;
    let running = true;
    const startTime = performance.now();

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = (now: number) => {
      if (!running) return;

      const elapsed = (now - startTime) * 0.001; // seconds

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Determine dynamic state multiplier (Requirement 19 & 20)
      let stateMultiplier = 1.0;
      if (authState === 'SIGNING_IN') {
        stateMultiplier = 0.65; // Calmer motion during authentication
      } else if (isTyping || authState === 'TYPING') {
        stateMultiplier = 0.85; // 85-90% intensity during active typing
      } else if (isInputFocused || authState === 'FOCUSED') {
        stateMultiplier = 0.92; // 90-95% intensity on input focus
      }

      const effectiveIntensity = mergedConfig.intensity * stateMultiplier;

      // -------------------------------------------------------------
      // 1. Warm Golden Horizon Light Breathing (150s prime period)
      // -------------------------------------------------------------
      const horizonY = height * 0.50; // Sunset horizon line
      const horizonX = width * 0.50;
      const horizonPeriod = mergedConfig.periods.horizon;
      const horizonBreathPhase = Math.sin(elapsed * (Math.PI * 2 / horizonPeriod));
      // 2–5% subtle brightness variation
      const horizonAlpha = (0.09 + horizonBreathPhase * 0.03) * effectiveIntensity;

      const horizonGrad = ctx.createRadialGradient(
        horizonX, horizonY, 0,
        horizonX, horizonY, width * 0.45
      );
      horizonGrad.addColorStop(0, `rgba(245, 158, 11, ${horizonAlpha * 1.25})`); // Warm Amber
      horizonGrad.addColorStop(0.3, `rgba(251, 191, 36, ${horizonAlpha * 0.6})`);
      horizonGrad.addColorStop(0.7, `rgba(217, 119, 6, ${horizonAlpha * 0.25})`);
      horizonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = horizonGrad;
      ctx.fillRect(0, 0, width, height);

      if (qualityTier === 'HIGH' || qualityTier === 'MEDIUM') {
        // -------------------------------------------------------------
        // 2. Sky Atmospheric Drift (Upper 45% of Canvas, 240s / 4-min period)
        // -------------------------------------------------------------
        const skyPeriod = mergedConfig.periods.sky;
        const skyShiftX = Math.sin(elapsed * (Math.PI * 2 / skyPeriod)) * (width * 0.07);
        const skyGrad = ctx.createLinearGradient(
          skyShiftX, 0,
          width + skyShiftX, height * 0.45
        );
        skyGrad.addColorStop(0, `rgba(251, 146, 60, ${0.028 * effectiveIntensity})`);
        skyGrad.addColorStop(0.5, `rgba(147, 51, 234, ${0.014 * effectiveIntensity})`);
        skyGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height * 0.45);

        // -------------------------------------------------------------
        // 3. Mountain Mist & Depth Haze Drift (45% - 60% of height, 110s period)
        // -------------------------------------------------------------
        const hazePeriod = mergedConfig.periods.haze;
        const mistX = Math.sin(elapsed * (Math.PI * 2 / hazePeriod)) * (width * 0.05);
        const mistGrad = ctx.createLinearGradient(
          width * 0.2 + mistX, height * 0.46,
          width * 0.8 + mistX, height * 0.58
        );
        mistGrad.addColorStop(0, 'transparent');
        mistGrad.addColorStop(0.5, `rgba(254, 215, 170, ${0.038 * effectiveIntensity})`);
        mistGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = mistGrad;
        ctx.fillRect(0, height * 0.45, width, height * 0.15);

        // -------------------------------------------------------------
        // 4. Water Reflection Shimmer & Ripple Distortion (Bottom 38%, 70s period)
        // -------------------------------------------------------------
        const waterTopY = height * 0.62;
        const waterHeight = height - waterTopY;
        const waterPeriod = mergedConfig.periods.water;

        // Draw soft horizontal shimmering light bands on the water surface
        const shimmerCount = qualityTier === 'HIGH' ? 12 : 6;
        for (let i = 0; i < shimmerCount; i++) {
          const normY = i / shimmerCount;
          const bandY = waterTopY + normY * waterHeight;
          const ripplePhase = Math.sin(elapsed * (Math.PI * 2 / waterPeriod) * 10 + normY * 8.0) * (1.5 + normY * 3.5);

          const rx = horizonX + ripplePhase;
          const rw = width * (0.25 + normY * 0.55);

          const waterGrad = ctx.createRadialGradient(
            rx, bandY, 0,
            rx, bandY, rw
          );

          const alpha = (0.022 + Math.sin(elapsed * 0.6 + i) * 0.012) * (1 - normY * 0.6) * effectiveIntensity;

          waterGrad.addColorStop(0, `rgba(251, 191, 36, ${alpha})`);
          waterGrad.addColorStop(0.5, `rgba(245, 158, 11, ${alpha * 0.4})`);
          waterGrad.addColorStop(1, 'transparent');

          ctx.fillStyle = waterGrad;
          ctx.fillRect(0, bandY - 1.5, width, 3);
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [qualityTier, isInputFocused, isTyping, authState, mergedConfig]);

  // Layered Parallax Depths (Requirement 15 & 16)
  // Layer 1: Wallpaper Base (1.5px max offset)
  // Layer 2: Live Canvas Light & Atmosphere (2.5px max offset)
  const bgParallaxX = parallax.x * 1.5;
  const bgParallaxY = parallax.y * 1.5;
  const canvasParallaxX = parallax.x * 2.5;
  const canvasParallaxY = parallax.y * 2.5;

  // Filter intensity depending on focus & typing
  const isDimmed = isInputFocused || isTyping || authState === 'FOCUSED' || authState === 'TYPING' || authState === 'SIGNING_IN';

  return (
    <div
      className={`orion-live-login-bg absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[#07090e] ${className}`}
      aria-hidden="true"
    >
      {/* 1. Base Landscape Wallpaper Image Layer with Subtle Layered Parallax */}
      <div
        className="absolute -inset-4 bg-cover bg-center bg-no-repeat transition-all duration-700 ease-out"
        style={{
          backgroundImage: `url("${WALLPAPER_IMAGE}"), url("${FALLBACK_IMAGE}")`,
          transform: `translate3d(${bgParallaxX}px, ${bgParallaxY}px, 0) scale(1.025)`,
          filter: isDimmed
            ? 'brightness(0.88) saturate(0.92) contrast(1.02)'
            : 'brightness(1.0) saturate(1.0) contrast(1.0)',
        }}
      />

      {/* 2. Live Canvas Layer (Horizon Light, Sky Drift, Mist, Water Reflection Shimmer) */}
      {qualityTier !== 'STATIC' && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-[1] transition-transform duration-700 ease-out"
          style={{
            transform: `translate3d(${canvasParallaxX}px, ${canvasParallaxY}px, 0)`,
          }}
        />
      )}

      {/* 3. Static CSS Ambient Horizon Glow Fallback for LOW / STATIC Quality Tiers */}
      {(qualityTier === 'STATIC' || qualityTier === 'LOW') && (
        <div
          className={`absolute inset-0 pointer-events-none z-[1] transition-opacity duration-700 ${
            isDimmed ? 'opacity-40' : 'opacity-60'
          }`}
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.05) 50%, transparent 80%)',
            animation: qualityTier === 'LOW' ? 'orionHorizonPulse 150s ease-in-out infinite alternate' : 'none',
          }}
        />
      )}

      {/* 4. Soft Vignette & Contrast Overlay (Ensures UI legibility & glass card depth) */}
      <div
        className={`absolute inset-0 z-[2] transition-opacity duration-700 ${
          isDimmed ? 'opacity-80' : 'opacity-65'
        }`}
        style={{
          background: `
            radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.55) 75%, rgba(0, 0, 0, 0.85) 100%),
            linear-gradient(to bottom, rgba(5, 7, 12, 0.30) 0%, transparent 25%, transparent 75%, rgba(4, 5, 10, 0.60) 100%)
          `,
        }}
      />
    </div>
  );
};

export default OrionLiveLoginBackground;
