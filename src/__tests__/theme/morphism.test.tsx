import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { calculateMorphismTokens, MORPHISM_MODES } from '../../os/theme/OrionMorphismTokens';
import { ORION_THEMES } from '../../os/theme/OrionThemeRegistry';
import { applyThemeToDOM } from '../../os/theme/OrionThemeCSS';
import { loadPreferences, savePreferences, migratePreferences } from '../../os/theme/OrionThemeStorage';
import { DEFAULT_PREFERENCES, OrionAppearancePreferences } from '../../os/theme/OrionThemeTypes';

// Scoped mocks for Node runner environment
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
        colorScheme: '',
      },
      classList: {
        add: vi.fn((c: string) => classList.add(c)),
        remove: vi.fn((c: string) => classList.delete(c)),
        contains: vi.fn((c: string) => classList.has(c)),
      },
      setAttribute: vi.fn((k: string, v: string) => { attrStore[k] = v; }),
      getAttribute: vi.fn((k: string) => attrStore[k] ?? null),
      removeAttribute: vi.fn((k: string) => { delete attrStore[k]; }),
    },
    body: {
      style: {
        backgroundColor: '',
        color: '',
      },
    },
  };
}

describe('ORION-9 — Global Morphic UI Engine', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    Object.keys(styleStore).forEach(k => delete styleStore[k]);
    Object.keys(attrStore).forEach(k => delete attrStore[k]);
    classList.clear();
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  describe('1. Token Calculations Across All Morphic Modes', () => {
    it('defines the three core morphism modes: glass, clay, neumorphic', () => {
      expect(MORPHISM_MODES).toEqual(['glass', 'clay', 'neumorphic']);
    });

    it('calculates Glassmorphism tokens correctly for dark theme (Graphite)', () => {
      const graphite = ORION_THEMES.graphite;
      const tokens = calculateMorphismTokens('glass', graphite, true, 60, true);

      expect(tokens.mode).toBe('glass');
      expect(tokens.blur).toBe('15px');
      expect(tokens.saturation).toBe('125%');
      expect(tokens.surface).toContain('rgba(');
      expect(tokens.surfaceSubtle).toContain('rgba(');
      expect(tokens.shadow).toContain('0 8px 24px');
      expect(tokens.border).toContain('rgba(255, 255, 255,');
    });

    it('calculates Claymorphism tokens with physical top-left highlight and rounded shadows', () => {
      const graphite = ORION_THEMES.graphite;
      const tokens = calculateMorphismTokens('clay', graphite, true, 60, true);

      expect(tokens.mode).toBe('clay');
      expect(tokens.blur).toBe('0px'); // Clay uses physical opaque depth rather than backdrop blur
      expect(tokens.shadow).toContain('inset 1px 1px 2px');
      expect(tokens.shadow).toContain('rgba(0, 0, 0,');
      expect(tokens.highlight).toContain('rgba(255, 255, 255,');
      expect(tokens.elevationModal).toContain('inset 2px 2px 3px');
    });

    it('calculates Neumorphism tokens with monochromatic embossed and recessed dual-axis shadows', () => {
      const graphite = ORION_THEMES.graphite;
      const tokens = calculateMorphismTokens('neumorphic', graphite, true, 60, true);

      expect(tokens.mode).toBe('neumorphic');
      expect(tokens.blur).toBe('0px');
      expect(tokens.shadow).toContain('-4px -4px 10px'); // Top-left specular extrusion
      expect(tokens.shadowInset).toContain('inset 3px 3px 6px'); // Recessed well
      expect(tokens.surfacePressed).toBe(graphite.colors.background);
    });

    it('calculates light theme (Silver) Glassmorphism tokens properly', () => {
      const silver = ORION_THEMES.silver;
      const tokens = calculateMorphismTokens('glass', silver, false, 60, true);

      expect(tokens.mode).toBe('glass');
      expect(tokens.border).toContain('rgba(0, 0, 0,');
      expect(tokens.shadow).toContain('0 8px 24px rgba(0, 0, 0, 0.10)');
    });

    it('disables blur when blurEnabled is false', () => {
      const graphite = ORION_THEMES.graphite;
      const tokens = calculateMorphismTokens('glass', graphite, true, 60, false);
      expect(tokens.blur).toBe('0px');
    });
  });

  describe('2. DOM Application and data-orion-morphism Attribute', () => {
    it('applies data-orion-morphism attribute and CSS custom properties to document.documentElement', () => {
      const graphite = ORION_THEMES.graphite;
      const prefs: OrionAppearancePreferences = {
        ...DEFAULT_PREFERENCES,
        morphismMode: 'clay',
      };

      applyThemeToDOM(graphite, prefs);

      expect(document.documentElement.getAttribute('data-orion-morphism')).toBe('clay');
      expect(document.documentElement.getAttribute('data-orion-theme')).toBe('graphite');
      expect(document.documentElement.style.getPropertyValue('--orion-morph-mode')).toBe('clay');
      expect(document.documentElement.style.getPropertyValue('--orion-morph-surface')).toBeTruthy();
      expect(document.documentElement.style.getPropertyValue('--orion-morph-border')).toBeTruthy();
      expect(document.documentElement.style.getPropertyValue('--orion-morph-shadow')).toBeTruthy();
    });

    it('switches between glass, clay, and neumorphic cleanly on the DOM', () => {
      const graphite = ORION_THEMES.graphite;

      // 1. Glass
      applyThemeToDOM(graphite, { ...DEFAULT_PREFERENCES, morphismMode: 'glass' });
      expect(document.documentElement.getAttribute('data-orion-morphism')).toBe('glass');
      expect(document.documentElement.style.getPropertyValue('--orion-morph-blur')).not.toBe('0px');

      // 2. Neumorphic
      applyThemeToDOM(graphite, { ...DEFAULT_PREFERENCES, morphismMode: 'neumorphic' });
      expect(document.documentElement.getAttribute('data-orion-morphism')).toBe('neumorphic');
      expect(document.documentElement.style.getPropertyValue('--orion-morph-shadow-inset')).toContain('inset');

      // 3. Clay
      applyThemeToDOM(graphite, { ...DEFAULT_PREFERENCES, morphismMode: 'clay' });
      expect(document.documentElement.getAttribute('data-orion-morphism')).toBe('clay');
      expect(document.documentElement.style.getPropertyValue('--orion-morph-shadow')).toContain('inset');
      expect(document.documentElement.style.getPropertyValue('--orion-morph-highlight')).toContain('rgba');
    });
  });

  describe('3. Storage and Preferences Persistence', () => {
    it('migrates legacy preferences safely by defaulting morphismMode to glass', () => {
      const legacyPrefs = {
        version: 1,
        themeId: 'midnight',
        appearanceMode: 'dark',
      };

      const migrated = migratePreferences(legacyPrefs);
      expect(migrated.morphismMode).toBe('glass');
      expect(migrated.themeId).toBe('midnight');
    });

    it('persists and reloads morphismMode correctly', () => {
      const prefs: OrionAppearancePreferences = {
        ...DEFAULT_PREFERENCES,
        themeId: 'forest',
        morphismMode: 'neumorphic',
      };

      savePreferences(prefs);
      const loaded = loadPreferences();

      expect(loaded.themeId).toBe('forest');
      expect(loaded.morphismMode).toBe('neumorphic');
    });

    it('falls back to glass if an invalid morphismMode is stored', () => {
      mockLocalStorage.setItem('orion-appearance-preferences', JSON.stringify({
        version: 1,
        themeId: 'graphite',
        morphismMode: 'invalid-morphism',
      }));

      const loaded = loadPreferences();
      expect(loaded.morphismMode).toBe('glass');
    });
  });

  describe('4. Theme and Morphism Orthogonality (THEME != MORPHISM)', () => {
    const themes = Object.values(ORION_THEMES);

    themes.forEach((theme) => {
      it(`supports all 3 morphism modes for theme: ${theme.name}`, () => {
        MORPHISM_MODES.forEach((mode) => {
          const isDark = theme.appearance.mode === 'dark';
          const tokens = calculateMorphismTokens(mode, theme, isDark, 60, true);

          expect(tokens.mode).toBe(mode);
          expect(tokens.surface).toBeTruthy();
          expect(tokens.border).toBeTruthy();
          expect(tokens.shadow).toBeTruthy();
        });
      });
    });
  });
});
