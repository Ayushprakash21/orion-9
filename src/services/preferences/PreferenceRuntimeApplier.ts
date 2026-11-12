/**
 * ORION-9 AUTHORITATIVE RUNTIME PREFERENCE APPLIER
 *
 * Single synchronous convergence point pushing resolved preferences
 * (Display scale, font, text size, theme, Dock, Desktop icons, Wallpaper,
 * Accessibility, Dynamic Island mode, Language) to DOM CSS variables,
 * OrionThemeStorage, RuntimeSettingsAuthority, and active contexts.
 */

import {
  OrionFontFamily,
  ResolvedPreferencesResult,
  UserPreferencesRecord,
} from './PreferenceResolutionEngine';
import { loadPreferences, savePreferences, clearPreferences } from '../../os/theme/OrionThemeStorage';
import { isValidThemeId } from '../../os/theme/OrionThemeRegistry';
import { RuntimeSettingsAuthority } from '../../os/settings/RuntimeSettingsAuthority';
import { resolveThemeVariables, applyThemeToDocument } from '../../theme/themeResolver';
import { DEFAULT_PERSONALIZATION_SETTINGS } from '../../theme/themePresets';
import { DEFAULT_SYSTEM_SETTINGS, normalizeSettings, SystemSettings } from '../../types/settings';
import { languageService } from '../../i18n/LanguagePackService';

