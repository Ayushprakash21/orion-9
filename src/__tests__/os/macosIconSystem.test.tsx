import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ORION_REGISTRY } from '../../os/OrionApplicationRegistry';
import {
  ORION_ICON_REGISTRY,
  getAppIconDefinition,
  validateIconRegistryUniqueness,
} from '../../os/icons/OrionIconRegistry';
import { OrionAppIcon } from '../../components/brand/OrionAppIcon';
import { OrionIconGallery } from '../../os/icons/OrionIconGallery';

describe('Orion-9 Premium macOS Icon Design System', () => {
  it('ICON-01: Every application in ORION_REGISTRY resolves to a bespoke icon in ORION_ICON_REGISTRY', () => {
    const appIds = Object.keys(ORION_REGISTRY);
    expect(appIds.length).toBeGreaterThanOrEqual(118);

    const missing = appIds.filter((id) => !ORION_ICON_REGISTRY[id]);
    expect(missing).toEqual([]);
  });

  it('ICON-02: All registered iconIds are 100% unique across the entire OS', () => {
    const validation = validateIconRegistryUniqueness();
    expect(validation.is100PercentUnique).toBe(true);
    expect(validation.duplicates).toEqual([]);
  });

  it('ICON-03: Zero SVG Gaussian <feDropShadow> filters and zero duplicate SVG gradient IDs across multiple instances', () => {
    const html = renderToString(
      <div>
        <OrionAppIcon app="command-center" size={16} />
        <OrionAppIcon app="command-center" size={40} />
        <OrionAppIcon app="command-center" size={64} active={true} />
        <OrionAppIcon app="autonomous-command-center" size={48} />
        <OrionAppIcon app="multi-party-network" size={48} />
        <OrionAppIcon app="icon-gallery" size={48} />
      </div>
    );

    expect(html).not.toContain('feDropShadow');
    expect(html).not.toContain('<filter');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<image');
    expect(html.replace(/http:\/\/www\.w3\.org\/2000\/svg/g, '')).not.toMatch(/https?:\/\//);

    const idMatches = Array.from(html.matchAll(/id="([^"]+)"/g)).map((m) => m[1]);
    expect(idMatches.length).toBeGreaterThan(0);
    const uniqueIds = new Set(idMatches);
    expect(uniqueIds.size).toBe(idMatches.length);
  });

  it('ICON-04: Supports sizes (16..64), active, selected, disabled, light/dark themes, and capped badges', () => {
    const def = getAppIconDefinition('inventory');
    expect(def.appId).toBe('inventory');

    const html = renderToString(
      <div>
        <OrionAppIcon app="inventory" size={16} theme="light" />
        <OrionAppIcon app="inventory" size={24} selected={true} notificationCount={4} />
        <OrionAppIcon app="inventory" size={48} active={true} notificationCount={150} />
        <OrionAppIcon app="inventory" size={64} disabled={true} badge={true} />
      </div>
    );

    expect(html).toContain('data-icon-size="16"');
    expect(html).toContain('data-icon-selected="true"');
    expect(html).toContain('data-icon-active="true"');
    expect(html).toContain('>4<');
    expect(html).toContain('>99+<');
    expect(html).toContain('opacity-40');
  });

  it('ICON-05: Renders OrionIconGallery displaying all registry icons cleanly with zero filters', () => {
    const html = renderToString(<OrionIconGallery />);
    expect(html).toContain('data-testid="orion-icon-gallery"');
    expect(html).toContain('100% Unique');
    expect(html).toContain('data-testid="icon-gallery-item-command-center"');
    expect(html).toContain('data-testid="icon-gallery-item-icon-gallery"');
    expect(html).not.toContain('feDropShadow');
  });
});
