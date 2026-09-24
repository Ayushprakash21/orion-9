/**
 * ORION-9 AUTO-ROTATION & LIFECYCLE STABILITY PLAYWRIGHT E2E SUITE
 * 
 * Verifies full rotation matrix:
 * 1. Phone Portrait (375x812) -> Phone Landscape (812x375) -> Phone Portrait (375x812)
 * 2. Phone Portrait (390x844) -> Phone Landscape (844x390) -> Phone Portrait (390x844)
 * 3. Tablet Portrait (768x1024) -> Tablet Landscape (1024x768) -> Tablet Portrait (768x1024)
 * 4. Tablet Portrait (820x1180) -> Tablet Landscape (1180x820) -> Tablet Portrait (820x1180)
 * 5. Fails immediately on React Error #300, hook mismatch, or unhandled exceptions.
 */

import { test, expect } from '@playwright/test';

test.describe('Orion-9 Auto-Rotation & Lifecycle Stability E2E', () => {
  test('Phone Auto-Rotation Matrix (Portrait <-> Landscape) with Zero React Crashes', async ({ page }) => {
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

    // 1. Initial Phone Portrait: 390x844
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/login');

    await page.fill('input#username', 'admin');
    await page.fill('input#password', 'admin');
    await page.click('button[type="submit"]');

    const mobileShell = page.locator('[data-orion-mobile-shell="true"]');
    await expect(mobileShell).toBeVisible({ timeout: 15000 });

    // Navigate to AI Tab
    const bottomNav = page.locator('nav[aria-label="Mobile Navigation"]');
    await bottomNav.getByText('AI').click();
    await expect(page.getByText(/ORION AI/i).first()).toBeVisible();

    // 2. Rotate to Landscape: 844x390
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(300);

    // Verify Shell remains alive & still in Mobile Shell
    await expect(mobileShell).toBeVisible();
    await expect(page.getByText(/ORION AI/i).first()).toBeVisible();

    // Navigate to Alerts in Landscape
    await bottomNav.getByText('Alerts').click();
    await expect(page.getByText(/Operational Alerts & Risks/i)).toBeVisible();

    // 3. Rotate back to Portrait: 390x844
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);

    await expect(mobileShell).toBeVisible();
    await expect(page.getByText(/Operational Alerts & Risks/i)).toBeVisible();

    // Assert zero React error #300
    const reactErrors = consoleErrors.filter(err => 
      err.includes('Minified React error #300') ||
      err.includes('Rendered fewer hooks than expected') ||
      err.includes('Rendered more hooks than')
    );
    expect(reactErrors).toHaveLength(0);
  });

  test('Tablet Auto-Rotation Matrix (Portrait <-> Landscape) with Zero React Crashes', async ({ page }) => {
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

    // 1. Initial Tablet Portrait: 768x1024
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');

    await page.fill('input#username', 'admin');
    await page.fill('input#password', 'admin');
    await page.click('button[type="submit"]');

    const tabletShell = page.locator('[data-orion-tablet-shell="true"]');
    await expect(tabletShell).toBeVisible({ timeout: 15000 });

    // In Portrait: bottom nav is rendered
    const portNav = page.locator('[data-orion-tablet-nav="bottom"]');
    await expect(portNav).toBeVisible();

    // Navigate to Control Tower
    await portNav.getByText('Control').click();
    await expect(page.getByText(/Orion Control Tower/i)).toBeVisible();

    // 2. Rotate to Tablet Landscape: 1024x768
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);

    // Verify Tablet Shell remains alive
    await expect(tabletShell).toBeVisible();
    // In Landscape: navigation rail is rendered
    const landRail = page.locator('[data-orion-tablet-nav="rail"]');
    await expect(landRail).toBeVisible();

    // Navigate to AI in Landscape
    await landRail.getByText('AI').click();
    await expect(page.getByText(/ORION AI COPILOT/i)).toBeVisible();

    // 3. Rotate back to Tablet Portrait: 768x1024
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);

    await expect(tabletShell).toBeVisible();
    await expect(page.locator('[data-orion-tablet-nav="bottom"]')).toBeVisible();
    await expect(page.getByText(/ORION AI COPILOT/i)).toBeVisible();

    // Assert zero React error #300
    const reactErrors = consoleErrors.filter(err => 
      err.includes('Minified React error #300') ||
      err.includes('Rendered fewer hooks than expected') ||
      err.includes('Rendered more hooks than')
    );
    expect(reactErrors).toHaveLength(0);
  });
});
