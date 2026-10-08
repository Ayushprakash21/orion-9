import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { ORION_SPRINGS } from './motion';

export interface OrionToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  'aria-label'?: string;
}

export const OrionToggle: React.FC<OrionToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}) => {
  const isSm = size === 'sm';
  const trackWidth = isSm ? 'w-8 h-4.5' : 'w-10 h-6';
  const thumbSize = isSm ? 'w-3.5 h-3.5' : 'w-5 h-5';
  const travelDistance = isSm ? 14 : 16;

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative inline-flex items-center shrink-0 cursor-pointer rounded-full transition-colors duration-200 outline-none p-0.5',
        'focus-visible:ring-2 focus-visible:ring-[var(--orion-accent,#0071E3)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50',
        checked
          ? 'bg-[var(--orion-accent,#0071E3)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]'
          : 'bg-white/15 hover:bg-white/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]',
        disabled && 'opacity-40 cursor-not-allowed',
        trackWidth,
        className
      )}
    >
      <motion.span
        animate={{ x: checked ? travelDistance : 0 }}
        transition={ORION_SPRINGS.responsive}
        className={cn(
          'block rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.35),0_0_1px_rgba(0,0,0,0.2)]',
          thumbSize
        )}
      />
    </button>
  );
};
