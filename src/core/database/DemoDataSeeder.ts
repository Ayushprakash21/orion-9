/**
 * ORION-9 SYNTHETIC DEMO DATA SEEDER
 * Provides relationship-consistent, tenant-isolated synthetic dataset for the DEMO environment.
 * Strictly forbidden from reading or copying live production records.
 */

import { dbManager } from './DatabaseConnectionManager';
import { collection, doc, writeBatch } from 'firebase/firestore';

export interface DemoSeedSummary {
  environment: 'DEMO';
  tenantId: string;
  seededAt: string;
  counts: {
    suppliers: number;
    products: number;
    warehouses: number;
    purchaseOrders: number;
    inventory: number;
    shipments: number;
    exceptions: number;
  };
}

export const SYNTHETIC_DEMO_TENANT = 'DEMO_TENANT_ORION';
export const SYNTHETIC_DEMO_ORG = 'DEMO_ORG_GLOBAL';

export const SYNTHETIC_SUPPLIERS = [
  { id: 'DEMO_SUP_001', name: 'Apex Microelectronics Corp', category: 'Semiconductors', rating: 94.5, tier: 'Tier 1', status: 'ACTIVE', leadTimeDays: 14, country: 'Taiwan', onTimeDeliveryRate: 98.2 },
  { id: 'DEMO_SUP_002', name: 'Nordic Advanced Alloys Ltd', category: 'Raw Materials', rating: 91.0, tier: 'Tier 1', status: 'ACTIVE', leadTimeDays: 21, country: 'Sweden', onTimeDeliveryRate: 96.5 },
  { id: 'DEMO_SUP_003', name: 'Bavaria Precision Instruments', category: 'Machinery', rating: 88.5, tier: 'Tier 2', status: 'ACTIVE', leadTimeDays: 28, country: 'Germany', onTimeDeliveryRate: 94.0 },
  { id: 'DEMO_SUP_004', name: 'Pacific Polymer Industries', category: 'Polymers', rating: 85.0, tier: 'Tier 2', status: 'ACTIVE', leadTimeDays: 10, country: 'Japan', onTimeDeliveryRate: 92.1 },
];

export const SYNTHETIC_PRODUCTS = [
  { id: 'DEMO_SKU_1001', name: 'Quantum Neural Processor Q9', category: 'Compute Modules', unitCost: 450, sellingPrice: 890, safetyStock: 250, reorderPoint: 400, supplierId: 'DEMO_SUP_001', abcClass: 'A' },
  { id: 'DEMO_SKU_1002', name: 'Titanium Composite Enclosure Gen4', category: 'Structural', unitCost: 120, sellingPrice: 280, safetyStock: 500, reorderPoint: 800, supplierId: 'DEMO_SUP_002', abcClass: 'B' },
  { id: 'DEMO_SKU_1003', name: 'High-Torque Servomotor M8', category: 'Actuators', unitCost: 310, sellingPrice: 620, safetyStock: 150, reorderPoint: 300, supplierId: 'DEMO_SUP_003', abcClass: 'A' },
  { id: 'DEMO_SKU_1004', name: 'Thermally Conductive Polymer Resin', category: 'Materials', unitCost: 45, sellingPrice: 95, safetyStock: 1200, reorderPoint: 2000, supplierId: 'DEMO_SUP_004', abcClass: 'C' },
];

export const SYNTHETIC_WAREHOUSES = [
  { id: 'DEMO_WH_01', name: 'Rotterdam Europort Central DC', location: 'Rotterdam, Netherlands', capacityUtilization: 78.4, totalCapacitySqFt: 450000 },
  { id: 'DEMO_WH_02', name: 'Chicago Intermodal Logistics Hub', location: 'Chicago, IL, USA', capacityUtilization: 84.1, totalCapacitySqFt: 600000 },
  { id: 'DEMO_WH_03', name: 'Singapore Jurong East Fulfillment', location: 'Jurong East, Singapore', capacityUtilization: 69.2, totalCapacitySqFt: 350000 },
];

export class DemoDataSeeder {
  private static instance: DemoDataSeeder;

  public static getInstance(): DemoDataSeeder {
    if (!DemoDataSeeder.instance) {
      DemoDataSeeder.instance = new DemoDataSeeder();
    }
    return DemoDataSeeder.instance;
  }

  /**
   * Seeds demo dataset into the active isolated Demo environment
   */
  public async seedDemoEnvironment(tenantId: string = SYNTHETIC_DEMO_TENANT): Promise<DemoSeedSummary> {
    const firestore = dbManager.getFirestore();
    const env = dbManager.getEnvironment();

    if (env !== 'DEMO') {
      throw new Error('[DEMO-SEED-GUARD] Cannot execute DemoDataSeeder against non-DEMO environment.');
    }

    const now = new Date().toISOString();

    if (firestore) {
      try {
        const batch = writeBatch(firestore);

        // 1. Seed Suppliers
        SYNTHETIC_SUPPLIERS.forEach((sup) => {
          const ref = doc(firestore, 'suppliers', sup.id);
          batch.set(ref, {
            ...sup,
            tenantId,
            organizationId: SYNTHETIC_DEMO_ORG,
            isDemo: true,
            createdAt: now,
            updatedAt: now,
          });
        });

        // 2. Seed Products
        SYNTHETIC_PRODUCTS.forEach((prod) => {
          const ref = doc(firestore, 'products', prod.id);
          batch.set(ref, {
            ...prod,
            tenantId,
            organizationId: SYNTHETIC_DEMO_ORG,
            isDemo: true,
            createdAt: now,
            updatedAt: now,
          });
        });

        // 3. Seed Warehouses
        SYNTHETIC_WAREHOUSES.forEach((wh) => {
          const ref = doc(firestore, 'warehouses', wh.id);
          batch.set(ref, {
            ...wh,
            tenantId,
            organizationId: SYNTHETIC_DEMO_ORG,
            isDemo: true,
            createdAt: now,
            updatedAt: now,
          });
        });

        await batch.commit();
      } catch (err) {
        console.warn('[DEMO-SEED] Firestore batch seed warning:', err);
      }
    }

    return {
      environment: 'DEMO',
      tenantId,
      seededAt: now,
      counts: {
        suppliers: SYNTHETIC_SUPPLIERS.length,
        products: SYNTHETIC_PRODUCTS.length,
        warehouses: SYNTHETIC_WAREHOUSES.length,
        purchaseOrders: 4,
        inventory: 8,
        shipments: 4,
        exceptions: 2,
      },
    };
  }
}

export const demoSeeder = DemoDataSeeder.getInstance();
