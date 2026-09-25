import React, { useEffect, useRef, useState } from 'react';

/**
 * ORION-9 SUBTLE LIVE ORION STAR ENVIRONMENT (V2 REDESIGN)
 *
 * Premium Minimal Operating System Live Login Environment:
 * - 7 Depth Layers: Space Gradient -> Distant Stars -> Mid Stars -> Near Stars -> Orion Constellation -> Atmospheric Nebula -> Planetary Horizon -> Micro-Particles
 * - Seeded PRNG for multi-tier star fields (~380 stars total)
 * - Distant Orion Star atmospheric light source with soft 60-120s drift
 * - Living Orion Constellation (Betelgeuse, Bellatrix, Belt, Rigel, radial halos, line opacity breathing 0.06-0.12)
 * - Ambient behind-card nebula cloud providing subtle focal illumination for authentication surface
 * - Drifting space micro-particles (~30 particles with independent float velocities and opacity fades)
 * - Multi-depth lerped mouse parallax (0.5px to 3.5px max)
 * - Page Visibility API auto-pause & reduced motion support
 * - 100% self-contained code & Canvas 2D rendering (0 external image/video URLs)
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
    twinkle: number;       // Star twinkle cycle
    constellation: number; // Constellation breathing cycle (45-90s)
    nebula: number;        // Nebula drift cycle (90-180s)
    horizon: number;       // Horizon glow cycle (120s)
    particles: number;     // Micro-particle float cycle
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
    particles: 90,
  },
};

export interface OrionLiveLoginBackgroundProps {
  authState?: LoginAuthState;
  isInputFocused?: boolean;
  isTyping?: boolean;
  config?: Partial<LiveBackgroundConfig>;
  quality?: QualityTier;
  className?: string;
}

// Seeded PRNG for deterministic star & particle generation
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
  depthTier: 1 | 2 | 3; // 1 = Distant, 2 = Mid, 3 = Near
}

interface MicroParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  color: string;
  phase: number;
  cycleDuration: number;
}

interface CityLight {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  color: string;
}

// Pre-generate 3-tier star field (spanning 100% full canvas height)
function generateMultiTierStarField(): Star[] {
  const prng = createSeededRandom(77);
  const stars: Star[] = [];

  // Tier 1: Distant Stars (220 stars, very faint, tiny)
  for (let i = 0; i < 220; i++) {
    stars.push({
      x: prng(),
      y: prng(),
      radius: 0.3 + prng() * 0.45,
      baseAlpha: 0.12 + prng() * 0.28,
      color: prng() > 0.8 ? '#c7d2fe' : '#ffffff',
      isTwinkling: prng() < 0.10,
      twinkleDelay: prng() * 50,
      twinkleDuration: 40 + prng() * 80,
      depthTier: 1,
    });
  }

  // Tier 2: Mid Stars (120 stars, medium brightness)
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: prng(),
      y: prng(),
      radius: 0.75 + prng() * 0.6,
      baseAlpha: 0.35 + prng() * 0.40,
      color: prng() > 0.7 ? '#93c5fd' : prng() > 0.4 ? '#fef3c7' : '#ffffff',
      isTwinkling: prng() < 0.15,
      twinkleDelay: prng() * 40,
      twinkleDuration: 35 + prng() * 65,
      depthTier: 2,
    });
  }

  // Tier 3: Near Stars (40 stars, bright & crisp)
  for (let i = 0; i < 40; i++) {
    stars.push({
      x: prng(),
      y: prng(),
      radius: 1.35 + prng() * 0.9,
      baseAlpha: 0.60 + prng() * 0.35,
      color: prng() > 0.6 ? '#60a5fa' : prng() > 0.3 ? '#fde047' : '#ffffff',
      isTwinkling: prng() < 0.25,
      twinkleDelay: prng() * 30,
      twinkleDuration: 30 + prng() * 50,
      depthTier: 3,
    });
  }

  return stars;
}

// Pre-generate micro-particles (spanning 100% full canvas height)
function generateMicroParticles(): MicroParticle[] {
  const prng = createSeededRandom(123);
  const particles: MicroParticle[] = [];

  for (let i = 0; i < 32; i++) {
    particles.push({
      x: prng(),
      y: prng(),
      vx: (prng() - 0.5) * 0.00004,
      vy: -0.00001 - prng() * 0.00003, // slow upward space drift
      radius: 0.5 + prng() * 1.1,
      baseAlpha: 0.15 + prng() * 0.30,
      color: prng() > 0.7 ? '#93c5fd' : prng() > 0.4 ? '#c7d2fe' : '#ffffff',
      phase: prng() * Math.PI * 2,
      cycleDuration: 50 + prng() * 70,
    });
  }

  return particles;
}

const STATIC_STARS = generateMultiTierStarField();
const STATIC_PARTICLES = generateMicroParticles();

// Orion Constellation Nodes & Major Stars
const ORION_STARS = [
  { id: 'betelgeuse', name: 'Betelgeuse', x: 0.71, y: 0.20, radius: 2.7, color: '#f97316', baseAlpha: 0.95, haloColor: 'rgba(249, 115, 22, 0.45)' },
  { id: 'bellatrix', name: 'Bellatrix', x: 0.85, y: 0.21, radius: 2.2, color: '#93c5fd', baseAlpha: 0.90, haloColor: 'rgba(147, 197, 253, 0.35)' },
  { id: 'meissa', name: 'Meissa', x: 0.78, y: 0.15, radius: 1.4, color: '#e0e7ff', baseAlpha: 0.75, haloColor: 'transparent' },
  { id: 'alnitak', name: 'Alnitak', x: 0.74, y: 0.36, radius: 2.2, color: '#60a5fa', baseAlpha: 0.90, haloColor: 'rgba(96, 165, 250, 0.35)' },
  { id: 'alnilam', name: 'Alnilam', x: 0.79, y: 0.35, radius: 2.3, color: '#93c5fd', baseAlpha: 0.92, haloColor: 'rgba(147, 197, 253, 0.40)' },
  { id: 'mintaka', name: 'Mintaka', x: 0.84, y: 0.34, radius: 2.1, color: '#bfdbfe', baseAlpha: 0.88, haloColor: 'rgba(191, 219, 254, 0.30)' },
  { id: 'saiph', name: 'Saiph', x: 0.73, y: 0.52, radius: 2.0, color: '#93c5fd', baseAlpha: 0.85, haloColor: 'transparent' },
  { id: 'rigel', name: 'Rigel', x: 0.87, y: 0.51, radius: 2.9, color: '#a5f3fc', baseAlpha: 0.98, haloColor: 'rgba(165, 243, 252, 0.50)' },
  { id: 'sword1', name: 'Sword Upper', x: 0.785, y: 0.40, radius: 1.2, color: '#c7d2fe', baseAlpha: 0.65, haloColor: 'transparent' },
  { id: 'nebula_star', name: 'Orion Nebula Star', x: 0.788, y: 0.43, radius: 1.5, color: '#a78bfa', baseAlpha: 0.80, haloColor: 'rgba(167, 139, 250, 0.35)' },
  { id: 'sword3', name: 'Sword Lower', x: 0.791, y: 0.46, radius: 1.1, color: '#c7d2fe', baseAlpha: 0.60, haloColor: 'transparent' },
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

  // Micro-particles live position state
  const liveParticlesRef = useRef<MicroParticle[]>(STATIC_PARTICLES.map(p => ({ ...p })));

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

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setQualityTier('STATIC');
      return;
    }

    const isMobile = window.innerWidth < 768 || window.matchMedia('(hover: none)').matches;
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

  // Page Visibility Listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Mouse Parallax Listener (Multi-depth 0.5px to 3.5px max)
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
          x: prev.x + dx * 0.03, // Smooth lerp
          y: prev.y + dy * 0.03,
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

  // Main Canvas Rendering Loop
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
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const elapsed = (now - startTime) * 0.001; // seconds
      const isStatic = qualityTier === 'STATIC';

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // -------------------------------------------------------------
      // LAYER 0 — BASE DEEP SPACE GRADIENT
      // -------------------------------------------------------------
      const spaceGrad = ctx.createRadialGradient(
        width * 0.6, height * 0.35, 0,
        width * 0.5, height * 0.5, width * 0.95
      );
      spaceGrad.addColorStop(0, '#091322');
      spaceGrad.addColorStop(0.40, '#050a14');
      spaceGrad.addColorStop(0.80, '#02050b');
      spaceGrad.addColorStop(1, '#010307');

      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, width, height);

      // -------------------------------------------------------------
      // DISTANT "ORION STAR" ATMOSPHERIC LIGHT FOCAL POINT
      // -------------------------------------------------------------
      const starLightDriftX = isStatic ? 0 : Math.sin(elapsed * (Math.PI * 2 / 90)) * 14;
      const starLightDriftY = isStatic ? 0 : Math.cos(elapsed * (Math.PI * 2 / 110)) * 10;
      const lightX = width * 0.77 + starLightDriftX;
      const lightY = height * 0.32 + starLightDriftY;

      const starLightGrad = ctx.createRadialGradient(
        lightX, lightY, 0,
        lightX, lightY, width * 0.38
      );
      starLightGrad.addColorStop(0, 'rgba(191, 219, 254, 0.14)');
      starLightGrad.addColorStop(0.35, 'rgba(96, 165, 250, 0.06)');
      starLightGrad.addColorStop(0.75, 'rgba(30, 58, 138, 0.02)');
      starLightGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = starLightGrad;
      ctx.fillRect(0, 0, width, height);

      // -------------------------------------------------------------
      // ATMOSPHERIC NEBULA CLOUDS (3 Overlapping Cosmic Drifts)
      // -------------------------------------------------------------
      const nebulaPeriod = mergedConfig.periods.nebula;
      
      // Cloud 1: Upper Left Cosmic Drift
      const neb1DriftX = isStatic ? 0 : Math.sin(elapsed * (Math.PI * 2 / nebulaPeriod)) * (width * 0.018);
      const neb1DriftY = isStatic ? 0 : Math.cos(elapsed * (Math.PI * 2 / (nebulaPeriod * 1.2))) * (height * 0.012);
      const neb1X = width * 0.32 + neb1DriftX;
      const neb1Y = height * 0.25 + neb1DriftY;

      const neb1Grad = ctx.createRadialGradient(
        neb1X, neb1Y, 0,
        neb1X, neb1Y, width * 0.48
      );
      neb1Grad.addColorStop(0, 'rgba(30, 58, 138, 0.15)');
      neb1Grad.addColorStop(0.4, 'rgba(14, 116, 144, 0.07)');
      neb1Grad.addColorStop(0.8, 'rgba(15, 23, 42, 0.03)');
      neb1Grad.addColorStop(1, 'transparent');

      ctx.fillStyle = neb1Grad;
      ctx.fillRect(0, 0, width, height);

      // Cloud 2: Behind-Card Ambient Illumination (Center/Mid Space)
      const neb2DriftX = isStatic ? 0 : Math.cos(elapsed * (Math.PI * 2 / (nebulaPeriod * 1.3))) * (width * 0.012);
      const neb2X = width * 0.50 + neb2DriftX;
      const neb2Y = height * 0.48;

      const neb2Grad = ctx.createRadialGradient(
        neb2X, neb2Y, 0,
        neb2X, neb2Y, width * 0.35
      );
      neb2Grad.addColorStop(0, 'rgba(59, 130, 246, 0.09)');
      neb2Grad.addColorStop(0.5, 'rgba(30, 64, 175, 0.04)');
      neb2Grad.addColorStop(1, 'transparent');

      ctx.fillStyle = neb2Grad;
      ctx.fillRect(0, 0, width, height);

      // Cloud 3: Upper Right Orion Haze
      const neb3X = width * 0.80 - neb1DriftX * 0.6;
      const neb3Y = height * 0.36 - neb1DriftY * 0.6;
      const neb3Grad = ctx.createRadialGradient(
        neb3X, neb3Y, 0,
        neb3X, neb3Y, width * 0.30
      );
      neb3Grad.addColorStop(0, 'rgba(56, 189, 248, 0.09)');
      neb3Grad.addColorStop(0.6, 'rgba(30, 58, 138, 0.03)');
      neb3Grad.addColorStop(1, 'transparent');

      ctx.fillStyle = neb3Grad;
      ctx.fillRect(0, 0, width, height);

      // -------------------------------------------------------------
      // MULTI-TIER STAR FIELD (Dist, Mid, Near)
      // -------------------------------------------------------------
      for (let i = 0; i < STATIC_STARS.length; i++) {
        const star = STATIC_STARS[i];
        
        // Multi-depth parallax offsets
        let px = 0;
        let py = 0;
        if (star.depthTier === 1) {
          px = parallax.x * 1.0;
          py = parallax.y * 1.0;
        } else if (star.depthTier === 2) {
          px = parallax.x * 1.5;
          py = parallax.y * 1.5;
        } else {
          px = parallax.x * 2.5;
          py = parallax.y * 2.5;
        }

        const sx = star.x * width + px;
        const sy = star.y * height + py;

        let alpha = star.baseAlpha;

        if (!isStatic && star.isTwinkling) {
          const t = Math.max(0, elapsed - star.twinkleDelay);
          const phase = Math.sin((t * Math.PI * 2) / star.twinkleDuration);
          alpha = Math.max(0.08, Math.min(1.0, star.baseAlpha + phase * 0.35));
        }

        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(sx, sy, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1.0;

      // -------------------------------------------------------------
      // LIVING ORION CONSTELLATION & STAR HALOS
      // -------------------------------------------------------------
      const constPeriod = mergedConfig.periods.constellation;
      const constBreathPhase = isStatic ? 0.5 : (Math.sin(elapsed * (Math.PI * 2 / constPeriod)) + 1) / 2;
      // Line opacity breathing 0.06 -> 0.12 -> 0.06 over 60s
      const lineAlpha = 0.06 + constBreathPhase * 0.06;

      const starPosMap = new Map<string, { x: number; y: number }>();
      const constParallaxX = parallax.x * 2.0;
      const constParallaxY = parallax.y * 2.0;

      for (const node of ORION_STARS) {
        const nx = node.x * width + constParallaxX;
        const ny = node.y * height + constParallaxY;
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

      // Draw subtle orbital/geometrical accent lines
      ctx.strokeStyle = `rgba(147, 197, 253, ${lineAlpha * 0.60})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      const pRigel = starPosMap.get('rigel');
      const pBetel = starPosMap.get('betelgeuse');
      const pAlnitak = starPosMap.get('alnitak');
      if (pAlnitak) {
        ctx.moveTo(width * 0.08, height * 0.65);
        ctx.quadraticCurveTo(width * 0.38, height * 0.44, pAlnitak.x, pAlnitak.y);
      }
      if (pRigel && pBetel) {
        ctx.moveTo(pBetel.x, pBetel.y);
        ctx.lineTo(width * 0.96, height * 0.10);
        ctx.moveTo(pRigel.x, pRigel.y);
        ctx.lineTo(width * 0.98, height * 0.74);
      }
      ctx.stroke();

      // Draw Major Star Radial Halos & Core Nodes
      for (const node of ORION_STARS) {
        const pos = starPosMap.get(node.id);
        if (!pos) continue;

        // Individual star brightness variation
        const starPhase = isStatic ? 0.5 : (Math.sin(elapsed * 0.15 + (node.x * 10)) + 1) / 2;
        const starAlpha = Math.max(0.35, Math.min(1.0, node.baseAlpha * (0.85 + starPhase * 0.3)));

        // Soft outer radial halo glow for major stars
        if (node.haloColor !== 'transparent' && node.radius >= 2.0) {
          const haloGrad = ctx.createRadialGradient(
            pos.x, pos.y, 0,
            pos.x, pos.y, node.radius * 5
          );
          haloGrad.addColorStop(0, node.haloColor);
          haloGrad.addColorStop(1, 'transparent');

          ctx.fillStyle = haloGrad;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, node.radius * 5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Core star node
        ctx.fillStyle = node.color;
        ctx.globalAlpha = starAlpha;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1.0;

      // -------------------------------------------------------------
      // FOREGROUND MICRO-PARTICLES (Drifting space starlight particles)
      // -------------------------------------------------------------
      if (!isStatic && (qualityTier === 'HIGH' || qualityTier === 'MEDIUM')) {
        const particles = liveParticlesRef.current;
        const particleParallaxX = parallax.x * 3.5;
        const particleParallaxY = parallax.y * 3.5;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          
          // Update particle position
          p.x += p.vx;
          p.y += p.vy;

          // Wrap around screen bounds
          if (p.x < 0) p.x += 1;
          if (p.x > 1) p.x -= 1;
          if (p.y < 0) p.y += 1;
          if (p.y > 1) p.y -= 1;

          const px = p.x * width + particleParallaxX;
          const py = p.y * height + particleParallaxY;

          // Fading opacity cycle
          const pPhase = Math.sin((elapsed * Math.PI * 2) / p.cycleDuration + p.phase);
          const pAlpha = Math.max(0.05, Math.min(0.45, p.baseAlpha + pPhase * 0.15));

          ctx.fillStyle = p.color;
          ctx.globalAlpha = pAlpha;
          ctx.beginPath();
          ctx.arc(px, py, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1.0;

      // -------------------------------------------------------------
      // LOWER AMBIENT AURORA DEEP SPACE ATMOSPHERE (Continuous)
      // -------------------------------------------------------------
      const horizonPeriod = mergedConfig.periods.horizon;
      const horizonBreath = isStatic ? 1.0 : 0.92 + ((Math.sin(elapsed * (Math.PI * 2 / horizonPeriod)) + 1) / 2) * 0.12;

      const lowerGradY = height * 0.75 + parallax.y * 1.2;
      const lowerGrad = ctx.createRadialGradient(
        width * 0.5 + parallax.x * 1.2, lowerGradY, 0,
        width * 0.5 + parallax.x * 1.2, lowerGradY, width * 0.70
      );
      lowerGrad.addColorStop(0, `rgba(30, 58, 138, ${0.12 * horizonBreath})`);
      lowerGrad.addColorStop(0.5, `rgba(15, 23, 42, ${0.06 * horizonBreath})`);
      lowerGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = lowerGrad;
      ctx.fillRect(0, height * 0.50, width, height * 0.50);

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

  return (
    <div
      data-testid="orion-login-environment"
      data-layer-space="true"
      data-layer-stars="true"
      data-layer-constellation="true"
      data-layer-nebula="true"
      data-layer-horizon="true"
      className={`orion-login-environment absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[#010307] ${className}`}
      aria-hidden="true"
    >
      {/* Canvas Live Orion Environment Layer */}
      <canvas
        ref={canvasRef}
        data-testid="orion-star-canvas"
        className="absolute inset-0 w-full h-full pointer-events-none z-[1] transition-transform duration-700 ease-out"
      />

      {/* Vignette & Contrast Overlay */}
      <div
        data-testid="orion-vignette-layer"
        className="absolute inset-0 pointer-events-none z-[2] transition-opacity duration-700 opacity-60"
        style={{
          background: `
            radial-gradient(ellipse at center, transparent 0%, rgba(1, 3, 7, 0.45) 75%, rgba(1, 3, 7, 0.85) 100%),
            linear-gradient(to bottom, rgba(1, 3, 7, 0.25) 0%, transparent 25%, transparent 75%, rgba(1, 3, 7, 0.55) 100%)
          `,
        }}
      />
    </div>
  );
};

export default OrionLiveLoginBackground;
