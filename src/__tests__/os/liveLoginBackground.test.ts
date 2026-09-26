import { describe, it, expect } from 'vitest';
import { OrionLiveWallpaper } from '../../os/components/OrionLiveWallpaper';

describe('OrionLiveWallpaper (Shared Engine for Login & Desktop)', () => {
  it('exports OrionLiveWallpaper component function', () => {
    expect(OrionLiveWallpaper).toBeDefined();
    expect(typeof OrionLiveWallpaper).toBe('function');
  });

  it('is a valid React component function', () => {
    expect(OrionLiveWallpaper.name).toBe('OrionLiveWallpaper');
  });
});
