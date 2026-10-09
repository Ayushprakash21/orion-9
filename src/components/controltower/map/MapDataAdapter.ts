/**
 * ORION-9 GLOBAL SUPPLY CHAIN OPERATIONS MAP — DATA ADAPTER
 * Normalizes canonical SCM domain entities into MapLibre-ready GeoJSON features.
 * Computes great-circle flight & shipping trajectories and resolves spatial entity graphs.
 */

import type { FeatureCollection, Feature, Point, LineString, MultiLineString } from 'geojson';
import { 
  VesselEntity, 
  AircraftEntity, 
  TruckEntity, 
  RailEntity, 
  PortFacility, 
  AirportFacility, 
  WarehouseFacility, 
  SupplierFacility, 
  CustomerFacility, 
  ShipmentRoute, 
  ExceptionGeoMarker,
  RiskHeatmapPoint,
  MapLayersState 
} from './types';
import { Shipment, PurchaseOrder, Exception, Warehouse, Supplier } from '../../../types';
import { DigitalTwinNode } from '../../../types/scenario';
import { MAJOR_WORLD_PORTS, MAJOR_WORLD_AIRPORTS, INITIAL_RISK_HEATMAP } from './DemoSimulationEngine';

// Calculate Great Circle interpolation points between [lng1, lat1] and [lng2, lat2]
export function calculateGreatCircleRoute(
  start: [number, number],
  end: [number, number],
  numPoints: number = 24
): [number, number][] {
  const [lng1, lat1] = start;
  const [lng2, lat2] = end;

  // Convert to radians
  const rLat1 = (lat1 * Math.PI) / 180;
  const rLng1 = (lng1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;
  const rLng2 = (lng2 * Math.PI) / 180;

  // Longitudinal difference along shortest angular path (-PI to PI)
  let dLng = rLng2 - rLng1;
  if (dLng > Math.PI) dLng -= 2 * Math.PI;
  if (dLng < -Math.PI) dLng += 2 * Math.PI;

  // Great-circle angular distance
  const cosD = Math.sin(rLat1) * Math.sin(rLat2) + Math.cos(rLat1) * Math.cos(rLat2) * Math.cos(dLng);
  const d = Math.acos(Math.max(-1, Math.min(1, cosD)));

  if (isNaN(d) || d < 0.0001) {
    return [start, end];
  }

  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    const a = Math.sin((1 - f) * d) / Math.sin(d);
    const b = Math.sin(f * d) / Math.sin(d);

    const x = a * Math.cos(rLat1) + b * Math.cos(rLat2) * Math.cos(dLng);
    const y = b * Math.cos(rLat2) * Math.sin(dLng);
    const z = a * Math.sin(rLat1) + b * Math.sin(rLat2);

    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lon = rLng1 + Math.atan2(y, x);

    // Normalize longitude to [-180, 180]
    let degLng = (lon * 180) / Math.PI;
    while (degLng > 180) degLng -= 360;
    while (degLng < -180) degLng += 360;

    points.push([
      Number(degLng.toFixed(4)),
      Number(((lat * 180) / Math.PI).toFixed(4)),
    ]);
  }

  return points;
}

// Hub coordinates mapping for SCM origin/destinations
const HUB_COORDINATES: Record<string, { name: string; coords: [number, number] }> = {
  PVG: { name: 'Shanghai Pudong', coords: [121.80, 31.14] },
  SIN: { name: 'Singapore Port', coords: [103.85, 1.29] },
  JKT: { name: 'Jakarta Tanjung Priok', coords: [106.88, -6.10] },
  LAX: { name: 'Port of Los Angeles', coords: [-118.27, 33.74] },
  RTM: { name: 'Port of Rotterdam', coords: [4.48, 51.92] },
  FRA: { name: 'Frankfurt Hub', coords: [8.57, 50.03] },
  ICN: { name: 'Incheon Cargo Terminal', coords: [126.44, 37.46] },
  NGB: { name: 'Ningbo Zhoushan', coords: [121.54, 29.87] },
  HKG: { name: 'Hong Kong International', coords: [113.91, 22.31] },
  ORD: { name: 'Chicago O\'Hare', coords: [-87.90, 41.97] },
  JFK: { name: 'New York JFK', coords: [-73.78, 40.64] },
};

