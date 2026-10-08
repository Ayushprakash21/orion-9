import React from 'react';
import { cn } from '../lib/utils';

export interface OrionInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  isGlass?: boolean;
}

export const OrionInput = React.forwardRef<HTMLInputElement, OrionInputProps>(
  ({ icon, iconRight, isGlass = true, className, disabled, ...props }, ref) => {
    return (
      <div className={cn('relative flex items-center w-full', disabled && 'opacity-40 cursor-not-allowed')}>
        {icon && (
          <div className="absolute left-2.5 flex items-center pointer-events-none text-[var(--orion-text-muted,#747875)]">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full h-8 px-3 text-[13px] rounded-[6px] text-[var(--orion-text-primary,#F2F2EF)] placeholder:text-[var(--orion-text-muted,#747875)] outline-none transition-all duration-150',
            isGlass
              ? 'bg-white/[0.05] backdrop-blur-md border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(0,0,0,0.15)]'
              : 'bg-[var(--orion-surface,#121417)] border border-[var(--orion-border,rgba(255,255,255,0.08))]',
            'focus:border-[var(--orion-accent,#0071E3)]/60 focus:ring-2 focus:ring-[var(--orion-accent,#0071E3)]/30 focus:bg-white/[0.08]',
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
    );
  }
);

OrionInput.displayName = 'OrionInput';
