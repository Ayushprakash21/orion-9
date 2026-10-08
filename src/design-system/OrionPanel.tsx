import React from 'react';
import { cn } from '../lib/utils';
import { LiquidGlass } from './LiquidGlass';
import { LiquidGlassTier } from './glass';

export interface OrionPanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  tier?: LiquidGlassTier;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  interactive?: boolean;
}

export const OrionPanel = React.forwardRef<HTMLDivElement, OrionPanelProps>(
  (
    {
      tier = 'glass1',
      title,
      subtitle,
      headerAction,
      interactive = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <LiquidGlass
        ref={ref}
        tier={tier}
        interactive={interactive}
        className={cn('rounded-[10px] p-4 text-[var(--orion-text-primary,#F2F2EF)]', className)}
        {...props}
      >
        {(title || subtitle || headerAction) && (
          <div className="flex items-center justify-between gap-3 mb-3 border-b border-white/[0.05] pb-2.5">
            <div>
              {title && (
                <div className="text-[13px] font-semibold tracking-tight text-[var(--orion-text-primary,#F2F2EF)]">
                  {title}
                </div>
              )}
              {subtitle && (
                <div className="text-[11px] text-[var(--orion-text-muted,#747875)] mt-0.5">
                  {subtitle}
                </div>
              )}
            </div>
            {headerAction && <div className="shrink-0">{headerAction}</div>}
          </div>
        )}
        {children}
      </LiquidGlass>
    );
  }
);

OrionPanel.displayName = 'OrionPanel';
