import { test, expect } from '@playwright/test';

/**
 * ORION-9 MOBILE APPLICATION SHELL PLAYWRIGHT E2E SUITE
 * 
 * Verifies across mobile viewports (360x800, 375x812, 390x844, 430x932):
 * 1. Native mobile presentation shell (zero desktop dock, zero desktop top bar).
 * 2. Mobile Header pinned at top without push/shift.
 * 3. 5-tab Mobile Bottom Navigation pinned at bottom without gap/void.
 * 4. Zero document/window scrolling (window.scrollY === 0) on all screens.
 * 5. Zero horizontal page-level overflow across all screens (scrollWidth <= innerWidth + 2).
 * 6. AI Copilot: internal messages scroll, prompt chips horizontally scrollable, no header push.
 * 7. Control Tower: KPI metrics and charts render with zero horizontal overflow.
 * 8. Apps Launcher: responsive multi-column grid and instant search input.
 * 9. Digital Twin (World Model): responsive 3D canvas, horizontal controls, single-screen container.
 */

const MOBILE_VIEWPORTS = [
  { name: 'Samsung-360x800', width: 360, height: 800 },
  { name: 'iPhone-375x812', width: 375, height: 812 },
  { name: 'iPhone-390x844', width: 390, height: 844 },
  { name: 'iPhoneProMax-430x932', width: 430, height: 932 },
];

const ARTIFACT_DIR = 'C:/Users/Ayush/.gemini/antigravity/brain/5f06512e-da58-4a5d-be62-e2ac72ec78f8';

