const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle2' });

  // Wait for power button if on power screen
  try {
    const powerButton = await page.waitForSelector('button', { timeout: 2000 });
    await powerButton.click();
    console.log('Clicked power on...');
  } catch (e) {}

  // Wait for admin identity input
  await page.waitForSelector('input[name="username"], input[id="admin-identity"]', { timeout: 15000 });
  console.log('On admin login page.');

  // Type credentials
  await page.type('input[name="username"], input[id="admin-identity"]', 'admin');
  await page.type('input[name="password"], input[id="admin-password"]', 'admin');

  console.log('Clicking ENTER CONTROL PLANE...');
  const submitBtn = await page.waitForSelector('button[type="submit"]');
  await submitBtn.click();

  const outDir = 'C:/Users/LENOVO/.gemini/antigravity/brain/2294112a-5564-4333-a185-061673183aaa';

  // Capture frames during the transition
  const delays = [300, 1000, 2500, 4500, 6000, 7500];
  for (let i = 0; i < delays.length; i++) {
    const waitTime = i === 0 ? delays[0] : delays[i] - delays[i-1];
    await new Promise(r => setTimeout(r, waitTime));
    const p = path.join(outDir, `admin_anim_frame_${i+1}_${delays[i]}ms.png`);
    await page.screenshot({ path: p });
    console.log(`Captured frame ${i+1} at ${delays[i]}ms: ${p}`);
  }

  await browser.close();
  console.log('Done capturing animation frames.');
})();
