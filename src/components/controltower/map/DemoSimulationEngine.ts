/**
 * ORION-9 GLOBAL SUPPLY CHAIN OPERATIONS MAP — DETERMINISTIC SIMULATION ENGINE
 * Generates realistic global multi-modal operational telemetry:
 * - 500+ Ocean Vessels (Trans-Pacific, Asia-Europe, Malacca, Suez, Cape, Atlantic)
 * - 250+ Cargo Aircraft (Intercontinental flight corridors)
 * - 300+ Freight Trucks (Highway logistics corridors)
 * - 75+ Freight Trains (Intermodal rail arteries)
 * - Major World Seaports, Cargo Airports, and Strategic Facilities
 *
 * Uses deterministic pseudo-random seed to guarantee stability across renders.
 */

import { 
  VesselEntity, 
  AircraftEntity, 
  TruckEntity, 
  RailEntity, 
  PortFacility, 
  AirportFacility,
  RiskHeatmapPoint,
  WeatherZone 
} from './types';
import { scmEventFabric } from '../../../kernel/scm/ScmEventFabric';

// Simple fast deterministic PRNG (Linear Congruential Generator)
function createSeededRandom(seed: number = 42) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export const MAJOR_WORLD_PORTS: PortFacility[] = [
  { id: 'port-shanghai', name: 'Port of Shanghai', code: 'PVG', country: 'China', unlocode: 'CNSHG', latitude: 31.23, longitude: 121.50, vesselsInPort: 142, arrivals24h: 38, departures24h: 34, congestion: 'MEDIUM', delayAverageHours: 14, capacityUtilization: 88, risk: 'MEDIUM' },
  { id: 'port-singapore', name: 'Port of Singapore', code: 'SIN', country: 'Singapore', unlocode: 'SGSIN', latitude: 1.29, longitude: 103.85, vesselsInPort: 184, arrivals24h: 52, departures24h: 49, congestion: 'HIGH', delayAverageHours: 28, capacityUtilization: 94, risk: 'HIGH' },
  { id: 'port-ningbo', name: 'Port of Ningbo-Zhoushan', code: 'NGB', country: 'China', unlocode: 'CNNGB', latitude: 29.87, longitude: 121.54, vesselsInPort: 98, arrivals24h: 27, departures24h: 24, congestion: 'LOW', delayAverageHours: 8, capacityUtilization: 76, risk: 'LOW' },
  { id: 'port-shenzhen', name: 'Port of Shenzhen (Yantian)', code: 'SZX', country: 'China', unlocode: 'CNSZX', latitude: 22.54, longitude: 114.28, vesselsInPort: 86, arrivals24h: 22, departures24h: 20, congestion: 'MEDIUM', delayAverageHours: 12, capacityUtilization: 82, risk: 'MEDIUM' },
  { id: 'port-busan', name: 'Port of Busan', code: 'PUS', country: 'South Korea', unlocode: 'KRPUS', latitude: 35.10, longitude: 129.04, vesselsInPort: 64, arrivals24h: 18, departures24h: 16, congestion: 'LOW', delayAverageHours: 6, capacityUtilization: 71, risk: 'LOW' },
  { id: 'port-rotterdam', name: 'Port of Rotterdam', code: 'RTM', country: 'Netherlands', unlocode: 'NLRTM', latitude: 51.92, longitude: 4.48, vesselsInPort: 112, arrivals24h: 31, departures24h: 29, congestion: 'MEDIUM', delayAverageHours: 16, capacityUtilization: 85, risk: 'MEDIUM' },
  { id: 'port-antwerp', name: 'Port of Antwerp-Bruges', code: 'ANR', country: 'Belgium', unlocode: 'BEANR', latitude: 51.22, longitude: 4.40, vesselsInPort: 72, arrivals24h: 21, departures24h: 19, congestion: 'LOW', delayAverageHours: 9, capacityUtilization: 78, risk: 'LOW' },
  { id: 'port-la', name: 'Port of Los Angeles', code: 'LAX', country: 'USA', unlocode: 'USLAX', latitude: 33.74, longitude: -118.27, vesselsInPort: 78, arrivals24h: 19, departures24h: 18, congestion: 'HIGH', delayAverageHours: 32, capacityUtilization: 92, risk: 'HIGH' },
  { id: 'port-longbeach', name: 'Port of Long Beach', code: 'LGB', country: 'USA', unlocode: 'USLGB', latitude: 33.77, longitude: -118.19, vesselsInPort: 65, arrivals24h: 17, departures24h: 16, congestion: 'MEDIUM', delayAverageHours: 22, capacityUtilization: 84, risk: 'MEDIUM' },
  { id: 'port-hamburg', name: 'Port of Hamburg', code: 'HAM', country: 'Germany', unlocode: 'DEHAM', latitude: 53.55, longitude: 9.99, vesselsInPort: 54, arrivals24h: 14, departures24h: 12, congestion: 'LOW', delayAverageHours: 7, capacityUtilization: 69, risk: 'LOW' },
  { id: 'port-dubai', name: 'Port of Jebel Ali (Dubai)', code: 'DXB', country: 'UAE', unlocode: 'AEJEA', latitude: 25.01, longitude: 55.06, vesselsInPort: 92, arrivals24h: 26, departures24h: 25, congestion: 'LOW', delayAverageHours: 10, capacityUtilization: 79, risk: 'LOW' },
  { id: 'port-tanjung', name: 'Tanjung Priok Port', code: 'JKT', country: 'Indonesia', unlocode: 'IDTPP', latitude: -6.10, longitude: 106.88, vesselsInPort: 88, arrivals24h: 24, departures24h: 21, congestion: 'CRITICAL', delayAverageHours: 48, capacityUtilization: 98, risk: 'CRITICAL' },
  { id: 'port-hongkong', name: 'Port of Hong Kong', code: 'HKG', country: 'Hong Kong', unlocode: 'HKHKG', latitude: 22.31, longitude: 114.13, vesselsInPort: 79, arrivals24h: 23, departures24h: 22, congestion: 'LOW', delayAverageHours: 8, capacityUtilization: 72, risk: 'LOW' },
  { id: 'port-yokohama', name: 'Port of Yokohama', code: 'YOK', country: 'Japan', unlocode: 'JPYOK', latitude: 35.44, longitude: 139.64, vesselsInPort: 48, arrivals24h: 15, departures24h: 14, congestion: 'LOW', delayAverageHours: 5, capacityUtilization: 65, risk: 'LOW' },
  { id: 'port-santos', name: 'Port of Santos', code: 'SSZ', country: 'Brazil', unlocode: 'BRSSZ', latitude: -23.96, longitude: -46.30, vesselsInPort: 42, arrivals24h: 11, departures24h: 10, congestion: 'MEDIUM', delayAverageHours: 18, capacityUtilization: 80, risk: 'MEDIUM' },
];

