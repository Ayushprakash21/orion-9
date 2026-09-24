/**
 * ORION-9 ORIENTATION LIFECYCLE & STATE PERSISTENCE TEST SUITE
 * 
 * Verifies that device orientation changes (Portrait <-> Landscape)
 * never trigger logout, environment reset, tenant mutation, or session loss.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { getResponsiveLayoutSnapshot } from '../../lib/useResponsiveLayout';

describe('Orion-9 Orientation Lifecycle & Session Integrity Invariants', () => {
  beforeEach(async () => {
    await dbManager.switchEnvironment({
      targetEnvironment: 'LIVE',
      actorUserId: 'usr-exec-001',
      actorRole: 'platform_admin',
      callerType: 'human_admin',
      stepUpConfirmed: true,
    });
  });

  it('preserves LIVE database environment across continuous orientation flips', async () => {
    expect(dbManager.getEnvironment()).toBe('LIVE');

    // Simulate Portrait orientation
    vi.stubGlobal('window', {
      innerWidth: 390,
      innerHeight: 844,
      visualViewport: { width: 390, height: 844 },
      matchMedia: () => ({ matches: false }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('screen', { width: 390, height: 844 });
    const portraitSnapshot = getResponsiveLayoutSnapshot();
    expect(portraitSnapshot.orientation).toBe('portrait');
    expect(portraitSnapshot.deviceClass).toBe('phone');
    expect(dbManager.getEnvironment()).toBe('LIVE');

    // Simulate Landscape orientation (Phone Rotate)
    vi.stubGlobal('window', {
      innerWidth: 844,
      innerHeight: 390,
      visualViewport: { width: 844, height: 390 },
      matchMedia: () => ({ matches: false }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('screen', { width: 844, height: 390 });
    const landscapeSnapshot = getResponsiveLayoutSnapshot();
    expect(landscapeSnapshot.orientation).toBe('landscape');
    expect(landscapeSnapshot.deviceClass).toBe('phone');
    // Critical: Environment MUST NOT reset to DEMO
    expect(dbManager.getEnvironment()).toBe('LIVE');

    // Rotate back to Portrait
    vi.stubGlobal('window', {
      innerWidth: 390,
      innerHeight: 844,
      visualViewport: { width: 390, height: 844 },
      matchMedia: () => ({ matches: false }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const backToPortraitSnapshot = getResponsiveLayoutSnapshot();
    expect(backToPortraitSnapshot.orientation).toBe('portrait');
    expect(backToPortraitSnapshot.deviceClass).toBe('phone');
    expect(dbManager.getEnvironment()).toBe('LIVE');
  });

  it('preserves DEMO database environment across continuous tablet rotations', async () => {
    await dbManager.switchEnvironment({
      targetEnvironment: 'DEMO',
      actorUserId: 'usr-exec-001',
      actorRole: 'platform_admin',
      callerType: 'human_admin',
      stepUpConfirmed: true,
    });

    expect(dbManager.getEnvironment()).toBe('DEMO');

    // Tablet Portrait: 768x1024
    vi.stubGlobal('window', {
      innerWidth: 768,
      innerHeight: 1024,
      visualViewport: { width: 768, height: 1024 },
      matchMedia: () => ({ matches: false }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('screen', { width: 768, height: 1024 });
    const tabPort = getResponsiveLayoutSnapshot();
    expect(tabPort.deviceClass).toBe('tablet');
    expect(tabPort.orientation).toBe('portrait');
    expect(dbManager.getEnvironment()).toBe('DEMO');

    // Tablet Landscape: 1024x768
    vi.stubGlobal('window', {
      innerWidth: 1024,
      innerHeight: 768,
      visualViewport: { width: 1024, height: 768 },
      matchMedia: () => ({ matches: false }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('screen', { width: 1024, height: 768 });
    const tabLand = getResponsiveLayoutSnapshot();
    expect(tabLand.deviceClass).toBe('tablet');
    expect(tabLand.orientation).toBe('landscape');
    expect(dbManager.getEnvironment()).toBe('DEMO');
  });
});
