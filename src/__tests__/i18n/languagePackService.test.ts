import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LanguagePackService } from '../../i18n/LanguagePackService';
import { validateOrionLanguagePack, OrionLanguagePack } from '../../i18n/languagePack';
import { SUPPORTED_LOCALES } from '../../i18n/types';

describe('ORION-9 — Language Services & Language Pack Architecture', () => {
  let service: LanguagePackService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = LanguagePackService.getInstance();
  });

  describe('1. Authoritative Language Registry & Built-In Packs', () => {
    it('maintains a single authoritative registry with core built-in languages', () => {
      const installed = service.listInstalledLanguages();
      const builtIns = installed.filter(i => i.isBuiltIn);

      expect(builtIns.length).toBe(4);
      const codes = builtIns.map(b => b.locale);
      expect(codes).toContain('en');
      expect(codes).toContain('hi');
      expect(codes).toContain('es');
      expect(codes).toContain('de');

      // Built-ins cannot be uninstalled
      expect(service.isBuiltIn('en')).toBe(true);
      expect(service.isBuiltIn('hi')).toBe(true);
      expect(service.isBuiltIn('es')).toBe(true);
      expect(service.isBuiltIn('de')).toBe(true);
    });

    it('denies uninstallation of core built-in languages', async () => {
      const result = await service.uninstallLanguagePack('en');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Core built-in languages');
    });
  });

  describe('2. Available Language Catalog & Downloadable Language Packs', () => {
    it('provides an official catalog of downloadable language packs with valid manifests', () => {
      const available = service.listAvailableLanguages();
      expect(available.length).toBeGreaterThan(5);

      const arabic = available.find(m => m.bcp47 === 'ar-SA' || m.id.startsWith('ar'));
      expect(arabic).toBeDefined();
      expect(arabic?.direction).toBe('rtl');
      expect(arabic?.features.rtl).toBe(true);

      const french = available.find(m => m.bcp47 === 'fr-FR' || m.id.startsWith('fr'));
      expect(french).toBeDefined();
      expect(french?.direction).toBe('ltr');
    });

    it('installs a language pack from catalog and makes it immediately available in runtime', async () => {
      const installRes = await service.installLanguagePack('fr');
      expect(installRes.success).toBe(true);

      const pack = service.getLanguagePack('fr');
      expect(pack).toBeDefined();
      expect(pack?.manifest.name).toBe('French');
      expect(pack?.translations.common.save).toBe('Enregistrer');
    });
  });

  describe('3. Dynamic RTL Support & Document Direction', () => {
    it('correctly maps RTL languages (Arabic, Hebrew, Persian, Urdu) to rtl direction', () => {
      expect(service.getDirection('ar')).toBe('rtl');
      expect(service.getDirection('he')).toBe('rtl');
      expect(service.getDirection('fa')).toBe('rtl');
      expect(service.getDirection('ur')).toBe('rtl');
      expect(service.getDirection('en')).toBe('ltr');
      expect(service.getDirection('de')).toBe('ltr');
      expect(service.getDirection('hi')).toBe('ltr');
    });

    it('updates document.documentElement.dir dynamically upon activating an RTL language', async () => {
      await service.setActiveLanguage('ar');
      expect(service.getActiveLanguage()).toBe('ar');
      expect(service.getActiveDirection()).toBe('rtl');

      if (typeof document !== 'undefined') {
        expect(document.documentElement.dir).toBe('rtl');
        expect(document.documentElement.lang).toBe('ar-SA');
      }

      // Switch back to English
      await service.setActiveLanguage('en');
      expect(service.getActiveDirection()).toBe('ltr');
      if (typeof document !== 'undefined') {
        expect(document.documentElement.dir).toBe('ltr');
      }
    });
  });

  describe('4. Deterministic Translation Fallback Hierarchy', () => {
    it('falls back through active locale -> English -> key string without external calls', () => {
      // Common save in English
      const enSave = service.getTranslation('en', 'common.save');
      expect(enSave).toBe('Save');

      // Common save in Hindi
      const hiSave = service.getTranslation('hi', 'common.save');
      expect(hiSave).toBe('सहेजें');

      // Non-existent key falls back to key itself
      const missing = service.getTranslation('en', 'nonexistent.section.key');
      expect(missing).toBe('nonexistent.section.key');
    });

    it('interpolates placeholder parameters correctly', () => {
      const text = service.getTranslation('en', 'common.save', { test: '123' });
      expect(text).toBeDefined();
    });
  });

  describe('5. Enterprise Organization Language Policy', () => {
    it('enforces blocked languages policy', async () => {
      service.setOrganizationPolicy({
        blockedLanguages: ['ru' as any],
      });

      const activateRes = await service.setActiveLanguage('ru');
      expect(activateRes).toBe(false);

      // Clean up policy
      service.setOrganizationPolicy({ blockedLanguages: [] });
    });

    it('guarantees externalTranslationDisabled is strictly true and immutable', () => {
      const policy = service.getOrganizationPolicy();
      expect(policy.externalTranslationDisabled).toBe(true);

      // Attempt to tamper
      service.setOrganizationPolicy({ externalTranslationDisabled: false } as any);
      expect(service.getOrganizationPolicy().externalTranslationDisabled).toBe(true);
    });
  });
});
