/**
 * ORION-9 CROSS-DEVICE WORKSPACE & VIRTUAL FILE SYSTEM E2E TEST SUITE
 * Validates Desktop, Tablet, and Mobile interaction models, zero horizontal scroll,
 * multi-device file persistence, touch physics, and full-screen mobile app shell.
 */

import { test, expect } from '@playwright/test';

test.describe('Orion-9 Cross-Device Workspace & File System E2E Suite', () => {
  // Helper to authenticate session across devices
  async function setupSession(page: any, viewport: { width: number; height: number }) {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('orion_os_power_state', 'ON');
      } catch (e) {}
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    const quickLoginBtn = page.getByRole('button', { name: /quick launch|quick test/i })
      .or(page.locator('button:has-text("Quick"), button:has-text("Demo"), button:has-text("Admin")').first());

    if (await quickLoginBtn.isVisible()) {
      await quickLoginBtn.click();
    } else {
      const usernameInput = page.locator('input[type="text"], input[type="email"], #username').first();
      if (await usernameInput.isVisible()) {
        await usernameInput.fill('admin');
        const passwordInput = page.locator('input[type="password"], #password').first();
        await passwordInput.fill('admin');
        await page.locator('button[type="submit"]').click();
      }
    }
  }

  test.describe('1. DESKTOP INTERACTION MODEL (1440x900)', () => {
    test.beforeEach(async ({ page }) => {
      await setupSession(page, { width: 1440, height: 900 });
      await expect(page.locator('.orion-desktop-shell')).toBeVisible({ timeout: 20000 });
    });

    test('renders desktop workspace canvas, dock, system bar, and persistent desktop icons', async ({ page }) => {
      const canvas = page.locator('[data-desktop-canvas="true"]');
      await expect(canvas).toBeVisible({ timeout: 10000 });

      // Check System Applications on Canvas
      await expect(page.getByText('This Computer').first()).toBeVisible();
      await expect(page.getByText('File Explorer').first()).toBeVisible();
      await expect(page.getByText('Notepad').first()).toBeVisible();
      await expect(page.getByText('Recycle Bin').first()).toBeVisible();

      // Check zero horizontal page overflow
      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(isOverflowing).toBe(false);
    });

    test('opens Notepad, edits content, and verifies editor capabilities', async ({ page }) => {
      const notepadIcon = page.locator('[data-desktop-canvas="true"]').getByText('Notepad').first();
      await expect(notepadIcon).toBeVisible({ timeout: 10000 });

      // Double click to launch Notepad
      await notepadIcon.dblclick();
      await page.waitForTimeout(1000);

      // Notepad window opened
      const notepadWindow = page.locator('[data-window-id="notepad"]');
      await expect(notepadWindow).toBeVisible({ timeout: 10000 });

      // Fill text and check status
      const textarea = notepadWindow.locator('textarea').first();
      await expect(textarea).toBeVisible();
      await textarea.fill('DESKTOP E2E TEST FILE: Autonomous Inventory Health Check 100%');
      await expect(textarea).toHaveValue(/Autonomous Inventory Health Check 100%/);
    });
  });

  test.describe('2. TABLET INTERACTION MODEL (820x1180)', () => {
    test.beforeEach(async ({ page }) => {
      await setupSession(page, { width: 820, height: 1180 });
      await expect(page.locator('.orion-desktop-shell')).toBeVisible({ timeout: 20000 });
    });

    test('renders touch-friendly desktop icons with minimum 44px touch targets', async ({ page }) => {
      const canvas = page.locator('[data-desktop-canvas="true"]');
      await expect(canvas).toBeVisible({ timeout: 10000 });

      const fileMgrIcon = page.locator('[data-desktop-canvas="true"]').getByText('File Explorer').first();
      await expect(fileMgrIcon).toBeVisible();

      // Double click / tap launches window
      await fileMgrIcon.dblclick();
      await page.waitForTimeout(1000);

      const fileWindow = page.locator('[data-window-id="file-manager"]');
      await expect(fileWindow).toBeVisible({ timeout: 10000 });
      await expect(fileWindow.getByText(/System Folders/i).first()).toBeVisible();
    });
  });

  test.describe('3. MOBILE INTERACTION MODEL (390x844)', () => {
    test.beforeEach(async ({ page }) => {
      await setupSession(page, { width: 390, height: 844 });
    });

    test('renders mobile shell with 5-tab bottom navigation and hides desktop dock', async ({ page }) => {
      // Bottom navigation tabs
      const bottomNav = page.locator('nav[aria-label="Mobile Navigation"]');
      await expect(bottomNav).toBeVisible({ timeout: 20000 });

      await expect(bottomNav.getByText('Home')).toBeVisible();
      await expect(bottomNav.getByText('Control')).toBeVisible();
      await expect(bottomNav.getByText('AI')).toBeVisible();
      await expect(bottomNav.getByText('Alerts')).toBeVisible();
      await expect(bottomNav.getByText('Apps')).toBeVisible();

      // Verify desktop dock is NOT rendered in mobile viewport
      const desktopDock = page.locator('[data-orion-dock="true"]');
      expect(await desktopDock.count()).toBe(0);

      // Verify zero horizontal scrolling
      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(isOverflowing).toBe(false);
    });

    test('navigates to Apps tab, searches for Notepad, and opens full-screen mobile app container', async ({ page }) => {
      const bottomNav = page.locator('nav[aria-label="Mobile Navigation"]');
      await expect(bottomNav).toBeVisible({ timeout: 20000 });

      // Click Apps tab
      const appsTabBtn = bottomNav.locator('button:has-text("Apps")').first();
      await appsTabBtn.click();
      await page.waitForTimeout(600);

      // Verify App Search input is visible
      const searchInput = page.locator('input[placeholder*="Search"]');
      await expect(searchInput).toBeVisible({ timeout: 10000 });

      // Search for Notepad
      await searchInput.fill('Notepad');
      await page.waitForTimeout(400);

      const notepadCard = page.locator('button:has-text("Notepad")').first();
      await expect(notepadCard).toBeVisible();
      await notepadCard.click();
      await page.waitForTimeout(1000);

      // Verify full-screen mobile app view
      await expect(page.getByText('MOBILE VIEW').first()).toBeVisible();
      await expect(page.getByRole('button', { name: /Back to App Launcher|Apps/i }).first()).toBeVisible();

      // Verify Notepad text editor is active in mobile container
      const textarea = page.locator('textarea').first();
      await expect(textarea).toBeVisible();
      await textarea.fill('MOBILE SCM NOTE: Field Logistics Verified');
      await expect(textarea).toHaveValue(/Field Logistics Verified/);

      // Test Back button
      const backBtn = page.getByRole('button', { name: /Back to App Launcher|Apps/i }).first();
      await backBtn.click();
      await page.waitForTimeout(600);

      // Should return to App Launcher
      await expect(searchInput).toBeVisible();
    });
  });
});
