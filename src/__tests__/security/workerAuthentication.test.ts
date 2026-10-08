import { describe, it, expect, beforeEach } from 'vitest';
import worker from '../../worker';
import { workerRateLimiter } from '../../server/workerSecurity';

describe('Cloudflare Worker Edge Authentication & Authorization Gate', () => {
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

  describe('AI Endpoints Authentication (POST /api/ai/choose-tools & POST /api/ai/insight)', () => {
    it('rejects unauthenticated request to /api/ai/choose-tools with 401', async () => {
      const req = new Request('http://localhost/api/ai/choose-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Check overdue POs' }),
      });

      const res = await worker.fetch(req, dummyEnv, dummyCtx);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('Authentication required');
    });

    it('rejects request with invalid token to /api/ai/insight with 401', async () => {
      const req = new Request('http://localhost/api/ai/insight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer forged-invalid-token',
        },
        body: JSON.stringify({ prompt: 'Summary', dataContext: {} }),
      });

      const res = await worker.fetch(req, dummyEnv, dummyCtx);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain('Invalid or unrecognized authentication token');
    });

    it('rejects expired token with 401', async () => {
      const expiredTimestamp = Date.now() - 100000;
      const expiredToken = `orion_sess:DEMO:local-user:user:${expiredTimestamp}:sig_user`;

      const req = new Request('http://localhost/api/ai/choose-tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${expiredToken}`,
        },
        body: JSON.stringify({ prompt: 'Hello' }),
      });

      const res = await worker.fetch(req, dummyEnv, dummyCtx);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain('expired');
    });

    it('allows valid user token on standard AI endpoint (200 OK)', async () => {
      const validToken = `orion_sess:DEMO:local-user:user:${Date.now() + 3600000}:sig_user`;

      const req = new Request('http://localhost/api/ai/choose-tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({ prompt: 'hello' }),
      });

      const res = await worker.fetch(req, dummyEnv, dummyCtx);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.toolsToCall)).toBe(true);
    });
  });

  describe('Admin Endpoints Authorization Gate (POST /api/ai/platform-intelligence & Scheduler)', () => {
    it('rejects normal user on admin endpoint /api/ai/platform-intelligence with 403 Forbidden', async () => {
      const normalUserToken = `orion_sess:DEMO:local-user:user:${Date.now() + 3600000}:sig_user`;

      const req = new Request('http://localhost/api/ai/platform-intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${normalUserToken}`,
        },
        body: JSON.stringify({ dataContext: {} }),
      });

      const res = await worker.fetch(req, dummyEnv, dummyCtx);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('Administrator privileges required');
    });

    it('rejects normal user on scheduler trigger with 403 Forbidden', async () => {
      const normalUserToken = `orion_sess:DEMO:local-user:user:${Date.now() + 3600000}:sig_user`;

      const req = new Request('http://localhost/api/admin/demo/scheduler/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${normalUserToken}`,
        },
        body: JSON.stringify({ forceTrigger: true }),
      });

      const res = await worker.fetch(req, dummyEnv, dummyCtx);
      expect(res.status).toBe(403);
    });

    it('allows verified admin on admin endpoints', async () => {
      const adminToken = `orion_sess:DEMO:local-admin:platform_admin:${Date.now() + 3600000}:sig_admin`;

      const req = new Request('http://localhost/api/admin/demo/scheduler/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ forceTrigger: true }),
      });

      const res = await worker.fetch(req, dummyEnv, dummyCtx);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.action).toBe('MANUAL_TRIGGER_COMPLETED');
    });
  });

  describe('Wallpaper AI Endpoint Authentication Gate', () => {
    it('rejects unauthenticated wallpaper generation with 401', async () => {
      const req = new Request('http://localhost/api/wallpaper/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Dark Minimalist Cyberpunk' }),
      });

      const res = await worker.fetch(req, dummyEnv, dummyCtx);
      expect(res.status).toBe(401);
    });
  });
});
