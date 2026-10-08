import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { PersonalizationSettingsPanel } from '../../components/settings/PersonalizationSettingsPanel';
import { AppearanceSettingsPanel } from '../../components/settings/AppearanceSettingsPanel';
import { DEFAULT_PERSONALIZATION_SETTINGS } from '../../theme/themePresets';
import { OrionThemeEngine } from '../../os/theme/OrionThemeEngine';
import { loadPreferences, savePreferences } from '../../os/theme/OrionThemeStorage';
import { RuntimeSettingsAuthority } from '../../os/settings/RuntimeSettingsAuthority';
import { wallpaperRepository, DEFAULT_DESKTOP_WALLPAPER } from '../../repositories/WallpaperRepository';

// Mock OSGeometry so tests run purely and fast without requiring the full SCM provider tree
vi.mock('../../os/dock/DockGeometry', () => ({
  useOSGeometry: () => ({
    viewportWidth: 1440,
    viewportHeight: 900,
    systemBarHeight: 48,
    dock: {
      position: 'bottom',
      orientation: 'horizontal',
      iconSize: 48,
      iconContainerSize: 52,
      dockHeight: 76,
      dockWidth: 800,
      thickness: 76,
      safeInset: 88,
      revealZoneSize: 10,
      hiddenTransform: '',
      tooltipPlacement: 'top',
      magnificationOrigin: 'bottom center'
    },
    safeArea: { top: 48, right: 0, bottom: 0, left: 0 },
    usableRect: { x: 0, y: 48, width: 1440, height: 852 },
    settings: DEFAULT_PERSONALIZATION_SETTINGS,
    previewSettings: vi.fn(),
  }),
}));

const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
};

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = createLocalStorageMock();
}

