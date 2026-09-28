import { en } from './locales/en';
import { hi } from './locales/hi';
import { es } from './locales/es';
import { de } from './locales/de';
import { SupportedLocale } from './types';

export const LOCALES: Record<string, any> = {
  en,
  hi,
  es,
  de,
};

export function extractKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  if (!obj || typeof obj !== 'object') return keys;

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(extractKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

export interface LocaleValidationResult {
  valid: boolean;
  baseKeyCount: number;
  missingKeys: Partial<Record<SupportedLocale, string[]>>;
  extraKeys: Partial<Record<SupportedLocale, string[]>>;
}

export function validateAllLocales(): LocaleValidationResult {
  const baseKeys = extractKeys(en).sort();
  const baseKeySet = new Set(baseKeys);

  const missingKeys: Partial<Record<SupportedLocale, string[]>> = {
    en: [],
    hi: [],
    es: [],
    de: [],
  };

  const extraKeys: Partial<Record<SupportedLocale, string[]>> = {
    en: [],
    hi: [],
    es: [],
    de: [],
  };

  let allValid = true;

  for (const locale of ['hi', 'es', 'de'] as SupportedLocale[]) {
    const localeObj = LOCALES[locale];
    const localeKeys = new Set(extractKeys(localeObj));

    for (const key of baseKeys) {
      if (!localeKeys.has(key)) {
        missingKeys[locale].push(key);
        allValid = false;
      }
    }

    for (const key of localeKeys) {
      if (!baseKeySet.has(key)) {
        extraKeys[locale].push(key);
        allValid = false;
      }
    }
  }

  return {
    valid: allValid,
    baseKeyCount: baseKeys.length,
    missingKeys,
    extraKeys,
  };
}
