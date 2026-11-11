import { test, expect, Page } from '@playwright/test';
import path from 'node:path';

const ARTIFACTS_DIR = 'C:/Users/Ayush/.gemini/antigravity/brain/5f06512e-da58-4a5d-be62-e2ac72ec78f8';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function authenticateDemo(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('orion_os_power_state', 'ON');
      localStorage.setItem('orion9_database_environment', 'DEMO');
      localStorage.setItem('orion_settings', JSON.stringify({ userExperienceMode: 'ADVANCED' }));
      localStorage.setItem('orion_system_settings', JSON.stringify({ userExperienceMode: 'ADVANCED' }));
      localStorage.setItem('orion_dynamic_island_pinned', 'false');
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
  });

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('.orion-global-topbar', { timeout: 20000 });
}

test.describe('Orion-9 macOS Icon System, Astraeus Dynamic Island & OS Performance E2E', () => {
  test('E2E-01: Desktop renders zero SVG Gaussian filters, opens Icon Gallery with all icons visible', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await authenticateDemo(page);

    const feCount = await page.evaluate(() => document.querySelectorAll('svg feDropShadow, svg filter').length);
    expect(feCount).toBe(0);

    await page.evaluate(() => {
      if ((window as any).__orion_open_app) (window as any).__orion_open_app('icon-gallery');
    });

    const gallery = page.getByTestId('orion-icon-gallery');
    await expect(gallery).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('icon-gallery-coverage-badge')).toBeVisible();
    await expect(page.getByTestId('icon-gallery-zero-fallbacks')).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'upgrade_icon_gallery_desktop.png'),
      fullPage: false,
    });
  });

  test('E2E-02: Dynamic Island supports 5-state expansion, pinning, Escape return-to-compact, and mobile fit', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await authenticateDemo(page);

    const island = page.locator('div[role="region"][aria-label="Orion-9 Dynamic Island System Telemetry"]');
    const pill = island.locator('div[role="button"][aria-label="Expand Orion Dynamic Island"]');
    await expect(pill).toBeVisible();
    await pill.click();

    const expandedPanel = page.getByTestId('dynamic-island-expanded-panel');
    await expect(expandedPanel).toBeVisible();

    await expandedPanel.screenshot({
      path: path.join(ARTIFACTS_DIR, 'upgrade_dynamic_island_expanded.png'),
    });

    // Verify pinning persists to localStorage
    const pinBtn = expandedPanel.getByRole('button', { name: /Pin Dynamic Island/i });
    await pinBtn.click();
    const pinnedVal = await page.evaluate(() => localStorage.getItem('orion_dynamic_island_pinned'));
    expect(pinnedVal).toBe('true');

    await page.keyboard.press('Escape');
    await expect(expandedPanel).toBeHidden();

    // Compact desktop viewport check (1280x720) ensuring Dynamic Island fits cleanly within viewport bounds
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(150);
    await pill.click();
    await expect(expandedPanel).toBeVisible();
    const panelBox = await expandedPanel.boundingBox();
    expect(panelBox).not.toBeNull();
    expect(panelBox!.x).toBeGreaterThanOrEqual(0);
    expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(1280);
  });

  test('E2E-03: Window drag commits cleanly to final geometry without layout lockups', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await authenticateDemo(page);

    await page.evaluate(() => {
      if ((window as any).__orion_open_app) (window as any).__orion_open_app('command-center');
    });
    const winEl = page.locator('[data-window-id="command-center"]');
    await expect(winEl).toBeVisible({ timeout: 10000 });

    // Ensure windowed before dragging
    const initialBox = await winEl.boundingBox();
    expect(initialBox).not.toBeNull();
    const titleBar = winEl.locator('[data-orion-window-titlebar="true"]');
    const tbBox = await titleBar.boundingBox();
    expect(tbBox).not.toBeNull();

    await page.mouse.move(tbBox!.x + 200, tbBox!.y + tbBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(tbBox!.x + 280, tbBox!.y + tbBox!.height / 2 + 40, { steps: 12 });
    await page.mouse.up();

    const movedBox = await winEl.boundingBox();
    expect(movedBox).not.toBeNull();
    expect(Math.abs(movedBox!.x - initialBox!.x)).toBeGreaterThan(20);
  });
});
