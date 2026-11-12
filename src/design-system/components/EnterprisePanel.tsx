import React from 'react';
import { cn } from '../../lib/utils';
import { useOrionTheme } from '../../os/theme/useOrionTheme';

export interface EnterprisePanelProps {
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  noPadding?: boolean;
}

export const EnterprisePanel: React.FC<EnterprisePanelProps> = ({
  title,
  subtitle,
  badge,
  actions,
  children,
  className,
  contentClassName,
  noPadding = false,
}) => {
  const { isDark } = useOrionTheme();

  return (
    <div
      className={cn(
        'rounded-md border flex flex-col overflow-hidden transition-all',
        isDark
          ? 'bg-[#161b22] border-[#30363d]'
          : 'bg-white border-[#d0d7de] shadow-xs',
        className
      )}
    >
      {(title || subtitle || actions || badge) && (
        <div
          className={cn(
            'px-3.5 py-2.5 border-b flex items-center justify-between gap-3 shrink-0 select-none',
            isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-[#f6f8fa] border-[#d0d7de]'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {title && (
              <span
                className={cn(
                  'font-semibold text-xs tracking-tight uppercase truncate',
                  isDark ? 'text-white' : 'text-[#1f2328]'
                )}
              >
                {title}
              </span>
            )}
            {badge}
            {subtitle && (
              <span
                className={cn(
                  'text-[11px] truncate hidden sm:inline',
                  isDark ? 'text-white/40' : 'text-[#6e7781]'
                )}
              >
                {subtitle}
              </span>
            )}
          </div>
          {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
        </div>
      )}

      <div className={cn(!noPadding && 'p-3.5', 'flex-1 min-h-0', contentClassName)}>
        {children}
      </div>
    </div>
  );
};
