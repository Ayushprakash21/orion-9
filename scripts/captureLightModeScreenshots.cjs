const { chromium } = require('playwright');
const path = require('path');

const outDir = 'C:/Users/Ayush/.gemini/antigravity/brain/5f06512e-da58-4a5d-be62-e2ac72ec78f8';

async function capture() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });

  // 1. Light Mode at 1217x917 (Defect Reproduction Viewport)
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
    await page.goto('http://127.0.0.1:3000/login');
    await page.waitForSelector('input#username');
    await page.fill('input#username', 'admin');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForSelector('input#password');
    await page.fill('input#password', 'admin');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForSelector('[data-dynamic-island-anchor]');
    await page.waitForTimeout(2500);

    await page.screenshot({ path: path.join(outDir, 'desktop_light_1217x917.png') });
    console.log('Captured desktop_light_1217x917.png');
    await page.close();
  }

  // 2. Light Mode at 1920x1080
  {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.addInitScript(() => {
      sessionStorage.setItem('orion_os_power_state', 'ON');
      localStorage.setItem('orion-appearance-preferences', JSON.stringify({
        themeId: 'silver',
        appearanceMode: 'light',
        appearancePreferencesVersion: 1
      }));
    });
    await page.goto('http://127.0.0.1:3000/');
    await page.waitForSelector('[data-dynamic-island-anchor]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, 'desktop_light_1920x1080.png') });
    console.log('Captured desktop_light_1920x1080.png');
    await page.close();
  }

  // 3. Light Mode at 1366x768
  {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await page.addInitScript(() => {
      sessionStorage.setItem('orion_os_power_state', 'ON');
      localStorage.setItem('orion-appearance-preferences', JSON.stringify({
        themeId: 'silver',
        appearanceMode: 'light',
        appearancePreferencesVersion: 1
      }));
    });
    await page.goto('http://127.0.0.1:3000/');
    await page.waitForSelector('[data-dynamic-island-anchor]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, 'desktop_light_1366x768.png') });
    console.log('Captured desktop_light_1366x768.png');
    await page.close();
  }

  // 4. Dark Mode at 1217x917 (Regression check)
  {
    const page = await browser.newPage({ viewport: { width: 1217, height: 917 } });
    await page.addInitScript(() => {
      sessionStorage.setItem('orion_os_power_state', 'ON');
      localStorage.setItem('orion-appearance-preferences', JSON.stringify({
        themeId: 'graphite',
        appearanceMode: 'dark',
        appearancePreferencesVersion: 1
      }));
    });
    await page.goto('http://127.0.0.1:3000/');
    await page.waitForSelector('[data-dynamic-island-anchor]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, 'desktop_dark_1217x917.png') });
    console.log('Captured desktop_dark_1217x917.png');
    await page.close();
  }

  await browser.close();
}

capture().catch(console.error);
