import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { PersonalizationSettingsPanel } from '../../components/settings/PersonalizationSettingsPanel';
import { DEFAULT_PERSONALIZATION_SETTINGS } from '../../theme/themePresets';
import { RuntimeSettingsAuthority } from '../../os/settings/RuntimeSettingsAuthority';
import { loadPreferences, savePreferences, clearPreferences } from '../../os/theme/OrionThemeStorage';
import { applyThemeToDOM } from '../../os/theme/OrionThemeCSS';
import { getTheme } from '../../os/theme/OrionThemeRegistry';
import { OrionDock } from '../../os/components/OrionDock';

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
    localStorage: mockLocalStorage,
  };
}

if (typeof (globalThis as any).document === 'undefined') {
  (globalThis as any).document = {
    documentElement: {
      style: {
        setProperty: vi.fn((k: string, v: string) => { styleStore[k] = v; }),
        getPropertyValue: vi.fn((k: string) => styleStore[k] || ''),
        removeProperty: vi.fn((k: string) => { delete styleStore[k]; }),
        cssText: '',
      },
      setAttribute: vi.fn((k: string, v: string) => { attrStore[k] = v; }),
      getAttribute: vi.fn((k: string) => attrStore[k] || null),
      removeAttribute: vi.fn((k: string) => { delete attrStore[k]; }),
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn().mockReturnValue(false),
      },
    },
  };
}

// Scoped mocks for WindowManager, Language, ContextMenu, Toast
vi.mock('../../os/WindowManagerContext', () => {
  const ctx = {
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
    showDesktop: false,
    toggleShowDesktop: vi.fn(),
  };
  return {
    useWindowManager: () => ctx,
    useOptionalWindowManager: () => ctx,
  };
});

vi.mock('../../store/LanguageContext', () => ({
  useI18n: () => ({ t: (key: string) => key, language: 'en' }),
}));

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, language: 'en' }),
}));

vi.mock('../../os/contextMenu/OrionContextMenuContext', () => ({
  useOrionContextMenu: () => ({
    openContextMenu: vi.fn(),
  }),
}));

vi.mock('../../context/ContextMenuContext', () => ({
  useContextMenu: () => ({ showContextMenu: vi.fn(), hideContextMenu: vi.fn() }),
}));

