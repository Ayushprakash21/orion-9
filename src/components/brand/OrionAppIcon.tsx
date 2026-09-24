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

export const OrionAppIcon: React.FC<OrionAppIconProps> = ({
  app,
  size = 48,
  active = false,
  selected = false,
  disabled = false,
  badge = false,
  notificationCount = 0,
  className = '',
}) => {
  const normApp = (app || '').toLowerCase().trim();
  const def = getAppIconDefinition(normApp);
  const IconComponent = def.component;
  const sizeNum = typeof size === 'number' ? size : parseInt(String(size), 10) || 48;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none transition-all duration-200 shrink-0 ${
        disabled ? 'opacity-40 grayscale pointer-events-none' : ''
      } ${selected ? 'ring-2 ring-[#00F2FE] ring-offset-2 ring-offset-[#0A0D14]' : ''} ${className}`}
      style={{
        width: `${sizeNum}px`,
        height: `${sizeNum}px`,
      }}
    >
      <IconComponent size={sizeNum} active={active} />

      {/* Notification Count Badge */}
      {notificationCount > 0 && (
        <span
          className="absolute -top-1 -right-1 bg-red-500 text-white font-semibold flex items-center justify-center shadow-md rounded-full border-2 border-[#0A0D14] px-1 text-xs min-w-[18px] h-[18px] z-20 pointer-events-none"
          style={{ fontSize: Math.max(9, Math.round(sizeNum * 0.2)) }}
        >
          {notificationCount > 99 ? '99+' : notificationCount}
        </span>
      )}

      {/* Boolean Dot Badge */}
      {badge && notificationCount === 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#00F2FE] rounded-full border-2 border-[#0A0D14] shadow-sm z-20 pointer-events-none" />
      )}
    </div>
  );
};

export default OrionAppIcon;
