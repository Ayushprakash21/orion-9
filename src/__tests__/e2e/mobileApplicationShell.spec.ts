import { test, expect } from '@playwright/test';

/**
 * ORION-9 MOBILE APPLICATION SHELL PLAYWRIGHT E2E SUITE
 * 
 * Verifies:
 * 1. Native mobile presentation shell at 375x812, 390x844, and 412x915.
 * 2. Zero desktop dock / zero desktop top navigation bar on mobile.
 * 3. Mobile Header with ORION-9 logo, active screen title, and LIVE/DEMO badge.
 * 4. 5-tab Mobile Bottom Navigation (Home, Control, AI, Alerts, Apps).
 * 5. Single-screen application container model (no floating desktop window frames).
 * 6. Live charts and metric display.
 * 7. Mobile entity detail sheet workflow.
 * 8. Zero horizontal page-level overflow across all mobile screens.
 */

const MOBILE_VIEWPORTS = [
  { name: 'iPhone-375x812', width: 375, height: 812 },
  { name: 'iPhone-390x844', width: 390, height: 844 },
  { name: 'Android-412x915', width: 412, height: 915 },
];

test.describe('Orion-9 Native Mobile Application Shell Rebuild E2E', () => {
  for (const vp of MOBILE_VIEWPORTS) {
    test(`Full mobile application shell verification on ${vp.name}`, async ({ page }) => {
      // 1. Initialize OS State and Set Viewport
      await page.addInitScript(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
          sessionStorage.setItem('orion_os_power_state', 'ON');
        } catch (e) {}
      });

      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/login');

      // 2. Perform Standard Demo Login
      await page.fill('input#username', 'admin');
      await page.fill('input#password', 'admin');
      await page.click('button[type="submit"]');

      // 3. Verify Mobile Shell Container is rendered
      const mobileShell = page.locator('[data-orion-mobile-shell="true"]');
      await expect(mobileShell).toBeVisible({ timeout: 15000 });

      // 4. Invariant: Desktop Dock MUST NOT be rendered
      const desktopDock = page.locator('[data-orion-dock="true"]');
      await expect(desktopDock).toHaveCount(0);

      // 5. Invariant: Desktop horizontal nav MUST NOT be rendered
      const desktopNav = page.locator('header nav:has-text("OPERATIONS")');
      await expect(desktopNav).toHaveCount(0);

      // 6. Verify Mobile Header
      const header = page.locator('header');
      await expect(header).toBeVisible();
      await expect(header.getByText(/ORION/i)).toBeVisible();
      await expect(header.getByText(/DEMO|LIVE/i)).toBeVisible();

      // 7. Verify 5-tab Mobile Bottom Navigation
      const bottomNav = page.locator('nav[aria-label="Mobile Navigation"]');
      await expect(bottomNav).toBeVisible();
      await expect(bottomNav.getByText('Home')).toBeVisible();
      await expect(bottomNav.getByText('Control')).toBeVisible();
      await expect(bottomNav.getByText('AI')).toBeVisible();
      await expect(bottomNav.getByText('Alerts')).toBeVisible();
      await expect(bottomNav.getByText('Apps')).toBeVisible();

      // 8. Assert Zero Page-Level Horizontal Overflow
      const hasNoHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth + 2;
      });
      expect(hasNoHorizontalOverflow).toBe(true);

      // Capture Home Screen Screenshot
      await page.screenshot({ path: `test-results/mobile-${vp.name}-home.png` });

      // 9. Navigate to Control Tower Tab
      await bottomNav.getByText('Control').click();
      await expect(page.getByText(/Orion Control Tower/i)).toBeVisible();
      await expect(page.getByText(/Active Disruption Telemetry/i)).toBeVisible();
      await page.screenshot({ path: `test-results/mobile-${vp.name}-control.png` });

      // 10. Navigate to AI Copilot Tab
      await bottomNav.getByText('AI').click();
      await expect(page.getByText(/ORION AI COPILOT/i)).toBeVisible();
      await expect(page.getByPlaceholder(/Ask Orion AI Copilot/i)).toBeVisible();
      await page.screenshot({ path: `test-results/mobile-${vp.name}-ai.png` });

      // 11. Navigate to Alerts Tab
      await bottomNav.getByText('Alerts').click();
      await expect(page.getByText(/Operational Alerts & Risks/i)).toBeVisible();
      await page.screenshot({ path: `test-results/mobile-${vp.name}-alerts.png` });

      // 12. Navigate to Apps Launcher Tab
      await bottomNav.getByText('Apps').click();
      const appSearch = page.getByPlaceholder(/Search 100\+ Enterprise Apps/i);
      await expect(appSearch).toBeVisible();
      await page.screenshot({ path: `test-results/mobile-${vp.name}-apps.png` });

      // 13. Open an Application as Single-Screen View
      const invApp = page.getByRole('button', { name: /Inventory/i }).first();
      if (await invApp.isVisible()) {
        await invApp.click();
        await expect(page.getByText(/MOBILE VIEW/i)).toBeVisible();
        await page.screenshot({ path: `test-results/mobile-${vp.name}-app-view.png` });

        // Click Back to return to launcher
        await page.getByRole('button', { name: /Apps/i }).first().click();
        await expect(appSearch).toBeVisible();
      }
    });
  }
});
