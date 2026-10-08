/**
 * ORION-9 THEME MODE & WALLPAPER AUTHORITY CERTIFICATION SUITE
 * Verifies single theme authority, mode & themeId state machine synchronization,
 * adaptive wallpaper resolution, and zero competing DOM writers.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OrionThemeEngine } from '../../os/theme/OrionThemeEngine';
import { 
  getTheme, 
  resolveCompatibleTheme, 
  isThemeCompatibleWithMode,
  ORION_THEMES 
} from '../../os/theme/OrionThemeRegistry';
import { applyThemeToDOM } from '../../os/theme/OrionThemeCSS';
import { loadPreferences, savePreferences, clearPreferences } from '../../os/theme/OrionThemeStorage';
import { 
  DEFAULT_DESKTOP_WALLPAPER, 
  DEFAULT_LIGHT_DESKTOP_WALLPAPER, 
  DEFAULT_LOGIN_WALLPAPER,
  SYSTEM_DEFAULT_WALLPAPERS,
  resolveRuntimeWallpaper,
  wallpaperRepository 
} from '../../repositories/WallpaperRepository';
import { WallpaperRecord } from '../../types/wallpaper';
import { applyThemeToDocument } from '../../theme/themeResolver';

// Storage and DOM mocks
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
const classSet = new Set<string>();

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    matchMedia: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

if (typeof (globalThis as any).document === 'undefined') {
  (globalThis as any).document = {
    documentElement: {
      style: {
        setProperty: vi.fn((k: string, v: string) => { styleStore[k] = v; }),
        getPropertyValue: vi.fn((k: string) => styleStore[k] || ''),
        colorScheme: '',
        fontSize: '',
      },
      setAttribute: vi.fn((k: string, v: string) => { attrStore[k] = v; }),
      getAttribute: vi.fn((k: string) => attrStore[k] ?? null),
      removeAttribute: vi.fn((k: string) => { delete attrStore[k]; }),
      classList: {
        add: vi.fn((c: string) => { classSet.add(c); }),
        remove: vi.fn((c: string) => { classSet.delete(c); }),
        contains: vi.fn((c: string) => classSet.has(c)),
      },
    },
    body: {
      style: {
        backgroundColor: '',
        color: '',
      },
    },
  };
}

describe('ORION-9 Theme Mode & Wallpaper Authority Pipeline', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    clearPreferences();
    Object.keys(styleStore).forEach(k => delete styleStore[k]);
    Object.keys(attrStore).forEach(k => delete attrStore[k]);
    classSet.clear();
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  describe('1. Theme Engine State Machine & Mode Synchronization', () => {
    it('sets themeId to silver and appearanceMode to light when setTheme("silver") is called', () => {
      const engine = new OrionThemeEngine();
      engine.setTheme('silver');

      const prefs = engine.getPreferences();
      expect(prefs.themeId).toBe('silver');
      expect(prefs.appearanceMode).toBe('light');
      expect(engine.isDark()).toBe(false);
      expect(engine.getResolvedTheme().id).toBe('silver');
    });

    it('sets themeId to graphite and appearanceMode to dark when setTheme("graphite") is called', () => {
      const engine = new OrionThemeEngine();
      engine.setTheme('silver'); // Start in light
      engine.setTheme('graphite'); // Switch to graphite

      const prefs = engine.getPreferences();
      expect(prefs.themeId).toBe('graphite');
      expect(prefs.appearanceMode).toBe('dark');
      expect(engine.isDark()).toBe(true);
      expect(engine.getResolvedTheme().id).toBe('graphite');
    });

    it('automatically transitions themeId to silver when setPreference("appearanceMode", "light")', () => {
      const engine = new OrionThemeEngine();
      expect(engine.getPreferences().themeId).toBe('graphite');

      engine.setPreference('appearanceMode', 'light');

      const prefs = engine.getPreferences();
      expect(prefs.appearanceMode).toBe('light');
      expect(prefs.themeId).toBe('silver');
      expect(engine.isDark()).toBe(false);
    });

    it('transitions silver to graphite when setPreference("appearanceMode", "dark")', () => {
      const engine = new OrionThemeEngine();
      engine.setTheme('silver');
      expect(engine.getPreferences().themeId).toBe('silver');

      engine.setPreference('appearanceMode', 'dark');

      const prefs = engine.getPreferences();
      expect(prefs.appearanceMode).toBe('dark');
      expect(prefs.themeId).toBe('graphite');
      expect(engine.isDark()).toBe(true);
    });

    it('preserves specialized dark theme (midnight) when setPreference("appearanceMode", "dark")', () => {
      const engine = new OrionThemeEngine();
      engine.setTheme('midnight');
      expect(engine.getPreferences().themeId).toBe('midnight');

      engine.setPreference('appearanceMode', 'dark');

      const prefs = engine.getPreferences();
      expect(prefs.themeId).toBe('midnight');
      expect(prefs.appearanceMode).toBe('dark');
    });

    it('resolves auto mode against system color scheme preferences', () => {
      const engine = new OrionThemeEngine();
      engine.setPreference('appearanceMode', 'auto');

      // Default mock window.matchMedia returns dark = false (light)
      const resolved = engine.getResolvedTheme();
      expect(resolved.appearance.mode).toBe('light');
    });
  });

  describe('2. Authoritative Wallpaper Repository & Light Wallpaper Specification', () => {
    it('defines DEFAULT_LIGHT_DESKTOP_WALLPAPER correctly', () => {
      expect(DEFAULT_LIGHT_DESKTOP_WALLPAPER.wallpaperId).toBe('sys-orion-desktop-light-default');
      expect(DEFAULT_LIGHT_DESKTOP_WALLPAPER.target).toBe('desktop');
      expect(DEFAULT_LIGHT_DESKTOP_WALLPAPER.source).toBe('SYSTEM');
      expect(DEFAULT_LIGHT_DESKTOP_WALLPAPER.isSystemDefault).toBe(true);
      expect(DEFAULT_LIGHT_DESKTOP_WALLPAPER.assetUrl).toBe('/wallpaper/orion9-desktop-light.svg');
      expect(DEFAULT_LIGHT_DESKTOP_WALLPAPER.thumbnailUrl).toBe('/wallpaper/orion9-desktop-light.svg');
    });

    it('includes DEFAULT_LIGHT_DESKTOP_WALLPAPER in SYSTEM_DEFAULT_WALLPAPERS', () => {
      const ids = SYSTEM_DEFAULT_WALLPAPERS.map(w => w.wallpaperId);
      expect(ids).toContain('sys-orion-desktop-default');
      expect(ids).toContain('sys-orion-desktop-light-default');
      expect(ids).toContain('sys-orion-dark-horizon');
    });

    it('adapts default dark wallpaper to light default in light appearance mode', () => {
      const resolved = resolveRuntimeWallpaper(DEFAULT_DESKTOP_WALLPAPER, 'desktop', 'light');
      expect(resolved.wallpaperId).toBe(DEFAULT_LIGHT_DESKTOP_WALLPAPER.wallpaperId);
      expect(resolved.assetUrl).toBe('/wallpaper/orion9-desktop-light.svg');
    });

    it('adapts light default wallpaper to dark default in dark appearance mode', () => {
      const resolved = resolveRuntimeWallpaper(DEFAULT_LIGHT_DESKTOP_WALLPAPER, 'desktop', 'dark');
      expect(resolved.wallpaperId).toBe(DEFAULT_DESKTOP_WALLPAPER.wallpaperId);
      expect(resolved.assetUrl).toBe('/wallpaper/orion9-desktop-horizon-moon.png');
    });

    it('strictly preserves custom wallpaper across light and dark theme mode switches', () => {
      const customWp: WallpaperRecord = {
        wallpaperId: 'custom-art-101',
        tenantId: 'global',
        ownerType: 'USER',
        ownerId: 'user-1',
        name: 'Neon Horizon Custom',
        assetUrl: 'https://cdn.example.com/art.png',
        thumbnailUrl: 'https://cdn.example.com/art.png',
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

      // In light mode
      const lightResolved = resolveRuntimeWallpaper(customWp, 'desktop', 'light');
      expect(lightResolved.wallpaperId).toBe('custom-art-101');
      expect(lightResolved.assetUrl).toBe('https://cdn.example.com/art.png');

      // In dark mode
      const darkResolved = resolveRuntimeWallpaper(customWp, 'desktop', 'dark');
      expect(darkResolved.wallpaperId).toBe('custom-art-101');
      expect(darkResolved.assetUrl).toBe('https://cdn.example.com/art.png');
    });

    it('does not adapt login wallpaper when appearance mode changes', () => {
      const resolved = resolveRuntimeWallpaper(DEFAULT_LOGIN_WALLPAPER, 'login', 'light');
      expect(resolved.wallpaperId).toBe(DEFAULT_LOGIN_WALLPAPER.wallpaperId);
      expect(resolved.target).toBe('login');
    });
  });

  describe('3. Canonical DOM Token Application (applyThemeToDOM)', () => {
    it('applies Silver light theme tokens cleanly to document root', () => {
      const silver = getTheme('silver');
      const engine = new OrionThemeEngine();
      engine.setTheme('silver');

      applyThemeToDOM(silver, engine.getPreferences());

      expect(styleStore['--orion-bg']).toBe('#F5F5F3');
      expect(styleStore['--orion-surface']).toBe('#FFFFFF');
      expect(styleStore['--orion-text-primary']).toBe('#17191B');
      expect(styleStore['--orion-desktop-icon-label']).toBe('#17191B');
      expect(styleStore['--orion-desktop-icon-shadow']).toBe('0 1px 2px rgba(255, 255, 255, 0.9)');
      expect(attrStore['data-orion-theme']).toBe('silver');
      expect(attrStore['data-orion-mode']).toBe('light');
      expect(classSet.has('light')).toBe(true);
      expect(classSet.has('dark')).toBe(false);
    });

    it('applies Graphite dark theme tokens cleanly to document root', () => {
      const graphite = getTheme('graphite');
      const engine = new OrionThemeEngine();
      engine.setTheme('graphite');

      applyThemeToDOM(graphite, engine.getPreferences());

      expect(styleStore['--orion-bg']).toBe('#0B0D0F');
      expect(styleStore['--orion-surface']).toBe('#121417');
      expect(styleStore['--orion-text-primary']).toBe('#F2F2EF');
      expect(styleStore['--orion-desktop-icon-label']).toBe('#F3EBDD');
      expect(styleStore['--orion-desktop-icon-shadow']).toBe('0 1px 3px rgba(0, 0, 0, 0.75)');
      expect(attrStore['data-orion-theme']).toBe('graphite');
      expect(attrStore['data-orion-mode']).toBe('dark');
      expect(classSet.has('dark')).toBe(true);
      expect(classSet.has('light')).toBe(false);
    });
  });

  describe('4. Theme Compatibility Helpers (OrionThemeRegistry)', () => {
    it('validates theme compatibility with appearance mode', () => {
      expect(isThemeCompatibleWithMode('silver', 'light')).toBe(true);
      expect(isThemeCompatibleWithMode('silver', 'dark')).toBe(false);
      expect(isThemeCompatibleWithMode('graphite', 'dark')).toBe(true);
      expect(isThemeCompatibleWithMode('graphite', 'light')).toBe(false);
      expect(isThemeCompatibleWithMode('midnight', 'dark')).toBe(true);
      expect(isThemeCompatibleWithMode('forest', 'dark')).toBe(true);
      expect(isThemeCompatibleWithMode('warm', 'dark')).toBe(true);
    });

    it('resolves compatible theme deterministically', () => {
      expect(resolveCompatibleTheme('graphite', 'light').id).toBe('silver');
      expect(resolveCompatibleTheme('midnight', 'light').id).toBe('silver');
      expect(resolveCompatibleTheme('silver', 'light').id).toBe('silver');
      expect(resolveCompatibleTheme('silver', 'dark').id).toBe('graphite');
      expect(resolveCompatibleTheme('midnight', 'dark').id).toBe('midnight');
      expect(resolveCompatibleTheme('forest', 'dark').id).toBe('forest');
    });
  });
});
