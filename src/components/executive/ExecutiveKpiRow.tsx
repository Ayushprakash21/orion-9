import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  FolderKanban, 
  Users, 
  Package, 
  AlertTriangle,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency, formatNumber, formatPercentage } from '../../lib/formatters';

export interface ExecutiveKpiItem {
  id: string;
  title: string;
  value: string;
  rawNumeric?: number;
  subValue?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  highlightColor?: string;
  onClick?: () => void;
  badge?: string;
}

interface ExecutiveKpiRowProps {
  kpis: ExecutiveKpiItem[];
  className?: string;
}

export const ExecutiveKpiRow: React.FC<ExecutiveKpiRowProps> = ({
  kpis,
  className,
}) => {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5", className)}>
      {kpis.map((kpi) => {
        const isUp = kpi.trendDirection === 'up';
        const isDown = kpi.trendDirection === 'down';

        return (
          <div
            key={kpi.id}
            onClick={kpi.onClick}
            className={cn(
              "p-4 rounded-xl border border-[var(--orion-morph-border,rgba(255,255,255,0.08))] bg-[var(--orion-morph-surface,#101111)] hover:bg-[var(--orion-morph-surface-hover,#151616)] hover:border-[var(--orion-accent,#39C77A)]/40 shadow-[var(--orion-morph-shadow-soft,0_2px_8px_rgba(0,0,0,0.1))] hover:shadow-[var(--orion-morph-shadow,0_6px_16px_rgba(0,0,0,0.15))] backdrop-blur-[var(--orion-morph-blur,10px)] transition-all cursor-pointer group flex flex-col justify-between select-none hover:-translate-y-0.5"
            )}
          >

            {/* Top row: Label & Sub-pill or Arrow */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-os-text-muted group-hover:text-os-text-secondary transition-colors">
                {kpi.title}
              </span>
              {kpi.badge ? (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-os-text-muted border border-white/[0.08]">
                  {kpi.badge}
                </span>
              ) : (
                <ArrowUpRight 
                  size={14} 
                  className="text-os-text-muted group-hover:text-[#39C77A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" 
                />
              )}
            </div>

            {/* Main Value Display */}
            <div className="my-2.5">
              <span className="text-2xl sm:text-3xl font-light tracking-tight font-mono text-os-text-primary group-hover:text-white transition-colors">
                {kpi.value}
              </span>
            </div>

            {/* Bottom Row: Trend and Subvalue */}
            <div className="flex items-center justify-between text-xs font-mono">
              {kpi.trend && (
                <div className={cn(
                  "flex items-center gap-1 font-medium",
                  isUp && "text-[#39C77A]",
                  isDown && "text-red-400",
                  !isUp && !isDown && "text-os-text-muted"
                )}>
                  {isUp && <TrendingUp size={12} />}
                  {isDown && <TrendingDown size={12} />}
                  <span>{kpi.trend}</span>
                </div>
              )}
              {kpi.subValue && (
                <span className="text-os-text-muted text-[11px] truncate">
                  {kpi.subValue}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
