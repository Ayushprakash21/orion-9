const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://localhost:3000/admin/login ...');
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle2' });

  // Check if power-on screen is shown
  try {
    const powerBtn = await page.waitForSelector('button[aria-label="Power on ORION"]', { timeout: 3000 });
    if (powerBtn) {
      console.log('Detected Power On screen, clicking Power on ORION...');
      await powerBtn.click();
    }
  } catch (e) {
    console.log('No Power on ORION button found or already booted.');
  }

  // Wait until admin identity input and twin path appears
  console.log('Waiting for admin login input and twin canvas...');
  await page.waitForSelector('#path-supply', { timeout: 30000 });
  await page.waitForSelector('input[name="username"]', { timeout: 30000 });
  console.log('Admin login is fully loaded!');

  // Small delay for animations/layout to settle
  await new Promise(r => setTimeout(r, 2000));

  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  const p1440 = path.resolve('C:/Users/LENOVO/.gemini/antigravity/brain/2294112a-5564-4333-a185-061673183aaa/admin_login_connected_1440.png');
  await page.screenshot({ path: p1440 });
  console.log('Saved admin_login_connected_1440.png');

  const pCurrent = path.resolve('C:/Users/LENOVO/.gemini/antigravity/brain/2294112a-5564-4333-a185-061673183aaa/admin_login_current.png');
  await page.screenshot({ path: pCurrent });
  console.log('Saved admin_login_current.png');

  const canvasInfo = await page.evaluate(() => {
    const canvases = Array.from(document.querySelectorAll('canvas'));
    return canvases.map(c => {
      const p = c.parentElement;
      const gp = p ? p.parentElement : null;
      return {
        canvas: {
          w: c.width,
          h: c.height,
          cw: c.clientWidth,
          ch: c.clientHeight,
          style: c.getAttribute('style'),
          rect: c.getBoundingClientRect(),
          computedWidth: window.getComputedStyle(c).width,
          computedFlex: window.getComputedStyle(c).flex,
        },
        parent: p ? {
          tag: p.tagName,
          className: p.className,
          style: p.getAttribute('style'),
          rect: p.getBoundingClientRect(),
          computedWidth: window.getComputedStyle(p).width,
          computedDisplay: window.getComputedStyle(p).display,
        } : null,
        grandParent: gp ? {
          tag: gp.tagName,
          className: gp.className,
          rect: gp.getBoundingClientRect(),
          computedWidth: window.getComputedStyle(gp).width,
        } : null
      };
    });
  });
  console.log('CANVAS DETAILED INFO:', JSON.stringify(canvasInfo, null, 2));

  const orbRect = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span'));
    const orionSpan = spans.find(s => s.textContent && s.textContent.includes('ORION - 9'));
    if (orionSpan) {
      const parentPill = orionSpan.parentElement;
      const grandParent = parentPill ? parentPill.parentElement : null;
      if (grandParent) {
        const r = grandParent.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }
    }
    return null;
  });
  console.log('ORB RECT:', orbRect);
  if (orbRect) {
    const pOrb = path.resolve('C:/Users/LENOVO/.gemini/antigravity/brain/2294112a-5564-4333-a185-061673183aaa/orb_closeup.png');
    await page.screenshot({
      path: pOrb,
      clip: {
        x: Math.max(0, Math.floor(orbRect.x - 20)),
        y: Math.max(0, Math.floor(orbRect.y - 20)),
        width: Math.floor(orbRect.width + 40),
        height: Math.floor(orbRect.height + 40)
      }
    });
    console.log('Saved orb_closeup.png');
  }

  // Also take 1920x1080
  await page.setViewport({ width: 1920, height: 1080 });
  await new Promise(r => setTimeout(r, 1000));
  const p1920 = path.resolve('C:/Users/LENOVO/.gemini/antigravity/brain/2294112a-5564-4333-a185-061673183aaa/admin_login_connected_1920.png');
  await page.screenshot({ path: p1920 });
  console.log('Saved admin_login_connected_1920.png');

  await browser.close();
  console.log('All screenshots captured successfully.');
})();
