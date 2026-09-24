import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OrionPowerOnScreen } from '../../os/components/OrionPowerOnScreen';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { OrionMark } from '../../components/brand/OrionLogo';

describe('ORION-9 OS Startup Sequence & Boot Flow UI Specifications', () => {

  it('1. Renders the Initialization Screen (Phase 1) on initial mount with authoritative branding', () => {
    const onPowerOn = vi.fn();
    const element = React.createElement(OrionPowerOnScreen, { onPowerOn });
    const html = renderToString(element);

    // Shell container present with accessibility role and phase tag
    expect(html).toContain('data-testid="orion-startup-screen"');
    expect(html).toContain('data-startup-phase="INITIALIZING"');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');

    // Title and Tagline present
    expect(html).toContain('data-testid="startup-title"');
    expect(html).toContain('ORION-9');
    expect(html).toContain('AI SUPPLY CHAIN OPERATING SYSTEM');
  });

  it('2. Ensures the START ORION boot button is NOT visible during Phase 1 initialization', () => {
    const onPowerOn = vi.fn();
    const element = React.createElement(OrionPowerOnScreen, { onPowerOn });
    const html = renderToString(element);

    // Boot button must not be present during initialization
    expect(html).not.toContain('data-testid="start-orion-button"');
    expect(html).not.toContain('START ORION');
    expect(html).not.toContain('data-testid="boot-enter-system-caption"');
  });

  it('3. Renders all 6 required OS service initialization status lines in Phase 1', () => {
    const onPowerOn = vi.fn();
    const element = React.createElement(OrionPowerOnScreen, { onPowerOn });
    const html = renderToString(element);

    expect(html).toContain('data-testid="init-service-identity"');
    expect(html).toContain('Identity');

    expect(html).toContain('data-testid="init-service-kernel"');
    expect(html).toContain('Kernel');

    expect(html).toContain('data-testid="init-service-security"');
    expect(html).toContain('Security');

    expect(html).toContain('data-testid="init-service-data-fabric"');
    expect(html).toContain('Data Fabric');

    expect(html).toContain('data-testid="init-service-intelligence"');
    expect(html).toContain('Intelligence');

    expect(html).toContain('data-testid="init-service-operations"');
    expect(html).toContain('Operations');
  });

  it('4. Renders the initialization status header and ready label structure', () => {
    const onPowerOn = vi.fn();
    const element = React.createElement(OrionPowerOnScreen, { onPowerOn });
    const html = renderToString(element);

    expect(html).toContain('INITIALIZING SYSTEM');
    expect(html).toContain('data-testid="init-system-ready-label"');
    expect(html).toContain('SYSTEM READY');
  });

  it('5. Renders authoritative Orion geometric mark in BrandLogo and OrionMark components', () => {
    // 1. Direct OrionMark check
    const markHtml = renderToString(React.createElement(OrionMark, { size: 48 }));
    expect(markHtml).toContain('<svg');
    expect(markHtml).toContain('viewBox="0 0 32 32"');
    expect(markHtml).toContain('shape-rendering="geometricPrecision"');
    expect(markHtml).toContain('#00F2FE');
    expect(markHtml).toContain('#0284C7');

    // 2. BrandLogo mark check
    const brandHtml = renderToString(React.createElement(BrandLogo, { sizePreset: 'lg', variant: 'mark' }));
    expect(brandHtml).toContain('orion-brand-image');
  });

  it('6. Validates pure architectural separation between Initialization and Boot phases', () => {
    // Both phases cannot simultaneously coexist in DOM
    const element = React.createElement(OrionPowerOnScreen, { onPowerOn: vi.fn() });
    const html = renderToString(element);

    const hasInit = html.includes('data-testid="initialization-phase"');
    const hasBoot = html.includes('data-testid="boot-phase"');

    // Exactly one phase rendered per state
    expect(hasInit).toBe(true);
    expect(hasBoot).toBe(false);
  });
});
