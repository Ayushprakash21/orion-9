import React from 'react';
import { cn } from '../lib/utils';
import { LiquidGlass } from './LiquidGlass';

export interface OrionMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  shortcut?: string;
  destructive?: boolean;
}

export const OrionMenuItem = React.forwardRef<HTMLButtonElement, OrionMenuItemProps>(
  ({ icon, shortcut, destructive = false, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'w-full flex items-center justify-between gap-3 px-2.5 py-1.5 text-[12px] font-normal rounded-[5px] select-none text-left transition-colors duration-100 outline-none',
          destructive
            ? 'text-[var(--orion-danger,#C96B72)] hover:bg-[var(--orion-danger,#C96B72)]/15 focus:bg-[var(--orion-danger,#C96B72)]/15'
            : 'text-[var(--orion-text-primary,#F2F2EF)] hover:bg-white/[0.08] focus:bg-white/[0.08] active:bg-white/[0.12]',
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="shrink-0 opacity-70">{icon}</span>}
          <span className="truncate">{children}</span>
        </div>
        {shortcut && (
          <span className="text-[10px] tracking-widest text-[var(--orion-text-muted,#747875)] opacity-60 ml-2 shrink-0">
            {shortcut}
          </span>
        )}
      </button>
    );
  }
);

OrionMenuItem.displayName = 'OrionMenuItem';

export interface OrionMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const OrionMenu = React.forwardRef<HTMLDivElement, OrionMenuProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <LiquidGlass
        ref={ref}
        tier="menu"
        className={cn('min-w-[180px] p-1 rounded-[8px] flex flex-col gap-0.5', className)}
        {...props}
      >
        {children}
      </LiquidGlass>
    );
  }
);

OrionMenu.displayName = 'OrionMenu';

export const OrionMenuSeparator: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={cn('h-px my-1 bg-white/[0.06]', className)} />;
};
