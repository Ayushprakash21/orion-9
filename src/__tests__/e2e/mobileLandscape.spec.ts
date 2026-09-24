/**
 * ORION-9 PHONE LANDSCAPE PLAYWRIGHT E2E SUITE
 * 
 * Verifies:
 * 1. Phone rotated into landscape (812x375, 844x390, 915x412) REMAINS IN MOBILE SHELL.
 * 2. Mobile Bottom Navigation remains intact.
 * 3. Does NOT switch to Desktop Dock or Tablet OS.
 * 4. Zero horizontal page overflow.
 * 5. Zero React Error #300 or hook violations.
 */

import { test, expect } from '@playwright/test';

const PHONE_LANDSCAPE_VIEWPORTS = [
  { name: 'iPhone-SE-812x375', width: 812, height: 375 },
  { name: 'iPhone-14-844x390', width: 844, height: 390 },
  { name: 'Pixel-8-915x412', width: 915, height: 412 },
];

test.describe('Orion-9 Phone Landscape Mode E2E', () => {
  for (const vp of PHONE_LANDSCAPE_VIEWPORTS) {
    test(`Verify Phone Landscape Experience on ${vp.name}`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', err => {
        consoleErrors.push(err.message);
      });

      await page.addInitScript(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
          sessionStorage.setItem('orion_os_power_state', 'ON');
        } catch (e) {}
      });

      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/login');

      // Login
      await page.fill('input#username', 'admin');
      await page.fill('input#password', 'admin');
      await page.click('button[type="submit"]');

      // Invariant 1: Phone in landscape MUST remain in Mobile Shell
      const mobileShell = page.locator('[data-orion-mobile-shell="true"]');
      await expect(mobileShell).toBeVisible({ timeout: 15000 });

      // Invariant 2: Desktop Dock MUST NOT exist
      await expect(page.locator('[data-orion-dock="true"]')).toHaveCount(0);

      // Invariant 3: Desktop System Bar navigation (OPERATIONS / INTELLIGENCE / CONTROL) MUST NOT collide
      await expect(page.locator('header nav:has-text("OPERATIONS")')).toHaveCount(0);

      // Verify Bottom Navigation remains present and functional
      const bottomNav = page.locator('nav[aria-label="Mobile Navigation"]');
      await expect(bottomNav).toBeVisible();

      // Assert No Horizontal Overflow
      const noOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth + 2;
      });
      expect(noOverflow).toBe(true);

      // Assert No React Error #300
      const reactErrors = consoleErrors.filter(err => 
        err.includes('Minified React error #300') ||
        err.includes('Rendered fewer hooks than expected') ||
        err.includes('Rendered more hooks than')
      );
      expect(reactErrors).toHaveLength(0);
    });
  }
});
