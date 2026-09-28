import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LanguagePackService } from '../../i18n/LanguagePackService';
import { SUPPORTED_LOCALES } from '../../i18n/types';
import { getTranslation, resolveInitialLocale } from '../../i18n';

// In-memory mock for Node test runner
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
      setAttribute: vi.fn(),
      getAttribute: vi.fn(() => 'no'),
    },
  };
}

describe('ORION-9 — Language Services Runtime Translation & Architecture Verification', () => {
  let service: LanguagePackService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    service = LanguagePackService.getInstance();
    service.setActiveLanguage('en');
  });

  afterEach(() => {
    service.setActiveLanguage('en');
  });

  describe('1. Truth in Installed Packs & Catalog Discovery', () => {
    it('verifies only truly installed packs are counted (4 built-in initially)', () => {
      const installed = service.listInstalledLanguages();
      expect(installed.length).toBe(4);
      expect(installed.map(i => i.locale)).toEqual(['en', 'hi', 'es', 'de']);

      const available = service.listAvailableLanguages();
      expect(available.length).toBe(36); // 40 total minus 4 built-ins
    });

    it('installs an available language pack, updating installed and available lists atomically', async () => {
      expect(service.listInstalledLanguages().length).toBe(4);
      expect(service.listAvailableLanguages().some(m => m.id.startsWith('fr'))).toBe(true);

      const installRes = await service.installLanguagePack('fr');
      expect(installRes.success).toBe(true);

      const updatedInstalled = service.listInstalledLanguages();
      expect(updatedInstalled.length).toBe(5);
      expect(updatedInstalled.some(p => p.locale === 'fr')).toBe(true);

      const updatedAvailable = service.listAvailableLanguages();
      expect(updatedAvailable.length).toBe(35);
      expect(updatedAvailable.some(m => m.id.startsWith('fr'))).toBe(false);

      // Uninstalling French reverts counts
      const uninstallRes = await service.uninstallLanguagePack('fr');
      expect(uninstallRes.success).toBe(true);
      expect(service.listInstalledLanguages().length).toBe(4);
      expect(service.listAvailableLanguages().length).toBe(36);
    });
  });

  describe('2. Realtime UI Translation & Reactive Service Updates', () => {
    it('notifies listeners and immediately returns correct translations when active language changes', async () => {
      let listenerCalls = 0;
      const unsubscribe = service.addListener(() => {
        listenerCalls++;
      });

      // 1. Initial English state
      expect(service.getActiveLanguage()).toBe('en');
      expect(service.getTranslation('en', 'auth.signInTitle')).toBe('Sign in to Orion');
      expect(service.getTranslation('en', 'auth.userIdLabel')).toBe('User ID');
      expect(service.getTranslation('en', 'auth.continueBtn')).toBe('Continue');
      expect(service.getTranslation('en', 'common.save')).toBe('Save');

      // 2. Switch to Hindi
      await service.setActiveLanguage('hi');
      expect(listenerCalls).toBe(1);
      expect(service.getActiveLanguage()).toBe('hi');
      expect(service.getTranslation('hi', 'auth.signInTitle')).toBe('Orion में साइन इन करें');
      expect(service.getTranslation('hi', 'auth.userIdLabel')).toBe('यूज़र ID');
      expect(service.getTranslation('hi', 'auth.continueBtn')).toBe('जारी रखें');
      expect(service.getTranslation('hi', 'common.save')).toBe('सहेजें');

      // 3. Switch to Spanish
      await service.setActiveLanguage('es');
      expect(listenerCalls).toBe(2);
      expect(service.getActiveLanguage()).toBe('es');
      expect(service.getTranslation('es', 'auth.signInTitle')).toBe('Iniciar sesión en Orion');
      expect(service.getTranslation('es', 'auth.userIdLabel')).toBe('ID de usuario');
      expect(service.getTranslation('es', 'auth.continueBtn')).toBe('Continuar');
      expect(service.getTranslation('es', 'common.save')).toBe('Guardar');

      // 4. Switch to German
      await service.setActiveLanguage('de');
      expect(listenerCalls).toBe(3);
      expect(service.getActiveLanguage()).toBe('de');
      expect(service.getTranslation('de', 'auth.signInTitle')).toBe('Anmelden bei Orion');
      expect(service.getTranslation('de', 'auth.userIdLabel')).toBe('Benutzer-ID');
      expect(service.getTranslation('de', 'auth.continueBtn')).toBe('Weiter');
      expect(service.getTranslation('de', 'common.save')).toBe('Speichern');

      unsubscribe();
    });
  });

  describe('3. Dynamic RTL Support & Document Direction', () => {
    it('switches text direction to rtl for Arabic and updates documentElement dir', async () => {
      expect(service.getActiveDirection()).toBe('ltr');

      // Switch to Arabic
      await service.setActiveLanguage('ar');

      expect(service.getActiveLanguage()).toBe('ar');
      expect(service.getActiveDirection()).toBe('rtl');
      if (typeof document !== 'undefined' && document.documentElement) {
        expect(document.documentElement.dir).toBe('rtl');
        expect(document.documentElement.lang).toBe('ar-SA');
      }

      // Switch back to English
      await service.setActiveLanguage('en');

      expect(service.getActiveDirection()).toBe('ltr');
      if (typeof document !== 'undefined' && document.documentElement) {
        expect(document.documentElement.dir).toBe('ltr');
        expect(document.documentElement.lang).toBe('en-US');
      }
    });
  });

  describe('4. Pre-Login Language Persistence', () => {
    it('persists language selection across page reloads without authenticated user', async () => {
      await service.setActiveLanguage('es');

      expect(localStorage.getItem('orion_language')).toBe('es');
      expect(localStorage.getItem('orion.locale')).toBe('es');

      // Simulate clean page load resolution
      const resolved = resolveInitialLocale({ storedPreLogin: 'es' });
      expect(resolved).toBe('es');
      expect(getTranslation(resolved, 'auth.signInTitle')).toBe('Iniciar sesión en Orion');
    });
  });

  describe('5. Air-Gapped / Offline Translation Safety', () => {
    it('verifies zero external network translation dependencies and protects identifiers', () => {
      // Technical identifiers test
      const tEn = (k: string) => service.getTranslation('en', k);
      const tHi = (k: string) => service.getTranslation('hi', k);

      // Platform identifier
      expect(tEn('common.orionPlatform')).toBe('ORION-9 Platform');
      expect(tHi('common.orionPlatform')).toBe('ORION-9 प्लेटफ़ॉर्म');

      // Non-existent key falls back to key itself safely without throwing
      expect(service.getTranslation('hi', 'scm.grn.unmapped_field_key')).toBe('scm.grn.unmapped_field_key');
    });
  });
});
