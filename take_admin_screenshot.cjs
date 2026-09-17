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
  const powerBtn = await page.$('button[aria-label="Power On System"], button[title*="Power"], .orion-power-btn, button');
  console.log('Page loaded. Checking for power button or login elements...');

  // Try to click power button if present
  try {
    const powerButton = await page.waitForSelector('button', { timeout: 3000 });
    const text = await page.evaluate(el => el.innerText || el.getAttribute('aria-label') || '', powerButton);
    console.log('Found button:', text);
    await powerButton.click();
    console.log('Clicked button. Waiting for boot sequence or login screen...');
  } catch (e) {
    console.log('No initial button to click, waiting for selector...');
  }

  // Wait until admin identity input or login card appears
  console.log('Waiting for admin login input...');
  try {
    await page.waitForSelector('input[name="username"], input[id="admin-identity"]', { timeout: 15000 });
    console.log('Admin login input is now visible!');
  } catch (e) {
    console.warn('Timeout waiting for username input, taking current screenshot anyway:', e.message);
  }

  // Small delay for animations/layout to settle
  await new Promise(r => setTimeout(r, 2000));

  const screenshotPath = path.resolve('C:/Users/LENOVO/.gemini/antigravity/brain/2294112a-5564-4333-a185-061673183aaa/admin_login_current.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('Screenshot saved to:', screenshotPath);

  await browser.close();
  console.log('Done.');
})();
