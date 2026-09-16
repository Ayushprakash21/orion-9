import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { 
  Globe, Search, Filter, Info, Eye, ArrowRight, Zap, AlertTriangle, 
  CheckCircle2, Server, Terminal, Compass, Sparkles, Database,
  RotateCcw, Activity, ShieldAlert, Layers, Box, ExternalLink,
  Target, Route as RouteIcon, Play, Pause, ChevronRight,
  PanelRightClose, PanelRightOpen, Maximize2, Minimize2, X
} from 'lucide-react';
import { OrionIntelligenceDrawer, OrionGraph } from './OrionIntelligenceComponents';
import { WorldModelCanvas3D } from './world-model-3d/WorldModelCanvas3D';
import { 
  WorldModelEngine3D, 
  WorldEntity3D, 
  WorldRelationship3D, 
  DomainCluster3D,
  BlastRadiusResult,
  PathTraceResult
} from './world-model-3d/WorldModelEngine3D';
import { cn } from '../../lib/utils';

export const WorldModelView: React.FC = () => {
  const navigate = useNavigate();
  const { 
    products, inventory, suppliers, purchaseOrders, shipments, exceptions, 
    decisions, actions, warehouses, customers, customerOrders,
    dataMode, isInitializing 
  } = useSupplyChain();

  // Core View Modes: 'WORLD' (Digital Twin) | 'NETWORK' (Technical Graph) | 'ENTITY' (Focused Dependency)
  const [visualizationMode, setVisualizationMode] = useState<'WORLD' | 'NETWORK' | 'ENTITY'>('WORLD');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<WorldEntity3D | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<WorldEntity3D | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Flow & Animation
  const [isFlowActive, setIsFlowActive] = useState<boolean>(true);
  const [cameraPresetTrigger, setCameraPresetTrigger] = useState<{ preset: string; timestamp: number } | null>(null);
  const [focusEntityTrigger, setFocusEntityTrigger] = useState<{ entityId: string; timestamp: number } | null>(null);

  // Advanced Graph Reasoning
  const [blastRadius, setBlastRadius] = useState<BlastRadiusResult | null>(null);
  const [pathTrace, setPathTrace] = useState<PathTraceResult | null>(null);
  const [activeAnalysisMode, setActiveAnalysisMode] = useState<'INSPECT' | 'BLAST_RADIUS' | 'PATH_TRACE'>('INSPECT');

  // 1. Build authentic 3D Digital Twin graph data from real context
  const graphData = useMemo(() => {
    return WorldModelEngine3D.buildGraph({
      suppliers,
      products,
      warehouses,
      purchaseOrders,
      shipments,
      inventory,
      exceptions,
      decisions,
      actions,
      customers,
      customerOrders
    });
  }, [suppliers, products, warehouses, purchaseOrders, shipments, inventory, exceptions, decisions, actions, customers, customerOrders]);

  const { entities, relationships, domainClusters, stats } = graphData;

  // 2. Filter entities for search
  const filteredEntities = useMemo(() => {
    return entities.filter(e => {
      const matchSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGroup = selectedGroup === 'ALL' || e.group === selectedGroup || e.id === 'ORION_CORE';
      return matchSearch && matchGroup;
    });
  }, [entities, searchQuery, selectedGroup]);

  // Autocomplete Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return entities.filter(e => 
      e.id !== 'ORION_CORE' &&
      e.archetype !== 'DOMAIN_HUB' &&
      (e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       e.id.toLowerCase().includes(searchQuery.toLowerCase()))
    ).slice(0, 6);
  }, [entities, searchQuery]);

  // 3. Highlighted Entities & Relationships (computed from Selection, Blast Radius, or Path Trace)
  const highlightedEntityIds = useMemo(() => {
    const ids = new Set<string>();

    if (activeAnalysisMode === 'BLAST_RADIUS' && blastRadius) {
      ids.add(blastRadius.rootEntity.id);
      blastRadius.levels.forEach(lvl => {
        lvl.entities.forEach(e => ids.add(e.id));
      });
      return ids;
    }

    if (activeAnalysisMode === 'PATH_TRACE' && pathTrace && pathTrace.found) {
      pathTrace.pathNodes.forEach(n => ids.add(n.id));
      return ids;
    }

    if (selectedEntity) {
      ids.add(selectedEntity.id);
      relationships.forEach(rel => {
        if (rel.sourceId === selectedEntity.id) ids.add(rel.targetId);
        if (rel.targetId === selectedEntity.id) ids.add(rel.sourceId);
      });
    }

    return ids;
  }, [selectedEntity, relationships, activeAnalysisMode, blastRadius, pathTrace]);

  const highlightedRelIds = useMemo(() => {
    const ids = new Set<string>();

    if (activeAnalysisMode === 'BLAST_RADIUS' && blastRadius) {
      blastRadius.levels.forEach(lvl => {
        lvl.relationships.forEach(r => ids.add(r.id));
      });
      return ids;
    }

    if (activeAnalysisMode === 'PATH_TRACE' && pathTrace && pathTrace.found) {
      pathTrace.pathEdges.forEach(r => ids.add(r.id));
      return ids;
    }

    if (selectedEntity) {
      relationships.forEach(rel => {
        if (rel.sourceId === selectedEntity.id || rel.targetId === selectedEntity.id) {
          ids.add(rel.id);
        }
      });
    }

    return ids;
  }, [selectedEntity, relationships, activeAnalysisMode, blastRadius, pathTrace]);

  // 4. Upstream & Downstream Dependencies
  const entityDependencies = useMemo(() => {
    if (!selectedEntity) return { upstream: [], downstream: [] };
    const entityMap = new Map(entities.map(e => [e.id, e]));

    const upstream: { entity: WorldEntity3D; relName: string }[] = [];
    const downstream: { entity: WorldEntity3D; relName: string }[] = [];

    relationships.forEach(r => {
      if (r.targetId === selectedEntity.id) {
        const src = entityMap.get(r.sourceId);
        if (src && src.archetype !== 'DOMAIN_HUB') {
          upstream.push({ entity: src, relName: r.relationshipName });
        }
      }
      if (r.sourceId === selectedEntity.id) {
        const tgt = entityMap.get(r.targetId);
        if (tgt && tgt.archetype !== 'DOMAIN_HUB') {
          downstream.push({ entity: tgt, relName: r.relationshipName });
        }
      }
    });

    return { upstream, downstream };
  }, [selectedEntity, entities, relationships]);

  // Handle Selection
  const handleSelectEntity = useCallback((entity: WorldEntity3D | null) => {
    setSelectedEntity(entity);
    setActiveAnalysisMode('INSPECT');
    setBlastRadius(null);
    setPathTrace(null);
    if (entity) {
      setIsInspectorOpen(true);
      setFocusEntityTrigger({ entityId: entity.id, timestamp: Date.now() });
      if (entity.domainHubId) {
        setExpandedDomain(entity.domainHubId);
      }
    }
  }, []);

  // Handle Blast Radius
  const handleRunBlastRadius = () => {
    if (!selectedEntity) return;
    const result = WorldModelEngine3D.calculateBlastRadius(selectedEntity.id, entities, relationships, 3);
    if (result) {
      setBlastRadius(result);
      setActiveAnalysisMode('BLAST_RADIUS');
    }
  };

  // Handle Trace Path
  const handleRunTracePath = () => {
    if (!selectedEntity) return;
    const targetCust = entities.find(e => e.archetype === 'CUSTOMER');
    const targetWh = entities.find(e => e.archetype === 'WAREHOUSE');
    const dest = targetCust || targetWh;
    if (!dest) return;

    const result = WorldModelEngine3D.tracePath(selectedEntity.id, dest.id, entities, relationships);
    setPathTrace(result);
    setActiveAnalysisMode('PATH_TRACE');
  };

  // Camera Presets
  const handlePresetSelect = (preset: string) => {
    setCameraPresetTrigger({ preset, timestamp: Date.now() });
    if (preset !== 'WORLD') {
      const matchedHub = domainClusters.find(c => c.group === preset);
      if (matchedHub) {
        setExpandedDomain(matchedHub.id);
        setSelectedGroup(preset);
      }
    } else {
      setExpandedDomain(null);
      setSelectedGroup('ALL');
      setSelectedEntity(null);
    }
  };

  // Fallback 2D Topology Graph
  const fallbackGraphNodes = useMemo(() => {
    return filteredEntities.filter(e => e.archetype !== 'DOMAIN_HUB').slice(0, 16).map((entity, idx) => {
      const angle = (idx / 16) * 2 * Math.PI;
      const r = 130;
      return {
        id: entity.id,
        label: entity.name.slice(0, 16),
        group: entity.group,
        status: entity.risk === 'high' || entity.risk === 'critical' ? 'risk' : entity.risk === 'warning' ? 'warning' : 'normal',
        x: 300 + r * Math.cos(angle),
        y: 160 + r * Math.sin(angle),
        raw: entity
      };
    });
  }, [filteredEntities]);

  const fallbackGraphLinks = useMemo(() => {
    const list: any[] = [];
    for (let i = 0; i < fallbackGraphNodes.length - 1; i++) {
      list.push({ source: fallbackGraphNodes[i].id, target: fallbackGraphNodes[i + 1].id, active: fallbackGraphNodes[i].status === 'risk' });
    }
    if (fallbackGraphNodes.length > 4) {
      list.push({ source: fallbackGraphNodes[0].id, target: fallbackGraphNodes[4].id, active: true });
    }
    return list;
  }, [fallbackGraphNodes]);

  const isDataSyncing = isInitializing;

  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-7 max-w-[1800px] mx-auto font-sans text-os-text-muted box-border">
      
      {/* 1. HEADER WITH ENGINE STATUS */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-bold">
              ORION WORLD MODEL
            </span>
            <span className="text-xs font-mono text-slate-500">DIGITAL TWIN ENGINE</span>
            <span className={cn(
              "px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded flex items-center gap-1",
              isDataSyncing ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
              "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            )}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {isDataSyncing ? 'UPDATING KERNEL' : dataMode === 'demo' ? 'SYNCED (LOCAL KERNEL)' : 'LIVE ERP MIRROR'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1.5">
            Orion SCM Digital Twin World Model
          </h1>
          <p className="text-xs text-os-text-muted mt-1 max-w-3xl">
            Structured 3D spatial knowledge model resolving suppliers, procurement commitments, warehouse buffers, logistics pipelines, and customer fulfillment.
          </p>
        </div>

        {/* Top Control Toolbar */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
          {/* Mode Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-900">
            {(['WORLD', 'NETWORK'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setVisualizationMode(mode)}
                className={cn(
                  "px-3 py-1.5 rounded font-bold transition-all flex items-center gap-1.5",
                  visualizationMode === mode 
                    ? "bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/40" 
                    : "text-slate-500 hover:text-os-text-secondary"
                )}
              >
                {mode === 'WORLD' ? <Box size={12} /> : <Layers size={12} />}
                <span>{mode}</span>
              </button>
            ))}
          </div>

          {/* Toggle Flow Button */}
          <button
            onClick={() => setIsFlowActive(!isFlowActive)}
            className={cn(
              "px-3 py-1.5 rounded-lg font-bold border flex items-center gap-1.5 transition-all",
              isFlowActive
                ? "bg-cyan-950/60 border-cyan-500/40 text-cyan-300"
                : "bg-slate-950 border-slate-800 text-slate-500 hover:text-os-text-secondary"
            )}
            title="Toggle Moving Data Packets"
          >
            {isFlowActive ? <Play size={11} className="text-cyan-400 fill-cyan-400" /> : <Pause size={11} />}
            <span>FLOW: {isFlowActive ? 'ON' : 'OFF'}</span>
          </button>

          {/* Inspector Panel Toggle Button */}
          <button
            onClick={() => setIsInspectorOpen(!isInspectorOpen)}
            className={cn(
              "px-3 py-1.5 rounded-lg font-bold border flex items-center gap-1.5 transition-all",
              isInspectorOpen
                ? "bg-slate-900 border-slate-700 text-cyan-400"
                : "bg-slate-950 border-slate-800 text-slate-500 hover:text-os-text-secondary"
            )}
            title="Toggle Relationship Inspector Panel"
          >
            {isInspectorOpen ? <PanelRightClose size={12} /> : <PanelRightOpen size={12} />}
            <span>INSPECTOR: {isInspectorOpen ? 'OPEN' : 'COLLAPSED'}</span>
          </button>

          {/* Fullscreen World Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-lg text-os-text-muted hover:text-cyan-300 transition-all"
            title={isFullscreen ? "Exit Fullscreen" : "Expand World (Fullscreen)"}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* 2. CAMERA PRESETS & DOMAIN ZONE FILTERS BAR */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 font-mono text-[11px] bg-slate-950/70 border border-slate-900 p-3 rounded-xl">
        {/* Domain Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mr-1">DOMAIN:</span>
          {['ALL', 'SUPPLY', 'INVENTORY', 'PROCUREMENT', 'LOGISTICS', 'CONTROL'].map(g => (
            <button
              key={g}
              onClick={() => {
                setSelectedGroup(g);
                if (g === 'ALL') {
                  setExpandedDomain(null);
                  handlePresetSelect('WORLD');
                } else {
                  handlePresetSelect(g);
                }
              }}
              className={cn(
                "px-2.5 py-1 rounded text-[10px] font-bold transition-all border",
                selectedGroup === g 
                  ? "bg-[#00F2FE]/15 text-[#00F2FE] border-[#00F2FE]/40" 
                  : "bg-slate-900/60 border-slate-800/80 text-os-text-muted hover:text-os-text-primary"
              )}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Camera Presets */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mr-1">CAMERA:</span>
          {['WORLD', 'SUPPLY', 'INVENTORY', 'PROCUREMENT', 'LOGISTICS', 'CONTROL'].map(p => (
            <button
              key={p}
              onClick={() => handlePresetSelect(p)}
              className="px-2 py-1 rounded text-[10px] font-bold bg-slate-900 hover:bg-slate-850 text-os-text-secondary hover:text-cyan-400 border border-slate-800 transition-all active:scale-95"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MAIN WORKSPACE GRID: 75-80% 3D DIGITAL TWIN + 20-25% INSPECTOR (COLLAPSIBLE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT / CENTER: 3D DIGITAL TWIN CANVAS (Span 9 when inspector open, Span 12 when collapsed) */}
        <div className={cn(
          "space-y-3 transition-all duration-200",
          isInspectorOpen ? "lg:col-span-9 xl:col-span-9" : "lg:col-span-12 xl:col-span-12"
        )}>
          
          {/* Autocomplete Search Bar */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-2.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-[11px] relative">
            <div className="flex items-center gap-2 flex-1 relative">
              <Search size={14} className="text-cyan-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Search entity (e.g., Apex Semi, WH-East, PO-1042, Container SHP-882)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-os-text-primary placeholder-slate-600 w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-os-text-secondary text-xs px-1">
                  ✕
                </button>
              )}

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-8 left-0 right-0 z-30 bg-[#060D17] border border-slate-800 rounded-lg shadow-2xl p-1 font-mono text-[11px] space-y-1">
                  {searchResults.map(res => (
                    <div
                      key={res.id}
                      onClick={() => {
                        handleSelectEntity(res);
                        setSearchQuery('');
                      }}
                      className="p-2 hover:bg-slate-900 rounded cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-cyan-400 font-bold">[{res.type}]</span>
                        <span className="text-os-text-primary font-bold truncate">{res.name}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 uppercase">{res.group}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-slate-500 uppercase tracking-wider text-[10px] shrink-0 font-bold">
              TOPOLOGY: <span className="text-cyan-400 font-bold">5 WORLDS</span> • <span className="text-os-text-secondary font-bold">{entities.length}</span> ENTITIES
            </div>
          </div>

          {/* Visualization Container */}
          {visualizationMode === 'NETWORK' ? (
            <div className="space-y-3">
              <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl font-mono text-[11px] text-amber-300 flex items-center justify-between">
                <span>2D TOPOLOGY ACTIVE • Switch to World Mode for 3D Digital Reality</span>
                <button 
                  onClick={() => setVisualizationMode('WORLD')} 
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded font-bold uppercase text-[10px]"
                >
                  Return to 3D World
                </button>
              </div>
              <OrionGraph 
                nodes={fallbackGraphNodes} 
                links={fallbackGraphLinks} 
                onNodeClick={(n) => {
                  const ent = entities.find(e => e.id === n.id);
                  if (ent) handleSelectEntity(ent);
                }} 
              />
            </div>
          ) : (
            <WorldModelCanvas3D
              entities={filteredEntities}
              relationships={relationships}
              domainClusters={domainClusters}
              visualizationMode={visualizationMode}
              onVisualizationModeChange={setVisualizationMode}
              selectedEntity={selectedEntity}
              onSelectEntity={handleSelectEntity}
              hoveredEntity={hoveredEntity}
              onHoverEntity={setHoveredEntity}
              activeGroup={selectedGroup}
              onSelectGroup={setSelectedGroup}
              expandedDomain={expandedDomain}
              onToggleExpandDomain={setExpandedDomain}
              isFlowActive={isFlowActive}
              onToggleFlow={() => setIsFlowActive(!isFlowActive)}
              highlightedEntityIds={highlightedEntityIds}
              highlightedRelIds={highlightedRelIds}
              cameraPresetTrigger={cameraPresetTrigger}
              focusEntityTrigger={focusEntityTrigger}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              className="w-full h-[620px]"
            />
          )}

          {/* Compact Telemetry Readout Footer */}
          <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-mono text-[10px] uppercase">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F2FE] animate-pulse" />
                <span className="font-bold text-os-text-secondary">
                  {isFlowActive ? 'Live Vector Telemetry Engaged' : 'Static Mode'}
                </span>
              </div>
              <span className="text-slate-700 hidden sm:inline">|</span>
              <span className="text-slate-500">
                {stats.riskEntitiesCount > 0 ? `${stats.riskEntitiesCount} Critical Paths Flagged` : 'Zero Disruption Cascades'}
              </span>
            </div>
            <div className="text-slate-500 flex items-center gap-3">
              {selectedEntity && (
                <button
                  onClick={() => handleSelectEntity(null)}
                  className="text-cyan-400 hover:underline font-bold"
                >
                  CLEAR SELECTION
                </button>
              )}
              <span>CLICK CLUSTER OR ENTITY TO FOCUS</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: INSPECTOR & COMPACT FIDELITY (Span 3 when open, hidden when collapsed) */}
        {isInspectorOpen && (
          <div className="lg:col-span-3 xl:col-span-3 space-y-4 animate-in fade-in duration-200">
            
            {/* 1. COMPACT DATA FIDELITY PANEL */}
            <div className="bg-slate-950 border border-slate-900 rounded-xl p-3.5 space-y-2.5 font-mono text-[10px]">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <div className="flex items-center gap-1.5">
                  <Database size={13} className="text-[#00F2FE]" />
                  <span className="font-bold uppercase text-os-text-primary">WORLD FIDELITY</span>
                </div>
                <span className="font-bold text-emerald-400 text-[9px]">
                  {dataMode === 'real' ? 'LIVE MIRROR' : 'LOCAL KERNEL'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <div className="p-2 bg-slate-900/40 border border-slate-900 rounded">
                  <span className="text-slate-500 uppercase block font-semibold">ENTITIES</span>
                  <span className="text-os-text-primary font-bold block">{entities.length} Nodes</span>
                </div>
                <div className="p-2 bg-slate-900/40 border border-slate-900 rounded">
                  <span className="text-slate-500 uppercase block font-semibold">FLOW PATHS</span>
                  <span className="text-os-text-primary font-bold block">{relationships.length} Vector Links</span>
                </div>
              </div>
            </div>

            {/* 2. RELATIONSHIP INSPECTOR */}
            <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <Globe size={14} className="text-[#00F2FE]" />
                  <h3 className="text-xs font-bold uppercase text-os-text-primary">INSPECTOR</h3>
                </div>
                <div className="flex items-center gap-1">
                  {selectedEntity && (
                    <span className={cn(
                      "px-1.5 py-0.2 text-[8px] font-mono font-bold uppercase rounded",
                      selectedEntity.risk === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      selectedEntity.risk === 'high' ? 'bg-red-500/10 text-red-400' :
                      selectedEntity.risk === 'warning' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-emerald-500/10 text-emerald-400'
                    )}>
                      {selectedEntity.risk}
                    </span>
                  )}
                  <button 
                    onClick={() => setIsInspectorOpen(false)}
                    className="text-slate-500 hover:text-os-text-secondary p-1 rounded hover:bg-slate-900"
                    title="Collapse Inspector"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {selectedEntity ? (
                <div className="space-y-3 font-mono text-[11px]">
                  
                  {/* Entity Card */}
                  <div className="p-2.5 bg-slate-900/50 border border-slate-850 rounded-lg space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate">
                        <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold block">
                          SELECTED ENTITY
                        </span>
                        <div className="text-os-text-primary font-bold text-xs uppercase mt-0.5 truncate">
                          {selectedEntity.name}
                        </div>
                        <div className="text-[9px] text-cyan-400 font-bold">
                          {selectedEntity.type} • {selectedEntity.code || selectedEntity.id}
                        </div>
                      </div>
                      {selectedEntity.moduleRoute && (
                        <button
                          onClick={() => navigate(selectedEntity.moduleRoute!)}
                          className="px-1.5 py-1 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 text-cyan-300 rounded text-[8px] font-bold flex items-center gap-1 transition-all shrink-0"
                          title="View module details"
                        >
                          <span>OPEN</span>
                          <ExternalLink size={9} />
                        </button>
                      )}
                    </div>

                    {selectedEntity.metricLabel && (
                      <div className="flex justify-between border-t border-slate-800/80 pt-1 text-[9px]">
                        <span className="text-os-text-muted">{selectedEntity.metricLabel}:</span>
                        <span className="text-os-text-primary font-bold">{selectedEntity.metricValue}</span>
                      </div>
                    )}
                  </div>

                  {/* Upstream Origins */}
                  <div className="p-2.5 bg-slate-900/30 border border-slate-900 rounded-lg space-y-1">
                    <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest block">
                      UPSTREAM DEPENDENCIES ({entityDependencies.upstream.length}):
                    </span>
                    {entityDependencies.upstream.length > 0 ? (
                      <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                        {entityDependencies.upstream.map((up, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => handleSelectEntity(up.entity)}
                            className="flex items-center justify-between text-[9px] p-1 bg-slate-950/60 hover:bg-slate-900 rounded cursor-pointer text-os-text-secondary transition-colors"
                          >
                            <span className="truncate max-w-[120px]">{up.entity.name}</span>
                            <span className="text-[7px] text-cyan-400 uppercase font-bold">{up.relName}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[9px] text-slate-600 italic">Origin tier / root node.</span>
                    )}
                  </div>

                  {/* Downstream Impact */}
                  <div className="p-2.5 bg-slate-900/30 border border-slate-900 rounded-lg space-y-1">
                    <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest block">
                      DOWNSTREAM IMPACT ({entityDependencies.downstream.length}):
                    </span>
                    {entityDependencies.downstream.length > 0 ? (
                      <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                        {entityDependencies.downstream.map((down, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => handleSelectEntity(down.entity)}
                            className="flex items-center justify-between text-[9px] p-1 bg-slate-950/60 hover:bg-slate-900 rounded cursor-pointer text-os-text-secondary transition-colors"
                          >
                            <span className="truncate max-w-[120px]">{down.entity.name}</span>
                            <span className="text-[7px] text-slate-500 uppercase font-bold">{down.relName}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[9px] text-slate-600 italic">End-consumer terminal.</span>
                    )}
                  </div>

                  {/* Reasoning Actions */}
                  <div className="space-y-1.5 pt-1">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={handleRunBlastRadius}
                        className={cn(
                          "p-1.5 rounded border font-bold text-[9px] uppercase flex items-center justify-center gap-1 transition-all",
                          activeAnalysisMode === 'BLAST_RADIUS'
                            ? "bg-red-950/70 border-red-500/50 text-red-300"
                            : "bg-slate-900 hover:bg-slate-850 border-slate-800 text-cyan-400"
                        )}
                      >
                        <Target size={11} />
                        <span>BLAST RADIUS</span>
                      </button>
                      <button
                        onClick={handleRunTracePath}
                        className={cn(
                          "p-1.5 rounded border font-bold text-[9px] uppercase flex items-center justify-center gap-1 transition-all",
                          activeAnalysisMode === 'PATH_TRACE'
                            ? "bg-purple-950/70 border-purple-500/50 text-purple-300"
                            : "bg-slate-900 hover:bg-slate-850 border-slate-800 text-purple-400"
                        )}
                      >
                        <RouteIcon size={11} />
                        <span>TRACE PATH</span>
                      </button>
                    </div>

                    <button 
                      onClick={() => setDrawerOpen(true)} 
                      className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 rounded border border-slate-800 text-cyan-400 text-[9px] font-bold uppercase tracking-wider transition-all"
                    >
                      OPEN NEURAL DIAGNOSTICS
                    </button>
                  </div>

                  {/* Blast Radius Results */}
                  {activeAnalysisMode === 'BLAST_RADIUS' && blastRadius && (
                    <div className="p-2.5 bg-red-950/30 border border-red-500/30 rounded-lg space-y-1.5 animate-in fade-in duration-200 text-[9px]">
                      <div className="flex items-center justify-between text-red-300 font-bold">
                        <span className="flex items-center gap-1">
                          <ShieldAlert size={11} />
                          BLAST CASCADE
                        </span>
                        <span>{blastRadius.totalImpactedCount} AFFECTED</span>
                      </div>
                      <div className="space-y-1">
                        {blastRadius.levels.map((lvl, lIdx) => (
                          <div key={lIdx} className="flex items-start gap-1">
                            <span className="text-red-400 font-bold shrink-0">HOP {lvl.hop}:</span>
                            <span className="text-os-text-secondary truncate">
                              {lvl.entities.map(e => e.name).slice(0, 2).join(', ')}
                              {lvl.entities.length > 2 && ` +${lvl.entities.length - 2}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trace Path Results */}
                  {activeAnalysisMode === 'PATH_TRACE' && pathTrace && (
                    <div className="p-2.5 bg-purple-950/30 border border-purple-500/30 rounded-lg space-y-1 animate-in fade-in duration-200 text-[9px]">
                      <div className="flex items-center justify-between text-purple-300 font-bold">
                        <span>TRACE: {pathTrace.hops} HOPS</span>
                        <span className="text-emerald-400">{pathTrace.found ? 'VERIFIED' : 'NO PATH'}</span>
                      </div>
                      <p className="text-os-text-secondary leading-tight font-sans text-[9px]">
                        {pathTrace.summary}
                      </p>
                    </div>
                  )}

                </div>
              ) : (
                <div className="py-12 text-center text-[9px] text-slate-600 uppercase font-bold tracking-widest space-y-2 font-mono">
                  <Compass size={24} className="mx-auto text-slate-800 stroke-[1.5]" />
                  <div>NO NODE SELECTED</div>
                  <div className="font-normal text-slate-700 font-sans text-[11px] max-w-xs mx-auto">
                    Select a Domain Cluster or entity to inspect its dependencies and supply chain blast radius.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Global Intelligence Diagnostics Drawer */}
      <OrionIntelligenceDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        contextEntity={selectedEntity ? { type: selectedEntity.type, id: selectedEntity.id, name: selectedEntity.name } : undefined}
      />
    </div>
  );
};
