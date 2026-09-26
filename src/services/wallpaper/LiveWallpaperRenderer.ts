/**
 * ORION-9 AUTHORITATIVE LIVE WALLPAPER RENDERER SERVICE (V2)
 * Pure WebGL / Three.js Renderer driven by LiveSceneDefinitions & AI Motion Director.
 *
 * Requirements:
 * 1. Uses renderer.setAnimationLoop() for 60 FPS WebGL rendering.
 * 2. In STILL mode: setAnimationLoop(null) — loop is completely STOPPED.
 * 3. Measured FPS Telemetry — reports true measured FPS, never hardcoded numbers.
 * 4. Scene-aware layer motion (planet, clouds, atmosphere, stars, nebula, lights).
 */

import * as THREE from 'three';
import { LiveSceneDefinition, LiveSceneLayer, QualityTier, WallpaperMode } from '../../types/wallpaper';

export interface RendererTelemetry {
  fps: number;
  status: 'RUNNING' | 'PAUSED' | 'STILL' | 'FALLBACK';
  rendererType: 'WebGL2' | 'WebGL' | 'STATIC';
  activeLayersCount: number;
  mode: WallpaperMode;
}

export class LiveWallpaperRenderer {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;

  // Scene Objects
  private earthGroup: THREE.Group | null = null;
  private earthMesh: THREE.Mesh | null = null;
  private cloudMesh: THREE.Mesh | null = null;
  private atmosphereMesh: THREE.Mesh | null = null;
  private starfieldPoints: THREE.Points | null = null;
  private nebulaMesh: THREE.Mesh | null = null;

  // Shaders & Materials
  private nightTexture: THREE.CanvasTexture | null = null;
  private earthMaterial: THREE.ShaderMaterial | null = null;
  private atmosphereMaterial: THREE.ShaderMaterial | null = null;

  // Animation & Telemetry State
  private sceneDefinition: LiveSceneDefinition | null = null;
  private qualityTier: QualityTier = 'MEDIUM';
  private running: boolean = false;
  private lastFrameTime: number = performance.now();
  private frameCount: number = 0;
  private currentFps: number = 60;
  private parallaxOffset = { x: 0, y: 0 };
  private activeMode: WallpaperMode = 'LIVE';

  private onTelemetryUpdate?: (telemetry: RendererTelemetry) => void;

