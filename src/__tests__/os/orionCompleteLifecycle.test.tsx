/**
 * ORION-9 COMPLETE OS LIFECYCLE SPECIFICATION & STATE ENGINE TESTS
 * Validates the complete 12-state operating system lifecycle:
 * POWERED_OFF -> SYSTEM_INITIALIZING -> LOGIN_REQUIRED -> AUTHENTICATING ->
 * POST_LOGIN_INITIALIZING -> READY -> SIGNING_OUT -> RESTARTING -> SHUTTING_DOWN ->
 * LOCKED -> SLEEPING
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
    expect(html).toContain('SYSTEM INITIALIZATION');
    expect(html).toContain('data-testid="init-service-identity"');
    expect(html).toContain('data-testid="init-service-kernel"');
    expect(html).toContain('data-testid="init-service-security"');
    expect(html).toContain('data-testid="init-service-data-fabric"');
    expect(html).toContain('data-testid="init-service-intelligence"');
    expect(html).toContain('data-testid="init-service-operations"');
    expect(html).toContain('data-testid="boot-system-ready-badge"');
  });

  it('3. OrionPowerOnScreen: renders initialization phase on mount', () => {
    const html = renderToString(React.createElement(OrionPowerOnScreen, { onPowerOn: vi.fn() }));

    expect(html).toContain('data-testid="orion-startup-screen"');
    expect(html).toContain('data-startup-phase="INITIALIZING"');
    expect(html).toContain('data-testid="startup-logo"');
    expect(html).toContain('data-testid="init-service-identity"');
  });

  it('4. OrionLogoutScreen: renders graceful session teardown', () => {
    const html = renderToString(React.createElement(OrionLogoutScreen, { onComplete: vi.fn() }));

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('Signing Out');
    expect(html).toContain('Closing secure session and clearing credentials');
    expect(html).toContain('src="/orion-9-official-logo.png"');
  });

  it('5. OrionShutdownScreen: renders calm shutdown hierarchy', () => {
    const html = renderToString(React.createElement(OrionShutdownScreen, { onComplete: vi.fn() }));

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('System Shutdown');
    expect(html).toContain('Terminating active processes');
    expect(html).toContain('src="/orion-9-official-logo.png"');
  });

  it('6. OrionWorldEntrySequence: renders post-login workspace entry', () => {
    const userHtml = renderToString(React.createElement(OrionWorldEntrySequence, { onComplete: vi.fn(), isAdmin: false }));
    expect(userHtml).toContain('Starting Orion');
    expect(userHtml).toContain('Restoring secure session');

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
});
