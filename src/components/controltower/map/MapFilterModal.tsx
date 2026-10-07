/**
 * ORION-9 GLOBAL OPERATIONS MAP — MAP FILTER MODAL
 * High-precision operational filters for transport modes, delay status, and capital exposure.
 */

import React from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';
import { GlobalMapFilterCriteria, TransportMode } from './types';

interface MapFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: GlobalMapFilterCriteria;
  onFiltersChange: (f: Partial<GlobalMapFilterCriteria>) => void;
  onReset: () => void;
}

export const MapFilterModal: React.FC<MapFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onReset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-14 right-3 sm:right-20 z-20 w-72 p-3.5 rounded-xl bg-os-surface/95 backdrop-blur-md border border-os-border shadow-xl select-none font-mono text-xs animate-fade-in">
      <div className="flex items-center justify-between pb-2 border-b border-os-border mb-3">
        <div className="flex items-center gap-1.5 text-os-text-primary font-bold">
          <Filter size={14} className="text-cyan-400" />
          <span>FILTER OPERATIONS</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            title="Reset Filters"
            className="text-os-text-muted hover:text-os-text-primary transition-colors cursor-pointer"
          >
            <RotateCcw size={12} />
          </button>
          <button
            onClick={onClose}
            className="text-os-text-muted hover:text-os-text-primary transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Mode Filter */}
        <div>
          <label className="text-[10px] text-os-text-muted uppercase font-bold block mb-1">
            Transport Mode
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(['ALL', 'OCEAN', 'AIR', 'ROAD', 'RAIL'] as const).map((m) => (
              <button
                key={m}
                onClick={() => onFiltersChange({ mode: m })}
                className={`py-1 px-1.5 rounded text-[10px] text-center transition-all ${
                  filters.mode === m
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-semibold'
                    : 'bg-os-hover text-os-text-secondary hover:text-os-text-primary'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="text-[10px] text-os-text-muted uppercase font-bold block mb-1">
            Operational Status
          </label>
          <div className="grid grid-cols-2 gap-1">
            {[
              { id: 'ALL', label: 'All Status' },
              { id: 'ON_TIME', label: 'On Time' },
              { id: 'DELAYED', label: 'Delayed' },
              { id: 'AT_RISK', label: 'At Risk' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => onFiltersChange({ status: st.id as any })}
                className={`py-1 px-1.5 rounded text-[10px] text-center transition-all ${
                  filters.status === st.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-semibold'
                    : 'bg-os-hover text-os-text-secondary hover:text-os-text-primary'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Region Filter */}
        <div>
          <label className="text-[10px] text-os-text-muted uppercase font-bold block mb-1">
            Geographic Region
          </label>
          <select
            value={filters.region}
            onChange={(e) => onFiltersChange({ region: e.target.value })}
            className="w-full bg-os-hover border border-os-border rounded px-2 py-1 text-xs text-os-text-primary focus:outline-none focus:border-cyan-500/50"
          >
            <option value="ALL">All Global Regions</option>
            <option value="APAC">Asia-Pacific (APAC)</option>
            <option value="EMEA">Europe & Middle East (EMEA)</option>
            <option value="AMER">Americas (AMER)</option>
          </select>
        </div>

        {/* Capital At Risk Slider */}
        <div>
          <div className="flex items-center justify-between text-[10px] text-os-text-muted uppercase font-bold mb-1">
            <span>Min Revenue at Risk</span>
            <span className="text-cyan-400">${(filters.minRevenueRisk / 1000).toFixed(0)}k+</span>
          </div>
          <input
            type="range"
            min={0}
            max={100000}
            step={5000}
            value={filters.minRevenueRisk}
            onChange={(e) => onFiltersChange({ minRevenueRisk: Number(e.target.value) })}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
