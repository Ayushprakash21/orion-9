import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { ORION_WINDOW_VARIANTS } from './motion';
import { LiquidGlass } from './LiquidGlass';
import { OrionWindowControls } from '../os/components/OrionWindowControls';

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
          {/* Traffic Lights: Yellow (Minimize) -> Green (Maximize/Restore) -> Red (Close) */}
          <OrionWindowControls
            appName={typeof title === 'string' ? title : 'Window'}
            isMaximized={isMaximized}
            onClose={onClose}
            onMinimize={onMinimize}
            onMaximize={onMaximize}
            position="left"
          />

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
