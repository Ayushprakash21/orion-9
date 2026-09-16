const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.type().toUpperCase(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  await page.goto('http://localhost:3000');
  console.log('Page loaded. Waiting for 2.5 minutes...');
  
  await new Promise(r => setTimeout(r, 150000));
  
  console.log('Done waiting. Closing.');
  await browser.close();
})();
