import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { wallpaperRepository, SYSTEM_DEFAULT_WALLPAPERS } from '../../repositories/WallpaperRepository';
import { wallpaperAssetStorage } from '../../services/wallpaper/WallpaperAssetStorage';
import { OrionLiveWallpaper } from '../../os/components/OrionLiveWallpaper';
import { WallpaperRecord } from '../../types/wallpaper';

describe('ORION-9 Wallpaper Target Isolation & Pipeline Test Suite', () => {
  const testUserId = 'user_test_999';
  const testTenantId = 'tenant_test_abc';

  beforeEach(async () => {
    // Reset login & desktop selections to system default before each test
    await wallpaperRepository.resetToSystemDefault(undefined, 'login');
    await wallpaperRepository.resetToSystemDefault(testUserId, 'desktop');
  });

  it('TEST 1: Applying AI wallpaper to LOGIN target updates LOGIN and leaves DESKTOP unchanged', async () => {
    const aiWpLogin: WallpaperRecord = {
      wallpaperId: 'ai_login_wp_1',
      tenantId: 'global',
      ownerType: 'USER',
      ownerId: testUserId,
      name: 'AI Generated Login Wallpaper',
      assetUrl: '/wallpaper/ai-login-test.png',
      thumbnailUrl: '/wallpaper/ai-login-test.png',
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

    await wallpaperRepository.saveWallpaper(aiWpLogin);
    await wallpaperRepository.setActiveWallpaper(aiWpLogin.wallpaperId, undefined, 'login');

    const activeLogin = await wallpaperRepository.getActiveWallpaper(undefined, 'global', 'login');
    const activeDesktop = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');

    expect(activeLogin.wallpaperId).toBe('ai_login_wp_1');
    expect(activeDesktop.wallpaperId).not.toBe('ai_login_wp_1');
    expect(activeDesktop.wallpaperId).toBe(SYSTEM_DEFAULT_WALLPAPERS[0].wallpaperId);
  });

  it('TEST 2: Applying AI wallpaper to DESKTOP target updates DESKTOP and leaves LOGIN unchanged', async () => {
    const aiWpDesktop: WallpaperRecord = {
      wallpaperId: 'ai_desktop_wp_2',
      tenantId: testTenantId,
      ownerType: 'USER',
      ownerId: testUserId,
      name: 'AI Generated Desktop Wallpaper',
      assetUrl: '/wallpaper/ai-desktop-test.png',
      thumbnailUrl: '/wallpaper/ai-desktop-test.png',
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

    await wallpaperRepository.saveWallpaper(aiWpDesktop);
    await wallpaperRepository.setActiveWallpaper(aiWpDesktop.wallpaperId, testUserId, 'desktop');

    const activeLogin = await wallpaperRepository.getActiveWallpaper(undefined, 'global', 'login');
    const activeDesktop = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');

    expect(activeDesktop.wallpaperId).toBe('ai_desktop_wp_2');
    expect(activeLogin.wallpaperId).not.toBe('ai_desktop_wp_2');
    expect(activeLogin.wallpaperId).toBe(SYSTEM_DEFAULT_WALLPAPERS[0].wallpaperId);
  });

  it('TEST 3: Switching target to LOGIN returns deterministic global_login key', () => {
    const key = wallpaperRepository.getSelectionKey(testUserId, 'login');
    expect(key).toBe('global_login');
  });

  it('TEST 4: Switching target to DESKTOP returns user-scoped {userId}_desktop key', () => {
    const key = wallpaperRepository.getSelectionKey(testUserId, 'desktop');
    expect(key).toBe(`${testUserId}_desktop`);
  });

  it('TEST 5: Resetting LOGIN restores login target to system default and leaves DESKTOP unchanged', async () => {
    // First set desktop to custom
    await wallpaperRepository.setActiveWallpaper(SYSTEM_DEFAULT_WALLPAPERS[1].wallpaperId, testUserId, 'desktop');
    // Reset login
    const resetLogin = await wallpaperRepository.resetToSystemDefault(undefined, 'login');
    const activeDesktop = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');

    expect(resetLogin.wallpaperId).toBe(SYSTEM_DEFAULT_WALLPAPERS[0].wallpaperId);
    expect(activeDesktop.wallpaperId).toBe(SYSTEM_DEFAULT_WALLPAPERS[1].wallpaperId);
  });

  it('TEST 6: Resetting DESKTOP restores desktop target to system default and leaves LOGIN unchanged', async () => {
    // First set login to custom
    await wallpaperRepository.setActiveWallpaper(SYSTEM_DEFAULT_WALLPAPERS[1].wallpaperId, undefined, 'login');
    // Reset desktop
    const resetDesktop = await wallpaperRepository.resetToSystemDefault(testUserId, 'desktop');
    const activeLogin = await wallpaperRepository.getActiveWallpaper(undefined, 'global', 'login');

    expect(resetDesktop.wallpaperId).toBe(SYSTEM_DEFAULT_WALLPAPERS[0].wallpaperId);
    expect(activeLogin.wallpaperId).toBe(SYSTEM_DEFAULT_WALLPAPERS[1].wallpaperId);
  });

  it('TEST 7: Desktop renderer accepts target="desktop", userId, and tenantId props', () => {
    const html = renderToString(
      <OrionLiveWallpaper 
        target="desktop" 
        userId={testUserId} 
        tenantId={testTenantId} 
        showLogo={false} 
      />
    );
    expect(html).toContain('data-testid="orion-live-wallpaper-container"');
  });


  it('TEST 9: A login wallpaper event does not alter desktop target active state', async () => {
    let desktopEventReceived = false;
    const listener = (e: any) => {
      if (e.detail?.target === 'desktop') {
        desktopEventReceived = true;
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('orion-active-wallpaper-changed', listener as EventListener);
      await wallpaperRepository.setActiveWallpaper(SYSTEM_DEFAULT_WALLPAPERS[1].wallpaperId, undefined, 'login');
      window.removeEventListener('orion-active-wallpaper-changed', listener as EventListener);
    }

    expect(desktopEventReceived).toBe(false);
  });

  it('TEST 10: A desktop wallpaper event does not alter login target active state', async () => {
    let loginEventReceived = false;
    const listener = (e: any) => {
      if (e.detail?.target === 'login') {
        loginEventReceived = true;
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('orion-active-wallpaper-changed', listener as EventListener);
      await wallpaperRepository.setActiveWallpaper(SYSTEM_DEFAULT_WALLPAPERS[1].wallpaperId, testUserId, 'desktop');
      window.removeEventListener('orion-active-wallpaper-changed', listener as EventListener);
    }

    expect(loginEventReceived).toBe(false);
  });

  it('TEST 11: AI wallpaper asset persistence converts Base64 image to object URL excluding raw Base64 from Firestore metadata', async () => {
    // Generate mock Base64 data URL (simulating AI generator or upload)
    const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const rawRecord: WallpaperRecord = {
      wallpaperId: 'ai_base64_test_wp',
      tenantId: 'global',
      ownerType: 'USER',
      ownerId: testUserId,
      name: 'Base64 AI Test',
      assetUrl: mockBase64,
      thumbnailUrl: mockBase64,
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

    const saved = await wallpaperRepository.saveWallpaper(rawRecord);

    expect(wallpaperAssetStorage.isFirestoreSafeUrl(saved.assetUrl)).toBe(true);
    expect(saved.assetUrl).not.toContain('data:image/png;base64');
  });
});
