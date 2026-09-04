export const formatNumber = (num: number, maxDecimals: number = 2): string => {
  if (num === null || num === undefined || isNaN(num) || !isFinite(num)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
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

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  if (amount === null || amount === undefined || isNaN(amount) || !isFinite(amount)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
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

export const formatDate = (dateValue: any): string => {
  const date = safeDate(dateValue);
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

export const formatRelativeTime = (dateValue: any): string => {
  const date = safeDate(dateValue);
  if (!date) return 'N/A';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(dateValue);
};
