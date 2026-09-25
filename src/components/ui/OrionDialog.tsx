import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

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
    xl: 'max-[#640px]',
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
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={cn(
              'relative w-full rounded-2xl border border-white/10 bg-[#12151a]/90 dark:bg-[#12151a]/90 backdrop-blur-2xl text-os-text-primary shadow-2xl overflow-hidden flex flex-col pointer-events-auto',
              sizeClasses,
              className
            )}
          >
            {/* Header */}
            {(title || icon) && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.03]">
                <div className="flex items-center gap-3 min-w-0">
                  {icon && <div className="p-2 rounded-xl bg-os-accent/15 border border-os-accent/30 text-os-accent shrink-0">{icon}</div>}
                  <div className="min-w-0">
                    {title && <h3 className="text-sm sm:text-base font-semibold text-white tracking-wide truncate">{title}</h3>}
                    {subtitle && <p className="text-xs text-os-text-muted mt-0.5 truncate">{subtitle}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-os-text-muted hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-3 shrink-0"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Body - Solid inner surface if needed or translucent */}
            <div className="flex-1 p-5 sm:p-6 overflow-y-auto custom-scrollbar text-xs sm:text-sm">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-5 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-3 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
