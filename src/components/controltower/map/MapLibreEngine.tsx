/**
 * ORION-9 GLOBAL SUPPLY CHAIN OPERATIONS MAP — MAPLIBRE GL JS ENGINE
 * Geographic WebGL foundation supporting 2D Mercator & 3D Globe projections,
 * vector GeoJSON layer streaming, clustering, smooth navigation, and follow mode.
 */

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { setWorkerUrl, type Map as MapLibreMap, type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

// Register MapLibre GL v6+ Web Worker URL exactly once for modern bundlers (Vite)
try {
  if (typeof setWorkerUrl === 'function') {
    setWorkerUrl(maplibreWorkerUrl);
  }
} catch (_) {}

import { ORION_GRAPHITE_MAP_STYLE } from './cartographyStyle';
import { 
  MapProjectionMode, 
  SelectedMapEntity, 
  MapLayersState, 
  VesselEntity, 
  AircraftEntity, 
  TruckEntity, 
  PortFacility, 
  AirportFacility, 
  ShipmentRoute 
} from './types';
import { WORLD_LANDMASS_GEOJSON } from './worldBoundariesGeoJSON';

export interface MapEngineRef {
  zoomIn: () => void;
  zoomOut: () => void;
  resetNorth: () => void;
  fitOperations: () => void;
  flyToLocation: (lng: number, lat: number, zoom?: number) => void;
  setProjection: (mode: MapProjectionMode) => void;
  resize: () => void;
  isLoaded: () => boolean;
}

interface MapLibreEngineProps {
  projectionMode: MapProjectionMode;
  layersState: MapLayersState;
  vessels: VesselEntity[];
  aircraft: AircraftEntity[];
  trucks: TruckEntity[];
  ports: PortFacility[];
  airports: AirportFacility[];
  shipmentRoutes: ShipmentRoute[];
  vesselsGeoJSON: any;
  aircraftGeoJSON: any;
  trucksGeoJSON: any;
  portsGeoJSON: any;
  airportsGeoJSON: any;
  facilitiesGeoJSON: any;
  routesGeoJSON: any;
  exceptionsGeoJSON: any;
  selectedEntity: SelectedMapEntity | null;
  onSelectEntity: (entity: SelectedMapEntity | null) => void;
  isFollowing?: boolean;
}

export const MapLibreEngine = forwardRef<MapEngineRef, MapLibreEngineProps>(({
  projectionMode,
  layersState,
  vessels,
  aircraft,
  trucks,
  ports,
  airports,
  shipmentRoutes,
  vesselsGeoJSON,
  aircraftGeoJSON,
  trucksGeoJSON,
  portsGeoJSON,
  airportsGeoJSON,
  facilitiesGeoJSON,
  routesGeoJSON,
  exceptionsGeoJSON,
  selectedEntity,
  onSelectEntity,
  isFollowing,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);
  const isInitializingRef = useRef<boolean>(false);

  // Helper to safely populate GeoJSON sources on style load
  const syncAllSources = useCallback((mapInstance: MapLibreMap) => {
    try {
      if (!mapInstance || !mapInstance.isStyleLoaded()) return;

      const updateSrc = (id: string, data: any) => {
        const src = mapInstance.getSource(id) as GeoJSONSource | undefined;
        if (src && data) {
          src.setData(data);
        }
      };

      updateSrc('transport-vessels', vesselsGeoJSON);
      updateSrc('transport-aircraft', aircraftGeoJSON);
      updateSrc('transport-trucks', trucksGeoJSON);
      updateSrc('infrastructure-ports', portsGeoJSON);
      updateSrc('infrastructure-airports', airportsGeoJSON);
      updateSrc('infrastructure-facilities', facilitiesGeoJSON);
      updateSrc('transport-routes', routesGeoJSON);
      updateSrc('risk-exceptions', exceptionsGeoJSON);
    } catch (e) {
      // Ignore during unmount or rapid transitions
    }
  }, [
    vesselsGeoJSON,
    aircraftGeoJSON,
    trucksGeoJSON,
    portsGeoJSON,
    airportsGeoJSON,
    facilitiesGeoJSON,
    routesGeoJSON,
    exceptionsGeoJSON,
  ]);

  // Check WebGL / MapLibre environment support
  useEffect(() => {
    try {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        setIsSupported(false);
        return;
      }
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setIsSupported(false);
        setInitError('WebGL context is not supported in this browser environment.');
      }
    } catch (e) {
      setIsSupported(false);
      setInitError('WebGL initialization failed.');
    }
  }, []);

  // Expose imperative camera and lifecycle controls
  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      mapRef.current?.zoomIn({ duration: 300 });
    },
    zoomOut: () => {
      mapRef.current?.zoomOut({ duration: 300 });
    },
    resetNorth: () => {
      mapRef.current?.resetNorthPitch({ duration: 500 });
    },
    fitOperations: () => {
      mapRef.current?.flyTo({
        center: [60, 20],
        zoom: 1.8,
        pitch: 0,
        bearing: 0,
        duration: 800,
      });
    },
    flyToLocation: (lng: number, lat: number, zoom = 6) => {
      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom,
        duration: 900,
      });
    },
    setProjection: (mode: MapProjectionMode) => {
      try {
        (mapRef.current as any)?.setProjection({ type: mode });
      } catch (e) {
        // Fallback gracefully if not supported
      }
    },
    resize: () => {
      mapRef.current?.resize();
    },
    isLoaded: () => mapLoaded,
  }), [mapLoaded]);

  // Initialize MapLibre instance with container dimension measurement and resize observer
  useEffect(() => {
    if (!containerRef.current || !isSupported) return;

    let isCancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let rafResizeId: number | null = null;

    const cleanupMap = () => {
      if (rafResizeId !== null) {
        cancelAnimationFrame(rafResizeId);
        rafResizeId = null;
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (_) {}
        mapRef.current = null;
      }
      isInitializingRef.current = false;
      setMapLoaded(false);
    };

    const initializeMap = (containerEl: HTMLDivElement) => {
      if (isCancelled || mapRef.current || isInitializingRef.current) return;

      // Verification A.2: Ensure container has non-zero width and height before map initialization
      const width = containerEl.clientWidth;
      const height = containerEl.clientHeight;
      if (width <= 0 || height <= 0) {
        // Container is currently hidden, animating, or collapsed. Wait for ResizeObserver callback.
        return;
      }

      isInitializingRef.current = true;

      // Ensure container has no dangling canvas artifacts from previous unmount
      while (containerEl.firstChild) {
        containerEl.removeChild(containerEl.firstChild);
      }

      import('maplibre-gl').then((maplibre) => {
        if (isCancelled || !containerRef.current) {
          isInitializingRef.current = false;
          return;
        }

        try {
          const lib = maplibre as any;
          const MapConstructor = lib.Map || lib.default?.Map || lib.default;

          if (!MapConstructor || typeof MapConstructor !== 'function') {
            throw new Error('MapLibre GL Map constructor is not available');
          }

          const mapInstance: MapLibreMap = new MapConstructor({
            container: containerEl,
            style: ORION_GRAPHITE_MAP_STYLE,
            center: [60, 20],
            zoom: 1.8,
            attributionControl: false,
          });

          // Attempt to configure globe projection if requested
          if (projectionMode === 'globe') {
            try {
              (mapInstance as any).setProjection({ type: 'globe' });
            } catch (e) {
              // Fallback to mercator
            }
          }

          // Register error handler for load or runtime issues
          mapInstance.on('error', (e) => {
            const err = (e as any)?.error || e;
            if (process.env.NODE_ENV !== 'production' || (import.meta as any).env?.DEV) {
              console.warn('[MapLibreEngine] Map runtime notice:', err);
            }
            if (err?.message?.includes('Context Lost') || err?.message?.includes('WebGL')) {
              cleanupMap();
              setIsSupported(false);
              setInitError('WebGL rendering context was lost or unavailable.');
            }
          });

          // WebGL context lost recovery listener
          try {
            const canvasEl = mapInstance.getCanvas();
            if (canvasEl) {
              canvasEl.addEventListener('webglcontextlost', (ev) => {
                ev.preventDefault();
                cleanupMap();
                setIsSupported(false);
                setInitError('WebGL context lost.');
              });
            }
          } catch (_) {}

          // Style load event
          mapInstance.on('load', () => {
            if (isCancelled) return;
            setMapLoaded(true);
            syncAllSources(mapInstance);
            mapInstance.resize();
          });

          // Cluster click zoom behavior
          mapInstance.on('click', 'clusters-vessels', (e) => {
            const features = mapInstance.queryRenderedFeatures(e.point, { layers: ['clusters-vessels'] });
            const clusterId = features[0]?.properties?.cluster_id;
            const source = mapInstance.getSource('transport-vessels') as GeoJSONSource | undefined;
            if (source && clusterId !== undefined) {
              source.getClusterExpansionZoom(clusterId).then((zoom) => {
                const coords = (features[0].geometry as any).coordinates;
                mapInstance.easeTo({ center: coords, zoom });
              });
            }
          });

          // Entity selection on click
          mapInstance.on('click', (e) => {
            const interactiveLayers = [
              'unclustered-vessels-circle',
              'unclustered-aircraft-circle',
              'unclustered-trucks-circle',
              'unclustered-ports',
              'unclustered-airports',
              'layer-routes-line',
              'risk-exceptions-core',
            ];

            const features = mapInstance.queryRenderedFeatures(e.point, {
              layers: interactiveLayers.filter((l) => mapInstance.getLayer(l)),
            });

            if (features && features.length > 0) {
              const feat = features[0];
              const id = feat.properties?.id;

              if (feat.layer.id === 'unclustered-vessels-circle') {
                const v = vessels.find((item) => item.id === id);
                if (v) onSelectEntity({ type: 'vessel', entity: v });
              } else if (feat.layer.id === 'unclustered-aircraft-circle') {
                const a = aircraft.find((item) => item.id === id);
                if (a) onSelectEntity({ type: 'aircraft', entity: a });
              } else if (feat.layer.id === 'unclustered-trucks-circle') {
                const t = trucks.find((item) => item.id === id);
                if (t) onSelectEntity({ type: 'truck', entity: t });
              } else if (feat.layer.id === 'unclustered-ports') {
                const p = ports.find((item) => item.id === id);
                if (p) onSelectEntity({ type: 'port', entity: p });
              } else if (feat.layer.id === 'unclustered-airports') {
                const air = airports.find((item) => item.id === id);
                if (air) onSelectEntity({ type: 'airport', entity: air });
              } else if (feat.layer.id === 'layer-routes-line') {
                const r = shipmentRoutes.find((item) => item.shipmentId === id);
                if (r) onSelectEntity({ type: 'shipment', entity: r });
              }
            }
          });

          mapRef.current = mapInstance;
          isInitializingRef.current = false;
        } catch (err: any) {
          console.warn('[MapLibreEngine] WebGL initialization fallback:', err?.message || err);
          cleanupMap();
          setIsSupported(false);
          setInitError(err?.message || 'Failed to initialize WebGL map canvas.');
        }
      }).catch((err) => {
        console.warn('[MapLibreEngine] Failed to dynamically load maplibre-gl:', err);
        cleanupMap();
        setIsSupported(false);
        setInitError('Failed to load MapLibre GL module.');
      });
    };

    // Verification A.3: Set up ResizeObserver to handle dimension changes, window restorations, maximized transitions
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            if (!mapRef.current && !isInitializingRef.current) {
              initializeMap(containerRef.current!);
            } else if (mapRef.current) {
              if (rafResizeId !== null) cancelAnimationFrame(rafResizeId);
              rafResizeId = requestAnimationFrame(() => {
                mapRef.current?.resize();
              });
            }
          }
        }
      });
      resizeObserver.observe(containerRef.current);
    } else {
      // Fallback for environments without ResizeObserver
      initializeMap(containerRef.current);
    }

    return () => {
      isCancelled = true;
      cleanupMap();
    };
  }, [isSupported, projectionMode]);

  // Dynamic projection mode toggle
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    try {
      (mapRef.current as any).setProjection({ type: projectionMode });
    } catch (e) {
      // Ignore if projection type is unsupported by driver
    }
  }, [projectionMode, mapLoaded]);

  // Efficient GeoJSON source updates without recreation
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const updateSource = (sourceId: string, data: any) => {
      try {
        if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
        const src = mapRef.current.getSource(sourceId) as GeoJSONSource | undefined;
        if (src && data) {
          src.setData(data);
        }
      } catch (e) {
        // Ignore during unmount or rapid updates
      }
    };

    updateSource('transport-vessels', vesselsGeoJSON);
    updateSource('transport-aircraft', aircraftGeoJSON);
    updateSource('transport-trucks', trucksGeoJSON);
    updateSource('infrastructure-ports', portsGeoJSON);
    updateSource('infrastructure-airports', airportsGeoJSON);
    updateSource('infrastructure-facilities', facilitiesGeoJSON);
    updateSource('transport-routes', routesGeoJSON);
    updateSource('risk-exceptions', exceptionsGeoJSON);
  }, [
    mapLoaded,
    vesselsGeoJSON,
    aircraftGeoJSON,
    trucksGeoJSON,
    portsGeoJSON,
    airportsGeoJSON,
    facilitiesGeoJSON,
    routesGeoJSON,
    exceptionsGeoJSON,
  ]);

  // Layer visibility toggles
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const setVisibility = (layerId: string, visible: boolean) => {
      try {
        if (mapRef.current?.getLayer(layerId)) {
          mapRef.current.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
        }
      } catch (e) {}
    };

    setVisibility('clusters-vessels', layersState.oceanVessels);
    setVisibility('cluster-count-vessels', layersState.oceanVessels);
    setVisibility('unclustered-vessels-circle', layersState.oceanVessels);
    setVisibility('clusters-aircraft', layersState.aircraft);
    setVisibility('cluster-count-aircraft', layersState.aircraft);
    setVisibility('unclustered-aircraft-circle', layersState.aircraft);
    setVisibility('unclustered-trucks-circle', layersState.trucks);
    setVisibility('unclustered-rail-circle', layersState.rail);
    setVisibility('unclustered-ports', layersState.ports);
    setVisibility('unclustered-airports', layersState.airports);
    setVisibility('infrastructure-facilities-circle', layersState.warehouses || layersState.suppliers);
    setVisibility('layer-routes-line', layersState.shipmentRoutes);
    setVisibility('layer-routes-line-glow', layersState.shipmentRoutes);
    setVisibility('risk-exceptions-core', layersState.exceptions);
    setVisibility('risk-exceptions-glow', layersState.exceptions);
  }, [layersState, mapLoaded]);

  // Follow Mode Camera Tracking
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !isFollowing || !selectedEntity) return;

    let coords: [number, number] | null = null;
    if (selectedEntity.type === 'vessel') {
      coords = [selectedEntity.entity.longitude, selectedEntity.entity.latitude];
    } else if (selectedEntity.type === 'aircraft') {
      coords = [selectedEntity.entity.longitude, selectedEntity.entity.latitude];
    } else if (selectedEntity.type === 'truck') {
      coords = [selectedEntity.entity.longitude, selectedEntity.entity.latitude];
    } else if (selectedEntity.type === 'shipment') {
      coords = selectedEntity.entity.currentPosition;
    }

    if (coords) {
      mapRef.current.easeTo({
        center: coords,
        duration: 400,
      });
    }
  }, [isFollowing, selectedEntity, mapLoaded]);

  // Graceful Fallback if WebGL is unavailable or fails (Headless / SSR / Test runner / Driver error)
  if (!isSupported) {
    return (
      <div 
        data-testid="maplibre-fallback-canvas"
        className="relative w-full h-full min-h-[460px] bg-[#080A0D] flex flex-col items-center justify-center p-6 border border-os-border/50 rounded-xl overflow-hidden"
      >
        <svg viewBox="-180 -90 360 180" className="w-full h-full max-h-[500px] text-os-border/30 opacity-70">
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>
          </defs>
          {/* Base world silhouette */}
          {WORLD_LANDMASS_GEOJSON.features.map((f, i) => (
            <polygon
              key={i}
              points={(f.geometry.coordinates[0] as [number, number][]).map(([x, y]) => `${x},${-y}`).join(' ')}
              fill="#13161C"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="0.5"
            />
          ))}
          {/* Ports & Nodes */}
          {ports.map((p) => (
            <circle
              key={p.id}
              cx={p.longitude}
              cy={-p.latitude}
              r="2.5"
              fill="#0284C7"
              stroke="#FFFFFF"
              strokeWidth="0.5"
              className="cursor-pointer hover:r-4 transition-all"
              onClick={() => onSelectEntity({ type: 'port', entity: p })}
            />
          ))}
          {/* Active Vessels */}
          {vessels.slice(0, 15).map((v) => (
            <circle
              key={v.id}
              cx={v.longitude}
              cy={-v.latitude}
              r="2"
              fill={v.status === 'DELAYED' ? '#EF4444' : '#38BDF8'}
              className="cursor-pointer"
              onClick={() => onSelectEntity({ type: 'vessel', entity: v })}
            />
          ))}
        </svg>

        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-os-text-muted bg-os-surface/80 p-2.5 rounded-lg border border-os-border">
          <div className="flex items-center gap-2">
            <span>ORION GEOGRAPHIC VECTOR CANVAS ACTIVE</span>
            {initError && (
              <span className="text-amber-400/80 text-[10px]">({initError})</span>
            )}
          </div>
          <span className="text-cyan-400">PORTS: {ports.length} | VESSELS: {vessels.length} | ROUTES: {shipmentRoutes.length}</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      data-testid="maplibre-engine-container"
      className="relative w-full h-full min-h-[460px] bg-[#080A0D] rounded-xl overflow-hidden [&_.maplibregl-canvas]:!absolute [&_.maplibregl-canvas]:!inset-0 [&_.maplibregl-map]:!w-full [&_.maplibregl-map]:!h-full" 
    />
  );
});

MapLibreEngine.displayName = 'MapLibreEngine';
