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

async function runVisualQA() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const resolutions = [
    { name: '1920x1080', width: 1920, height: 1080 },
    { name: '1919x945', width: 1919, height: 945 },
    { name: '1728x900', width: 1728, height: 900 },
    { name: '1366x768', width: 1366, height: 768 }
  ];

  for (const res of resolutions) {
    console.log(`\n=== Testing Resolution: ${res.name} ===`);

    // 1. Light Mode Cycle (Collapsed, During Expansion, Expanded)
    {
      const page = await browser.newPage({ viewport: { width: res.width, height: res.height } });
      await page.addInitScript(() => {
        sessionStorage.setItem('orion_os_power_state', 'ON');
        localStorage.setItem('orion-appearance-preferences', JSON.stringify({
          themeId: 'silver',
          appearanceMode: 'light',
          appearancePreferencesVersion: 1
        }));
      });
      await login(page);

      // A. Light Mode Collapsed
      await page.screenshot({ path: path.join(outDir, `qa_light_collapsed_${res.name}.png`) });
      console.log(`Captured qa_light_collapsed_${res.name}.png`);

      // C. Light Mode during expansion
      const capsule = page.locator('[data-testid="dynamic-island-capsule"]');
      if (await capsule.count() > 0) {
        await capsule.click({ force: true });
        // Snap during expansion
        await page.waitForTimeout(120);
        await page.screenshot({ path: path.join(outDir, `qa_light_during_expansion_${res.name}.png`) });
        console.log(`Captured qa_light_during_expansion_${res.name}.png`);

        // B. Light Mode Fully Expanded
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(outDir, `qa_light_expanded_${res.name}.png`) });
        console.log(`Captured qa_light_expanded_${res.name}.png`);
      }
      await page.close();
    }

    // 2. Dark Mode Cycle (Collapsed, Expanded, During Collapse)
    {
      const page = await browser.newPage({ viewport: { width: res.width, height: res.height } });
      await page.addInitScript(() => {
        sessionStorage.setItem('orion_os_power_state', 'ON');
        localStorage.setItem('orion-appearance-preferences', JSON.stringify({
          themeId: 'graphite',
          appearanceMode: 'dark',
          appearancePreferencesVersion: 1
        }));
      });
      await login(page);

      // D. Dark Mode Collapsed
      await page.screenshot({ path: path.join(outDir, `qa_dark_collapsed_${res.name}.png`) });
      console.log(`Captured qa_dark_collapsed_${res.name}.png`);

      // Expand island
      const capsule = page.locator('[data-testid="dynamic-island-capsule"]');
      if (await capsule.count() > 0) {
        await capsule.click({ force: true });
        await page.waitForTimeout(800);

        // E. Dark Mode Expanded
        await page.screenshot({ path: path.join(outDir, `qa_dark_expanded_${res.name}.png`) });
        console.log(`Captured qa_dark_expanded_${res.name}.png`);

        // F. Dark Mode During Collapse (Click collapse button)
        const collapseBtn = page.locator('button[aria-label="Collapse Dynamic Island"]');
        if (await collapseBtn.count() > 0) {
          await collapseBtn.click({ force: true });
          await page.waitForTimeout(100);
          await page.screenshot({ path: path.join(outDir, `qa_dark_during_collapse_${res.name}.png`) });
          console.log(`Captured qa_dark_during_collapse_${res.name}.png`);
        }
      }
      await page.close();
    }
  }

  // 3. LIVE THEME SWITCHING TEST WHILE EXPANDED
  console.log('\n=== Testing Live Theme Switching while Island is Expanded ===');
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

    // Expand in light mode
    const capsule = page.locator('[data-testid="dynamic-island-capsule"]');
    await capsule.click({ force: true });
    await page.waitForTimeout(800);

    // Capture Expanded Light
    await page.screenshot({ path: path.join(outDir, 'qa_theme_switch_1_light_expanded.png') });
    console.log('Captured qa_theme_switch_1_light_expanded.png');

    // Switch to Dark Mode live while expanded
    await page.evaluate(() => {
      localStorage.setItem('orion-appearance-preferences', JSON.stringify({
        themeId: 'graphite',
        appearanceMode: 'dark',
        appearancePreferencesVersion: 1
      }));
      window.dispatchEvent(new CustomEvent('orion-appearance-preferences-changed'));
    });
    await page.waitForTimeout(800);

    // Verify still expanded and now dark
    const expandedPanel = page.locator('[data-testid="dynamic-island-expanded-panel"]');
    const isVisible = await expandedPanel.isVisible();
    console.log('Is Dynamic Island expanded panel still visible after theme switch to dark?', isVisible);
    await page.screenshot({ path: path.join(outDir, 'qa_theme_switch_2_switched_to_dark.png') });
    console.log('Captured qa_theme_switch_2_switched_to_dark.png');

    // Switch back to Light Mode live while expanded
    await page.evaluate(() => {
      localStorage.setItem('orion-appearance-preferences', JSON.stringify({
        themeId: 'silver',
        appearanceMode: 'light',
        appearancePreferencesVersion: 1
      }));
      window.dispatchEvent(new CustomEvent('orion-appearance-preferences-changed'));
    });
    await page.waitForTimeout(800);

    const isVisible2 = await expandedPanel.isVisible();
    console.log('Is Dynamic Island expanded panel still visible after theme switch to light?', isVisible2);
    await page.screenshot({ path: path.join(outDir, 'qa_theme_switch_3_switched_back_to_light.png') });
    console.log('Captured qa_theme_switch_3_switched_back_to_light.png');

    await page.close();
  }

  await browser.close();
  console.log('\nAll Visual QA captures completed successfully!');
}

runVisualQA().catch(err => {
  console.error(err);
  process.exit(1);
});
