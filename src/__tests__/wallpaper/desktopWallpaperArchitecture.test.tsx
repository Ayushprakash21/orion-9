import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OrionLiveWallpaper } from '../../os/components/OrionLiveWallpaper';
import { 
  wallpaperRepository, 
  DEFAULT_DESKTOP_WALLPAPER, 
  DEFAULT_LOGIN_WALLPAPER,
  SYSTEM_DEFAULT_WALLPAPERS 
} from '../../repositories/WallpaperRepository';

describe('ORION-9 Desktop Wallpaper Architectural Contract', () => {
  it('1. DEFAULT_DESKTOP_WALLPAPER has target="desktop" and canonical minimal graphite asset', () => {
    expect(DEFAULT_DESKTOP_WALLPAPER.target).toBe('desktop');
    expect(DEFAULT_DESKTOP_WALLPAPER.assetUrl).toBe('/wallpaper/orion9-desktop-minimal-graphite.png');
    expect(DEFAULT_DESKTOP_WALLPAPER.isSystemDefault).toBe(true);
  });

  it('2. OrionLiveWallpaper target="desktop" renders authoritative img element with required classes and attributes', () => {
    const html = renderToString(
      <OrionLiveWallpaper 
        target="desktop" 
        userId="user_test_alpha" 
        tenantId="global"
        showLogo={false} 
      />
    );

    // Must have container with testid and data-target="desktop"
    expect(html).toContain('data-testid="orion-live-wallpaper-container"');
    expect(html).toContain('data-target="desktop"');

    // Must render authoritative <img> element with data-orion-wallpaper-image="true"
    expect(html).toContain('data-orion-wallpaper-image="true"');
    expect(html).toContain('class="orion-desktop-wallpaper-image orion-static-wallpaper-img');

    // Must have object-cover, object-center, absolute inset-0, scale-100
    expect(html).toContain('object-cover');
    expect(html).toContain('object-center');
    expect(html).toContain('absolute');
    expect(html).toContain('inset-0');

    // Must resolve to default desktop asset URL
    expect(html).toContain('/wallpaper/orion9-desktop-minimal-graphite.png');
  });

  it('3. Target isolation: getActiveWallpaper("desktop") does not return login wallpaper', async () => {
    const desktopWp = await wallpaperRepository.getActiveWallpaper('user_isolated', 'global', 'desktop');
    const loginWp = await wallpaperRepository.getActiveWallpaper('user_isolated', 'global', 'login');

    expect(desktopWp.target).toBe('desktop');
    expect(loginWp.target).toBe('login');
    expect(desktopWp.assetUrl).not.toBe(loginWp.assetUrl);
  });
});
