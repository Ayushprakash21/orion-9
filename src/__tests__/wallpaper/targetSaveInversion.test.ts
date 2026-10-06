import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  wallpaperRepository, 
  DEFAULT_LOGIN_WALLPAPER, 
  DEFAULT_DESKTOP_WALLPAPER 
} from '../../repositories/WallpaperRepository';
import { WallpaperRecord } from '../../types/wallpaper';

describe('ORION-9 Wallpaper Target Save Inversion & Strict Isolation Suite', () => {
  const testUserId = 'test_user_isolation_42';
  const testTenantId = 'tenant_test_xyz';

  // In-memory mock storage and event system for Node environment
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

    await wallpaperRepository.resetToSystemDefault(undefined, 'login');
    await wallpaperRepository.resetToSystemDefault(testUserId, 'desktop');
  });

  afterEach(() => {
    mockStorageMap.clear();
    mockListeners.clear();
  });

  it('TEST 1: Canonical system defaults are correctly mapped and not inverted', () => {
    expect(DEFAULT_LOGIN_WALLPAPER.assetUrl).toBe('/wallpaper/orion9-earth-horizon-default.png');
    expect(DEFAULT_LOGIN_WALLPAPER.target).toBe('login');
    expect(DEFAULT_LOGIN_WALLPAPER.name).toBe('Dark Cinematic Earth Horizon');

    expect(DEFAULT_DESKTOP_WALLPAPER.assetUrl).toBe('/wallpaper/orion9-desktop-minimal-graphite.png');
    expect(DEFAULT_DESKTOP_WALLPAPER.target).toBe('desktop');
    expect(DEFAULT_DESKTOP_WALLPAPER.name).toBe('Orion Graphite Minimal');
  });

  it('TEST 2: Saving and applying to LOGIN target updates LOGIN and leaves DESKTOP untouched', async () => {
    const customLogin: WallpaperRecord = {
      wallpaperId: 'custom_login_wp_101',
      tenantId: 'global',
      ownerType: 'USER',
      ownerId: testUserId,
      name: 'Custom Login Aurora',
      assetUrl: '/wallpaper/custom-login-aurora.png',
      thumbnailUrl: '/wallpaper/custom-login-aurora.png',
      source: 'UPLOAD',
      target: 'login',
      aiGenerated: false,
      width: 2560,
      height: 1440,
      aspectRatio: '16:9',
      mode: 'STILL',
      environment: 'DEMO',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await wallpaperRepository.saveWallpaper(customLogin, 'login');
    await wallpaperRepository.setActiveWallpaper(customLogin.wallpaperId, testUserId, 'login');

    const activeLogin = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'login');
    const activeDesktop = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');

    // LOGIN must have updated to customLogin
    expect(activeLogin.wallpaperId).toBe('custom_login_wp_101');
    expect(activeLogin.assetUrl).toBe('/wallpaper/custom-login-aurora.png');

    // DESKTOP must remain the canonical desktop default
    expect(activeDesktop.wallpaperId).toBe(DEFAULT_DESKTOP_WALLPAPER.wallpaperId);
    expect(activeDesktop.assetUrl).toBe(DEFAULT_DESKTOP_WALLPAPER.assetUrl);
    expect(activeDesktop.wallpaperId).not.toBe('custom_login_wp_101');
  });

  it('TEST 3: Saving and applying to DESKTOP target updates DESKTOP and leaves LOGIN untouched', async () => {
    const customDesktop: WallpaperRecord = {
      wallpaperId: 'custom_desktop_wp_202',
      tenantId: testTenantId,
      ownerType: 'USER',
      ownerId: testUserId,
      name: 'Custom Desktop Nebula',
      assetUrl: '/wallpaper/custom-desktop-nebula.png',
      thumbnailUrl: '/wallpaper/custom-desktop-nebula.png',
      source: 'AI',
      target: 'desktop',
      aiGenerated: true,
      width: 2560,
      height: 1440,
      aspectRatio: '16:9',
      mode: 'STILL',
      environment: 'DEMO',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await wallpaperRepository.saveWallpaper(customDesktop, 'desktop');
    await wallpaperRepository.setActiveWallpaper(customDesktop.wallpaperId, testUserId, 'desktop');

    const activeLogin = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'login');
    const activeDesktop = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');

    // DESKTOP must have updated to customDesktop
    expect(activeDesktop.wallpaperId).toBe('custom_desktop_wp_202');
    expect(activeDesktop.assetUrl).toBe('/wallpaper/custom-desktop-nebula.png');

    // LOGIN must remain canonical login default
    expect(activeLogin.wallpaperId).toBe(DEFAULT_LOGIN_WALLPAPER.wallpaperId);
    expect(activeLogin.assetUrl).toBe(DEFAULT_LOGIN_WALLPAPER.assetUrl);
    expect(activeLogin.wallpaperId).not.toBe('custom_desktop_wp_202');
  });

  it('TEST 4: Sequential updates to LOGIN then DESKTOP preserve both distinct targets', async () => {
    const loginWp: WallpaperRecord = {
      wallpaperId: 'seq_login_303',
      tenantId: 'global',
      ownerType: 'USER',
      ownerId: testUserId,
      name: 'Sequential Login',
      assetUrl: '/wallpaper/seq-login.png',
      thumbnailUrl: '/wallpaper/seq-login.png',
      source: 'UPLOAD',
      target: 'login',
      aiGenerated: false,
      width: 2560,
      height: 1440,
      aspectRatio: '16:9',
      mode: 'STILL',
      environment: 'DEMO',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const desktopWp: WallpaperRecord = {
      wallpaperId: 'seq_desktop_404',
      tenantId: testTenantId,
      ownerType: 'USER',
      ownerId: testUserId,
      name: 'Sequential Desktop',
      assetUrl: '/wallpaper/seq-desktop.png',
      thumbnailUrl: '/wallpaper/seq-desktop.png',
      source: 'AI',
      target: 'desktop',
      aiGenerated: true,
      width: 2560,
      height: 1440,
      aspectRatio: '16:9',
      mode: 'STILL',
      environment: 'DEMO',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Apply login
    await wallpaperRepository.saveWallpaper(loginWp, 'login');
    await wallpaperRepository.setActiveWallpaper(loginWp.wallpaperId, testUserId, 'login');

    // Apply desktop
    await wallpaperRepository.saveWallpaper(desktopWp, 'desktop');
    await wallpaperRepository.setActiveWallpaper(desktopWp.wallpaperId, testUserId, 'desktop');

    const activeLogin = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'login');
    const activeDesktop = await wallpaperRepository.getActiveWallpaper(testUserId, testTenantId, 'desktop');

    expect(activeLogin.wallpaperId).toBe('seq_login_303');
    expect(activeDesktop.wallpaperId).toBe('seq_desktop_404');
    expect(activeLogin.assetUrl).not.toBe(activeDesktop.assetUrl);
  });

  it('TEST 5: Storage cache restore preserves both distinct images after reload simulation', async () => {
    const loginWp: WallpaperRecord = {
      wallpaperId: 'cache_login_505',
      tenantId: 'global',
      ownerType: 'USER',
      ownerId: testUserId,
      name: 'Cache Login',
      assetUrl: '/wallpaper/cache-login.png',
      thumbnailUrl: '/wallpaper/cache-login.png',
      source: 'UPLOAD',
      target: 'login',
      aiGenerated: false,
      width: 2560,
      height: 1440,
      aspectRatio: '16:9',
      mode: 'STILL',
      environment: 'DEMO',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await wallpaperRepository.saveWallpaper(loginWp, 'login');
    await wallpaperRepository.setActiveWallpaper(loginWp.wallpaperId, testUserId, 'login');

    // Verify localStorage keys are strictly separated
    expect(mockStorageMap.get('orion_active_wallpaper_id_login')).toBe('cache_login_505');
    expect(mockStorageMap.get('orion_active_wallpaper_id_desktop_global')).not.toBe('cache_login_505');
  });

  it('TEST 6: Custom event dispatching isolates target updates cleanly', async () => {
    let loginFired = false;
    let desktopFired = false;

    const listener = (e: any) => {
      if (e.detail?.target === 'login') loginFired = true;
      if (e.detail?.target === 'desktop') desktopFired = true;
    };

    (globalThis as any).window.addEventListener('orion-active-wallpaper-changed', listener);

    // Set desktop only
    await wallpaperRepository.setActiveWallpaper(DEFAULT_DESKTOP_WALLPAPER.wallpaperId, testUserId, 'desktop');
    expect(desktopFired).toBe(true);
    expect(loginFired).toBe(false);

    // Reset flags
    loginFired = false;
    desktopFired = false;

    // Set login only
    await wallpaperRepository.setActiveWallpaper(DEFAULT_LOGIN_WALLPAPER.wallpaperId, testUserId, 'login');
    expect(loginFired).toBe(true);
    expect(desktopFired).toBe(false);

    (globalThis as any).window.removeEventListener('orion-active-wallpaper-changed', listener);
  });
});
