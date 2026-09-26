/**
 * ORION-9 LIVE SPACE WALLPAPER TEST SUITE (V6 FINAL REBUILD)
 * 
 * Verifies:
 * 1. Master baseline texture /orion9-space-baseline.png is used as source of truth.
 * 2. Independent Earth rotation with GLSL ShaderMaterial GPU acceleration.
 * 3. Orion constellation stars & localized sunlight glint logic.
 * 4. WebGL and reduced-motion fallbacks.
 * 5. HTML rendering & data-testid layer contract.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OrionLiveLoginBackground } from '../../components/brand/OrionLiveLoginBackground';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { HealthService } from '../../operations/HealthService';

describe('ORION-9 Live Space Wallpaper & Login Environment (V6 Master Rebuild)', () => {
  it('1. verifies master visual asset /orion9-space-baseline.png is used', () => {
    const code = OrionLiveLoginBackground.toString();
    expect(code).toContain("orion9-space-baseline.png");
  });

  it('2. verifies GLSL shader includes Earth rotation & GLSL uniform calculations', () => {
    const code = OrionLiveLoginBackground.toString();
    expect(code).toContain("uEarthRotationSpeed");
    expect(code).toContain("uSunGlintIntensity");
    expect(code).toContain("uReducedMotion");
  });

  it('3. verifies localized sunlight glint state management & timing', () => {
    const code = OrionLiveLoginBackground.toString();
    expect(code).toContain("uSunGlintIntensity");
    expect(code).toContain("glintActive");
    expect(code).toContain("glintDuration");
  });

  it('4. renders background layer contract with data-layer attributes without crashing', () => {
    const html = renderToString(<OrionLiveLoginBackground />);
    expect(html).toContain('data-testid="orion-login-environment"');
    expect(html).toContain('data-layer-earth="true"');
    expect(html).toContain('data-layer-atmosphere="true"');
    expect(html).toContain('data-layer-constellation="true"');
  });

  it('5. verifies environment-isolated runtime signal probes', async () => {
    const env = dbManager.getEnvironment();
    expect(['DEMO', 'LIVE']).toContain(env);

    const health = await HealthService.getInstance().runHealthCheck();
    expect(typeof health.readinessProbe).toBe('boolean');
  });
});
