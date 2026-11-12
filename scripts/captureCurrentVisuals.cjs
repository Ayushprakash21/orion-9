const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.addInitScript(() => sessionStorage.setItem('orion_os_power_state', 'ON'));
  await page.goto('http://127.0.0.1:3000/login');
  await page.waitForSelector('input#username');
  await page.fill('input#username', 'admin');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForSelector('input#password');
  await page.fill('input#password', 'admin');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForSelector('[data-dynamic-island-anchor]');
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'C:/Users/Ayush/.gemini/antigravity/brain/5f06512e-da58-4a5d-be62-e2ac72ec78f8/current_desktop_collapsed.png' });
  
  // Click Dynamic Island to expand
  const island = page.locator('[data-testid="dynamic-island-capsule"]');
  if (await island.count() > 0) {
    await island.click({ force: true });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'C:/Users/Ayush/.gemini/antigravity/brain/5f06512e-da58-4a5d-be62-e2ac72ec78f8/current_desktop_expanded.png' });
  }

  // Also open Copilot to check transparency and window behavior
  const copilotBtn = page.locator('button:has-text("Open Copilot"), button:has-text("Copilot"), [data-app-id="copilot"]').first();
  if (await copilotBtn.count() > 0) {
    await copilotBtn.click({ force: true });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'C:/Users/Ayush/.gemini/antigravity/brain/5f06512e-da58-4a5d-be62-e2ac72ec78f8/current_copilot_window.png' });
  }
  
  await browser.close();
  console.log('Screenshots captured successfully');
})().catch(console.error);
