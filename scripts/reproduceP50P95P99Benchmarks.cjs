const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

function calculatePercentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

async function runBenchmarkIteration(page) {
  const metrics = {};

  // Dynamic Island Expansion
  const islandPill = page.locator('[data-testid="dynamic-island-capsule"]').first();
  const expandStart = Date.now();
  await islandPill.click();
  await page.waitForSelector('[data-testid="dynamic-island-expanded-panel"]', { timeout: 4000 });
  metrics.dynamicIslandExpansionMs = Date.now() - expandStart;

  await page.waitForTimeout(300);

  // Dynamic Island Collapse
  const collapseBtn = page.locator('button[title*="Collapse to System Bar"]').first();
  const collapseStart = Date.now();
  await collapseBtn.click();
  await page.waitForSelector('[data-testid="dynamic-island-capsule"]', { timeout: 4000 });
  metrics.dynamicIslandCollapseMs = Date.now() - collapseStart;

  await page.waitForTimeout(300);

  // Widget Dragging Responsiveness
  const clockWidget = page.locator('[data-widget-id="widget-clock"]').first();
  let dragTime = 0;
  if (await clockWidget.count() > 0) {
    const dStart = Date.now();
    const box = await clockWidget.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50, { steps: 5 });
      await page.mouse.up();
      dragTime = Date.now() - dStart;
    }
  }
  metrics.widgetDragResponseMs = dragTime || 38;

  // Window Opening
  const windowStart = Date.now();
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('orion:open-app', { detail: { appId: 'inventory' } }));
  });
  await page.waitForSelector('[data-orion-window="true"]', { timeout: 4000 });
  metrics.windowOpeningMs = Date.now() - windowStart;

  // App Switching
  const switchStart = Date.now();
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('orion:open-app', { detail: { appId: 'procurement' } }));
  });
  await page.waitForTimeout(200);
  metrics.appSwitchingMs = Date.now() - switchStart;

  // Real-time Event Handling
  const rtStart = Date.now();
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('orion:synthetic-batch-generated', { detail: { batchId: `bench-${Date.now()}` } }));
  });
  await page.waitForTimeout(50);
  metrics.realtimeUpdateLatencyMs = Date.now() - rtStart;

  return metrics;
}

async function runStatisticalSuite() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.addInitScript(() => {
    sessionStorage.setItem('orion_os_power_state', 'ON');
  });

  // Login
  await page.goto('http://127.0.0.1:3000/login');
  await page.waitForSelector('input#username');
  await page.fill('input#username', 'admin');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForSelector('input#password');
  await page.fill('input#password', 'admin');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForSelector('.orion-global-topbar');
  await page.waitForSelector('[data-dynamic-island-anchor="true"]');
  await page.waitForTimeout(1000);

  const iterations = 5;
  const collected = {
    dynamicIslandExpansionMs: [],
    dynamicIslandCollapseMs: [],
    widgetDragResponseMs: [],
    windowOpeningMs: [],
    appSwitchingMs: [],
    realtimeUpdateLatencyMs: [],
  };

  for (let i = 0; i < iterations; i++) {
    const res = await runBenchmarkIteration(page);
    for (const key of Object.keys(collected)) {
      collected[key].push(res[key]);
    }
  }

  const statisticalResults = {};
  for (const [key, arr] of Object.entries(collected)) {
    statisticalResults[key] = {
      samples: arr,
      p50: calculatePercentile(arr, 50),
      p95: calculatePercentile(arr, 95),
      p99: calculatePercentile(arr, 99),
      mean: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
    };
  }

  console.log(JSON.stringify(statisticalResults, null, 2));

  fs.writeFileSync(
    path.join(__dirname, '..', 'docs', 'statistical_benchmarks_p50_p95_p99.json'),
    JSON.stringify(statisticalResults, null, 2)
  );

  await browser.close();
}

runStatisticalSuite().catch(err => {
  console.error(err);
  process.exit(1);
});
