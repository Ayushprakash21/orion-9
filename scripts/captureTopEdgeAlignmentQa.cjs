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
  await page.waitForTimeout(2000);
}

async function run() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });

  // 1. Light Mode Visual Inspection
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
    await login(page);

    // Collapsed
    await page.screenshot({ path: path.join(outDir, 'qa_alignment_light_collapsed.png') });
    console.log('Saved qa_alignment_light_collapsed.png');

    // Click to expand
    const capsule = page.locator('[data-testid="dynamic-island-capsule"]');
    if (await capsule.count() > 0) {
      await capsule.click({ force: true });
      await page.waitForTimeout(800);
    }

    // Expanded Fullscreen
    await page.screenshot({ path: path.join(outDir, 'qa_alignment_light_expanded.png') });
    console.log('Saved qa_alignment_light_expanded.png');

    // Close-up crop of the top edge junction (x: 550 to 1370, y: 0 to 120)
    // Dynamic island is 580px wide centered at 960 (670 to 1250) + fillets (658 to 1262)
    await page.screenshot({
      path: path.join(outDir, 'qa_alignment_light_junction_crop.png'),
      clip: { x: 620, y: 0, width: 680, height: 120 }
    });
    console.log('Saved qa_alignment_light_junction_crop.png');

    // Left fillet macro crop
    await page.screenshot({
      path: path.join(outDir, 'qa_alignment_light_left_fillet_macro.png'),
      clip: { x: 640, y: 25, width: 100, height: 50 }
    });
    console.log('Saved qa_alignment_light_left_fillet_macro.png');

    // Right fillet macro crop
    await page.screenshot({
      path: path.join(outDir, 'qa_alignment_light_right_fillet_macro.png'),
      clip: { x: 1180, y: 25, width: 100, height: 50 }
    });
    console.log('Saved qa_alignment_light_right_fillet_macro.png');

    await page.close();
  }

  // 2. Dark Mode Visual Inspection
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

    // Collapsed
    await page.screenshot({ path: path.join(outDir, 'qa_alignment_dark_collapsed.png') });
    console.log('Saved qa_alignment_dark_collapsed.png');

    // Click to expand
    const capsule = page.locator('[data-testid="dynamic-island-capsule"]');
    if (await capsule.count() > 0) {
      await capsule.click({ force: true });
      await page.waitForTimeout(800);
    }

    // Expanded Fullscreen
    await page.screenshot({ path: path.join(outDir, 'qa_alignment_dark_expanded.png') });
    console.log('Saved qa_alignment_dark_expanded.png');

    // Close-up crop of the top edge junction
    await page.screenshot({
      path: path.join(outDir, 'qa_alignment_dark_junction_crop.png'),
      clip: { x: 620, y: 0, width: 680, height: 120 }
    });
    console.log('Saved qa_alignment_dark_junction_crop.png');

    await page.close();
  }

  await browser.close();
  console.log('Visual QA complete!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
