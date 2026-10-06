/**
 * ORION-9 ENTERPRISE AUTHENTICATION E2E TEST SUITE — LOGIN ONLY
 *
 * Verifies:
 * 1. FlowLogin enterprise visual card rendering with Framer Motion.
 * 2. Public self-registration (Sign Up) is COMPLETELY REMOVED from the UI.
 * 3. Route /signup safely redirects to /login.
 * 4. Two-stage login flow (Stage 1 ID -> Stage 2 Password).
 * 5. Password visibility toggle (Eye/EyeOff).
 * 6. Demo User and Demo Admin login authentication & role verification.
 * 7. Invalid credentials show authentication error message.
 * 8. Language selector dropdown and Environment switcher.
 */

import { test, expect } from '@playwright/test';

test.describe('Orion-9 Enterprise Authentication (No Public Signup - Login Only) E2E', () => {

  test.beforeEach(async ({ page }) => {
    // Clear browser storage and set OS power-on state cleanly before navigation
    await page.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
        sessionStorage.setItem('orion_os_power_state', 'ON');
      } catch (e) {}
    });
  });

  // TEST 1: Enterprise Login page loads cleanly on /login
  test('TEST 1: renders FlowLogin enterprise card on /login', async ({ page }) => {
    await page.goto('/login');

    // Stage 1 User ID input visible
    await expect(page.locator('input#username')).toBeVisible();

    // Environment badge visible
    await expect(page.locator('[data-testid="environment-badge"]')).toBeVisible();

    // Brand logo image visible
    await expect(page.locator('img.orion-brand-image').first()).toBeVisible();
  });

  // TEST 2: Public self-registration (Sign Up) is NOT exposed in the UI
  test('TEST 2: public self-registration (Sign Up) tab, button, and forms are NOT exposed in UI', async ({ page }) => {
    await page.goto('/login');

    // Verify NO Sign Up tab button exists
    await expect(page.locator('button:has-text("Sign Up")')).toHaveCount(0);

    // Verify NO Create Account button exists
    await expect(page.locator('button:has-text("Create Account")')).toHaveCount(0);

    // Verify NO Register button or public registration link exists
    await expect(page.locator('text=/Create your account/i')).toHaveCount(0);
    await expect(page.locator('input#signupEmail')).toHaveCount(0);
    await expect(page.locator('input#signupPassword')).toHaveCount(0);
  });

  // TEST 3: Route /signup redirects to /login
  test('TEST 3: route /signup redirects safely to /login', async ({ page }) => {
    await page.goto('/signup');

    // Should redirect to /login
    await expect(page).toHaveURL(/\/login/);

    // Login form should be visible
    await expect(page.locator('input#username')).toBeVisible();

    // Signup form must NOT be present
    await expect(page.locator('input#signupEmail')).toHaveCount(0);
  });

  // TEST 4: Demo User authenticates using two-stage flow
  test('TEST 4: authenticates Demo User (user/user)', async ({ page }) => {
    await page.goto('/login');

    // Stage 1
    await page.fill('input#username', 'user');
    await page.click('button[type="submit"]');

    // Stage 2
    await expect(page.locator('input#password')).toBeVisible({ timeout: 5000 });
    await page.fill('input#password', 'user');
    await page.click('button[type="submit"]');

    // Verify session stored with role "user"
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

  // TEST 5: Demo Admin authenticates using two-stage flow
  test('TEST 5: authenticates Demo Admin (admin/admin)', async ({ page }) => {
    await page.goto('/login');

    // Stage 1
    await page.fill('input#username', 'admin');
    await page.click('button[type="submit"]');

    // Stage 2
    await expect(page.locator('input#password')).toBeVisible({ timeout: 5000 });
    await page.fill('input#password', 'admin');
    await page.click('button[type="submit"]');

    // Verify session stored with role "platform_admin"
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

  // TEST 6: Invalid credentials display error message
  test('TEST 6: invalid password shows error message', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input#username', 'user');
    await page.click('button[type="submit"]');

    await expect(page.locator('input#password')).toBeVisible();
    await page.fill('input#password', 'wrong-invalid-password-123');
    await page.click('button[type="submit"]');

    // Error message container should appear
    await expect(page.locator('text=/Invalid password/i')).toBeVisible();
  });

  // TEST 7: Password visibility toggle works
  test('TEST 7: toggles password visibility', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input#username', 'user');
    await page.click('button[type="submit"]');

    await expect(page.locator('input#password')).toBeVisible();
    const passInput = page.locator('input#password');

    // Default type is password
    await expect(passInput).toHaveAttribute('type', 'password');

    // Click toggle button
    await page.click('button[aria-label="Show password"]');
    await expect(passInput).toHaveAttribute('type', 'text');

    // Click toggle back
    await page.click('button[aria-label="Hide password"]');
    await expect(passInput).toHaveAttribute('type', 'password');
  });

  // TEST 8: Language selector changes UI text
  test('TEST 8: language selector changes locale strings', async ({ page }) => {
    await page.goto('/login');

    const langBtn = page.locator('[aria-label="Select language"]');
    await langBtn.click();

    // Select Spanish
    await page.click('button:has-text("Español")');

    // Check Spanish string
    await expect(page.locator('text=/Iniciar sesión en Orion/i')).toBeVisible();
  });
});
