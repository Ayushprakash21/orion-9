import React, { useEffect, useRef, useState } from 'react';

/**
 * ORION-9 SUBTLE LIVE ORION STAR ENVIRONMENT
 *
 * Premium Minimal Operating System Login Environment:
 * - Deep graphite space gradient base (#02050A, #050A12, #08101A)
 * - Sparse star field (low density, mostly static, 5% subtle twinkling with seeded randomness)
 * - Orion constellation in upper/mid-right space (Betelgeuse, Bellatrix, Belt, Saiph, Rigel, thin low-opacity lines)
 * - Subtle blue atmospheric nebula cloud with slow position/opacity drift
 * - Curved planetary horizon limb with distant city surface light dots
 * - Extremely subtle mouse pointer parallax (1-3px max), disabled on touch / reduced motion
 * - Reduced motion support & Page Visibility API auto-pause/resume
 * - 100% self-contained code & canvas rendering (0 external image/video URLs)
 * - pointer-events: none on all background elements
 */

export type QualityTier = 'HIGH' | 'MEDIUM' | 'LOW' | 'STATIC';
export type LoginAuthState = 'INITIAL' | 'FOCUSED' | 'TYPING' | 'SIGNING_IN' | 'SUCCESS' | 'ERROR';

export interface LiveBackgroundConfig {
  enabled: boolean;
  quality: QualityTier | 'auto';
  parallax: boolean;
  intensity: number; // 0.0 to 1.0
  periods: {
    twinkle: number;     // Star twinkle cycle
    constellation: number; // Constellation breathing cycle (45-90s)
    nebula: number;      // Nebula drift cycle (90-180s)
    horizon: number;     // Horizon glow cycle (120s)
  };
}

