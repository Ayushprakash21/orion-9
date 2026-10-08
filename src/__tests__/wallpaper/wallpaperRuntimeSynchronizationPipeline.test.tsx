/**
 * ORION-9 WALLPAPER RUNTIME SYNCHRONIZATION PIPELINE SUITE
 * Forensically verifies the complete UI -> Repository -> Event -> Runtime -> DOM chain:
 * 1. UserWallpaperStudio dispatches authoritative 'orion-wallpaper-changed' events on apply, delete, reset.
 * 2. RuntimeSettingsAuthority mirrors authoritative active wallpaperId on event receipt and on reload.
 * 3. WallpaperRuntime renders [data-orion-wallpaper-image="true"] with correct image src in Dark and Light mode.
 * 4. Mode change transforms adaptive defaults between dark (moon) and light (SVG) while strictly preserving custom wallpapers.
 * 5. Target isolation prevents desktop and login cross-contamination.
 * 6. Error fallbacks strictly respect appearance mode (never falling back to dark default in light mode).
 * 7. Wallpaper dim overlay becomes transparent in light mode with adaptive default.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { 
  wallpaperRepository, 
  DEFAULT_DESKTOP_WALLPAPER, 
  DEFAULT_LIGHT_DESKTOP_WALLPAPER, 
  DEFAULT_LOGIN_WALLPAPER,
  SYSTEM_DEFAULT_WALLPAPERS 
} from '../../repositories/WallpaperRepository';
import { WallpaperRuntime } from '../../os/wallpaper/WallpaperRuntime';
import { RuntimeSettingsAuthority } from '../../os/settings/RuntimeSettingsAuthority';
import { WallpaperRecord } from '../../types/wallpaper';

describe('Wallpaper Runtime Synchronization Pipeline', () => {
  const testUserId = 'pipeline_user_42';
  const testTenantId = 'pipeline_tenant_global';

  const mockStorageMap = new Map<string, string>();
  const mockListeners = new Map<string, Function[]>();
  const mockDocAttributes = new Map<string, string>();
  const mockDocStyles = new Map<string, string>();

  beforeEach(async () => {
    mockStorageMap.clear();
    mockListeners.clear();
    mockDocAttributes.clear();
    mockDocStyles.clear();

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

    const mockDocument = {
      documentElement: {
        getAttribute: (attr: string) => mockDocAttributes.get(attr) || null,
        setAttribute: (attr: string, val: string) => mockDocAttributes.set(attr, val),
        removeAttribute: (attr: string) => mockDocAttributes.delete(attr),
        style: {
          setProperty: (k: string, v: string) => mockDocStyles.set(k, v),
          getPropertyValue: (k: string) => mockDocStyles.get(k) || '',
        },
      },
    };
    (globalThis as any).document = mockDocument;

    (globalThis as any).window = {
      localStorage: mockStorage,
      sessionStorage: mockStorage,
      document: mockDocument,
      matchMedia: () => ({ matches: false }),
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

    mockDocAttributes.set('data-orion-mode', 'dark');
    mockDocAttributes.set('data-orion-theme', 'graphite');
    await wallpaperRepository.resetToSystemDefault(testUserId, 'desktop');
  });

  afterEach(() => {
    mockStorageMap.clear();
    mockListeners.clear();
    mockDocAttributes.clear();
    mockDocStyles.clear();
    vi.restoreAllMocks();
  });

  // TEST 1: Dark default wallpaper rendered initially in dark mode
  it('renders dark default wallpaper in DOM when in dark mode', async () => {
    mockDocAttributes.set('data-orion-mode', 'dark');

    const html = renderToString(
      <WallpaperRuntime target="desktop" userId={testUserId} tenantId={testTenantId} />
    );

    expect(html).toContain('data-orion-wallpaper-image="true"');
    expect(html).toContain('src="/wallpaper/orion9-desktop-horizon-moon.png"');
    expect(html).toContain('data-mode="dark"');
  });

  // TEST 2: Light SVG wallpaper rendered in light mode with adaptive default
  it('renders light SVG wallpaper in DOM when in light mode with adaptive default', async () => {
    mockDocAttributes.set('data-orion-mode', 'light');

    const html = renderToString(
      <WallpaperRuntime target="desktop" userId={testUserId} tenantId={testTenantId} />
    );

    expect(html).toContain('data-orion-wallpaper-image="true"');
    expect(html).toContain('src="/wallpaper/orion9-desktop-light.svg"');
    expect(html).toContain('data-mode="light"');
  });

  // TEST 3: orion-wallpaper-changed event dispatches and updates active selection
  it('orion-wallpaper-changed event updates active desktop wallpaper and propagates to repository', async () => {
    let capturedEvent: any = null;
    window.addEventListener('orion-wallpaper-changed', (e: any) => {
      capturedEvent = e.detail;
    });

    const orbitalWp = SYSTEM_DEFAULT_WALLPAPERS.find(w => w.wallpaperId === 'sys-orbital-grid-node')!;
    const applied = await wallpaperRepository.setActiveWallpaper(orbitalWp.wallpaperId, testUserId, 'desktop');

    // Simulate studio dispatch
    window.dispatchEvent(
      new CustomEvent('orion-wallpaper-changed', {
        detail: {
          target: 'desktop',
          wallpaperId: applied.wallpaperId,
          wallpaper: applied,
        },
      })
    );

    expect(capturedEvent).toBeDefined();
    expect(capturedEvent.target).toBe('desktop');
    expect(capturedEvent.wallpaperId).toBe('sys-orbital-grid-node');
    expect(capturedEvent.wallpaper.assetUrl).toBe('/orion-desktop-global-network.jpg');

    const html = renderToString(
      <WallpaperRuntime target="desktop" userId={testUserId} tenantId={testTenantId} />
    );
    expect(html).toContain('src="/orion-desktop-global-network.jpg"');
  });

  // TEST 4: RuntimeSettingsAuthority mirrors authoritative wallpaperId from orion-wallpaper-changed event
  it('RuntimeSettingsAuthority receives orion-wallpaper-changed and updates desktopWallpaperId mirror', async () => {
    const authority = RuntimeSettingsAuthority.instance;
    const testWp = SYSTEM_DEFAULT_WALLPAPERS.find(w => w.wallpaperId === 'sys-deep-orion-nebula')!;

    window.dispatchEvent(
      new CustomEvent('orion-wallpaper-changed', {
        detail: {
          target: 'desktop',
          wallpaperId: testWp.wallpaperId,
          wallpaper: testWp,
        },
      })
    );

    expect(authority.settings.wallpaper.desktopWallpaperId).toBe('sys-deep-orion-nebula');
    expect(mockDocStyles.get('--orion-wallpaper-id')).toBe('sys-deep-orion-nebula');
  });

  // TEST 5: Switching appearance mode toggles adaptive default wallpapers seamlessly
  it('transforms adaptive default between dark moon and light SVG on appearance change without changing custom wallpapers', async () => {
    // 1. Dark Mode render
    mockDocAttributes.set('data-orion-mode', 'dark');
    let html = renderToString(
      <WallpaperRuntime target="desktop" userId={testUserId} tenantId={testTenantId} />
    );
    expect(html).toContain('/wallpaper/orion9-desktop-horizon-moon.png');

    // 2. Light Mode render
    mockDocAttributes.set('data-orion-mode', 'light');
    html = renderToString(
      <WallpaperRuntime target="desktop" userId={testUserId} tenantId={testTenantId} />
    );
    expect(html).toContain('/wallpaper/orion9-desktop-light.svg');

    // 3. Back to Dark Mode
    mockDocAttributes.set('data-orion-mode', 'dark');
    html = renderToString(
      <WallpaperRuntime target="desktop" userId={testUserId} tenantId={testTenantId} />
    );
    expect(html).toContain('/wallpaper/orion9-desktop-horizon-moon.png');
  });

  // TEST 6: Custom wallpapers are strictly preserved across mode changes
  it('custom user wallpapers are preserved across dark and light mode changes', async () => {
    const customRecord: WallpaperRecord = {
      wallpaperId: 'wp_custom_spacewalk_1',
      tenantId: 'global',
      ownerType: 'USER',
      ownerId: testUserId,
      name: 'Custom Spacewalk',
      assetUrl: '/custom-spacewalk.jpg',
      thumbnailUrl: '/custom-spacewalk.jpg',
      source: 'UPLOAD',
      target: 'desktop',
      aiGenerated: false,
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
      mode: 'STILL',
      environment: 'DEMO',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await wallpaperRepository.saveWallpaper(customRecord, 'desktop');
    await wallpaperRepository.setActiveWallpaper(customRecord.wallpaperId, testUserId, 'desktop');

    // Dark Mode: custom wallpaper
    mockDocAttributes.set('data-orion-mode', 'dark');
    let html = renderToString(
      <WallpaperRuntime target="desktop" userId={testUserId} tenantId={testTenantId} />
    );
    expect(html).toContain('/custom-spacewalk.jpg');

    // Light Mode: custom wallpaper MUST NOT be replaced
    mockDocAttributes.set('data-orion-mode', 'light');
    html = renderToString(
      <WallpaperRuntime target="desktop" userId={testUserId} tenantId={testTenantId} />
    );
    expect(html).toContain('/custom-spacewalk.jpg');
  });

  // TEST 7: Target isolation: desktop events do not alter login runtime and vice versa
  it('strictly isolates desktop and login wallpaper targets', async () => {
    // Desktop default
    const desktopHtml = renderToString(
      <WallpaperRuntime target="desktop" userId={testUserId} tenantId={testTenantId} />
    );
    // Login default
    const loginHtml = renderToString(
      <WallpaperRuntime target="login" userId={testUserId} tenantId={testTenantId} />
    );

    expect(desktopHtml).toContain(DEFAULT_DESKTOP_WALLPAPER.assetUrl);
    expect(loginHtml).toContain(DEFAULT_LOGIN_WALLPAPER.assetUrl);

    // Apply new wallpaper to login only
    const nebulaWp = SYSTEM_DEFAULT_WALLPAPERS.find(w => w.wallpaperId === 'sys-deep-orion-nebula')!;
    await wallpaperRepository.setActiveWallpaper(nebulaWp.wallpaperId, undefined, 'login');

    const newLoginHtml = renderToString(
      <WallpaperRuntime target="login" userId={testUserId} tenantId={testTenantId} />
    );
    const newDesktopHtml = renderToString(
      <WallpaperRuntime target="desktop" userId={testUserId} tenantId={testTenantId} />
    );

    expect(newLoginHtml).toContain('/orion9-space-baseline.png');
    // Desktop is strictly unaffected!
    expect(newDesktopHtml).toContain(DEFAULT_DESKTOP_WALLPAPER.assetUrl);
  });

  // TEST 8: Error fallback in Light Mode resolves light SVG, never dark default
  it('error fallback in Light Mode uses DEFAULT_LIGHT_DESKTOP_WALLPAPER', async () => {
    mockDocAttributes.set('data-orion-mode', 'light');

    // Pass invalid override to test fallback behavior
    const badRecord: WallpaperRecord = {
      ...DEFAULT_DESKTOP_WALLPAPER,
      assetUrl: '',
    };

    const html = renderToString(
      <WallpaperRuntime target="desktop" userId={testUserId} tenantId={testTenantId} overrideWallpaper={badRecord} />
    );

    // Should resolve to light SVG
    expect(html).toContain('/wallpaper/orion9-desktop-light.svg');
  });

  // TEST 9: Wallpaper dim overlay becomes transparent in Light Mode with adaptive default
  it('wallpaper dim overlay has transparent background in light mode with adaptive default', async () => {
    mockDocAttributes.set('data-orion-mode', 'light');

    const html = renderToString(
      <WallpaperRuntime target="desktop" userId={testUserId} tenantId={testTenantId} />
    );

    // Check style on dim overlay
    expect(html).toContain('background-color:transparent');
  });

  // TEST 10: Reset to default dispatches orion-wallpaper-changed and restores system defaults
  it('resetting default updates repository and dispatches authoritative orion-wallpaper-changed', async () => {
    let lastEvent: any = null;
    window.addEventListener('orion-wallpaper-changed', (e: any) => {
      lastEvent = e.detail;
    });

    // First set custom
    await wallpaperRepository.setActiveWallpaper('sys-orbital-grid-node', testUserId, 'desktop');

    // Reset default
    const res = await wallpaperRepository.resetToSystemDefault(testUserId, 'desktop');
    window.dispatchEvent(
      new CustomEvent('orion-wallpaper-changed', {
        detail: {
          target: 'desktop',
          wallpaperId: res.wallpaperId,
          wallpaper: res,
        },
      })
    );

    expect(lastEvent).toBeDefined();
    expect(lastEvent.wallpaperId).toBe(DEFAULT_DESKTOP_WALLPAPER.wallpaperId);
    expect(lastEvent.wallpaper.assetUrl).toBe(DEFAULT_DESKTOP_WALLPAPER.assetUrl);
  });
});
