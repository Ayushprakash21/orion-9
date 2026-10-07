/**
 * ORION-9 GLOBAL CARTOGRAPHY — ORION GRAPHITE DARK STYLE SPECIFICATION
 * Bloomberg Terminal + Palantir-style executive operations map.
 * Near-black ocean, dark graphite land, restrained boundaries, enterprise typography.
 */

import type { StyleSpecification } from 'maplibre-gl';
import { WORLD_LANDMASS_GEOJSON } from './worldBoundariesGeoJSON';

export const ORION_GRAPHITE_MAP_STYLE: StyleSpecification = {
  version: 8,
  name: 'Orion Graphite Cartography',
  sources: {
    // High-resolution offline vector polygon source for landmasses
    'world-landmass': {
      type: 'geojson',
      data: WORLD_LANDMASS_GEOJSON,
    },
    // Optional raster basemap for enhanced zoom detail (CARTO dark matter)
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
      maxzoom: 19,
    },
    // Dynamic GeoJSON sources populated by MapDataAdapter
    'transport-vessels': {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterMaxZoom: 7,
      clusterRadius: 50,
    },
    'transport-aircraft': {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterMaxZoom: 7,
      clusterRadius: 50,
    },
    'transport-trucks': {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterMaxZoom: 8,
      clusterRadius: 40,
    },
    'transport-rail': {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    },
    'transport-routes': {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    },
    'infrastructure-ports': {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterMaxZoom: 5,
      clusterRadius: 40,
    },
    'infrastructure-airports': {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterMaxZoom: 5,
      clusterRadius: 40,
    },
    'infrastructure-facilities': {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterMaxZoom: 6,
      clusterRadius: 45,
    },
    'risk-exceptions': {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    },
    'risk-heat-points': {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    },
  },
  layers: [
    // 1. Ocean base background
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#080A0D',
      },
    },
    // 2. Base Landmass Polygons (Guaranteed offline rendering)
    {
      id: 'world-land-fill',
      type: 'fill',
      source: 'world-landmass',
      paint: {
        'fill-color': '#13161C',
        'fill-opacity': 0.95,
      },
    },
    {
      id: 'world-land-outline',
      type: 'line',
      source: 'world-landmass',
      paint: {
        'line-color': 'rgba(255, 255, 255, 0.08)',
        'line-width': 1.0,
      },
    },
    // 3. Tile layer overlay (subtle raster detail when online)
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
      paint: {
        'raster-opacity': 0.45,
        'raster-fade-duration': 300,
      },
      minzoom: 1,
    },
    // 4. Shipment Routes (Great circle / corridors)
    {
      id: 'layer-routes-line-glow',
      type: 'line',
      source: 'transport-routes',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': [
          'match',
          ['get', 'status'],
          'DELAYED', '#E05252',
          'AT_RISK', '#D49339',
          '#4A80A6'
        ],
        'line-width': 3,
        'line-opacity': 0.25,
      },
    },
    {
      id: 'layer-routes-line',
      type: 'line',
      source: 'transport-routes',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': [
          'match',
          ['get', 'status'],
          'DELAYED', '#EF4444',
          'AT_RISK', '#EAB308',
          '#60A5FA'
        ],
        'line-width': 1.8,
        'line-dasharray': [
          'case',
          ['==', ['get', 'status'], 'DELAYED'],
          ['literal', [2, 1.5]],
          ['literal', [1, 0]]
        ],
      },
    },
    // 5. Clusters for Vessels
    {
      id: 'clusters-vessels',
      type: 'circle',
      source: 'transport-vessels',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#1E293B',
        'circle-stroke-color': '#38BDF8',
        'circle-stroke-width': 1.5,
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          14,
          50, 18,
          200, 24
        ],
      },
    },
    {
      id: 'cluster-count-vessels',
      type: 'symbol',
      source: 'transport-vessels',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-size': 10,
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
      },
      paint: {
        'text-color': '#E2E8F0',
      },
    },
    // 6. Individual Vessels
    {
      id: 'unclustered-vessels-circle',
      type: 'circle',
      source: 'transport-vessels',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'match',
          ['get', 'status'],
          'DELAYED', '#EF4444',
          'AT_RISK', '#EAB308',
          '#38BDF8'
        ],
        'circle-radius': 4.5,
        'circle-stroke-width': 1.2,
        'circle-stroke-color': '#0F172A',
      },
    },
    // 7. Aircraft Clusters & Points
    {
      id: 'clusters-aircraft',
      type: 'circle',
      source: 'transport-aircraft',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#1E1B4B',
        'circle-stroke-color': '#A855F7',
        'circle-stroke-width': 1.5,
        'circle-radius': 15,
      },
    },
    {
      id: 'cluster-count-aircraft',
      type: 'symbol',
      source: 'transport-aircraft',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-size': 10,
      },
      paint: {
        'text-color': '#E2E8F0',
      },
    },
    {
      id: 'unclustered-aircraft-circle',
      type: 'circle',
      source: 'transport-aircraft',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'match',
          ['get', 'status'],
          'DELAYED', '#EF4444',
          'AT_RISK', '#EAB308',
          '#A855F7'
        ],
        'circle-radius': 4,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#0F172A',
      },
    },
    // 8. Trucks & Rail
    {
      id: 'unclustered-trucks-circle',
      type: 'circle',
      source: 'transport-trucks',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#10B981',
        'circle-radius': 3.5,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#064E3B',
      },
    },
    {
      id: 'unclustered-rail-circle',
      type: 'circle',
      source: 'transport-rail',
      paint: {
        'circle-color': '#F59E0B',
        'circle-radius': 3.5,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#78350F',
      },
    },
    // 9. Infrastructure Ports & Airports
    {
      id: 'unclustered-ports',
      type: 'circle',
      source: 'infrastructure-ports',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#0284C7',
        'circle-radius': 5,
        'circle-stroke-color': '#F8FAFC',
        'circle-stroke-width': 1.5,
      },
    },
    {
      id: 'unclustered-airports',
      type: 'circle',
      source: 'infrastructure-airports',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#9333EA',
        'circle-radius': 4.5,
        'circle-stroke-color': '#F8FAFC',
        'circle-stroke-width': 1.5,
      },
    },
    // 10. Warehouses, Suppliers, Customers
    {
      id: 'infrastructure-facilities-circle',
      type: 'circle',
      source: 'infrastructure-facilities',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'match',
          ['get', 'facilityType'],
          'warehouse', '#065F46',
          'supplier', '#B45309',
          'customer', '#1E40AF',
          '#475569'
        ],
        'circle-radius': 4,
        'circle-stroke-width': 1.2,
        'circle-stroke-color': '#CBD5E1',
      },
    },
    // 11. Exception Geo-Markers (Pulsing semantic badges)
    {
      id: 'risk-exceptions-glow',
      type: 'circle',
      source: 'risk-exceptions',
      paint: {
        'circle-color': '#EF4444',
        'circle-radius': 9,
        'circle-opacity': 0.25,
      },
    },
    {
      id: 'risk-exceptions-core',
      type: 'circle',
      source: 'risk-exceptions',
      paint: {
        'circle-color': '#EF4444',
        'circle-radius': 4,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#FFFFFF',
      },
    },
  ],
};
