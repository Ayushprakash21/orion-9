import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  resolveApiKey,
  resolveProjectId,
  sanitizeErrorMessage,
  FIREBASE_PROJECT_ID,
} from '../../server/brandingBackend';
import worker from '../../worker';

describe('ORION-9 Secret Exposure Remediation & Fail-Closed Credential Gates', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    delete process.env.FIREBASE_API_KEY;
    delete process.env.VITE_FIREBASE_API_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('1. Backend Credential Fail-Closed Architecture', () => {
    it('resolveApiKey strictly fails closed and throws when no credentials are provided', () => {
      expect(() => resolveApiKey()).toThrow(/Firebase API key is not configured/i);
      expect(() => resolveApiKey('')).toThrow(/Firebase API key is not configured/i);
      expect(() => resolveApiKey('   ')).toThrow(/Firebase API key is not configured/i);
    });

    it('resolveApiKey accepts and trims explicitly supplied credential parameter', () => {
      const explicit = '  explicit-test-key-12345  ';
      const resolved = resolveApiKey(explicit);
      expect(resolved).toBe('explicit-test-key-12345');
    });

    it('resolveApiKey reads FIREBASE_API_KEY from environment binding', () => {
      process.env.FIREBASE_API_KEY = 'env-bound-server-key-67890';
      const resolved = resolveApiKey();
      expect(resolved).toBe('env-bound-server-key-67890');
    });

    it('resolveApiKey falls back to VITE_FIREBASE_API_KEY in local Node development', () => {
      process.env.VITE_FIREBASE_API_KEY = 'vite-dev-server-key-abcde';
      const resolved = resolveApiKey();
      expect(resolved).toBe('vite-dev-server-key-abcde');
    });

    it('resolveProjectId returns explicit, environment, or canonical project ID', () => {
      expect(resolveProjectId('custom-project')).toBe('custom-project');
      process.env.FIREBASE_PROJECT_ID = 'env-project';
      expect(resolveProjectId()).toBe('env-project');
      delete process.env.FIREBASE_PROJECT_ID;
      expect(resolveProjectId()).toBe(FIREBASE_PROJECT_ID);
    });
  });

  describe('2. Secret Redaction & URL Query Sanitization', () => {
    it('sanitizeErrorMessage redacts ?key= query parameters from URLs', () => {
      const rawUrl =
        'https://firestore.googleapis.com/v1/projects/orion9/databases/(default)/documents/col/doc?key=AIzaSySecretKey12345678901234567890123';
      const sanitized = sanitizeErrorMessage(`Fetch failed: ${rawUrl}`);
      expect(sanitized).not.toContain('AIzaSySecretKey');
      expect(sanitized).toContain('?key=[REDACTED]');
    });

    it('sanitizeErrorMessage redacts standalone AIzaSy credentials from error traces', () => {
      const rawError =
        'GoogleJsonResponseException: 400 Bad Request with key AIzaSyDkMfCEdhNYHIb8hsIQ00pIkYRGo1234';
      const sanitized = sanitizeErrorMessage(rawError);
      expect(sanitized).not.toContain('DkMfCEdhNYHIb8hsIQ00pIkYRGo1234');
      expect(sanitized).toContain('AIzaSy[REDACTED]');
    });

    it('handles Error instances, null, and objects gracefully', () => {
      expect(sanitizeErrorMessage(null)).toBe('');
      expect(sanitizeErrorMessage(new Error('Network error with ?key=12345'))).toContain('?key=[REDACTED]');
    });
  });

  describe('3. Cloudflare Worker Edge Secret Isolation', () => {
    it('worker /api/branding fails closed with 500 when server environment bindings are missing', async () => {
      const dummyEnvWithoutKey = {
        ASSETS: { fetch: async () => new Response('Asset not found', { status: 404 }) },
        ORION_RUNTIME_ENVIRONMENT: 'DEMO',
        // Note: No FIREBASE_API_KEY provided in env
      };

      const dummyCtx = {
        waitUntil: () => {},
        passThroughOnException: () => {},
      };

      const req = new Request('https://orion-9.ayushprakash0021.workers.dev/api/branding', {
        method: 'GET',
      });

      const res = await worker.fetch(req, dummyEnvWithoutKey as any, dummyCtx);
      expect(res.status).toBe(500);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/Firebase API key is not configured/i);
      // Ensure no raw keys or leaked credentials in response
      expect(JSON.stringify(json)).not.toMatch(/AIzaSy[0-9A-Za-z_-]{33}/);
    });
  });

  describe('4. Source Code Forensic Static Invariant Verification', () => {
    it('brandingBackend.ts does NOT declare or export DEFAULT_FIREBASE_API_KEY', () => {
      const backendPath = path.resolve(__dirname, '../../server/brandingBackend.ts');
      const content = fs.readFileSync(backendPath, 'utf8');

      expect(content).not.toContain('DEFAULT_FIREBASE_API_KEY');
      expect(content).not.toMatch(/AIzaSy[0-9A-Za-z_-]{33}/);
    });

    it('worker.ts and server.ts do not embed hardcoded live API keys', () => {
      const workerPath = path.resolve(__dirname, '../../worker.ts');
      const serverPath = path.resolve(__dirname, '../../../server.ts');

      const workerContent = fs.readFileSync(workerPath, 'utf8');
      const serverContent = fs.readFileSync(serverPath, 'utf8');

      const liveKeyRegex = /AIzaSy[0-9A-Za-z_-]{33}/g;
      const workerMatches = workerContent.match(liveKeyRegex) || [];
      const serverMatches = serverContent.match(liveKeyRegex) || [];

      expect(workerMatches).toHaveLength(0);
      expect(serverMatches).toHaveLength(0);
    });

    it('.dev.vars.example exists and only contains safe placeholder variables', () => {
      const examplePath = path.resolve(__dirname, '../../../.dev.vars.example');
      expect(fs.existsSync(examplePath)).toBe(true);

      const content = fs.readFileSync(examplePath, 'utf8');
      expect(content).toContain('YOUR_GEMINI_API_KEY_HERE');
      expect(content).toContain('YOUR_FIREBASE_API_KEY_HERE');
      expect(content).not.toMatch(/AIzaSy[0-9A-Za-z_-]{33}/);
    });
  });
});
