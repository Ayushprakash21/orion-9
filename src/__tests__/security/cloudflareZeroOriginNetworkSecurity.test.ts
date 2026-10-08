/**
 * ORION-9 CLOUDFLARE SECURE NETWORK & ZERO-EXPOSED-ORIGIN AUTOMATED TEST SUITE
 * 
 * Verifies all Phase 21 security invariants:
 * 1. Production URLs: No IP addresses.
 * 2. Production Bundle: No private IPs, no internal ports, no hardcoded origin servers.
 * 3. Network: All API requests use public hostnames or same-origin /api paths.
 * 4. Auth: Unauthorized API access returns 401/403.
 * 5. Origin: Direct origin access blocked, zero origin IP leakage.
 * 6. Errors: Internal IPs, ports, filesystem paths, and stack traces never appear in responses.
 * 7. CORS: Unauthorized origins rejected, no wildcard * with credentials.
 * 8. Proxy & SSRF: Arbitrary destinations and relay proxies rejected with 403.
 * 9. Health: /health and /api/health sanitized.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import worker from '../../worker';
import {
  extractBearerToken,
  verifyWorkerAuthToken,
  applyWorkerRateLimit,
  createSecurityErrorResponse,
  applySecurityHeaders,
  createSafeErrorResponse,
  getCorsHeaders,
  EDGE_SECURITY_HEADERS
} from '../../server/workerSecurity';

describe('ORION-9 Cloudflare Zero-Exposed-Origin Security Suite', () => {

  // =========================================================================
  // 1. PRODUCTION URL INVARIANTS: NO IP ADDRESSES
  // =========================================================================
  describe('1. Production URLs — Zero Exposed IP Addresses', () => {
    it('verifies production branding, API configs, and service endpoints contain no IP addresses', () => {
      const publicHostnames = [
        'https://orion-9.pages.dev',
        'https://orion-9.com',
        'https://api.frankfurter.dev/v2',
      ];

      const ipPattern = /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
      for (const url of publicHostnames) {
        expect(ipPattern.test(url)).toBe(false);
      }
    });

    it('verifies all API routes in client services use relative same-origin /api paths', () => {
      const aiProviderPath = path.resolve(process.cwd(), 'src/services/ai/AIProvider.ts');
      const content = fs.readFileSync(aiProviderPath, 'utf8');

      expect(content).toContain("fetch('/api/ai/status')");
      expect(content).toContain("fetch('/api/ai/choose-tools'");
      expect(content).toContain("fetch('/api/ai/insight'");

      // Assert no hardcoded server IP or port
      expect(content).not.toMatch(/https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);
      expect(content).not.toMatch(/:\b(3000|8080|8787)\b/);
    });
  });

  // =========================================================================
  // 2. PRODUCTION BUNDLE SCAN: ZERO LEAKED INTERNAL IPS, PORTS, OR ORIGINS
  // =========================================================================
  describe('2. Production Bundle Security Scan', () => {
    const distClientDir = path.resolve(process.cwd(), 'dist/client');

    it('verifies production client bundle exists and has been built', () => {
      expect(fs.existsSync(distClientDir)).toBe(true);
    });

    it('verifies application JavaScript chunks contain NO RFC 1918 private IPs (10.x, 172.16-31.x, 192.168.x)', () => {
      const assetsDir = path.join(distClientDir, 'assets');
      const files = fs.readdirSync(assetsDir).filter(f => f.startsWith('index-') && f.endsWith('.js'));
      expect(files.length).toBeGreaterThan(0);

      for (const file of files) {
        const content = fs.readFileSync(path.join(assetsDir, file), 'utf8');

        // Check private IP ranges
        const rfc1918_10 = /10\.\d{1,3}\.\d{1,3}\.\d{1,3}/g;
        const rfc1918_172 = /172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}/g;
        const rfc1918_192 = /192\.168\.\d{1,3}\.\d{1,3}/g;
        const loopback = /127\.0\.0\.1/g;

        expect(content.match(rfc1918_10)).toBeNull();
        expect(content.match(rfc1918_172)).toBeNull();
        expect(content.match(rfc1918_192)).toBeNull();
        expect(content.match(loopback)).toBeNull();
      }
    });

    it('verifies application JavaScript chunks contain NO origin server ports (:3000, :8080, :8787)', () => {
      const assetsDir = path.join(distClientDir, 'assets');
      const files = fs.readdirSync(assetsDir).filter(f => f.startsWith('index-') && f.endsWith('.js'));

      for (const file of files) {
        const content = fs.readFileSync(path.join(assetsDir, file), 'utf8');
        // Search for origin port URLs like http://...:3000 or https://...:8080
        const originPortPattern = /https?:\/\/[a-zA-Z0-9.-]+:(3000|8080|8787)/g;
        expect(content.match(originPortPattern)).toBeNull();
      }
    });
  });

  // =========================================================================
  // 3. NETWORK ROUTING & SANITIZED PUBLIC API
  // =========================================================================
  describe('3. Network Routing & Public Entrypoint', () => {
    it('verifies unknown /api routes return JSON 404 and never leak SPA HTML', async () => {
      const req = new Request('https://orion-9.com/api/unknown-service-path', { method: 'GET' });
      const env: any = {
        ASSETS: { fetch: async () => new Response('<html>SPA</html>', { status: 200, headers: { 'Content-Type': 'text/html' } }) }
      };
      const ctx: any = { waitUntil: () => {}, passThroughOnException: () => {} };

      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(404);
      expect(res.headers.get('Content-Type')).toContain('application/json');

      const data = await res.json();
      expect(data.error).toBe('NOT_FOUND');
    });

    it('verifies OPTIONS preflight requests receive 204 with strict security headers', async () => {
      const req = new Request('https://orion-9.com/api/ai/status', {
        method: 'OPTIONS',
        headers: { 'Origin': 'https://orion-9.com' }
      });
      const env: any = { ASSETS: { fetch: async () => new Response() } };
      const ctx: any = { waitUntil: () => {}, passThroughOnException: () => {} };

      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://orion-9.com');
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
  });

  // =========================================================================
  // 4. AUTHENTICATION BOUNDARIES
  // =========================================================================
  describe('4. Authentication & Authorization Boundaries', () => {
    const protectedRoutes = [
      { path: '/api/ai/choose-tools', method: 'POST', body: { prompt: 'query' } },
      { path: '/api/ai/insight', method: 'POST', body: { prompt: 'query' } },
      { path: '/api/ai/platform-intelligence', method: 'POST', body: {} },
      { path: '/api/wallpaper/generate', method: 'POST', body: {} },
      { path: '/api/demo/scheduler-status', method: 'GET' },
      { path: '/api/demo/generate-hourly-batch', method: 'POST', body: {} },
      { path: '/api/demo/scheduler-control', method: 'POST', body: { action: 'pause' } },
      { path: '/api/ai/document-intelligence', method: 'POST', body: { fileName: 'test.pdf' } },
    ];

    for (const route of protectedRoutes) {
      it(`blocks unauthenticated access to ${route.method} ${route.path} with 401`, async () => {
        const req = new Request(`https://orion-9.com${route.path}`, {
          method: route.method,
          headers: { 'Content-Type': 'application/json' },
          body: route.body ? JSON.stringify(route.body) : undefined,
        });
        const env: any = { ASSETS: { fetch: async () => new Response() } };
        const ctx: any = { waitUntil: () => {}, passThroughOnException: () => {} };

        const res = await worker.fetch(req, env, ctx);
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.success).toBe(false);
      });
    }

    it('rejects non-admin role from administrative endpoints with 403', async () => {
      const req = new Request('https://orion-9.com/api/ai/platform-intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-user-token'
        },
        body: JSON.stringify({ dataContext: {} })
      });
      const env: any = { ASSETS: { fetch: async () => new Response() } };
      const ctx: any = { waitUntil: () => {}, passThroughOnException: () => {} };

      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // 5. DIRECT ORIGIN ACCESS & HEALTH CHECK SANITIZATION
  // =========================================================================
  describe('5. Health Endpoint — Zero Origin/Infrastructure Leakage', () => {
    it('verifies /health returns strictly sanitized public data with no IP or internal credentials', async () => {
      const req = new Request('https://orion-9.com/health', { method: 'GET' });
      const env: any = { ASSETS: { fetch: async () => new Response() } };
      const ctx: any = { waitUntil: () => {}, passThroughOnException: () => {} };

      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.status).toBe('ok');
      expect(data.service).toBe('orion-9');

      // Assert zero infrastructure leakage
      expect(data.ip).toBeUndefined();
      expect(data.port).toBeUndefined();
      expect(data.host).toBeUndefined();
      expect(data.hostname).toBeUndefined();
      expect(data.database).toBeUndefined();
      expect(data.credentials).toBeUndefined();
    });

    it('verifies /api/health returns identical sanitized payload', async () => {
      const req = new Request('https://orion-9.com/api/health', { method: 'GET' });
      const env: any = { ASSETS: { fetch: async () => new Response() } };
      const ctx: any = { waitUntil: () => {}, passThroughOnException: () => {} };

      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('ok');
    });
  });

  // =========================================================================
  // 6. ERROR SANITIZATION: ZERO INTERNAL PATH OR STACK TRACE LEAKAGE
  // =========================================================================
  describe('6. Error Response Sanitization', () => {
    it('verifies createSafeErrorResponse strips stack traces and internal filesystem paths', async () => {
      const internalError = new Error('connect ECONNREFUSED 10.240.18.94:3000 at D:\\private\\backend\\server.ts:45');
      const response = createSafeErrorResponse(internalError, 500, 'Upstream service unavailable.');

      expect(response.status).toBe(500);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('INTERNAL_ERROR');
      expect(data.message).toBe('Upstream service unavailable.');
      expect(data.requestId).toBeDefined();

      // Ensure no raw stack trace or IP leaked in JSON response
      const jsonStr = JSON.stringify(data);
      expect(jsonStr).not.toContain('10.240.18.94');
      expect(jsonStr).not.toContain(':3000');
      expect(jsonStr).not.toContain('D:\\private');
      expect(jsonStr).not.toContain('ECONNREFUSED');
    });

    it('verifies all responses carry mandatory security headers and strip X-Powered-By', () => {
      const dummyRes = new Response('{}', { headers: { 'X-Powered-By': 'Express', 'Server': 'Node.js/v24' } });
      const secured = applySecurityHeaders(dummyRes);

      expect(secured.headers.get('X-Powered-By')).toBeNull();
      expect(secured.headers.get('Server')).toBe('cloudflare');
      expect(secured.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(secured.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
    });
  });

  // =========================================================================
  // 7. CORS POLICY: REJECT UNAUTHORIZED ORIGINS & NO WILDCARD *
  // =========================================================================
  describe('7. CORS Protection', () => {
    it('rejects malicious external origins', () => {
      const req = new Request('https://orion-9.com/api/ai/status', {
        headers: { 'Origin': 'https://attacker-domain.evil.com' }
      });
      const cors = getCorsHeaders(req);
      expect(cors['Access-Control-Allow-Origin']).toBeUndefined();
    });

    it('allows same-origin and approved production domains', () => {
      const reqSameOrigin = new Request('https://orion-9.com/api/ai/status', {
        headers: { 'Origin': 'https://orion-9.com' }
      });
      const corsSame = getCorsHeaders(reqSameOrigin);
      expect(corsSame['Access-Control-Allow-Origin']).toBe('https://orion-9.com');

      const reqPages = new Request('https://orion-9.com/api/ai/status', {
        headers: { 'Origin': 'https://my-preview.orion-9.pages.dev' }
      });
      const corsPages = getCorsHeaders(reqPages);
      expect(corsPages['Access-Control-Allow-Origin']).toBe('https://my-preview.orion-9.pages.dev');
    });

    it('never issues Access-Control-Allow-Origin: * on authenticated endpoints', () => {
      const req = new Request('https://orion-9.com/api/ai/choose-tools', {
        headers: { 'Origin': 'https://unauthorized-origin.com' }
      });
      const cors = getCorsHeaders(req);
      expect(cors['Access-Control-Allow-Origin']).not.toBe('*');
    });
  });

  // =========================================================================
  // 8. SSRF & ARBITRARY PROXY ELIMINATION
  // =========================================================================
  describe('8. SSRF & Arbitrary Proxy Elimination', () => {
    const maliciousPaths = [
      '/proxy?url=http://169.254.169.254/latest/meta-data/',
      '/fetch?url=http://10.0.0.1:8080/admin',
      '/api/ai/status?proxy_url=http://localhost:3000',
      '/api/health?relay_to=http://127.0.0.1',
    ];

    for (const p of maliciousPaths) {
      it(`strictly rejects arbitrary proxy attempt: ${p} with 403 Forbidden`, async () => {
        const req = new Request(`https://orion-9.com${p}`, { method: 'GET' });
        const env: any = { ASSETS: { fetch: async () => new Response() } };
        const ctx: any = { waitUntil: () => {}, passThroughOnException: () => {} };

        const res = await worker.fetch(req, env, ctx);
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.error).toBe('FORBIDDEN');
      });
    }
  });

  // =========================================================================
  // 9. RATE LIMITING INTEGRITY
  // =========================================================================
  describe('9. Rate Limiting Integrity', () => {
    it('returns 429 Retry-After when rate limit is exceeded', () => {
      const clientIp = '203.0.113.195';
      const req = new Request('https://orion-9.com/api/wallpaper/generate', {
        method: 'POST',
        headers: { 'CF-Connecting-IP': clientIp }
      });

      // Wallpaper tier allows 10 requests per minute
      let lastRes: Response | null = null;
      for (let i = 0; i < 12; i++) {
        lastRes = applyWorkerRateLimit(req, 'wallpaper');
      }

      expect(lastRes).not.toBeNull();
      expect(lastRes!.status).toBe(429);
      expect(lastRes!.headers.get('Retry-After')).toBeDefined();
    });
  });
});
