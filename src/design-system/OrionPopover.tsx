import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ORION_POPOVER_VARIANTS } from './motion';
import { LiquidGlass } from './LiquidGlass';

export interface OrionPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

export const OrionPopover: React.FC<OrionPopoverProps> = ({
  isOpen,
  onClose,
  trigger,
  children,
  className,
  align = 'left',
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const alignClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  }[align];

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {trigger}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={ORION_POPOVER_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn('absolute z-50 mt-1.5', alignClasses, className)}
          >
            <LiquidGlass
              tier="popover"
              className="rounded-[10px] p-2 text-[var(--orion-text-primary,#F2F2EF)] shadow-[0_16px_40px_rgba(0,0,0,0.42)]"
            >
              {children}
            </LiquidGlass>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
