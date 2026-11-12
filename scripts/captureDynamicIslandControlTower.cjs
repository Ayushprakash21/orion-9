const { chromium } = require('playwright');
const path = require('path');

const outDir = 'C:/Users/Ayush/.gemini/antigravity/brain/5f06512e-da58-4a5d-be62-e2ac72ec78f8';

async function login(page) {
  await page.goto('http://127.0.0.1:3000/login');
  await page.waitForSelector('input#username');
  await page.fill('input#username', 'admin');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForSelector('input#password');
  await page.fill('input#password', 'admin');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForSelector('[data-dynamic-island-anchor]');
  await page.waitForTimeout(2500);
}

async function capture() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });

  // 1. Dark Mode: Collapsed & Expanded at 1920x1080
  {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.addInitScript(() => {
      sessionStorage.setItem('orion_os_power_state', 'ON');
      localStorage.setItem('orion-appearance-preferences', JSON.stringify({
        themeId: 'graphite',
        appearanceMode: 'dark',
        appearancePreferencesVersion: 1
      }));
    });
    await login(page);

    // Collapsed screenshot
    await page.screenshot({ path: path.join(outDir, 'dynamic_island_collapsed_desktop.png') });
    console.log('Captured dynamic_island_collapsed_desktop.png');

    // Click Dynamic Island Capsule to expand
    const capsule = page.locator('[data-testid="dynamic-island-capsule"]');
    if (await capsule.count() > 0) {
      await capsule.click({ force: true });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(outDir, 'dynamic_island_expanded_control_tower.png') });
      console.log('Captured dynamic_island_expanded_control_tower.png');
    }
    await page.close();
  }

  // 2. Light Mode: Collapsed & Expanded at 1217x917
  {
    const page = await browser.newPage({ viewport: { width: 1217, height: 917 } });
    await page.addInitScript(() => {
      sessionStorage.setItem('orion_os_power_state', 'ON');
      localStorage.setItem('orion-appearance-preferences', JSON.stringify({
        themeId: 'silver',
        appearanceMode: 'light',
        appearancePreferencesVersion: 1
      }));
    });
    await login(page);

    // Collapsed screenshot
    await page.screenshot({ path: path.join(outDir, 'dynamic_island_light_collapsed.png') });
    console.log('Captured dynamic_island_light_collapsed.png');

    // Expand island
    const capsule = page.locator('[data-testid="dynamic-island-capsule"]');
    if (await capsule.count() > 0) {
      await capsule.click({ force: true });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(outDir, 'dynamic_island_light_expanded.png') });
      console.log('Captured dynamic_island_light_expanded.png');
    }
    await page.close();
  }

  // 3. Viewport 1728x900 and 1366x768 verification
  for (const [w, h] of [[1728, 900], [1366, 768]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.addInitScript(() => {
      sessionStorage.setItem('orion_os_power_state', 'ON');
      localStorage.setItem('orion-appearance-preferences', JSON.stringify({
        themeId: 'graphite',
        appearanceMode: 'dark',
        appearancePreferencesVersion: 1
      }));
    });
    await login(page);

    const capsule = page.locator('[data-testid="dynamic-island-capsule"]');
    if (await capsule.count() > 0) {
      await capsule.click({ force: true });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(outDir, `dynamic_island_expanded_${w}x${h}.png`) });
      console.log(`Captured dynamic_island_expanded_${w}x${h}.png`);
    }
    await page.close();
  }

  await browser.close();
  console.log('All verification captures completed successfully.');
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
