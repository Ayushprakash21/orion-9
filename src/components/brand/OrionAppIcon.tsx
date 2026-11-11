import React from 'react';
import { getAppIconDefinition } from '../../os/icons/OrionIconRegistry';

export type OrionAppIconSize = 16 | 18 | 20 | 24 | 32 | 40 | 48 | 52 | 64 | 80 | 96 | 128;

export interface OrionAppIconProps {
  app: string;
  size?: OrionAppIconSize | number;
  theme?: 'light' | 'dark' | 'auto';
  active?: boolean;
  selected?: boolean;
  disabled?: boolean;
  badge?: boolean | string;
  notificationCount?: number;
  className?: string;
  showContainer?: boolean;
}

export const OrionAppIcon: React.FC<OrionAppIconProps> = React.memo(({
  app,
  size = 48,
  theme = 'dark',
  active = false,
  selected = false,
  disabled = false,
  badge = false,
  notificationCount = 0,
  className = '',
  showContainer = true,
}) => {
  const normApp = (app || '').toLowerCase().trim();
  const def = getAppIconDefinition(normApp);
  const IconComponent = def.component as React.FC<{
    size?: number;
    className?: string;
    active?: boolean;
    theme?: 'light' | 'dark' | 'auto';
  }>;
  const sizeNum = typeof size === 'number' ? size : parseInt(String(size), 10) || 48;
  const radiusPx = Math.max(4, Math.round(sizeNum * 0.22));
  const useTileElevation = showContainer && sizeNum >= 28;

  return (
    <div
      data-orion-app-icon={normApp}
      data-icon-size={sizeNum}
      data-icon-active={active ? 'true' : 'false'}
      data-icon-selected={selected ? 'true' : 'false'}
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${
        disabled ? 'opacity-40 grayscale pointer-events-none' : ''
      } ${selected ? 'ring-2 ring-[var(--orion-accent,#38BDF8)] ring-offset-2 ring-offset-transparent' : ''} ${className}`}
      style={{
        width: `${sizeNum}px`,
        height: `${sizeNum}px`,
        borderRadius: `${radiusPx}px`,
        boxShadow: useTileElevation
          ? theme === 'light'
            ? '0 4px 12px rgba(15, 23, 42, 0.14)'
            : '0 6px 14px rgba(0, 0, 0, 0.28)'
          : undefined,
      }}
    >
      <IconComponent size={sizeNum} active={active} theme={theme} />

      {/* Notification Count Badge */}
      {notificationCount > 0 && (
        <span
          className="absolute -top-1 -right-1 bg-rose-500 text-white font-semibold tabular-nums flex items-center justify-center shadow-md rounded-full border-2 border-black/60 px-1 min-w-[18px] h-[18px] z-20 pointer-events-none"
          style={{ fontSize: Math.max(9, Math.round(sizeNum * 0.2)) }}
        >
          {notificationCount > 99 ? '99+' : notificationCount}
        </span>
      )}

      {/* Boolean Dot Badge */}
      {badge && notificationCount === 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[var(--orion-accent,#38BDF8)] rounded-full border-2 border-black/60 shadow-sm z-20 pointer-events-none" />
      )}
    </div>
  );
});

export default OrionAppIcon;
