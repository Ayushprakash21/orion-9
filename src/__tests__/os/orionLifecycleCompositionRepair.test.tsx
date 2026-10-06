import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OrionShutdownScreen } from '../../os/components/OrionShutdownScreen';
import { OrionWorldEntrySequence } from '../../os/components/OrionWorldEntrySequence';
import { OrionBootSequence } from '../../os/components/OrionBootSequence';

describe('ORION-9 Lifecycle Screens Composition & Forensic Repair Specification', () => {

  it('1. OrionShutdownScreen: renders clean centered layout with NO rotating concentric rings or black shape backdrop', () => {
    const html = renderToString(React.createElement(OrionShutdownScreen, { onComplete: vi.fn() }));

    // Must render role="status" and aria-live="polite"
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');

    // Must render authoritative logo
    expect(html).toContain('src="/orion-9-official-logo.png"');

    // Must render semantic title and concise status
    expect(html).toContain('System Shutdown');
    expect(html).toContain('Terminating active processes');

    // CRITICAL: Must NOT contain old rotating rings or black circular shape container
    expect(html).not.toContain('border-red-500/10');
    expect(html).not.toContain('border-red-500/20');
    expect(html).not.toContain('bg-black flex items-center justify-center border border-red-500/60');
    expect(html).not.toContain('drop-shadow-[0_0_18px_rgba(0,242,254,0.18)]');
  });

  it('2. OrionWorldEntrySequence: renders calm enterprise desktop boot screen without sci-fi HUD artifacts', () => {
    const html = renderToString(React.createElement(OrionWorldEntrySequence, { onComplete: vi.fn() }));

    // Must render accessibility semantics
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');

    // Must render authoritative logo
    expect(html).toContain('src="/orion-9-official-logo.png"');

    // Must render clean heading and subtitle
    expect(html).toContain('Starting Orion');
    expect(html).toContain('Restoring secure session');

    // CRITICAL: Must NOT contain sci-fi HUD artifacts (constellations, SVG lines, system map tables)
    expect(html).not.toContain('ow3-constellation');
    expect(html).not.toContain('ow3-lines');
    expect(html).not.toContain('ow3-system-map');
    expect(html).not.toContain('ow3-side');
    expect(html).not.toContain('ow3-center-label');
  });

  it('3. OrionWorldEntrySequence (Admin): renders appropriate administrative space title', () => {
    const html = renderToString(React.createElement(OrionWorldEntrySequence, { onComplete: vi.fn(), isAdmin: true }));

    expect(html).toContain('Entering Control Center');
    expect(html).toContain('Restoring secure session');
  });

  it('4. OrionBootSequence: delivers centered enterprise boot hierarchy', () => {
    const html = renderToString(React.createElement(OrionBootSequence, { onComplete: vi.fn() }));

    expect(html).toContain('Starting Orion');
    expect(html).toContain('Establishing system power');
    expect(html).toContain('src="/orion-9-official-logo.png"');
    expect(html).not.toContain('ob3-horizon');
    expect(html).not.toContain('ob3-signal');
  });
});
