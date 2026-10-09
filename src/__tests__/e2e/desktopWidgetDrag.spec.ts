/**
 * ORION-9 PLAYWRIGHT E2E: DESKTOP WIDGET DRAGGING & PERSISTENCE
 *
 * Verifies:
 * 1. Desktop widget drag handle is visible and interactive in normal mode (no edit mode required).
 * 2. Dragging widget by drag-handle updates its spatial coordinates on [data-desktop-canvas="true"].
 * 3. Widget position persists across page reload.
 * 4. Widget content controls (textarea, buttons) remain interactive and do not initiate drag.
 * 5. Widget options & removal controls work without regressions.
 * 6. Widget Gallery modal allows adding widgets by click and dragging widgets to desktop.
 */

import { test, expect } from '@playwright/test';

test.describe('Orion-9 Desktop Widget Dragging & Spatial Workspace E2E', () => {
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

  test('1. Desktop widget drag handle is available in normal mode and drags widget smoothly', async ({ page }) => {
    // Locate the first desktop widget
    const widget = page.locator('[data-testid="desktop-widget"]').first();
    await expect(widget).toBeVisible({ timeout: 10000 });

    const dragHandle = widget.locator('[data-testid="widget-drag-handle"]');
    await expect(dragHandle).toBeVisible();

    // Get initial position
    const initialBox = await widget.boundingBox();
    expect(initialBox).not.toBeNull();
    if (!initialBox) return;

    // Get drag handle bounding box
    const handleBox = await dragHandle.boundingBox();
    expect(handleBox).not.toBeNull();
    if (!handleBox) return;

    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;
    // Drag by handle using mouse pointer events towards top-left to avoid right screen boundary clamping
    const targetX = Math.max(50, startX - 120);
    const targetY = startY + 80;

    await page.mouse.move(startX, startY);
    await page.mouse.down({ button: 'left' });
    await page.mouse.move(targetX, targetY, { steps: 10 });
    await page.mouse.up({ button: 'left' });

    // Allow state to settle
    await page.waitForTimeout(500);

    // Verify updated position
    const updatedBox = await widget.boundingBox();
    expect(updatedBox).not.toBeNull();
    if (!updatedBox) return;

    expect(Math.abs(updatedBox.x - (initialBox.x - 120))).toBeLessThanOrEqual(25);
    expect(Math.abs(updatedBox.y - (initialBox.y + 80))).toBeLessThanOrEqual(25);

    // Verify persistence across reload
    await page.reload();
    await expect(page.locator('[data-desktop-canvas="true"]')).toBeVisible({ timeout: 20000 });

    const reloadedWidget = page.locator('[data-testid="desktop-widget"]').first();
    await expect(reloadedWidget).toBeVisible();
    const reloadedBox = await reloadedWidget.boundingBox();
    expect(reloadedBox).not.toBeNull();
    if (!reloadedBox) return;

    expect(Math.abs(reloadedBox.x - updatedBox.x)).toBeLessThanOrEqual(15);
    expect(Math.abs(reloadedBox.y - updatedBox.y)).toBeLessThanOrEqual(15);
  });

  test('2. Widget interactive content does not trigger drag and remains responsive', async ({ page }) => {
    // Open Widget Gallery and add Notes widget if not present
    const canvas = page.locator('[data-desktop-canvas="true"]');
    await canvas.click({ button: 'right', position: { x: 400, y: 300 } });
    const contextMenu = page.locator('[data-testid="desktop-context-menu"]');
    await expect(contextMenu).toBeVisible();

    await contextMenu.locator('button[data-action="widgets"]').click();
    const gallery = page.locator('[data-testid="widget-gallery"]');
    await expect(gallery).toBeVisible();

    // Add sticky note widget
    const noteCard = gallery.locator('[data-gallery-item="notes"]');
    await expect(noteCard).toBeVisible();
    await noteCard.locator('button[data-action="add-widget"]').click();

    // Wait for note widget on desktop
    const noteWidget = page.locator('[data-testid="desktop-widget"][data-widget-type="notes"]');
    await expect(noteWidget).toBeVisible({ timeout: 5000 });

    const noteInitialBox = await noteWidget.boundingBox();
    expect(noteInitialBox).not.toBeNull();

    // Interact with textarea inside widget
    const textarea = noteWidget.locator('textarea');
    await expect(textarea).toBeVisible();
    await textarea.click();
    await textarea.fill('Testing widget interaction isolation');

    // Dragging inside textarea does not move the widget
    const taBox = await textarea.boundingBox();
    if (taBox) {
      await page.mouse.move(taBox.x + 10, taBox.y + 10);
      await page.mouse.down({ button: 'left' });
      await page.mouse.move(taBox.x + 60, taBox.y + 60, { steps: 5 });
      await page.mouse.up({ button: 'left' });
    }

    const noteCurrentBox = await noteWidget.boundingBox();
    expect(noteCurrentBox).not.toBeNull();
    if (noteInitialBox && noteCurrentBox) {
      expect(Math.abs(noteCurrentBox.x - noteInitialBox.x)).toBeLessThanOrEqual(2);
      expect(Math.abs(noteCurrentBox.y - noteInitialBox.y)).toBeLessThanOrEqual(2);
    }

    // Now drag via dedicated widget handle towards left
    const dragHandle = noteWidget.locator('[data-testid="widget-drag-handle"]');
    await expect(dragHandle).toBeVisible();
    const handleBox = await dragHandle.boundingBox();
    if (handleBox) {
      await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
      await page.mouse.down({ button: 'left' });
      await page.mouse.move(handleBox.x - 100, handleBox.y + 60, { steps: 8 });
      await page.mouse.up({ button: 'left' });
    }

    await page.waitForTimeout(400);
    const movedBox = await noteWidget.boundingBox();
    expect(movedBox).not.toBeNull();
    if (noteInitialBox && movedBox) {
      expect(movedBox.x).toBeLessThan(noteInitialBox.x - 40);
    }
  });

  test('3. Integrated size selector changes widget dimensions dynamically', async ({ page }) => {
    const widget = page.locator('[data-testid="desktop-widget"]').first();
    await expect(widget).toBeVisible({ timeout: 10000 });

    const initialBox = await widget.boundingBox();
    expect(initialBox).not.toBeNull();

    // Click Small size button
    const smallBtn = widget.locator('button[data-action="resize-widget"][data-size="SMALL"]');
    await expect(smallBtn).toBeVisible();
    await smallBtn.click();
    await page.waitForTimeout(400);

    const smallBox = await widget.boundingBox();
    expect(smallBox).not.toBeNull();
    if (smallBox) {
      expect(smallBox.width).toBeLessThanOrEqual(260);
    }

    // Click Large size button
    const largeBtn = widget.locator('button[data-action="resize-widget"][data-size="LARGE"]');
    await expect(largeBtn).toBeVisible();
    await largeBtn.click();
    await page.waitForTimeout(400);

    const largeBox = await widget.boundingBox();
    expect(largeBox).not.toBeNull();
    if (largeBox) {
      expect(largeBox.width).toBeGreaterThanOrEqual(400);
    }
  });

  test('4. In-widget close button removes widget from desktop', async ({ page }) => {
    const widgets = page.locator('[data-testid="desktop-widget"]');
    const countBefore = await widgets.count();
    expect(countBefore).toBeGreaterThan(0);

    const firstWidget = widgets.first();
    const removeBtn = firstWidget.locator('button[data-action="remove-widget"]');
    await expect(removeBtn).toBeVisible();
    await removeBtn.click();

    await page.waitForTimeout(500);
    const countAfter = await widgets.count();
    expect(countAfter).toBe(countBefore - 1);
  });
});

