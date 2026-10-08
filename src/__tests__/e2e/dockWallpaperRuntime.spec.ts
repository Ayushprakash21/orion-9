import { test, expect } from '@playwright/test';

test.describe('ORION-9 Dock Auto-Hide and Wallpaper Runtime E2E Suite', () => {
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

  test('E2E-001: Verifies desktop wallpaper image is loaded with authoritative image tag', async ({ page }) => {
    // Check if wallpaper image exists on desktop
    const wallpaperImg = page.locator('img[data-orion-wallpaper-image="true"]').first();
    await expect(wallpaperImg).toBeVisible({ timeout: 10000 });
    
    // Verify src attribute contains valid wallpaper asset
    const src = await wallpaperImg.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src).toMatch(/\.(png|jpg|jpeg|webp)/i);
  });

  test('E2E-002: Verifies Dock mounts with authoritative data attributes, defaults to auto-hidden, and reveals on bottom-edge trigger', async ({ page }) => {
    const dock = page.locator('[data-dock="true"]').first();
    // Dock is mounted in DOM
    await expect(dock).toBeAttached({ timeout: 10000 });
    await expect(dock).toHaveAttribute('data-dock', 'true');

    // By default, dock starts hidden in the modern OS shell
    await expect(dock).toHaveAttribute('data-dock-visibility-state', 'hidden');

    // Trigger reveal by moving pointer to the bottom screen edge
    await page.mouse.move(720, 898);

    // Dock transitions to visible
    await expect(dock).toHaveAttribute('data-dock-visible', 'true', { timeout: 5000 });
    await expect(dock).toHaveAttribute('data-dock-visibility-state', 'visible');

    // Hover directly over the dock to keep it visible
    await dock.hover();
    await expect(dock).toHaveAttribute('data-dock-visible', 'true');

    // Move pointer away into the workspace
    await page.mouse.move(720, 450);

    // Dock auto-hides back to hidden state
    await expect(dock).toHaveAttribute('data-dock-visibility-state', 'hidden', { timeout: 5000 });
  });
});
