import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Inventory } from '../../components/Inventory';
import { SupplyChainProvider } from '../../store/SupplyChainContext';
import { AuthProvider } from '../../store/AuthContext';
import { ToastProvider } from '../../store/ToastContext';
import { OrionSearchProvider } from '../../os/OrionSearchContext';
import { EntityDrawerProvider } from '../../store/EntityDrawerContext';
import { OrionContextMenuProvider } from '../../os/contextMenu/OrionContextMenuContext';
import { MemoryRouter } from 'react-router-dom';
import * as visualizationModule from '../../core/visualization/useLiveChartSeries';

// Mock Recharts ResponsiveContainer & charts for server-rendering environment
vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  };
});

vi.mock('../../os/contextMenu/useEntityContextMenu', () => ({
  useEntityContextMenu: () => ({
    openInventoryContextMenu: vi.fn(),
  }),
}));

describe('Inventory Real-Time Live Graphs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Real-Time Inventory Telemetry section and consumes useLiveChartSeries', () => {
    const spy = vi.spyOn(visualizationModule, 'useLiveChartSeries');

    const html = renderToString(
      <MemoryRouter>
        <AuthProvider>
          <SupplyChainProvider>
            <ToastProvider>
              <OrionContextMenuProvider>
                <OrionSearchProvider>
                  <EntityDrawerProvider>
                    <Inventory />
                  </EntityDrawerProvider>
                </OrionSearchProvider>
              </OrionContextMenuProvider>
            </ToastProvider>
          </SupplyChainProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Verify useLiveChartSeries was called with governed inventory metrics
    expect(spy).toHaveBeenCalledWith(
      ['INVENTORY_ON_HAND', 'SAFETY_STOCK', 'STOCKOUT_RATE', 'INVENTORY_VALUE', 'INVENTORY_TURNS'],
      14
    );

    // Verify Telemetry Section rendered
    expect(html).toContain('data-testid="realtime-inventory-telemetry"');
    expect(html).toContain('Real-Time Inventory Telemetry');
    expect(html).toContain('Live inventory movement and health across the network');

    // Verify Graph headings
    expect(html).toContain('Inventory Positioning vs Buffer');
    expect(html).toContain('Valuation Stream &amp; Stockout Risk');
  });
});
