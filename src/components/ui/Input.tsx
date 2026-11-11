import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, iconRight, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-[12px] font-medium text-[var(--orion-text-secondary,#A7AAA8)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-2.5 flex items-center text-[var(--orion-text-muted,#747875)] pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-8 px-3 rounded-[6px] text-[13px] text-[var(--orion-text-primary)] placeholder:text-[var(--orion-text-muted)]',
              'bg-[var(--os-input-bg,var(--orion-surface))] border border-[var(--orion-border)] shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]',
              'outline-none transition-all duration-150',
              'focus:border-[var(--orion-focus-ring,var(--orion-accent))] focus:ring-2 focus:ring-[var(--orion-focus,var(--orion-accent))]',
              'disabled:opacity-45 disabled:cursor-not-allowed',
              error
                ? 'border-[var(--orion-danger)] focus:ring-[var(--orion-danger)]/30'
                : 'hover:border-[var(--orion-border-strong)]',
              icon && 'pl-8',
              iconRight && 'pr-8',
              className
            )}
            {...props}
          />

          {iconRight && (
            <div className="absolute right-2.5 flex items-center text-[var(--orion-text-muted,#747875)]">
              {iconRight}
            </div>
          )}
        </div>
        {error && <p className="text-[11px] text-[var(--orion-danger,#C96B72)]">{error}</p>}
        {hint && !error && <p className="text-[11px] text-[var(--orion-text-muted,#747875)]">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
