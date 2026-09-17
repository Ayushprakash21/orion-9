const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle2' });
  try { (await page.waitForSelector('button', { timeout: 2000 })).click(); } catch(e){}
  await page.waitForSelector('#path-supply', { timeout: 15000 });

  await page.evaluate(() => {
    const svg = document.querySelector('svg[viewBox="0 0 1000 680"]');
    svg.setAttribute('preserveAspectRatio', 'none');

    // Fix ORION-9 wrap in center
    const orion9Text = Array.from(document.querySelectorAll('div')).find(d => d.innerText && d.innerText.includes('ORION-'));
    if (orion9Text) {
      orion9Text.style.whiteSpace = 'nowrap';
      orion9Text.innerText = 'ORION-9';
    }

    // Hide clashing tagline across engines
    const tagline = Array.from(document.querySelectorAll('div')).find(d => d.innerText && d.innerText.includes('CONNECTED INTELLIGENCE FOR A MORE RESILIENT TOMORROW'));
    if (tagline) {
      tagline.style.display = 'none';
    }
  });

  await new Promise(r => setTimeout(r, 1000));
  const p = path.resolve('C:/Users/LENOVO/.gemini/antigravity/brain/2294112a-5564-4333-a185-061673183aaa/test_none_1920.png');
  await page.screenshot({ path: p });
  console.log('Saved test_none_1920.png');

  await browser.close();
})();
