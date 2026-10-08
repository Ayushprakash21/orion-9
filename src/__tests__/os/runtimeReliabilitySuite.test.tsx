import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { 
  wallpaperRepository, 
  DEFAULT_DESKTOP_WALLPAPER, 
  DEFAULT_LOGIN_WALLPAPER, 
  SYSTEM_DEFAULT_WALLPAPERS 
} from '../../repositories/WallpaperRepository';
import { OrionLiveWallpaper } from '../../os/components/OrionLiveWallpaper';
import { OrionDock } from '../../os/components/OrionDock';
import { computeDockGeometry, OSGeometryProvider } from '../../os/dock/DockGeometry';
import { savePreferences, loadPreferences, clearPreferences } from '../../os/theme/OrionThemeStorage';
import { WallpaperRecord } from '../../types/wallpaper';
import { DEFAULT_PERSONALIZATION_SETTINGS } from '../../theme/themePresets';

// Scoped mocks for WindowManager, Language, ContextMenu, Toast
vi.mock('../../os/WindowManagerContext', () => ({
  useWindowManager: () => ({
    windows: {},
    activeAppId: null,
    activeWorkspaceId: 'operations',
    dockPinnedApps: ['inventory', 'orders', 'analytics', 'settings'],
    openApplication: vi.fn(),
    focusApplication: vi.fn(),
    minimizeApplication: vi.fn(),
    maximizeApplication: vi.fn(),
    restoreApplication: vi.fn(),
    closeApplication: vi.fn(),
    pinToDock: vi.fn(),
    unpinFromDock: vi.fn(),
    reorderDock: vi.fn(),
    setLauncherOpen: vi.fn(),
    setCommandPaletteOpen: vi.fn(),
  }),
}));

vi.mock('../../store/LanguageContext', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../os/contextMenu/OrionContextMenuContext', () => ({
  useOrionContextMenu: () => ({
    openContextMenu: vi.fn(),
  }),
}));

