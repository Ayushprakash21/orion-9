const fs = require('fs');
let code = fs.readFileSync('src/services/FXRateService.ts', 'utf8');

// replace interface Currency
code = code.replace(/export interface Currency \{[\s\S]*?\}/, `export interface CurrencyDefinition {
  code: string;
  name: string;
  symbol: string;
  numericCode?: string;
  minorUnit?: number;
  countries?: string[];
  flag?: string;
}

export type Currency = CurrencyDefinition;`);

// Add helper mapping before the class
const helpers = `
const currencyToCountry: Record<string, string> = {
  USD: 'US', EUR: 'EU', GBP: 'GB', JPY: 'JP', INR: 'IN',
  AUD: 'AU', CAD: 'CA', CHF: 'CH', CNY: 'CN', SGD: 'SG',
  HKD: 'HK', NZD: 'NZ', AED: 'AE', SAR: 'SA', QAR: 'QA',
  KWD: 'KW', BHD: 'BH', OMR: 'OM', THB: 'TH', MYR: 'MY',
  IDR: 'ID', KRW: 'KR', VND: 'VN', PHP: 'PH', ZAR: 'ZA',
  BRL: 'BR', MXN: 'MX', ARS: 'AR', CLP: 'CL', COP: 'CO',
  TRY: 'TR', PLN: 'PL', SEK: 'SE', NOK: 'NO', DKK: 'DK',
  CZK: 'CZ', HUF: 'HU', RON: 'RO', ILS: 'IL', EGP: 'EG'
};

const getFlagEmoji = (countryCode: string) => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const getFlagForCurrency = (currencyCode: string) => {
  const countryCode = currencyToCountry[currencyCode] || currencyCode.substring(0, 2);
  return getFlagEmoji(countryCode);
};
`;

code = code.replace(/const CACHE_KEY_RATES =/, helpers + '\nconst CACHE_KEY_RATES =');

fs.writeFileSync('src/services/FXRateService.ts', code);
