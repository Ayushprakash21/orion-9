import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OrionPowerOnScreen } from '../../os/components/OrionPowerOnScreen';
import { BrandLogo, AUTHORITATIVE_DEFAULT_LOGO } from '../../components/brand/BrandLogo';
import { OrionMark } from '../../components/brand/OrionLogo';
import { LoadingScreen } from '../../components/LoadingScreen';
import { brandingRepository } from '../../repositories/BrandingRepository';

describe('ORION-9 OS Startup Sequence & Boot Flow UI Specifications', () => {

  beforeEach(() => {
    // Reset to clean test state
    brandingRepository.resetBranding().catch(() => {});
  });

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

  it('5. Renders authoritative canonical logo in BrandLogo when no custom logo is set', () => {
    // BrandLogo mark check - renders authoritative default logo
    const brandHtml = renderToString(React.createElement(BrandLogo, { sizePreset: 'lg', variant: 'mark' }));
    expect(brandHtml).toContain('src="/orion-9-official-logo.png"');
    expect(brandHtml).toContain('orion-brand-image');
  });

  it('6. Automatically resolves and renders custom Admin-configured logo when saved', async () => {
    const customAdminLogo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    // Admin saves new logo in authoritative repository
    await brandingRepository.saveBranding({
      logoUrl: customAdminLogo,
      logo: customAdminLogo,
      appName: 'ACME SCM'
    });

    // Render BrandLogo
    const brandHtml = renderToString(React.createElement(BrandLogo, { sizePreset: 'lg', variant: 'mark' }));
    expect(brandHtml).toContain(`src="${customAdminLogo}"`);
    expect(brandHtml).toContain('alt="ACME SCM"');

    // Clean up
    await brandingRepository.resetBranding();
  });

  it('7. Validates pure architectural separation between Initialization and Boot phases', () => {
    // Both phases cannot simultaneously coexist in DOM
    const element = React.createElement(OrionPowerOnScreen, { onPowerOn: vi.fn() });
    const html = renderToString(element);

    const hasInit = html.includes('data-testid="initialization-phase"');
    const hasBoot = html.includes('data-testid="boot-phase"');

    // Exactly one phase rendered per state
    expect(hasInit).toBe(true);
    expect(hasBoot).toBe(false);
  });

  it('8. Pre-boot LoadingScreen consumes authoritative BrandLogo with no competing hardcoded logos', () => {
    const html = renderToString(React.createElement(LoadingScreen, {
      message: 'INITIALIZING SYSTEM...',
      variant: 'default'
    }));

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="Loading workspace"');
    expect(html).toContain('ORION-9');
    expect(html).toContain('INITIALIZING SYSTEM...');
    expect(html).toContain('src="/orion-9-official-logo.png"');
  });
});
