/**
 * ORION-9 LOGISTICS & MULTIMODAL FREIGHT DISPATCH TYPES
 * Layer 1: Canonical Schemas & Ontologies
 * 
 * Defines data structures for:
 * - Multimodal Freight Shipments (Ocean, Air, Rail, FTL, LTL, Intermodal)
 * - IoT Sensor Telemetry (Temperature, Humidity, Shock, Tamper Seals, Geofences)
 * - Yard Management System (Dock Appointments, Dwell Times, Demurrage Clocks)
 * - AI Freight Consolidation Plans (LTL -> FTL bundling, Carbon & Cost Savings)
 * - Transit Lane Congestion & Bottleneck Choke Points
 */

export type FreightMode = 'OCEAN' | 'AIR' | 'ROAD_FTL' | 'ROAD_LTL' | 'RAIL' | 'INTERMODAL';

export type FreightShipmentStatus = 
  | 'PLANNED'
  | 'BOOKED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'CUSTOMS_HOLD'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'EXCEPTION_DIVERTED';

export type GeofenceStatus = 'INSIDE_CORRIDOR' | 'DEVIATED' | 'AT_WAYPOINT' | 'ARRIVED_FACILITY';

export interface IoTTelemetrySample {
  timestamp: string;
  latitude: number;
  longitude: number;
  locationName: string;
  temperatureCelsius: number;
  humidityPercent: number;
  shockGForce: number;
  batteryPercent: number;
  tamperSealIntact: boolean;
  geofenceStatus: GeofenceStatus;
}

export interface ColdChainSpecs {
  required: boolean;
  minTempCelsius: number;
  maxTempCelsius: number;
  targetHumidityPercent: number;
  isBreached: boolean;
  breachReason?: string;
}

export interface DemurrageRiskProfile {
  isAtRisk: boolean;
  freeTimeDaysRemaining: number;
  estimatedAccrualDaily: number;
  accruedPenalty: number;
  chokePoint: string;
  lastUpdated: string;
}

export interface MultimodalFreightShipment {
  id: string; // e.g. FRT-2026-881
  consignmentNumber: string; // Master B/L or Airway Bill
  title: string;
  mode: FreightMode;
  carrierId: string;
  carrierName: string;
  carrierScac: string; // e.g. MAEU, HLCU, FDX
  origin: {
    name: string;
    code: string;
    country: string;
    coordinates: [number, number];
  };
  destination: {
    name: string;
    code: string;
    country: string;
    coordinates: [number, number];
  };
  status: FreightShipmentStatus;
  containerNumber: string;
  vesselOrFlight: string;
  totalWeightKg: number;
  totalVolumeCbm: number;
  commodity: string;
  carbonFootprintKg: number;
  bookingDate: string;
  estimatedArrival: string;
  actualArrival?: string;
  freightCost: number;
  currency: string;
  progressPercent: number;
  coldChain: ColdChainSpecs;
  demurrageRisk: DemurrageRiskProfile;
  latestTelemetry: IoTTelemetrySample;
  telemetryHistory: IoTTelemetrySample[];
  policyCompliance: {
    cleared: boolean;
    policyId?: string;
    requiresApproval: boolean;
    approvalId?: string;
    sha256Seal: string;
  };
  notes?: string;
}

export type YardAppointmentStatus = 
  | 'SCHEDULED'
  | 'GATE_CHECKED_IN'
  | 'AT_DOCK_DOOR'
  | 'UNLOADING'
  | 'COMPLETED'
  | 'DEMURRAGE_TRIGGERED';

export interface YardDockAppointment {
  id: string; // e.g. YARD-APT-401
  facilityId: string;
  facilityName: string;
  dockDoor: string; // e.g. BAY-03
  carrier: string;
  driverName: string;
  driverPhone: string;
  trailerNumber: string;
  shipmentId: string;
  scheduledSlot: string;
  checkInTime?: string;
  unloadStartTime?: string;
  completedTime?: string;
  dwellTimeMinutes: number;
  status: YardAppointmentStatus;
  detentionRatePerHour: number;
  accruedDetentionCost: number;
  assignedWarehouseBay: string;
}

export type FreightConsolidationStatus = 
  | 'PROPOSED'
  | 'ROUTED_TO_APPROVAL'
  | 'APPROVED'
  | 'DISPATCHED'
  | 'REJECTED';

export interface FreightConsolidationPlan {
  id: string; // e.g. CNS-2026-09
  title: string;
  originCluster: string;
  destinationCluster: string;
  candidateShipmentIds: string[];
  proposedMode: FreightMode;
  consolidatedCost: number;
  unconsolidatedCost: number;
  netCostSavings: number;
  carbonSavingsKg: number;
  transitTimeDeltaHours: number;
  status: FreightConsolidationStatus;
  sha256Seal: string;
  aiConfidenceScore: number;
  rationale: string;
  approvalRequestId?: string;
}

export interface LaneCongestionMetric {
  laneId: string;
  originPort: string;
  destinationPort: string;
  mode: FreightMode;
  congestionIndex: number; // 0-100
  status: 'NORMAL' | 'ELEVATED' | 'CRITICAL_BOTTLENECK';
  averageDwellDays: number;
  historicalBaselineDays: number;
  primaryChokeCause: string;
  alternativeRerouteSuggestion: string;
}
