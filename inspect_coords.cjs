const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle2' });
  try {
    const power = await page.waitForSelector('button', { timeout: 2000 });
    await power.click();
  } catch(e){}
  await page.waitForSelector('#path-supply', { timeout: 15000 });

  const data = await page.evaluate(() => {
    const svg = document.querySelector('svg[viewBox="0 0 1000 680"]');
    const svgRect = svg ? svg.getBoundingClientRect() : null;
    const pathSupply = document.querySelector('#path-supply');
    const pathSupplyD = pathSupply ? pathSupply.getAttribute('d') : null;
    const pathSupplyPoint0 = pathSupply ? pathSupply.getPointAtLength(0) : null;
    const pathSupplyPointEnd = pathSupply ? pathSupply.getPointAtLength(pathSupply.getTotalLength()) : null;

    const allPaths = Array.from(document.querySelectorAll('svg[viewBox="0 0 1000 680"] path')).map(p => ({
      id: p.id,
      d: p.getAttribute('d'),
      totalLength: p.getTotalLength(),
      start: p.getPointAtLength(0),
      end: p.getPointAtLength(p.getTotalLength())
    }));

    const buttons = Array.from(document.querySelectorAll('button')).map(b => ({
      text: b.innerText.trim().replace(/\n+/g, ' '),
      rect: {
        left: b.getBoundingClientRect().left,
        right: b.getBoundingClientRect().right,
        top: b.getBoundingClientRect().top,
        bottom: b.getBoundingClientRect().bottom,
        width: b.getBoundingClientRect().width,
        height: b.getBoundingClientRect().height
      }
    }));
    return { svgRect, pathSupplyD, pathSupplyPoint0, pathSupplyPointEnd, allPaths, buttons };
  });
  console.log('DATA:', JSON.stringify(data, null, 2));
  await browser.close();
})();