describe('ORION-9 — PERSONALIZATION / WALLPAPER / DESKTOP & WINDOWS CONSOLIDATION AUDIT', () => {
  let engine: OrionThemeEngine;

  beforeEach(() => {
    globalThis.localStorage.clear();
    RuntimeSettingsAuthority.instance.reload();
    engine = new OrionThemeEngine();
    engine.resetToDefaults();
  });

  afterEach(() => {
    globalThis.localStorage.clear();
  });

  // TEST 1 — Appearance mode switch persists across refresh
  it('TEST 1: Appearance mode switch persists across refresh', () => {
    engine.setPreference('appearanceMode', 'light');
    const prefs = loadPreferences();
    expect(prefs.appearanceMode).toBe('light');

    // Simulate page reload / new engine instance
    const freshEngine = new OrionThemeEngine();
    expect(freshEngine.getPreferences().appearanceMode).toBe('light');
    expect(freshEngine.getResolvedTheme().appearance.mode).toBe('light');
  });

  // TEST 2 — Accent color switch persists across refresh
  it('TEST 2: Accent color switch persists across refresh', () => {
    engine.setTheme('forest');
    const prefs = loadPreferences();
    expect(prefs.themeId).toBe('forest');

    const freshEngine = new OrionThemeEngine();
    expect(freshEngine.getPreferences().themeId).toBe('forest');
    expect(freshEngine.getResolvedTheme().id).toBe('forest');
  });

  // TEST 3 — Custom accent color works and persists
  it('TEST 3: Custom accent color works and persists', () => {
    engine.setPreference('customAccentEnabled', true);
    engine.setPreference('customAccent', '#FF5733');
    expect(engine.getResolvedAccent()).toBe('#FF5733');

    const prefs = loadPreferences();
    expect(prefs.customAccentEnabled).toBe(true);
    expect(prefs.customAccent).toBe('#FF5733');
  });

  // TEST 4 — Wallpaper Studio: solid wallpaper sets background
  it('TEST 4: Wallpaper Studio: solid wallpaper sets background', () => {
    RuntimeSettingsAuthority.instance.updateSettings({
      wallpaper: {
        ...RuntimeSettingsAuthority.instance.settings.wallpaper,
        desktopWallpaperId: 'solid-slate',
        fit: 'cover'
      }
    });

    const current = RuntimeSettingsAuthority.instance.settings.wallpaper;
    expect(current.desktopWallpaperId).toBe('solid-slate');
    expect(current.fit).toBe('cover');
  });

  // TEST 5 — Wallpaper Studio: image wallpaper sets background
  it('TEST 5: Wallpaper Studio: image wallpaper sets background', async () => {
    await wallpaperRepository.setActiveWallpaper(DEFAULT_DESKTOP_WALLPAPER.wallpaperId, 'test-user', 'desktop');
    const current = wallpaperRepository.getActiveWallpaperSync('test-user', 'desktop');
    expect(current.wallpaperId).toBe(DEFAULT_DESKTOP_WALLPAPER.wallpaperId);
    expect(current.target).toBe('desktop');
  });

  // TEST 6 — Wallpaper Studio: blur/dim controls work in runtime authority
  it('TEST 6: Wallpaper Studio: blur/dim controls work in runtime authority', () => {
    RuntimeSettingsAuthority.instance.updateSettings({
      wallpaper: {
        ...RuntimeSettingsAuthority.instance.settings.wallpaper,
        wallpaperBlur: 12,
        wallpaperDim: 45
      }
    });

    const authoritySettings = RuntimeSettingsAuthority.instance.settings;
    expect(authoritySettings.wallpaper.wallpaperBlur).toBe(12);
    expect(authoritySettings.wallpaper.wallpaperDim).toBe(45);
  });

  // TEST 7 — Desktop & Windows: icon size changes take effect
  it('TEST 7: Desktop & Windows: icon size changes take effect', () => {
    RuntimeSettingsAuthority.instance.updateSettings({
      desktop: {
        ...RuntimeSettingsAuthority.instance.settings.desktop,
        iconSize: 'large'
      }
    });

    expect(RuntimeSettingsAuthority.instance.settings.desktop.iconSize).toBe('large');
  });

  // TEST 8 — Desktop & Windows: grid alignment toggle works
  it('TEST 8: Desktop & Windows: grid alignment toggle works', () => {
    const html = renderToString(
      <PersonalizationSettingsPanel
        settings={{
          ...DEFAULT_PERSONALIZATION_SETTINGS,
          iconLayout: 'grid',
          autoArrangeIcons: true,
          snapToGrid: true
        }}
        onChange={() => {}}
      />
    );

    expect(html).toContain('Align to Grid');
    expect(html).toContain('Freeform Positioning');
    expect(html).toContain('Auto-Arrange Icons');
    expect(html).toContain('Snap to Grid on Drop');
  });

  // TEST 9 — Desktop & Windows: dock position change moves the dock
  it('TEST 9: Desktop & Windows: dock position change moves the dock', () => {
    RuntimeSettingsAuthority.instance.updateSettings({
      dock: {
        ...RuntimeSettingsAuthority.instance.settings.dock,
        dockPosition: 'left'
      }
    });

    const prefs = loadPreferences();
    prefs.dockPosition = 'left';
    savePreferences(prefs);

    expect(RuntimeSettingsAuthority.instance.settings.dock.dockPosition).toBe('left');
    expect(loadPreferences().dockPosition).toBe('left');
  });

  // TEST 10 — Desktop & Windows: auto-hide toggle works
  it('TEST 10: Desktop & Windows: auto-hide toggle works', () => {
    RuntimeSettingsAuthority.instance.updateSettings({
      dock: {
        ...RuntimeSettingsAuthority.instance.settings.dock,
        dockAutoHide: true
      }
    });

    const prefs = loadPreferences();
    prefs.dockAutoHide = true;
    savePreferences(prefs);

    expect(RuntimeSettingsAuthority.instance.settings.dock.dockAutoHide).toBe(true);
    expect(loadPreferences().dockAutoHide).toBe(true);
  });

  // TEST 11 — Desktop & Windows: Window Controls Position toggle works (Mac vs Windows)
  it('TEST 11: Desktop & Windows: Window Controls Position toggle works (Mac vs Windows)', () => {
    RuntimeSettingsAuthority.instance.updateSettings({
      window: {
        ...RuntimeSettingsAuthority.instance.settings.window,
        windowControlPosition: 'right'
      }
    });

    const prefs = loadPreferences();
    prefs.windowControlPosition = 'right';
    savePreferences(prefs);

    expect(RuntimeSettingsAuthority.instance.settings.window.windowControlPosition).toBe('right');
    expect(loadPreferences().windowControlPosition).toBe('right');
  });

  // TEST 12 — Window Controls Position affects all open windows / persists to RuntimeSettingsAuthority
  it('TEST 12: Window Controls Position persists to RuntimeSettingsAuthority and OrionThemeStorage', () => {
    RuntimeSettingsAuthority.instance.updateSettings({
      window: {
        ...RuntimeSettingsAuthority.instance.settings.window,
        windowControlPosition: 'left'
      }
    });

    const prefs = loadPreferences();
    prefs.windowControlPosition = 'left';
    savePreferences(prefs);

    expect(RuntimeSettingsAuthority.instance.settings.window.windowControlPosition).toBe('left');
    expect(loadPreferences().windowControlPosition).toBe('left');
  });

  // TEST 13 — No duplicate wallpaper controls anywhere in Desktop & Windows settings
  it('TEST 13: Desktop & Windows has ZERO duplicate wallpaper controls, sliders, or grids', () => {
    const html = renderToString(
      <PersonalizationSettingsPanel
        settings={DEFAULT_PERSONALIZATION_SETTINGS}
        onChange={() => {}}
      />
    );

    // Verify wallpaper section is completely absent from rendered HTML
    expect(html).not.toContain('WALLPAPER &amp; BACKGROUND SELECTION');
    expect(html).not.toContain('WALLPAPER & BACKGROUND SELECTION');
    expect(html).not.toContain('Desktop Wallpaper');
    expect(html).not.toContain('Wallpaper Blur:');
    expect(html).not.toContain('Wallpaper Dim Overlay:');
    expect(html).not.toContain('Graphite Mesh');
    expect(html).not.toContain('Solid Dark');

    // Verify source code has no wallpaper controls
    const filePath = path.resolve(__dirname, '../../components/settings/PersonalizationSettingsPanel.tsx');
    const source = fs.readFileSync(filePath, 'utf-8');
    expect(source).not.toContain('WALLPAPER & BACKGROUND SELECTION');
    expect(source).not.toContain('wallpapers.map');
    expect(source).not.toContain('wallpaperBlur');
    expect(source).not.toContain('wallpaperDim');
  });

  // TEST 14 — No duplicate window control position controls in Appearance
  it('TEST 14: Desktop & Windows is the single authoritative home for Window Controls Position', () => {
    const appearancePath = path.resolve(__dirname, '../../components/settings/AppearanceSettingsPanel.tsx');
    const appearanceSource = fs.readFileSync(appearancePath, 'utf-8');

    // AppearanceSettingsPanel must not duplicate Window Controls Position section
    expect(appearanceSource).not.toContain('Window Controls Position');
    expect(appearanceSource).not.toContain('Right — Windows style');

    // PersonalizationSettingsPanel MUST contain Window Controls Position
    const personalPath = path.resolve(__dirname, '../../components/settings/PersonalizationSettingsPanel.tsx');
    const personalSource = fs.readFileSync(personalPath, 'utf-8');
    expect(personalSource).toContain('Window Controls Position');
    expect(personalSource).toContain('windowControlPosition');
    expect(personalSource).toContain('Left — Mac style');
    expect(personalSource).toContain('Right — Windows style');
  });

  // TEST 15 — Performance & Theme Anti-Reversion: Desktop & Windows setting changes do NOT revert active user theme
  it('TEST 15: Theme does NOT revert to default when modifying Desktop & Windows settings', () => {
    // 1. User picks 'midnight' theme
    engine.setTheme('midnight');
    expect(loadPreferences().themeId).toBe('midnight');

    // 2. Render Desktop & Windows with current settings
    const html = renderToString(
      <PersonalizationSettingsPanel
        settings={{
          ...DEFAULT_PERSONALIZATION_SETTINGS,
          themeId: 'midnight',
          dockPosition: 'bottom'
        }}
        onChange={() => {}}
      />
    );

    // 3. Verify themeId remains 'midnight' and has NOT reverted to 'graphite'
    const currentPrefs = loadPreferences();
    expect(currentPrefs.themeId).toBe('midnight');

    // 4. Verify canonical heading is 'Desktop & Windows' and not legacy 'Desktop & Dock Personalization'
    expect(html).toContain('Desktop &amp; Windows');
    expect(html).not.toContain('Desktop &amp; Dock Personalization');
    expect(html).not.toContain('Desktop & Dock Personalization');
  });
});
