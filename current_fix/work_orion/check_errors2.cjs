const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  let errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.toString()));
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 5000 }).catch(e => console.log('Timeout'));
  await new Promise(r => setTimeout(r, 2000)); // wait a bit for react to mount
  console.log("ERRORS:", errors);
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("BODY_TEXT:", bodyText.substring(0, 500));
  await browser.close();
  process.exit(0);
})();
