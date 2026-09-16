const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  
  await page.evaluateOnNewDocument(() => {
    setInterval(() => console.log('Ping from browser'), 500);
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 5000 }).catch(e => console.log('Timeout'));
  await new Promise(r => setTimeout(r, 4000));
  await browser.close();
  process.exit(0);
})();
