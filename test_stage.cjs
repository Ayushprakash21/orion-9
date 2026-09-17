const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle2' });
  try { (await page.waitForSelector('button', { timeout: 2000 })).click(); } catch(e){}
  await page.waitForSelector('#path-supply', { timeout: 15000 });

  await page.evaluate(() => {
    const svg = document.querySelector('svg[viewBox="0 0 1000 680"]');
    const canvasDiv = svg.parentElement;

    // Create stage wrapper
    const stage = document.createElement('div');
    stage.id = 'admin-control-stage';
    stage.style.position = 'relative';
    stage.style.width = '100%';
    stage.style.height = '100%';
    stage.style.maxWidth = '100%';
    stage.style.maxHeight = '100%';
    stage.style.aspectRatio = '1000 / 680';
    stage.style.margin = 'auto';

    // Move all children of canvasDiv into stage
    const children = Array.from(canvasDiv.children);
    children.forEach(child => stage.appendChild(child));
    canvasDiv.appendChild(stage);

    // Fix ORION-9 wrap in center
    const orion9Text = Array.from(stage.querySelectorAll('div')).find(d => d.innerText && d.innerText.includes('ORION-'));
    if (orion9Text) {
      orion9Text.style.whiteSpace = 'nowrap';
      orion9Text.innerText = 'ORION-9';
    }

    // Hide clashing tagline across engines
    const tagline = Array.from(stage.querySelectorAll('div')).find(d => d.innerText && d.innerText.includes('CONNECTED INTELLIGENCE FOR A MORE RESILIENT TOMORROW'));
    if (tagline) {
      tagline.style.display = 'none';
    }
  });

  await new Promise(r => setTimeout(r, 1000));
  const p1 = path.resolve('C:/Users/LENOVO/.gemini/antigravity/brain/2294112a-5564-4333-a185-061673183aaa/test_stage_1440.png');
  await page.screenshot({ path: p1 });
  console.log('Saved test_stage_1440.png');

  // Also test 1920x1080
  await page.setViewport({ width: 1920, height: 1080 });
  await new Promise(r => setTimeout(r, 500));
  const p2 = path.resolve('C:/Users/LENOVO/.gemini/antigravity/brain/2294112a-5564-4333-a185-061673183aaa/test_stage_1920.png');
  await page.screenshot({ path: p2 });
  console.log('Saved test_stage_1920.png');

  await browser.close();
})();
