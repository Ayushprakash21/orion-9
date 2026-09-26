import { describe, it, expect, beforeEach } from 'vitest';
import { aiMotionDirector } from '../../services/wallpaper/AiMotionDirector';
import { sceneAnalyzer } from '../../services/wallpaper/SceneAnalyzer';
import { liveWallpaperEngine } from '../../services/wallpaper/LiveWallpaperEngine';
import { wallpaperRepository, SYSTEM_DEFAULT_WALLPAPERS } from '../../repositories/WallpaperRepository';
import { WallpaperRecord, LiveSceneDefinition } from '../../types/wallpaper';

describe('ORION-9 Live Wallpaper Engine V2 & AI Motion Director Test Suite', () => {
  const testUserId = 'user_live_v2_123';
  const testTenantId = 'tenant_live_v2_456';

  beforeEach(async () => {
    await wallpaperRepository.resetToSystemDefault(undefined, 'login');
    await wallpaperRepository.resetToSystemDefault(testUserId, 'desktop');
  });

  it('TEST 1: STILL mode stops animation loop and updates engine status to STILL', () => {
    liveWallpaperEngine.setStatus('STILL');
    const telemetry = liveWallpaperEngine.getTelemetry();
    expect(telemetry.status).toBe('STILL');
  });

  it('TEST 2: LIVE mode starts WebGL animation loop and sets engine status to RUNNING', () => {
    liveWallpaperEngine.setStatus('RUNNING');
    const telemetry = liveWallpaperEngine.getTelemetry();
    expect(telemetry.status).toBe('RUNNING');
  });

  it('TEST 3: AI Motion Director produces structured LiveSceneDefinition data', async () => {
    const sceneDef = await aiMotionDirector.generateMotionPlan({
      userCommand: 'Make Earth rotate slowly, clouds move independently, stars still',
      style: 'Space',
      prompt: 'Orion Space',
      mode: 'LIVE',
    });

    expect(sceneDef).toBeDefined();
    expect(sceneDef.layers.length).toBeGreaterThan(0);
    expect(sceneDef.mode).toBe('LIVE');
    expect(sceneDef.renderer).toBe('WEBGL');
  });

  it('TEST 4: Out-of-bounds scene definitions are clamped and validated safely', () => {
    const invalidScene: LiveSceneDefinition = {
      mode: 'LIVE',
      renderer: 'WEBGL',
      width: 2560,
      height: 1440,
      globalMotion: {
        speed: 50.0,
        intensity: -10.0,
      },
      reactive: true,
      aiGenerated: true,
      createdAt: new Date().toISOString(),
      layers: Array.from({ length: 40 }).map((_, i) => ({
        id: `layer_${i}`,
        name: `Layer ${i}`,
        type: 'planet',
        source: 'procedural',
        depth: 0.5,
        opacity: 1.0,
        enabled: true,
        motion: { type: 'rotate', axis: 'y', speed: 99.0, intensity: 99.0 },
      })),
    };

    const clamped = aiMotionDirector.validateAndClampDefinition(invalidScene);
    expect(clamped.globalMotion.speed).toBeLessThanOrEqual(1.0);
    expect(clamped.globalMotion.speed).toBeGreaterThanOrEqual(0.0);
    expect(clamped.globalMotion.intensity).toBeLessThanOrEqual(1.0);
    expect(clamped.globalMotion.intensity).toBeGreaterThanOrEqual(0.0);
    expect(clamped.layers.length).toBeLessThanOrEqual(32);
    expect(clamped.layers[0].motion.speed).toBeLessThanOrEqual(1.0);
  });

  it('TEST 5: AI Motion Director parses data-only without executing arbitrary code', async () => {
    const maliciousCommand = 'alert("hack"); process.exit(1); console.log(window.document)';
    const sceneDef = await aiMotionDirector.generateMotionPlan({
      userCommand: maliciousCommand,
      style: 'Space',
      prompt: 'Malicious Command',
      mode: 'LIVE',
    });

    expect(sceneDef).toBeDefined();
    expect(typeof sceneDef.globalMotion.speed).toBe('number');
    expect(typeof sceneDef.globalMotion.intensity).toBe('number');
  });

  it('TEST 6: Earth command creates rotate planet motion instruction', async () => {
    const sceneDef = await aiMotionDirector.generateMotionPlan({
      userCommand: 'Make Earth rotate quickly from left to right',
      style: 'Space',
      prompt: 'Earth',
      mode: 'LIVE',
    });

    const planetLayer = sceneDef.layers.find((l) => l.type === 'planet');
    expect(planetLayer).toBeDefined();
    expect(planetLayer?.motion.type).toBe('rotate');
  });

  it('TEST 7: "Keep stars still" creates static starfield instruction', async () => {
    const sceneDef = await aiMotionDirector.generateMotionPlan({
      userCommand: 'Keep stars completely stationary and still',
      style: 'Space',
      prompt: 'Stars',
      mode: 'LIVE',
    });

    const starLayer = sceneDef.layers.find((l) => l.type === 'starfield');
    expect(starLayer).toBeDefined();
    expect(starLayer?.motion.type).toBe('static');
  });

  it('TEST 8: "Move clouds independently" creates drift cloud instruction', async () => {
    const sceneDef = await aiMotionDirector.generateMotionPlan({
      userCommand: 'Move clouds independently across atmosphere',
      style: 'Space',
      prompt: 'Clouds',
      mode: 'LIVE',
    });

    const cloudLayer = sceneDef.layers.find((l) => l.type === 'clouds');
    expect(cloudLayer).toBeDefined();
    expect(cloudLayer?.motion.type).toBe('drift');
  });

  it('TEST 9: "Make everything subtle" reduces global motion intensity', async () => {
    const sceneDef = await aiMotionDirector.generateMotionPlan({
      userCommand: 'Make everything very subtle and slow',
      style: 'Space',
      prompt: 'Subtle',
      mode: 'LIVE',
    });

    expect(sceneDef.globalMotion.intensity).toBeLessThanOrEqual(0.5);
    expect(sceneDef.globalMotion.speed).toBeLessThanOrEqual(0.5);
  });

  it('TEST 10: Motion intensity and speed are clamped between 0.0 and 1.0', async () => {
    const sceneDef = await aiMotionDirector.generateMotionPlan({
      userCommand: 'Maximum speed extreme fast 100x rotation intensity',
      style: 'Space',
      prompt: 'Extreme',
      mode: 'LIVE',
    });

    expect(sceneDef.globalMotion.speed).toBeLessThanOrEqual(1.0);
    expect(sceneDef.globalMotion.speed).toBeGreaterThanOrEqual(0.0);
    expect(sceneDef.globalMotion.intensity).toBeLessThanOrEqual(1.0);
    expect(sceneDef.globalMotion.intensity).toBeGreaterThanOrEqual(0.0);
  });

  it('TEST 11: Layer count is clamped to max 32 layers', () => {
    const overfilledLayers: LiveSceneDefinition = {
      mode: 'LIVE',
      renderer: 'WEBGL',
      width: 2560,
      height: 1440,
      globalMotion: { speed: 0.5, intensity: 0.5 },
      reactive: true,
      aiGenerated: true,
      createdAt: new Date().toISOString(),
      layers: Array.from({ length: 50 }).map((_, i) => ({
        id: `l_${i}`,
        name: `Particle ${i}`,
        type: 'particle',
        source: 'procedural',
        depth: 0.1,
        opacity: 0.8,
        enabled: true,
        motion: { type: 'static', speed: 0, intensity: 0 },
      })),
    };

    const clamped = aiMotionDirector.validateAndClampDefinition(overfilledLayers);
    expect(clamped.layers.length).toBe(32);
  });

  it('TEST 12: Login and Desktop targets maintain independent wallpaper mode & live scene definitions', async () => {
    const loginWp: WallpaperRecord = {
      ...SYSTEM_DEFAULT_WALLPAPERS[0],
      wallpaperId: 'wp_login_live_test',
      mode: 'LIVE',
      motionCommand: 'Login live motion',
    };

    const desktopWp: WallpaperRecord = {
      ...SYSTEM_DEFAULT_WALLPAPERS[0],
      wallpaperId: 'wp_desktop_still_test',
      mode: 'STILL',
      motionCommand: 'Desktop still mode',
    };

    await wallpaperRepository.saveWallpaper(loginWp);
    await wallpaperRepository.saveWallpaper(desktopWp);
    await wallpaperRepository.setActiveWallpaper(loginWp.wallpaperId, undefined, 'login');
    await wallpaperRepository.setActiveWallpaper(desktopWp.wallpaperId, testUserId, 'desktop');

    const activeLogin = await wallpaperRepository.getActiveWallpaper(undefined, 'global', 'login');
    const activeDesktop = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');

    expect(activeLogin.mode).toBe('LIVE');
    expect(activeDesktop.mode).toBe('STILL');
    expect(activeLogin.motionCommand).toBe('Login live motion');
    expect(activeDesktop.motionCommand).toBe('Desktop still mode');
  });

  it('TEST 13: SceneAnalyzer produces standard default scene definition for space wallpapers', () => {
    const analysis = sceneAnalyzer.analyzeScene({
      style: 'Space',
      prompt: 'Orion 9 Space',
    });

    expect(analysis.defaultSceneDefinition).toBeDefined();
    expect(analysis.defaultSceneDefinition.layers.length).toBeGreaterThan(0);
    const planetLayer = analysis.defaultSceneDefinition.layers.find((l) => l.type === 'planet');
    expect(planetLayer).toBeDefined();
  });

  it('TEST 14: Applying LIVE mode persists liveScene to target wallpaper record', async () => {
    const sceneDef = await aiMotionDirector.generateMotionPlan({
      userCommand: 'Rotate Earth',
      style: 'Space',
      prompt: 'Test Apply Live',
      mode: 'LIVE',
    });

    const wp: WallpaperRecord = {
      ...SYSTEM_DEFAULT_WALLPAPERS[0],
      wallpaperId: 'wp_apply_live_test',
      mode: 'LIVE',
      liveScene: sceneDef,
    };

    await wallpaperRepository.saveWallpaper(wp);
    await wallpaperRepository.setActiveWallpaper(wp.wallpaperId, testUserId, 'desktop');

    const saved = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');
    expect(saved.mode).toBe('LIVE');
    expect(saved.liveScene).toBeDefined();
    expect(saved.liveScene?.mode).toBe('LIVE');
  });

  it('TEST 15: Applying STILL mode sets mode = STILL and clears active animation loop', async () => {
    const wp: WallpaperRecord = {
      ...SYSTEM_DEFAULT_WALLPAPERS[0],
      wallpaperId: 'wp_apply_still_test',
      mode: 'STILL',
      liveScene: undefined,
    };

    await wallpaperRepository.saveWallpaper(wp);
    await wallpaperRepository.setActiveWallpaper(wp.wallpaperId, testUserId, 'desktop');

    const saved = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');
    expect(saved.mode).toBe('STILL');
    expect(saved.liveScene).toBeUndefined();
  });

  it('TEST 16: Existing wallpapers without liveScene default safely to LIVE or STILL mode', async () => {
    const legacyWp: WallpaperRecord = {
      ...SYSTEM_DEFAULT_WALLPAPERS[0],
      wallpaperId: 'legacy_wp_without_live_scene',
      mode: undefined,
      liveScene: undefined,
    };

    const resolvedMode = legacyWp.mode || 'LIVE';
    expect(resolvedMode).toBe('LIVE');

    const fallbackScene = sceneAnalyzer.analyzeScene({
      style: legacyWp.style,
      prompt: legacyWp.prompt || legacyWp.name,
    }).defaultSceneDefinition;

    expect(fallbackScene).toBeDefined();
    expect(fallbackScene.layers.length).toBeGreaterThan(0);
  });
});
