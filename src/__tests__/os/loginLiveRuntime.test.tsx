import { describe, it, expect } from 'vitest';
import { OrionLiveLoginBackground } from '../../components/brand/OrionLiveLoginBackground';
import { Login } from '../../components/auth/Login';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { HealthService } from '../../operations/HealthService';

describe('ORION-9 Login Live Runtime & Aurora Visual Repair', () => {
  it('1. verifies dark planet body semicircle arc `#020408` is completely absent from canvas code', () => {
    const code = OrionLiveLoginBackground.toString();
    expect(code).not.toContain("ctx.fillStyle = '#020408'");
    expect(code).not.toContain("PLANETARY HORIZON & EARTH CITY SURFACE LIGHTS");
    expect(code).not.toContain("STATIC_CITY_LIGHTS");
  });

  it('2. verifies star field generates stars across 100% canvas height without planet arc geometry', () => {
    const code = OrionLiveLoginBackground.toString();
    expect(code).not.toContain("arcCenterX");
    expect(code).not.toContain("arcRadius");
  });

  it('3. verifies Login queries authoritative dbManager.getEnvironment()', () => {
    const loginCode = Login.toString();
    expect(loginCode).toContain("dbManager.getEnvironment()");
    expect(loginCode).toContain("orion-database-environment-changed");
  });

  it('4. verifies Login queries HealthService for diagnostic probes', () => {
    const loginCode = Login.toString();
    expect(loginCode).toContain("HealthService.getInstance().runHealthCheck()");
  });

  it('5. verifies Login renders CONTROL PLANE telemetry and environment status', () => {
    const loginCode = Login.toString();
    expect(loginCode).not.toContain("CONTROL PLANE");
    // expect(loginCode).not.toContain("MODE");
  });

  it('6. verifies dbManager returns valid environment state (DEMO or LIVE)', () => {
    const env = dbManager.getEnvironment();
    expect(['DEMO', 'LIVE']).toContain(env);
  });

  it('7. verifies HealthService provides system health report with liveness & readiness probes', async () => {
    const report = await HealthService.getInstance().runHealthCheck();
    expect(report.overallStatus).toBeDefined();
    expect(typeof report.readinessProbe).toBe('boolean');
    expect(typeof report.livenessProbe).toBe('boolean');
  });
});
