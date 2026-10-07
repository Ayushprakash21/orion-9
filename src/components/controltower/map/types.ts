/**
 * ORION-9 GLOBAL SUPPLY CHAIN OPERATIONS MAP — TYPE DEFINITIONS
 * Authoritative types for multi-modal transport, infrastructure, risk,
 * data source truthfulness, and spatial tracking.
 */

export type TransportMode = 'OCEAN' | 'AIR' | 'ROAD' | 'RAIL';

export type DataSourceType =
  | 'LIVE_EXTERNAL'
  | 'ORION_REALTIME'
  | 'CUSTOMER_CONNECTOR'
  | 'SIMULATION'
  | 'DEMO'
  | 'STALE'
  | 'UNKNOWN';

export type ProviderStatus =
  | 'CONNECTED'
  | 'DEGRADED'
  | 'DISCONNECTED'
  | 'UNAVAILABLE'
  | 'SIMULATION';

export type EntityStatus =
  | 'ON_TIME'
  | 'DELAYED'
  | 'AT_RISK'
  | 'STOPPED'
  | 'ANCHORED'
  | 'DOCKED'
  | 'IN_FLIGHT'
  | 'LANDED'
  | 'IN_TRANSIT'
  | 'IDLE'
  | 'UNKNOWN';

export interface BaseTrackedEntity {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  status: EntityStatus;
  origin: string;
  destination: string;
  eta: string;
  last_updated: string;
  data_source: DataSourceType;
  confidence: number;
  tenant_id?: string;
}

export interface VesselEntity extends BaseTrackedEntity {
  imo: string;
  mmsi: string;
  carrier: string;
  vessel_type: string;
  shipment_ids: string[];
  draftMeters?: number;
  deadweightTons?: number;
}

export interface AircraftEntity extends BaseTrackedEntity {
  icao24: string;
  callsign: string;
  airline: string;
  aircraft_type: string;
  altitude: number; // in feet
  ground_speed: number; // in knots
  flight_number?: string;
}

export interface TruckEntity extends BaseTrackedEntity {
  fleet: string;
  carrier: string;
  shipment_ids: string[];
  trafficCondition?: 'FREE' | 'MODERATE' | 'HEAVY' | 'SEVERE';
  trailerTempC?: number;
}

export interface RailEntity extends BaseTrackedEntity {
  train_id: string;
  operator: string;
  carsCount?: number;
  corridorName?: string;
}

export interface PortFacility {
  id: string;
  name: string;
  code: string;
  country: string;
  unlocode: string;
  latitude: number;
  longitude: number;
  vesselsInPort: number;
  arrivals24h: number;
  departures24h: number;
  congestion: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  delayAverageHours: number;
  capacityUtilization: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AirportFacility {
  id: string;
  name: string;
  iata: string;
  icao: string;
  country: string;
  latitude: number;
  longitude: number;
  aircraftCount: number;
  departures24h: number;
  arrivals24h: number;
  delayIndex: number;
  cargoActivity: 'NORMAL' | 'HIGH' | 'CONGESTED';
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface WarehouseFacility {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  inventoryValue: number;
  openPosCount: number;
  shipmentsCount: number;
  exceptionsCount: number;
  capacityUtilization: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SupplierFacility {
  id: string;
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  otif: number;
  spend: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
}

export interface CustomerFacility {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  ordersCount: number;
  revenueAtRisk: number;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ShipmentRoute {
  shipmentId: string;
  title: string;
  mode: TransportMode;
  origin: {
    code: string;
    name: string;
    coordinates: [number, number]; // [lng, lat]
  };
  destination: {
    code: string;
    name: string;
    coordinates: [number, number]; // [lng, lat]
  };
  currentPosition: [number, number]; // [lng, lat]
  coordinates: [number, number][]; // LineString [lng, lat]
  status: 'ON_TIME' | 'DELAYED' | 'AT_RISK' | 'DELIVERED';
  progressPercent: number;
  carrier: string;
  capitalAtRisk: number;
  delayDays: number;
  eta: string;
  poId?: string;
  dataSource: DataSourceType;
}

export interface ExceptionGeoMarker {
  id: string;
  exceptionId: string;
  type: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  latitude: number;
  longitude: number;
  title: string;
  entityType: 'shipment' | 'supplier' | 'warehouse' | 'port' | 'flight';
  entityId: string;
  financialImpact: number;
  actionRequired: string;
  detectedAt: string;
}

export interface RiskHeatmapPoint {
  id: string;
  latitude: number;
  longitude: number;
  intensity: number; // 0 to 1
  radius: number;
  riskType: 'SUPPLIER_RISK' | 'CONGESTION' | 'WEATHER' | 'GEOPOLITICAL' | 'INVENTORY_RISK';
  label: string;
}

export interface WeatherZone {
  id: string;
  name: string;
  type: 'TYPHOON' | 'STORM' | 'FOG' | 'GALE';
  severity: 'SEVERE' | 'MODERATE' | 'EXTREME';
  center: [number, number]; // [lng, lat]
  radiusKm: number;
  windSpeedKnots: number;
  affectedPortIds: string[];
}

export interface MapLayersState {
  // Transport
  oceanVessels: boolean;
  aircraft: boolean;
  trucks: boolean;
  rail: boolean;
  shipmentRoutes: boolean;
  // Infrastructure
  ports: boolean;
  airports: boolean;
  warehouses: boolean;
  suppliers: boolean;
  customers: boolean;
  // Risk
  delays: boolean;
  weather: boolean;
  congestion: boolean;
  geopolitical: boolean;
  // Operations
  shipments: boolean;
  purchaseOrders: boolean;
  exceptions: boolean;
}

export const DEFAULT_MAP_LAYERS: MapLayersState = {
  oceanVessels: true,
  aircraft: true,
  trucks: true,
  rail: true,
  shipmentRoutes: true,
  ports: true,
  airports: true,
  warehouses: true,
  suppliers: true,
  customers: true,
  delays: true,
  weather: false,
  congestion: true,
  geopolitical: false,
  shipments: true,
  purchaseOrders: false,
  exceptions: true,
};

export type MapProjectionMode = 'globe' | 'mercator';

export type SelectedMapEntity =
  | { type: 'vessel'; entity: VesselEntity }
  | { type: 'aircraft'; entity: AircraftEntity }
  | { type: 'truck'; entity: TruckEntity }
  | { type: 'rail'; entity: RailEntity }
  | { type: 'port'; entity: PortFacility }
  | { type: 'airport'; entity: AirportFacility }
  | { type: 'warehouse'; entity: WarehouseFacility }
  | { type: 'supplier'; entity: SupplierFacility }
  | { type: 'customer'; entity: CustomerFacility }
  | { type: 'shipment'; entity: ShipmentRoute }
  | { type: 'exception'; entity: ExceptionGeoMarker };

export interface GlobalMapFilterCriteria {
  searchQuery: string;
  mode: 'ALL' | TransportMode;
  status: 'ALL' | 'ON_TIME' | 'DELAYED' | 'AT_RISK';
  region: string;
  minRevenueRisk: number;
  carrier: string;
}

export const DEFAULT_MAP_FILTERS: GlobalMapFilterCriteria = {
  searchQuery: '',
  mode: 'ALL',
  status: 'ALL',
  region: 'ALL',
  minRevenueRisk: 0,
  carrier: 'ALL',
};