export const MAJOR_WORLD_AIRPORTS: AirportFacility[] = [
  { id: 'air-pvg', name: 'Shanghai Pudong Cargo Hub', iata: 'PVG', icao: 'ZSPD', country: 'China', latitude: 31.14, longitude: 121.80, aircraftCount: 68, departures24h: 42, arrivals24h: 40, delayIndex: 18, cargoActivity: 'HIGH', risk: 'LOW' },
  { id: 'air-hkg', name: 'Hong Kong International Cargo', iata: 'HKG', icao: 'VHHH', country: 'Hong Kong', latitude: 22.31, longitude: 113.91, aircraftCount: 84, departures24h: 58, arrivals24h: 56, delayIndex: 12, cargoActivity: 'HIGH', risk: 'LOW' },
  { id: 'air-mem', name: 'Memphis SuperHub', iata: 'MEM', icao: 'KMEM', country: 'USA', latitude: 35.04, longitude: -89.98, aircraftCount: 96, departures24h: 72, arrivals24h: 70, delayIndex: 8, cargoActivity: 'HIGH', risk: 'LOW' },
  { id: 'air-anc', name: 'Ted Stevens Anchorage Cargo Crossroad', iata: 'ANC', icao: 'PANC', country: 'USA', latitude: 61.17, longitude: -149.99, aircraftCount: 74, departures24h: 48, arrivals24h: 46, delayIndex: 14, cargoActivity: 'HIGH', risk: 'LOW' },
  { id: 'air-icn', name: 'Incheon Cargo Terminal', iata: 'ICN', icao: 'RKSI', country: 'South Korea', latitude: 37.46, longitude: 126.44, aircraftCount: 52, departures24h: 36, arrivals24h: 34, delayIndex: 9, cargoActivity: 'NORMAL', risk: 'LOW' },
  { id: 'air-fra', name: 'Frankfurt Air Cargo City', iata: 'FRA', icao: 'EDDF', country: 'Germany', latitude: 50.03, longitude: 8.57, aircraftCount: 62, departures24h: 40, arrivals24h: 38, delayIndex: 15, cargoActivity: 'NORMAL', risk: 'LOW' },
  { id: 'air-dxb', name: 'Dubai World Central / DXB Cargo', iata: 'DXB', icao: 'OMDB', country: 'UAE', latitude: 25.25, longitude: 55.36, aircraftCount: 58, departures24h: 38, arrivals24h: 36, delayIndex: 10, cargoActivity: 'HIGH', risk: 'LOW' },
  { id: 'air-ord', name: "Chicago O'Hare Cargo Center", iata: 'ORD', icao: 'KORD', country: 'USA', latitude: 41.97, longitude: -87.90, aircraftCount: 46, departures24h: 32, arrivals24h: 30, delayIndex: 22, cargoActivity: 'NORMAL', risk: 'MEDIUM' },
  { id: 'air-nrt', name: 'Narita Air Cargo Hub', iata: 'NRT', icao: 'RJAA', country: 'Japan', latitude: 35.76, longitude: 140.38, aircraftCount: 40, departures24h: 28, arrivals24h: 26, delayIndex: 7, cargoActivity: 'NORMAL', risk: 'LOW' },
  { id: 'air-sin', name: 'Singapore Changi Airfreight Centre', iata: 'SIN', icao: 'WSSS', country: 'Singapore', latitude: 1.36, longitude: 103.99, aircraftCount: 44, departures24h: 30, arrivals24h: 28, delayIndex: 11, cargoActivity: 'NORMAL', risk: 'LOW' },
];

