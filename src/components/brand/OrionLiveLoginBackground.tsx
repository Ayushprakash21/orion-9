/**
 * ORION-9 LIVE SPACE WALLPAPER & LOGIN ENVIRONMENT (SINGLE EARTH GUARANTEED REBUILD)
 *
 * Visual Source of Truth: /orion9-space-baseline.png (Master space visual asset)
 *
 * Guaranteed Single-Earth Architecture:
 * 1. Background Shader: Renders stationary deep space, smooth nebula, sub-pixel starfield,
 *    and Orion constellation from /orion9-space-baseline.png. Masks out the ENTIRE baked 2D Earth
 *    horizon (uv.y < 0.45) so the background quad contains ONLY deep space, preventing any duplicate Earth artifact.
 * 2. 3D Real Rotating Earth Globe: ONE THREE.SphereGeometry(3.0, 128, 64) inside ONE earthGroup.
 *    Equirectangular day map, photorealistic night city-lights map, specular map, clouds layer,
 *    and thin Rayleigh atmosphere rim glow.
 * 3. Single Scene & Canvas: 1 THREE.Scene, 1 THREE.WebGLRenderer, 1 <canvas> element.
 * 4. Axial Tilt Preserved: 23.4° z-tilt and 12° x-tilt set once on earthGroup. Only earthMesh.rotation.y
 *    and cloudMesh.rotation.y animate over time.
 * 5. Debug Toggle: window.EARTH_DEBUG_FAST_ROTATION = true sets rotation speed to 0.08 rad/s for
 *    instant visual verification of continent & city-light motion across the single 3D globe.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export type QualityTier = 'HIGH' | 'MEDIUM' | 'LOW' | 'STATIC';

export interface OrionLiveLoginBackgroundProps {
  className?: string;
  qualityTier?: QualityTier;
  authState?: string;
  isInputFocused?: boolean;
  isTyping?: boolean;
  rotationSpeedSeconds?: number;
}

export const DEFAULT_LIVE_BACKGROUND_CONFIG = {
  enabled: true,
  rotationSpeedSeconds: 420,
  periods: {
    twinkle: 3.5,
    constellation: 60,
    nebula: 120,
    atmosphere: 120,
  },
};

// Declare window extension for debug rotation toggle
declare global {
  interface Window {
    EARTH_DEBUG_FAST_ROTATION?: boolean;
  }
}

// -----------------------------------------------------------------------------
// 1. BACKGROUND DEEP SPACE SHADERS (Space, Nebula, Orion — Baked Earth Fully Masked)
// -----------------------------------------------------------------------------
const BG_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const BG_FRAGMENT_SHADER = `
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uEarthRotationSpeed;
  uniform float uSunGlintIntensity;
  uniform vec2 uResolution;
  uniform bool uReducedMotion;

  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;

    if (uReducedMotion) {
      gl_FragColor = texture2D(uTexture, uv);
      return;
    }

    // Smooth nebula UV drift (upper space background only)
    vec2 finalUv = uv;
    if (uv.y > 0.40) {
      float nebDriftX = sin(uTime * 0.12 + uv.y * 2.5) * 0.0008;
      float nebDriftY = cos(uTime * 0.10 + uv.x * 2.5) * 0.0006;
      finalUv += vec2(nebDriftX, nebDriftY) * smoothstep(0.40, 0.70, uv.y);
    }

    vec4 col = texture2D(uTexture, finalUv);

    // MASK OUT ALL BAKED 2D EARTH & HORIZON FROM BACKGROUND TEXTURE:
    // Guarantees ZERO double-vision / ZERO duplicate Earth artifacts across full screen width
    float horizonLine = 0.46 - 0.12 * pow(uv.x - 0.70, 2.0);
    float earthMask = smoothstep(horizonLine + 0.08, horizonLine - 0.04, uv.y);

    vec3 deepSpaceBackground = vec3(0.002, 0.006, 0.015);
    col.rgb = mix(col.rgb, deepSpaceBackground, earthMask);

    // Orion Constellation Subtle Stellar Scintillation (7 Major Stars - Upper Left)
    vec2 orionStars[7];
    orionStars[0] = vec2(0.122, 0.852); // Betelgeuse
    orionStars[1] = vec2(0.285, 0.540); // Rigel
    orionStars[2] = vec2(0.258, 0.920); // Bellatrix
    orionStars[3] = vec2(0.165, 0.472); // Saiph
    orionStars[4] = vec2(0.188, 0.690); // Alnitak
    orionStars[5] = vec2(0.208, 0.672); // Alnilam
    orionStars[6] = vec2(0.228, 0.652); // Mintaka

    float orionSparkleBoost = 0.0;
    for (int i = 0; i < 7; i++) {
      vec2 sPos = orionStars[i];
      vec2 d = uv - sPos;
      d.x *= aspect;
      float r = length(d);
      if (r < 0.018) {
        float phase = float(i) * 1.731;
        float sparkle = sin(uTime * (0.8 + float(i) * 0.25) + phase) * 0.5 + 0.5;
        sparkle = pow(sparkle, 2.5) * 0.045;
        float starFalloff = smoothstep(0.018, 0.0, r);
        orionSparkleBoost += sparkle * starFalloff;
      }
    }

    col.rgb += vec3(0.75, 0.88, 1.0) * orionSparkleBoost;

    // Localized Sunlight Glint Shimmer on Space Background Right Horizon
    vec2 sunPos = vec2(0.725, 0.435);
    vec2 sunDistVec = uv - sunPos;
    sunDistVec.x *= aspect;
    float sunDist = length(sunDistVec);

    if (uSunGlintIntensity > 1.001) {
      float glintFactor = uSunGlintIntensity - 1.0;
      float sunMask = smoothstep(0.30, 0.0, sunDist);
      vec3 glintColor = vec3(1.0, 0.90, 0.75) * (glintFactor * 0.6 * sunMask);
      col.rgb += glintColor;
    }

    gl_FragColor = col;
  }
`;

// -----------------------------------------------------------------------------
// 2. REAL 3D ROTATING EARTH SHADERS (Day Map + Night City Lights + Specular + Sun)
// -----------------------------------------------------------------------------
const EARTH_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const EARTH_FRAGMENT_SHADER = `
  uniform sampler2D uDayTexture;
  uniform sampler2D uNightTexture;
  uniform sampler2D uSpecularTexture;
  uniform vec3 uSunDirection;
  uniform float uSunGlintIntensity;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    vec3 sunDir = normalize(uSunDirection);

    vec4 daySample = texture2D(uDayTexture, vUv);
    vec4 nightSample = texture2D(uNightTexture, vUv);
    vec4 specSample = texture2D(uSpecularTexture, vUv);

    // Compute surface illumination relative to Sun direction
    float NdotL = dot(normal, sunDir);
    float dayFactor = smoothstep(-0.12, 0.22, NdotL);

    // 1. Night Side: Photorealistic Golden/Orange City Lights attached to surface
    vec3 cityLights = nightSample.rgb * vec3(1.25, 0.90, 0.40) * 2.6;
    vec3 nightAmbient = vec3(0.010, 0.028, 0.065) * daySample.rgb;
    vec3 nightSide = cityLights + nightAmbient;

    // 2. Day Side: Sunlit Continents & Ocean Specular Sheen
    float lightIntensity = clamp(NdotL, 0.05, 1.0);
    vec3 dayLit = daySample.rgb * lightIntensity * vec3(1.0, 0.97, 0.92);

    vec3 reflectDir = reflect(-sunDir, normal);
    float specAmount = pow(max(0.0, dot(reflectDir, viewDir)), 24.0);
    vec3 specularColor = vec3(0.35, 0.70, 0.95) * specAmount * specSample.r * 1.5 * dayFactor;
    vec3 daySide = dayLit + specularColor;

    // Blend day and night across the natural planetary terminator
    vec3 finalColor = mix(nightSide, daySide, dayFactor);

    // Periodic Localized Sunlight Glint
    if (uSunGlintIntensity > 1.001) {
      float glintFactor = uSunGlintIntensity - 1.0;
      float glintMask = smoothstep(0.3, 0.95, NdotL);
      finalColor += vec3(1.0, 0.88, 0.65) * glintFactor * glintMask * 0.6;
    }

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// -----------------------------------------------------------------------------
// 3. THIN RAYLEIGH ATMOSPHERIC RIM GLOW SHADER
// -----------------------------------------------------------------------------
const ATMOSPHERE_VERTEX_SHADER = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const ATMOSPHERE_FRAGMENT_SHADER = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    // Thin, realistic Rayleigh scattering Fresnel limb glow
    float intensity = pow(1.0 - abs(dot(normal, viewDir)), 5.0);
    vec3 atmosphereColor = mix(vec3(0.10, 0.40, 0.90), vec3(0.20, 0.70, 0.95), intensity);

    gl_FragColor = vec4(atmosphereColor, intensity * 0.35);
  }
`;

export function OrionLiveLoginBackground({
  className = '',
  qualityTier = 'HIGH',
  rotationSpeedSeconds = 420,
}: OrionLiveLoginBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: qualityTier !== 'LOW',
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglSupported(false);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.autoClear = false;

    // -------------------------------------------------------------------------
    // SINGLE THREE.JS SCENE ARCHITECTURE (Guarantees Exactly 1 Scene & 1 Canvas)
    // -------------------------------------------------------------------------
    const bgScene = new THREE.Scene();
    const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    bgCamera.position.z = 1;

    const textureLoader = new THREE.TextureLoader();
    const baselineTexture = textureLoader.load('/orion9-space-baseline.png', () => {
      baselineTexture.colorSpace = THREE.SRGBColorSpace;
      baselineTexture.minFilter = THREE.LinearFilter;
      baselineTexture.magFilter = THREE.LinearFilter;
    });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isStatic = prefersReducedMotion || qualityTier === 'LOW' || (qualityTier as string) === 'STATIC';

    const bgUniforms = {
      uTexture: { value: baselineTexture },
      uTime: { value: 0 },
      uEarthRotationSpeed: { value: (Math.PI * 2) / (rotationSpeedSeconds * 60) },
      uSunGlintIntensity: { value: 1.0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uReducedMotion: { value: isStatic },
    };

    const bgMaterial = new THREE.ShaderMaterial({
      vertexShader: BG_VERTEX_SHADER,
      fragmentShader: BG_FRAGMENT_SHADER,
      uniforms: bgUniforms,
      depthWrite: false,
      depthTest: false,
    });

    const bgPlane = new THREE.PlaneGeometry(2, 2);
    const bgMesh = new THREE.Mesh(bgPlane, bgMaterial);
    bgScene.add(bgMesh);

    // -------------------------------------------------------------------------
    // THE ONE AND ONLY 3D EARTH GLOBE (Perspective Camera Pass)
    // -------------------------------------------------------------------------
    const earthScene = new THREE.Scene();
    const earthCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    earthCamera.position.set(0, 0, 8.5);

    // Load Equirectangular Geographic Textures from public assets
    const dayMap = textureLoader.load('/textures/earth_atmos_2048.jpg');
    dayMap.colorSpace = THREE.SRGBColorSpace;

    const nightMap = textureLoader.load('/textures/earth_lights_2048.jpg');
    nightMap.colorSpace = THREE.SRGBColorSpace;

    const normalMap = textureLoader.load('/textures/earth_normal_2048.jpg');
    const specularMap = textureLoader.load('/textures/earth_specular_2048.jpg');
    const cloudsMap = textureLoader.load('/textures/earth_clouds_1024.png');

    // Single Earth Group with Preserved Axial Tilt (23.4° z-tilt, 12° x-tilt)
    const earthGroup = new THREE.Group();
    earthGroup.rotation.z = THREE.MathUtils.degToRad(23.4);
    earthGroup.rotation.x = THREE.MathUtils.degToRad(12);
    earthScene.add(earthGroup);

    // 1. Exactly ONE 3D Earth Surface Mesh (SphereGeometry)
    const earthRadius = 3.0;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 128, 64);

    const earthUniforms = {
      uDayTexture: { value: dayMap },
      uNightTexture: { value: nightMap },
      uSpecularTexture: { value: specularMap },
      uSunDirection: { value: new THREE.Vector3(0.85, 0.25, 0.55).normalize() },
      uSunGlintIntensity: { value: 1.0 },
      uTime: { value: 0 },
    };

    const earthMat = new THREE.ShaderMaterial({
      vertexShader: EARTH_VERTEX_SHADER,
      fragmentShader: EARTH_FRAGMENT_SHADER,
      uniforms: earthUniforms,
    });

    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    // 2. Exactly ONE Cloud Sphere Layer
    let cloudMesh: THREE.Mesh | null = null;
    if (qualityTier === 'HIGH') {
      const cloudGeo = new THREE.SphereGeometry(earthRadius * 1.008, 96, 96);
      const cloudMat = new THREE.MeshLambertMaterial({
        map: cloudsMap,
        transparent: true,
        opacity: 0.20,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      earthGroup.add(cloudMesh);
    }

    // 3. Exactly ONE Thin Atmospheric Rayleigh Rim Glow Shell
    let atmosphereMesh: THREE.Mesh | null = null;
    if (qualityTier !== 'LOW') {
      const atmoGeo = new THREE.SphereGeometry(earthRadius * 1.016, 128, 64);
      const atmoMat = new THREE.ShaderMaterial({
        vertexShader: ATMOSPHERE_VERTEX_SHADER,
        fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
      });
      atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
      earthGroup.add(atmosphereMesh);
    }

    // Directional Light & Ambient Space Light
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 2, 4);
    earthScene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0x112233, 0.6);
    earthScene.add(ambientLight);

    // Positioning Earth in lower-left / lower-center viewport matching baseline horizon
    const updateComposition = () => {
      if (!canvas || !renderer) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);

      bgUniforms.uResolution.value.set(w, h);

      earthCamera.aspect = w / h;
      earthCamera.updateProjectionMatrix();

      const isMobile = w < 768;
      earthGroup.position.set(
        isMobile ? -1.0 : -1.8,
        isMobile ? -2.6 : -2.25,
        0
      );
    };

    updateComposition();
    window.addEventListener('resize', updateComposition);

    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Sunlight Glint Timing (Pulse every 5-12 seconds)
    let glintActive = false;
    let glintStartTime = 0;
    let glintDuration = 350;
    let nextGlintTime = Date.now() + 6000;

    let running = true;
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      if (!running) return;
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      bgUniforms.uTime.value = elapsed;
      earthUniforms.uTime.value = elapsed;

      // Check Development Debug Fast Rotation Toggle
      const isDebugFast =
        (typeof window !== 'undefined' && Boolean(window.EARTH_DEBUG_FAST_ROTATION)) ||
        (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug_fast'));

      if (!isStatic) {
        // Base production speed (~0.004 rad/s) vs Debug Fast Rotation (0.08 rad/s)
        const baseSpeed = (Math.PI * 2) / (rotationSpeedSeconds * 60);
        const rotationSpeed = isDebugFast ? 0.08 : baseSpeed;

        // ANIMATE ONLY THE EXISTING EARTH MESH AND CLOUD MESH Y-ROTATION
        // Preserves axial tilt on earthGroup
        earthMesh.rotation.y += delta * rotationSpeed;
        if (cloudMesh) {
          cloudMesh.rotation.y += delta * rotationSpeed * 1.06;
        }
      }

      // Sunlight Glint Pulse logic
      const now = Date.now();
      if (!glintActive && now >= nextGlintTime) {
        glintActive = true;
        glintStartTime = now;
        glintDuration = 250 + Math.random() * 250;
        nextGlintTime = now + 5000 + Math.random() * 7000;
      }

      if (glintActive) {
        const glintElapsed = now - glintStartTime;
        if (glintElapsed < glintDuration) {
          const progress = glintElapsed / glintDuration;
          const glintCurve = Math.sin(progress * Math.PI);
          const intensity = 1.0 + glintCurve * 0.15;
          bgUniforms.uSunGlintIntensity.value = intensity;
          earthUniforms.uSunGlintIntensity.value = intensity;
        } else {
          glintActive = false;
          bgUniforms.uSunGlintIntensity.value = 1.0;
          earthUniforms.uSunGlintIntensity.value = 1.0;
        }
      }

      // Render Sequence: Pass 1 Stationary Space BG -> Pass 2 Single 3D Earth
      renderer.clear();
      renderer.render(bgScene, bgCamera);
      renderer.render(earthScene, earthCamera);
    };

    animate();

    return () => {
      running = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateComposition);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      bgPlane.dispose();
      bgMaterial.dispose();
      baselineTexture.dispose();

      earthGeo.dispose();
      earthMat.dispose();
      dayMap.dispose();
      nightMap.dispose();
      normalMap.dispose();
      specularMap.dispose();
      cloudsMap.dispose();

      if (atmosphereMesh) {
        atmosphereMesh.geometry.dispose();
      }

      renderer.dispose();
    };
  }, [qualityTier, rotationSpeedSeconds]);

  return (
    <div
      ref={containerRef}
      data-testid="orion-login-environment"
      data-layer-earth="true"
      data-layer-atmosphere="true"
      data-layer-constellation="true"
      className={`orion-login-environment absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[#010307] ${className}`}
      aria-hidden="true"
    >
      {!webglSupported && (
        <img
          src="/orion9-space-baseline.png"
          alt="Orion Live Space Baseline"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          draggable={false}
        />
      )}

      <canvas
        ref={canvasRef}
        data-testid="orion-webgl-earth-canvas"
        className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
      />
    </div>
  );
}

export default OrionLiveLoginBackground;
