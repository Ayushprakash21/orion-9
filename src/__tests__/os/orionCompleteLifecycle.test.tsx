/**
 * ORION-9 COMPLETE OS LIFECYCLE SPECIFICATION & STATE ENGINE TESTS
 * Validates the complete 12-state operating system lifecycle, cinematic power core,
 * branded power controls, wallpaper architecture, and deterministic state transitions.
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OrionRestartScreen } from '../../os/components/OrionRestartScreen';
import { OrionBootSequence } from '../../os/components/OrionBootSequence';
import { OrionPowerOnScreen } from '../../os/components/OrionPowerOnScreen';
import { OrionLogoutScreen } from '../../os/components/OrionLogoutScreen';
import { OrionShutdownScreen } from '../../os/components/OrionShutdownScreen';
import { OrionWorldEntrySequence } from '../../os/components/OrionWorldEntrySequence';
import { OrionLockScreen } from '../../os/components/OrionLockScreen';
import { OrionSleepScreen } from '../../os/components/OrionSleepScreen';
import { OrionLiveWallpaper } from '../../os/components/OrionLiveWallpaper';
import { 
  DEFAULT_DESKTOP_WALLPAPER, 
  DEFAULT_LOGIN_WALLPAPER 
} from '../../repositories/WallpaperRepository';
import { UserProfile } from '../../types/auth';

describe('ORION-9 Canonical OS Lifecycle Component Architecture', () => {

  const mockUser: UserProfile = {
    id: 'usr-admin-01',
    email: 'admin@orion9.enterprise',
    username: 'admin',
    displayName: 'Lead Architect',
    fullName: 'Lead Architect',
    role: 'platform_admin',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('1. OrionRestartScreen: renders clean minimal restart transition with semantic accessibility', () => {
    const html = renderToString(React.createElement(OrionRestartScreen, { onComplete: vi.fn() }));

    expect(html).toContain('data-testid="orion-restart-screen"');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('Restarting System');
    expect(html).toContain('Preparing clean system start');
    expect(html).toContain('src="/orion-9-official-logo.png"');
    expect(html).not.toContain('#00F2FE');
  });

  it('2. OrionBootSequence: renders progressive boot services and system ready semantics', () => {
    const html = renderToString(React.createElement(OrionBootSequence, { onComplete: vi.fn() }));

    expect(html).toContain('data-testid="orion-boot-sequence"');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('SYSTEM ASSEMBLY');
    expect(html).toContain('POWER BUS');
    expect(html).toContain('EVENT FABRIC');
    expect(html).toContain('WORLD MODEL');
    expect(html).toContain('INTELLIGENCE CORE');
    expect(html).toContain('DECISION PLANE');
    expect(html).toContain('ORION-9 KERNEL');
    expect(html).toContain('data-testid="init-service-identity"');
    expect(html).toContain('data-testid="init-service-kernel"');
    expect(html).toContain('data-testid="init-service-security"');
    expect(html).toContain('data-testid="init-service-data-fabric"');
    expect(html).toContain('data-testid="init-service-intelligence"');
    expect(html).toContain('data-testid="init-service-operations"');
    expect(html).toContain('data-testid="boot-system-ready-badge"');
  });

  it('3. OrionPowerOnScreen: renders initialization phase on mount with power core', () => {
    const html = renderToString(React.createElement(OrionPowerOnScreen, { onPowerOn: vi.fn() }));

    expect(html).toContain('data-testid="orion-startup-screen"');
    expect(html).toContain('data-startup-phase="INITIALIZING"');
    expect(html).toContain('data-testid="startup-logo"');
    expect(html).toContain('data-testid="init-service-identity"');
    expect(html).toContain('ob3-core-outer');
    expect(html).toContain('ob3-core-mid');
    expect(html).toContain('ob3-core-mark');
  });

  it('4. OrionLogoutScreen: renders graceful session teardown and status list', () => {
    const html = renderToString(React.createElement(OrionLogoutScreen, { onComplete: vi.fn() }));

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('Signing Out');
    expect(html).toContain('SECURE SESSION TEARDOWN');
    expect(html).toContain('Saving workspace state');
    expect(html).toContain('Closing applications');
    expect(html).toContain('Clearing credentials');
    expect(html).toContain('src="/orion-9-official-logo.png"');
  });

  it('5. OrionShutdownScreen: renders calm shutdown hierarchy with restrained accents', () => {
    const html = renderToString(React.createElement(OrionShutdownScreen, { onComplete: vi.fn() }));

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('System Shutdown');
    expect(html).toContain('SYSTEM SHUTDOWN');
    expect(html).toContain('Stopping active processes');
    expect(html).toContain('Disconnecting telemetry');
    expect(html).toContain('Saving system state');
    expect(html).toContain('src="/orion-9-official-logo.png"');
  });

  it('6. OrionWorldEntrySequence: renders post-login workspace entry and governance fabric', () => {
    const userHtml = renderToString(React.createElement(OrionWorldEntrySequence, { onComplete: vi.fn(), isAdmin: false }));
    expect(userHtml).toContain('Starting Orion');
    expect(userHtml).toContain('Restoring secure session');
    expect(userHtml).toContain('WORKSPACE FABRIC');
    expect(userHtml).toContain('WORLD MODEL');
    expect(userHtml).toContain('SUPPLY NETWORK');

    const adminHtml = renderToString(React.createElement(OrionWorldEntrySequence, { onComplete: vi.fn(), isAdmin: true }));
    expect(adminHtml).toContain('Entering Control Center');
    expect(adminHtml).toContain('Restoring secure session');
  });

  it('7. OrionLockScreen: renders lock screen with test ID and operator credentials', () => {
    const html = renderToString(React.createElement(OrionLockScreen, { onUnlock: vi.fn(), currentUser: mockUser }));

    expect(html).toContain('data-testid="orion-lock-screen"');
    expect(html).toContain('Workstation Locked');
    expect(html).toContain('Lead Architect');
    expect(html).toContain('UNLOCK SESSION');
    expect(html).not.toContain('#00F2FE');
  });

  it('8. OrionSleepScreen: renders sleep overlay with test ID and waking title', () => {
    const html = renderToString(React.createElement(OrionSleepScreen, { onWake: vi.fn() }));

    expect(html).toContain('data-testid="orion-sleep-screen"');
    expect(html).toContain('title="Click or press any key to wake"');
    expect(html).toContain('Click or press any key to wake');
  });

  it('9. Wallpaper Architecture: default desktop wallpaper is canonical horizon moon asset', () => {
    expect(DEFAULT_DESKTOP_WALLPAPER.assetUrl).toBe('/wallpaper/orion9-desktop-horizon-moon.png');
    expect(DEFAULT_DESKTOP_WALLPAPER.target).toBe('desktop');
    expect(DEFAULT_LOGIN_WALLPAPER.assetUrl).toBe('/wallpaper/orion9-earth-horizon-default.png');
    expect(DEFAULT_LOGIN_WALLPAPER.target).toBe('login');
  });

  it('10. OrionLiveWallpaper: immediately mounts img with default asset and no black canvas', () => {
    const desktopHtml = renderToString(React.createElement(OrionLiveWallpaper, { target: 'desktop' }));
    expect(desktopHtml).toContain('src="/wallpaper/orion9-desktop-horizon-moon.png"');
    expect(desktopHtml).toContain('data-orion-wallpaper-image="true"');

    const loginHtml = renderToString(React.createElement(OrionLiveWallpaper, { target: 'login' }));
    expect(loginHtml).toContain('src="/wallpaper/orion9-earth-horizon-default.png"');
    expect(loginHtml).toContain('data-orion-wallpaper-image="true"');
  });
});
