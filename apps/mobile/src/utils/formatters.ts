/**
 * ORION-9 UTILITIES & FORMATTERS
 */

export const formatCurrency = (val: number): string => {
  if (val >= 1000000) {
    return `$${(val / 1000000).toFixed(1)}M`;
  }
  if (val >= 1000) {
    return `$${(val / 1000).toFixed(0)}k`;
  }
  return `$${val.toLocaleString()}`;
};

export const formatNumber = (val?: number): string => {
  if (val === undefined || val === null) return '0';
  return val.toLocaleString();
};

export const formatPercent = (val?: number): string => {
  if (val === undefined || val === null) return '0%';
  return `${Math.round(val * 10) / 10}%`;
};

export const formatPercentage = formatPercent;

export const formatDate = (isoString?: string | null): string => {
  if (!isoString) return 'Pending';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return String(isoString);
  }
};
