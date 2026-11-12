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
    dockOpacity = 85,
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

test.describe('ORION-9 Dynamic Dock 2.0 — Unified Island + Dock Visual & Interaction Verification', () => {
  test('1. Compact Dynamic Dock + zero separate topbar Dynamic Island capsule', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await authenticateDesktop(page, { dockAutoHide: false });

    // Topbar must NOT mount any standalone Dynamic Island trigger or capsule
    await expect(page.locator('.orion-global-topbar [aria-label="Expand Orion Dynamic Island"]')).toHaveCount(0);
    await expect(page.locator('.orion-global-topbar [data-surface-state]')).toHaveCount(0);

    const dock = page.locator('[data-dock="true"]').first();
    await expect(dock).toHaveAttribute('data-dock-visible', 'true');
    await expect(dock.getByTestId('dynamic-dock-trigger')).toBeVisible();
    await expect(dock.locator('[data-dock-item]').first()).toBeVisible();

    await page.waitForTimeout(350);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'dd2_compact.png'),
      fullPage: false,
    });
  });

  test('2. Expanded Dynamic Dock grows seamlessly upward from same glass shell + Escape focus restore', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await authenticateDesktop(page, { dockAutoHide: false });

    const dock = page.locator('[data-dock="true"]').first();
    const trigger = dock.getByTestId('dynamic-dock-trigger');
    const shelf = dock.locator('.orion-dock-shelf');
    await trigger.click();

    const expandedPanel = dock.getByTestId('dynamic-island-expanded-panel');
    await expect(expandedPanel).toBeVisible();
    await page.waitForTimeout(350);

    // Verify expanded panel renders inside the same .orion-dock-shelf and sits directly above icons
    const shelfBox = await shelf.boundingBox();
    const panelBox = await expandedPanel.boundingBox();
    const firstIconBox = await dock.locator('[data-dock-item]').first().boundingBox();
    expect(shelfBox).not.toBeNull();
    expect(panelBox).not.toBeNull();
    expect(firstIconBox).not.toBeNull();
    expect(panelBox!.y).toBeGreaterThanOrEqual(shelfBox!.y);
    expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(firstIconBox!.y + 12);

    // Verify key operational sections
    await expect(expandedPanel.getByText('WEB OS')).toBeVisible();
    await expect(expandedPanel.getByText('Stock Coverage')).toBeVisible();
    await expect(expandedPanel.getByRole('button', { name: 'Open Orion Copilot' })).toBeVisible();
    await expect(expandedPanel.getByRole('button', { name: 'Open Control Tower' })).toBeVisible();
    await expect(expandedPanel.getByRole('button', { name: 'Open Notifications' })).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'dd2_expanded.png'),
      fullPage: false,
    });

    // Escape closes and restores focus to trigger
    await page.keyboard.press('Escape');
    await expect(expandedPanel).toBeHidden();
    const focusedTestId = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focusedTestId).toBe('dynamic-dock-trigger');
  });

  test('3. Dock hover magnification + Auto-Hide pauses while expanded and resumes after collapse', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await authenticateDesktop(page, { dockAutoHide: true });

    const dock = page.locator('[data-dock="true"]').first();
    await page.mouse.move(720, 450);
    await expect(dock).toHaveAttribute('data-dock-visible', 'false');

    // Reveal via bottom edge and wait for reveal transition to settle
    await page.mouse.move(720, 898);
    await expect(dock).toHaveAttribute('data-dock-visible', 'true', { timeout: 4000 });
    await page.waitForTimeout(300);

    // Hover center icon for magnification
    const thirdIcon = dock.locator('[data-dock-item]').nth(2);
    await thirdIcon.hover();
    await page.waitForTimeout(250);

    const transformVal = await thirdIcon.evaluate((el) => getComputedStyle(el).transform);
    expect(transformVal).not.toBe('none');
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'dd2_magnification.png'),
      fullPage: false,
    });

    // Expand Dynamic Dock -> leave dock with mouse -> MUST remain visible while expanded
    await dock.getByTestId('dynamic-dock-trigger').click();
    await expect(dock.getByTestId('dynamic-island-expanded-panel')).toBeVisible();
    await page.mouse.move(300, 300);
    await page.waitForTimeout(600);
    await expect(dock).toHaveAttribute('data-dock-visible', 'true');

    // Outside click collapses -> Dock auto-hides smoothly
    await page.mouse.click(300, 300);
    await expect(dock.getByTestId('dynamic-island-expanded-panel')).toBeHidden();
    await expect(dock).toHaveAttribute('data-dock-visible', 'false', { timeout: 3000 });
  });

  test('4. Critical Alert state renders clearly inside unified Dynamic Dock', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await authenticateDesktop(page, { dockAutoHide: false });

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('orion:dynamic-island-event', {
          detail: {
            id: 'e2e-critical-port-alert',
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

    const dock = page.locator('[data-dock="true"]').first();
    const trigger = dock.getByTestId('dynamic-dock-trigger');
    await expect(trigger).toHaveAttribute('data-surface-state', 'critical', { timeout: 4000 });
    await trigger.click();
    await expect(dock.getByTestId('dynamic-island-expanded-panel')).toContainText('Critical Port Congestion');

    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'dd2_critical_alert.png'),
      fullPage: false,
    });
  });

  test('5. AI Copilot active reasoning state renders inside unified Dynamic Dock', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await authenticateDesktop(page, { dockAutoHide: false });

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('orion:copilot-state', {
          detail: { status: 'analyzing', detail: 'Simulating Red Sea reroute impact across 14 lanes' },
        })
      );
    });

    const dock = page.locator('[data-dock="true"]').first();
    const trigger = dock.getByTestId('dynamic-dock-trigger');
    await expect(trigger).toHaveAttribute('data-surface-state', 'activity', { timeout: 4000 });
    await expect(trigger).toContainText('Copilot');

    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'dd2_ai_activity.png'),
      fullPage: false,
    });
  });

  test('6. Dark Theme + low Dock Transparency (35%) dims ONLY glass backdrop, keeping icons 100% opaque', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await authenticateDesktop(page, { dockAutoHide: false, dockOpacity: 35, themeId: 'graphite' });

    const dock = page.locator('[data-dock="true"]').first();
    const shelf = dock.locator('.orion-dock-shelf');
    const backdrop = dock.getByTestId('dock-glass-backdrop');
    const firstIcon = dock.locator('[data-dock-item]').first();

    const opacityMetrics = await Promise.all([
      shelf.evaluate((el) => parseFloat(getComputedStyle(el).opacity)),
      backdrop.evaluate((el) => parseFloat(getComputedStyle(el).opacity)),
      firstIcon.evaluate((el) => parseFloat(getComputedStyle(el).opacity)),
    ]);

    expect(opacityMetrics[0]).toBe(1); // Shelf parent NEVER has opacity < 1
    expect(opacityMetrics[1]).toBeLessThanOrEqual(0.42); // Glass backdrop reflects 35% translucency
    expect(opacityMetrics[2]).toBe(1); // Icons stay 100% opaque and vivid

    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'dd2_transparency_dark.png'),
      fullPage: false,
    });
  });

  test('7. Silver Light Theme renders crisp high-contrast Dynamic Dock (compact + expanded)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await authenticateDesktop(page, { dockAutoHide: false, dockOpacity: 90, themeId: 'silver' });

    const dock = page.locator('[data-dock="true"]').first();
    const trigger = dock.getByTestId('dynamic-dock-trigger');
    await trigger.click();

    const expandedPanel = dock.getByTestId('dynamic-island-expanded-panel');
    await expect(expandedPanel).toBeVisible();
    // Verify high-contrast dark graphite typography (#17191B) on Light Mode expanded panel
    await expect(expandedPanel.getByText('ORION-9', { exact: false })).toHaveCSS('color', 'rgb(23, 25, 27)');

    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'dd2_light_theme.png'),
      fullPage: false,
    });
  });

  test('8. Responsive left-dock and compact 1280x720 desktop viewport fit without clipping', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await authenticateDesktop(page, { dockAutoHide: false, dockPosition: 'left' });

    const dock = page.locator('[data-dock="true"]').first();
    const trigger = dock.getByTestId('dynamic-dock-trigger');
    await trigger.click();
    const expandedPanel = dock.getByTestId('dynamic-island-expanded-panel');
    await expect(expandedPanel).toBeVisible();
    await page.waitForTimeout(300);

    const shelfBox = await dock.locator('.orion-dock-shelf').boundingBox();
    expect(shelfBox).not.toBeNull();
    expect(shelfBox!.x).toBeGreaterThanOrEqual(0);
    expect(shelfBox!.x + shelfBox!.width).toBeLessThanOrEqual(1280);
    expect(shelfBox!.y).toBeGreaterThanOrEqual(0);
    expect(shelfBox!.y + shelfBox!.height).toBeLessThanOrEqual(720);
  });
});
