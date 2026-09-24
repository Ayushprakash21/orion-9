import { useState, useEffect } from 'react';

/**
 * ORION-9 CENTRALIZED RESPONSIVE BREAKPOINT ARCHITECTURE
 *
 * Standard Breakpoints:
 * - Mobile: < 768px (iPhone, Pixel, Galaxy, small devices)
 * - Small Mobile: < 400px (iPhone SE, compact devices)
 * - Tablet: 768px - 1024px (iPad, iPad Mini, Galaxy Tab)
 * - Desktop: 1025px - 1599px (Laptops, Standard Desktops)
 * - Large Desktop: >= 1600px (Ultra-wide, 4K workstations)
 */

export interface ResponsiveLayoutState {
  width: number;
  height: number;
  isMobile: boolean;
  isSmallMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  isTouch: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export function getResponsiveLayoutSnapshot(): ResponsiveLayoutState {
  if (typeof window === 'undefined') {
    return {
      width: 1440,
      height: 900,
      isMobile: false,
      isSmallMobile: false,
      isTablet: false,
      isDesktop: true,
      isLargeDesktop: false,
      isLandscape: true,
      isPortrait: false,
      isTouch: false,
      deviceType: 'desktop',
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isSmallMobile = width < 400;
  const isMobile = width < 768;
  const isTablet = width >= 768 && width <= 1024;
  const isDesktop = width > 1024 && width < 1600;
  const isLargeDesktop = width >= 1600;
  const isLandscape = width > height;
  const isPortrait = !isLandscape;
  const isTouch = 'ontouchstart' in window || (navigator && navigator.maxTouchPoints > 0);

  const deviceType: 'mobile' | 'tablet' | 'desktop' = isMobile
    ? 'mobile'
    : isTablet
    ? 'tablet'
    : 'desktop';

  return {
    width,
    height,
    isMobile,
    isSmallMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isLandscape,
    isPortrait,
    isTouch,
    deviceType,
  };
}

export function useResponsiveLayout(): ResponsiveLayoutState {
  const [layout, setLayout] = useState<ResponsiveLayoutState>(getResponsiveLayoutSnapshot);

  useEffect(() => {
    let timeoutId: any = null;

    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setLayout(getResponsiveLayoutSnapshot());
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

  return layout;
}
