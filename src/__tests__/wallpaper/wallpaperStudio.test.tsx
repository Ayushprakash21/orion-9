import { describe, it, expect, beforeEach, vi } from 'vitest';
import { wallpaperRepository, SYSTEM_DEFAULT_WALLPAPERS } from '../../repositories/WallpaperRepository';
import { aiWallpaperGenerator } from '../../services/wallpaper/AiWallpaperGenerator';
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
      expect(active.wallpaperId).toBe('sys-orion-aurora-space');
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
      candidates.forEach((cand) => {
        expect(cand.candidateId).toBeDefined();
        expect(cand.width).toBe(2560);
        expect(cand.height).toBe(1440);
        expect(cand.assetUrl).toContain('data:image/svg+xml');
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

  describe('3. Policy Governance & Environment Isolation', () => {
    it('3.1 manages system wallpaper policy controls', async () => {
      const initialPolicy = await wallpaperRepository.getPolicy();
      expect(initialPolicy.allowUserCustomization).toBe(true);

      const updatedPolicy = await wallpaperRepository.updatePolicy({
        allowUserCustomization: false,
        allowAiGeneration: false,
      });

      expect(updatedPolicy.allowUserCustomization).toBe(false);
      expect(updatedPolicy.allowAiGeneration).toBe(false);
    });

    it('3.2 preserves DEMO vs LIVE environment tag on wallpaper records', async () => {
      const currentEnv = dbManager.getEnvironment();
      const active = await wallpaperRepository.getActiveWallpaper();
      expect(['DEMO', 'LIVE']).toContain(active.environment);
      expect(['DEMO', 'LIVE']).toContain(currentEnv);
    });
  });

  describe('4. Target Isolation & Independent Target Reset', () => {
    it('4.1 isolates LOGIN and DESKTOP active wallpaper selections independently', async () => {
      const userId = 'user_isolation_test_01';
      const tenantId = 'tenant_isolation_test_01';

      // 1. Set DESKTOP to sys-deep-orion-nebula
      await wallpaperRepository.setActiveWallpaper('sys-deep-orion-nebula', userId, 'desktop');

      // 2. Set LOGIN to sys-orbital-grid-node
      await wallpaperRepository.setActiveWallpaper('sys-orbital-grid-node', userId, 'login');

      // 3. getActiveWallpaper for desktop must return sys-deep-orion-nebula
      const activeDesktop = await wallpaperRepository.getActiveWallpaper(userId, tenantId, 'desktop');
      expect(activeDesktop.wallpaperId).toBe('sys-deep-orion-nebula');

      // 4. getActiveWallpaper for login must return sys-orbital-grid-node
      const activeLogin = await wallpaperRepository.getActiveWallpaper(userId, tenantId, 'login');
      expect(activeLogin.wallpaperId).toBe('sys-orbital-grid-node');

      // 5. Reset LOGIN only
      await wallpaperRepository.resetToSystemDefault(userId, 'login');

      // 6. LOGIN becomes sys-orion-dark-horizon (Dark Cinematic Horizon)
      const resetLogin = await wallpaperRepository.getActiveWallpaper(userId, tenantId, 'login');
      expect(resetLogin.wallpaperId).toBe('sys-orion-dark-horizon');

      // 7. DESKTOP remains sys-deep-orion-nebula
      const preservedDesktop = await wallpaperRepository.getActiveWallpaper(userId, tenantId, 'desktop');
      expect(preservedDesktop.wallpaperId).toBe('sys-deep-orion-nebula');
    });

    it('4.2 ensures targetless legacy or default selection does not cross into LOGIN', async () => {
      const userId = 'user_legacy_test_02';

      // Set desktop legacy selection
      await wallpaperRepository.setActiveWallpaper('sys-deep-orion-nebula', userId, 'desktop');

      // Login target must return default (sys-orion-dark-horizon), never desktop selection
      const activeLogin = await wallpaperRepository.getActiveWallpaper(userId, 'global', 'login');
      expect(activeLogin.wallpaperId).toBe('sys-orion-dark-horizon');
      expect(activeLogin.wallpaperId).not.toBe('sys-deep-orion-nebula');
    });
  });
});