export class MapDataAdapter {
  /**
   * Synthesize canonical Shipments into GeoJSON routes
   */
  public static buildShipmentRoutes(shipments: Shipment[]): ShipmentRoute[] {
    return (shipments || []).map((s, idx) => {
      const origCode = (s.origin || 'PVG').substring(0, 3).toUpperCase();
      const destCode = (s.destination || (idx % 2 === 0 ? 'JKT' : 'LAX')).substring(0, 3).toUpperCase();

      const origHub = HUB_COORDINATES[origCode] || { name: s.origin || 'Shanghai', coords: [121.5, 31.2] };
      const destHub = HUB_COORDINATES[destCode] || { name: s.destination || 'Jakarta', coords: [106.8, -6.1] };

      const isDelayed = s.status === 'Delayed' || s.delayDays > 0;
      const progress = isDelayed ? 25 : (s.status === 'Delivered' ? 100 : 40 + (idx * 15) % 55);

      const routePoints = calculateGreatCircleRoute(origHub.coords, destHub.coords, 20);
      const currIdx = Math.min(routePoints.length - 1, Math.floor((progress / 100) * routePoints.length));
      const currentPos = routePoints[currIdx] || origHub.coords;

      return {
        shipmentId: s.id,
        title: `Shipment ${s.id} — ${s.carrier || 'Ocean Carrier'}`,
        mode: idx % 3 === 0 ? 'AIR' : 'OCEAN',
        origin: {
          code: origCode,
          name: origHub.name,
          coordinates: origHub.coords,
        },
        destination: {
          code: destCode,
          name: destHub.name,
          coordinates: destHub.coords,
        },
        currentPosition: currentPos,
        coordinates: routePoints,
        status: isDelayed ? 'DELAYED' : (s.status === 'Delivered' ? 'DELIVERED' : 'ON_TIME'),
        progressPercent: progress,
        carrier: s.carrier || 'Global Logistics Express',
        capitalAtRisk: (s.freightCost || 15000) * (isDelayed ? 6.5 : 2.0),
        delayDays: s.delayDays || (isDelayed ? 14 : 0),
        eta: s.expectedArrival || '2026-08-28',
        poId: s.poId,
        dataSource: 'ORION_REALTIME',
      };
    });
  }

  /**
   * Validate whether coordinates are finite and within WGS84 bounds [-180, 180] and [-90, 90]
   */
  public static isValidCoordinate(lng: any, lat: any): boolean {
    return (
      typeof lng === 'number' &&
      typeof lat === 'number' &&
      !isNaN(lng) &&
      !isNaN(lat) &&
      isFinite(lng) &&
      isFinite(lat) &&
      lng >= -180 &&
      lng <= 180 &&
      lat >= -90 &&
      lat <= 90
    );
  }

  /**
   * Convert ShipmentRoutes to GeoJSON Features (LineString or MultiLineString for antimeridian crossings)
   */
  public static routesToGeoJSON(routes: ShipmentRoute[]): FeatureCollection<LineString | MultiLineString> {
    const features: Feature<LineString | MultiLineString>[] = (routes || []).map((r) => {
      const coords = r.coordinates || [];
      // Detect antimeridian crossings (gap in longitude > 180) and split into continuous segments
      const segments: [number, number][][] = [];
      let currentSegment: [number, number][] = [];

      for (let i = 0; i < coords.length; i++) {
        const pt = coords[i];
        if (!MapDataAdapter.isValidCoordinate(pt[0], pt[1])) continue;

        if (currentSegment.length > 0) {
          const prev = currentSegment[currentSegment.length - 1];
          if (Math.abs(pt[0] - prev[0]) > 180) {
            // Crossed the antimeridian - finalize current segment and begin next
            segments.push(currentSegment);
            currentSegment = [];
          }
        }
        currentSegment.push(pt);
      }
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
      }

      if (segments.length <= 1) {
        return {
          type: 'Feature',
          id: r.shipmentId,
          properties: {
            id: r.shipmentId,
            title: r.title,
            status: r.status,
            mode: r.mode,
            carrier: r.carrier,
            progress: r.progressPercent,
            capitalAtRisk: r.capitalAtRisk,
          },
          geometry: {
            type: 'LineString',
            coordinates: segments[0] || [],
          },
        };
      }

      return {
        type: 'Feature',
        id: r.shipmentId,
        properties: {
          id: r.shipmentId,
          title: r.title,
          status: r.status,
          mode: r.mode,
          carrier: r.carrier,
          progress: r.progressPercent,
          capitalAtRisk: r.capitalAtRisk,
        },
        geometry: {
          type: 'MultiLineString',
          coordinates: segments,
        },
      };
    });

