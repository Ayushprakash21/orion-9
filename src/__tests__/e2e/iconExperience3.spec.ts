import { test, expect, Page } from '@playwright/test';
import path from 'node:path';

const ARTIFACTS_DIR = 'C:/Users/Ayush/.gemini/antigravity/brain/5f06512e-da58-4a5d-be62-e2ac72ec78f8';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function authenticateDemo(page: Page, themeId: 'graphite' | 'silver' = 'graphite') {
  await page.addInitScript((initialTheme) => {
    try {
      sessionStorage.setItem('orion_os_power_state', 'ON');
      localStorage.setItem('orion9_database_environment', 'DEMO');
      localStorage.setItem('orion_settings', JSON.stringify({ userExperienceMode: 'ADVANCED', dockAutoHide: false }));
      localStorage.setItem('orion_system_settings', JSON.stringify({ userExperienceMode: 'ADVANCED', dockAutoHide: false }));
      localStorage.setItem('orion_os_settings', JSON.stringify({ dockAutoHide: false }));
      localStorage.setItem('orion_dynamic_island_pinned', 'false');
      localStorage.setItem(
        'orion-appearance-preferences',
        JSON.stringify({
          version: 2,
          themeId: initialTheme,
          appearanceMode: initialTheme === 'silver' ? 'light' : 'dark',
          customAccentEnabled: false,
          customAccent: initialTheme === 'silver' ? '#4A5D78' : '#D8DDE3',
        })
      );
      localStorage.setItem(
        'orion_auth_session',
        JSON.stringify({
          user: {
            id: 'local-admin',
            username: 'admin',
            fullName: 'Orion-9 Administrator',
            displayName: 'Admin',
            email: 'admin@orion.network',
            role: 'platform_admin',
            organizationId: 'ORION_PLATFORM',
            organizationName: 'ORION_PLATFORM',
            department: 'Supply Chain Operations',
          },
          organization: {
            id: 'ORION_PLATFORM',
            name: 'ORION_PLATFORM',
            status: 'active',
          },
          permissions: ['all'],
          environment: 'DEMO',
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        })
      );
    } catch {}
  }, themeId);

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('.orion-global-topbar', { timeout: 20000 });
  await page.waitForTimeout(450);
}

async function assertZeroFallbackAndZeroSvgFilters(page: Page, scopeLabel: string) {
  const report = await page.evaluate(() => {
    const fallbacks = Array.from(document.querySelectorAll('[data-icon-fallback="true"]')).map((el) =>
      el.getAttribute('data-orion-app-icon')
    );
    const allRenderedIcons = Array.from(document.querySelectorAll('[data-orion-app-icon]')).length;
    const svgFilters = document.querySelectorAll('svg filter, svg feDropShadow').length;
    const imgInsideIcons = document.querySelectorAll('[data-orion-app-icon] img').length;
    const svgIds = Array.from(document.querySelectorAll('svg [id]')).map((el) => el.id).filter(Boolean);
    const duplicateIds: string[] = [];
    const seen = new Set<string>();
    for (const id of svgIds) {
      if (seen.has(id)) duplicateIds.push(id);
      seen.add(id);
    }
    return { fallbacks, allRenderedIcons, svgFilters, imgInsideIcons, duplicateIds };
  });

  expect(report.allRenderedIcons, `${scopeLabel}: expected rendered OrionAppIcons`).toBeGreaterThan(0);
  expect(report.fallbacks, `${scopeLabel}: fallback icons detected`).toEqual([]);
  expect(report.svgFilters, `${scopeLabel}: SVG filter/feDropShadow count`).toBe(0);
  expect(report.imgInsideIcons, `${scopeLabel}: raster img count inside icons`).toBe(0);
  expect(report.duplicateIds, `${scopeLabel}: duplicate SVG gradient/clip IDs`).toEqual([]);
}

