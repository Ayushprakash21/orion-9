/**
 * ORION-9 AUTHORITATIVE ENVIRONMENT & WALLPAPER INVARIANT TEST SUITE
 * Verifies single environment authority, truthful AI status, 3-candidate validation,
 * Cloud Firestore wallpaper persistence, and system default Orion Aurora Space wallpaper.
 */

import { describe, it, expect } from 'vitest';
import { environmentService } from '../../operations/EnvironmentService';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { aiWallpaperGenerator } from '../../services/wallpaper/AiWallpaperGenerator';
import { wallpaperRepository, SYSTEM_DEFAULT_WALLPAPERS } from '../../repositories/WallpaperRepository';

describe('ORION-9 Single Authoritative Environment & Wallpaper Invariants', () => {

  it('1. verifies environmentService and dbManager share the exact same authoritative operating environment', () => {
    const serviceEnv = environmentService.getOperatingEnvironment();
    const dbEnv = dbManager.getEnvironment();
    expect(serviceEnv).toBe(dbEnv);
    expect(environmentService.isDemo()).toBe(dbEnv === 'DEMO');
    expect(environmentService.isLive()).toBe(dbEnv === 'LIVE');
  });

  it('2. verifies environment subscription receives reactive updates on environment change', async () => {
    let observedEnv = environmentService.getOperatingEnvironment();
    const unsubscribe = environmentService.subscribeEnvironment((newEnv) => {
      observedEnv = newEnv;
    });

    const targetEnv = observedEnv === 'DEMO' ? 'LIVE' : 'DEMO';
    const switchResult = await environmentService.switchEnvironment({
      targetEnvironment: targetEnv,
      actorUserId: 'admin-test',
      actorRole: 'platform_admin',
      callerType: 'human_admin',
      stepUpConfirmed: true,
    });

    expect(switchResult.success).toBe(true);
    expect(environmentService.getOperatingEnvironment()).toBe(targetEnv);
    expect(dbManager.getEnvironment()).toBe(targetEnv);
    expect(observedEnv).toBe(targetEnv);

    unsubscribe();
  });

  it('3. verifies AI Wallpaper Provider status check returns truthful state', async () => {
    const status = await aiWallpaperGenerator.checkProviderStatus();
    expect(typeof status.providerConfigured).toBe('boolean');
    expect(typeof status.configured).toBe('boolean');
    expect(typeof status.providerName).toBe('string');
    expect(typeof status.model).toBe('string');
    expect(status.providerName).toContain('Google Gemini');
  });

  it('4. verifies AI generation candidate validation enforces contract (exactly 3 candidates)', async () => {
    const candidates = await aiWallpaperGenerator.generateCandidates({
      prompt: 'Orion Aurora Space Environment with deep navy space',
      style: 'Space',
      atmosphereIntensity: 0.8,
      motionPreference: 'Atmospheric',
      width: 2560,
      height: 1440,
    });

    expect(Array.isArray(candidates)).toBe(true);
    expect(candidates.length).toBe(3);

    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      expect(c.candidateId).toBeDefined();
      expect(c.assetUrl).toBeDefined();
      expect(c.assetUrl.length).toBeGreaterThan(10);
    }
  });

  it('5. verifies primary system default wallpaper is Orion Aurora Space (no gold SCM world map)', () => {
    const primaryDefault = SYSTEM_DEFAULT_WALLPAPERS[0];
    expect(primaryDefault.wallpaperId).toBe('sys-orion-aurora-space');
    expect(primaryDefault.name).toBe('Orion Aurora Space Environment');
    expect(primaryDefault.name).not.toContain('SCM Global Logistics Network');
    expect(primaryDefault.assetUrl).not.toContain('global-network.jpg');
  });

  it('6. verifies wallpaper repository persists and retrieves active selection', async () => {
    const initialWp = await wallpaperRepository.getActiveWallpaper('user_test_001');
    expect(initialWp).toBeDefined();
    expect(initialWp.assetUrl).toBeDefined();

    const newWp = await wallpaperRepository.setActiveWallpaper(SYSTEM_DEFAULT_WALLPAPERS[1].wallpaperId, 'user_test_001');
    expect(newWp.wallpaperId).toBe(SYSTEM_DEFAULT_WALLPAPERS[1].wallpaperId);

    const activeAfterSet = await wallpaperRepository.getActiveWallpaper('user_test_001');
    expect(activeAfterSet.wallpaperId).toBe(SYSTEM_DEFAULT_WALLPAPERS[1].wallpaperId);
  });
});