vi.mock('../../store/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn(), addToast: vi.fn() }),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

describe('ORION-9 OS 21.1 — Glass Opacity Setting Pipeline & Material System', () => {
  beforeEach(() => {
    (globalThis as any).localStorage.clear();
    Object.keys(styleStore).forEach(k => delete styleStore[k]);
    Object.keys(attrStore).forEach(k => delete attrStore[k]);
    clearPreferences();
  });

  afterEach(() => {
    (globalThis as any).localStorage.clear();
    clearPreferences();
  });

  it('1. PersonalizationSettingsPanel renders slider bound to glassOpacity and displays accurate percentage', () => {
    const htmlDefault = renderToString(
      <PersonalizationSettingsPanel
        settings={{ ...DEFAULT_PERSONALIZATION_SETTINGS, glassOpacity: 85, dockTransparency: 85 }}
        onChange={vi.fn()}
      />
    );

    expect(htmlDefault).toContain('Glass Opacity');
    expect(htmlDefault).toContain('85%');
    expect(htmlDefault).toContain('value="85"');
    expect(htmlDefault).toContain('data-testid="glass-opacity-slider"');

    // Test with 20%
    const html20 = renderToString(
      <PersonalizationSettingsPanel
        settings={{ ...DEFAULT_PERSONALIZATION_SETTINGS, glassOpacity: 20, dockTransparency: 20 }}
        onChange={vi.fn()}
      />
    );
    expect(html20).toContain('20%');
    expect(html20).toContain('value="20"');

    // Test with 0% (Clear)
    const html0 = renderToString(
      <PersonalizationSettingsPanel
        settings={{ ...DEFAULT_PERSONALIZATION_SETTINGS, glassOpacity: 0, dockTransparency: 0 }}
        onChange={vi.fn()}
      />
    );
    expect(html0).toContain('0%');
    expect(html0).toContain('value="0"');

    // Test with 100% (Solid)
    const html100 = renderToString(
      <PersonalizationSettingsPanel
        settings={{ ...DEFAULT_PERSONALIZATION_SETTINGS, glassOpacity: 100, dockTransparency: 100 }}
        onChange={vi.fn()}
      />
    );
    expect(html100).toContain('100%');
    expect(html100).toContain('value="100"');
  });

  it('2. Synchronizes glassOpacity to RuntimeSettingsAuthority and persists to OrionThemeStorage', () => {
    const authority = RuntimeSettingsAuthority.instance;
    const initialGen = authority.generation;

    authority.updateSettings({
      dock: {
        ...authority.settings.dock,
        glassOpacity: 45,
        dockOpacity: 0.45,
      }
    });

    expect(authority.generation).toBeGreaterThan(initialGen);
    expect(authority.settings.dock.glassOpacity).toBe(45);
    expect(authority.settings.dock.dockOpacity).toBe(0.45);

    // Verify OrionThemeStorage loaded preferences
    const stored = loadPreferences();
    expect(stored.glassOpacity).toBe(45);
    expect(stored.dockOpacity).toBe(45);
  });

  it('3. Applies --orion-glass-opacity and dynamic background alpha across all 4 material modes', () => {
    const theme = getTheme('graphite');

    // Mode 1: Dark Obsidian at 50% opacity
    applyThemeToDOM(theme, {
      ...loadPreferences(),
      dockTint: 'dark',
      glassOpacity: 50,
      transparencyEnabled: true,
    });
    expect(styleStore['--orion-glass-opacity']).toBe('0.5');
    expect(styleStore['--orion-dock-tint-bg']).toContain('rgba(10, 12, 16, 0.5');

    // Mode 2: Light Quartz at 75% opacity
    applyThemeToDOM(theme, {
      ...loadPreferences(),
      dockTint: 'light',
      glassOpacity: 75,
      transparencyEnabled: true,
    });
    expect(styleStore['--orion-glass-opacity']).toBe('0.75');
    expect(styleStore['--orion-dock-tint-bg']).toContain('rgba(255, 255, 255, 0.75');

    // Mode 3: Accent Glow at 25% opacity
    applyThemeToDOM(theme, {
      ...loadPreferences(),
      dockTint: 'accent',
      glassOpacity: 25,
      transparencyEnabled: true,
    });
    expect(styleStore['--orion-glass-opacity']).toBe('0.25');
    expect(styleStore['--orion-dock-tint-bg']).toContain('color-mix(in srgb');
    expect(styleStore['--orion-dock-tint-bg']).toContain('0.25');

    // Mode 4: Auto (System) at 0% opacity (Clear)
    applyThemeToDOM(theme, {
      ...loadPreferences(),
      dockTint: 'auto',
      glassOpacity: 0,
      transparencyEnabled: true,
    });
    expect(styleStore['--orion-glass-opacity']).toBe('0');
    expect(styleStore['--orion-dock-tint-bg']).toContain('0)');
  });

  it('4. OrionDock isolates translucency to dock-glass-backdrop, leaving app icons and shelf un-faded', () => {
    const html = renderToString(<OrionDock />);

    // Dedicated Translucent Glass Layer exists
    expect(html).toContain('data-testid="dock-glass-backdrop"');
    
    // Background color consumes --orion-dock-tint-bg with glass opacity fallback
    expect(html).toContain('var(--orion-dock-tint-bg');
    expect(html).toContain('var(--orion-dock-surface');
    expect(html).toContain('var(--orion-glass-opacity');

    // Blur filter is present on the glass layer
    expect(html).toContain('var(--orion-dock-blur');

    // App buttons and launcher exist inside dock
    expect(html).toContain('data-testid="dock-start-menu-button"');
  });

  it('5. Edge case persistence: Survives reload and does NOT overwrite 20%, 0%, 100% with default 85%', () => {
    // Test 20%
    savePreferences({
      ...loadPreferences(),
      glassOpacity: 20,
      dockOpacity: 20,
    });
    let reloaded = loadPreferences();
    expect(reloaded.glassOpacity).toBe(20);

    // Test 0%
    savePreferences({
      ...loadPreferences(),
      glassOpacity: 0,
      dockOpacity: 0,
    });
    reloaded = loadPreferences();
    expect(reloaded.glassOpacity).toBe(0);

    // Test 100%
    savePreferences({
      ...loadPreferences(),
      glassOpacity: 100,
      dockOpacity: 100,
    });
    reloaded = loadPreferences();
    expect(reloaded.glassOpacity).toBe(100);
  });
});
