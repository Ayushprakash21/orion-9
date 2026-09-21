/**
 * ORION-9 ADMIN AI + MANUAL CONTROL CENTER PLAYWRIGHT E2E SUITE
 *
 * Flow:
 * Login (admin/admin)
 * → Admin
 * → Platform Administration
 * → AI + Manual Control Center
 *
 * Verifies:
 * - heading visible: "AI + Manual Control Center"
 * - Users & RBAC visible
 * - Role Management visible
 * - Manual visible
 * - AI Copilot visible
 * - AI Autopilot visible
 * - Governance visible
 * - AI Actions visible
 * - Create AI Proposal visible
 * - Review Approvals visible
 * - View Audit visible
 */

import { test, expect } from '@playwright/test';

test.describe('Orion-9 Admin AI + Manual Control Center E2E Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Clear storage and initialize OS power state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('orion_os_power_state', 'ON');
    });
    await page.goto('/login');
  });

  test('Login → Admin → Platform Administration → AI + Manual Control Center verification', async ({ page }) => {
    // 1. Authenticate as Admin
    await page.goto('/login');
    await page.fill('input#username', 'admin');
    await page.fill('input#password', 'admin');
    await page.click('button[type="submit"]');

    // 2. Navigate to Admin Platform Administration
    await page.waitForTimeout(500);
    await page.goto('/admin');

    // 3. Verify Platform Administration sidebar
    await expect(page.locator('text=Platform Administration')).toBeVisible({ timeout: 5000 });

    // 4. Click AI + Manual Control Center link
    const controlCenterNav = page.locator('aside a:has-text("AI + Manual Control Center")');
    await expect(controlCenterNav).toBeVisible({ timeout: 5000 });
    await controlCenterNav.click();

    // 5. Verify heading visible: "AI + Manual Control Center"
    await expect(page.locator('h1:has-text("AI + Manual Control Center")')).toBeVisible({ timeout: 5000 });

    // 6. Verify Users & RBAC visible
    await expect(page.locator('text=Users & RBAC').first()).toBeVisible();

    // 7. Verify Role Management visible
    await expect(page.locator('text=Role Management').first()).toBeVisible();

    // 8. Verify Manual visible
    await expect(page.locator('button:has-text("Manual")').first()).toBeVisible();

    // 9. Verify AI Copilot visible
    await expect(page.locator('button:has-text("AI Copilot")').first()).toBeVisible();

    // 10. Verify AI Autopilot visible
    await expect(page.locator('button:has-text("AI Autopilot")').first()).toBeVisible();

    // 11. Verify Governance visible
    await expect(page.locator('text=Governance').first()).toBeVisible();

    // 12. Verify AI Actions visible
    await expect(page.locator('text=AI Actions').first()).toBeVisible();

    // 13. Verify Create AI Proposal visible
    await expect(page.locator('button:has-text("Create AI Proposal")')).toBeVisible();

    // 14. Verify Review Approvals visible
    await expect(page.locator('a:has-text("Review Approvals")')).toBeVisible();

    // 15. Verify View Audit visible
    await expect(page.locator('a:has-text("View Audit")')).toBeVisible();
  });
});
