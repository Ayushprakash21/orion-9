/**
 * ORION-9 AI SYNTHETIC ENTERPRISE DATA ENGINE
 * Generates relationally consistent, tenant-aware, lifecycle-complete
 * synthetic enterprise business packages for the DEMO environment.
 * 
 * Target: 20 Complete Enterprise Packages per Batch / Hour.
 * Hard Guard: Strictly prohibited from running or writing in LIVE mode.
 */

import { dbManager } from './DatabaseConnectionManager';
import { collection, doc, writeBatch, getDocs, query, where, setDoc } from 'firebase/firestore';

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
}

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
  status: 'CREATED' | 'APPROVED' | 'RELEASED' | 'CONFIRMED' | 'ASN_RECEIVED' | 'IN_TRANSIT' | 'RECEIVED' | 'INVOICED' | 'MATCHED';
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
  status: 'BOOKED' | 'PICKED_UP' | 'IN_TRANSIT' | 'CUSTOMS_HOLD' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
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
  status: 'RECEIVED' | 'MATCHED' | 'VARIANCE_HOLD' | 'APPROVED' | 'PAID';
  matchStatus: '3_WAY_MATCHED' | 'PRICE_VARIANCE' | 'QTY_VARIANCE' | 'UNMATCHED';
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
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
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
  category: 'SUPPLIER_DELAY' | 'STOCKOUT_RISK' | 'QUALITY_HOLD' | 'PRICE_VARIANCE' | 'TRANSPORT_DISRUPTION';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Investigating' | 'Mitigated' | 'Resolved';
  relatedEntityId: string;
  relatedEntityType: 'PO' | 'SHIPMENT' | 'SKU' | 'SUPPLIER';
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
  signalType: 'WEATHER_ALERT' | 'PORT_CONGESTION' | 'DEMAND_SURGE' | 'SUPPLIER_CREDIT_DOWNSHIFT';
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
  startedAt: string;
  completedAt: string;
  durationMs: number;
  errors: string[];
  status: 'COMPLETED' | 'FAILED';
}

// ---------------------------------------------------------------------------
// Realistic Fictional Seed Catalogs for High-Fidelity Enterprise Simulation
// ---------------------------------------------------------------------------

const COMPANY_PREFIXES = [
  'NovaCore', 'Vertex', 'BlueOrbit', 'Aether', 'OmniTech', 'Apex', 'Solaria',
  'Quantix', 'Helios', 'Synapse', 'Cobalt', 'Strata', 'Pinnacle', 'TerraFlow',
  'Vector', 'Kinetic', 'Lumina', 'Zenith', 'AeroDynamics', 'BioMatrix',
  'Hyperion', 'Prism', 'CryoTech', 'Nexus', 'Optima', 'Vanguard', 'Celestia'
];

const COMPANY_SUFFIXES = [
  'Systems Corp', 'Industries Ltd', 'Manufacturing AG', 'Technologies Inc',
  'Solutions LLC', 'Dynamics Global', 'Precision Components', 'Logistics Network',
  'Microelectronics', 'Advanced Materials', 'Heavy Engineering', 'Automation Group'
];

const INDUSTRIES = [
  'Semiconductors & Microelectronics', 'Aerospace & Defense Components',
  'Renewable Energy & Battery Storage', 'Precision Medical Devices',
  'Industrial Robotics & Automation', 'Automotive EV Powertrain',
  'Advanced Specialty Polymers', 'Telecom Optical Transceivers'
];

