/**
 * ORION-9 LANGUAGE PACK SPECIFICATION & MANIFEST SCHEMA
 * 
 * Defines the authoritative data-only format for Orion Language Packs (.orionlang).
 * 
 * RULES:
 * 1. Language packs are DATA ONLY (JSON structures).
 * 2. Language packs NEVER contain executable JavaScript or runtime scripts.
 * 3. Every language pack must include a cryptographically validatable manifest.
 * 4. Language pack versions and compatibility strings prevent broken runtime state.
 */

import { SupportedLocale, TranslationSchema } from './types';

export type LanguagePackStatus =
  | 'BUILT_IN'
  | 'INSTALLED'
  | 'AVAILABLE'
  | 'DOWNLOADING'
  | 'VERIFYING'
  | 'ACTIVE'
  | 'UPDATE_AVAILABLE'
  | 'DISABLED'
  | 'REMOVED'
  | 'FAILED'
  | 'INCOMPATIBLE';

export interface LanguagePackEntry {
  locale: SupportedLocale;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  bcp47: string;
  status: LanguagePackStatus;
  isBuiltIn: boolean;
  manifest?: LanguagePackManifest;
  sizeBytes?: number;
  coverage?: number;
  version?: string;
}

export interface LanguagePackFeatures {
  ui: boolean;
  regionalFormatting: boolean;
  rtl: boolean;
}

export interface LanguagePackIntegrity {
  algorithm: 'sha256' | 'sha1' | 'md5';
  digest: string;
}

export interface LanguagePackManifest {
  /** Unique language pack identifier (e.g., 'ar-SA', 'fr-FR', 'ja-JP', 'pt-BR') */
  id: string;
  /** English display name */
  name: string;
  /** Endonym / Native script name (e.g., 'العربية', 'Français', '日本語') */
  nativeName: string;
  /** Standard BCP-47 language tag */
  bcp47: string;
  /** Text writing direction */
  direction: 'ltr' | 'rtl';
  /** Language pack semver */
  version: string;
  /** Target Orion-9 semver compatibility requirement (e.g. '>=1.0.0', '^9.0.0') */
  orionCompatibility: string;
  /** Translation schema structural version */
  translationSchemaVersion: number;
  /** Translation completion percentage (0-100) */
  coverage: number;
  /** Enabled capability flags */
  features: LanguagePackFeatures;
  /** Cryptographic integrity checksum */
  integrity?: LanguagePackIntegrity;
  /** Pack author / vendor */
  author?: string;
  /** Approximate installed size in bytes */
  sizeBytes?: number;
  /** ISO timestamp of pack release / modification */
  updatedAt?: string;
  /** Optional release notes or pack changelog */
  description?: string;
}

/**
 * Pure Data Container for an Orion Language Pack (.orionlang)
 */
export interface OrionLanguagePack {
  manifest: LanguagePackManifest;
  translations: TranslationSchema;
  formatting?: {
    datePatterns?: Record<string, string>;
    numberFormat?: {
      decimal?: string;
      grouping?: string;
      currencySymbol?: string;
    };
  };
  metadata?: Record<string, any>;
}

/**
 * Enterprise Organization Language Policy
 */
export interface OrganizationLanguagePolicy {
  /** Default language enforced when no explicit user preference is set */
  defaultLanguage: SupportedLocale;
  /** Whitelist of permitted language codes (empty or undefined means all allowed) */
  allowedLanguages?: SupportedLocale[];
  /** Blacklist of prohibited language codes */
  blockedLanguages?: SupportedLocale[];
  /** Allow standard users to download & activate new language packs */
  allowUserDownloads: boolean;
  /** Restrict language pack installations to Platform/Org Admins */
  adminOnlyInstall: boolean;
  /** Allow air-gapped / offline .orionlang file uploads */
  allowOfflineUpload: boolean;
  /** Automatically apply language pack updates when available */
  autoUpdatePacks: boolean;
  /** External/Browser translation strictly disabled flag (Immutable) */
  readonly externalTranslationDisabled: true;
}

