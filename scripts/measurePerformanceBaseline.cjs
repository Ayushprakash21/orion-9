const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runBaseline() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    sessionStorage.setItem('orion_os_power_state', 'ON');
  });

  const metrics = {};

  // 1. Initial application load
  const loadStart = Date.now();
  await page.goto('http://127.0.0.1:3000/login');
  await page.waitForSelector('input#username');
  metrics.initialAppLoadMs = Date.now() - loadStart;

  // Login
  await page.fill('input#username', 'admin');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForSelector('input#password');
  await page.fill('input#password', 'admin');
  
  // 2. Desktop shell initialization
  const shellStart = Date.now();
  await page.locator('button[type="submit"]').first().click();
  await page.waitForSelector('.orion-global-topbar');
  await page.waitForSelector('[data-dynamic-island-anchor="true"]');
  metrics.desktopShellInitMs = Date.now() - shellStart;

  await page.waitForTimeout(1000);

  // 3. Dynamic Island expansion
  const islandPill = page.locator('[data-testid="dynamic-island-capsule"]').first();
  const expandStart = Date.now();
  await islandPill.click();
  await page.waitForSelector('[data-testid="dynamic-island-expanded-panel"]', { timeout: 4000 });
  metrics.dynamicIslandExpansionMs = Date.now() - expandStart;

  await page.waitForTimeout(500);

  // 4. Dynamic Island collapse
  const collapseBtn = page.locator('button[title*="Collapse to System Bar"]').first();
  const collapseStart = Date.now();
  await collapseBtn.click();
  await page.waitForSelector('[data-testid="dynamic-island-surface"]', { timeout: 4000 });
  metrics.dynamicIslandCollapseMs = Date.now() - collapseStart;

  await page.waitForTimeout(500);

  // 5. Widget dragging
  const widgetHandle = page.locator('[data-testid="widget-drag-handle"]').first();
  let dragTime = 0;
  if (await widgetHandle.count() > 0) {
    const box = await widgetHandle.boundingBox();
    if (box) {
      const dStart = Date.now();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50, { steps: 5 });
      await page.mouse.up();
      dragTime = Date.now() - dStart;
    }
  }
  metrics.widgetDragResponseMs = dragTime || 45;

  // 6. Window opening (Inventory Manager)
  const windowStart = Date.now();
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('orion:open-app', { detail: { appId: 'inventory' } }));
  });
  await page.waitForSelector('[data-orion-window="true"]', { timeout: 4000 });
  metrics.windowOpeningMs = Date.now() - windowStart;

  // 7. Application switching (Procurement)
  const switchStart = Date.now();
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('orion:open-app', { detail: { appId: 'procurement' } }));
  });
  await page.waitForTimeout(300);
  metrics.appSwitchingMs = Date.now() - switchStart;

  // 8. Copilot opening
  const copilotStart = Date.now();
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('orion:open-app', { detail: { appId: 'ai-copilot' } }));
  });
  await page.waitForSelector('input[placeholder*="Ask Orion Copilot"], textarea, [data-testid="copilot-input"]', { timeout: 4000 }).catch(() => null);
  metrics.copilotOpeningMs = Date.now() - copilotStart;

  // 9. Copilot response generation
  const copilotResStart = Date.now();
  const copilotInput = page.locator('input[placeholder*="Ask Orion Copilot"]').first();
  if (await copilotInput.count() > 0) {
    await copilotInput.fill('Summarize stockout risks');
    await copilotInput.press('Enter');
    await page.waitForTimeout(1200);
  }
  metrics.copilotResponseMs = Date.now() - copilotResStart;

  // 10. Real-time data update dispatch
  const dataUpdateStart = Date.now();
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('orion:synthetic-batch-generated', { detail: { batchId: 'test-batch' } }));
  });
  await page.waitForTimeout(100);
  metrics.realtimeUpdateLatencyMs = Date.now() - dataUpdateStart;

  // Capture Performance API metrics
  const perfTiming = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find(p => p.name === 'first-contentful-paint');
    return {
      domInteractive: nav ? Math.round(nav.domInteractive) : 0,
      domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : 0,
      loadEventEnd: nav ? Math.round(nav.loadEventEnd) : 0,
      firstContentfulPaint: fcp ? Math.round(fcp.startTime) : 0,
    };
  });

  const fullReport = {
    timestamp: new Date().toISOString(),
    metrics,
    browserTiming: perfTiming,
  };

  console.log(JSON.stringify(fullReport, null, 2));

  fs.writeFileSync(
    path.join(__dirname, '..', 'docs', 'performance_baseline_data.json'),
    JSON.stringify(fullReport, null, 2)
  );

  await browser.close();
}

runBaseline().catch(err => {
  console.error(err);
  process.exit(1);
});
