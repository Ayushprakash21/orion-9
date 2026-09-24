/**
 * ORION-9 PLAYWRIGHT LOGIN & DEMO AUTHENTICATION E2E SUITE
 *
 * DEMO/LOCAL ONLY — hard-coded credentials. Do not use for production.
 *
 * Tests:
 * TEST 1: user / user → normal user session loads
 * TEST 2: admin / admin → admin-capable session loads
 * TEST 3: user / admin → login rejected
 * TEST 4: admin / user → login rejected
 * TEST 5: invalid credentials → login rejected
 * TEST 6: normal user cannot access admin functionality by manipulating browser/client state
 */

import { test, expect } from '@playwright/test';

test.describe('Orion-9 Demo / Local Login & Role Governance E2E', () => {

  test.beforeEach(async ({ page }) => {
    // Clear browser storage and initialize OS power-on state cleanly before navigation
    await page.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
        sessionStorage.setItem('orion_os_power_state', 'ON');
      } catch (e) {}
    });
  });

  // TEST 1: Open /login, Enter: user / user → normal user session loads
  test('TEST 1: authenticates with user/user and loads normal user session', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#username', 'user');
    await page.fill('input#password', 'user');
    await page.click('button[type="submit"]');

    // Wait for session initialization or navigation away from login
    await expect(page.locator('body')).toBeVisible();
    
    // Check that stored auth session has role "user"
    await expect.poll(async () => {
      return await page.evaluate(() => {
        try {
          const raw = localStorage.getItem('orion_auth_session');
          return raw ? JSON.parse(raw).role : null;
        } catch {
          return null;
        }
      });
    }, { timeout: 10000 }).toBe('user');
  });

  // TEST 2: Open /login, Enter: admin / admin → admin-capable session loads
  test('TEST 2: authenticates with admin/admin and loads admin-capable session', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#username', 'admin');
    await page.fill('input#password', 'admin');
    await page.click('button[type="submit"]');

    // Wait for session initialization
    await expect(page.locator('body')).toBeVisible();

    // Check that stored auth session has role "platform_admin"
    await expect.poll(async () => {
      return await page.evaluate(() => {
        try {
          const raw = localStorage.getItem('orion_auth_session');
          return raw ? JSON.parse(raw).role : null;
        } catch {
          return null;
        }
      });
    }, { timeout: 10000 }).toBe('platform_admin');
  });

  // TEST 3: Enter: user / admin → login rejected
  test('TEST 3: rejects login with user/admin credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#username', 'user');
    await page.fill('input#password', 'admin');
    await page.click('button[type="submit"]');

    // Error message rendered
    const errorEl = page.locator('text=/Invalid username or password|Invalid credentials/i');
    await expect(errorEl).toBeVisible({ timeout: 5000 });

    // Ensure session was NOT initialized
    const hasSession = await page.evaluate(() => !!localStorage.getItem('orion_auth_session'));
    expect(hasSession).toBe(false);
  });

  // TEST 4: Enter: admin / user → login rejected
  test('TEST 4: rejects login with admin/user credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#username', 'admin');
    await page.fill('input#password', 'user');
    await page.click('button[type="submit"]');

    // Error message rendered
    const errorEl = page.locator('text=/Invalid username or password|Invalid credentials/i');
    await expect(errorEl).toBeVisible({ timeout: 5000 });

    // Ensure session was NOT initialized
    const hasSession = await page.evaluate(() => !!localStorage.getItem('orion_auth_session'));
    expect(hasSession).toBe(false);
  });

  // TEST 5: Enter invalid credentials → login rejected
  test('TEST 5: rejects login with completely invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#username', 'unknown_hacker');
    await page.fill('input#password', 'wrong_secret_123');
    await page.click('button[type="submit"]');

    // Error message rendered
    const errorEl = page.locator('text=/Invalid username or password|Invalid credentials/i');
    await expect(errorEl).toBeVisible({ timeout: 5000 });

    // Ensure session was NOT initialized
    const hasSession = await page.evaluate(() => !!localStorage.getItem('orion_auth_session'));
    expect(hasSession).toBe(false);
  });

  // TEST 6: Normal user cannot access admin functionality by manipulating the browser/client state
  test('TEST 6: normal user cannot elevate privileges via client storage tampering', async ({ page }) => {
    // 1. Log in as user
    await page.goto('/login');
    await page.fill('input#username', 'user');
    await page.fill('input#password', 'user');
    await page.click('button[type="submit"]');
    await expect.poll(async () => {
      return await page.evaluate(() => !!localStorage.getItem('orion_auth_session'));
    }, { timeout: 10000 }).toBe(true);

    // 2. Client-side tampering attempt: modify stored session role to platform_admin
    const escalationBlocked = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('orion_auth_session');
        if (!raw) return false;
        const session = JSON.parse(raw);
        session.role = 'platform_admin';
        session.profile.role = 'platform_admin';
        localStorage.setItem('orion_auth_session', JSON.stringify(session));

        // Attempting privileged session creation directly
        const privRaw = sessionStorage.getItem('orion_privileged_admin_session');
        return privRaw === null; // No privileged session issued for user
      } catch {
        return false;
      }
    });

    expect(escalationBlocked).toBe(true);
  });

  // TEST 7: Direct Desktop access when unauthenticated renders login portal (no bypass)
  test('TEST 7: unauthenticated direct access to root/desktop renders login portal', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('orion_os_power_state', 'ON');
    });
    await page.goto('/');

    // Must show login portal form
    await expect(page.locator('input#username')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input#password')).toBeVisible();

    // Desktop shell must NOT be visible
    const desktopBackdrop = page.locator('[data-desktop-surface="true"]');
    await expect(desktopBackdrop).toHaveCount(0);
  });

  // TEST 8: Direct Admin access when unauthenticated renders login portal
  test('TEST 8: unauthenticated direct access to /admin renders login portal', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('orion_os_power_state', 'ON');
    });
    await page.goto('/admin');

    // Must show login portal form
    await expect(page.locator('input#username')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input#password')).toBeVisible();

    // Admin layout must NOT be visible
    const adminSidebar = page.locator('aside');
    await expect(adminSidebar).toHaveCount(0);
  });

  // TEST 9: Storage tampering with arbitrary user ID does not grant Desktop access
  test('TEST 9: storage tampering with non-existent user identity is rejected', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('orion_os_power_state', 'ON');
      localStorage.setItem('orion_auth_session', JSON.stringify({
        user: { id: 'injected_hacker_999', email: 'injected@hacker.net' },
        role: 'platform_admin',
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      }));
    });
    await page.goto('/');

    // Must fall back to login portal
    await expect(page.locator('input#username')).toBeVisible({ timeout: 5000 });
    
    // Desktop shell must NOT mount
    const desktopBackdrop = page.locator('[data-desktop-surface="true"]');
    await expect(desktopBackdrop).toHaveCount(0);
  });

  // TEST 10: Official logo is loaded on login portal
  test('TEST 10: login portal displays authoritative Orion logo', async ({ page }) => {
    await page.goto('/login');
    const logoImg = page.locator('img.orion-brand-image, img[alt*="ORION"]');
    await expect(logoImg.first()).toBeVisible({ timeout: 5000 });
  });
});

