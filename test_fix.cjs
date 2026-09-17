const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle2' });
  try { (await page.waitForSelector('button', { timeout: 2000 })).click(); } catch(e){}
  await page.waitForSelector('#path-supply', { timeout: 15000 });

  // Test what happens if the canvas container locks aspect ratio or matches SVG
  await page.evaluate(() => {
    // Find the canvas container that holds the SVG and the nodes
    const svg = document.querySelector('svg[viewBox="0 0 1000 680"]');
    const canvasDiv = svg.parentElement;
    
    // Create an inner stage wrapper if not present, or style canvasDiv to fit the SVG aspect ratio
    // Or set svg preserveAspectRatio="none"
    svg.setAttribute('preserveAspectRatio', 'none');
  });

  await new Promise(r => setTimeout(r, 1000));
  const p1 = path.resolve('C:/Users/LENOVO/.gemini/antigravity/brain/2294112a-5564-4333-a185-061673183aaa/test_preserve_none.png');
  await page.screenshot({ path: p1 });
  console.log('Saved test_preserve_none.png');

  await browser.close();
})();
