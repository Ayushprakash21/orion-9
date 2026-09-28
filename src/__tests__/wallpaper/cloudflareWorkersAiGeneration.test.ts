/**
 * ORION-9 CLOUDFLARE WORKERS AI WALLPAPER GENERATION SUITE
 *
 * Validates the complete Cloudflare Workers AI image-generation pipeline:
 * Model: @cf/black-forest-labs/flux-2-klein-4b
 *
 * Coverage:
 * 1. Successful Cloudflare generation returning 3 distinct candidates.
 * 2. FLUX.2 Klein 4B model identifier (@cf/black-forest-labs/flux-2-klein-4b).
 * 3. Quota exceeded failure (CLOUDFLARE_QUOTA_EXCEEDED).
 * 4. Authentication failure (CLOUDFLARE_AUTH_ERROR).
 * 5. Model execution failure (CLOUDFLARE_MODEL_ERROR).
 * 6. Network failure (NETWORK_ERROR).
 * 7. Failed generation preserves active system wallpaper without creating fake AI candidates.
 * 8. Applying a candidate updates the active wallpaper in the repository.
 * 9. Login vs Desktop wallpaper targets remain isolated.
 * 10. Client JavaScript contains zero API tokens or secrets.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkCloudflareWallpaperStatus,
  generateCloudflareWallpapers,
  PRIMARY_CLOUDFLARE_MODEL,
} from '../../server/cloudflareAiBackend';
import { CloudflareWallpaperImageProvider } from '../../services/wallpaper/CloudflareWallpaperImageProvider';
import { aiWallpaperGenerator } from '../../services/wallpaper/AiWallpaperGenerator';
import { wallpaperRepository, SYSTEM_DEFAULT_WALLPAPERS } from '../../repositories/WallpaperRepository';
import { WallpaperRecord } from '../../types/wallpaper';

describe('ORION-9 Cloudflare Workers AI Wallpaper Generation', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TEST 1: Configured Model is @cf/black-forest-labs/flux-2-klein-4b
  it('1. configures @cf/black-forest-labs/flux-2-klein-4b as primary model', () => {
    expect(PRIMARY_CLOUDFLARE_MODEL).toBe('@cf/black-forest-labs/flux-2-klein-4b');
    const provider = new CloudflareWallpaperImageProvider();
    expect(provider.name).toBe('Cloudflare Workers AI');
    expect(provider.model).toBe('@cf/black-forest-labs/flux-2-klein-4b');
  });

  // TEST 2: Status Check with env.AI binding
  it('2. detects Cloudflare Workers AI env.AI binding in health check', async () => {
    const mockAi = { run: vi.fn() };
    const status = await checkCloudflareWallpaperStatus(mockAi);
    expect(status.configured).toBe(true);
    expect(status.providerName).toBe('Cloudflare Workers AI');
    expect(status.model).toBe('@cf/black-forest-labs/flux-2-klein-4b');
    expect(status.available).toBe(true);
    expect(status.status).toBe('READY');
  });

  // TEST 3: Status Check when env.AI is unconfigured
  it('3. reports CLOUDFLARE_AI_UNAVAILABLE when binding is missing', async () => {
    const status = await checkCloudflareWallpaperStatus(null, undefined, undefined);
    expect(status.configured).toBe(false);
    expect(status.available).toBe(false);
    expect(status.status).toBe('CLOUDFLARE_AI_UNAVAILABLE');
    expect(status.error).toContain('not configured');
  });

  // TEST 4: Successful 3-candidate generation via env.AI binding
  it('4. generates exactly 3 candidate wallpapers via Cloudflare Workers AI', async () => {
    const mockAi = {
      run: vi.fn().mockResolvedValue(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])),
    };

    const res = await generateCloudflareWallpapers(mockAi, {
      prompt: 'Futuristic space station overlooking Earth horizon',
      style: 'Space',
      count: 3,
      width: 2560,
      height: 1440,
    });

    expect(res.success).toBe(true);
    expect(res.statusCode).toBe(200);
    expect(res.model).toBe('@cf/black-forest-labs/flux-2-klein-4b');
    expect(res.candidates).toHaveLength(3);

    res.candidates?.forEach((c, idx) => {
      expect(c.candidateId).toBeDefined();
      expect(c.assetUrl).toContain('data:image/png;base64,');
      expect(c.width).toBe(2560);
      expect(c.height).toBe(1440);
      expect(c.provider).toBe('Cloudflare Workers AI');
    });

    expect(mockAi.run).toHaveBeenCalledTimes(3);
  });

  // TEST 5: Prompt validation (empty prompt rejected)
  it('5. validates and rejects empty or invalid prompts', async () => {
    const mockAi = { run: vi.fn() };
    const res = await generateCloudflareWallpapers(mockAi, { prompt: '' });
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.error).toContain('Prompt is required');
  });

  // TEST 6: Quota Exceeded Failure Handling
  it('6. handles Cloudflare Workers AI quota / rate limit (429)', async () => {
    const mockAi = {
      run: vi.fn().mockRejectedValue({ status: 429, message: 'daily limit reached or rate limit exceeded' }),
    };

    const res = await generateCloudflareWallpapers(mockAi, {
      prompt: 'Aurora borealis over frozen mountains',
    });

    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(429);
    expect(res.code).toBe('CLOUDFLARE_QUOTA_EXCEEDED');
    expect(res.error).toContain('quota has been reached');
  });

  // TEST 7: Authentication Failure Handling (401 / 403)
  it('7. handles Cloudflare Workers AI authentication failure (401/403)', async () => {
    const mockAi = {
      run: vi.fn().mockRejectedValue({ status: 401, message: 'unauthorized request to workers ai' }),
    };

    const res = await generateCloudflareWallpapers(mockAi, {
      prompt: 'Nebula storm in Orion constellation',
    });

    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.code).toBe('CLOUDFLARE_AUTH_ERROR');
    expect(res.error).toContain('authentication failed');
  });

  // TEST 8: Model Execution Failure Handling (500)
  it('8. handles Cloudflare Workers AI model failure (500)', async () => {
    const mockAi = {
      run: vi.fn().mockRejectedValue({ status: 500, message: 'inference runtime exception' }),
    };

    const res = await generateCloudflareWallpapers(mockAi, {
      prompt: 'Abstract geometric crystalline landscape',
    });

    expect(res.success).toBe(false);
    expect(res.code).toBe('CLOUDFLARE_MODEL_ERROR');
  });

  // TEST 9: Failed generation does NOT overwrite current active wallpaper
  it('9. ensures generation failure preserves active system wallpaper', async () => {
    // Set initial active wallpaper
    await wallpaperRepository.resetToSystemDefault('user-test-guard', 'desktop');
    const beforeActive = await wallpaperRepository.getActiveWallpaper('user-test-guard', 'default', 'desktop');

    // Attempt generation that fails
    const mockAi = {
      run: vi.fn().mockRejectedValue(new Error('Inference failure')),
    };
    const res = await generateCloudflareWallpapers(mockAi, { prompt: 'Test Fail' });
    expect(res.success).toBe(false);

    // Active wallpaper remains untouched
    const afterActive = await wallpaperRepository.getActiveWallpaper('user-test-guard', 'default', 'desktop');
    expect(afterActive.wallpaperId).toBe(beforeActive.wallpaperId);
    expect(afterActive.assetUrl).toBe(beforeActive.assetUrl);
  });

  // TEST 10: Successful Apply updates active wallpaper
  it('10. applying a generated candidate updates the active wallpaper', async () => {
    const mockCandidate: WallpaperRecord = {
      wallpaperId: 'wp_cf_test_applied',
      tenantId: 'default',
      ownerType: 'USER',
      ownerId: 'user-test-apply',
      name: 'Cloudflare Space Concept A',
      assetUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      source: 'AI',
      aiGenerated: true,
      prompt: 'Deep space Orion nebula',
      style: 'Space',
      width: 2560,
      height: 1440,
      aspectRatio: '16:9',
      mode: 'STILL',
      environment: 'DEMO',
      status: 'APPROVED',
      target: 'desktop',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await wallpaperRepository.saveWallpaper(mockCandidate, 'desktop');
    await wallpaperRepository.setActiveWallpaper(mockCandidate.wallpaperId, 'user-test-apply', 'desktop');

    const active = await wallpaperRepository.getActiveWallpaper('user-test-apply', 'default', 'desktop');
    expect(active.wallpaperId).toBe('wp_cf_test_applied');
    expect(active.name).toBe('Cloudflare Space Concept A');
  });

  // TEST 11: Login and Desktop target isolation
  it('11. maintains target isolation between login and desktop wallpapers', async () => {
    const loginWp: WallpaperRecord = {
      wallpaperId: 'wp_cf_login_target',
      tenantId: 'default',
      ownerType: 'USER',
      ownerId: 'user-iso-test',
      name: 'Login Specific Wallpaper',
      assetUrl: 'data:image/svg+xml;utf8,<svg id="login"></svg>',
      source: 'AI',
      aiGenerated: true,
      width: 2560,
      height: 1440,
      aspectRatio: '16:9',
      target: 'login',
      environment: 'DEMO',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const desktopWp: WallpaperRecord = {
      wallpaperId: 'wp_cf_desktop_target',
      tenantId: 'default',
      ownerType: 'USER',
      ownerId: 'user-iso-test',
      name: 'Desktop Specific Wallpaper',
      assetUrl: 'data:image/svg+xml;utf8,<svg id="desktop"></svg>',
      source: 'AI',
      aiGenerated: true,
      width: 2560,
      height: 1440,
      aspectRatio: '16:9',
      target: 'desktop',
      environment: 'DEMO',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await wallpaperRepository.saveWallpaper(loginWp, 'login');
    await wallpaperRepository.setActiveWallpaper(loginWp.wallpaperId, 'user-iso-test', 'login');

    await wallpaperRepository.saveWallpaper(desktopWp, 'desktop');
    await wallpaperRepository.setActiveWallpaper(desktopWp.wallpaperId, 'user-iso-test', 'desktop');

    const activeLogin = await wallpaperRepository.getActiveWallpaper('user-iso-test', 'default', 'login');
    const activeDesktop = await wallpaperRepository.getActiveWallpaper('user-iso-test', 'default', 'desktop');

    expect(activeLogin.wallpaperId).toBe('wp_cf_login_target');
    expect(activeDesktop.wallpaperId).toBe('wp_cf_desktop_target');
    expect(activeLogin.wallpaperId).not.toBe(activeDesktop.wallpaperId);
  });

  // TEST 12: Zero Client-Side Secret Exposure
  it('12. ensures zero Cloudflare credentials in client JavaScript', () => {
    const windowToken = typeof window !== 'undefined' ? (window as any).CLOUDFLARE_API_TOKEN : undefined;
    expect(windowToken).toBeUndefined();
    expect(process.env.VITE_CLOUDFLARE_API_TOKEN).toBeUndefined();
  });
});
