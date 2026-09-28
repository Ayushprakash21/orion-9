import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  SupportedLocale,
  SupportedLanguage,
  LocaleInfo,
  SUPPORTED_LOCALES,
  SUPPORTED_LOCALE_CODES,
  LOCALE_STORAGE_KEYS,
  resolveInitialLocale,
  getTranslation,
  formatDate,
  formatTime,
  formatDateTime,
  formatNumber,
  formatCurrency,
  isValidLocale,
  languageService,
  LanguagePackService,
  LanguagePackEntry,
  LanguagePackManifest,
  OrionLanguagePack,
  LanguagePackStatus,
  OrganizationLanguagePolicy,
  DEFAULT_ORG_LANGUAGE_POLICY,
} from '../i18n';

export type {
  SupportedLocale,
  SupportedLanguage,
  LocaleInfo,
  LanguagePackEntry,
  LanguagePackManifest,
  OrionLanguagePack,
  LanguagePackStatus,
  OrganizationLanguagePolicy,
};

export {
  SUPPORTED_LOCALES,
  SUPPORTED_LOCALE_CODES,
  LOCALE_STORAGE_KEYS,
  resolveInitialLocale,
  getTranslation,
  formatDate,
  formatTime,
  formatDateTime,
  formatNumber,
  formatCurrency,
  isValidLocale,
  languageService,
  DEFAULT_ORG_LANGUAGE_POLICY,
};

