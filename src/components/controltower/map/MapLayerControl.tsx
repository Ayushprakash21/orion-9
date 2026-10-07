/**
 * ORION-9 GLOBAL OPERATIONS MAP — COMPACT LAYER CONTROL PANEL
 * Floating panel with grouped toggles for Transport, Infrastructure, Risk, and Operations.
 */

import React from 'react';
import { 
  Anchor, 
  Plane, 
  Truck, 
  TrainTrack, 
  MapPin, 
  Building2, 
  AlertTriangle, 
  Layers, 
  X,
  Factory,
  Boxes,
  Activity
} from 'lucide-react';
import { MapLayersState } from './types';

interface MapLayerControlProps {
  isOpen: boolean;
  onClose: () => void;
  layers: MapLayersState;
  onToggleLayer: (key: keyof MapLayersState) => void;
  onSelectAll: () => void;
}

export const MapLayerControl: React.FC<MapLayerControlProps> = ({
  isOpen,
  onClose,
  layers,
  onToggleLayer,
  onSelectAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-14 right-3 z-20 w-64 p-3 rounded-xl bg-os-surface/95 backdrop-blur-md border border-os-border shadow-xl select-none font-mono text-xs animate-fade-in">
      <div className="flex items-center justify-between pb-2 border-b border-os-border mb-2.5">
        <div className="flex items-center gap-1.5 text-os-text-primary font-bold">
          <Layers size={14} className="text-cyan-400" />
          <span>MAP LAYERS</span>
        </div>
        <button 
          onClick={onClose}
          className="text-os-text-muted hover:text-os-text-primary transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {/* TRANSPORT */}
        <div>
          <span className="text-[10px] text-os-text-muted font-bold tracking-wider uppercase block mb-1.5">
            Transport
          </span>
          <div className="space-y-1">
            <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-os-hover cursor-pointer text-os-text-secondary hover:text-os-text-primary">
              <input
                type="checkbox"
                checked={layers.oceanVessels}
                onChange={() => onToggleLayer('oceanVessels')}
                className="rounded accent-cyan-500"
              />
              <Anchor size={12} className="text-cyan-400" />
              <span>Ocean Vessels</span>
            </label>
            <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-os-hover cursor-pointer text-os-text-secondary hover:text-os-text-primary">
              <input
                type="checkbox"
                checked={layers.aircraft}
                onChange={() => onToggleLayer('aircraft')}
                className="rounded accent-purple-500"
              />
              <Plane size={12} className="text-purple-400" />
              <span>Aircraft</span>
            </label>
            <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-os-hover cursor-pointer text-os-text-secondary hover:text-os-text-primary">
              <input
                type="checkbox"
                checked={layers.trucks}
                onChange={() => onToggleLayer('trucks')}
                className="rounded accent-emerald-500"
              />
              <Truck size={12} className="text-emerald-400" />
              <span>Trucks</span>
            </label>
            <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-os-hover cursor-pointer text-os-text-secondary hover:text-os-text-primary">
              <input
                type="checkbox"
                checked={layers.rail}
                onChange={() => onToggleLayer('rail')}
                className="rounded accent-amber-500"
              />
              <TrainTrack size={12} className="text-amber-400" />
              <span>Rail Intermodal</span>
            </label>
            <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-os-hover cursor-pointer text-os-text-secondary hover:text-os-text-primary">
              <input
                type="checkbox"
                checked={layers.shipmentRoutes}
                onChange={() => onToggleLayer('shipmentRoutes')}
                className="rounded accent-blue-500"
              />
              <Activity size={12} className="text-blue-400" />
              <span>Active Routes</span>
            </label>
          </div>
        </div>

        {/* INFRASTRUCTURE */}
        <div>
          <span className="text-[10px] text-os-text-muted font-bold tracking-wider uppercase block mb-1.5">
            Infrastructure
          </span>
          <div className="space-y-1">
            <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-os-hover cursor-pointer text-os-text-secondary hover:text-os-text-primary">
              <input
                type="checkbox"
                checked={layers.ports}
                onChange={() => onToggleLayer('ports')}
                className="rounded accent-cyan-500"
              />
              <MapPin size={12} className="text-cyan-400" />
              <span>Ports</span>
            </label>
            <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-os-hover cursor-pointer text-os-text-secondary hover:text-os-text-primary">
              <input
                type="checkbox"
                checked={layers.airports}
                onChange={() => onToggleLayer('airports')}
                className="rounded accent-purple-500"
              />
              <Plane size={12} className="text-purple-400" />
              <span>Airports</span>
            </label>
            <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-os-hover cursor-pointer text-os-text-secondary hover:text-os-text-primary">
              <input
                type="checkbox"
                checked={layers.warehouses}
                onChange={() => onToggleLayer('warehouses')}
                className="rounded accent-emerald-500"
              />
              <Boxes size={12} className="text-emerald-400" />
              <span>Warehouses</span>
            </label>
            <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-os-hover cursor-pointer text-os-text-secondary hover:text-os-text-primary">
              <input
                type="checkbox"
                checked={layers.suppliers}
                onChange={() => onToggleLayer('suppliers')}
                className="rounded accent-amber-500"
              />
              <Factory size={12} className="text-amber-400" />
              <span>Suppliers</span>
            </label>
          </div>
        </div>

        {/* RISK & OPERATIONS */}
        <div>
          <span className="text-[10px] text-os-text-muted font-bold tracking-wider uppercase block mb-1.5">
            Risk & Operations
          </span>
          <div className="space-y-1">
            <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-os-hover cursor-pointer text-os-text-secondary hover:text-os-text-primary">
              <input
                type="checkbox"
                checked={layers.exceptions}
                onChange={() => onToggleLayer('exceptions')}
                className="rounded accent-red-500"
              />
              <AlertTriangle size={12} className="text-red-400" />
              <span>Exceptions</span>
            </label>
            <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-os-hover cursor-pointer text-os-text-secondary hover:text-os-text-primary">
              <input
                type="checkbox"
                checked={layers.congestion}
                onChange={() => onToggleLayer('congestion')}
                className="rounded accent-amber-500"
              />
              <span className="text-amber-400 text-[10px]">●</span>
              <span>Port Congestion Heat</span>
            </label>
            <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-os-hover cursor-pointer text-os-text-secondary hover:text-os-text-primary">
              <input
                type="checkbox"
                checked={layers.weather}
                onChange={() => onToggleLayer('weather')}
                className="rounded accent-cyan-500"
              />
              <span className="text-cyan-400 text-[10px]">●</span>
              <span>Weather Advisories</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
