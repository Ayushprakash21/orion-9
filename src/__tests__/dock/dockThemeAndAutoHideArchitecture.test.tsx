import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OrionDock } from '../../os/components/OrionDock';
import { OrionThemeProvider } from '../../os/theme/OrionThemeProvider';
import { applyThemeToDOM } from '../../os/theme/OrionThemeCSS';
import { getTheme } from '../../os/theme/OrionThemeRegistry';
import { computeDockGeometry } from '../../os/dock/DockGeometry';
import { DEFAULT_PREFERENCES, OrionThemeId } from '../../os/theme/OrionThemeTypes';
import { STORAGE_KEY, loadPreferences, savePreferences } from '../../os/theme/OrionThemeStorage';
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

// Scoped storage and DOM mocks
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

describe('ORION-9: Comprehensive Dock, Theme, and Accent Architecture Test Suite', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    Object.keys(styleStore).forEach(k => delete styleStore[k]);
    Object.keys(attrStore).forEach(k => delete attrStore[k]);
    classList.clear();
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  describe('1. Auto-Hide State Machine & Reveal Zone Rendering', () => {
    it('initializes in HIDDEN state by default with auto-hide enabled', () => {
      // By default in DEFAULT_PREFERENCES, dockAutoHide is true
      expect(DEFAULT_PREFERENCES.dockAutoHide).toBe(true);

      const html = renderToString(React.createElement(OrionDock));

      // Dock container rendered with hidden state
      expect(html).toContain('data-dock="true"');
      expect(html).toContain('data-dock-visibility-state="hidden"');
      expect(html).toContain('data-dock-visible="false"');
    });

    it('renders an invisible bottom reveal zone with pointer-events enabled', () => {
      const html = renderToString(React.createElement(OrionDock));

      // Verify reveal zone testids
      expect(html).toContain('data-testid="dock-reveal-handle"');
      expect(html).toContain('data-testid="dock-activation-zone"');

      // Must be invisible (opacity-0, bg-transparent) with pointer-events-auto so apps are unaffected
      expect(html).toContain('opacity-0');
      expect(html).toContain('bg-transparent');
      expect(html).toContain('pointer-events-auto');
    });

    it('dock container has fixed overlay positioning and shell z-index hierarchy', () => {
      const html = renderToString(React.createElement(OrionDock));

      // Fixed positioning for overlay behavior without pushing application content
      expect(html).toContain('fixed');
      expect(html).toContain('z-[9990]');
      expect(html).toContain('z-[9991]');
    });

    it('protects mobile screens by including md:block on desktop dock and activation zone', () => {
      const html = renderToString(React.createElement(OrionDock));

      // Mobile protection: hidden by default on mobile, block on md+
      expect(html).toContain('hidden md:block');
    });
  });

  describe('2. Theme & Accent Canonical CSS Variables & Propagation', () => {
    it('updates dock surface, border, and shadow CSS variables for all official themes', () => {
      const themeIds: OrionThemeId[] = ['graphite', 'silver', 'midnight', 'forest', 'warm'];

      themeIds.forEach((id) => {
        const theme = getTheme(id);
        applyThemeToDOM(theme, { ...DEFAULT_PREFERENCES, themeId: id });

        const dockSurface = (globalThis as any).document.documentElement.style.getPropertyValue('--orion-dock-surface');
        const dockBorder = (globalThis as any).document.documentElement.style.getPropertyValue('--orion-dock-border');
        const dockShadow = (globalThis as any).document.documentElement.style.getPropertyValue('--orion-dock-shadow');

        expect(dockSurface).toBeTruthy();
        expect(dockBorder).toBeTruthy();
        expect(dockShadow).toBeTruthy();

        // Check specific color tokens
        if (id === 'graphite') {
          expect(dockSurface).toBe('rgba(22, 25, 29, 0.88)');
        } else if (id === 'silver') {
          expect(dockSurface).toBe('rgba(255, 255, 255, 0.90)');
          expect(dockBorder).toBe('rgba(0, 0, 0, 0.10)');
        } else if (id === 'midnight') {
          expect(dockSurface).toBe('rgba(15, 19, 27, 0.88)');
        } else if (id === 'forest') {
          expect(dockSurface).toBe('rgba(18, 25, 21, 0.88)');
        } else if (id === 'warm') {
          expect(dockSurface).toBe('rgba(26, 22, 19, 0.88)');
        }
      });
    });

    it('propagates custom accent color to all canonical CSS variables immediately', () => {
      const theme = getTheme('graphite');
      const customHex = '#87A987'; // Sage Green

      applyThemeToDOM(theme, {
        ...DEFAULT_PREFERENCES,
        customAccentEnabled: true,
        customAccent: customHex,
      });

      // Verify canonical accent variables
      expect((globalThis as any).document.documentElement.style.getPropertyValue('--orion-accent')).toBe('#87A987');
      expect((globalThis as any).document.documentElement.style.getPropertyValue('--os-accent')).toBe('#87A987');
      expect((globalThis as any).document.documentElement.style.getPropertyValue('--orion-dock-active')).toBe('#87A987');
      expect((globalThis as any).document.documentElement.style.getPropertyValue('--orion-accent-soft')).toContain('rgba(135, 169, 135');
      expect((globalThis as any).document.documentElement.style.getPropertyValue('--orion-focus')).toBe('rgba(135, 169, 135, 0.4)');
    });

    it('dock items consume CSS variables without hardcoded hex colors or legacy tailwind colors', () => {
      const html = renderToString(React.createElement(OrionDock));

      // Dock styling uses canonical variables
      expect(html).toContain('var(--orion-dock-surface');
      expect(html).toContain('var(--orion-dock-border');
      expect(html).toContain('var(--orion-dock-shadow');

      // No hardcoded sky or cyan leaks
      expect(html).not.toContain('focus-visible:ring-sky-500');
      expect(html).not.toContain('hover:bg-sky-500/50');
      expect(html).toContain('focus-visible:ring-[var(--orion-accent)]');
    });
  });

  describe('3. Layout Shift & Viewport Stability', () => {
    it('dock computeDockGeometry maintains safeArea.bottom = 0 when auto-hide is true', () => {
      const geometry = computeDockGeometry(
        { ...DEFAULT_PERSONALIZATION_SETTINGS, dockAutoHide: true, dockPosition: 'bottom' },
        1440,
        900,
        48,
        false // reservedSpace = false when autoHide = true
      );

      // Applications receive complete viewport without layout shift
      expect(geometry.safeArea.bottom).toBe(0);
      expect(geometry.safeArea.top).toBe(48);
      expect(geometry.usableRect.height).toBe(852);
      expect(geometry.usableRect.width).toBe(1440);
    });

    it('dock computeDockGeometry guarantees zero layout shift as a true floating overlay', () => {
      const geometry = computeDockGeometry(
        { ...DEFAULT_PERSONALIZATION_SETTINGS, dockAutoHide: false, dockPosition: 'bottom' },
        1440,
        900,
        48,
        true
      );

      // Dock is a true OS overlay: safeArea.bottom remains 0 so applications are never pushed upward
      expect(geometry.safeArea.bottom).toBe(0);
      expect(geometry.usableRect.height).toBe(852);
    });
  });

  describe('4. Accessibility, Motion & Engine Storage', () => {
    it('sets transition speed to 0ms when reduceMotion preference is enabled', () => {
      const theme = getTheme('graphite');

      // Normal speed
      applyThemeToDOM(theme, { ...DEFAULT_PREFERENCES, reduceMotion: false });
      expect((globalThis as any).document.documentElement.style.getPropertyValue('--orion-transition-speed')).toBe('150ms');

      // Enable reduce motion
      applyThemeToDOM(theme, { ...DEFAULT_PREFERENCES, reduceMotion: true });
      expect((globalThis as any).document.documentElement.style.getPropertyValue('--orion-transition-speed')).toBe('0ms');
    });

    it('persists preferences and restores correctly through OrionThemeStorage', () => {
      savePreferences({
        ...DEFAULT_PREFERENCES,
        themeId: 'warm',
        customAccentEnabled: true,
        customAccent: '#FF8800',
        dockAutoHide: true,
      });

      const loaded = loadPreferences();
      expect(loaded.themeId).toBe('warm');
      expect(loaded.customAccentEnabled).toBe(true);
      expect(loaded.customAccent).toBe('#FF8800');
      expect(loaded.dockAutoHide).toBe(true);
    });
  });
});
