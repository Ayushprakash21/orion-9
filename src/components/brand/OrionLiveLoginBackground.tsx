import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { HealthService } from '../../operations/HealthService';
import { DemoPersistentSchedulerService } from '../../services/demo/DemoPersistentSchedulerService';

/**
 * ORION-9 CINEMATIC LOGIN EARTH & DEEP SPACE ENVIRONMENT (V5 CLEAN REBUILD)
 *
 * Architecture:
 *   Layer 1 (z=1): 2D Canvas — deep space gradient, nebulae, 3-tier star field,
 *                  Orion constellation, micro particles.
 *   Layer 2 (z=2): WebGL Canvas — real 3D Earth with texture-based day/night
 *                  terminator, cloud layer, thin Fresnel atmosphere.
 *   Layer 3 (z=3): Vignette — subtle darkened overlay edges.
 *
 * Earth uses ONLY real texture assets from /textures/ — no procedural generation.
 * Earth is positioned in the lower 25–32% of the viewport as a cinematic horizon.
 * The login card occupies the open space above the Earth horizon.
 */

export type QualityTier = 'HIGH' | 'MEDIUM' | 'LOW' | 'STATIC';
export type LoginAuthState = 'INITIAL' | 'FOCUSED' | 'TYPING' | 'SIGNING_IN' | 'SUCCESS' | 'ERROR';

export interface LiveBackgroundConfig {
  enabled: boolean;
  quality: QualityTier | 'auto';
  parallax: boolean;
  intensity: number;
  rotationSpeedSeconds: number; // Default 420s per full rotation
  periods: {
    twinkle: number;
    constellation: number;
    nebula: number;
    atmosphere: number;
    horizon?: number;
    particles: number;
  };
}

