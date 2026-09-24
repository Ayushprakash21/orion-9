/**
 * ORION-9 AUTHORITATIVE CROSS-DEVICE MODE HOOK
 * Evaluates viewport dimension, orientation, touch capability, and pointer precision
 * to provide a single authoritative device capability state for Desktop, Tablet, and Mobile.
 */

import { useState, useEffect, useMemo } from 'react';

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
  if (typeof window === 'undefined') {
    return {
      mode: 'desktop',
      isDesktop: true,
      isTablet: false,
      isMobile: false,
      isTouch: false,
      canHover: true,
      width: 1440,
      height: 900,
      isLandscape: true,
      isPortrait: false,
      interactionModel: 'mouse_desktop',
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isTouch = 'ontouchstart' in window || (navigator && navigator.maxTouchPoints > 0);
  const canHover = window.matchMedia ? window.matchMedia('(hover: hover)').matches : !isTouch;
  const isLandscape = width > height;
  const isPortrait = !isLandscape;

  // Authoritative Breakpoints:
  // Mobile: < 768px
  // Tablet: 768px – 1023px
  // Desktop: >= 1024px
  let mode: OrionDeviceMode = 'desktop';
  if (width < 768) {
    mode = 'mobile';
  } else if (width < 1024) {
    mode = 'tablet';
  } else {
    mode = 'desktop';
  }

  const isMobile = mode === 'mobile';
  const isTablet = mode === 'tablet';
  const isDesktop = mode === 'desktop';

  const interactionModel: 'mouse_desktop' | 'touch_tablet' | 'mobile_shell' = isMobile
    ? 'mobile_shell'
    : isTablet
    ? 'touch_tablet'
    : 'mouse_desktop';

  return {
    mode,
    isDesktop,
    isTablet,
    isMobile,
    isTouch,
    canHover,
    width,
    height,
    isLandscape,
    isPortrait,
    interactionModel,
  };
}

export function useOrionDeviceMode(): OrionDeviceCapability {
  const [capability, setCapability] = useState<OrionDeviceCapability>(getOrionDeviceSnapshot);

  useEffect(() => {
    let timeoutId: any = null;

    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setCapability(getOrionDeviceSnapshot());
      }, 30);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return capability;
}
