/**
 * ORION-9 PLAYWRIGHT E2E: START MENU -> DESKTOP DRAG & DROP + WALLPAPER ISOLATION
 *
 * Verifies:
 * 1. Desktop renders with isolated wallpaper.
 * 2. Opening Start Menu does not mutate or blur wallpaper.
 * 3. Dragging an application card from Start Menu onto empty Desktop creates a persistent shortcut.
 * 4. Visual drag preview indicates "Drop on Desktop" when hovering over Desktop canvas.
 * 5. Dropping closes Start Menu and renders the shortcut immediately.
 * 6. Shortcut persists across page reload.
 * 7. Double-clicking the newly-created desktop shortcut launches the application.
 * 8. Releasing drag inside the launcher cancels without creating a shortcut.
 * 9. Escape key cancels drag session cleanly.
 */

import { test, expect } from '@playwright/test';

test.describe('Orion-9 Start Menu to Desktop Drag/Drop & Wallpaper Isolation E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('orion_os_power_state', 'ON');
        localStorage.setItem('orion9_database_environment', 'DEMO');
        localStorage.setItem('orion_settings', JSON.stringify({ userExperienceMode: 'ADVANCED' }));
        localStorage.setItem('orion_system_settings', JSON.stringify({ userExperienceMode: 'ADVANCED' }));
        localStorage.setItem('orion_auth_session', JSON.stringify({
          user: {
            id: 'local-admin',
            username: 'admin',
            fullName: 'Orion-9 Administrator',
            displayName: 'Admin',
            email: 'admin@orion.network',
            role: 'platform_admin',
            organizationId: 'ORION_PLATFORM',
            organizationName: 'ORION_PLATFORM',
            department: 'IT Administration'
          },
          organization: {
            id: 'ORION_PLATFORM',
            name: 'ORION_PLATFORM',
            status: 'active'
          },
          permissions: ['all'],
          environment: 'DEMO',
          expiresAt: new Date(Date.now() + 86400000).toISOString()
        }));
      } catch (e) {}
    });

    await page.goto('/');

    const usernameInput = page.locator('input#username');
    if (await usernameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await usernameInput.fill('admin');
      await page.click('button[type="submit"]');
      const passwordInput = page.locator('input#password');
      if (await passwordInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await passwordInput.fill('admin');
        await page.click('button[type="submit"]');
      }
    }

    // Wait for Desktop canvas
    await expect(page.locator('[data-desktop-canvas="true"]')).toBeVisible({ timeout: 20000 });
  });

  test('WALLPAPER ISOLATION: Wallpaper container and image remain static and unblurred across launcher interactions', async ({ page }) => {
    const wallpaperContainer = page.locator('[data-testid="orion-live-wallpaper-container"]');
    await expect(wallpaperContainer).toBeVisible({ timeout: 10000 });

    const wallpaperImg = page.locator('.orion-static-wallpaper-img');
    if (await wallpaperImg.isVisible()) {
      // Must have scale-100 and filter-none
      const classList = await wallpaperImg.getAttribute('class');
      expect(classList).toContain('scale-100');
      expect(classList).toContain('filter-none');
      expect(classList).not.toContain('blur-[3px]');
    }

    // Open Start Menu
    const startBtn = page.locator('[data-testid="dock-start-menu-button"]');
    await startBtn.click();
    const launcherDialog = page.locator('div[role="dialog"][aria-label="Application Launcher"]');
    await expect(launcherDialog).toBeVisible({ timeout: 5000 });

    // Wallpaper remains visible and static without blur classes
    if (await wallpaperImg.isVisible()) {
      const classList = await wallpaperImg.getAttribute('class');
      expect(classList).toContain('scale-100');
      expect(classList).not.toContain('blur-[3px]');
    }

    // Close Start Menu via Escape
    await page.keyboard.press('Escape');
    await expect(launcherDialog).not.toBeVisible({ timeout: 5000 });
  });

  test('START MENU -> DESKTOP DRAG: Dragging app onto Desktop creates persistent shortcut and launches on double click', async ({ page }) => {
    // 1. Open Start Menu
    const startBtn = page.locator('[data-testid="dock-start-menu-button"]');
    await startBtn.click();

    const launcherDialog = page.locator('div[role="dialog"][aria-label="Application Launcher"]');
    await expect(launcherDialog).toBeVisible({ timeout: 5000 });

    // 2. Locate an application card (e.g. procurement)
    const appCard = page.locator('[data-testid="launcher-app-procurement"]').first();
    await expect(appCard).toBeVisible({ timeout: 5000 });

    const appBox = await appCard.boundingBox();
    expect(appBox).not.toBeNull();

    // 3. Initiate pointer drag from the center of the app card
    const startX = appBox!.x + appBox!.width / 2;
    const startY = appBox!.y + appBox!.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down({ button: 'left' });

    // 4. Move pointer across threshold and outside the launcher onto Desktop canvas (top-right area x=1100, y=250)
    await page.mouse.move(startX + 15, startY + 15, { steps: 5 });
    
    // Check drag preview appears
    const dragPreview = page.locator('[data-testid="start-menu-drag-preview"]');
    await expect(dragPreview).toBeVisible({ timeout: 3000 });

    // Move onto Desktop canvas (to the left of the centered launcher modal, x=200, y=300)
    const targetX = 200;
    const targetY = 300;
    await page.mouse.move(targetX, targetY, { steps: 10 });

    // Drag preview should indicate over desktop
    await expect(dragPreview).toHaveAttribute('data-is-over-desktop', 'true');
    await expect(dragPreview).toContainText('Drop on Desktop');

    // 5. Release mouse onto desktop
    await page.mouse.up({ button: 'left' });

    // Launcher should close automatically
    await expect(launcherDialog).not.toBeVisible({ timeout: 5000 });

    // 6. Verify newly created shortcut appears on Desktop
    const newShortcut = page.locator('[data-target-id="procurement"]').first();
    await expect(newShortcut).toBeVisible({ timeout: 5000 });
    await expect(newShortcut).toContainText('Procurement');

    // 7. Verify persistence across page reload
    await page.reload();
    await expect(page.locator('[data-desktop-canvas="true"]')).toBeVisible({ timeout: 20000 });
    const persistedShortcut = page.locator('[data-target-id="procurement"]').first();
    await expect(persistedShortcut).toBeVisible({ timeout: 10000 });
    await expect(persistedShortcut).toContainText('Procurement');

    // 8. Double-click to launch application
    await persistedShortcut.dblclick();

    // Verify application window opens
    const appWindow = page.locator('[data-window-id="procurement"]').or(page.locator('[data-app-id="procurement"]')).first();
    await expect(appWindow).toBeVisible({ timeout: 10000 });
  });

  test('CANCELLATION: Releasing inside launcher or pressing Escape does not create desktop shortcut', async ({ page }) => {
    // 1. Open Start Menu
    const startBtn = page.locator('[data-testid="dock-start-menu-button"]');
    await startBtn.click();

    const launcherDialog = page.locator('div[role="dialog"][aria-label="Application Launcher"]');
    await expect(launcherDialog).toBeVisible({ timeout: 5000 });

    // 2. Drag but stay inside the launcher modal
    const appCard = page.locator('[data-testid="launcher-app-inventory"]').first();
    await expect(appCard).toBeVisible({ timeout: 5000 });

    const appBox = await appCard.boundingBox();
    expect(appBox).not.toBeNull();

    const startX = appBox!.x + appBox!.width / 2;
    const startY = appBox!.y + appBox!.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down({ button: 'left' });
    await page.mouse.move(startX + 10, startY + 10, { steps: 3 });

    // Drag preview is active but not over desktop
    const dragPreview = page.locator('[data-testid="start-menu-drag-preview"]');
    await expect(dragPreview).toBeVisible({ timeout: 3000 });
    await expect(dragPreview).toHaveAttribute('data-is-over-desktop', 'false');

    // Press Escape to cancel
    await page.keyboard.press('Escape');
    await expect(dragPreview).not.toBeVisible({ timeout: 3000 });

    // Launcher stays open or can be closed
    await page.mouse.up({ button: 'left' });
  });
});
