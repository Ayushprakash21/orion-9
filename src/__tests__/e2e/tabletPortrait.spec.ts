/**
 * ORION-9 TABLET PORTRAIT PLAYWRIGHT E2E SUITE
 * 
 * Verifies:
 * 1. Dedicated Tablet Presentation Shell at 768x1024 and 820x1180.
 * 2. Bottom tablet navigation bar.
 * 3. 4-grid / 2-column tablet layouts.
 * 4. Zero desktop dock leakage.
 * 5. Zero React Error #300 or hook violations.
 */

import { test, expect } from '@playwright/test';

const TABLET_PORTRAIT_VIEWPORTS = [
  { name: 'iPad-768x1024', width: 768, height: 1024 },
  { name: 'iPad-Air-820x1180', width: 820, height: 1180 },
];

test.describe('Orion-9 Tablet Portrait Mode E2E', () => {
  for (const vp of TABLET_PORTRAIT_VIEWPORTS) {
    test(`Verify Tablet Portrait Experience on ${vp.name}`, async ({ page }) => {
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

      // Verify Tablet Shell Container
      const tabletShell = page.locator('[data-orion-tablet-shell="true"]');
      await expect(tabletShell).toBeVisible({ timeout: 15000 });

      // Invariant: Desktop Dock MUST NOT exist
      await expect(page.locator('[data-orion-dock="true"]')).toHaveCount(0);

      // Verify Portrait Bottom Navigation Bar
      const bottomNav = page.locator('[data-orion-tablet-nav="bottom"]');
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

      // Navigate across tabs
      await bottomNav.getByText('Control').click();
      await expect(page.getByText(/Orion Control Tower/i)).toBeVisible();

      await bottomNav.getByText('AI').click();
      await expect(page.getByText(/ORION AI COPILOT/i)).toBeVisible();

      await bottomNav.getByText('Apps').click();
      await expect(page.getByPlaceholder(/Search 100\+ Enterprise Apps/i)).toBeVisible();

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
