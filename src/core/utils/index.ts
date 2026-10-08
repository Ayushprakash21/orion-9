import { formatDate } from '../../lib/formatters';

export const formatCurrency = (value: number, currency: string = 'INR') => {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
};

export const formatDateTime = (isoString: string, timezone: string = 'Asia/Kolkata') => {
  return formatDate(isoString, timezone);
};

export const calculateTrend = (current: number, previous: number) => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};
