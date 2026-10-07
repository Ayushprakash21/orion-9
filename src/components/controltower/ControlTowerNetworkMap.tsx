import React, { useState } from 'react';
import { 
  Plane, 
  Anchor, 
  Building2, 
  Factory, 
  Maximize2, 
  Filter, 
  Navigation,
  Compass,
  AlertTriangle
} from 'lucide-react';
import { MapNode, MissionControlCardItem } from './missionControlTypes';

interface ControlTowerNetworkMapProps {
  selectedMission: MissionControlCardItem | null;
  onSelectNode?: (nodeId: string) => void;
}

// Global Hubs & Gateway Nodes for SCM Network
const DEFAULT_NODES: MapNode[] = [
  // Major Ports & Airports representing critical global hubs
  { id: 'pvg', name: 'Shanghai Pudong', type: 'airport', code: 'PVG', city: 'Shanghai', x: 22, y: 35, activeStatus: 'normal' },
  { id: 'sin', name: 'Port of Singapore', type: 'seaport', code: 'SIN', city: 'Singapore', x: 28, y: 65, activeStatus: 'normal' },
  { id: 'jkt', name: 'Tanjung Priok', type: 'seaport', code: 'JKT', city: 'Jakarta', x: 34, y: 76, activeStatus: 'congested' },
  { id: 'icn', name: 'Incheon Port & Terminal', type: 'seaport', code: 'ICN', city: 'Incheon', x: 26, y: 22, activeStatus: 'normal' },
  { id: 'okinawa', name: 'Naha Logistics Base', type: 'airport', code: 'OKA', city: 'Okinawa', x: 37, y: 42, activeStatus: 'delayed' },
  { id: 'piti', name: 'Port of Guam', type: 'seaport', code: 'GUM', city: 'Piti, Guam', x: 52, y: 56, activeStatus: 'alert' },
  { id: 'rtm', name: 'Port of Rotterdam', type: 'seaport', code: 'RTM', city: 'Rotterdam', x: 62, y: 26, activeStatus: 'normal' },
  { id: 'fra', name: 'Frankfurt Hub', type: 'airport', code: 'FRA', city: 'Frankfurt', x: 68, y: 32, activeStatus: 'normal' },
  { id: 'lax', name: 'Port of Los Angeles', type: 'seaport', code: 'LAX', city: 'Los Angeles', x: 84, y: 44, activeStatus: 'normal' },
  { id: 'ord', name: 'O\'Hare Air Cargo', type: 'airport', code: 'ORD', city: 'Chicago', x: 89, y: 36, activeStatus: 'normal' },
  { id: 'jfk', name: 'JFK Air Terminal', type: 'airport', code: 'JFK', city: 'New York', x: 92, y: 40, activeStatus: 'normal' },
];