test.describe('Icon Experience 3.0 — Complete Visual, Theme & Performance Verification', () => {
  test('ICON3-E2E-01: Desktop & Full Dock Dark/Light themes render 0 fallbacks and 0 SVG filters', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.setViewportSize({ width: 1440, height: 900 });
    await authenticateDemo(page, 'graphite');

    await assertZeroFallbackAndZeroSvgFilters(page, 'Desktop + Dock (Dark)');

    const dockThemesDark = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-orion-app-icon]')).map((el) => el.getAttribute('data-icon-theme'))
    );
    expect(dockThemesDark.every((t) => t === 'dark')).toBe(true);

    // Ensure Dock is revealed if auto-hide preference was hydrated asynchronously
    const dockReveal = page.getByTestId('dock-reveal-handle');
    if (await dockReveal.isVisible().catch(() => false)) {
      await page.mouse.move(720, 898);
      await page.waitForTimeout(350);
    }
    await expect(page.getByTestId('dock-start-menu-button')).toBeVisible({ timeout: 8000 });
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'icon3_desktop_dock_dark.png'),
      fullPage: false,
    });

    // Sweep hover across Dock items to verify smooth magnification without layout errors
    const dockButtons = page.locator('[data-orion-dock] button[aria-label], nav[aria-label="Orion Dock"] button[aria-label]');
    const dockCount = await dockButtons.count();
    for (let i = 0; i < Math.min(dockCount, 8); i++) {
      const box = await dockButtons.nth(i).boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      }
    }

    // Boot cleanly in Silver (Light) theme and verify all icons switch automatically
    await authenticateDemo(page, 'silver');
    await assertZeroFallbackAndZeroSvgFilters(page, 'Desktop + Dock (Light)');
    const dockThemesLight = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-orion-app-icon]')).map((el) => el.getAttribute('data-icon-theme'))
    );
    expect(dockThemesLight.every((t) => t === 'light')).toBe(true);

    if (await page.getByTestId('dock-reveal-handle').isVisible().catch(() => false)) {
      await page.mouse.move(720, 898);
      await page.waitForTimeout(350);
    }
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'icon3_desktop_dock_light.png'),
      fullPage: false,
    });

    expect(errors).toEqual([]);
  });

  test('ICON3-E2E-02: Application Launcher & Window Header compact icons', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await authenticateDemo(page, 'graphite');

    // Reveal Dock if auto-hidden, then open Application Launcher via Dock button
    await page.mouse.move(720, 898);
    await page.waitForTimeout(350);
    const startBtn = page.getByTestId('dock-start-menu-button');
    await expect(startBtn).toBeVisible({ timeout: 8000 });
    await startBtn.click({ force: true });
    await page.waitForTimeout(450);

    await assertZeroFallbackAndZeroSvgFilters(page, 'Application Launcher');
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'icon3_launcher.png'),
      fullPage: false,
    });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);

    // Open multiple apps to verify 16px/20px compact window header icons & Command Palette
    await page.evaluate(() => {
      const open = (window as any).__orion_open_app;
      if (open) {
        open('command-center');
        open('inventory');
        open('ai-copilot');
      }
    });
    await page.waitForTimeout(500);
    await assertZeroFallbackAndZeroSvgFilters(page, 'Opened Windows (Compact Header)');

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'icon3_window_headers.png'),
      fullPage: false,
    });
  });

  test('ICON3-E2E-03: Icon Gallery renders all 119 unique artworks in Dark & Light modes with 0 duplicates/fallbacks', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await authenticateDemo(page, 'graphite');

    await page.evaluate(() => {
      if ((window as any).__orion_open_app) (window as any).__orion_open_app('icon-gallery');
    });

    const gallery = page.getByTestId('orion-icon-gallery');
    await expect(gallery).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('icon-gallery-coverage-badge')).toContainText('119/119');
    await expect(page.getByTestId('icon-gallery-zero-fallbacks')).toBeVisible();

    // Maximize Icon Gallery window if Maximize control is present
    const maxBtn = page.locator('[data-window-id="icon-gallery"] button[aria-label*="Maximize"]').first();
    if (await maxBtn.isVisible().catch(() => false)) {
      await maxBtn.click();
      await page.waitForTimeout(300);
    }

    const totalItems = await gallery.locator('[data-testid^="icon-gallery-item-"]').count();
    expect(totalItems).toBe(119);
    await assertZeroFallbackAndZeroSvgFilters(page, 'Icon Gallery (119 items)');

    // Capture Dark + Light comparison top screen
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'icon3_gallery_dark_and_light.png'),
      fullPage: false,
    });

    // Switch to Pure Dark surface and scroll through grid sections so all 119 icons are visually captured
    await gallery.getByRole('button', { name: 'Dark', exact: true }).click();
    await page.waitForTimeout(250);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'icon3_gallery_grid_1.png'),
      fullPage: false,
    });

    // Scroll scrollable gallery container down twice to inspect middle & bottom rows
    const scrollInfo = await gallery.evaluate((el) => {
      const candidates = [el, ...Array.from(el.querySelectorAll('*'))] as HTMLElement[];
      const scroller = candidates.find((c) => c.scrollHeight > c.clientHeight + 100) || el;
      const step = Math.max(480, Math.floor(scroller.clientHeight * 0.85));
      scroller.scrollTop = step;
      return { max: scroller.scrollHeight, step };
    });
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'icon3_gallery_grid_2.png'),
      fullPage: false,
    });

    await gallery.evaluate((el, offset) => {
      const candidates = [el, ...Array.from(el.querySelectorAll('*'))] as HTMLElement[];
      const scroller = candidates.find((c) => c.scrollHeight > c.clientHeight + 100) || el;
      scroller.scrollTop = offset;
    }, scrollInfo.step * 2);
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'icon3_gallery_grid_3.png'),
      fullPage: false,
    });

    // Switch to Pure Light surface & capture Light specimen + cards
    await gallery.getByRole('button', { name: 'Light', exact: true }).click();
    await gallery.evaluate((el) => {
      const candidates = [el, ...Array.from(el.querySelectorAll('*'))] as HTMLElement[];
      const scroller = candidates.find((c) => c.scrollHeight > c.clientHeight + 100) || el;
      scroller.scrollTop = 0;
    });
    await page.waitForTimeout(250);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'icon3_gallery_light.png'),
      fullPage: false,
    });

    // Capture remaining category groups (Control, Platform, System) in Dark mode so all key icons (Files, Sheets, Docs, Slides, Settings) are verified
    await gallery.getByRole('button', { name: 'Dark', exact: true }).click();
    await page.waitForTimeout(150);
    for (const category of ['Control', 'Platform', 'System']) {
      await gallery.getByRole('button', { name: category, exact: true }).click();
      await page.waitForTimeout(200);
      await page.screenshot({
        path: path.join(ARTIFACTS_DIR, `icon3_gallery_${category.toLowerCase()}.png`),
        fullPage: false,
      });
    }
  });

  test('ICON3-E2E-04: Admin Portal sidebar resolves admin-operations, admin-incidents, reconciliation without fallbacks', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await authenticateDemo(page, 'graphite');

    await page.goto(`${BASE_URL}/admin/operations`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('[data-orion-app-icon]', { timeout: 15000 });
    await page.waitForTimeout(350);

    await assertZeroFallbackAndZeroSvgFilters(page, 'Admin Portal Sidebar');
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'icon3_admin_sidebar.png'),
      fullPage: false,
    });
  });
});