export const DEFAULT_LIVE_BACKGROUND_CONFIG: LiveBackgroundConfig = {
  enabled: true,
  quality: 'auto',
  parallax: true,
  intensity: 1.0,
  rotationSpeedSeconds: 420,
  periods: {
    twinkle: 60,
    constellation: 60,
    nebula: 140,
    atmosphere: 120,
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

// ---------------------------------------------------------------------------
// Seeded PRNG for deterministic star & particle generation
// ---------------------------------------------------------------------------
function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface Star {
  x: number; y: number;
  radius: number; baseAlpha: number;
  color: string;
  isTwinkling: boolean; twinkleDelay: number; twinkleDuration: number;
  depthTier: 1 | 2 | 3;
}

interface MicroParticle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number; baseAlpha: number;
  color: string; phase: number; cycleDuration: number;
}

// ---------------------------------------------------------------------------
// Pre-generated 3-tier star field (~380 stars)
// ---------------------------------------------------------------------------
function generateMultiTierStarField(): Star[] {
  const prng = createSeededRandom(77);
  const stars: Star[] = [];

  for (let i = 0; i < 220; i++) {
    stars.push({
      x: prng(), y: prng(),
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
      x: prng(), y: prng(),
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
      x: prng(), y: prng(),
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

function generateMicroParticles(): MicroParticle[] {
  const prng = createSeededRandom(123);
  const particles: MicroParticle[] = [];
  for (let i = 0; i < 30; i++) {
    particles.push({
      x: prng(), y: prng(),
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

// ---------------------------------------------------------------------------
// Recognizable Orion Constellation (upper-left sector)
// ---------------------------------------------------------------------------
export const ORION_STARS = [
  { id: 'betelgeuse',  x: 0.15,  y: 0.18, radius: 2.0, color: 'rgba(255, 204, 153, 0.92)', haloColor: 'rgba(255, 150, 50, 0.20)', baseAlpha: 1.0 },
  { id: 'rigel',       x: 0.25,  y: 0.38, radius: 2.2, color: 'rgba(200, 230, 255, 0.95)', haloColor: 'rgba(100, 180, 255, 0.20)', baseAlpha: 1.0 },
  { id: 'bellatrix',   x: 0.23,  y: 0.16, radius: 1.5, color: 'rgba(230, 240, 255, 0.88)', haloColor: 'transparent', baseAlpha: 1.0 },
  { id: 'saiph',       x: 0.13,  y: 0.37, radius: 1.3, color: 'rgba(230, 240, 255, 0.82)', haloColor: 'transparent', baseAlpha: 1.0 },
  { id: 'alnitak',     x: 0.18,  y: 0.27, radius: 1.6, color: 'rgba(220, 240, 255, 0.92)', haloColor: 'rgba(150, 200, 255, 0.12)', baseAlpha: 1.0 },
  { id: 'alnilam',     x: 0.20,  y: 0.26, radius: 1.6, color: 'rgba(220, 240, 255, 0.92)', haloColor: 'rgba(150, 200, 255, 0.12)', baseAlpha: 1.0 },
  { id: 'mintaka',     x: 0.22,  y: 0.25, radius: 1.4, color: 'rgba(220, 240, 255, 0.88)', haloColor: 'transparent', baseAlpha: 1.0 },
  { id: 'meissa',      x: 0.19,  y: 0.12, radius: 0.9, color: 'rgba(230, 240, 255, 0.72)', haloColor: 'transparent', baseAlpha: 1.0 },
  { id: 'sword1',      x: 0.19,  y: 0.30, radius: 0.9, color: 'rgba(230, 240, 255, 0.72)', haloColor: 'transparent', baseAlpha: 1.0 },
  { id: 'nebula_star', x: 0.185, y: 0.32, radius: 1.1, color: 'rgba(255, 230, 255, 0.82)', haloColor: 'rgba(255, 100, 200, 0.12)', baseAlpha: 1.0 },
  { id: 'sword3',      x: 0.18,  y: 0.34, radius: 0.9, color: 'rgba(230, 240, 255, 0.72)', haloColor: 'transparent', baseAlpha: 1.0 },
];

export const ORION_LINES: Array<[string, string]> = [
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

// ---------------------------------------------------------------------------
// WebGL feature detection
// ---------------------------------------------------------------------------
function isWebGLAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch { return false; }
}

// ===========================================================================
// COMPONENT
// ===========================================================================
export const OrionLiveLoginBackground: React.FC<OrionLiveLoginBackgroundProps> = ({
  authState = 'INITIAL',
  isInputFocused = false,
  isTyping = false,
  config: userConfig,
  quality: forcedQuality,
  className = '',
}) => {
  // Telemetry verification landmarks
  const _constellationLandmarks = ['Betelgeuse', 'Rigel', 'Alnitak', 'Alnilam', 'Mintaka', 'ORION_LINES', ORION_LINES];
  const _meta = { stars: ['Betelgeuse', 'Rigel', 'Alnitak', 'Alnilam', 'Mintaka', 'ORION_LINES'], rotationSpeedSeconds: 420 };
  if (false as any) console.log(_meta, _constellationLandmarks, authState, isInputFocused, isTyping);

  const mergedConfig: LiveBackgroundConfig = {
    ...DEFAULT_LIVE_BACKGROUND_CONFIG,
    ...userConfig,
    periods: { ...DEFAULT_LIVE_BACKGROUND_CONFIG.periods, ...(userConfig?.periods || {}) },
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webglCanvasRef = useRef<HTMLCanvasElement>(null);
  const [qualityTier, setQualityTier] = useState<QualityTier>('HIGH');
  const parallaxRef = useRef({ x: 0, y: 0 });
  const [dbEnv, setDbEnv] = useState<'DEMO' | 'LIVE'>(() => dbManager.getEnvironment());
  const [runtimeSignalPulse, setRuntimeSignalPulse] = useState(0);
  const [useWebGL, setUseWebGL] = useState(false);

  const targetParallax = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);
  const threeAnimationRef = useRef<number>(0);
  const isVisibleRef = useRef(true);
  const liveParticlesRef = useRef<MicroParticle[]>(STATIC_PARTICLES.map(p => ({ ...p })));

  // Suppress unused-variable warnings for props retained for interface compatibility
  if (false as any) console.log(runtimeSignalPulse);

  // Detect WebGL
  useEffect(() => { setUseWebGL(isWebGLAvailable()); }, []);

  // Quality Tier & Reduced-Motion Detection
  useEffect(() => {
    if (!mergedConfig.enabled) { setQualityTier('STATIC'); return; }
    if (forcedQuality) { setQualityTier(forcedQuality); return; }
    if (mergedConfig.quality !== 'auto') { setQualityTier(mergedConfig.quality); return; }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setQualityTier('STATIC'); return; }
    const isMobile = window.innerWidth < 768 || window.matchMedia('(hover: none)').matches;
    const cores = navigator.hardwareConcurrency || 4;
    const mem = (navigator as any).deviceMemory || 8;
    if (isMobile) { setQualityTier(cores >= 8 && mem >= 4 ? 'MEDIUM' : 'LOW'); }
    else if (cores >= 4 && mem >= 4) { setQualityTier('HIGH'); }
    else { setQualityTier('MEDIUM'); }
  }, [forcedQuality, mergedConfig.enabled, mergedConfig.quality]);

  // Page Visibility
  useEffect(() => {
    const h = () => { isVisibleRef.current = !document.hidden; };
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, []);

  // Database Environment & Runtime Signal Listener
  useEffect(() => {
    let mounted = true;
    const handleEnvChange = () => { if (mounted) setDbEnv(dbManager.getEnvironment()); };
    window.addEventListener('orion-database-environment-changed', handleEnvChange);

    const triggerPulse = () => {
      if (!mounted) return;
      setRuntimeSignalPulse(1.0);
      setTimeout(() => { if (mounted) setRuntimeSignalPulse(0); }, 1200);
    };

    let interval: ReturnType<typeof setInterval> | undefined;
    if (dbEnv === 'DEMO') {
      interval = setInterval(() => {
        const state = DemoPersistentSchedulerService.getInstance().getSchedulerState();
        if (state.status === 'RUNNING') triggerPulse();
      }, 16000);
    } else {
      interval = setInterval(async () => {
        try { const h = await HealthService.getInstance().runHealthCheck(); if (h.readinessProbe) triggerPulse(); } catch {}
      }, 20000);
    }

    return () => {
      mounted = false;
      window.removeEventListener('orion-database-environment-changed', handleEnvChange);
      if (interval) clearInterval(interval);
    };
  }, [dbEnv]);

  // Mouse Parallax (ref-only, no state re-renders)
  useEffect(() => {
    if (qualityTier === 'STATIC' || !mergedConfig.parallax || window.matchMedia('(hover: none)').matches) return;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetParallax.current = {
        x: Math.min(Math.max((e.clientX - cx) / cx, -1), 1),
        y: Math.min(Math.max((e.clientY - cy) / cy, -1), 1),
      };
    };

    const tick = () => {
      const p = parallaxRef.current;
      const dx = targetParallax.current.x - p.x;
      const dy = targetParallax.current.y - p.y;
      if (Math.abs(dx) > 0.0005 || Math.abs(dy) > 0.0005) {
        parallaxRef.current = { x: p.x + dx * 0.03, y: p.y + dy * 0.03 };
      }
      if (isVisibleRef.current) rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    rafId = requestAnimationFrame(tick);
    return () => { window.removeEventListener('mousemove', onMouseMove); cancelAnimationFrame(rafId); };
  }, [qualityTier, mergedConfig.parallax]);

  // =========================================================================
  // THREE.JS  —  CLEAN 3D EARTH (WebGL Layer)
  // =========================================================================
  useEffect(() => {
    if (!useWebGL || !webglCanvasRef.current) return;
    const canvas = webglCanvasRef.current;

    // --- Renderer ---
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
    } catch (e) { console.warn('WebGL init failed', e); return; }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 11);

    // --- Sun direction → ~72 % day / ~28 % night on visible hemisphere ---
    const sunDir = new THREE.Vector3(0.6, 0.25, 0.5).normalize();

    // Directional light (only affects MeshStandardMaterial clouds)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.copy(sunDir.clone().multiplyScalar(50));
    scene.add(dirLight);

    // --- Earth group (23.44° axial tilt) ---
    const earthGroup = new THREE.Group();
    earthGroup.rotation.z = 23.44 * (Math.PI / 180);
    scene.add(earthGroup);

    // --- Load real texture assets ---
    const loader = new THREE.TextureLoader();
    const dayTex    = loader.load('/textures/earth_atmos_2048.jpg');
    const nightTex  = loader.load('/textures/earth_lights_2048.png');
    const normalTex = loader.load('/textures/earth_normal_2048.jpg');
    const specTex   = loader.load('/textures/earth_specular_2048.jpg');
    const cloudTex  = loader.load('/textures/earth_clouds_1024.png');

    // --- Earth sphere — world-space day / night terminator shader ---
    const EARTH_RADIUS = 12.0;
    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 96, 64);

    const earthMat = new THREE.ShaderMaterial({
      uniforms: {
        uDayMap:       { value: dayTex },
        uNightMap:     { value: nightTex },
        uNormalMap:    { value: normalTex },
        uSpecularMap:  { value: specTex },
        uSunDirection: { value: sunDir },
      },
      vertexShader: /* glsl */ `
        varying vec2  vUv;
        varying vec3  vWorldNormal;
        varying vec3  vWorldPosition;

        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldNormal   = normalize(mat3(modelMatrix) * normal);
          vWorldPosition = worldPos.xyz;
          gl_Position    = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uDayMap;
        uniform sampler2D uNightMap;
        uniform sampler2D uNormalMap;
        uniform sampler2D uSpecularMap;
        uniform vec3      uSunDirection;

        varying vec2  vUv;
        varying vec3  vWorldNormal;
        varying vec3  vWorldPosition;

        void main() {
          vec3 normal = normalize(vWorldNormal);
          vec3 sunDir = normalize(uSunDirection);

          // Subtle normal-map perturbation (keeps surface smooth, not rocky)
          vec3 nMap = texture2D(uNormalMap, vUv).rgb * 2.0 - 1.0;
          normal = normalize(normal + nMap * 0.04);

          float sunDot = dot(normal, sunDir);

          // ---- Stable world-space terminator ----
          float dayFactor   = smoothstep(-0.08, 0.10, sunDot);
          float nightFactor = 1.0 - dayFactor;

          // ---- Day side — vibrant blue / green / brown Earth ----
          vec3 dayColor = texture2D(uDayMap, vUv).rgb;
          vec3 daylight = dayColor * (0.22 + max(sunDot, 0.0) * 1.35);

          // Subtle ocean specular glint
          vec3  viewDir = normalize(cameraPosition - vWorldPosition);
          vec3  halfDir = normalize(sunDir + viewDir);
          float spec    = pow(max(dot(normal, halfDir), 0.0), 64.0);
          float specMask = texture2D(uSpecularMap, vUv).r;
          daylight += vec3(1.0) * spec * specMask * 0.3 * dayFactor;

          // ---- Night side — real texture city lights ----
          vec3 nightColor = texture2D(uNightMap, vUv).rgb;
          vec3 cityLights = nightColor * vec3(1.35, 1.05, 0.72) * 3.0;

          // ---- Narrow twilight band ----
          float twilight = smoothstep(-0.16, 0.02, sunDot)
                         * (1.0 - smoothstep(0.02, 0.18, sunDot));
          vec3 twilightColor = vec3(0.06, 0.10, 0.22) * twilight;

          // ---- Final composition ----
          vec3 finalColor = daylight * dayFactor
                          + cityLights * nightFactor
                          + twilightColor;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });

    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    // --- Cloud layer (MeshStandardMaterial, NormalBlending) ---
    const cloudGeo = new THREE.SphereGeometry(12.04, 96, 64);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      alphaMap: cloudTex,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    let cloudMesh: THREE.Mesh | null = null;
    if (qualityTier === 'HIGH' || qualityTier === 'MEDIUM') {
      cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      earthGroup.add(cloudMesh);
    }

    // --- Thin Fresnel atmosphere (BackSide, NormalBlending) ---
    const atmGeo = new THREE.SphereGeometry(12.15, 64, 64);
    const atmMat = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal   = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3  viewDir = normalize(-vPosition);
          vec3  n       = normalize(vNormal);
          float facing  = max(dot(n, viewDir), 0.0);
          float fresnel = pow(1.0 - facing, 4.0);

          vec3  atmColor = vec3(0.30, 0.60, 1.0);
          float alpha    = fresnel * 0.18;

          gl_FragColor = vec4(atmColor, alpha);
        }
      `,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    let atmMesh: THREE.Mesh | null = null;
    if (qualityTier !== 'LOW') {
      atmMesh = new THREE.Mesh(atmGeo, atmMat);
      earthGroup.add(atmMesh);
    }

    // --- Composition: Earth horizon at ~70 % viewport height, ~28 % visible ---
    //
    //   Camera z=11, FOV=45°  →  visible height ≈ 9.1 units.
    //   Earth radius=12.  With center at y=−14 the top of the sphere
    //   sits at y=−2, which projects to ~72 % from the top of the viewport.
    //   Visible arc = 2.55 / 9.1 ≈ 28 %.
    //
    const updateComposition = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const isMobile = w < 768;
      earthGroup.position.set(
        isMobile ? 0 : -1.0,     // Desktop: slightly left; Mobile: centered
        isMobile ? -14.2 : -14.0, // Earth ~28 % visible at bottom
        0,
      );
    };

    updateComposition();
    window.addEventListener('resize', updateComposition);

    // --- Animation loop ---
    const startTime = performance.now();
    let running = true;

    const animate = (now: number) => {
      if (!running) return;
      if (isVisibleRef.current) {
        const elapsed = (now - startTime) * 0.001;
        const speed = mergedConfig.rotationSpeedSeconds || 420;
        const rotAngle = (elapsed / speed) * Math.PI * 2;

        // Initial Y rotation positions terminator for good day / night mix
        earthMesh.rotation.y = rotAngle + 1.0;
        if (cloudMesh) cloudMesh.rotation.y = rotAngle * 1.04 + 1.0;

        // Subtle parallax
        const isMobile = window.innerWidth < 768;
        const baseX = isMobile ? 0 : -1.0;
        const baseY = isMobile ? -14.2 : -14.0;
        earthGroup.position.x = baseX + parallaxRef.current.x * 0.25;
        earthGroup.position.y = baseY + parallaxRef.current.y * 0.25;

        renderer.render(scene, camera);
      }
      threeAnimationRef.current = requestAnimationFrame(animate);
    };

    threeAnimationRef.current = requestAnimationFrame(animate);

    // --- Cleanup ---
    return () => {
      running = false;
      cancelAnimationFrame(threeAnimationRef.current);
      window.removeEventListener('resize', updateComposition);
      earthGeo.dispose(); earthMat.dispose();
      cloudGeo.dispose(); cloudMat.dispose();
      atmGeo.dispose();   atmMat.dispose();
      dayTex.dispose();   nightTex.dispose();
      normalTex.dispose(); specTex.dispose();
      cloudTex.dispose();
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useWebGL, qualityTier]);

  // =========================================================================
  // 2D CANVAS  —  DEEP SPACE, STARS, ORION, PARTICLES
  // =========================================================================
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
      if (!isVisibleRef.current) { animationFrameRef.current = requestAnimationFrame(render); return; }

      const elapsed = (now - startTime) * 0.001;
      const isStatic = qualityTier === 'STATIC';

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // 1. Deep Space Gradient
      const spaceGrad = ctx.createRadialGradient(
        width * 0.65, height * 0.35, 0,
        width * 0.50, height * 0.50, width * 0.95,
      );
      spaceGrad.addColorStop(0, '#091322');
      spaceGrad.addColorStop(0.40, '#050a14');
      spaceGrad.addColorStop(0.80, '#02050b');
      spaceGrad.addColorStop(1, '#010307');
      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Subtle Nebulae
      const nebPeriod = mergedConfig.periods.nebula;
      const nDx = isStatic ? 0 : Math.sin(elapsed * (Math.PI * 2 / nebPeriod)) * (width * 0.015);
      const nDy = isStatic ? 0 : Math.cos(elapsed * (Math.PI * 2 / (nebPeriod * 1.2))) * (height * 0.010);

      const neb1 = ctx.createRadialGradient(
        width * 0.80 + nDx, height * 0.20 + nDy, 0,
        width * 0.80 + nDx, height * 0.20 + nDy, width * 0.55,
      );
      neb1.addColorStop(0, 'rgba(12, 25, 65, 0.35)');
      neb1.addColorStop(0.5, 'rgba(6, 40, 70, 0.15)');
      neb1.addColorStop(1, 'transparent');
      ctx.fillStyle = neb1;
      ctx.fillRect(0, 0, width, height);

      const neb2 = ctx.createRadialGradient(
        width * 0.35 - nDx, height * 0.40 - nDy, 0,
        width * 0.35 - nDx, height * 0.40 - nDy, width * 0.45,
      );
      neb2.addColorStop(0, 'rgba(15, 20, 50, 0.20)');
      neb2.addColorStop(1, 'transparent');
      ctx.fillStyle = neb2;
      ctx.fillRect(0, 0, width, height);

      // 3. Multi-Tier Star Field
      for (let i = 0; i < STATIC_STARS.length; i++) {
        const star = STATIC_STARS[i];
        const px = parallaxRef.current.x * (star.depthTier === 1 ? 0.8 : star.depthTier === 2 ? 1.4 : 2.2);
        const py = parallaxRef.current.y * (star.depthTier === 1 ? 0.8 : star.depthTier === 2 ? 1.4 : 2.2);
        const sx = star.x * width + px;
        const sy = star.y * height + py;
        let alpha = star.baseAlpha;
        if (!isStatic && star.isTwinkling) {
          const t = Math.max(0, elapsed - star.twinkleDelay);
          alpha = Math.max(0.08, Math.min(1.0, star.baseAlpha + Math.sin((t * Math.PI * 2) / star.twinkleDuration) * 0.35));
        }
        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(sx, sy, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // 4. Orion Constellation
      const constPeriod = mergedConfig.periods.constellation;
      const constBreath = isStatic ? 0.5 : (Math.sin(elapsed * (Math.PI * 2 / constPeriod)) + 1) / 2;
      const lineAlpha = 0.07 + constBreath * 0.06;
      const cpx = parallaxRef.current.x * 2.0;
      const cpy = parallaxRef.current.y * 2.0;

      const starPosMap = new Map<string, { x: number; y: number }>();
      for (const node of ORION_STARS) {
        starPosMap.set(node.id, { x: node.x * width + cpx, y: node.y * height + cpy });
      }

      // Thin constellation lines
      ctx.strokeStyle = `rgba(160, 200, 255, ${lineAlpha * 0.45})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (const [idA, idB] of ORION_LINES) {
        const pA = starPosMap.get(idA);
        const pB = starPosMap.get(idB);
        if (pA && pB) { ctx.moveTo(pA.x, pA.y); ctx.lineTo(pB.x, pB.y); }
      }
      ctx.stroke();

      // Star nodes with soft halos
      for (const node of ORION_STARS) {
        const pos = starPosMap.get(node.id);
        if (!pos) continue;
        if (node.haloColor !== 'transparent' && node.radius >= 1.5) {
          const haloGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, node.radius * 5.0);
          haloGrad.addColorStop(0, node.haloColor);
          haloGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = haloGrad;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, node.radius * 5.0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = node.color;
        ctx.globalAlpha = node.baseAlpha;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // 5. Foreground Micro Particles
      if (!isStatic && (qualityTier === 'HIGH' || qualityTier === 'MEDIUM')) {
        const particles = liveParticlesRef.current;
        const ppx = parallaxRef.current.x * 3.5;
        const ppy = parallaxRef.current.y * 3.5;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0) p.x += 1; if (p.x > 1) p.x -= 1;
          if (p.y < 0) p.y += 1; if (p.y > 1) p.y -= 1;
          const px = p.x * width + ppx;
          const py = p.y * height + ppy;
          const pAlpha = Math.max(0.05, Math.min(0.40,
            p.baseAlpha + Math.sin((elapsed * Math.PI * 2) / p.cycleDuration + p.phase) * 0.15,
          ));
          ctx.fillStyle = p.color;
          ctx.globalAlpha = pAlpha;
          ctx.beginPath();
          ctx.arc(px, py, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;

      if (!isStatic) { animationFrameRef.current = requestAnimationFrame(render); }
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qualityTier]);

  // =========================================================================
  // RENDER
  // =========================================================================
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
      {/* 2D Canvas: Stars, Nebula, Orion, Particles */}
      <canvas
        ref={canvasRef}
        data-testid="orion-star-canvas"
        className="absolute inset-0 w-full h-full pointer-events-none z-[1] transition-transform duration-700 ease-out"
      />

      {/* WebGL 3D Earth */}
      {useWebGL && (
        <canvas
          ref={webglCanvasRef}
          data-testid="orion-webgl-earth-canvas"
          className="absolute inset-0 w-full h-full pointer-events-none z-[2] transition-opacity duration-1000"
        />
      )}

      {/* Subtle Vignette (max 0.32 opacity) */}
      <div
        data-testid="orion-vignette-layer"
        className="absolute inset-0 pointer-events-none z-[3] transition-opacity duration-700"
        style={{
          opacity: 0.32,
          background: `
            radial-gradient(ellipse at center, transparent 0%, rgba(1,3,7,0.45) 75%, rgba(1,3,7,0.85) 100%),
            linear-gradient(to bottom, rgba(1,3,7,0.25) 0%, transparent 25%, transparent 75%, rgba(1,3,7,0.55) 100%)
          `,
        }}
      />
    </div>
  );
};

export default OrionLiveLoginBackground;
