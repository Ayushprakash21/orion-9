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
    default:
      'bg-[var(--orion-morph-surface,rgba(20,23,28,0.70))] border-[var(--orion-morph-border,rgba(255,255,255,0.08))] shadow-[0_4px_16px_rgba(0,0,0,0.18)] backdrop-blur-md',
    elevated:
      'bg-[var(--orion-morph-surface-elevated,rgba(24,28,34,0.85))] border-[var(--orion-morph-border-strong,rgba(255,255,255,0.14))] shadow-[0_12px_32px_rgba(0,0,0,0.30)] backdrop-blur-lg',
    subtle:
      'bg-[var(--orion-morph-surface-subtle,rgba(255,255,255,0.03))] border-[var(--orion-morph-border,rgba(255,255,255,0.06))] shadow-none',
    critical:
      'bg-[var(--orion-morph-surface,rgba(20,23,28,0.70))] border-[var(--orion-danger,#C96B72)]/30 shadow-[0_4px_16px_rgba(201,107,114,0.12)]',
    warning:
      'bg-[var(--orion-morph-surface,rgba(20,23,28,0.70))] border-[var(--orion-warning,#C6A15B)]/30 shadow-[0_4px_16px_rgba(198,161,91,0.12)]',
    healthy:
      'bg-[var(--orion-morph-surface,rgba(20,23,28,0.70))] border-[var(--orion-success,#5FAF8A)]/30 shadow-[0_4px_16px_rgba(95,175,138,0.12)]',
  }[variant];

  return (
    <div
      className={cn(
        'rounded-[12px] border overflow-hidden box-border transition-all duration-200 relative',
        variantStyles,
        hoverEffect &&
          'hover:border-white/20 hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<
  React.HTMLAttributes<HTMLDivElement> & {
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
  }
> = ({ title, subtitle, icon, actions, children, className, ...props }) => {
  if (children) {
    return (
      <div
        className={cn(
          'p-4 sm:p-5 border-b border-white/[0.06] flex justify-between items-center gap-4',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-4 sm:p-5 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && <div className="text-[var(--orion-text-secondary,#A7AAA8)] shrink-0">{icon}</div>}
        <div className="min-w-0">
          {title && (
            <h3 className="text-xs sm:text-[13px] font-semibold text-[var(--orion-text-primary,#F2F2EF)] tracking-tight truncate">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-[11px] text-[var(--orion-text-muted,#747875)] mt-0.5 line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn('p-4 sm:p-5 space-y-4', className)} {...props}>
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
    <div
      className={cn(
        'p-4 sm:p-5 border-t border-white/[0.06] flex items-center justify-between gap-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
