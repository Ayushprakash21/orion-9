/**
 * ORION-9 AUTHORITATIVE CROSS-DEVICE MODE HOOK
 * Evaluates viewport dimension, orientation, touch capability, and pointer precision
 * to provide a single authoritative device capability state for Desktop, Tablet, and Mobile.
 */

import { useResponsiveLayout, getResponsiveLayoutSnapshot, ResponsiveLayoutState } from './useResponsiveLayout';

export type OrionDeviceMode = 'desktop' | 'tablet' | 'mobile';

export interface OrionDeviceCapability {
  mode: OrionDeviceMode;
  isDesktop: boolean;
  isTablet: boolean;
  isMobile: boolean;
  isTouch: boolean;
  canHover: boolean;
  width: number;
  height: number;
  isLandscape: boolean;
  isPortrait: boolean;
  interactionModel: 'mouse_desktop' | 'touch_tablet' | 'mobile_shell';
}

export function getOrionDeviceSnapshot(): OrionDeviceCapability {
  const s = getResponsiveLayoutSnapshot();
  return {
    mode: s.mode,
    isDesktop: s.isDesktop,
    isTablet: s.isTablet,
    isMobile: s.isMobile,
    isTouch: s.isTouch,
    canHover: s.canHover,
    width: s.width,
    height: s.height,
    isLandscape: s.isLandscape,
    isPortrait: s.isPortrait,
    interactionModel: s.interactionModel,
  };
}

export function useOrionDeviceMode(): OrionDeviceCapability {
  const s = useResponsiveLayout();
  return {
    mode: s.mode,
    isDesktop: s.isDesktop,
    isTablet: s.isTablet,
    isMobile: s.isMobile,
    isTouch: s.isTouch,
    canHover: s.canHover,
    width: s.width,
    height: s.height,
    isLandscape: s.isLandscape,
    isPortrait: s.isPortrait,
    interactionModel: s.interactionModel,
  };
}
