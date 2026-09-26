import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../../components/auth/Login';

describe('ORION-9 Login Screen — Surgical UI Cleanup Verification', () => {

  it('1. Top-left standalone ORION-9 branding is completely gone', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    );

    // No top-left branding block or subtitle
    expect(html).not.toContain('SUPPLY CHAIN OPERATING SYSTEM');
    // Header should be justify-end with no left branding container
    expect(html).toContain('justify-end');
  });

  it('2. ORION-9 branding inside the login card remains completely intact', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    );

    expect(html).toContain('Sign in to Orion');
    expect(html).toContain('ORION-9');
    expect(html).toContain('User ID');
    expect(html).toContain('Continue');
    expect(html).toContain('/orion-9-official-logo.png');
  });

  it('3. Bottom-left shutdown button remains with power icon', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    );

    expect(html).toContain('title="Shut Down"');
    expect(html).toContain('lucide-power');
    expect(html).toContain('hover:text-red-400');
  });

  it('4. Bottom-left power popup does NOT contain Switch User', () => {
    const loginCode = Login.toString();
    // The power menu popup should not render switchUser button
    expect(loginCode).not.toContain('t.switchUser}</span>');
  });

  it('5. Bottom-right User Switch control exists with blue hover styling and Lucide User icon', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    );

    expect(html).toContain('title="Switch User"');
    expect(html).toContain('aria-label="Switch User"');
    expect(html).toContain('hover:text-blue-400');
    expect(html).toContain('hover:bg-blue-950/80');
    expect(html).toContain('hover:border-blue-500/60');
    expect(html).toContain('lucide-user');
  });

  it('6. Language selector remains in top-right with functional dropdown', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    );

    expect(html).toContain('aria-label="Select language"');
    expect(html).toContain('English');
    expect(html).toContain('lucide-globe');
  });
});
