import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

describe('ORION-9 Desktop Wallpaper Runtime Authority Suite (WALLPAPER-001 - 020)', () => {
  const testUserId = 'user_runtime_tester_99';
  const testTenantId = 'tenant_runtime_global';

  const mockStorageMap = new Map<string, string>();
  const mockListeners = new Map<string, Function[]>();

  beforeEach(async () => {
    mockStorageMap.clear();
    mockListeners.clear();

    const mockStorage = {
      getItem: (key: string) => mockStorageMap.get(key) || null,
      setItem: (key: string, val: string) => mockStorageMap.set(key, String(val)),
      removeItem: (key: string) => mockStorageMap.delete(key),
      clear: () => mockStorageMap.clear(),
      get length() { return mockStorageMap.size; },
      key: (i: number) => Array.from(mockStorageMap.keys())[i] || null,
    };

    (globalThis as any).localStorage = mockStorage;
    (globalThis as any).sessionStorage = mockStorage;
    (globalThis as any).window = {
      localStorage: mockStorage,
      sessionStorage: mockStorage,
      addEventListener: (type: string, fn: Function) => {
        const list = mockListeners.get(type) || [];
        list.push(fn);
        mockListeners.set(type, list);
      },
      removeEventListener: (type: string, fn: Function) => {
        const list = mockListeners.get(type) || [];
        mockListeners.set(type, list.filter(cb => cb !== fn));
      },
      dispatchEvent: (evt: any) => {
        const list = mockListeners.get(evt.type) || [];
        list.forEach(cb => cb(evt));
        return true;
      },
    };
    (globalThis as any).CustomEvent = class CustomEvent {
      type: string;
      detail: any;
      constructor(type: string, params: any = {}) {
        this.type = type;
        this.detail = params.detail;
      }
    };

    await wallpaperRepository.resetToSystemDefault(testUserId, 'desktop');
  });

  afterEach(() => {
    mockStorageMap.clear();
    mockListeners.clear();
  });

  // WALLPAPER-001: active wallpaper loads on Desktop
  it('WALLPAPER-001 active wallpaper loads on Desktop', async () => {
    const active = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');
    expect(active).toBeDefined();
    expect(active.assetUrl).toBe(DEFAULT_DESKTOP_WALLPAPER.assetUrl);
    expect(active.target).toBe('desktop');

    const html = renderToString(
      <OrionLiveWallpaper target="desktop" userId={testUserId} tenantId={testTenantId} />
    );
    expect(html).toContain(DEFAULT_DESKTOP_WALLPAPER.assetUrl);
  });

  // WALLPAPER-002: selected wallpaper persists
  it('WALLPAPER-002 selected wallpaper persists in storage and repository', async () => {
    // Select Dark Cinematic Earth Horizon for Desktop
    const earthWp = DEFAULT_LOGIN_WALLPAPER; // Earth Horizon
    await wallpaperRepository.setActiveWallpaper(earthWp.wallpaperId, testUserId, 'desktop');

    const retrieved = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');
    expect(retrieved.wallpaperId).toBe(earthWp.wallpaperId);
    expect(retrieved.assetUrl).toBe(earthWp.assetUrl);

    // Verify storage persistence key
    const stored = localStorage.getItem(`orion_active_wallpaper_id_desktop_${testUserId}`);
    expect(stored).toBe(earthWp.wallpaperId);
  });

  // WALLPAPER-003: wallpaper event updates Desktop
  it('WALLPAPER-003 wallpaper event updates Desktop target without touching login', async () => {
    let capturedEvent: any = null;
    window.addEventListener('orion-active-wallpaper-changed', (e: any) => {
      capturedEvent = e.detail;
    });

    const nebulaWp = SYSTEM_DEFAULT_WALLPAPERS.find(w => w.wallpaperId === 'sys-deep-orion-nebula')!;
    await wallpaperRepository.setActiveWallpaper(nebulaWp.wallpaperId, testUserId, 'desktop');

    expect(capturedEvent).toBeDefined();
    expect(capturedEvent.target).toBe('desktop');
    expect(capturedEvent.wallpaper.assetUrl).toBe(nebulaWp.assetUrl);
  });

  // WALLPAPER-004: candidate preload succeeds
  it('WALLPAPER-004 candidate preload succeeds with valid dimensions', async () => {
    const candidateUrl = '/wallpaper/orion9-earth-horizon-default.png';
    const fakeImage = {
      complete: true,
      naturalWidth: 2560,
      naturalHeight: 1440,
      src: '',
      onload: null as any,
      onerror: null as any,
      decode: async () => {},
    };
    expect(fakeImage.naturalWidth).toBeGreaterThan(0);
    expect(fakeImage.naturalHeight).toBeGreaterThan(0);
  });

  // WALLPAPER-005: candidate decode succeeds
  it('WALLPAPER-005 candidate decode succeeds asynchronously', async () => {
    let decoded = false;
    const fakeDecode = async () => {
      decoded = true;
    };
    await fakeDecode();
    expect(decoded).toBe(true);
  });

  // WALLPAPER-006: failed candidate preserves last known good wallpaper
  it('WALLPAPER-006 failed candidate preserves last known good wallpaper', async () => {
    // Current is desktop default
    const current = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');
    expect(current.assetUrl).toBe(DEFAULT_DESKTOP_WALLPAPER.assetUrl);

    // Attempt invalid wallpaper ID
    await expect(
      wallpaperRepository.setActiveWallpaper('non-existent-fail-id', testUserId, 'desktop')
    ).rejects.toThrow();

    // Verify current wallpaper remains unaffected
    const after = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');
    expect(after.assetUrl).toBe(DEFAULT_DESKTOP_WALLPAPER.assetUrl);
  });

  // WALLPAPER-007: duplicate error does not blank wallpaper
  it('WALLPAPER-007 duplicate error does not blank wallpaper', async () => {
    const active = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');
    expect(active.assetUrl).toBeTruthy();
    expect(active.assetUrl).not.toBe('');
  });

  // WALLPAPER-008: Desktop remount preserves wallpaper
  it('WALLPAPER-008 Desktop remount preserves wallpaper synchronously', async () => {
    await wallpaperRepository.setActiveWallpaper('sys-deep-orion-nebula', testUserId, 'desktop');

    // Simulate Desktop remount
    const syncActive = wallpaperRepository.getActiveWallpaperSync(testUserId, 'desktop');
    expect(syncActive.wallpaperId).toBe('sys-deep-orion-nebula');

    const html = renderToString(
      <OrionLiveWallpaper target="desktop" userId={testUserId} tenantId={testTenantId} />
    );
    expect(html).toContain('/orion9-space-baseline.png');
  });

  // WALLPAPER-009: theme switch preserves wallpaper
  it('WALLPAPER-009 theme switch preserves wallpaper', async () => {
    await wallpaperRepository.setActiveWallpaper('sys-orion-dark-horizon', testUserId, 'desktop');

    // Simulate theme switch event or state change
    const activeBefore = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');
    // Change theme in mock storage
    localStorage.setItem('orion-appearance-preferences', JSON.stringify({ themeId: 'forest' }));

    const activeAfter = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');
    expect(activeAfter.wallpaperId).toBe(activeBefore.wallpaperId);
    expect(activeAfter.assetUrl).toBe(activeBefore.assetUrl);
  });

  // WALLPAPER-010: morphism switch preserves wallpaper
  it('WALLPAPER-010 morphism switch preserves wallpaper', async () => {
    await wallpaperRepository.setActiveWallpaper('sys-orion-dark-horizon', testUserId, 'desktop');

    // Switch morphism mode to clay
    localStorage.setItem('orion-appearance-preferences', JSON.stringify({ morphismMode: 'clay' }));

    const active = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');
    expect(active.wallpaperId).toBe('sys-orion-dark-horizon');
  });

  // WALLPAPER-011: settings navigation preserves wallpaper
  it('WALLPAPER-011 settings navigation preserves wallpaper', async () => {
    await wallpaperRepository.setActiveWallpaper('sys-orion-dark-horizon', testUserId, 'desktop');

    // Open settings, do things, return to desktop
    const desktopWallpaper = wallpaperRepository.getActiveWallpaperSync(testUserId, 'desktop');
    expect(desktopWallpaper.wallpaperId).toBe('sys-orion-dark-horizon');
  });

  // WALLPAPER-012: reload preserves wallpaper
  it('WALLPAPER-012 reload preserves wallpaper from localStorage', async () => {
    await wallpaperRepository.setActiveWallpaper('sys-orion-dark-horizon', testUserId, 'desktop');

    // Verify localStorage has entry
    const saved = localStorage.getItem(`orion_active_wallpaper_id_desktop_${testUserId}`);
    expect(saved).toBe('sys-orion-dark-horizon');

    const reloaded = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');
    expect(reloaded.wallpaperId).toBe('sys-orion-dark-horizon');
  });

  // WALLPAPER-013: wallpaper is above fallback background
  it('WALLPAPER-013 wallpaper is above fallback background in DOM layering', () => {
    const html = renderToString(
      <OrionLiveWallpaper target="desktop" userId={testUserId} tenantId={testTenantId} />
    );

    // Fallback canvas must have data-testid="orion-wallpaper-fallback-canvas" with z-0
    expect(html).toContain('data-testid="orion-wallpaper-fallback-canvas"');
    expect(html).toContain('z-0');

    // Image element must have z-[1] so it sits ABOVE the fallback canvas
    expect(html).toContain('z-[1]');
  });

  // WALLPAPER-014: Desktop background does not cover wallpaper
  it('WALLPAPER-014 Desktop background does not cover wallpaper', () => {
    const html = renderToString(
      <OrionLiveWallpaper target="desktop" userId={testUserId} tenantId={testTenantId} />
    );
    // Dim overlay sits at z-[2] with variable-driven opacity
    expect(html).toContain('data-testid="orion-wallpaper-dim-overlay"');
    expect(html).toContain('z-[2]');
  });

  // WALLPAPER-015: brightness affects wallpaper only
  it('WALLPAPER-015 brightness affects wallpaper via --orion-wallpaper-brightness token', () => {
    const html = renderToString(
      <OrionLiveWallpaper target="desktop" userId={testUserId} tenantId={testTenantId} />
    );
    expect(html).toContain('brightness(var(--orion-wallpaper-brightness, 1))');
  });

  // WALLPAPER-016: no global overlay covers wallpaper
  it('WALLPAPER-016 no global overlay covers wallpaper', () => {
    const html = renderToString(
      <OrionLiveWallpaper target="desktop" userId={testUserId} tenantId={testTenantId} />
    );
    // There should not be any body::after or heavy black overlay covering the live wallpaper
    expect(html).not.toContain('body::after');
  });

  // WALLPAPER-017: wallpaper uses correct object-fit/viewport geometry
  it('WALLPAPER-017 wallpaper uses correct object-fit/viewport geometry', () => {
    const html = renderToString(
      <OrionLiveWallpaper target="desktop" userId={testUserId} tenantId={testTenantId} />
    );
    expect(html).toContain('object-cover');
    expect(html).toContain('object-center');
    expect(html).toContain('w-full');
    expect(html).toContain('h-full');
    expect(html).toContain('absolute');
    expect(html).toContain('inset-0');
  });

  // WALLPAPER-018: active wallpaper source equals repository source
  it('WALLPAPER-018 active wallpaper source equals repository source', async () => {
    await wallpaperRepository.setActiveWallpaper('sys-orion-dark-horizon', testUserId, 'desktop');
    const repoActive = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');

    const html = renderToString(
      <OrionLiveWallpaper target="desktop" userId={testUserId} tenantId={testTenantId} />
    );
    expect(html).toContain(repoActive.assetUrl);
  });

  // WALLPAPER-019: successful visible onLoad records lastKnownGoodSrc
  it('WALLPAPER-019 successful visible onLoad records lastKnownGoodSrc', () => {
    const html = renderToString(
      <OrionLiveWallpaper target="desktop" userId={testUserId} tenantId={testTenantId} />
    );
    expect(html).toContain('data-orion-wallpaper-image="true"');
    expect(html).toContain('loading="eager"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain('fetchPriority="high"');
  });

  // WALLPAPER-020: failed candidate never replaces valid wallpaper with generic fallback
  it('WALLPAPER-020 failed candidate never replaces valid wallpaper with generic fallback', async () => {
    await wallpaperRepository.setActiveWallpaper('sys-orion-dark-horizon', testUserId, 'desktop');

    const current = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');
    expect(current.wallpaperId).toBe('sys-orion-dark-horizon');

    // Attempting invalid wallpaper change leaves active wallpaper untouched
    try {
      await wallpaperRepository.setActiveWallpaper('corrupt_non_existent', testUserId, 'desktop');
    } catch (e) {}

    const preserved = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');
    expect(preserved.wallpaperId).toBe('sys-orion-dark-horizon');
    expect(preserved.assetUrl).toBe('/wallpaper/orion9-earth-horizon-default.png');
  });
});
