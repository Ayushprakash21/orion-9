import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { OrionLifecyclePowerControl } from '../../os/lifecycle/OrionLifecyclePowerControl';

describe('ORION-9 Boot Screen Power Control - Cleanliness & Zero-Container Suite', () => {
  it('1. Renders start-orion-button with pure transparent background, zero border, zero outline and zero box-shadow', () => {
    const onClick = vi.fn();
    const html = renderToString(
      React.createElement(OrionLifecyclePowerControl, { onClick, isBooting: false })
    );

    // Verify button exists
    expect(html).toContain('data-testid="start-orion-button"');
    expect(html).toContain('aria-label="Start Orion"');

    // Verify inline style guarantees
    expect(html).toContain('background:transparent');
    expect(html).toContain('border:none');
    expect(html).toContain('box-shadow:none');
    expect(html).toContain('outline:none');
    expect(html).toContain('border-radius:0');

    // Extract opening button tag
    const buttonStart = html.indexOf('<button');
    const buttonTag = html.slice(buttonStart, html.indexOf('>', buttonStart));

    // Verify NO container styling classes exist on the button
    expect(buttonTag).not.toContain('rounded-2xl');
    expect(buttonTag).not.toContain('rounded-xl');
    expect(buttonTag).not.toContain('rounded-lg');
    expect(buttonTag).not.toContain('bg-white');
    expect(buttonTag).not.toContain('border-white');
    expect(buttonTag).not.toContain('shadow-[');
    expect(buttonTag).not.toContain('shadow-xl');
    expect(buttonTag).not.toContain('shadow-2xl');
    expect(buttonTag).not.toContain('backdrop-blur');
  });

  it('2. Renders the floating Power glyph directly inside the button without intermediate container boxes', () => {
    const onClick = vi.fn();
    const html = renderToString(
      React.createElement(OrionLifecyclePowerControl, { onClick, isBooting: false })
    );

    // Check Lucide power icon presence (lucide-power class or svg element)
    expect(html).toContain('lucide-power');
    // Verify power glyph has responsive dimensions
    expect(html).toContain('w-9');
    expect(html).toContain('h-9');
    // Ensure no intermediate circular or square container div wrapping the icon
    expect(html).not.toContain('rounded-full bg-white');
    expect(html).not.toContain('rounded-full border');
  });

  it('3. Renders START ORION and ENTER SYSTEM typography below the glyph', () => {
    const onClick = vi.fn();
    const html = renderToString(
      React.createElement(OrionLifecyclePowerControl, { onClick, isBooting: false })
    );

    expect(html).toContain('START ORION');
    expect(html).toContain('data-testid="boot-enter-system-caption"');
    expect(html).toContain('ENTER SYSTEM');
  });

  it('4. Applies animated pulse when isBooting is true without adding any box', () => {
    const onClick = vi.fn();
    const html = renderToString(
      React.createElement(OrionLifecyclePowerControl, { onClick, isBooting: true })
    );

    expect(html).toContain('animate-pulse');
    expect(html).not.toContain('border-white');
    expect(html).not.toContain('rounded-2xl');
  });
});
