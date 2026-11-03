import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ORION_SPRING_SMOOTH,
  ORION_SPRING_SNAPPY,
  ORION_SPRING_BOUNCY,
  ORION_SPRING_GENTLE,
  ORION_SPRING_DOCK,
  ORION_SPRING_WINDOW,
  ORION_SPRING_MODAL,
  ORION_DURATION_FAST,
  ORION_DURATION_NORMAL,
  ORION_DURATION_SLOW,
  getOrionSpringPhysics,
  isReducedMotionPreferred,
} from '../../os/motion/OrionMotion';
import {
  windowMotionVariants,
  launcherMotionVariants,
  commandPaletteMotionVariants,
  dockItemEntranceVariants,
  workspaceSwitchVariants,
} from '../../os/motion/OrionMotionVariants';
import { dockGeometryRegistry } from '../../os/dock/DockGeometryRegistry';
import { MOTION_SPRINGS, MOTION_DURATIONS, ORION_CARD_HOVER } from '../../design-system/motion';

describe('Orion Motion Engine 2.0 (macOS Interaction Model)', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    if (typeof global.window === 'undefined') {
      (global as any).window = {
        matchMedia: vi.fn().mockImplementation((query: string) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      };
    }
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  describe('1. Spring Physics Presets and Tokens', () => {
    it('defines smooth, snappy, bouncy, gentle, dock, and window spring presets', () => {
      expect(ORION_SPRING_SMOOTH.type).toBe('spring');
      expect(ORION_SPRING_SMOOTH.stiffness).toBeGreaterThan(0);
      expect(ORION_SPRING_SMOOTH.damping).toBeGreaterThan(0);

      expect(ORION_SPRING_SNAPPY.stiffness).toBeGreaterThan(ORION_SPRING_SMOOTH.stiffness);
      expect(ORION_SPRING_BOUNCY.damping).toBeLessThan(ORION_SPRING_SMOOTH.damping);

      expect(ORION_SPRING_DOCK.mass).toBeDefined();
      expect(ORION_SPRING_WINDOW.stiffness).toBeDefined();
      expect(ORION_SPRING_MODAL.damping).toBeDefined();
    });

    it('defines standardized duration tokens', () => {
      expect(ORION_DURATION_FAST).toBe(0.12);
      expect(ORION_DURATION_NORMAL).toBe(0.24);
      expect(ORION_DURATION_SLOW).toBe(0.38);
    });

    it('unifies design system motion tokens with OrionMotion engine', () => {
      expect(MOTION_SPRINGS.smooth.stiffness).toBe(ORION_SPRING_SMOOTH.stiffness);
      expect(MOTION_SPRINGS.snappy.stiffness).toBe(ORION_SPRING_SNAPPY.stiffness);
      expect(MOTION_SPRINGS.bouncy.damping).toBe(ORION_SPRING_BOUNCY.damping);
      expect(MOTION_DURATIONS.instant).toBe(ORION_DURATION_FAST);
      expect(MOTION_DURATIONS.fast).toBe(ORION_DURATION_NORMAL);
    });
  });

  describe('2. Dynamic Spring Profile Adaptor (getOrionSpringPhysics)', () => {
    it('returns natural macOS spring physics in premium mode', () => {
      const spring = getOrionSpringPhysics('smooth', 'premium');
      expect(spring.type).toBe('spring');
      expect(spring.stiffness).toBe(ORION_SPRING_SMOOTH.stiffness);
      expect(spring.damping).toBe(ORION_SPRING_SMOOTH.damping);
    });

    it('tightens damping for balanced mode', () => {
      const spring = getOrionSpringPhysics('smooth', 'balanced');
      expect(spring.type).toBe('spring');
      expect(spring.damping).toBeGreaterThanOrEqual(ORION_SPRING_SMOOTH.damping);
    });

    it('converts to fast duration in minimal mode', () => {
      const spring = getOrionSpringPhysics('smooth', 'minimal');
      expect(spring.duration).toBe(0.12);
      expect(spring.type).toBeUndefined();
    });

    it('returns zero duration in reduced motion mode', () => {
      const spring = getOrionSpringPhysics('smooth', 'reduced');
      expect(spring.duration).toBe(0);
    });
  });

  describe('3. Accessibility and Reduced Motion Preference Gate', () => {
    it('returns true when explicit setting is enabled', () => {
      expect(isReducedMotionPreferred(true)).toBe(true);
    });

    it('returns false when explicit setting is disabled and media query is false', () => {
      (global as any).window = {
        matchMedia: vi.fn().mockImplementation((query: string) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      };

      expect(isReducedMotionPreferred(false)).toBe(false);
    });

    it('respects system prefers-reduced-motion when setting is undefined', () => {
      (global as any).window = {
        matchMedia: vi.fn().mockImplementation((query: string) => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      };

      expect(isReducedMotionPreferred(undefined)).toBe(true);
    });
  });

  describe('4. Dock Geometry Registry for Source-to-Target Animations', () => {
    beforeEach(() => {
      dockGeometryRegistry.clear();
    });

    it('registers and retrieves element bounding client rect', () => {
      const mockElement = {
        getBoundingClientRect: vi.fn().mockReturnValue({
          left: 200,
          top: 800,
          right: 250,
          bottom: 850,
          width: 50,
          height: 50,
          x: 200,
          y: 800,
          toJSON: () => {},
        }),
      } as unknown as HTMLElement;

      dockGeometryRegistry.registerIcon('inventory', mockElement);
      const rect = dockGeometryRegistry.getIconRect('inventory');

      expect(rect).not.toBeNull();
      expect(rect?.left).toBe(200);
      expect(rect?.top).toBe(800);
      expect(rect?.width).toBe(50);
      expect(rect?.height).toBe(50);
    });

    it('calculates the center coordinate of a registered dock item', () => {
      const mockElement = {
        getBoundingClientRect: vi.fn().mockReturnValue({
          left: 100,
          top: 700,
          right: 160,
          bottom: 760,
          width: 60,
          height: 60,
          x: 100,
          y: 700,
          toJSON: () => {},
        }),
      } as unknown as HTMLElement;

      dockGeometryRegistry.registerIcon('orders', mockElement);
      const center = dockGeometryRegistry.getIconCenter('orders');

      expect(center).not.toBeNull();
      expect(center?.x).toBe(130);
      expect(center?.y).toBe(730);
    });

    it('returns null gracefully for unregistered or unmounted items', () => {
      expect(dockGeometryRegistry.getIconRect('non-existent')).toBeNull();
      expect(dockGeometryRegistry.getIconCenter('non-existent')).toBeNull();

      dockGeometryRegistry.registerIcon('test', null);
      expect(dockGeometryRegistry.getIconRect('test')).toBeNull();
    });

    it('unregisters items properly on cleanup', () => {
      const el = {
        getBoundingClientRect: vi.fn().mockReturnValue({
          left: 10, top: 10, right: 20, bottom: 20, width: 10, height: 10, x: 10, y: 10, toJSON: () => {}
        })
      } as unknown as HTMLElement;
      dockGeometryRegistry.registerIcon('app1', el);
      dockGeometryRegistry.unregisterIcon('app1');
      expect(dockGeometryRegistry.getIconRect('app1')).toBeNull();
    });
  });

  describe('5. Motion Variants and Spatial Transforms', () => {
    it('provides complete window motion variants', () => {
      expect(windowMotionVariants.initial).toBeDefined();
      expect(windowMotionVariants.animate).toBeDefined();
      expect(windowMotionVariants.exit).toBeDefined();
    });

    it('provides launcher and command palette spring variants', () => {
      expect(launcherMotionVariants.hidden).toBeDefined();
      expect(launcherMotionVariants.visible).toBeDefined();
      expect(launcherMotionVariants.exit).toBeDefined();

      expect(commandPaletteMotionVariants.hidden).toBeDefined();
      expect(commandPaletteMotionVariants.visible).toBeDefined();
      expect(commandPaletteMotionVariants.exit).toBeDefined();
    });

    it('handles bidirectional horizontal slide for macOS spaces workspace switching', () => {
      expect(typeof workspaceSwitchVariants.enter).toBe('function');
      expect(typeof workspaceSwitchVariants.exit).toBe('function');

      // Moving right (next space): enters from +120px
      const enterRight = (workspaceSwitchVariants.enter as (dir: number) => any)(1);
      expect(enterRight.x).toBe(120);

      // Moving left (prev space): enters from -120px
      const enterLeft = (workspaceSwitchVariants.enter as (dir: number) => any)(-1);
      expect(enterLeft.x).toBe(-120);

      // Exiting right vs left
      const exitRight = (workspaceSwitchVariants.exit as (dir: number) => any)(1);
      expect(exitRight.x).toBe(-120);

      const exitLeft = (workspaceSwitchVariants.exit as (dir: number) => any)(-1);
      expect(exitLeft.x).toBe(120);
    });

    it('provides dock item and card hover and tap animation variants', () => {
      expect(dockItemEntranceVariants.hidden).toBeDefined();
      expect(dockItemEntranceVariants.visible).toBeDefined();

      expect(ORION_CARD_HOVER.rest).toBeDefined();
      expect(ORION_CARD_HOVER.hover).toBeDefined();
      expect(ORION_CARD_HOVER.tap).toBeDefined();
    });
  });
});
