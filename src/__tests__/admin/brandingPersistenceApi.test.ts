import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import worker from '../../worker';
import {
  getDurableBranding,
  saveDurableBranding,
  resetDurableBranding,
  getDurableBrandingAsset,
  toFirestoreFields,
  fromFirestoreFields,
} from '../../server/brandingBackend';
import {
  BrandingService,
  defaultBranding,
  normalizeBranding,
  PRIMARY_BRANDING_KEY,
  LEGACY_BRANDING_KEY,
} from '../../repositories/BrandingRepository';

// In-memory Storage mock for Node test runner
class StorageMock {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = new StorageMock();
}
if (typeof globalThis.sessionStorage === 'undefined') {
  (globalThis as any).sessionStorage = new StorageMock();
}
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = globalThis;
}
if (!(globalThis as any).window.location) {
  (globalThis as any).window.location = {
    origin: 'https://orion-9.ayushprakash0021.workers.dev',
    protocol: 'https:',
  };
}

const listeners: Record<string, Function[]> = {};
if (typeof (globalThis as any).window.addEventListener === 'undefined') {
  (globalThis as any).window.addEventListener = (event: string, cb: Function) => {
    listeners[event] = listeners[event] || [];
    listeners[event].push(cb);
  };
  (globalThis as any).window.removeEventListener = (event: string, cb: Function) => {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter(fn => fn !== cb);
    }
  };
  (globalThis as any).window.dispatchEvent = (event: any) => {
    const type = event.type || event;
    const cbs = listeners[type] || [];
    cbs.forEach(cb => cb(event));
    return true;
  };
}