  public initialize(
    canvas: HTMLCanvasElement, 
    sceneDef: LiveSceneDefinition, 
    quality: QualityTier = 'MEDIUM',
    onTelemetry?: (t: RendererTelemetry) => void
  ): void {
    this.canvas = canvas;
    this.sceneDefinition = sceneDef;
    this.qualityTier = quality;
    this.activeMode = sceneDef.mode || 'LIVE';
    this.onTelemetryUpdate = onTelemetry;

    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;

    // Create WebGL Renderer
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: quality !== 'LOW',
        powerPreference: 'high-performance',
      });
      this.renderer.setSize(width, height, false);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'HIGH' ? 2 : 1.5));
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    } catch (e) {
      console.error('[LiveWallpaperRenderer] WebGL context creation failed:', e);
      if (this.onTelemetryUpdate) {
        this.onTelemetryUpdate({
          fps: 0,
          status: 'FALLBACK',
          rendererType: 'STATIC',
          activeLayersCount: 0,
          mode: 'STILL',
        });
      }
      return;
    }

    // Create Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 9);

    // Build Scene Layers from LiveSceneDefinition
    this.buildSceneLayers(sceneDef);

    // Register Resize Event
    window.addEventListener('resize', this.handleResize);

    // Apply STILL vs LIVE mode loop configuration
    if (this.activeMode === 'STILL') {
      this.renderStillFrame();
    } else {
      this.startLiveLoop();
    }
  }

  /**
   * Builds procedural WebGL meshes and shaders according to LiveSceneDefinition layers.
   */
  private buildSceneLayers(sceneDef: LiveSceneDefinition): void {
    if (!this.scene) return;

    // 1. Starfield Background Layer
    const starLayer = sceneDef.layers.find(l => l.type === 'starfield' && l.enabled);
    if (starLayer && this.qualityTier !== 'LOW') {
      const starCount = this.qualityTier === 'HIGH' ? 1200 : 700;
      const starGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(starCount * 3);
      const sizes = new Float32Array(starCount);

      for (let i = 0; i < starCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 25;
        positions[i * 3 + 2] = -5 - Math.random() * 15;
        sizes[i] = 1.0 + Math.random() * 2.0;
      }

      starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      const starMat = new THREE.PointsMaterial({
        color: 0x93c5fd,
        size: 1.5,
        transparent: true,
        opacity: starLayer.opacity ?? 0.85,
        blending: THREE.AdditiveBlending,
      });

      this.starfieldPoints = new THREE.Points(starGeo, starMat);
      this.scene.add(this.starfieldPoints);
    }

    // 2. 3D Earth Group (Planet, Clouds, Atmosphere, City Lights)
    const planetLayer = sceneDef.layers.find(l => l.type === 'planet' && l.enabled);
    if (planetLayer) {
      this.earthGroup = new THREE.Group();

      const loader = new THREE.TextureLoader();
      const dayTexture = loader.load('/textures/earth_atmos_2048.jpg');
      const cloudTexture = loader.load('/textures/earth_clouds_1024.png');

      // Create procedural night city lights canvas
      const nightCanvas = this.createNightLightsCanvas();
      this.nightTexture = new THREE.CanvasTexture(nightCanvas);
      this.nightTexture.colorSpace = THREE.SRGBColorSpace;

      const sunDir = new THREE.Vector3(-0.8, 0.35, 0.5).normalize();

      // Earth Surface Shader Material
      this.earthMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uDayTexture: { value: dayTexture },
          uNightTexture: { value: this.nightTexture },
          uSunDirection: { value: sunDir },
          uShimmerTime: { value: 0 },
          uShimmerIntensity: { value: 0.25 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vSunDir;
          uniform vec3 uSunDirection;
          void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vSunDir = normalize(uSunDirection);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D uDayTexture;
          uniform sampler2D uNightTexture;
          uniform float uShimmerTime;
          uniform float uShimmerIntensity;
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vSunDir;

          void main() {
            vec3 dayColor = texture2D(uDayTexture, vUv).rgb;
            vec3 nightColor = texture2D(uNightTexture, vUv).rgb;
            float sunDot = dot(vNormal, vSunDir);
            float dayFactor = smoothstep(-0.25, 0.25, sunDot);

            // Subtle city light shimmer
            float shimmer = sin(uShimmerTime * 3.0 + vUv.x * 20.0) * 0.15 + 0.85;
            vec3 finalNight = nightColor * (1.0 + shimmer * uShimmerIntensity);

            vec3 color = mix(finalNight, dayColor * 1.1, dayFactor);
            gl_FragColor = vec4(color, 1.0);
          }
        `,
      });

      const earthGeo = new THREE.SphereGeometry(2.8, 64, 64);
      this.earthMesh = new THREE.Mesh(earthGeo, this.earthMaterial);
      this.earthGroup.add(this.earthMesh);

      // Cloud Layer
      const cloudLayer = sceneDef.layers.find(l => l.type === 'clouds' && l.enabled);
      if (cloudLayer && this.qualityTier === 'HIGH') {
        const cloudGeo = new THREE.SphereGeometry(2.835, 64, 64);
        const cloudMat = new THREE.MeshPhongMaterial({
          map: cloudTexture,
          transparent: true,
          opacity: cloudLayer.opacity ?? 0.75,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        this.cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
        this.earthGroup.add(this.cloudMesh);
      }

      // Atmosphere Layer
      const atmLayer = sceneDef.layers.find(l => l.type === 'atmosphere' && l.enabled);
      if (atmLayer && this.qualityTier !== 'LOW') {
        const atmGeo = new THREE.SphereGeometry(2.94, 64, 64);
        this.atmosphereMaterial = new THREE.ShaderMaterial({
          uniforms: {
            uBreatheTime: { value: 0 },
            uBreatheIntensity: { value: 0.15 },
          },
          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uBreatheTime;
            uniform float uBreatheIntensity;
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main() {
              vec3 viewDir = normalize(-vPosition);
              float intensity = pow(1.0 - abs(dot(vNormal, viewDir)), 3.2);
              float breathe = sin(uBreatheTime * 2.0) * 0.1 + 0.9;
              vec3 atmosphereColor = mix(vec3(0.12, 0.45, 0.95), vec3(0.22, 0.74, 0.98), intensity);
              gl_FragColor = vec4(atmosphereColor, intensity * 0.75 * breathe);
            }
          `,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false,
        });
        this.atmosphereMesh = new THREE.Mesh(atmGeo, this.atmosphereMaterial);
        this.earthGroup.add(this.atmosphereMesh);
      }

      // Position Earth lower-left
      this.earthGroup.position.set(-2.8, -2.4, 0);
      this.scene.add(this.earthGroup);
    }
  }

  /**
   * Generates city lights canvas texture.
   */
  private createNightLightsCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.fillStyle = '#020308';
    ctx.fillRect(0, 0, 1024, 512);

    ctx.fillStyle = '#ffb347';
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const r = Math.random() * 1.8 + 0.5;
      ctx.globalAlpha = Math.random() * 0.8 + 0.2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    return canvas;
  }

  /**
   * Updates renderer scene definition or mode dynamically.
   */
  public updateSceneDefinition(sceneDef: LiveSceneDefinition): void {
    this.sceneDefinition = sceneDef;
    const newMode = sceneDef.mode || 'LIVE';

    if (newMode !== this.activeMode) {
      this.activeMode = newMode;
      if (newMode === 'STILL') {
        this.stopLiveLoop();
        this.renderStillFrame();
      } else {
        this.startLiveLoop();
      }
    }
  }

  /**
   * Sets mouse parallax offset.
   */
  public setParallax(x: number, y: number): void {
    this.parallaxOffset = { x, y };
  }

  /**
   * STILL mode execution: Renders a single frame and STOPS animation loop.
   */
  public renderStillFrame(): void {
    this.stopLiveLoop();
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
    if (this.onTelemetryUpdate) {
      this.onTelemetryUpdate({
        fps: 0,
        status: 'STILL',
        rendererType: 'WebGL2',
        activeLayersCount: this.sceneDefinition?.layers?.filter(l => l.enabled).length || 0,
        mode: 'STILL',
      });
    }
  }

  /**
   * LIVE mode execution: Starts Three.js WebGL animation loop.
   */
  public startLiveLoop(): void {
    if (!this.renderer || this.running) return;
    this.running = true;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;

    this.renderer.setAnimationLoop((time: number) => {
      if (!this.running) return;
      this.renderFrame(time);
    });
  }

  /**
   * STOPS WebGL animation loop completely for STILL mode or unmount.
   */
  public stopLiveLoop(): void {
    this.running = false;
    if (this.renderer) {
      this.renderer.setAnimationLoop(null);
    }
  }

  /**
   * Executes a single WebGL frame render and updates motion shaders & telemetry.
   */
  private renderFrame(now: number): void {
    if (!this.renderer || !this.scene || !this.camera || !this.sceneDefinition) return;

    const elapsed = now * 0.001;
    const globalSpeed = this.sceneDefinition.globalMotion?.speed || 0.4;
    const globalIntensity = this.sceneDefinition.globalMotion?.intensity || 0.3;

    // Calculate actual measured FPS
    this.frameCount++;
    const delta = now - this.lastFrameTime;
    if (delta >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / delta);
      this.frameCount = 0;
      this.lastFrameTime = now;

      if (this.onTelemetryUpdate) {
        this.onTelemetryUpdate({
          fps: this.currentFps,
          status: 'RUNNING',
          rendererType: 'WebGL2',
          activeLayersCount: this.sceneDefinition.layers.filter(l => l.enabled).length,
          mode: 'LIVE',
        });
      }
    }

    // Apply scene-aware layer motions from LiveSceneDefinition instructions
    for (const layer of this.sceneDefinition.layers) {
      if (!layer.enabled || layer.motion.type === 'static') continue;

      const layerSpeed = (layer.motion.speed || 0.01) * globalSpeed;
      const rotAngle = elapsed * layerSpeed * Math.PI * 2;

      // Planet rotation
      if (layer.type === 'planet' && this.earthMesh) {
        this.earthMesh.rotation.y = rotAngle;
      }

      // Cloud independent drift
      if (layer.type === 'clouds' && this.cloudMesh) {
        this.cloudMesh.rotation.y = rotAngle * 1.12;
      }

      // Atmosphere breathing pulse
      if (layer.type === 'atmosphere' && this.atmosphereMaterial) {
        this.atmosphereMaterial.uniforms.uBreatheTime.value = elapsed * layerSpeed * 5.0;
        this.atmosphereMaterial.uniforms.uBreatheIntensity.value = (layer.motion.intensity || 0.15) * globalIntensity;
      }

      // City lights shimmer
      if (layer.type === 'light' && this.earthMaterial) {
        this.earthMaterial.uniforms.uShimmerTime.value = elapsed * layerSpeed * 8.0;
        this.earthMaterial.uniforms.uShimmerIntensity.value = (layer.motion.intensity || 0.25) * globalIntensity;
      }
    }

    // Apply Parallax to Earth Group
    if (this.earthGroup) {
      this.earthGroup.position.x = -2.8 + this.parallaxOffset.x * 0.3 * globalIntensity;
      this.earthGroup.position.y = -2.4 + this.parallaxOffset.y * 0.3 * globalIntensity;
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  private handleResize = (): void => {
    if (!this.canvas || !this.renderer || !this.camera) return;
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    if (this.activeMode === 'STILL') {
      this.renderStillFrame();
    }
  };

  /**
   * Cleanup and dispose WebGL renderer resources.
   */
  public dispose(): void {
    this.stopLiveLoop();
    window.removeEventListener('resize', this.handleResize);

    if (this.nightTexture) this.nightTexture.dispose();
    if (this.earthMaterial) this.earthMaterial.dispose();
    if (this.atmosphereMaterial) this.atmosphereMaterial.dispose();
    if (this.renderer) this.renderer.dispose();

    this.renderer = null;
    this.scene = null;
    this.camera = null;
  }
}

export const liveWallpaperRenderer = new LiveWallpaperRenderer();