export interface I18nContextType {
  locale: SupportedLocale;
  language: SupportedLanguage; // Alias for backward compatibility
  setLocale: (loc: SupportedLocale) => void;
  setLanguage: (lang: SupportedLanguage) => void; // Alias
  setUserPreferredLanguage: (lang: SupportedLocale, userId?: string) => void;
  setOrganizationDefaultLanguage: (lang: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: 'ltr' | 'rtl';
  languages: LocaleInfo[];
  installedLanguages: LanguagePackEntry[];
  availableLanguages: LanguagePackManifest[];
  activeLanguagePack: OrionLanguagePack | null;
  installLanguagePack: (locale: string) => Promise<{ success: boolean; message?: string }>;
  uninstallLanguagePack: (locale: string) => Promise<{ success: boolean; message?: string }>;
  installLanguagePackFromFile: (content: string | object) => Promise<{ success: boolean; locale?: string; error?: string }>;
  updateLanguagePack: (locale: string) => Promise<{ success: boolean; message?: string }>;
  organizationPolicy: OrganizationLanguagePolicy;
  setOrganizationPolicy: (policy: Partial<OrganizationLanguagePolicy>) => void;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;
}

const defaultI18nContext: I18nContextType = {
  locale: 'en',
  language: 'en',
  setLocale: () => {},
  setLanguage: () => {},
  setUserPreferredLanguage: () => {},
  setOrganizationDefaultLanguage: () => {},
  t: (key: string, params?: Record<string, string | number>) => languageService.getTranslation('en', key, params),
  dir: 'ltr',
  languages: Object.values(SUPPORTED_LOCALES),
  installedLanguages: [],
  availableLanguages: [],
  activeLanguagePack: null,
  installLanguagePack: async () => ({ success: true }),
  uninstallLanguagePack: async () => ({ success: true }),
  installLanguagePackFromFile: async () => ({ success: true }),
  updateLanguagePack: async () => ({ success: true }),
  organizationPolicy: DEFAULT_ORG_LANGUAGE_POLICY,
  setOrganizationPolicy: () => {},
  formatDate: (d) => String(d),
  formatTime: (d) => String(d),
  formatDateTime: (d) => String(d),
  formatNumber: (n) => String(n),
  formatCurrency: (a) => String(a),
};

const LanguageContext = createContext<I18nContextType>(defaultI18nContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    return languageService.getActiveLanguage() || resolveInitialLocale();
  });

  const [installedLanguages, setInstalledLanguages] = useState<LanguagePackEntry[]>(() => {
    return languageService.listInstalledLanguages();
  });

  const [availableLanguages, setAvailableLanguages] = useState<LanguagePackManifest[]>(() => {
    return languageService.listAvailableLanguages();
  });

  const [organizationPolicy, setOrganizationPolicyState] = useState<OrganizationLanguagePolicy>(() => {
    return languageService.getOrganizationPolicy();
  });

  // Sync state when LanguageService triggers updates
  useEffect(() => {
    const syncState = () => {
      setLocaleState(languageService.getActiveLanguage());
      setInstalledLanguages(languageService.listInstalledLanguages());
      setAvailableLanguages(languageService.listAvailableLanguages());
      setOrganizationPolicyState(languageService.getOrganizationPolicy());
    };

    const unsubscribe = languageService.addListener(syncState);
    return () => unsubscribe();
  }, []);

  // Update locale and broadcast changes
  const setLocale = useCallback(async (newLocale: SupportedLocale) => {
    if (!isValidLocale(newLocale)) return;
    const success = await languageService.setActiveLanguage(newLocale);
    if (success) {
      setLocaleState(newLocale);
    }
  }, []);

  // Set explicit user preference
  const setUserPreferredLanguage = useCallback((newLocale: SupportedLocale, userId?: string) => {
    if (!isValidLocale(newLocale)) return;
    if (typeof localStorage !== 'undefined') {
      try {
        if (userId) {
          localStorage.setItem(`${LOCALE_STORAGE_KEYS.USER_PREFIX}${userId}`, newLocale);
        }
        localStorage.setItem('orion_user_has_explicit_language', 'true');
      } catch (e) {}
    }
    setLocale(newLocale);
  }, [setLocale]);

  // Set organization default language
  const setOrganizationDefaultLanguage = useCallback((orgLocale: SupportedLocale) => {
    if (!isValidLocale(orgLocale)) return;
    languageService.setOrganizationPolicy({ defaultLanguage: orgLocale });

    // Only switch the active locale if user has NOT explicitly selected a personal preference
    const hasExplicit = typeof localStorage !== 'undefined' && localStorage.getItem('orion_user_has_explicit_language') === 'true';
    if (!hasExplicit) {
      setLocale(orgLocale);
    }
  }, [setLocale]);

  // Language pack operations
  const installLanguagePack = useCallback(async (loc: string) => {
    return languageService.installLanguagePack(loc);
  }, []);

  const uninstallLanguagePack = useCallback(async (loc: string) => {
    return languageService.uninstallLanguagePack(loc);
  }, []);

  const installLanguagePackFromFile = useCallback(async (content: string | object) => {
    return languageService.installLanguagePackFromFile(content);
  }, []);

  const updateLanguagePack = useCallback(async (loc: string) => {
    return languageService.updateLanguagePack(loc);
  }, []);

  const setOrganizationPolicy = useCallback((newPolicy: Partial<OrganizationLanguagePolicy>) => {
    languageService.setOrganizationPolicy(newPolicy);
    setOrganizationPolicyState(languageService.getOrganizationPolicy());
  }, []);

  // Translation function wrapper with fallback
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      return languageService.getTranslation(locale, key, params);
    },
    [locale]
  );

  const currentDir = useMemo((): 'ltr' | 'rtl' => {
    return languageService.getDirection(locale);
  }, [locale]);

  const activeLanguagePack = useMemo((): OrionLanguagePack | null => {
    return languageService.getLanguagePack(locale);
  }, [locale, installedLanguages]);

  const allLocaleInfos = useMemo((): LocaleInfo[] => {
    return Object.values(SUPPORTED_LOCALES);
  }, [installedLanguages]);

  const contextValue: I18nContextType = useMemo(
    () => ({
      locale,
      language: locale,
      setLocale,
      setLanguage: setLocale,
      setUserPreferredLanguage,
      setOrganizationDefaultLanguage,
      t,
      dir: currentDir,
      languages: allLocaleInfos,
      installedLanguages,
      availableLanguages,
      activeLanguagePack,
      installLanguagePack,
      uninstallLanguagePack,
      installLanguagePackFromFile,
      updateLanguagePack,
      organizationPolicy,
      setOrganizationPolicy,
      formatDate: (d, opts) => formatDate(d, locale, opts),
      formatTime: (d, opts) => formatTime(d, locale, opts),
      formatDateTime: (d, opts) => formatDateTime(d, locale, opts),
      formatNumber: (n, opts) => formatNumber(n, locale, opts),
      formatCurrency: (a, cur) => formatCurrency(a, locale, cur),
    }),
    [
      locale,
      setLocale,
      setUserPreferredLanguage,
      setOrganizationDefaultLanguage,
      t,
      currentDir,
      allLocaleInfos,
      installedLanguages,
      availableLanguages,
      activeLanguagePack,
      installLanguagePack,
      uninstallLanguagePack,
      installLanguagePackFromFile,
      updateLanguagePack,
      organizationPolicy,
      setOrganizationPolicy,
    ]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useI18n = () => useContext(LanguageContext);
export const useLanguage = () => useContext(LanguageContext);
