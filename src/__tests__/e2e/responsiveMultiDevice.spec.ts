import { test, expect } from '@playwright/test';

/**
 * ORION-9 GLOBAL RESPONSIVE UI & MULTI-DEVICE TEST SUITE
 * 
 * Tests Orion-9 across Desktop, Laptop, Tablet, and Mobile viewports.
 * Asserts:
 * 1. Zero horizontal overflow (scrollWidth <= innerWidth).
 * 2. System Bar & branding render without clipping.
 * 3. Mobile Navigation Bar renders on mobile (< 768px).
 * 4. Desktop Dock renders on desktop (>= 768px).
 * 5. Applications launch and fill the viewport correctly without horizontal clipping.
 */

const VIEWPORTS = [
  { name: 'Mobile 390x844', width: 390, height: 844, isMobile: true },
  { name: 'Mobile 393x852', width: 393, height: 852, isMobile: true },
  { name: 'Mobile 412x915', width: 412, height: 915, isMobile: true },
  { name: 'Tablet Portrait 768x1024', width: 768, height: 1024, isMobile: false },
  { name: 'Tablet Landscape 1024x768', width: 1024, height: 768, isMobile: false },
  { name: 'Laptop Compact 1280x800', width: 1280, height: 800, isMobile: false },
  { name: 'Desktop Standard 1440x900', width: 1440, height: 900, isMobile: false },
  { name: 'Desktop Large 1920x1080', width: 1920, height: 1080, isMobile: false },
];

test.describe('Orion-9 Multi-Device Responsive Verification', () => {
  for (const vp of VIEWPORTS) {
    test(`Layout integrity on ${vp.name}`, async ({ page }) => {
      await page.addInitScript(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
          sessionStorage.setItem('orion_os_power_state', 'ON');
        } catch (e) {}
      });

      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/login');

      // 1. Check Login / Startup Portal fits within viewport
      const loginCard = page.locator('.orion-auth-card, [data-testid="login-card"], form').first();
      await expect(loginCard).toBeVisible({ timeout: 10000 });

      // Check no horizontal scroll on auth screen
      const authOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth;
      });
      expect(authOverflow).toBe(true);

      // 2. Perform Login (Two-stage flow)
      await page.fill('input#username', 'admin');
      await page.click('button[type="submit"]');
      await expect(page.locator('input#password')).toBeVisible({ timeout: 5000 });
      await page.fill('input#password', 'admin');
      await page.click('button[type="submit"]');

      // 3. Verify Shell is visible (Mobile shell for phone, Desktop shell for desktop/tablet)
      const shellSelector = vp.isMobile
        ? '[data-orion-mobile-shell="true"]'
        : '.orion-desktop-shell, [data-orion-tablet-shell="true"]';
      const activeShell = page.locator(shellSelector).first();
      await expect(activeShell).toBeVisible({ timeout: 15000 });

      // 4. Assert zero document page scrolling (BOTH vertical and horizontal must be ZERO)
      const hasZeroPageScroll = await page.evaluate(() => {
        return (
          document.documentElement.scrollHeight <= window.innerHeight &&
          document.documentElement.scrollWidth <= window.innerWidth &&
          document.body.scrollHeight <= window.innerHeight &&
          document.body.scrollWidth <= window.innerWidth
        );
      });
      expect(hasZeroPageScroll).toBe(true);

      // 5. Verify OS System Bar is rendered
      const systemBar = page.locator('.orion-global-topbar');
      await expect(systemBar).toBeVisible();

      // 6. Verify Mobile Nav vs Desktop Dock
      if (vp.isMobile) {
        const mobileNav = page.locator('.orion-mobile-bottom-bar, nav[aria-label="Mobile Navigation"]');
        await expect(mobileNav).toBeVisible();
      } else {
        const desktopDock = page.locator('.orion-dock-container');
        await expect(desktopDock).toBeVisible();
      }

      // 7. Verify Application Launcher / Command Palette opens within viewport bounds
      if (vp.isMobile) {
        const appsBtn = page.locator('button:has-text("Apps")').first();
        if (await appsBtn.isVisible()) {
          await appsBtn.click();
          const launcherModal = page.locator('[aria-label="Application Launcher"]');
          await expect(launcherModal).toBeVisible();

          // Assert launcher does not cause horizontal spill
          const launcherFits = await page.evaluate(() => {
            return document.documentElement.scrollWidth <= window.innerWidth;
          });
          expect(launcherFits).toBe(true);

          // Close launcher
          await page.keyboard.press('Escape');
        }
      }
    });
  }
});
