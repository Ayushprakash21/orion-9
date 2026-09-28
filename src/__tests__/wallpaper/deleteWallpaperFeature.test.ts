import { describe, it, expect, beforeEach } from 'vitest';
import { 
  wallpaperRepository, 
  SYSTEM_DEFAULT_WALLPAPERS, 
  DEFAULT_LOGIN_WALLPAPER, 
  DEFAULT_DESKTOP_WALLPAPER 
} from '../../repositories/WallpaperRepository';
import { WallpaperRecord } from '../../types/wallpaper';

describe('ORION-9 Wallpaper Studio Delete & Target Isolation Test Suite', () => {
  const testUserId = 'test_del_user_123';
  const testTenantId = 'test_tenant_xyz';

  beforeEach(async () => {
    // Reset to defaults
    await wallpaperRepository.resetToSystemDefault(undefined, 'login');
    await wallpaperRepository.resetToSystemDefault(testUserId, 'desktop');
  });

  it('TEST 1: System default wallpapers cannot be deleted', async () => {
    const sysWp = SYSTEM_DEFAULT_WALLPAPERS[0];
    await expect(
      wallpaperRepository.deleteWallpaper(sysWp.wallpaperId, testUserId, 'desktop')
    ).rejects.toThrow('System default wallpapers cannot be deleted');
  });

  it('TEST 2: Deleting an inactive user wallpaper removes it from available wallpapers', async () => {
    const customWp: WallpaperRecord = {
      wallpaperId: 'user_wp_del_test_1',
      tenantId: testTenantId,
      ownerType: 'USER',
      ownerId: testUserId,
      name: 'Custom Deletable Wallpaper',
      assetUrl: '/wallpaper/custom-deletable.png',
      thumbnailUrl: '/wallpaper/custom-deletable.png',
      source: 'UPLOAD',
      target: 'desktop',
      width: 2560,
      height: 1440,
      aspectRatio: '16:9',
      mode: 'STILL',
      status: 'APPROVED',
      aiGenerated: false,
      environment: 'DEMO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await wallpaperRepository.saveWallpaper(customWp, 'desktop');
    let available = await wallpaperRepository.getAvailableWallpapers(testTenantId, testUserId, 'desktop');
    expect(available.some(w => w.wallpaperId === customWp.wallpaperId)).toBe(true);

    const result = await wallpaperRepository.deleteWallpaper(customWp.wallpaperId, testUserId, 'desktop');
    expect(result.success).toBe(true);
    expect(result.replacementWallpaper).toBeUndefined();

    available = await wallpaperRepository.getAvailableWallpapers(testTenantId, testUserId, 'desktop');
    expect(available.some(w => w.wallpaperId === customWp.wallpaperId)).toBe(false);
  });

  it('TEST 3: Deleting the currently active desktop wallpaper falls back to system default', async () => {
    const activeCustomWp: WallpaperRecord = {
      wallpaperId: 'user_active_wp_del_2',
      tenantId: testTenantId,
      ownerType: 'USER',
      ownerId: testUserId,
      name: 'Active Custom Wallpaper',
      assetUrl: '/wallpaper/active-custom.png',
      thumbnailUrl: '/wallpaper/active-custom.png',
      source: 'AI',
      target: 'desktop',
      width: 2560,
      height: 1440,
      aspectRatio: '16:9',
      mode: 'STILL',
      status: 'APPROVED',
      aiGenerated: false,
      environment: 'DEMO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await wallpaperRepository.saveWallpaper(activeCustomWp, 'desktop');
    await wallpaperRepository.setActiveWallpaper(activeCustomWp.wallpaperId, testUserId, 'desktop');

    let current = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');
    expect(current.wallpaperId).toBe(activeCustomWp.wallpaperId);

    // Delete active wallpaper
    const result = await wallpaperRepository.deleteWallpaper(activeCustomWp.wallpaperId, testUserId, 'desktop');
    expect(result.success).toBe(true);
    expect(result.replacementWallpaper).toBeDefined();
    expect(result.replacementWallpaper?.wallpaperId).toBe(DEFAULT_DESKTOP_WALLPAPER.wallpaperId);

    // Verify active is restored to default
    current = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');
    expect(current.wallpaperId).toBe(DEFAULT_DESKTOP_WALLPAPER.wallpaperId);
  });

  it('TEST 4: Deleting active LOGIN wallpaper falls back to DEFAULT_LOGIN_WALLPAPER and leaves DESKTOP untouched', async () => {
    // 1. Set custom wallpaper for login
    const loginWp: WallpaperRecord = {
      wallpaperId: 'login_custom_wp_3',
      tenantId: 'global',
      ownerType: 'USER',
      ownerId: testUserId,
      name: 'Custom Login Wallpaper',
      assetUrl: '/wallpaper/custom-login.png',
      thumbnailUrl: '/wallpaper/custom-login.png',
      source: 'AI',
      target: 'login',
      width: 2560,
      height: 1440,
      aspectRatio: '16:9',
      mode: 'STILL',
      status: 'APPROVED',
      aiGenerated: false,
      environment: 'DEMO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 2. Set custom wallpaper for desktop
    const desktopWp: WallpaperRecord = {
      wallpaperId: 'desktop_custom_wp_3',
      tenantId: testTenantId,
      ownerType: 'USER',
      ownerId: testUserId,
      name: 'Custom Desktop Wallpaper',
      assetUrl: '/wallpaper/custom-desktop.png',
      thumbnailUrl: '/wallpaper/custom-desktop.png',
      source: 'UPLOAD',
      target: 'desktop',
      width: 2560,
      height: 1440,
      aspectRatio: '16:9',
      mode: 'STILL',
      status: 'APPROVED',
      aiGenerated: false,
      environment: 'DEMO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await wallpaperRepository.saveWallpaper(loginWp, 'login');
    await wallpaperRepository.setActiveWallpaper(loginWp.wallpaperId, undefined, 'login');

    await wallpaperRepository.saveWallpaper(desktopWp, 'desktop');
    await wallpaperRepository.setActiveWallpaper(desktopWp.wallpaperId, testUserId, 'desktop');

    // Delete login wallpaper
    const result = await wallpaperRepository.deleteWallpaper(loginWp.wallpaperId, undefined, 'login');
    expect(result.success).toBe(true);
    expect(result.replacementWallpaper?.wallpaperId).toBe(DEFAULT_LOGIN_WALLPAPER.wallpaperId);

    // Active login should be default
    const currentLogin = await wallpaperRepository.getActiveWallpaper(undefined, 'global', 'login');
    expect(currentLogin.wallpaperId).toBe(DEFAULT_LOGIN_WALLPAPER.wallpaperId);

    // Active desktop should STILL be custom desktop wallpaper (ISOLATION VERIFIED)
    const currentDesktop = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');
    expect(currentDesktop.wallpaperId).toBe(desktopWp.wallpaperId);
  });

  it('TEST 5: System defaults do not contain SVG circle placeholder strings', () => {
    for (const wp of SYSTEM_DEFAULT_WALLPAPERS) {
      expect(wp.thumbnailUrl).not.toContain('<circle');
      expect(wp.assetUrl).not.toContain('<circle');
      expect(wp.assetUrl.startsWith('/')).toBe(true);
    }
  });
});
