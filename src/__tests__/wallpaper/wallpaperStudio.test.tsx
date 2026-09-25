import { describe, it, expect, beforeEach, vi } from 'vitest';
import { wallpaperRepository, SYSTEM_DEFAULT_WALLPAPERS } from '../../repositories/WallpaperRepository';
import { aiWallpaperGenerator } from '../../services/wallpaper/AiWallpaperGenerator';
import { sceneAnalyzer } from '../../services/wallpaper/SceneAnalyzer';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { DEFAULT_WALLPAPER_POLICY, WallpaperRecord } from '../../types/wallpaper';

describe('ORION-9 Wallpaper Studio & Live Wallpaper Engine', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Wallpaper Repository & Metadata Authority', () => {
    it('1.1 exposes default system wallpapers with 2560x1440 16:9 resolution profile', async () => {
      const wallpapers = await wallpaperRepository.getAvailableWallpapers('global');
      expect(wallpapers.length).toBeGreaterThan(0);

      const sysDef = wallpapers.find(w => w.isSystemDefault);
      expect(sysDef).toBeDefined();
      expect(sysDef?.width).toBe(2560);
      expect(sysDef?.height).toBe(1440);
      expect(sysDef?.aspectRatio).toBe('16:9');
    });

    it('1.2 saves custom wallpaper record with metadata and tenant isolation', async () => {
      const custom: WallpaperRecord = {
        wallpaperId: 'wp-test-001',
        tenantId: 'tenant-alpha',
        ownerType: 'USER',
        ownerId: 'user-123',
        name: 'Test Custom Wallpaper',
        assetUrl: 'data:image/svg+xml;utf8,<svg></svg>',
        source: 'UPLOAD',
        aiGenerated: false,
        width: 2560,
        height: 1440,
        aspectRatio: '16:9',
        motionProfile: {
          backgroundDrift: 0.04,
          parallax: 0.12,
          atmosphere: 0.08,
          particles: 0.04,
          lightMovement: 0.06,
          objectMotion: 0.03,
        },
        runtimeReactive: true,
        environment: 'DEMO',
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = await wallpaperRepository.saveWallpaper(custom);
      expect(saved.wallpaperId).toBe('wp-test-001');

      const retrieved = await wallpaperRepository.getWallpaperById('wp-test-001');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.tenantId).toBe('tenant-alpha');
    });

    it('1.3 enforces user setting and resetting active wallpaper', async () => {
      await wallpaperRepository.setActiveWallpaper('sys-deep-orion-nebula', 'user-test');
      let active = await wallpaperRepository.getActiveWallpaper('user-test');
      expect(active.wallpaperId).toBe('sys-deep-orion-nebula');

      await wallpaperRepository.resetToSystemDefault('user-test');
      active = await wallpaperRepository.getActiveWallpaper('user-test');
      expect(active.wallpaperId).toBe('sys-scm-global-network');
    });
  });

  describe('2. AI Wallpaper Generator (3 Candidate Generation)', () => {
    it('2.1 generates exactly 3 candidate wallpapers with 2560x1440 composition', async () => {
      const candidates = await aiWallpaperGenerator.generateCandidates({
        prompt: 'Futuristic deep space aurora environment',
        style: 'Aurora',
        atmosphereIntensity: 0.85,
        motionPreference: 'Atmospheric',
      });

      expect(candidates).toHaveLength(3);
      candidates.forEach((cand, idx) => {
        expect(cand.candidateId).toBeDefined();
        expect(cand.width).toBe(2560);
        expect(cand.height).toBe(1440);
        expect(cand.assetUrl).toContain('data:image/svg+xml');
        expect(cand.suggestedMotionProfile).toBeDefined();
      });
    });

    it('2.2 generates candidate wallpapers without embedding Orion logo', async () => {
      const candidates = await aiWallpaperGenerator.generateCandidates({
        prompt: 'Clean atmospheric landscape',
        style: 'Nature',
        atmosphereIntensity: 0.5,
        motionPreference: 'Subtle',
      });

      candidates.forEach(cand => {
        expect(cand.assetUrl).not.toContain('ORION-9 LOGO');
        expect(cand.assetUrl).not.toContain('orion-brand-logo');
      });
    });
  });

  describe('3. AI Scene Analyzer & Motion Profile Bounding', () => {
    it('3.1 analyzes scene and generates bounded MotionProfile within safety limits', () => {
      const result = sceneAnalyzer.analyzeScene({
        style: 'Space',
        prompt: 'hyper space cosmic nebula stars',
        atmosphereIntensity: 1.0,
      });

      expect(result.recommendedProfile).toBeDefined();
      expect(result.recommendedProfile.parallax).toBeLessThanOrEqual(0.25);
      expect(result.recommendedProfile.atmosphere).toBeLessThanOrEqual(0.20);
      expect(result.recommendedProfile.particles).toBeLessThanOrEqual(0.20);
      expect(result.detectedRegions.skyOrSpace).toBe(true);
    });
  });

  describe('4. Policy Governance & Environment Isolation', () => {
    it('4.1 manages system wallpaper policy controls', async () => {
      const initialPolicy = await wallpaperRepository.getPolicy();
      expect(initialPolicy.allowUserCustomization).toBe(true);

      const updatedPolicy = await wallpaperRepository.updatePolicy({
        allowUserCustomization: false,
        allowAiGeneration: false,
      });

      expect(updatedPolicy.allowUserCustomization).toBe(false);
      expect(updatedPolicy.allowAiGeneration).toBe(false);
    });

    it('4.2 preserves DEMO vs LIVE environment tag on wallpaper records', async () => {
      const currentEnv = dbManager.getEnvironment();
      const active = await wallpaperRepository.getActiveWallpaper();
      expect(['DEMO', 'LIVE']).toContain(active.environment);
      expect(['DEMO', 'LIVE']).toContain(currentEnv);
    });
  });
});
