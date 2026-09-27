import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { aiWallpaperGenerator } from '../../services/wallpaper/AiWallpaperGenerator';
import { cloudflareWallpaperImageProvider } from '../../services/wallpaper/CloudflareWallpaperImageProvider';
import { generateCloudflareWallpapers } from '../../server/cloudflareAiBackend';

describe('ORION-9 Wallpaper Studio Provider Privacy & Native Quality Suite', () => {
  const userStudioPath = path.resolve(__dirname, '../../components/wallpaper/UserWallpaperStudio.tsx');
  const userStudioSource = fs.readFileSync(userStudioPath, 'utf-8');

  it('1. User Wallpaper Studio does not render provider name in UI', () => {
    // Must NOT contain visible provider name strings in JSX
    expect(userStudioSource).not.toContain('Google Gemini');
    expect(userStudioSource).not.toContain('Cloudflare Workers AI');
    expect(userStudioSource).not.toContain('AI Provider:');
  });

  it('2. User Wallpaper Studio does not render model name in UI', () => {
    // Must NOT contain model identifiers in JSX
    expect(userStudioSource).not.toContain('gemini-2.5-flash-image');
    expect(userStudioSource).not.toContain('gemini-3.1-flash-image');
    expect(userStudioSource).not.toContain('@cf/black-forest-labs/flux-2-klein-4b');
    expect(userStudioSource).not.toContain('flux-1-schnell');
  });

  it('3. Raw provider errors are not displayed to users (sanitized generic status & messages)', () => {
    expect(userStudioSource).toContain('AI wallpaper generation is temporarily unavailable.');
    expect(userStudioSource).toContain('AI generation limit reached. Please try again later.');
    expect(userStudioSource).toContain('Wallpaper generation failed. Please try again.');
    expect(userStudioSource).not.toContain('GEMINI_AUTH_ERROR');
    expect(userStudioSource).not.toContain('CLOUDFLARE_AUTH_ERROR');
  });

  it('4. Candidate assetUrl is the original high-fidelity asset', async () => {
    const candidates = await cloudflareWallpaperImageProvider.generateTestMockCandidates({
      prompt: 'Cosmic nebula horizon',
      style: 'Space',
      width: 1920,
      height: 1080,
    });

    expect(candidates).toHaveLength(3);
    for (const cand of candidates) {
      expect(cand.assetUrl).toBeDefined();
      expect(cand.assetUrl).toContain('data:image/svg+xml');
      expect(cand.assetUrl).toContain('width="1920" height="1080"');
    }
  });

  it('5. thumbnailUrl is separate from assetUrl for optimal previewing', async () => {
    const candidates = await cloudflareWallpaperImageProvider.generateTestMockCandidates({
      prompt: 'Emerald aurora mountains',
      style: 'Aurora',
      width: 1920,
      height: 1080,
    });

    for (const cand of candidates) {
      expect(cand.thumbnailUrl).toBeDefined();
      expect(cand.thumbnailUrl).not.toEqual(cand.assetUrl);
      expect(cand.thumbnailUrl).toContain('thumb');
    }
  });

  it('6. Actual native image dimensions (1920x1080) are preserved', async () => {
    const candidates = await cloudflareWallpaperImageProvider.generateTestMockCandidates({
      prompt: 'Deep space station',
      style: 'Space',
      width: 1920,
      height: 1080,
    });

    for (const cand of candidates) {
      expect(cand.width).toBe(1920);
      expect(cand.height).toBe(1080);
      expect(cand.sourceWidth).toBe(1920);
      expect(cand.sourceHeight).toBe(1080);
      expect(cand.finalWidth).toBe(1920);
      expect(cand.finalHeight).toBe(1080);
    }
  });

  it('7. Exactly three candidates are generated with unique seeds/IDs', async () => {
    const candidates = await cloudflareWallpaperImageProvider.generateTestMockCandidates({
      prompt: 'Ocean horizon',
      style: 'Nature',
      width: 1920,
      height: 1080,
    });

    expect(candidates).toHaveLength(3);
    const ids = new Set(candidates.map(c => c.candidateId));
    expect(ids.size).toBe(3);

    const assetUrls = new Set(candidates.map(c => c.assetUrl));
    expect(assetUrls.size).toBe(3);
  });

  it('8. Apply uses the original assetUrl and persists actual resolution', () => {
    expect(userStudioSource).toContain('assetUrl: selectedAssetUrl');
    expect(userStudioSource).toContain('width: activeWidth');
    expect(userStudioSource).toContain('height: activeHeight');
  });

  it('9. Metadata reflects actual resolution in secondary preview pane', () => {
    expect(userStudioSource).toContain('currentResolutionText');
    expect(userStudioSource).toContain('(16:9)');
    // Ensures false hardcoded resolution string is removed from secondary preview
    expect(userStudioSource).not.toContain('<span className="text-slate-300">2560 × 1440 (16:9)</span>');
  });

  it('10. No Gemini provider name appears in normal user-facing Wallpaper Studio', () => {
    expect(userStudioSource.toLowerCase()).not.toContain('gemini');
  });

  it('11. Provider credentials are never exposed in client-facing code', () => {
    expect(userStudioSource).not.toContain('CLOUDFLARE_API_TOKEN');
    expect(userStudioSource).not.toContain('CLOUDFLARE_ACCOUNT_ID');
    expect(userStudioSource).not.toContain('GEMINI_API_KEY');
  });

  it('12. Neutral status card renders internal AI IMAGE GENERATION indicator', () => {
    expect(userStudioSource).toContain('AI IMAGE GENERATION');
    expect(userStudioSource).toContain('Ready for generation');
  });
});
