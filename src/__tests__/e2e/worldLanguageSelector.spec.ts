/**
 * ORION-9 WORLD LANGUAGE SELECTOR PLAYWRIGHT E2E SPEC
 *
 * Validates the complete World Language Selector workflow:
 * 1. Opening the World Languages panel from compact trigger (🌐 English ▾).
 * 2. Search & Filter across native names, English names, and ISO codes.
 * 3. Language selection (Hindi, Japanese, Arabic, French, etc.) instantly updating the UI.
 * 4. RTL direction attribute toggle for RTL languages (Arabic, Hebrew, Persian, Urdu).
 * 5. Page reload persistence (localStorage & sessionStorage).
 * 6. Auth session transition inheriting selected locale into the authenticated OS.
 */

import { test, expect } from '@playwright/test';

test.describe('Orion-9 World Language Selector E2E', () => {

  test.beforeEach(async ({ page }) => {
    // Clear browser storage and initialize OS power-on state cleanly
    await page.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
        sessionStorage.setItem('orion_os_power_state', 'ON');
      } catch (e) {}
    });
  });

  // TEST 1: Open World Language panel & verify trigger text and structure
  test('TEST 1: opens World Languages panel and displays recommended + all languages', async ({ page }) => {
    await page.goto('/login');

    const trigger = page.locator('[data-testid="language-selector"]');
    await expect(trigger).toBeVisible({ timeout: 5000 });
    await expect(trigger).toContainText('English');

    // Click trigger to open panel
    await trigger.click();

    // Verify search input is rendered and focused
    const searchInput = page.locator('[data-testid="language-search-input"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Verify sections exist
    await expect(page.locator('[data-testid="recommended-languages"]')).toBeVisible();
    await expect(page.locator('[data-testid="all-languages"]')).toBeVisible();
  });

  // TEST 2: Search filter works for English names, native names, and ISO codes
  test('TEST 2: filters languages by query in search input', async ({ page }) => {
    await page.goto('/login');

    await page.click('[data-testid="language-selector"]');
    const searchInput = page.locator('[data-testid="language-search-input"]');

    // Search by English name "Japanese"
    await searchInput.fill('Japanese');
    await expect(page.locator('[data-testid="language-option-ja"]')).toBeVisible();
    await expect(page.locator('[data-testid="language-option-hi"]')).toHaveCount(0);

    // Search by native name "हिन्दी"
    await searchInput.fill('हिन्दी');
    await expect(page.locator('[data-testid="language-option-hi"]')).toBeVisible();
    await expect(page.locator('[data-testid="language-option-ja"]')).toHaveCount(0);

    // Search by code "ar"
    await searchInput.fill('ar');
    await expect(page.locator('[data-testid="language-option-ar"]')).toBeVisible();
  });

  // TEST 3: Select Hindi -> immediate UI translation update
  test('TEST 3: selecting Hindi updates Login UI immediately', async ({ page }) => {
    await page.goto('/login');

    await page.click('[data-testid="language-selector"]');
    await page.click('[data-testid="language-option-hi"]');

    // Check Hindi title and continue button text
    await expect(page.locator('h1')).toContainText('Orion में साइन इन करें');
    await expect(page.locator('button[type="submit"]')).toContainText('जारी रखें');

    // Trigger should now display Hindi native name
    await expect(page.locator('[data-testid="language-selector"]')).toContainText('हिन्दी');
  });

  // TEST 4: Select Japanese -> immediate UI translation update
  test('TEST 4: selecting Japanese updates Login UI immediately', async ({ page }) => {
    await page.goto('/login');

    await page.click('[data-testid="language-selector"]');
    await page.click('[data-testid="language-option-ja"]');

    // Check Japanese title
    await expect(page.locator('h1')).toContainText('Orion にサインイン');
    await expect(page.locator('[data-testid="language-selector"]')).toContainText('日本語');
  });

  // TEST 5: Select Arabic -> updates UI and sets HTML dir="rtl"
  test('TEST 5: selecting Arabic updates Login UI and switches document dir to RTL', async ({ page }) => {
    await page.goto('/login');

    await page.click('[data-testid="language-selector"]');
    await page.click('[data-testid="language-option-ar"]');

    // Check Arabic title
    await expect(page.locator('h1')).toContainText('تسجيل الدخول إلى Orion');
    await expect(page.locator('[data-testid="language-selector"]')).toContainText('العربية');

    // Verify documentElement dir is rtl
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe('rtl');
  });

  // TEST 6: Page reload persistence
  test('TEST 6: selected language persists across page reloads', async ({ page }) => {
    await page.goto('/login');

    // Select Hindi
    await page.click('[data-testid="language-selector"]');
    await page.click('[data-testid="language-option-hi"]');
    await expect(page.locator('h1')).toContainText('Orion में साइन इन करें');

    // Reload page
    await page.reload();

    // Verify Hindi is still active
    await expect(page.locator('h1')).toContainText('Orion में साइन इन करें');
    await expect(page.locator('[data-testid="language-selector"]')).toContainText('हिन्दी');
  });

  // TEST 7: Authentication inherits selected locale into OS session
  test('TEST 7: authentication inherits selected locale into user session', async ({ page }) => {
    await page.goto('/login');

    // Select Spanish
    await page.click('[data-testid="language-selector"]');
    await page.click('[data-testid="language-option-es"]');
    await expect(page.locator('h1')).toContainText('Iniciar sesión en Orion');

    // Stage 1: User ID
    await page.fill('input#username', 'user');
    await page.click('button[type="submit"]');

    // Stage 2: Password
    await expect(page.locator('input#password')).toBeVisible({ timeout: 5000 });
    await page.fill('input#password', 'user');
    await page.click('button[type="submit"]');

    // Verify persisted locale in localStorage
    await expect.poll(async () => {
      return await page.evaluate(() => localStorage.getItem('orion_language'));
    }, { timeout: 10000 }).toBe('es');
  });

});
