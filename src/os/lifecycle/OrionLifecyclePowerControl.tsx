/**
 * ORION-9 OS LIFECYCLE POWER CONTROL
 * Premium minimal circular power entry control.
 */

import React from 'react';
import { motion } from 'motion/react';
import { Power } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ORION_EASE } from '../motion/OrionMotion';

export interface OrionLifecyclePowerControlProps {
  onClick: () => void;
  isBooting?: boolean;
  disabled?: boolean;
  className?: string;
}

export const OrionLifecyclePowerControl: React.FC<OrionLifecyclePowerControlProps> = ({
  onClick,
  isBooting = false,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={cn('flex flex-col items-center select-none', className)}>
      {/* Invisible Accessible Hit Target with Floating Power Glyph */}
      <motion.button
        whileHover={!disabled && !isBooting ? { scale: 1.04 } : undefined}
        whileTap={!disabled && !isBooting ? { scale: 0.96 } : undefined}
        transition={{ ease: ORION_EASE, duration: 0.2 }}
        type="button"
        data-testid="start-orion-button"
        onClick={onClick}
        disabled={disabled || isBooting}
        autoFocus
        aria-label="Start Orion"
        className={cn(
          // Completely transparent hit target, no visual container/border/shadow/background
          'group relative flex items-center justify-center cursor-pointer',
          'w-20 h-20 bg-transparent border-0 outline-none shadow-none ring-0 p-0',
          // Accessible subtle focus ring
          'focus-visible:ring-1 focus-visible:ring-white/25 focus-visible:rounded-full focus-visible:ring-offset-4 focus-visible:ring-offset-transparent'
        )}
      >
        {/* Minimal Floating Power Glyph */}
        <Power
          strokeWidth={1.75}
          className={cn(
            // Desktop: ~40-42px visual area, Tablet: ~38px, Mobile: ~36px
            'w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11',
            // Neutral silver/white theme color, subtle hover brightening
            'text-[var(--orion-text-primary,#F2F2EF)] opacity-80 group-hover:opacity-100',
            'transition-opacity duration-200 pointer-events-none drop-shadow-none',
            isBooting ? 'animate-pulse' : ''
          )}
        />
      </motion.button>

      {/* Primary Action Label (16-20px spacing from glyph) */}
      <span
        className={cn(
          'mt-4 md:mt-5 font-sans font-semibold text-[12px] tracking-[0.22em] uppercase select-none',
          'text-[#D8DDE3] transition-opacity duration-200',
          isBooting ? 'opacity-60' : 'opacity-85'
        )}
      >
        START ORION
      </span>

      {/* Sub-label Prompt (8-10px spacing from label) */}
      <p
        data-testid="boot-enter-system-caption"
        className="mt-2 font-mono text-[8.5px] tracking-[0.28em] uppercase text-white/40 select-none"
      >
        ENTER SYSTEM
      </p>
    </div>
  );
};
