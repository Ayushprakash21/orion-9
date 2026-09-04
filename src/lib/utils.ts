import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
export * from './formatters';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDateOnly = (dateVal: any): string => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    return dateVal.includes('T') ? dateVal.split('T')[0] : dateVal;
  }
  if (dateVal instanceof Date) {
    return dateVal.toISOString().split('T')[0];
  }
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toISOString().split('T')[0];
  } catch {
    return String(dateVal);
  }
};

export const safeFormatDate = (dateVal: any, fmt: string = 'dd MMM yyyy'): string => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return format(d, fmt);
  } catch {
    return String(dateVal);
  }
};

export const calculateHealthScore = (inventory: any[], suppliers: any[], shipments: any[]) => {
  const criticalInvCount = inventory.filter(i => (i.onHand - i.reserved) <= (i.averageDailyDemand * 5)).length;
  const invScore = Math.max(0, 100 - (criticalInvCount / Math.max(1, inventory.length)) * 100 * 2);

  // Supplier Health: average OTIF
  const avgOtif = suppliers.reduce((sum, s) => sum + s.otif, 0) / Math.max(1, suppliers.length);
  const supScore = avgOtif;

  // Logistics Health: % of non-delayed shipments
  const delayedShipments = shipments.filter(s => s.delayDays > 0).length;
  const logScore = Math.max(0, 100 - (delayedShipments / Math.max(1, shipments.length)) * 100);

  const overall = (invScore * 0.4) + (supScore * 0.4) + (logScore * 0.2);
  
  return {
    overall: Math.round(overall),
    inventory: Math.round(invScore),
    suppliers: Math.round(supScore),
    logistics: Math.round(logScore)
  };
};
