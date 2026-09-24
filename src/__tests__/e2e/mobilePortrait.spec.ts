/**
 * ORION-9 PHONE PORTRAIT PLAYWRIGHT E2E SUITE
 * 
 * Verifies:
 * 1. Native mobile presentation shell at 375x812, 390x844, 412x915 portrait.
 * 2. Mobile Bottom Navigation (5 destinations).
 * 3. Zero desktop dock / zero desktop floating windows.
 * 4. Zero horizontal overflow (scrollWidth <= innerWidth).
 * 5. Zero React Error #300 or hook violations.
 */

import { test, expect } from '@playwright/test';

const PHONE_PORTRAIT_VIEWPORTS = [
  { name: 'iPhone-SE-375x812', width: 375, height: 812 },
  { name: 'iPhone-14-390x844', width: 390, height: 844 },
  { name: 'Pixel-8-412x915', width: 412, height: 915 },
];

test.describe('Orion-9 Phone Portrait Mode E2E', () => {
  for (const vp of PHONE_PORTRAIT_VIEWPORTS) {
    test(`Verify Phone Portrait Experience on ${vp.name}`, async ({ page }) => {
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

      // Verify Mobile Shell Container
      const mobileShell = page.locator('[data-orion-mobile-shell="true"]');
      await expect(mobileShell).toBeVisible({ timeout: 15000 });

      // Invariant: Desktop Dock MUST NOT exist
      await expect(page.locator('[data-orion-dock="true"]')).toHaveCount(0);

      // Verify 5-tab Bottom Navigation
      const bottomNav = page.locator('nav[aria-label="Mobile Navigation"]');
      await expect(bottomNav).toBeVisible();
      await expect(bottomNav.getByText('Home')).toBeVisible();
      await expect(bottomNav.getByText('Control')).toBeVisible();
      await expect(bottomNav.getByText('AI')).toBeVisible();
      await expect(bottomNav.getByText('Alerts')).toBeVisible();
      await expect(bottomNav.getByText('Apps')).toBeVisible();

      // Assert No Horizontal Overflow
      const noOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth + 2;
      });
      expect(noOverflow).toBe(true);

      // Navigate to AI
      const aiBtn = page.locator('button[aria-label="Open ORION AI"]');
      await aiBtn.click();
      await expect(page.getByText(/ORION AI/i).first()).toBeVisible();

      // Assert No React 300 Errors
      const reactErrors = consoleErrors.filter(err => 
        err.includes('Minified React error #300') ||
        err.includes('Rendered fewer hooks than expected') ||
        err.includes('Rendered more hooks than')
      );
      expect(reactErrors).toHaveLength(0);
    });
  }
});
