import React from 'react';

/**
 * ORION-9 SYSTEM ICON FAMILY
 * Defines crisp, vector-based, macOS-grade system affordance icons for OS chrome,
 * system bar, window controls, status popovers, environment badges, and menus.
 */

export interface SystemIconProps {
  size?: number;
  className?: string;
  color?: string;
}

export const SysIconWifi: React.FC<SystemIconProps> = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3" />
  </svg>
);

export const SysIconWifiOff: React.FC<SystemIconProps> = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
    <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3" />
  </svg>
);

export const SysIconBatteryFull: React.FC<SystemIconProps> = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="7" width="16" height="10" rx="2" ry="2" />
    <line x1="22" y1="11" x2="22" y2="13" />
    <rect x="5" y="10" width="10" height="4" fill={color} stroke="none" rx="1" />
  </svg>
);

export const SysIconBatteryCharging: React.FC<SystemIconProps> = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="7" width="16" height="10" rx="2" ry="2" />
    <line x1="22" y1="11" x2="22" y2="13" />
    <polyline points="11 7 9 12 13 12 11 17" fill="none" stroke={color} strokeWidth="1.8" />
  </svg>
);

export const SysIconBatteryLow: React.FC<SystemIconProps> = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="7" width="16" height="10" rx="2" ry="2" />
    <line x1="22" y1="11" x2="22" y2="13" />
    <rect x="5" y="10" width="3" height="4" fill={color} stroke="none" rx="0.5" />
  </svg>
);

export const SysIconBell: React.FC<SystemIconProps> = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

export const SysIconBellDot: React.FC<SystemIconProps> = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    <circle cx="18" cy="6" r="3" fill="#00F2FE" stroke="none" />
  </svg>
);

export const SysIconSearch: React.FC<SystemIconProps> = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const SysIconCommand: React.FC<SystemIconProps> = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
  </svg>
);

export const SysIconSettings: React.FC<SystemIconProps> = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const SysIconLock: React.FC<SystemIconProps> = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const SysIconPower: React.FC<SystemIconProps> = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
    <line x1="12" y1="2" x2="12" y2="12" />
  </svg>
);

export const SysIconGrid: React.FC<SystemIconProps> = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

export const SysIconVolume: React.FC<SystemIconProps> = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

export const SysIconMoon: React.FC<SystemIconProps> = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export const SysIconShield: React.FC<SystemIconProps> = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export const SysIconActivity: React.FC<SystemIconProps> = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export const SysIconSparkles: React.FC<SystemIconProps> = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
  </svg>
);