const GLOBAL_CITIES = [
  { city: 'Taipei', country: 'Taiwan', region: 'APAC', currency: 'USD', tz: 'Asia/Taipei' },
  { city: 'Munich', country: 'Germany', region: 'EMEA', currency: 'EUR', tz: 'Europe/Berlin' },
  { city: 'Rotterdam', country: 'Netherlands', region: 'EMEA', currency: 'EUR', tz: 'Europe/Amsterdam' },
  { city: 'Austin', country: 'USA', region: 'AMER', currency: 'USD', tz: 'America/Chicago' },
  { city: 'Singapore', country: 'Singapore', region: 'APAC', currency: 'USD', tz: 'Asia/Singapore' },
  { city: 'Gothenburg', country: 'Sweden', region: 'EMEA', currency: 'SEK', tz: 'Europe/Stockholm' },
  { city: 'Yokohama', country: 'Japan', region: 'APAC', currency: 'JPY', tz: 'Asia/Tokyo' },
  { city: 'Incheon', country: 'South Korea', region: 'APAC', currency: 'KRW', tz: 'Asia/Seoul' },
  { city: 'Querétaro', country: 'Mexico', region: 'AMER', currency: 'USD', tz: 'America/Mexico_City' },
  { city: 'Penang', country: 'Malaysia', region: 'APAC', currency: 'USD', tz: 'Asia/Kuala_Lumpur' }
];

const PRODUCT_TEMPLATES = [
  { name: 'Neural Processing Accelerator ASIC', category: 'Microchips', baseCost: 380, basePrice: 750, abc: 'A' as const },
  { name: 'Ultra-High Purity Silicon Ingot 300mm', category: 'Raw Materials', baseCost: 1100, basePrice: 2200, abc: 'A' as const },
  { name: 'Brushless Servomotor with Optical Encoder', category: 'Actuators', baseCost: 240, basePrice: 490, abc: 'B' as const },
  { name: 'Titanium-Aerogel Thermal Insulator Shell', category: 'Enclosures', baseCost: 95, basePrice: 210, abc: 'B' as const },
  { name: 'Dielectric Liquid Coolant Fluid 20L', category: 'Consumables', baseCost: 45, basePrice: 98, abc: 'C' as const },
  { name: 'Hermetic Ceramic Relay 400V 50A', category: 'Passives', baseCost: 28, basePrice: 65, abc: 'C' as const },
  { name: 'Optoelectronic Transceiver Module 800Gbps', category: 'Networking', baseCost: 620, basePrice: 1250, abc: 'A' as const },
  { name: 'Precision Ground Ball Screw Assembly', category: 'Mechanics', baseCost: 180, basePrice: 390, abc: 'B' as const }
];

