import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('ORION-9 macOS Design System Visual Consistency Suite', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const indexCssPath = path.join(rootDir, 'src/index.css');
  const systemBarPath = path.join(rootDir, 'src/os/components/OrionSystemBar.tsx');
  const windowPath = path.join(rootDir, 'src/os/components/OrionWindow.tsx');
  const dockPath = path.join(rootDir, 'src/os/components/OrionDock.tsx');
  const settingsPath = path.join(rootDir, 'src/components/Settings.tsx');
  const splitLayoutPath = path.join(rootDir, 'src/components/settings/OrionSettingsSplitLayout.tsx');

  it('1. verifies index.css contains NO external Google font imports for Lato or Roboto', () => {
    const cssContent = fs.readFileSync(indexCssPath, 'utf-8');
    expect(cssContent).not.toMatch(/@import\s+url\([^)]*fonts\.googleapis\.com[^)]*\)/i);
    expect(cssContent).not.toContain('family=Lato');
    expect(cssContent).not.toContain('family=Roboto');
  });

  it('2. verifies index.css defines the canonical Apple system font stack', () => {
    const cssContent = fs.readFileSync(indexCssPath, 'utf-8');
    expect(cssContent).toContain('-apple-system');
    expect(cssContent).toContain('BlinkMacSystemFont');
    expect(cssContent).toContain('"SF Pro Text"');
    expect(cssContent).toContain('"Helvetica Neue"');
    expect(cssContent).toContain('--orion-font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Segoe UI", Arial, sans-serif');
  });

  it('3. verifies index.css defines canonical typography scale tokens', () => {
    const cssContent = fs.readFileSync(indexCssPath, 'utf-8');
    expect(cssContent).toContain('--orion-font-size-xs: 11px');
    expect(cssContent).toContain('--orion-font-size-sm: 12px');
    expect(cssContent).toContain('--orion-font-size-md: 13px');
    expect(cssContent).toContain('--orion-font-size-base: 14px');
    expect(cssContent).toContain('--orion-font-size-lg: 16px');
    expect(cssContent).toContain('--orion-font-size-xl: 20px');
    expect(cssContent).toContain('--orion-font-size-2xl: 24px');
    expect(cssContent).toContain('--orion-font-size-3xl: 32px');
    expect(cssContent).toContain('--orion-font-size-display: 40px');
  });

  it('4. verifies index.css defines canonical corner radius tokens', () => {
    const cssContent = fs.readFileSync(indexCssPath, 'utf-8');
    expect(cssContent).toContain('--orion-radius-xs: 4px');
    expect(cssContent).toContain('--orion-radius-sm: 6px');
    expect(cssContent).toContain('--orion-radius-md: 8px');
    expect(cssContent).toContain('--orion-radius-lg: 10px');
    expect(cssContent).toContain('--orion-radius-xl: 12px');
    expect(cssContent).toContain('--orion-radius-2xl: 16px');
    expect(cssContent).toContain('--orion-radius-dock: 20px');
    expect(cssContent).toContain('--orion-radius-full: 9999px');
  });

  it('5. verifies index.css defines canonical spacing tokens', () => {
    const cssContent = fs.readFileSync(indexCssPath, 'utf-8');
    expect(cssContent).toContain('--orion-space-1: 4px');
    expect(cssContent).toContain('--orion-space-2: 8px');
    expect(cssContent).toContain('--orion-space-3: 12px');
    expect(cssContent).toContain('--orion-space-4: 16px');
    expect(cssContent).toContain('--orion-space-5: 20px');
    expect(cssContent).toContain('--orion-space-6: 24px');
    expect(cssContent).toContain('--orion-space-8: 32px');
  });

  it('6. verifies index.css defines canonical control and chrome heights', () => {
    const cssContent = fs.readFileSync(indexCssPath, 'utf-8');
    expect(cssContent).toContain('--orion-control-h-sm: 28px');
    expect(cssContent).toContain('--orion-control-h-md: 32px');
    expect(cssContent).toContain('--orion-control-h-lg: 38px');
    expect(cssContent).toContain('--orion-window-titlebar-h: 38px');
    expect(cssContent).toContain('--orion-topbar-h: 44px');
    expect(cssContent).toContain('--orion-dock-h: 68px');
  });

  it('7. verifies index.css has tabular numbers rule for financial/clock data', () => {
    const cssContent = fs.readFileSync(indexCssPath, 'utf-8');
    expect(cssContent).toContain('font-variant-numeric: tabular-nums');
  });

  it('8. verifies OrionSystemBar uses macOS translucent styling and tokens', () => {
    const systemBarContent = fs.readFileSync(systemBarPath, 'utf-8');
    expect(systemBarContent).toContain('h-[44px]');
    expect(systemBarContent).toContain('backdrop-blur-[20px]');
    expect(systemBarContent).toContain('backdrop-saturate-[150%]');
    expect(systemBarContent).toContain('variant="mark"');
    expect(systemBarContent).toContain('tabular-nums');
  });

  it('9. verifies OrionWindow uses compact 38px titlebar and canonical text tokens', () => {
    const windowContent = fs.readFileSync(windowPath, 'utf-8');
    expect(windowContent).toContain('h-[38px]');
    expect(windowContent).not.toContain('text-slate-100');
    expect(windowContent).not.toContain('text-slate-400');
    expect(windowContent).toContain('text-[13px] font-medium');
  });

  it('10. verifies OrionDock uses 20px radius and macOS blur', () => {
    const dockContent = fs.readFileSync(dockPath, 'utf-8');
    expect(dockContent).toContain('rounded-[20px]');
    expect(dockContent).toContain('saturate(160%)');
  });

  it('11. verifies Settings and OrionSettingsSplitLayout use theme tokens for cards and borders', () => {
    const settingsContent = fs.readFileSync(settingsPath, 'utf-8');
    const splitContent = fs.readFileSync(splitLayoutPath, 'utf-8');
    expect(settingsContent).toContain('bg-[var(--orion-surface-elevated)]');
    expect(settingsContent).not.toContain('bg-[#12151a] border border-white/[0.08]');
    expect(splitContent).not.toContain('text-slate-400');
    expect(splitContent).toContain('border-[var(--orion-border)]');
  });
});
