import { chromium } from 'playwright';

async function testTabletRotation() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.addInitScript(() => {
    sessionStorage.setItem('orion_os_power_state', 'ON');
  });

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('http://localhost:3000/login');
  await page.fill('input#username', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForSelector('input#password');
  await page.fill('input#password', 'admin');
  await page.click('button[type="submit"]');

  await page.waitForSelector('[data-orion-tablet-shell="true"]', { timeout: 15000 });
  console.log('Portrait tablet shell visible!');

  const portNav = page.locator('[data-orion-tablet-nav="bottom"]');
  await portNav.getByText('Control').dispatchEvent('click');
  console.log('Clicked Control');

  console.log('Rotating to 1024x768...');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(1000);

  const tabletShellExists = await page.locator('[data-orion-tablet-shell="true"]').isVisible();
  console.log('Tablet shell visible in landscape?', tabletShellExists);

  const landRailExists = await page.locator('[data-orion-tablet-nav="rail"]').isVisible();
  console.log('Land rail visible?', landRailExists);

  const state = await page.evaluate(() => {
    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      screenW: screen.width,
      screenH: screen.height,
      hasMobileShell: !!document.querySelector('[data-orion-mobile-shell]'),
      hasDesktop: !!document.querySelector('[data-orion-desktop]'),
      hasTablet: !!document.querySelector('[data-orion-tablet-shell]'),
      rootHtml: document.getElementById('root')?.innerHTML?.slice(0, 300)
    };
  });
  console.log('State:', state);

  console.log('Finished debug');
  await browser.close();
  process.exit(0);
}

testTabletRotation().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});

