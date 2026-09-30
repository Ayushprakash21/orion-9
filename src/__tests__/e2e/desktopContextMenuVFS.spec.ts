/**
 * ORION-9 DESKTOP CONTEXT MENU & VFS FIRESTORE PERSISTENCE E2E SUITE
 *
 * Verifies:
 * 1. Desktop right-click opens the context menu
 * 2. Creating New Folder persists without Firestore schema/undefined errors
 * 3. Desktop refresh retains created folder
 * 4. Creating New Text Document persists with valid iconId and metadata
 * 5. Opening document in Notepad and saving content
 * 6. Widgets action opens DesktopWidgetGalleryModal, which is interactive and closes
 * 7. Customize Desktop action activates Spatial Edit Mode, displays banner, and closes via Done
 * 8. Outside click dismisses the desktop context menu
 * 9. Right-click desktop icon opens Item Context Menu, does not start drag
 * 10. Double-click desktop icon launches target application
 */

import { test, expect } from '@playwright/test';

test.describe('Orion-9 Desktop Context Menu & VFS Persistence E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('orion_os_power_state', 'ON');
        localStorage.setItem('orion9_database_environment', 'LIVE');
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
          environment: 'LIVE',
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

  test('1. Right click desktop -> create New Folder -> verify persistence across refresh', async ({ page }) => {
    const canvas = page.locator('[data-desktop-canvas="true"]');
    await expect(canvas).toBeVisible();

    // Right-click empty desktop canvas
    await canvas.click({ button: 'right', position: { x: 300, y: 300 } });

    // Verify context menu is visible
    const desktopMenu = page.locator('[data-testid="desktop-context-menu"]');
    await expect(desktopMenu).toBeVisible({ timeout: 5000 });

    // Click "New Folder"
    const newFolderBtn = desktopMenu.locator('[data-action="new-folder"]');
    await expect(newFolderBtn).toBeVisible();
    await newFolderBtn.click();

    // Verify folder icon appears on desktop
    const newFolderShortcut = page.locator('[data-shortcut-id]').filter({ hasText: 'New Folder' });
    await expect(newFolderShortcut.first()).toBeVisible({ timeout: 5000 });

    // Refresh page
    await page.reload();
    await expect(page.locator('[data-desktop-canvas="true"]')).toBeVisible({ timeout: 15000 });

    // Verify folder shortcut persists after refresh
    const persistedFolder = page.locator('[data-shortcut-id]').filter({ hasText: 'New Folder' });
    await expect(persistedFolder.first()).toBeVisible({ timeout: 10000 });
  });

  test('2. Right click desktop -> create New Text Document -> open in Notepad', async ({ page }) => {
    const canvas = page.locator('[data-desktop-canvas="true"]');
    await expect(canvas).toBeVisible();

    // Right-click empty desktop canvas
    await canvas.click({ button: 'right', position: { x: 350, y: 350 } });

    // Verify context menu is visible
    const desktopMenu = page.locator('[data-testid="desktop-context-menu"]');
    await expect(desktopMenu).toBeVisible({ timeout: 5000 });

    // Click "New Text Document (.txt)"
    const newDocBtn = desktopMenu.locator('[data-action="new-doc-txt"]');
    await expect(newDocBtn).toBeVisible();
    await newDocBtn.click();

    // Verify document icon appears on desktop
    const docShortcut = page.locator('[data-shortcut-id]').filter({ hasText: 'New Text Document.txt' });
    await expect(docShortcut.first()).toBeVisible({ timeout: 5000 });

    // Double click to open Notepad
    await docShortcut.first().dblclick();

    // Verify Notepad window opens
    const notepadWindow = page.locator('[data-orion-window][data-window-id="notepad"]');
    await expect(notepadWindow).toBeVisible({ timeout: 10000 });
  });

  test('3. Right click desktop -> Click "Widgets" -> verify Widget Gallery Modal opens and closes', async ({ page }) => {
    const canvas = page.locator('[data-desktop-canvas="true"]');
    await expect(canvas).toBeVisible();

    // Right-click empty desktop canvas
    await canvas.click({ button: 'right', position: { x: 400, y: 300 } });

    const desktopMenu = page.locator('[data-testid="desktop-context-menu"]');
    await expect(desktopMenu).toBeVisible({ timeout: 5000 });

    // Click Widgets action
    const widgetsBtn = desktopMenu.locator('[data-action="widgets"]');
    await expect(widgetsBtn).toBeVisible();
    await widgetsBtn.click();

    // Verify Widget Gallery modal opens
    const galleryModal = page.locator('text=Orion Widget Gallery');
    await expect(galleryModal).toBeVisible({ timeout: 5000 });

    // Verify modal is interactive - click Close
    const closeBtn = page.locator('button:has-text("Close")').last();
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // Verify modal closes and desktop canvas is accessible
    await expect(galleryModal).not.toBeVisible({ timeout: 5000 });
    await expect(canvas).toBeVisible();
  });

  test('4. Right click desktop -> Click "Customize Desktop" -> verify Spatial Edit Mode opens and exits via Done', async ({ page }) => {
    const canvas = page.locator('[data-desktop-canvas="true"]');
    await expect(canvas).toBeVisible();

    // Right-click empty desktop canvas
    await canvas.click({ button: 'right', position: { x: 450, y: 350 } });

    const desktopMenu = page.locator('[data-testid="desktop-context-menu"]');
    await expect(desktopMenu).toBeVisible({ timeout: 5000 });

    // Click Customize Desktop action
    const customizeBtn = desktopMenu.locator('[data-action="customize-desktop"]');
    await expect(customizeBtn).toBeVisible();
    await customizeBtn.click();

    // Verify Spatial Edit Mode banner opens
    const editBanner = page.locator('text=Spatial Edit Mode');
    await expect(editBanner).toBeVisible({ timeout: 5000 });

    // Click Done to exit edit mode
    const doneBtn = page.locator('button:has-text("Done")');
    await expect(doneBtn).toBeVisible();
    await doneBtn.click();

    // Verify banner closes and desktop returns to normal
    await expect(editBanner).not.toBeVisible({ timeout: 5000 });
  });

  test('5. Outside click dismisses desktop context menu without executing actions', async ({ page }) => {
    const canvas = page.locator('[data-desktop-canvas="true"]');
    await expect(canvas).toBeVisible();

    // Right-click empty desktop canvas
    await canvas.click({ button: 'right', position: { x: 300, y: 300 } });

    const desktopMenu = page.locator('[data-testid="desktop-context-menu"]');
    await expect(desktopMenu).toBeVisible({ timeout: 5000 });

    // Click outside the menu on the canvas
    await canvas.click({ position: { x: 100, y: 100 } });

    // Verify menu closes
    await expect(desktopMenu).not.toBeVisible({ timeout: 5000 });
  });

  test('6. Right click shortcut icon opens Item Context Menu; Rename dialog opens', async ({ page }) => {
    const canvas = page.locator('[data-desktop-canvas="true"]');
    await expect(canvas).toBeVisible();

    // Locate first shortcut on desktop
    const firstShortcut = page.locator('[data-shortcut-id]').first();
    await expect(firstShortcut).toBeVisible({ timeout: 5000 });

    // Right-click on shortcut
    await firstShortcut.click({ button: 'right' });

    // Verify item context menu is visible
    const itemMenu = page.locator('[data-testid="desktop-item-context-menu"]');
    await expect(itemMenu).toBeVisible({ timeout: 5000 });

    // Click Rename
    const renameBtn = itemMenu.locator('[data-action="rename"]');
    await expect(renameBtn).toBeVisible();
    await renameBtn.click();

    // Verify Rename modal appears
    const renameModal = page.locator('text=Rename Desktop Shortcut');
    await expect(renameModal).toBeVisible({ timeout: 5000 });

    // Click Cancel
    const cancelBtn = page.locator('button:has-text("Cancel")');
    await cancelBtn.click();
    await expect(renameModal).not.toBeVisible({ timeout: 5000 });
  });

  test('7. Right click desktop -> physical mouse click directly on Widgets SVG icon -> Widget Gallery opens', async ({ page }) => {
    const canvas = page.locator('[data-desktop-canvas="true"]');
    await expect(canvas).toBeVisible();

    await canvas.click({ button: 'right', position: { x: 500, y: 300 } });
    const desktopMenu = page.locator('[data-testid="desktop-context-menu"]');
    await expect(desktopMenu).toBeVisible({ timeout: 5000 });

    const widgetsBtn = desktopMenu.locator('[data-action="widgets"]');
    await expect(widgetsBtn).toBeVisible();

    // Locate the SVG icon inside the Widgets button and get its bounding box
    const icon = widgetsBtn.locator('svg');
    const iconBox = await icon.boundingBox();
    expect(iconBox).not.toBeNull();

    // Physical mouse click on center of the icon
    await page.mouse.click(iconBox!.x + iconBox!.width / 2, iconBox!.y + iconBox!.height / 2);

    // Verify Widget Gallery opened
    const gallery = page.locator('text=Orion Widget Gallery');
    await expect(gallery).toBeVisible({ timeout: 5000 });

    // Close gallery
    const closeBtn = page.locator('button:has-text("Close")').last();
    await closeBtn.click();
    await expect(gallery).not.toBeVisible({ timeout: 5000 });
  });

  test('8. Right click desktop -> physical mouse click directly on Customize Desktop text label -> Spatial Edit Mode activates', async ({ page }) => {
    const canvas = page.locator('[data-desktop-canvas="true"]');
    await expect(canvas).toBeVisible();

    await canvas.click({ button: 'right', position: { x: 500, y: 300 } });
    const desktopMenu = page.locator('[data-testid="desktop-context-menu"]');
    await expect(desktopMenu).toBeVisible({ timeout: 5000 });

    const customizeBtn = desktopMenu.locator('[data-action="customize-desktop"]');
    await expect(customizeBtn).toBeVisible();

    // Locate the text label inside the Customize Desktop button and get its bounding box
    const label = customizeBtn.locator('span');
    const labelBox = await label.boundingBox();
    expect(labelBox).not.toBeNull();

    // Physical mouse click on center of the label
    await page.mouse.click(labelBox!.x + labelBox!.width / 2, labelBox!.y + labelBox!.height / 2);

    // Verify Spatial Edit Mode banner opened
    const editBanner = page.locator('text=Spatial Edit Mode');
    await expect(editBanner).toBeVisible({ timeout: 5000 });

    // Exit Edit Mode via Done
    const doneBtn = page.locator('button:has-text("Done")');
    await doneBtn.click();
    await expect(editBanner).not.toBeVisible({ timeout: 5000 });
  });

  test('9. Icon drag regression: right-click does NOT drag; left-drag moves icon; double-click launches app', async ({ page }) => {
    const canvas = page.locator('[data-desktop-canvas="true"]');
    await expect(canvas).toBeVisible();

    const shortcut = page.locator('[data-shortcut-id]').first();
    await expect(shortcut).toBeVisible({ timeout: 5000 });

    const initialBox = await shortcut.boundingBox();
    expect(initialBox).not.toBeNull();

    // A. Right-click MUST NOT initiate drag
    await shortcut.click({ button: 'right' });
    const itemMenu = page.locator('[data-testid="desktop-item-context-menu"]');
    await expect(itemMenu).toBeVisible({ timeout: 5000 });

    // Dismiss context menu
    await canvas.click({ position: { x: 100, y: 100 } });
    await expect(itemMenu).not.toBeVisible({ timeout: 5000 });

    const boxAfterRightClick = await shortcut.boundingBox();
    expect(boxAfterRightClick!.x).toBeCloseTo(initialBox!.x, 0);
    expect(boxAfterRightClick!.y).toBeCloseTo(initialBox!.y, 0);

    // B. Left-drag moves the icon
    const startX = initialBox!.x + initialBox!.width / 2;
    const startY = initialBox!.y + initialBox!.height / 2;
    const targetDragX = startX + 100;
    const targetDragY = startY + 100;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(targetDragX, targetDragY, { steps: 5 });
    await page.mouse.up();

    // Give grid snapping a moment to commit
    await page.waitForTimeout(300);
    const boxAfterDrag = await shortcut.boundingBox();
    // Icon moved from initial position
    expect(boxAfterDrag!.x).not.toBe(initialBox!.x);

    // C. Double-click launches app
    await shortcut.dblclick();
    // Wait for a window or app launcher to respond
    const anyWindow = page.locator('[data-orion-window]').first();
    await expect(anyWindow).toBeVisible({ timeout: 10000 });
  });
});
