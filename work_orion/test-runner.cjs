const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const errors = [];
    const consoleLogs = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error' && !text.includes('Failed to load resource')) {
        errors.push(text);
      }
    });

    page.on('pageerror', err => {
      errors.push(`PAGEERROR: ${err.name}: ${err.message}\n${err.stack}`);
    });

    console.log('Navigating to http://127.0.0.1:3000 ...');
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0', timeout: 15000 });

    console.log('Current URL:', page.url());

    // Wait a bit for initialization or login screen
    await new Promise(r => setTimeout(r, 2000));
    console.log('After 2s URL:', page.url());

    // If on /login, let's login as admin
    if (page.url().includes('/login')) {
      console.log('Logging in as admin/admin...');
      await page.waitForSelector('input[type="text"], input[name="username"], input[id="username"]', { timeout: 5000 });
      const inputs = await page.$$('input');
      if (inputs.length >= 2) {
        await inputs[0].type('admin');
        await inputs[1].type('admin');
        const submitBtn = await page.$('button[type="submit"]');
        if (submitBtn) {
          await submitBtn.click();
          console.log('Submitted login credentials');
        }
      }
    }

    // Wait for post-login or desktop transition
    console.log('Waiting 6.5s for post-login transition...');
    await new Promise(r => setTimeout(r, 6500));
    console.log('Desktop URL:', page.url());

    // Check if error boundary is visible or desktop is rendered
    const bodyHtml = await page.evaluate(() => document.body.innerText);
    console.log('Page body snippet:', bodyHtml.slice(0, 300));

    const appsToTest = ['shipments', 'inventory', 'procurement', 'suppliers', 'exceptions', 'command-center', 'orion-ai', 'decisions'];
    const appResults = {};

    for (const appId of appsToTest) {
      console.log(`\n--- Testing App: ${appId} ---`);
      await page.evaluate((id) => {
        if (typeof window.__orion_open_app === 'function') {
          window.__orion_open_app(id);
        } else {
          const dockBtn = document.querySelector(`button[data-dock-item="${id}"]`);
          if (dockBtn) {
            dockBtn.click();
          } else {
            window.dispatchEvent(new CustomEvent('orion:open-app', { detail: { appId: id } }));
          }
        }
      }, appId);

      await new Promise(r => setTimeout(r, 2000));

      const appInspection = await page.evaluate((id) => {
        const win = document.querySelector(`[data-window-id="${id}"]`);
        const errorBoundary = win ? win.querySelector('.bg-red-950\\/40, .text-red-300, [class*="text-red"]') : null;
        return {
          hasWindow: !!win,
          windowText: win ? win.innerText.slice(0, 300).replace(/\n+/g, ' ') : null,
          hasError: !!errorBoundary && (win?.innerText.includes('Application failed to load') || false),
          errorDetail: errorBoundary ? errorBoundary.textContent : '',
        };
      }, appId);

      appResults[appId] = appInspection;
      console.log(`Result for ${appId}:`, appInspection);
    }

    console.log('\n================ ALL APP RESULTS ================');
    console.log(JSON.stringify(appResults, null, 2));

    if (errors.length > 0) {
      console.log('--- Captured Console / Page Errors ---');
      errors.forEach(e => console.log(e));
    } else {
      console.log('--- Zero Console/Page Errors Detected! ---');
    }

  } catch (err) {
    console.error('Test runner failed:', err);
  } finally {
    if (browser) await browser.close();
  }
})();
