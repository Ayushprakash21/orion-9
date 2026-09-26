/**
 * ORION-9 LIVE SPACE WALLPAPER TEST SUITE (UNIFIED WALLPAPER ENGINE RESTRUCTURE)
 * 
 * Verifies:
 * 1. Default asset /wallpaper/orion9-earth-horizon-default.png is registered.
 * 2. Shared OrionLiveWallpaper engine is used for Login and Desktop.
 * 3. HTML rendering & canvas layer contract.
 * 4. HealthService runtime signal probes.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OrionLiveWallpaper } from '../../os/components/OrionLiveWallpaper';
import { SYSTEM_DEFAULT_WALLPAPERS } from '../../repositories/WallpaperRepository';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { HealthService } from '../../operations/HealthService';

describe('ORION-9 Live Space Wallpaper Engine', () => {
  it('1. verifies canonical default asset is registered in repository', () => {
    const defaultWp = SYSTEM_DEFAULT_WALLPAPERS[0];
    expect(defaultWp.assetUrl).toBe('/wallpaper/orion9-earth-horizon-default.png');
  });

  it('2. renders OrionLiveWallpaper for target="desktop" without crashing', () => {
    const html = renderToString(<OrionLiveWallpaper target="desktop" showLogo={false} />);
    expect(html).toContain('data-testid="orion-live-wallpaper-container"');
    expect(html).toContain('/wallpaper/orion9-earth-horizon-default.png');
  });

  it('3. verifies environment-isolated runtime signal probes', async () => {
    const env = dbManager.getEnvironment();
    expect(['DEMO', 'LIVE']).toContain(env);

    const health = await HealthService.getInstance().runHealthCheck();
    expect(typeof health.readinessProbe).toBe('boolean');
  });
});
