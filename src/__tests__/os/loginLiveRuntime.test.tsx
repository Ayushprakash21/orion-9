import { describe, it, expect } from 'vitest';
import { OrionLiveWallpaper } from '../../os/components/OrionLiveWallpaper';
import { Login } from '../../components/auth/Login';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { HealthService } from '../../operations/HealthService';

describe('ORION-9 Login Runtime & Authentication', () => {
  it('1. verifies OrionLiveWallpaper is a valid component function', () => {
    expect(OrionLiveWallpaper).toBeDefined();
    expect(typeof OrionLiveWallpaper).toBe('function');
  });

  it('2. verifies Login queries authoritative dbManager.getEnvironment()', () => {
    const loginCode = Login.toString();
    expect(loginCode).toContain("dbManager.getEnvironment()");
    expect(loginCode).toContain("orion-database-environment-changed");
  });

  it('3. verifies Login queries HealthService for diagnostic probes', () => {
    const loginCode = Login.toString();
    expect(loginCode).toContain("HealthService.getInstance().runHealthCheck()");
  });

  it('4. verifies dbManager returns valid environment state (DEMO or LIVE)', () => {
    const env = dbManager.getEnvironment();
    expect(['DEMO', 'LIVE']).toContain(env);
  });

  it('5. verifies HealthService provides system health report with liveness & readiness probes', async () => {
    const report = await HealthService.getInstance().runHealthCheck();
    expect(report.overallStatus).toBeDefined();
    expect(typeof report.readinessProbe).toBe('boolean');
    expect(typeof report.livenessProbe).toBe('boolean');
  });
});
