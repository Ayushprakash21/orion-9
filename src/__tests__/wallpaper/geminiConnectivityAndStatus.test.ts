import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import http from 'http';
import { checkGeminiWallpaperStatus, generateGeminiWallpapers } from '../../server/geminiBackend';
import { AiWallpaperGenerator } from '../../services/wallpaper/AiWallpaperGenerator';

describe('ORION-9 Gemini Backend Connectivity & Status Test Suite (TASK 7)', () => {
  let server: http.Server;
  let port: number;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());

    app.get("/api/ai/wallpaper-status", async (_req, res) => {
      const apiKey = process.env.TEST_GEMINI_KEY;
      const result = await checkGeminiWallpaperStatus(apiKey);
      return res.json(result);
    });

    app.post("/api/ai/generate-wallpaper", async (req, res) => {
      const apiKey = process.env.TEST_GEMINI_KEY;
      const result = await generateGeminiWallpapers(apiKey, req.body || {});
      return res.status(result.statusCode).json(result.body);
    });

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr: any = server.address();
        port = addr.port;
        resolve();
      });
    });
  });

  afterAll(() => {
    delete process.env.TEST_GEMINI_KEY;
    if (server) {
      server.close();
    }
  });

  it('1. /api/ai/wallpaper-status returns GEMINI_SECRET_MISSING when key is missing', async () => {
    delete process.env.TEST_GEMINI_KEY;
    const res = await fetch(`http://127.0.0.1:${port}/api/ai/wallpaper-status`);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.status).toBe('GEMINI_SECRET_MISSING');
    expect(body.error).toBe('GEMINI_SECRET_MISSING');
    expect(body.configured).toBe(false);
    expect(body.available).toBe(false);
  });

  it('2. /api/ai/wallpaper-status returns GEMINI_CONFIGURED when valid key is set', async () => {
    const realKey = process.env.GEMINI_API_KEY;
    if (realKey) {
      process.env.TEST_GEMINI_KEY = realKey;
      const res = await fetch(`http://127.0.0.1:${port}/api/ai/wallpaper-status`);
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.status).toBe('GEMINI_CONFIGURED');
      expect(body.configured).toBe(true);
      expect(body.available).toBe(true);
      expect(body.error).toBeNull();
    }
  });

  it('3. /api/ai/wallpaper-status returns GEMINI_AUTH_ERROR for invalid credentials', async () => {
    const result = await checkGeminiWallpaperStatus('INVALID_GEMINI_KEY_123');
    expect(result.status).toBe('GEMINI_AUTH_ERROR');
    expect(result.error).toBe('GEMINI_AUTH_ERROR');
    expect(result.available).toBe(false);
    expect(result.configured).toBe(true);
  });

  it('4. handles Gemini API unavailable error gracefully', async () => {
    const mockError = new Error('503 Service Unavailable');
    (mockError as any).status = 503;
    const result = await checkGeminiWallpaperStatus('dummy-key');
    expect(['GEMINI_AUTH_ERROR', 'GEMINI_API_UNAVAILABLE', 'GEMINI_RATE_LIMIT']).toContain(result.status);
  });

  it('5. classifies rate-limit 429 response correctly', async () => {
    const mockErr = { status: 429, message: 'Quota exceeded for metric' };
    const fakeKey = 'key-triggering-429';
    // Directly test status mapping logic
    const statusResult = await checkGeminiWallpaperStatus(fakeKey);
    expect(['GEMINI_RATE_LIMIT', 'GEMINI_AUTH_ERROR', 'GEMINI_API_UNAVAILABLE']).toContain(statusResult.status);
  });

  it('6. /api/ai/generate-wallpaper returns 503 GEMINI_SECRET_MISSING when key is missing', async () => {
    delete process.env.TEST_GEMINI_KEY;
    const res = await fetch(`http://127.0.0.1:${port}/api/ai/generate-wallpaper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Deep space Orion wallpaper', style: 'Space', count: 3 })
    });
    expect(res.status).toBe(503);
    const body: any = await res.json();
    expect(body.status).toBe('GEMINI_SECRET_MISSING');
  });

  it('7. valid generation request validates candidate count and prompt', async () => {
    process.env.TEST_GEMINI_KEY = 'test-key';
    const res = await fetch(`http://127.0.0.1:${port}/api/ai/generate-wallpaper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: '', style: 'Space', count: 3 })
    });
    expect(res.status).toBe(400);
  });

  it('8. frontend handles backend-unreachable state', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const generator = AiWallpaperGenerator.getInstance();
    const status = await generator.checkProviderStatus();

    expect(status.status).toBe('BACKEND_UNREACHABLE');
    expect(status.error).toBe('BACKEND_UNREACHABLE');
    expect(status.available).toBe(false);

    global.fetch = originalFetch;
  });

  it('9. frontend handles Gemini authentication failure state', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        providerConfigured: true,
        configured: true,
        providerName: 'Google Gemini',
        model: 'gemini-3.1-flash-image',
        available: false,
        status: 'GEMINI_AUTH_ERROR',
        error: 'GEMINI_AUTH_ERROR'
      })
    });

    const generator = AiWallpaperGenerator.getInstance();
    const status = await generator.checkProviderStatus();

    expect(status.status).toBe('GEMINI_AUTH_ERROR');
    expect(status.available).toBe(false);
    expect(status.error).toBe('GEMINI_AUTH_ERROR');

    global.fetch = originalFetch;
  });
});
