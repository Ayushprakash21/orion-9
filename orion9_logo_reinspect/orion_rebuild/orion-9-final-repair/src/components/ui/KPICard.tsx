import React from 'react';

export const KPICard = ({ 
  label, 
  value, 
  exactValue,
  subLabel = 'Exact',
  subValue,
  trend, 
  trendUp, 
  status,
  tooltip,
  onClick
}: { 
  label: string; 
  value: string | React.ReactNode | number; 
  exactValue?: string;
  subLabel?: string;
  subValue?: React.ReactNode;
  trend?: string; 
  trendUp?: boolean; 
  status?: 'critical' | 'warning' | 'healthy' | 'neutral';
  tooltip?: string;
  onClick?: () => void;
}) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-os-surface border border-os-border rounded-xl p-4 flex flex-col justify-between hover:border-os-border-strong transition-colors relative overflow-hidden ${onClick ? 'cursor-pointer hover:bg-os-surface-hover' : ''}`}
    >
      {status === 'critical' && <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500" />}
      {status === 'warning' && <div className="absolute top-0 left-0 w-full h-0.5 bg-amber-500" />}
      {status === 'healthy' && <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-500" />}
      
      <div className="flex justify-between items-start mb-2">
        <div className="text-[10px] uppercase text-os-text-muted font-bold tracking-widest">{label}</div>
      </div>
      
      <div className="flex flex-col min-w-0">
        <div 
          className="text-xl sm:text-2xl font-mono text-os-text-primary tracking-tight leading-tight"
          title={tooltip || (exactValue ? `${subLabel}: ${exactValue}` : undefined)}
        >
          {value}
        </div>
        {exactValue && (
          <div 
            className="text-[11px] font-mono text-os-text-muted mt-1.5 font-normal tracking-normal select-all flex items-center gap-1"
            title={`Exact Value: ${exactValue}`}
          >
            <span className="text-os-text-secondary/70">{subLabel}:</span>
            <span>{exactValue}</span>
          </div>
        )}
        {subValue && !exactValue && (
          <div className="text-[11px] font-mono text-os-text-muted mt-1">
            {subValue}
          </div>
        )}
      </div>

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
