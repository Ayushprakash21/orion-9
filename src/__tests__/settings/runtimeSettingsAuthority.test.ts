import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RuntimeSettingsAuthority } from '../../os/settings/RuntimeSettingsAuthority';
import { DEFAULT_RUNTIME_SETTINGS } from '../../os/settings/RuntimeSettingsModel';

describe('RuntimeSettingsAuthority Core Certification Suite', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    RuntimeSettingsAuthority.instance.reset();
  });

  it('AUTH-001: Provides a stable singleton instance in SSR/Node without crash', () => {
    const a1 = RuntimeSettingsAuthority.instance;
    const a2 = RuntimeSettingsAuthority.instance;
    expect(a1).toBe(a2);
    expect(a1.settings).toBeDefined();
    expect(a1.settings.version).toBe(1);
  });

  it('AUTH-002: Subscribes and notifies immediately upon registration', () => {
    const authority = RuntimeSettingsAuthority.instance;
    const subscriber = vi.fn();
    const unsub = authority.subscribe(subscriber);

    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledWith(authority.settings);

    unsub();
  });

  it('AUTH-003: Updates settings partially while preserving untouched fields', () => {
    const authority = RuntimeSettingsAuthority.instance;
    
    authority.updateSettings({
      dock: {
        dockPosition: 'left',
        dockAutoHide: true,
        dockSize: 'large',
        dockMagnification: false,
        dockOpacity: 0.9,
        dockScale: 1.2,
        dockTransparency: true,
        dockShowRunningIndicators: true,
        dockShowBadges: true,
      }
    });

    expect(authority.settings.dock.dockPosition).toBe('left');
    expect(authority.settings.dock.dockAutoHide).toBe(true);
    // Preserves theme
    expect(authority.settings.theme.themeId).toBe('graphite');
    // Preserves wallpaper
    expect(authority.settings.wallpaper.desktopWallpaperId).toBe('sys-orion-desktop-default');
  });

  it('AUTH-004: Increments generation counter on updates to guard race conditions', () => {
    const authority = RuntimeSettingsAuthority.instance;
    const genBefore = authority.generation;

    const newGen = authority.updateSettings({
      wallpaper: {
        desktopWallpaperId: 'custom-wp-01',
        loginWallpaperId: 'sys-orion-dark-horizon',
        wallpaperBlur: 10,
        wallpaperDim: 0.2,
        fit: 'cover',
      }
    });

    expect(newGen).toBeGreaterThan(genBefore);
    expect(authority.generation).toBe(newGen);
    expect(authority.settings.wallpaper.desktopWallpaperId).toBe('custom-wp-01');
    expect(authority.settings.wallpaper.wallpaperBlur).toBe(10);
  });

  it('AUTH-005: Enforces strict target isolation between desktop and login wallpapers', () => {
    const authority = RuntimeSettingsAuthority.instance;
    
    // Change desktop wallpaper
    authority.updateSettings({
      wallpaper: {
        ...authority.settings.wallpaper,
        desktopWallpaperId: 'new-desktop-image.jpg',
      }
    });

    expect(authority.settings.wallpaper.desktopWallpaperId).toBe('new-desktop-image.jpg');
    // Login wallpaper remains isolated
    expect(authority.settings.wallpaper.loginWallpaperId).toBe('sys-orion-dark-horizon');

    // Change login wallpaper
    authority.updateSettings({
      wallpaper: {
        ...authority.settings.wallpaper,
        loginWallpaperId: 'new-login-image.jpg',
      }
    });

    expect(authority.settings.wallpaper.loginWallpaperId).toBe('new-login-image.jpg');
    expect(authority.settings.wallpaper.desktopWallpaperId).toBe('new-desktop-image.jpg');
  });

  it('AUTH-006: Resets cleanly to system defaults', () => {
    const authority = RuntimeSettingsAuthority.instance;

    authority.updateSettings({
      theme: {
        ...authority.settings.theme,
        themeId: 'forest',
      }
    });
    expect(authority.settings.theme.themeId).toBe('forest');

    authority.reset();
    expect(authority.settings.theme.themeId).toBe(DEFAULT_RUNTIME_SETTINGS.theme.themeId);
    expect(authority.settings.dock.dockPosition).toBe(DEFAULT_RUNTIME_SETTINGS.dock.dockPosition);
  });

  it('AUTH-007: Safe DOM application when DOM globals are simulated', () => {
    const authority = RuntimeSettingsAuthority.instance;
    const mockRoot = {
      setAttribute: vi.fn(),
      style: {
        setProperty: vi.fn(),
      },
    };
    (globalThis as any).document = {
      documentElement: mockRoot,
    };

    authority.updateSettings({
      theme: {
        ...authority.settings.theme,
        themeId: 'midnight',
      },
    });

    expect(mockRoot.setAttribute).toHaveBeenCalledWith('data-orion-theme', 'midnight');
    expect(mockRoot.style.setProperty).toHaveBeenCalledWith('--orion-theme-id', 'midnight');

    delete (globalThis as any).document;
  });
});
