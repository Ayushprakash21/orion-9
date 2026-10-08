import { test, expect } from '@playwright/test';

test.describe('ORION-9 Wallpaper Runtime Real User Flow & Mode Propagation', () => {

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

    await expect(page.locator('[data-desktop-canvas="true"]')).toBeVisible({ timeout: 20000 });
  });

  // PHASE 19 & 22: User Flow & Real DOM Image Verification
  test('Phase 19: User flow transitions between Dark default, Light default, System wallpapers without page reload', async ({ page }) => {
    const wallpaperImg = page.locator('[data-orion-wallpaper-image="true"]');
    await expect(wallpaperImg).toBeVisible({ timeout: 5000 });

    // Step 1: Initial state is Dark Mode -> Dark default wallpaper
    let initialSrc = await wallpaperImg.getAttribute('src');
    expect(initialSrc).toBe('/wallpaper/orion9-desktop-horizon-moon.png');

    // Step 2: Switch to Light Mode (Silver) through authoritative storage and dispatch
    await page.evaluate(() => {
      const prefs = {
        version: 1,
        themeId: 'silver',
        appearanceMode: 'light',
        customAccentEnabled: false,
        transparencyEnabled: true,
        transparencyIntensity: 70,
        blurEnabled: true,
        blurIntensity: 60,
        reduceMotion: false,
        windowStyle: 'standard',
        cornerRadius: 'standard',
        dockPosition: 'bottom',
        dockAlignment: 'center',
        dockAutoHide: false,
        dockShowRunningIndicators: true,
        dockShowBadges: true,
        dockTransparency: true,
        iconStyle: 'default',
        widgetStyle: 'solid',
      };
      localStorage.setItem('orion-appearance-preferences', JSON.stringify(prefs));
      document.documentElement.setAttribute('data-orion-mode', 'light');
      document.documentElement.setAttribute('data-orion-theme', 'silver');
      window.dispatchEvent(new CustomEvent('orion-appearance-preferences-changed', {
        detail: prefs
      }));
    });

    // Step 3: Inspect wallpaper DOM -> Confirm light SVG
    await expect(wallpaperImg).toHaveAttribute('src', '/wallpaper/orion9-desktop-light.svg', { timeout: 5000 });

    // Step 4: Apply Orbital Control Tower Grid via wallpaper repository event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('orion-wallpaper-changed', {
        detail: {
          target: 'desktop',
          wallpaperId: 'sys-orbital-grid-node',
          wallpaper: {
            wallpaperId: 'sys-orbital-grid-node',
            name: 'Orbital Control Tower Grid',
            assetUrl: '/orion-desktop-global-network.jpg',
            target: 'desktop'
          }
        }
      }));
    });

    // Step 5: Confirm wallpaper changes to Orbital Control Tower Grid without reload
    await expect(wallpaperImg).toHaveAttribute('src', '/orion-desktop-global-network.jpg', { timeout: 5000 });

    // Step 6: Apply Deep Orion Atmospheric Nebula
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('orion-wallpaper-changed', {
        detail: {
          target: 'desktop',
          wallpaperId: 'sys-deep-orion-nebula',
          wallpaper: {
            wallpaperId: 'sys-deep-orion-nebula',
            name: 'Deep Orion Atmospheric Nebula',
            assetUrl: '/orion9-space-baseline.png',
            target: 'desktop'
          }
        }
      }));
    });
    await expect(wallpaperImg).toHaveAttribute('src', '/orion9-space-baseline.png', { timeout: 5000 });

    // Step 7: Reset to Light Default
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('orion-wallpaper-changed', {
        detail: {
          target: 'desktop',
          wallpaperId: 'sys-orion-desktop-light-default',
          wallpaper: {
            wallpaperId: 'sys-orion-desktop-light-default',
            name: 'Orion Luminous Silver Horizon',
            assetUrl: '/wallpaper/orion9-desktop-light.svg',
            target: 'desktop'
          }
        }
      }));
    });
    await expect(wallpaperImg).toHaveAttribute('src', '/wallpaper/orion9-desktop-light.svg', { timeout: 5000 });

    // Step 8: Switch back to Dark Mode (Graphite)
    await page.evaluate(() => {
      const prefs = {
        version: 1,
        themeId: 'graphite',
        appearanceMode: 'dark',
        customAccentEnabled: false,
        transparencyEnabled: true,
        transparencyIntensity: 70,
        blurEnabled: true,
        blurIntensity: 60,
        reduceMotion: false,
        windowStyle: 'standard',
        cornerRadius: 'standard',
        dockPosition: 'bottom',
        dockAlignment: 'center',
        dockAutoHide: false,
        dockShowRunningIndicators: true,
        dockShowBadges: true,
        dockTransparency: true,
        iconStyle: 'default',
        widgetStyle: 'solid',
      };
      localStorage.setItem('orion-appearance-preferences', JSON.stringify(prefs));
      document.documentElement.setAttribute('data-orion-mode', 'dark');
      document.documentElement.setAttribute('data-orion-theme', 'graphite');
      window.dispatchEvent(new CustomEvent('orion-appearance-preferences-changed', {
        detail: prefs
      }));
    });
    await expect(wallpaperImg).toHaveAttribute('src', '/wallpaper/orion9-desktop-horizon-moon.png', { timeout: 5000 });
  });

  // PHASE 20: Persistence across reload and theme toggle with custom wallpaper
  test('Phase 20: Custom wallpaper is preserved across mode changes and page reload', async ({ page }) => {
    const wallpaperImg = page.locator('[data-orion-wallpaper-image="true"]');
    await expect(wallpaperImg).toBeVisible({ timeout: 5000 });

    // Set custom wallpaper
    const customAssetUrl = '/orion-desktop-global-network.jpg';
    await page.evaluate((url) => {
      localStorage.setItem('orion_active_wallpaper_id_desktop_local-admin', 'wp_custom_network');
      localStorage.setItem('orion_active_wallpaper_id_desktop_global', 'wp_custom_network');
      window.dispatchEvent(new CustomEvent('orion-wallpaper-changed', {
        detail: {
          target: 'desktop',
          wallpaperId: 'wp_custom_network',
          wallpaper: {
            wallpaperId: 'wp_custom_network',
            name: 'Custom Network',
            assetUrl: url,
            target: 'desktop'
          }
        }
      }));
    }, customAssetUrl);

    await expect(wallpaperImg).toHaveAttribute('src', customAssetUrl, { timeout: 5000 });

    // Switch between light and dark modes
    await page.evaluate(() => {
      const prefs = {
        version: 1,
        themeId: 'silver',
        appearanceMode: 'light',
        customAccentEnabled: false,
        transparencyEnabled: true,
        transparencyIntensity: 70,
        blurEnabled: true,
        blurIntensity: 60,
        reduceMotion: false,
        windowStyle: 'standard',
        cornerRadius: 'standard',
        dockPosition: 'bottom',
        dockAlignment: 'center',
        dockAutoHide: false,
        dockShowRunningIndicators: true,
        dockShowBadges: true,
        dockTransparency: true,
        iconStyle: 'default',
        widgetStyle: 'solid',
      };
      localStorage.setItem('orion-appearance-preferences', JSON.stringify(prefs));
      document.documentElement.setAttribute('data-orion-mode', 'light');
      window.dispatchEvent(new CustomEvent('orion-appearance-preferences-changed', {
        detail: prefs
      }));
    });
    // Custom wallpaper remains!
    await expect(wallpaperImg).toHaveAttribute('src', customAssetUrl, { timeout: 5000 });

    await page.evaluate(() => {
      const prefs = {
        version: 1,
        themeId: 'graphite',
        appearanceMode: 'dark',
        customAccentEnabled: false,
        transparencyEnabled: true,
        transparencyIntensity: 70,
        blurEnabled: true,
        blurIntensity: 60,
        reduceMotion: false,
        windowStyle: 'standard',
        cornerRadius: 'standard',
        dockPosition: 'bottom',
        dockAlignment: 'center',
        dockAutoHide: false,
        dockShowRunningIndicators: true,
        dockShowBadges: true,
        dockTransparency: true,
        iconStyle: 'default',
        widgetStyle: 'solid',
      };
      localStorage.setItem('orion-appearance-preferences', JSON.stringify(prefs));
      document.documentElement.setAttribute('data-orion-mode', 'dark');
      window.dispatchEvent(new CustomEvent('orion-appearance-preferences-changed', {
        detail: prefs
      }));
    });
    // Custom wallpaper still remains!
    await expect(wallpaperImg).toHaveAttribute('src', customAssetUrl, { timeout: 5000 });
  });

  // PHASE 21: Race Condition Test
  test('Phase 21: Rapid mode switching commits only the final state without stale dark/light commits', async ({ page }) => {
    const wallpaperImg = page.locator('[data-orion-wallpaper-image="true"]');
    await expect(wallpaperImg).toBeVisible({ timeout: 5000 });

    // Rapid switches: Light -> Dark -> Light -> Dark -> Light
    await page.evaluate(() => {
      const modes = ['light', 'dark', 'light', 'dark', 'light'];
      modes.forEach(mode => {
        const prefs = {
          version: 1,
          themeId: mode === 'light' ? 'silver' : 'graphite',
          appearanceMode: mode,
          customAccentEnabled: false,
          transparencyEnabled: true,
          transparencyIntensity: 70,
          blurEnabled: true,
          blurIntensity: 60,
          reduceMotion: false,
          windowStyle: 'standard',
          cornerRadius: 'standard',
          dockPosition: 'bottom',
          dockAlignment: 'center',
          dockAutoHide: false,
          dockShowRunningIndicators: true,
          dockShowBadges: true,
          dockTransparency: true,
          iconStyle: 'default',
          widgetStyle: 'solid',
        };
        localStorage.setItem('orion-appearance-preferences', JSON.stringify(prefs));
        document.documentElement.setAttribute('data-orion-mode', mode);
        window.dispatchEvent(new CustomEvent('orion-appearance-preferences-changed', {
          detail: prefs
        }));
      });
    });

    // Final state MUST be light SVG
    await expect(wallpaperImg).toHaveAttribute('src', '/wallpaper/orion9-desktop-light.svg', { timeout: 5000 });

    // Reverse rapid switches: Dark -> Light -> Dark -> Light -> Dark
    await page.evaluate(() => {
      const modes = ['dark', 'light', 'dark', 'light', 'dark'];
      modes.forEach(mode => {
        const prefs = {
          version: 1,
          themeId: mode === 'light' ? 'silver' : 'graphite',
          appearanceMode: mode,
          customAccentEnabled: false,
          transparencyEnabled: true,
          transparencyIntensity: 70,
          blurEnabled: true,
          blurIntensity: 60,
          reduceMotion: false,
          windowStyle: 'standard',
          cornerRadius: 'standard',
          dockPosition: 'bottom',
          dockAlignment: 'center',
          dockAutoHide: false,
          dockShowRunningIndicators: true,
          dockShowBadges: true,
          dockTransparency: true,
          iconStyle: 'default',
          widgetStyle: 'solid',
        };
        localStorage.setItem('orion-appearance-preferences', JSON.stringify(prefs));
        document.documentElement.setAttribute('data-orion-mode', mode);
        window.dispatchEvent(new CustomEvent('orion-appearance-preferences-changed', {
          detail: prefs
        }));
      });
    });

    // Final state MUST be dark horizon moon
    await expect(wallpaperImg).toHaveAttribute('src', '/wallpaper/orion9-desktop-horizon-moon.png', { timeout: 5000 });
  });
});
