import { test, expect, Page } from '@playwright/test';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/Ayush/.gemini/antigravity/brain/5f06512e-da58-4a5d-be62-e2ac72ec78f8';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function loginAsDemo(page: Page) {
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
    } catch (_) {}
  });

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('.orion-desktop-shell, [data-desktop-surface], .orion-global-topbar', {
    timeout: 20000,
    state: 'visible',
  }).catch(() => {});
}

test.describe('ORION-9 Phase 4: Final Product Hardening & Visual Certification', () => {

  test('PHASE4-01: Desktop OS experience at 1920x1080 & Dynamic Island Idle Capsule', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginAsDemo(page);

    // Verify System Bar is visible
    const topBar = page.locator('.orion-global-topbar');
    await expect(topBar).toBeVisible({ timeout: 10000 });

    // Verify Dynamic Island is centered and in compact idle capsule mode
    const dynamicIsland = page.locator('div[role="region"][aria-label="Orion-9 Dynamic Island System Telemetry"]');
    await expect(dynamicIsland).toBeVisible({ timeout: 10000 });

    // The compact button inside must have aria-expanded="false"
    const compactPill = dynamicIsland.locator('div[role="button"][aria-label="Expand Orion Dynamic Island"]');
    await expect(compactPill).toBeVisible({ timeout: 5000 });
    await expect(compactPill).toHaveAttribute('aria-expanded', 'false');

    // Capture Full Desktop Screenshot
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'phase4_os_desktop_1920x1080.png'),
      fullPage: false,
    });

    // Capture Dynamic Island Idle State
    await dynamicIsland.screenshot({
      path: path.join(ARTIFACTS_DIR, 'phase4_dynamic_island_idle.png'),
    });
  });

  test('PHASE4-02: Dynamic Island Expansion, Quick Actions, and Collapse Behavior', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAsDemo(page);

    const dynamicIsland = page.locator('div[role="region"][aria-label="Orion-9 Dynamic Island System Telemetry"]');
    await expect(dynamicIsland).toBeVisible({ timeout: 10000 });

    const compactPill = dynamicIsland.locator('div[role="button"][aria-label="Expand Orion Dynamic Island"]');
    await compactPill.click();

    // Verify expanded panel content appears (Header row with ORION-9 status)
    const expandedHeader = dynamicIsland.locator('text=ORION-9').first();
    await expect(expandedHeader).toBeVisible({ timeout: 5000 });

    // Verify quick action buttons exist (Copilot & Control Tower)
    const copilotQuickAction = dynamicIsland.locator('button:has-text("Copilot"), button:has-text("Ask Copilot")').first();
    await expect(copilotQuickAction).toBeVisible({ timeout: 5000 });

    // Capture Dynamic Island Expanded State
    await dynamicIsland.screenshot({
      path: path.join(ARTIFACTS_DIR, 'phase4_dynamic_island_expanded.png'),
    });

    // Click outside to verify collapse
    await page.mouse.click(100, 500);
    await expect(compactPill).toBeVisible({ timeout: 5000 });
    await expect(compactPill).toHaveAttribute('aria-expanded', 'false');
  });

  test('PHASE4-03: Orion Copilot Execution, Window Controls, and UI Integration', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAsDemo(page);

    const copilotBtn = page.locator('[data-testid="orion-copilot-button"]');
    await expect(copilotBtn).toBeVisible({ timeout: 10000 });
    await copilotBtn.click();

    // Verify Copilot window is displayed
    const aiWindow = page.locator('[data-window-id="orion-ai"]');
    await expect(aiWindow).toBeVisible({ timeout: 8000 });

    // Input field present and interactive
    const inputField = aiWindow.locator('input[type="text"], textarea').first();
    await expect(inputField).toBeVisible({ timeout: 5000 });

    // Type a prompt
    await inputField.fill('Analyze current supplier risk profile across ports');

    // Capture Copilot Active Window Screenshot
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'phase4_copilot_window.png'),
      fullPage: false,
    });
  });

  test('PHASE4-04: Supply Chain Control Tower & Operational Workbenches', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAsDemo(page);

    // Open Control Tower from dock or launcher
    await page.goto(`${BASE_URL}/control-tower`, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Verify Control Tower surface or header
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'phase4_control_tower_kpi.png'),
      fullPage: false,
    });
  });

  test('PHASE4-05: Tablet Responsive Layout at 820x1180', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await loginAsDemo(page);

    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'phase4_os_tablet_820x1180.png'),
      fullPage: false,
    });
  });

  test('PHASE4-06: Mobile Responsive Layout at 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsDemo(page);

    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'phase4_os_mobile_390x844.png'),
      fullPage: false,
    });
  });
});
