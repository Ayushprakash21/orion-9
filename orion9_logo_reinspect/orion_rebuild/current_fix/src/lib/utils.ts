import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
export * from './formatters';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDateOnly = (dateVal: any, timezone: string = 'Asia/Kolkata'): string => {
  if (!dateVal) return 'N/A';
  
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'N/A';
    
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone || 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    try {
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) {
        return new Intl.DateTimeFormat('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }).format(d);
      }
    } catch {}
    return 'N/A';
  }
};

export const safeFormatDate = (dateVal: any, fmt: string = 'dd MMM yyyy', timezone: string = 'Asia/Kolkata'): string => {
  if (!dateVal) return 'N/A';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'N/A';
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone || 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: fmt.includes('HH') ? '2-digit' : undefined,
      minute: fmt.includes('mm') ? '2-digit' : undefined,
    }).format(d);
  } catch {
    try {
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) {
        return new Intl.DateTimeFormat('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }).format(d);
      }
    } catch {}
    return 'N/A';
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
