import React from 'react';
import { cn } from '../../lib/utils';
import { useOrionTheme } from '../../os/theme/useOrionTheme';

export type EnterpriseButtonVariant = 'primary' | 'secondary' | 'subtle' | 'danger' | 'outline';
export type EnterpriseButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface EnterpriseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: EnterpriseButtonVariant;
  size?: EnterpriseButtonSize;
  icon?: React.ComponentType<{ className?: string }>;
  iconRight?: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}

export const EnterpriseButton: React.FC<EnterpriseButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'sm',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled,
  className,
  ...props
}) => {
  const { isDark } = useOrionTheme();

  const sizeStyles = {
    xs: 'px-2 py-0.5 text-[11px] gap-1',
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-1.5 text-xs gap-2',
    lg: 'px-4 py-2 text-sm gap-2',
  }[size];

  const variantStyles = {
    primary: isDark
      ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-500/50 shadow-xs'
      : 'bg-[#0969da] hover:bg-[#0550ae] text-white border-[#0969da] shadow-xs',
    secondary: isDark
      ? 'bg-white/[0.06] hover:bg-white/[0.12] text-white border-white/10'
      : 'bg-[#f6f8fa] hover:bg-[#eaeef2] text-[#1f2328] border-[#d0d7de] shadow-xs',
    subtle: isDark
      ? 'bg-transparent hover:bg-white/[0.06] text-white/70 hover:text-white border-transparent'
      : 'bg-transparent hover:bg-black/[0.04] text-[#57606a] hover:text-[#1f2328] border-transparent',
    danger: isDark
      ? 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/30'
      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200',
    outline: isDark
      ? 'bg-transparent hover:bg-white/[0.04] text-white/90 border-[#30363d]'
      : 'bg-white hover:bg-gray-50 text-[#1f2328] border-[#d0d7de] shadow-xs',
  }[variant];

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-sm border transition-all select-none focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer',
        sizeStyles,
        variantStyles,
        (disabled || loading) && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        Icon && <Icon className="w-3.5 h-3.5 shrink-0" />
      )}
      {children && <span>{children}</span>}
      {!loading && IconRight && <IconRight className="w-3.5 h-3.5 shrink-0" />}
    </button>
  );
};
