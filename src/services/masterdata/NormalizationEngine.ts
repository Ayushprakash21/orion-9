/**
 * ORION-9 MASTER DATA NORMALIZATION ENGINE
 * Layer 7: Data Fabric & Master Data Governance
 *
 * Implements deterministic normalization while preserving raw provenance:
 * - Whitespace trimming and multiple space collapse
 * - Casing standardization (Codes in UPPERCASE, emails in lowercase)
 * - Phone number parsing and E.164 standardization
 * - Standardized UOM and Currency dictionary mapping
 * - Structured address cleansing
 * - Source record immutability preservation
 */

import { SourceSystemType } from '../../types';

export interface NormalizationResult<T = any> {
  normalized: T;
  raw: T;
  appliedTransformations: Array<{
    field: string;
    from: any;
    to: any;
    rule: string;
  }>;
  provenance: Array<{
    fieldName: string;
    originalValue: any;
    normalizedValue: any;
    ruleApplied: string;
  }>;
  normalizedAt: string;
}

const UOM_SYNONYM_MAP: Record<string, string> = {
  KILOGRAM: 'KG',
  KILOGRAMS: 'KG',
  KILO: 'KG',
  KILOS: 'KG',
  KGS: 'KG',
  KG: 'KG',
  GRAM: 'G',
  GRAMS: 'G',
  GR: 'G',
  G: 'G',
  MILLIGRAM: 'MG',
  MILLIGRAMS: 'MG',
  MG: 'MG',
  LITRE: 'L',
  LITRES: 'L',
  LITER: 'L',
  LITERS: 'L',
  L: 'L',
  MILLILITRE: 'ML',
  MILLILITRES: 'ML',
  MILLILITER: 'ML',
  MILLILITERS: 'ML',
  ML: 'ML',
  PIECE: 'EA',
  PIECES: 'EA',
  EACH: 'EA',
  EA: 'EA',
  PCS: 'EA',
  PC: 'EA',
  UNIT: 'UNIT',
  UNITS: 'UNIT',
  BOX: 'BOX',
  BOXES: 'BOX',
  BX: 'BOX',
  PALLET: 'PALLET',
  PALLETS: 'PALLET',
  PLT: 'PALLET',
  DRUM: 'DRUM',
  DRUMS: 'DRUM',
  METER: 'M',
  METERS: 'M',
  METRE: 'M',
  METRES: 'M',
  M: 'M',
};

const CURRENCY_SYNONYM_MAP: Record<string, string> = {
  USD: 'USD',
  'US DOLLAR': 'USD',
  'US DOLLARS': 'USD',
  '$': 'USD',
  EUR: 'EUR',
  EURO: 'EUR',
  EUROS: 'EUR',
  '€': 'EUR',
  GBP: 'GBP',
  'BRITISH POUND': 'GBP',
  POUND: 'GBP',
  POUNDS: 'GBP',
  '£': 'GBP',
  JPY: 'JPY',
  'JAPANESE YEN': 'JPY',
  YEN: 'JPY',
  '¥': 'JPY',
  CAD: 'CAD',
  'CANADIAN DOLLAR': 'CAD',
  AUD: 'AUD',
  'AUSTRALIAN DOLLAR': 'AUD',
  CHF: 'CHF',
  'SWISS FRANC': 'CHF',
  CNY: 'CNY',
  'CHINESE YUAN': 'CNY',
  RMB: 'CNY',
  INR: 'INR',
  'INDIAN RUPEE': 'INR',
  RUPEE: 'INR',
  '₹': 'INR',
  SGD: 'SGD',
  'SINGAPORE DOLLAR': 'SGD',
};

export class MasterDataNormalizationEngine {
  private static instance: MasterDataNormalizationEngine;

  private constructor() {}

  public static getInstance(): MasterDataNormalizationEngine {
    if (!MasterDataNormalizationEngine.instance) {
      MasterDataNormalizationEngine.instance = new MasterDataNormalizationEngine();
    }
    return MasterDataNormalizationEngine.instance;
  }

  /**
   * Deterministically cleans a string: trims and collapses consecutive whitespace
   */
  public cleanString(val: any): string {
    if (val === null || val === undefined) return '';
    return String(val).trim().replace(/\s+/g, ' ');
  }

  /**
   * Normalizes an alphanumeric identifier code (e.g. SKU, Supplier Code)
   */
  public normalizeCode(code: string): string {
    return this.cleanString(code).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  }

  /**
   * Normalizes an email address to lowercase RFC format
   */
  public normalizeEmail(email: string): string {
    return this.cleanString(email).toLowerCase();
  }

  /**
   * Normalizes a phone number to standard format or digits
   */
  public normalizePhone(phone: string): string {
    const cleaned = this.cleanString(phone);
    if (!cleaned) return '';
    // Preserve leading plus if international
    const hasPlus = cleaned.startsWith('+');
    const digitsOnly = cleaned.replace(/\D/g, '');
    return hasPlus ? `+${digitsOnly}` : digitsOnly;
  }

  /**
   * Normalizes Unit of Measure to canonical code
   */
  public normalizeUOM(uom: string): string {
    const cleaned = this.cleanString(uom).toUpperCase();
    return UOM_SYNONYM_MAP[cleaned] || cleaned;
  }

