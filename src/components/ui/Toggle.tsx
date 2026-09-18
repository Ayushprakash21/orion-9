import React from 'react';
import { cn } from '../../lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, description, disabled, size = 'md' }) => {
  const sizes = {
    sm: { track: 'w-8 h-4.5', thumb: 'w-3.5 h-3.5', translate: 'translate-x-3.5' },
    md: { track: 'w-10 h-5.5', thumb: 'w-4.5 h-4.5', translate: 'translate-x-4.5' },
  };
  const s = sizes[size];

  return (
    <label className={cn('flex items-center gap-3 select-none', disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer')}>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-os-accent/40 focus:ring-offset-1',
          s.track,
          checked ? 'bg-os-accent' : 'bg-os-surface-active'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out mt-0.5 ml-0.5',
            s.thumb,
            checked ? s.translate : 'translate-x-0'
          )}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm text-os-text-primary">{label}</span>}
          {description && <span className="text-xs text-os-text-muted">{description}</span>}
        </div>
      )}
    </label>
  );
};
