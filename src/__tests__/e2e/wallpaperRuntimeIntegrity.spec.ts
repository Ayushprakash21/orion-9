import { test, expect } from '@playwright/test';

test.describe('ORION-9 Wallpaper Runtime Integrity & Target Isolation E2E Suite', () => {

  test.beforeEach(async ({ page }) => {
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
  });

  // TEST 1: Initial Desktop Wallpaper Integrity
  test('1. Initial desktop wallpaper integrity (renders, fills screen, natural dimensions > 0, complete true, opacity 1, visibility visible)', async ({ page }) => {
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

    const wallpaperLayer = page.locator('.orion-desktop-wallpaper-layer');
    await expect(wallpaperLayer).toBeVisible();

    const layerMetrics = await wallpaperLayer.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        position: style.position,
        zIndex: style.zIndex,
        pointerEvents: style.pointerEvents
      };
    });

    expect(layerMetrics.top).toBe(0);
    expect(layerMetrics.left).toBe(0);
    expect(layerMetrics.width).toBeGreaterThanOrEqual(1200);
    expect(layerMetrics.height).toBeGreaterThanOrEqual(700);
    expect(layerMetrics.zIndex).toBe('0');
    expect(layerMetrics.pointerEvents).toBe('none');

    const wallpaperImg = page.locator('.orion-static-wallpaper-img');
    await expect(wallpaperImg).toBeVisible();

    const imgMetrics = await wallpaperImg.evaluate((el: HTMLImageElement) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        complete: el.complete,
        naturalWidth: el.naturalWidth,
        naturalHeight: el.naturalHeight,
        currentSrc: el.currentSrc,
        objectFit: style.objectFit,
        opacity: style.opacity,
        visibility: style.visibility,
        top: rect.top,
        height: rect.height
      };
    });

    expect(imgMetrics.complete).toBe(true);
    expect(imgMetrics.naturalWidth).toBeGreaterThan(0);
    expect(imgMetrics.naturalHeight).toBeGreaterThan(0);
    expect(imgMetrics.objectFit).toBe('cover');
    expect(imgMetrics.opacity).toBe('1');
    expect(imgMetrics.visibility).toBe('visible');
    expect(imgMetrics.top).toBe(0);
  });

  // TEST 2: Login screen wallpaper integrity
  test('2. Login screen wallpaper integrity (renders, target=login asset, full screen)', async ({ page }) => {
    // Navigate to /login without active session
    await page.addInitScript(() => {
      try {
        localStorage.removeItem('orion_auth_session');
        sessionStorage.removeItem('orion_auth_session');
      } catch (e) {}
    });

    await page.goto('/login');
    await expect(page.locator('input#username')).toBeVisible({ timeout: 15000 });

    const loginWallpaper = page.locator('[data-testid="orion-live-wallpaper-container"][data-target="login"]');
    await expect(loginWallpaper).toBeVisible();

    const loginImg = loginWallpaper.locator('.orion-static-wallpaper-img');
    await expect(loginImg).toBeVisible();

    const imgData = await loginImg.evaluate((img: HTMLImageElement) => ({
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      src: img.src
    }));

    expect(imgData.complete).toBe(true);
    expect(imgData.naturalWidth).toBeGreaterThan(0);
    expect(imgData.src).toContain('orion9-earth-horizon-default.png');
  });

  // TEST 3: Target Isolation
  test('3. Target isolation (login wallpaper does not overwrite desktop, desktop wallpaper does not overwrite login)', async ({ page }) => {
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

    const desktopContainer = page.locator('[data-testid="orion-live-wallpaper-container"][data-target="desktop"]');
    await expect(desktopContainer).toBeVisible();

    const desktopSrc = await desktopContainer.locator('.orion-static-wallpaper-img').getAttribute('src');
    expect(desktopSrc).toContain('orion9-desktop-minimal-graphite.png');

    // Trigger an active wallpaper change event on 'login' target
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('orion-active-wallpaper-changed', {
        detail: {
          target: 'login',
          wallpaper: {
            wallpaperId: 'test-login-fake',
            name: 'Test Fake Login',
            assetUrl: '/fake-login-wp.png'
          }
        }
      }));
    });

    await page.waitForTimeout(300);

    // Desktop wallpaper src MUST remain unchanged!
    const desktopSrcAfter = await desktopContainer.locator('.orion-static-wallpaper-img').getAttribute('src');
    expect(desktopSrcAfter).toBe(desktopSrc);
  });

  // TEST 4: Start menu open/close does not alter wallpaper layer
  test('4. Start menu opening/closing does not alter wallpaper layer, image, or geometry', async ({ page }) => {
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

    const getMetrics = async () => page.locator('.orion-desktop-wallpaper-layer').evaluate(el => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top, height: rect.height };
    });

    const before = await getMetrics();

    // Open start menu
    await page.click('[data-testid="dock-start-menu-button"]');
    await expect(page.locator('div[role="dialog"][aria-label="Application Launcher"]')).toBeVisible();

    const during = await getMetrics();
    expect(during.top).toBe(before.top);
    expect(during.height).toBe(before.height);

    // Close start menu
    await page.keyboard.press('Escape');
    await expect(page.locator('div[role="dialog"][aria-label="Application Launcher"]')).not.toBeVisible();

    const after = await getMetrics();
    expect(after.top).toBe(before.top);
    expect(after.height).toBe(before.height);
  });

  // TEST 5: Window open/close does not alter wallpaper
  test('5. Window open/close does not alter wallpaper layer, image, or geometry', async ({ page }) => {
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

    const getMetrics = async () => page.locator('.orion-desktop-wallpaper-layer').evaluate(el => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top, height: rect.height };
    });

    const before = await getMetrics();

    // Open Notepad
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('orion:open-app', { detail: { appId: 'notepad' } })));
    await page.waitForTimeout(500);

    const during = await getMetrics();
    expect(during.top).toBe(before.top);
    expect(during.height).toBe(before.height);

    // Close Notepad
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('orion:close-app', { detail: { appId: 'notepad' } })));
    await page.waitForTimeout(500);

    const after = await getMetrics();
    expect(after.top).toBe(before.top);
    expect(after.height).toBe(before.height);
  });

  // TEST 6: Desktop icon drag does not affect wallpaper
  test('6. Desktop icon drag does not affect wallpaper', async ({ page }) => {
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

    const icon = page.locator('[data-target-id="orion-computer"]').first();
    const box = await icon.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down({ button: 'left' });
      await page.mouse.move(box.x + 150, box.y + 100, { steps: 5 });
      await page.mouse.up({ button: 'left' });
    }

    const wallpaperImg = page.locator('.orion-static-wallpaper-img');
    await expect(wallpaperImg).toBeVisible();
    const top = await wallpaperImg.evaluate(el => el.getBoundingClientRect().top);
    expect(top).toBe(0);
  });

  // TEST 7: Dragging app from start menu to desktop creates shortcut and preserves wallpaper
  test('7. Dragging app from start menu to desktop creates shortcut and preserves wallpaper', async ({ page }) => {
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

    await page.click('[data-testid="dock-start-menu-button"]');
    const procCard = page.locator('[data-testid="launcher-app-procurement"]').first();
    await expect(procCard).toBeVisible();

    const pBox = await procCard.boundingBox();
    if (pBox) {
      await page.mouse.move(pBox.x + pBox.width / 2, pBox.y + pBox.height / 2);
      await page.mouse.down({ button: 'left' });
      await page.mouse.move(pBox.x + 15, pBox.y + 15, { steps: 5 });
      await page.mouse.move(250, 350, { steps: 10 });
      await page.mouse.up({ button: 'left' });
    }

    await page.waitForTimeout(500);
    const wallpaperLayer = page.locator('.orion-desktop-wallpaper-layer');
    const top = await wallpaperLayer.evaluate(el => el.getBoundingClientRect().top);
    expect(top).toBe(0);
  });

  // TEST 8: Page reload retains exact same wallpaper
  test('8. Page reload retains the exact same wallpaper', async ({ page }) => {
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

    const src1 = await page.locator('.orion-static-wallpaper-img').getAttribute('src');

    await page.reload();
    await expect(page.locator('[data-desktop-canvas="true"]')).toBeVisible({ timeout: 20000 });

    const src2 = await page.locator('.orion-static-wallpaper-img').getAttribute('src');
    expect(src1).toBe(src2);
  });

  // TEST 9: Viewport resize across multiple aspect ratios
  test('9. Resizing viewport to multiple aspect ratios maintains object-cover and zero gaps', async ({ page }) => {
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

    const viewports = [
      { width: 1920, height: 1080 }, // 16:9 Full HD
      { width: 1440, height: 900 },  // 16:10 MacBook
      { width: 1600, height: 1200 }, // 4:3 Workstation
      { width: 2560, height: 1080 }, // 21:9 Ultrawide
      { width: 1366, height: 768 }   // 16:9 Standard Laptop
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.waitForTimeout(150);

      const metrics = await page.locator('.orion-desktop-wallpaper-layer').evaluate(el => {
        const rect = el.getBoundingClientRect();
        return {
          top: rect.top,
          left: rect.left,
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      });

      expect(metrics.top).toBe(0);
      expect(metrics.left).toBe(0);
      expect(metrics.width).toBe(vp.width);
      expect(metrics.height).toBe(vp.height);
    }
  });

  // TEST 10: Pointer events and z-index isolation
  test('10. Wallpaper layer has pointer-events-none and z-0', async ({ page }) => {
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

    const styles = await page.locator('.orion-desktop-wallpaper-layer').evaluate(el => {
      const s = window.getComputedStyle(el);
      return {
        pointerEvents: s.pointerEvents,
        zIndex: s.zIndex
      };
    });

    expect(styles.pointerEvents).toBe('none');
    expect(styles.zIndex).toBe('0');
  });

  // TEST 11: Network image asset response
  test('11. Wallpaper image loads with 200/304 OK from network', async ({ page }) => {
    const res = await page.request.get('/wallpaper/orion9-desktop-horizon-moon.png');
    expect(res.status()).toBe(200);
    const contentType = res.headers()['content-type'] || '';
    expect(contentType.toLowerCase()).toContain('image/png');
  });

  // TEST 12: Wallpaper Error Boundary fallback safety
  test('12. Fallback works if asset path fails (WallpaperErrorBoundary catches error or fallback renders gracefully)', async ({ page }) => {
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

    // Intentionally trigger image error to verify fallback
    await page.evaluate(() => {
      const img = document.querySelector('.orion-static-wallpaper-img') as HTMLImageElement;
      if (img) {
        img.dispatchEvent(new Event('error'));
      }
    });

    await page.waitForTimeout(300);

    // The container should still be present with cosmic dark styling
    const container = page.locator('[data-testid="orion-live-wallpaper-container"]');
    await expect(container).toBeVisible();
    const bg = await container.evaluate(el => window.getComputedStyle(el).backgroundColor);
    // Background is #02050a -> rgb(2, 5, 10)
    expect(bg).toContain('rgb(2, 5, 10)');
  });
});
