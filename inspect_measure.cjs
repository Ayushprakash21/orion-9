const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle2' });
  try { (await page.waitForSelector('button', { timeout: 2000 })).click(); } catch(e){}
  await page.waitForSelector('#path-supply', { timeout: 15000 });

  const r = await page.evaluate(() => {
    const s = document.querySelector('svg[viewBox="0 0 1000 680"]');
    const r = s.getBoundingClientRect();
    const btnSupply = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('SUPPLY'));
    const bRect = btnSupply.getBoundingClientRect();
    const p = document.querySelector('#path-supply');
    const p0 = p.getPointAtLength(0);
    const pMatrix = p.getScreenCTM();
    const screenP0 = p0.matrixTransform(pMatrix);

    const btnProc = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('PROCUREMENT'));
    const procRect = btnProc.getBoundingClientRect();
    const pProc = document.querySelector('#path-procurement');
    const pProc0 = pProc.getPointAtLength(0);
    const screenProc0 = pProc0.matrixTransform(pProc.getScreenCTM());

    return {
      svg: { left: r.left, top: r.top, width: r.width, height: r.height },
      btnSupply: { left: bRect.left, right: bRect.right, top: bRect.top, bottom: bRect.bottom },
      pathSupplyStartScreen: { x: screenP0.x, y: screenP0.y },
      btnProcurement: { left: procRect.left, right: procRect.right, top: procRect.top, bottom: procRect.bottom },
      pathProcurementStartScreen: { x: screenProc0.x, y: screenProc0.y }
    };
  });
  console.log('MEASUREMENT:', JSON.stringify(r, null, 2));
  await browser.close();
})();
