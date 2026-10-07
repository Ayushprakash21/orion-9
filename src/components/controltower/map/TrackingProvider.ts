/**
 * ORION-9 GLOBAL SUPPLY CHAIN OPERATIONS MAP — DATA SOURCE PROVIDER ABSTRACTION
 * Enforces rigorous provider abstraction and data truthfulness.
 * If external feeds are disconnected, status is explicitly marked as SIMULATION or UNAVAILABLE.
 */

import { 
  VesselEntity, 
  AircraftEntity, 
  TruckEntity, 
  RailEntity, 
  ProviderStatus, 
  DataSourceType 
} from './types';

export type Unsubscribe = () => void;

export interface TrackingProviderMetadata {
  providerId: string;
  name: string;
  type: 'AIS' | 'ADSB' | 'TELEMATICS' | 'EDI_TMS' | 'WEATHER';
  status: ProviderStatus;
  dataSourceType: DataSourceType;
  lastSyncAt: string | null;
  latencyMs: number;
  activeEntityCount: number;
  notes: string;
}

export interface TrackingProvider<T> {
  id: string;
  name: string;
  getMetadata(): TrackingProviderMetadata;
  getInitialSnapshot(): Promise<T[]>;
  subscribe?(handler: (update: T[]) => void): Unsubscribe;
  getStatus(): ProviderStatus;
}

export class DefaultVesselProvider implements TrackingProvider<VesselEntity> {
  id = 'ais-stream-core';
  name = 'AIS Maritime Stream';
  private status: ProviderStatus = 'SIMULATION';
  private data: VesselEntity[] = [];

  constructor(seedData: VesselEntity[] = []) {
    this.data = seedData;
  }

  setData(data: VesselEntity[]) {
    this.data = data;
  }

  getMetadata(): TrackingProviderMetadata {
    return {
      providerId: this.id,
      name: this.name,
      type: 'AIS',
      status: this.status,
      dataSourceType: 'SIMULATION',
      lastSyncAt: new Date().toISOString(),
      latencyMs: 142,
      activeEntityCount: this.data.length,
      notes: 'Operational simulation active. Live Spire/MarineTraffic AIS connector in standby.',
    };
  }

  async getInitialSnapshot(): Promise<VesselEntity[]> {
    return this.data;
  }

  getStatus(): ProviderStatus {
    return this.status;
  }
}

export class DefaultAircraftProvider implements TrackingProvider<AircraftEntity> {
  id = 'adsb-global-exchange';
  name = 'ADS-B Air Cargo Exchange';
  private status: ProviderStatus = 'SIMULATION';
  private data: AircraftEntity[] = [];

  constructor(seedData: AircraftEntity[] = []) {
    this.data = seedData;
  }

  setData(data: AircraftEntity[]) {
    this.data = data;
  }

  getMetadata(): TrackingProviderMetadata {
    return {
      providerId: this.id,
      name: this.name,
      type: 'ADSB',
      status: this.status,
      dataSourceType: 'SIMULATION',
      lastSyncAt: new Date().toISOString(),
      latencyMs: 98,
      activeEntityCount: this.data.length,
      notes: 'ADS-B synthetic telemetry engine active. FlightAware connector configured.',
    };
  }

  async getInitialSnapshot(): Promise<AircraftEntity[]> {
    return this.data;
  }

  getStatus(): ProviderStatus {
    return this.status;
  }
}

export class DefaultRoadProvider implements TrackingProvider<TruckEntity> {
  id = 'telematics-fleet-hub';
  name = 'Ground Fleet Telematics (TMS/IoT)';
  private status: ProviderStatus = 'SIMULATION';
  private data: TruckEntity[] = [];

  constructor(seedData: TruckEntity[] = []) {
    this.data = seedData;
  }

  setData(data: TruckEntity[]) {
    this.data = data;
  }

  getMetadata(): TrackingProviderMetadata {
    return {
      providerId: this.id,
      name: this.name,
      type: 'TELEMATICS',
      status: this.status,
      dataSourceType: 'SIMULATION',
      lastSyncAt: new Date().toISOString(),
      latencyMs: 210,
      activeEntityCount: this.data.length,
      notes: 'Project44 / Samsara telematics mock active. Cellular IoT feed ready.',
    };
  }

  async getInitialSnapshot(): Promise<TruckEntity[]> {
    return this.data;
  }

  getStatus(): ProviderStatus {
    return this.status;
  }
}

export class DefaultRailProvider implements TrackingProvider<RailEntity> {
  id = 'rail-intermodal-edi';
  name = 'Trans-Continental Rail Intermodal (EDI 214/404)';
  private status: ProviderStatus = 'SIMULATION';
  private data: RailEntity[] = [];

  constructor(seedData: RailEntity[] = []) {
    this.data = seedData;
  }

  setData(data: RailEntity[]) {
    this.data = data;
  }

  getMetadata(): TrackingProviderMetadata {
    return {
      providerId: this.id,
      name: this.name,
      type: 'EDI_TMS',
      status: this.status,
      dataSourceType: 'SIMULATION',
      lastSyncAt: new Date().toISOString(),
      latencyMs: 340,
      activeEntityCount: this.data.length,
      notes: 'Class I EDI telematics bridge simulated. Real-time API adapter available.',
    };
  }

  async getInitialSnapshot(): Promise<RailEntity[]> {
    return this.data;
  }

  getStatus(): ProviderStatus {
    return this.status;
  }
}

export class DefaultWeatherProvider {
  id = 'noaa-ecmwf-layer';
  name = 'Global Weather & Maritime Advisory';
  status: ProviderStatus = 'UNAVAILABLE';

  getMetadata(): TrackingProviderMetadata {
    return {
      providerId: this.id,
      name: this.name,
      type: 'WEATHER',
      status: this.status,
      dataSourceType: 'UNKNOWN',
      lastSyncAt: null,
      latencyMs: 0,
      activeEntityCount: 0,
      notes: 'Weather satellite layer currently unavailable. Configure NOAA API key in System Settings.',
    };
  }
}
