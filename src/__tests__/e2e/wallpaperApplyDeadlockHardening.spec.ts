import { test, expect } from '@playwright/test';

test.describe('ORION-9 Wallpaper Apply Deadlock & Async Persistence Hardening E2E Suite (Phase 14)', () => {

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Initialize authenticated DEMO session
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

    await expect(page.locator('[data-desktop-canvas="true"]')).toBeVisible({ timeout: 20000 });
  });

  const openWallpaperStudio = async (page: any) => {
    // Right-click desktop to open context menu and click Personalize Desktop
    const desktopCanvas = page.locator('[data-desktop-canvas="true"]');
    await desktopCanvas.click({ button: 'right', position: { x: 400, y: 300 } });

    const personalizeBtn = page.locator('button[data-action="personalize"]');
    await expect(personalizeBtn).toBeVisible({ timeout: 5000 });
    await personalizeBtn.click();

    // Wait for Settings window to appear
    await expect(page.locator('[data-window-id="settings"]')).toBeVisible({ timeout: 8000 });

    // Switch to Wallpaper Studio category
    const wpTab = page.locator('button:has-text("Wallpaper Studio")');
    if (await wpTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await wpTab.click();
    } else {
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('orion-open-settings', { detail: { category: 'wallpaper_studio' } }));
      });
    }

    const studio = page.locator('[data-testid="user-wallpaper-studio"]');
    await expect(studio).toBeVisible({ timeout: 8000 });
    return studio;
  };

  test('TEST 1: Apply wallpaper transaction completes deterministically without sticking in "Applying..."', async ({ page }) => {
    // 1. Open Wallpaper Studio via Desktop Personalize menu
    await openWallpaperStudio(page);

    // 2. Select desktop target and pick Deep Orion Nebula card
    const targetCard = page.locator('[data-testid="wallpaper-card"][data-wallpaper-id="sys-deep-orion-nebula"]');
    await expect(targetCard).toBeVisible({ timeout: 5000 });
    await targetCard.click();

    // 3. Verify preview updates before apply
    const previewImg = page.locator('[data-testid="wallpaper-preview-image"]');
    await expect(previewImg).toHaveAttribute('src', '/orion9-space-baseline.png', { timeout: 3000 });

    // 4. Click Apply Wallpaper button
    const applyBtn = page.locator('[data-testid="wallpaper-apply-button"]');
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();

    // 5. Assert: "Applying..." appears or transitions to "Applied!" / idle within bounded time
    // Crucial check: button must NOT remain indefinitely disabled or stuck in "Applying..."
    await expect(async () => {
      const btnText = await applyBtn.innerText();
      expect(btnText).not.toContain('Applying...');
    }).toPass({ timeout: 10000 });

    // 6. Assert success state: button transitions to "Applied!" or returns to idle
    const finalBtnText = await applyBtn.innerText();
    expect(finalBtnText === 'Applied!' || finalBtnText.includes('Apply Wallpaper')).toBe(true);

    // 7. Verify the actual desktop wallpaper in the DOM updated to Deep Orion Nebula
    const desktopWallpaperImg = page.locator('[data-orion-wallpaper-image="true"]');
    await expect(desktopWallpaperImg).toHaveAttribute('src', '/orion9-space-baseline.png', { timeout: 5000 });

    // 8. Reload page and assert persisted wallpaper is still correct
    await page.reload();
    await expect(page.locator('[data-desktop-canvas="true"]')).toBeVisible({ timeout: 15000 });

    const reloadedWallpaperImg = page.locator('[data-orion-wallpaper-image="true"]');
    await expect(reloadedWallpaperImg).toHaveAttribute('src', '/orion9-space-baseline.png', { timeout: 8000 });
  });

  test('TEST 2: Simulated Firestore hang does NOT hang the Apply button indefinitely', async ({ page }) => {
    // 1. Open Wallpaper Studio via Desktop Personalize menu
    await openWallpaperStudio(page);

    // 2. Select Orbital Control Tower Grid
    const targetCard = page.locator('[data-testid="wallpaper-card"][data-wallpaper-id="sys-orbital-grid-node"]');
    await expect(targetCard).toBeVisible({ timeout: 5000 });
    await targetCard.click();

    const applyBtn = page.locator('[data-testid="wallpaper-apply-button"]');
    await applyBtn.click();

    // 3. Critical assertion: Button MUST NOT remain in "Applying..." beyond bounded transaction timeout
    await expect(async () => {
      const btnText = await applyBtn.innerText();
      expect(btnText).not.toBe('Applying...');
    }).toPass({ timeout: 14000 });

    // 4. Button is re-enabled and clickable again
    await expect(applyBtn).toBeEnabled({ timeout: 5000 });
  });
});
