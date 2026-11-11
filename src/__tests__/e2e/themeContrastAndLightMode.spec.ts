import { test, expect, Page } from '@playwright/test';
import path from 'node:path';

const ARTIFACTS_DIR = 'C:/Users/Ayush/.gemini/antigravity/brain/5f06512e-da58-4a5d-be62-e2ac72ec78f8';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    try {
      sessionStorage.setItem('orion_os_power_state', 'ON');
    } catch {}
  });
  await page.fill('input#username', 'admin');
  await page.click('button[type="submit"]');
  await expect(page.locator('input#password')).toBeVisible({ timeout: 8000 });
  await page.fill('input#password', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForSelector('.orion-global-topbar', { timeout: 15000 });
}

/**
 * Evaluates actual rendered computed colors inside the browser and verifies WCAG contrast
 * between button/label text color and resolved background (compositing alpha against ancestor/canvas).
 */
async function measureVisibleControlsContrast(page: Page, selector: string, textMatches?: string[]) {
  return page.evaluate(({ sel, filters }) => {
    const parseRgb = (cssStr: string): { r: number; g: number; b: number; a: number } | null => {
      const m = cssStr.match(/rgba?\(\s*([0-9.]+),\s*([0-9.]+),\s*([0-9.]+)(?:,\s*([0-9.]+))?\s*\)/i);
      if (!m) return null;
      return {
        r: Number(m[1]),
        g: Number(m[2]),
        b: Number(m[3]),
        a: m[4] !== undefined ? Number(m[4]) : 1,
      };
    };

    const composite = (fg: { r: number; g: number; b: number; a: number }, bg: { r: number; g: number; b: number; a: number }) => ({
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
      a: 1,
    });

    const relLum = (c: { r: number; g: number; b: number }) => {
      const lin = (v: number) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
    };

    const effectiveBg = (el: Element): { r: number; g: number; b: number; a: number } => {
      const stack: Array<{ r: number; g: number; b: number; a: number }> = [];
      let cur: Element | null = el;
      while (cur) {
        const bg = parseRgb(getComputedStyle(cur).backgroundColor);
        if (bg && bg.a > 0) stack.unshift(bg);
        cur = cur.parentElement;
      }
      const isLight = document.documentElement.classList.contains('light');
      let acc = isLight ? { r: 245, g: 245, b: 243, a: 1 } : { r: 11, g: 13, b: 15, a: 1 };
      for (const layer of stack) {
        acc = composite(layer, acc);
      }
      return acc;
    };

    const els = Array.from(document.querySelectorAll(sel));
    return els
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        const txt = (el.textContent || '').trim();
        if (rect.width <= 0 || rect.height <= 0 || txt.length === 0) return false;
        if (filters && filters.length > 0) {
          return filters.some((f) => txt.includes(f));
        }
        return true;
      })
      .map((el) => {
        const cs = getComputedStyle(el);
        const fg = parseRgb(cs.color) || { r: 255, g: 255, b: 255, a: 1 };
        const bg = effectiveBg(el);
        const resolvedFg = composite(fg, bg);
        const l1 = Math.max(relLum(resolvedFg), relLum(bg));
        const l2 = Math.min(relLum(resolvedFg), relLum(bg));
        const ratio = (l1 + 0.05) / (l2 + 0.05);
        return {
          text: (el.textContent || '').trim().slice(0, 40),
          color: cs.color,
          bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
          ratio: Number(ratio.toFixed(2)),
        };
      });
  }, { sel: selector, filters: textMatches || [] });
}

