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
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error' && !text.includes('Failed to load resource')) {
        errors.push(text);
      }
    });
    page.on('pageerror', err => {
      errors.push(`PAGEERROR: ${err.message}`);
    });

    console.log('1. Navigating to http://127.0.0.1:3000 ...');
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));

    // Check if on Power On Screen
    const powerBtn = await page.$('button[aria-label="Power on ORION"]');
    if (powerBtn) {
      console.log('2. Found Power button. Powering on ORION-9 system...');
      await powerBtn.click();
      console.log('2b. Waiting 11s for boot sequence animation to complete...');
      await new Promise(r => setTimeout(r, 11000));
    } else {
      // Press spacebar as fallback power on trigger
      console.log('2. Sending Space key to power on...');
      await page.keyboard.press('Space');
      await new Promise(r => setTimeout(r, 11000));
    }

    console.log('3. URL after boot sequence:', page.url());

    // Check if on login
    const passwordInput = await page.$('input[type="password"]');
    if (page.url().includes('/login') || passwordInput) {
      console.log('4. Logging in as user/user...');
      const inputs = await page.$$('input');
      if (inputs.length >= 2) {
        await inputs[0].type('user');
        await inputs[1].type('user');
        const submitBtn = await page.$('button[type="submit"]');
        if (submitBtn) await submitBtn.click();
        console.log('4b. Submitted user credentials, waiting 7s for desktop launch...');
        await new Promise(r => setTimeout(r, 7000));
      }
    }

    console.log('4. Current Desktop URL:', page.url());

    // Dispatch custom event to open approval-center application
    console.log('5. Opening Approval Center application...');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('orion:open-app', { detail: { appId: 'approval-center' } }));
    });

    await new Promise(r => setTimeout(r, 3000));

    // Inspect if Approval Center window is rendered
    const inspection = await page.evaluate(() => {
      const win = document.querySelector('[data-window-id="approval-center"]');
      const bodyText = document.body.innerText;
      const hasApprovalTitle = bodyText.includes('UNIFIED APPROVAL CENTER') || bodyText.includes('Approval Center');
      const hasKpi = bodyText.includes('Pending Reviews') || bodyText.includes('Capital Under Gate');
      return {
        hasWindow: !!win,
        hasApprovalTitle,
        hasKpi,
        snippet: bodyText.slice(0, 400).replace(/\n+/g, ' ')
      };
    });

    console.log('6. Approval Center Inspection Result:', inspection);

    // Take screenshot for artifact review
    const screenshotPath = 'C:/Users/LENOVO/.gemini/antigravity/brain/2294112a-5564-4333-a185-061673183aaa/approval_center_verified.png';
    await page.screenshot({ path: screenshotPath });
    console.log('7. Screenshot saved to:', screenshotPath);

    if (errors.length > 0) {
      console.log('Console Errors:', errors);
    } else {
      console.log('8. SUCCESS: Zero console/page errors detected during Approval Center test!');
    }

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    if (browser) await browser.close();
  }
})();
