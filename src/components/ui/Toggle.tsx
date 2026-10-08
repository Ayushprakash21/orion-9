import React from 'react';
import { cn } from '../../lib/utils';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
}) => {
  const isSm = size === 'sm';
  const trackWidth = isSm ? 'w-8 h-4.5' : 'w-10 h-6';
  const thumbSize = isSm ? 'w-3.5 h-3.5' : 'w-5 h-5';
  const travelTranslate = isSm ? 'translate-x-3.5' : 'translate-x-4';

  return (
    <label
      className={cn(
        'flex items-center gap-3 select-none',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex items-center shrink-0 rounded-full transition-colors duration-200 outline-none p-0.5',
          'focus-visible:ring-2 focus-visible:ring-[var(--orion-accent,#0071E3)]/50 focus-visible:ring-offset-2',
          trackWidth,
          checked
            ? 'bg-[var(--orion-accent,#0071E3)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]'
            : 'bg-white/15 hover:bg-white/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.35),0_0_1px_rgba(0,0,0,0.2)] transform transition-transform duration-200 ease-out',
            thumbSize,
            checked ? travelTranslate : 'translate-x-0'
          )}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-[13px] font-medium text-[var(--orion-text-primary,#F2F2EF)]">
              {label}
            </span>
          )}
          {description && (
            <span className="text-[11px] text-[var(--orion-text-muted,#747875)]">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
};
