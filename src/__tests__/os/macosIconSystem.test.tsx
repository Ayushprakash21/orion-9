import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ORION_REGISTRY } from '../../os/OrionApplicationRegistry';
import {
  ORION_ICON_REGISTRY,
  ORION_ICON_ALIASES,
  getAppIconDefinition,
  resolveAppIconLookup,
  getIconCoverageReport,
  getUnresolvedIconDiagnostics,
  clearUnresolvedIconDiagnostics,
  validateIconRegistryUniqueness,
} from '../../os/icons/OrionIconRegistry';
import { OrionAppIcon } from '../../components/brand/OrionAppIcon';
import { OrionIconGallery } from '../../os/icons/OrionIconGallery';
import { OrionThemeContext } from '../../os/theme/useOrionTheme';
import { ORION_THEMES } from '../../os/theme/OrionThemeRegistry';
import { DEFAULT_PREFERENCES } from '../../os/theme/OrionThemeTypes';

function normalizeSvgForComparison(html: string): string {
  // Strip React data attributes & unique per-instance SVG ids/urls so foreground geometry comparison is exact
  return html
    .replace(/\sid="[^"]+"/g, '')
    .replace(/url\(#[^)]+\)/g, 'url(#NORM)')
    .replace(/<path d="M 64,6[^"]*"[^>]*>/g, '') // Ignore outer squircle frame when comparing inner artwork
    .trim();
}

describe('Orion-9 Icon Experience 3.0 — Premium macOS Artwork System', () => {
  beforeEach(() => {
    clearUnresolvedIconDiagnostics();
  });

  it('ICON-01: 119/119 applications in ORION_REGISTRY resolve to non-fallback bespoke artwork', () => {
    const appIds = Object.keys(ORION_REGISTRY);
    expect(appIds.length).toBeGreaterThanOrEqual(119);

    const report = getIconCoverageReport(appIds);
    expect(report.coveredCount).toBe(appIds.length);
    expect(report.missingFromIconRegistry).toEqual([]);
    expect(report.coveragePercent).toBe(100);

    for (const id of appIds) {
      const lookup = resolveAppIconLookup(id);
      expect(lookup.isFallback, `App "${id}" unexpectedly fell back`).toBe(false);
    }
  });

  it('ICON-02: All registered iconIds are unique and all 119 rendered SVGs have distinct artwork markup', () => {
    const validation = validateIconRegistryUniqueness();
    expect(validation.is100PercentUnique).toBe(true);
    expect(validation.duplicates).toEqual([]);

    const renderedShapes = new Map<string, string>();
    const collisions: string[] = [];

    for (const entry of Object.values(ORION_ICON_REGISTRY)) {
      const html = renderToString(<OrionAppIcon app={entry.appId} size={48} theme="dark" />);
      const normalized = normalizeSvgForComparison(html);
      const existingOwner = renderedShapes.get(normalized);
      if (existingOwner) {
        collisions.push(`${entry.appId} matches ${existingOwner}`);
      } else {
        renderedShapes.set(normalized, entry.appId);
      }
    }

    expect(collisions).toEqual([]);
    expect(renderedShapes.size).toBe(Object.keys(ORION_ICON_REGISTRY).length);
  });

  it('ICON-03: Resolves all dynamic, legacy, and Admin navigation aliases without fallback; reports unknown IDs in diagnostics', () => {
    const expectedAliases = [
      'control-tower',
      'ai-copilot',
      'orion-copilot',
      'supplier-communication',
      'admin-operations',
      'admin-incidents',
      'admin-control',
      'admin-global-ops',
      'admin-regional-ops',
      'reconciliation',
      'dashboard',
      'po',
      'supplier',
    ];

    for (const alias of expectedAliases) {
      expect(ORION_ICON_ALIASES[alias]).toBeTruthy();
      const lookup = resolveAppIconLookup(alias);
      expect(lookup.isAlias).toBe(true);
      expect(lookup.isFallback).toBe(false);
      expect(ORION_ICON_REGISTRY[lookup.resolvedId]).toBeDefined();
    }

    const unknown = resolveAppIconLookup('nonexistent-phantom-app-999');
    expect(unknown.isFallback).toBe(true);
    expect(getUnresolvedIconDiagnostics()).toContain('nonexistent-phantom-app-999');
  });

  it('ICON-04: Zero SVG Gaussian filters, zero external image URLs, and zero duplicate DOM gradient IDs across all 119 icons', () => {
    const html = renderToString(
      <div>
        {Object.keys(ORION_ICON_REGISTRY).map((id) => (
          <OrionAppIcon key={id} app={id} size={48} active={id === 'command-center'} />
        ))}
      </div>
    );

    expect(html).not.toContain('feDropShadow');
    expect(html).not.toContain('feGaussianBlur');
    expect(html).not.toContain('<filter');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<image');
    expect(html.replace(/http:\/\/www\.w3\.org\/2000\/svg/g, '')).not.toMatch(/https?:\/\//);

    const idMatches = Array.from(html.matchAll(/id="([^"]+)"/g)).map((m) => m[1]);
    expect(idMatches.length).toBeGreaterThan(200);
    const uniqueIds = new Set(idMatches);
    expect(uniqueIds.size).toBe(idMatches.length);
  });

  it('ICON-05: Inherits Dark/Light theme automatically from OrionThemeContext when theme prop is omitted or auto', () => {
    const renderWithTheme = (isDark: boolean) =>
      renderToString(
        <OrionThemeContext.Provider
          value={{
            theme: isDark ? ORION_THEMES.graphite : ORION_THEMES.silver,
            preferences: { ...DEFAULT_PREFERENCES, appearanceMode: isDark ? 'dark' : 'light' },
            resolvedAccent: isDark ? '#D8DDE3' : '#4A5056',
            setTheme: () => {},
            setPreference: () => {},
            resetAppearance: () => {},
            isDark,
          }}
        >
          <OrionAppIcon app="inventory" size={48} />
        </OrionThemeContext.Provider>
      );

    const lightHtml = renderWithTheme(false);
    const darkHtml = renderWithTheme(true);

    expect(lightHtml).toContain('data-icon-theme="light"');
    expect(darkHtml).toContain('data-icon-theme="dark"');
    // Registry palette for inventory (#059669 -> #064E3B) must be applied instead of hardcoded mismatches
    expect(lightHtml).toContain('#059669');
    expect(darkHtml).toContain('#059669');
  });

  it('ICON-06: Supports sizes (16..80), micro LOD simplification, badges, and disabled states', () => {
    const def = getAppIconDefinition('inventory');
    expect(def.appId).toBe('inventory');

    const html = renderToString(
      <div>
        <OrionAppIcon app="inventory" size={16} theme="light" />
        <OrionAppIcon app="inventory" size={24} selected={true} notificationCount={4} />
        <OrionAppIcon app="inventory" size={48} active={true} notificationCount={150} />
        <OrionAppIcon app="inventory" size={80} disabled={true} badge={true} />
      </div>
    );

    expect(html).toContain('data-icon-size="16"');
    expect(html).toContain('data-icon-size="80"');
    expect(html).toContain('data-icon-selected="true"');
    expect(html).toContain('data-icon-active="true"');
    expect(html).toContain('>4<');
    expect(html).toContain('>99+<');
    expect(html).toContain('opacity-40');
  });

  it('ICON-07: Rebuilt OrionIconGallery renders all 119 icons, 40/48/80px + Light/Dark comparisons, and honest coverage diagnostics', () => {
    const html = renderToString(<OrionIconGallery />);
    expect(html).toContain('data-testid="orion-icon-gallery"');
    expect(html).toContain('Registry Mapped');
    expect(html).not.toContain('100% Unique');
    expect(html).toContain('Dock 40px');
    expect(html).toContain('48px Dark');
    expect(html).toContain('80px Light');
    expect(html).toContain('data-testid="icon-gallery-item-command-center"');
    expect(html).toContain('data-testid="icon-gallery-item-icon-gallery"');
    expect(html).not.toContain('feDropShadow');
  });
});