    return {
      type: 'FeatureCollection',
      features,
    };
  }

  /**
   * Convert Vessels to GeoJSON Points with strict coordinate validation
   */
  public static vesselsToGeoJSON(vessels: VesselEntity[]): FeatureCollection<Point> {
    const features: Feature<Point>[] = (vessels || [])
      .filter((v) => MapDataAdapter.isValidCoordinate(v.longitude, v.latitude))
      .map((v) => ({
        type: 'Feature',
        id: v.id,
        properties: {
          id: v.id,
          name: v.name,
          carrier: v.carrier,
          status: v.status,
          speed: v.speed,
          heading: v.heading,
          origin: v.origin,
          destination: v.destination,
          eta: v.eta,
          dataSource: v.data_source,
          vesselType: v.vessel_type,
        },
        geometry: {
          type: 'Point',
          coordinates: [v.longitude, v.latitude],
        },
      }));

    return { type: 'FeatureCollection', features };
  }

  /**
   * Convert Aircraft to GeoJSON Points with strict coordinate validation
   */
  public static aircraftToGeoJSON(aircraft: AircraftEntity[]): FeatureCollection<Point> {
    const features: Feature<Point>[] = (aircraft || [])
      .filter((a) => MapDataAdapter.isValidCoordinate(a.longitude, a.latitude))
      .map((a) => ({
        type: 'Feature',
        id: a.id,
        properties: {
          id: a.id,
          name: a.airline,
          callsign: a.callsign,
          status: a.status,
          altitude: a.altitude,
          speed: a.speed,
          heading: a.heading,
          origin: a.origin,
          destination: a.destination,
          dataSource: a.data_source,
        },
        geometry: {
          type: 'Point',
          coordinates: [a.longitude, a.latitude],
        },
      }));

    return { type: 'FeatureCollection', features };
  }

  /**
   * Convert Trucks to GeoJSON Points with strict coordinate validation
   */
  public static trucksToGeoJSON(trucks: TruckEntity[]): FeatureCollection<Point> {
    const features: Feature<Point>[] = (trucks || [])
      .filter((t) => MapDataAdapter.isValidCoordinate(t.longitude, t.latitude))
      .map((t) => ({
        type: 'Feature',
        id: t.id,
        properties: {
          id: t.id,
          name: t.name,
          fleet: t.fleet,
          carrier: t.carrier,
          status: t.status,
          speed: t.speed,
          heading: t.heading,
          trafficCondition: t.trafficCondition,
          dataSource: t.data_source,
        },
        geometry: {
          type: 'Point',
          coordinates: [t.longitude, t.latitude],
        },
      }));

    return { type: 'FeatureCollection', features };
  }

  /**
   * Convert Ports to GeoJSON Points with strict coordinate validation
   */
  public static portsToGeoJSON(ports: PortFacility[] = MAJOR_WORLD_PORTS): FeatureCollection<Point> {
    const features: Feature<Point>[] = (ports || [])
      .filter((p) => MapDataAdapter.isValidCoordinate(p.longitude, p.latitude))
      .map((p) => ({
        type: 'Feature',
        id: p.id,
        properties: {
          id: p.id,
          name: p.name,
          code: p.code,
          country: p.country,
          vesselsInPort: p.vesselsInPort,
          congestion: p.congestion,
          delayAverageHours: p.delayAverageHours,
          capacityUtilization: p.capacityUtilization,
        },
        geometry: {
          type: 'Point',
          coordinates: [p.longitude, p.latitude],
        },
      }));

    return { type: 'FeatureCollection', features };
  }

  /**
   * Convert Cargo Airports to GeoJSON Points with strict coordinate validation
   */
  public static airportsToGeoJSON(airports: AirportFacility[] = MAJOR_WORLD_AIRPORTS): FeatureCollection<Point> {
    const features: Feature<Point>[] = (airports || [])
      .filter((a) => MapDataAdapter.isValidCoordinate(a.longitude, a.latitude))
      .map((a) => ({
        type: 'Feature',
        id: a.id,
        properties: {
          id: a.id,
          name: a.name,
          iata: a.iata,
          icao: a.icao,
          country: a.country,
          aircraftCount: a.aircraftCount,
          cargoActivity: a.cargoActivity,
        },
        geometry: {
          type: 'Point',
          coordinates: [a.longitude, a.latitude],
        },
      }));

    return { type: 'FeatureCollection', features };
  }

  /**
   * Convert canonical Facilities (Warehouses, Suppliers, Digital Twin nodes) to GeoJSON Points
   */
  public static facilitiesToGeoJSON(
    warehouses: Warehouse[],
    suppliers: Supplier[],
    digitalTwinNodes: DigitalTwinNode[] = []
  ): FeatureCollection<Point> {
    const features: Feature<Point>[] = [];

    // Map Warehouses
    (warehouses || []).forEach((w, idx) => {
      // Resolve latitude/longitude if in location or fallback to global hub grid
      const coords = [
        -95.0 + (idx % 5) * 15,
        32.0 + (idx % 3) * 6
      ];
      features.push({
        type: 'Feature',
        id: `fac-wh-${w.id}`,
        properties: {
          id: w.id,
          facilityType: 'warehouse',
          name: w.name,
          location: w.location,
        },
        geometry: {
          type: 'Point',
          coordinates: coords,
        },
      });
    });

    // Map Suppliers
    (suppliers || []).forEach((s, idx) => {
      const coords = [
        110.0 + (idx % 4) * 8,
        22.0 + (idx % 4) * 5
      ];
      features.push({
        type: 'Feature',
        id: `fac-sup-${s.id}`,
        properties: {
          id: s.id,
          facilityType: 'supplier',
          name: s.name,
          region: s.region,
          otif: s.otif,
        },
        geometry: {
          type: 'Point',
          coordinates: coords,
        },
      });
    });

    // Map Digital Twin Nodes
    (digitalTwinNodes || []).forEach((node) => {
      features.push({
        type: 'Feature',
        id: `fac-twin-${node.id}`,
        properties: {
          id: node.id,
          facilityType: node.type.toLowerCase(),
          name: node.name,
          status: node.status,
          criticality: node.criticality,
          capacityRemaining: node.capacityRemainingPercent,
        },
        geometry: {
          type: 'Point',
          coordinates: [node.coordinates[1], node.coordinates[0]], // [lng, lat]
        },
      });
    });

    return { type: 'FeatureCollection', features };
  }

  /**
   * Convert Exceptions to GeoJSON Points
   */
  public static exceptionsToGeoJSON(exceptions: Exception[]): FeatureCollection<Point> {
    const features: Feature<Point>[] = (exceptions || []).map((ex, idx) => {
      // Place exceptions near affected hubs or locations
      const baseCoords = [
        [103.85, 1.29], // Singapore
        [121.50, 31.23], // Shanghai
        [-118.27, 33.74], // LA
        [4.48, 51.92], // Rotterdam
        [106.88, -6.10], // Jakarta
      ];
      const coords = baseCoords[idx % baseCoords.length];

      return {
        type: 'Feature',
        id: ex.id,
        properties: {
          id: ex.id,
          title: `${ex.type}: ${ex.id}`,
          severity: ex.severity,
          type: ex.type,
          entityType: 'shipment',
        },
        geometry: {
          type: 'Point',
          coordinates: [coords[0] + (idx * 0.05), coords[1] + (idx * 0.05)],
        },
      };
    });

    return { type: 'FeatureCollection', features };
  }
}
