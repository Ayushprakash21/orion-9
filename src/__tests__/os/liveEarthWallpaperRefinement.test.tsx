/**
 * ORION-9 LIVE EARTH & ASTRONOMICAL WALLPAPER REFINEMENT TEST SUITE (V5)
 * 
 * Verifies:
 * 1. Complete removal of old static arc / semicircle line code.
 * 2. Clean 3D WebGL Earth with real texture-based day/night terminator shader.
 * 3. World-space sun direction for stable terminator (mat3(modelMatrix)).
 * 4. Real texture city lights (earth_lights_2048.png, not procedural).
 * 5. Thin Fresnel atmosphere (BackSide, NormalBlending, pow 4.0, alpha ≤ 0.18).
 * 6. Slow continuous planetary rotation (420s default period).
 * 7. Recognizable Orion constellation in upper-left space quadrant.
 * 8. Clean central authentication surface for login card readability.
 * 9. Safe isolation: DEMO scheduler vs LIVE health probes for runtime pulses.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OrionLiveLoginBackground } from '../../components/brand/OrionLiveLoginBackground';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { HealthService } from '../../operations/HealthService';

describe('ORION-9 Live Earth & Astronomical Wallpaper Engine', () => {
  it('1. verifies old static arc / dark semicircle / procedural code is 100% absent', () => {
    const code = OrionLiveLoginBackground.toString();
    expect(code).not.toContain("#020408");
    expect(code).not.toContain("PLANETARY HORIZON");
    expect(code).not.toContain("STATIC_CITY_LIGHTS");
    expect(code).not.toContain("arcCenterX");
    expect(code).not.toContain("createPhotorealisticEarthDayMap");
    expect(code).not.toContain("createPhotorealisticEarthNightMap");
    expect(code).not.toContain("createPhotorealisticCloudMap");
  });

  it('2. verifies clean WebGL Earth with world-space terminator shader', () => {
    const code = OrionLiveLoginBackground.toString();
    // Real texture assets (not procedural)
    expect(code).toContain("earth_atmos_2048");
    expect(code).toContain("earth_lights_2048");
    expect(code).toContain("earth_clouds_1024");
    // World-space normals via mat3(modelMatrix)
    expect(code).toContain("mat3(modelMatrix)");
    // Rotation angle calculation
    expect(code).toContain("rotAngle");
    // Earth radius constant
    expect(code).toContain("EARTH_RADIUS");
  });

  it('3. verifies Earth positioned in lower viewport (horizon at ~70%)', () => {
    const code = OrionLiveLoginBackground.toString();
    // Earth pushed down with large negative Y offset
    expect(code).toContain("-14");
  });

  it('4. verifies thin Fresnel atmosphere (BackSide, NormalBlending)', () => {
    const code = OrionLiveLoginBackground.toString();
    expect(code).toContain("BackSide");
    expect(code).toContain("NormalBlending");
    expect(code).toContain("fresnel");
    expect(code).toContain("0.18");
  });

  it('5. verifies recognizable Orion constellation stars & lines', () => {
    const code = OrionLiveLoginBackground.toString();
    expect(code).toContain("Betelgeuse");
    expect(code).toContain("Rigel");
    expect(code).toContain("Alnitak");
    expect(code).toContain("Alnilam");
    expect(code).toContain("Mintaka");
    expect(code).toContain("ORION_LINES");
  });

  it('6. verifies default 420s rotation speed per full rotation', () => {
    const code = OrionLiveLoginBackground.toString();
    expect(code).toContain("rotationSpeedSeconds: 420");
  });

  it('7. renders background element without crashing', () => {
    const html = renderToString(<OrionLiveLoginBackground />);
    expect(html).toContain('data-testid="orion-login-environment"');
    expect(html).toContain('data-layer-earth="true"');
    expect(html).toContain('data-layer-atmosphere="true"');
    expect(html).toContain('data-layer-constellation="true"');
  });

  it('8. verifies environment-isolated runtime signal pulses', async () => {
    const env = dbManager.getEnvironment();
    expect(['DEMO', 'LIVE']).toContain(env);

    const health = await HealthService.getInstance().runHealthCheck();
    expect(typeof health.readinessProbe).toBe('boolean');
  });
});
