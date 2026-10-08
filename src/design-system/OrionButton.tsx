import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '../lib/utils';
import { ORION_SPRINGS } from './motion';

export type OrionButtonVariant = 'primary' | 'secondary' | 'glass' | 'tertiary' | 'destructive';
export type OrionButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface OrionButtonProps extends Omit<HTMLMotionProps<'button'>, 'size' | 'children'> {
  variant?: OrionButtonVariant;
  size?: OrionButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const OrionButton = React.forwardRef<HTMLButtonElement, OrionButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      icon,
      iconRight,
      isLoading,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      xs: 'h-6 px-2 text-[11px] rounded-[4px] gap-1',
      sm: 'h-7 px-2.5 text-xs rounded-[6px] gap-1.5',
      md: 'h-8 px-3 text-[13px] rounded-[6px] gap-2',
      lg: 'h-9 px-4 text-sm rounded-[8px] gap-2',
    }[size];

    const variantClasses = {
      primary:
        'bg-[var(--orion-accent,#0071E3)] text-white shadow-sm hover:brightness-105 active:brightness-95 border border-white/10',
      secondary:
        'bg-white/[0.07] text-[var(--orion-text-primary,#F2F2EF)] hover:bg-white/[0.12] active:bg-white/[0.16] border border-white/[0.08] shadow-sm',
      glass:
        'bg-white/[0.05] backdrop-blur-md text-[var(--orion-text-primary,#F2F2EF)] hover:bg-white/[0.10] active:bg-white/[0.14] border border-white/[0.08] shadow-sm',
      tertiary:
        'bg-transparent text-[var(--orion-text-secondary,#A7AAA8)] hover:text-[var(--orion-text-primary,#F2F2EF)] hover:bg-white/[0.06] active:bg-white/[0.10] border border-transparent',
      destructive:
        'bg-[var(--orion-danger,#C96B72)]/15 text-[var(--orion-danger,#C96B72)] hover:bg-[var(--orion-danger,#C96B72)]/25 active:bg-[var(--orion-danger,#C96B72)]/30 border border-[var(--orion-danger,#C96B72)]/20',
    }[variant];

    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        whileHover={disabled ? undefined : { scale: 1.01 }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        transition={ORION_SPRINGS.responsive}
        className={cn(
          'inline-flex items-center justify-center font-medium select-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--orion-accent,#0071E3)]/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150',
          sizeClasses,
          variantClasses,
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {icon && <span className="shrink-0 flex items-center">{icon}</span>}
            {children && <span>{children}</span>}
            {iconRight && <span className="shrink-0 flex items-center">{iconRight}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

OrionButton.displayName = 'OrionButton';
