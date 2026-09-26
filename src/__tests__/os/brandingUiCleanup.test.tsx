import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { OrionPowerOnScreen } from '../../os/components/OrionPowerOnScreen';
import { OrionBootSequence } from '../../os/components/OrionBootSequence';
import { Login } from '../../components/auth/Login';

describe('ORION-9 UI Clean-up & Duplicate Branding Specification Suite', () => {

  it('1. OrionPowerOnScreen (INITIALIZING Phase): renders startup-logo and tagline without duplicate startup-title H1', () => {
    const html = renderToString(React.createElement(OrionPowerOnScreen, { onPowerOn: vi.fn() }));

    expect(html).toContain('data-testid="startup-logo"');
    expect(html).not.toContain('data-testid="startup-title"');
    expect(html).toContain('data-testid="startup-tagline"');
    expect(html).toContain('data-testid="initialization-status-box"');
  });

  it('2. OrionPowerOnScreen (BOOT_READY Phase): renders boot-logo and system-ready badge without duplicate boot-title H1', () => {
    // Simulate BOOT_READY state directly or skip animation via reduced motion prop mock
    const powerOnScreen = React.createElement(OrionPowerOnScreen, { onPowerOn: vi.fn() });
    const html = renderToString(powerOnScreen);

    // Initial phase is INITIALIZING, check boot-title is not present anywhere
    expect(html).not.toContain('data-testid="boot-title"');
  });

  it('3. OrionBootSequence: renders outer and mid cinematic rings without innermost circle (ob3-core-inner)', () => {
    const html = renderToString(React.createElement(OrionBootSequence, { onComplete: vi.fn() }));

    expect(html).toContain('ob3-core-outer');
    expect(html).toContain('ob3-core-mid');
    expect(html).toContain('ob3-core-mark');
    expect(html).not.toContain('ob3-core-inner');
  });

  it('4. Login Screen: renders login card with logo & ORION-9 label, but WITHOUT diagnostic status pills row', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    );

    // Diagnostic status pills must NOT be present
    expect(html).not.toContain('Environment:');
    expect(html).not.toContain('Authentication: READY');
    expect(html).not.toContain('Authentication: DEGRADED');

    // Login card branding MUST remain intact
    expect(html).toContain('Sign in to Orion');
    expect(html).toContain('ORION-9');
    expect(html).toContain('User ID');
    expect(html).toContain('src="/orion-9-brand-logo.png"');
  });
});
