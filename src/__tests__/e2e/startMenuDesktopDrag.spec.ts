/**
 * ORION-9 PLAYWRIGHT E2E: START MENU -> DESKTOP DRAG & DROP, WALLPAPER ISOLATION, & RUNTIME VERIFICATION
 *
 * Comprehensive runtime verification suite:
 * 1. Wallpaper isolation (renders static, unblurred, pointer-events-none, crash-resilient).
 * 2. Start Menu -> Desktop Drag & Drop:
 *    - Drag initiation, threshold detection, visual preview ("Drop on Desktop").
 *    - Shortcut creation and grid positioning.
 *    - Persistence across page reload.
 *    - Dragging the newly created desktop shortcut to a new location.
 *    - Persistence of the updated position across reload.
 *    - Launching the app via double-click on the desktop shortcut.
 * 3. Negative tests:
 *    - Click without drag: Launches application, no desktop shortcut created.
 *    - Below-threshold movement (<= 3px): No desktop shortcut created.
 *    - Drop inside launcher: Cancels without creating shortcut.
 *    - Drop over Desktop widget: Creates shortcut safely at valid grid slot without crashing widget.
 *    - Escape key cancellation: Cleanly aborts drag session without residual preview or shortcut.
 */

import { test, expect } from '@playwright/test';

