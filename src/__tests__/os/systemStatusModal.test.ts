import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SystemStatusModal } from '../../components/modals/SystemStatusModal';

// Mock ConnectivityContext
vi.mock('../../store/ConnectivityContext', () => ({
  useConnectivity: () => ({
    isOnline: true,
    statusLabel: 'Operational',
    isLocalMode: false,
  }),
}));

describe('SystemStatusModal Diagnostics Specification', () => {

  it('renders nothing when isOpen is false', () => {
    const html = renderToString(React.createElement(SystemStatusModal, {
      isOpen: false,
      onClose: vi.fn(),
    }));
    expect(html).toBe('');
  });

  it('renders centered OS Diagnostics modal dialog with full accessibility and viewport containment', () => {
    const html = renderToString(React.createElement(SystemStatusModal, {
      isOpen: true,
      onClose: vi.fn(),
    }));

    // 1. Accessibility tags
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-label="System Health &amp; Diagnostics"');
    expect(html).toContain('data-testid="system-status-modal-overlay"');
    expect(html).toContain('data-testid="system-status-modal-dialog"');

    // 2. High OS Modal Layer Z-Index
    expect(html).toContain('z-[2147483640]');

    // 3. Viewport containment: max-h-[min(90vh,680px)] to prevent off-screen clipping
    expect(html).toContain('max-h-[min(90vh,680px)]');

    // 4. Header title and pulse dot
    expect(html).toContain('System Health &amp; Diagnostics');
    expect(html).toContain('animate-pulse');

    // 5. All 7 services rendered
    expect(html).toContain('Network Connectivity');
    expect(html).toContain('Application Core');
    expect(html).toContain('Data Store (IndexedDB / Local)');
    expect(html).toContain('External Cloud Sync');
    expect(html).toContain('AI Decision Engine (Gemini 3.6)');
    expect(html).toContain('Sync Engine');
    expect(html).toContain('Notification Engine');

    // 6. Environment and version footer
    expect(html).toContain('Environment: Production / Secure');
    expect(html).toContain('Version: 9.4.2-Enterprise');
  });
});
