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
    default: 'bg-os-surface border-os-border',
    elevated: 'bg-os-surface-elevated border-os-border-strong shadow-md',
    subtle: 'bg-os-surface-secondary border-os-border',
    critical: 'bg-os-surface border-red-500/30',
    warning: 'bg-os-surface border-amber-500/30',
    healthy: 'bg-os-surface border-emerald-500/30',
  }[variant];

  return (
    <div
      className={cn(
        'rounded-xl border shadow-sm overflow-hidden box-border transition-colors relative',
        variantStyles,
        hoverEffect && 'hover:border-os-border-strong hover:shadow-md transition-all',
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