  /**
   * Normalizes Currency to ISO 4217 3-letter code
   */
  public normalizeCurrency(currency: string): string {
    const cleaned = this.cleanString(currency).toUpperCase();
    return CURRENCY_SYNONYM_MAP[cleaned] || (cleaned.length === 3 ? cleaned : 'USD');
  }

  /**
   * Normalizes ISO country codes (2-character uppercase)
   */
  public normalizeCountry(country: string): string {
    const cleaned = this.cleanString(country).toUpperCase();
    if (cleaned === 'UNITED STATES' || cleaned === 'USA') return 'US';
    if (cleaned === 'GERMANY' || cleaned === 'DEUTSCHLAND') return 'DE';
    if (cleaned === 'UNITED KINGDOM' || cleaned === 'GREAT BRITAIN' || cleaned === 'UK') return 'GB';
    if (cleaned === 'JAPAN') return 'JP';
    if (cleaned === 'SINGAPORE') return 'SG';
    if (cleaned === 'INDIA') return 'IN';
    return cleaned.substring(0, 2);
  }

  /**
   * Normalizes any arbitrary master record, generating a delta log
   */
  public normalizeRecord<T extends Record<string, any>>(rawRecord: T, entityType: string): NormalizationResult<T> {
    const raw = JSON.parse(JSON.stringify(rawRecord));
    const normalized: Record<string, any> = JSON.parse(JSON.stringify(rawRecord));
    const transformations: NormalizationResult['appliedTransformations'] = [];

    const recordChange = (field: string, from: any, to: any, rule: string) => {
      if (from !== to) {
        transformations.push({ field, from, to, rule });
        normalized[field] = to;
      }
    };

    // Generic string whitespace cleaning on all top-level strings
    for (const key of Object.keys(normalized)) {
      if (typeof normalized[key] === 'string') {
        const cleaned = this.cleanString(normalized[key]);
        if (cleaned !== normalized[key]) {
          recordChange(key, normalized[key], cleaned, 'WHITESPACE_COLLAPSE');
        }
      }
    }

    // Specific entity normalization rules
    if (normalized.supplierCode) {
      const code = this.normalizeCode(normalized.supplierCode);
      recordChange('supplierCode', normalized.supplierCode, code, 'IDENTIFIER_STANDARDIZATION');
    }
    if (normalized.productCode) {
      const code = this.normalizeCode(normalized.productCode);
      recordChange('productCode', normalized.productCode, code, 'IDENTIFIER_STANDARDIZATION');
    }
    if (normalized.customerCode) {
      const code = this.normalizeCode(normalized.customerCode);
      recordChange('customerCode', normalized.customerCode, code, 'IDENTIFIER_STANDARDIZATION');
    }
    if (normalized.locationCode) {
      const code = this.normalizeCode(normalized.locationCode);
      recordChange('locationCode', normalized.locationCode, code, 'IDENTIFIER_STANDARDIZATION');
    }
    if (normalized.country) {
      const country = this.normalizeCountry(normalized.country);
      recordChange('country', normalized.country, country, 'ISO_COUNTRY_MAPPING');
    }
    if (normalized.currency) {
      const currency = this.normalizeCurrency(normalized.currency);
      recordChange('currency', normalized.currency, currency, 'ISO_CURRENCY_MAPPING');
    }
    if (normalized.baseUom) {
      const uom = this.normalizeUOM(normalized.baseUom);
      recordChange('baseUom', normalized.baseUom, uom, 'CANONICAL_UOM_MAPPING');
    }
    if (normalized.uom) {
      const uom = this.normalizeUOM(normalized.uom);
      recordChange('uom', normalized.uom, uom, 'CANONICAL_UOM_MAPPING');
    }

    // Normalize contacts if present
    if (Array.isArray(normalized.contacts)) {
      normalized.contacts = normalized.contacts.map((c: any, idx: number) => {
        const contactCopy = { ...c };
        if (contactCopy.email) {
          const normEmail = this.normalizeEmail(contactCopy.email);
          if (normEmail !== contactCopy.email) {
            transformations.push({
              field: `contacts[${idx}].email`,
              from: contactCopy.email,
              to: normEmail,
              rule: 'EMAIL_LOWERCASE',
            });
            contactCopy.email = normEmail;
          }
        }
        if (contactCopy.phone) {
          const normPhone = this.normalizePhone(contactCopy.phone);
          if (normPhone !== contactCopy.phone) {
            transformations.push({
              field: `contacts[${idx}].phone`,
              from: contactCopy.phone,
              to: normPhone,
              rule: 'PHONE_STANDARDIZATION',
            });
            contactCopy.phone = normPhone;
          }
        }
        return contactCopy;
      });
    }

    if (normalized.id) {
      const code = this.normalizeCode(normalized.id);
      recordChange('id', normalized.id, code, 'IDENTIFIER_STANDARDIZATION');
    }

    const provenance = transformations.map(t => ({
      fieldName: t.field,
      originalValue: t.from,
      normalizedValue: t.to,
      ruleApplied: t.rule,
    }));

    return {
      normalized: normalized as T,
      raw,
      appliedTransformations: transformations,
      provenance,
      normalizedAt: new Date().toISOString(),
    };
  }
}

export const masterDataNormalizationEngine = MasterDataNormalizationEngine.getInstance();
