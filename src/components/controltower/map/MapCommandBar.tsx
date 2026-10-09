/**
 * ORION-9 GLOBAL OPERATIONS MAP — TOP COMMAND BAR
 * Minimal floating operations command bar with global search,
 * projection toggle, layer controls, and truthful data source badge.
 */

import React, { useState } from 'react';
import { 
  Search, 
  Globe, 
  Layers, 
  Filter, 
  Maximize2, 
  Compass, 
  Radio, 
  ShieldCheck, 
  X,
  Navigation
} from 'lucide-react';
import { MapProjectionMode, DataSourceType } from './types';

interface MapCommandBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  projectionMode: MapProjectionMode;
  onToggleProjection: () => void;
  onResetNorth: () => void;
  onFitOperations: () => void;
  onToggleLayers: () => void;
  onToggleFilters: () => void;
  onOpenDataSourceModal: () => void;
  isLayersOpen: boolean;
  isFiltersOpen: boolean;
  dataSourceType: DataSourceType;
  freshnessSeconds: number;
}

export const MapCommandBar: React.FC<MapCommandBarProps> = ({
  searchQuery,
  onSearchChange,
  projectionMode,
  onToggleProjection,
  onResetNorth,
  onFitOperations,
  onToggleLayers,
  onToggleFilters,
  onOpenDataSourceModal,
  isLayersOpen,
  isFiltersOpen,
  dataSourceType,
  freshnessSeconds,
}) => {
  return (
    <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none select-none">
      {/* LEFT: Branding & Global Search */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-os-surface/90 backdrop-blur-md border border-os-border shadow-md">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-wider text-os-text-primary">
            ORION GLOBAL OPERATIONS
          </span>
        </div>

        {/* Search Input */}
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-2.5 text-os-text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search shipments, vessels, flights, ports..."
            className="w-48 sm:w-64 md:w-72 pl-8 pr-7 py-1.5 rounded-lg bg-os-surface/90 backdrop-blur-md border border-os-border text-xs font-mono text-os-text-primary placeholder:text-os-text-muted/60 focus:outline-none focus:border-cyan-500/50 shadow-md transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 text-os-text-muted hover:text-os-text-primary"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* RIGHT: Status Badge & Map Controls */}
      <div className="flex items-center gap-1.5 pointer-events-auto">
        {/* TRUTHFUL DATA SOURCE BADGE */}
        <button
          onClick={onOpenDataSourceModal}
          data-testid="data-source-badge"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-os-surface/90 backdrop-blur-md border border-os-border text-xs font-mono shadow-md hover:border-os-border-strong transition-all cursor-pointer"
        >
          {dataSourceType === 'LIVE_EXTERNAL' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-semibold">● LIVE</span>
              <span className="text-os-text-muted text-[10px] hidden sm:inline">{freshnessSeconds}s</span>
            </>
          ) : dataSourceType === 'SIMULATION' || dataSourceType === 'DEMO' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400/80" />
              <span className="text-amber-400 font-semibold">◐ SIMULATION</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-os-text-muted" />
              <span className="text-os-text-muted font-semibold">○ OFFLINE</span>
            </>
          )}
        </button>

        {/* Projection Mode Toggle (Globe vs 2D) */}
        <button
          onClick={onToggleProjection}
          data-testid="projection-toggle-btn"
          aria-label={projectionMode === 'globe' ? 'Switch to 2D Mercator' : 'Switch to 3D Globe'}
          title={projectionMode === 'globe' ? 'Switch to 2D Mercator' : 'Switch to 3D Globe'}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-os-surface/90 backdrop-blur-md border border-os-border text-xs font-mono text-os-text-secondary hover:text-os-text-primary hover:border-os-border-strong shadow-md transition-all cursor-pointer"
        >
          <Globe size={13} className={projectionMode === 'globe' ? 'text-cyan-400' : ''} />
          <span className="hidden sm:inline">{projectionMode === 'globe' ? '3D Globe' : '2D Map'}</span>
        </button>

        {/* Fit Operations */}
        <button
          onClick={onFitOperations}
          title="Fit Global Operations View"
          className="p-1.5 rounded-lg bg-os-surface/90 backdrop-blur-md border border-os-border text-os-text-secondary hover:text-os-text-primary shadow-md transition-all"
        >
          <Navigation size={14} />
        </button>

        {/* Reset North */}
        <button
          onClick={onResetNorth}
          title="Reset Camera North"
          className="p-1.5 rounded-lg bg-os-surface/90 backdrop-blur-md border border-os-border text-os-text-secondary hover:text-os-text-primary shadow-md transition-all"
        >
          <Compass size={14} />
        </button>

        {/* Layers Panel Toggle */}
        <button
          onClick={onToggleLayers}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg backdrop-blur-md border text-xs font-mono shadow-md transition-all ${
            isLayersOpen
              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
              : 'bg-os-surface/90 text-os-text-secondary border-os-border hover:text-os-text-primary'
          }`}
        >
          <Layers size={13} />
          <span className="hidden sm:inline">Layers</span>
        </button>

        {/* Filters Panel Toggle */}
        <button
          onClick={onToggleFilters}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg backdrop-blur-md border text-xs font-mono shadow-md transition-all ${
            isFiltersOpen
              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
              : 'bg-os-surface/90 text-os-text-secondary border-os-border hover:text-os-text-primary'
          }`}
        >
          <Filter size={13} />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>
    </div>
  );
};
