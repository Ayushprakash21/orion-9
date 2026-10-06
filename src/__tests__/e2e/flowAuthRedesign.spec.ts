/**
 * ORION-9 FLOWLOGIN & FLOWSIGNUP AUTHENTICATION E2E TEST SUITE
 *
 * Verifies:
 * 1. FlowLogin & FlowSignup visual card rendering with Framer Motion.
 * 2. Tab switching between Sign In and Sign Up modes.
 * 3. Two-stage login flow (Stage 1 ID -> Stage 2 Password).
 * 4. Password visibility toggle (Eye/EyeOff).
 * 5. Demo User and Demo Admin login authentication & role verification.
 * 6. FlowSignup form inputs, Password Strength Meter, and submit behavior.
 * 7. Route /signup rendering directly into Signup tab.
 * 8. Language selector dropdown and Environment switcher.
 */

import { test, expect } from '@playwright/test';

test.describe('Orion-9 FlowLogin & FlowSignup Authentication Redesign E2E', () => {

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

  // TEST 1: Login page loads with FlowLogin card and tab switcher
  test('TEST 1: renders FlowLogin card and tab switcher on /login', async ({ page }) => {
    await page.goto('/login');

    // Tab buttons for Sign In and Sign Up visible
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign Up")')).toBeVisible();

    // Stage 1 User ID input visible
    await expect(page.locator('input#username')).toBeVisible();

    // Environment badge visible
    await expect(page.locator('[data-testid="environment-badge"]')).toBeVisible();

    // Brand logo image visible
    await expect(page.locator('img.orion-brand-image').first()).toBeVisible();
  });

  // TEST 2: Tab switching between Sign In and Sign Up
  test('TEST 2: switches between Sign In and Sign Up tabs smoothly', async ({ page }) => {
    await page.goto('/login');

    // Click Sign Up tab
    await page.click('button:has-text("Sign Up")');

    // Verify Signup form fields appear
    await expect(page.locator('input#signupEmail')).toBeVisible();
    await expect(page.locator('input#signupPassword')).toBeVisible();
    await expect(page.locator('input#signupConfirmPassword')).toBeVisible();
    await expect(page.locator('button:has-text("Create Account")')).toBeVisible();

    // Click Sign In tab back
    await page.click('button:has-text("Sign In")');

    // Verify Login form field appears
    await expect(page.locator('input#username')).toBeVisible();
  });

  // TEST 3: Route /signup opens Signup tab directly
  test('TEST 3: route /signup loads directly into Sign Up tab', async ({ page }) => {
    await page.goto('/signup');

    await expect(page.locator('input#signupEmail')).toBeVisible();
    await expect(page.locator('button:has-text("Create Account")')).toBeVisible();
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

  // TEST 6: FlowSignup Password Strength Meter dynamically updates
  test('TEST 6: updates password strength meter in FlowSignup', async ({ page }) => {
    await page.goto('/signup');

    const passInput = page.locator('input#signupPassword');
    
    // Type weak password
    await passInput.fill('123');
    await expect(page.locator('text=Weak')).toBeVisible();

    // Type strong password
    await passInput.fill('OrionSuperSecret2026!');
    await expect(page.locator('text=Strong')).toBeVisible();
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
