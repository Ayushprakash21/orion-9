import React from 'react';
import {
  OrionIconPaletteContext,
  resolveAppIconLookup,
} from '../../os/icons/OrionIconRegistry';
import { OrionIconArtworkProps } from '../../os/icons/OrionIconTheme';
import { useOrionTheme } from '../../os/theme/useOrionTheme';

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
  theme = 'auto',
  active = false,
  selected = false,
  disabled = false,
  badge = false,
  notificationCount = 0,
  className = '',
  showContainer = true,
}) => {
  const { isDark } = useOrionTheme();
  const resolvedTheme: 'light' | 'dark' =
    theme === 'light' || theme === 'dark' ? theme : isDark ? 'dark' : 'light';

  const normApp = (app || '').toLowerCase().trim();
  const lookup = resolveAppIconLookup(normApp);
  const def = lookup.definition;
  const IconComponent = def.component as React.FC<OrionIconArtworkProps>;
  const sizeNum = typeof size === 'number' ? size : parseInt(String(size), 10) || 48;
  const radiusPx = Math.max(4, Math.round(sizeNum * 0.22));
  const useTileElevation = showContainer && sizeNum >= 28;
  const badgeBorderClass = resolvedTheme === 'light' ? 'border-white' : 'border-black/70';

  return (
    <OrionIconPaletteContext.Provider value={def.palette}>
      <div
        data-orion-app-icon={normApp}
        data-icon-resolved-id={lookup.resolvedId}
        data-icon-fallback={lookup.isFallback ? 'true' : 'false'}
        data-icon-theme={resolvedTheme}
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
            ? resolvedTheme === 'light'
              ? '0 4px 12px rgba(15, 23, 42, 0.14)'
              : '0 6px 14px rgba(0, 0, 0, 0.28)'
            : undefined,
        }}
      >
        <IconComponent
          size={sizeNum}
          active={active}
          theme={resolvedTheme}
          palette={def.palette}
        />

        {/* Notification Count Badge */}
        {notificationCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 bg-rose-500 text-white font-semibold tabular-nums flex items-center justify-center shadow-md rounded-full border-2 ${badgeBorderClass} px-1 min-w-[18px] h-[18px] z-20 pointer-events-none`}
            style={{ fontSize: Math.max(9, Math.round(sizeNum * 0.2)) }}
          >
            {notificationCount > 99 ? '99+' : notificationCount}
          </span>
        )}

        {/* Boolean Dot Badge */}
        {badge && notificationCount === 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 w-3 h-3 bg-[var(--orion-accent,#38BDF8)] rounded-full border-2 ${badgeBorderClass} shadow-sm z-20 pointer-events-none`}
          />
        )}
      </div>
    </OrionIconPaletteContext.Provider>
  );
});

export default OrionAppIcon;
