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
              'w-full h-8 px-3 rounded-[6px] text-[13px] text-[var(--orion-text-primary,#F2F2EF)] placeholder:text-[var(--orion-text-muted,#747875)]',
              'bg-white/[0.05] backdrop-blur-md border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(0,0,0,0.15)]',
              'outline-none transition-all duration-150',
              'focus:border-[var(--orion-accent,#0071E3)]/60 focus:ring-2 focus:ring-[var(--orion-accent,#0071E3)]/30 focus:bg-white/[0.08]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              error
                ? 'border-[var(--orion-danger,#C96B72)]/60 focus:ring-[var(--orion-danger,#C96B72)]/30'
                : 'hover:border-white/[0.14]',
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
