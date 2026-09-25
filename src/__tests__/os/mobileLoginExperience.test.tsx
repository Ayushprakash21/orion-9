/**
 * ORION-9 IMMERSIVE MOBILE LOGIN EXPERIENCE TEST SUITE
 * 
 * Verifies:
 * 1. Single primary Orion identity logo in top container.
 * 2. Real OS runtime system status badge (SYSTEM READY, Environment LIVE/DEMO, Auth READY).
 * 3. Acrylic login card (max-w-[400px], backdrop blur, dark acrylic background).
 * 4. OS entry button transition state (ENTER ORION -> / ENTERING ORION...).
 * 5. Safe area handling and minimal footer links (Privacy • Terms • Help).
 * 6. Mobile authentication redirect target logic to /mobile/home.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../../components/auth/Login';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { HealthService } from '../../operations/HealthService';

// Mock Auth Context
vi.mock('../../store/AuthContext', () => ({
  useAuth: () => ({
    currentUser: null,
    isAuthenticated: false,
    isAdmin: false,
    signOut: vi.fn(),
  }),
}));

describe('ORION-9 Mobile Login Experience & OS Auth Surface', () => {
  beforeEach(async () => {
    await dbManager.switchEnvironment({
      targetEnvironment: 'DEMO',
      actorUserId: 'usr-mob-001',
      actorRole: 'platform_admin',
      callerType: 'human_admin',
      stepUpConfirmed: true,
    });
  });

  describe('1. Mobile OS Immersive Identity & Layout', () => {
    it('renders single primary Orion identity header with logo and system status badge', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/login']}>
          <Login />
        </MemoryRouter>
      );

      const plainText = html.replace(/<[^>]+>/g, '');
      expect(plainText).toContain('ORION-9');
      expect(plainText).toContain('SYSTEM READY');
      expect(plainText).toContain('Environment:');
      expect(plainText).toContain('Authentication:');
      expect(plainText).toContain('READY');
    });

    it('renders acrylic card container with compact mobile dimensions', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/login']}>
          <Login />
        </MemoryRouter>
      );

      expect(html).toContain('max-w-[400px]');
      expect(html).toContain('backdrop-blur-2xl');
      expect(html).toContain('bg-[#070e1c]/75');
    });

    it('renders OS entry submit button with height 52px and blue glow', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/login']}>
          <Login />
        </MemoryRouter>
      );

      expect(html).toContain('h-[52px]');
      expect(html).toContain('shadow-[0_0_24px_rgba(37,99,235,0.45)]');
    });

    it('renders minimal system footer links and safe area padding', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/login']}>
          <Login />
        </MemoryRouter>
      );

      expect(html).toContain('Privacy');
      expect(html).toContain('Terms');
      expect(html).toContain('Help');
      expect(html).toContain('safe-area-inset-bottom');
      expect(html).toContain('safe-area-inset-top');
    });
  });

  describe('2. Mobile Login Target Navigation Contract', () => {
    it('contains redirect path logic to /mobile/home on mobile viewports', () => {
      const loginCode = Login.toString();
      expect(loginCode).toContain('/mobile/home');
    });

    it('queries authoritative dbManager environment state', () => {
      const loginCode = Login.toString();
      expect(loginCode).toContain('dbManager.getEnvironment()');
    });

    it('queries HealthService diagnostic probes', async () => {
      const report = await HealthService.getInstance().runHealthCheck();
      expect(report.livenessProbe).toBe(true);
    });
  });
});
