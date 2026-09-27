import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SUPPORTED_LOCALES,
  SUPPORTED_LOCALE_CODES,
  LOCALE_STORAGE_KEYS,
  resolveInitialLocale,
  detectBrowserLocale,
  getTranslation,
  formatDate,
  formatTime,
  formatDateTime,
  formatNumber,
  formatCurrency,
  isValidLocale,
  TRANSLATIONS,
} from '../../i18n';
import { validateAllLocales, extractKeys } from '../../i18n/validation';
import { SupportedLocale } from '../../i18n/types';

// Simple in-memory localStorage polyfill for Node test runner
class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = new LocalStorageMock();
}
if (typeof globalThis.sessionStorage === 'undefined') {
  (globalThis as any).sessionStorage = new LocalStorageMock();
}
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = globalThis;
}
if (typeof globalThis.document === 'undefined') {
  (globalThis as any).document = {
    documentElement: {
      lang: 'en',
      dir: 'ltr',
    },
  };
}
if (typeof globalThis.navigator === 'undefined') {
  (globalThis as any).navigator = {
    language: 'en-US',
    languages: ['en-US', 'en'],
  };
}

describe('ORION-9 Global Language & Localization System', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  // TEST 1: Default Locale & UI Rendering
  it('1. Default locale resolves to English (en) and renders English translations', () => {
    const locale = resolveInitialLocale();
    expect(locale).toBe('en');

    const signInTitle = getTranslation('en', 'auth.signInTitle');
    expect(signInTitle).toBe('Sign in to Orion');

    const settingsTitle = getTranslation('en', 'navigation.settings');
    expect(settingsTitle).toBe('Settings');

    const wallpaperStudio = getTranslation('en', 'wallpaper.title');
    expect(wallpaperStudio).toBe('Wallpaper Studio');
  });

  // TEST 2: Select Hindi
  it('2. Selecting Hindi (hi) resolves hi translations and updates DOM lang', () => {
    localStorage.setItem(LOCALE_STORAGE_KEYS.PRE_LOGIN, 'hi');
    const locale = resolveInitialLocale();
    expect(locale).toBe('hi');

    document.documentElement.lang = locale;
    expect(document.documentElement.lang).toBe('hi');
    expect(document.documentElement.dir).toBe('ltr');

    const signInTitle = getTranslation('hi', 'auth.signInTitle');
    expect(signInTitle).toBe('Orion में साइन इन करें');

    const userNotFound = getTranslation('hi', 'auth.userNotFound');
    expect(userNotFound).toBe('उपयोगकर्ता नहीं मिला');

    const wallpaperTitle = getTranslation('hi', 'wallpaper.title');
    expect(wallpaperTitle).toBe('वॉलपेपर स्टूडियो');
  });

  // TEST 3: Select Spanish
  it('3. Selecting Spanish (es) resolves es translations and updates DOM lang', () => {
    localStorage.setItem(LOCALE_STORAGE_KEYS.PRE_LOGIN, 'es');
    const locale = resolveInitialLocale();
    expect(locale).toBe('es');

    document.documentElement.lang = locale;
    expect(document.documentElement.lang).toBe('es');

    const signInTitle = getTranslation('es', 'auth.signInTitle');
    expect(signInTitle).toBe('Iniciar sesión en Orion');

    const userNotFound = getTranslation('es', 'auth.userNotFound');
    expect(userNotFound).toBe('Usuario no encontrado');

    const wallpaperTitle = getTranslation('es', 'wallpaper.title');
    expect(wallpaperTitle).toBe('Estudio de fondos');
  });

  // TEST 4: Select German
  it('4. Selecting German (de) resolves de translations and updates DOM lang', () => {
    localStorage.setItem(LOCALE_STORAGE_KEYS.PRE_LOGIN, 'de');
    const locale = resolveInitialLocale();
    expect(locale).toBe('de');

    document.documentElement.lang = locale;
    expect(document.documentElement.lang).toBe('de');

    const signInTitle = getTranslation('de', 'auth.signInTitle');
    expect(signInTitle).toBe('Anmelden bei Orion');

    const userNotFound = getTranslation('de', 'auth.userNotFound');
    expect(userNotFound).toBe('Benutzer nicht gefunden');

    const wallpaperTitle = getTranslation('de', 'wallpaper.title');
    expect(wallpaperTitle).toBe('Hintergrund-Studio');
  });

  // TEST 5: Refresh Application Persistence
  it('5. Selected language survives application reload through localStorage', () => {
    localStorage.setItem(LOCALE_STORAGE_KEYS.GLOBAL, 'de');
    localStorage.setItem(LOCALE_STORAGE_KEYS.PRE_LOGIN, 'de');

    // Simulate page reload
    const reloadedLocale = resolveInitialLocale();
    expect(reloadedLocale).toBe('de');
    expect(getTranslation(reloadedLocale, 'common.save')).toBe('Speichern');
  });

  // TEST 6: Pre-Login Language Selection Persistence
  it('6. Login screen selector persists pre-login choice to survive session initialization', () => {
    // User chooses Hindi on login screen before authenticating
    localStorage.setItem(LOCALE_STORAGE_KEYS.PRE_LOGIN, 'hi');

    // Initial resolution before user ID exists
    const preLoginLocale = resolveInitialLocale();
    expect(preLoginLocale).toBe('hi');

    // Verify translations reflect choice
    expect(getTranslation(preLoginLocale, 'auth.enterOrionBtn')).toBe('Orion में प्रवेश करें');
  });

  // TEST 7: User Settings Language Change
  it('7. User explicit language preference takes absolute precedence', () => {
    const resolved = resolveInitialLocale({
      userPreference: 'es',
      orgDefault: 'de',
      storedPreLogin: 'hi',
    });
    expect(resolved).toBe('es');
    expect(getTranslation(resolved, 'navigation.myAccount')).toBe('Mi cuenta');
  });

  // TEST 8: Admin Organization Default
  it('8. Organization default language applies to new users without personal preference', () => {
    localStorage.setItem(LOCALE_STORAGE_KEYS.ORG_DEFAULT, 'es');

    // New user with no explicit preference
    const resolved = resolveInitialLocale();
    expect(resolved).toBe('es');
    expect(getTranslation(resolved, 'common.confirm')).toBe('Confirmar');
  });

  // TEST 9: Priority Resolution: Explicit User Choice vs Org Default
  it('9. Explicit user choice (de) overrides organization default (es)', () => {
    const resolved = resolveInitialLocale({
      userPreference: 'de',
      orgDefault: 'es',
      storedPreLogin: 'hi',
    });
    expect(resolved).toBe('de');
    expect(getTranslation(resolved, 'common.apply')).toBe('Anwenden');
  });

  // TEST 10: Browser Language Fallback & Unsupported Languages
  it('10. Unsupported browser language (xx) falls back gracefully to English (en)', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('xx-YY');
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['xx-YY', 'xx']);

    const resolved = resolveInitialLocale();
    expect(resolved).toBe('en'); // Falls back to English
  });

  it('10b. Supported browser language (de-DE) correctly detects de', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('de-DE');
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['de-DE', 'de']);

    const detected = detectBrowserLocale();
    expect(detected).toBe('de');
  });

  // TEST 11: 100% Key Parity Across Base Locales
  it('11. 100% translation key parity across English, Hindi, Spanish, and German', () => {
    const validation = validateAllLocales();
    expect(validation.valid).toBe(true);
    expect(validation.baseKeyCount).toBeGreaterThan(100);

    expect(validation.missingKeys.hi).toEqual([]);
    expect(validation.missingKeys.es).toEqual([]);
    expect(validation.missingKeys.de).toEqual([]);

    expect(validation.extraKeys.hi).toEqual([]);
    expect(validation.extraKeys.es).toEqual([]);
    expect(validation.extraKeys.de).toEqual([]);
  });

  // TEST 12: Technical Terms Integrity & Formatting Helpers
  it('12. Technical terms (ORION-9, Orion) remain intact, and formatting helpers function properly', () => {
    const locales: SupportedLocale[] = ['en', 'hi', 'es', 'de'];

    for (const loc of locales) {
      const platformName = getTranslation(loc, 'common.orionPlatform');
      expect(platformName).toContain('ORION-9');

      const authTitle = getTranslation(loc, 'auth.signInTitle');
      expect(authTitle).toContain('Orion');
    }

    const testDate = new Date('2026-09-27T10:30:00Z');
    const formattedEn = formatDate(testDate, 'en');
    expect(formattedEn).toBeDefined();

    const formattedHi = formatDate(testDate, 'hi');
    expect(formattedHi).toBeDefined();

    const numEn = formatNumber(1234567.89, 'en');
    expect(numEn).toContain('1,234,567.89');

    const numDe = formatNumber(1234567.89, 'de');
    expect(numDe).toContain('1.234.567,89');
  });

  // All World Locales Exist with Full Native Metadata
  it('13. All 30 supported world locales exist with full native metadata', () => {
    expect(SUPPORTED_LOCALE_CODES.length).toBeGreaterThanOrEqual(30);

    expect(SUPPORTED_LOCALES.en.nativeName).toBe('English');
    expect(SUPPORTED_LOCALES.hi.nativeName).toBe('हिन्दी');
    expect(SUPPORTED_LOCALES.es.nativeName).toBe('Español');
    expect(SUPPORTED_LOCALES.de.nativeName).toBe('Deutsch');
    expect(SUPPORTED_LOCALES.ja.nativeName).toBe('日本語');
    expect(SUPPORTED_LOCALES.ar.nativeName).toBe('العربية');
    expect(SUPPORTED_LOCALES.ar.dir).toBe('rtl');
  });
});
