import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ORION_MODAL_VARIANTS } from '../../design-system/motion';
import { LiquidGlass } from '../../design-system/LiquidGlass';

export interface OrionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const OrionDialog: React.FC<OrionDialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = 'md',
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-[95vw] h-[90vh]',
  }[size];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10500] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/45 backdrop-blur-[8px]"
          />

          {/* Dialog Container */}
          <motion.div
            variants={ORION_MODAL_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn('relative w-full z-10 pointer-events-auto', sizeClasses, className)}
          >
            <LiquidGlass
              tier="modal"
              className="rounded-[18px] text-[var(--orion-text-primary,#F2F2EF)] shadow-[0_32px_80px_rgba(0,0,0,0.65)] overflow-hidden flex flex-col"
            >
              {/* Header */}
              {(title || icon) && (
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center gap-3 min-w-0">
                    {icon && (
                      <div className="p-1.5 rounded-lg bg-[var(--orion-accent,#0071E3)]/15 border border-[var(--orion-accent,#0071E3)]/25 text-[var(--orion-accent,#0071E3)] shrink-0">
                        {icon}
                      </div>
                    )}
                    <div className="min-w-0">
                      {title && (
                        <h3 className="text-sm font-semibold text-[var(--orion-text-primary,#F2F2EF)] tracking-tight truncate">
                          {title}
                        </h3>
                      )}
                      {subtitle && (
                        <p className="text-[11px] text-[var(--orion-text-muted,#747875)] mt-0.5 truncate">
                          {subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1 rounded-[5px] text-[var(--orion-text-muted,#747875)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-3 shrink-0"
                    aria-label="Close dialog"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Body */}
              <div className="flex-1 p-5 sm:p-6 overflow-y-auto text-xs sm:text-sm">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="px-5 py-3 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-end gap-2.5 shrink-0">
                  {footer}
                </div>
              )}
            </LiquidGlass>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
