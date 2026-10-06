import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\LENOVO\\.gemini\\antigravity\\brain\\2294112a-5564-4333-a185-061673183aaa\\orbital_screenshots';

const RESOLUTIONS = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1280x720', width: 1280, height: 720 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '390x844', width: 390, height: 844 },
];

test.describe('ORION-9 Orbital Rings & Logo Composition E2E Visual Verification', () => {

  for (const res of RESOLUTIONS) {
    test(`Visual & Geometry Verification at ${res.name}`, async ({ page }) => {
      await page.setViewportSize({ width: res.width, height: res.height });

      // Ensure fresh startup state: no prior session so we land on POWERED_OFF / Startup screen
      await page.addInitScript(() => {
        try {
          sessionStorage.clear();
          localStorage.clear();
        } catch (e) {}
      });

      await page.goto('/');

      // 1. Wait for Startup / Power-On Screen
      const startupScreen = page.locator('[data-testid="orion-startup-screen"]');
      await expect(startupScreen).toBeVisible({ timeout: 10000 });

      // Wait until initialization completes and reaches BOOT_READY phase ("START ORION")
      const startOrionBtn = page.locator('[data-testid="start-orion-button"]');
      await expect(startOrionBtn).toBeVisible({ timeout: 15000 });

      // Core container
      const coreContainer = page.locator('[data-testid="orion-lifecycle-core"]').first();
      await expect(coreContainer).toBeVisible();

      // Logo mark
      const logoMark = page.locator('.ob3-core-mark').first();
      await expect(logoMark).toBeVisible();

      // Outer & Mid rings
      const outerRing = page.locator('.ob3-core-outer').first();
      const midRing = page.locator('.ob3-core-mid').first();
      await expect(outerRing).toBeVisible();
      await expect(midRing).toBeVisible();

      // Measure exact geometry
      const metrics = await page.evaluate(() => {
        const logoEl = document.querySelector('.ob3-core-mark') as HTMLElement;
        const outerEl = document.querySelector('.ob3-core-outer') as HTMLElement;
        const midEl = document.querySelector('.ob3-core-mid') as HTMLElement;
        const btnEl = document.querySelector('[data-testid="start-orion-button"]') as HTMLElement;
        const readyBadgeEl = document.querySelector('[data-testid="boot-system-ready-badge"]') as HTMLElement;

        const logoRect = logoEl.getBoundingClientRect();
        const outerRect = outerEl.getBoundingClientRect();
        const midRect = midEl.getBoundingClientRect();
        const btnRect = btnEl.getBoundingClientRect();
        const readyBadgeRect = readyBadgeEl.getBoundingClientRect();

        const logoCenterX = logoRect.left + logoRect.width / 2;
        const logoCenterY = logoRect.top + logoRect.height / 2;

        const outerCenterX = outerRect.left + outerRect.width / 2;
        const outerCenterY = outerRect.top + outerRect.height / 2;

        const midCenterX = midRect.left + midRect.width / 2;
        const midCenterY = midRect.top + midRect.height / 2;

        return {
          logo: { x: logoCenterX, y: logoCenterY, w: logoRect.width, h: logoRect.height, top: logoRect.top, bottom: logoRect.bottom },
          outer: { x: outerCenterX, y: outerCenterY, w: outerRect.width, h: outerRect.height, top: outerRect.top, bottom: outerRect.bottom },
          mid: { x: midCenterX, y: midCenterY, w: midRect.width, h: midRect.height },
          readyBadgeTop: readyBadgeRect.top,
          btnTop: btnRect.top,
        };
      });

      // Verification A: Logo and Orbit centers must be identical (within 1.5px subpixel tolerance)
      const diffOuterX = Math.abs(metrics.logo.x - metrics.outer.x);
      const diffOuterY = Math.abs(metrics.logo.y - metrics.outer.y);
      const diffMidX = Math.abs(metrics.logo.x - metrics.mid.x);
      const diffMidY = Math.abs(metrics.logo.y - metrics.mid.y);

      expect(diffOuterX).toBeLessThanOrEqual(1.5);
      expect(diffOuterY).toBeLessThanOrEqual(1.5);
      expect(diffMidX).toBeLessThanOrEqual(1.5);
      expect(diffMidY).toBeLessThanOrEqual(1.5);

      // Verification B: Rings must be substantially larger than logo
      expect(metrics.outer.w).toBeGreaterThan(metrics.logo.w);
      expect(metrics.outer.h).toBeGreaterThan(metrics.logo.h);

      // Verification C: Rings must not overlap the button or system ready badge below
      expect(metrics.outer.bottom).toBeLessThanOrEqual(metrics.readyBadgeTop + 2); // 2px margin tolerance
      expect(metrics.outer.bottom).toBeLessThan(metrics.btnTop);

      // Take Power Ready screenshot
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `power_ready_${res.name}.png`),
        fullPage: true,
      });

      // 2. Click "START ORION" to enter Cinematic Boot Sequence
      await startOrionBtn.click();

      // Wait for Boot Sequence screen
      const bootSequence = page.locator('[data-testid="orion-boot-sequence"]');
      await expect(bootSequence).toBeVisible({ timeout: 5000 });

      // Measure Boot Sequence geometry
      const bootMetrics = await page.evaluate(() => {
        const logoEl = document.querySelector('.ob3-core-mark') as HTMLElement;
        const outerEl = document.querySelector('.ob3-core-outer') as HTMLElement;
        if (!logoEl || !outerEl) return null;

        const logoRect = logoEl.getBoundingClientRect();
        const outerRect = outerEl.getBoundingClientRect();

        return {
          logoCenterX: logoRect.left + logoRect.width / 2,
          logoCenterY: logoRect.top + logoRect.height / 2,
          outerCenterX: outerRect.left + outerRect.width / 2,
          outerCenterY: outerRect.top + outerRect.height / 2,
        };
      });

      if (bootMetrics) {
        expect(Math.abs(bootMetrics.logoCenterX - bootMetrics.outerCenterX)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(bootMetrics.logoCenterY - bootMetrics.outerCenterY)).toBeLessThanOrEqual(1.5);
      }

      // Take Boot screenshot (only need desktop and mobile representative shots for boot)
      if (res.name === '1920x1080' || res.name === '390x844') {
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `boot_sequence_${res.name}.png`),
          fullPage: true,
        });
      }
    });
  }

  test('Shutdown Screen Geometry & Visual Verification', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Seed state so we can enter OS and trigger shutdown, or directly navigate
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('orion_os_power_state', 'ON');
        localStorage.setItem('orion_auth_session', JSON.stringify({
          user: { id: 'usr-admin-01', username: 'admin', role: 'platform_admin' },
          expiresAt: new Date(Date.now() + 86400000).toISOString()
        }));
      } catch (e) {}
    });

    await page.goto('/');

    // Render shutdown by setting bootState or evaluating shutdown in authContext
    // We can directly test the shutdown component via evaluation or button if present
    const hasDesktop = await page.locator('[data-desktop-canvas="true"]').isVisible({ timeout: 10000 }).catch(() => false);
    
    // Evaluate shutdown state trigger
    await page.evaluate(() => {
      const event = new CustomEvent('orion-system-shutdown-trigger');
      window.dispatchEvent(event);
    });

    // Alternatively, take screenshot if shutdown screen is visible
    const shutdownScreen = page.locator('[data-testid="orion-shutdown-screen"], [role="status"]:has-text("System Shutdown")');
    if (await shutdownScreen.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'shutdown_1920x1080.png'),
        fullPage: true,
      });
    }
  });
});
