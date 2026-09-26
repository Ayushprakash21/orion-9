import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GeminiWallpaperImageProvider } from '../../services/wallpaper/GeminiWallpaperImageProvider';
import { 
  wallpaperRepository, 
  DEFAULT_LOGIN_WALLPAPER, 
  DEFAULT_DESKTOP_WALLPAPER 
} from '../../repositories/WallpaperRepository';

describe('ORION-9 Wallpaper Studio: Gemini Readiness Gate & Target Isolation (Tests 1-8)', () => {
  let provider: GeminiWallpaperImageProvider;
  const originalFetch = globalThis.fetch;

  beforeEach(async () => {
    provider = new GeminiWallpaperImageProvider();
    vi.restoreAllMocks();
    await wallpaperRepository.resetToSystemDefault(undefined, 'login');
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // =========================================================================
  // TEST 1: Gemini selected + Gemini available -> generation allowed
  // =========================================================================
  it('Test 1: Gemini selected + Gemini available -> generation allowed', async () => {
    // Mock /api/ai/wallpaper-status returning Gemini available
    globalThis.fetch = vi.fn(async (url: any, init?: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/ai/wallpaper-status')) {
        return {
          ok: true,
          json: async () => ({
            providerConfigured: true,
            configured: true,
            providerName: 'Google Gemini',
            model: 'gemini-3.1-flash-image',
            available: true,
            status: 'GEMINI_CONFIGURED',
            error: null,
            supportedDimensions: ['16:9', '2K', '4K'],
          }),
        } as any;
      }
      if (urlStr.includes('/api/ai/generate-wallpaper')) {
        return {
          ok: true,
          json: async () => ({
            candidates: [
              { candidateId: 'cand_1', assetUrl: 'data:image/png;base64,AAA1', name: 'Gemini Space Vision A' },
              { candidateId: 'cand_2', assetUrl: 'data:image/png;base64,AAA2', name: 'Gemini Space Vision B' },
              { candidateId: 'cand_3', assetUrl: 'data:image/png;base64,AAA3', name: 'Gemini Space Vision C' },
            ],
            provider: 'Google Gemini',
            model: 'gemini-3.1-flash-image',
          }),
        } as any;
      }
      return { ok: false, status: 404, json: async () => ({}) } as any;
    });

    const status = await provider.checkStatus();
    expect(status.available).toBe(true);
    expect(status.status).toBe('GEMINI_CONFIGURED');
    expect(status.error).toBeNull();
    expect(status.providerName).toBe('Google Gemini');

    const candidates = await provider.generateCandidates({
      prompt: 'Deep space enterprise wallpaper with Orion constellation',
      style: 'Space',
    });

    expect(candidates).toHaveLength(3);
    expect(candidates[0].assetUrl).toBe('data:image/png;base64,AAA1');
    expect(candidates[1].assetUrl).toBe('data:image/png;base64,AAA2');
    expect(candidates[2].assetUrl).toBe('data:image/png;base64,AAA3');
  });

  // =========================================================================
  // TEST 2: Gemini selected + Cloudflare unavailable -> generation MUST still be allowed
  // =========================================================================
  it('Test 2: Gemini selected + Cloudflare unavailable -> generation MUST still be allowed (Cloudflare error ignored)', async () => {
    // Legacy endpoint or stale Cloudflare status payload returns CLOUDFLARE_AI_UNAVAILABLE,
    // but indicates Gemini fallback is configured (or Gemini backend is active)
    globalThis.fetch = vi.fn(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/ai/wallpaper-status')) {
        return {
          ok: true,
          json: async () => ({
            provider: 'Cloudflare Workers AI',
            model: '@cf/black-forest-labs/flux-2-klein-9b',
            configured: false,
            status: 'CLOUDFLARE_AI_UNAVAILABLE',
            geminiFallbackConfigured: true,
            error: 'Cloudflare Workers AI binding is unconfigured.',
          }),
        } as any;
      }
      if (urlStr.includes('/api/ai/generate-wallpaper')) {
        return {
          ok: true,
          json: async () => ({
            candidates: [
              { candidateId: 'c1', assetUrl: 'data:image/png;base64,XYZ1', name: 'Gemini Candidate 1' },
              { candidateId: 'c2', assetUrl: 'data:image/png;base64,XYZ2', name: 'Gemini Candidate 2' },
              { candidateId: 'c3', assetUrl: 'data:image/png;base64,XYZ3', name: 'Gemini Candidate 3' },
            ],
            provider: 'Google Gemini',
          }),
        } as any;
      }
      return { ok: false, status: 404, json: async () => ({}) } as any;
    });

    // Cloudflare unavailable status MUST NOT infect or block Gemini
    const status = await provider.checkStatus();
    expect(status.status).not.toContain('CLOUDFLARE');
    expect(status.status).toBe('GEMINI_CONFIGURED');
    expect(status.available).toBe(true);
    expect(status.error).toBeNull();

    // Generation must proceed without being blocked
    const candidates = await provider.generateCandidates({
      prompt: 'Cosmic horizon with restrained blue atmosphere',
      style: 'Space',
    });

    expect(candidates).toHaveLength(3);
    expect(candidates[0].assetUrl).toBe('data:image/png;base64,XYZ1');
  });

  // =========================================================================
  // TEST 3: Gemini selected + Gemini unavailable -> show Gemini-specific error (GEMINI_CONFIGURATION_REQUIRED)
  // =========================================================================
  it('Test 3: Gemini selected + Gemini unavailable -> show Gemini-specific error (GEMINI_CONFIGURATION_REQUIRED)', async () => {
    globalThis.fetch = vi.fn(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/ai/wallpaper-status')) {
        return {
          ok: true,
          json: async () => ({
            providerConfigured: false,
            configured: false,
            providerName: 'Google Gemini',
            model: 'gemini-3.1-flash-image',
            available: false,
            status: 'GEMINI_SECRET_MISSING',
            error: 'GEMINI_SECRET_MISSING',
          }),
        } as any;
      }
      return { ok: false, status: 503, json: async () => ({}) } as any;
    });

    const status = await provider.checkStatus();
    expect(status.available).toBe(false);
    expect(status.status).toBe('GEMINI_SECRET_MISSING');
    expect(status.error).toBe('GEMINI_SECRET_MISSING');

    await expect(
      provider.generateCandidates({ prompt: 'Deep space test', style: 'Space' })
    ).rejects.toThrow(/GEMINI_CONFIGURATION_REQUIRED/);
  });

  // =========================================================================
  // TEST 4: Gemini generation succeeds -> static image returned
  // =========================================================================
  it('Test 4: Gemini generation succeeds -> static image returned', async () => {
    globalThis.fetch = vi.fn(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/ai/wallpaper-status')) {
        return {
          ok: true,
          json: async () => ({
            providerConfigured: true,
            configured: true,
            available: true,
            status: 'GEMINI_CONFIGURED',
          }),
        } as any;
      }
      if (urlStr.includes('/api/ai/generate-wallpaper')) {
        return {
          ok: true,
          json: async () => ({
            candidates: [
              { candidateId: 'wp_static_1', assetUrl: 'data:image/png;base64,STATIC_IMG_1', name: 'Static Orion 1' },
              { candidateId: 'wp_static_2', assetUrl: 'data:image/png;base64,STATIC_IMG_2', name: 'Static Orion 2' },
              { candidateId: 'wp_static_3', assetUrl: 'data:image/png;base64,STATIC_IMG_3', name: 'Static Orion 3' },
            ],
            provider: 'Google Gemini',
          }),
        } as any;
      }
      return { ok: false, status: 404, json: async () => ({}) } as any;
    });

    const candidates = await provider.generateCandidates({
      prompt: 'Minimalist deep space',
      style: 'Space',
      width: 2560,
      height: 1440,
    });

    expect(candidates).toHaveLength(3);
    for (const c of candidates) {
      expect(c.assetUrl).toMatch(/^data:image\/png;base64,/);
      expect(c.width).toBe(2560);
      expect(c.height).toBe(1440);
      // No live elements, shaders, or 3D fields
      expect((c as any).isLive).toBeUndefined();
      expect((c as any).threeScene).toBeUndefined();
      expect((c as any).motionProfile).toBeUndefined();
    }
  });

  // =========================================================================
  // TEST 5: Gemini generation fails -> actual Gemini error surfaced (GEMINI_GENERATION_FAILED)
  // =========================================================================
  it('Test 5: Gemini generation fails -> actual Gemini error surfaced (GEMINI_GENERATION_FAILED)', async () => {
    globalThis.fetch = vi.fn(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/ai/wallpaper-status')) {
        return {
          ok: true,
          json: async () => ({
            providerConfigured: true,
            configured: true,
            available: true,
            status: 'GEMINI_CONFIGURED',
          }),
        } as any;
      }
      if (urlStr.includes('/api/ai/generate-wallpaper')) {
        return {
          ok: false,
          status: 502,
          json: async () => ({
            error: 'GEMINI_GENERATION_FAILED: Upstream model timeout.',
            code: 'GEMINI_API_UNAVAILABLE',
          }),
        } as any;
      }
      return { ok: false, status: 404, json: async () => ({}) } as any;
    });

    await expect(
      provider.generateCandidates({ prompt: 'Cosmic vista', style: 'Space' })
    ).rejects.toThrow(/GEMINI_GENERATION_FAILED/);
  });

  // =========================================================================
  // TEST 6: Generated LOGIN wallpaper -> applied only to LOGIN
  // =========================================================================
  it('Test 6: Generated LOGIN wallpaper -> applied only to LOGIN', async () => {
    const userId = 'usr-test-target-isolation-6';
    const tenantId = 'tnt-test-target-isolation-6';

    const validBase64Login = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

    const loginGeneratedCandidate = {
      candidateId: 'ai-login-candidate-6',
      name: 'AI Generated Login Horizon',
      assetUrl: validBase64Login,
      thumbnailUrl: validBase64Login,
      width: 2560,
      height: 1440,
      prompt: 'Earth horizon from low orbit',
      style: 'Space' as const,
      createdAt: new Date().toISOString(),
    };

    // Save candidate to LOGIN target
    const savedLogin = await wallpaperRepository.saveWallpaper({
      wallpaperId: loginGeneratedCandidate.candidateId,
      tenantId,
      ownerType: 'USER',
      ownerId: userId,
      name: loginGeneratedCandidate.name,
      assetUrl: loginGeneratedCandidate.assetUrl,
      thumbnailUrl: loginGeneratedCandidate.thumbnailUrl,
      source: 'AI',
      aiGenerated: true,
      width: 2560,
      height: 1440,
      aspectRatio: '16:9',
      status: 'APPROVED',
      environment: 'DEMO',
      createdAt: loginGeneratedCandidate.createdAt,
      updatedAt: loginGeneratedCandidate.createdAt,
    });

    await wallpaperRepository.setActiveWallpaper(savedLogin.wallpaperId, userId, 'login');

    const activeLogin = await wallpaperRepository.getActiveWallpaper(userId, tenantId, 'login');
    const activeDesktop = await wallpaperRepository.getActiveWallpaper(userId, tenantId, 'desktop');

    // Applied strictly to LOGIN
    expect(activeLogin?.wallpaperId).toBe(savedLogin.wallpaperId);
    expect(activeLogin?.assetUrl).toBe(savedLogin.assetUrl);

    // Desktop/Home must NOT be modified
    expect(activeDesktop?.wallpaperId).not.toBe(savedLogin.wallpaperId);
    expect(activeDesktop?.wallpaperId).toBe(DEFAULT_DESKTOP_WALLPAPER.wallpaperId);
  });

  // =========================================================================
  // TEST 7: Generated HOME/DESKTOP wallpaper -> applied only to HOME/DESKTOP
  // =========================================================================
  it('Test 7: Generated HOME/DESKTOP wallpaper -> applied only to HOME/DESKTOP', async () => {
    const userId = 'usr-test-target-isolation-7';
    const tenantId = 'tnt-test-target-isolation-7';

    const validBase64Desktop = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAQUBAcY5j7EAAAAASUVORK5CYII=';

    const desktopGeneratedCandidate = {
      candidateId: 'ai-desktop-candidate-7',
      name: 'AI Generated Desktop Nebula',
      assetUrl: validBase64Desktop,
      thumbnailUrl: validBase64Desktop,
      width: 2560,
      height: 1440,
      prompt: 'Deep space cyan nebula',
      style: 'Space' as const,
      createdAt: new Date().toISOString(),
    };

    // Save candidate to HOME/DESKTOP target
    const savedDesktop = await wallpaperRepository.saveWallpaper({
      wallpaperId: desktopGeneratedCandidate.candidateId,
      tenantId,
      ownerType: 'USER',
      ownerId: userId,
      name: desktopGeneratedCandidate.name,
      assetUrl: desktopGeneratedCandidate.assetUrl,
      thumbnailUrl: desktopGeneratedCandidate.thumbnailUrl,
      source: 'AI',
      aiGenerated: true,
      width: 2560,
      height: 1440,
      aspectRatio: '16:9',
      status: 'APPROVED',
      environment: 'DEMO',
      createdAt: desktopGeneratedCandidate.createdAt,
      updatedAt: desktopGeneratedCandidate.createdAt,
    });

    await wallpaperRepository.setActiveWallpaper(savedDesktop.wallpaperId, userId, 'desktop');

    const activeLogin = await wallpaperRepository.getActiveWallpaper(userId, tenantId, 'login');
    const activeDesktop = await wallpaperRepository.getActiveWallpaper(userId, tenantId, 'desktop');

    // Applied strictly to HOME/DESKTOP
    expect(activeDesktop?.wallpaperId).toBe(savedDesktop.wallpaperId);
    expect(activeDesktop?.assetUrl).toBe(savedDesktop.assetUrl);

    // Login must NOT be modified
    expect(activeLogin?.wallpaperId).not.toBe(savedDesktop.wallpaperId);
    expect(activeLogin?.wallpaperId).toBe(DEFAULT_LOGIN_WALLPAPER.wallpaperId);
  });

  // =========================================================================
  // TEST 8: No code path in Gemini generation throws CLOUDFLARE_AI_UNAVAILABLE
  // =========================================================================
  it('Test 8: No code path in Gemini generation throws CLOUDFLARE_AI_UNAVAILABLE', async () => {
    const scenarios = [
      // Scenario A: Stale Cloudflare unavailable status from endpoint
      {
        statusResponse: {
          ok: true,
          json: async () => ({
            provider: 'Cloudflare Workers AI',
            status: 'CLOUDFLARE_AI_UNAVAILABLE',
            error: 'CLOUDFLARE_AI_UNAVAILABLE',
          }),
        },
        generateResponse: null,
      },
      // Scenario B: Endpoint returns 500 with Cloudflare error string
      {
        statusResponse: {
          ok: true,
          json: async () => ({
            configured: true,
            available: true,
            status: 'GEMINI_CONFIGURED',
          }),
        },
        generateResponse: {
          ok: false,
          status: 500,
          json: async () => ({
            error: 'CLOUDFLARE_AI_UNAVAILABLE: Unexpected upstream failure',
          }),
        },
      },
      // Scenario C: Status endpoint failure (e.g. 503)
      {
        statusResponse: {
          ok: false,
          status: 503,
          json: async () => ({
            error: 'CLOUDFLARE_AI_UNAVAILABLE',
          }),
        },
        generateResponse: null,
      },
    ];

    for (const scenario of scenarios) {
      globalThis.fetch = vi.fn(async (url: any) => {
        const urlStr = String(url);
        if (urlStr.includes('/api/ai/wallpaper-status')) {
          return scenario.statusResponse as any;
        }
        if (urlStr.includes('/api/ai/generate-wallpaper')) {
          return (scenario.generateResponse || { ok: false, status: 500, json: async () => ({}) }) as any;
        }
        return { ok: false, status: 404, json: async () => ({}) } as any;
      });

      try {
        await provider.generateCandidates({ prompt: 'Deep space test', style: 'Space' });
      } catch (err: any) {
        expect(err.message).not.toContain('CLOUDFLARE_AI_UNAVAILABLE');
        expect(err.message).not.toContain('Cloudflare Workers AI');
      }

      const status = await provider.checkStatus();
      expect(status.status).not.toContain('CLOUDFLARE_AI_UNAVAILABLE');
      if (status.error) {
        expect(status.error).not.toContain('CLOUDFLARE_AI_UNAVAILABLE');
      }
    }
  });
});