describe('ORION-9 Global Creator Identity & Platform Branding Persistence', () => {
  const sample1x1Png =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const validAdminToken = `orion_sess:DEMO:local-admin:platform_admin:${Date.now() + 3600 * 1000}:sig_admin`;
  const validUserToken = `orion_sess:DEMO:local-user:user:${Date.now() + 3600 * 1000}:sig_user`;

  const dummyEnv = {
    ASSETS: { fetch: async () => new Response('Asset not found', { status: 404 }) },
    ORION_RUNTIME_ENVIRONMENT: 'DEMO',
  };

  const dummyCtx = {
    waitUntil: () => {},
    passThroughOnException: () => {},
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('1. Data Mapping & Firestore Utilities', () => {
    it('accurately round-trips complex branding structures through Firestore fields', () => {
      const input = {
        appName: 'ORION-9 TEST',
        version: '9.4.2',
        creatorName: 'Ayush Prakash',
        logoIncludesName: true,
        creatorPhotoUrl: '/api/branding/assets/creator_photo?v=123',
        founderNote: 'Test founder note text',
      };

      const firestoreFields = toFirestoreFields(input);
      expect(firestoreFields.appName).toEqual({ stringValue: 'ORION-9 TEST' });
      expect(firestoreFields.logoIncludesName).toEqual({ booleanValue: true });

      const reconstructed = fromFirestoreFields(firestoreFields);
      expect(reconstructed).toEqual(input);
    });

    it('normalizes branding correctly with full creator identity fallback fields', () => {
      const empty = normalizeBranding({});
      expect(empty.creatorName).toBe(defaultBranding.creatorName);
      expect(empty.creatorTitle).toBe(defaultBranding.creatorTitle);
      expect(empty.creatorQuote).toBe(defaultBranding.creatorQuote);
      expect(empty.founderNote).toBe(defaultBranding.founderNote);
      expect(empty.creatorPhotoUrl).toBeNull();
    });
  });

  describe('2. Cloudflare Worker API Contract (/api/branding)', () => {
    it('GET /api/branding returns { success: true, data: BrandingConfig } with 200 OK', async () => {
      const req = new Request('https://orion-9.ayushprakash0021.workers.dev/api/branding', {
        method: 'GET',
      });

      const res = await worker.fetch(req, dummyEnv, dummyCtx);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.data.appName).toBeDefined();
      expect(json.data.creatorName).toBeDefined();
    });

    it('PUT /api/branding without Authorization header returns 401 Unauthorized', async () => {
      const req = new Request('https://orion-9.ayushprakash0021.workers.dev/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorName: 'Unauthorized Update' }),
      });

      const res = await worker.fetch(req, dummyEnv, dummyCtx);
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/Authentication required/i);
    });

    it('PUT /api/branding with non-admin user role returns 403 Forbidden', async () => {
      const req = new Request('https://orion-9.ayushprakash0021.workers.dev/api/branding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validUserToken}`,
        },
        body: JSON.stringify({ creatorName: 'Non-Admin Hacker' }),
      });

      const res = await worker.fetch(req, dummyEnv, dummyCtx);
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/Administrative privileges required/i);
    });

    it('PUT /api/branding with valid admin token persists creator identity & platform branding', async () => {
      const payload = {
        appName: 'ORION-9 SCM OS',
        creatorName: 'Ayush Prakash',
        creatorTitle: 'Creator & Supply Chain OS Architect',
        creatorQuote: 'Dynamic networks require dynamic operating systems.',
        creatorPhotoUrl: sample1x1Png,
        founderNote: 'Orion-9 unified operational intelligence.',
      };

      const req = new Request('https://orion-9.ayushprakash0021.workers.dev/api/branding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validAdminToken}`,
        },
        body: JSON.stringify(payload),
      });

      const res = await worker.fetch(req, dummyEnv, dummyCtx);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.appName).toBe('ORION-9 SCM OS');
      expect(json.data.creatorName).toBe('Ayush Prakash');
      expect(json.data.creatorQuote).toBe('Dynamic networks require dynamic operating systems.');
      // Base64 image should be converted to durable asset URL
      expect(json.data.creatorPhotoUrl).toMatch(/^\/api\/branding\/assets\/creator_photo\?v=/);
    });

    it('GET /api/branding/assets/creator_photo serves binary image with valid Content-Type', async () => {
      const req = new Request(
        'https://orion-9.ayushprakash0021.workers.dev/api/branding/assets/creator_photo',
        { method: 'GET' }
      );

      const res = await worker.fetch(req, dummyEnv, dummyCtx);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('image/png');

      const arrayBuffer = await res.arrayBuffer();
      expect(arrayBuffer.byteLength).toBeGreaterThan(0);
    });

    it('DELETE /api/branding with valid admin token resets branding and clears durable assets', async () => {
      const req = new Request('https://orion-9.ayushprakash0021.workers.dev/api/branding', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${validAdminToken}`,
        },
      });

      const res = await worker.fetch(req, dummyEnv, dummyCtx);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.appName).toBe(defaultBranding.appName);
      expect(json.data.creatorPhotoUrl).toBeNull();
    });

    it('DELETE /api/branding without Authorization returns 401 Unauthorized', async () => {
      const req = new Request('https://orion-9.ayushprakash0021.workers.dev/api/branding', {
        method: 'DELETE',
      });

      const res = await worker.fetch(req, dummyEnv, dummyCtx);
      expect(res.status).toBe(401);
    });
  });

  describe('3. Client BrandingRepository Workflow & Outage Resilience', () => {
    it('saveBranding attaches Bearer Authorization header from auth session', async () => {
      // Seed admin session in localStorage
      localStorage.setItem(
        'orion_auth_session',
        JSON.stringify({
          role: 'platform_admin',
          environment: 'DEMO',
          token: validAdminToken,
        })
      );

      let capturedAuthHeader: string | null = null;
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any, init: any) => {
        const u = String(url);
        if (u.includes('/api/branding')) {
          if (init?.method === 'PUT') {
            capturedAuthHeader = init?.headers?.['Authorization'] || null;
          }
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                ...defaultBranding,
                creatorName: 'Ayush Prakash (Saved)',
                creatorPhotoUrl: '/api/branding/assets/creator_photo?v=999',
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response('Not found', { status: 404 });
      });

      const service = new BrandingService();
      const result = await service.saveBranding({
        creatorName: 'Ayush Prakash (Saved)',
      });

      expect(capturedAuthHeader).toBe(`Bearer ${validAdminToken}`);
      expect(result.success).toBe(true);
      expect(result.method).toBe('remote');
      expect(result.config.creatorName).toBe('Ayush Prakash (Saved)');
      expect(result.config.creatorPhotoUrl).toBe('/api/branding/assets/creator_photo?v=999');

      // Local cache was updated with the confirmed backend data
      const cached = JSON.parse(localStorage.getItem(PRIMARY_BRANDING_KEY)!);
      expect(cached.creatorName).toBe('Ayush Prakash (Saved)');
      expect(cached.creatorPhotoUrl).toBe('/api/branding/assets/creator_photo?v=999');
    }, 15000);

    it('saveBranding strictly throws on server 401/403/500 error and NEVER falsely claims local success', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
        if (String(url).includes('/api/branding')) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Forbidden: Administrative privileges required.',
            }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response('Not found', { status: 404 });
      });

      const service = new BrandingService();
      await expect(
        service.saveBranding({ creatorName: 'Malicious Attempt' })
      ).rejects.toThrow(/Administrative privileges required/i);
    });

    it('saveBranding strictly throws on network outage when remote API is configured', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
        if (String(url).includes('/api/branding')) {
          throw new TypeError('Failed to fetch (Network connection lost)');
        }
        return new Response('Not found', { status: 404 });
      });

      const service = new BrandingService();
      await expect(
        service.saveBranding({ creatorName: 'Offline Test' })
      ).rejects.toThrow(/Remote branding save network error/i);
    });

    it('dispatches CREATOR_IDENTITY_PHOTO_CHANGED and orion-branding-updated window events on successful save', async () => {
      let brandingUpdatedFired = false;
      let photoChangedDetail: any = null;

      const onBrandingUpdated = () => {
        brandingUpdatedFired = true;
      };
      const onPhotoChanged = (e: any) => {
        photoChangedDetail = e.detail;
      };

      window.addEventListener('orion-branding-updated', onBrandingUpdated);
      window.addEventListener('CREATOR_IDENTITY_PHOTO_CHANGED', onPhotoChanged);

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
        if (String(url).includes('/api/branding')) {
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                ...defaultBranding,
                creatorPhotoUrl: '/api/branding/assets/creator_photo?v=42',
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response('Not found', { status: 404 });
      });

      const service = new BrandingService();
      await service.saveBranding({ creatorPhotoUrl: sample1x1Png });

      expect(brandingUpdatedFired).toBe(true);
      expect(photoChangedDetail).toEqual({ photoUrl: '/api/branding/assets/creator_photo?v=42' });

      window.removeEventListener('orion-branding-updated', onBrandingUpdated);
      window.removeEventListener('CREATOR_IDENTITY_PHOTO_CHANGED', onPhotoChanged);
    });

    it('resetBranding sends DELETE /api/branding with Bearer token and resets local state', async () => {
      localStorage.setItem(
        'orion_auth_session',
        JSON.stringify({ role: 'platform_admin', environment: 'DEMO', token: validAdminToken })
      );

      let methodUsed = '';
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any, init: any) => {
        if (String(url).includes('/api/branding')) {
          methodUsed = init?.method || 'GET';
          return new Response(
            JSON.stringify({
              success: true,
              data: defaultBranding,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response('Not found', { status: 404 });
      });

      const service = new BrandingService();
      const resetConfig = await service.resetBranding();

      expect(methodUsed).toBe('DELETE');
      expect(resetConfig.appName).toBe(defaultBranding.appName);
      expect(resetConfig.creatorPhotoUrl).toBeNull();
      expect(localStorage.getItem(PRIMARY_BRANDING_KEY)).toBeNull();
    });
  });
});
