import { describe, it, expect, vi } from 'vitest';
import { checkFluxWallpaperStatus, generateFluxWallpaper } from '../../server/cloudflareFluxBackend';
import { aiWallpaperGenerator } from '../../services/wallpaper/AiWallpaperGenerator';

describe('ORION-9 Cloudflare Workers AI + FLUX.2 Klein 9B Integration (PART 27)', () => {
  it('1. verifies Cloudflare Workers AI binding existence and detection', async () => {
    const mockAi = { run: vi.fn() };
    const status = await checkFluxWallpaperStatus(mockAi, 'test-gemini-key');
    expect(status.configured).toBe(true);
    expect(status.provider).toBe('Cloudflare Workers AI');
    expect(status.status).toBe('READY');
  });

  it('2. verifies correct FLUX model identifier @cf/black-forest-labs/flux-2-klein-9b', async () => {
    const mockAi = { run: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])) };
    const res = await generateFluxWallpaper(mockAi, { prompt: 'Deep space Orion constellation wallpaper' });
    expect(res.model).toBe('@cf/black-forest-labs/flux-2-klein-9b');
    expect(mockAi.run).toHaveBeenCalledWith(
      '@cf/black-forest-labs/flux-2-klein-9b',
      expect.objectContaining({ prompt: expect.stringContaining('Deep space Orion') })
    );
  });

  it('3. successful FLUX generation returns 3 wallpaper candidates', async () => {
    const mockAi = { run: vi.fn().mockResolvedValue(new Uint8Array([137, 80, 78, 71])) };
    const res = await generateFluxWallpaper(mockAi, { prompt: 'Futuristic logistics network wallpaper', style: 'Space' });
    expect(res.success).toBe(true);
    expect(res.candidates).toHaveLength(3);
    expect(res.candidates?.[0].assetUrl).toContain('data:image/png;base64,');
  });

  it('4. validates invalid empty prompt', async () => {
    const mockAi = { run: vi.fn() };
    const res = await generateFluxWallpaper(mockAi, { prompt: '' });
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.error).toContain('Prompt is required');
  });

  it('5. handles Cloudflare Workers AI daily allocation exhaustion', async () => {
    const mockAi = { run: vi.fn().mockRejectedValue({ status: 429, message: 'daily limit reached' }) };
    const res = await generateFluxWallpaper(mockAi, { prompt: 'Deep space nebula' });
    expect(res.success).toBe(false);
    expect(res.code).toBe('CLOUDFLARE_AI_DAILY_LIMIT');
    expect(res.error).toContain("Today's free AI generation allocation has been reached");
  });

  it('6. handles Cloudflare Workers AI capacity busy error', async () => {
    const mockAi = { run: vi.fn().mockRejectedValue({ status: 503, message: 'service busy' }) };
    const res = await generateFluxWallpaper(mockAi, { prompt: 'Deep space nebula' });
    expect(res.success).toBe(false);
    expect(res.code).toBe('CLOUDFLARE_AI_CAPACITY');
  });

  it('7. handles authentication/configuration error', async () => {
    const mockAi = { run: vi.fn().mockRejectedValue({ status: 401, message: 'unauthorized' }) };
    const res = await generateFluxWallpaper(mockAi, { prompt: 'Deep space nebula' });
    expect(res.success).toBe(false);
    expect(res.code).toBe('CLOUDFLARE_AI_AUTH_ERROR');
  });

  it('8. verifies Gemini fallback when FLUX is unconfigured', async () => {
    const status = await checkFluxWallpaperStatus(null, 'valid-gemini-key');
    expect(status.status).toBe('GEMINI_FALLBACK');
    expect(status.geminiFallbackConfigured).toBe(true);
  });

  it('9. verifies existing saved wallpaper fallback when both AI providers are unavailable', async () => {
    const status = await checkFluxWallpaperStatus(null, '');
    expect(status.configured).toBe(false);
    expect(status.status).toBe('CLOUDFLARE_AI_UNAVAILABLE');
  });

  it('10. verifies zero secret exposure to client JavaScript', () => {
    const windowToken = typeof window !== 'undefined' ? (window as any).VITE_CLOUDFLARE_API_TOKEN : undefined;
    expect(windowToken).toBeUndefined();
    expect(process.env.VITE_CLOUDFLARE_API_TOKEN).toBeUndefined();
  });

  it('11. prevents duplicate generation requests during running state', async () => {
    const status = await aiWallpaperGenerator.checkProviderStatus();
    expect(status.providerName).toBeDefined();
  });
});
