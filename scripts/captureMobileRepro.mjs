import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    sessionStorage.setItem('orion_os_power_state', 'ON');
  });
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.fill('input#username', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForSelector('input#password');
  await page.fill('input#password', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForSelector('[data-orion-mobile-shell="true"]', { timeout: 15000 });
  await page.screenshot({ path: 'evidence/reproduce_mobile_home_390x844.png' });
  
  const aiTab = page.locator('nav[aria-label="Mobile Navigation"]').getByText('AI');
  await aiTab.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'evidence/reproduce_mobile_copilot_390x844.png' });

  // Get geometries of key elements
  const metrics = await page.evaluate(() => {
    const header = document.querySelector('header')?.getBoundingClientRect();
    const surface = document.querySelector('[data-orion-ai-surface="true"]')?.getBoundingClientRect();
    const telemetry = document.querySelector('[data-orion-ai-surface="true"] > div:nth-child(2)')?.getBoundingClientRect();
    const msgList = document.querySelector('[data-orion-ai-surface="true"] > div:nth-child(3)')?.getBoundingClientRect();
    const chips = document.querySelector('[data-orion-ai-surface="true"] > div:nth-child(4)')?.getBoundingClientRect();
    const form = document.querySelector('[data-orion-ai-surface="true"] form')?.getBoundingClientRect();
    const nav = document.querySelector('nav[aria-label="Mobile Navigation"]')?.getBoundingClientRect();
    return {
      windowHeight: window.innerHeight,
      header,
      surface,
      telemetry,
      msgList,
      chips,
      form,
      nav
    };
  });
  console.log('DOM METRICS:', JSON.stringify(metrics, null, 2));

  await browser.close();
}

main().catch(console.error);
