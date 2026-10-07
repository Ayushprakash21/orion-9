import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrionThemeEngine } from '../os/theme/OrionThemeEngine';
import { ORION_THEMES, getTheme, getThemeList, isValidThemeId } from '../os/theme/OrionThemeRegistry';
import { STORAGE_KEY, loadPreferences, savePreferences, clearPreferences } from '../os/theme/OrionThemeStorage';
import { DEFAULT_PREFERENCES, OrionThemeId } from '../os/theme/OrionThemeTypes';
import { getCornerRadiusValue, applyThemeToDOM } from '../os/theme/OrionThemeCSS';

// Scoped in-file mocks for Node test environment
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
const classList = new Set<string>();

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    matchMedia: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  };
}

if (typeof (globalThis as any).document === 'undefined') {
  (globalThis as any).document = {
    documentElement: {
      style: {
        setProperty: vi.fn((k: string, v: string) => { styleStore[k] = v; }),
        getPropertyValue: vi.fn((k: string) => styleStore[k] || ''),
      },
      classList: {
        add: vi.fn((c: string) => classList.add(c)),
        remove: vi.fn((c: string) => classList.delete(c)),
        contains: vi.fn((c: string) => classList.has(c)),
      },
      setAttribute: vi.fn((k: string, v: string) => { attrStore[k] = v; }),
      getAttribute: vi.fn((k: string) => attrStore[k] || null),
    },
    head: { appendChild: vi.fn() },
    getElementById: vi.fn().mockReturnValue(null),
    createElement: vi.fn().mockReturnValue({ id: '', textContent: '' }),
    body: { style: {} },
  };
}

describe('Orion Theme Engine & Personalization Subsystem', () => {
  beforeEach(() => {
    (globalThis as any).localStorage.clear();
    Object.keys(styleStore).forEach(k => delete styleStore[k]);
    Object.keys(attrStore).forEach(k => delete attrStore[k]);
    classList.clear();
    vi.restoreAllMocks();
  });

  describe('Theme Registry', () => {
    it('defines exactly five first-class built-in themes', () => {
      const themes = getThemeList();
      expect(themes).toHaveLength(5);
      const themeIds = themes.map(t => t.id);
      expect(themeIds).toEqual(
        expect.arrayContaining(['graphite', 'silver', 'midnight', 'forest', 'warm'])
      );
    });

    it('has Orion Graphite as the dark flagship default', () => {
      const graphite = getTheme('graphite');
      expect(graphite.colors.background).toBe('#0B0D0F');
      expect(graphite.colors.surface).toBe('#121417');
      expect(graphite.colors.textPrimary).toBe('#F2F2EF');
      expect(graphite.colors.accent).toBe('#D8DDE3');
      expect(graphite.appearance.mode).toBe('dark');
    });

    it('has Orion Silver as the clean light workstation theme', () => {
      const silver = getTheme('silver');
      expect(silver.colors.background).toBe('#F5F5F3');
      expect(silver.colors.surface).toBe('#FFFFFF');
      expect(silver.colors.textPrimary).toBe('#17191B');
      expect(silver.colors.accent).toBe('#4A5056');
      expect(silver.appearance.mode).toBe('light');
    });

    it('correctly validates theme IDs', () => {
      expect(isValidThemeId('graphite')).toBe(true);
      expect(isValidThemeId('silver')).toBe(true);
      expect(isValidThemeId('midnight')).toBe(true);
      expect(isValidThemeId('forest')).toBe(true);
      expect(isValidThemeId('warm')).toBe(true);
      expect(isValidThemeId('neon-cyberpunk')).toBe(false);
    });
  });

  describe('Storage & Migration', () => {
    it('loads default preferences when storage is empty', () => {
      const prefs = loadPreferences();
      expect(prefs.themeId).toBe('graphite');
      expect(prefs.appearanceMode).toBe('dark');
      expect(prefs.customAccentEnabled).toBe(false);
      expect(prefs.version).toBe(1);
    });

    it('persists and reloads updated preferences', () => {
      const modified = {
        ...DEFAULT_PREFERENCES,
        themeId: 'forest' as OrionThemeId,
        customAccentEnabled: true,
        customAccent: '#7FA58D',
      };
      savePreferences(modified);

      const reloaded = loadPreferences();
      expect(reloaded.themeId).toBe('forest');
      expect(reloaded.customAccentEnabled).toBe(true);
      expect(reloaded.customAccent).toBe('#7FA58D');
    });

    it('safely handles corrupted JSON and falls back to defaults', () => {
      localStorage.setItem(STORAGE_KEY, '{invalid_json}');
      const prefs = loadPreferences();
      expect(prefs.themeId).toBe('graphite');
    });
  });

  describe('Theme Engine Orchestration', () => {
    it('initializes with stored or default preferences', () => {
      const engine = new OrionThemeEngine();
      expect(engine.getPreferences().themeId).toBe('graphite');
      expect(engine.getTheme().id).toBe('graphite');
      expect(engine.isDark()).toBe(true);
    });

    it('switches themes and fires change listeners without reload', () => {
      const engine = new OrionThemeEngine();
      let notified = false;
      const cleanup = engine.onChange(() => {
        notified = true;
      });

      engine.setTheme('silver');
      expect(engine.getTheme().id).toBe('silver');
      expect(notified).toBe(true);
      cleanup();
    });

    it('updates appearance preferences granularly', () => {
      const engine = new OrionThemeEngine();
      engine.setPreference('cornerRadius', 'rounded');
      expect(engine.getPreferences().cornerRadius).toBe('rounded');

      engine.setPreference('blurIntensity', 85);
      expect(engine.getPreferences().blurIntensity).toBe(85);
    });

    it('supports custom accent color overrides', () => {
      const engine = new OrionThemeEngine();
      expect(engine.getResolvedAccent()).toBe('#D8DDE3');

      engine.setPreference('customAccentEnabled', true);
      engine.setPreference('customAccent', '#E0A96D');
      expect(engine.getResolvedAccent()).toBe('#E0A96D');
    });

    it('resets to defaults cleanly', () => {
      const engine = new OrionThemeEngine();
      engine.setTheme('forest');
      engine.setPreference('customAccentEnabled', true);
      engine.setPreference('customAccent', '#FF0000');

      engine.resetToDefaults();
      expect(engine.getPreferences().themeId).toBe('graphite');
      expect(engine.getPreferences().customAccentEnabled).toBe(false);
      expect(engine.getResolvedAccent()).toBe('#D8DDE3');
    });
  });

  describe('DOM CSS Variables and Corner Geometry', () => {
    it('maps corner radius presets to pixel values', () => {
      expect(getCornerRadiusValue('compact')).toBe(4);
      expect(getCornerRadiusValue('standard')).toBe(10);
      expect(getCornerRadiusValue('rounded')).toBe(18);
    });

    it('applies theme variables and data attributes to DOM root', () => {
      const theme = getTheme('graphite');
      applyThemeToDOM(theme, DEFAULT_PREFERENCES);

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--orion-bg')).toBe('#0B0D0F');
      expect(root.style.getPropertyValue('--orion-surface')).toBe('#121417');
      expect(root.style.getPropertyValue('--orion-accent')).toBe('#D8DDE3');
      expect(root.style.getPropertyValue('--os-bg')).toBe('#0B0D0F');
      expect(root.getAttribute('data-orion-theme')).toBe('graphite');
      expect(root.getAttribute('data-orion-mode')).toBe('dark');
      expect(root.classList.contains('dark')).toBe(true);
    });
  });
});