export const INITIAL_WEATHER_ZONES: WeatherZone[] = [
  {
    id: 'wz-typhoon-infa',
    name: 'Super Typhoon In-Fa (Category 4)',
    type: 'TYPHOON',
    severity: 'EXTREME',
    center: [128.4, 23.8],
    radiusKm: 380,
    windSpeedKnots: 115,
    affectedPortIds: ['port-shanghai', 'port-ningbo'],
  },
  {
    id: 'wz-atlantic-gale',
    name: 'North Atlantic Winter Storm Cell',
    type: 'GALE',
    severity: 'MODERATE',
    center: [-35.0, 48.0],
    radiusKm: 520,
    windSpeedKnots: 55,
    affectedPortIds: ['port-rotterdam'],
  },
];

export const INITIAL_RISK_HEATMAP: RiskHeatmapPoint[] = [
  { id: 'risk-malacca', latitude: 2.5, longitude: 101.8, intensity: 0.85, radius: 45, riskType: 'CONGESTION', label: 'Strait of Malacca Vessel Density' },
  { id: 'risk-singapore-anchorage', latitude: 1.25, longitude: 103.8, intensity: 0.95, radius: 35, riskType: 'CONGESTION', label: 'Singapore Outer Anchorage Wait Time' },
  { id: 'risk-suez-approach', latitude: 27.8, longitude: 34.2, intensity: 0.70, radius: 50, riskType: 'GEOPOLITICAL', label: 'Red Sea Maritime Corridor Alert' },
  { id: 'risk-la-terminal', latitude: 33.74, longitude: -118.27, intensity: 0.75, radius: 30, riskType: 'CONGESTION', label: 'LA/Long Beach Railhead Dwell Time' },
  { id: 'risk-taiwan-strait', latitude: 24.2, longitude: 119.5, intensity: 0.80, radius: 60, riskType: 'WEATHER', label: 'Typhoon In-Fa Outer Swell Advisory' },
  { id: 'risk-rotterdam-barge', latitude: 51.92, longitude: 4.48, intensity: 0.55, radius: 25, riskType: 'INVENTORY_RISK', label: 'Rhine Low Water Level Barge Capacity' },
];

