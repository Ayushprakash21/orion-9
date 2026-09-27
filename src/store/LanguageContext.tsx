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
} from '../i18n';

export type {
  SupportedLocale,
  SupportedLanguage,
  LocaleInfo,
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
};

export interface I18nContextType {
  locale: SupportedLocale;
  language: SupportedLanguage; // Alias for backward compatibility
  setLocale: (loc: SupportedLocale) => void;
  setLanguage: (lang: SupportedLanguage) => void; // Alias
  setUserPreferredLanguage: (lang: SupportedLocale, userId?: string) => void;
  setOrganizationDefaultLanguage: (lang: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: 'ltr';
  languages: LocaleInfo[];
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
  t: (key: string, params?: Record<string, string | number>) => getTranslation('en', key, params),
  dir: 'ltr',
  languages: Object.values(SUPPORTED_LOCALES),
  formatDate: (d) => String(d),
  formatTime: (d) => String(d),
  formatDateTime: (d) => String(d),
  formatNumber: (n) => String(n),
  formatCurrency: (a) => String(a),
};

const LanguageContext = createContext<I18nContextType>(defaultI18nContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    return resolveInitialLocale();
  });

  // Apply DOM language & direction attributes
  const applyHtmlAttributes = useCallback((loc: SupportedLocale) => {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = loc;
      const info = SUPPORTED_LOCALES[loc];
      document.documentElement.dir = info?.dir === 'rtl' ? 'rtl' : 'ltr';
    }
  }, []);

  // Update locale and broadcast changes
  const setLocale = useCallback((newLocale: SupportedLocale) => {
    if (!isValidLocale(newLocale)) return;
    setLocaleState(newLocale);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCALE_STORAGE_KEYS.PRE_LOGIN, newLocale);
        localStorage.setItem(LOCALE_STORAGE_KEYS.GLOBAL, newLocale);
        sessionStorage.setItem(LOCALE_STORAGE_KEYS.PRE_LOGIN, newLocale);
        sessionStorage.setItem(LOCALE_STORAGE_KEYS.GLOBAL, newLocale);
      } catch (e) {
        // Storage access might be restricted
      }

      applyHtmlAttributes(newLocale);

      window.dispatchEvent(
        new CustomEvent('orion-locale-changed', { detail: { locale: newLocale } })
      );
      window.dispatchEvent(
        new CustomEvent('orion-language-changed', { detail: { language: newLocale } })
      );
    }
  }, [applyHtmlAttributes]);

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
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(LOCALE_STORAGE_KEYS.ORG_DEFAULT, orgLocale);
      } catch (e) {}
    }

    // Only switch the active locale if user has NOT explicitly selected a personal preference
    const hasExplicit = typeof localStorage !== 'undefined' && localStorage.getItem('orion_user_has_explicit_language') === 'true';
    if (!hasExplicit) {
      setLocale(orgLocale);
    }
  }, [setLocale]);

  // Sync on mount and listen to window events
  useEffect(() => {
    applyHtmlAttributes(locale);

    const handleLocaleEvent = (e: any) => {
      const incoming = e.detail?.locale || e.detail?.language;
      if (isValidLocale(incoming) && incoming !== locale) {
        setLocaleState(incoming);
        applyHtmlAttributes(incoming);
      }
    };

    window.addEventListener('orion-locale-changed', handleLocaleEvent);
    window.addEventListener('orion-language-changed', handleLocaleEvent);

    return () => {
      window.removeEventListener('orion-locale-changed', handleLocaleEvent);
      window.removeEventListener('orion-language-changed', handleLocaleEvent);
    };
  }, [locale, applyHtmlAttributes]);

  // Translation function wrapper
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      return getTranslation(locale, key, params);
    },
    [locale]
  );

  const contextValue: I18nContextType = useMemo(
    () => ({
      locale,
      language: locale,
      setLocale,
      setLanguage: setLocale,
      setUserPreferredLanguage,
      setOrganizationDefaultLanguage,
      t,
      dir: 'ltr' as const,
      languages: Object.values(SUPPORTED_LOCALES),
      formatDate: (d, opts) => formatDate(d, locale, opts),
      formatTime: (d, opts) => formatTime(d, locale, opts),
      formatDateTime: (d, opts) => formatDateTime(d, locale, opts),
      formatNumber: (n, opts) => formatNumber(n, locale, opts),
      formatCurrency: (a, cur) => formatCurrency(a, locale, cur),
    }),
    [locale, setLocale, setUserPreferredLanguage, setOrganizationDefaultLanguage, t]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useI18n = () => useContext(LanguageContext);
export const useLanguage = () => useContext(LanguageContext);
