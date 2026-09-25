import React, { useEffect, useRef, useState } from 'react';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { HealthService } from '../../operations/HealthService';
import { DemoPersistentSchedulerService } from '../../services/demo/DemoPersistentSchedulerService';

/**
 * ORION-9 LIVE EARTH & ASTRONOMICAL ENVIRONMENT (V3 REDESIGN)
 *
 * Real 3D Rotating Earth Sphere + Deep Space Orion Constellation:
 * - 3D Spherical Earth positioned toward LOWER-LEFT / LEFT-CENTER of viewport.
 * - Realistic Night-Side illumination with clustered global city lights (Americas, Europe, Asia, India, Middle East, Oceania).
 * - Continuous slow 3D planetary rotation (configurable ~120s per rotation).
 * - Multi-layer Atmospheric Glow Rim (Deep Blue -> Cyan Edge -> Transparent).
 * - Semi-transparent Cloud Layer with differential rotation speed.
 * - Recognizable Orion Constellation in upper-right deep-space quadrant.
 * - 3-Tier Multi-Depth Star Field (~380 stars with twinkle cycles).
 * - Safe Central Authentication Zone (login card area remains clean & dark).
 * - Environment Isolation: Real runtime signals in LIVE mode; persistent scheduler in DEMO mode.
 * - Performance Optimized: Quality Tiers (HIGH, MEDIUM, LOW, STATIC), reduced motion, visibility auto-pause.
 */

export type QualityTier = 'HIGH' | 'MEDIUM' | 'LOW' | 'STATIC';
export type LoginAuthState = 'INITIAL' | 'FOCUSED' | 'TYPING' | 'SIGNING_IN' | 'SUCCESS' | 'ERROR';

export interface LiveBackgroundConfig {
  enabled: boolean;
  quality: QualityTier | 'auto';
  parallax: boolean;
  intensity: number;
  rotationSpeedSeconds: number; // Default 120s per full rotation
  periods: {
    twinkle: number;
    constellation: number;
    nebula: number;
    atmosphere: number;
    particles: number;
  };
}

