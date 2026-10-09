import { chromium } from 'playwright';
import path from 'path';

async function setupPageAuth(page: any) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('orion_os_power_state', 'ON');
      localStorage.setItem('orion9_database_environment', 'DEMO');
      localStorage.setItem('orion_settings', JSON.stringify({ userExperienceMode: 'ADVANCED' }));
      localStorage.setItem('orion_system_settings', JSON.stringify({ userExperienceMode: 'ADVANCED' }));
      localStorage.setItem('orion_auth_session', JSON.stringify({
        user: {
          id: 'local-admin',
          username: 'admin',
          fullName: 'Orion-9 Administrator',
          displayName: 'Admin',
          email: 'admin@orion.network',
          role: 'platform_admin',
          organizationId: 'ORION_PLATFORM',
          organizationName: 'ORION_PLATFORM',
          department: 'IT Administration'
        },
        organization: {
          id: 'ORION_PLATFORM',
          name: 'ORION_PLATFORM',
          status: 'active'
        },
        permissions: ['all'],
        environment: 'DEMO',
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      }));
    } catch (e) {}
  });
}

async function run() {
  const artifactDir = 'C:\\Users\\LENOVO\\.gemini\\antigravity\\brain\\2294112a-5564-4333-a185-061673183aaa';
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  console.log('--- 1. Testing 1792x896 Standard Viewport ---');
  let page = await browser.newPage({
    viewport: { width: 1792, height: 896 }
  });

  await setupPageAuth(page);

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const desktop = page.locator('[data-desktop-canvas="true"]');
  await desktop.waitFor({ timeout: 15000 });

  console.log('Double clicking Command Center shortcut...');
  const scIcon = page.locator('[data-testid="desktop-shortcut-command-center"]').first();
  await scIcon.dblclick({ force: true });

  await page.waitForSelector('[data-orion-window]', { timeout: 10000 });
  await page.waitForTimeout(3000);

  // 1. Full view at 1792x896 with top banner, globe and metrics
  const shot1 = path.join(artifactDir, 'command_center_1792x896_main_view.png');
  await page.screenshot({ path: shot1 });
  console.log('Saved Screenshot 1 (1792x896 Main View):', shot1);

  // 2. Globe with right-hand inspector open
  console.log('Selecting an entity or opening inspector...');
  const inspectorBtn = page.locator('[data-testid="toggle-inspector-btn"]').first();
  if (await inspectorBtn.isVisible()) {
    const inspectorContainer = page.locator('[data-testid="map-inspector-container"]');
    if (!(await inspectorContainer.isVisible())) {
      await inspectorBtn.click();
      await page.waitForTimeout(1000);
    }
  }
  const shot2 = path.join(artifactDir, 'command_center_inspector_open.png');
  await page.screenshot({ path: shot2 });
  console.log('Saved Screenshot 2 (Inspector Open):', shot2);

  // 3. Globe with inspector closed
  console.log('Closing inspector...');
  const closeInspectorBtn = page.locator('[data-testid="close-map-inspector-btn"]').first();
  if (await closeInspectorBtn.isVisible()) {
    await closeInspectorBtn.click();
  } else if (await inspectorBtn.isVisible()) {
    await inspectorBtn.click();
  }
  await page.waitForTimeout(1000);
  const shot3 = path.join(artifactDir, 'command_center_inspector_closed.png');
  await page.screenshot({ path: shot3 });
  console.log('Saved Screenshot 3 (Inspector Closed):', shot3);

  // 4. Globe to Mercator switching
  console.log('Toggling projection to Mercator via projection-toggle-btn...');
  const projBtn = page.locator('[data-testid="projection-toggle-btn"]').first();
  if (await projBtn.isVisible()) {
    await projBtn.click();
    await page.waitForTimeout(2500);
  }
  const shot4 = path.join(artifactDir, 'command_center_mercator_projection.png');
  await page.screenshot({ path: shot4 });
  console.log('Saved Screenshot 4 (Mercator Projection):', shot4);

  // Toggle back to Globe
  if (await projBtn.isVisible()) {
    await projBtn.click();
    await page.waitForTimeout(1500);
  }

  // 5. Lower dashboard panels scrolled into view cleanly
  console.log('Scrolling window body to inspect lower workbench and analytics...');
  await page.evaluate(() => {
    const wb = document.querySelector('[data-window-body="true"]');
    if (wb) wb.scrollTop = 550;
  });
  await page.waitForTimeout(1500);
  const shot5 = path.join(artifactDir, 'command_center_lower_panels_scrolled.png');
  await page.screenshot({ path: shot5 });
  console.log('Saved Screenshot 5 (Lower Panels Scrolled):', shot5);

  await page.close();

  // 6A. 1440x900 Compact Desktop Viewport
  console.log('--- 6A. Testing 1440x900 Compact Desktop Viewport ---');
  page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });
  await setupPageAuth(page);
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const sc1440 = page.locator('[data-testid="desktop-shortcut-command-center"]').first();
  await sc1440.dblclick({ force: true });
  await page.waitForSelector('[data-orion-window]', { timeout: 10000 });
  await page.waitForTimeout(3000);
  const shot6a = path.join(artifactDir, 'command_center_compact_1440x900.png');
  await page.screenshot({ path: shot6a });
  console.log('Saved Screenshot 6A (1440x900):', shot6a);
  await page.close();

  // 6B. 1366x768 Compact Desktop Viewport
  console.log('--- 6B. Testing 1366x768 Compact Laptop Viewport ---');
  page = await browser.newPage({
    viewport: { width: 1366, height: 768 }
  });
  await setupPageAuth(page);
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const sc1366 = page.locator('[data-testid="desktop-shortcut-command-center"]').first();
  await sc1366.dblclick({ force: true });
  await page.waitForSelector('[data-orion-window]', { timeout: 10000 });
  await page.waitForTimeout(3000);
  const shot6b = path.join(artifactDir, 'command_center_compact_1366x768.png');
  await page.screenshot({ path: shot6b });
  console.log('Saved Screenshot 6B (1366x768):', shot6b);
  await page.close();

  // 6C. 1024x768 Tablet Viewport
  console.log('--- 6C. Testing 1024x768 Tablet Viewport ---');
  page = await browser.newPage({
    viewport: { width: 1024, height: 768 }
  });
  await setupPageAuth(page);
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  // On tablet shell, switch to Control tab if not active
  const controlTab = page.locator('[data-orion-tablet-nav="rail"] button').nth(1);
  await page.evaluate(() => {
    const btns = document.querySelectorAll('[data-orion-tablet-nav="rail"] button');
    if (btns.length > 1) {
      (btns[1] as HTMLElement).click();
    }
  });
  await page.waitForTimeout(3000);
  const shot6c = path.join(artifactDir, 'command_center_compact_1024x768.png');
  await page.screenshot({ path: shot6c });
  console.log('Saved Screenshot 6C (1024x768):', shot6c);
  await page.close();

  await browser.close();
  console.log('ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('ERROR CAPTURING SCREENSHOTS:', err);
  process.exit(1);
});
