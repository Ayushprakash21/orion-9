/**
 * ORION-9 GLOBAL OPERATIONS MAP — BOTTOM KPI STRIP
 * Compact executive strip reflecting truthful canonical metrics.
 */

import React from 'react';
import { Anchor, Plane, Truck, TrainTrack, ShieldAlert, DollarSign } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../../lib/formatters';

interface MapBottomKpiStripProps {
  activeShipments: number;
  oceanCount: number;
  airCount: number;
  roadCount: number;
  railCount: number;
  exceptionsCount: number;
  capitalAtRisk: number;
  currency?: string;
  onFilterByMode?: (mode: 'OCEAN' | 'AIR' | 'ROAD' | 'RAIL') => void;
}

export const MapBottomKpiStrip: React.FC<MapBottomKpiStripProps> = ({
  activeShipments,
  oceanCount,
  airCount,
  roadCount,
  railCount,
  exceptionsCount,
  capitalAtRisk,
  currency = 'USD',
  onFilterByMode,
}) => {
  return (
    <div
      data-testid="map-bottom-kpi-strip"
      className="w-full shrink-0 px-3 py-1.5 sm:py-2 z-20 select-none flex justify-center bg-[#080A0D]/95 border-t border-os-border/70 backdrop-blur-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 px-3.5 py-1.5 rounded-xl bg-os-surface/90 backdrop-blur-md border border-os-border shadow-lg pointer-events-auto font-mono text-[10px] sm:text-[11px] text-os-text-secondary max-w-4xl w-full">
        <div className="flex items-center gap-1.5">
          <span className="text-os-text-muted uppercase text-[9px] font-bold">Active Shipments:</span>
          <span className="font-bold text-os-text-primary">{formatNumber(activeShipments)}</span>
        </div>

        <span className="text-os-border">|</span>

        <button
          onClick={() => onFilterByMode?.('OCEAN')}
          className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors cursor-pointer"
        >
          <Anchor size={11} className="text-cyan-400" />
          <span className="text-os-text-muted">Ocean</span>
          <strong className="text-os-text-primary">{oceanCount}</strong>
        </button>

        <span className="text-os-border">|</span>

        <button
          onClick={() => onFilterByMode?.('AIR')}
          className="flex items-center gap-1.5 hover:text-purple-400 transition-colors cursor-pointer"
        >
          <Plane size={11} className="text-purple-400" />
          <span className="text-os-text-muted">Air</span>
          <strong className="text-os-text-primary">{airCount}</strong>
        </button>

        <span className="text-os-border">|</span>

        <button
          onClick={() => onFilterByMode?.('ROAD')}
          className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-pointer"
        >
          <Truck size={11} className="text-emerald-400" />
          <span className="text-os-text-muted">Road</span>
          <strong className="text-os-text-primary">{roadCount}</strong>
        </button>

        <span className="text-os-border">|</span>

        <button
          onClick={() => onFilterByMode?.('RAIL')}
          className="flex items-center gap-1.5 hover:text-amber-400 transition-colors cursor-pointer"
        >
          <TrainTrack size={11} className="text-amber-400" />
          <span className="text-os-text-muted">Rail</span>
          <strong className="text-os-text-primary">{railCount}</strong>
        </button>

        <span className="text-os-border">|</span>

        <div className="flex items-center gap-1.5">
          <ShieldAlert size={11} className="text-red-400" />
          <span className="text-os-text-muted">Exceptions:</span>
          <strong className="text-red-400">{exceptionsCount}</strong>
        </div>

        <span className="text-os-border">|</span>

        <div className="flex items-center gap-1.5">
          <span className="text-os-text-muted uppercase text-[9px] font-bold">Revenue at Risk:</span>
          <strong className="text-red-400">{formatCurrency(capitalAtRisk, currency)}</strong>
        </div>
      </div>
    </div>
  );
};
