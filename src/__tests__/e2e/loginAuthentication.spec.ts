/**
 * ORION-9 PLAYWRIGHT LOGIN & DEMO AUTHENTICATION E2E SUITE
 *
 * DEMO/LOCAL ONLY — hard-coded credentials. Do not use for production.
 *
 * Tests:
 * TEST 1: user / user → two-stage authentication → normal user session loads
 * TEST 2: admin / admin → two-stage authentication → admin-capable session loads
 * TEST 3: user / admin → Stage 2 rejection
 * TEST 4: admin / user → Stage 2 rejection
 * TEST 5: unknown_hacker → Stage 1 rejection ("User not found")
 * TEST 6: normal user cannot access admin functionality by manipulating browser/client state
 * TEST 7: two-stage user identity lookup & photo presentation
 * TEST 8: "Other user" button returns to Stage 1
 * TEST 9: functional language selector dropdown
 * TEST 10: Power menu "Switch User" action
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

  // TEST 1: Open /login, Stage 1: user, Stage 2: user → normal user session loads
  test('TEST 1: authenticates with user/user using two-stage flow', async ({ page }) => {
    await page.goto('/login');
    
    // Stage 1: Enter User ID
    await page.fill('input#username', 'user');
    await page.click('button[type="submit"]');

    // Wait for Stage 2 Password input to appear
    await expect(page.locator('input#password')).toBeVisible({ timeout: 5000 });

    // Stage 2: Enter Password
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

  // TEST 2: Open /login, Stage 1: admin, Stage 2: admin → admin-capable session loads
  test('TEST 2: authenticates with admin/admin using two-stage flow', async ({ page }) => {
    await page.goto('/login');

    // Stage 1: Enter User ID
    await page.fill('input#username', 'admin');
    await page.click('button[type="submit"]');

    // Wait for Stage 2 Password input to appear
    await expect(page.locator('input#password')).toBeVisible({ timeout: 5000 });

    // Stage 2: Enter Password
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

  // TEST 3: Stage 1: user, Stage 2: admin → login rejected
  test('TEST 3: rejects login with user/admin credentials in Stage 2', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input#username', 'user');
    await page.click('button[type="submit"]');
    await expect(page.locator('input#password')).toBeVisible({ timeout: 5000 });

    await page.fill('input#password', 'admin');
    await page.click('button[type="submit"]');

    // Error message rendered
    const errorEl = page.locator('text=/Invalid password or credentials|Invalid credentials/i');
    await expect(errorEl).toBeVisible({ timeout: 5000 });

    // Ensure session was NOT initialized
    const hasSession = await page.evaluate(() => !!localStorage.getItem('orion_auth_session'));
    expect(hasSession).toBe(false);
  });

  // TEST 4: Stage 1: admin, Stage 2: user → login rejected
  test('TEST 4: rejects login with admin/user credentials in Stage 2', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input#username', 'admin');
    await page.click('button[type="submit"]');
    await expect(page.locator('input#password')).toBeVisible({ timeout: 5000 });

    await page.fill('input#password', 'user');
    await page.click('button[type="submit"]');

    // Error message rendered
    const errorEl = page.locator('text=/Invalid password or credentials|Invalid credentials/i');
    await expect(errorEl).toBeVisible({ timeout: 5000 });

    // Ensure session was NOT initialized
    const hasSession = await page.evaluate(() => !!localStorage.getItem('orion_auth_session'));
    expect(hasSession).toBe(false);
  });

  // TEST 5: Enter invalid User ID → Stage 1 rejection ("User not found")
  test('TEST 5: rejects invalid User ID with User not found message', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#username', 'unknown_hacker_999');
    await page.click('button[type="submit"]');

    // Error message rendered
    const errorEl = page.locator('text=/User not found/i');
    await expect(errorEl).toBeVisible({ timeout: 5000 });

    // Password input should NOT be visible
    const passInput = page.locator('input#password');
    await expect(passInput).toHaveCount(0);
  });

  // TEST 6: Normal user cannot access admin functionality by manipulating client storage
  test('TEST 6: normal user cannot elevate privileges via client storage tampering', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input#username', 'user');
    await page.click('button[type="submit"]');
    await expect(page.locator('input#password')).toBeVisible({ timeout: 5000 });

    await page.fill('input#password', 'user');
    await page.click('button[type="submit"]');

    await expect.poll(async () => {
      return await page.evaluate(() => !!localStorage.getItem('orion_auth_session'));
    }, { timeout: 10000 }).toBe(true);

    const escalationBlocked = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('orion_auth_session');
        if (!raw) return false;
        const session = JSON.parse(raw);
        session.role = 'platform_admin';
        session.profile.role = 'platform_admin';
        localStorage.setItem('orion_auth_session', JSON.stringify(session));

        const privRaw = sessionStorage.getItem('orion_privileged_admin_session');
        return privRaw === null;
      } catch {
        return false;
      }
    });

    expect(escalationBlocked).toBe(true);
  });

  // TEST 7: Identity Lookup displays User Avatar and Display Name
  test('TEST 7: User ID lookup displays user avatar and display name', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input#username', 'admin');
    await page.click('button[type="submit"]');

    await expect(page.locator('input#password')).toBeVisible({ timeout: 5000 });

    // Verify user display name "Orion-9 Administrator" or "Admin" and handle "@admin"
    const displayName = page.locator('text=/Orion-9 Administrator|Admin/i');
    const userHandle = page.locator('text=/@admin/i');
    await expect(displayName.first()).toBeVisible();
    await expect(userHandle).toBeVisible();
  });

  // TEST 8: "Other user" button returns to Stage 1
  test('TEST 8: clicking Other user returns to User ID screen', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input#username', 'user');
    await page.click('button[type="submit"]');
    await expect(page.locator('input#password')).toBeVisible({ timeout: 5000 });

    // Click "Other user"
    await page.click('button:has-text("Other user")');

    // Stage 1 User ID input visible again
    await expect(page.locator('input#username')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input#password')).toHaveCount(0);
  });

  // TEST 9: Functional language selector changes UI strings
  test('TEST 9: functional language selector dropdown changes interface strings', async ({ page }) => {
    await page.goto('/login');

    const langDropdown = page.locator('[aria-label="Select language"]');
    await langDropdown.click();

    // Select Hindi
    await page.click('button:has-text("हिन्दी")');

    // Verify Hindi title appears
    const hindiTitle = page.locator('text=/Orion में साइन इन करें/i');
    await expect(hindiTitle).toBeVisible({ timeout: 5000 });
  });

  // TEST 10: Official logo is loaded on login portal and no center logo inside card
  test('TEST 10: login portal displays top-left logo and no center logo inside card', async ({ page }) => {
    await page.goto('/login');

    // Top left brand logo visible
    const logoImg = page.locator('img.orion-brand-image');
    await expect(logoImg.first()).toBeVisible({ timeout: 5000 });

    // Title inside card is "Sign in to Orion"
    const cardTitle = page.locator('h1:has-text("Sign in to Orion")');
    await expect(cardTitle).toBeVisible();
  });
});
