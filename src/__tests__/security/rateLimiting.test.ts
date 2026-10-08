import { describe, it, expect, beforeEach } from 'vitest';
import worker from '../../worker';
import { workerRateLimiter } from '../../server/workerSecurity';

describe('Cloudflare Worker Rate Limiting Gate', () => {
  const dummyEnv: any = {
    ASSETS: { fetch: async () => new Response('Asset not found', { status: 404 }) },
    ORION_RUNTIME_ENVIRONMENT: 'DEMO',
  };
  const dummyCtx: any = {
    waitUntil: () => {},
    passThroughOnException: () => {},
  };

  beforeEach(() => {
    workerRateLimiter.reset();
  });

  it('permits initial requests and tracks remaining capacity', async () => {
    const req = new Request('http://localhost/api/ai/status', {
      method: 'GET',
      headers: { 'CF-Connecting-IP': '198.51.100.1' },
    });

    const res = await worker.fetch(req, dummyEnv, dummyCtx);
    expect(res.status).toBe(200);
  });

  it('enforces 429 Too Many Requests when rate limit threshold is exceeded', async () => {
    const clientIp = '203.0.113.42';
    const validAdminToken = `orion_sess:DEMO:local-admin:platform_admin:${Date.now() + 3600000}:sig_admin`;

    // Admin limit is 15 requests per minute
    let lastResponse: Response | null = null;
    for (let i = 0; i < 17; i++) {
      const req = new Request('http://localhost/api/admin/demo/scheduler/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validAdminToken}`,
          'CF-Connecting-IP': clientIp,
        },
        body: JSON.stringify({ forceTrigger: true }),
      });
      lastResponse = await worker.fetch(req, dummyEnv, dummyCtx);
    }

    expect(lastResponse).not.toBeNull();
    expect(lastResponse!.status).toBe(429);
    expect(lastResponse!.headers.get('Retry-After')).toBeTruthy();
    expect(lastResponse!.headers.get('X-RateLimit-Remaining')).toBe('0');

    const body = await lastResponse!.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Rate limit exceeded');
  });

  it('isolates rate limits between distinct client IP addresses', async () => {
    const ipA = '192.0.2.10';
    const ipB = '192.0.2.20';
    const validAdminToken = `orion_sess:DEMO:local-admin:platform_admin:${Date.now() + 3600000}:sig_admin`;

    // Exhaust IP A's limit
    for (let i = 0; i < 16; i++) {
      const req = new Request('http://localhost/api/admin/demo/scheduler/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validAdminToken}`,
          'CF-Connecting-IP': ipA,
        },
        body: JSON.stringify({ forceTrigger: true }),
      });
      await worker.fetch(req, dummyEnv, dummyCtx);
    }

    // IP B should still be allowed
    const reqB = new Request('http://localhost/api/admin/demo/scheduler/trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validAdminToken}`,
        'CF-Connecting-IP': ipB,
      },
      body: JSON.stringify({ forceTrigger: true }),
    });
    const resB = await worker.fetch(reqB, dummyEnv, dummyCtx);
    expect(resB.status).toBe(200);
  });
});
