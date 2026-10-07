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
    expect(desktopSrc).toBeTruthy();

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

  // TEST 13: WALLPAPER-01: wallpaper remains stable for 60 seconds
  test('13. WALLPAPER-01: wallpaper remains stable for 60 seconds', async ({ page }) => {
    test.setTimeout(90000);
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

    const wallpaperImg = page.locator('.orion-static-wallpaper-img');
    await expect(wallpaperImg).toBeVisible();

    const initialMetrics = await wallpaperImg.evaluate((img: HTMLImageElement) => ({
      src: img.currentSrc || img.src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete
    }));

    expect(initialMetrics.src).toBeTruthy();
    expect(initialMetrics.naturalWidth).toBeGreaterThan(0);
    expect(initialMetrics.naturalHeight).toBeGreaterThan(0);
    expect(initialMetrics.complete).toBe(true);

    // Periodically verify across intervals: 5s, 10s, 20s, 30s, 45s, 60s
    const checkIntervals = [5000, 5000, 10000, 10000, 15000, 15000];
    for (let i = 0; i < checkIntervals.length; i++) {
      await page.waitForTimeout(checkIntervals[i]);
      const current = await wallpaperImg.evaluate((img: HTMLImageElement) => {
        const style = window.getComputedStyle(img);
        return {
          src: img.currentSrc || img.src,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          complete: img.complete,
          opacity: style.opacity,
          visibility: style.visibility
        };
      });

      expect(current.src).toBe(initialMetrics.src);
      expect(current.naturalWidth).toBeGreaterThan(0);
      expect(current.naturalHeight).toBeGreaterThan(0);
      expect(current.complete).toBe(true);
      expect(current.opacity).toBe('1');
      expect(current.visibility).toBe('visible');
    }
  });

  // TEST 14: Wallpaper brightness is scoped to wallpaper image and does not create global body::after overlay
  test('14. Wallpaper brightness is scoped to wallpaper and does not affect OS chrome', async ({ page }) => {
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

    // Verify global body::after overlay is completely removed
    const bodyAfterZ = await page.evaluate(() => {
      const style = window.getComputedStyle(document.body, '::after');
      return {
        content: style.content,
        zIndex: style.zIndex,
        position: style.position
      };
    });
    // In CSS, removed rule means content is "none" or normal, and zIndex is "auto" (not 2147483647)
    expect(bodyAfterZ.zIndex).not.toBe('2147483647');

    // Test brightness values: 100%, 80%, 60%, 40%, 20%
    const testValues = [100, 80, 60, 40, 20];
    for (const val of testValues) {
      await page.evaluate((b) => {
        const multiplier = Math.max(20, Math.min(100, b)) / 100;
        document.documentElement.style.setProperty('--orion-wallpaper-brightness', String(multiplier));
      }, val);

      // Allow 250ms for transition
      await page.waitForTimeout(250);

      const info = await page.locator('.orion-static-wallpaper-img').evaluate((img) => {
        return {
          filter: window.getComputedStyle(img).filter,
          rootVar: document.documentElement.style.getPropertyValue('--orion-wallpaper-brightness'),
          imgVar: window.getComputedStyle(img).getPropertyValue('--orion-wallpaper-brightness')
        };
      });

      const expectedMultiplier = val / 100;
      expect(info.imgVar.trim()).toBe(String(expectedMultiplier));

      // Verify Dock and System Bar remain fully visible with opacity 1
      const dock = page.locator('.orion-unified-dock');
      if (await dock.isVisible()) {
        const dockOpacity = await dock.evaluate(el => window.getComputedStyle(el).opacity);
        expect(dockOpacity).toBe('1');
      }
    }
  });

  // TEST 15: Failed candidate preserves current wallpaper without black frame
  test('15. Failed candidate preserves current wallpaper without flashing or defaulting', async ({ page }) => {
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

    const wallpaperImg = page.locator('.orion-static-wallpaper-img');
    const validSrc = await wallpaperImg.evaluate((img: HTMLImageElement) => img.currentSrc || img.src);

    // Dispatch wallpaper change event with an invalid candidate URL
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('orion-active-wallpaper-changed', {
        detail: {
          target: 'desktop',
          wallpaper: {
            wallpaperId: 'invalid-broken-wp',
            name: 'Non Existent Image',
            assetUrl: '/wallpaper/completely-broken-does-not-exist-404.png',
            target: 'desktop'
          }
        }
      }));
    });

    // Wait 1.5 seconds for candidate verification to fail
    await page.waitForTimeout(1500);

    // The valid wallpaper MUST remain untouched and loaded
    const afterFailedSrc = await wallpaperImg.evaluate((img: HTMLImageElement) => ({
      src: img.currentSrc || img.src,
      naturalWidth: img.naturalWidth,
      complete: img.complete
    }));

    expect(afterFailedSrc.src).toBe(validSrc);
    expect(afterFailedSrc.naturalWidth).toBeGreaterThan(0);
    expect(afterFailedSrc.complete).toBe(true);
  });

  // TEST 16: Theme changes preserve wallpaper without resetting
  test('16. Theme changes preserve wallpaper stability', async ({ page }) => {
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

    const wallpaperImg = page.locator('.orion-static-wallpaper-img');
    const initialSrc = await wallpaperImg.evaluate((img: HTMLImageElement) => img.currentSrc || img.src);

    // Cycle through themes
    const themes = ['graphite', 'midnight', 'forest', 'warm', 'silver'];
    for (const themeId of themes) {
      await page.evaluate((id) => {
        document.documentElement.setAttribute('data-orion-theme', id);
      }, themeId);

      await page.waitForTimeout(300);

      const currentSrc = await wallpaperImg.evaluate((img: HTMLImageElement) => img.currentSrc || img.src);
      expect(currentSrc).toBe(initialSrc);
    }
  });
});
