import React from 'react';
import { cn } from '../../lib/utils';
import { useOrionTheme } from '../../os/theme/useOrionTheme';

export type EnterpriseBadgeVariant =
  | 'nominal'
  | 'success'
  | 'warning'
  | 'critical'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'forecast'
  | 'simulated'
  | 'unavailable';

export interface EnterpriseBadgeProps {
  children: React.ReactNode;
  variant?: EnterpriseBadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const EnterpriseBadge: React.FC<EnterpriseBadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className,
}) => {
  const { isDark } = useOrionTheme();

  const variantStyles = {
    nominal: isDark
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    success: isDark
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: isDark
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      : 'bg-amber-50 text-amber-800 border-amber-200',
    critical: isDark
      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      : 'bg-rose-50 text-rose-700 border-rose-200',
    danger: isDark
      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      : 'bg-rose-50 text-rose-700 border-rose-200',
    info: isDark
      ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
      : 'bg-sky-50 text-sky-700 border-sky-200',
    neutral: isDark
      ? 'bg-white/5 text-white/70 border-white/10'
      : 'bg-black/5 text-[#57606a] border-black/10',
    forecast: isDark
      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
      : 'bg-indigo-50 text-indigo-700 border-indigo-200',
    simulated: isDark
      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      : 'bg-purple-50 text-purple-700 border-purple-200',
    unavailable: isDark
      ? 'bg-white/5 text-white/40 border-white/10'
      : 'bg-black/5 text-[#8c959f] border-black/10',
  }[variant];

  const dotColors = {
    nominal: 'bg-emerald-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    critical: 'bg-rose-400',
    danger: 'bg-rose-400',
    info: 'bg-sky-400',
    neutral: isDark ? 'bg-white/50' : 'bg-black/40',
    forecast: 'bg-indigo-400',
    simulated: 'bg-purple-400',
    unavailable: 'bg-white/30',
  }[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono uppercase tracking-wider rounded-xs border select-none font-semibold',
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5',
        variantStyles,
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors)} />}
      <span>{children}</span>
    </span>
  );
};
