/**
 * ORION-9 GLOBAL TRANSLATION & LOCALIZATION ENGINE
 * Canonical global translation runtime and formatting utilities.
 */

import { en } from './locales/en';
import { hi } from './locales/hi';
import { es } from './locales/es';
import { de } from './locales/de';
import {
  SupportedLocale,
  SupportedLanguage,
  SUPPORTED_LOCALES,
  SUPPORTED_LOCALE_CODES,
  TranslationSchema,
  TranslationKey,
  LocaleInfo,
} from './types';
import { validateAllLocales } from './validation';

export * from './types';
export * from './validation';

export const TRANSLATIONS: Record<SupportedLocale, TranslationSchema> = {
  en,
  hi,
  es,
  de,
};

/**
 * Storage keys used for persistence
 */
export const LOCALE_STORAGE_KEYS = {
  PRE_LOGIN: 'orion.locale',
  GLOBAL: 'orion_language',
  USER_PREFIX: 'orion_user_language_',
  ORG_DEFAULT: 'orion_org_default_language',
};

/**
 * Safe parser to verify whether a string is a valid SupportedLocale
 */
export function isValidLocale(lang?: string | null): lang is SupportedLocale {
  if (!lang) return false;
  return SUPPORTED_LOCALE_CODES.includes(lang.toLowerCase() as SupportedLocale);
}

/**
 * Maps browser language tags (e.g., 'en-US', 'hi-IN', 'es-MX', 'de-DE')
 * to canonical SupportedLocale ('en', 'hi', 'es', 'de').
 * Unsupported browser languages map to 'en'.
 */
export function matchBrowserLocale(browserLang?: string | null): SupportedLocale {
  if (!browserLang || typeof browserLang !== 'string') return 'en';
  const tag = browserLang.toLowerCase().trim();

  if (tag.startsWith('en')) return 'en';
  if (tag.startsWith('hi')) return 'hi';
  if (tag.startsWith('es')) return 'es';
  if (tag.startsWith('de')) return 'de';

  return 'en';
}

/**
 * Detects browser preferred language from navigator.
 */
export function detectBrowserLocale(): SupportedLocale {
  if (typeof navigator === 'undefined') return 'en';

  if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
    for (const lang of navigator.languages) {
      const match = matchBrowserLocale(lang);
      if (isValidLocale(lang.split('-')[0])) {
        return match;
      }
    }
  }

  if (navigator.language) {
    return matchBrowserLocale(navigator.language);
  }

  return 'en';
}

/**
 * Authoritative user language priority resolution (Requirement 16):
 * 1. Explicit user preference
 * 2. Organization default
 * 3. Previously selected pre-login locale
 * 4. Browser preferred language
 * 5. English ('en')
 */
export function resolveInitialLocale(params?: {
  userPreference?: string | null;
  orgDefault?: string | null;
  storedPreLogin?: string | null;
}): SupportedLocale {
  // 1. Explicit user preference
  if (isValidLocale(params?.userPreference)) {
    return params.userPreference;
  }

  // Check user storage if in browser
  if (typeof localStorage !== 'undefined') {
    const userStored = localStorage.getItem(LOCALE_STORAGE_KEYS.GLOBAL);
    if (isValidLocale(userStored)) {
      return userStored;
    }
  }

  // 2. Organization default
  if (isValidLocale(params?.orgDefault)) {
    return params.orgDefault;
  }
  if (typeof localStorage !== 'undefined') {
    const orgStored = localStorage.getItem(LOCALE_STORAGE_KEYS.ORG_DEFAULT);
    if (isValidLocale(orgStored)) {
      return orgStored;
    }
  }

  // 3. Previously selected pre-login locale
  if (isValidLocale(params?.storedPreLogin)) {
    return params.storedPreLogin;
  }
  if (typeof localStorage !== 'undefined') {
    const preLogin = localStorage.getItem(LOCALE_STORAGE_KEYS.PRE_LOGIN);
    if (isValidLocale(preLogin)) {
      return preLogin;
    }
  }

  // 4. Browser preferred language
  const browserMatch = detectBrowserLocale();
  if (isValidLocale(browserMatch)) {
    return browserMatch;
  }

  // 5. English
  return 'en';
}

/**
 * Synchronous translation lookup function with dot-notation and placeholder interpolation
 */
export function getTranslation(
  locale: SupportedLocale,
  key: string,
  params?: Record<string, string | number>
): string {
  const parts = key.split('.');
  const dict = TRANSLATIONS[locale] || TRANSLATIONS.en;
  const enDict = TRANSLATIONS.en;

  let current: any = dict;
  let fallback: any = enDict;

  for (const part of parts) {
    if (current && typeof current === 'object') {
      current = current[part];
    } else {
      current = undefined;
    }

    if (fallback && typeof fallback === 'object') {
      fallback = fallback[part];
    } else {
      fallback = undefined;
    }
  }

  let text = typeof current === 'string' ? current : typeof fallback === 'string' ? fallback : key;

  if (params && typeof params === 'object') {
    for (const [pKey, pVal] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
    }
  }

  return text;
}

/**
 * Format date using Intl.DateTimeFormat with BCP 47 tag
 */
export function formatDate(
  date: Date | string | number,
  locale: SupportedLocale = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const bcp47 = SUPPORTED_LOCALES[locale]?.bcp47 || 'en-US';
  return new Intl.DateTimeFormat(bcp47, options || { dateStyle: 'medium' }).format(d);
}

/**
 * Format time using Intl.DateTimeFormat with BCP 47 tag
 */
export function formatTime(
  date: Date | string | number,
  locale: SupportedLocale = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const bcp47 = SUPPORTED_LOCALES[locale]?.bcp47 || 'en-US';
  return new Intl.DateTimeFormat(bcp47, options || { timeStyle: 'short' }).format(d);
}

/**
 * Format date & time using Intl.DateTimeFormat
 */
export function formatDateTime(
  date: Date | string | number,
  locale: SupportedLocale = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const bcp47 = SUPPORTED_LOCALES[locale]?.bcp47 || 'en-US';
  return new Intl.DateTimeFormat(bcp47, options || { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

/**
 * Format numbers using Intl.NumberFormat
 */
export function formatNumber(
  num: number,
  locale: SupportedLocale = 'en',
  options?: Intl.NumberFormatOptions
): string {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  const bcp47 = SUPPORTED_LOCALES[locale]?.bcp47 || 'en-US';
  return new Intl.NumberFormat(bcp47, options).format(num);
}

/**
 * Format currency using Intl.NumberFormat
 */
export function formatCurrency(
  amount: number,
  locale: SupportedLocale = 'en',
  currency: string = 'USD'
): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '$0';
  const bcp47 = SUPPORTED_LOCALES[locale]?.bcp47 || 'en-US';
  return new Intl.NumberFormat(bcp47, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
