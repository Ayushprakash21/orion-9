import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', icon, iconPosition = 'left', loading, fullWidth, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 ease-out rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-os-accent/50 disabled:opacity-50 disabled:cursor-not-allowed select-none';
    
    const variants = {
      primary: 'bg-os-accent text-white hover:brightness-110 active:brightness-95 shadow-[var(--orion-morph-shadow-soft,0_2px_6px_rgba(0,0,0,0.2))] active:shadow-[var(--orion-morph-shadow-inset,none)] active:translate-y-px',
      secondary: 'bg-[var(--orion-morph-surface,var(--os-surface-active))] text-os-text-primary hover:bg-[var(--orion-morph-surface-hover,var(--os-surface-hover))] border border-[var(--orion-morph-border,var(--os-border))] shadow-[var(--orion-morph-shadow-soft,none)] active:shadow-[var(--orion-morph-shadow-inset,none)] active:translate-y-px',
      ghost: 'text-os-text-secondary hover:text-os-text-primary hover:bg-[var(--orion-morph-surface-hover,var(--os-surface-hover))]',
      danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 shadow-[var(--orion-morph-shadow-soft,none)] active:translate-y-px',
      outline: 'border border-[var(--orion-morph-border,var(--os-border))] text-os-text-primary hover:bg-[var(--orion-morph-surface-hover,var(--os-surface-hover))] shadow-[var(--orion-morph-shadow-soft,none)] active:shadow-[var(--orion-morph-shadow-inset,none)] active:translate-y-px',
    };

    
    const sizes = {
      sm: 'h-7 px-2.5 text-xs gap-1.5',
      md: 'h-9 px-4 text-sm gap-2',
      lg: 'h-11 px-6 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
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
