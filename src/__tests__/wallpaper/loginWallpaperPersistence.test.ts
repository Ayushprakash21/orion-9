import { describe, it, expect, beforeEach } from 'vitest';
import { wallpaperRepository, SYSTEM_DEFAULT_WALLPAPERS, DEFAULT_LOGIN_WALLPAPER } from '../../repositories/WallpaperRepository';
import { WallpaperRecord } from '../../types/wallpaper';

describe('ORION-9 Target Persistence & Candidate Isolation Suite', () => {
  const testUserId = 'user_persistence_123';
  const testTenantId = 'tenant_persistence_abc';

  beforeEach(async () => {
    // Reset login & desktop selections to system default before each test
    await wallpaperRepository.resetToSystemDefault(undefined, 'login');
    await wallpaperRepository.resetToSystemDefault(testUserId, 'desktop');
  });

  it('1. LOGIN target selection persists in repository memory and local cache', async () => {
    const customLoginWp: WallpaperRecord = {
      wallpaperId: 'login_custom_wp_99',
      tenantId: 'global',
      ownerType: 'USER',
      ownerId: 'system',
      name: 'Custom Login Test Wallpaper',
      assetUrl: '/wallpaper/custom-login.png',
      thumbnailUrl: '/wallpaper/custom-login.png',
      source: 'UPLOAD',
      aiGenerated: false,
      width: 2560,
      height: 1440,
      aspectRatio: '16:9',
      motionProfile: SYSTEM_DEFAULT_WALLPAPERS[0].motionProfile,
      runtimeReactive: true,
      environment: 'DEMO',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await wallpaperRepository.saveWallpaper(customLoginWp);
    await wallpaperRepository.setActiveWallpaper(customLoginWp.wallpaperId, undefined, 'login');

    const activeLogin = await wallpaperRepository.getActiveWallpaper(undefined, 'global', 'login');
    expect(activeLogin.wallpaperId).toBe('login_custom_wp_99');
  });

  it('2. DESKTOP target selection persists independently of LOGIN target selection', async () => {
    const customDesktopWp: WallpaperRecord = {
      wallpaperId: 'desktop_custom_wp_88',
      tenantId: testTenantId,
      ownerType: 'USER',
      ownerId: testUserId,
      name: 'Custom Desktop Test Wallpaper',
      assetUrl: '/wallpaper/custom-desktop.png',
      thumbnailUrl: '/wallpaper/custom-desktop.png',
      source: 'UPLOAD',
      aiGenerated: false,
      width: 2560,
      height: 1440,
      aspectRatio: '16:9',
      motionProfile: SYSTEM_DEFAULT_WALLPAPERS[0].motionProfile,
      runtimeReactive: true,
      environment: 'DEMO',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await wallpaperRepository.saveWallpaper(customDesktopWp);
    await wallpaperRepository.setActiveWallpaper(customDesktopWp.wallpaperId, testUserId, 'desktop');

    const activeDesktop = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');
    const activeLogin = await wallpaperRepository.getActiveWallpaper(undefined, 'global', 'login');

    expect(activeDesktop.wallpaperId).toBe('desktop_custom_wp_88');
    expect(activeLogin.wallpaperId).toBe(DEFAULT_LOGIN_WALLPAPER.wallpaperId);
  });

  it('3. Generating candidate AI wallpapers does NOT override active login or desktop wallpaper', async () => {
    // Set active login to system default
    const initialLogin = await wallpaperRepository.getActiveWallpaper(undefined, 'global', 'login');

    // Simulate saving candidate wallpapers created by AI generator
    const candidateWp: WallpaperRecord = {
      wallpaperId: 'ai_candidate_unapplied_77',
      tenantId: 'global',
      ownerType: 'USER',
      ownerId: testUserId,
      name: 'Unapplied AI Candidate',
      assetUrl: '/wallpaper/ai-candidate.png',
      thumbnailUrl: '/wallpaper/ai-candidate.png',
      source: 'AI',
      aiGenerated: true,
      width: 2560,
      height: 1440,
      aspectRatio: '16:9',
      motionProfile: SYSTEM_DEFAULT_WALLPAPERS[0].motionProfile,
      runtimeReactive: true,
      environment: 'DEMO',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await wallpaperRepository.saveWallpaper(candidateWp);

    // Verify active login and active desktop are UNCHANGED
    const activeLoginPostGen = await wallpaperRepository.getActiveWallpaper(undefined, 'global', 'login');
    const activeDesktopPostGen = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');

    expect(activeLoginPostGen.wallpaperId).toBe(initialLogin.wallpaperId);
    expect(activeDesktopPostGen.wallpaperId).toBe(SYSTEM_DEFAULT_WALLPAPERS[0].wallpaperId);
    expect(activeLoginPostGen.wallpaperId).not.toBe('ai_candidate_unapplied_77');
  });

  it('4. Resetting LOGIN restores default Earth wallpaper without touching DESKTOP', async () => {
    // Set desktop to custom
    await wallpaperRepository.setActiveWallpaper(SYSTEM_DEFAULT_WALLPAPERS[1].wallpaperId, testUserId, 'desktop');

    // Reset login
    const resetLogin = await wallpaperRepository.resetToSystemDefault(undefined, 'login');
    const activeDesktop = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');

    expect(resetLogin.wallpaperId).toBe(DEFAULT_LOGIN_WALLPAPER.wallpaperId);
    expect(activeDesktop.wallpaperId).toBe(SYSTEM_DEFAULT_WALLPAPERS[1].wallpaperId);
  });
});
