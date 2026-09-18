import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
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
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-os-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-os-text-muted pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-10 rounded-lg border bg-os-input-bg text-os-text-primary text-sm',
              'placeholder:text-os-text-muted',
              'transition-all duration-150 ease-out',
              'focus:outline-none focus:ring-2 focus:ring-os-accent/40 focus:border-os-accent/60',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error ? 'border-red-400/60 focus:ring-red-400/40' : 'border-os-border hover:border-os-border-strong',
              icon ? 'pl-10' : 'pl-3',
              iconRight ? 'pr-10' : 'pr-3',
              className
            )}
            {...props}
          />
          {iconRight && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-os-text-muted">
              {iconRight}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-os-text-muted">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