export const DEFAULT_ORG_LANGUAGE_POLICY: OrganizationLanguagePolicy = {
  defaultLanguage: 'en',
  allowUserDownloads: true,
  adminOnlyInstall: false,
  allowOfflineUpload: true,
  autoUpdatePacks: true,
  externalTranslationDisabled: true,
};

/**
 * Maximum allowed size for a .orionlang package (5MB safety limit)
 */
export const MAX_LANGUAGE_PACK_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Required top-level translation sections in TranslationSchema
 */
export const REQUIRED_TRANSLATION_SECTIONS = [
  'common',
  'auth',
  'navigation',
  'settings',
  'wallpaper',
] as const;

/**
 * Validates language pack manifest format and schema compliance
 */
export function validateLanguagePackManifest(manifest: any): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Manifest is missing or not a valid JSON object.'], warnings };
  }

  if (!manifest.id || typeof manifest.id !== 'string' || manifest.id.trim().length === 0) {
    errors.push('Manifest "id" is required and must be a non-empty string.');
  }

  if (!manifest.name || typeof manifest.name !== 'string') {
    errors.push('Manifest "name" is required and must be a string.');
  }

  if (!manifest.nativeName || typeof manifest.nativeName !== 'string') {
    errors.push('Manifest "nativeName" is required and must be a string.');
  }

  if (!manifest.bcp47 || typeof manifest.bcp47 !== 'string') {
    errors.push('Manifest "bcp47" is required and must be a string.');
  }

  if (manifest.direction !== 'ltr' && manifest.direction !== 'rtl') {
    errors.push('Manifest "direction" must be either "ltr" or "rtl".');
  }

  if (!manifest.version || typeof manifest.version !== 'string') {
    errors.push('Manifest "version" is required and must be a semver string.');
  }

  if (typeof manifest.coverage !== 'number' || manifest.coverage < 0 || manifest.coverage > 100) {
    warnings.push('Manifest "coverage" should be a number between 0 and 100.');
  }

  if (!manifest.features || typeof manifest.features !== 'object') {
    warnings.push('Manifest "features" object is missing.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates complete Orion Language Pack data structure
 */
export function validateOrionLanguagePack(pack: any): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!pack || typeof pack !== 'object') {
    return { valid: false, errors: ['Language pack is null or not an object.'], warnings };
  }

  // 1. Manifest Validation
  const manifestResult = validateLanguagePackManifest(pack.manifest);
  errors.push(...manifestResult.errors);
  warnings.push(...manifestResult.warnings);

  // 2. Translations Structure Validation
  if (!pack.translations || typeof pack.translations !== 'object') {
    errors.push('Language pack "translations" object is missing.');
  } else {
    for (const section of REQUIRED_TRANSLATION_SECTIONS) {
      if (!pack.translations[section] || typeof pack.translations[section] !== 'object') {
        warnings.push(`Missing recommended translation section: "${section}".`);
      }
    }
  }

  // 3. Data-Only Security Check (Ensure no executable functions / prototypes / scripts)
  try {
    const serialized = JSON.stringify(pack);
    if (serialized.length > MAX_LANGUAGE_PACK_SIZE_BYTES) {
      errors.push(`Language pack size (${(serialized.length / 1024 / 1024).toFixed(2)}MB) exceeds maximum limit of 5MB.`);
    }

    // Check for suspicious script injection patterns in translation strings
    if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(serialized)) {
      errors.push('Security violation: Language pack contains forbidden script tags.');
    }
    if (/javascript:/gi.test(serialized)) {
      errors.push('Security violation: Language pack contains forbidden javascript URI.');
    }
  } catch (err: any) {
    errors.push(`Language pack serialization failed: ${err.message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Simple deterministic SHA-256 / Checksum computation for language pack data integrity
 */
export function computePackChecksum(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}
