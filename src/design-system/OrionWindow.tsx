import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { ORION_WINDOW_VARIANTS } from './motion';
import { LiquidGlass } from './LiquidGlass';

export interface OrionWindowProps {
  title?: React.ReactNode;
  icon?: React.ReactNode;
  isActive?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
}

export const OrionWindow: React.FC<OrionWindowProps> = ({
  title,
  icon,
  isActive = true,
  onClose,
  onMinimize,
  onMaximize,
  isMaximized = false,
  children,
  className,
  headerRight,
}) => {
  return (
    <motion.div
      variants={ORION_WINDOW_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        'relative flex flex-col rounded-[14px] overflow-hidden transition-shadow duration-200',
        isActive
          ? 'shadow-[0_24px_64px_rgba(0,0,0,0.48),inset_0_1px_0_0_rgba(255,255,255,0.12)]'
          : 'shadow-[0_12px_32px_rgba(0,0,0,0.24),inset_0_1px_0_0_rgba(255,255,255,0.06)] opacity-95',
        className
      )}
    >
      <LiquidGlass
        tier="window"
        className="flex-1 flex flex-col w-full h-full rounded-[14px]"
      >
        {/* Title Bar */}
        <div
          className={cn(
            'h-10 px-3.5 flex items-center justify-between border-b select-none transition-colors duration-150',
            isActive
              ? 'border-white/[0.08] bg-white/[0.03]'
              : 'border-white/[0.04] bg-transparent text-[var(--orion-text-muted,#747875)]'
          )}
        >
          {/* Traffic Lights */}
          <div className="flex items-center gap-2 group">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-3 h-3 rounded-full bg-[#FF5F56] hover:brightness-110 active:brightness-90 transition-all flex items-center justify-center border border-black/20"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-black/60 leading-none">
                ×
              </span>
            </button>
            <button
              type="button"
              onClick={onMinimize}
              aria-label="Minimize"
              className="w-3 h-3 rounded-full bg-[#FFBD2E] hover:brightness-110 active:brightness-90 transition-all flex items-center justify-center border border-black/20"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-black/60 leading-none">
                −
              </span>
            </button>
            <button
              type="button"
              onClick={onMaximize}
              aria-label={isMaximized ? 'Restore' : 'Maximize'}
              className="w-3 h-3 rounded-full bg-[#27C93F] hover:brightness-110 active:brightness-90 transition-all flex items-center justify-center border border-black/20"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[6px] font-bold text-black/60 leading-none">
                +
              </span>
            </button>
          </div>

          {/* Centered or context title */}
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--orion-text-primary,#F2F2EF)] tracking-tight">
            {icon && <span className="opacity-75">{icon}</span>}
            {title && <span>{title}</span>}
          </div>

          {/* Header Right Accessory */}
          <div className="flex items-center gap-2">{headerRight}</div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto">{children}</div>
      </LiquidGlass>
    </motion.div>
  );
};
