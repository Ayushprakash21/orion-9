const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('Launching browser for user login screenshot...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://localhost:3000/login ...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

  // If power button is present, click it
  try {
    const powerButton = await page.waitForSelector('button', { timeout: 2000 });
    const text = await page.evaluate(el => el.innerText || el.getAttribute('aria-label') || '', powerButton);
    if (text.toLowerCase().includes('power')) {
      console.log('Clicking power on...');
      await powerButton.click();
    }
  } catch (e) {}

  // Wait until user login form appears
  console.log('Waiting for username input on /login...');
  try {
    await page.waitForSelector('input[name="username"], input[id="username"]', { timeout: 15000 });
    console.log('User login input visible.');
  } catch (e) {
    console.warn('Timeout waiting for username input:', e.message);
  }

  // Small delay for canvas / styles to render
  await new Promise(r => setTimeout(r, 2000));

  const screenshotPath = path.resolve('C:/Users/LENOVO/.gemini/antigravity/brain/2294112a-5564-4333-a185-061673183aaa/user_login_current.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('Screenshot saved to:', screenshotPath);

  await browser.close();
  console.log('Done.');
})();
