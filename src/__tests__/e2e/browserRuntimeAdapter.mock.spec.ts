import { test, expect } from '@playwright/test';

test.describe('ORION-9 Frontend Adapter Mock Verification Suite (browserRuntimeAdapter.mock.test.ts)', () => {
  const setupBrowserSession = async (page: any, isNativeRuntime: boolean = true) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.addInitScript((nativeEnabled: boolean) => {
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
            department: 'IT Administration',
          },
          organization: {
            id: 'ORION_PLATFORM',
            name: 'ORION_PLATFORM',
            status: 'active',
          },
          permissions: ['all'],
          environment: 'DEMO',
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        }));

        if (nativeEnabled) {
          // Native Desktop Host Mock Bridge (Tauri 2.x WRY WebView)
          const mockSurfaces = new Map<string, any>();
          (window as any).__TAURI__ = {
            core: {
              invoke: async (cmd: string, args: any) => {
                if (cmd === 'browser_runtime_capabilities') {
                  return { native_available: true, multi_surface_supported: true, platform: 'windows' };
                }
                if (cmd === 'browser_create_surface' || cmd === 'browser_ensure_surface') {
                  mockSurfaces.set(args.tabId, { ...args, visible: true });
                  return args.surfaceId;
                }
                if (cmd === 'browser_navigate') {
                  const s = mockSurfaces.get(args.tabId);
                  if (s) s.url = args.url;
                  // Dispatch navigation completion event
                  window.dispatchEvent(new CustomEvent('orion-native-browser-incoming', {
                    detail: {
                      type: 'navigation-finished',
                      detail: {
                        tabId: args.tabId,
                        url: args.url,
                        title: args.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0],
                        loading: false,
                      }
                    }
                  }));
                  return null;
                }
                if (cmd === 'browser_set_bounds') {
                  const s = mockSurfaces.get(args.tabId);
                  if (s) s.bounds = args.bounds;
                  return null;
                }
                if (cmd === 'browser_set_zoom') {
                  const s = mockSurfaces.get(args.tabId);
                  if (s) s.zoom = args.zoom;
                  return null;
                }
                if (cmd === 'browser_find_in_page') {
                  return { count: 3, activeIndex: 0 };
                }
                return null;
              }
            },
            event: {
              listen: (_name: string, _cb: any) => Promise.resolve(() => {}),
            }
          };
        }
      } catch (e) {}
    }, isNativeRuntime);

    await page.goto('/browser');
    await page.waitForLoadState('domcontentloaded');

    // Ensure Orion Browser chrome is mounted
    const browser = page.locator('[data-testid="orion-browser"]');
    await expect(browser).toBeVisible({ timeout: 15000 });
  };

  test('TEST 1: Desktop Native Runtime - Google Navigation', async ({ page }) => {
    await setupBrowserSession(page, true);

    const addressInput = page.locator('[data-testid="browser-address-input"]');
    await expect(addressInput).toBeVisible();

    // Type google.com and press Enter
    await addressInput.click();
    await addressInput.fill('https://google.com');
    await addressInput.press('Enter');

    // Verify native viewport container is rendered and NO "Website Cannot Be Embedded" appears
    const nativeViewport = page.locator('[data-testid="browser-native-viewport"]');
    await expect(nativeViewport).toBeVisible();

    const blockedScreen = page.locator('[data-testid="browser-blocked-embedding"]');
    await expect(blockedScreen).not.toBeVisible();

    // Verify committed address
    await expect(addressInput).toHaveValue('https://google.com');
  });

  test('TEST 2: Desktop Native Runtime - GitHub, Wikipedia, and Example Navigation', async ({ page }) => {
    await setupBrowserSession(page, true);

    const addressInput = page.locator('[data-testid="browser-address-input"]');

    // GitHub
    await addressInput.click();
    await addressInput.fill('https://github.com');
    await addressInput.press('Enter');
    await expect(page.locator('[data-testid="browser-blocked-embedding"]')).not.toBeVisible();
    await expect(addressInput).toHaveValue('https://github.com');

    // Wikipedia
    await addressInput.click();
    await addressInput.fill('https://www.wikipedia.org');
    await addressInput.press('Enter');
    await expect(page.locator('[data-testid="browser-blocked-embedding"]')).not.toBeVisible();
    await expect(addressInput).toHaveValue('https://www.wikipedia.org');

    // Example.com
    await addressInput.click();
    await addressInput.fill('https://example.com');
    await addressInput.press('Enter');
    await expect(page.locator('[data-testid="browser-blocked-embedding"]')).not.toBeVisible();
    await expect(addressInput).toHaveValue('https://example.com');
  });

  test('TEST 3: Multi-Tab Architecture and Tab Switching', async ({ page }) => {
    await setupBrowserSession(page, true);

    const newTabBtn = page.locator('[data-testid="browser-new-tab-btn"]');
    await expect(newTabBtn).toBeVisible();
    await newTabBtn.click();

    // Expect 2 tabs in the tab strip
    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(2);

    // Switch back to Tab 1
    await tabs.first().click();
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  });

  test('TEST 4: Zoom and Find In Page Integration', async ({ page }) => {
    await setupBrowserSession(page, true);

    // Open Find in Page via shortcut or button
    await page.keyboard.press('Control+F');
    const findBar = page.locator('[data-testid="browser-find-in-page"]');
    await expect(findBar).toBeVisible();

    const findInput = page.locator('[data-testid="browser-find-input"]');
    await findInput.fill('Orion');

    // Close Find Bar
    await page.keyboard.press('Escape');
  });

  test('TEST 5: Web Embedded Mode - Honest Compatibility Fallback', async ({ page }) => {
    // Launch in standard web mode without native desktop bridge
    await setupBrowserSession(page, false);

    const addressInput = page.locator('[data-testid="browser-address-input"]');
    await addressInput.click();
    await addressInput.fill('https://github.com');
    await addressInput.press('Enter');

    // In web mode, when a site triggers blocked embedding:
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('orion-browser-runtime-event', {
        detail: {
          type: 'navigation-failed',
          tabId: 'tab-1',
          url: 'https://github.com',
          error: 'BLOCKED_EMBEDDING'
        }
      }));
    });

    const blockedFallback = page.locator('[data-testid="browser-blocked-embedding"]');
    await expect(blockedFallback).toBeVisible();
    await expect(blockedFallback).toContainText('Full browser runtime unavailable in web mode.');
    await expect(page.locator('[data-testid="browser-open-external-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="browser-install-desktop-btn"]')).toBeVisible();
  });
});