const FONT_STACKS: Record<OrionFontFamily, string> = {
  ROBOTO: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  LATO: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  ARIAL: 'Arial, Helvetica, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

let lastAppliedUserId: string | null = null;

export function applyResolvedPreferencesToDOMAndRuntime(
  resolved: ResolvedPreferencesResult,
  options?: { tenantId?: string; env?: 'LIVE' | 'DEMO' | 'STAGING' }
): SystemSettings {
  const { effective, orgPolicy } = resolved;
  const userId = effective.userId;
  lastAppliedUserId = userId;

  // 1. Typography, Display Scale & Text Size CSS variables
  if (typeof document !== 'undefined' && document.documentElement) {
    const root = document.documentElement;
    const scale = effective.displayScale ?? 100;
    const textSize = effective.textSize ?? 100;
    const fontFamily: OrionFontFamily = effective.fontFamily || 'ROBOTO';

    root.style.setProperty('--orion-text-scale', String(textSize / 100));
    root.style.setProperty('--orion-display-scale', String(scale / 100));
    root.style.setProperty('--orion-font-family', FONT_STACKS[fontFamily]);
    root.dataset.orionFont = fontFamily.toLowerCase();
    root.dataset.orionDisplayScale = String(scale);
    root.dataset.orionTextSize = String(textSize);

    // Theme class + colorScheme
    const themeVal = effective.theme || 'system';
    const systemDark =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const effectiveMode: 'light' | 'dark' =
      effective.appearanceMode === 'light'
        ? 'light'
        : effective.appearanceMode === 'dark'
          ? 'dark'
          : themeVal === 'light'
            ? 'light'
            : themeVal === 'dark'
              ? 'dark'
              : systemDark
                ? 'dark'
                : 'light';

    root.classList.remove('light', 'dark');
    root.classList.add(effectiveMode);
    root.style.colorScheme = effectiveMode;
  }

  // 2. Sync OrionThemeStorage (handles OrionThemeProvider + OrionThemeEngine + OrionThemeCSS)
  const existingThemePrefs = loadPreferences();
  const targetAppearanceMode =
    effective.appearanceMode ||
    (effective.theme === 'light' ? 'light' : effective.theme === 'dark' ? 'dark' : 'auto');

  const resolvedThemeId =
    effective.themeId && isValidThemeId(effective.themeId)
      ? effective.themeId
      : targetAppearanceMode === 'light'
        ? 'silver'
        : targetAppearanceMode === 'dark'
          ? 'graphite'
          : existingThemePrefs.themeId;

  savePreferences({
    ...existingThemePrefs,
    themeId: resolvedThemeId,
    appearanceMode: targetAppearanceMode,
    reduceMotion: effective.reducedMotion ?? existingThemePrefs.reduceMotion,
    transparencyEnabled: effective.reducedTransparency !== undefined ? !effective.reducedTransparency : existingThemePrefs.transparencyEnabled,
    windowStyle: effective.windowStyle || existingThemePrefs.windowStyle,
    cornerRadius: effective.cornerRadius || existingThemePrefs.cornerRadius,
    windowControlPosition: effective.windowControlPosition || existingThemePrefs.windowControlPosition,
    dockPosition: effective.dockPosition || existingThemePrefs.dockPosition,
    dockSize: effective.dockSize || existingThemePrefs.dockSize,
    dockAutoHide: effective.dockAutoHide !== undefined ? effective.dockAutoHide : existingThemePrefs.dockAutoHide,
    dockMagnification: effective.dockMagnification !== undefined ? effective.dockMagnification : existingThemePrefs.dockMagnification,
    dockOpacity: effective.dockTransparency ?? existingThemePrefs.dockOpacity,
    dockBlur: effective.dockBlur ?? existingThemePrefs.dockBlur,
    dockTint: effective.dockTint || existingThemePrefs.dockTint,
  });

  // 3. Synchronize RuntimeSettingsAuthority (single reactive bus for Dock, Window, Wallpaper, Desktop)
  try {
    const rt = RuntimeSettingsAuthority.instance;
    const curRt = rt.settings;
    rt.updateSettings({
      theme: {
        ...curRt.theme,
        themeId: resolvedThemeId,
        appearanceMode: targetAppearanceMode,
        reducedMotion: Boolean(effective.reducedMotion),
      },
      dock: {
        ...curRt.dock,
        dockPosition: effective.dockPosition || curRt.dock.dockPosition,
        dockSize: effective.dockSize || curRt.dock.dockSize,
        dockAutoHide: effective.dockAutoHide !== undefined ? effective.dockAutoHide : curRt.dock.dockAutoHide,
        dockMagnification: effective.dockMagnification !== undefined ? effective.dockMagnification : curRt.dock.dockMagnification,
        dockOpacity: (effective.dockTransparency ?? 85) / 100,
      },
      wallpaper: {
        ...curRt.wallpaper,
        ...(effective.wallpaperId ? { desktopWallpaperId: effective.wallpaperId } : {}),
        ...(typeof effective.wallpaperBlur === 'number' ? { wallpaperBlur: effective.wallpaperBlur } : {}),
        ...(typeof effective.wallpaperDim === 'number' ? { wallpaperDim: effective.wallpaperDim } : {}),
      },
      window: {
        ...curRt.window,
        windowStyle: effective.windowStyle || curRt.window.windowStyle,
        cornerRadiusPreset: effective.cornerRadius || curRt.window.cornerRadiusPreset,
        windowControlPosition: effective.windowControlPosition || curRt.window.windowControlPosition,
      },
      desktop: {
        ...curRt.desktop,
        showDesktopIcons: effective.showDesktopIcons !== undefined ? effective.showDesktopIcons : curRt.desktop.showDesktopIcons,
        iconSize: effective.iconSize || curRt.desktop.iconSize,
      },
    });
  } catch {}

  // 4. Sync Dynamic Island preference keys and notify DynamicIsland hook
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(
        `orion_display_preferences:${userId}`,
        JSON.stringify({
          displayScale: effective.displayScale ?? 100,
          textSize: effective.textSize ?? 100,
          fontFamily: effective.fontFamily ?? 'ROBOTO',
        })
      );

      if (effective.dynamicIslandMode) {
        localStorage.setItem('orion_dynamic_island_mode', effective.dynamicIslandMode);
      }
      if (typeof effective.dynamicIslandPinned === 'boolean') {
        localStorage.setItem('orion_dynamic_island_pinned', String(effective.dynamicIslandPinned));
      }
      if (effective.wallpaperId) {
        localStorage.setItem(`orion_active_wallpaper_id_desktop_${userId}`, effective.wallpaperId);
        localStorage.setItem('orion_active_wallpaper_id_desktop_global', effective.wallpaperId);
      }

      window.dispatchEvent(
        new CustomEvent('orion-display-preferences-changed', {
          detail: {
            userId,
            displayScale: effective.displayScale ?? 100,
            textSize: effective.textSize ?? 100,
            fontFamily: effective.fontFamily ?? 'ROBOTO',
          },
        })
      );
      window.dispatchEvent(
        new CustomEvent('orion:dynamic-island-config-changed', {
          detail: {
            mode: effective.dynamicIslandMode || 'compact',
            pinned: Boolean(effective.dynamicIslandPinned),
          },
        })
      );
    } catch {}
  }

  // 5. Organization & User Language reconciliation
  try {
    if (orgPolicy?.defaultLanguage) {
      languageService.setOrganizationPolicy({
        defaultLanguage: orgPolicy.defaultLanguage as any,
      });
    }
    const targetLang =
      orgPolicy?.enforceLanguage && orgPolicy.defaultLanguage
        ? orgPolicy.defaultLanguage
        : effective.preferredLanguage || orgPolicy?.defaultLanguage;
    if (targetLang && targetLang !== languageService.getActiveLanguage()) {
      void languageService.setActiveLanguage(targetLang);
    }
  } catch {}

  // 6. Build normalized SystemSettings & apply themeResolver DOM tokens + broadcast to SupplyChainContext
  const curCachedSettings = (() => {
    if (typeof localStorage === 'undefined') return {};
    try {
      const scopedKey = `orion_settings:${options?.env || 'DEMO'}:${options?.tenantId || 'ORION_PLATFORM'}:${userId}`;
      const raw = localStorage.getItem(scopedKey) || localStorage.getItem('orion_settings');
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && (!parsed._ownerUserId || parsed._ownerUserId === userId)) {
        return parsed;
      }
    } catch {}
    return {};
  })();

  const nextSettings = normalizeSettings({
    ...DEFAULT_SYSTEM_SETTINGS,
    ...curCachedSettings,
    theme: effective.theme === 'os-obsidian' ? 'dark' : (effective.theme || 'system'),
    displayScale: effective.displayScale ?? 100,
    textSize: effective.textSize ?? 100,
    fontFamily: effective.fontFamily ?? 'ROBOTO',
    showDesktopIcons: effective.showDesktopIcons !== undefined ? effective.showDesktopIcons : true,
    reducedMotion: Boolean(effective.reducedMotion),
    animationStyle: effective.animationStyle || (effective.reducedMotion ? 'reduced' : 'premium'),
    dockMagnification: effective.dockMagnification !== undefined ? effective.dockMagnification : true,
    dockBounceOnLaunch: effective.dockBounceOnLaunch !== undefined ? effective.dockBounceOnLaunch : true,
    genieEffectEnabled: effective.genieEffectEnabled !== undefined ? effective.genieEffectEnabled : true,
    dockPosition: effective.dockPosition === 'top' ? 'bottom' : (effective.dockPosition || 'bottom'),
    personalization: {
      ...DEFAULT_PERSONALIZATION_SETTINGS,
      ...(curCachedSettings?.personalization || {}),
      themeId: resolvedThemeId,
      appearanceMode: targetAppearanceMode,
      dockPosition: effective.dockPosition || 'bottom',
      dockSize: effective.dockSize || 'medium',
      dockAutoHide: effective.dockAutoHide !== undefined ? effective.dockAutoHide : true,
      dockMagnification: effective.dockMagnification !== undefined ? effective.dockMagnification : true,
      dockTransparency: effective.dockTransparency ?? 85,
      dockBlur: effective.dockBlur ?? 80,
      dockTint: effective.dockTint || 'auto',
      iconSize: effective.iconSize || 'medium',
      iconLayout: effective.iconLayout || 'grid',
      windowStyle: effective.windowStyle === 'compact' ? 'compact' : effective.windowStyle === 'glass' ? 'glass' : 'standard',
      windowControlPosition: effective.windowControlPosition || 'left',
      reducedMotion: Boolean(effective.reducedMotion),
      reducedTransparency: Boolean(effective.reducedTransparency),
      animationStyle: effective.animationStyle || (effective.reducedMotion ? 'reduced' : 'premium'),
      highContrast: Boolean(effective.highContrast),
      highContrastFocusRing: Boolean(effective.highContrastFocusRing),
      colorFilter: effective.colorFilter || 'none',
    },
  });

  // Apply personalization theme CSS vars + animation attributes to DOM
  if (nextSettings.personalization) {
    applyThemeToDocument(nextSettings.personalization);
    resolveThemeVariables(nextSettings.personalization);
  }

  // Persist session-scoped settings snapshot with owner identity metadata
  if (typeof localStorage !== 'undefined') {
    try {
      const taggedSnapshot = {
        ...nextSettings,
        _ownerUserId: userId,
        _ownerTenantId: options?.tenantId || effective.organizationId || 'ORION_PLATFORM',
        _updatedAt: effective.updatedAt || new Date().toISOString(),
        _revision: effective.revision || 1,
      };
      const scopedKey = `orion_settings:${options?.env || 'DEMO'}:${options?.tenantId || 'ORION_PLATFORM'}:${userId}`;
      localStorage.setItem(scopedKey, JSON.stringify(taggedSnapshot));
      localStorage.setItem('orion_settings', JSON.stringify(taggedSnapshot));
      window.dispatchEvent(new CustomEvent('orion-hydrated-settings', { detail: taggedSnapshot }));
    } catch {}
  }

  return nextSettings;
}