export const ControlTowerNetworkMap: React.FC<ControlTowerNetworkMapProps> = ({
  selectedMission,
  onSelectNode,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'airport' | 'seaport'>('all');
  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null);

  const filteredNodes = DEFAULT_NODES.filter((n) => {
    if (filterType === 'all') return true;
    return n.type === filterType;
  });

  // Calculate dynamic route curve based on selected mission
  const activeRoutePath = selectedMission?.origin === 'PVG' && selectedMission?.destination === 'JKT'
    ? 'M 22 35 Q 37 48 52 56 T 34 76'
    : 'M 22 35 Q 50 30 84 44';

  return (
    <div className="relative w-full h-[360px] sm:h-[420px] lg:h-[460px] bg-[#0A0D11] border border-os-border rounded-xl overflow-hidden select-none flex flex-col">
      {/* MAP TOP CONTROLS & OVERLAYS */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        {/* Node Filters Bar */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-os-surface/90 backdrop-blur-md border border-os-border pointer-events-auto shadow-md">
          <span className="text-[10px] font-mono text-os-text-muted px-1.5 uppercase font-semibold">
            Port Type
          </span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
              filterType === 'all'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-os-text-muted hover:text-os-text-primary'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('airport')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
              filterType === 'airport'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'text-os-text-muted hover:text-os-text-primary'
            }`}
          >
            <Plane size={10} />
            <span>Airport</span>
          </button>
          <button
            onClick={() => setFilterType('seaport')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
              filterType === 'seaport'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-os-text-muted hover:text-os-text-primary'
            }`}
          >
            <Anchor size={10} />
            <span>Seaport</span>
          </button>
        </div>

        {/* Status Badge */}
        {selectedMission && (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-os-surface/90 backdrop-blur-md border border-os-border text-[11px] font-mono pointer-events-auto">
            <span className="text-os-text-muted">Route Track:</span>
            <span className="text-cyan-400 font-semibold">{selectedMission.origin} &rarr; {selectedMission.destination}</span>
            <span className={`px-1.5 py-0.2 rounded text-[9px] ${
              selectedMission.status === 'DELAYED' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {selectedMission.status}
            </span>
          </div>
        )}
      </div>

      {/* SVG GEOSPATIAL MAP VIEWPORT */}
      <div className="relative flex-1 w-full h-full">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full text-os-border/40"
        >
          <defs>
            {/* Subtle grid pattern */}
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            </pattern>
            {/* Pulsing marker gradient */}
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="50%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid & Continents Silhouette (Subtle Vector Polyline) */}
          <rect width="100%" height="100%" fill="#07090D" />
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Continents Outline Path (Subtle stylized map silhouettes) */}
          <g opacity="0.18" fill="none" stroke="#252A33" strokeWidth="0.7">
            {/* Asia & Pacific */}
            <path d="M 15 20 Q 25 15 35 25 T 45 40 T 35 65 T 25 80 Z" />
            {/* Europe */}
            <path d="M 58 18 Q 70 20 72 38 T 60 45 Z" />
            {/* Americas */}
            <path d="M 80 20 Q 95 25 92 50 T 82 75 Z" />
          </g>

          {/* Active Mission Trajectory / Route */}
          {selectedMission && (
            <g>
              {/* Outer Glow Path */}
              <path
                d={activeRoutePath}
                fill="none"
                stroke="rgba(239, 68, 68, 0.4)"
                strokeWidth="1.8"
                filter="url(#glow)"
              />
              {/* Dashed Animated Path */}
              <path
                d={activeRoutePath}
                fill="none"
                stroke={selectedMission.status === 'DELAYED' ? '#EF4444' : '#06B6D4'}
                strokeWidth="0.9"
                strokeDasharray="2, 1"
                className="animate-pulse"
              />
            </g>
          )}

          {/* Background Secondary Connecting Corridors */}
          <g opacity="0.25" fill="none" stroke="#334155" strokeWidth="0.4" strokeDasharray="1, 2">
            <line x1="22" y1="35" x2="28" y2="65" />
            <line x1="28" y1="65" x2="34" y2="76" />
            <line x1="22" y1="35" x2="26" y2="22" />
            <line x1="26" y1="22" x2="37" y2="42" />
            <line x1="37" y1="42" x2="52" y2="56" />
            <line x1="62" y1="26" x2="68" y2="32" />
            <line x1="84" y1="44" x2="89" y2="36" />
            <line x1="89" y1="36" x2="92" y2="40" />
          </g>

          {/* Interactive Port / Airport Nodes */}
          {filteredNodes.map((node) => {
            const isOrigin = selectedMission?.origin === node.code;
            const isDestination = selectedMission?.destination === node.code;
            const isHighlight = isOrigin || isDestination || node.activeStatus === 'delayed';

            const fillColor = node.type === 'airport' ? '#A855F7' : '#06B6D4';
            const alertColor = node.activeStatus === 'delayed' || node.activeStatus === 'alert' ? '#EF4444' : fillColor;

            return (
              <g
                key={node.id}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onSelectNode && onSelectNode(node.id)}
              >
                {/* Node Ring Halo */}
                {isHighlight && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="3.5"
                    fill="none"
                    stroke={alertColor}
                    strokeWidth="0.5"
                    opacity="0.6"
                    className="animate-ping"
                  />
                )}

                {/* Node Outer Circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="2"
                  fill="#0B0D11"
                  stroke={alertColor}
                  strokeWidth="0.8"
                />

                {/* Node Center Dot */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="0.9"
                  fill={alertColor}
                />

                {/* Node Label Text */}
                <text
                  x={node.x}
                  y={node.y - 2.8}
                  fill="#F1F5F9"
                  fontSize="2.4"
                  fontWeight="600"
                  fontFamily="monospace"
                  textAnchor="middle"
                  className="pointer-events-none drop-shadow-md select-none"
                >
                  {node.city || node.name}
                </text>
                <text
                  x={node.x}
                  y={node.y + 3.8}
                  fill="#94A3B8"
                  fontSize="1.8"
                  fontFamily="monospace"
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                >
                  {node.code}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hovered Node Tooltip Box */}
        {hoveredNode && (
          <div
            className="absolute z-20 pointer-events-none p-2 rounded-lg bg-os-surface-elevated/95 border border-os-border shadow-xl text-xs backdrop-blur-md"
            style={{
              left: `${Math.min(80, Math.max(5, hoveredNode.x))}%`,
              top: `${Math.min(75, Math.max(10, hoveredNode.y))}%`,
              transform: 'translate(-50%, -120%)',
            }}
          >
            <div className="font-semibold text-os-text-primary flex items-center gap-1.5">
              {hoveredNode.type === 'airport' ? <Plane size={11} className="text-purple-400" /> : <Anchor size={11} className="text-cyan-400" />}
              <span>{hoveredNode.name}</span>
            </div>
            <div className="text-[10px] text-os-text-muted font-mono mt-0.5">
              Code: <span className="text-cyan-300">{hoveredNode.code}</span> | Status: <span className="uppercase text-os-text-secondary">{hoveredNode.activeStatus}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
