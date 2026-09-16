export interface FXRate {
  base: string;
  quote: string;
  rate: number;
  date: string;
  source: string;
  lastUpdated: number;
}

export interface CurrencyDefinition {
  code: string;
  name: string;
  symbol: string;
  numericCode?: string;
  minorUnit?: number;
  countries?: string[];
  flag?: string;
}

export type Currency = CurrencyDefinition;

const CACHE_KEY_RATES = "orion_fx_rates_cache";
const CACHE_KEY_CURRENCIES = "orion_fx_currencies_cache_v2";
const CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours
const API_BASE = "https://api.frankfurter.dev/v2";

const currencyToCountry: Record<string, string> = {
  USD: "US",
  EUR: "EU",
  GBP: "GB",
  JPY: "JP",
  INR: "IN",
  AUD: "AU",
  CAD: "CA",
  CHF: "CH",
  CNY: "CN",
  SGD: "SG",
  HKD: "HK",
  NZD: "NZ",
  AED: "AE",
  SAR: "SA",
  QAR: "QA",
  KWD: "KW",
  BHD: "BH",
  OMR: "OM",
  THB: "TH",
  MYR: "MY",
  IDR: "ID",
  KRW: "KR",
  VND: "VN",
  PHP: "PH",
  ZAR: "ZA",
  BRL: "BR",
  MXN: "MX",
  ARS: "AR",
  CLP: "CL",
  COP: "CO",
  TRY: "TR",
  PLN: "PL",
  SEK: "SE",
  NOK: "NO",
  DKK: "DK",
  CZK: "CZ",
  HUF: "HU",
  RON: "RO",
  ILS: "IL",
  EGP: "EG",
};

const getFlagEmoji = (countryCode: string) => {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const getFlagForCurrency = (currencyCode: string) => {
  const countryCode =
    currencyToCountry[currencyCode] || currencyCode.substring(0, 2);
  return getFlagEmoji(countryCode);
};

export class FXRateService {
  private static async getCachedItem<T>(
    key: string,
  ): Promise<{ data: T; timestamp: number } | null> {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item);
    } catch {
      return null;
    }
  }

  private static async setCachedItem<T>(key: string, data: T): Promise<void> {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ data, timestamp: Date.now() }),
      );
    } catch (e) {
      console.warn("FX Cache write failed", e);
    }
  }

  static async getSupportedCurrencies(): Promise<Currency[]> {
    const cached = await this.getCachedItem<Currency[]>(CACHE_KEY_CURRENCIES);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      return cached.data;
    }

    try {
      const res = await fetch(`${API_BASE}/currencies`);
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();

      let currencies: Currency[] = [];

      if (Array.isArray(data)) {
        currencies = data.map((item: any) => ({
          code: item.iso_code,
          name: item.name,
          symbol: item.symbol || item.iso_code,
          numericCode: item.iso_numeric,
          flag: getFlagForCurrency(item.iso_code),
        }));
      } else {
        // Fallback for older API versions
        currencies = Object.entries(data).map(([code, name]) => ({
          code,
          name: typeof name === "string" ? name : (name as any)?.name || code,
          symbol: (name as any)?.symbol || code,
          flag: getFlagForCurrency(code),
        }));
      }

      await this.setCachedItem(CACHE_KEY_CURRENCIES, currencies);
      return currencies;
    } catch (e) {
      console.warn(
        "FX Service Offline, returning cached or fallback currencies",
        e,
      );
      if (cached) return cached.data;

      return [
        { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
        { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
        { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
        { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
        { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
      ];
    }
  }

  static async getRate(base: string, quote: string): Promise<FXRate | null> {
    if (base === quote) {
      return {
        base,
        quote,
        rate: 1,
        date: new Date().toISOString().split("T")[0],
        source: "Direct",
        lastUpdated: Date.now(),
      };
    }
    const cacheKey = `${CACHE_KEY_RATES}_${base}_${quote}`;
    const cached = await this.getCachedItem<FXRate>(cacheKey);

    // Check if offline
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return cached ? cached.data : null;
    }

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      return cached.data;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const params = new URLSearchParams({
        base: base,
        quotes: quote,
      });

      const res = await fetch(`${API_BASE}/rates?${params.toString()}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`API failed: ${res.status}`);
      const data = await res.json();

      let rateObj: FXRate | null = null;

      if (Array.isArray(data) && data.length > 0) {
        // v2 structure: [{"date":"2026-09-08","base":"INR","quote":"USD","rate":0.01059}]
        const match = data.find(
          (r: any) => r.base === base && r.quote === quote,
        );
        if (match) {
          rateObj = {
            base,
            quote,
            rate: match.rate,
            date: match.date,
            source: "Frankfurter",
            lastUpdated: Date.now(),
          };
        }
      } else if (data && data.rates && data.rates[quote]) {
        // Fallback for some v1-style objects if returned
        rateObj = {
          base,
          quote,
          rate: data.rates[quote],
          date: data.date,
          source: "Frankfurter",
          lastUpdated: Date.now(),
        };
      }

      if (!rateObj) throw new Error("Rate not found in response");

      await this.setCachedItem(cacheKey, rateObj);
      return rateObj;
    } catch (e) {
      console.warn(`Failed to fetch rate ${base} -> ${quote}`, e);
      return cached ? cached.data : null; // Return cached if available, else null
    }
  }

  static async convertCurrency(
    amount: number,
    base: string,
    quote: string,
  ): Promise<{ converted: number; rateObj: FXRate | null }> {
    const rateObj = await this.getRate(base, quote);
    if (!rateObj) {
      return { converted: amount, rateObj: null }; // Fallback to 1:1 if completely unavailable
    }
    return { converted: amount * rateObj.rate, rateObj };
  }
}
