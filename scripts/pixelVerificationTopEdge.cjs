const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

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
  const results = {};

  // 1. LIGHT MODE TEST CYCLE
  {
    console.log('\n=== LIGHT MODE PIXEL AUDIT ===');
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

    // A. Light Collapsed
    await page.screenshot({ path: path.join(outDir, 'pixel_light_collapsed_full.png') });
    await page.screenshot({
      path: path.join(outDir, 'pixel_light_collapsed_top100.png'),
      clip: { x: 0, y: 0, width: 1920, height: 100 }
    });
    console.log('Saved pixel_light_collapsed_top100.png');

    // B. Light Mid-Expansion
    const capsule = page.locator('[data-testid="dynamic-island-capsule"]');
    if (await capsule.count() > 0) {
      await capsule.click({ force: true });
      await page.waitForTimeout(100);
      await page.screenshot({
        path: path.join(outDir, 'pixel_light_mid_expansion_top100.png'),
        clip: { x: 600, y: 0, width: 720, height: 120 }
      });
      console.log('Saved pixel_light_mid_expansion_top100.png');

      // C. Light Fully Expanded
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(outDir, 'pixel_light_expanded_full.png') });
      await page.screenshot({
        path: path.join(outDir, 'pixel_light_expanded_top100.png'),
        clip: { x: 0, y: 0, width: 1920, height: 100 }
      });
      await page.screenshot({
        path: path.join(outDir, 'pixel_light_expanded_junction_macro.png'),
        clip: { x: 600, y: 0, width: 720, height: 100 }
      });
      console.log('Saved pixel_light_expanded_top100.png & junction macro');

      // Geometry evaluation
      const measurements = await page.evaluate(() => {
        const topbar = document.querySelector('.orion-global-topbar');
        const island = document.querySelector('#dynamic-island-expanded-surface') || document.querySelector('[data-testid="dynamic-island-expanded-panel"]');
        const anchor = document.querySelector('[data-dynamic-island-anchor]');
        
        const topbarRect = topbar ? topbar.getBoundingClientRect() : null;
        const islandRect = island ? island.getBoundingClientRect() : null;
        const anchorRect = anchor ? anchor.getBoundingClientRect() : null;

        const islandComputed = island ? window.getComputedStyle(island) : null;
        const topbarComputed = topbar ? window.getComputedStyle(topbar) : null;

        return {
          topbar: {
            top: topbarRect?.top,
            bottom: topbarRect?.bottom,
            height: topbarRect?.height,
            backgroundColor: topbarComputed?.backgroundColor,
            backdropFilter: topbarComputed?.backdropFilter,
          },
          island: {
            top: islandRect?.top,
            bottom: islandRect?.bottom,
            left: islandRect?.left,
            right: islandRect?.right,
            width: islandRect?.width,
            borderTopWidth: islandComputed?.borderTopWidth,
            borderTopLeftRadius: islandComputed?.borderTopLeftRadius,
            borderTopRightRadius: islandComputed?.borderTopRightRadius,
            borderBottomLeftRadius: islandComputed?.borderBottomLeftRadius,
            borderBottomRightRadius: islandComputed?.borderBottomRightRadius,
            backgroundColor: islandComputed?.backgroundColor,
            backdropFilter: islandComputed?.backdropFilter,
            boxShadow: islandComputed?.boxShadow,
          },
          anchor: {
            top: anchorRect?.top,
          },
          diff: islandRect && topbarRect ? islandRect.top - topbarRect.bottom : null,
        };
      });

      results.light = measurements;
      console.log('Light Mode Measurements:', JSON.stringify(measurements, null, 2));
    }

    await page.close();
  }

  // 2. DARK MODE TEST CYCLE
  {
    console.log('\n=== DARK MODE PIXEL AUDIT ===');
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

    // D. Dark Collapsed
    await page.screenshot({ path: path.join(outDir, 'pixel_dark_collapsed_full.png') });
    await page.screenshot({
      path: path.join(outDir, 'pixel_dark_collapsed_top100.png'),
      clip: { x: 0, y: 0, width: 1920, height: 100 }
    });
    console.log('Saved pixel_dark_collapsed_top100.png');

    // E. Dark Expanded
    const capsule = page.locator('[data-testid="dynamic-island-capsule"]');
    if (await capsule.count() > 0) {
      await capsule.click({ force: true });
      await page.waitForTimeout(800);

      await page.screenshot({ path: path.join(outDir, 'pixel_dark_expanded_full.png') });
      await page.screenshot({
        path: path.join(outDir, 'pixel_dark_expanded_top100.png'),
        clip: { x: 0, y: 0, width: 1920, height: 100 }
      });
      await page.screenshot({
        path: path.join(outDir, 'pixel_dark_expanded_junction_macro.png'),
        clip: { x: 600, y: 0, width: 720, height: 100 }
      });
      console.log('Saved pixel_dark_expanded_top100.png & junction macro');

      // F. Dark Mid-Collapse
      const collapseBtn = page.locator('button[aria-label="Collapse Dynamic Island"]');
      if (await collapseBtn.count() > 0) {
        await collapseBtn.click({ force: true });
        await page.waitForTimeout(100);
        await page.screenshot({
          path: path.join(outDir, 'pixel_dark_mid_collapse_top100.png'),
          clip: { x: 600, y: 0, width: 720, height: 100 }
        });
        console.log('Saved pixel_dark_mid_collapse_top100.png');
      }

      // Geometry evaluation
      const measurements = await page.evaluate(() => {
        const topbar = document.querySelector('.orion-global-topbar');
        const island = document.querySelector('#dynamic-island-expanded-surface') || document.querySelector('[data-testid="dynamic-island-expanded-panel"]');
        
        const topbarRect = topbar ? topbar.getBoundingClientRect() : null;
        const islandRect = island ? island.getBoundingClientRect() : null;

        const islandComputed = island ? window.getComputedStyle(island) : null;
        const topbarComputed = topbar ? window.getComputedStyle(topbar) : null;

        return {
          topbar: {
            top: topbarRect?.top,
            bottom: topbarRect?.bottom,
            height: topbarRect?.height,
            backgroundColor: topbarComputed?.backgroundColor,
            backdropFilter: topbarComputed?.backdropFilter,
          },
          island: {
            top: islandRect?.top,
            bottom: islandRect?.bottom,
            width: islandRect?.width,
            borderTopWidth: islandComputed?.borderTopWidth,
            borderTopLeftRadius: islandComputed?.borderTopLeftRadius,
            borderTopRightRadius: islandComputed?.borderTopRightRadius,
            borderBottomLeftRadius: islandComputed?.borderBottomLeftRadius,
            borderBottomRightRadius: islandComputed?.borderBottomRightRadius,
            backgroundColor: islandComputed?.backgroundColor,
            backdropFilter: islandComputed?.backdropFilter,
          },
          diff: islandRect && topbarRect ? islandRect.top - topbarRect.bottom : null,
        };
      });

      results.dark = measurements;
      console.log('Dark Mode Measurements:', JSON.stringify(measurements, null, 2));
    }

    await page.close();
  }

  await browser.close();

  fs.writeFileSync(path.join(outDir, 'pixel_verification_measurements.json'), JSON.stringify(results, null, 2));
  console.log('Verification audit successfully written to pixel_verification_measurements.json');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
