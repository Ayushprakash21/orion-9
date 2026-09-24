/**
 * ORION-9 TABLET LANDSCAPE PLAYWRIGHT E2E SUITE
 * 
 * Verifies:
 * 1. Dedicated Tablet Presentation Shell at 1024x768 and 1180x820 landscape.
 * 2. Left compact navigation rail ([data-orion-tablet-nav="rail"]).
 * 3. Dedicated tablet application workspace.
 * 4. Zero desktop dock leakage / zero top-bar collision.
 * 5. Zero React Error #300 or hook violations.
 */

import { test, expect } from '@playwright/test';

const TABLET_LANDSCAPE_VIEWPORTS = [
  { name: 'iPad-1024x768', width: 1024, height: 768 },
  { name: 'iPad-Air-1180x820', width: 1180, height: 820 },
];

test.describe('Orion-9 Tablet Landscape Mode E2E', () => {
  for (const vp of TABLET_LANDSCAPE_VIEWPORTS) {
    test(`Verify Tablet Landscape Experience on ${vp.name}`, async ({ page }) => {
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

      // Verify Left Navigation Rail
      const navRail = page.locator('[data-orion-tablet-nav="rail"]');
      await expect(navRail).toBeVisible();
      await expect(navRail.getByText('Home')).toBeVisible();
      await expect(navRail.getByText('Control')).toBeVisible();
      await expect(navRail.getByText('AI')).toBeVisible();
      await expect(navRail.getByText('Alerts')).toBeVisible();
      await expect(navRail.getByText('Apps')).toBeVisible();

      // Assert No Horizontal Overflow
      const noOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth + 2;
      });
      expect(noOverflow).toBe(true);

      // Navigate across tabs
      await navRail.getByText('Control').click();
      await expect(page.getByText(/Orion Control Tower/i)).toBeVisible();

      await navRail.getByText('AI').click();
      await expect(page.getByText(/ORION AI COPILOT/i)).toBeVisible();

      await navRail.getByText('Apps').click();
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
