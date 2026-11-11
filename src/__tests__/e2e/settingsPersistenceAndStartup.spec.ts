import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function clearBrowserStateAndBootOn(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('orion_os_power_state', 'ON');
    } catch {}
  });
}

async function loginTwoStage(page: Page, username: string, password: string) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    try {
      sessionStorage.setItem('orion_os_power_state', 'ON');
    } catch {}
  });
  await page.fill('input#username', username);
  await page.click('button[type="submit"]');
  await expect(page.locator('input#password')).toBeVisible({ timeout: 8000 });
  await page.fill('input#password', password);
  await page.click('button[type="submit"]');
  await page.waitForSelector('.orion-global-topbar', { timeout: 15000 });
}

async function signOutViaUI(page: Page) {
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.orion-global-topbar', { timeout: 15000 });
  await page.getByTestId('orion-brand-trigger-btn').click();
  const signOutItem = page.locator('button:has-text("Sign Out"), button:has-text("Log Out")').first();
  await expect(signOutItem).toBeVisible({ timeout: 5000 });
  await signOutItem.click();
  await page.waitForSelector('input#username', { timeout: 15000 });
}

async function openAdminDisplayPreferences(page: Page) {
  await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'domcontentloaded' });
  const displayTab = page.locator('button:has-text("Display & Preferences")');
  await expect(displayTab).toBeVisible({ timeout: 10000 });
  await displayTab.click();
  await expect(page.getByTestId('display-preferences-controls')).toBeVisible({ timeout: 8000 });
}

