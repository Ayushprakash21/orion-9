/**
 * ORION-9 RESPONSIVE DEVICE CLASSIFICATION UNIT TEST SUITE
 * 
 * Verifies that physical Device Class (Phone, Tablet, Desktop) is strictly separated from
 * Device Orientation (Portrait, Landscape), and that phones in landscape NEVER become tablets or desktops.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getResponsiveLayoutSnapshot } from '../../lib/useResponsiveLayout';

describe('Orion-9 Device Classification & Orientation Resolution Engine', () => {
  const originalWindow = global.window;
  const originalScreen = global.screen;
  const originalNavigator = global.navigator;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockDeviceEnvironment = ({
    width,
    height,
    screenWidth,
    screenHeight,
    isTouch = false,
    canHover = true,
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }: {
    width: number;
    height: number;
    screenWidth?: number;
    screenHeight?: number;
    isTouch?: boolean;
    canHover?: boolean;
    userAgent?: string;
  }) => {
    const sWidth = screenWidth || width;
    const sHeight = screenHeight || height;

    const windowObj: any = {
      innerWidth: width,
      innerHeight: height,
      visualViewport: { width, height },
      matchMedia: (query: string) => ({
        matches: query.includes('hover: hover') ? canHover : query.includes('pointer: fine') ? canHover : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    if (isTouch) {
      windowObj.ontouchstart = {};
    }

    vi.stubGlobal('window', windowObj);

    vi.stubGlobal('screen', {
      width: sWidth,
      height: sHeight,
    });

    vi.stubGlobal('navigator', {
      maxTouchPoints: isTouch ? 5 : 0,
      userAgent,
    });
  };

  describe('1. Phone Devices in Portrait and Landscape', () => {
    it('correctly classifies iPhone (375x812) in Portrait as PHONE', () => {
      mockDeviceEnvironment({
        width: 375,
        height: 812,
        screenWidth: 375,
        screenHeight: 812,
        isTouch: true,
        canHover: false,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
      });

      const snapshot = getResponsiveLayoutSnapshot();
      expect(snapshot.deviceClass).toBe('phone');
      expect(snapshot.isPhone).toBe(true);
      expect(snapshot.isTablet).toBe(false);
      expect(snapshot.isDesktop).toBe(false);
      expect(snapshot.orientation).toBe('portrait');
      expect(snapshot.isPortrait).toBe(true);
      expect(snapshot.isLandscape).toBe(false);
      expect(snapshot.isMobile).toBe(true);
    });

    it('CRITICAL: Phone rotated to Landscape (812x375) REMAINS A PHONE', () => {
      mockDeviceEnvironment({
        width: 812,
        height: 375,
        screenWidth: 812,
        screenHeight: 375,
        isTouch: true,
        canHover: false,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
      });

      const snapshot = getResponsiveLayoutSnapshot();
      expect(snapshot.deviceClass).toBe('phone');
      expect(snapshot.isPhone).toBe(true);
      expect(snapshot.isTablet).toBe(false);
      expect(snapshot.isDesktop).toBe(false);
      expect(snapshot.orientation).toBe('landscape');
      expect(snapshot.isLandscape).toBe(true);
      expect(snapshot.isPortrait).toBe(false);
      expect(snapshot.isMobile).toBe(true);
    });

    it('correctly classifies iPhone 14 Pro Max (390x844 & 844x390) as PHONE in both orientations', () => {
      // Portrait
      mockDeviceEnvironment({
        width: 390,
        height: 844,
        screenWidth: 390,
        screenHeight: 844,
        isTouch: true,
        canHover: false,
      });
      const pSnapshot = getResponsiveLayoutSnapshot();
      expect(pSnapshot.deviceClass).toBe('phone');
      expect(pSnapshot.orientation).toBe('portrait');

      // Landscape
      mockDeviceEnvironment({
        width: 844,
        height: 390,
        screenWidth: 844,
        screenHeight: 390,
        isTouch: true,
        canHover: false,
      });
      const lSnapshot = getResponsiveLayoutSnapshot();
      expect(lSnapshot.deviceClass).toBe('phone');
      expect(lSnapshot.orientation).toBe('landscape');
      expect(lSnapshot.isPhone).toBe(true);
      expect(lSnapshot.isTablet).toBe(false);
    });

    it('correctly classifies Android Pixel (412x915 & 915x412) as PHONE in both orientations', () => {
      // Portrait
      mockDeviceEnvironment({
        width: 412,
        height: 915,
        screenWidth: 412,
        screenHeight: 915,
        isTouch: true,
        canHover: false,
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)'
      });
      const pSnapshot = getResponsiveLayoutSnapshot();
      expect(pSnapshot.deviceClass).toBe('phone');
      expect(pSnapshot.orientation).toBe('portrait');

      // Landscape
      mockDeviceEnvironment({
        width: 915,
        height: 412,
        screenWidth: 915,
        screenHeight: 412,
        isTouch: true,
        canHover: false,
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)'
      });
      const lSnapshot = getResponsiveLayoutSnapshot();
      expect(lSnapshot.deviceClass).toBe('phone');
      expect(lSnapshot.orientation).toBe('landscape');
      expect(lSnapshot.isPhone).toBe(true);
    });
  });

  describe('2. Tablet Devices in Portrait and Landscape', () => {
    it('correctly classifies iPad (768x1024) in Portrait as TABLET', () => {
      mockDeviceEnvironment({
        width: 768,
        height: 1024,
        screenWidth: 768,
        screenHeight: 1024,
        isTouch: true,
        canHover: false,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)'
      });

      const snapshot = getResponsiveLayoutSnapshot();
      expect(snapshot.deviceClass).toBe('tablet');
      expect(snapshot.isTablet).toBe(true);
      expect(snapshot.isPhone).toBe(false);
      expect(snapshot.isDesktop).toBe(false);
      expect(snapshot.orientation).toBe('portrait');
      expect(snapshot.interactionModel).toBe('touch_tablet');
    });

    it('correctly classifies iPad (1024x768) in Landscape as TABLET', () => {
      mockDeviceEnvironment({
        width: 1024,
        height: 768,
        screenWidth: 1024,
        screenHeight: 768,
        isTouch: true,
        canHover: false,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)'
      });

      const snapshot = getResponsiveLayoutSnapshot();
      expect(snapshot.deviceClass).toBe('tablet');
      expect(snapshot.isTablet).toBe(true);
      expect(snapshot.isPhone).toBe(false);
      expect(snapshot.isDesktop).toBe(false);
      expect(snapshot.orientation).toBe('landscape');
      expect(snapshot.interactionModel).toBe('touch_tablet');
    });

    it('correctly classifies iPad Air (820x1180 & 1180x820) as TABLET in both orientations', () => {
      // Portrait
      mockDeviceEnvironment({
        width: 820,
        height: 1180,
        screenWidth: 820,
        screenHeight: 1180,
        isTouch: true,
        canHover: false,
      });
      const pSnapshot = getResponsiveLayoutSnapshot();
      expect(pSnapshot.deviceClass).toBe('tablet');
      expect(pSnapshot.orientation).toBe('portrait');

      // Landscape
      mockDeviceEnvironment({
        width: 1180,
        height: 820,
        screenWidth: 1180,
        screenHeight: 820,
        isTouch: true,
        canHover: false,
      });
      const lSnapshot = getResponsiveLayoutSnapshot();
      expect(lSnapshot.deviceClass).toBe('tablet');
      expect(lSnapshot.orientation).toBe('landscape');
    });
  });

  describe('3. Desktop Devices', () => {
    it('correctly classifies standard Desktop (1440x900) as DESKTOP', () => {
      mockDeviceEnvironment({
        width: 1440,
        height: 900,
        screenWidth: 1440,
        screenHeight: 900,
        isTouch: false,
        canHover: true,
      });

      const snapshot = getResponsiveLayoutSnapshot();
      expect(snapshot.deviceClass).toBe('desktop');
      expect(snapshot.isDesktop).toBe(true);
      expect(snapshot.isPhone).toBe(false);
      expect(snapshot.isTablet).toBe(false);
      expect(snapshot.interactionModel).toBe('mouse_desktop');
    });

    it('correctly classifies Ultrawide Desktop (2560x1440) as DESKTOP', () => {
      mockDeviceEnvironment({
        width: 2560,
        height: 1440,
        screenWidth: 2560,
        screenHeight: 1440,
        isTouch: false,
        canHover: true,
      });

      const snapshot = getResponsiveLayoutSnapshot();
      expect(snapshot.deviceClass).toBe('desktop');
      expect(snapshot.isDesktop).toBe(true);
      expect(snapshot.isLargeDesktop).toBe(true);
    });
  });
});
