import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { NetworkConnectionPopover } from '../../os/components/NetworkConnectionPopover';

// Mock ConnectivityContext
vi.mock('../../store/ConnectivityContext', () => ({
  useConnectivity: () => ({
    isOnline: true,
    statusLabel: 'Operational',
    isLocalMode: false,
    checkHealth: vi.fn().mockResolvedValue(undefined),
  }),
}));

// Mock WindowManagerContext
vi.mock('../../os/WindowManagerContext', () => ({
  useOptionalWindowManager: () => ({
    openApplication: vi.fn(),
  }),
}));

describe('NetworkConnectionPopover OS Overlay Suite', () => {
  const mockAnchorRect: DOMRect = {
    x: 1800,
    y: 10,
    width: 32,
    height: 32,
    top: 10,
    right: 1832,
    bottom: 42,
    left: 1800,
    toJSON: () => ({}),
  };

  it('renders nothing when isOpen is false', () => {
    const element = React.createElement(NetworkConnectionPopover, {
      isOpen: false,
      anchorRect: mockAnchorRect,
      onClose: vi.fn(),
    });

    const html = renderToString(element);
    expect(html).toBe('');
  });

  it('renders OS-level network popover dialog with proper high z-index and accessibility tags', () => {
    const element = React.createElement(NetworkConnectionPopover, {
      isOpen: true,
      anchorRect: mockAnchorRect,
      onClose: vi.fn(),
    });

    const html = renderToString(element);

    // 1. Accessibility attributes
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-label="Network Connections"');
    expect(html).toContain('data-testid="network-connection-popover"');

    // 2. High OS overlay z-index style
    expect(html).toContain('z-index:2147483600');

    // 3. Header & status
    expect(html).toContain('Wi-Fi &amp; Connectivity');
    expect(html).toContain('Connected');

    // 4. Enterprise network items
    expect(html).toContain('ORION-9 Enterprise Mesh');
    expect(html).toContain('Google Cloud Platform');
    expect(html).toContain('SCM Global Fleet Telemetry');

    // 5. Settings action links
    expect(html).toContain('Network &amp; Internet Settings');
  });

  it('renders action link for System Health when callback is provided', () => {
    const handleStatus = vi.fn();
    const element = React.createElement(NetworkConnectionPopover, {
      isOpen: true,
      anchorRect: mockAnchorRect,
      onClose: vi.fn(),
      onOpenSystemStatus: handleStatus,
    });

    const html = renderToString(element);
    expect(html).toContain('System Health &amp; Diagnostics...');
  });
});
