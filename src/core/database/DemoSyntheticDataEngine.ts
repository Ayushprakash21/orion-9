/**
 * ORION-9 AI SYNTHETIC ENTERPRISE DATA ENGINE
 * Generates relationally consistent, tenant-aware, lifecycle-complete
 * synthetic enterprise business packages for the DEMO environment.
 * 
 * Target: Exactly 30 Complete Enterprise Packages per Batch / Hour.
 * Hard Guard: Strictly prohibited from running or writing in LIVE mode.
 */

import { dbManager } from './DatabaseConnectionManager';
import { collection, doc, writeBatch, getDocs, query, where, setDoc } from 'firebase/firestore';

/**
 * Authoritative Canonical Demo Hourly Generation Rate
 */
export const DEMO_PACKAGES_PER_HOUR = 30;

export interface SyntheticCompanyPackage {
  company: SyntheticCompany;
  suppliers: SyntheticSupplier[];
  customers: SyntheticCustomer[];
  products: SyntheticProduct[];
  warehouses: SyntheticWarehouse[];
  purchaseOrders: SyntheticPurchaseOrder[];
  shipments: SyntheticShipment[];
  inventoryItems: SyntheticInventoryItem[];
  invoices: SyntheticInvoice[];
  contracts: SyntheticContract[];
  exceptions: SyntheticException[];
  signals: SyntheticSignal[];
  scenario: SyntheticScenarioType;
}

export type SyntheticScenarioType =
  | 'HEALTHY'
  | 'MINOR_DISRUPTION'
  | 'SUPPLIER_RISK'
  | 'TRANSPORT_DELAY'
  | 'INVENTORY_SHORTAGE'
  | 'DEMAND_SPIKE'
  | 'QUALITY_ISSUE';

export interface SyntheticCompany {
  id: string;
  companyId: string;
  tenantId: string;
  organizationId: string;
  companyName: string;
  legalName: string;
  industry: string;
  country: string;
  region: string;
  city: string;
  currency: string;
  timezone: string;
  taxProfile: string;
  paymentTerms: string;
  role: 'SUPPLIER' | 'CUSTOMER' | 'ENTERPRISE_HUB';
  riskProfile: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'ONBOARDING' | 'UNDER_REVIEW';
  syntheticData: true;
  environment: 'DEMO';
  generationBatchId: string;
  createdAt: string;
  updatedAt: string;
  generatedAt: string;
}

