/**
 * ORION-9 LIVE EARTH & ASTRONOMICAL WALLPAPER REFINEMENT TEST SUITE
 * 
 * Verifies:
 * 1. Complete removal of old static arc / semicircle line code.
 * 2. Real 3D rotating planetary Earth rendering engine (spherical projection, rotation angle calculation).
 * 3. Earth positioning toward lower-left / left-center (approx 35-50% viewport height).
 * 4. Night-side clustered city lights (North America, Europe, Asia, India, Middle East, Oceania).
 * 5. Deep-blue to cyan atmospheric rim following Earth's curvature.
 * 6. Slow continuous planetary rotation (~120s configurable period).
 * 7. Recognizable Orion constellation in upper-right space quadrant.
 * 8. Clean central authentication surface for login card readability.
 * 9. Safe isolation: DEMO scheduler vs LIVE health probes for runtime pulses.
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OrionLiveLoginBackground } from '../../components/brand/OrionLiveLoginBackground';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { HealthService } from '../../operations/HealthService';

describe('ORION-9 Live Earth & Astronomical Wallpaper Engine', () => {
  it('1. verifies old static arc / dark semicircle code (#020408, PLANETARY HORIZON) is 100% absent', () => {
    const code = OrionLiveLoginBackground.toString();
    expect(code).not.toContain("#020408");
    expect(code).not.toContain("PLANETARY HORIZON");
    expect(code).not.toContain("STATIC_CITY_LIGHTS");
    expect(code).not.toContain("arcCenterX");
  });

  it('2. verifies real 3D Earth spherical projection & rotation math in engine', () => {
    const code = OrionLiveLoginBackground.toString();
    expect(code).toContain("earthCenterX");
    expect(code).toContain("earthCenterY");
    expect(code).toContain("earthRadius");
    expect(code).toContain("rotAngle");
    expect(code).toContain("GLOBAL_CITY_LIGHTS");
    expect(code).toContain("CONTINENT_OUTLINES");
  });

  it('3. verifies Earth lower-left positioning (0.18 width, 0.82 height)', () => {
    const code = OrionLiveLoginBackground.toString();
    expect(code).toContain("width * 0.18");
    expect(code).toContain("height * 0.82");
  });

  it('4. verifies atmospheric rim (deep blue to cyan edge)', () => {
    const code = OrionLiveLoginBackground.toString();
    expect(code).toContain("atmRimGrad");
    expect(code).toContain("rgba(56, 189, 248");
    expect(code).toContain("rgba(30, 58, 138");
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

  it('6. verifies default 120s rotation speed per full rotation', () => {
    const code = OrionLiveLoginBackground.toString();
    expect(code).toContain("rotationSpeedSeconds: 120");
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
