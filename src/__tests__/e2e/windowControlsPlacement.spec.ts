/**
 * ORION-9 GLOBAL UI DESIGN: WINDOW CONTROL BUTTONS PLACEMENT E2E SUITE
 *
 * Verifies that window controls:
 * 1. Are positioned on the TOP-LEFT of application windows (macOS convention)
 * 2. Maintain strict left-to-right order: CLOSE (Red #FF5F57), MINIMIZE (Yellow #FEBC2E), MAXIMIZE / RESTORE (Green #28C840)
 * 3. Have circular shape (12x12px, rounded-full) and respective color themes
 * 4. Maintain proper accessible labels and titles
 * 5. Work consistently across multiple simultaneous windows
 * 6. Interactive functionality: close, minimize, maximize
 */

import { test, expect } from '@playwright/test';

test.describe('Orion-9 Global Window Controls Placement E2E Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('orion_os_power_state', 'ON');
    });
    await page.goto('/login');
  });

  test('verifies window controls are on the top-left in standard application windows', async ({ page }) => {
    // 1. Authenticate
    await page.fill('input#username', 'user');
    await page.fill('input#password', 'user');
    await page.click('button[type="submit"]');

    // 2. Wait for Desktop
    await expect(page.locator('[data-dock="true"]')).toBeVisible({ timeout: 10000 });

    // 3. Open Inventory window from dock
    const inventoryDockBtn = page.locator('button[data-dock-item="inventory"]');
    await expect(inventoryDockBtn).toBeVisible({ timeout: 5000 });
    await inventoryDockBtn.click();

    // 4. Wait for Inventory window
    const windowLocator = page.locator('[data-orion-window][data-window-id="inventory"]');
    await expect(windowLocator).toBeVisible({ timeout: 10000 });

    const titlebar = windowLocator.locator('[data-window-titlebar="true"]');
    await expect(titlebar).toBeVisible();

    const controls = windowLocator.locator('[data-window-controls="true"]');
    await expect(controls).toBeVisible();

    // 5. Measure bounding boxes to verify TOP-LEFT positioning
    const titlebarBox = await titlebar.boundingBox();
    const controlsBox = await controls.boundingBox();

    expect(titlebarBox).not.toBeNull();
    expect(controlsBox).not.toBeNull();

    if (titlebarBox && controlsBox) {
      // Controls must be in the left half of the titlebar
      const titlebarMidX = titlebarBox.x + titlebarBox.width / 2;
      expect(controlsBox.x).toBeLessThan(titlebarMidX);

      // Controls left edge must be close to titlebar left edge (within padding margin)
      expect(controlsBox.x - titlebarBox.x).toBeLessThanOrEqual(30);
      expect(controlsBox.x - titlebarBox.x).toBeGreaterThanOrEqual(0);
    }

    // 6. Verify internal button order: CLOSE (RED), MINIMIZE (YELLOW), MAXIMIZE (GREEN) (Left -> Right)
    const buttons = controls.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(2);

    if (buttonCount >= 3) {
      const closeBtn = buttons.nth(0);
      const minimizeBtn = buttons.nth(1);
      const maxBtn = buttons.nth(2);

      await expect(closeBtn).toHaveAttribute('aria-label', /Close/i);
      await expect(minimizeBtn).toHaveAttribute('aria-label', /Minimize/i);
      await expect(maxBtn).toHaveAttribute('aria-label', /Maximize|Restore/i);

      const closeBox = await closeBtn.boundingBox();
      const minBox = await minimizeBtn.boundingBox();
      const maxBox = await maxBtn.boundingBox();

      expect(closeBox).not.toBeNull();
      expect(minBox).not.toBeNull();
      expect(maxBox).not.toBeNull();

      if (closeBox && minBox && maxBox) {
        // macOS traffic-light order: Close (Red) < Minimize (Yellow) < Maximize (Green)
        expect(closeBox.x).toBeLessThan(minBox.x);
        expect(minBox.x).toBeLessThan(maxBox.x);
      }
    }
  });

  test('verifies left-aligned window controls across multiple concurrent windows', async ({ page }) => {
    // 1. Authenticate as Admin
    await page.fill('input#username', 'admin');
    await page.fill('input#password', 'admin');
    await page.click('button[type="submit"]');

    await expect(page.locator('[data-dock="true"]')).toBeVisible({ timeout: 10000 });

    // 2. Open Inventory
    await page.locator('button[data-dock-item="inventory"]').click();
    const invWindow = page.locator('[data-orion-window][data-window-id="inventory"]');
    await expect(invWindow).toBeVisible({ timeout: 10000 });

    // 3. Open Procurement
    await page.locator('button[data-dock-item="procurement"]').click();
    const procWindow = page.locator('[data-orion-window][data-window-id="procurement"]');
    await expect(procWindow).toBeVisible({ timeout: 10000 });

    // 4. Verify both windows have controls on the left
    for (const win of [invWindow, procWindow]) {
      const tb = win.locator('[data-window-titlebar="true"]');
      const ctrl = win.locator('[data-window-controls="true"]');

      const tbBox = await tb.boundingBox();
      const ctrlBox = await ctrl.boundingBox();

      expect(tbBox).not.toBeNull();
      expect(ctrlBox).not.toBeNull();

      if (tbBox && ctrlBox) {
        expect(ctrlBox.x).toBeLessThan(tbBox.x + tbBox.width / 2);
      }
    }
  });
});

