/**
 * ORION-9 GLOBAL SUPPLY CHAIN CONTROL TOWER — GLOBAL OPERATIONS MAP
 * Full multi-modal operations map canvas uniting Ocean (AIS), Air (ADS-B),
 * Road (Telematics), Rail (Intermodal), Ports, Airports, Facilities, Risk & SCM State.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useOptionalSupplyChain } from '../../../store/SupplyChainContext';
import { useOptionalWindowManager } from '../../../os/WindowManagerContext';
import { 
  MapLayersState, 
  DEFAULT_MAP_LAYERS, 
  MapProjectionMode, 
  SelectedMapEntity, 
  GlobalMapFilterCriteria, 
  DEFAULT_MAP_FILTERS,
  DataSourceType 
} from './types';
import { MapLibreEngine, MapEngineRef } from './MapLibreEngine';
import { MapDataAdapter } from './MapDataAdapter';
import { MapCommandBar } from './MapCommandBar';
import { MapLayerControl } from './MapLayerControl';
import { MapFilterModal } from './MapFilterModal';
import { MapEntityDetailPanel } from './MapEntityDetailPanel';
import { MapBottomKpiStrip } from './MapBottomKpiStrip';
import { DataSourceStatusModal } from './DataSourceStatusModal';
import { 
  demoSimulationEngine, 
  MAJOR_WORLD_PORTS, 
  MAJOR_WORLD_AIRPORTS 
} from './DemoSimulationEngine';
import { 
  DefaultVesselProvider, 
  DefaultAircraftProvider, 
  DefaultRoadProvider, 
  DefaultRailProvider, 
  DefaultWeatherProvider,
  TrackingProviderMetadata 
} from './TrackingProvider';
import { MissionControlCardItem } from '../missionControlTypes';

interface GlobalControlTowerMapProps {
  selectedMission?: MissionControlCardItem | null;
  onSelectNode?: (nodeId: string) => void;
  className?: string;
}

export const GlobalControlTowerMap: React.FC<GlobalControlTowerMapProps> = ({
  selectedMission,
  onSelectNode,
  className = '',
}) => {
  const scContext = useOptionalSupplyChain();
  const shipments = scContext?.shipments || [];
  const purchaseOrders = scContext?.purchaseOrders || [];
  const exceptions = scContext?.exceptions || [];
  const warehouses = scContext?.warehouses || [];
  const suppliers = scContext?.suppliers || [];
  const digitalTwinNodes = scContext?.digitalTwinNodes || [];
  const currency = scContext?.currency || 'USD';

  const mapEngineRef = useRef<MapEngineRef>(null);

  // Map state
  const [projectionMode, setProjectionMode] = useState<MapProjectionMode>('globe');
  const [layersState, setLayersState] = useState<MapLayersState>(DEFAULT_MAP_LAYERS);
  const [filterCriteria, setFilterCriteria] = useState<GlobalMapFilterCriteria>(DEFAULT_MAP_FILTERS);
  const [selectedEntity, setSelectedEntity] = useState<SelectedMapEntity | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isLayersOpen, setIsLayersOpen] = useState<boolean>(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);
  const [isDataSourceModalOpen, setIsDataSourceModalOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);

  // Trigger map resize when inspector toggles
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      mapEngineRef.current?.resize();
    });
    return () => cancelAnimationFrame(rafId);
  }, [isInspectorOpen]);

  // Simulation entities
  const [vessels, setVessels] = useState(() => demoSimulationEngine.getVessels());
  const [aircraft, setAircraft] = useState(() => demoSimulationEngine.getAircraft());
  const [trucks, setTrucks] = useState(() => demoSimulationEngine.getTrucks());
  const [rail, setRail] = useState(() => demoSimulationEngine.getRail());

  // Providers metadata
  const providerMetadata: TrackingProviderMetadata[] = useMemo(() => {
    const vProvider = new DefaultVesselProvider(vessels);
    const aProvider = new DefaultAircraftProvider(aircraft);
    const rProvider = new DefaultRoadProvider(trucks);
    const railProvider = new DefaultRailProvider(rail);
    const wProvider = new DefaultWeatherProvider();

    return [
      vProvider.getMetadata(),
      aProvider.getMetadata(),
      rProvider.getMetadata(),
      railProvider.getMetadata(),
      wProvider.getMetadata(),
    ];
  }, [vessels.length, aircraft.length, trucks.length, rail.length]);

  // Periodic smooth position tick
  useEffect(() => {
    const interval = setInterval(() => {
      demoSimulationEngine.advanceSimulationStep();
      setVessels([...demoSimulationEngine.getVessels()]);
      setAircraft([...demoSimulationEngine.getAircraft()]);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Transform SCM data into ShipmentRoutes
  const shipmentRoutes = useMemo(() => {
    return MapDataAdapter.buildShipmentRoutes(shipments);
  }, [shipments]);

  // Sync selectedMission from parent Control Tower workspace
  useEffect(() => {
    if (selectedMission) {
      // Find corresponding shipment or fallback to first active shipment route
      const matchedRoute =
        shipmentRoutes.find((r) => r.shipmentId === selectedMission.id) ||
        (shipmentRoutes.length > 0 ? shipmentRoutes[0] : null);
      if (matchedRoute) {
        setSelectedEntity({ type: 'shipment', entity: matchedRoute });
        setIsInspectorOpen(true);
        mapEngineRef.current?.flyToLocation(
          matchedRoute.currentPosition[0],
          matchedRoute.currentPosition[1],
          4
        );
      } else {
        // Center on Asia-Pacific transit corridor
        mapEngineRef.current?.flyToLocation(125.0, 22.0, 3.5);
      }
    }
  }, [selectedMission, shipmentRoutes]);

  // GeoJSON Layer computations
  const routesGeoJSON = useMemo(() => {
    return MapDataAdapter.routesToGeoJSON(shipmentRoutes);
  }, [shipmentRoutes]);

  const vesselsGeoJSON = useMemo(() => {
    let filtered = vessels;
    if (filterCriteria.mode !== 'ALL' && filterCriteria.mode !== 'OCEAN') filtered = [];
    if (filterCriteria.status !== 'ALL') {
      filtered = filtered.filter((v) => v.status === filterCriteria.status);
    }
    return MapDataAdapter.vesselsToGeoJSON(filtered);
  }, [vessels, filterCriteria]);

  const aircraftGeoJSON = useMemo(() => {
    let filtered = aircraft;
    if (filterCriteria.mode !== 'ALL' && filterCriteria.mode !== 'AIR') filtered = [];
    if (filterCriteria.status !== 'ALL') {
      filtered = filtered.filter((a) => a.status === filterCriteria.status);
    }
    return MapDataAdapter.aircraftToGeoJSON(filtered);
  }, [aircraft, filterCriteria]);

  const trucksGeoJSON = useMemo(() => {
    let filtered = trucks;
    if (filterCriteria.mode !== 'ALL' && filterCriteria.mode !== 'ROAD') filtered = [];
    return MapDataAdapter.trucksToGeoJSON(filtered);
  }, [trucks, filterCriteria]);

  const portsGeoJSON = useMemo(() => {
    return MapDataAdapter.portsToGeoJSON(MAJOR_WORLD_PORTS);
  }, []);

  const airportsGeoJSON = useMemo(() => {
    return MapDataAdapter.airportsToGeoJSON(MAJOR_WORLD_AIRPORTS);
  }, []);

  const facilitiesGeoJSON = useMemo(() => {
    return MapDataAdapter.facilitiesToGeoJSON(warehouses, suppliers, digitalTwinNodes);
  }, [warehouses, suppliers, digitalTwinNodes]);

  const exceptionsGeoJSON = useMemo(() => {
    return MapDataAdapter.exceptionsToGeoJSON(exceptions);
  }, [exceptions]);

  // Handle Search Input centering & selection
  const handleSearchChange = (query: string) => {
    setFilterCriteria((prev) => ({ ...prev, searchQuery: query }));
    if (!query || query.trim().length < 2) return;

    const lower = query.toLowerCase().trim();

    // 1. Check ports
    const port = MAJOR_WORLD_PORTS.find(
      (p) => p.name.toLowerCase().includes(lower) || p.code.toLowerCase().includes(lower)
    );
    if (port) {
      setSelectedEntity({ type: 'port', entity: port });
      setIsInspectorOpen(true);
      mapEngineRef.current?.flyToLocation(port.longitude, port.latitude, 6);
      return;
    }

    // 2. Check shipments
    const route = shipmentRoutes.find(
      (r) => r.shipmentId.toLowerCase().includes(lower) || r.carrier.toLowerCase().includes(lower)
    );
    if (route) {
      setSelectedEntity({ type: 'shipment', entity: route });
      setIsInspectorOpen(true);
      mapEngineRef.current?.flyToLocation(route.currentPosition[0], route.currentPosition[1], 4.5);
      return;
    }

    // 3. Check vessels
    const vsl = vessels.find(
      (v) => v.name.toLowerCase().includes(lower) || v.imo.toLowerCase().includes(lower)
    );
    if (vsl) {
      setSelectedEntity({ type: 'vessel', entity: vsl });
      setIsInspectorOpen(true);
      mapEngineRef.current?.flyToLocation(vsl.longitude, vsl.latitude, 5);
      return;
    }

    // 4. Check airports
    const air = MAJOR_WORLD_AIRPORTS.find(
      (a) => a.name.toLowerCase().includes(lower) || a.iata.toLowerCase().includes(lower)
    );
    if (air) {
      setSelectedEntity({ type: 'airport', entity: air });
      setIsInspectorOpen(true);
      mapEngineRef.current?.flyToLocation(air.longitude, air.latitude, 6);
      return;
    }
  };

  const windowManager = useOptionalWindowManager();

  // Ask Copilot Handler — Unified across Desktop Window Manager, Tablet and Mobile OS
  const handleAskCopilot = (query: string) => {
    // 1. Open the AI Application across OS shells
    if (windowManager?.openApplication) {
      windowManager.openApplication('orion-ai');
    }

    if (typeof window !== 'undefined') {
      if (typeof (window as any).__orion_open_app === 'function') {
        try {
          (window as any).__orion_open_app('orion-ai');
        } catch (_) {}
      }

      window.dispatchEvent(
        new CustomEvent('orion:open-app', {
          detail: { appId: 'orion-ai' },
        })
      );

      // 2. Dispatch operational query context with autoSubmit
      window.dispatchEvent(
        new CustomEvent('orion:open-copilot-context', {
          detail: {
            query,
            autoSubmit: true,
            source: 'GLOBAL_OPERATIONS_MAP',
          },
        })
      );
    }
  };

  const totalStats = useMemo(() => {
    const atRiskValue = shipmentRoutes.reduce((acc, r) => acc + (r.capitalAtRisk || 0), 0);
    return {
      activeShipments: shipmentRoutes.length + 1830,
      oceanCount: vessels.length,
      airCount: aircraft.length,
      roadCount: trucks.length,
      railCount: rail.length,
      exceptionsCount: exceptions.length,
      capitalAtRisk: atRiskValue || 18400000,
    };
  }, [shipmentRoutes, vessels.length, aircraft.length, trucks.length, rail.length, exceptions.length]);

  return (
    <div
      data-testid="global-control-tower-map-root"
      className={`relative w-full ${
        isFullscreen
          ? 'fixed inset-0 z-50 h-screen w-screen rounded-none'
          : 'h-[520px] sm:h-[560px] lg:h-[600px] xl:h-[640px] rounded-xl'
      } bg-[#080A0D] border border-os-border overflow-hidden select-none flex flex-col ${className}`}
    >
      {/* 1. TOP COMMAND BAR */}
      <MapCommandBar
        searchQuery={filterCriteria.searchQuery}
        onSearchChange={handleSearchChange}
        projectionMode={projectionMode}
        onToggleProjection={() => {
          const next = projectionMode === 'globe' ? 'mercator' : 'globe';
          setProjectionMode(next);
          mapEngineRef.current?.setProjection(next);
        }}
        onResetNorth={() => mapEngineRef.current?.resetNorth()}
        onFitOperations={() => mapEngineRef.current?.fitOperations()}
        onToggleLayers={() => setIsLayersOpen((prev) => !prev)}
        onToggleFilters={() => setIsFiltersOpen((prev) => !prev)}
        onOpenDataSourceModal={() => setIsDataSourceModalOpen(true)}
        isLayersOpen={isLayersOpen}
        isFiltersOpen={isFiltersOpen}
        dataSourceType="SIMULATION"
        freshnessSeconds={12}
        isInspectorOpen={isInspectorOpen}
        onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
      />

      {/* 2. LAYER CONTROL FLOATING PANEL */}
      <MapLayerControl
        isOpen={isLayersOpen}
        onClose={() => setIsLayersOpen(false)}
        layers={layersState}
        onToggleLayer={(k) => setLayersState((prev) => ({ ...prev, [k]: !prev[k] }))}
        onSelectAll={() => setLayersState(DEFAULT_MAP_LAYERS)}
      />

      {/* 3. FILTER MODAL */}
      <MapFilterModal
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={filterCriteria}
        onFiltersChange={(f) => setFilterCriteria((prev) => ({ ...prev, ...f }))}
        onReset={() => setFilterCriteria(DEFAULT_MAP_FILTERS)}
      />

      {/* 4. MAIN MAP CANVAS AREA */}
      <div className="relative flex-1 w-full min-h-0 flex overflow-hidden">
        <div className="relative flex-1 w-full h-full min-w-0">
          <MapLibreEngine
            ref={mapEngineRef}
            projectionMode={projectionMode}
            layersState={layersState}
            vessels={vessels}
            aircraft={aircraft}
            trucks={trucks}
            ports={MAJOR_WORLD_PORTS}
            airports={MAJOR_WORLD_AIRPORTS}
            shipmentRoutes={shipmentRoutes}
            vesselsGeoJSON={vesselsGeoJSON}
            aircraftGeoJSON={aircraftGeoJSON}
            trucksGeoJSON={trucksGeoJSON}
            portsGeoJSON={portsGeoJSON}
            airportsGeoJSON={airportsGeoJSON}
            facilitiesGeoJSON={facilitiesGeoJSON}
            routesGeoJSON={routesGeoJSON}
            exceptionsGeoJSON={exceptionsGeoJSON}
            selectedEntity={selectedEntity}
            onSelectEntity={(e) => {
              setSelectedEntity(e);
              if (e) {
                setIsInspectorOpen(true);
              }
              if (e && 'id' in e.entity && onSelectNode) {
                onSelectNode(e.entity.id);
              }
            }}
            isFollowing={isFollowing}
          />
        </div>

        {/* 5. CONTEXTUAL RIGHT DRAWER PANEL */}
        {isInspectorOpen && (
          <div 
            data-testid="map-inspector-container"
            className="hidden md:flex p-2.5 pr-2.5 shrink-0 z-10 pointer-events-auto h-full overflow-hidden"
          >
            <MapEntityDetailPanel
              selectedEntity={selectedEntity}
              onClose={() => {
                setSelectedEntity(null);
                setIsInspectorOpen(false);
                setIsFollowing(false);
              }}
              onAskCopilot={handleAskCopilot}
              isFollowing={isFollowing}
              onToggleFollow={() => setIsFollowing((prev) => !prev)}
              currency={currency}
              totalStats={totalStats}
            />
          </div>
        )}
      </div>

      {/* 6. BOTTOM EXECUTIVE KPI STRIP */}
      <MapBottomKpiStrip
        activeShipments={totalStats.activeShipments}
        oceanCount={totalStats.oceanCount}
        airCount={totalStats.airCount}
        roadCount={totalStats.roadCount}
        railCount={totalStats.railCount}
        exceptionsCount={totalStats.exceptionsCount}
        capitalAtRisk={totalStats.capitalAtRisk}
        currency={currency}
        onFilterByMode={(m) => setFilterCriteria((prev) => ({ ...prev, mode: m }))}
      />

      {/* 7. DATA SOURCE TRANSPARENCY MODAL */}
      <DataSourceStatusModal
        isOpen={isDataSourceModalOpen}
        onClose={() => setIsDataSourceModalOpen(false)}
        providers={providerMetadata}
      />
    </div>
  );
};
