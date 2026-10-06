/**
 * ORION-9 OS LIFECYCLE POWER CONTROL
 * Branded aerospace-grade OS power entry control.
 * Replaces generic rectangular SaaS buttons with a bespoke power activation component.
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
    <div className={cn("flex flex-col items-center select-none", className)}>
      {/* Interactive Power Trigger Unit */}
      <motion.button
        whileHover={!disabled && !isBooting ? { scale: 1.03 } : undefined}
        whileTap={!disabled && !isBooting ? { scale: 0.97 } : undefined}
        transition={{ ease: ORION_EASE, duration: 0.2 }}
        type="button"
        data-testid="start-orion-button"
        onClick={onClick}
        disabled={disabled || isBooting}
        autoFocus
        aria-label="Start Orion Operating System"
        className={cn(
          "group relative flex flex-col items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/30",
          "w-[240px] sm:w-[260px] py-4 px-6 rounded-2xl",
          "bg-white/[0.04] hover:bg-white/[0.07] active:bg-white/[0.03]",
          "border border-white/14 hover:border-white/25 focus-visible:border-white/40",
          "shadow-[0_16px_36px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)]",
          "hover:shadow-[0_0_25px_rgba(255,255,255,0.08),inset_0_1px_1px_rgba(255,255,255,0.18)]",
          "transition-all duration-300"
        )}
      >
        {/* Subtle Inner Glow Ring */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Central Power Icon Indicator */}
        <div className="relative mb-2.5 flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.06] border border-white/14 group-hover:border-white/28 group-hover:bg-white/[0.1] transition-colors duration-300 shadow-inner">
          <Power
            className={cn(
              "w-4 h-4 transition-all duration-300",
              isBooting
                ? "text-white animate-pulse"
                : "text-white/80 group-hover:text-white group-hover:scale-110"
            )}
          />
        </div>

        {/* Primary Action Label */}
        <span className="font-sans font-semibold text-xs sm:text-sm tracking-[0.2em] uppercase text-white/90 group-hover:text-white transition-colors">
          {isBooting ? 'INITIALIZING KERNEL...' : 'START ORION'}
        </span>
      </motion.button>

      {/* Sub-label Prompt */}
      <p
        data-testid="boot-enter-system-caption"
        className="font-mono text-[10px] text-white/35 tracking-[0.22em] uppercase mt-3.5"
      >
        ENTER SYSTEM
      </p>
    </div>
  );
};
