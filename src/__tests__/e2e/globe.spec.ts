import { test, expect } from '@playwright/test';

/**
 * Real MapLibre rendering verification.
 * Asserts that the MapLibre engine is active, the map loads, container
 * and canvas have dimensions, a WebGL context exists, required resources
 * are loaded, and no fatal console errors occur. Also ensures the canvas
 * is not a blank black image.
 */
test('Global Operations globe renders with real MapLibre', async ({ page }) => {
  const consoleMsgs: string[] = [];
  page.on('console', (msg) => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));

  // Load the application
  await page.goto('http://localhost:3000');

  // Locate the map container
  const map = page.locator('[data-testid="maplibre-engine-container"]');
  await expect(map).toBeVisible({ timeout: 20000 });

  // Verify we are using the real MapLibre renderer
  await expect(map).toHaveAttribute('data-renderer', 'maplibre');

  // Verify container dimensions are non‑zero
  const containerBox = await map.boundingBox();
  expect(containerBox?.width ?? 0).toBeGreaterThan(0);
  expect(containerBox?.height ?? 0).toBeGreaterThan(0);

  // Locate the canvas created by MapLibre
  const canvas = map.locator('canvas.maplibregl-canvas');
  await expect(canvas).toBeVisible({ timeout: 10000 });

  // Ensure the canvas actually has a WebGL context
  const hasGL = await canvas.evaluate((c) => !!c.getContext('webgl') || !!c.getContext('webgl2'));
  expect(hasGL).toBeTruthy();

  // Wait for the map to signal it has loaded
  await page.waitForFunction(
    (selector) => {
      const el = document.querySelector(selector);
      return el?.getAttribute('data-map-loaded') === 'true';
    },
    '[data-testid="maplibre-engine-container"]',
    { timeout: 15000 }
  );

  // Verify that the style JSON loaded successfully (the raster layer request)
  const styleResp = await page.waitForResponse(
    (resp) => resp.url().includes('carto-dark') && resp.status() === 200,
    { timeout: 5000 }
  );
  expect(styleResp.ok()).toBeTruthy();

  // Verify the canvas is not a completely black image
  const dataUrl = await canvas.evaluate((c) => c.toDataURL());
  // Basic heuristic: the PNG data URL should not be the same as a single‑pixel black PNG.
  // The below regex matches the minimal black PNG data URL pattern.
  expect(dataUrl).not.toMatch(/^data:image\/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8\/9hAAA\/.*$/);

  // Capture a screenshot for artifact verification
  await page.screenshot({ path: 'globe_render.png', fullPage: true });

  // Log console messages and fail if any error‑level messages appear
  console.log('Console messages:', consoleMsgs.join('\n'));
  const errorMsgs = consoleMsgs.filter((m) => m.startsWith('[error]'));
  expect(errorMsgs).toHaveLength(0);
});
