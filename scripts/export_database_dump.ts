import fs from 'fs';
import path from 'path';

// Seed imports
import { 
  initialEchelonNodes, 
  initialSKUBuffers, 
  initialReplenishmentOrders, 
  initialBullwhipMetrics 
} from '../src/data/db/inventoryOptimizationSeed';
import {
  INITIAL_FREIGHT_CONSIGNMENTS,
  INITIAL_YARD_APPOINTMENTS,
  INITIAL_CONSOLIDATION_PLANS,
  INITIAL_LANE_CONGESTION
} from '../src/data/db/logisticsSeed';
import {
  demoEnterpriseContracts,
  demoSourcingRfqs
} from '../src/data/db/contractSeed';
import {
  INITIAL_ENTERPRISE_SCENARIOS
} from '../src/data/db/scenarioSeed';
import {
  demoProducts,
  demoWarehouses,
  demoInventory,
  demoSuppliers,
  demoPurchaseOrders,
  demoShipments,
  demoExceptions
} from '../src/data';

const collections: Record<string, any[]> = {
  // MEIO Engine
  echelon_nodes: initialEchelonNodes,
  sku_buffers: initialSKUBuffers,
  replenishment_orders: initialReplenishmentOrders,
  bullwhip_metrics: initialBullwhipMetrics,

  // Multimodal Logistics & YMS
  freight_consignments: INITIAL_FREIGHT_CONSIGNMENTS,
  yard_appointments: INITIAL_YARD_APPOINTMENTS,
  consolidation_plans: INITIAL_CONSOLIDATION_PLANS,
  lane_congestion_metrics: INITIAL_LANE_CONGESTION,

  // Contracts & Sourcing
  contracts: demoEnterpriseContracts,
  rfqs: demoSourcingRfqs,

  // Scenarios & Contingency
  scenarios: INITIAL_ENTERPRISE_SCENARIOS,
  contingency_plans: INITIAL_ENTERPRISE_SCENARIOS.flatMap((s: any) => s.playbooks || []),

  // Core Supply Chain Operations
  products: demoProducts,
  warehouses: demoWarehouses,
  inventory: demoInventory,
  suppliers: demoSuppliers,
  purchase_orders: demoPurchaseOrders,
  shipments: demoShipments,
  exceptions: demoExceptions,
};

const outputDir = path.join(process.cwd(), 'database');
const collectionsDir = path.join(outputDir, 'collections');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(collectionsDir)) fs.mkdirSync(collectionsDir, { recursive: true });

let totalDocs = 0;
const manifest: Record<string, number> = {};

for (const [colName, docs] of Object.entries(collections)) {
  const filePath = path.join(collectionsDir, `${colName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf8');
  manifest[colName] = docs.length;
  totalDocs += docs.length;
  console.log(`Exported ${colName}: ${docs.length} records -> database/collections/${colName}.json`);
}

// Master DB dump containing all collections in a single file
const masterDump = {
  metadata: {
    system: 'Orion-9 SCM OS',
    exportedAt: new Date().toISOString(),
    totalCollections: Object.keys(collections).length,
    totalDocuments: totalDocs,
    architecture: 'Dual-Engine: Local IndexedDB (LocalForage) + Google Cloud Firestore'
  },
  collections
};

const masterPath = path.join(outputDir, 'orion9_full_database.json');
fs.writeFileSync(masterPath, JSON.stringify(masterDump, null, 2), 'utf8');
console.log(`Master database dump written to: ${masterPath} (${totalDocs} total documents)`);

// Write database README
const readmeContent = `# Orion-9 Database Package

This directory contains the complete exported database for **Orion-9 Supply Chain Operating System**.

## Contents

- \`orion9_full_database.json\`: Consolidated JSON export containing all **611 records across 19 collections**.
- \`collections/\`: Individual JSON files for each supply chain subsystem:
  - **MEIO Engine**:
    - \`echelon_nodes.json\` (6 records)
    - \`sku_buffers.json\` (7 records)
    - \`replenishment_orders.json\` (5 records)
    - \`bullwhip_metrics.json\` (5 records)
  - **Logistics & YMS**:
    - \`freight_consignments.json\` (6 records)
    - \`yard_appointments.json\` (5 records)
    - \`consolidation_plans.json\` (3 records)
    - \`lane_congestion_metrics.json\` (6 records)
  - **Contracts & Sourcing**:
    - \`contracts.json\` (4 records)
    - \`rfqs.json\` (2 records)
  - **Scenarios & Digital Twin**:
    - \`scenarios.json\` (4 records)
    - \`contingency_plans.json\` (3 records)
  - **Core Operations**:
    - \`products.json\` (120 records)
    - \`warehouses.json\` (5 records)
    - \`inventory.json\` (120 records)
    - \`suppliers.json\` (25 records)
    - \`purchase_orders.json\` (150 records)
    - \`shipments.json\` (100 records)
    - \`exceptions.json\` (35 records)

## How the Database Works in Orion-9

1. **Client-Side (Local)**:
   - Uses **IndexedDB** via \`localforage\` under the database name \`SC_DB\` for ultra-fast, zero-latency offline performance.
   - Initial seeds are automatically loaded into IndexedDB on first run.

2. **Cloud (Firebase Firestore)**:
   - All 19 collections are also synchronized to Google Cloud Firestore under project \`orion9-dev-db-2026\`.
   - Use \`scripts/upload_to_firebase.ts\` to re-sync or migrate.
`;

fs.writeFileSync(path.join(outputDir, 'README.md'), readmeContent, 'utf8');
console.log('Database export finished successfully!');