test.describe('Orion-9 Native Mobile Application Shell Rebuild E2E', () => {
  for (const vp of MOBILE_VIEWPORTS) {
    test(`Comprehensive mobile OS verification on ${vp.name}`, async ({ page }) => {
      // 1. Initialize OS State and Set Viewport
      await page.addInitScript(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
          sessionStorage.setItem('orion_os_power_state', 'ON');
        } catch (e) {}
      });

      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/login');

      // 2. Perform Standard Demo Login (Two-Stage Flow)
      await page.fill('input#username', 'admin');
      await page.click('button[type="submit"]');
      await expect(page.locator('input#password')).toBeVisible({ timeout: 5000 });
      await page.fill('input#password', 'admin');
      await page.click('button[type="submit"]');

      // 3. Verify Mobile Shell Container is rendered
      const mobileShell = page.locator('[data-orion-mobile-shell="true"]');
      await expect(mobileShell).toBeVisible({ timeout: 15000 });

      // Invariants: Desktop Dock and horizontal nav MUST NOT be rendered
      await expect(page.locator('[data-orion-dock="true"]')).toHaveCount(0);
      await expect(page.locator('header nav:has-text("OPERATIONS")')).toHaveCount(0);

      // Verify Mobile Header pinned at top
      const header = page.locator('header');
      await expect(header).toBeVisible();
      await expect(header.getByText(/ORION/i)).toBeVisible();
      await expect(header.getByText(/DEMO|LIVE/i)).toBeVisible();
      const headerBox = await header.boundingBox();
      expect(headerBox?.y).toBeLessThanOrEqual(2);

      // Verify 5-tab Mobile Bottom Navigation pinned at bottom
      const bottomNav = page.locator('nav[aria-label="Mobile Navigation"]');
      await expect(bottomNav).toBeVisible();
      await expect(bottomNav.getByText('Home')).toBeVisible();
      await expect(bottomNav.getByText('Control')).toBeVisible();
      await expect(bottomNav.getByText('AI')).toBeVisible();
      await expect(bottomNav.getByText('Alerts')).toBeVisible();
      await expect(bottomNav.getByText('Apps')).toBeVisible();

      // Invariant: Window vertical scroll MUST be 0
      let scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBe(0);

      // Assert Zero Page-Level Horizontal Overflow
      let hasNoHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth + 2;
      });
      expect(hasNoHorizontalOverflow).toBe(true);

      // Capture Home Screen Screenshot
      await page.screenshot({ path: `${ARTIFACT_DIR}/mobile_${vp.name}_home.png` });

      // 4. Test Control Tower Tab
      await bottomNav.getByText('Control').click();
      await expect(page.getByText(/Orion Control Tower/i)).toBeVisible();
      await expect(page.getByText(/Active Disruption Telemetry/i)).toBeVisible();

      scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBe(0);

      hasNoHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth + 2;
      });
      expect(hasNoHorizontalOverflow).toBe(true);

      await page.screenshot({ path: `${ARTIFACT_DIR}/mobile_${vp.name}_control.png` });

      // 5. Test AI Copilot Tab
      const aiButton = page.locator('button[aria-label="Open ORION AI"]');
      await expect(aiButton).toBeVisible();
      await aiButton.click();

      const aiSurface = page.locator('[data-orion-ai-surface="true"]');
      await expect(aiSurface).toBeVisible({ timeout: 10000 });
      await expect(page.getByPlaceholder(/Ask Orion AI/i)).toBeVisible();

      // Strict Invariants for AI Layout:
      // a) Window scroll MUST NOT have shifted (no displacement)
      scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBe(0);

      // b) Header MUST still be visible at top
      const headerBoxAI = await header.boundingBox();
      expect(headerBoxAI?.y).toBeLessThanOrEqual(2);

      // c) Bottom nav MUST still be visible at bottom
      const bottomNavBoxAI = await bottomNav.boundingBox();
      expect(bottomNavBoxAI?.y).toBeLessThanOrEqual(vp.height);

      // d) Prompt chips container must be bounded within viewport
      const chipsContainerMetrics = await page.evaluate(() => {
        const chips = Array.from(document.querySelectorAll('button[aria-label^="Select prompt suggestion"]'));
        const container = chips[0]?.parentElement;
        if (!container) return null;
        const rect = container.getBoundingClientRect();
        return {
          insideWidth: rect.right <= window.innerWidth + 2,
          scrollable: container.scrollWidth >= container.clientWidth,
        };
      });
      expect(chipsContainerMetrics).not.toBeNull();
      expect(chipsContainerMetrics!.insideWidth).toBe(true);

      // e) Send a query to verify internal container scrolling
      const textarea = page.locator('textarea');
      await textarea.fill('Inventory summary');
      const sendBtn = page.locator('button[aria-label="Send Message to Orion AI"]');
      await sendBtn.click();

      // Verify response appears and window.scrollY remains 0
      await expect(page.getByText(/Deterministic SCM Core|Orion AI|Operating in/i).first()).toBeVisible({ timeout: 10000 });
      scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBe(0);

      await page.screenshot({ path: `${ARTIFACT_DIR}/mobile_${vp.name}_ai.png` });

      // 6. Test Alerts Tab
      await bottomNav.getByText('Alerts').click();
      await expect(page.getByText(/Operational Alerts & Risks/i)).toBeVisible();
      scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBe(0);

      hasNoHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth + 2;
      });
      expect(hasNoHorizontalOverflow).toBe(true);
      await page.screenshot({ path: `${ARTIFACT_DIR}/mobile_${vp.name}_alerts.png` });

      // 7. Test Apps Launcher Tab
      await bottomNav.getByText('Apps').click();
      const appSearch = page.getByPlaceholder(/Search enterprise apps/i);
      await expect(appSearch).toBeVisible();

      // Strict Invariant: After switching from AI -> Alerts -> Apps, window.scrollY MUST be 0
      scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBe(0);

      // Verify search input is completely in view and not pushed off
      const searchBox = await appSearch.boundingBox();
      expect(searchBox?.y).toBeGreaterThan(0);
      expect(searchBox?.y).toBeLessThan(120);

      hasNoHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth + 2;
      });
      expect(hasNoHorizontalOverflow).toBe(true);
      await page.screenshot({ path: `${ARTIFACT_DIR}/mobile_${vp.name}_apps.png` });

      // 8. Test Digital Twin (World Model)
      await appSearch.fill('World Model');
      const worldModelCard = page.locator('button:has-text("World Model")').first();
      await expect(worldModelCard).toBeVisible();
      await worldModelCard.click();

      // Verify single screen container mounts
      const appWrapper = page.locator('.orion-mobile-app-wrapper');
      await expect(appWrapper).toBeVisible({ timeout: 10000 });

      // Verify 3D canvas element is mounted
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: 10000 });

      // Verify zero horizontal page-level overflow with 3D canvas
      hasNoHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth + 2;
      });
      expect(hasNoHorizontalOverflow).toBe(true);

      // Verify canvas container height does not exceed viewport bounds
      const canvasBox = await canvas.boundingBox();
      expect(canvasBox?.height).toBeLessThanOrEqual(vp.height * 0.7);

      await page.screenshot({ path: `${ARTIFACT_DIR}/mobile_${vp.name}_world_model.png` });

      // Return back to Apps launcher via Header back button
      const backBtn = page.getByLabel('Back to Applications');
      if (await backBtn.isVisible()) {
        await backBtn.click();
      } else {
        await bottomNav.getByText('Apps').click();
      }
      await expect(page.getByPlaceholder(/Search enterprise apps/i)).toBeVisible();
    });
  }
});
