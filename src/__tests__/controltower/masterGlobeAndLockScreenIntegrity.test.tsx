/**
 * ORION-9 MASTER COMMAND CENTER GLOBE & LOCK SCREEN INTEGRITY SUITE
 * Validates:
 * 1. 3D Globe Projection, MapLibre Engine, Cartography Styles, Graticules & Antimeridian Routes
 * 2. Strict Coordinate Validation & Data Source Truthfulness (SIMULATION vs LIVE)
 * 3. Lock Screen Lifecycle, Widgets (Clock, Weather, Calendar, Notifications), Privacy Mode & User Isolation
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { 
  ORION_GRAPHITE_MAP_STYLE 
} from '../../components/controltower/map/cartographyStyle';
import { 
  WORLD_LANDMASS_GEOJSON,
  WORLD_GRATICULES_GEOJSON 
} from '../../components/controltower/map/worldBoundariesGeoJSON';
import { 
  MapDataAdapter, 
  calculateGreatCircleRoute 
} from '../../components/controltower/map/MapDataAdapter';
import { 
  demoSimulationEngine 
} from '../../components/controltower/map/DemoSimulationEngine';
import {
  DefaultVesselProvider,
  DefaultAircraftProvider,
  DefaultRoadProvider,
  DefaultRailProvider,
  DefaultWeatherProvider,
} from '../../components/controltower/map/TrackingProvider';
import {
  loadLockScreenPreferences,
  saveLockScreenPreferences,
  DEFAULT_LOCK_PREFERENCES,
  getLockScreenStorageKey,
  LockScreenPreferences
} from '../../os/components/OrionLockScreen';
import { userService } from '../../services/userService';

// Ensure localStorage is available in node runner
if (typeof globalThis.localStorage === 'undefined') {
  let store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    get length() {
      return Object.keys(store).length;
    },
  };
}

describe('Command Center 3D Globe & Map Engine Integrity', () => {
  it('GLOBE-001: cartography style defines precision graticules and dark matter raster source', () => {
    expect(ORION_GRAPHITE_MAP_STYLE.sources['world-landmass']).toBeDefined();
    expect(ORION_GRAPHITE_MAP_STYLE.sources['world-graticules']).toBeDefined();
    expect(ORION_GRAPHITE_MAP_STYLE.sources['carto-dark']).toBeDefined();

    const cartoSource = ORION_GRAPHITE_MAP_STYLE.sources['carto-dark'] as any;
    expect(cartoSource.type).toBe('raster');
    expect(cartoSource.tiles.length).toBeGreaterThan(0);
    expect(cartoSource.tiles[0]).toContain('basemaps.cartocdn.com');

    // Layers check
    const layerIds = ORION_GRAPHITE_MAP_STYLE.layers.map(l => l.id);
    expect(layerIds).toContain('background');
    expect(layerIds).toContain('world-land-fill');
    expect(layerIds).toContain('world-graticules-lines');
    expect(layerIds).toContain('world-equator-line');
    expect(layerIds).toContain('carto-dark-layer');
  });

  it('GLOBE-002: cartography style defines atmospheric sky specification', () => {
    const sky = (ORION_GRAPHITE_MAP_STYLE as any).sky;
    expect(sky).toBeDefined();
    expect(sky['sky-color']).toBeDefined();
    expect(sky['horizon-color']).toBeDefined();
  });

  it('GLOBE-003: world landmass geojson contains all major continents and islands', () => {
    const features = WORLD_LANDMASS_GEOJSON.features;
    expect(features.length).toBeGreaterThanOrEqual(10);
    const names = features.map(f => f.properties?.name);
    expect(names).toContain('North America');
    expect(names).toContain('South America');
    expect(names).toContain('Europe');
    expect(names).toContain('Africa');
    expect(names).toContain('Asia');
    expect(names).toContain('Australia');
    expect(names).toContain('Antarctica');
    expect(names).toContain('Greenland');
    expect(names).toContain('Japan');
  });

  it('GLOBE-004: world graticules geojson provides equator and meridian reference lines', () => {
    const features = WORLD_GRATICULES_GEOJSON.features;
    expect(features.length).toBeGreaterThanOrEqual(5);
    const types = features.map(f => f.properties?.type);
    expect(types).toContain('equator');
    expect(types).toContain('tropic');
    expect(types).toContain('meridian');
  });

  it('GLOBE-005: calculateGreatCircleRoute computes shortest angular path across antimeridian', () => {
    // Route from Tokyo (139.7) to Los Angeles (-118.2) across Pacific
    const tokyo: [number, number] = [139.7, 35.6];
    const lax: [number, number] = [-118.2, 34.0];
    const points = calculateGreatCircleRoute(tokyo, lax, 16);
    expect(points.length).toBe(17);

    // Initial point
    expect(points[0][0]).toBeCloseTo(139.7, 1);
    // Final point
    expect(points[16][0]).toBeCloseTo(-118.2, 1);

    // Verify all points are valid WGS84 coordinates
    points.forEach(pt => {
      expect(MapDataAdapter.isValidCoordinate(pt[0], pt[1])).toBe(true);
    });
  });

  it('GLOBE-006: routesToGeoJSON splits antimeridian crossing routes into MultiLineString', () => {
    const mockCrossRoute = {
      shipmentId: 'SHP-PACIFIC',
      title: 'Trans-Pacific Express',
      mode: 'OCEAN' as const,
      origin: { code: 'PVG', name: 'Shanghai', coordinates: [121.5, 31.2] as [number, number] },
      destination: { code: 'LAX', name: 'Los Angeles', coordinates: [-118.2, 33.7] as [number, number] },
      currentPosition: [180.0, 42.0] as [number, number],
      coordinates: [
        [160.0, 38.0],
        [175.0, 41.0],
        [-175.0, 41.0], // Crossing line from East to West hemisphere
        [-150.0, 38.0],
      ] as [number, number][],
      status: 'ON_TIME' as const,
      progressPercent: 50,
      carrier: 'Pacific Orient Express',
      capitalAtRisk: 50000,
      delayDays: 0,
      eta: '2026-09-01',
      poId: 'PO-99',
      dataSource: 'ORION_REALTIME' as const,
    };

    const geojson = MapDataAdapter.routesToGeoJSON([mockCrossRoute]);
    expect(geojson.features.length).toBe(1);
    const feat = geojson.features[0];
    expect(feat.geometry.type).toBe('MultiLineString');
    const multiCoords = feat.geometry.coordinates as [number, number][][];
    expect(multiCoords.length).toBe(2);
    expect(multiCoords[0].length).toBe(2);
    expect(multiCoords[1].length).toBe(2);
  });

  it('GLOBE-007: coordinate validation rejects NaN, infinite, and out-of-range coordinates', () => {
    expect(MapDataAdapter.isValidCoordinate(0, 0)).toBe(true);
    expect(MapDataAdapter.isValidCoordinate(-180, -90)).toBe(true);
    expect(MapDataAdapter.isValidCoordinate(180, 90)).toBe(true);

    expect(MapDataAdapter.isValidCoordinate(181, 0)).toBe(false);
    expect(MapDataAdapter.isValidCoordinate(-181, 0)).toBe(false);
    expect(MapDataAdapter.isValidCoordinate(0, 91)).toBe(false);
    expect(MapDataAdapter.isValidCoordinate(0, -91)).toBe(false);
    expect(MapDataAdapter.isValidCoordinate(NaN, 0)).toBe(false);
    expect(MapDataAdapter.isValidCoordinate(0, Infinity)).toBe(false);
    expect(MapDataAdapter.isValidCoordinate('12' as any, 34)).toBe(false);
  });

  it('GLOBE-008: telemetry data source transparency distinguishes SIMULATION from LIVE', () => {
    const vProvider = new DefaultVesselProvider();
    const aProvider = new DefaultAircraftProvider();
    const rProvider = new DefaultRoadProvider();
    const railProvider = new DefaultRailProvider();
    const wProvider = new DefaultWeatherProvider();

    expect(vProvider.getMetadata().dataSourceType).toBe('SIMULATION');
    expect(aProvider.getMetadata().dataSourceType).toBe('SIMULATION');
    expect(rProvider.getMetadata().dataSourceType).toBe('SIMULATION');
    expect(railProvider.getMetadata().dataSourceType).toBe('SIMULATION');
    expect(wProvider.status).toBe('UNAVAILABLE');

    // Never present simulation as live
    expect(vProvider.getStatus()).not.toBe('CONNECTED');
    expect(vProvider.getStatus()).toBe('SIMULATION');
  });
});

describe('Lock Screen Integrity & Lifecycle Suite', () => {
  const USER_A = 'usr-alice-101';
  const USER_B = 'usr-bob-202';

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('LOCK-001: loadLockScreenPreferences returns default preferences when storage empty', () => {
    const prefs = loadLockScreenPreferences();
    expect(prefs.widgets.length).toBe(4);
    expect(prefs.privacyMode).toBe(true);
    expect(prefs.weatherLocationCity).toBe('New York');
    expect(prefs.widgets.find(w => w.id === 'time-date')?.enabled).toBe(true);
    expect(prefs.widgets.find(w => w.id === 'weather')?.enabled).toBe(true);
  });

  it('LOCK-002: saveLockScreenPreferences and loadLockScreenPreferences isolate preferences per user', () => {
    const prefsA: LockScreenPreferences = {
      widgets: [
        { id: 'weather', enabled: true, order: 0 },
        { id: 'time-date', enabled: false, order: 1 },
        { id: 'notifications', enabled: true, order: 2 },
        { id: 'calendar', enabled: true, order: 3 },
      ],
      privacyMode: false,
      weatherLocationCity: 'Tokyo',
    };

    const prefsB: LockScreenPreferences = {
      widgets: [
        { id: 'time-date', enabled: true, order: 0 },
        { id: 'weather', enabled: false, order: 1 },
        { id: 'notifications', enabled: false, order: 2 },
        { id: 'calendar', enabled: true, order: 3 },
      ],
      privacyMode: true,
      weatherLocationCity: 'London',
    };

    saveLockScreenPreferences(prefsA, USER_A);
    saveLockScreenPreferences(prefsB, USER_B);

    const loadedA = loadLockScreenPreferences(USER_A);
    const loadedB = loadLockScreenPreferences(USER_B);

    expect(loadedA.weatherLocationCity).toBe('Tokyo');
    expect(loadedA.privacyMode).toBe(false);
    expect(loadedA.widgets.find(w => w.id === 'weather')?.enabled).toBe(true);

    expect(loadedB.weatherLocationCity).toBe('London');
    expect(loadedB.privacyMode).toBe(true);
    expect(loadedB.widgets.find(w => w.id === 'weather')?.enabled).toBe(false);
  });

  it('LOCK-003: sanitizes malformed storage data and deduplicates widget IDs', () => {
    const malformed = {
      widgets: [
        { id: 'weather', enabled: true, order: 2 },
        { id: 'weather', enabled: false, order: 5 }, // duplicate ID
        { id: 'invalid-widget-xyz', enabled: true, order: 0 }, // unsupported ID
      ],
      privacyMode: 'maybe', // invalid boolean
      weatherLocationCity: 12345, // invalid city type
    };

    localStorage.setItem(getLockScreenStorageKey(USER_A), JSON.stringify(malformed));
    const sanitized = loadLockScreenPreferences(USER_A);

    expect(sanitized.widgets.length).toBe(4);
    const ids = sanitized.widgets.map(w => w.id);
    expect(new Set(ids).size).toBe(4);
    expect(ids).toContain('time-date');
    expect(ids).toContain('weather');
    expect(ids).toContain('notifications');
    expect(ids).toContain('calendar');
    expect(sanitized.privacyMode).toBe(true); // fallback to true
    expect(sanitized.weatherLocationCity).toBe('New York'); // fallback
  });

  it('LOCK-004: password verification correctly validates canonical demo credentials', async () => {
    const isLocalAdmin = await userService.verifyUserPassword('local-admin', 'admin');
    expect(isLocalAdmin).toBe(true);

    const isWrongPass = await userService.verifyUserPassword('local-admin', 'wrongpass99');
    expect(isWrongPass).toBe(false);

    const isLocalUser = await userService.verifyUserPassword('local-user', 'user');
    expect(isLocalUser).toBe(true);
  });
});
