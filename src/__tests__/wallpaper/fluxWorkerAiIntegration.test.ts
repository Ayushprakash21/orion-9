import { describe, it, expect, vi } from 'vitest';
import { checkCloudflareWallpaperStatus, generateCloudflareWallpapers, PRIMARY_CLOUDFLARE_MODEL } from '../../server/cloudflareAiBackend';
import { aiWallpaperGenerator } from '../../services/wallpaper/AiWallpaperGenerator';

describe('ORION-9 Cloudflare Workers AI + FLUX.2 Klein 4B Integration', () => {
  it('1. verifies Cloudflare Workers AI binding existence and detection', async () => {
    const mockAi = { run: vi.fn() };
    const status = await checkCloudflareWallpaperStatus(mockAi);
    expect(status.configured).toBe(true);
    expect(status.providerName).toBe('Cloudflare Workers AI');
    expect(status.status).toBe('READY');
  });

  it('2. verifies correct FLUX model identifier @cf/black-forest-labs/flux-2-klein-4b', async () => {
    const mockAi = { run: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])) };
    const res = await generateCloudflareWallpapers(mockAi, { prompt: 'Deep space Orion constellation wallpaper' });
    expect(res.model).toBe('@cf/black-forest-labs/flux-2-klein-4b');
    expect(mockAi.run).toHaveBeenCalledWith(
      '@cf/black-forest-labs/flux-2-klein-4b',
      expect.objectContaining({ prompt: expect.stringContaining('Deep space Orion') })
    );
  });

  it('3. successful FLUX generation returns 3 wallpaper candidates', async () => {
    const mockAi = { run: vi.fn().mockResolvedValue(new Uint8Array([137, 80, 78, 71])) };
    const res = await generateCloudflareWallpapers(mockAi, { prompt: 'Futuristic logistics network wallpaper', style: 'Space' });
    expect(res.success).toBe(true);
    expect(res.candidates).toHaveLength(3);
    expect(res.candidates?.[0].assetUrl).toContain('data:image/png;base64,');
  });

  it('4. validates invalid empty prompt', async () => {
    const mockAi = { run: vi.fn() };
    const res = await generateCloudflareWallpapers(mockAi, { prompt: '' });
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.error).toContain('Prompt is required');
  });

  it('5. handles Cloudflare Workers AI daily allocation / quota exhaustion', async () => {
    const mockAi = { run: vi.fn().mockRejectedValue({ status: 429, message: 'daily limit reached or quota exhausted' }) };
    const res = await generateCloudflareWallpapers(mockAi, { prompt: 'Deep space nebula' });
    expect(res.success).toBe(false);
    expect(res.code).toBe('CLOUDFLARE_QUOTA_EXCEEDED');
    expect(res.error).toContain('quota has been reached');
  });

  it('6. handles Cloudflare Workers AI authentication / configuration error', async () => {
    const mockAi = { run: vi.fn().mockRejectedValue({ status: 401, message: 'unauthorized' }) };
    const res = await generateCloudflareWallpapers(mockAi, { prompt: 'Deep space nebula' });
    expect(res.success).toBe(false);
    expect(res.code).toBe('CLOUDFLARE_AUTH_ERROR');
  });

  it('7. handles Cloudflare Workers AI model error', async () => {
    const mockAi = { run: vi.fn().mockRejectedValue({ status: 500, message: 'model execution failure' }) };
    const res = await generateCloudflareWallpapers(mockAi, { prompt: 'Deep space nebula' });
    expect(res.success).toBe(false);
    expect(res.code).toBe('CLOUDFLARE_MODEL_ERROR');
  });

  it('8. verifies unavailable status when AI binding is unconfigured', async () => {
    const status = await checkCloudflareWallpaperStatus(null, undefined, undefined);
    expect(status.configured).toBe(false);
    expect(status.status).toBe('CLOUDFLARE_AI_UNAVAILABLE');
  });

  it('9. verifies zero secret exposure to client JavaScript', () => {
    const windowToken = typeof window !== 'undefined' ? (window as any).VITE_CLOUDFLARE_API_TOKEN : undefined;
    expect(windowToken).toBeUndefined();
    expect(process.env.VITE_CLOUDFLARE_API_TOKEN).toBeUndefined();
  });

  it('10. verifies provider status exposure via aiWallpaperGenerator', async () => {
    const status = await aiWallpaperGenerator.checkProviderStatus();
    expect(status.providerName).toBe('Cloudflare Workers AI');
  });
});
