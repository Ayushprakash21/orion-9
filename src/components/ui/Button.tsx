import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      loading,
      fullWidth,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium select-none transition-all duration-150 rounded-[7px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--orion-accent,#0071E3)]/50 focus-visible:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-[var(--orion-accent,#0071E3)] text-white hover:brightness-105 active:brightness-95 border border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.2)]',
      secondary:
        'bg-white/[0.07] text-[var(--orion-text-primary,#F2F2EF)] hover:bg-white/[0.12] active:bg-white/[0.16] border border-white/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.1)]',
      ghost:
        'bg-transparent text-[var(--orion-text-secondary,#A7AAA8)] hover:text-[var(--orion-text-primary,#F2F2EF)] hover:bg-white/[0.06] active:bg-white/[0.10]',
      danger:
        'bg-[var(--orion-danger,#C96B72)]/15 text-[var(--orion-danger,#C96B72)] hover:bg-[var(--orion-danger,#C96B72)]/25 active:bg-[var(--orion-danger,#C96B72)]/30 border border-[var(--orion-danger,#C96B72)]/20',
      outline:
        'bg-transparent border border-white/[0.12] text-[var(--orion-text-primary,#F2F2EF)] hover:bg-white/[0.06] active:bg-white/[0.10]',
    };

    const sizes = {
      sm: 'h-7 px-2.5 text-xs gap-1.5',
      md: 'h-8 px-3.5 text-sm gap-2',
      lg: 'h-10 px-5 text-sm gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {!loading && icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
        {children && <span>{children}</span>}
        {!loading && icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
      </button>
    );
  }
);
Button.displayName = 'Button';