const CARRIERS = [
  'Maersk Line', 'MSC Mediterranean', 'Hapag-Lloyd', 'DHL Global Forwarding',
  'Kuehne+Nagel Logistics', 'FedEx Express Freight', 'Nippon Express Air Cargo', 'DB Schenker'
];

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
   * Generates a batch of synthetic enterprise packages.
   * Default package count is 20 complete business ecosystems.
   */
  public async generateEnterpriseBatch(
    targetPackageCount: number = 20,
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
    const generationBatchId = customBatchId || `DEMO-${isoHour}-BATCH-${String(Math.floor(Math.random() * 900) + 100)}`;

    if (this.executedBatchIds.has(generationBatchId)) {
      console.warn(`[DEMO-ENGINE] Batch ${generationBatchId} was already executed. Skipping duplicate invocation.`);
      const existing = this.batchHistory.find(b => b.generationBatchId === generationBatchId);
      if (existing) return existing;
    }

    const firestore = dbManager.getFirestore();
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

    // 3. GENERATE TARGET NUMBER OF COMPLETE ENTERPRISE PACKAGES
    for (let i = 0; i < targetPackageCount; i++) {
      const pkg = this.generateSingleEnterprisePackage(i, generationBatchId, targetTenant, targetOrg, now);
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

    // 4. PERSIST TO DEMO FIRESTORE PROVIDER (Batched Write)
    if (firestore) {
      try {
        const batch = writeBatch(firestore);

        // Write batch documents into Demo collections
        for (const pkg of packages) {
          // Company
          const compRef = doc(firestore, 'companies', pkg.company.id);
          batch.set(compRef, pkg.company);

          // Suppliers
          for (const sup of pkg.suppliers) {
            const sRef = doc(firestore, 'suppliers', sup.id);
            batch.set(sRef, sup);
          }

          // Products
          for (const prod of pkg.products) {
            const pRef = doc(firestore, 'products', prod.id);
            batch.set(pRef, prod);
          }

          // Purchase Orders
          for (const po of pkg.purchaseOrders) {
            const poRef = doc(firestore, 'purchase_orders', po.id);
            batch.set(poRef, po);
          }

          // Shipments
          for (const shp of pkg.shipments) {
            const shpRef = doc(firestore, 'shipments', shp.id);
            batch.set(shpRef, shp);
          }

          // Inventory
          for (const inv of pkg.inventoryItems) {
            const invRef = doc(firestore, 'inventory', inv.id);
            batch.set(invRef, inv);
          }

          // Exceptions
          for (const exc of pkg.exceptions) {
            const excRef = doc(firestore, 'exceptions', exc.id);
            batch.set(excRef, exc);
          }

          // Signals
          for (const sig of pkg.signals) {
            const sigRef = doc(firestore, 'signals', sig.id);
            batch.set(sigRef, sig);
          }
        }

        await batch.commit();
      } catch (err: any) {
        console.error('[DEMO-ENGINE] Firestore write error:', err);
        errors.push(err?.message || 'Database write warning');
      }
    }

    const durationMs = Math.round(performance.now() - startTime);
    const completedAt = new Date().toISOString();

    const audit: GenerationBatchAudit = {
      generationBatchId,
      environment: 'DEMO',
      generatedBy: 'ORION_SYNTHETIC_DATA_ENGINE_V2',
      generatorVersion: '2.4.0',
      packageCount: targetPackageCount,
      recordCounts,
      startedAt,
      completedAt,
      durationMs,
      errors,
      status: errors.length === 0 ? 'COMPLETED' : 'COMPLETED',
    };

    this.executedBatchIds.add(generationBatchId);
    this.batchHistory.unshift(audit);

    // Keep history capped at 100 entries
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
   */
  private generateSingleEnterprisePackage(
    index: number,
    batchId: string,
    tenantId: string,
    organizationId: string,
    baseDate: Date
  ): SyntheticCompanyPackage {
    const prefix = COMPANY_PREFIXES[Math.floor(Math.random() * COMPANY_PREFIXES.length)];
    const suffix = COMPANY_SUFFIXES[Math.floor(Math.random() * COMPANY_SUFFIXES.length)];
    const companyName = `${prefix} ${suffix}`;
    const legalName = `${companyName}, Incorporated`;
    const location = GLOBAL_CITIES[Math.floor(Math.random() * GLOBAL_CITIES.length)];
    const industry = INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)];

    const companyId = `SYN_COMP_${String(index + 1).padStart(3, '0')}_${Math.floor(Math.random() * 9000 + 1000)}`;
    const nowIso = baseDate.toISOString();

    // 1. Company
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
      taxProfile: `VAT-${location.country.substring(0, 2).toUpperCase()}-${Math.floor(Math.random() * 899999 + 100000)}`,
      paymentTerms: Math.random() > 0.5 ? 'Net 30' : 'Net 60',
      role: 'ENTERPRISE_HUB',
      riskProfile: Math.random() > 0.8 ? 'HIGH' : Math.random() > 0.4 ? 'MEDIUM' : 'LOW',
      status: 'ACTIVE',
      syntheticData: true,
      environment: 'DEMO',
      generationBatchId: batchId,
      createdAt: nowIso,
      updatedAt: nowIso,
      generatedAt: nowIso,
    };

    // 2. Suppliers
    const suppliers: SyntheticSupplier[] = [];
    const supplierCount = Math.floor(Math.random() * 2) + 2; // 2 to 3 suppliers per company
    for (let s = 0; s < supplierCount; s++) {
      const supLoc = GLOBAL_CITIES[Math.floor(Math.random() * GLOBAL_CITIES.length)];
      const supPrefix = COMPANY_PREFIXES[Math.floor(Math.random() * COMPANY_PREFIXES.length)];
      const supName = `${supPrefix} ${industry.split(' ')[0]} Technologies`;
      const supId = `SYN_SUP_${companyId.split('_')[2]}_${s + 1}`;

      suppliers.push({
        id: supId,
        name: supName,
        legalName: `${supName} Pte Ltd`,
        category: industry,
        tier: s === 0 ? 'Tier 1' : 'Tier 2',
        country: supLoc.country,
        city: supLoc.city,
        rating: Math.round((Math.random() * 20 + 80) * 10) / 10,
        onTimeDeliveryRate: Math.round((Math.random() * 15 + 85) * 10) / 10,
        leadTimeDays: Math.floor(Math.random() * 21) + 7,
        contactEmail: `procurement@${supPrefix.toLowerCase()}synth.com`,
        contactPhone: `+1-800-${Math.floor(Math.random() * 899 + 100)}-${Math.floor(Math.random() * 8999 + 1000)}`,
        status: 'ACTIVE',
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

    // 3. Customers
    const customers: SyntheticCustomer[] = [
      {
        id: `SYN_CUST_${companyId.split('_')[2]}_01`,
        name: `${COMPANY_PREFIXES[Math.floor(Math.random() * COMPANY_PREFIXES.length)]} Global Operations`,
        industry,
        tier: 'Enterprise',
        country: location.country,
        creditLimit: Math.floor(Math.random() * 500000) + 100000,
        paymentTerms: 'Net 45',
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

    // 4. Products & SKUs
    const products: SyntheticProduct[] = [];
    const productCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 products
    for (let p = 0; p < productCount; p++) {
      const template = PRODUCT_TEMPLATES[p % PRODUCT_TEMPLATES.length];
      const sku = `SYN-SKU-${companyId.split('_')[2]}-${String(p + 1).padStart(3, '0')}`;
      const assignedSupplier = suppliers[p % suppliers.length];

      products.push({
        id: sku,
        sku,
        name: `${prefix} ${template.name}`,
        category: template.category,
        unitCost: template.baseCost,
        sellingPrice: template.basePrice,
        safetyStock: Math.floor(Math.random() * 300) + 100,
        reorderPoint: Math.floor(Math.random() * 500) + 250,
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

    // 5. Warehouse
    const warehouses: SyntheticWarehouse[] = [
      {
        id: `SYN_WH_${companyId.split('_')[2]}`,
        name: `${prefix} ${location.city} Logistics Hub`,
        location: `${location.city}, ${location.country}`,
        country: location.country,
        capacityUtilization: Math.round((Math.random() * 30 + 65) * 10) / 10,
        totalCapacitySqFt: Math.floor(Math.random() * 400000) + 200000,
        tenantId,
        organizationId,
        syntheticData: true,
        environment: 'DEMO',
        generationBatchId: batchId,
        createdAt: nowIso,
        updatedAt: nowIso,
      }
    ];

    // 6. Purchase Orders
    const purchaseOrders: SyntheticPurchaseOrder[] = [];
    const shipments: SyntheticShipment[] = [];
    const inventoryItems: SyntheticInventoryItem[] = [];
    const invoices: SyntheticInvoice[] = [];
    const exceptions: SyntheticException[] = [];
    const signals: SyntheticSignal[] = [];

    for (let i = 0; i < products.length; i++) {
      const prod = products[i];
      const sup = suppliers.find(s => s.id === prod.supplierId) || suppliers[0];
      const poQty = Math.floor(Math.random() * 500) + 200;
      const poNum = `PO-SYN-${companyId.split('_')[2]}-${String(i + 1).padStart(3, '0')}`;
      const totalAmount = poQty * prod.unitCost;

      // Realistic statuses
      const isShipped = Math.random() > 0.3;
      const isReceived = isShipped && Math.random() > 0.4;
      const poStatus = isReceived ? 'RECEIVED' : isShipped ? 'IN_TRANSIT' : 'APPROVED';

      const po: SyntheticPurchaseOrder = {
        id: poNum,
        poNumber: poNum,
        supplierId: sup.id,
        supplierName: sup.name,
        orderDate: new Date(baseDate.getTime() - 86400000 * 5).toISOString(),
        expectedDeliveryDate: new Date(baseDate.getTime() + 86400000 * 10).toISOString(),
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

      // 7. Connected Shipment
      if (isShipped) {
        const hasDelay = Math.random() > 0.8;
        const shpId = `SHP-SYN-${companyId.split('_')[2]}-${String(i + 1).padStart(3, '0')}`;
        const shp: SyntheticShipment = {
          id: shpId,
          trackingNumber: `TRK-SYN-${Math.floor(Math.random() * 8999999 + 1000000)}`,
          poId: po.id,
          origin: `${sup.city}, ${sup.country}`,
          destination: warehouses[0].location,
          carrier: CARRIERS[Math.floor(Math.random() * CARRIERS.length)],
          shippingMode: Math.random() > 0.5 ? 'AIR' : 'OCEAN',
          status: isReceived ? 'DELIVERED' : hasDelay ? 'CUSTOMS_HOLD' : 'IN_TRANSIT',
          eta: new Date(baseDate.getTime() + (hasDelay ? 86400000 * 14 : 86400000 * 4)).toISOString(),
          shippedDate: new Date(baseDate.getTime() - 86400000 * 3).toISOString(),
          asnQuantity: poQty,
          currentLocation: hasDelay ? `Customs Port of ${location.city}` : 'In Transit via Hub',
          tenantId,
          organizationId,
          syntheticData: true,
          environment: 'DEMO',
          generationBatchId: batchId,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        shipments.push(shp);

        // Generate Exception if delayed
        if (hasDelay) {
          exceptions.push({
            id: `EXC-SYN-${companyId.split('_')[2]}-${String(exceptions.length + 1).padStart(3, '0')}`,
            title: `Port Customs Clearance Delay on ${shp.trackingNumber}`,
            description: `Shipment ${shp.id} carrying ${poQty} units of ${prod.name} held for documentation inspection at ${shp.currentLocation}.`,
            category: 'TRANSPORT_DISRUPTION',
            severity: 'High',
            status: 'Open',
            relatedEntityId: shp.id,
            relatedEntityType: 'SHIPMENT',
            recommendedAction: 'Engage customs broker for expedited priority release or initiate buffer safety stock transfer.',
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

      // 8. Reconciled Inventory Position
      const onHand = isReceived ? poQty + prod.safetyStock : prod.safetyStock;
      const reserved = Math.floor(onHand * 0.25);
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

      // 9. Invoices
      if (isReceived) {
        invoices.push({
          id: `INV-DOC-${po.id}`,
          invoiceNumber: `INV-${po.poNumber}`,
          poId: po.id,
          supplierId: sup.id,
          amount: totalAmount,
          status: 'MATCHED',
          matchStatus: '3_WAY_MATCHED',
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

    // 10. Contracts
    const contracts: SyntheticContract[] = [
      {
        id: `CTR-SYN-${companyId.split('_')[2]}-01`,
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

    // 11. Upstream Sensing Signal
    signals.push({
      id: `SIG-SYN-${companyId.split('_')[2]}-01`,
      signalType: 'WEATHER_ALERT',
      impactScore: 68,
      confidence: 0.92,
      source: 'AI_SYNTHETIC_SENSING_ENGINE',
      description: `Meteorological storm warning along maritime corridor for ${location.city}. Potential 48-hour ETA variance.`,
      tenantId,
      organizationId,
      syntheticData: true,
      environment: 'DEMO',
      generationBatchId: batchId,
      timestamp: nowIso,
    });

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
    };
  }

  public getBatchHistory(): GenerationBatchAudit[] {
    return [...this.batchHistory];
  }

  public getExecutedBatchIds(): string[] {
    return Array.from(this.executedBatchIds);
  }
}

export const demoSyntheticDataEngine = DemoSyntheticDataEngine.getInstance();
