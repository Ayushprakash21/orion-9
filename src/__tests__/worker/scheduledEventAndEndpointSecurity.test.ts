import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from '../../worker';
import { outboxDispatcher } from '../../enterprise/events/OutboxDispatcher';
import { dbManager } from '../../core/database/DatabaseConnectionManager';

describe('ORION-9 Scheduled Event Handler & Endpoint Security', () => {
  const dummyCtx: any = {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn()
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    dbManager.switchEnvironment({
      targetEnvironment: 'DEMO',
      actorUserId: 'admin_1',
      actorRole: 'platform_admin',
      callerType: 'human_admin',
      stepUpConfirmed: true,
      reason: 'Reset to demo for test'
    });
  });

  describe('Cloudflare Worker Scheduled Event Handler', () => {
    it('executes outbox dispatcher and surfaces logs during scheduled cron trigger', async () => {
      const dispatchSpy = vi.spyOn(outboxDispatcher, 'dispatch').mockResolvedValue({
        workerId: 'worker-cron-test',
        scanned: 2,
        claimed: 2,
        published: 2,
        failed: 0,
        quarantined: 0,
        skipped: 0,
        durationMs: 15,
        records: []
      });

      const mockEnv: any = {
        SCM_EVENTS: { send: vi.fn(), sendBatch: vi.fn() },
        SCM_EVENTS_DLQ: { send: vi.fn(), sendBatch: vi.fn() },
        ORION_RUNTIME_ENVIRONMENT: 'DEMO'
      };

      const controller = {
        scheduledTime: Date.now(),
        cron: '0 * * * *'
      };

      await worker.scheduled(controller, mockEnv, dummyCtx);

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      expect(dispatchSpy).toHaveBeenCalledWith({
        queue: mockEnv.SCM_EVENTS,
        dlq: mockEnv.SCM_EVENTS_DLQ,
        isLive: false,
        environment: 'DEMO'
      });
    });

    it('surfaces dispatcher exceptions gracefully without crashing scheduled execution', async () => {
      vi.spyOn(outboxDispatcher, 'dispatch').mockRejectedValue(new Error('Transient internal error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockEnv: any = {
        ORION_RUNTIME_ENVIRONMENT: 'DEMO'
      };

      const controller = {
        scheduledTime: Date.now(),
        cron: '0 * * * *'
      };

      // Should complete without throwing an unhandled rejection
      await expect(worker.scheduled(controller, mockEnv, dummyCtx)).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ORION-SCHEDULER] Outbox dispatch failed:'),
        expect.any(Error)
      );
    });
  });

  describe('Outbox Manual Dispatch Endpoint Security', () => {
    const mockEnv: any = {
      ASSETS: { fetch: vi.fn() },
      ORION_RUNTIME_ENVIRONMENT: 'DEMO'
    };

    it('rejects unauthenticated requests to /api/scm/events/dispatch with 401', async () => {
      const request = new Request('https://orion9.test/api/scm/events/dispatch', {
        method: 'POST'
      });

      const response = await worker.fetch(request, mockEnv, dummyCtx);
      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    it('rejects non-admin users with 403 Forbidden', async () => {
      // Create user token with role 'standard_user'
      const payload = {
        uid: 'user_regular_1',
        email: 'user@orion9.test',
        role: 'viewer',
        tenantId: 'tenant_1',
        iss: 'https://securetoken.google.com/orion9-dev-db-2026',
        aud: 'orion9-dev-db-2026',
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      const token = `header.${btoa(JSON.stringify(payload))}.sig`;

      const request = new Request('https://orion9.test/api/scm/events/dispatch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const response = await worker.fetch(request, mockEnv, dummyCtx);
      expect(response.status).toBe(403);
    });

    it('authorizes platform_admin to trigger manual dispatch', async () => {
      const payload = {
        uid: 'admin_sys_1',
        email: 'admin@orion9.test',
        role: 'platform_admin',
        tenantId: 'tenant_platform',
        iss: 'https://securetoken.google.com/orion9-dev-db-2026',
        aud: 'orion9-dev-db-2026',
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      const token = `header.${btoa(JSON.stringify(payload))}.sig`;

      vi.spyOn(outboxDispatcher, 'dispatch').mockResolvedValueOnce({
        workerId: 'worker-admin-manual',
        scanned: 1,
        claimed: 1,
        published: 1,
        failed: 0,
        quarantined: 0,
        skipped: 0,
        durationMs: 5,
        records: []
      });

      const request = new Request('https://orion9.test/api/scm/events/dispatch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const response = await worker.fetch(request, mockEnv, dummyCtx);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.summary.workerId).toBe('worker-admin-manual');
    });
  });

  describe('Health Endpoints Security & Privacy', () => {
    it('/health returns clean status and does not expose secrets or internal DB credentials', async () => {
      const mockEnv: any = {
        ASSETS: { fetch: vi.fn() },
        FIREBASE_API_KEY: 'secret_firebase_key',
        FIREBASE_PROJECT_ID: 'internal_project_db',
        SCM_EVENTS: {}
      };

      const request = new Request('https://orion9.test/health', {
        method: 'GET'
      });

      const response = await worker.fetch(request, mockEnv, dummyCtx);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.status).toBe('ok');
      expect(body.service).toBe('orion-9');
      expect(body.queueConfigured).toBe(true);

      // Verify no leak of credentials
      const bodyStr = JSON.stringify(body);
      expect(bodyStr).not.toContain('secret_firebase_key');
      expect(bodyStr).not.toContain('internal_project_db');
    });
  });

  describe('Desktop Installer Download & Non-SPA Guard Security', () => {
    it('/api/download/desktop/status returns authoritative metadata and package information', async () => {
      const mockEnv: any = {
        ASSETS: { fetch: vi.fn() }
      };

      const request = new Request('https://orion9.test/api/download/desktop/status', { method: 'GET' });
      const response = await worker.fetch(request, mockEnv, dummyCtx);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('application/json');

      const body = await response.json();
      expect(body.available).toBe(true);
      expect(body.version).toBe('9.0.0');
      expect(body.platform).toBe('windows-x64');
      expect(body.sizeBytes).toBe(30336791);
      expect(body.sha256).toBe('e2dfeb480522b9da077bb58e0954d6d8e09f1023fb6af28b8b74b2a8dc23ee70');
    });

    it('/api/download/desktop returns honest 404 JSON explaining Cloudflare 25 MiB asset limit without returning HTML', async () => {
      const mockEnv: any = {
        ASSETS: { fetch: vi.fn() }
      };

      const request = new Request('https://orion9.test/api/download/desktop', { method: 'GET' });
      const response = await worker.fetch(request, mockEnv, dummyCtx);
      expect(response.status).toBe(404);
      expect(response.headers.get('Content-Type')).toContain('application/json');

      const body = await response.json();
      expect(body.available).toBe(false);
      expect(body.error).toBe('HOSTING_LIMITATION_CLOUDFLARE');
      expect(body.localArtifactPath).toBe('src-tauri/target/release/bundle/nsis/Orion-9_9.0.0_x64-setup.exe');
      expect(mockEnv.ASSETS.fetch).not.toHaveBeenCalled();
    });

    it('/downloads/Orion-9-Setup.exe returns honest 404 JSON and never falls back to SPA index.html', async () => {
      const mockEnv: any = {
        ASSETS: { fetch: vi.fn().mockResolvedValue(new Response('<!doctype html><html>', { status: 200, headers: { 'Content-Type': 'text/html' } })) }
      };

      const request = new Request('https://orion9.test/downloads/Orion-9-Setup.exe', { method: 'GET' });
      const response = await worker.fetch(request, mockEnv, dummyCtx);
      expect(response.status).toBe(404);
      expect(response.headers.get('Content-Type')).toContain('application/json');

      const body = await response.json();
      expect(body.available).toBe(false);
      expect(body.error).toBe('HOSTING_LIMITATION_CLOUDFLARE');
      // Verifies env.ASSETS.fetch was NOT called, preventing SPA HTML fallback
      expect(mockEnv.ASSETS.fetch).not.toHaveBeenCalled();
    });

    it('arbitrary missing .exe download paths are caught by non-SPA guard and return 404 JSON', async () => {
      const mockEnv: any = {
        ASSETS: { fetch: vi.fn().mockResolvedValue(new Response('<!doctype html><html>', { status: 200, headers: { 'Content-Type': 'text/html' } })) }
      };

      const request = new Request('https://orion9.test/downloads/unknown_setup.exe', { method: 'GET' });
      const response = await worker.fetch(request, mockEnv, dummyCtx);
      expect(response.status).toBe(404);
      expect(response.headers.get('Content-Type')).toContain('application/json');

      const body = await response.json();
      expect(body.error).toBe('NOT_FOUND');
      expect(mockEnv.ASSETS.fetch).not.toHaveBeenCalled();
    });
  });
});
