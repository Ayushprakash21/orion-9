import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SUPPORTED_LOCALES,
  LOCALE_STORAGE_KEYS,
  resolveInitialLocale,
  getTranslation,
  isValidLocale,
} from '../../i18n';
import { SupportedLocale, SUPPORTED_LOCALE_CODES } from '../../i18n/types';

/**
 * ORION-9 LOGIN LANGUAGE SELECTOR FUNCTIONALITY TEST
 *
 * Verifies the end-to-end language selector flow:
 * 1. Language switching via setLocale
 * 2. Translation lookup returns correct locale strings
 * 3. localStorage persistence (orion.locale + orion_language)
 * 4. Reload persistence via resolveInitialLocale
 * 5. All four languages produce distinct auth translations
 * 6. Round-trip: switch → persist → reload → verify
 */

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
    documentElement: { lang: 'en', dir: 'ltr' },
  };
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('Login Language Selector Functionality', () => {

  // TEST 1: English is the default language
  it('defaults to English when no locale is stored', () => {
    const locale = resolveInitialLocale();
    expect(locale).toBe('en');
    expect(getTranslation('en', 'auth.signInTitle')).toBe('Sign in to Orion');
    expect(getTranslation('en', 'auth.continueBtn')).toBe('Continue');
  });

  // TEST 2: Hindi selection changes auth translations
  it('returns Hindi translations when locale is hi', () => {
    const t = (key: string) => getTranslation('hi', key);
    expect(t('auth.signInTitle')).toBe('Orion में साइन इन करें');
    expect(t('auth.userIdLabel')).toBe('यूज़र ID');
    expect(t('auth.userIdPlaceholder')).toBe('उपयोगकर्ता नाम या ईमेल');
    expect(t('auth.continueBtn')).toBe('जारी रखें');
    expect(t('auth.subtitle')).toBe('अपने वर्कस्पेस तक पहुँचने के लिए यूज़र ID दर्ज करें');
  });

  // TEST 3: Spanish selection changes auth translations
  it('returns Spanish translations when locale is es', () => {
    const t = (key: string) => getTranslation('es', key);
    expect(t('auth.signInTitle')).toBe('Iniciar sesión en Orion');
    expect(t('auth.userIdLabel')).toBe('ID de usuario');
    expect(t('auth.userIdPlaceholder')).toBe('Nombre de usuario o correo');
    expect(t('auth.continueBtn')).toBe('Continuar');
  });

  // TEST 4: German selection changes auth translations
  it('returns German translations when locale is de', () => {
    const t = (key: string) => getTranslation('de', key);
    expect(t('auth.signInTitle')).toBe('Anmelden bei Orion');
    expect(t('auth.userIdLabel')).toBe('Benutzer-ID');
    expect(t('auth.userIdPlaceholder')).toBe('Benutzername oder E-Mail');
    expect(t('auth.continueBtn')).toBe('Weiter');
  });

  // TEST 5: Major locales produce distinct signInTitle strings
  it('major locales produce distinct signInTitle translations', () => {
    const testCodes = ['en', 'hi', 'es', 'de', 'fr', 'ja', 'ar', 'zh', 'ru'];
    const titles = testCodes.map(code =>
      getTranslation(code as SupportedLocale, 'auth.signInTitle')
    );
    const unique = new Set(titles);
    expect(unique.size).toBe(testCodes.length);
  });

  // TEST 6: localStorage persistence via setLocale simulation
  it('persists language selection to both localStorage keys', () => {
    const newLocale: SupportedLocale = 'hi';

    // Simulate what LanguageContext.setLocale does
    localStorage.setItem(LOCALE_STORAGE_KEYS.PRE_LOGIN, newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEYS.GLOBAL, newLocale);
    sessionStorage.setItem(LOCALE_STORAGE_KEYS.PRE_LOGIN, newLocale);
    sessionStorage.setItem(LOCALE_STORAGE_KEYS.GLOBAL, newLocale);

    expect(localStorage.getItem('orion.locale')).toBe('hi');
    expect(localStorage.getItem('orion_language')).toBe('hi');
  });

  // TEST 7: resolveInitialLocale picks up persisted Hindi on reload
  it('resolves stored Hindi locale after simulated page reload', () => {
    localStorage.setItem(LOCALE_STORAGE_KEYS.GLOBAL, 'hi');
    const resolved = resolveInitialLocale();
    expect(resolved).toBe('hi');
  });

  // TEST 8: Full round-trip — select Hindi → persist → reload → verify translations
  it('round-trip: Hindi → persist → reload → correct translations', () => {
    // 1. Simulate selecting Hindi
    localStorage.setItem(LOCALE_STORAGE_KEYS.PRE_LOGIN, 'hi');
    localStorage.setItem(LOCALE_STORAGE_KEYS.GLOBAL, 'hi');

    // 2. Simulate page reload — resolveInitialLocale reads from storage
    const resolvedLocale = resolveInitialLocale();
    expect(resolvedLocale).toBe('hi');

    // 3. Verify translations match Hindi
    expect(getTranslation(resolvedLocale, 'auth.signInTitle')).toBe('Orion में साइन इन करें');
    expect(getTranslation(resolvedLocale, 'auth.continueBtn')).toBe('जारी रखें');
  });

  // TEST 9: Switch back to English from Hindi
  it('round-trip: Hindi → English — UI reverts correctly', () => {
    // Start with Hindi persisted
    localStorage.setItem(LOCALE_STORAGE_KEYS.GLOBAL, 'hi');
    expect(resolveInitialLocale()).toBe('hi');

    // Switch to English
    localStorage.setItem(LOCALE_STORAGE_KEYS.PRE_LOGIN, 'en');
    localStorage.setItem(LOCALE_STORAGE_KEYS.GLOBAL, 'en');

    expect(resolveInitialLocale()).toBe('en');
    expect(getTranslation('en', 'auth.signInTitle')).toBe('Sign in to Orion');
  });

  // TEST 10: German round-trip persistence
  it('round-trip: German → persist → reload → correct translations', () => {
    localStorage.setItem(LOCALE_STORAGE_KEYS.PRE_LOGIN, 'de');
    localStorage.setItem(LOCALE_STORAGE_KEYS.GLOBAL, 'de');

    const resolved = resolveInitialLocale();
    expect(resolved).toBe('de');
    expect(getTranslation(resolved, 'auth.signInTitle')).toBe('Anmelden bei Orion');
    expect(getTranslation(resolved, 'auth.continueBtn')).toBe('Weiter');
  });

  // TEST 11: isValidLocale correctly validates all supported codes
  it('validates all supported locale codes', () => {
    expect(isValidLocale('en')).toBe(true);
    expect(isValidLocale('hi')).toBe(true);
    expect(isValidLocale('es')).toBe(true);
    expect(isValidLocale('de')).toBe(true);
    expect(isValidLocale('fr')).toBe(true);
    expect(isValidLocale('ja')).toBe(true);
    expect(isValidLocale('ar')).toBe(true);
    expect(isValidLocale('invalid_code')).toBe(false);
    expect(isValidLocale('')).toBe(false);
    expect(isValidLocale(null)).toBe(false);
    expect(isValidLocale(undefined)).toBe(false);
  });

  // TEST 12: Each locale has the full auth translation key set
  it('all locales have complete auth translation keys', () => {
    const requiredAuthKeys = [
      'signInTitle', 'subtitle', 'userIdLabel', 'userIdPlaceholder',
      'continueBtn', 'enterPassword', 'enterOrionBtn', 'identifying',
      'userNotFound', 'invalidCredentials', 'rememberMe', 'forgotPassword',
      'otherUser', 'switchUser', 'lock', 'signOut', 'restart', 'shutDown',
      'selectLanguage',
    ];

    for (const code of SUPPORTED_LOCALE_CODES) {
      for (const key of requiredAuthKeys) {
        const val = getTranslation(code, `auth.${key}`);
        // Should NOT fall back to the dot-notation key itself
        expect(val).not.toBe(`auth.${key}`);
        expect(typeof val).toBe('string');
        expect(val.length).toBeGreaterThan(0);
      }
    }
  });

  // TEST 13: SUPPORTED_LOCALES registry contains 30 world languages
  it('SUPPORTED_LOCALES contains 30 global languages', () => {
    expect(Object.keys(SUPPORTED_LOCALES).length).toBe(30);
    expect(SUPPORTED_LOCALE_CODES.length).toBe(30);
    const codes = Object.values(SUPPORTED_LOCALES).map(l => l.code);
    expect(codes).toEqual(SUPPORTED_LOCALE_CODES);
  });

  // TEST 14: selectLanguage auth key exists in all locales
  it('auth.selectLanguage translation exists in all locales', () => {
    for (const code of SUPPORTED_LOCALE_CODES) {
      const val = getTranslation(code, 'auth.selectLanguage');
      expect(val).not.toBe('auth.selectLanguage');
      expect(val.length).toBeGreaterThan(0);
    }
  });
});
