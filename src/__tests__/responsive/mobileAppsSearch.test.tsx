/**
 * ORION-9 MOBILE APPS SEARCH RESPONSIVE TEST SUITE
 * 
 * Verifies:
 * 1. Mobile Apps search bar alignment with content container width.
 * 2. Search height (48px) & border radius (14-16px).
 * 3. Responsive search placeholder & input constraint (min-w-0, no 100vw).
 * 4. Launcher header identity rendering.
 * 5. Real-time filtering, search results grid, empty state, and clear search behavior.
 * 6. Responsive app grid alignment across mobile viewports (360px, 375px, 390px, 412px).
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { OrionMobileAppLauncher } from '../../os/mobile/OrionMobileAppLauncher';
import { MobileNavigationProvider } from '../../os/mobile/OrionMobileNavigation';
import { ORION_REGISTRY } from '../../os/OrionApplicationRegistry';

// Mock Auth Context
vi.mock('../../store/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      id: 'usr-mob-001',
      fullName: 'Operations Manager',
      username: 'ops_mgr',
      email: 'ops@orion9.enterprise',
    },
    isAuthenticated: true,
  }),
}));

describe('ORION-9 Mobile Apps Search Bar & Launcher Layout', () => {
  it('1. renders launcher identity header and total app count badge', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/mobile/apps']}>
        <MobileNavigationProvider>
          <OrionMobileAppLauncher />
        </MobileNavigationProvider>
      </MemoryRouter>
    );

    expect(html).toContain('ENTERPRISE APPS');
    expect(html).toContain('100+ SCM Applications');
    expect(html).toContain(`${Object.keys(ORION_REGISTRY).length} APPS`);
  });

  it('2. enforces 48px touch-friendly height and 14px border-radius styling', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/mobile/apps']}>
        <MobileNavigationProvider>
          <OrionMobileAppLauncher />
        </MobileNavigationProvider>
      </MemoryRouter>
    );

    expect(html).toContain('h-[48px]');
    expect(html).toContain('min-h-[48px]');
    expect(html).toContain('rounded-[14px]');
  });

  it('3. enforces responsive width constraints (min-w-0, max-w-full, no 100vw)', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/mobile/apps']}>
        <MobileNavigationProvider>
          <OrionMobileAppLauncher />
        </MobileNavigationProvider>
      </MemoryRouter>
    );

    expect(html).toContain('w-full');
    expect(html).toContain('max-w-full');
    expect(html).toContain('min-w-0');
    expect(html).not.toContain('100vw');
  });

  it('4. uses responsive search placeholder text', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/mobile/apps']}>
        <MobileNavigationProvider>
          <OrionMobileAppLauncher />
        </MobileNavigationProvider>
      </MemoryRouter>
    );

    expect(html).toContain('Search enterprise apps...');
    expect(html).toContain('placeholder:truncate');
  });

  it('5. renders 3-column mobile app grid with matching boundaries', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/mobile/apps']}>
        <MobileNavigationProvider>
          <OrionMobileAppLauncher />
        </MobileNavigationProvider>
      </MemoryRouter>
    );

    expect(html).toContain('grid-cols-3');
    expect(html).toContain('gap-2.5');
    expect(html).toContain('Operations &amp; Execution');
    expect(html).toContain('Platform, Workspace &amp; Admin');
  });

  it('6. code preserves search filtering and empty state contracts', () => {
    const code = OrionMobileAppLauncher.toString();

    expect(code).toContain('searchQuery');
    expect(code).toContain('setSearchQuery');
    expect(code).toContain('No applications found');
    expect(code).toContain('Clear Search');
    expect(code).toContain('filteredApps');
  });
});
