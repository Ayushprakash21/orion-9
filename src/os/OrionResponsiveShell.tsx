/**
 * ORION-9 SINGLE AUTHORITATIVE RESPONSIVE SHELL
 * 
 * Centralized responsive OS router:
 * - PHONE: OrionMobileShell (Single-Screen Mobile Application Shell & 5-tab Bottom Navigation)
 * - TABLET: OrionTabletShell (Dedicated Tablet OS, Left Rail / Bottom Bar, 4-grid / 2-col Layouts)
 * - DESKTOP: OrionDesktop (Multi-Window Desktop OS, Top System Bar, Desktop Dock, Floating Windows)
 * 
 * Guarantees unconditional hook order across all screen rotations and dimension changes.
 */

import React from 'react';
import { useResponsiveLayout } from '../lib/useResponsiveLayout';
import { OrionMobileShell } from './mobile/OrionMobileShell';
import { OrionTabletShell } from './tablet/OrionTabletShell';
import { OrionDesktop } from './components/OrionDesktop';

export const OrionResponsiveShell: React.FC = () => {
  const { deviceClass, isPhone, isTablet, isDesktop } = useResponsiveLayout();

  // 1. PHONE SHELL (Portrait & Landscape on phone devices)
  if (deviceClass === 'phone' || isPhone) {
    return <OrionMobileShell />;
  }

  // 2. TABLET SHELL (Dedicated Tablet OS presentation mode)
  if (deviceClass === 'tablet' || isTablet) {
    return <OrionTabletShell />;
  }

  // 3. DESKTOP SHELL (Workstation & Laptop Multi-Window Desktop OS)
  return <OrionDesktop />;
};
