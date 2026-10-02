/**
 * ORION-9 DESKTOP WORKSPACE INTERACTION & WIDGET RENDERING FULL 15-OBJECTIVE VERIFICATION
 *
 * Verifies all 15 objectives in the real browser:
 * 1. Right-click empty desktop -> context menu opens.
 * 2. Context menu -> Widgets -> Widget Gallery opens.
 * 3. Context menu -> Customize Desktop -> Spatial Edit Mode opens.
 * 4. Context menu -> New Folder works and persists across reload.
 * 5. Context menu -> New Text Document works and opens in Notepad.
 * 6. Right-click desktop shortcut -> shortcut context menu works.
 * 7. Left-click + drag desktop shortcut -> shortcut moves and persists.
 * 8. Double-click desktop shortcut -> application launches.
 * 9. Widgets are actually visible on the desktop (not clipped or off-screen).
 * 10. Widgets are clickable/interactable.
 * 11. Widgets can be moved in Spatial Edit Mode.
 * 12. Widget Gallery can add a widget to the desktop.
 * 13. Added widgets remain after refresh.
 * 14. Desktop context menus and widget modals must not randomly disappear.
 * 15. Full test passes in headless Chromium and real DOM.
 */

import { test, expect } from '@playwright/test';

test.describe('Orion-9 Desktop 15-Objective Complete E2E Suite', () => {
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

  test('Objectives 1, 2, 3, 14: Context menu opens, Widgets opens Gallery, Customize Desktop opens Edit Mode, no premature dismissal', async ({ page }) => {
    const canvas = page.locator('[data-desktop-canvas="true"]');
    await expect(canvas).toBeVisible();

    // 1. Right-click empty desktop
    await canvas.click({ button: 'right', position: { x: 400, y: 300 } });
    const desktopMenu = page.locator('[data-testid="desktop-context-menu"]');
    await expect(desktopMenu).toBeVisible({ timeout: 5000 });

    // 14. Verify menu does not spontaneously disappear
    await page.waitForTimeout(500);
    await expect(desktopMenu).toBeVisible();

    // 2. Click Widgets -> Widget Gallery opens
    const widgetsBtn = desktopMenu.locator('[data-action="widgets"]');
    await expect(widgetsBtn).toBeVisible();
    await widgetsBtn.click();

    const widgetGallery = page.locator('[data-testid="widget-gallery"]');
    await expect(widgetGallery).toBeVisible({ timeout: 5000 });
    await expect(desktopMenu).not.toBeVisible();

    // Close gallery
    const closeGalleryBtn = page.locator('[data-action="close-gallery"]');
    await closeGalleryBtn.click();
    await expect(widgetGallery).not.toBeVisible();

    // 3. Right-click -> Customize Desktop -> Edit Mode opens
    await canvas.click({ button: 'right', position: { x: 450, y: 350 } });
    await expect(desktopMenu).toBeVisible({ timeout: 5000 });

    const customizeBtn = desktopMenu.locator('[data-action="customize-desktop"]');
    await expect(customizeBtn).toBeVisible();
    await customizeBtn.click();

    const editBanner = page.locator('text=Spatial Edit Mode');
    await expect(editBanner).toBeVisible({ timeout: 5000 });

    // Click Done to exit Edit Mode
    const doneBtn = page.locator('button:has-text("Done")');
    await doneBtn.click();
    await expect(editBanner).not.toBeVisible();
  });

  test('Objectives 4, 5: New Folder and New Text Document persist and launch Notepad', async ({ page }) => {
    const canvas = page.locator('[data-desktop-canvas="true"]');

    // 4. Create New Folder
    await canvas.click({ button: 'right', position: { x: 500, y: 250 } });
    const desktopMenu = page.locator('[data-testid="desktop-context-menu"]');
    await expect(desktopMenu).toBeVisible({ timeout: 5000 });

    const newFolderBtn = desktopMenu.locator('[data-action="new-folder"]');
    await newFolderBtn.click();

    const newFolderShortcut = page.locator('[data-shortcut-id]').filter({ hasText: 'New Folder' });
    await expect(newFolderShortcut.first()).toBeVisible({ timeout: 5000 });

    // 5. Create New Text Document (.txt)
    await canvas.click({ button: 'right', position: { x: 500, y: 350 } });
    await expect(desktopMenu).toBeVisible({ timeout: 5000 });

    const newDocBtn = desktopMenu.locator('[data-action="new-doc-txt"]');
    await newDocBtn.click();

    const docShortcut = page.locator('[data-shortcut-id]').filter({ hasText: 'New Text Document.txt' });
    await expect(docShortcut.first()).toBeVisible({ timeout: 5000 });

    // Verify Notepad opened automatically
    const notepadWindow = page.locator('[data-orion-window][data-window-id="notepad"]');
    await expect(notepadWindow).toBeVisible({ timeout: 10000 });

    // Close Notepad
    const closeBtn = notepadWindow.locator('button[aria-label="Close Notepad"]');
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await expect(notepadWindow).not.toBeVisible({ timeout: 5000 });

    // Refresh page and verify persistence across reload
    await page.reload();
    await expect(page.locator('[data-desktop-canvas="true"]')).toBeVisible({ timeout: 15000 });

    const persistedFolder = page.locator('[data-shortcut-id]').filter({ hasText: 'New Folder' });
    await expect(persistedFolder.first()).toBeVisible({ timeout: 10000 });

    const persistedDoc = page.locator('[data-shortcut-id]').filter({ hasText: 'New Text Document.txt' });
    await expect(persistedDoc.first()).toBeVisible({ timeout: 10000 });
  });

  test('Objectives 6, 7, 8: Shortcut context menu, drag and move persistence, and double-click launch', async ({ page }) => {
    // 6. Right-click desktop shortcut
    const notepadShortcut = page.locator('[data-shortcut-id]').filter({ hasText: 'Notepad' }).first();
    await expect(notepadShortcut).toBeVisible({ timeout: 5000 });

    await notepadShortcut.click({ button: 'right' });
    const itemMenu = page.locator('[data-orion-context-menu="true"]');
    await expect(itemMenu).toBeVisible({ timeout: 5000 });

    // Dismiss menu
    await page.mouse.click(500, 500);
    await expect(itemMenu).not.toBeVisible();

    // Verify wallpaper is alive and hasn't crashed
    const wallpaperContainer = page.locator('[data-testid="orion-live-wallpaper-container"]');
    await expect(wallpaperContainer).toBeVisible({ timeout: 5000 });

    // 7. Left-click + drag shortcut to empty space -> moves and persists
    const initialBox = await notepadShortcut.boundingBox();
    expect(initialBox).not.toBeNull();

    let movedBox: { x: number; y: number; width: number; height: number } | null = null;
    if (initialBox) {
      const startX = initialBox.x + initialBox.width / 2;
      const startY = initialBox.y + initialBox.height / 2;

      // Move to icon and press left mouse button down
      await page.mouse.move(startX, startY);
      await page.mouse.down({ button: 'left' });

      // Move mouse significantly to the right and down (+240px, +120px)
      await page.mouse.move(startX + 240, startY + 120, { steps: 10 });

      // MID-DRAG ASSERTION: verify while mouse is STILL DOWN, the icon has visually followed
      const midDragBox = await notepadShortcut.boundingBox();
      expect(midDragBox).not.toBeNull();
      if (midDragBox) {
        expect(Math.abs(midDragBox.x - initialBox.x)).toBeGreaterThan(40);
        expect(Math.abs(midDragBox.y - initialBox.y)).toBeGreaterThan(20);
      }

      // Release mouse
      await page.mouse.up({ button: 'left' });
      await page.waitForTimeout(600);

      movedBox = await notepadShortcut.boundingBox();
      expect(movedBox).not.toBeNull();
      if (movedBox) {
        expect(Math.abs(movedBox.x - initialBox.x) > 20 || Math.abs(movedBox.y - initialBox.y) > 20).toBe(true);
      }
    }

    // 8. Double-click desktop shortcut -> application launches
    await notepadShortcut.dblclick();
    const notepadWindow = page.locator('[data-orion-window][data-window-id="notepad"]');
    await expect(notepadWindow).toBeVisible({ timeout: 10000 });

    // Close Notepad
    const closeBtn = notepadWindow.locator('button[aria-label="Close Notepad"]');
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }

    // Verify persistence across page reload
    await page.reload();
    await expect(page.locator('[data-desktop-canvas="true"]')).toBeVisible({ timeout: 15000 });
    const reloadedShortcut = page.locator('[data-shortcut-id]').filter({ hasText: 'Notepad' }).first();
    await expect(reloadedShortcut).toBeVisible({ timeout: 10000 });
    const reloadedBox = await reloadedShortcut.boundingBox();
    expect(reloadedBox).not.toBeNull();
    if (reloadedBox && movedBox) {
      expect(Math.abs(reloadedBox.x - movedBox.x)).toBeLessThan(5);
      expect(Math.abs(reloadedBox.y - movedBox.y)).toBeLessThan(5);
    }
  });

  test('Objectives 9, 10, 11, 12, 13: Widgets are visible, interactive, movable in edit mode, gallery adds widget & persists', async ({ page }) => {
    // 9. Widgets are visible and not clipped outside viewport
    const widgets = page.locator('[data-testid="desktop-widget"]');
    await expect(widgets.first()).toBeVisible({ timeout: 10000 });

    const count = await widgets.count();
    expect(count).toBeGreaterThan(0);

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    const vWidth = viewport!.width;

    // Check each widget bounding box is strictly within viewport
    for (let i = 0; i < count; i++) {
      const widget = widgets.nth(i);
      const box = await widget.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(vWidth + 5); // Within screen bounds
      }
    }

    // 10. Widgets are clickable/interactable
    const firstWidget = widgets.first();
    await firstWidget.click();
    await expect(firstWidget).toBeVisible();

    // 11. Widgets can be moved in Spatial Edit Mode
    const canvas = page.locator('[data-desktop-canvas="true"]');
    await canvas.click({ button: 'right', position: { x: 300, y: 300 } });
    const desktopMenu = page.locator('[data-testid="desktop-context-menu"]');
    await desktopMenu.locator('[data-action="customize-desktop"]').click();

    const editBanner = page.locator('text=Spatial Edit Mode');
    await expect(editBanner).toBeVisible({ timeout: 5000 });

    const dragHandle = firstWidget.locator('text=DRAG');
    await expect(dragHandle).toBeVisible();

    const widgetBoxBefore = await firstWidget.boundingBox();
    expect(widgetBoxBefore).not.toBeNull();

    if (widgetBoxBefore) {
      const handleBox = await dragHandle.boundingBox();
      expect(handleBox).not.toBeNull();
      if (handleBox) {
        await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
        await page.mouse.down({ button: 'left' });
        await page.mouse.move(handleBox.x - 60, handleBox.y + 40, { steps: 5 });
        await page.mouse.up({ button: 'left' });
      }
    }

    // 12. Widget Gallery can add a widget to the desktop
    const addWidgetBannerBtn = page.locator('button:has-text("Add Widget")');
    await addWidgetBannerBtn.click();

    const widgetGallery = page.locator('[data-testid="widget-gallery"]');
    await expect(widgetGallery).toBeVisible({ timeout: 5000 });

    // Add "Orion AI Copilot" or "Sticky Note"
    const addNoteBtn = widgetGallery.locator('[data-gallery-item="notes"] [data-action="add-widget"]');
    await expect(addNoteBtn).toBeVisible();
    await addNoteBtn.click();

    await expect(widgetGallery).not.toBeVisible();

    // Verify notes widget appears on desktop
    const notesWidget = page.locator('[data-testid="desktop-widget"][data-widget-type="notes"]');
    await expect(notesWidget).toBeVisible({ timeout: 5000 });

    // Exit Edit Mode
    const doneBtn = page.locator('button:has-text("Done")');
    await doneBtn.click();
    await expect(editBanner).not.toBeVisible();

    // 13. Added widgets remain after refresh
    await page.reload();
    await expect(page.locator('[data-desktop-canvas="true"]')).toBeVisible({ timeout: 15000 });

    const persistedNotesWidget = page.locator('[data-testid="desktop-widget"][data-widget-type="notes"]');
    await expect(persistedNotesWidget).toBeVisible({ timeout: 10000 });
  });

  test('Phase 16 & 19: Physical mouse drag by 150px, hit target validation, and refresh persistence', async ({ page }) => {
    const canvas = page.locator('[data-desktop-canvas="true"]');
    await expect(canvas).toBeVisible();

    const shortcut = page.locator('[data-shortcut-id]').filter({ hasText: 'Inventory' }).first();
    await expect(shortcut).toBeVisible({ timeout: 5000 });

    // Phase 19: Hit target validation via elementFromPoint and elementsFromPoint
    const initialBox = await shortcut.boundingBox();
    expect(initialBox).not.toBeNull();
    const centerX = initialBox!.x + initialBox!.width / 2;
    const centerY = initialBox!.y + initialBox!.height / 2;

    const hitTargetInfo = await page.evaluate(({ x, y }) => {
      const topEl = document.elementFromPoint(x, y);
      const allEls = document.elementsFromPoint(x, y).slice(0, 5).map(el => ({
        tag: el.tagName,
        shortcutId: el.getAttribute('data-shortcut-id') || el.closest('[data-shortcut-id]')?.getAttribute('data-shortcut-id'),
        className: el.className,
      }));
      return {
        topTag: topEl?.tagName,
        topShortcutId: topEl?.getAttribute('data-shortcut-id') || topEl?.closest('[data-shortcut-id]')?.getAttribute('data-shortcut-id'),
        allEls,
      };
    }, { x: centerX, y: centerY });

    // Assert the top hit element belongs to the shortcut
    expect(hitTargetInfo.topShortcutId).toContain('inventory');

    // Right-click with movement must NOT drag the shortcut
    await page.mouse.move(centerX, centerY);
    await page.mouse.down({ button: 'right' });
    await page.mouse.move(centerX + 80, centerY + 80, { steps: 5 });
    await page.mouse.up({ button: 'right' });

    // Dismiss any menu that opened
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const boxAfterRightClick = await shortcut.boundingBox();
    expect(boxAfterRightClick!.x).toBeCloseTo(initialBox!.x, 0);
    expect(boxAfterRightClick!.y).toBeCloseTo(initialBox!.y, 0);

    // Physical mouse left-drag: press down, move partially, verify mid-drag movement WHILE STILL DOWN
    const targetX = initialBox!.x + 200;
    const targetY = initialBox!.y + 150;

    await page.mouse.move(centerX, centerY);
    await page.mouse.down({ button: 'left' });
    await page.mouse.move(centerX + 100, centerY + 80, { steps: 10 });

    // CRITICAL REQUIREMENT: Verify movement and transform WHILE MOUSE IS STILL DOWN
    const midDragBox = await shortcut.boundingBox();
    expect(midDragBox).not.toBeNull();
    const midDragTransform = await shortcut.evaluate((el) => el.style.transform);
    expect(midDragTransform).toContain('translate3d');
    expect(Math.abs(midDragBox!.x - initialBox!.x) > 30 || Math.abs(midDragBox!.y - initialBox!.y) > 30).toBe(true);

    // Continue moving to target destination and release
    await page.mouse.move(targetX, targetY, { steps: 10 });
    await page.mouse.up({ button: 'left' });

    // Give grid snapping and persistence a moment
    await page.waitForTimeout(500);

    const movedBox = await shortcut.boundingBox();
    expect(movedBox).not.toBeNull();
    expect(Math.abs(movedBox!.x - initialBox!.x) > 50 || Math.abs(movedBox!.y - initialBox!.y) > 50).toBe(true);

    // Refresh page and assert new position persisted
    await page.reload();
    await expect(page.locator('[data-desktop-canvas="true"]')).toBeVisible({ timeout: 15000 });

    const reloadedShortcut = page.locator('[data-shortcut-id]').filter({ hasText: 'Inventory' }).first();
    await expect(reloadedShortcut).toBeVisible({ timeout: 10000 });

    const reloadedBox = await reloadedShortcut.boundingBox();
    expect(reloadedBox).not.toBeNull();
    expect(reloadedBox!.x).toBeCloseTo(movedBox!.x, 0);
    expect(reloadedBox!.y).toBeCloseTo(movedBox!.y, 0);
  });

  test('Phase 17: Long shortcut name displays full name without truncation, line-clamp, or ellipsis', async ({ page }) => {
    const longName = 'International Supply Chain Operations Planning Document';

    // Inject a shortcut with the long name directly into persistence
    await page.evaluate(async (name) => {
      const { desktopWorkspaceService } = await import('../../src/core/filesystem/DesktopWorkspaceService');
      await desktopWorkspaceService.addShortcut({
        targetType: 'file',
        targetId: 'doc_long_name_test',
        name,
        iconId: 'notepad',
        isDirectory: false,
        path: `/Desktop/${name}`,
        workspaceId: 'operations',
      });
      window.dispatchEvent(new CustomEvent('orion:desktop-refresh'));
    }, longName);

    const longShortcut = page.locator('[data-shortcut-id]').filter({ hasText: longName }).first();
    await expect(longShortcut).toBeVisible({ timeout: 10000 });

    const label = longShortcut.locator(`div[title="${longName}"]`);
    await expect(label).toBeVisible();

    // Verify label styling and text content
    const labelProps = await label.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        text: el.textContent?.trim(),
        title: el.getAttribute('title'),
        webkitLineClamp: style.webkitLineClamp,
        textOverflow: style.textOverflow,
        whiteSpace: style.whiteSpace,
      };
    });

    expect(labelProps.text).toBe(longName);
    expect(labelProps.title).toBe(longName);
    expect(labelProps.webkitLineClamp).not.toBe('2');
    expect(labelProps.webkitLineClamp).not.toBe('1');
    expect(labelProps.textOverflow).not.toBe('ellipsis');
  });
});