export class DemoSimulationEngine {
  private static instance: DemoSimulationEngine;
  private vessels: VesselEntity[] = [];
  private aircraft: AircraftEntity[] = [];
  private trucks: TruckEntity[] = [];
  private rail: RailEntity[] = [];
  private initialized = false;

  public static getInstance(): DemoSimulationEngine {
    if (!DemoSimulationEngine.instance) {
      DemoSimulationEngine.instance = new DemoSimulationEngine();
    }
    return DemoSimulationEngine.instance;
  }

  private constructor() {
    this.seedOperationalState();
  }

  public seedOperationalState() {
    if (this.initialized) return;
    const rng = createSeededRandom(10892);

    // 1. Generate 520 Ocean Vessels across key shipping lanes
    const carriers = ['Maersk Line', 'MSC Mediterranean', 'CMA CGM', 'COSCO Shipping', 'Hapag-Lloyd', 'Ocean Network Express', 'Evergreen Marine'];
    const shipPrefixes = ['Orion Vanguard', 'Pacific Horizon', 'Titan Endeavour', 'Crest Mariner', 'Nordic Voyager', 'Atlantic Pioneer', 'Solaris Navigator', 'Global Express'];
    
    // Sea Route Corridors (lat/lng ranges)
    const corridors = [
      // Trans-Pacific (Eastbound Asia to US West Coast)
      { baseLat: 34.0, latSpan: 10, minLng: 130.0, maxLng: 235.0, heading: 85, origin: 'PVG', dest: 'LAX' },
      // Asia - Europe (via Malacca & Indian Ocean)
      { baseLat: 6.0, latSpan: 8, minLng: 45.0, maxLng: 105.0, heading: 275, origin: 'SIN', dest: 'RTM' },
      // Trans-Atlantic (Europe to US East Coast)
      { baseLat: 42.0, latSpan: 8, minLng: -65.0, maxLng: -5.0, heading: 260, origin: 'RTM', dest: 'NYC' },
      // East Asia Coastal (China - Korea - Japan)
      { baseLat: 28.0, latSpan: 12, minLng: 118.0, maxLng: 132.0, heading: 35, origin: 'SZX', dest: 'PUS' },
      // SE Asia / Indonesia Corridor
      { baseLat: -4.0, latSpan: 8, minLng: 102.0, maxLng: 118.0, heading: 145, origin: 'SIN', dest: 'JKT' },
    ];

    for (let i = 0; i < 520; i++) {
      const corr = corridors[i % corridors.length];
      const lngOffset = (i / 520) * (corr.maxLng - corr.minLng);
      let lng = corr.minLng + lngOffset + (rng() * 4 - 2);
      if (lng > 180) lng -= 360; // Normalize longitude
      const lat = corr.baseLat + (rng() * corr.latSpan - corr.latSpan / 2);
      const speed = 14 + rng() * 8;
      const isDelayed = i % 11 === 0;
      const isAtRisk = i % 17 === 0;
      const status = isDelayed ? 'DELAYED' : isAtRisk ? 'AT_RISK' : 'ON_TIME';

      this.vessels.push({
        id: `vsl-${1000 + i}`,
        imo: `IMO${9200000 + i}`,
        mmsi: `MMSI${211000000 + i}`,
        name: `${shipPrefixes[i % shipPrefixes.length]} ${String.fromCharCode(65 + (i % 26))}${i + 1}`,
        carrier: carriers[i % carriers.length],
        vessel_type: i % 4 === 0 ? 'Ultra Large Container Vessel (ULCV)' : 'Post-Panamax Container Carrier',
        latitude: Number(lat.toFixed(4)),
        longitude: Number(lng.toFixed(4)),
        heading: Math.round(corr.heading + (rng() * 20 - 10)),
        speed: Number(speed.toFixed(1)),
        status,
        origin: corr.origin,
        destination: corr.dest,
        eta: new Date(Date.now() + (3 + (i % 12)) * 86400000).toISOString().split('T')[0],
        last_updated: new Date(Date.now() - Math.floor(rng() * 90000)).toISOString(),
        data_source: 'SIMULATION',
        confidence: 0.94,
        shipment_ids: [`SHP-${2000 + i}`, `SHP-${4000 + i}`],
        draftMeters: 14.5 + rng() * 2.5,
        deadweightTons: 140000 + Math.round(rng() * 60000),
      });
    }

    // 2. Generate 260 Aircraft across international air routes
    const airlines = ['Atlas Air Cargo', 'Lufthansa Cargo', 'Cargolux', 'FedEx Express', 'UPS Airlines', 'Singapore Airlines Cargo', 'Cathay Cargo', 'Korean Air Cargo'];
    const airCorridors = [
      { start: [121.8, 31.1], end: [-149.9, 61.2], orig: 'PVG', dest: 'ANC' },
      { start: [-149.9, 61.2], end: [-89.9, 35.0], orig: 'ANC', dest: 'MEM' },
      { start: [113.9, 22.3], end: [8.5, 50.0], orig: 'HKG', dest: 'FRA' },
      { start: [103.9, 1.3], end: [55.3, 25.2], orig: 'SIN', dest: 'DXB' },
      { start: [8.5, 50.0], end: [-87.9, 41.9], orig: 'FRA', dest: 'ORD' },
      { start: [126.4, 37.4], end: [140.3, 35.7], orig: 'ICN', dest: 'NRT' },
    ];

    for (let i = 0; i < 260; i++) {
      const ac = airCorridors[i % airCorridors.length];
      const progress = (i % 20) / 20;
      const lng = ac.start[0] + progress * (ac.end[0] - ac.start[0]) + (rng() * 2 - 1);
      const lat = ac.start[1] + progress * (ac.end[1] - ac.start[1]) + (rng() * 2 - 1);
      const isDelayed = i % 14 === 0;

      this.aircraft.push({
        id: `ac-${500 + i}`,
        name: `${airlines[i % airlines.length]} ${ac.orig}-${ac.dest}`,
        icao24: (3400000 + i).toString(16),
        callsign: `CRG${100 + i}`,
        airline: airlines[i % airlines.length],
        aircraft_type: i % 2 === 0 ? 'Boeing 777F' : 'Boeing 747-8F',
        latitude: Number(lat.toFixed(4)),
        longitude: Number(lng.toFixed(4)),
        altitude: 32000 + Math.round(rng() * 6000),
        heading: Math.round(rng() * 360),
        speed: 480 + Math.round(rng() * 40),
        ground_speed: 495 + Math.round(rng() * 35),
        status: isDelayed ? 'DELAYED' : 'IN_FLIGHT',
        origin: ac.orig,
        destination: ac.dest,
        eta: new Date(Date.now() + (2 + (i % 8)) * 3600000).toISOString(),
        last_updated: new Date(Date.now() - Math.floor(rng() * 45000)).toISOString(),
        data_source: 'SIMULATION',
        confidence: 0.98,
        flight_number: `FX${300 + i}`,
      });
    }

    // 3. Generate 310 Freight Trucks across North America, Europe, and Asia
    const truckingCarriers = ['Schneider National', 'J.B. Hunt', 'DHL Freight', 'Kuehne+Nagel Road', 'SF Express Ground', 'Nippon Express'];
    for (let i = 0; i < 310; i++) {
      let lat = 38.0;
      let lng = -95.0;
      if (i % 3 === 0) {
        // North America I-80 / I-10 corridor
        lat = 34.0 + (rng() * 8);
        lng = -118.0 + (i / 100) * 40;
      } else if (i % 3 === 1) {
        // European logistics spine
        lat = 48.0 + (rng() * 6);
        lng = 4.0 + (rng() * 12);
      } else {
        // East Asia highway network
        lat = 30.0 + (rng() * 6);
        lng = 118.0 + (rng() * 6);
      }

      this.trucks.push({
        id: `trk-${200 + i}`,
        name: `Fleet Unit #${8800 + i}`,
        fleet: `Long-Haul Intermodal Div ${1 + (i % 4)}`,
        carrier: truckingCarriers[i % truckingCarriers.length],
        latitude: Number(lat.toFixed(4)),
        longitude: Number(lng.toFixed(4)),
        heading: Math.round(rng() * 360),
        speed: 55 + Math.round(rng() * 15),
        status: i % 18 === 0 ? 'DELAYED' : 'IN_TRANSIT',
        origin: 'HUB-CENTRAL',
        destination: 'DC-NORTH',
        eta: new Date(Date.now() + (6 + (i % 18)) * 3600000).toISOString(),
        shipment_ids: [`SHP-${8000 + i}`],
        last_updated: new Date(Date.now() - Math.floor(rng() * 30000)).toISOString(),
        data_source: 'SIMULATION',
        confidence: 0.95,
        trafficCondition: i % 8 === 0 ? 'HEAVY' : 'FREE',
      });
    }

    // 4. Generate 80 Rail Intermodal Trains
    const railOperators = ['BNSF Railway', 'Union Pacific', 'DB Cargo', 'China Railway Express', 'Canadian National'];
    for (let i = 0; i < 80; i++) {
      let lat = 40.0;
      let lng = -100.0;
      if (i % 2 === 0) {
        // US transcontinental line
        lat = 39.0 + (rng() * 4);
        lng = -115.0 + (i / 40) * 30;
      } else {
        // Eurasia Silk Road rail line
        lat = 52.0 + (rng() * 3);
        lng = 40.0 + (i / 40) * 60;
      }

      this.rail.push({
        id: `rail-${100 + i}`,
        name: `Intermodal Unit Train #${i + 1}`,
        train_id: `TRN-${9000 + i}`,
        operator: railOperators[i % railOperators.length],
        latitude: Number(lat.toFixed(4)),
        longitude: Number(lng.toFixed(4)),
        heading: 90,
        speed: 45 + Math.round(rng() * 10),
        status: 'IN_TRANSIT',
        origin: 'PORT-GATEWAY',
        destination: 'INLAND-INTERMODAL-RAMP',
        eta: new Date(Date.now() + (12 + (i % 24)) * 3600000).toISOString(),
        last_updated: new Date().toISOString(),
        data_source: 'SIMULATION',
        confidence: 0.97,
        carsCount: 90 + Math.round(rng() * 30),
      });
    }

    this.initialized = true;

    // Emit initial simulation telemetry event to Event Fabric
    try {
      scmEventFabric.publish({
        eventType: 'SIGNAL_DETECTED',
        aggregateId: 'control-tower-map',
        aggregateType: 'GLOBAL_OPERATIONS_MAP',
        tenantId: 'tenant-default',
        correlationId: `corr-sim-${Date.now()}`,
        actor: {
          id: 'system-sim-engine',
          type: 'SYSTEM',
          name: 'Global Operations Simulation Engine',
          roles: ['system_service'],
          organizationId: 'tenant-default',
        },
        payloadReference: {
          message: 'Global Operations Map Multi-Modal Simulation Engine activated',
          vesselCount: this.vessels.length,
          aircraftCount: this.aircraft.length,
          truckCount: this.trucks.length,
          railCount: this.rail.length,
        },
      });
    } catch (e) {
      // Ignore if event fabric is in SSR
    }
  }

