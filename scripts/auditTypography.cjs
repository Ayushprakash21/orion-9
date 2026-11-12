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
  await page.waitForTimeout(1500);

  const fontInfo = await page.evaluate(() => {
    const loadedFonts = Array.from(document.fonts).map(f => ({
      family: f.family,
      status: f.status,
      weight: f.weight,
      style: f.style
    }));

    const sampleElements = [
      { name: 'body', el: document.body },
      { name: 'header', el: document.querySelector('header') },
      { name: 'dock', el: document.querySelector('[data-orion-dock="true"], nav') },
      { name: 'hero-title', el: document.querySelector('h1, [data-testid="hero-title"]') },
      { name: 'button', el: document.querySelector('button') },
      { name: 'root', el: document.documentElement }
    ];

    const computed = sampleElements.map(s => {
      if (!s.el) return { name: s.name, found: false };
      const cs = window.getComputedStyle(s.el);
      return {
        name: s.name,
        found: true,
        fontFamily: cs.fontFamily,
        fontWeight: cs.fontWeight,
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing
      };
    });

    const rootVars = {
      '--orion-font-family': getComputedStyle(document.documentElement).getPropertyValue('--orion-font-family'),
      '--orion-font-family-ui': getComputedStyle(document.documentElement).getPropertyValue('--orion-font-family-ui'),
      '--orion-font-family-display': getComputedStyle(document.documentElement).getPropertyValue('--orion-font-family-display'),
      '--orion-font-family-mono': getComputedStyle(document.documentElement).getPropertyValue('--orion-font-family-mono'),
      'dataset.orionFont': document.documentElement.dataset.orionFont
    };

    return { loadedFonts, computed, rootVars };
  });

  console.log('BROWSER AUDIT:\n', JSON.stringify(fontInfo, null, 2));
  await browser.close();
})().catch(console.error);
