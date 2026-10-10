import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader', '--disable-gpu']
  });

  const context = await browser.newContext({
    viewport: { width: 1792, height: 896 }
  });

  const page = await context.newPage();

  // Set session for auto-login
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
        organization: { id: 'ORION_PLATFORM', name: 'ORION_PLATFORM', status: 'active' },
        permissions: ['all'],
        environment: 'DEMO',
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      }));
    } catch (e) {}
  });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Handle potential login form
  const usernameInput = page.locator('input#username');
  if (await usernameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('Logging in via login screen...');
    await usernameInput.fill('admin');
    await page.click('button[type="submit"]');
    const passwordInput = page.locator('input#password');
    if (await passwordInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await passwordInput.fill('admin');
      await page.click('button[type="submit"]');
    }
  }

  // Wait for Desktop canvas
  console.log('Waiting for desktop canvas...');
  await page.waitForSelector('[data-desktop-canvas="true"]', { timeout: 15000 });

  // Open Command Center application via authoritative global dispatcher
  console.log('Opening Command Center...');
  await page.evaluate(() => {
    if (typeof window.__orion_open_app === 'function') {
      window.__orion_open_app('command-center');
    } else {
      window.dispatchEvent(new CustomEvent('orion:open-app', { detail: { appId: 'command-center' } }));
    }
  });

  const mapRoot = page.locator('[data-testid="global-control-tower-map-root"]');
  await mapRoot.waitFor({ state: 'visible', timeout: 15000 });
  console.log('Map root visible. Waiting for layout stabilization...');
  await page.waitForTimeout(2000);

  // Take screenshot of map root and inspector
  const artifactDir = 'C:/Users/LENOVO/.gemini/antigravity/brain/2294112a-5564-4333-a185-061673183aaa';
  await page.screenshot({ path: path.join(artifactDir, 'reproduce_before_overlap_full.png') });

  // Select a shipment entity to show both action buttons (Follow Moving Entity & Ask Orion Copilot)
  console.log('Triggering entity selection in map inspector...');
  const missionCard = page.locator('[data-testid="mission-card"], div:has-text("SHP-")').first();
  if (await missionCard.isVisible({ timeout: 3000 }).catch(() => false)) {
    await missionCard.click();
  }
  await page.waitForTimeout(1000);

  // Measure bounding client rects
  const metrics = await page.evaluate(() => {
    const mapRootEl = document.querySelector('[data-testid="global-control-tower-map-root"]');
    const inspectorEl = document.querySelector('[data-testid="map-inspector-container"]');
    const kpiStripEl = document.querySelector('.max-w-4xl');
    const askCopilotBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Ask Orion Copilot'));
    const followBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Follow'));

    const getBox = (el) => el ? el.getBoundingClientRect().toJSON() : null;

    return {
      mapRoot: getBox(mapRootEl),
      inspector: getBox(inspectorEl),
      kpiStrip: getBox(kpiStripEl),
      askCopilotBtn: getBox(askCopilotBtn),
      followBtn: getBox(followBtn),
    };
  });

  console.log('Bounding Box Metrics:', JSON.stringify(metrics, null, 2));

  await page.screenshot({ path: path.join(artifactDir, 'reproduce_before_overlap_inspector.png') });
  await browser.close();
}

main().catch(err => {
  console.error('Reproduction script error:', err);
  process.exit(1);
});
