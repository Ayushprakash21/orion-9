import { test, expect } from '@playwright/test';

test.describe('ORION-9 Desktop Workspace & Virtual File System Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('orion_os_power_state', 'ON');
      } catch (e) {}
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    // Quick demo login or fallback login
    const quickLoginBtn = page.getByRole('button', { name: /quick launch|quick test/i })
      .or(page.locator('button:has-text("Quick"), button:has-text("Demo"), button:has-text("Admin")').first());

    if (await quickLoginBtn.isVisible()) {
      await quickLoginBtn.click();
    } else {
      const usernameInput = page.locator('input[type="text"], input[type="email"], #username').first();
      if (await usernameInput.isVisible()) {
        await usernameInput.fill('admin');
        const passwordInput = page.locator('input[type="password"], #password').first();
        await passwordInput.fill('admin');
        await page.locator('button[type="submit"]').click();
      }
    }

    // Wait for authenticated desktop shell to be visible
    const desktopShell = page.locator('.orion-desktop-shell');
    await expect(desktopShell).toBeVisible({ timeout: 20000 });
  });

  test('renders desktop workspace with persistent draggable icons and system applications', async ({ page }) => {
    const desktopCanvas = page.locator('[data-desktop-canvas="true"]');
    await expect(desktopCanvas).toBeVisible({ timeout: 10000 });

    // Verify presence of Desktop Shortcuts
    await expect(page.getByText('This Computer').first()).toBeVisible();
    await expect(page.getByText('File Explorer').first()).toBeVisible();
    await expect(page.getByText('Notepad').first()).toBeVisible();
  });

  test('opens Notepad on double-clicking Notepad desktop icon and verifies editor capabilities', async ({ page }) => {
    const notepadIcon = page.locator('[data-desktop-canvas="true"]').getByText('Notepad').first();
    await expect(notepadIcon).toBeVisible({ timeout: 10000 });

    // Double click to launch
    await notepadIcon.dblclick();
    await page.waitForTimeout(800);

    // Verify Notepad window
    const notepadWindow = page.locator('[data-window-id="notepad"]');
    await expect(notepadWindow).toBeVisible({ timeout: 10000 });
    await expect(notepadWindow.getByRole('button', { name: /save/i }).first()).toBeVisible();
    await expect(notepadWindow.getByText(/utf-8/i).first()).toBeVisible();
    await expect(notepadWindow.getByText(/virtual fs connected/i).first()).toBeVisible();

    // Type content into Notepad editor
    const textarea = notepadWindow.locator('textarea').first();
    await expect(textarea).toBeVisible();
    await textarea.fill('ORION-9 Autonomous Supply Chain Operating Note: OTIF at 99.4%');
    await expect(textarea).toHaveValue(/OTIF at 99.4%/);
  });

  test('opens File Explorer and verifies system folders and virtual disk storage', async ({ page }) => {
    const fileMgrIcon = page.locator('[data-desktop-canvas="true"]').getByText('File Explorer').first();
    await expect(fileMgrIcon).toBeVisible({ timeout: 10000 });

    await fileMgrIcon.dblclick();
    await page.waitForTimeout(800);

    // Verify File Explorer window & sidebar
    const fileWindow = page.locator('[data-window-id="file-manager"]');
    await expect(fileWindow).toBeVisible({ timeout: 10000 });
    await expect(fileWindow.getByText(/System Folders/i).first()).toBeVisible();
    await expect(fileWindow.getByText(/Documents/i).first()).toBeVisible();
    await expect(fileWindow.getByText(/Virtual Disk/i).first()).toBeVisible();
  });

  test('opens This Computer dashboard and inspects system volumes and specifications', async ({ page }) => {
    const computerIcon = page.locator('[data-desktop-canvas="true"]').getByText('This Computer').first();
    await expect(computerIcon).toBeVisible({ timeout: 10000 });

    await computerIcon.dblclick();
    await page.waitForTimeout(800);

    // Verify This Computer window & specs
    const computerWindow = page.locator('[data-window-id="orion-computer"]');
    await expect(computerWindow).toBeVisible({ timeout: 10000 });
    await expect(computerWindow.getByText(/orion-9 workstation computer/i).first()).toBeVisible();
    await expect(computerWindow.getByText(/storage volumes & drives/i).first()).toBeVisible();
  });

  test('triggers desktop right-click context menu with sort and new document actions', async ({ page }) => {
    const canvas = page.locator('[data-desktop-canvas="true"]').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
    await canvas.click({ button: 'right', position: { x: 300, y: 300 } });
    await page.waitForTimeout(300);

    // Context menu items
    await expect(page.getByText('Refresh Desktop').first()).toBeVisible();
    await expect(page.getByText('Sort by Name').first()).toBeVisible();
    await expect(page.getByText('New Text Document').first()).toBeVisible();
  });
});
