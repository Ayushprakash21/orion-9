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
      {/* Circular Power Trigger Unit */}
      <motion.button
        whileHover={!disabled && !isBooting ? { scale: 1.04 } : undefined}
        whileTap={!disabled && !isBooting ? { scale: 0.97 } : undefined}
        transition={{ ease: ORION_EASE, duration: 0.2 }}
        type="button"
        data-testid="start-orion-button"
        onClick={onClick}
        disabled={disabled || isBooting}
        autoFocus
        aria-label="Start Orion Operating System"
        className={cn(
          'group relative flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/30',
          // responsive size: mobile 68px, tablet 72px, desktop 80px
          'w-[68px] h-[68px] sm:w-[72px] sm:h-[72px] md:w-[80px] md:h-[80px]',
          // premium minimal styling
          'bg-[rgba(20,24,30,0.65)] border border-[rgba(255,255,255,0.16)]',
          'hover:bg-[rgba(30,35,42,0.85)] hover:border-[rgba(255,255,255,0.28)]',
          'rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.30)] transition-all duration-200',
          'focus-visible:ring-2 focus-visible:ring-white/30'
        )}
      >
        {/* Power Icon */}
        <Power
          className={cn(
            'w-9 h-9 text-white/80 group-hover:text-white transition-colors duration-200',
            isBooting ? 'animate-pulse' : ''
          )}
        />
      </motion.button>
      {/* Primary Action Label */}
      <span
        className={cn(
          'mt-4 font-sans font-semibold text-[13px] tracking-[0.22em] uppercase',
          isBooting ? 'text-white/60' : 'text-white/88'
        )}
      >
        START ORION
      </span>
      {/* Sub-label Prompt */}
      <p
        data-testid="boot-enter-system-caption"
        className="mt-2 font-mono text-[9px] tracking-[0.28em] uppercase text-white/28"
      >
        ENTER SYSTEM
      </p>
    </div>
  );
};
