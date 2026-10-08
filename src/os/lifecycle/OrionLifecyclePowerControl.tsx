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
        whileHover={!disabled && !isBooting ? { scale: 1.05 } : undefined}
        whileTap={!disabled && !isBooting ? { scale: 0.95 } : undefined}
        transition={{ ease: ORION_EASE, duration: 0.2 }}
        type="button"
        data-testid="start-orion-button"
        onClick={onClick}
        disabled={disabled || isBooting}
        autoFocus
        aria-label="Start Orion"
        style={{
          background: 'transparent',
          backgroundColor: 'transparent',
          border: 'none',
          borderWidth: 0,
          outline: 'none',
          boxShadow: 'none',
          borderRadius: 0,
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          padding: 0,
          margin: 0,
        }}
        className={cn(
          // Completely transparent hit target, zero visual container, border, shadow, or background
          'group relative flex items-center justify-center cursor-pointer select-none',
          'w-20 h-20 bg-transparent border-none outline-none shadow-none ring-0 p-0 m-0',
          'hover:bg-transparent hover:border-none hover:shadow-none',
          'active:bg-transparent active:border-none active:shadow-none',
          'focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0'
        )}
      >
        {/* Minimal Floating Power Glyph */}
        <Power
          strokeWidth={1.75}
          className={cn(
            // Desktop: ~40-42px visual area, Tablet: ~38px, Mobile: ~36px
            'w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11',
            // Neutral silver/white theme color, subtle hover/focus brightening & glow directly on glyph
            'text-[var(--orion-text-primary,#F2F2EF)] opacity-80 group-hover:opacity-100 group-focus-visible:opacity-100',
            'transition-all duration-200 pointer-events-none drop-shadow-none',
            'group-hover:drop-shadow-[0_0_14px_rgba(255,255,255,0.7)]',
            'group-focus-visible:drop-shadow-[0_0_18px_rgba(255,255,255,0.85)]',
            'group-active:scale-95 group-active:opacity-100',
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