export interface SyntheticSupplier {
  id: string;
  name: string;
  legalName: string;
  category: string;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  country: string;
  city: string;
  rating: number; // 0..100
  onTimeDeliveryRate: number; // percentage
  leadTimeDays: number;
  contactEmail: string;
  contactPhone: string;
  status: 'ACTIVE' | 'QUALIFIED' | 'PROBATION';
  tenantId: string;
  organizationId: string;
  companyId: string;
  syntheticData: true;
  environment: 'DEMO';
  generationBatchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyntheticCustomer {
  id: string;
  name: string;
  industry: string;
  tier: 'Strategic' | 'Enterprise' | 'Standard';
  country: string;
  creditLimit: number;
  paymentTerms: string;
  status: 'ACTIVE' | 'CREDIT_HOLD' | 'PROSPECT';
  tenantId: string;
  organizationId: string;
  syntheticData: true;
  environment: 'DEMO';
  generationBatchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyntheticProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  unitCost: number;
  sellingPrice: number;
  safetyStock: number;
  reorderPoint: number;
  leadTimeDays: number;
  supplierId: string;
  abcClass: 'A' | 'B' | 'C';
  unitOfMeasure: 'EA' | 'KG' | 'BOX' | 'PALLET';
  tenantId: string;
  organizationId: string;
  syntheticData: true;
  environment: 'DEMO';
  generationBatchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyntheticWarehouse {
  id: string;
  name: string;
  location: string;
  country: string;
  capacityUtilization: number;
  totalCapacitySqFt: number;
  tenantId: string;
  organizationId: string;
  syntheticData: true;
  environment: 'DEMO';
  generationBatchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyntheticPurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  totalAmount: number;
  currency: string;
  status: 'DRAFT' | 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';
  items: Array<{
    sku: string;
    productName: string;
    orderedQty: number;
    unitPrice: number;
    totalPrice: number;
    receivedQty: number;
  }>;
  tenantId: string;
  organizationId: string;
  syntheticData: true;
  environment: 'DEMO';
  generationBatchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyntheticShipment {
  id: string;
  trackingNumber: string;
  poId: string;
  origin: string;
  destination: string;
  carrier: string;
  shippingMode: 'OCEAN' | 'AIR' | 'ROAD' | 'RAIL';
  status: 'DISPATCHED' | 'IN_TRANSIT' | 'CUSTOMS_HOLD' | 'DELIVERED';
  eta: string;
  shippedDate: string;
  asnQuantity: number;
  currentLocation: string;
  tenantId: string;
  organizationId: string;
  syntheticData: true;
  environment: 'DEMO';
  generationBatchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyntheticInventoryItem {
  id: string;
  sku: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  quantityOnHand: number;
  quantityAvailable: number;
  quantityReserved: number;
  safetyStock: number;
  reorderPoint: number;
  valuation: number;
  tenantId: string;
  organizationId: string;
  syntheticData: true;
  environment: 'DEMO';
  generationBatchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyntheticInvoice {
  id: string;
  invoiceNumber: string;
  poId: string;
  supplierId: string;
  amount: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'MATCHED' | 'PAID' | 'DISPUTED';
  matchStatus: '3_WAY_MATCHED' | 'PRICE_VARIANCE' | 'QTY_VARIANCE';
  tenantId: string;
  organizationId: string;
  syntheticData: true;
  environment: 'DEMO';
  generationBatchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyntheticContract {
  id: string;
  contractNumber: string;
  supplierId: string;
  supplierName: string;
  startDate: string;
  endDate: string;
  slaOnTimeTarget: number;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
  tenantId: string;
  organizationId: string;
  syntheticData: true;
  environment: 'DEMO';
  generationBatchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyntheticException {
  id: string;
  title: string;
  description: string;
  category: 'SUPPLIER_DELAY' | 'INVENTORY_SHORTAGE' | 'QUALITY_DEFECT' | 'INVOICE_MISMATCH' | 'TRANSPORT_DISRUPTION';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Investigating' | 'Resolved' | 'Ignored';
  relatedEntityId: string;
  relatedEntityType: 'PURCHASE_ORDER' | 'SHIPMENT' | 'INVENTORY' | 'INVOICE';
  recommendedAction: string;
  tenantId: string;
  organizationId: string;
  syntheticData: true;
  environment: 'DEMO';
  generationBatchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyntheticSignal {
  id: string;
  signalType: 'WEATHER_ALERT' | 'PORT_CONGESTION' | 'DEMAND_SURGE' | 'SUPPLIER_CREDIT_DOWNSHIFT' | 'CARRIER_CAPACITY_ALERT' | 'GEOPOLITICAL_RISK';
  impactScore: number;
  confidence: number;
  source: 'AI_SYNTHETIC_SENSING_ENGINE';
  description: string;
  tenantId: string;
  organizationId: string;
  syntheticData: true;
  environment: 'DEMO';
  generationBatchId: string;
  timestamp: string;
}

export interface BatchDiversityMetrics {
  uniqueIndustries: number;
  uniqueCities: number;
  uniqueCarriers: number;
  shippingModeBreakdown: Record<'OCEAN' | 'AIR' | 'ROAD' | 'RAIL', number>;
  scenarioBreakdown: Record<string, number>;
  averageSupplierRating: number;
  diversityScore: number;
}

export interface GenerationBatchAudit {
  generationBatchId: string;
  environment: 'DEMO';
  generatedBy: string;
  generatorVersion: string;
  packageCount: number;
  recordCounts: {
    companies: number;
    suppliers: number;
    customers: number;
    products: number;
    warehouses: number;
    purchaseOrders: number;
    shipments: number;
    inventoryItems: number;
    invoices: number;
    exceptions: number;
    signals: number;
  };
  diversityMetrics?: BatchDiversityMetrics;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  errors: string[];
  status: 'COMPLETED' | 'FAILED';
}

// ---------------------------------------------------------------------------
// DETERMINISTIC PSEUDO-RANDOM NUMBER GENERATOR (Mulberry32 + FNV-1a)
// ---------------------------------------------------------------------------

export class SeededPRNG {
  private state: number;

  constructor(seed: number | string) {
    if (typeof seed === 'string') {
      this.state = SeededPRNG.hashString(seed);
    } else {
      this.state = (seed >>> 0) || 1;
    }
    // Warm up
    this.next();
    this.next();
  }

  public static hashString(str: string): number {
    let hash = 0x811c9dc5; // 32-bit FNV-1a offset basis
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193); // 32-bit FNV-1a prime
    }
    return (hash >>> 0) || 1;
  }

  public next(): number {
    let t = (this.state += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  public nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  public boolean(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  public pick<T>(array: readonly T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }

  public pickUnique<T>(array: readonly T[], count: number): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  public fork(offset: number): SeededPRNG {
    const combinedSeed = (this.state ^ Math.imul((offset + 1) >>> 0, 0x9E3779B9)) >>> 0;
    return new SeededPRNG(combinedSeed);
  }
}

// ---------------------------------------------------------------------------
// Realistic Global Catalogs for Enterprise SCM Simulation
// ---------------------------------------------------------------------------

export const COMPANY_PREFIXES = [
  'NovaCore', 'Vertex', 'BlueOrbit', 'Aether', 'OmniTech', 'Apex', 'Solaria',
  'Quantix', 'Helios', 'Synapse', 'Cobalt', 'Strata', 'Pinnacle', 'TerraFlow',
  'Vector', 'Kinetic', 'Lumina', 'Zenith', 'AeroDynamics', 'BioMatrix',
  'Hyperion', 'Prism', 'CryoTech', 'Nexus', 'Optima', 'Vanguard', 'Celestia',
  'Titan', 'Astral', 'Meridian', 'Polaris', 'Axiom', 'Catalyst', 'Equinox',
  'Frontier', 'Genesis', 'Horizon', 'Infinitum', 'Krypton', 'Matrix',
  'Neutron', 'Omega', 'Pulse', 'Quantum', 'Radiant', 'Spectra', 'Triton',
  'Vortex', 'Zephyr', 'SynapSys', 'IonSphere', 'AeroPulse', 'CryoCore'
] as const;

export const COMPANY_SUFFIXES = [
  'Systems Corp', 'Industries Ltd', 'Manufacturing AG', 'Technologies Inc',
  'Solutions LLC', 'Dynamics Global', 'Precision Components', 'Logistics Network',
  'Microelectronics', 'Advanced Materials', 'Heavy Engineering', 'Automation Group',
  'Aerospace SAS', 'Holdings SE', 'Robotics Oy', 'Instruments SpA', 'Electronics BV',
  'Supply Chain Solutions', 'Industrial Systems', 'Semiconductors K.K.', 'Fab & Foundry',
  'Energy Storage Solutions', 'Biotech Labs', 'Power Systems', 'Optics GmbH'
] as const;

export const INDUSTRIES = [
  'Semiconductors & Microelectronics',
  'Aerospace & Defense Avionics',
  'Renewable Energy & Battery Storage',
  'Precision Medical Devices',
  'Industrial Robotics & Automation',
  'Automotive EV Powertrain',
  'Advanced Specialty Polymers',
  'Telecom Optical Transceivers',
  'Pharmaceuticals & Biologics',
  'Heavy Machinery & Earthmoving',
  'Consumer Electronics & IoT',
  'Marine & Naval Engineering',
  'Agritech & Precision Farming',
  'Quantum Computing Hardware',
  'Defense & Tactical Systems',
  'CleanTech & Carbon Capture'
] as const;

export interface GlobalCityEntry {
  city: string;
  country: string;
  region: 'AMER' | 'EMEA' | 'APAC' | 'MEA';
  currency: string;
  tz: string;
}

export const GLOBAL_CITIES: readonly GlobalCityEntry[] = [
  // APAC
  { city: 'Taipei', country: 'Taiwan', region: 'APAC', currency: 'USD', tz: 'Asia/Taipei' },
  { city: 'Singapore', country: 'Singapore', region: 'APAC', currency: 'USD', tz: 'Asia/Singapore' },
  { city: 'Yokohama', country: 'Japan', region: 'APAC', currency: 'JPY', tz: 'Asia/Tokyo' },
  { city: 'Tokyo', country: 'Japan', region: 'APAC', currency: 'JPY', tz: 'Asia/Tokyo' },
  { city: 'Osaka', country: 'Japan', region: 'APAC', currency: 'JPY', tz: 'Asia/Tokyo' },
  { city: 'Incheon', country: 'South Korea', region: 'APAC', currency: 'KRW', tz: 'Asia/Seoul' },
  { city: 'Busan', country: 'South Korea', region: 'APAC', currency: 'KRW', tz: 'Asia/Seoul' },
  { city: 'Penang', country: 'Malaysia', region: 'APAC', currency: 'USD', tz: 'Asia/Kuala_Lumpur' },
  { city: 'Shenzhen', country: 'China', region: 'APAC', currency: 'USD', tz: 'Asia/Shanghai' },
  { city: 'Shanghai', country: 'China', region: 'APAC', currency: 'USD', tz: 'Asia/Shanghai' },
  { city: 'Bengaluru', country: 'India', region: 'APAC', currency: 'INR', tz: 'Asia/Kolkata' },
  { city: 'Chennai', country: 'India', region: 'APAC', currency: 'INR', tz: 'Asia/Kolkata' },
  { city: 'Sydney', country: 'Australia', region: 'APAC', currency: 'AUD', tz: 'Australia/Sydney' },
  { city: 'Melbourne', country: 'Australia', region: 'APAC', currency: 'AUD', tz: 'Australia/Melbourne' },
  { city: 'Auckland', country: 'New Zealand', region: 'APAC', currency: 'NZD', tz: 'Pacific/Auckland' },
  { city: 'Kaohsiung', country: 'Taiwan', region: 'APAC', currency: 'USD', tz: 'Asia/Taipei' },
  { city: 'Ho Chi Minh City', country: 'Vietnam', region: 'APAC', currency: 'USD', tz: 'Asia/Ho_Chi_Minh' },

  // EMEA
  { city: 'Munich', country: 'Germany', region: 'EMEA', currency: 'EUR', tz: 'Europe/Berlin' },
  { city: 'Frankfurt', country: 'Germany', region: 'EMEA', currency: 'EUR', tz: 'Europe/Berlin' },
  { city: 'Hamburg', country: 'Germany', region: 'EMEA', currency: 'EUR', tz: 'Europe/Berlin' },
  { city: 'Rotterdam', country: 'Netherlands', region: 'EMEA', currency: 'EUR', tz: 'Europe/Amsterdam' },
  { city: 'Amsterdam', country: 'Netherlands', region: 'EMEA', currency: 'EUR', tz: 'Europe/Amsterdam' },
  { city: 'Gothenburg', country: 'Sweden', region: 'EMEA', currency: 'SEK', tz: 'Europe/Stockholm' },
  { city: 'Stockholm', country: 'Sweden', region: 'EMEA', currency: 'SEK', tz: 'Europe/Stockholm' },
  { city: 'Zurich', country: 'Switzerland', region: 'EMEA', currency: 'CHF', tz: 'Europe/Zurich' },
  { city: 'Basel', country: 'Switzerland', region: 'EMEA', currency: 'CHF', tz: 'Europe/Zurich' },
  { city: 'Lyon', country: 'France', region: 'EMEA', currency: 'EUR', tz: 'Europe/Paris' },
  { city: 'Toulouse', country: 'France', region: 'EMEA', currency: 'EUR', tz: 'Europe/Paris' },
  { city: 'Milan', country: 'Italy', region: 'EMEA', currency: 'EUR', tz: 'Europe/Rome' },
  { city: 'Antwerp', country: 'Belgium', region: 'EMEA', currency: 'EUR', tz: 'Europe/Brussels' },
  { city: 'London', country: 'United Kingdom', region: 'EMEA', currency: 'GBP', tz: 'Europe/London' },
  { city: 'Dublin', country: 'Ireland', region: 'EMEA', currency: 'EUR', tz: 'Europe/Dublin' },
  { city: 'Warsaw', country: 'Poland', region: 'EMEA', currency: 'EUR', tz: 'Europe/Warsaw' },
  { city: 'Helsinki', country: 'Finland', region: 'EMEA', currency: 'EUR', tz: 'Europe/Helsinki' },

  // AMER
  { city: 'Austin', country: 'USA', region: 'AMER', currency: 'USD', tz: 'America/Chicago' },
  { city: 'Seattle', country: 'USA', region: 'AMER', currency: 'USD', tz: 'America/Los_Angeles' },
  { city: 'San Jose', country: 'USA', region: 'AMER', currency: 'USD', tz: 'America/Los_Angeles' },
  { city: 'Chicago', country: 'USA', region: 'AMER', currency: 'USD', tz: 'America/Chicago' },
  { city: 'Atlanta', country: 'USA', region: 'AMER', currency: 'USD', tz: 'America/New_York' },
  { city: 'Toronto', country: 'Canada', region: 'AMER', currency: 'CAD', tz: 'America/Toronto' },
  { city: 'Vancouver', country: 'Canada', region: 'AMER', currency: 'CAD', tz: 'America/Vancouver' },
  { city: 'Montreal', country: 'Canada', region: 'AMER', currency: 'CAD', tz: 'America/Montreal' },
  { city: 'Querétaro', country: 'Mexico', region: 'AMER', currency: 'USD', tz: 'America/Mexico_City' },
  { city: 'Monterrey', country: 'Mexico', region: 'AMER', currency: 'USD', tz: 'America/Monterrey' },
  { city: 'São Paulo', country: 'Brazil', region: 'AMER', currency: 'USD', tz: 'America/Sao_Paulo' },
  { city: 'Santiago', country: 'Chile', region: 'AMER', currency: 'USD', tz: 'America/Santiago' },

  // MEA
  { city: 'Dubai', country: 'UAE', region: 'MEA', currency: 'USD', tz: 'Asia/Dubai' },
  { city: 'Abu Dhabi', country: 'UAE', region: 'MEA', currency: 'USD', tz: 'Asia/Dubai' },
  { city: 'Riyadh', country: 'Saudi Arabia', region: 'MEA', currency: 'USD', tz: 'Asia/Riyadh' },
  { city: 'Tel Aviv', country: 'Israel', region: 'MEA', currency: 'USD', tz: 'Asia/Jerusalem' },
  { city: 'Johannesburg', country: 'South Africa', region: 'MEA', currency: 'ZAR', tz: 'Africa/Johannesburg' },
] as const;

export const PRODUCT_TEMPLATES = [
  { name: 'Neural Processing Accelerator ASIC', category: 'Microchips', baseCost: 380, basePrice: 750, abc: 'A' as const },
  { name: 'Ultra-High Purity Silicon Ingot 300mm', category: 'Raw Materials', baseCost: 1100, basePrice: 2200, abc: 'A' as const },
  { name: 'Brushless Servomotor with Optical Encoder', category: 'Actuators', baseCost: 240, basePrice: 490, abc: 'B' as const },
  { name: 'Titanium-Aerogel Thermal Insulator Shell', category: 'Enclosures', baseCost: 95, basePrice: 210, abc: 'B' as const },
  { name: 'Dielectric Liquid Coolant Fluid 20L', category: 'Consumables', baseCost: 45, basePrice: 98, abc: 'C' as const },
  { name: 'Hermetic Ceramic Relay 400V 50A', category: 'Passives', baseCost: 28, basePrice: 65, abc: 'C' as const },
  { name: 'Optoelectronic Transceiver Module 800Gbps', category: 'Networking', baseCost: 620, basePrice: 1250, abc: 'A' as const },
  { name: 'Precision Ground Ball Screw Assembly', category: 'Mechanics', baseCost: 180, basePrice: 390, abc: 'B' as const },
  { name: 'Ultra-Low Power RISC-V Embedded SoC', category: 'Microchips', baseCost: 145, basePrice: 295, abc: 'B' as const },
  { name: 'Aerospace-Grade Titanium Billet Ti-6Al-4V', category: 'Raw Materials', baseCost: 850, basePrice: 1750, abc: 'A' as const },
  { name: 'Harmonic Drive Strain Wave Reducer', category: 'Actuators', baseCost: 520, basePrice: 1050, abc: 'A' as const },
  { name: 'Vapor Chamber Heat Dissipation Core', category: 'Enclosures', baseCost: 65, basePrice: 145, abc: 'C' as const },
  { name: 'High-Temperature Silicon Carbide MOSFET Module', category: 'Power Electronics', baseCost: 310, basePrice: 680, abc: 'A' as const },
  { name: 'Single-Mode Erbium-Doped Fiber Amplifier', category: 'Networking', baseCost: 940, basePrice: 1980, abc: 'A' as const },
  { name: '48V Solid-State Battery Module 5kWh', category: 'Energy Storage', baseCost: 780, basePrice: 1600, abc: 'A' as const },
  { name: 'Bi-Directional SiC Power Inverter 100kW', category: 'Power Electronics', baseCost: 1250, basePrice: 2600, abc: 'A' as const },
  { name: 'Microfluidic Biosensor Cartridge Matrix', category: 'Diagnostics', baseCost: 120, basePrice: 280, abc: 'B' as const },
  { name: '6-Axis Robotic Arm Wrist Articulator', category: 'Robotics', baseCost: 1450, basePrice: 3100, abc: 'A' as const },
  { name: 'Industrial Solid-State LiDAR Scanner IP67', category: 'Sensors', baseCost: 480, basePrice: 990, abc: 'B' as const },
  { name: 'Cryogenic Precision Valve Assembly DN25', category: 'Fluid Dynamics', baseCost: 360, basePrice: 790, abc: 'B' as const }
] as const;

export const CARRIERS_BY_MODE = {
  OCEAN: [
    'Maersk Line', 'MSC Mediterranean', 'CMA CGM Group', 'Hapag-Lloyd',
    'COSCO Shipping', 'Ocean Network Express (ONE)', 'Evergreen Marine'
  ],
  AIR: [
    'Lufthansa Cargo', 'Cathay Cargo', 'Singapore Airlines Cargo',
    'Emirates SkyCargo', 'FedEx Express Freight', 'DHL Aviation', 'Korean Air Cargo'
  ],
  ROAD: [
    'DB Schenker Road', 'DSV Road Logistics', 'XPO Logistics',
    'Knight-Swift Transportation', 'Schneider National', 'J.B. Hunt Transport', 'Dachser European Logistics'
  ],
  RAIL: [
    'BNSF Logistics', 'Union Pacific Rail', 'DB Cargo AG',
    'PKP Cargo Logistics', 'China Railway Express Eurasian', 'Canadian National Railway'
  ]
} as const;

export class DemoSyntheticDataEngine {
  private static instance: DemoSyntheticDataEngine;
  private batchHistory: GenerationBatchAudit[] = [];
  private executedBatchIds: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): DemoSyntheticDataEngine {
    if (!DemoSyntheticDataEngine.instance) {
      DemoSyntheticDataEngine.instance = new DemoSyntheticDataEngine();
    }
    return DemoSyntheticDataEngine.instance;
  }

  /**
   * Generates exactly 30 complete synthetic enterprise packages per hourly batch.
   * Default package count is 30 complete business ecosystems with guaranteed true data diversity.
   */
  public async generateEnterpriseBatch(
    targetPackageCount: number = DEMO_PACKAGES_PER_HOUR,
    customBatchId?: string,
    targetTenant: string = 'DEMO_TENANT_ORION',
    targetOrg: string = 'DEMO_ORG_GLOBAL'
  ): Promise<GenerationBatchAudit> {
    const startTime = performance.now();
    const startedAt = new Date().toISOString();

    // 1. HARD ENVIRONMENT GUARD
    const activeEnv = dbManager.getEnvironment();
    if (activeEnv !== 'DEMO') {
      const err = `[DEMO-ENGINE-GUARD] Access Denied: Synthetic Data Engine cannot execute in ${activeEnv} mode. Only DEMO mode is permitted.`;
      console.error(err);
      throw new Error(err);
    }

    // 2. IDEMPOTENCY IDENTIFIER
    const now = new Date();
    const isoHour = now.toISOString().substring(0, 13).replace(/[-:]/g, '');
    const generationBatchId = customBatchId || `DEMO-${isoHour}00Z-BATCH`;

    if (this.executedBatchIds.has(generationBatchId)) {
      console.warn(`[DEMO-ENGINE] Batch ${generationBatchId} was already executed. Skipping duplicate invocation.`);
      const existing = this.batchHistory.find(b => b.generationBatchId === generationBatchId);
      if (existing) return existing;
    }

    const firestore = dbManager.getFirestore('DEMO');
    const errors: string[] = [];

    const recordCounts = {
      companies: 0,
      suppliers: 0,
      customers: 0,
      products: 0,
      warehouses: 0,
      purchaseOrders: 0,
      shipments: 0,
      inventoryItems: 0,
      invoices: 0,
      exceptions: 0,
      signals: 0,
    };

    const packages: SyntheticCompanyPackage[] = [];

    // Master seeded PRNG for the batch
    const batchSeedStr = `${generationBatchId}:${targetTenant}:${targetOrg}`;
    const batchPrng = new SeededPRNG(batchSeedStr);

    // 3. GENERATE TARGET NUMBER OF COMPLETE ENTERPRISE PACKAGES (EXACTLY 30)
    for (let i = 0; i < targetPackageCount; i++) {
      const pkgPrng = batchPrng.fork(i);
      const pkg = this.generateSingleEnterprisePackage(
        i,
        generationBatchId,
        targetTenant,
        targetOrg,
        now,
        pkgPrng
      );
      packages.push(pkg);

      recordCounts.companies += 1;
      recordCounts.suppliers += pkg.suppliers.length;
      recordCounts.customers += pkg.customers.length;
      recordCounts.products += pkg.products.length;
      recordCounts.warehouses += pkg.warehouses.length;
      recordCounts.purchaseOrders += pkg.purchaseOrders.length;
      recordCounts.shipments += pkg.shipments.length;
      recordCounts.inventoryItems += pkg.inventoryItems.length;
      recordCounts.invoices += pkg.invoices.length;
      recordCounts.exceptions += pkg.exceptions.length;
      recordCounts.signals += pkg.signals.length;
    }

    // Compute Diagnostic Diversity Metrics
    const uniqueIndustries = new Set(packages.map(p => p.company.industry)).size;
    const uniqueCities = new Set(packages.flatMap(p => [p.company.city, ...p.suppliers.map(s => s.city)])).size;
    const uniqueCarriers = new Set(packages.flatMap(p => p.shipments.map(s => s.carrier))).size;

    const shippingModeBreakdown: Record<'OCEAN' | 'AIR' | 'ROAD' | 'RAIL', number> = {
      OCEAN: 0,
      AIR: 0,
      ROAD: 0,
      RAIL: 0,
    };
    for (const pkg of packages) {
      for (const shp of pkg.shipments) {
        shippingModeBreakdown[shp.shippingMode] = (shippingModeBreakdown[shp.shippingMode] || 0) + 1;
      }
    }

    const scenarioBreakdown: Record<string, number> = {};
    for (const pkg of packages) {
      scenarioBreakdown[pkg.scenario] = (scenarioBreakdown[pkg.scenario] || 0) + 1;
    }

    const allRatings = packages.flatMap(p => p.suppliers.map(s => s.rating));
    const averageSupplierRating = allRatings.length > 0
      ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10
      : 85.0;

    // Diversity score: normalized metric in [0, 1] factoring distinct industries, cities, and carriers
    const targetExpectedIndustries = Math.min(14, targetPackageCount);
    const targetExpectedCities = Math.min(25, targetPackageCount * 2);
    const targetExpectedCarriers = Math.min(12, targetPackageCount);

    const industryScore = Math.min(1.0, uniqueIndustries / targetExpectedIndustries);
    const cityScore = Math.min(1.0, uniqueCities / targetExpectedCities);
    const carrierScore = Math.min(1.0, uniqueCarriers / targetExpectedCarriers);
    const diversityScore = Math.round(((industryScore * 0.35) + (cityScore * 0.40) + (carrierScore * 0.25)) * 100) / 100;

    const diversityMetrics: BatchDiversityMetrics = {
      uniqueIndustries,
      uniqueCities,
      uniqueCarriers,
      shippingModeBreakdown,
      scenarioBreakdown,
      averageSupplierRating,
      diversityScore,
    };

    // 4. PERSIST TO DEMO FIRESTORE PROVIDER IN CHUNKS OF <= 250 OPS
    if (firestore) {
      try {
        const writeQueue: Array<{ collection: string; id: string; data: any }> = [];

        for (const pkg of packages) {
          writeQueue.push({ collection: 'companies', id: pkg.company.id, data: pkg.company });
          pkg.suppliers.forEach(s => writeQueue.push({ collection: 'suppliers', id: s.id, data: s }));
          pkg.customers.forEach(c => writeQueue.push({ collection: 'customers', id: c.id, data: c }));
          pkg.products.forEach(p => writeQueue.push({ collection: 'products', id: p.id, data: p }));
          pkg.warehouses.forEach(w => writeQueue.push({ collection: 'warehouses', id: w.id, data: w }));
          pkg.purchaseOrders.forEach(po => writeQueue.push({ collection: 'purchase_orders', id: po.id, data: po }));
          pkg.shipments.forEach(shp => writeQueue.push({ collection: 'shipments', id: shp.id, data: shp }));
          pkg.inventoryItems.forEach(inv => writeQueue.push({ collection: 'inventory', id: inv.id, data: inv }));
          pkg.invoices.forEach(invDoc => writeQueue.push({ collection: 'invoices', id: invDoc.id, data: invDoc }));
          pkg.exceptions.forEach(exc => writeQueue.push({ collection: 'exceptions', id: exc.id, data: exc }));
          pkg.signals.forEach(sig => writeQueue.push({ collection: 'signals', id: sig.id, data: sig }));
        }

        // Commit in chunks of 200 operations
        const chunkSize = 200;
        for (let idx = 0; idx < writeQueue.length; idx += chunkSize) {
          const chunk = writeQueue.slice(idx, idx + chunkSize);
          const batch = writeBatch(firestore);
          for (const item of chunk) {
            const itemRef = doc(firestore, item.collection, item.id);
            batch.set(itemRef, item.data, { merge: true });
          }
          await batch.commit();
        }
      } catch (err: any) {
        console.error('[DEMO-ENGINE] Firestore write error:', err);
        errors.push(err?.message || 'Database write error');
      }
    }

    const durationMs = Math.round(performance.now() - startTime);
    const completedAt = new Date().toISOString();
    const isSuccess = errors.length === 0;

    const audit: GenerationBatchAudit = {
      generationBatchId,
      environment: 'DEMO',
      generatedBy: 'ORION_PERSISTENT_CLOUD_SCHEDULER',
      generatorVersion: '3.0.0',
      packageCount: isSuccess ? targetPackageCount : 0,
      recordCounts: isSuccess ? recordCounts : {
        companies: 0,
        suppliers: 0,
        customers: 0,
        products: 0,
        warehouses: 0,
        purchaseOrders: 0,
        shipments: 0,
        inventoryItems: 0,
        invoices: 0,
        exceptions: 0,
        signals: 0,
      },
      diversityMetrics: isSuccess ? diversityMetrics : undefined,
      startedAt,
      completedAt,
      durationMs,
      errors,
      status: isSuccess ? 'COMPLETED' : 'FAILED',
    };

    // Save batch audit to DEMO Firestore
    if (firestore) {
      try {
        const auditRef = doc(firestore, 'demo_generation_batches', generationBatchId);
        await setDoc(auditRef, audit, { merge: true });
      } catch (e: any) {
        console.error('[DEMO-ENGINE] Firestore batch audit write error:', e);
        errors.push(`Audit write error: ${e?.message}`);
        audit.status = 'FAILED';
        audit.errors = errors;
      }
    }

    if (isSuccess) {
      this.executedBatchIds.add(generationBatchId);
    }
    this.batchHistory.unshift(audit);

    if (this.batchHistory.length > 100) {
      this.batchHistory.pop();
    }

    // Dispatch synthetic generation event for UI live reactive updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('orion:demo-synthetic-batch-generated', {
          detail: audit,
        })
      );
    }

    return audit;
  }

  /**
   * Generates a coherent, relationally connected mini-enterprise ecosystem
   * with true data diversity powered by the deterministic PRNG.
   */
  public generateSingleEnterprisePackage(
    index: number,
    batchId: string,
    tenantId: string,
    organizationId: string,
    baseDate: Date,
    prng: SeededPRNG = new SeededPRNG(`${batchId}:${index}`)
  ): SyntheticCompanyPackage {
    // 1. Scenario Roll
    const scenario = this.pickScenario(prng);

    // 2. Core Company Attributes
    const prefix = prng.pick(COMPANY_PREFIXES);
    const suffix = prng.pick(COMPANY_SUFFIXES);
    const companyName = `${prefix} ${suffix}`;
    const legalName = `${companyName}, Inc.`;
    const location = prng.pick(GLOBAL_CITIES);
    const industry = prng.pick(INDUSTRIES);

    // Batch-scoped unique ID
    const batchHex = SeededPRNG.hashString(`${batchId}:${tenantId}:${index}`).toString(16).substring(0, 4).toUpperCase();
    const pkgCode = `${String(index + 1).padStart(3, '0')}${batchHex}`;
    const companyId = `SYN_COMP_${pkgCode}`;
    const nowIso = baseDate.toISOString();

    // Risk profile derived from scenario
    const riskProfile: SyntheticCompany['riskProfile'] =
      scenario === 'HEALTHY' ? 'LOW' :
      scenario === 'MINOR_DISRUPTION' ? 'MEDIUM' :
      scenario === 'SUPPLIER_RISK' ? 'HIGH' :
      scenario === 'TRANSPORT_DELAY' ? 'MEDIUM' :
      scenario === 'INVENTORY_SHORTAGE' ? 'HIGH' :
      scenario === 'DEMAND_SPIKE' ? 'MEDIUM' : 'CRITICAL';

    const company: SyntheticCompany = {
      id: companyId,
      companyId,
      tenantId,
      organizationId,
      companyName,
      legalName,
      industry,
      country: location.country,
      region: location.region,
      city: location.city,
      currency: location.currency,
      timezone: location.tz,
      taxProfile: `VAT-${location.country.substring(0, 2).toUpperCase()}-${prng.nextInt(100000, 999999)}`,
      paymentTerms: prng.boolean(0.6) ? 'Net 30' : prng.boolean(0.5) ? 'Net 60' : 'Net 45',
      role: 'ENTERPRISE_HUB',
      riskProfile,
      status: 'ACTIVE',
      syntheticData: true,
      environment: 'DEMO',
      generationBatchId: batchId,
      createdAt: nowIso,
      updatedAt: nowIso,
      generatedAt: nowIso,
    };

    // 3. Suppliers (2 to 3 suppliers per company)
    const suppliers: SyntheticSupplier[] = [];
    const supplierCount = prng.nextInt(2, 3);
    const supCities = prng.pickUnique(GLOBAL_CITIES, supplierCount);
    const supPrefixes = prng.pickUnique(COMPANY_PREFIXES, supplierCount);

    for (let s = 0; s < supplierCount; s++) {
      const supLoc = supCities[s];
      const supPrefix = supPrefixes[s];
      const supName = `${supPrefix} ${industry.split(' ')[0]} Technologies`;
      const supId = `SYN_SUP_${pkgCode}_${s + 1}`;

      // Scenario-affected supplier metrics
      let rating = Math.round(prng.nextFloat(85, 98) * 10) / 10;
      let onTimeDeliveryRate = Math.round(prng.nextFloat(88, 99) * 10) / 10;
      let leadTimeDays = prng.nextInt(7, 24);

      if (scenario === 'SUPPLIER_RISK' && s === 0) {
        rating = Math.round(prng.nextFloat(65, 76) * 10) / 10;
        onTimeDeliveryRate = Math.round(prng.nextFloat(68, 78) * 10) / 10;
        leadTimeDays = prng.nextInt(28, 48);
      }

      suppliers.push({
        id: supId,
        name: supName,
        legalName: `${supName} Pte Ltd`,
        category: industry,
        tier: s === 0 ? 'Tier 1' : s === 1 ? 'Tier 2' : 'Tier 3',
        country: supLoc.country,
        city: supLoc.city,
        rating,
        onTimeDeliveryRate,
        leadTimeDays,
        contactEmail: `procurement@${supPrefix.toLowerCase()}synth.com`,
        contactPhone: `+1-${prng.nextInt(200, 899)}-${prng.nextInt(100, 999)}-${prng.nextInt(1000, 9999)}`,
        status: (scenario === 'SUPPLIER_RISK' && s === 0) ? 'PROBATION' : 'ACTIVE',
        tenantId,
        organizationId,
        companyId,
        syntheticData: true,
        environment: 'DEMO',
        generationBatchId: batchId,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }

    // 4. Customers (1 to 2 customers)
    const customerCount = prng.nextInt(1, 2);
    const custPrefixes = prng.pickUnique(COMPANY_PREFIXES, customerCount);
    const customers: SyntheticCustomer[] = [];

    for (let c = 0; c < customerCount; c++) {
      const custPrefix = custPrefixes[c];
      const custId = `SYN_CUST_${pkgCode}_${String(c + 1).padStart(2, '0')}`;
      const creditLimit = (scenario === 'DEMAND_SPIKE' ? 750000 : 250000) + prng.nextInt(50000, 250000);

      customers.push({
        id: custId,
        name: `${custPrefix} Global Operations`,
        industry,
        tier: c === 0 ? 'Strategic' : 'Enterprise',
        country: location.country,
        creditLimit,
        paymentTerms: 'Net 45',
        status: 'ACTIVE',
        tenantId,
        organizationId,
        syntheticData: true,
        environment: 'DEMO',
        generationBatchId: batchId,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }

    // 5. Products & SKUs (3 to 5 products)
    const productCount = prng.nextInt(3, 5);
    const selectedTemplates = prng.pickUnique(PRODUCT_TEMPLATES, productCount);
    const products: SyntheticProduct[] = [];

    for (let p = 0; p < productCount; p++) {
      const template = selectedTemplates[p];
      const sku = `SYN-SKU-${pkgCode}-${String(p + 1).padStart(3, '0')}`;
      const assignedSupplier = suppliers[p % suppliers.length];

      // Add realistic natural variance to pricing
      const costVariance = prng.nextFloat(0.92, 1.08);
      const unitCost = Math.round(template.baseCost * costVariance);
      const sellingPrice = Math.round(template.basePrice * costVariance);

      const safetyStock = prng.nextInt(100, 350);
      const reorderPoint = safetyStock + prng.nextInt(120, 280);

      products.push({
        id: sku,
        sku,
        name: `${prefix} ${template.name}`,
        category: template.category,
        unitCost,
        sellingPrice,
        safetyStock,
        reorderPoint,
        leadTimeDays: assignedSupplier.leadTimeDays,
        supplierId: assignedSupplier.id,
        abcClass: template.abc,
        unitOfMeasure: 'EA',
        tenantId,
        organizationId,
        syntheticData: true,
        environment: 'DEMO',
        generationBatchId: batchId,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }

    // 6. Warehouse
    const warehouses: SyntheticWarehouse[] = [
      {
        id: `SYN_WH_${pkgCode}`,
        name: `${prefix} ${location.city} Logistics Hub`,
        location: `${location.city}, ${location.country}`,
        country: location.country,
        capacityUtilization: Math.round(prng.nextFloat(60, 92) * 10) / 10,
        totalCapacitySqFt: prng.nextInt(200000, 600000),
        tenantId,
        organizationId,
        syntheticData: true,
        environment: 'DEMO',
        generationBatchId: batchId,
        createdAt: nowIso,
        updatedAt: nowIso,
      }
    ];

    // 7. Purchase Orders, Shipments, Inventory, Invoices, Exceptions, Signals
    const purchaseOrders: SyntheticPurchaseOrder[] = [];
    const shipments: SyntheticShipment[] = [];
    const inventoryItems: SyntheticInventoryItem[] = [];
    const invoices: SyntheticInvoice[] = [];
    const exceptions: SyntheticException[] = [];
    const signals: SyntheticSignal[] = [];

    for (let i = 0; i < products.length; i++) {
      const prod = products[i];
      const sup = suppliers.find(s => s.id === prod.supplierId) || suppliers[0];
      const poQty = (scenario === 'DEMAND_SPIKE' ? 800 : 350) + prng.nextInt(50, 250);
      const poNum = `PO-SYN-${pkgCode}-${String(i + 1).padStart(3, '0')}`;
      const totalAmount = poQty * prod.unitCost;

      // Lifecycle status based on scenario
      let isShipped = true;
      let isReceived = false;

      if (scenario === 'HEALTHY') {
        isReceived = prng.boolean(0.5);
      } else if (scenario === 'SUPPLIER_RISK' && i === 0) {
        isShipped = false; // Delayed at supplier
      } else if (scenario === 'TRANSPORT_DELAY' && i === 0) {
        isShipped = true;
        isReceived = false;
      } else {
        isShipped = prng.boolean(0.75);
        isReceived = isShipped && prng.boolean(0.4);
      }

      const poStatus = isReceived ? 'RECEIVED' : isShipped ? 'IN_TRANSIT' : 'APPROVED';
      const orderDateOffset = prng.nextInt(5, 25);
      const orderDate = new Date(baseDate.getTime() - 86400000 * orderDateOffset).toISOString();
      const expectedDeliveryDate = new Date(baseDate.getTime() + 86400000 * prng.nextInt(3, 14)).toISOString();

      const po: SyntheticPurchaseOrder = {
        id: poNum,
        poNumber: poNum,
        supplierId: sup.id,
        supplierName: sup.name,
        orderDate,
        expectedDeliveryDate,
        totalAmount,
        currency: location.currency,
        status: poStatus,
        items: [
          {
            sku: prod.sku,
            productName: prod.name,
            orderedQty: poQty,
            unitPrice: prod.unitCost,
            totalPrice: totalAmount,
            receivedQty: isReceived ? poQty : 0,
          }
        ],
        tenantId,
        organizationId,
        syntheticData: true,
        environment: 'DEMO',
        generationBatchId: batchId,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      purchaseOrders.push(po);

      // 8. Connected Shipment
      if (isShipped) {
        const shippingMode = this.pickShippingMode(prng);
        const carrier = this.pickCarrier(shippingMode, prng);
        const isDelayed = (scenario === 'TRANSPORT_DELAY' && i === 0) || (scenario === 'MINOR_DISRUPTION' && prng.boolean(0.3));
        const shpId = `SHP-SYN-${pkgCode}-${String(i + 1).padStart(3, '0')}`;
        const trackingNum = `TRK-SYN-${prng.nextInt(1000000, 9999999)}`;

        const eta = new Date(baseDate.getTime() + (isDelayed ? 86400000 * 14 : 86400000 * 4)).toISOString();
        const shippedDate = new Date(baseDate.getTime() - 86400000 * prng.nextInt(2, 6)).toISOString();

        const shipmentStatus = isReceived ? 'DELIVERED' : isDelayed ? 'CUSTOMS_HOLD' : 'IN_TRANSIT';
        const currentLocation = isDelayed
          ? `Customs Port of ${location.city}`
          : isReceived
          ? warehouses[0].location
          : `In Transit via Hub (${shippingMode})`;

        const shp: SyntheticShipment = {
          id: shpId,
          trackingNumber: trackingNum,
          poId: po.id,
          origin: `${sup.city}, ${sup.country}`,
          destination: warehouses[0].location,
          carrier,
          shippingMode,
          status: shipmentStatus,
          eta,
          shippedDate,
          asnQuantity: poQty,
          currentLocation,
          tenantId,
          organizationId,
          syntheticData: true,
          environment: 'DEMO',
          generationBatchId: batchId,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        shipments.push(shp);

        // Correlated Exception if transport delayed
        if (isDelayed) {
          exceptions.push({
            id: `EXC-SYN-${pkgCode}-${String(exceptions.length + 1).padStart(3, '0')}`,
            title: `Transport Bottleneck / Customs Hold on ${shp.trackingNumber}`,
            description: `Shipment ${shp.id} carrying ${poQty} units of ${prod.name} held for regulatory inspection or transport delay at ${shp.currentLocation}.`,
            category: 'TRANSPORT_DISRUPTION',
            severity: scenario === 'TRANSPORT_DELAY' ? 'High' : 'Medium',
            status: 'Open',
            relatedEntityId: shp.id,
            relatedEntityType: 'SHIPMENT',
            recommendedAction: 'Engage priority customs broker or reroute buffer inventory.',
            tenantId,
            organizationId,
            syntheticData: true,
            environment: 'DEMO',
            generationBatchId: batchId,
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        }
      }

      // 9. Reconciled Inventory Position
      let onHand = isReceived ? poQty + prod.safetyStock : prod.safetyStock;
      if (scenario === 'INVENTORY_SHORTAGE' && i === 0) {
        onHand = Math.max(10, Math.floor(prod.safetyStock * 0.25)); // Critically low inventory
      }
      const reserved = Math.floor(onHand * 0.20);

      inventoryItems.push({
        id: `INV-${prod.sku}-${warehouses[0].id}`,
        sku: prod.sku,
        productName: prod.name,
        warehouseId: warehouses[0].id,
        warehouseName: warehouses[0].name,
        quantityOnHand: onHand,
        quantityAvailable: onHand - reserved,
        quantityReserved: reserved,
        safetyStock: prod.safetyStock,
        reorderPoint: prod.reorderPoint,
        valuation: onHand * prod.unitCost,
        tenantId,
        organizationId,
        syntheticData: true,
        environment: 'DEMO',
        generationBatchId: batchId,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      // Inventory Shortage Exception
      if (scenario === 'INVENTORY_SHORTAGE' && i === 0) {
        exceptions.push({
          id: `EXC-SYN-${pkgCode}-${String(exceptions.length + 1).padStart(3, '0')}`,
          title: `Stockout Threat: ${prod.name}`,
          description: `Current on-hand stock (${onHand}) is well below safety buffer (${prod.safetyStock}) at ${warehouses[0].name}.`,
          category: 'INVENTORY_SHORTAGE',
          severity: 'Critical',
          status: 'Open',
          relatedEntityId: `INV-${prod.sku}-${warehouses[0].id}`,
          relatedEntityType: 'INVENTORY',
          recommendedAction: 'Trigger expedited replenishment purchase order from qualified secondary supplier.',
          tenantId,
          organizationId,
          syntheticData: true,
          environment: 'DEMO',
          generationBatchId: batchId,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      }

      // 10. Invoices
      if (isReceived) {
        const hasVariance = scenario === 'QUALITY_ISSUE' && i === 0;
        invoices.push({
          id: `INV-DOC-${po.id}`,
          invoiceNumber: `INV-${po.poNumber}`,
          poId: po.id,
          supplierId: sup.id,
          amount: hasVariance ? Math.round(totalAmount * 1.15) : totalAmount,
          status: hasVariance ? 'DISPUTED' : 'MATCHED',
          matchStatus: hasVariance ? 'PRICE_VARIANCE' : '3_WAY_MATCHED',
          tenantId,
          organizationId,
          syntheticData: true,
          environment: 'DEMO',
          generationBatchId: batchId,
          createdAt: nowIso,
          updatedAt: nowIso,
        });

        if (hasVariance) {
          exceptions.push({
            id: `EXC-SYN-${pkgCode}-${String(exceptions.length + 1).padStart(3, '0')}`,
            title: `3-Way Match Price Variance on ${po.poNumber}`,
            description: `Invoice INV-${po.poNumber} billed amount exceeds agreed purchase order total by 15%.`,
            category: 'INVOICE_MISMATCH',
            severity: 'Medium',
            status: 'Open',
            relatedEntityId: `INV-DOC-${po.id}`,
            relatedEntityType: 'INVOICE',
            recommendedAction: 'Place payment hold on invoice and route variance to procurement manager for review.',
            tenantId,
            organizationId,
            syntheticData: true,
            environment: 'DEMO',
            generationBatchId: batchId,
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        }
      }
    }

    // 11. Supplier Risk Exception if supplier stalled
    if (scenario === 'SUPPLIER_RISK') {
      const targetSup = suppliers[0];
      exceptions.push({
        id: `EXC-SYN-${pkgCode}-${String(exceptions.length + 1).padStart(3, '0')}`,
        title: `Supplier Lead Time Slip: ${targetSup.name}`,
        description: `Primary supplier ${targetSup.name} reported production line bottleneck. Delivery slip risk: 14 days.`,
        category: 'SUPPLIER_DELAY',
        severity: 'High',
        status: 'Open',
        relatedEntityId: targetSup.id,
        relatedEntityType: 'PURCHASE_ORDER',
        recommendedAction: 'Engage alternate Tier 2 supplier to split manufacturing capacity.',
        tenantId,
        organizationId,
        syntheticData: true,
        environment: 'DEMO',
        generationBatchId: batchId,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }

    // 12. Contracts
    const contracts: SyntheticContract[] = [
      {
        id: `CTR-SYN-${pkgCode}-01`,
        contractNumber: `MSA-${prefix.toUpperCase()}-2026`,
        supplierId: suppliers[0].id,
        supplierName: suppliers[0].name,
        startDate: new Date(baseDate.getTime() - 86400000 * 180).toISOString(),
        endDate: new Date(baseDate.getTime() + 86400000 * 180).toISOString(),
        slaOnTimeTarget: 95.0,
        status: 'ACTIVE',
        tenantId,
        organizationId,
        syntheticData: true,
        environment: 'DEMO',
        generationBatchId: batchId,
        createdAt: nowIso,
        updatedAt: nowIso,
      }
    ];

    // 13. Upstream Sensing Signals Correlated with Scenario
    const signalData = this.generateSignalForScenario(scenario, location, prefix, pkgCode, batchId, tenantId, organizationId, nowIso, prng);
    if (signalData) {
      signals.push(signalData);
    }

    return {
      company,
      suppliers,
      customers,
      products,
      warehouses,
      purchaseOrders,
      shipments,
      inventoryItems,
      invoices,
      contracts,
      exceptions,
      signals,
      scenario,
    };
  }

  private pickScenario(prng: SeededPRNG): SyntheticScenarioType {
    const roll = prng.next();
    if (roll < 0.60) return 'HEALTHY';          // 60%
    if (roll < 0.72) return 'MINOR_DISRUPTION';  // 12%
    if (roll < 0.80) return 'SUPPLIER_RISK';    // 8%
    if (roll < 0.88) return 'TRANSPORT_DELAY';   // 8%
    if (roll < 0.93) return 'INVENTORY_SHORTAGE';// 5%
    if (roll < 0.97) return 'DEMAND_SPIKE';      // 4%
    return 'QUALITY_ISSUE';                      // 3%
  }

  private pickShippingMode(prng: SeededPRNG): 'OCEAN' | 'AIR' | 'ROAD' | 'RAIL' {
    const roll = prng.next();
    if (roll < 0.40) return 'OCEAN'; // 40%
    if (roll < 0.70) return 'ROAD';  // 30%
    if (roll < 0.90) return 'AIR';   // 20%
    return 'RAIL';                   // 10%
  }

  private pickCarrier(mode: 'OCEAN' | 'AIR' | 'ROAD' | 'RAIL', prng: SeededPRNG): string {
    const pool = CARRIERS_BY_MODE[mode];
    return prng.pick(pool);
  }

  private generateSignalForScenario(
    scenario: SyntheticScenarioType,
    location: GlobalCityEntry,
    prefix: string,
    pkgCode: string,
    batchId: string,
    tenantId: string,
    organizationId: string,
    nowIso: string,
    prng: SeededPRNG
  ): SyntheticSignal | null {
    const sigId = `SIG-SYN-${pkgCode}-01`;

    switch (scenario) {
      case 'TRANSPORT_DELAY':
        return {
          id: sigId,
          signalType: prng.boolean(0.5) ? 'PORT_CONGESTION' : 'WEATHER_ALERT',
          impactScore: prng.nextInt(65, 88),
          confidence: Math.round(prng.nextFloat(0.85, 0.96) * 100) / 100,
          source: 'AI_SYNTHETIC_SENSING_ENGINE',
          description: `Maritime port congestion and severe customs queue reported at ${location.city} corridor. Average vessel delay 72 hours.`,
          tenantId,
          organizationId,
          syntheticData: true,
          environment: 'DEMO',
          generationBatchId: batchId,
          timestamp: nowIso,
        };

      case 'SUPPLIER_RISK':
        return {
          id: sigId,
          signalType: 'SUPPLIER_CREDIT_DOWNSHIFT',
          impactScore: prng.nextInt(60, 80),
          confidence: Math.round(prng.nextFloat(0.80, 0.94) * 100) / 100,
          source: 'AI_SYNTHETIC_SENSING_ENGINE',
          description: `Early financial health telemetry indicates liquidity compression for ${prefix} supply chain partners.`,
          tenantId,
          organizationId,
          syntheticData: true,
          environment: 'DEMO',
          generationBatchId: batchId,
          timestamp: nowIso,
        };

      case 'DEMAND_SPIKE':
        return {
          id: sigId,
          signalType: 'DEMAND_SURGE',
          impactScore: prng.nextInt(70, 92),
          confidence: Math.round(prng.nextFloat(0.88, 0.98) * 100) / 100,
          source: 'AI_SYNTHETIC_SENSING_ENGINE',
          description: `Downstream commercial consumption velocity increased by +42% across ${location.region} enterprise accounts.`,
          tenantId,
          organizationId,
          syntheticData: true,
          environment: 'DEMO',
          generationBatchId: batchId,
          timestamp: nowIso,
        };

      case 'MINOR_DISRUPTION':
        return {
          id: sigId,
          signalType: 'CARRIER_CAPACITY_ALERT',
          impactScore: prng.nextInt(40, 60),
          confidence: Math.round(prng.nextFloat(0.75, 0.88) * 100) / 100,
          source: 'AI_SYNTHETIC_SENSING_ENGINE',
          description: `Regional freight transport lane tightening observed in ${location.city}. Spot rates up 8%.`,
          tenantId,
          organizationId,
          syntheticData: true,
          environment: 'DEMO',
          generationBatchId: batchId,
          timestamp: nowIso,
        };

      default:
        // For HEALTHY or other cases, produce realistic background sensing signal
        return {
          id: sigId,
          signalType: 'WEATHER_ALERT',
          impactScore: prng.nextInt(15, 35),
          confidence: Math.round(prng.nextFloat(0.85, 0.95) * 100) / 100,
          source: 'AI_SYNTHETIC_SENSING_ENGINE',
          description: `Standard meteorological corridor monitoring active for ${location.city}. Operational transit conditions optimal.`,
          tenantId,
          organizationId,
          syntheticData: true,
          environment: 'DEMO',
          generationBatchId: batchId,
          timestamp: nowIso,
        };
    }
  }

  public getBatchHistory(): GenerationBatchAudit[] {
    return [...this.batchHistory];
  }

  public getExecutedBatchIds(): string[] {
    return Array.from(this.executedBatchIds);
  }

  public resetBatchHistory(): void {
    this.batchHistory = [];
    this.executedBatchIds.clear();
  }
}

export const demoSyntheticDataEngine = DemoSyntheticDataEngine.getInstance();
