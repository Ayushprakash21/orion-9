import React from 'react';

export const KPICard = ({ 
  label, 
  value, 
  trend, 
  trendUp, 
  status 
}: { 
  label: string; 
  value: string | React.ReactNode; 
  trend?: string; 
  trendUp?: boolean; 
  status?: 'critical' | 'warning' | 'healthy' | 'neutral' 
}) => {
  return (
    <div className="bg-os-surface border border-os-border rounded-xl p-4 flex flex-col justify-between hover:border-os-border-strong transition-colors relative overflow-hidden">
      {status === 'critical' && <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500" />}
      {status === 'warning' && <div className="absolute top-0 left-0 w-full h-0.5 bg-amber-500" />}
      {status === 'healthy' && <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-500" />}
      
      <div className="flex justify-between items-start mb-2">
        <div className="text-[10px] uppercase text-os-text-muted font-bold tracking-widest">{label}</div>
      </div>
      <div className="text-xl sm:text-2xl font-mono text-os-text-primary tracking-tight truncate">{value}</div>
      {trend && (
        <div className={`mt-2 text-[10px] font-medium flex items-center gap-1 ${
          trendUp ? 'text-emerald-500' : (trendUp === false ? 'text-red-500' : 'text-os-text-secondary')
        }`}>
          {trendUp ? '↑' : (trendUp === false ? '↓' : '')} {trend}
        </div>
      )}
    </div>
  );
};
