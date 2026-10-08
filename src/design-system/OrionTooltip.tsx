import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ORION_TOOLTIP_VARIANTS } from './motion';

export interface OrionTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  delayMs?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const OrionTooltip: React.FC<OrionTooltipProps> = ({
  content,
  children,
  delayMs = 300,
  position = 'top',
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);

  const handleMouseEnter = () => {
    const t = window.setTimeout(() => setIsVisible(true), delayMs);
    setTimer(t);
  };

  const handleMouseLeave = () => {
    if (timer) clearTimeout(timer);
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  }[position];

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            variants={ORION_TOOLTIP_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'absolute z-50 pointer-events-none whitespace-nowrap px-2 py-1 text-[11px] font-medium leading-tight rounded-[5px] text-[var(--orion-text-primary,#F2F2EF)] bg-black/80 backdrop-blur-md border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.35)]',
              positionClasses,
              className
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