vi.mock('../../store/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

let mockDockAutoHide = false;
let mockDockPosition: 'bottom' | 'top' | 'left' | 'right' = 'bottom';

vi.mock('../../os/dock/DockGeometry', async () => {
  const actual = await vi.importActual('../../os/dock/DockGeometry');
  return {
    ...actual,
    useOSGeometry: () => {
      const settings = {
        ...DEFAULT_PERSONALIZATION_SETTINGS,
        dockAutoHide: mockDockAutoHide,
        dockPosition: mockDockPosition,
      };
      const { dock, safeArea, usableRect } = (actual as any).computeDockGeometry(
        settings,
        1440,
        900,
        48,
        !mockDockAutoHide
      );
      return {
        dock,
        settings,
        effectiveSettings: settings,
        usableRect,
        viewportWidth: 1440,
        viewportHeight: 900,
        systemBarHeight: 48,
        safeArea,
        previewSettings: vi.fn(),
      };
    },
  };
});

describe('ORION-9 Runtime Reliability Suite (Dock, Wallpaper & File Manager)', () => {
  const mockStorageMap = new Map<string, string>();
  const mockListeners = new Map<string, Function[]>();

  beforeEach(() => {
    mockStorageMap.clear();
    mockListeners.clear();
    mockDockAutoHide = false;
    mockDockPosition = 'bottom';

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
  });

  afterEach(() => {
    mockStorageMap.clear();
    mockListeners.clear();
  });

  // ==========================================
  // DOCK AUTO-HIDE AUTHORITATIVE TESTS
  // ==========================================
  describe('Dock Auto-Hide State Machine & Persistence', () => {
    it('DOCK-AUTOHIDE-001: preserves explicit dockAutoHide=false without normalizing undefined to false', () => {
      const prefs = loadPreferences();
      expect(prefs.dockAutoHide).toBe(true);

      savePreferences({ ...prefs, dockAutoHide: false });
      const updated = loadPreferences();
      expect(updated.dockAutoHide).toBe(false);

      savePreferences({ ...updated, dockAutoHide: true });
      const reverted = loadPreferences();
      expect(reverted.dockAutoHide).toBe(true);
      expect(reverted.dockAutoHide !== undefined).toBe(true);
    });

    it('DOCK-AUTOHIDE-002: persists dockAutoHide across simulated page reloads in storage', () => {
      const prefs = loadPreferences();
      savePreferences({ ...prefs, dockAutoHide: true });

      // Simulate new page load: reading fresh from storage
      const reloaded = loadPreferences();
      expect(reloaded.dockAutoHide).toBe(true);
    });

    it('DOCK-AUTOHIDE-003: computeDockGeometry sets safeInset to full thickness when autoHide=false', () => {
      const settings = { ...DEFAULT_PERSONALIZATION_SETTINGS, dockAutoHide: false, dockPosition: 'bottom' as const };
      const geom = computeDockGeometry(settings, 1440, 900, 48, true);
      expect(geom.dock.safeInset).toBe(geom.dock.thickness + 12);
      expect(geom.dock.hiddenTransform).toBe('translate3d(-50%, calc(100% + 28px), 0)');
    });

    it('DOCK-AUTOHIDE-004: computeDockGeometry sets safeInset to revealZoneSize when hidden under autoHide', () => {
      const settings = { ...DEFAULT_PERSONALIZATION_SETTINGS, dockAutoHide: true, dockPosition: 'bottom' as const };
      const geom = computeDockGeometry(settings, 1440, 900, 48, false);
      expect(geom.dock.safeInset).toBe(10); // revealZoneSize
      expect(geom.usableRect.height).toBe(900 - 48); // Full height available below top bar
    });

    it('DOCK-AUTOHIDE-005: Dock renders visible with pointer-events-auto when autoHide is false', () => {
      mockDockAutoHide = false;
      const html = renderToString(React.createElement(OrionDock));
      expect(html).toContain('data-dock="true"');
      expect(html).toContain('pointer-events-auto');
    });

    it('DOCK-AUTOHIDE-006: Dock renders hidden with pointer-events-none and edge trigger when autoHide is true', () => {
      mockDockAutoHide = true;
      const html = renderToString(React.createElement(OrionDock));
      expect(html).toContain('data-dock="true"');
      expect(html).toContain('data-dock-visible="false"');
      expect(html).toContain('pointer-events-none');
      expect(html).toContain('data-testid="dock-activation-zone"');
    });

    it('DOCK-AUTOHIDE-007: Edge trigger covers correct edge based on dockPosition (bottom, left, right, top)', () => {
      mockDockAutoHide = true;
      mockDockPosition = 'bottom';
      let html = renderToString(React.createElement(OrionDock));
      expect(html).toContain('bottom-0 left-0 w-full');

      mockDockPosition = 'left';
      html = renderToString(React.createElement(OrionDock));
      expect(html).toContain('top-0 left-0 w-[14px]');

      mockDockPosition = 'right';
      html = renderToString(React.createElement(OrionDock));
      expect(html).toContain('top-0 right-0 w-[14px]');

      mockDockPosition = 'top';
      html = renderToString(React.createElement(OrionDock));
      expect(html).toContain('left-0 w-full');
    });

    it('DOCK-AUTOHIDE-008: Reveal handle element is rendered for hover affordance when auto-hide is true', () => {
      mockDockAutoHide = true;
      const html = renderToString(React.createElement(OrionDock));
      expect(html).toContain('data-testid="dock-reveal-handle"');
    });
  });

  // ==========================================
  // WALLPAPER PERSISTENCE & ISOLATION TESTS
  // ==========================================
  describe('Wallpaper Authority, Isolation & Atomic Commit', () => {
    it('WALLPAPER-FIX-001: setActiveWallpaper updates memory and persistent storage cache', async () => {
      const customWp: WallpaperRecord = {
        ...DEFAULT_DESKTOP_WALLPAPER,
        wallpaperId: 'test-custom-desktop-wp',
        name: 'Test Custom Desktop',
        assetUrl: '/wallpaper/custom-desktop.png',
        target: 'desktop',
      };

      await wallpaperRepository.saveWallpaper(customWp, 'desktop');
      const applied = await wallpaperRepository.setActiveWallpaper(customWp.wallpaperId, 'user-1', 'desktop');

      expect(applied.wallpaperId).toBe('test-custom-desktop-wp');

      // Verify synchronous cache
      const syncActive = wallpaperRepository.getActiveWallpaperSync('user-1', 'desktop');
      expect(syncActive.wallpaperId).toBe('test-custom-desktop-wp');

      // Verify persistent storage key
      const stored = mockStorageMap.get('orion_active_wallpaper_id_desktop_user-1');
      expect(stored).toBe('test-custom-desktop-wp');
    });

    it('WALLPAPER-FIX-002: dispatches orion-active-wallpaper-changed event with complete record', async () => {
      let dispatchedDetail: any = null;
      const handler = (e: any) => {
        dispatchedDetail = e.detail;
      };
      (globalThis as any).window.addEventListener('orion-active-wallpaper-changed', handler);

      const testWp: WallpaperRecord = {
        ...DEFAULT_DESKTOP_WALLPAPER,
        wallpaperId: 'test-event-wp',
        name: 'Event WP',
        assetUrl: '/wallpaper/event.png',
      };
      await wallpaperRepository.saveWallpaper(testWp, 'desktop');
      await wallpaperRepository.setActiveWallpaper(testWp.wallpaperId, 'user-2', 'desktop');

      expect(dispatchedDetail).not.toBeNull();
      expect(dispatchedDetail.wallpaper.wallpaperId).toBe('test-event-wp');
      expect(dispatchedDetail.target).toBe('desktop');

      (globalThis as any).window.removeEventListener('orion-active-wallpaper-changed', handler);
    });

    it('WALLPAPER-FIX-003: strict target isolation between desktop and login', async () => {
      await wallpaperRepository.resetToSystemDefault('user-test', 'desktop');
      await wallpaperRepository.resetToSystemDefault(undefined, 'login');

      const initialDesktop = await wallpaperRepository.getActiveWallpaper('user-test', 'global', 'desktop');
      const initialLogin = await wallpaperRepository.getActiveWallpaper(undefined, 'global', 'login');

      expect(initialDesktop.wallpaperId).toBe(DEFAULT_DESKTOP_WALLPAPER.wallpaperId);
      expect(initialLogin.wallpaperId).toBe(DEFAULT_LOGIN_WALLPAPER.wallpaperId);

      // Change desktop wallpaper
      const testDesktop: WallpaperRecord = {
        ...DEFAULT_DESKTOP_WALLPAPER,
        wallpaperId: 'wp-desktop-only',
        target: 'desktop',
      };
      await wallpaperRepository.saveWallpaper(testDesktop, 'desktop');
      await wallpaperRepository.setActiveWallpaper(testDesktop.wallpaperId, 'user-test', 'desktop');

      // Login MUST remain untouched
      const loginCheck = await wallpaperRepository.getActiveWallpaper(undefined, 'global', 'login');
      expect(loginCheck.wallpaperId).toBe(DEFAULT_LOGIN_WALLPAPER.wallpaperId);

      // Change login wallpaper
      const testLogin: WallpaperRecord = {
        ...DEFAULT_LOGIN_WALLPAPER,
        wallpaperId: 'wp-login-only',
        target: 'login',
      };
      await wallpaperRepository.saveWallpaper(testLogin, 'login');
      await wallpaperRepository.setActiveWallpaper(testLogin.wallpaperId, undefined, 'login');

      // Desktop MUST remain untouched
      const desktopCheck = await wallpaperRepository.getActiveWallpaper('user-test', 'global', 'desktop');
      expect(desktopCheck.wallpaperId).toBe('wp-desktop-only');
    });

    it('WALLPAPER-FIX-004: resetToSystemDefault restores default wallpaper for target and broadcasts event', async () => {
      let eventTarget: string | null = null;
      const handler = (e: any) => {
        eventTarget = e.detail?.target;
      };
      (globalThis as any).window.addEventListener('orion-active-wallpaper-changed', handler);

      const resetWp = await wallpaperRepository.resetToSystemDefault('user-reset', 'desktop');
      expect(resetWp.wallpaperId).toBe(DEFAULT_DESKTOP_WALLPAPER.wallpaperId);
      expect(eventTarget).toBe('desktop');

      (globalThis as any).window.removeEventListener('orion-active-wallpaper-changed', handler);
    });

    it('WALLPAPER-FIX-005: OrionLiveWallpaper renders default image synchronously without canvas or blank screen', () => {
      const html = renderToString(React.createElement(OrionLiveWallpaper, { target: 'desktop', userId: 'user-sync' }));
      expect(html).toContain('data-orion-wallpaper-image="true"');
      expect(html).toContain(DEFAULT_DESKTOP_WALLPAPER.assetUrl);
      expect(html).not.toContain('<canvas');
    });

    it('WALLPAPER-FIX-006: OrionLiveWallpaper renders login default image synchronously for login target', () => {
      const html = renderToString(React.createElement(OrionLiveWallpaper, { target: 'login' }));
      expect(html).toContain('data-orion-wallpaper-image="true"');
      expect(html).toContain(DEFAULT_LOGIN_WALLPAPER.assetUrl);
      expect(html).not.toContain('<canvas');
    });

    it('WALLPAPER-FIX-007: OrionLiveWallpaper applies overrideWallpaper prop synchronously when provided', () => {
      const custom: WallpaperRecord = {
        ...DEFAULT_DESKTOP_WALLPAPER,
        wallpaperId: 'override-wp',
        assetUrl: '/custom/override.png',
      };
      const html = renderToString(React.createElement(OrionLiveWallpaper, { target: 'desktop', overrideWallpaper: custom }));
      expect(html).toContain('/custom/override.png');
    });
  });
});