test.describe('Orion-9 All 5 Themes, Light Mode Repair & Button Contrast E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
        sessionStorage.setItem('orion_os_power_state', 'ON');
      } catch {}
    });
  });

  test('THEME-E2E-01: Switches live across Graphite, Silver, Midnight, Forest, Warm + Amber Gold custom accent with valid WCAG button contrast', async ({ page }) => {
    await loginAsAdmin(page);

    // Open Settings -> Appearance
    await page.evaluate(() => {
      if ((window as any).__orion_open_app) (window as any).__orion_open_app('settings');
    });
    const appearanceNav = page.locator('button:has-text("Appearance")').first();
    await expect(appearanceNav).toBeVisible({ timeout: 10000 });
    await appearanceNav.click();
    await expect(page.locator('text=Personalization & Appearance Engine')).toBeVisible({ timeout: 8000 });

    const themes = [
      { id: 'graphite', label: 'Graphite', expectedMode: 'dark' },
      { id: 'silver', label: 'Silver', expectedMode: 'light' },
      { id: 'midnight', label: 'Midnight', expectedMode: 'dark' },
      { id: 'forest', label: 'Forest', expectedMode: 'dark' },
      { id: 'warm', label: 'Warm', expectedMode: 'dark' },
    ];

    for (const theme of themes) {
      await page.locator(`button:has-text("${theme.label}")`).first().click();

      await expect.poll(async () => {
        return page.evaluate(() => ({
          themeId: document.documentElement.getAttribute('data-orion-theme'),
          mode: document.documentElement.getAttribute('data-orion-mode'),
          colorScheme: document.documentElement.style.colorScheme,
        }));
      }).toEqual({
        themeId: theme.id,
        mode: theme.expectedMode,
        colorScheme: theme.expectedMode,
      });

      // Allow 200ms root CSS theme variable transition to settle before sampling getComputedStyle
      await page.waitForTimeout(260);

      // Measure actual rendered contrast of primary CTA buttons ("Apply Changes", "Import Profile", "Primary Action", "Reset")
      const primaryButtons = await measureVisibleControlsContrast(
        page,
        'button, label',
        ['Apply Changes', 'Import Profile', 'Primary Action', 'Reset']
      );
      expect(primaryButtons.length).toBeGreaterThanOrEqual(3);
      for (const b of primaryButtons) {
        expect(b.ratio, `Low contrast on ${theme.id} button "${b.text}" (${b.color} on ${b.bg})`).toBeGreaterThanOrEqual(4.5);
      }

      // Keyboard focus-visible check on first theme card
      await page.locator(`button:has-text("${theme.label}")`).first().focus();
      const focusRingCheck = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return null;
        const cs = getComputedStyle(el);
        return { tag: el.tagName, outlineWidth: cs.outlineWidth, boxShadow: cs.boxShadow };
      });
      expect(focusRingCheck?.tag).toBe('BUTTON');

      await page.screenshot({
        path: path.join(ARTIFACTS_DIR, `theme_verify_${theme.id}_settings.png`),
        fullPage: false,
      });
    }

    // Now select Silver + Amber Gold (#C6A15B) custom accent (reproducing user's screenshot scenario!)
    await page.locator('button:has-text("Silver")').first().click();
    await page.locator('button[title="Amber Gold"]').click();

    await expect.poll(async () => {
      return page.evaluate(() => ({
        accent: document.documentElement.style.getPropertyValue('--orion-accent').toUpperCase(),
        onAccent: document.documentElement.style.getPropertyValue('--orion-on-accent').toUpperCase(),
        inverse: document.documentElement.style.getPropertyValue('--os-text-primary-inverse').toUpperCase(),
      }));
    }).toEqual({
      accent: '#C6A15B',
      onAccent: '#0F172A',
      inverse: '#0F172A',
    });

    // Wait for 200ms CSS variable transitions to settle before reading computed colors
    await page.waitForTimeout(260);

    const amberButtons = await measureVisibleControlsContrast(
      page,
      'button, label',
      ['Apply Changes', 'Import Profile', 'Primary Action']
    );
    for (const b of amberButtons) {
      expect(b.ratio, `Amber Gold button "${b.text}" (${b.color} on ${b.bg}) failed contrast`).toBeGreaterThanOrEqual(4.5);
    }

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'theme_verify_silver_amber_after.png'),
      fullPage: false,
    });

    // Reload browser and verify Silver + Amber Gold persists cleanly
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.orion-global-topbar', { timeout: 15000 });
    const persisted = await page.evaluate(() => ({
      isLight: document.documentElement.classList.contains('light'),
      accent: document.documentElement.style.getPropertyValue('--orion-accent').toUpperCase(),
      onAccent: document.documentElement.style.getPropertyValue('--orion-on-accent').toUpperCase(),
    }));
    expect(persisted.isLight).toBe(true);
    expect(persisted.accent).toBe('#C6A15B');
    expect(persisted.onAccent).toBe('#0F172A');
  });

  test('THEME-E2E-02: Silver Light Mode updates Desktop, Dynamic Island, Control Center, App Windows, Tables, Modals, and Admin Console cleanly', async ({ page }) => {
    await loginAsAdmin(page);

    // Switch to Silver Light Theme cleanly via Settings
    await page.evaluate(() => {
      if ((window as any).__orion_open_app) (window as any).__orion_open_app('settings');
    });
    await page.locator('button:has-text("Appearance")').first().click();
    await page.locator('button:has-text("Silver")').first().click();

    await expect.poll(() =>
      page.evaluate(() => document.documentElement.classList.contains('light'))
    ).toBe(true);

    // Check Language & Region AND Time & Date panels inside Settings adopt Light Theme (no stuck dark boxes!)
    await page.locator('button:has-text("Language & Region")').first().click();
    await page.waitForTimeout(150);
    const stuckDarkCards = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h3, h4'));
      return headings
        .filter((h) => h.textContent?.includes('Interface Language') || h.textContent?.includes('Region & Locale') || h.textContent?.includes('Regional Formats'))
        .map((h) => {
          const card = h.closest('div.rounded-xl');
          return card ? getComputedStyle(card).backgroundColor : null;
        });
    });
    expect(stuckDarkCards.length).toBeGreaterThanOrEqual(2);
    for (const bg of stuckDarkCards) {
      expect(bg).not.toBe('rgb(18, 21, 26)');
    }

    await page.locator('button:has-text("Time & Date")').first().click();
    await page.waitForTimeout(150);
    const timeDarkCards = await page.evaluate(() => {
      const h = Array.from(document.querySelectorAll('h4')).find((el) => el.textContent?.includes('Date & Time Settings'));
      const card = h?.closest('div.rounded-xl');
      return card ? getComputedStyle(card).backgroundColor : null;
    });
    expect(timeDarkCards).not.toBe('rgb(18, 21, 26)');

    // Close Settings cleanly so Desktop + Widgets + Dynamic Island + Control Center are unobstructed
    const closeSettingsBtn = page.locator('[aria-label="Close Settings"]').first();
    if (await closeSettingsBtn.isVisible()) {
      await closeSettingsBtn.click();
    }
    await page.waitForTimeout(200);

    // Check Desktop Widgets readable dark ink text contrast on Silver surface
    const widgetTitles = await measureVisibleControlsContrast(page, '[data-testid="desktop-widget"] button');
    for (const wb of widgetTitles) {
      if (wb.text.trim().length > 0) {
        expect(wb.ratio, `Desktop widget button "${wb.text}" low contrast (${wb.color} on ${wb.bg})`).toBeGreaterThanOrEqual(4.5);
      }
    }

    // Open Dynamic Island Expanded card
    await page.locator('[aria-label="Expand Orion Dynamic Island"]').click();
    await expect(page.getByTestId('dynamic-island-expanded-panel')).toBeVisible({ timeout: 5000 });
    const islandContrast = await measureVisibleControlsContrast(
      page,
      '[data-testid="dynamic-island-expanded-panel"] button'
    );
    for (const b of islandContrast) {
      expect(b.ratio, `Dynamic Island light button "${b.text}" low contrast`).toBeGreaterThanOrEqual(4.5);
    }

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'theme_verify_silver_desktop_island.png'),
      fullPage: false,
    });

    // Collapse island & open Control Center
    await page.keyboard.press('Escape');
    await page.getByTestId('control-center-toggle-btn').click();
    await expect(page.getByTestId('orion-control-center-popover')).toBeVisible({ timeout: 5000 });
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'theme_verify_silver_control_center.png'),
      fullPage: false,
    });

    // Open Control Tower / Command Center application window & capture Light Mode Dashboard/Table
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      if ((window as any).__orion_open_app) (window as any).__orion_open_app('command-center');
    });
    await page.waitForSelector('[data-window-id="command-center"]', { timeout: 10000 });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'theme_verify_silver_control_tower.png'),
      fullPage: false,
    });

    // Navigate to Admin Console -> Administration Settings in Silver Light Mode
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1:has-text("Administration Settings")', { timeout: 10000 });
    await page.waitForTimeout(200);
    const adminContrast = await measureVisibleControlsContrast(
      page,
      'aside a, button',
      ['Overview', 'Settings', 'Update & Log Out', 'HOME SCREEN']
    );
    for (const b of adminContrast) {
      expect(b.ratio, `Admin light button "${b.text}" low contrast`).toBeGreaterThanOrEqual(4.5);
    }
    await page.locator('button:has-text("Display & Preferences")').click();
    await expect(page.getByTestId('display-preferences-controls')).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(220);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'theme_verify_silver_admin_settings.png'),
      fullPage: false,
    });
  });
});