/**
 * Resets active un-scoped browser session caches on Sign-Out or Account Switch
 * so the outgoing user's theme, font, wallpaper, or dock preferences never leak
 * into the next user who signs in.
 */
export function clearActiveRuntimeSessionCaches(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    lastAppliedUserId = null;
    localStorage.removeItem('orion_settings');
    localStorage.removeItem('orion_theme');
    localStorage.removeItem('orion_dynamic_island_mode');
    localStorage.removeItem('orion_dynamic_island_pinned');
    localStorage.removeItem('orion_active_wallpaper_id_desktop_global');
    localStorage.removeItem('sc_settings');
    clearPreferences();
    RuntimeSettingsAuthority.instance.reload();
    window.dispatchEvent(new CustomEvent('orion:dynamic-island-config-changed', { detail: { mode: 'compact', pinned: false } }));
    window.dispatchEvent(
      new CustomEvent('orion-display-preferences-changed', {
        detail: { displayScale: 100, textSize: 100, fontFamily: 'ROBOTO' },
      })
    );
  } catch {}
}

export function getLastAppliedPreferencesUserId(): string | null {
  return lastAppliedUserId;
}

export function extractPatchFromSystemSettings(next: Partial<SystemSettings>): Partial<UserPreferencesRecord> {
  const patch: Partial<UserPreferencesRecord> = {};
  if (next.theme) patch.theme = next.theme;
  if (next.displayScale !== undefined) patch.displayScale = next.displayScale as any;
  if (next.textSize !== undefined) patch.textSize = next.textSize as any;
  if (next.fontFamily !== undefined) patch.fontFamily = next.fontFamily;
  if (next.showDesktopIcons !== undefined) patch.showDesktopIcons = next.showDesktopIcons;
  if (next.reducedMotion !== undefined) patch.reducedMotion = next.reducedMotion;
  if (next.animationStyle !== undefined) patch.animationStyle = next.animationStyle;
  if (next.dockMagnification !== undefined) patch.dockMagnification = next.dockMagnification;
  if (next.dockBounceOnLaunch !== undefined) patch.dockBounceOnLaunch = next.dockBounceOnLaunch;
  if (next.genieEffectEnabled !== undefined) patch.genieEffectEnabled = next.genieEffectEnabled;

  if (next.personalization) {
    const p = next.personalization;
    if (p.themeId) patch.themeId = p.themeId;
    if (p.appearanceMode && (p.appearanceMode === 'light' || p.appearanceMode === 'dark' || p.appearanceMode === 'auto')) {
      patch.appearanceMode = p.appearanceMode;
      if (!patch.theme) {
        patch.theme = p.appearanceMode === 'light' ? 'light' : p.appearanceMode === 'dark' ? 'dark' : 'system';
      }
    }
    if (p.dockPosition) patch.dockPosition = p.dockPosition;
    if (p.dockSize) patch.dockSize = p.dockSize;
    if (p.dockAutoHide !== undefined) patch.dockAutoHide = p.dockAutoHide;
    if (p.dockMagnification !== undefined) patch.dockMagnification = p.dockMagnification;
    if (p.dockTransparency !== undefined) patch.dockTransparency = p.dockTransparency;
    if (p.dockBlur !== undefined) patch.dockBlur = p.dockBlur;
    if (p.dockTint) patch.dockTint = p.dockTint;
    if (p.iconSize) patch.iconSize = p.iconSize;
    if (p.iconLayout) patch.iconLayout = p.iconLayout;
    if (p.windowStyle && (p.windowStyle === 'standard' || p.windowStyle === 'glass' || p.windowStyle === 'compact')) {
      patch.windowStyle = p.windowStyle;
    }
    if (p.windowControlPosition) patch.windowControlPosition = p.windowControlPosition;
    if (p.reducedMotion !== undefined) patch.reducedMotion = p.reducedMotion;
    if (p.reducedTransparency !== undefined) patch.reducedTransparency = p.reducedTransparency;
    if (p.animationStyle) patch.animationStyle = p.animationStyle;
    if (p.highContrast !== undefined) patch.highContrast = p.highContrast;
    if (p.highContrastFocusRing !== undefined) patch.highContrastFocusRing = p.highContrastFocusRing;
    if (p.colorFilter) patch.colorFilter = p.colorFilter;
    if (typeof p.wallpaperBlur === 'number') patch.wallpaperBlur = p.wallpaperBlur;
    if (typeof p.wallpaperDim === 'number') patch.wallpaperDim = p.wallpaperDim;
  }

  return patch;
}
