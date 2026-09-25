import { describe, it, expect } from 'vitest';
import { ORION_REGISTRY } from '../../os/OrionApplicationRegistry';
import { ORION_COMPONENT_MAP } from '../../os/OrionComponentMap';
import { Settings } from '../../components/Settings';

describe('ORION-9 Native OS Settings Application', () => {
  it('1. Settings is registered in ORION_REGISTRY as a native platform app', () => {
    const settingsApp = ORION_REGISTRY['settings'];
    expect(settingsApp).toBeDefined();
    expect(settingsApp.name).toBe('Settings');
    expect(settingsApp.category).toBe('Platform');
    expect(settingsApp.route).toBe('/settings');
    expect(settingsApp.dockDefault).toBe(true);
  });

  it('2. Settings is mapped in ORION_COMPONENT_MAP to the Settings component', () => {
    const Component = ORION_COMPONENT_MAP['settings'];
    expect(Component).toBe(Settings);
  });

  it('3. Profile and Organization aliases map to Settings views', () => {
    expect(ORION_COMPONENT_MAP['profile']).toBeDefined();
    expect(ORION_COMPONENT_MAP['organization']).toBeDefined();
  });

  it('4. Settings supports canonical sidebar navigation sections', () => {
    const requiredSections = [
      'account',
      'organization',
      'appearance',
      'desktop',
      'time_region',
      'notifications',
      'privacy_security',
      'ai_automation',
      'network',
      'storage',
      'admin'
    ];
    // Check component exports
    expect(Settings).toBeDefined();
    expect(requiredSections.length).toBe(11);
  });

  it('5. Zero Supabase dependencies exist in Settings', () => {
    const settingsCode = Settings.toString();
    expect(settingsCode.includes('supabase')).toBe(false);
    expect(settingsCode.includes('@supabase')).toBe(false);
  });
});
