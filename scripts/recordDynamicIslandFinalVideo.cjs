const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outDir = 'C:/Users/Ayush/.gemini/antigravity/brain/5f06512e-da58-4a5d-be62-e2ac72ec78f8';
const videoDir = path.join(outDir, 'recordings');
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

async function login(page) {
  console.log('[RECORD] Navigating to http://127.0.0.1:3000/login');
  await page.goto('http://127.0.0.1:3000/login');
  await page.waitForSelector('input#username');
  await page.fill('input#username', 'admin');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForSelector('input#password');
  await page.fill('input#password', 'admin');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForSelector('[data-dynamic-island-anchor]');
  await page.waitForTimeout(1500);
  console.log('[RECORD] Logged in successfully, desktop mounted.');
}

async function run() {
  console.log('\n======================================================');
  console.log('ORION-9 OS 21.1 — DYNAMIC ISLAND VIDEO VERIFICATION');
  console.log('======================================================\n');

  const browser = await chromium.launch({
    headless: true,
    channel: 'msedge'
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  // Initialize in Light Mode
  await page.addInitScript(() => {
    sessionStorage.setItem('orion_os_power_state', 'ON');
    localStorage.setItem('orion-appearance-preferences', JSON.stringify({
      themeId: 'silver',
      appearanceMode: 'light',
      appearancePreferencesVersion: 1
    }));
  });

  await login(page);

  console.log('[TIMELINE] 0.0s — Initial Collapsed State');
  await page.screenshot({ path: path.join(outDir, 'dynamic_island_0_0s_collapsed.png') });
  await page.waitForTimeout(400);

  console.log('[TIMELINE] 0.4s — Steady Collapsed Capsule');
  await page.screenshot({ path: path.join(outDir, 'dynamic_island_0_4s_collapsed.png') });
  await page.waitForTimeout(400);

  console.log('[TIMELINE] 0.8s — Click Initiate Expansion');
  await page.screenshot({ path: path.join(outDir, 'dynamic_island_0_8s_click_expand.png') });
  const capsule = page.locator('[data-testid="dynamic-island-capsule"]');
  await capsule.click({ force: true });

  await page.waitForTimeout(400); // 1.2s
  console.log('[TIMELINE] 1.2s — Mid-Expansion Fluid Transition');
  await page.screenshot({ path: path.join(outDir, 'dynamic_island_1_2s_mid_expansion.png') });

  await page.waitForTimeout(600); // 1.8s
  console.log('[TIMELINE] 1.8s — Fully Expanded Unified Surface');
  await page.screenshot({ path: path.join(outDir, 'dynamic_island_1_8s_fully_expanded.png') });

  await page.waitForTimeout(1200); // 3.0s
  console.log('[TIMELINE] 3.0s — Interactive Expanded Inspection');
  await page.screenshot({ path: path.join(outDir, 'dynamic_island_3_0s_interactive_expanded.png') });

  await page.waitForTimeout(1000); // 4.0s
  console.log('[TIMELINE] 4.0s — User Clicks Collapse Button');
  await page.screenshot({ path: path.join(outDir, 'dynamic_island_4_0s_click_collapse.png') });
  const collapseBtn = page.locator('button[aria-label="Collapse Dynamic Island"]');
  if (await collapseBtn.count() > 0) {
    await collapseBtn.click({ force: true });
  }

  await page.waitForTimeout(500); // 4.5s
  console.log('[TIMELINE] 4.5s — Mid-Collapse Fluid Contraction');
  await page.screenshot({ path: path.join(outDir, 'dynamic_island_4_5s_mid_collapse.png') });

  await page.waitForTimeout(500); // 5.0s
  console.log('[TIMELINE] 5.0s — Fully Collapsed Capsule Steady');
  await page.screenshot({ path: path.join(outDir, 'dynamic_island_5_0s_fully_collapsed.png') });

  await page.waitForTimeout(500); // 5.5s
  console.log('[TIMELINE] 5.5s — Reopening Dynamic Island');
  await capsule.click({ force: true });
  await page.waitForTimeout(700); // 6.2s

  console.log('[TIMELINE] 6.2s — Switching Theme (Light -> Dark) While Expanded');
  await page.evaluate(() => {
    localStorage.setItem('orion-appearance-preferences', JSON.stringify({
      themeId: 'graphite',
      appearanceMode: 'dark',
      appearancePreferencesVersion: 1
    }));
    window.dispatchEvent(new CustomEvent('orion-appearance-preferences-changed'));
  });

  await page.waitForTimeout(800); // 7.0s
  console.log('[TIMELINE] 7.0s — Expanded Island Remains Open & Themed In Dark Mode');
  await page.screenshot({ path: path.join(outDir, 'dynamic_island_7_0s_theme_switch_expanded.png') });

  // Measure junction geometry in expanded state
  const measurements = await page.evaluate(() => {
    const topbar = document.querySelector('.orion-global-topbar');
    const island = document.querySelector('#dynamic-island-expanded-surface') || document.querySelector('[data-testid="dynamic-island-expanded-panel"]');
    const topbarRect = topbar ? topbar.getBoundingClientRect() : null;
    const islandRect = island ? island.getBoundingClientRect() : null;
    const islandStyle = island ? window.getComputedStyle(island) : null;
    const topbarStyle = topbar ? window.getComputedStyle(topbar) : null;

    return {
      topbar: {
        bottom: topbarRect?.bottom,
        height: topbarRect?.height,
        backgroundColor: topbarStyle?.backgroundColor,
        backdropFilter: topbarStyle?.backdropFilter,
      },
      island: {
        top: islandRect?.top,
        height: islandRect?.height,
        width: islandRect?.width,
        borderTopWidth: islandStyle?.borderTopWidth,
        borderTopLeftRadius: islandStyle?.borderTopLeftRadius,
        borderTopRightRadius: islandStyle?.borderTopRightRadius,
        borderBottomLeftRadius: islandStyle?.borderBottomLeftRadius,
        borderBottomRightRadius: islandStyle?.borderBottomRightRadius,
        backgroundColor: islandStyle?.backgroundColor,
        backdropFilter: islandStyle?.backdropFilter,
      },
      verticalGap: islandRect && topbarRect ? islandRect.top - topbarRect.bottom : null,
    };
  });

  console.log('[MEASUREMENTS]', JSON.stringify(measurements, null, 2));

  await page.waitForTimeout(1200); // Total > 8.2s

  const video = page.video();
  const videoPath = await video.path();
  console.log('[VIDEO RECORDED] Raw video path:', videoPath);

  await page.close();
  await context.close();
  await browser.close();

  const finalVideoDest = path.join(outDir, 'orion_dynamic_island_final_transition.webm');
  if (fs.existsSync(videoPath)) {
    fs.copyFileSync(videoPath, finalVideoDest);
    console.log('[SUCCESS] Copied final video to:', finalVideoDest);
  }

  fs.writeFileSync(
    path.join(outDir, 'dynamic_island_final_measurements.json'),
    JSON.stringify(measurements, null, 2)
  );

  console.log('[COMPLETE] All timeline frames, video, and measurements saved.');
}

run().catch((err) => {
  console.error('[ERROR]', err);
  process.exit(1);
});
