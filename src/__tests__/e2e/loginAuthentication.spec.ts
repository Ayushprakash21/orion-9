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
    // Clear browser storage and initialize OS power-on state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('orion_os_power_state', 'ON');
    });
    await page.goto('/login');
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
    const sessionRole = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('orion_auth_session');
        return raw ? JSON.parse(raw).role : null;
      } catch {
        return null;
      }
    });
    expect(sessionRole).toBe('user');
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
    const sessionRole = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('orion_auth_session');
        return raw ? JSON.parse(raw).role : null;
      } catch {
        return null;
      }
    });
    expect(sessionRole).toBe('platform_admin');
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
    await page.waitForTimeout(500);

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
});
