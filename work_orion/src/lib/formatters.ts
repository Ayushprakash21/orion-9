export const formatNumber = (num: number, maxDecimals: number = 2, locale: string = 'en-US'): string => {
  if (num === null || num === undefined || isNaN(num) || !isFinite(num)) return 'N/A';
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: maxDecimals,
  }).format(num);
};

export const formatDecimal = (num: number, maxDecimals: number = 2): string => {
  if (num === null || num === undefined || isNaN(num) || !isFinite(num)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: maxDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(num);
};

export const formatCurrency = (amount: number, currency: string = 'INR', localeParam?: string): string => {
  if (amount === null || amount === undefined || isNaN(amount) || !isFinite(amount)) return 'N/A';
  
  const curr = (currency && typeof currency === 'string' && currency.trim()) ? currency.trim().toUpperCase() : 'INR';
  const locale = localeParam ? localeParam : (curr === 'INR' ? 'en-IN' : 'en-US');
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `₹${Number(amount).toFixed(2)}`;
    }
  }
};

export const getCurrencySymbol = (currency: string = 'INR', localeParam?: string): string => {
  const curr = (currency && typeof currency === 'string' && currency.trim()) ? currency.trim().toUpperCase() : 'INR';
  const locale = localeParam ? localeParam : (curr === 'INR' ? 'en-IN' : 'en-US');
  try {
    const parts = new Intl.NumberFormat(locale, { style: 'currency', currency: curr }).formatToParts(0);
    const symbolPart = parts.find(p => p.type === 'currency');
    return symbolPart ? symbolPart.value : (curr === 'INR' ? '₹' : curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : `${curr} `);
  } catch {
    return curr === 'INR' ? '₹' : curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : `${curr} `;
  }
};

export const formatCurrencyCompact = (amount: number, currency: string = 'INR', localeParam?: string): string => {
  if (amount === null || amount === undefined || isNaN(amount) || !isFinite(amount)) return 'N/A';
  
  const curr = (currency && typeof currency === 'string' && currency.trim()) ? currency.trim().toUpperCase() : 'INR';
  const locale = localeParam ? localeParam : (curr === 'INR' ? 'en-IN' : 'en-US');
  const symbol = getCurrencySymbol(curr, locale);
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (curr === 'INR') {
    if (abs >= 10000000) { // 1 Crore (10^7)
      const val = (abs / 10000000).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `${sign}${symbol}${val} Cr`;
    }
    if (abs >= 100000) { // 1 Lakh (10^5)
      const val = (abs / 100000).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `${sign}${symbol}${val} L`;
    }
    if (abs >= 1000) { // 1 Thousand
      const val = (abs / 1000).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      return `${sign}${symbol}${val} k`;
    }
    return formatCurrency(amount, curr, locale);
  }

  // Western notation for other currencies (Millions / Billions)
  if (abs >= 1000000000) {
    const val = (abs / 1000000000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${sign}${symbol}${val}B`;
  }
  if (abs >= 1000000) {
    const val = (abs / 1000000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${sign}${symbol}${val}M`;
  }
  if (abs >= 1000) {
    const val = (abs / 1000).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return `${sign}${symbol}${val}k`;
  }
  return formatCurrency(amount, curr, locale);
};

export interface FormattedCurrencyPair {
  compact: string;
  exact: string;
  raw: number;
  currency: string;
  toString(): string;
}

export const formatCurrencyPair = (
  amount: number,
  currency: string = 'INR',
  localeParam?: string
): FormattedCurrencyPair => {
  const curr = (currency && typeof currency === 'string' && currency.trim()) ? currency.trim().toUpperCase() : 'INR';
  const exact = formatCurrency(amount, curr, localeParam);
  const compact = formatCurrencyCompact(amount, curr, localeParam);
  return {
    compact,
    exact,
    raw: amount,
    currency: curr,
    toString: () => compact
  };
};

export const formatPercentage = (num: number, maxDecimals: number = 1): string => {
  if (num === null || num === undefined || isNaN(num) || !isFinite(num)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: maxDecimals,
  }).format(num / 100);
};

export const safeDate = (value: any): Date | null => {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

export const formatDate = (dateValue: any, timezone: string = 'Asia/Kolkata', locale: string = 'en-US'): string => {
  const date = safeDate(dateValue);
  if (!date) return 'N/A';
  
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  } catch (e) {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }
};

export const formatRelativeTime = (dateValue: any, timezone: string = 'Asia/Kolkata'): string => {
  const date = safeDate(dateValue);
  if (!date) return 'N/A';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(dateValue, timezone);
};

