import { describe, it, expect } from 'vitest';
import { aiWallpaperGenerator } from '../../services/wallpaper/AiWallpaperGenerator';

describe('Gemini Real Image Wallpaper API Endpoints & Contract', () => {

  it('1. verifies status format & contract for Gemini wallpaper provider', async () => {
    const status = await aiWallpaperGenerator.checkProviderStatus();
    expect(status).toBeDefined();
    expect(status.providerName).toMatch(/(Cloudflare Workers AI|Gemini)/);
    expect(status.supportedDimensions).toBeDefined();
  });

  it('2. generates candidates in test mode cleanly with 3 candidate objects', async () => {
    const candidates = await aiWallpaperGenerator.generateCandidates({
      prompt: 'Deep space Orion constellation wallpaper for enterprise OS',
      style: 'Space',
      atmosphereIntensity: 0.8,
      motionPreference: 'Atmospheric',
      width: 2560,
      height: 1440,
    });

    expect(candidates).toHaveLength(3);
    expect(candidates[0].candidateId).toBeDefined();
    expect(candidates[1].candidateId).toBeDefined();
    expect(candidates[2].candidateId).toBeDefined();
    expect(candidates[0].assetUrl).toBeDefined();
    expect(candidates[1].assetUrl).toBeDefined();
    expect(candidates[2].assetUrl).toBeDefined();
  });

  it('3. ensures candidates are distinct objects with valid 16:9 / 2560x1440 dimensions', async () => {
    const candidates = await aiWallpaperGenerator.generateCandidates({
      prompt: 'Abstract logistics network topology',
      style: 'Abstract',
      atmosphereIntensity: 0.5,
      motionPreference: 'Subtle',
      width: 2560,
      height: 1440,
    });

    expect(candidates[0].width).toBe(2560);
    expect(candidates[0].height).toBe(1440);
    expect(candidates[0].candidateId).not.toEqual(candidates[1].candidateId);
    expect(candidates[1].candidateId).not.toEqual(candidates[2].candidateId);
  });
});
