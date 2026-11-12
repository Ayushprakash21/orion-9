import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useOrionTheme } from '../../os/theme/useOrionTheme';

export type MetricProvenance = 'actual' | 'forecast' | 'simulated' | 'estimated' | 'unavailable';

export interface EnterpriseMetricProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  trend?: {
    value: string | number;
    direction: 'up' | 'down' | 'neutral';
    isPositive?: boolean;
    period?: string;
  };
  provenance?: MetricProvenance;
  icon?: React.ComponentType<{ className?: string }>;
  status?: 'nominal' | 'warning' | 'critical' | 'neutral';
  className?: string;
}

export const EnterpriseMetric: React.FC<EnterpriseMetricProps> = ({
  label,
  value,
  unit,
  subtext,
  trend,
  provenance = 'actual',
  icon: Icon,
  status = 'neutral',
  className,
}) => {
  const { isDark } = useOrionTheme();

  const statusColors = {
    nominal: isDark ? 'text-emerald-400' : 'text-emerald-600',
    warning: isDark ? 'text-amber-400' : 'text-amber-600',
    critical: isDark ? 'text-rose-400' : 'text-rose-600',
    neutral: isDark ? 'text-white' : 'text-[#1f2328]',
  };

  const provenanceBadge = {
    actual: null,
    forecast: { text: 'FORECAST', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    simulated: { text: 'SIMULATED', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    estimated: { text: 'ESTIMATED', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    unavailable: { text: 'UNAVAILABLE', color: 'bg-white/5 text-white/40 border-white/10' },
  }[provenance];

  return (
    <div
      className={cn(
        'p-3.5 rounded-md border flex flex-col justify-between transition-all select-none',
        isDark
          ? 'bg-[#161b22] border-[#30363d] hover:border-[#484f58]'
          : 'bg-white border-[#d0d7de] hover:border-[#afb8c1] shadow-xs',
        className
      )}
    >
      {/* Top Header: Label + Provenance / Icon */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div
            className={cn(
              'text-[11px] font-semibold uppercase tracking-wider',
              isDark ? 'text-white/60' : 'text-[#57606a]'
            )}
          >
            {label}
          </div>
          {provenanceBadge && (
            <span
              className={cn(
                'inline-block text-[9px] font-mono px-1 py-0.2 rounded-xs border font-semibold tracking-wider',
                provenanceBadge.color
              )}
            >
              {provenanceBadge.text}
            </span>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              'p-1.5 rounded-sm border shrink-0',
              isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-black/5 border-black/10 text-black/60'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Numerical Data Display */}
      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span
          className={cn(
            'text-2xl font-bold font-mono tracking-tight',
            statusColors[status]
          )}
        >
          {value}
        </span>
        {unit && (
          <span
            className={cn(
              'text-xs font-mono font-medium',
              isDark ? 'text-white/40' : 'text-[#6e7781]'
            )}
          >
            {unit}
          </span>
        )}
      </div>

      {/* Trend & Subtext Footer */}
      {(trend || subtext) && (
        <div className="mt-2.5 pt-2 border-t border-dashed flex items-center justify-between text-[11px] font-mono">
          {trend ? (
            <div
              className={cn(
                'flex items-center gap-1 font-semibold',
                trend.isPositive === false
                  ? isDark ? 'text-rose-400' : 'text-rose-600'
                  : isDark ? 'text-emerald-400' : 'text-emerald-600'
              )}
            >
              {trend.direction === 'up' && <ArrowUpRight className="w-3 h-3" />}
              {trend.direction === 'down' && <ArrowDownRight className="w-3 h-3" />}
              {trend.direction === 'neutral' && <Minus className="w-3 h-3" />}
              <span>{trend.value}</span>
              {trend.period && (
                <span className={cn('text-[10px] font-normal', isDark ? 'text-white/40' : 'text-black/40')}>
                  {trend.period}
                </span>
              )}
            </div>
          ) : <div />}

          {subtext && (
            <span className={cn('text-[10px] truncate', isDark ? 'text-white/40' : 'text-black/40')}>
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
