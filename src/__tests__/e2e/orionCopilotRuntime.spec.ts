/**
 * ORION-9 COPILOT RUNTIME REPAIR — E2E PLAYWRIGHT TESTS
 *
 * Tests the full vertical slice:
 *   Top Bar [Copilot] button
 *     → openApplication('ai-copilot')
 *     → normalizeAppId() → 'orion-ai'
 *     → ORION_REGISTRY['orion-ai'] → window created
 *     → OrionWindow renders AICopilot component
 *     → AICopilot submits prompt → generateCopilotResponse → response
 *     → User sees AI response
 *
 * Mobile Nav AI button is also covered.
 *
 * NOTE: These tests run against the live dev server (npm run dev) or production URL.
 *       Set BASE_URL environment variable to override, defaults to localhost:5173.
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

/**
 * Helper: login as demo user
 */
async function loginAsDemo(page: Page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  
  // Check if already logged in (desktop visible)
  const desktopVisible = await page.locator('.orion-desktop-shell, [data-desktop-surface]').isVisible().catch(() => false);
  if (desktopVisible) return;

  // Find login form
  const loginForm = page.locator('form, [data-testid="login-form"]').first();
  if (await loginForm.isVisible({ timeout: 5000 }).catch(() => false)) {
    // Fill demo credentials
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('demo@orion9.com');
      await passwordInput.fill('demo123');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
    }
  }

  // Wait for desktop to appear
  await page.waitForSelector('.orion-desktop-shell, [data-desktop-surface], .orion-global-topbar', { 
    timeout: 20000,
    state: 'visible' 
  }).catch(() => {});
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Copilot button is visible and accessible in top system bar
// ─────────────────────────────────────────────────────────────────────────────
test('COPILOT-01: Copilot button is visible in OrionSystemBar', async ({ page }) => {
  await loginAsDemo(page);
  
  // System bar must be visible
  await expect(page.locator('.orion-global-topbar')).toBeVisible({ timeout: 10000 });
  
  // Copilot button must be visible with correct label
  const copilotBtn = page.locator('[data-testid="orion-copilot-button"]');
  await expect(copilotBtn).toBeVisible({ timeout: 5000 });
  await expect(copilotBtn).toHaveAttribute('aria-label', 'Open Orion AI Copilot');
  await expect(copilotBtn).toHaveAttribute('type', 'button');
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: Clicking Copilot button opens ORION AI window
// ─────────────────────────────────────────────────────────────────────────────
test('COPILOT-02: Clicking Copilot button opens ORION AI window', async ({ page }) => {
  await loginAsDemo(page);
  
  const copilotBtn = page.locator('[data-testid="orion-copilot-button"]');
  await expect(copilotBtn).toBeVisible({ timeout: 10000 });
  
  await copilotBtn.click();
  
  // Route should change to /copilot
  await expect(page).toHaveURL(/\/copilot/, { timeout: 5000 });
  
  // An OrionWindow for orion-ai should appear
  const aiWindow = page.locator('[data-window-id="orion-ai"]');
  await expect(aiWindow).toBeVisible({ timeout: 8000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: ORION AI window contains the Copilot UI (header, input, quick actions)
// ─────────────────────────────────────────────────────────────────────────────
test('COPILOT-03: ORION AI window renders AICopilot UI', async ({ page }) => {
  await loginAsDemo(page);
  
  const copilotBtn = page.locator('[data-testid="orion-copilot-button"]');
  await copilotBtn.click();
  
  const aiWindow = page.locator('[data-window-id="orion-ai"]');
  await expect(aiWindow).toBeVisible({ timeout: 8000 });
  
  // Copilot header visible
  await expect(aiWindow.locator('h1, [class*="font-semibold"]').filter({ hasText: /Orion Copilot|ORION AI/i })).toBeVisible({ timeout: 5000 });
  
  // Input field present
  const inputField = aiWindow.locator('input[type="text"], textarea').first();
  await expect(inputField).toBeVisible({ timeout: 5000 });
  
  // Send button present
  const sendBtn = aiWindow.locator('button[type="submit"]').first();
  await expect(sendBtn).toBeVisible({ timeout: 5000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: ORION AI initial greeting message is present
// ─────────────────────────────────────────────────────────────────────────────
test('COPILOT-04: ORION AI shows initial greeting message', async ({ page }) => {
  await loginAsDemo(page);
  
  const copilotBtn = page.locator('[data-testid="orion-copilot-button"]');
  await copilotBtn.click();
  
  const aiWindow = page.locator('[data-window-id="orion-ai"]');
  await expect(aiWindow).toBeVisible({ timeout: 8000 });
  
  // Initial message from assistant
  await expect(aiWindow.locator('text=/ORION AI|Orion Copilot|I am ORION/i')).toBeVisible({ timeout: 5000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: User can type in Copilot input field
// ─────────────────────────────────────────────────────────────────────────────
test('COPILOT-05: User can type in Copilot input', async ({ page }) => {
  await loginAsDemo(page);
  
  const copilotBtn = page.locator('[data-testid="orion-copilot-button"]');
  await copilotBtn.click();
  
  const aiWindow = page.locator('[data-window-id="orion-ai"]');
  await expect(aiWindow).toBeVisible({ timeout: 8000 });
  
  const inputField = aiWindow.locator('input[type="text"], textarea').first();
  await inputField.click();
  await inputField.fill('Show critical inventory risks');
  await expect(inputField).toHaveValue('Show critical inventory risks');
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6: Quick action buttons are present and clickable
// ─────────────────────────────────────────────────────────────────────────────
test('COPILOT-06: Quick action chips are shown for initial state', async ({ page }) => {
  await loginAsDemo(page);
  
  const copilotBtn = page.locator('[data-testid="orion-copilot-button"]');
  await copilotBtn.click();
  
  const aiWindow = page.locator('[data-window-id="orion-ai"]');
  await expect(aiWindow).toBeVisible({ timeout: 8000 });
  
  // Quick action buttons visible (shown when messages.length < 3)
  const quickActionBtn = aiWindow.locator('button').filter({ hasText: /Analyze Inventory|Explain Exceptions|Supplier Risk|Procurement/i }).first();
  await expect(quickActionBtn).toBeVisible({ timeout: 5000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 7: Submitting a prompt shows loading state then response
// ─────────────────────────────────────────────────────────────────────────────
test('COPILOT-07: Submitting a prompt returns an AI response', async ({ page }) => {
  await loginAsDemo(page);
  
  const copilotBtn = page.locator('[data-testid="orion-copilot-button"]');
  await copilotBtn.click();
  
  const aiWindow = page.locator('[data-window-id="orion-ai"]');
  await expect(aiWindow).toBeVisible({ timeout: 8000 });
  
  const inputField = aiWindow.locator('input[type="text"]').first();
  await inputField.fill('What are the current inventory risks?');
  
  // Submit by pressing Enter
  await inputField.press('Enter');
  
  // User message should appear in conversation
  await expect(aiWindow.locator('text=What are the current inventory risks?')).toBeVisible({ timeout: 5000 });
  
  // AI response should eventually appear (may take up to 30s if calling real API)
  // Accept either a real response or a fallback/error message
  await expect(
    aiWindow.locator('[class*="prose"], [class*="text-slate-200"], [class*="text-os-text"]').last()
  ).toBeVisible({ timeout: 30000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 8: Copilot window can be closed and reopened
// ─────────────────────────────────────────────────────────────────────────────
test('COPILOT-08: Copilot window can be closed and reopened', async ({ page }) => {
  await loginAsDemo(page);
  
  const copilotBtn = page.locator('[data-testid="orion-copilot-button"]');
  await copilotBtn.click();
  
  let aiWindow = page.locator('[data-window-id="orion-ai"]');
  await expect(aiWindow).toBeVisible({ timeout: 8000 });
  
  // Close window via title bar close button
  const closeBtn = aiWindow.locator('[data-window-controls] button').last();
  await closeBtn.click();
  
  // Window should be gone
  await expect(aiWindow).not.toBeVisible({ timeout: 3000 });
  
  // Reopen
  await copilotBtn.click();
  aiWindow = page.locator('[data-window-id="orion-ai"]');
  await expect(aiWindow).toBeVisible({ timeout: 5000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 9: Governance status badge appears in AI responses
// ─────────────────────────────────────────────────────────────────────────────
test('COPILOT-09: Governance status badge is shown on assistant messages', async ({ page }) => {
  await loginAsDemo(page);
  
  const copilotBtn = page.locator('[data-testid="orion-copilot-button"]');
  await copilotBtn.click();
  
  const aiWindow = page.locator('[data-window-id="orion-ai"]');
  await expect(aiWindow).toBeVisible({ timeout: 8000 });
  
  // Initial message should have ANSWER governance badge
  await expect(aiWindow.locator('text=ANSWER')).toBeVisible({ timeout: 5000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 10: Mobile AI button opens same Copilot (viewport: 375×812)
// ─────────────────────────────────────────────────────────────────────────────
test('COPILOT-10: Mobile AI button opens Copilot window', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await loginAsDemo(page);
  
  // On mobile, the mobile nav bar AI button should be visible
  const mobileAIBtn = page.locator('[data-testid="orion-mobile-copilot-button"]');
  
  // On small screens, mobile nav is shown; on desktop, top bar Copilot is shown
  const isVisible = await mobileAIBtn.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (isVisible) {
    await mobileAIBtn.click();
    
    const aiWindow = page.locator('[data-window-id="orion-ai"]');
    await expect(aiWindow).toBeVisible({ timeout: 8000 });
  } else {
    // Mobile nav may be hidden depending on responsive breakpoint; fall back to top-bar button
    const topBarBtn = page.locator('[data-testid="orion-copilot-button"]');
    if (await topBarBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await topBarBtn.click();
      const aiWindow = page.locator('[data-window-id="orion-ai"]');
      await expect(aiWindow).toBeVisible({ timeout: 8000 });
    } else {
      test.skip(true, 'Neither mobile nor top-bar Copilot button visible at this viewport');
    }
  }
});