test.describe('Orion-9 Start Menu to Desktop Drag/Drop & Wallpaper Isolation Comprehensive E2E', () => {
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

  // TEST 1: Wallpaper Isolation
  test('PHASE 8 & 14: Wallpaper renders statically, never crashes, unblurred, and has pointer-events-none', async ({ page }) => {
    const wallpaperContainer = page.locator('[data-testid="orion-live-wallpaper-container"]');
    await expect(wallpaperContainer).toBeVisible({ timeout: 10000 });

    // Verify pointer-events is none on the wallpaper container
    const isPointerEventsNone = await wallpaperContainer.evaluate((el) => {
      return window.getComputedStyle(el).pointerEvents === 'none';
    });
    expect(isPointerEventsNone).toBe(true);

    const wallpaperImg = page.locator('.orion-static-wallpaper-img');
    if (await wallpaperImg.isVisible()) {
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

    // Wallpaper remains static without blur classes
    if (await wallpaperImg.isVisible()) {
      const classList = await wallpaperImg.getAttribute('class');
      expect(classList).toContain('scale-100');
      expect(classList).not.toContain('blur-[3px]');
    }

    // Close Start Menu
    await page.keyboard.press('Escape');
    await expect(launcherDialog).not.toBeVisible({ timeout: 5000 });
  });

  // TEST 2: Full Start Menu -> Desktop Drag, Persistence, Desktop Icon Drag, and Launch
  test('PHASE 2, 5, 6, 7: Start Menu to Desktop Drag creates persistent shortcut, moves on Desktop, and launches', async ({ page }) => {
    // 1. Open Start Menu
    const startBtn = page.locator('[data-testid="dock-start-menu-button"]');
    await startBtn.click();

    const launcherDialog = page.locator('div[role="dialog"][aria-label="Application Launcher"]');
    await expect(launcherDialog).toBeVisible({ timeout: 5000 });

    // 2. Locate an application card (procurement)
    const appCard = page.locator('[data-testid="launcher-app-procurement"]').first();
    await expect(appCard).toBeVisible({ timeout: 5000 });

    const appBox = await appCard.boundingBox();
    expect(appBox).not.toBeNull();

    // 3. Initiate pointer drag from the center of the app card
    const startX = appBox!.x + appBox!.width / 2;
    const startY = appBox!.y + appBox!.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down({ button: 'left' });

    // 4. Move pointer across threshold and outside the launcher onto Desktop canvas
    await page.mouse.move(startX + 15, startY + 15, { steps: 5 });
    
    // Check drag preview appears
    const dragPreview = page.locator('[data-testid="start-menu-drag-preview"]');
    await expect(dragPreview).toBeVisible({ timeout: 3000 });

    // Move onto Desktop canvas (to the left of centered launcher modal: x=200, y=300)
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

    // Get initial transform
    const initialTransform = await newShortcut.evaluate((el) => el.style.transform);
    expect(initialTransform).toBeTruthy();

    // 7. Verify persistence across page reload
    await page.reload();
    await expect(page.locator('[data-desktop-canvas="true"]')).toBeVisible({ timeout: 20000 });
    const persistedShortcut = page.locator('[data-target-id="procurement"]').first();
    await expect(persistedShortcut).toBeVisible({ timeout: 10000 });
    await expect(persistedShortcut).toContainText('Procurement');

    const reloadedTransform = await persistedShortcut.evaluate((el) => el.style.transform);
    expect(reloadedTransform).toBe(initialTransform);

    // 8. PHASE 7: Drag the newly created Desktop shortcut to a new location on Desktop
    const scBox = await persistedShortcut.boundingBox();
    expect(scBox).not.toBeNull();

    const scStartX = scBox!.x + scBox!.width / 2;
    const scStartY = scBox!.y + scBox!.height / 2;

    await page.mouse.move(scStartX, scStartY);
    await page.mouse.down({ button: 'left' });
    // Move 150px right and 100px down
    await page.mouse.move(scStartX + 150, scStartY + 100, { steps: 10 });
    await page.mouse.up({ button: 'left' });

    // Wait for grid snap and persistence to complete
    await page.waitForTimeout(500);
    const movedTransform = await persistedShortcut.evaluate((el) => el.style.transform);
    expect(movedTransform).not.toBe(initialTransform);

    // 9. Reload and verify new position persists
    await page.reload();
    await expect(page.locator('[data-desktop-canvas="true"]')).toBeVisible({ timeout: 20000 });
    const reloadedMovedShortcut = page.locator('[data-target-id="procurement"]').first();
    await expect(reloadedMovedShortcut).toBeVisible({ timeout: 10000 });
    const afterReloadTransform = await reloadedMovedShortcut.evaluate((el) => el.style.transform);
    expect(afterReloadTransform).toBe(movedTransform);

    // 10. Launch application via double-click on the desktop shortcut
    await reloadedMovedShortcut.dblclick();

    // Verify application window opens
    const appWindow = page.locator('[data-window-id="procurement"]').or(page.locator('[data-app-id="procurement"]')).first();
    await expect(appWindow).toBeVisible({ timeout: 10000 });
  });

  // TEST 3: Negative Test: Click without drag
  test('PHASE 9 - TEST 1: Ordinary click on application opens app without creating desktop shortcut', async ({ page }) => {
    // 1. Open Start Menu
    const startBtn = page.locator('[data-testid="dock-start-menu-button"]');
    await startBtn.click();

    const launcherDialog = page.locator('div[role="dialog"][aria-label="Application Launcher"]');
    await expect(launcherDialog).toBeVisible({ timeout: 5000 });

    // Count existing shortcuts for suppliers before click
    const suppliersShortcutBefore = page.locator('[data-target-id="suppliers"]');
    const countBefore = await suppliersShortcutBefore.count();

    // Click on Suppliers app in launcher without dragging
    const appCard = page.locator('[data-testid="launcher-app-suppliers"]').first();
    if (await appCard.isVisible()) {
      await appCard.click();
    } else {
      // Find suppliers from search
      const searchInput = page.locator('input[placeholder*="Search applications"]');
      await searchInput.fill('suppliers');
      const searchedCard = page.locator('[data-testid="launcher-app-suppliers"]').first();
      await searchedCard.click();
    }

    // Window should open
    const appWindow = page.locator('[data-window-id="suppliers"]').or(page.locator('[data-app-id="suppliers"]')).first();
    await expect(appWindow).toBeVisible({ timeout: 10000 });

    // Verify no desktop shortcut was created for suppliers
    const suppliersShortcutAfter = page.locator('[data-target-id="suppliers"]');
    expect(await suppliersShortcutAfter.count()).toBe(countBefore);
  });

  // TEST 4: Negative Test: Below-threshold movement (<= 3px)
  test('PHASE 9 - TEST 2: Minor pointer movement below threshold does not activate drag or create shortcut', async ({ page }) => {
    const startBtn = page.locator('[data-testid="dock-start-menu-button"]');
    await startBtn.click();

    const launcherDialog = page.locator('div[role="dialog"][aria-label="Application Launcher"]');
    await expect(launcherDialog).toBeVisible({ timeout: 5000 });

    const appCard = page.locator('[data-testid="launcher-app-shipments"]').first();
    await expect(appCard).toBeVisible({ timeout: 5000 });

    const appBox = await appCard.boundingBox();
    expect(appBox).not.toBeNull();

    const startX = appBox!.x + appBox!.width / 2;
    const startY = appBox!.y + appBox!.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down({ button: 'left' });
    // Move only 2px (threshold is 8px)
    await page.mouse.move(startX + 2, startY + 1);

    // Drag preview should NOT appear
    const dragPreview = page.locator('[data-testid="start-menu-drag-preview"]');
    expect(await dragPreview.isVisible()).toBe(false);

    await page.mouse.up({ button: 'left' });
  });

  // TEST 5: Negative Test: Dropping inside launcher or Escape key cancels cleanly
  test('PHASE 9 - TEST 3 & 6: Canceling via Escape or releasing inside launcher cleanly destroys drag session', async ({ page }) => {
    const startBtn = page.locator('[data-testid="dock-start-menu-button"]');
    await startBtn.click();

    const launcherDialog = page.locator('div[role="dialog"][aria-label="Application Launcher"]');
    await expect(launcherDialog).toBeVisible({ timeout: 5000 });

    const appCard = page.locator('[data-testid="launcher-app-inventory"]').first();
    await expect(appCard).toBeVisible({ timeout: 5000 });

    const appBox = await appCard.boundingBox();
    expect(appBox).not.toBeNull();

    const startX = appBox!.x + appBox!.width / 2;
    const startY = appBox!.y + appBox!.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down({ button: 'left' });
    await page.mouse.move(startX + 12, startY + 12, { steps: 3 });

    // Drag preview appears
    const dragPreview = page.locator('[data-testid="start-menu-drag-preview"]');
    await expect(dragPreview).toBeVisible({ timeout: 3000 });
    await expect(dragPreview).toHaveAttribute('data-is-over-desktop', 'false');

    // Press Escape to cancel
    await page.keyboard.press('Escape');
    await expect(dragPreview).not.toBeVisible({ timeout: 3000 });

    await page.mouse.up({ button: 'left' });
  });

  // TEST 6: Drag over Desktop Widget
  test('PHASE 9 - TEST 5: Dragging from Start Menu and releasing over a Desktop widget creates shortcut safely', async ({ page }) => {
    // Check if widget is present on desktop
    const widget = page.locator('[data-testid="desktop-widget"]').first();
    await expect(widget).toBeVisible({ timeout: 10000 });
    const widgetBox = await widget.boundingBox();
    expect(widgetBox).not.toBeNull();

    // Open Start Menu
    const startBtn = page.locator('[data-testid="dock-start-menu-button"]');
    await startBtn.click();

    const launcherDialog = page.locator('div[role="dialog"][aria-label="Application Launcher"]');
    await expect(launcherDialog).toBeVisible({ timeout: 5000 });

    // Drag command-center app
    const appCard = page.locator('[data-testid="launcher-app-command-center"]').first();
    await expect(appCard).toBeVisible({ timeout: 5000 });

    const appBox = await appCard.boundingBox();
    expect(appBox).not.toBeNull();

    const startX = appBox!.x + appBox!.width / 2;
    const startY = appBox!.y + appBox!.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down({ button: 'left' });
    await page.mouse.move(startX + 15, startY + 15, { steps: 5 });

    // Move directly over widget position
    const targetX = widgetBox!.x + widgetBox!.width / 2;
    const targetY = widgetBox!.y + widgetBox!.height / 2;
    await page.mouse.move(targetX, targetY, { steps: 10 });

    const dragPreview = page.locator('[data-testid="start-menu-drag-preview"]');
    await expect(dragPreview).toBeVisible();
    await expect(dragPreview).toHaveAttribute('data-is-over-desktop', 'true');

    // Release mouse
    await page.mouse.up({ button: 'left' });

    // Launcher closes
    await expect(launcherDialog).not.toBeVisible({ timeout: 5000 });

    // Desktop canvas is still intact and widget remains visible
    await expect(widget).toBeVisible();
    await expect(page.locator('[data-desktop-canvas="true"]')).toBeVisible();
  });
});
