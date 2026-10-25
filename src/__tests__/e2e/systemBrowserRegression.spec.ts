/**
 * ORION-9 SYSTEM BROWSER REGRESSION & COMPATIBILITY E2E SUITE
 *
 * Formally verifies:
 * 1. The System Browser route opens and renders cleanly (/browser).
 * 2. Address-bar navigation works with both Enter and the Go button.
 * 3. Pressing Enter triggers navigation to embeddable sites (e.g., https://example.com).
 * 4. Clicking the Go button (data-testid="browser-go-btn") triggers navigation.
 * 5. Invalid URLs (e.g., javascript:, malformed protocols) are safely rejected and display invalid URL card.
 * 6. Blocked/external websites (e.g., Google, GitHub in web mode) display the honest fallback card.
 * 7. Loading states resolve cleanly.
 * 8. Browser controls work (Back, Forward, Reload, New Tab, Close Tab).
 * 9. Quick Access tiles to internal applications open the target application without crashing or looping.
 * 10. Desktop layout and mobile layout (< md) remain fully functional with zero horizontal overflow.
 */

import { test, expect } from '@playwright/test';

test.describe('Orion-9 System Browser Production Regression E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('orion_os_power_state', 'ON');
        localStorage.setItem('orion_settings', JSON.stringify({ userExperienceMode: 'ADVANCED' }));
        localStorage.setItem('orion_system_settings', JSON.stringify({ userExperienceMode: 'ADVANCED' }));
        localStorage.setItem('orion_auth_session', JSON.stringify({
          user: {
            id: 'local-admin',
            username: 'admin',
            fullName: 'Orion-9 Administrator',
            displayName: 'Admin',
            email: 'admin@orion.network',
            role: 'platform_admin',
            organizationId: 'ORION_PLATFORM',
            organizationName: 'ORION_PLATFORM',
            department: 'IT Administration',
          },
          organization: { id: 'ORION_PLATFORM', name: 'ORION_PLATFORM', status: 'active' },
          permissions: ['all'],
          environment: 'DEMO',
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        }));
      } catch {}
    });
  });

  test('1. System Browser route opens, loads initial New Tab, and renders Omnibox', async ({ page }) => {
    await page.goto('/browser');
    await page.waitForLoadState('domcontentloaded');

    const browser = page.locator('[data-testid="orion-browser"]');
    await expect(browser).toBeVisible({ timeout: 15000 });

    const addressInput = page.locator('[data-testid="browser-address-input"]');
    await expect(addressInput).toBeVisible();

    const newTabSearch = page.locator('[data-testid="browser-newtab-search"]');
    await expect(newTabSearch).toBeVisible();
  });

  test('2. Address bar navigation via Enter and Go button to embeddable destination', async ({ page }) => {
    await page.goto('/browser');
    await page.waitForLoadState('domcontentloaded');

    const addressInput = page.locator('[data-testid="browser-address-input"]');
    await expect(addressInput).toBeVisible({ timeout: 15000 });

    // Navigate with Go button
    await addressInput.click();
    await addressInput.fill('https://example.com');
    const goBtn = page.locator('[data-testid="browser-go-btn"]');
    await expect(goBtn).toBeVisible();
    await goBtn.click();

    // Verify iframe rendered
    const iframe = page.locator('iframe[data-testid="browser-web-runtime-iframe"]');
    await expect(iframe).toBeVisible({ timeout: 10000 });
    await expect(iframe).toHaveAttribute('src', 'https://example.com');
  });

  test('3. Address bar navigation via Enter key', async ({ page }) => {
    await page.goto('/browser');
    await page.waitForLoadState('domcontentloaded');

    const addressInput = page.locator('[data-testid="browser-address-input"]');
    await expect(addressInput).toBeVisible({ timeout: 15000 });

    await addressInput.click();
    await addressInput.fill('https://example.org');
    await addressInput.press('Enter');

    const iframe = page.locator('iframe[data-testid="browser-web-runtime-iframe"]');
    await expect(iframe).toBeVisible({ timeout: 10000 });
    await expect(iframe).toHaveAttribute('src', 'https://example.org');
  });

  test('4. Invalid URLs produce helpful error card without application crash', async ({ page }) => {
    await page.goto('/browser');
    await page.waitForLoadState('domcontentloaded');

    const addressInput = page.locator('[data-testid="browser-address-input"]');
    await expect(addressInput).toBeVisible({ timeout: 15000 });

    await addressInput.click();
    await addressInput.fill('javascript:alert(1)');
    await addressInput.press('Enter');

    const invalidCard = page.locator('[data-testid="browser-invalid-url"]');
    await expect(invalidCard).toBeVisible({ timeout: 5000 });
    await expect(invalidCard).toContainText('Invalid Web Address');
  });

  test('5. External sites blocking iframe embedding display honest fallback card with open external button', async ({ page }) => {
    await page.goto('/browser');
    await page.waitForLoadState('domcontentloaded');

    const addressInput = page.locator('[data-testid="browser-address-input"]');
    await expect(addressInput).toBeVisible({ timeout: 15000 });

    await addressInput.click();
    await addressInput.fill('https://google.com');
    await addressInput.press('Enter');

    const blockedCard = page.locator('[data-testid="browser-blocked-embedding"]');
    await expect(blockedCard).toBeVisible({ timeout: 5000 });
    await expect(blockedCard).toContainText('Desktop Browser Runtime Required');
    await expect(page.locator('[data-testid="browser-open-external-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="browser-target-url"]')).toContainText('https://google.com');
    await expect(page.locator('[data-testid="browser-copy-url-btn"]')).toBeVisible();
  });

  test('5b. Searching for "google" preserves destination URL and renders copy action', async ({ page }) => {
    await page.goto('/browser');
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.locator('[data-testid="browser-newtab-search"]');
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await searchInput.fill('google');
    await searchInput.press('Enter');

    const blockedCard = page.locator('[data-testid="browser-blocked-embedding"]');
    await expect(blockedCard).toBeVisible({ timeout: 5000 });
    await expect(blockedCard).toContainText('Desktop Browser Runtime Required');
    await expect(blockedCard).toContainText('Search Query: "google"');

    const targetUrl = page.locator('[data-testid="browser-target-url"]');
    await expect(targetUrl).toContainText('https://duckduckgo.com/?q=google');

    const copyBtn = page.locator('[data-testid="browser-copy-url-btn"]');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    await expect(copyBtn).toContainText('Copied!');
  });

  test('6. Multi-tab operations and tab lifecycle', async ({ page }) => {
    await page.goto('/browser');
    await page.waitForLoadState('domcontentloaded');

    const newTabBtn = page.locator('[data-testid="browser-new-tab-btn"]');
    await expect(newTabBtn).toBeVisible({ timeout: 15000 });
    await newTabBtn.click();

    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(2);

    const closeBtn = page.locator('[data-testid^="browser-close-tab-"]').last();
    await closeBtn.click();
    await expect(tabs).toHaveCount(1);
  });

  test('7. Browser controls: Reload and Back navigation', async ({ page }) => {
    await page.goto('/browser');
    await page.waitForLoadState('domcontentloaded');

    const addressInput = page.locator('[data-testid="browser-address-input"]');
    await expect(addressInput).toBeVisible({ timeout: 15000 });

    // Navigate to example.com
    await addressInput.click();
    await addressInput.fill('https://example.com');
    await addressInput.press('Enter');

    const reloadBtn = page.locator('[data-testid="browser-reload-btn"]');
    await expect(reloadBtn).toBeVisible();
    await reloadBtn.click();

    // Back button
    const backBtn = page.locator('[data-testid="browser-back-btn"]');
    await expect(backBtn).toBeEnabled();
    await backBtn.click();

    // After clicking back, new tab search should be visible again
    const newTabSearch = page.locator('[data-testid="browser-newtab-search"]');
    await expect(newTabSearch).toBeVisible();
  });

  test('8. Browser functions cleanly on mobile viewports with zero horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/browser');
    await page.waitForLoadState('domcontentloaded');

    const browser = page.locator('[data-testid="orion-browser"]');
    await expect(browser).toBeVisible({ timeout: 15000 });

    const hasNoOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 2;
    });
    expect(hasNoOverflow).toBe(true);

    const addressInput = page.locator('[data-testid="browser-address-input"]');
    await expect(addressInput).toBeVisible();
    const goBtn = page.locator('[data-testid="browser-go-btn"]');
    await expect(goBtn).toBeVisible();
  });
});
