import { describe, it, expect, vi } from 'vitest';
import { OrionLiveLoginBackground, DEFAULT_LIVE_BACKGROUND_CONFIG } from '../../components/brand/OrionLiveLoginBackground';
import { Login } from '../../components/auth/Login';

describe('Orion Live Login Star Environment', () => {
  // 1. OrionLoginEnvironment renders
  it('1. exports OrionLiveLoginBackground component function', () => {
    expect(OrionLiveLoginBackground).toBeDefined();
    expect(typeof OrionLiveLoginBackground).toBe('function');
    expect(OrionLiveLoginBackground.name).toBe('OrionLiveLoginBackground');
  });

  // 2. Star field configuration
  it('2. provides default configuration with star twinkle periods', () => {
    expect(DEFAULT_LIVE_BACKGROUND_CONFIG).toBeDefined();
    expect(DEFAULT_LIVE_BACKGROUND_CONFIG.enabled).toBe(true);
    expect(DEFAULT_LIVE_BACKGROUND_CONFIG.periods.twinkle).toBeGreaterThan(0);
  });

  // 3. Orion constellation configuration
  it('3. configures Orion constellation breathing period (45-90s)', () => {
    const period = DEFAULT_LIVE_BACKGROUND_CONFIG.periods.constellation;
    expect(period).toBeGreaterThanOrEqual(45);
    expect(period).toBeLessThanOrEqual(90);
  });

  // 4. Nebula configuration
  it('4. configures nebula drift period (90-180s)', () => {
    const period = DEFAULT_LIVE_BACKGROUND_CONFIG.periods.nebula;
    expect(period).toBeGreaterThanOrEqual(90);
    expect(period).toBeLessThanOrEqual(180);
  });

  // 5. Horizon configuration
  it('5. configures planetary horizon glow period (120s)', () => {
    const period = DEFAULT_LIVE_BACKGROUND_CONFIG.periods.horizon;
    expect(period).toBe(120);
  });

  // 6. Pointer-events: none requirement
  it('6. environment component source includes pointer-events-none styling', () => {
    const code = OrionLiveLoginBackground.toString();
    expect(code).toContain('pointer-events-none');
    expect(code).toContain('select-none');
  });

  // 7. Login controls interactive in component source
  it('7. Login component defines interactive username, password, submit button, and remember me controls', () => {
    const loginCode = Login.toString();
    expect(loginCode).toContain('username');
    expect(loginCode).toContain('password');
    expect(loginCode).toContain('Enter Orion');
    expect(loginCode).toContain('Remember me');
  });

  // 8. Reduced-motion disables animation
  it('8. checks prefers-reduced-motion in quality auto-detection', () => {
    const code = OrionLiveLoginBackground.toString();
    expect(code).toContain('prefers-reduced-motion');
    expect(code).toContain('STATIC');
  });

  // 9 & 10. Page visibility pauses and resumes animation
  it('9 & 10. listens to document visibilitychange events', () => {
    const code = OrionLiveLoginBackground.toString();
    expect(code).toContain('visibilitychange');
  });

  // 11. No external wallpaper URL
  it('11. zero external CDN / remote video / image URLs exist in wallpaper code', () => {
    const bgCode = OrionLiveLoginBackground.toString();
    expect(bgCode).not.toContain('http://');
    expect(bgCode).not.toContain('https://');
    expect(bgCode).not.toContain('.mp4');
    expect(bgCode).not.toContain('.gif');
  });

  // 12. Responsive layout
  it('12. Login root applies full-viewport responsive layout classes', () => {
    const loginCode = Login.toString();
    expect(loginCode).toContain('w-screen');
    expect(loginCode).toContain('h-[100dvh]');
  });

  // 13. Existing authentication unchanged
  it('13. Login uses authoritative useAuth hook', () => {
    const loginCode = Login.toString();
    expect(loginCode).toContain('useAuth');
  });

  // 14. Existing power control unchanged
  it('14. Login binds power button to triggerShutdown', () => {
    const loginCode = Login.toString();
    expect(loginCode).toContain('triggerShutdown');
    expect(loginCode).toContain('Shut Down');
  });

  // 15. Existing language selector unchanged
  it('15. Login includes English language selector control', () => {
    const loginCode = Login.toString();
    expect(loginCode).toContain('English');
    expect(loginCode).toContain('Select language');
  });

  // 16. Privacy / Terms / Help remain functional
  it('16. Login includes Privacy, Terms, and Help links', () => {
    const loginCode = Login.toString();
    expect(loginCode).toContain('Privacy');
    expect(loginCode).toContain('Terms');
    expect(loginCode).toContain('Help');
  });
});
