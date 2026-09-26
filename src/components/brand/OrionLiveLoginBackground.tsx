/**
 * ORION-9 LIVE SPACE WALLPAPER & LOGIN ENVIRONMENT (V6 FINAL REBUILD)
 *
 * Visual Source of Truth: /orion9-space-baseline.png (Master visual asset)
 *
 * Features:
 * 1. Base image / composition 100% preserved from /orion9-space-baseline.png
 * 2. Independent, extremely slow Earth rotation (~0.004 rad/s)
 * 3. Orion constellation stars (upper-left) subtle stellar scintillation (5-12% phase-shifted)
 * 4. Microscopic starfield twinkling in deep space background
 * 5. Subtle nebula UV drift & breathing
 * 6. Periodic localized sunlight glint on the right horizon (300ms pulse every 5-12s)
 * 7. Atmosphere rim subtle flare response to sunlight
 * 8. Camera composition & framing 100% locked
 * 9. Reduced-motion & WebGL fallback to static baseline PNG
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

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uEarthRotationSpeed;
  uniform float uSunGlintIntensity;
  uniform vec2 uResolution;
  uniform bool uReducedMotion;

  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 uv = vUv;

    // Reduced motion fallback
    if (uReducedMotion) {
      gl_FragColor = texture2D(uTexture, uv);
      return;
    }

    // 1. EARTH SPHERICAL HORIZON MASK & INDEPENDENT ROTATION
    vec2 earthCenter = vec2(0.50, -0.68);
    vec2 distVec = uv - earthCenter;
    float aspect = uResolution.x / uResolution.y;
    distVec.x *= aspect;
    float distToCenter = length(distVec);

    float earthRadius = 1.16;
    float isEarth = smoothstep(earthRadius + 0.005, earthRadius - 0.005, distToCenter);

    // Independent Earth surface rotation
    vec2 earthUv = uv;
    if (isEarth > 0.001) {
      float rotOffset = uTime * uEarthRotationSpeed;
      float r = clamp(distToCenter / earthRadius, 0.0, 1.0);
      float sphereFactor = sqrt(max(0.0, 1.0 - r * r));
      earthUv.x -= rotOffset * (0.012 + 0.008 * sphereFactor);
      earthUv.x = fract(earthUv.x);
    }

    vec2 finalUv = mix(uv, earthUv, isEarth);

    // 2. NEBULA DRIFT & BREATHING
    if (isEarth < 0.5 && uv.y > 0.40) {
      float nebDriftX = sin(uTime * 0.15 + uv.y * 3.0) * 0.0015;
      float nebDriftY = cos(uTime * 0.12 + uv.x * 3.0) * 0.0012;
      finalUv += vec2(nebDriftX, nebDriftY) * smoothstep(0.35, 0.60, uv.y);
    }

    vec4 col = texture2D(uTexture, finalUv);

    // 3. ORION CONSTELLATION STELLAR SCINTILLATION (7 Major Stars)
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
      if (r < 0.035) {
        float phase = float(i) * 1.731;
        float sparkle = sin(uTime * (1.2 + float(i) * 0.3) + phase) * 0.5 + 0.5;
        sparkle = pow(sparkle, 2.0) * 0.12;
        float starFalloff = smoothstep(0.035, 0.0, r);
        orionSparkleBoost += sparkle * starFalloff;
      }
    }

    // 4. GENERAL STARFIELD MICROSCOPIC TWINKLE
    if (isEarth < 0.2 && uv.y > 0.45) {
      float starGrid = hash(floor(uv * vec2(180.0 * aspect, 180.0)));
      if (starGrid > 0.96) {
        float t = sin(uTime * 2.5 + starGrid * 62.8) * 0.5 + 0.5;
        float microTwinkle = t * 0.08 * smoothstep(0.96, 1.0, starGrid);
        col.rgb += vec3(0.7, 0.85, 1.0) * microTwinkle;
      }
    }

    col.rgb += vec3(0.8, 0.9, 1.0) * orionSparkleBoost;

    // 5. SUNLIGHT LOCALIZED PERIODIC GLINT & ATMOSPHERE SHIMMER
    vec2 sunPos = vec2(0.725, 0.435);
    vec2 sunDistVec = uv - sunPos;
    sunDistVec.x *= aspect;
    float sunDist = length(sunDistVec);

    if (uSunGlintIntensity > 1.001) {
      float glintFactor = uSunGlintIntensity - 1.0;
      float sunMask = smoothstep(0.25, 0.0, sunDist);
      vec3 glintColor = vec3(1.0, 0.88, 0.72) * (glintFactor * 1.5 * sunMask);
      
      float rimMask = smoothstep(0.08, 0.0, abs(distToCenter - earthRadius)) * smoothstep(0.40, 0.85, uv.x);
      vec3 atmGlintColor = vec3(0.35, 0.75, 1.0) * (glintFactor * 0.8 * rimMask);

      col.rgb += glintColor + atmGlintColor;
    }

    gl_FragColor = col;
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

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    // Load master baseline visual source of truth
    const textureLoader = new THREE.TextureLoader();
    const baselineTexture = textureLoader.load('/orion9-space-baseline.png', () => {
      baselineTexture.colorSpace = THREE.SRGBColorSpace;
      baselineTexture.minFilter = THREE.LinearFilter;
      baselineTexture.magFilter = THREE.LinearFilter;
    });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isStatic = prefersReducedMotion || qualityTier === 'LOW' || (qualityTier as string) === 'STATIC';

    const uniforms = {
      uTexture: { value: baselineTexture },
      uTime: { value: 0 },
      uEarthRotationSpeed: { value: (Math.PI * 2) / (rotationSpeedSeconds * 60) },
      uSunGlintIntensity: { value: 1.0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uReducedMotion: { value: isStatic },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });

    const planeGeometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(planeGeometry, material);
    scene.add(mesh);

    const handleResize = () => {
      if (!canvas || !renderer) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      uniforms.uResolution.value.set(width, height);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Sunlight Glint State & Timing (Every ~5-12 seconds pseudo-random)
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

      const elapsed = clock.getElapsedTime();
      uniforms.uTime.value = elapsed;

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
          uniforms.uSunGlintIntensity.value = 1.0 + glintCurve * 0.15;
        } else {
          glintActive = false;
          uniforms.uSunGlintIntensity.value = 1.0;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      running = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      planeGeometry.dispose();
      material.dispose();
      baselineTexture.dispose();
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
