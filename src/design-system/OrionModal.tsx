import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ORION_MODAL_VARIANTS } from './motion';
import { LiquidGlass } from './LiquidGlass';
import { OrionButton } from './OrionButton';

export interface OrionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'destructive';
    isLoading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children?: React.ReactNode;
  className?: string;
  maxWidth?: string;
}

export const OrionModal: React.FC<OrionModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  children,
  className,
  maxWidth = 'max-w-md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[6px]"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            variants={ORION_MODAL_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn('relative w-full z-10', maxWidth, className)}
            role="dialog"
            aria-modal="true"
          >
            <LiquidGlass
              tier="modal"
              className="rounded-[18px] p-6 text-[var(--orion-text-primary,#F2F2EF)] shadow-[0_32px_80px_rgba(0,0,0,0.65)]"
            >
              {(title || icon) && (
                <div className="flex items-start gap-4 mb-4">
                  {icon && (
                    <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.08] text-[var(--orion-accent,#0071E3)]">
                      {icon}
                    </div>
                  )}
                  <div className="flex-1">
                    {title && (
                      <h3 className="text-base font-semibold tracking-tight text-[var(--orion-text-primary,#F2F2EF)]">
                        {title}
                      </h3>
                    )}
                    {description && (
                      <p className="text-xs text-[var(--orion-text-muted,#747875)] mt-1 leading-relaxed">
                        {description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {children && <div className="mb-5">{children}</div>}

              {(primaryAction || secondaryAction) && (
                <div className="flex items-center justify-end gap-2.5 mt-5 pt-3 border-t border-white/[0.06]">
                  {secondaryAction && (
                    <OrionButton
                      variant="secondary"
                      size="sm"
                      onClick={secondaryAction.onClick}
                    >
                      {secondaryAction.label}
                    </OrionButton>
                  )}
                  {primaryAction && (
                    <OrionButton
                      variant={primaryAction.variant || 'primary'}
                      size="sm"
                      isLoading={primaryAction.isLoading}
                      onClick={primaryAction.onClick}
                    >
                      {primaryAction.label}
                    </OrionButton>
                  )}
                </div>
              )}
            </LiquidGlass>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