export const DEFAULT_LIVE_BACKGROUND_CONFIG: LiveBackgroundConfig = {
  enabled: true,
  quality: 'auto',
  parallax: true,
  intensity: 1.0,
  rotationSpeedSeconds: 120,
  periods: {
    twinkle: 60,
    constellation: 60,
    nebula: 140,
    atmosphere: 120,
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
  depthTier: 1 | 2 | 3;
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

// City Light Metropolitan Hub Coordinates (lat, long in degrees)
interface CityCluster {
  name: string;
  lat: number;
  lng: number;
  intensity: number;
  color: string;
  radius: number;
  subPoints?: Array<[number, number]>; // relative lat/lng offsets for dense urban sprawl
}

const GLOBAL_CITY_LIGHTS: CityCluster[] = [
  // NORTH AMERICA
  { name: 'NYC / BosWash', lat: 40.7, lng: -74.0, intensity: 0.95, color: '#fef08a', radius: 4.5, subPoints: [[0.5, 1.2], [-0.8, -0.9], [1.2, 0.8], [-1.2, -1.5], [0.8, -2.1]] },
  { name: 'Chicago / Great Lakes', lat: 41.8, lng: -87.6, intensity: 0.88, color: '#fbbf24', radius: 3.8, subPoints: [[0.4, 0.8], [-0.5, -1.2], [1.0, 1.5]] },
  { name: 'Los Angeles / SoCal', lat: 34.0, lng: -118.2, intensity: 0.90, color: '#fef08a', radius: 4.0, subPoints: [[0.6, -0.5], [-0.4, 0.8], [-1.0, -0.6]] },
  { name: 'San Francisco / Bay Area', lat: 37.7, lng: -122.4, intensity: 0.85, color: '#60a5fa', radius: 3.2, subPoints: [[-0.3, 0.4], [0.5, -0.3]] },
  { name: 'Seattle / Pacific NW', lat: 47.6, lng: -122.3, intensity: 0.75, color: '#bfdbfe', radius: 2.8 },
  { name: 'Texas Triangle', lat: 29.7, lng: -95.3, intensity: 0.82, color: '#fbbf24', radius: 3.5, subPoints: [[3.1, -1.5], [3.0, 1.8], [0.3, 1.5]] },
  { name: 'Florida Metro', lat: 25.7, lng: -80.2, intensity: 0.80, color: '#fbbf24', radius: 3.2, subPoints: [[2.8, -1.2], [1.5, -0.5]] },

  // SOUTH AMERICA
  { name: 'Sao Paulo / Rio', lat: -23.5, lng: -46.6, intensity: 0.88, color: '#fbbf24', radius: 4.0, subPoints: [[0.6, 3.4], [-1.2, -0.8]] },
  { name: 'Buenos Aires', lat: -34.6, lng: -58.3, intensity: 0.80, color: '#fef08a', radius: 3.2 },
  { name: 'Bogota / Andes', lat: 4.7, lng: -74.0, intensity: 0.65, color: '#fbbf24', radius: 2.5 },

  // EUROPE
  { name: 'London / UK Megalopolis', lat: 51.5, lng: -0.1, intensity: 0.95, color: '#fef08a', radius: 4.2, subPoints: [[1.0, -1.5], [-0.8, -1.8], [2.0, -1.2]] },
  { name: 'Paris / N. France', lat: 48.8, lng: 2.3, intensity: 0.92, color: '#fef08a', radius: 3.8, subPoints: [[1.2, 1.5], [-1.0, 2.0]] },
  { name: 'Benelux / Rhine-Ruhr', lat: 51.2, lng: 6.7, intensity: 0.96, color: '#60a5fa', radius: 4.5, subPoints: [[1.1, -2.2], [-0.8, 0.5], [1.5, 1.8]] },
  { name: 'Milan / Po Valley', lat: 45.4, lng: 9.1, intensity: 0.85, color: '#fbbf24', radius: 3.5, subPoints: [[0.4, 3.2], [-0.3, -2.5]] },
  { name: 'Madrid / Iberia', lat: 40.4, lng: -3.7, intensity: 0.80, color: '#fbbf24', radius: 3.0, subPoints: [[1.0, -5.5]] },
  { name: 'Moscow Metro', lat: 55.7, lng: 37.6, intensity: 0.88, color: '#fef08a', radius: 3.8 },

  // INDIA & SOUTH ASIA
  { name: 'Delhi / NCR', lat: 28.6, lng: 77.2, intensity: 0.96, color: '#fef08a', radius: 4.5, subPoints: [[0.8, 1.2], [-0.6, -1.0], [1.5, -0.8], [-1.2, 1.5]] },
  { name: 'Mumbai / West Coast India', lat: 19.0, lng: 72.8, intensity: 0.95, color: '#fbbf24', radius: 4.2, subPoints: [[-0.5, 0.9], [2.8, -0.8], [-3.0, 0.4]] },
  { name: 'Bengaluru / Tech Corridor', lat: 12.9, lng: 77.5, intensity: 0.90, color: '#60a5fa', radius: 3.8, subPoints: [[0.1, 2.7], [3.1, -2.8]] },
  { name: 'Kolkata / East India', lat: 22.5, lng: 88.3, intensity: 0.85, color: '#fbbf24', radius: 3.5, subPoints: [[1.2, 2.1]] },
  { name: 'Indus Valley / Punjab', lat: 31.5, lng: 74.3, intensity: 0.82, color: '#fbbf24', radius: 3.6, subPoints: [[-6.7, -7.0]] },

  // EAST ASIA & JAPAN
  { name: 'Tokyo / Kanto Plain', lat: 35.6, lng: 139.6, intensity: 0.98, color: '#a5f3fc', radius: 5.0, subPoints: [[-0.9, -4.2], [1.2, 1.5], [-1.5, -2.1]] },
  { name: 'Shanghai / Yangtze Delta', lat: 31.2, lng: 121.4, intensity: 0.96, color: '#fef08a', radius: 4.8, subPoints: [[0.8, -1.2], [-1.2, -0.8], [1.5, 0.5]] },
  { name: 'Pearl River Delta (HK/GZ)', lat: 23.1, lng: 113.2, intensity: 0.98, color: '#60a5fa', radius: 4.6, subPoints: [[-0.8, 0.9], [0.5, -1.1]] },
  { name: 'Beijing / Tianjin', lat: 39.9, lng: 116.4, intensity: 0.92, color: '#fbbf24', radius: 4.2, subPoints: [-0.8, 0.8] },
  { name: 'Seoul / Gyeonggi', lat: 37.5, lng: 126.9, intensity: 0.94, color: '#a5f3fc', radius: 4.0 },
  { name: 'Taipei', lat: 25.0, lng: 121.5, intensity: 0.85, color: '#fef08a', radius: 3.0 },

  // SOUTHEAST ASIA
  { name: 'Singapore / Johor', lat: 1.3, lng: 103.8, intensity: 0.96, color: '#60a5fa', radius: 3.5 },
  { name: 'Bangkok Metro', lat: 13.7, lng: 100.5, intensity: 0.88, color: '#fbbf24', radius: 3.6 },
  { name: 'Jakarta / Java Coast', lat: -6.2, lng: 106.8, intensity: 0.90, color: '#fef08a', radius: 3.8, subPoints: [[0.8, 6.2]] },
  { name: 'Manila', lat: 14.5, lng: 120.9, intensity: 0.86, color: '#fbbf24', radius: 3.2 },

  // MIDDLE EAST & AFRICA
  { name: 'Dubai / UAE Coast', lat: 25.2, lng: 55.2, intensity: 0.96, color: '#a5f3fc', radius: 3.8, subPoints: [[-0.8, -0.9]] },
  { name: 'Nile Delta / Cairo', lat: 30.0, lng: 31.2, intensity: 0.92, color: '#fef08a', radius: 4.0, subPoints: [[1.2, -0.3], [2.1, 0.8]] },
  { name: 'Riyadh / Gulf', lat: 24.7, lng: 46.6, intensity: 0.82, color: '#fbbf24', radius: 3.2 },
  { name: 'Johannesburg / Reef', lat: -26.2, lng: 28.0, intensity: 0.78, color: '#fbbf24', radius: 3.0 },
];

// Simplified Spherical Polygon Outlines for Major Continents (lat, lng pairs in degrees)
const CONTINENT_OUTLINES: Array<{ name: string; points: Array<[number, number]> }> = [
  {
    name: 'North America',
    points: [[60, -130], [55, -100], [48, -65], [25, -80], [15, -90], [20, -105], [32, -117], [48, -124]]
  },
  {
    name: 'South America',
    points: [[10, -75], [5, -50], [-10, -35], [-30, -50], [-54, -68], [-35, -73], [0, -80]]
  },
  {
    name: 'Eurasia',
    points: [[65, 10], [70, 60], [60, 140], [35, 140], [22, 115], [10, 100], [25, 65], [40, 30], [45, 10], [55, 5]]
  },
  {
    name: 'Africa',
    points: [[35, -5], [30, 32], [10, 50], [-34, 20], [-10, 14], [5, 0], [15, -17]]
  },
  {
    name: 'Australia',
    points: [[-12, 130], [-15, 145], [-38, 148], [-34, 115], [-22, 113]]
  },
  {
    name: 'India',
    points: [[32, 75], [22, 88], [8, 77], [18, 73]]
  }
];

// Pre-generate 3-tier star field (spanning full canvas height)
function generateMultiTierStarField(): Star[] {
  const prng = createSeededRandom(77);
  const stars: Star[] = [];

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

// Pre-generate space micro-particles
function generateMicroParticles(): MicroParticle[] {
  const prng = createSeededRandom(123);
  const particles: MicroParticle[] = [];

  for (let i = 0; i < 30; i++) {
    particles.push({
      x: prng(),
      y: prng(),
      vx: (prng() - 0.5) * 0.00003,
      vy: -0.00001 - prng() * 0.00002,
      radius: 0.5 + prng() * 1.0,
      baseAlpha: 0.15 + prng() * 0.25,
      color: prng() > 0.7 ? '#93c5fd' : prng() > 0.4 ? '#c7d2fe' : '#ffffff',
      phase: prng() * Math.PI * 2,
      cycleDuration: 50 + prng() * 70,
    });
  }

  return particles;
}

const STATIC_STARS = generateMultiTierStarField();
const STATIC_PARTICLES = generateMicroParticles();

// Recognizable Orion Constellation Nodes & Major Stars (Upper-Right Sector)
const ORION_STARS = [
  { id: 'betelgeuse', name: 'Betelgeuse', x: 0.71, y: 0.18, radius: 2.7, color: '#f97316', baseAlpha: 0.95, haloColor: 'rgba(249, 115, 22, 0.45)' },
  { id: 'bellatrix', name: 'Bellatrix', x: 0.84, y: 0.19, radius: 2.2, color: '#93c5fd', baseAlpha: 0.90, haloColor: 'rgba(147, 197, 253, 0.35)' },
  { id: 'meissa', name: 'Meissa', x: 0.77, y: 0.13, radius: 1.4, color: '#e0e7ff', baseAlpha: 0.75, haloColor: 'transparent' },
  { id: 'alnitak', name: 'Alnitak', x: 0.74, y: 0.33, radius: 2.2, color: '#60a5fa', baseAlpha: 0.90, haloColor: 'rgba(96, 165, 250, 0.35)' },
  { id: 'alnilam', name: 'Alnilam', x: 0.78, y: 0.32, radius: 2.3, color: '#93c5fd', baseAlpha: 0.92, haloColor: 'rgba(147, 197, 253, 0.40)' },
  { id: 'mintaka', name: 'Mintaka', x: 0.83, y: 0.31, radius: 2.1, color: '#bfdbfe', baseAlpha: 0.88, haloColor: 'rgba(191, 219, 254, 0.30)' },
  { id: 'saiph', name: 'Saiph', x: 0.73, y: 0.48, radius: 2.0, color: '#93c5fd', baseAlpha: 0.85, haloColor: 'transparent' },
  { id: 'rigel', name: 'Rigel', x: 0.86, y: 0.47, radius: 2.9, color: '#a5f3fc', baseAlpha: 0.98, haloColor: 'rgba(165, 243, 252, 0.50)' },
  { id: 'sword1', name: 'Sword Upper', x: 0.775, y: 0.37, radius: 1.2, color: '#c7d2fe', baseAlpha: 0.65, haloColor: 'transparent' },
  { id: 'nebula_star', name: 'Orion Nebula Star', x: 0.778, y: 0.40, radius: 1.5, color: '#a78bfa', baseAlpha: 0.80, haloColor: 'rgba(167, 139, 250, 0.35)' },
  { id: 'sword3', name: 'Sword Lower', x: 0.781, y: 0.43, radius: 1.1, color: '#c7d2fe', baseAlpha: 0.60, haloColor: 'transparent' },
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
  const [dbEnv, setDbEnv] = useState<'DEMO' | 'LIVE'>(() => dbManager.getEnvironment());
  const [runtimeSignalPulse, setRuntimeSignalPulse] = useState(0);

  const targetParallax = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);
  const isVisibleRef = useRef<boolean>(true);
  const liveParticlesRef = useRef<MicroParticle[]>(STATIC_PARTICLES.map(p => ({ ...p })));

  // Quality Tier & Reduced Motion Auto-Detection
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
    } else {
      setQualityTier('MEDIUM');
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

  // Database Environment & Real Runtime Signal Listener (NO Fake Business Data)
  useEffect(() => {
    let mounted = true;

    const handleEnvChange = () => {
      if (mounted) setDbEnv(dbManager.getEnvironment());
    };
    window.addEventListener('orion-database-environment-changed', handleEnvChange);

    const triggerPulse = () => {
      if (mounted) {
        setRuntimeSignalPulse(1.0);
        setTimeout(() => {
          if (mounted) setRuntimeSignalPulse(0);
        }, 1200);
      }
    };

    let interval: any;
    if (dbEnv === 'DEMO') {
      interval = setInterval(() => {
        const state = DemoPersistentSchedulerService.getInstance().getSchedulerState();
        if (state.status === 'RUNNING') triggerPulse();
      }, 16000);
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
      window.removeEventListener('orion-database-environment-changed', handleEnvChange);
      if (interval) clearInterval(interval);
    };
  }, [dbEnv]);

  // Mouse Parallax Listener
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
          x: prev.x + dx * 0.03,
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

  // Main Canvas 2D/3D Sphere Engine Loop
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
      const isMobile = width < 768;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // -------------------------------------------------------------
      // 1. BASE DEEP SPACE GRADIENT
      // -------------------------------------------------------------
      const spaceGrad = ctx.createRadialGradient(
        width * 0.65, height * 0.35, 0,
        width * 0.50, height * 0.50, width * 0.95
      );
      spaceGrad.addColorStop(0, '#091322');
      spaceGrad.addColorStop(0.40, '#050a14');
      spaceGrad.addColorStop(0.80, '#02050b');
      spaceGrad.addColorStop(1, '#010307');

      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, width, height);

      // -------------------------------------------------------------
      // 2. ATMOSPHERIC NEBULA CLOUDS (Deep Space Backdrop)
      // -------------------------------------------------------------
      const nebulaPeriod = mergedConfig.periods.nebula;
      const neb1DriftX = isStatic ? 0 : Math.sin(elapsed * (Math.PI * 2 / nebulaPeriod)) * (width * 0.015);
      const neb1DriftY = isStatic ? 0 : Math.cos(elapsed * (Math.PI * 2 / (nebulaPeriod * 1.2))) * (height * 0.010);

      const nebGrad = ctx.createRadialGradient(
        width * 0.75 + neb1DriftX, height * 0.25 + neb1DriftY, 0,
        width * 0.75 + neb1DriftX, height * 0.25 + neb1DriftY, width * 0.42
      );
      nebGrad.addColorStop(0, 'rgba(30, 58, 138, 0.14)');
      nebGrad.addColorStop(0.5, 'rgba(14, 116, 144, 0.05)');
      nebGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = nebGrad;
      ctx.fillRect(0, 0, width, height);

      // -------------------------------------------------------------
      // 3. MULTI-TIER STAR FIELD (~380 Stars)
      // -------------------------------------------------------------
      for (let i = 0; i < STATIC_STARS.length; i++) {
        const star = STATIC_STARS[i];
        let px = parallax.x * (star.depthTier === 1 ? 0.8 : star.depthTier === 2 ? 1.4 : 2.2);
        let py = parallax.y * (star.depthTier === 1 ? 0.8 : star.depthTier === 2 ? 1.4 : 2.2);

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
      // 4. RECOGNIZABLE ORION CONSTELLATION
      // -------------------------------------------------------------
      const constPeriod = mergedConfig.periods.constellation;
      const constBreath = isStatic ? 0.5 : (Math.sin(elapsed * (Math.PI * 2 / constPeriod)) + 1) / 2;
      const lineAlpha = 0.07 + constBreath * 0.06;
      const constParallaxX = parallax.x * 2.0;
      const constParallaxY = parallax.y * 2.0;

      const starPosMap = new Map<string, { x: number; y: number }>();
      for (const node of ORION_STARS) {
        const nx = node.x * width + constParallaxX;
        const ny = node.y * height + constParallaxY;
        starPosMap.set(node.id, { x: nx, y: ny });
      }

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

      for (const node of ORION_STARS) {
        const pos = starPosMap.get(node.id);
        if (!pos) continue;

        if (node.haloColor !== 'transparent' && node.radius >= 2.0) {
          const haloGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, node.radius * 4.5);
          haloGrad.addColorStop(0, node.haloColor);
          haloGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = haloGrad;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, node.radius * 4.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = node.color;
        ctx.globalAlpha = node.baseAlpha;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // -------------------------------------------------------------
      // 5. REAL 3D ROTATING PLANETARY EARTH SPHERE
      // -------------------------------------------------------------
      // Earth Position: Lower-Left / Left-Center of screen
      const earthCenterX = isMobile ? width * 0.12 + parallax.x * 4 : width * 0.18 + parallax.x * 6;
      const earthCenterY = isMobile ? height * 0.88 + parallax.y * 4 : height * 0.82 + parallax.y * 6;
      const earthRadius = isMobile 
        ? Math.min(width, height) * 0.38 
        : Math.min(width, height) * 0.44; // 35–50% of viewport height

      // Continuous 3D Planetary Rotation Angle (Default ~120s per rotation)
      const rotationPeriod = mergedConfig.rotationSpeedSeconds || 120;
      const rotAngle = isStatic ? 0.35 : (elapsed / rotationPeriod) * Math.PI * 2;

      // Earth Dark Ocean Base Sphere
      const oceanGrad = ctx.createRadialGradient(
        earthCenterX - earthRadius * 0.3, earthCenterY - earthRadius * 0.3, 0,
        earthCenterX, earthCenterY, earthRadius
      );
      oceanGrad.addColorStop(0, '#06132a');
      oceanGrad.addColorStop(0.65, '#030a18');
      oceanGrad.addColorStop(1, '#01040a');

      ctx.save();
      ctx.beginPath();
      ctx.arc(earthCenterX, earthCenterY, earthRadius, 0, Math.PI * 2);
      ctx.fillStyle = oceanGrad;
      ctx.fill();

      // Clip subsequent continent & city renderings to the Earth sphere disc
      ctx.clip();

      // Render 3D Landmass Silhouettes
      const landColor = 'rgba(7, 24, 46, 0.85)';
      ctx.fillStyle = landColor;

      for (const continent of CONTINENT_OUTLINES) {
        ctx.beginPath();
        let firstPoint = true;

        for (const [latDeg, lngDeg] of continent.points) {
          const phi = (latDeg * Math.PI) / 180;
          const lambda = (lngDeg * Math.PI) / 180;

          // 3D Spherical Coordinate Transformation
          const x3d = Math.cos(phi) * Math.sin(lambda + rotAngle);
          const y3d = Math.sin(phi);
          const z3d = Math.cos(phi) * Math.cos(lambda + rotAngle);

          // Render only front visible hemisphere (z3d > -0.1 for soft limb curvature)
          if (z3d > -0.1) {
            const px = earthCenterX + x3d * earthRadius;
            const py = earthCenterY - y3d * earthRadius;

            if (firstPoint) {
              ctx.moveTo(px, py);
              firstPoint = false;
            } else {
              ctx.lineTo(px, py);
            }
          }
        }

        if (!firstPoint) {
          ctx.closePath();
          ctx.fill();
        }
      }

      // Render Clustered Global City Lights (Night-Side Illumination)
      const renderCityPoint = (latDeg: number, lngDeg: number, intensity: number, color: string, rad: number) => {
        const phi = (latDeg * Math.PI) / 180;
        const lambda = (lngDeg * Math.PI) / 180;

        const x3d = Math.cos(phi) * Math.sin(lambda + rotAngle);
        const y3d = Math.sin(phi);
        const z3d = Math.cos(phi) * Math.cos(lambda + rotAngle);

        // Visible on night-side front hemisphere
        if (z3d > 0.05) {
          const px = earthCenterX + x3d * earthRadius;
          const py = earthCenterY - y3d * earthRadius;

          // Smooth limb darkening & depth opacity
          const limbFade = Math.min(1.0, z3d * 2.8);
          const finalAlpha = intensity * limbFade * (0.75 + Math.sin(elapsed * 1.5 + latDeg) * 0.15);

          // City glow radial halo
          if (rad > 3.0 && (qualityTier === 'HIGH' || qualityTier === 'MEDIUM')) {
            const cityGlow = ctx.createRadialGradient(px, py, 0, px, py, rad * 2.5);
            cityGlow.addColorStop(0, color);
            cityGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = cityGlow;
            ctx.globalAlpha = finalAlpha * 0.4;
            ctx.beginPath();
            ctx.arc(px, py, rad * 2.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Core city light cluster node
          ctx.fillStyle = color;
          ctx.globalAlpha = finalAlpha;
          ctx.beginPath();
          ctx.arc(px, py, rad * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      for (const city of GLOBAL_CITY_LIGHTS) {
        renderCityPoint(city.lat, city.lng, city.intensity, city.color, city.radius);

        if (city.subPoints && (qualityTier === 'HIGH' || qualityTier === 'MEDIUM')) {
          for (const [dLat, dLng] of city.subPoints) {
            renderCityPoint(
              city.lat + dLat, 
              city.lng + dLng, 
              city.intensity * 0.7, 
              city.color, 
              city.radius * 0.65
            );
          }
        }
      }

      // Semi-Transparent Cloud Layer (Slow Differential Speed)
      if (qualityTier === 'HIGH' || qualityTier === 'MEDIUM') {
        const cloudRotAngle = rotAngle * 1.08; // 8% differential cloud drift
        ctx.fillStyle = 'rgba(224, 242, 254, 0.07)';
        ctx.globalAlpha = 0.45;

        for (let cLat = -40; cLat <= 50; cLat += 25) {
          const phi = (cLat * Math.PI) / 180;
          for (let cLng = -160; cLng <= 180; cLng += 45) {
            const lambda = (cLng * Math.PI) / 180;
            const x3d = Math.cos(phi) * Math.sin(lambda + cloudRotAngle);
            const y3d = Math.sin(phi);
            const z3d = Math.cos(phi) * Math.cos(lambda + cloudRotAngle);

            if (z3d > 0.1) {
              const px = earthCenterX + x3d * earthRadius;
              const py = earthCenterY - y3d * earthRadius;
              const cloudSize = (18 + Math.abs(cLat * 0.2)) * (earthRadius / 350);

              ctx.beginPath();
              ctx.ellipse(px, py, cloudSize * 1.8, cloudSize * 0.8, 0.2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // Directional Day/Night Terminator Shading (Mostly Night Visible)
      const shadowGrad = ctx.createLinearGradient(
        earthCenterX - earthRadius * 0.8, earthCenterY - earthRadius * 0.8,
        earthCenterX + earthRadius * 0.6, earthCenterY + earthRadius * 0.6
      );
      shadowGrad.addColorStop(0, 'rgba(1, 3, 7, 0.05)');
      shadowGrad.addColorStop(0.5, 'rgba(1, 3, 7, 0.35)');
      shadowGrad.addColorStop(1, 'rgba(1, 3, 7, 0.78)');

      ctx.fillStyle = shadowGrad;
      ctx.globalAlpha = 1.0;
      ctx.fillRect(earthCenterX - earthRadius, earthCenterY - earthRadius, earthRadius * 2, earthRadius * 2);

      ctx.restore(); // Restore clip boundary

      // -------------------------------------------------------------
      // 6. SUBTLE ATMOSPHERIC RIM (Deep Blue -> Cyan Edge -> Transparent)
      // -------------------------------------------------------------
      const pulseGlow = runtimeSignalPulse * 0.15;
      const atmInnerRadius = earthRadius * 0.97;
      const atmOuterRadius = earthRadius * 1.08;

      const atmRimGrad = ctx.createRadialGradient(
        earthCenterX, earthCenterY, atmInnerRadius,
        earthCenterX, earthCenterY, atmOuterRadius
      );
      atmRimGrad.addColorStop(0, 'rgba(14, 165, 233, 0.0)');
      atmRimGrad.addColorStop(0.3, `rgba(56, 189, 248, ${0.48 + pulseGlow})`); // Cyan edge
      atmRimGrad.addColorStop(0.75, `rgba(30, 58, 138, ${0.28 + pulseGlow * 0.5})`); // Deep blue
      atmRimGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = atmRimGrad;
      ctx.beginPath();
      ctx.arc(earthCenterX, earthCenterY, atmOuterRadius, 0, Math.PI * 2);
      ctx.fill();

      // -------------------------------------------------------------
      // 7. FOREGROUND DRIFTING SPACE PARTICLES
      // -------------------------------------------------------------
      if (!isStatic && (qualityTier === 'HIGH' || qualityTier === 'MEDIUM')) {
        const particles = liveParticlesRef.current;
        const particleParallaxX = parallax.x * 3.5;
        const particleParallaxY = parallax.y * 3.5;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x += 1;
          if (p.x > 1) p.x -= 1;
          if (p.y < 0) p.y += 1;
          if (p.y > 1) p.y -= 1;

          const px = p.x * width + particleParallaxX;
          const py = p.y * height + particleParallaxY;

          const pPhase = Math.sin((elapsed * Math.PI * 2) / p.cycleDuration + p.phase);
          const pAlpha = Math.max(0.05, Math.min(0.40, p.baseAlpha + pPhase * 0.15));

          ctx.fillStyle = p.color;
          ctx.globalAlpha = pAlpha;
          ctx.beginPath();
          ctx.arc(px, py, p.radius, 0, Math.PI * 2);
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
  }, [qualityTier, isInputFocused, isTyping, authState, mergedConfig, parallax, runtimeSignalPulse]);

  return (
    <div
      data-testid="orion-login-environment"
      data-layer-space="true"
      data-layer-stars="true"
      data-layer-constellation="true"
      data-layer-earth="true"
      data-layer-atmosphere="true"
      className={`orion-login-environment absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[#010307] ${className}`}
      aria-hidden="true"
    >
      {/* Canvas Live Orion & 3D Earth Environment Layer */}
      <canvas
        ref={canvasRef}
        data-testid="orion-star-canvas"
        className="absolute inset-0 w-full h-full pointer-events-none z-[1] transition-transform duration-700 ease-out"
      />

      {/* Vignette & Quiet Authentication Surface Overlay */}
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
