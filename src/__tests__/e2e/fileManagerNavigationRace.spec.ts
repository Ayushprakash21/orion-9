import { test, expect } from '@playwright/test';

/**
 * ORION-9 GLOBAL FILE MANAGER NAVIGATION RACE & FOLDER STABILITY E2E TEST
 * 
 * Verifies browser-level navigation stability across all system folders:
 * Documents -> Downloads -> Projects -> Reports -> Documents -> Recycle Bin.
 * Ensures the destination remains strictly authoritative after asynchronous loads
 * and background operations complete, without any jumping or reverting.
 */
test.describe('ORION-9 File Manager Global Navigation Race & Invariant Suite', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Configure desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });

    // 2. Pre-authenticate directly via session storage to bypass boot and login screens
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('orion_os_power_state', 'ON');
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
            department: 'IT Administration',
          },
          organization: {
            id: 'ORION_PLATFORM',
            name: 'ORION_PLATFORM',
            status: 'active',
          },
          permissions: ['all'],
          environment: 'DEMO',
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        }));
      } catch (e) {}
    });

    // 3. Open Orion OS
    await page.goto('/');

    // Handle fallback login if auth session wasn't picked up
    const usernameInput = page.locator('input#username, input[type="text"]').first();
    if (await usernameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await usernameInput.fill('admin');
      await page.click('button[type="submit"]');
      const passwordInput = page.locator('input#password, input[type="password"]').first();
      if (await passwordInput.isVisible({ timeout: 4000 }).catch(() => false)) {
        await passwordInput.fill('admin');
        await page.click('button[type="submit"]');
      }
    }

    // 4. Wait for authenticated desktop shell
    const desktopShell = page.locator('.orion-desktop-shell, [data-desktop-canvas="true"]').first();
    await expect(desktopShell).toBeVisible({ timeout: 20000 });
  });

  test('verifies global folder navigation sequence with 3-second post-load settling', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Launch File Manager from desktop shortcut
    const fileMgrShortcut = page.locator('[data-testid="desktop-shortcut-file-manager"], [data-target-id="file-manager"]').first();
    await expect(fileMgrShortcut).toBeVisible({ timeout: 10000 });
    await fileMgrShortcut.dblclick({ force: true });

    // Listen to browser console logs
    page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));

    // 2. Wait for File Explorer window to open
    const fileWindow = page.locator('[data-window-id="file-manager"]');
    await expect(fileWindow).toBeVisible({ timeout: 10000 });

    // Helper locators - exact testids
    const breadcrumb = fileWindow.locator('[data-testid="file-manager-breadcrumb"]');
    const navItem = (key: string) => fileWindow.locator(`[data-testid="file-manager-sidebar-${key}"]`);

    // Ensure sidebar has loaded
    await expect(navItem('documents')).toBeVisible({ timeout: 10000 });
    await expect(navItem('downloads')).toBeVisible({ timeout: 10000 });
    await expect(navItem('projects')).toBeVisible({ timeout: 10000 });
    await expect(navItem('reports')).toBeVisible({ timeout: 10000 });
    await expect(navItem('recycle_bin')).toBeVisible({ timeout: 10000 });

    // 3. Click Documents
    const docsBtn = navItem('documents');
    await docsBtn.click();
    await page.waitForTimeout(600);

    // 4. Click Downloads
    const downloadsBtn = navItem('downloads');
    await downloadsBtn.click();
    await page.waitForTimeout(600);

    // 5. Click Projects
    const projectsBtn = navItem('projects');
    await projectsBtn.click();
    await page.waitForTimeout(600);

    // 6. Click Reports
    const reportsBtn = navItem('reports');
    await reportsBtn.click();

    // 7. Wait 3 seconds for all async loads and background event emissions to settle
    await page.waitForTimeout(3000);

    // 8. Assert Reports remains strictly authoritative
    await expect(breadcrumb).toHaveText(/Reports/i);
    const reportsSidebar = fileWindow.locator('[data-testid="file-manager-sidebar-reports"]');
    if (await reportsSidebar.count() > 0) {
      await expect(reportsSidebar).toHaveAttribute('data-active', 'true');
    }

    // 9. Click Documents
    await docsBtn.click();

    // 10. Wait 3 seconds
    await page.waitForTimeout(3000);

    // 11. Assert Documents remains strictly authoritative
    await expect(breadcrumb).toHaveText(/Documents/i);
    const docsSidebar = fileWindow.locator('[data-testid="file-manager-sidebar-documents"]');
    if (await docsSidebar.count() > 0) {
      await expect(docsSidebar).toHaveAttribute('data-active', 'true');
    }

    // 12. Click Recycle Bin
    const binBtn = navItem('recycle_bin');
    await binBtn.click();

    // 13. Wait 3 seconds
    await page.waitForTimeout(3000);

    // 14. Assert Recycle Bin remains strictly authoritative
    await expect(breadcrumb).toHaveText(/Recycle Bin/i);
    const binSidebar = fileWindow.locator('[data-testid="file-manager-sidebar-recycle_bin"]');
    if (await binSidebar.count() > 0) {
      await expect(binSidebar).toHaveAttribute('data-active', 'true');
    }
  });

  test('rapid navigation through all system folders guarantees latest destination wins', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Launch File Manager
    const fileMgrShortcut = page.locator('[data-testid="desktop-shortcut-file-manager"], [data-target-id="file-manager"]').first();
    await expect(fileMgrShortcut).toBeVisible({ timeout: 10000 });
    await fileMgrShortcut.dblclick({ force: true });

    const fileWindow = page.locator('[data-window-id="file-manager"]');
    await expect(fileWindow).toBeVisible({ timeout: 10000 });

    const breadcrumb = fileWindow.locator('[data-testid="file-manager-breadcrumb"]');
    const navItem = (key: string) => fileWindow.locator(`[data-testid="file-manager-sidebar-${key}"]`);

    await expect(navItem('documents')).toBeVisible({ timeout: 10000 });
    await expect(navItem('recycle_bin')).toBeVisible({ timeout: 10000 });

    // Rapidly click Documents -> Downloads -> Projects -> Reports -> AI -> Shared -> Recycle Bin
    await navItem('documents').click();
    await navItem('downloads').click();
    await navItem('projects').click();
    await navItem('reports').click();
    await navItem('ai').click();
    await navItem('shared').click();
    await navItem('recycle_bin').click();

    // Wait 4 seconds for all out-of-order responses to finish
    await page.waitForTimeout(4000);

    // The final destination MUST be Recycle Bin, no jumping back to earlier clicked folders
    await expect(breadcrumb).toHaveText(/Recycle Bin/i);
    const binSidebar = fileWindow.locator('[data-testid="file-manager-sidebar-recycle_bin"]');
    if (await binSidebar.count() > 0) {
      await expect(binSidebar).toHaveAttribute('data-active', 'true');
    }

    // Now reverse rapidly: Recycle Bin -> Shared -> AI -> Reports -> Projects -> Downloads -> Documents
    await navItem('recycle_bin').click();
    await navItem('shared').click();
    await navItem('ai').click();
    await navItem('reports').click();
    await navItem('projects').click();
    await navItem('downloads').click();
    await navItem('documents').click();

    // Wait 4 seconds
    await page.waitForTimeout(4000);

    // Final destination MUST be Documents
    await expect(breadcrumb).toHaveText(/Documents/i);
    const docsSidebar = fileWindow.locator('[data-testid="file-manager-sidebar-documents"]');
    if (await docsSidebar.count() > 0) {
      await expect(docsSidebar).toHaveAttribute('data-active', 'true');
    }
  });
});