  public getVessels(): VesselEntity[] {
    return this.vessels;
  }

  public getAircraft(): AircraftEntity[] {
    return this.aircraft;
  }

  public getTrucks(): TruckEntity[] {
    return this.trucks;
  }

  public getRail(): RailEntity[] {
    return this.rail;
  }

  /**
   * Advance simulation by 1 deterministic step (for smooth movements)
   */
  public advanceSimulationStep() {
    // Smoothly step vessel positions according to heading and speed
    for (const v of this.vessels) {
      const rad = (v.heading * Math.PI) / 180;
      const deltaLat = Math.cos(rad) * 0.008;
      const deltaLng = Math.sin(rad) * 0.008;
      v.latitude = Number((v.latitude + deltaLat).toFixed(4));
      v.longitude = Number((v.longitude + deltaLng).toFixed(4));
      // Normalize longitude wrapping
      if (v.longitude > 180) v.longitude -= 360;
      if (v.longitude < -180) v.longitude += 360;
    }

    // Step aircraft
    for (const a of this.aircraft) {
      const rad = (a.heading * Math.PI) / 180;
      const deltaLat = Math.cos(rad) * 0.035;
      const deltaLng = Math.sin(rad) * 0.035;
      a.latitude = Number((a.latitude + deltaLat).toFixed(4));
      a.longitude = Number((a.longitude + deltaLng).toFixed(4));
      if (a.longitude > 180) a.longitude -= 360;
      if (a.longitude < -180) a.longitude += 360;
    }
  }
}

export const demoSimulationEngine = DemoSimulationEngine.getInstance();
