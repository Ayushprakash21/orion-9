import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Inventory } from '../../components/Inventory';
import { SupplyChainProvider } from '../../store/SupplyChainContext';
import { AuthProvider } from '../../store/AuthContext';
import { ToastProvider } from '../../store/ToastContext';
import { OrionSearchProvider } from '../../os/OrionSearchContext';
import { EntityDrawerProvider } from '../../store/EntityDrawerContext';
import { MemoryRouter } from 'react-router-dom';
import * as visualizationModule from '../../core/visualization/useLiveChartSeries';

// Mock Recharts ResponsiveContainer & charts for jsdom environment
vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container" style={{ width: 500, height: 300 }}>{children}</div>,
  };
});

describe('Inventory Real-Time Live Graphs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Real-Time Inventory Telemetry section and consumes useLiveChartSeries', () => {
    const spy = vi.spyOn(visualizationModule, 'useLiveChartSeries');

    render(
      <MemoryRouter>
        <AuthProvider>
          <SupplyChainProvider>
            <ToastProvider>
              <OrionSearchProvider>
                <EntityDrawerProvider>
                  <Inventory />
                </EntityDrawerProvider>
              </OrionSearchProvider>
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
    expect(screen.getByTestId('realtime-inventory-telemetry')).toBeInTheDocument();
    expect(screen.getByText(/REAL-TIME INVENTORY TELEMETRY/i)).toBeInTheDocument();
    expect(screen.getByText(/Live inventory movement and health across the network/i)).toBeInTheDocument();

    // Verify Graph headings
    expect(screen.getByText(/Inventory Positioning vs Buffer/i)).toBeInTheDocument();
    expect(screen.getByText(/Valuation Stream & Stockout Risk/i)).toBeInTheDocument();
  });
});
