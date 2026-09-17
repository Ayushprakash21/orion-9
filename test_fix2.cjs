const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Test 1440x900
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle2' });
  try { (await page.waitForSelector('button', { timeout: 2000 })).click(); } catch(e){}
  await page.waitForSelector('#path-supply', { timeout: 15000 });

  // Apply stage wrapper and coordinate fix dynamically
  await page.evaluate(() => {
    // 1. Fix SVG and canvas container
    const svg = document.querySelector('svg[viewBox="0 0 1000 680"]');
    const canvasDiv = svg.parentElement;
    
    // Set canvasDiv to flex center and create/style inner stage
    canvasDiv.style.display = 'flex';
    canvasDiv.style.alignItems = 'center';
    canvasDiv.style.justifyContent = 'center';
    canvasDiv.style.overflow = 'hidden';

    // Wrap canvas children in an aspect-locked stage or set svg to preserveAspectRatio="none"
    svg.setAttribute('preserveAspectRatio', 'none');

    // 2. Fix ORION-9 wrap in center
    const orion9Text = Array.from(document.querySelectorAll('div')).find(d => d.innerText.trim() === 'ORION-\n9' || d.innerText.trim() === 'ORION-9');
    if (orion9Text) {
      orion9Text.style.whiteSpace = 'nowrap';
      orion9Text.innerText = 'ORION-9';
    }

    // 3. Fix tagline bleed through
    const tagline = Array.from(document.querySelectorAll('div')).find(d => d.innerText.includes('CONNECTED INTELLIGENCE FOR A MORE RESILIENT TOMORROW'));
    if (tagline) {
      tagline.style.display = 'none'; // Move or hide from clashing directly with engines
    }
  });

  await new Promise(r => setTimeout(r, 1000));
  const p1 = path.resolve('C:/Users/LENOVO/.gemini/antigravity/brain/2294112a-5564-4333-a185-061673183aaa/test_fix_1440.png');
  await page.screenshot({ path: p1 });
  console.log('Saved test_fix_1440.png');

  // Test wide screen 1920x1080 (where user saw the large gap)
  await page.setViewport({ width: 1920, height: 1080 });
  await new Promise(r => setTimeout(r, 500));
  const p2 = path.resolve('C:/Users/LENOVO/.gemini/antigravity/brain/2294112a-5564-4333-a185-061673183aaa/test_fix_1920.png');
  await page.screenshot({ path: p2 });
  console.log('Saved test_fix_1920.png');

  await browser.close();
})();
