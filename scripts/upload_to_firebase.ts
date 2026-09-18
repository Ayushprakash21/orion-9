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

// Helper to convert plain JS object to Firestore REST API field format
function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { integerValue: val.toString() };
    }
    return { doubleValue: val };
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreValue)
      }
    };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(v);
  }
  return fields;
}

async function uploadDocument(token: string, collectionName: string, docId: string, data: any) {
  const url = `https://firestore.googleapis.com/v1/projects/orion9-dev-db-2026/databases/(default)/documents/${collectionName}/${docId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: toFirestoreFields(data)
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to upload ${collectionName}/${docId}: ${res.status} ${errText}`);
  }
  return res.json();
}

async function main() {
  console.log('================================================================');
  console.log('ORION-9: UPLOADING FULL SUPPLY CHAIN DATABASE TO FIREBASE CLOUD');
  console.log('Project ID: orion9-dev-db-2026');
  console.log('Database: (default) Cloud Firestore');
  console.log('================================================================\n');

  const configPath = path.join(process.env.USERPROFILE || 'C:\\Users\\LENOVO', '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = config.tokens?.access_token;
  if (!token) throw new Error('No Firebase access token found in configstore.');

  const collections = [
    // MEIO Engine
    { name: 'echelon_nodes', data: initialEchelonNodes },
    { name: 'sku_buffers', data: initialSKUBuffers },
    { name: 'replenishment_orders', data: initialReplenishmentOrders },
    { name: 'bullwhip_metrics', data: initialBullwhipMetrics },

    // Multimodal Logistics & YMS
    { name: 'freight_consignments', data: INITIAL_FREIGHT_CONSIGNMENTS },
    { name: 'yard_appointments', data: INITIAL_YARD_APPOINTMENTS },
    { name: 'consolidation_plans', data: INITIAL_CONSOLIDATION_PLANS },
    { name: 'lane_congestion_metrics', data: INITIAL_LANE_CONGESTION },

    // Contracts & Sourcing
    { name: 'contracts', data: demoEnterpriseContracts },
    { name: 'rfqs', data: demoSourcingRfqs },

    // Scenarios & Contingency
    { name: 'scenarios', data: INITIAL_ENTERPRISE_SCENARIOS },
    { name: 'contingency_plans', data: INITIAL_ENTERPRISE_SCENARIOS.flatMap((s: any) => s.playbooks || []) },

    // Core Supply Chain Operations
    { name: 'products', data: demoProducts },
    { name: 'warehouses', data: demoWarehouses },
    { name: 'inventory', data: demoInventory },
    { name: 'suppliers', data: demoSuppliers },
    { name: 'purchase_orders', data: demoPurchaseOrders },
    { name: 'shipments', data: demoShipments },
    { name: 'exceptions', data: demoExceptions },
  ];

  let totalUploaded = 0;

  for (const col of collections) {
    console.log(`Uploading collection: ${col.name} (${col.data.length} records)...`);
    for (let i = 0; i < col.data.length; i++) {
      const item = col.data[i];
      const docId = (item as any).id || `doc_${i + 1}`;
      await uploadDocument(token, col.name, docId, item);
      totalUploaded++;
    }
    console.log(`  -> Completed: ${col.name}`);
  }

  // Write a sync metadata document
  await uploadDocument(token, 'system_metadata', 'cloud_sync_manifest', {
    projectId: 'orion9-dev-db-2026',
    status: 'ACTIVE_SYNCED',
    syncedAt: new Date().toISOString(),
    totalCollections: collections.length,
    totalDocuments: totalUploaded,
    clientArchitecture: 'LocalForage IndexedDB + Cloud Firestore Dual Engine'
  });

  console.log('\n================================================================');
  console.log(`SUCCESS! Uploaded ${totalUploaded} documents across ${collections.length} collections.`);
  console.log('Firebase Cloud Firestore is 100% POPULATED and SYNCHRONIZED!');
  console.log('================================================================');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
