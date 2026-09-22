/**
 * ORION-9 WAVE 10: ENTERPRISE PRODUCTION CONTROL PLANE PLAYWRIGHT E2E SUITE
 * 
 * Verifies end-to-end functionality for:
 * 1. Operations Center (/admin/operations): Real-time diagnostics & safety locks
 * 2. Incident Center (/admin/incidents): SEV1-4 triage & timeline ledgers
 * 3. Configuration Center (/admin/configurations): Version diffs & secret masking
 * 4. Release Center (/admin/releases): Preflight verification gates & deployment history
 */

import { test, expect } from '@playwright/test';

test.describe('Orion-9 Wave 10 Enterprise Production Control Plane E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('orion_os_power_state', 'ON');
    });
    await page.goto('/login');
  });

  test('1. Operations Center loads health diagnostics and emergency safety controls', async ({ page }) => {
    // Authenticate as Admin
    await page.fill('input#username', 'admin');
    await page.fill('input#password', 'admin');
    await page.click('button[type="submit"]');

    // Navigate to Operations Center
    await page.waitForTimeout(500);
    await page.goto('/admin/operations');

    // Verify Heading
    await expect(page.locator('h1', { hasText: 'Operations Center' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Wave 10 Enterprise')).toBeVisible();

    // Verify Health Probes
    await expect(page.locator('text=System Health')).toBeVisible();
    await expect(page.locator('text=Subsystems Online')).toBeVisible();
    await expect(page.locator('text=Firestore Persistence Tier')).toBeVisible();
    await expect(page.locator('text=Kernel CommandBus & PolicyEngine')).toBeVisible();

    // Switch to Emergency Safety Locks tab
    await page.click('button:has-text("Emergency Safety Locks")');
    await expect(page.locator('text=Emergency Production Safety Controls')).toBeVisible();
    await expect(page.locator('text=Production Write Lock')).toBeVisible();
    await expect(page.locator('text=AI Action Kill Switch')).toBeVisible();
    await expect(page.locator('text=Autonomous Workflow Kill Switch')).toBeVisible();
  });

  test('2. Incident Center displays triage queue, blast radius and timeline ledger', async ({ page }) => {
    // Authenticate as Admin
    await page.fill('input#username', 'admin');
    await page.fill('input#password', 'admin');
    await page.click('button[type="submit"]');

    // Navigate to Incident Center
    await page.waitForTimeout(500);
    await page.goto('/admin/incidents');

    // Verify Heading
    await expect(page.locator('h1', { hasText: 'Incident Center' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=SEV1–SEV4 Triage')).toBeVisible();

    // Verify Incident Queue
    await expect(page.locator('text=Incident Queue')).toBeVisible();
    await expect(page.locator('text=Blast Radius Score')).toBeVisible();
    await expect(page.locator('text=Append-Only Timeline Ledger')).toBeVisible();

    // Verify Declare Incident modal trigger
    await page.click('button:has-text("Declare Incident")');
    await expect(page.locator('text=Declare Production Incident')).toBeVisible();
    await page.click('button:has-text("Cancel")');
  });

  test('3. Configuration Center renders version catalog, secret masking and diffs', async ({ page }) => {
    // Authenticate as Admin
    await page.fill('input#username', 'admin');
    await page.fill('input#password', 'admin');
    await page.click('button[type="submit"]');

    // Navigate to Configuration Center
    await page.waitForTimeout(500);
    await page.goto('/admin/configurations');

    // Verify Heading
    await expect(page.locator('h1', { hasText: 'Configuration Center' })).toBeVisible({ timeout: 10000 });

    // Verify System Parameters tab
    await expect(page.locator('text=System Parameters')).toBeVisible();
    await expect(page.locator('text=system.maxConcurrentWorkflows')).toBeVisible();

    // Switch to Version Diffs & Rollback tab
    await page.click('button:has-text("Version Diffs & Rollback")');
    await expect(page.locator('text=Immutable Version Catalog')).toBeVisible();

    // Switch to Secret References tab
    await page.click('button:has-text("Secret References")');
    await expect(page.locator('text=Provider-Agnostic SecretReference architecture')).toBeVisible();
    await expect(page.locator('text=Fully Redacted').first()).toBeVisible();
  });

  test('4. Release Center displays preflight verification gates and rollback target', async ({ page }) => {
    // Authenticate as Admin
    await page.fill('input#username', 'admin');
    await page.fill('input#password', 'admin');
    await page.click('button[type="submit"]');

    // Navigate to Release Center
    await page.waitForTimeout(500);
    await page.goto('/admin/releases');

    // Verify Heading
    await expect(page.locator('h1', { hasText: 'Release Center' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Preflight Verification Gates')).toBeVisible();
    await expect(page.locator('text=Vite Production Build')).toBeVisible();
    await expect(page.locator('text=TypeScript Static Verification')).toBeVisible();
    await expect(page.locator('text=Designated Rollback Target')).toBeVisible();
  });
});
