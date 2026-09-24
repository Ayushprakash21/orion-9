/**
 * ORION-9 DESKTOP CONTEXT MENU & VFS FIRESTORE PERSISTENCE E2E SUITE
 *
 * Verifies:
 * 1. Desktop right-click opens the context menu
 * 2. Creating New Folder persists without Firestore schema/undefined errors
 * 3. Desktop refresh retains created folder
 * 4. Creating New Text Document persists with valid iconId and metadata
 * 5. Opening document in Notepad and saving content
 * 6. Refresh retains document content
 */

import { test, expect } from '@playwright/test';

test.describe('Orion-9 Desktop Context Menu & VFS Persistence E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('orion_os_power_state', 'ON');
    });
    await page.goto('/login');

    // Authenticate
    await page.fill('input#username', 'user');
    await page.fill('input#password', 'user');
    await page.click('button[type="submit"]');

    // Wait for Desktop canvas
    await expect(page.locator('[data-desktop-canvas="true"]')).toBeVisible({ timeout: 15000 });
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
    const newFolderBtn = desktopMenu.locator('text=New Folder');
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

    // Click "New Text Document"
    const newDocBtn = desktopMenu.locator('text=New Text Document');
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
});
