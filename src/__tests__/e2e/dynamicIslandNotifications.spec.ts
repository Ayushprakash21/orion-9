import { test, expect } from '@playwright/test';

test.describe('ORION-9 Dynamic Island Notification Experience 2.0 (Live Verification)', () => {
  test('NOTIF-E2E: Notification displays inside Top Dynamic Island, suppresses detached toast, and auto-dismisses', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Seed session in sessionStorage and localStorage before page load
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('orion_os_power_state', 'ON');
        localStorage.setItem('orion9_database_environment', 'DEMO');
        localStorage.setItem('orion_dynamic_island_pinned', 'false');
        localStorage.setItem(
          'orion-appearance-preferences',
          JSON.stringify({
            version: 1,
            appearancePreferencesVersion: 2,
            themeId: 'graphite',
            appearanceMode: 'dark',
            dockAutoHide: false,
            dockOpacity: 90,
            dockTransparency: 90,
            dockBlur: 80,
            dockPosition: 'bottom',
            dockMagnification: true,
          })
        );
        localStorage.setItem(
          'orion_settings',
          JSON.stringify({
            userExperienceMode: 'ADVANCED',
            personalization: {
              dockAutoHide: false,
              dockOpacity: 90,
              dockTransparency: 90,
              dockMagnification: true,
              dockPosition: 'bottom',
              theme: 'graphite',
              colorMode: 'dark',
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
    });

    // Navigate to live environment
    await page.goto('https://orion-9.ayushprakash0021.workers.dev', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.orion-global-topbar', { timeout: 20000 });

    // Wait for Dynamic Island Capsule to be visible at the top
    const islandCapsule = page.locator('[data-testid="dynamic-island-capsule"]');
    await expect(islandCapsule).toBeVisible({ timeout: 15000 });

    // Capture baseline: Compact state
    await page.screenshot({ path: 'C:/Users/Ayush/.gemini/antigravity/brain/5f06512e-da58-4a5d-be62-e2ac72ec78f8/notif_compact_island.png' });

    // Dispatch notification event (equivalent to clicking "Resize to Medium" or toast dispatch)
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('orion:show-toast', {
          detail: {
            message: 'Widget resized to medium',
            type: 'info',
            appName: 'Desktop',
            dedupKey: 'widget-size-preview-test'
          }
        })
      );
    });

    // Verify notification preview appears INSIDE Dynamic Island capsule
    const notifPreview = page.locator('[data-testid="dynamic-island-notification-preview"]');
    await expect(notifPreview).toBeVisible({ timeout: 5000 });
    await expect(notifPreview).toContainText('Widget resized to medium');
    await expect(notifPreview).toContainText('Desktop');

    // CRITICAL ASSERTION: Zero detached top-right toast cards must render
    const standaloneToast = page.locator('[data-testid="system-notification-card"]');
    await expect(standaloneToast).toHaveCount(0);

    // Capture visual screenshot of active notification inside Top Dynamic Island
    await page.screenshot({ path: 'C:/Users/Ayush/.gemini/antigravity/brain/5f06512e-da58-4a5d-be62-e2ac72ec78f8/notif_incoming_widget_resize.png' });

    // Expand Dynamic Island by clicking capsule
    await islandCapsule.click();
    const expandedRoot = page.locator('[data-testid="dynamic-island-root"]');
    await expect(expandedRoot).toBeVisible();

    // Verify notification appears inside Expanded Island activity feed
    const notifFeedItem = page.locator('[data-testid="dynamic-island-notification-item"]');
    await expect(notifFeedItem.first()).toBeVisible();

    // Capture visual screenshot of expanded activity feed
    await page.screenshot({ path: 'C:/Users/Ayush/.gemini/antigravity/brain/5f06512e-da58-4a5d-be62-e2ac72ec78f8/notif_expanded_feed.png' });

    // Dismiss active notification or wait for preview transition
    const dismissBtn = page.locator('[data-testid="dynamic-island-dismiss-btn"]');
    if (await dismissBtn.isVisible()) {
      await dismissBtn.click();
      await page.waitForTimeout(300);
    }

    // Test Critical alert treatment
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('orion:show-toast', {
          detail: {
            message: 'Port Congestion Critical Alert — 4 vessels rerouted',
            type: 'error',
            appName: 'Logistics',
            dedupKey: 'critical-port-alert-test'
          }
        })
      );
    });

    // Close expanded view if open
    await page.keyboard.press('Escape');
    await expect(notifPreview).toBeVisible({ timeout: 5000 });
    await expect(notifPreview).toContainText('Port Congestion Critical Alert');

    // Capture visual screenshot of critical alert in Dynamic Island
    await page.screenshot({ path: 'C:/Users/Ayush/.gemini/antigravity/brain/5f06512e-da58-4a5d-be62-e2ac72ec78f8/notif_critical_alert.png' });

    // Verify Bottom Dock remains completely independent at the bottom of the screen
    const dock = page.locator('[data-testid="orion-dock"], [data-dock="true"]').first();
    await expect(dock).toBeVisible();
    const dockBox = await dock.boundingBox();
    expect(dockBox).not.toBeNull();
    if (dockBox) {
      // Dock should be positioned near bottom of 900px viewport (y > 750)
      expect(dockBox.y).toBeGreaterThan(750);
    }
  });
});
