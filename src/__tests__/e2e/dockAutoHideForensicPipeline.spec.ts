import { test, expect } from '@playwright/test';

test.describe('ORION-9 Dock Auto-Hide Forensic Pipeline E2E Suite', () => {
  const setupDesktopSession = async (page: any, width = 1440, height = 900, customStorage?: Record<string, string>) => {
    await page.setViewportSize({ width, height });

    await page.addInitScript((storageItems: Record<string, string> | undefined) => {
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

        if (storageItems) {
          Object.entries(storageItems).forEach(([key, val]) => {
            localStorage.setItem(key, val);
          });
        }
      } catch (e) {}
    }, customStorage);

    await page.goto('/');

    // Handle fallback login if needed
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

    const desktopShell = page.locator('.orion-desktop-shell, [data-desktop-canvas="true"], .orion-authenticated-shell').first();
    await expect(desktopShell).toBeVisible({ timeout: 20000 });
  };

  test('PHASE 1-4: Standard 1440x900 Auto-Hide Cycle (Steps 1 to 17)', async ({ page }) => {
    // 1-3. Launch ORION-9, login, enter desktop at 1440x900
    await setupDesktopSession(page, 1440, 900);

    // 4. Wait 1 second
    await page.waitForTimeout(1000);

    // 5. Move mouse to center of workspace / Command Center
    await page.mouse.move(720, 450);

    // 6. Assert Dock is hidden
    const dock = page.locator('[data-dock="true"]').first();
    await expect(dock).toBeAttached({ timeout: 10000 });
    await expect(dock).toHaveAttribute('data-dock-visible', 'false');
    await expect(dock).toHaveAttribute('data-dock-visibility-state', 'hidden');

    // 7. Assert Dock does not intercept pointer events (pointer-events-none on dock container)
    const dockClasses = await dock.getAttribute('class');
    expect(dockClasses).toContain('pointer-events-none');

    // 8. Move mouse to bottom edge (within 14px activation zone)
    await page.mouse.move(720, 898);

    // 9-10. Wait for reveal & assert Dock is visible
    await expect(dock).toHaveAttribute('data-dock-visible', 'true', { timeout: 3000 });
    await expect(dock).toHaveAttribute('data-dock-visibility-state', 'visible');
    const revealedClasses = await dock.getAttribute('class');
    expect(revealedClasses).toContain('pointer-events-auto');

    // 11. Move mouse to center of Command Center
    await page.mouse.move(720, 450);

    // 12-13. Wait 500ms & assert Dock is hidden again
    await page.waitForTimeout(600);
    await expect(dock).toHaveAttribute('data-dock-visibility-state', 'hidden', { timeout: 3000 });
    await expect(dock).toHaveAttribute('data-dock-visible', 'false');

    // 14-15. Click Command Center / Desktop content & assert click succeeds without interception
    const desktopCanvas = page.locator('[data-desktop-canvas="true"], .orion-desktop-shell').first();
    await desktopCanvas.click({ position: { x: 720, y: 450 } });

    // 16-17. Move mouse to bottom edge again & assert Dock reveals again
    await page.mouse.move(720, 898);
    await expect(dock).toHaveAttribute('data-dock-visible', 'true', { timeout: 3000 });
    await expect(dock).toHaveAttribute('data-dock-visibility-state', 'visible');
  });

  test('PHASE 5: Multi-Viewport Dimension Stability (1280x720, 1440x900, 1920x1080, 2560x1440)', async ({ page }) => {
    const viewports = [
      { width: 1280, height: 720 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
      { width: 2560, height: 1440 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await setupDesktopSession(page, vp.width, vp.height);

      const dock = page.locator('[data-dock="true"]').first();
      await page.mouse.move(vp.width / 2, vp.height / 2);

      // Dock hidden by default: no obstruction
      await expect(dock).toHaveAttribute('data-dock-visibility-state', 'hidden', { timeout: 4000 });

      // Move mouse to bottom edge
      await page.mouse.move(vp.width / 2, vp.height - 2);

      // Dock reveals as floating overlay without changing layout
      await expect(dock).toHaveAttribute('data-dock-visible', 'true', { timeout: 3000 });

      // Move away
      await page.mouse.move(vp.width / 2, vp.height / 2);
      await page.waitForTimeout(600);
      await expect(dock).toHaveAttribute('data-dock-visibility-state', 'hidden');
    }
  });

  test('PHASE 6: Dock Position Invariance (bottom, top, left, right)', async ({ page }) => {
    await setupDesktopSession(page, 1440, 900);
    const dock = page.locator('[data-dock="true"]').first();

    const positions: Array<{ pos: 'bottom' | 'top' | 'left' | 'right'; trigger: { x: number; y: number } }> = [
      { pos: 'bottom', trigger: { x: 720, y: 898 } },
      { pos: 'top', trigger: { x: 720, y: 52 } }, // just below 48px system bar
      { pos: 'left', trigger: { x: 2, y: 450 } },
      { pos: 'right', trigger: { x: 1438, y: 450 } },
    ];

    for (const item of positions) {
      // Dispatch position preference
      await page.evaluate((newPos) => {
        window.dispatchEvent(new CustomEvent('orion-appearance-preferences-changed', {
          detail: { dockPosition: newPos, dockAutoHide: true }
        }));
      }, item.pos);

      await page.waitForTimeout(200);

      // Ensure dock starts hidden
      await page.mouse.move(720, 450);
      await expect(dock).toHaveAttribute('data-dock-position', item.pos);
      await expect(dock).toHaveAttribute('data-dock-visibility-state', 'hidden');

      // Trigger position edge
      await page.mouse.move(item.trigger.x, item.trigger.y);
      await expect(dock).toHaveAttribute('data-dock-visible', 'true', { timeout: 3000 });

      // Move away
      await page.mouse.move(720, 450);
      await page.waitForTimeout(600);
      await expect(dock).toHaveAttribute('data-dock-visibility-state', 'hidden');
    }
  });

  test('PHASE 7: Canonical Dock Auto-Hide Settings Toggle & Persistence', async ({ page }) => {
    await setupDesktopSession(page, 1440, 900);
    const dock = page.locator('[data-dock="true"]').first();

    // 1. Initial state: Auto-hide is ON, dock is hidden
    await page.mouse.move(720, 450);
    await expect(dock).toHaveAttribute('data-dock-visibility-state', 'hidden');

    // 2. User toggles Auto-Hide to OFF (Always Visible) via authoritative dispatch
    await page.evaluate(() => {
      // Simulate user turning off auto-hide in current schema v2
      const prefs = {
        version: 1,
        appearancePreferencesVersion: 2,
        themeId: 'graphite',
        dockAutoHide: false,
        dockPosition: 'bottom',
      };
      localStorage.setItem('orion-appearance-preferences', JSON.stringify(prefs));
      window.dispatchEvent(new CustomEvent('orion-appearance-preferences-changed', {
        detail: prefs
      }));
    });

    // Dock becomes visible and stays visible even when mouse is centered
    await page.mouse.move(720, 450);
    await expect(dock).toHaveAttribute('data-dock-visible', 'true', { timeout: 3000 });
    await expect(dock).toHaveAttribute('data-dock-visibility-state', 'visible');

    // 3. Reload page: Dock remains visible
    await page.reload();
    const reloadedDock = page.locator('[data-dock="true"]').first();
    await expect(reloadedDock).toBeVisible({ timeout: 10000 });
    await page.mouse.move(720, 450);
    await expect(reloadedDock).toHaveAttribute('data-dock-visible', 'true');

    // 4. User toggles Auto-Hide back ON
    await page.evaluate(() => {
      const prefs = {
        version: 1,
        appearancePreferencesVersion: 2,
        themeId: 'graphite',
        dockAutoHide: true,
        dockPosition: 'bottom',
      };
      localStorage.setItem('orion-appearance-preferences', JSON.stringify(prefs));
      window.dispatchEvent(new CustomEvent('orion-appearance-preferences-changed', {
        detail: prefs
      }));
    });

    // Dock auto-hides when mouse moves away
    await page.mouse.move(720, 450);
    await page.waitForTimeout(600);
    await expect(dock).toHaveAttribute('data-dock-visibility-state', 'hidden');

    // 5. Reload page: Dock remains auto-hidden
    await page.reload();
    const finalDock = page.locator('[data-dock="true"]').first();
    await page.mouse.move(720, 450);
    await expect(finalDock).toHaveAttribute('data-dock-visibility-state', 'hidden');
  });

  test('PHASE 8: Stale Pre-Fix Storage Migration Repairs dockAutoHide=false to TRUE', async ({ page }) => {
    // Seed stale preferences from old schema without appearancePreferencesVersion
    // containing false caused by Boolean(undefined) legacy bug
    const staleStorage = {
      'orion-appearance-preferences': JSON.stringify({
        version: 1,
        themeId: 'graphite',
        dockAutoHide: false, // produced by stale migration
        dockPosition: 'bottom',
      })
    };

    await setupDesktopSession(page, 1440, 900, staleStorage);

    // Verify migration normalized dockAutoHide to true and updated storage version
    const dock = page.locator('[data-dock="true"]').first();
    await page.mouse.move(720, 450);

    // Dock is auto-hidden by default
    await expect(dock).toHaveAttribute('data-dock-visibility-state', 'hidden', { timeout: 5000 });

    // Check localStorage in browser: it has been upgraded to appearancePreferencesVersion 2
    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('orion-appearance-preferences');
      return raw ? JSON.parse(raw) : null;
    });

    expect(stored).not.toBeNull();
    expect(stored.appearancePreferencesVersion).toBe(2);
    expect(stored.dockAutoHide).toBe(true);
  });

  test('PHASE 9: Mobile Viewport Isolation', async ({ page }) => {
    // Mobile iPhone 14 viewport 390x844
    await page.setViewportSize({ width: 390, height: 844 });
    await setupDesktopSession(page, 390, 844);

    // Desktop dock has hidden md:block, so it is hidden on mobile
    const dock = page.locator('[data-dock="true"]');
    await expect(dock).toBeHidden();

    // Mobile nav bar is present and accessible
    const mobileNav = page.locator('nav, [data-testid="mobile-nav-bar"], .orion-mobile-nav').first();
    await expect(mobileNav).toBeVisible({ timeout: 10000 });
  });
});