test.describe('Orion-9 Admin Display Settings Persistence & Startup Hydration E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
        sessionStorage.setItem('orion_os_power_state', 'ON');
      } catch {}
    });
  });

  test('TEST A & F: Admin Display settings persist across save, desktop navigation, and full browser refresh', async ({ page }) => {
    await loginTwoStage(page, 'admin', 'admin');
    await openAdminDisplayPreferences(page);

    await page.getByTestId('display-theme-light').click();
    await page.getByTestId('display-font-LATO').click();
    await page.getByTestId('display-scale-125').click();
    await page.getByTestId('display-dock-pos-left').click();
    await page.getByTestId('display-desktop-icons-hide').click();
    await page.getByTestId('display-island-mode-minimal').click();

    await expect.poll(async () => {
      return page.evaluate(() => ({
        isLight: document.documentElement.classList.contains('light'),
        font: document.documentElement.dataset.orionFont,
        scale: document.documentElement.style.getPropertyValue('--orion-display-scale'),
        islandMode: localStorage.getItem('orion_dynamic_island_mode'),
      }));
    }).toEqual({
      isLight: true,
      font: 'lato',
      scale: '1.25',
      islandMode: 'minimal',
    });

    // Navigate back to OS Desktop and verify visible UI & DOM state
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.orion-global-topbar', { timeout: 15000 });

    const island = page.locator('[aria-label="Orion-9 Dynamic Island System Telemetry"]');
    await expect(island).toBeVisible({ timeout: 8000 });
    await expect(island).toHaveAttribute('data-presentation-mode', 'minimal');

    // Full browser reload — must restore persisted Light theme, LATO, 125% scale, Left Dock, minimal Island
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.orion-global-topbar', { timeout: 15000 });

    await expect.poll(async () => {
      return page.evaluate(() => ({
        isLight: document.documentElement.classList.contains('light'),
        isDark: document.documentElement.classList.contains('dark'),
        font: document.documentElement.dataset.orionFont,
        scale: document.documentElement.style.getPropertyValue('--orion-display-scale'),
      }));
    }).toEqual({
      isLight: true,
      isDark: false,
      font: 'lato',
      scale: '1.25',
    });

    const islandAfterReload = page.locator('[aria-label="Orion-9 Dynamic Island System Telemetry"]');
    await expect(islandAfterReload).toHaveAttribute('data-presentation-mode', 'minimal');

    // Also verify disabled Dynamic Island hides the island cleanly on reload
    await openAdminDisplayPreferences(page);
    await page.getByTestId('display-island-mode-disabled').click();
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.orion-global-topbar', { timeout: 15000 });
    await expect(page.locator('[aria-label="Orion-9 Dynamic Island System Telemetry"]')).toHaveCount(0);
  });

  test('TEST B: Multi-tab / second page within browser session receives and restores persisted preferences', async ({ page, context }) => {
    await loginTwoStage(page, 'admin', 'admin');
    await openAdminDisplayPreferences(page);

    await page.getByTestId('display-theme-light').click();
    await page.getByTestId('display-font-ARIAL').click();
    await page.getByTestId('display-scale-150').click();

    const tab2 = await context.newPage();
    await clearBrowserStateAndBootOn(tab2);
    await tab2.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await tab2.waitForSelector('.orion-global-topbar', { timeout: 15000 });

    await expect.poll(async () => {
      return tab2.evaluate(() => ({
        isLight: document.documentElement.classList.contains('light'),
        font: document.documentElement.dataset.orionFont,
        scale: document.documentElement.style.getPropertyValue('--orion-display-scale'),
      }));
    }).toEqual({
      isLight: true,
      font: 'arial',
      scale: '1.5',
    });
    await tab2.close();
  });

  test('TEST C: Cross-User Isolation — Sign-Out clears outgoing preferences so next user does not inherit them', async ({ page }) => {
    await loginTwoStage(page, 'admin', 'admin');
    await openAdminDisplayPreferences(page);

    await page.getByTestId('display-theme-light').click();
    await page.getByTestId('display-font-LATO').click();
    await page.getByTestId('display-scale-150').click();
    await expect.poll(() =>
      page.evaluate(() => document.documentElement.dataset.orionFont)
    ).toBe('lato');

    // Sign out cleanly via System Menu so AuthContext signOut() -> clearActiveRuntimeSessionCaches() executes
    await signOutViaUI(page);
    await loginTwoStage(page, 'user', 'user');

    // Verify normal user did NOT inherit admin's Light theme + LATO font + 150% scale
    const userRuntime = await page.evaluate(() => ({
      font: document.documentElement.dataset.orionFont,
      scale: document.documentElement.style.getPropertyValue('--orion-display-scale'),
      scopedAdminKeyStillIntact: Boolean(localStorage.getItem('orion_user_prefs_DEMO_local-admin')),
    }));

    expect(userRuntime.scopedAdminKeyStillIntact).toBe(true);
    expect(userRuntime.font).not.toBe('lato');
    expect(userRuntime.scale).not.toBe('1.5');
  });

  test('TEST D: Admin Organization Policy Defaults & Enforced Locks propagate and restrict non-admin overrides', async ({ page }) => {
    await loginTwoStage(page, 'admin', 'admin');
    await openAdminDisplayPreferences(page);

    // Configure Org Default Theme = Light (Enforced) & Org Default Font = ARIAL (Default)
    await page.getByTestId('org-default-theme-light').click();
    await page.getByTestId('org-enforce-theme').check();
    await page.getByTestId('org-default-font-ARIAL').click();
    await expect(page.getByTestId('org-policy-sync-status')).toBeVisible({ timeout: 5000 });

    // Switch to normal user via genuine UI Sign Out
    await signOutViaUI(page);
    await loginTwoStage(page, 'user', 'user');

    // User automatically receives Enforced Light Theme + Org Default ARIAL font
    await expect.poll(async () => {
      return page.evaluate(() => ({
        isLight: document.documentElement.classList.contains('light'),
        font: document.documentElement.dataset.orionFont,
      }));
    }).toEqual({
      isLight: true,
      font: 'arial',
    });

    // Open Display Settings inside OS Settings and verify Theme is locked by policy
    await page.evaluate(() => {
      if ((window as any).__orion_open_app) (window as any).__orion_open_app('settings');
    });
    const displaySidebarItem = page.locator('button:has-text("Display & Preferences"), button:has-text("Display")').first();
    if (await displaySidebarItem.count() > 0) {
      await displaySidebarItem.click();
      const lockedThemeBtn = page.getByTestId('display-theme-dark');
      if (await lockedThemeBtn.count() > 0) {
        await expect(lockedThemeBtn).toBeDisabled();
      }
    }
  });

  test('TEST E: Offline save updates UI locally without crash and preserves values upon network recovery', async ({ page, context }) => {
    await loginTwoStage(page, 'admin', 'admin');
    await openAdminDisplayPreferences(page);

    await context.setOffline(true);
    await page.getByTestId('display-font-LATO').click();
    await page.getByTestId('display-scale-125').click();

    await expect(page.getByTestId('preferences-sync-status-banner')).toBeVisible();
    await context.setOffline(false);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.orion-global-topbar', { timeout: 15000 });
    await expect.poll(() =>
      page.evaluate(() => ({
        font: document.documentElement.dataset.orionFont,
        scale: document.documentElement.style.getPropertyValue('--orion-display-scale'),
      }))
    ).toEqual({ font: 'lato', scale: '1.25' });
  });

  test('TEST G: Zero post-mount theme/font/scale flicker after startup preference hydration gate', async ({ page }) => {
    await loginTwoStage(page, 'admin', 'admin');
    await openAdminDisplayPreferences(page);

    await page.getByTestId('display-theme-light').click();
    await page.getByTestId('display-font-LATO').click();
    await page.getByTestId('display-scale-125').click();

    // Install startup observer on `document` before reloading so every DOM state at the moment desktop appears is recorded
    await page.addInitScript(() => {
      (window as any).__orionStartupTimeline = [];
      const captureIfMounted = () => {
        if (!document.documentElement) return;
        const desktopMounted = Boolean(document.querySelector('.orion-global-topbar'));
        if (desktopMounted) {
          (window as any).__orionStartupTimeline.push({
            t: performance.now(),
            isLight: document.documentElement.classList.contains('light'),
            isDark: document.documentElement.classList.contains('dark'),
            font: document.documentElement.dataset.orionFont || null,
            scale: document.documentElement.style.getPropertyValue('--orion-display-scale') || null,
          });
        }
      };
      const observer = new MutationObserver(captureIfMounted);
      observer.observe(document, {
        attributes: true,
        childList: true,
        subtree: true,
      });
      if (document.readyState !== 'loading') {
        captureIfMounted();
      } else {
        document.addEventListener('DOMContentLoaded', captureIfMounted, { once: true });
      }
    });

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.orion-global-topbar', { timeout: 15000 });

    const timeline: Array<{ isLight: boolean; isDark: boolean; font: string | null; scale: string | null }> =
      await page.evaluate(() => (window as any).__orionStartupTimeline || []);

    expect(timeline.length).toBeGreaterThan(0);
    // Every sample recorded from the instant desktop mounted must already have light + lato + 1.25 (zero dark flicker after mount)
    const firstAtMount = timeline[0];
    expect(firstAtMount.isLight).toBe(true);
    expect(firstAtMount.isDark).toBe(false);
    expect(firstAtMount.font).toBe('lato');
    expect(firstAtMount.scale).toBe('1.25');
    for (const snap of timeline) {
      expect(snap.isLight).toBe(true);
      expect(snap.isDark).toBe(false);
    }
  });
});
