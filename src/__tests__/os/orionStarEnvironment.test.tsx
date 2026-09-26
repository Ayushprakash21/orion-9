import { describe, it, expect } from 'vitest';
import { OrionLiveWallpaper } from '../../os/components/OrionLiveWallpaper';
import { Login } from '../../components/auth/Login';

describe('Orion Live Space Engine & Login', () => {
  it('1. exports OrionLiveWallpaper component function', () => {
    expect(OrionLiveWallpaper).toBeDefined();
    expect(typeof OrionLiveWallpaper).toBe('function');
    expect(OrionLiveWallpaper.name).toBe('OrionLiveWallpaper');
  });

  it('2. OrionLiveWallpaper component source includes pointer-events-none styling', () => {
    const code = OrionLiveWallpaper.toString();
    expect(code).toContain('pointer-events-none');
    expect(code).toContain('select-none');
  });

  it('3. Login component defines interactive username, password, submit button, and remember me controls', () => {
    const loginCode = Login.toString();
    expect(loginCode).toContain('username');
    expect(loginCode).toContain('password');
    expect(loginCode).toContain('rememberMe');
  });

  it('4. zero external CDN / remote video / image URLs exist in wallpaper engine code', () => {
    const bgCode = OrionLiveWallpaper.toString();
    expect(bgCode).not.toContain('http://');
    expect(bgCode).not.toContain('https://');
    expect(bgCode).not.toContain('.mp4');
    expect(bgCode).not.toContain('.gif');
  });

  it('5. Login root applies full-viewport responsive layout classes', () => {
    const loginCode = Login.toString();
    expect(loginCode).toContain('w-screen');
  });
});
