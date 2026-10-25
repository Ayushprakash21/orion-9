/**
 * ORION-9 STAGING DEPLOYMENT QUEUE FENCING TEST
 * 
 * Verifies that the effective staging deployment configuration strictly resolves
 * to staging-isolated queue names and does not leak or fall back to production resources.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('Cloudflare Staging Deployment & Queue Fencing Gate', () => {
  const rootDir = path.resolve(__dirname, '../../../');
  const wranglerPath = path.resolve(rootDir, 'wrangler.jsonc');

  it('1. verifies wrangler.jsonc contains strictly isolated staging queue bindings', () => {
    expect(fs.existsSync(wranglerPath)).toBe(true);
    const content = fs.readFileSync(wranglerPath, 'utf-8');
    const cleanContent = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const config = JSON.parse(cleanContent);

    // Staging environment must exist
    expect(config.env).toBeDefined();
    expect(config.env.staging).toBeDefined();

    const staging = config.env.staging;

    // Worker name and environment mode
    expect(staging.name).toBe('orion-9-staging');
    expect(staging.vars?.ORION_RUNTIME_ENVIRONMENT).toBe('STAGING');
    expect(staging.vars?.FIREBASE_PROJECT_ID).toBe('orion-9-staging');

    // Production environment must be separate
    expect(config.name).toBe('orion-9');
    expect(config.env.production?.vars?.ORION_RUNTIME_ENVIRONMENT).toBe('LIVE');

    // Producers must use staging queues
    const producers = staging.queues?.producers || [];
    const scmEvents = producers.find((p: any) => p.binding === 'SCM_EVENTS');
    const dlqEvents = producers.find((p: any) => p.binding === 'SCM_EVENTS_DLQ');

    expect(scmEvents).toBeDefined();
    expect(scmEvents.queue).toBe('orion-scm-events-staging');
    expect(scmEvents.queue).not.toBe('orion-scm-events');

    expect(dlqEvents).toBeDefined();
    expect(dlqEvents.queue).toBe('orion-scm-events-dlq-staging');
    expect(dlqEvents.queue).not.toBe('orion-scm-events-dlq');

    // Consumers must use staging queues
    const consumers = staging.queues?.consumers || [];
    expect(consumers.length).toBeGreaterThanOrEqual(1);
    expect(consumers[0].queue).toBe('orion-scm-events-staging');
    expect(consumers[0].dead_letter_queue).toBe('orion-scm-events-dlq-staging');
  });

  it('2. verifies .wrangler/deploy/config.json does not redirect staging to un-scoped production config', () => {
    const deployRedirectPath = path.resolve(rootDir, '.wrangler/deploy/config.json');
    if (fs.existsSync(deployRedirectPath)) {
      const deployConfig = JSON.parse(fs.readFileSync(deployRedirectPath, 'utf-8'));
      // If redirect exists, it must not point to a config that lacks environments
      const redirectedPath = path.resolve(rootDir, deployConfig.configPath);
      if (fs.existsSync(redirectedPath)) {
        const redirected = JSON.parse(fs.readFileSync(redirectedPath, 'utf-8'));
        expect(redirected.env?.staging?.queues?.producers).toBeDefined();
      }
    } else {
      // Clean state: Wrangler defaults directly to wrangler.jsonc
      expect(fs.existsSync(deployRedirectPath)).toBe(false);
    }
  });

  it('3. verifies wrangler deploy --dry-run --env staging outputs staging queue bindings', () => {
    // Run dry-run and inspect output
    const dryRunOutput = execSync('npx wrangler deploy --dry-run --env staging', {
      cwd: rootDir,
      encoding: 'utf-8',
      env: { ...process.env, CI: 'true' }
    });

    expect(dryRunOutput).toContain('orion-scm-events-staging');
    expect(dryRunOutput).toContain('orion-scm-events-dlq-staging');
    expect(dryRunOutput).toContain('"STAGING"');
    expect(dryRunOutput).toContain('"orion-9-staging"');

    // Must NOT bind production queues in staging
    expect(dryRunOutput).not.toContain('env.SCM_EVENTS (orion-scm-events)');
    expect(dryRunOutput).not.toContain('env.SCM_EVENTS_DLQ (orion-scm-events-dlq)');
  }, 30000);
});