export const DEFAULT_LIVE_BACKGROUND_CONFIG: LiveBackgroundConfig = {
  enabled: true,
  quality: 'auto',
  parallax: true,
  intensity: 1.0,
  periods: {
    twinkle: 60,
    constellation: 60,
    nebula: 140,
    horizon: 120,
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

// Seeded PRNG for deterministic star and city light generation
function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface Star {
  x: number; // 0..1
  y: number; // 0..1
  radius: number;
  baseAlpha: number;
  color: string;
  isTwinkling: boolean;
  twinkleDelay: number;
  twinkleDuration: number;
}

interface CityLight {
  x: number; // 0..1
  y: number; // 0..1
  radius: number;
  alpha: number;
  color: string;
}

// Pre-generate deterministic background data
function generateStarField(): Star[] {
  const prng = createSeededRandom(42);
  const stars: Star[] = [];
  const count = 160;

  for (let i = 0; i < count; i++) {
    const x = prng();
    const y = prng() * 0.85; // Mostly space, fewer deep below horizon
    const radius = 0.4 + prng() * 1.3;
    const baseAlpha = 0.2 + prng() * 0.7;
    const colorRoll = prng();
    let color = '#ffffff';
    if (colorRoll > 0.85) color = '#c7d2fe'; // faint blue
    else if (colorRoll > 0.7) color = '#fef3c7'; // faint warm

    const isTwinkling = prng() < 0.06; // 6% twinkling stars
    const twinkleDelay = prng() * 40;
    const twinkleDuration = 45 + prng() * 60;

    stars.push({
      x,
      y,
      radius,
      baseAlpha,
      color,
      isTwinkling,
      twinkleDelay,
      twinkleDuration,
    });
  }

  return stars;
}

function generateCityLights(): CityLight[] {
  const prng = createSeededRandom(99);
  const lights: CityLight[] = [];
  const count = 75;

  for (let i = 0; i < count; i++) {
    // Distributed along lower planetary curvature
    const x = 0.05 + prng() * 0.9;
    const y = 0.75 + prng() * 0.22;
    const radius = 0.5 + prng() * 1.2;
    const alpha = 0.15 + prng() * 0.55;
    const colorRoll = prng();
    let color = '#f59e0b'; // amber
    if (colorRoll > 0.6) color = '#fbbf24';
    else if (colorRoll > 0.3) color = '#d97706';

    lights.push({ x, y, radius, alpha, color });
  }

  return lights;
}

const STATIC_STARS = generateStarField();
const STATIC_CITY_LIGHTS = generateCityLights();

// Orion Constellation Star Nodes (normalized coordinates in upper right space)
const ORION_STARS = [
  { id: 'betelgeuse', name: 'Betelgeuse', x: 0.70, y: 0.20, radius: 2.5, color: '#f97316', alpha: 0.95 },
  { id: 'bellatrix', name: 'Bellatrix', x: 0.84, y: 0.21, radius: 2.1, color: '#93c5fd', alpha: 0.90 },
  { id: 'meissa', name: 'Meissa', x: 0.77, y: 0.15, radius: 1.3, color: '#e0e7ff', alpha: 0.75 },
  { id: 'alnitak', name: 'Alnitak', x: 0.73, y: 0.36, radius: 2.1, color: '#60a5fa', alpha: 0.90 },
  { id: 'alnilam', name: 'Alnilam', x: 0.78, y: 0.35, radius: 2.2, color: '#93c5fd', alpha: 0.92 },
  { id: 'mintaka', name: 'Mintaka', x: 0.83, y: 0.34, radius: 2.0, color: '#bfdbfe', alpha: 0.88 },
  { id: 'saiph', name: 'Saiph', x: 0.72, y: 0.52, radius: 1.9, color: '#93c5fd', alpha: 0.85 },
  { id: 'rigel', name: 'Rigel', x: 0.86, y: 0.51, radius: 2.7, color: '#a5f3fc', alpha: 0.98 },
  // Sword cluster
  { id: 'sword1', name: 'Sword Upper', x: 0.775, y: 0.40, radius: 1.1, color: '#c7d2fe', alpha: 0.65 },
  { id: 'nebula_star', name: 'Orion Nebula Star', x: 0.778, y: 0.43, radius: 1.4, color: '#a78bfa', alpha: 0.80 },
  { id: 'sword3', name: 'Sword Lower', x: 0.781, y: 0.46, radius: 1.0, color: '#c7d2fe', alpha: 0.60 },
];

const ORION_LINES: Array<[string, string]> = [
  ['betelgeuse', 'bellatrix'],
  ['betelgeuse', 'meissa'],
  ['bellatrix', 'meissa'],
  ['betelgeuse', 'alnitak'],
  ['bellatrix', 'mintaka'],
  ['alnitak', 'alnilam'],
  ['alnilam', 'mintaka'],
  ['alnitak', 'saiph'],
  ['mintaka', 'rigel'],
  ['saiph', 'rigel'],
  ['alnilam', 'sword1'],
  ['sword1', 'nebula_star'],
  ['nebula_star', 'sword3'],
];

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
  const isVisibleRef = useRef<boolean>(true);

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

  // Page Visibility Listener (Pause animation when tab hidden, resume when visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Mouse Parallax Event Listener (1-3px subtle multi-depth movement)
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
      if (isVisibleRef.current) {
        rafId = requestAnimationFrame(updateParallax);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafId = requestAnimationFrame(updateParallax);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [qualityTier, mergedConfig.parallax]);

  // Main Canvas Rendering Loop (Star field, Orion Constellation, Nebula, Horizon & Earth lights)
  useEffect(() => {
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

      if (!isVisibleRef.current) {
        // Pause loop while hidden, check back next frame
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const elapsed = (now - startTime) * 0.001; // seconds

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const isStatic = qualityTier === 'STATIC';

      // -------------------------------------------------------------
      // LAYER 0 — BASE SPACE GRADIENT
      // -------------------------------------------------------------
      const spaceGrad = ctx.createRadialGradient(
        width * 0.6, height * 0.35, 0,
        width * 0.5, height * 0.5, width * 0.8
      );
      spaceGrad.addColorStop(0, '#081220');
      spaceGrad.addColorStop(0.45, '#050a12');
      spaceGrad.addColorStop(1, '#02050a');

      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, width, height);

      // -------------------------------------------------------------
      // LAYER 3 — BLUE ATMOSPHERIC NEBULA (Canvas soft drift)
      // -------------------------------------------------------------
      const nebulaPeriod = mergedConfig.periods.nebula;
      const nebulaDriftX = isStatic ? 0 : Math.sin(elapsed * (Math.PI * 2 / nebulaPeriod)) * (width * 0.015);
      const nebulaDriftY = isStatic ? 0 : Math.cos(elapsed * (Math.PI * 2 / (nebulaPeriod * 1.2))) * (height * 0.01);

      const nebX = width * 0.35 + nebulaDriftX;
      const nebY = height * 0.28 + nebulaDriftY;
      const nebGrad = ctx.createRadialGradient(
        nebX, nebY, 0,
        nebX, nebY, width * 0.45
      );
      nebGrad.addColorStop(0, 'rgba(30, 64, 175, 0.12)');
      nebGrad.addColorStop(0.4, 'rgba(14, 116, 144, 0.06)');
      nebGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.03)');
      nebGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = nebGrad;
      ctx.fillRect(0, 0, width, height);

      // Secondary subtle blue cloud near Orion
      const neb2X = width * 0.78 - nebulaDriftX * 0.5;
      const neb2Y = height * 0.38 - nebulaDriftY * 0.5;
      const neb2Grad = ctx.createRadialGradient(
        neb2X, neb2Y, 0,
        neb2X, neb2Y, width * 0.30
      );
      neb2Grad.addColorStop(0, 'rgba(59, 130, 246, 0.08)');
      neb2Grad.addColorStop(0.5, 'rgba(30, 58, 138, 0.04)');
      neb2Grad.addColorStop(1, 'transparent');

      ctx.fillStyle = neb2Grad;
      ctx.fillRect(0, 0, width, height);

      // -------------------------------------------------------------
      // LAYER 1 — STAR FIELD (Static & Sparse Twinkle)
      // -------------------------------------------------------------
      for (let i = 0; i < STATIC_STARS.length; i++) {
        const star = STATIC_STARS[i];
        const sx = star.x * width;
        const sy = star.y * height;

        let alpha = star.baseAlpha;

        if (!isStatic && star.isTwinkling) {
          const t = Math.max(0, elapsed - star.twinkleDelay);
          const phase = Math.sin((t * Math.PI * 2) / star.twinkleDuration);
          alpha = Math.max(0.1, Math.min(1.0, star.baseAlpha + phase * 0.35));
        }

        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(sx, sy, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1.0;

      // -------------------------------------------------------------
      // LAYER 2 — ORION CONSTELLATION
      // -------------------------------------------------------------
      const constPeriod = mergedConfig.periods.constellation;
      // Opacity breathing 0.12 -> 0.18 -> 0.12 over 45-90 seconds
      const constBreathPhase = isStatic ? 0.5 : (Math.sin(elapsed * (Math.PI * 2 / constPeriod)) + 1) / 2;
      const lineAlpha = 0.12 + constBreathPhase * 0.06; // 0.12 to 0.18

      // Map constellation star positions
      const starPosMap = new Map<string, { x: number; y: number }>();
      for (const node of ORION_STARS) {
        const nx = node.x * width;
        const ny = node.y * height;
        starPosMap.set(node.id, { x: nx, y: ny });
      }

      // Draw thin connecting lines
      ctx.strokeStyle = `rgba(191, 219, 254, ${lineAlpha})`;
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      for (const [idA, idB] of ORION_LINES) {
        const pA = starPosMap.get(idA);
        const pB = starPosMap.get(idB);
        if (pA && pB) {
          ctx.moveTo(pA.x, pA.y);
          ctx.lineTo(pB.x, pB.y);
        }
      }
      ctx.stroke();

      // Draw subtle orbital / geometric accent lines through space (matching reference composition)
      ctx.strokeStyle = `rgba(147, 197, 253, ${lineAlpha * 0.65})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      // Curved ray 1: top-left space sweeping down toward horizon
      const pRigel = starPosMap.get('rigel');
      const pBetel = starPosMap.get('betelgeuse');
      const pAlnitak = starPosMap.get('alnitak');
      if (pAlnitak) {
        ctx.moveTo(width * 0.1, height * 0.65);
        ctx.quadraticCurveTo(width * 0.4, height * 0.45, pAlnitak.x, pAlnitak.y);
      }
      if (pRigel && pBetel) {
        ctx.moveTo(pBetel.x, pBetel.y);
        ctx.lineTo(width * 0.95, height * 0.12);
        ctx.moveTo(pRigel.x, pRigel.y);
        ctx.lineTo(width * 0.98, height * 0.72);
      }
      ctx.stroke();

      // Draw Orion Constellation Star Nodes & Glows
      for (const node of ORION_STARS) {
        const pos = starPosMap.get(node.id);
        if (!pos) continue;

        // Soft outer glow for major stars
        if (node.radius >= 2.0) {
          const glowGrad = ctx.createRadialGradient(
            pos.x, pos.y, 0,
            pos.x, pos.y, node.radius * 4
          );
          glowGrad.addColorStop(0, `${node.color}${Math.round(lineAlpha * 255 * 2).toString(16).padStart(2, '0')}`);
          glowGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, node.radius * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Core star node
        ctx.fillStyle = node.color;
        ctx.globalAlpha = node.alpha;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1.0;

      // -------------------------------------------------------------
      // LAYER 4 — PLANETARY HORIZON & DISTANT EARTH CITY LIGHTS
      // -------------------------------------------------------------
      const horizonPeriod = mergedConfig.periods.horizon;
      const horizonBreath = isStatic ? 1.0 : 0.92 + ((Math.sin(elapsed * (Math.PI * 2 / horizonPeriod)) + 1) / 2) * 0.08;

      // Curved Planetary Horizon Limb Arc
      const arcCenterX = width * 0.45;
      const arcCenterY = height * 1.85;
      const arcRadius = height * 1.35;

      // Dark Planet Body Fill
      ctx.fillStyle = '#020408';
      ctx.beginPath();
      ctx.arc(arcCenterX, arcCenterY, arcRadius, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric Horizon Limb Glow
      ctx.strokeStyle = `rgba(147, 197, 253, ${0.45 * horizonBreath})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#60a5fa';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(arcCenterX, arcCenterY, arcRadius, Math.PI * 1.25, Math.PI * 1.75);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow

      // Soft Atmospheric Horizon Radial Gradient Arc
      const horizGradY = height * 0.65;
      const horizGrad = ctx.createRadialGradient(
        width * 0.5, horizGradY, 0,
        width * 0.5, horizGradY, width * 0.6
      );
      horizGrad.addColorStop(0, `rgba(147, 197, 253, ${0.16 * horizonBreath})`);
      horizGrad.addColorStop(0.2, `rgba(59, 130, 246, ${0.10 * horizonBreath})`);
      horizGrad.addColorStop(0.6, `rgba(30, 58, 138, ${0.04 * horizonBreath})`);
      horizGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = horizGrad;
      ctx.fillRect(0, height * 0.5, width, height * 0.5);

      // Earth City Surface Lights (Below Horizon Limb)
      for (const light of STATIC_CITY_LIGHTS) {
        const lx = light.x * width;
        const ly = light.y * height;

        // Check if light is physically inside/below planet curve
        const dx = lx - arcCenterX;
        const dy = ly - arcCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= arcRadius - 2) {
          ctx.fillStyle = light.color;
          ctx.globalAlpha = light.alpha * 0.85;
          ctx.beginPath();
          ctx.arc(lx, ly, light.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1.0;

      if (!isStatic) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [qualityTier, isInputFocused, isTyping, authState, mergedConfig]);

  // Parallax Layer Depth Offsets (Stars +1px, Constellation +1px, Nebula +2px, Horizon +3px)
  const starParallaxX = parallax.x * 1.0;
  const starParallaxY = parallax.y * 1.0;
  const nebulaParallaxX = parallax.x * 2.0;
  const nebulaParallaxY = parallax.y * 2.0;
  const horizonParallaxX = parallax.x * 3.0;
  const horizonParallaxY = parallax.y * 3.0;

  return (
    <div
      data-testid="orion-login-environment"
      data-layer-space="true"
      data-layer-stars="true"
      data-layer-constellation="true"
      data-layer-nebula="true"
      data-layer-horizon="true"
      className={`orion-login-environment absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[#02050a] ${className}`}
      aria-hidden="true"
    >
      {/* Canvas Live Environment Layer (Stars, Constellation, Nebula, Horizon & City Lights) */}
      <canvas
        ref={canvasRef}
        data-testid="orion-star-canvas"
        className="absolute inset-0 w-full h-full pointer-events-none z-[1] transition-transform duration-700 ease-out"
        style={{
          transform: `translate3d(${horizonParallaxX}px, ${horizonParallaxY}px, 0)`,
        }}
      />

      {/* Subtle Vignette & Contrast Overlay (Ensures UI legibility & glass card depth) */}
      <div
        data-testid="orion-vignette-layer"
        className="absolute inset-0 pointer-events-none z-[2] transition-opacity duration-700 opacity-60"
        style={{
          background: `
            radial-gradient(ellipse at center, transparent 0%, rgba(2, 5, 10, 0.45) 75%, rgba(2, 5, 10, 0.85) 100%),
            linear-gradient(to bottom, rgba(2, 5, 10, 0.30) 0%, transparent 25%, transparent 75%, rgba(2, 5, 10, 0.60) 100%)
          `,
        }}
      />
    </div>
  );
};

export default OrionLiveLoginBackground;
