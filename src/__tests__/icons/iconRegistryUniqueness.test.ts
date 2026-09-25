import { describe, it, expect } from 'vitest';
import { ORION_REGISTRY } from '../../os/OrionApplicationRegistry';
import {
  ORION_ICON_REGISTRY,
  getAppIconDefinition,
  getAppIconComponent,
  validateIconRegistryUniqueness
} from '../../os/icons/OrionIconRegistry';
import { SYSTEM_ICONS } from '../../os/icons/OrionSystemIcons';

describe('ORION-9 macOS-Style Icon System Certification', () => {
  it('contains registered icon metadata for all applications in ORION_REGISTRY', () => {
    const appIds = Object.keys(ORION_REGISTRY);
    const expectedCount = appIds.length;
    expect(appIds.length).toBeGreaterThanOrEqual(107);

    for (const appId of appIds) {
      const iconDef = ORION_ICON_REGISTRY[appId];
      expect(iconDef, `Missing icon definition for app: ${appId}`).toBeDefined();
      expect(iconDef.appId).toBe(appId);
      expect(iconDef.iconId).toBeTruthy();
      expect(iconDef.name).toBeTruthy();
      expect(iconDef.category).toBeTruthy();
      expect(iconDef.component).toBeDefined();
      expect(iconDef.palette).toBeDefined();
      expect(iconDef.palette.from).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(iconDef.palette.to).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('guarantees 100% uniqueness of icon IDs across all applications with zero collisions', () => {
    const result = validateIconRegistryUniqueness();
    const expectedCount = Object.keys(ORION_REGISTRY).length;
    expect(result.totalApps).toBe(expectedCount);
    expect(result.uniqueIconIds).toBe(expectedCount);
    expect(result.duplicates).toEqual([]);
    expect(result.is100PercentUnique).toBe(true);
  });

  it('guarantees unique React icon component references with zero cloned components', () => {
    const apps = Object.values(ORION_ICON_REGISTRY);
    const seenComponents = new Set<any>();
    const duplicateComponents: string[] = [];

    for (const app of apps) {
      if (seenComponents.has(app.component)) {
        duplicateComponents.push(`${app.appId} (${app.iconId})`);
      }
      seenComponents.add(app.component);
    }

    expect(duplicateComponents).toEqual([]);
    expect(seenComponents.size).toBe(Object.keys(ORION_REGISTRY).length);
  });

  it('verifies getAppIconDefinition returns authoritative metadata and safe fallback', () => {
    const cmdCenter = getAppIconDefinition('command-center');
    expect(cmdCenter.iconId).toBe('icon-cmd-center');
    expect(cmdCenter.name).toBe('Command Center');

    const fallback = getAppIconDefinition('unknown-random-app-xyz');
    expect(fallback.iconId).toBe('icon-unknown-random-app-xyz');
    expect(fallback.component).toBeDefined();
  });

  it('verifies getAppIconComponent returns valid callable React components', () => {
    const Component = getAppIconComponent('inventory');
    expect(typeof Component).toBe('function');
  });

  it('verifies that no application name or icon contains raw emoji characters', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    const apps = Object.values(ORION_ICON_REGISTRY);

    for (const app of apps) {
      expect(emojiRegex.test(app.name), `App name contains emoji: ${app.name}`).toBe(false);
      expect(emojiRegex.test(app.description), `App description contains emoji: ${app.description}`).toBe(false);
    }
  });

  it('verifies OS System Icon family is populated with required system glyphs', () => {
    const requiredSystemIcons = [
      'wifi', 'wifiOff', 'batteryFull', 'batteryCharging', 'batteryLow',
      'bell', 'bellDot', 'search', 'command', 'settings', 'lock', 'power',
      'grid', 'volume', 'moon', 'shield', 'activity', 'sparkles',
      'windowClose', 'windowMinimize', 'windowMaximize'
    ];

    for (const iconKey of requiredSystemIcons) {
      expect((SYSTEM_ICONS as any)[iconKey], `Missing system icon: ${iconKey}`).toBeDefined();
    }
  });
});
