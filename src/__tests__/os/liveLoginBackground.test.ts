import { describe, it, expect } from 'vitest';
import { OrionLiveLoginBackground } from '../../components/brand/OrionLiveLoginBackground';

describe('OrionLiveLoginBackground', () => {
  it('exports OrionLiveLoginBackground component function', () => {
    expect(OrionLiveLoginBackground).toBeDefined();
    expect(typeof OrionLiveLoginBackground).toBe('function');
  });

  it('is a valid React component function', () => {
    expect(OrionLiveLoginBackground.name).toBe('OrionLiveLoginBackground');
  });
});
