/**
 * ORION-9 AUTHORITATIVE RESPONSIVE OS ARCHITECTURE
 * 
 * Separates physical Device Class (Phone, Tablet, Desktop) from Device Orientation (Portrait, Landscape).
 * Ensures phones rotated into landscape retain Mobile OS without switching to Tablet/Desktop.
 * Provides debounced visualViewport event handling to prevent React hook order bugs & render churn.
 */

import { useState, useEffect } from 'react';

export type OrionDeviceClass = 'phone' | 'tablet' | 'desktop';
export type OrionOrientation = 'portrait' | 'landscape';

export interface ResponsiveLayoutState {
  // Dimensions & Orientation
  width: number;
  height: number;
  minDimension: number;
  maxDimension: number;
  orientation: OrionOrientation;
  isPortrait: boolean;
  isLandscape: boolean;

  // Authoritative Device Classification
  deviceClass: OrionDeviceClass;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;

  // Capabilities
  isTouch: boolean;
  canHover: boolean;

  // Legacy & Compatibility Fields
  isMobile: boolean;
  isSmallMobile: boolean;
  isLargeDesktop: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  mode: 'mobile' | 'tablet' | 'desktop';
  interactionModel: 'mobile_shell' | 'touch_tablet' | 'mouse_desktop';
}

/**
 * Calculates deterministic device classification snapshot based on screen geometry,
 * pointer precision, touch capability, and viewport dimensions.
 */
export function getResponsiveLayoutSnapshot(): ResponsiveLayoutState {
  if (typeof window === 'undefined') {
    return {
      width: 1440,
      height: 900,
      minDimension: 900,
      maxDimension: 1440,
      orientation: 'landscape',
      isPortrait: false,
      isLandscape: true,
      deviceClass: 'desktop',
      isPhone: false,
      isTablet: false,
      isDesktop: true,
      isTouch: false,
      canHover: true,
      isMobile: false,
      isSmallMobile: false,
      isLargeDesktop: false,
      deviceType: 'desktop',
      mode: 'desktop',
      interactionModel: 'mouse_desktop',
    };
  }

  // Viewport dimensions (visualViewport aware when supported)
  const vv = window.visualViewport;
  const width = Math.round(vv?.width || window.innerWidth);
  const height = Math.round(vv?.height || window.innerHeight);
  const minDimension = Math.min(width, height);
  const maxDimension = Math.max(width, height);

  // Screen characteristics
  const screenW = typeof screen !== 'undefined' ? (screen.width || width) : width;
  const screenH = typeof screen !== 'undefined' ? (screen.height || height) : height;
  const screenMin = Math.min(screenW, screenH);

  // Pointer & Touch capabilities
  const isTouch = (typeof window !== 'undefined' && ('ontouchstart' in window && (window as any).ontouchstart !== undefined && (window as any).ontouchstart !== null)) || 
                  (typeof navigator !== 'undefined' && (navigator.maxTouchPoints || 0) > 0);
  const canHover = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)').matches : !isTouch;

  // Orientation
  const orientation: OrionOrientation = width >= height ? 'landscape' : 'portrait';
  const isLandscape = orientation === 'landscape';
  const isPortrait = orientation === 'portrait';

  // User-Agent cues (used conservatively as supporting hints)
  const ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
  const isPhoneUA = /android|iphone|ipod|iemobile|blackberry/i.test(ua) && !/ipad|tablet/i.test(ua);
  const isTabletUA = /ipad|tablet/i.test(ua) || (isTouch && /macintosh/i.test(ua) && minDimension <= 1024);

  // Authoritative Device Classification
  let deviceClass: OrionDeviceClass = 'desktop';

  // 1. PHONE DETERMINATION:
  // An actual phone has physical minimum dimension <= 500px (e.g. 375x812, 390x844, 412x915).
  // Even when rotated into landscape (844x390), minDimension is 390 <= 500, so it remains a PHONE.
  if (
    screenMin <= 500 ||
    (minDimension <= 500 && isTouch) ||
    (width < 600 && isPortrait) ||
    (isPhoneUA && minDimension <= 600) ||
    (width <= 920 && height <= 500 && isTouch) // Phone in landscape
  ) {
    deviceClass = 'phone';
  }
  // 2. DESKTOP DETERMINATION:
  // Standard desktop workstation, laptop, or ultrawide screen (non-touch or fine pointer >= 1025px).
  else if (
    (width >= 1025 && (!isTouch || canHover) && !isTabletUA) ||
    (width >= 1366 && !isTouch)
  ) {
    deviceClass = 'desktop';
  }
  // 3. TABLET DETERMINATION:
  // A tablet has minDimension > 500px and maxDimension <= 1366px, with touch or viewport width 600-1024.
  // Examples: iPad (768x1024 / 1024x768), iPad Air (820x1180 / 1180x820), iPad Mini (744x1133 / 1133x744).
  else if (
    isTabletUA ||
    (isTouch && minDimension >= 500 && minDimension <= 1000) ||
    (width >= 600 && width <= 1024)
  ) {
    deviceClass = 'tablet';
  }
  // 4. Default fallback
  else {
    deviceClass = width >= 1025 ? 'desktop' : 'tablet';
  }

  const isPhone = deviceClass === 'phone';
  const isTablet = deviceClass === 'tablet';
  const isDesktop = deviceClass === 'desktop';

  // Legacy mappings for backwards compatibility
  const isMobile = isPhone;
  const isSmallMobile = isPhone && minDimension < 380;
  const isLargeDesktop = isDesktop && width >= 1600;
  const deviceType: 'mobile' | 'tablet' | 'desktop' = isPhone ? 'mobile' : isTablet ? 'tablet' : 'desktop';
  const mode = deviceType;
  const interactionModel = isPhone ? 'mobile_shell' : isTablet ? 'touch_tablet' : 'mouse_desktop';

  return {
    width,
    height,
    minDimension,
    maxDimension,
    orientation,
    isPortrait,
    isLandscape,
    deviceClass,
    isPhone,
    isTablet,
    isDesktop,
    isTouch,
    canHover,
    isMobile,
    isSmallMobile,
    isLargeDesktop,
    deviceType,
    mode,
    interactionModel,
  };
}

/**
 * Authoritative React hook providing stable responsive layout state.
 * Debounces resize, visualViewport, and orientation events to guarantee stable hook order
 * and zero React #300 lifecycle crashes during rotation.
 */
export function useResponsiveLayout(): ResponsiveLayoutState {
  const [layout, setLayout] = useState<ResponsiveLayoutState>(getResponsiveLayoutSnapshot);

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let rafId: number | null = null;

    const updateSnapshot = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setLayout(getResponsiveLayoutSnapshot());
      });
    };

    const handleDebouncedResize = () => {
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(updateSnapshot, 35);
    };

    window.addEventListener('resize', handleDebouncedResize, { passive: true });
    window.addEventListener('orientationchange', handleDebouncedResize, { passive: true });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleDebouncedResize, { passive: true });
    }

    // Initial check to ensure hydration consistency
    updateSnapshot();

    return () => {
      if (timerId) clearTimeout(timerId);
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleDebouncedResize);
      window.removeEventListener('orientationchange', handleDebouncedResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleDebouncedResize);
      }
    };
  }, []);

  return layout;
}
