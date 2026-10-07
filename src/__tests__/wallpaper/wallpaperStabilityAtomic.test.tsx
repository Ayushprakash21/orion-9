import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OrionLiveWallpaper } from '../../os/components/OrionLiveWallpaper';
import { 
  wallpaperRepository, 
  DEFAULT_DESKTOP_WALLPAPER, 
  DEFAULT_LOGIN_WALLPAPER,
  SYSTEM_DEFAULT_WALLPAPERS 
} from '../../repositories/WallpaperRepository';
import { WallpaperRecord } from '../../types/wallpaper';

describe('ORION-9 Wallpaper Stability & Atomic Commit Subsystem', () => {
  const testUserId = 'test_user_stabilize';
  const testTenantId = 'tenant_stabilize';

  beforeEach(async () => {
    await wallpaperRepository.resetToSystemDefault(testUserId, 'desktop');
    await wallpaperRepository.resetToSystemDefault(undefined, 'login');
  });

  it('1. Wallpaper renders stable image container and img tag without flashing', () => {
    const html = renderToString(
      React.createElement(OrionLiveWallpaper, { 
        target: 'desktop',
        userId: testUserId,
        tenantId: testTenantId,
      })
    );

    expect(html).toContain('data-testid="orion-live-wallpaper-container"');
    expect(html).toContain('data-target="desktop"');
    expect(html).toContain('data-orion-wallpaper-image="true"');
    expect(html).toContain(DEFAULT_DESKTOP_WALLPAPER.assetUrl);
  });

  it('2. Target isolation: desktop and login operate independently', async () => {
    const desktopWp = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');
    const loginWp = await wallpaperRepository.getActiveWallpaper(undefined, 'global', 'login');

    expect(desktopWp.target).toBe('desktop');
    expect(loginWp.target).toBe('login');
    expect(desktopWp.assetUrl).toBe(DEFAULT_DESKTOP_WALLPAPER.assetUrl);
    expect(loginWp.assetUrl).toBe(DEFAULT_LOGIN_WALLPAPER.assetUrl);
    expect(desktopWp.assetUrl).not.toBe(loginWp.assetUrl);
  });

  it('3. Custom override wallpaper is rendered directly and atomically', () => {
    const customWp: WallpaperRecord = {
      wallpaperId: 'custom-graphite-wp',
      tenantId: 'global',
      ownerType: 'SYSTEM',
      ownerId: 'system',
      name: 'Custom Graphite',
      assetUrl: '/wallpaper/custom-graphite.png',
      thumbnailUrl: '/wallpaper/custom-graphite-thumb.png',
      source: 'SYSTEM',
      aiGenerated: false,
      target: 'desktop',
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
      environment: 'LIVE',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const html = renderToString(
      React.createElement(OrionLiveWallpaper, { 
        target: 'desktop',
        overrideWallpaper: customWp,
      })
    );

    expect(html).toContain('data-orion-wallpaper-image="true"');
    expect(html).toContain('/wallpaper/custom-graphite.png');
  });

  it('4. Default login wallpaper renders login target correctly', () => {
    const html = renderToString(
      React.createElement(OrionLiveWallpaper, { target: 'login' })
    );

    expect(html).toContain('data-target="login"');
    expect(html).toContain(DEFAULT_LOGIN_WALLPAPER.assetUrl);
  });
});
