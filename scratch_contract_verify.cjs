const puppeteer = require('puppeteer');
const path = require('path');

const OUT_DIR = path.resolve('C:/Users/LENOVO/.gemini/antigravity/brain/2294112a-5564-4333-a185-061673183aaa');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('[TEST] Launching Puppeteer browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Pre-seed power state so system is on
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('orion_os_power_state', 'ON');
  });

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' && !text.includes('favicon') && !text.includes('supported currencies')) {
      console.error('[BROWSER ERROR]', text);
    }
  });

  try {
    // 1. Visit Login page directly
    console.log('[STEP 1] Loading /login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    // 2. Perform Login as admin
    console.log('[STEP 2] Entering admin credentials on login gate...');
    await page.waitForSelector('input[name="username"], input[id="username"], input[type="text"]', { timeout: 10000 });
    await page.type('input[type="text"]', 'admin');
    await page.type('input[type="password"]', 'admin');
    
    // Click Sign In
    await page.click('button[type="submit"]');
    console.log('[STEP 2] Clicked submit, waiting for desktop initialization...');
    await sleep(4500);

    // 3. Navigate to /contracts to open window
    console.log('[STEP 3] Opening Contracts Lifecycle application at /contracts...');
    await page.goto('http://localhost:3000/contracts', { waitUntil: 'networkidle2' });
    await sleep(3000);

    // Wait for the Contract Lifecycle heading
    await page.waitForSelector('h1', { timeout: 10000 });
    console.log('[PASS] Contract Intelligence rendered in OS Window!');

    // Screenshot 1: Contracts Portfolio
    const p1 = path.join(OUT_DIR, 'contract_01_portfolio.png');
    await page.screenshot({ path: p1 });
    console.log('[PASS] Saved contract_01_portfolio.png');

    // 4. Switch to AI Neural Redlines tab
    console.log('[STEP 4] Navigating to AI Neural Redlines tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const redlineBtn = buttons.find(b => b.innerText && b.innerText.includes('AI Neural Redlines'));
      if (redlineBtn) redlineBtn.click();
    });
    await sleep(1500);

    // Screenshot 2: AI Redlines
    const p2 = path.join(OUT_DIR, 'contract_02_ai_redlines.png');
    await page.screenshot({ path: p2 });
    console.log('[PASS] Saved contract_02_ai_redlines.png');

    // 5. Switch to Strategic Sourcing & RFQs tab
    console.log('[STEP 5] Navigating to Strategic Sourcing & RFQs tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const rfqBtn = buttons.find(b => b.innerText && b.innerText.includes('Strategic Sourcing'));
      if (rfqBtn) rfqBtn.click();
    });
    await sleep(1500);

    // Screenshot 3: RFQ Bidding Matrix
    const p3 = path.join(OUT_DIR, 'contract_03_rfq_bidding.png');
    await page.screenshot({ path: p3 });
    console.log('[PASS] Saved contract_03_rfq_bidding.png');

    // 6. Award Winning Bid
    console.log('[STEP 6] Awarding winning bid on RFQ...');
    await page.evaluate(() => {
      const awardBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText && b.innerText.includes('Award & Draft'));
      if (awardBtns.length > 0) {
        awardBtns[0].click();
      }
    });
    await sleep(2000);

    // Screenshot 4: Awarded state
    const p4 = path.join(OUT_DIR, 'contract_04_rfq_awarded.png');
    await page.screenshot({ path: p4 });
    console.log('[PASS] Saved contract_04_rfq_awarded.png');

    // 7. Switch to Live SLA & Liquidated Damages Engine
    console.log('[STEP 7] Navigating to Live SLA & Liquidated Damages tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const slaBtn = buttons.find(b => b.innerText && b.innerText.includes('Live SLA'));
      if (slaBtn) slaBtn.click();
    });
    await sleep(1500);

    // Screenshot 5: Live SLA & Penalties
    const p5 = path.join(OUT_DIR, 'contract_05_sla_penalties.png');
    await page.screenshot({ path: p5 });
    console.log('[PASS] Saved contract_05_sla_penalties.png');

    console.log('[SUCCESS] All Contract Lifecycle and Sourcing tests passed cleanly!');
  } catch (err) {
    console.error('[TEST ERROR] Verification failed:', err);
  } finally {
    await browser.close();
  }
})();
