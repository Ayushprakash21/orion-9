import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'subtle' | 'critical' | 'warning' | 'healthy';
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className,
  hoverEffect = false,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-[var(--orion-morph-surface,var(--os-surface))] border-[var(--orion-morph-border,var(--os-border))] shadow-[var(--orion-morph-shadow-soft,0_2px_8px_rgba(0,0,0,0.1))] backdrop-blur-[var(--orion-morph-blur,10px)]',
    elevated: 'bg-[var(--orion-morph-surface-elevated,var(--os-surface-elevated))] border-[var(--orion-morph-border-strong,var(--os-border-strong))] shadow-[var(--orion-morph-shadow-deep,0_10px_25px_rgba(0,0,0,0.2))] backdrop-blur-[var(--orion-morph-blur,12px)]',
    subtle: 'bg-[var(--orion-morph-surface-subtle,var(--os-surface-secondary))] border-[var(--orion-morph-border,var(--os-border))] shadow-[var(--orion-morph-elevation-0,none)]',
    critical: 'bg-[var(--orion-morph-surface,var(--os-surface))] border-red-500/30 shadow-[var(--orion-morph-shadow-soft,none)]',
    warning: 'bg-[var(--orion-morph-surface,var(--os-surface))] border-amber-500/30 shadow-[var(--orion-morph-shadow-soft,none)]',
    healthy: 'bg-[var(--orion-morph-surface,var(--os-surface))] border-emerald-500/30 shadow-[var(--orion-morph-shadow-soft,none)]',
  }[variant];

  return (
    <div
      className={cn(
        'rounded-xl border overflow-hidden box-border transition-all relative',
        variantStyles,
        hoverEffect && 'hover:border-[var(--orion-morph-border-strong,var(--os-border-strong))] hover:shadow-[var(--orion-morph-shadow,0_8px_20px_rgba(0,0,0,0.15))] hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};


export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement> & {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}> = ({
  title,
  subtitle,
  icon,
  actions,
  children,
  className,
  ...props
}) => {
  if (children) {
    return (
      <div className={cn('p-5 sm:p-6 border-b border-os-border flex justify-between items-center gap-4', className)} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn('p-5 sm:p-6 border-b border-os-border flex flex-col sm:flex-row sm:items-center justify-between gap-3', className)} {...props}>
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && <div className="text-os-text-secondary shrink-0">{icon}</div>}
        <div className="min-w-0">
          {title && (
            <h3 className="text-xs sm:text-sm uppercase tracking-wider font-semibold text-os-text-primary truncate">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-os-text-muted mt-0.5 line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn('p-5 sm:p-6 space-y-4', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn('p-4 sm:p-5 border-t border-os-border bg-os-surface-secondary/50 flex items-center justify-between gap-3', className)} {...props}>
      {children}
    </div>
  );
};