export const SysIconWindowClose: React.FC<SystemIconProps> = ({ size = 12, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const SysIconWindowMinimize: React.FC<SystemIconProps> = ({ size = 12, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const SysIconWindowMaximize: React.FC<SystemIconProps> = ({ size = 12, className = '', color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

export const SYSTEM_ICONS = {
  wifi: SysIconWifi,
  wifiOff: SysIconWifiOff,
  batteryFull: SysIconBatteryFull,
  batteryCharging: SysIconBatteryCharging,
  batteryLow: SysIconBatteryLow,
  bell: SysIconBell,
  bellDot: SysIconBellDot,
  search: SysIconSearch,
  command: SysIconCommand,
  settings: SysIconSettings,
  lock: SysIconLock,
  power: SysIconPower,
  grid: SysIconGrid,
  volume: SysIconVolume,
  moon: SysIconMoon,
  shield: SysIconShield,
  activity: SysIconActivity,
  sparkles: SysIconSparkles,
  windowClose: SysIconWindowClose,
  windowMinimize: SysIconWindowMinimize,
  windowMaximize: SysIconWindowMaximize
};

// ============================================================================
// REAL DESKTOP OS OBJECT ICONS (Folders, Files, Storage)
// High-fidelity vector objects inspired by modern desktop operating systems
// ============================================================================

export interface DesktopIconProps {
  size?: number;
  className?: string;
  active?: boolean;
}

export const IconDesktopFolder: React.FC<DesktopIconProps> = ({ size = 48, className = '', active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none transition-transform duration-200 ${className} ${active ? 'scale-95' : ''}`}
  >
    <defs>
      <linearGradient id="folder-back-grad" x1="64" y1="28" x2="64" y2="108" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#0369A1" />
      </linearGradient>
      <linearGradient id="folder-front-grad" x1="64" y1="46" x2="64" y2="114" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
      <filter id="folder-shadow" x="-10%" y="-5%" width="125%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.30" />
      </filter>
    </defs>
    {/* Back folder tab and plate */}
    <g filter="url(#folder-shadow)">
      <path
        d="M 16 36 C 16 31.6 19.6 28 24 28 L 52 28 C 56.4 28 60 30.8 62.4 34.4 L 68 42 L 104 42 C 110.6 42 116 47.4 116 54 L 116 100 C 116 104.4 112.4 108 108 108 L 20 108 C 15.6 108 12 104.4 12 100 L 12 40 C 12 37.8 13.8 36 16 36 Z"
        fill="url(#folder-back-grad)"
      />
    </g>
    {/* Interior paper insert preview */}
    <rect x="22" y="38" width="84" height="26" rx="4" fill="#F8FAFC" opacity="0.9" />
    <line x1="28" y1="46" x2="60" y2="46" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
    <line x1="28" y1="52" x2="48" y2="52" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
    {/* Front folder pocket */}
    <path
      d="M 12 50 C 12 47.8 13.8 46 16 46 L 112 46 C 114.2 46 116 47.8 116 50 L 116 100 C 116 106.6 110.6 112 104 112 L 24 112 C 17.4 112 12 106.6 12 100 L 12 50 Z"
      fill="url(#folder-front-grad)"
      stroke="#7DD3FC"
      strokeWidth="1"
    />
    {/* Subtle top rim highlight */}
    <line x1="16" y1="47" x2="112" y2="47" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const IconDocumentsFolder: React.FC<DesktopIconProps> = ({ size = 48, className = '', active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none transition-transform duration-200 ${className} ${active ? 'scale-95' : ''}`}
  >
    <defs>
      <linearGradient id="docf-back" x1="64" y1="28" x2="64" y2="108" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1E40AF" />
        <stop offset="100%" stopColor="#1E3A8A" />
      </linearGradient>
      <linearGradient id="docf-front" x1="64" y1="46" x2="64" y2="114" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
      <filter id="docf-shadow" x="-10%" y="-5%" width="125%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.30" />
      </filter>
    </defs>
    <g filter="url(#docf-shadow)">
      <path
        d="M 16 36 C 16 31.6 19.6 28 24 28 L 52 28 C 56.4 28 60 30.8 62.4 34.4 L 68 42 L 104 42 C 110.6 42 116 47.4 116 54 L 116 100 C 116 104.4 112.4 108 108 108 L 20 108 C 15.6 108 12 104.4 12 100 L 12 40 C 12 37.8 13.8 36 16 36 Z"
        fill="url(#docf-back)"
      />
    </g>
    <rect x="22" y="38" width="84" height="26" rx="4" fill="#F8FAFC" opacity="0.9" />
    <path
      d="M 12 50 C 12 47.8 13.8 46 16 46 L 112 46 C 114.2 46 116 47.8 116 50 L 116 100 C 116 106.6 110.6 112 104 112 L 24 112 C 17.4 112 12 106.6 12 100 L 12 50 Z"
      fill="url(#docf-front)"
      stroke="#93C5FD"
      strokeWidth="1"
    />
    <line x1="16" y1="47" x2="112" y2="47" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.2" strokeLinecap="round" />
    {/* Embossed Document Emblem */}
    <g transform="translate(48, 64)" opacity="0.9">
      <path d="M 6 0 L 22 0 L 28 6 L 28 26 C 28 27.1 27.1 28 26 28 L 6 28 C 4.9 28 4 27.1 4 26 L 4 2 C 4 0.9 4.9 0 6 0 Z" fill="#FFFFFF" fillOpacity="0.85" />
      <line x1="8" y1="10" x2="24" y2="10" stroke="#1E40AF" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="8" y1="15" x2="24" y2="15" stroke="#1E40AF" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="8" y1="20" x2="18" y2="20" stroke="#1E40AF" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  </svg>
);

export const IconDownloadsFolder: React.FC<DesktopIconProps> = ({ size = 48, className = '', active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none transition-transform duration-200 ${className} ${active ? 'scale-95' : ''}`}
  >
    <defs>
      <linearGradient id="dlf-back" x1="64" y1="28" x2="64" y2="108" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#047857" />
        <stop offset="100%" stopColor="#064E3B" />
      </linearGradient>
      <linearGradient id="dlf-front" x1="64" y1="46" x2="64" y2="114" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <filter id="dlf-shadow" x="-10%" y="-5%" width="125%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.30" />
      </filter>
    </defs>
    <g filter="url(#dlf-shadow)">
      <path
        d="M 16 36 C 16 31.6 19.6 28 24 28 L 52 28 C 56.4 28 60 30.8 62.4 34.4 L 68 42 L 104 42 C 110.6 42 116 47.4 116 54 L 116 100 C 116 104.4 112.4 108 108 108 L 20 108 C 15.6 108 12 104.4 12 100 L 12 40 C 12 37.8 13.8 36 16 36 Z"
        fill="url(#dlf-back)"
      />
    </g>
    <rect x="22" y="38" width="84" height="26" rx="4" fill="#F8FAFC" opacity="0.9" />
    <path
      d="M 12 50 C 12 47.8 13.8 46 16 46 L 112 46 C 114.2 46 116 47.8 116 50 L 116 100 C 116 106.6 110.6 112 104 112 L 24 112 C 17.4 112 12 106.6 12 100 L 12 50 Z"
      fill="url(#dlf-front)"
      stroke="#6EE7B7"
      strokeWidth="1"
    />
    <line x1="16" y1="47" x2="112" y2="47" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.2" strokeLinecap="round" />
    {/* Embossed Downward Tray Emblem */}
    <g transform="translate(64, 78)">
      <circle cx="0" cy="0" r="16" fill="#064E3B" fillOpacity="0.4" />
      <line x1="0" y1="-8" x2="0" y2="6" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <polyline points="-5,1 0,6 5,1" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="-8" y1="10" x2="8" y2="10" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  </svg>
);

export const IconProjectsFolder: React.FC<DesktopIconProps> = ({ size = 48, className = '', active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none transition-transform duration-200 ${className} ${active ? 'scale-95' : ''}`}
  >
    <defs>
      <linearGradient id="pjf-back" x1="64" y1="28" x2="64" y2="108" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6D28D9" />
        <stop offset="100%" stopColor="#4C1D95" />
      </linearGradient>
      <linearGradient id="pjf-front" x1="64" y1="46" x2="64" y2="114" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#6D28D9" />
      </linearGradient>
      <filter id="pjf-shadow" x="-10%" y="-5%" width="125%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.30" />
      </filter>
    </defs>
    <g filter="url(#pjf-shadow)">
      <path
        d="M 16 36 C 16 31.6 19.6 28 24 28 L 52 28 C 56.4 28 60 30.8 62.4 34.4 L 68 42 L 104 42 C 110.6 42 116 47.4 116 54 L 116 100 C 116 104.4 112.4 108 108 108 L 20 108 C 15.6 108 12 104.4 12 100 L 12 40 C 12 37.8 13.8 36 16 36 Z"
        fill="url(#pjf-back)"
      />
    </g>
    <rect x="22" y="38" width="84" height="26" rx="4" fill="#F8FAFC" opacity="0.9" />
    <path
      d="M 12 50 C 12 47.8 13.8 46 16 46 L 112 46 C 114.2 46 116 47.8 116 50 L 116 100 C 116 106.6 110.6 112 104 112 L 24 112 C 17.4 112 12 106.6 12 100 L 12 50 Z"
      fill="url(#pjf-front)"
      stroke="#C4B5FD"
      strokeWidth="1"
    />
    <line x1="16" y1="47" x2="112" y2="47" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.2" strokeLinecap="round" />
    {/* Embossed Compass / Drafting Emblem */}
    <g transform="translate(64, 78)">
      <circle cx="0" cy="0" r="16" fill="#4C1D95" fillOpacity="0.4" />
      <polygon points="0,-10 6,8 0,5 -6,8" fill="#EDE9FE" />
      <circle cx="0" cy="0" r="2.5" fill="#4C1D95" />
    </g>
  </svg>
);

export const IconReportsFolder: React.FC<DesktopIconProps> = ({ size = 48, className = '', active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none transition-transform duration-200 ${className} ${active ? 'scale-95' : ''}`}
  >
    <defs>
      <linearGradient id="rpf-back" x1="64" y1="28" x2="64" y2="108" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#92400E" />
      </linearGradient>
      <linearGradient id="rpf-front" x1="64" y1="46" x2="64" y2="114" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      <filter id="rpf-shadow" x="-10%" y="-5%" width="125%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.30" />
      </filter>
    </defs>
    <g filter="url(#rpf-shadow)">
      <path
        d="M 16 36 C 16 31.6 19.6 28 24 28 L 52 28 C 56.4 28 60 30.8 62.4 34.4 L 68 42 L 104 42 C 110.6 42 116 47.4 116 54 L 116 100 C 116 104.4 112.4 108 108 108 L 20 108 C 15.6 108 12 104.4 12 100 L 12 40 C 12 37.8 13.8 36 16 36 Z"
        fill="url(#rpf-back)"
      />
    </g>
    <rect x="22" y="38" width="84" height="26" rx="4" fill="#F8FAFC" opacity="0.9" />
    <path
      d="M 12 50 C 12 47.8 13.8 46 16 46 L 112 46 C 114.2 46 116 47.8 116 50 L 116 100 C 116 106.6 110.6 112 104 112 L 24 112 C 17.4 112 12 106.6 12 100 L 12 50 Z"
      fill="url(#rpf-front)"
      stroke="#FDE68A"
      strokeWidth="1"
    />
    <line x1="16" y1="47" x2="112" y2="47" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.2" strokeLinecap="round" />
    {/* Embossed Bar Chart Emblem */}
    <g transform="translate(64, 78)">
      <circle cx="0" cy="0" r="16" fill="#78350F" fillOpacity="0.4" />
      <rect x="-9" y="0" width="4" height="8" rx="1" fill="#FEF3C7" />
      <rect x="-3" y="-5" width="4" height="13" rx="1" fill="#FEF3C7" />
      <rect x="3" y="-9" width="4" height="17" rx="1" fill="#FEF3C7" />
    </g>
  </svg>
);

export const IconDesktopFileTxt: React.FC<DesktopIconProps> = ({ size = 48, className = '', active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none transition-transform duration-200 ${className} ${active ? 'scale-95' : ''}`}
  >
    <defs>
      <linearGradient id="file-txt-grad" x1="64" y1="18" x2="64" y2="114" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#F1F5F9" />
      </linearGradient>
      <filter id="file-txt-shadow" x="-15%" y="-10%" width="130%" height="135%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.25" />
      </filter>
    </defs>
    {/* Document Body */}
    <path
      d="M 28 24 C 28 19.6 31.6 16 36 16 L 76 16 L 100 40 L 100 104 C 100 108.4 96.4 112 92 112 L 36 112 C 31.6 112 28 108.4 28 104 Z"
      fill="url(#file-txt-grad)"
      stroke="#CBD5E1"
      strokeWidth="1.2"
      filter="url(#file-txt-shadow)"
    />
    {/* Folded Corner */}
    <path
      d="M 76 16 L 76 36 C 76 38.2 77.8 40 80 40 L 100 40 Z"
      fill="#E2E8F0"
      stroke="#CBD5E1"
      strokeWidth="1"
    />
    {/* Ruled Text Lines */}
    <line x1="42" y1="52" x2="86" y2="52" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="42" y1="64" x2="86" y2="64" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
    <line x1="42" y1="76" x2="86" y2="76" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
    <line x1="42" y1="88" x2="70" y2="88" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
    {/* Red Margin Indicator Line */}
    <line x1="38" y1="46" x2="38" y2="98" stroke="#F87171" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
  </svg>
);

