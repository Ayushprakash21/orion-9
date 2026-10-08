/**
 * ORION-9 CANONICAL APPEARANCE, ACCENT, WALLPAPER & DOCK AUTHORITY SUITE
 * Tests the unified, non-duplicated OS architecture:
 * 1. Single Appearance Authority (OrionThemeEngine + OrionThemeStorage)
 * 2. Canonical Accent Resolution & Live Token Generation without reload
 * 3. Wallpaper Authority & Strict Target Isolation (WallpaperRepository + WallpaperRuntime)
 * 4. Dock Canonical Auto-Hide Default, Theme Integration & Zero Layout Shift
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OrionThemeEngine } from '../../os/theme/OrionThemeEngine';
import { savePreferences, loadPreferences, clearPreferences, STORAGE_KEY, migratePreferences } from '../../os/theme/OrionThemeStorage';
import { getTheme, ORION_THEMES } from '../../os/theme/OrionThemeRegistry';
import { applyThemeToDOM } from '../../os/theme/OrionThemeCSS';
import { DEFAULT_PREFERENCES, OrionThemeId } from '../../os/theme/OrionThemeTypes';
import { 
  wallpaperRepository, 
  DEFAULT_DESKTOP_WALLPAPER, 
  DEFAULT_LOGIN_WALLPAPER 
} from '../../repositories/WallpaperRepository';
import { computeDockGeometry } from '../../os/dock/DockGeometry';
import { DEFAULT_PERSONALIZATION_SETTINGS } from '../../theme/themePresets';

// Mock storage and DOM for node environment
const storageMock: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((k: string) => storageMock[k] ?? null),
  setItem: vi.fn((k: string, v: string) => { storageMock[k] = String(v); }),
  removeItem: vi.fn((k: string) => { delete storageMock[k]; }),
  clear: vi.fn(() => { Object.keys(storageMock).forEach(k => delete storageMock[k]); }),
};

if (typeof (globalThis as any).localStorage === 'undefined') {
  (globalThis as any).localStorage = mockLocalStorage;
}

const styleStore: Record<string, string> = {};
const attrStore: Record<string, string> = {};

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    matchMedia: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    innerWidth: 1440,
    innerHeight: 900,
  };
}

if (typeof (globalThis as any).document === 'undefined') {
  (globalThis as any).document = {
    documentElement: {
      style: {
        setProperty: vi.fn((k: string, v: string) => { styleStore[k] = v; }),
        getPropertyValue: vi.fn((k: string) => styleStore[k] || ''),
        colorScheme: '',
      },
      setAttribute: vi.fn((k: string, v: string) => { attrStore[k] = v; }),
      getAttribute: vi.fn((k: string) => attrStore[k] ?? null),
      removeAttribute: vi.fn((k: string) => { delete attrStore[k]; }),
    },
  };
}

describe('ORION-9: Canonical Appearance, Accent, Wallpaper & Dock Architecture', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    Object.keys(styleStore).forEach(k => delete styleStore[k]);
    Object.keys(attrStore).forEach(k => delete attrStore[k]);
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  describe('PHASE 2 & 3: Canonical Appearance Model & Single Authority', () => {
    it('uses OrionAppearancePreferences as the single authoritative model with dockAutoHide=true default', () => {
      expect(DEFAULT_PREFERENCES.version).toBe(1);
      expect(DEFAULT_PREFERENCES.themeId).toBe('graphite');
      expect(DEFAULT_PREFERENCES.dockAutoHide).toBe(true);

      const prefs = loadPreferences();
      expect(prefs.themeId).toBe('graphite');
      expect(prefs.dockAutoHide).toBe(true);
    });

    it('idempotently migrates legacy accentKey and dock preferences into canonical model', () => {
      // Legacy settings object with accentKey: 'green' (Sage Green)
      const legacyRaw = {
        accentKey: 'green',
        dockPosition: 'bottom',
      };

      const migrated = migratePreferences(legacyRaw);
      expect(migrated.customAccentEnabled).toBe(true);
      expect(migrated.customAccent).toBe('#5FAF8A');
      expect(migrated.dockAutoHide).toBe(true);

      // Running migration again produces the exact same state (idempotency)
      const reMigrated = migratePreferences(migrated);
      expect(reMigrated.customAccent).toBe('#5FAF8A');
      expect(reMigrated.customAccentEnabled).toBe(true);
    });

    it('OrionThemeEngine loads from storage, applies to DOM, and notifies subscribers', () => {
      const engine = new OrionThemeEngine();
      let notified = false;
      engine.onChange(() => { notified = true; });

      engine.setTheme('midnight');
      expect(engine.getPreferences().themeId).toBe('midnight');
      expect(notified).toBe(true);

      // Verify DOM updated with midnight background
      const midnightTheme = getTheme('midnight');
      expect((globalThis as any).document.documentElement.style.getPropertyValue('--orion-bg')).toBe(midnightTheme.colors.background);
    });
  });

  describe('PHASE 4 & 5 & 24: Canonical Accent Resolution & Live Token Propagation', () => {
    it('Theme=Graphite + Accent=Sage produces Sage accent tokens', () => {
      const engine = new OrionThemeEngine();
      engine.setTheme('graphite');
      engine.setPreference('customAccentEnabled', true);
      engine.setPreference('customAccent', '#87A987'); // Sage Green

      expect(engine.getResolvedAccent()).toBe('#87A987');
      expect((globalThis as any).document.documentElement.style.getPropertyValue('--orion-accent')).toBe('#87A987');
      expect((globalThis as any).document.documentElement.style.getPropertyValue('--os-accent')).toBe('#87A987');
      expect((globalThis as any).document.documentElement.style.getPropertyValue('--orion-dock-active')).toBe('#87A987');
    });

    it('Changing Accent to Amber immediately updates all accent tokens without reload', () => {
      const engine = new OrionThemeEngine();
      engine.setPreference('customAccentEnabled', true);
      engine.setPreference('customAccent', '#C6A15B'); // Amber

      expect(engine.getResolvedAccent()).toBe('#C6A15B');
      expect((globalThis as any).document.documentElement.style.getPropertyValue('--orion-accent')).toBe('#C6A15B');
      expect((globalThis as any).document.documentElement.style.getPropertyValue('--orion-accent-hover')).toBeTruthy();
      expect((globalThis as any).document.documentElement.style.getPropertyValue('--orion-accent-active')).toBeTruthy();
      expect((globalThis as any).document.documentElement.style.getPropertyValue('--orion-accent-soft')).toBeTruthy();
      expect((globalThis as any).document.documentElement.style.getPropertyValue('--orion-accent-glow')).toBeTruthy();
      expect((globalThis as any).document.documentElement.style.getPropertyValue('--orion-accent-foreground')).toBeTruthy();
    });

    it('Changing Theme to Warm preserves the explicitly selected Amber accent', () => {
      const engine = new OrionThemeEngine();
      engine.setPreference('customAccentEnabled', true);
      engine.setPreference('customAccent', '#C6A15B'); // Amber

      engine.setTheme('warm');

      expect(engine.getPreferences().themeId).toBe('warm');
      expect(engine.getResolvedAccent()).toBe('#C6A15B');
      expect((globalThis as any).document.documentElement.style.getPropertyValue('--orion-accent')).toBe('#C6A15B');
      expect((globalThis as any).document.documentElement.style.getPropertyValue('--orion-dock-surface')).toBe('rgba(26, 22, 19, 0.88)');
    });

    it('Custom HEX #FF0055 propagates to tokens and persists across simulated reload', () => {
      const engine = new OrionThemeEngine();
      engine.setPreference('customAccentEnabled', true);
      engine.setPreference('customAccent', '#FF0055');

      expect(engine.getResolvedAccent()).toBe('#FF0055');
      expect((globalThis as any).document.documentElement.style.getPropertyValue('--orion-accent')).toBe('#FF0055');

      // Simulate browser reload by reading directly from storage
      const reloaded = loadPreferences();
      expect(reloaded.customAccentEnabled).toBe(true);
      expect(reloaded.customAccent).toBe('#FF0055');

      const newEngine = new OrionThemeEngine();
      expect(newEngine.getResolvedAccent()).toBe('#FF0055');
    });
  });

  describe('PHASE 7, 8, 9, 11, 12, 25, 26: Wallpaper Authority & Strict Target Isolation', () => {
    it('WallpaperRepository is the single source of truth for active wallpapers', async () => {
      const desktopWp = wallpaperRepository.getActiveWallpaperSync('test-user', 'desktop');
      expect(desktopWp.wallpaperId).toBe(DEFAULT_DESKTOP_WALLPAPER.wallpaperId);

      const loginWp = wallpaperRepository.getActiveWallpaperSync('test-user', 'login');
      expect(loginWp.wallpaperId).toBe(DEFAULT_LOGIN_WALLPAPER.wallpaperId);
    });

    it('Desktop wallpaper change dispatches canonical orion-wallpaper-changed event', async () => {
      const eventSpy = vi.fn();
      (globalThis as any).window.addEventListener = vi.fn((type: string, handler: any) => {
        if (type === 'orion-wallpaper-changed') eventSpy.mockImplementation(handler);
      });

      const customDesktop = {
        ...DEFAULT_DESKTOP_WALLPAPER,
        wallpaperId: 'wp-nebula-test',
        assetUrl: '/wallpaper/nebula-test.png',
      };
      (wallpaperRepository as any).memoryWallpapers.set('wp-nebula-test', customDesktop);

      let dispatchedEvent: any = null;
      (globalThis as any).window.dispatchEvent = vi.fn((evt: any) => {
        if (evt.type === 'orion-wallpaper-changed') {
          dispatchedEvent = evt;
        }
      });

      await wallpaperRepository.setActiveWallpaper('wp-nebula-test', 'test-user', 'desktop');

      expect(dispatchedEvent).toBeTruthy();
      expect(dispatchedEvent.detail.target).toBe('desktop');
      expect(dispatchedEvent.detail.wallpaperId).toBe('wp-nebula-test');
      expect(dispatchedEvent.detail.wallpaper.assetUrl).toBe('/wallpaper/nebula-test.png');
    });

    it('Strict Target Isolation: Setting LOGIN wallpaper leaves DESKTOP wallpaper intact', async () => {
      // 1. Set Desktop to Custom A
      const customA = {
        ...DEFAULT_DESKTOP_WALLPAPER,
        wallpaperId: 'wp-custom-a',
        assetUrl: '/wallpaper/custom-a.png',
      };
      (wallpaperRepository as any).memoryWallpapers.set('wp-custom-a', customA);
      await wallpaperRepository.setActiveWallpaper('wp-custom-a', 'test-user', 'desktop');

      // 2. Set Login to Custom B
      const customB = {
        ...DEFAULT_LOGIN_WALLPAPER,
        wallpaperId: 'wp-custom-b',
        assetUrl: '/wallpaper/custom-b.png',
      };
      (wallpaperRepository as any).memoryWallpapers.set('wp-custom-b', customB);
      await wallpaperRepository.setActiveWallpaper('wp-custom-b', 'test-user', 'login');

      // 3. Verify Desktop remains A and Login is B
      const activeDesktop = wallpaperRepository.getActiveWallpaperSync('test-user', 'desktop');
      const activeLogin = wallpaperRepository.getActiveWallpaperSync('test-user', 'login');

      expect(activeDesktop.wallpaperId).toBe('wp-custom-a');
      expect(activeLogin.wallpaperId).toBe('wp-custom-b');
    });

    it('Resetting target restores official system default record, never a hardcoded blue gradient', async () => {
      await wallpaperRepository.resetToSystemDefault('test-user', 'desktop');
      const activeDesktop = wallpaperRepository.getActiveWallpaperSync('test-user', 'desktop');
      expect(activeDesktop.wallpaperId).toBe(DEFAULT_DESKTOP_WALLPAPER.wallpaperId);
      expect(activeDesktop.assetUrl).toBe(DEFAULT_DESKTOP_WALLPAPER.assetUrl);

      await wallpaperRepository.resetToSystemDefault('test-user', 'login');
      const activeLogin = wallpaperRepository.getActiveWallpaperSync('test-user', 'login');
      expect(activeLogin.wallpaperId).toBe(DEFAULT_LOGIN_WALLPAPER.wallpaperId);
      expect(activeLogin.assetUrl).toBe(DEFAULT_LOGIN_WALLPAPER.assetUrl);
    });
  });

  describe('PHASE 15, 16, 17, 18, 28, 29: Dock Authority, Auto-Hide & Overlay Geometry', () => {
    it('Dock auto-hides by default with zero layout shift (safeArea.bottom = 0)', () => {
      const geometry = computeDockGeometry(
        { ...DEFAULT_PERSONALIZATION_SETTINGS, dockAutoHide: true, dockPosition: 'bottom' },
        1440,
        900,
        48,
        false
      );

      // Applications receive complete viewport height below system bar without layout shift
      expect(geometry.safeArea.bottom).toBe(0);
      expect(geometry.usableRect.height).toBe(852);
      expect(geometry.usableRect.width).toBe(1440);
      expect(geometry.usableRect.y).toBe(48);
    });

    it('Dock consumes canonical tokens across all themes without stale hardcoded colors', () => {
      const themes: OrionThemeId[] = ['graphite', 'silver', 'midnight', 'forest', 'warm'];

      themes.forEach((themeId) => {
        const theme = getTheme(themeId);
        applyThemeToDOM(theme, { ...DEFAULT_PREFERENCES, themeId });

        const dockSurface = (globalThis as any).document.documentElement.style.getPropertyValue('--orion-dock-surface');
        const dockBorder = (globalThis as any).document.documentElement.style.getPropertyValue('--orion-dock-border');
        const dockShadow = (globalThis as any).document.documentElement.style.getPropertyValue('--orion-dock-shadow');

        expect(dockSurface).toBeTruthy();
        expect(dockBorder).toBeTruthy();
        expect(dockShadow).toBeTruthy();
      });
    });
  });
});
