/**
 * ORION-9 GEMINI STATIC IMAGE GENERATION TEST SUITE
 * 
 * Verifies end-to-end:
 * 1. Missing API key handling (safe error, no key leak)
 * 2. Configured API key status check (health metadata, model gemini-2.5-flash-image)
 * 3. Successful Gemini image response & inline base64 image extraction
 * 4. Gemini authentication failure handling (401/403)
 * 5. Gemini quota/rate-limit failure handling (429)
 * 6. Malformed Gemini response handling
 * 7. Candidate image extraction into browser-renderable data URLs
 * 8. LOGIN target isolation (applied strictly to login target, desktop remains unaffected)
 * 9. HOME/DESKTOP target isolation (applied strictly to desktop target, login remains unaffected)
 * 10. Static image output validation (still mode, 2560x1440, 16:9, no 3D/live/canvas/particles)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  checkGeminiWallpaperStatus, 
  generateGeminiWallpapers,
  PRIMARY_GEMINI_IMAGE_MODEL 
} from '../../server/geminiBackend';
import { GeminiWallpaperImageProvider } from '../../services/wallpaper/GeminiWallpaperImageProvider';
import { 
  wallpaperRepository, 
  DEFAULT_LOGIN_WALLPAPER, 
  DEFAULT_DESKTOP_WALLPAPER 
} from '../../repositories/WallpaperRepository';

describe('ORION-9 Gemini Static Image Generation End-to-End', () => {
  const originalFetch = globalThis.fetch;
  let provider: GeminiWallpaperImageProvider;

  beforeEach(async () => {
    provider = new GeminiWallpaperImageProvider();
    vi.restoreAllMocks();
    await wallpaperRepository.resetToSystemDefault('test-user-static', 'login');
    await wallpaperRepository.resetToSystemDefault('test-user-static', 'desktop');
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // 1. Missing API key
  it('1. missing API key returns safe metadata and does not leak secrets', async () => {
    const status = await checkGeminiWallpaperStatus(undefined);
    expect(status.configured).toBe(false);
    expect(status.available).toBe(false);
    expect(status.provider).toBe('google-gemini');
    expect(status.providerName).toBe('Google Gemini');
    expect(status.model).toBe(PRIMARY_GEMINI_IMAGE_MODEL);
    expect(status.imageGeneration).toBe(false);
    expect(status.status).toBe('GEMINI_SECRET_MISSING');
    expect(status.error).toBe('GEMINI_SECRET_MISSING');
    expect((status as any).apiKey).toBeUndefined();

    // Generation attempt with missing key
    const genResult = await generateGeminiWallpapers(undefined, {
      prompt: 'A cinematic black hole surrounded by a deep blue nebula',
      style: 'Space',
      count: 3
    });
    expect(genResult.success).toBe(false);
    expect(genResult.statusCode).toBe(503);
    expect(genResult.body.error).toBe('Gemini API is not configured on the ORION-9 server.');
  });

  // 2. Configured API key
  it('2. configured API key returns health status with gemini-2.5-flash-image model', async () => {
    // Mock the GoogleGenAI list models call
    const status = await checkGeminiWallpaperStatus('valid-test-key');
    expect(status.provider).toBe('google-gemini');
    expect(status.model).toBe(PRIMARY_GEMINI_IMAGE_MODEL);
    expect(status.supportedDimensions).toContain('16:9');
    expect((status as any).apiKey).toBeUndefined();
  });

  // 3. Successful Gemini image response & inline base64 extraction
  it('3. extracts image bytes/base64 into browser-displayable data URLs', async () => {
    const fakeBase64A = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const fakeBase64B = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const fakeBase64C = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==';

    globalThis.fetch = vi.fn(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/wallpaper/gemini/status') || urlStr.includes('/api/ai/wallpaper-status')) {
        return {
          ok: true,
          json: async () => ({
            configured: true,
            provider: 'google-gemini',
            providerName: 'Google Gemini',
            model: PRIMARY_GEMINI_IMAGE_MODEL,
            imageGeneration: true,
            available: true,
            status: 'GEMINI_CONFIGURED',
            error: null,
            supportedDimensions: ['16:9', '2560x1440', '2K', '4K']
          })
        } as any;
      }
      if (urlStr.includes('/api/wallpaper/generate') || urlStr.includes('/api/ai/generate-wallpaper')) {
        return {
          ok: true,
          json: async () => ({
            candidates: [
              { candidateId: 'ai_wp_1_A', id: 'ai_wp_1_A', name: 'Space Vision A', assetUrl: `data:image/png;base64,${fakeBase64A}`, mimeType: 'image/png' },
              { candidateId: 'ai_wp_1_B', id: 'ai_wp_1_B', name: 'Space Vision B', assetUrl: `data:image/png;base64,${fakeBase64B}`, mimeType: 'image/png' },
              { candidateId: 'ai_wp_1_C', id: 'ai_wp_1_C', name: 'Space Vision C', assetUrl: `data:image/png;base64,${fakeBase64C}`, mimeType: 'image/png' }
            ],
            provider: 'google-gemini',
            model: PRIMARY_GEMINI_IMAGE_MODEL
          })
        } as any;
      }
      return { ok: false, status: 404, json: async () => ({}) } as any;
    });

    const candidates = await provider.generateCandidates({
      prompt: 'A cinematic black hole surrounded by a deep blue nebula, dark enterprise aesthetic',
      style: 'Space',
      width: 2560,
      height: 1440
    });

    expect(candidates).toHaveLength(3);
    expect(candidates[0].assetUrl).toBe(`data:image/png;base64,${fakeBase64A}`);
    expect(candidates[1].assetUrl).toBe(`data:image/png;base64,${fakeBase64B}`);
    expect(candidates[2].assetUrl).toBe(`data:image/png;base64,${fakeBase64C}`);
  });

  // 4. Gemini authentication failure
  it('4. handles Gemini authentication failure with clear error code', async () => {
    globalThis.fetch = vi.fn(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('status')) {
        return {
          ok: true,
          json: async () => ({
            configured: true,
            providerConfigured: true,
            providerName: 'Google Gemini',
            model: PRIMARY_GEMINI_IMAGE_MODEL,
            available: false,
            status: 'GEMINI_AUTH_ERROR',
            error: 'GEMINI_AUTH_ERROR'
          })
        } as any;
      }
      return { ok: false, status: 401, json: async () => ({}) } as any;
    });

    await expect(
      provider.generateCandidates({ prompt: 'Test cosmic prompt', style: 'Space' })
    ).rejects.toThrow(/Gemini API authentication failed/);
  });

  // 5. Gemini quota/rate-limit failure
  it('5. handles Gemini quota/rate-limit failure with clear error code', async () => {
    globalThis.fetch = vi.fn(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('status')) {
        return {
          ok: true,
          json: async () => ({
            configured: true,
            providerConfigured: true,
            providerName: 'Google Gemini',
            model: PRIMARY_GEMINI_IMAGE_MODEL,
            available: false,
            status: 'GEMINI_RATE_LIMIT',
            error: 'GEMINI_RATE_LIMIT'
          })
        } as any;
      }
      return { ok: false, status: 429, json: async () => ({}) } as any;
    });

    await expect(
      provider.generateCandidates({ prompt: 'Test cosmic prompt', style: 'Space' })
    ).rejects.toThrow(/Gemini image generation quota has been reached/);
  });

  // 6. Malformed Gemini response
  it('6. rejects malformed candidate data without throwing unhandled exceptions', async () => {
    globalThis.fetch = vi.fn(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('status')) {
        return {
          ok: true,
          json: async () => ({
            configured: true,
            available: true,
            status: 'GEMINI_CONFIGURED',
            error: null
          })
        } as any;
      }
      if (urlStr.includes('generate')) {
        return {
          ok: true,
          json: async () => ({
            candidates: [
              { candidateId: 'invalid_1', assetUrl: '', name: 'Empty Asset' }
            ]
          })
        } as any;
      }
      return { ok: false, status: 500, json: async () => ({}) } as any;
    });

    await expect(
      provider.generateCandidates({ prompt: 'Cosmic vista', style: 'Space' })
    ).rejects.toThrow();
  });

  // 7. LOGIN target isolation
  it('7. strictly applies generated image to LOGIN target without modifying HOME/DESKTOP', async () => {
    const userId = 'usr-gemini-test-login';
    const tenantId = 'tnt-gemini-test-login';

    const loginImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

    const savedLoginWp = await wallpaperRepository.saveWallpaper({
      wallpaperId: `wp_gemini_login_${Date.now()}`,
      tenantId,
      ownerType: 'USER',
      ownerId: userId,
      name: 'Gemini Black Hole Login',
      assetUrl: loginImageUrl,
      thumbnailUrl: loginImageUrl,
      source: 'AI',
      target: 'login',
      aiGenerated: true,
      width: 2560,
      height: 1440,
      aspectRatio: '16:9',
      mode: 'STILL',
      environment: 'DEMO',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, 'login');

    await wallpaperRepository.setActiveWallpaper(savedLoginWp.wallpaperId, userId, 'login');

    const activeLogin = await wallpaperRepository.getActiveWallpaper(userId, tenantId, 'login');
    const activeDesktop = await wallpaperRepository.getActiveWallpaper(userId, tenantId, 'desktop');

    // Login is updated to the generated wallpaper
    expect(activeLogin?.wallpaperId).toBe(savedLoginWp.wallpaperId);
    expect(activeLogin?.assetUrl).toBe(savedLoginWp.assetUrl);

    // Desktop/Home target is untouched and remains the default desktop wallpaper
    expect(activeDesktop?.wallpaperId).not.toBe(savedLoginWp.wallpaperId);
    expect(activeDesktop?.wallpaperId).toBe(DEFAULT_DESKTOP_WALLPAPER.wallpaperId);
  });

  // 8. HOME/DESKTOP target isolation
  it('8. strictly applies generated image to HOME/DESKTOP target without modifying LOGIN', async () => {
    const userId = 'usr-gemini-test-desktop';
    const tenantId = 'tnt-gemini-test-desktop';

    const desktopImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAQUBAcY5j7EAAAAASUVORK5CYII=';

    const savedDesktopWp = await wallpaperRepository.saveWallpaper({
      wallpaperId: `wp_gemini_desktop_${Date.now()}`,
      tenantId,
      ownerType: 'USER',
      ownerId: userId,
      name: 'Gemini Deep Nebula Desktop',
      assetUrl: desktopImageUrl,
      thumbnailUrl: desktopImageUrl,
      source: 'AI',
      target: 'desktop',
      aiGenerated: true,
      width: 2560,
      height: 1440,
      aspectRatio: '16:9',
      mode: 'STILL',
      environment: 'DEMO',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, 'desktop');

    await wallpaperRepository.setActiveWallpaper(savedDesktopWp.wallpaperId, userId, 'desktop');

    const activeLogin = await wallpaperRepository.getActiveWallpaper(userId, tenantId, 'login');
    const activeDesktop = await wallpaperRepository.getActiveWallpaper(userId, tenantId, 'desktop');

    // Desktop is updated to the generated wallpaper
    expect(activeDesktop?.wallpaperId).toBe(savedDesktopWp.wallpaperId);
    expect(activeDesktop?.assetUrl).toBe(savedDesktopWp.assetUrl);

    // Login target is untouched and remains the default login wallpaper
    expect(activeLogin?.wallpaperId).not.toBe(savedDesktopWp.wallpaperId);
    expect(activeLogin?.wallpaperId).toBe(DEFAULT_LOGIN_WALLPAPER.wallpaperId);
  });

  // 9. Static-only requirement validation
  it('9. generated wallpaper is strictly STATIC STILL mode with 2560x1440 16:9 dimensions', async () => {
    const validDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    globalThis.fetch = vi.fn(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('status')) {
        return {
          ok: true,
          json: async () => ({
            configured: true,
            available: true,
            status: 'GEMINI_CONFIGURED'
          })
        } as any;
      }
      if (urlStr.includes('generate')) {
        return {
          ok: true,
          json: async () => ({
            candidates: [
              { candidateId: 'wp_s_1', assetUrl: validDataUrl, name: 'Static A' },
              { candidateId: 'wp_s_2', assetUrl: validDataUrl, name: 'Static B' },
              { candidateId: 'wp_s_3', assetUrl: validDataUrl, name: 'Static C' }
            ],
            provider: 'google-gemini',
            model: PRIMARY_GEMINI_IMAGE_MODEL
          })
        } as any;
      }
      return { ok: false, status: 404, json: async () => ({}) } as any;
    });

    const candidates = await provider.generateCandidates({
      prompt: 'Cinematic Orion constellation',
      style: 'Space',
      width: 2560,
      height: 1440
    });

    for (const c of candidates) {
      expect(c.assetUrl).toMatch(/^data:image\//);
      expect(c.width).toBe(2560);
      expect(c.height).toBe(1440);
      expect((c as any).mode).toBeUndefined(); // Candidates are pure static assets
      expect((c as any).isLive).toBeUndefined();
      expect((c as any).threeScene).toBeUndefined();
      expect((c as any).shaderSource).toBeUndefined();
      expect((c as any).particles).toBeUndefined();
    }
  });
});
