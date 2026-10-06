import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Wallpaper Runtime Visual & DOM Diagnostic', () => {
  test('Diagnose wallpaper lifecycle, visual integrity, geometry, and image loading across all interactions', async ({ page }) => {
    const screenshotDir = path.join(process.cwd(), 'wallpaper-diagnostic-shots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const consoleLogs: string[] = [];
    const imageEvents: any[] = [];

    page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => consoleLogs.push(`[PAGE_ERROR] ${err.message}`));

    // Monitor network requests for wallpaper images
    page.on('response', resp => {
      if (resp.url().includes('wallpaper') || resp.url().includes('.png') || resp.url().includes('.jpg')) {
        imageEvents.push({
          url: resp.url(),
          status: resp.status(),
          contentType: resp.headers()['content-type'],
          contentLength: resp.headers()['content-length'],
        });
      }
    });

    await page.setViewportSize({ width: 1440, height: 900 });

    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('orion_os_power_state', 'ON');
        localStorage.setItem('orion9_database_environment', 'DEMO');
        localStorage.setItem('orion_settings', JSON.stringify({ userExperienceMode: 'ADVANCED' }));
        localStorage.setItem('orion_system_settings', JSON.stringify({ userExperienceMode: 'ADVANCED' }));
      } catch (e) {}
    });

    // 1. Visit Login Page
    await page.goto('/login');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '01_login_initial.png') });

    // Inspect login wallpaper
    const loginWallpaper = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="orion-live-wallpaper-container"]');
      const img = document.querySelector('.orion-static-wallpaper-img') as HTMLImageElement | null;
      return {
        containerExists: !!container,
        containerTarget: container?.getAttribute('data-target'),
        containerRect: container?.getBoundingClientRect(),
        imgExists: !!img,
        src: img?.src,
        currentSrc: img?.currentSrc,
        naturalWidth: img?.naturalWidth,
        naturalHeight: img?.naturalHeight,
        complete: img?.complete,
        computedStyles: img ? {
          position: window.getComputedStyle(img).position,
          zIndex: window.getComputedStyle(img).zIndex,
          display: window.getComputedStyle(img).display,
          visibility: window.getComputedStyle(img).visibility,
          opacity: window.getComputedStyle(img).opacity,
          transform: window.getComputedStyle(img).transform,
          filter: window.getComputedStyle(img).filter,
          objectFit: window.getComputedStyle(img).objectFit,
        } : null
      };
    });
    console.log('--- LOGIN WALLPAPER DIAGNOSTIC ---', JSON.stringify(loginWallpaper, null, 2));

    // 2. Set authenticated session directly to enter desktop
    await page.evaluate(() => {
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
    });

    await page.goto('/');

    // 3. Wait for Desktop
    await expect(page.locator('[data-desktop-canvas="true"]')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1500); // Allow all transitions to settle
    await page.screenshot({ path: path.join(screenshotDir, '02_desktop_initial.png') });

    // 4. Inspect desktop wallpaper image and container
    const desktopWallpaperInitial = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="orion-live-wallpaper-container"]');
      const layer = document.querySelector('.orion-desktop-wallpaper-layer');
      const shell = document.querySelector('.orion-desktop-shell');
      const img = document.querySelector('.orion-static-wallpaper-img') as HTMLImageElement | null;
      const elementAtCenter = document.elementFromPoint(720, 450);
      const elementsAtCenter = document.elementsFromPoint(720, 450).map(el => `${el.tagName}.${el.className.slice(0, 30)}`);

      return {
        shellRect: shell?.getBoundingClientRect(),
        layerRect: layer?.getBoundingClientRect(),
        layerComputed: layer ? {
          top: window.getComputedStyle(layer).top,
          height: window.getComputedStyle(layer).height,
          position: window.getComputedStyle(layer).position,
          zIndex: window.getComputedStyle(layer).zIndex,
          gridRow: window.getComputedStyle(layer).gridRow,
        } : null,
        containerRect: container?.getBoundingClientRect(),
        containerTarget: container?.getAttribute('data-target'),
        imgExists: !!img,
        src: img?.src,
        currentSrc: img?.currentSrc,
        naturalWidth: img?.naturalWidth,
        naturalHeight: img?.naturalHeight,
        complete: img?.complete,
        imgRect: img?.getBoundingClientRect(),
        computedStyles: img ? {
          position: window.getComputedStyle(img).position,
          zIndex: window.getComputedStyle(img).zIndex,
          display: window.getComputedStyle(img).display,
          visibility: window.getComputedStyle(img).visibility,
          opacity: window.getComputedStyle(img).opacity,
          transform: window.getComputedStyle(img).transform,
          filter: window.getComputedStyle(img).filter,
          objectFit: window.getComputedStyle(img).objectFit,
          width: window.getComputedStyle(img).width,
          height: window.getComputedStyle(img).height,
        } : null,
        elementAtCenter: elementAtCenter ? `${elementAtCenter.tagName}.${elementAtCenter.className.slice(0, 40)}` : null,
        elementsAtCenter
      };
    });
    console.log('--- DESKTOP WALLPAPER INITIAL DIAGNOSTIC ---', JSON.stringify(desktopWallpaperInitial, null, 2));

    // 5. Open Start Menu
    const startBtn = page.locator('[data-testid="dock-start-menu-button"]');
    await startBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, '03_start_menu_open.png') });

    // 6. Close Start Menu
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, '04_start_menu_closed.png') });

    // 7. Open an Application Window (e.g. Notepad)
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('orion:open-app', { detail: { appId: 'notepad' } })));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '05_window_open.png') });

    // 8. Open multiple windows (e.g. Inventory)
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('orion:open-app', { detail: { appId: 'inventory' } })));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '06_multiple_windows.png') });

    // 9. Close windows
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('orion:close-app', { detail: { appId: 'notepad' } }));
      window.dispatchEvent(new CustomEvent('orion:close-app', { detail: { appId: 'inventory' } }));
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(screenshotDir, '07_windows_closed.png') });

    // 10. Drag desktop shortcut
    const computerSc = page.locator('[data-target-id="orion-computer"]').first();
    if (await computerSc.isVisible()) {
      const box = await computerSc.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down({ button: 'left' });
        await page.mouse.move(box.x + 200, box.y + 150, { steps: 5 });
        await page.mouse.up({ button: 'left' });
      }
    }
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, '08_after_icon_drag.png') });

    // 11. Create a shortcut from Start Menu
    await startBtn.click();
    const launcher = page.locator('div[role="dialog"][aria-label="Application Launcher"]').or(page.locator('[data-testid="orion-application-launcher"]'));
    await expect(launcher.first()).toBeVisible({ timeout: 5000 });
    const procCard = page.locator('[data-testid="launcher-app-procurement"]').first();
    const pBox = await procCard.boundingBox();
    if (pBox) {
      await page.mouse.move(pBox.x + pBox.width / 2, pBox.y + pBox.height / 2);
      await page.mouse.down({ button: 'left' });
      await page.mouse.move(pBox.x + 15, pBox.y + 15, { steps: 5 });
      await page.mouse.move(200, 300, { steps: 10 });
      await page.mouse.up({ button: 'left' });
    }
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '09_after_shortcut_created.png') });

    // 12. Reload Page
    await page.reload();
    await expect(page.locator('[data-desktop-canvas="true"]')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotDir, '10_after_page_reload.png') });

    // 13. Viewport Resize Test: 1920x1080 and 1280x720
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, '11_viewport_1920x1080.png') });

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, '12_viewport_1280x720.png') });

    // Final DOM / image inspection
    const finalInspection = await page.evaluate(() => {
      const img = document.querySelector('.orion-static-wallpaper-img') as HTMLImageElement | null;
      return {
        src: img?.src,
        naturalWidth: img?.naturalWidth,
        naturalHeight: img?.naturalHeight,
        complete: img?.complete,
        imgRect: img?.getBoundingClientRect(),
        layerRect: document.querySelector('.orion-desktop-wallpaper-layer')?.getBoundingClientRect(),
        containerRect: document.querySelector('[data-testid="orion-live-wallpaper-container"]')?.getBoundingClientRect(),
      };
    });
    console.log('--- FINAL INSPECTION ---', JSON.stringify(finalInspection, null, 2));
    console.log('--- IMAGE NETWORK EVENTS ---', JSON.stringify(imageEvents, null, 2));
    console.log('--- CONSOLE LOGS ---', JSON.stringify(consoleLogs.slice(-20), null, 2));

    expect(finalInspection.complete).toBe(true);
    expect(finalInspection.naturalWidth).toBeGreaterThan(0);
    expect(finalInspection.naturalHeight).toBeGreaterThan(0);
  });
});
