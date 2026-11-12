import { test, expect, Page } from '@playwright/test';
import path from 'node:path';

const ARTIFACTS_DIR = 'C:/Users/Ayush/.gemini/antigravity/brain/5f06512e-da58-4a5d-be62-e2ac72ec78f8';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function authenticateDesktop(
  page: Page,
  options?: {
    dockAutoHide?: boolean;
    dockOpacity?: number;
    themeId?: 'graphite' | 'silver';
    dockPosition?: 'bottom' | 'left' | 'right' | 'top';
  }
) {
  const {
    dockAutoHide = false,
    dockOpacity = 90,
    themeId = 'graphite',
    dockPosition = 'bottom',
  } = options || {};

  await page.addInitScript(
    ({ dockAutoHide, dockOpacity, themeId, dockPosition }) => {
      try {
        sessionStorage.setItem('orion_os_power_state', 'ON');
        localStorage.setItem('orion9_database_environment', 'DEMO');
        localStorage.setItem('orion_dynamic_island_pinned', 'false');
        localStorage.setItem(
          'orion-appearance-preferences',
          JSON.stringify({
            version: 1,
            appearancePreferencesVersion: 2,
            themeId,
            appearanceMode: themeId === 'silver' ? 'light' : 'dark',
            dockAutoHide,
            dockOpacity,
            dockTransparency: dockOpacity,
            dockBlur: 80,
            dockPosition,
            dockMagnification: true,
          })
        );
        localStorage.setItem(
          'orion_settings',
          JSON.stringify({
            userExperienceMode: 'ADVANCED',
            personalization: {
              dockAutoHide,
              dockOpacity,
              dockTransparency: dockOpacity,
              dockMagnification: true,
              dockPosition,
              theme: themeId,
              colorMode: themeId === 'silver' ? 'light' : 'dark',
            },
          })
        );
        localStorage.setItem(
          'orion_system_settings',
          JSON.stringify({ userExperienceMode: 'ADVANCED' })
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
    },
    { dockAutoHide, dockOpacity, themeId, dockPosition }
  );

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('.orion-global-topbar', { timeout: 20000 });
  await expect(page.locator('[data-dock="true"]').first()).toBeAttached({ timeout: 15000 });
}

test.describe('ORION-9 Top-Centred Dynamic Island + Independent Bottom Dock Verification', () => {
  test('1. Compact top-centred Dynamic Island + independent bottom Dock geometry validation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await authenticateDesktop(page, { dockAutoHide: false });

    // 1. Top System Bar
    const topBar = page.locator('.orion-global-topbar');
    await expect(topBar).toBeVisible();
    const topBarBox = await topBar.boundingBox();
    expect(topBarBox).not.toBeNull();
    expect(topBarBox!.y).toBe(0);
    expect(topBarBox!.height).toBeGreaterThanOrEqual(40);

    // 2. Dynamic Island Capsule at TOP CENTRE
    const island = page.locator('div[role="region"][aria-label="Orion-9 Dynamic Island System Telemetry"]');
    await expect(island).toBeVisible();
    const pill = island.locator('div[role="button"][aria-label="Expand Orion Dynamic Island"]');
    await expect(pill).toBeVisible();
    const pillBox = await pill.boundingBox();
    expect(pillBox).not.toBeNull();
    // Bounding box must be immediately below topbar
    expect(pillBox!.y).toBeGreaterThanOrEqual(topBarBox!.height - 2);
    expect(pillBox!.y).toBeLessThan(100);
    // Centred horizontally (within 50px of center x=720)
    expect(Math.abs(pillBox!.x + pillBox!.width / 2 - 720)).toBeLessThan(50);

    // 3. Application Dock at BOTTOM CENTRE
    const dock = page.locator('[data-dock="true"]').first();
    await expect(dock).toBeVisible();
    const shelf = dock.locator('.orion-dock-shelf');
    const dockBox = await shelf.boundingBox();
    expect(dockBox).not.toBeNull();
    // Dock must sit near the bottom edge (y > 780 for 900px height)
    expect(dockBox!.y).toBeGreaterThan(780);
    expect(dockBox!.y + dockBox!.height).toBeLessThanOrEqual(900);
    expect(Math.abs(dockBox!.x + dockBox!.width / 2 - 720)).toBeLessThan(50);

    // Dock shelf does NOT contain dynamic island trigger
    await expect(shelf.locator('[aria-label="Expand Orion Dynamic Island"]')).toHaveCount(0);

    // Vertical separation: Island and Dock are completely independent surfaces
    expect(dockBox!.y - (pillBox!.y + pillBox!.height)).toBeGreaterThan(600);

    await page.waitForTimeout(350);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'top_island_compact_bottom_dock.png'),
      fullPage: false,
    });
  });

  test('2. Expanded top Dynamic Island grows DOWNWARD beneath topbar while bottom Dock remains unchanged', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await authenticateDesktop(page, { dockAutoHide: false });

    const island = page.locator('div[role="region"][aria-label="Orion-9 Dynamic Island System Telemetry"]');
    const pill = island.locator('div[role="button"][aria-label="Expand Orion Dynamic Island"]');
    const pillBoxBefore = await pill.boundingBox();

    const dock = page.locator('[data-dock="true"]').first();
    const dockShelf = dock.locator('.orion-dock-shelf');
    const dockBoxBefore = await dockShelf.boundingBox();
    expect(dockBoxBefore).not.toBeNull();

    // Click top pill to expand
    await pill.click();

    const expandedPanel = page.getByTestId('dynamic-island-expanded-panel');
    await expect(expandedPanel).toBeVisible({ timeout: 5000 });
    const panelBox = await expandedPanel.boundingBox();
    expect(panelBox).not.toBeNull();

    // Expansion grows DOWNWARD beneath the capsule
    expect(panelBox!.y).toBeGreaterThanOrEqual(pillBoxBefore!.y + pillBoxBefore!.height);
    // Centred horizontally
    expect(Math.abs(panelBox!.x + panelBox!.width / 2 - 720)).toBeLessThan(50);

    // Verify key sections inside top expanded panel
    await expect(expandedPanel.getByText('ORION-9', { exact: false })).toBeVisible();
    await expect(expandedPanel.getByText('Stock Coverage')).toBeVisible();
    await expect(expandedPanel.getByRole('button', { name: 'Open Orion Copilot' })).toBeVisible();
    await expect(expandedPanel.getByRole('button', { name: 'Open Control Tower' })).toBeVisible();

    // Verify bottom Dock has NOT moved and has NO expanded card
    const dockBoxAfter = await dockShelf.boundingBox();
    expect(dockBoxAfter).not.toBeNull();
    expect(Math.abs(dockBoxAfter!.y - dockBoxBefore!.y)).toBeLessThan(2);
    expect(dockShelf.locator('[data-testid="dynamic-island-expanded-panel"]')).toHaveCount(0);

    // No overlap between expanded island and bottom dock
    expect(dockBoxAfter!.y).toBeGreaterThan(panelBox!.y + panelBox!.height + 50);

    await page.waitForTimeout(350);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'top_island_expanded_bottom_dock.png'),
      fullPage: false,
    });

    // Escape closes top island
    await page.keyboard.press('Escape');
    await expect(expandedPanel).toBeHidden();
  });

  test('3. Dock hover magnification on independent bottom Dock', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await authenticateDesktop(page, { dockAutoHide: false });

    const dock = page.locator('[data-dock="true"]').first();
    const thirdIcon = dock.locator('[data-dock-item]').nth(2);
    await thirdIcon.hover();
    await page.waitForTimeout(250);

    const transformVal = await thirdIcon.evaluate((el) => getComputedStyle(el).transform);
    expect(transformVal).not.toBe('none');

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'top_island_dock_magnification.png'),
      fullPage: false,
    });
  });

  test('4. Critical alert displayed in top Dynamic Island capsule', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await authenticateDesktop(page, { dockAutoHide: false });

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('orion:dynamic-island-event', {
          detail: {
            id: 'top-island-critical-alert',
            source: 'exception',
            title: 'Critical Port Congestion',
            subtitle: 'Rotterdam Berth 4 • SLA Risk',
            severity: 'critical',
            timestamp: Date.now(),
            actionLabel: 'Control Tower',
            actionAppId: 'command-center',
          },
        })
      );
    });

    const island = page.locator('div[role="region"][aria-label="Orion-9 Dynamic Island System Telemetry"]');
    const pill = island.locator('div[role="button"][aria-label="Expand Orion Dynamic Island"]');
    await expect(pill).toHaveAttribute('data-surface-state', 'critical', { timeout: 4000 });

    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'top_island_critical_alert.png'),
      fullPage: false,
    });
  });

  test('5. Dark Theme: independent top Island and bottom Dock with dedicated backdrop opacity', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await authenticateDesktop(page, { dockAutoHide: false, dockOpacity: 40, themeId: 'graphite' });

    const dock = page.locator('[data-dock="true"]').first();
    const shelf = dock.locator('.orion-dock-shelf');
    const backdrop = dock.getByTestId('dock-glass-backdrop');
    const firstIcon = dock.locator('[data-dock-item]').first();

    const shelfOpacity = await shelf.evaluate((el) => parseFloat(getComputedStyle(el).opacity));
    const backdropOpacity = await backdrop.evaluate((el) => parseFloat(getComputedStyle(el).opacity));
    const iconOpacity = await firstIcon.evaluate((el) => parseFloat(getComputedStyle(el).opacity));

    expect(shelfOpacity).toBe(1); // Shelf parent is never dimmed
    expect(backdropOpacity).toBeLessThanOrEqual(0.45); // Backdrop reflects dockOpacity 40%
    expect(iconOpacity).toBe(1); // Icons remain 100% opaque

    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'top_island_dark_theme.png'),
      fullPage: false,
    });
  });

  test('6. Silver Light Theme: clean top Island capsule and bright bottom Dock', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await authenticateDesktop(page, { dockAutoHide: false, dockOpacity: 90, themeId: 'silver' });

    const island = page.locator('div[role="region"][aria-label="Orion-9 Dynamic Island System Telemetry"]');
    const pill = island.locator('div[role="button"][aria-label="Expand Orion Dynamic Island"]');
    await pill.click();

    const expandedPanel = page.getByTestId('dynamic-island-expanded-panel');
    await expect(expandedPanel).toBeVisible();

    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'top_island_light_theme.png'),
      fullPage: false,
    });
  });
});
