import { test, expect } from '@playwright/test';

test('Global Operations globe renders correctly', async ({ page }) => {
  const consoleMessages: string[] = [];
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push(`[${type}] ${text}`);
  });

  await page.goto('http://localhost:5173');
  // Wait for the main map container to be visible
  const mapContainer = page.locator('[data-testid="maplibre-engine-container"]');
  await expect(mapContainer).toBeVisible({ timeout: 20000 });

  // Wait for the canvas element created by MapLibre
  const canvas = mapContainer.locator('canvas.maplibregl-canvas');
  await expect(canvas).toBeVisible({ timeout: 10000 });

  const box = await canvas.boundingBox();
  console.log('Canvas bounding box:', box);

  // Capture screenshot for manual verification
  await page.screenshot({ path: 'globe_screenshot.png', fullPage: true });

  // Log console output to test result for debugging
  console.log('Console messages captured:', consoleMessages.join('\n'));

  // Basic sanity: canvas dimensions should be >0
  expect(box?.width).toBeGreaterThan(0);
  expect(box?.height).toBeGreaterThan(0);
});
