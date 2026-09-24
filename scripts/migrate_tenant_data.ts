import fs from 'fs';
import path from 'path';
import https from 'https';

const configPath = path.join(process.env.USERPROFILE || 'C:\\Users\\LENOVO', '.config', 'configstore', 'firebase-tools.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const token = config.tokens?.access_token;
const projectId = 'orion9-dev-db-2026';

const TARGET_TENANT = 'ORION_PLATFORM';

const HISTORICAL_COLLECTIONS = [
  'products',
  'warehouses',
  'inventory',
  'suppliers',
  'purchase_orders',
  'shipments',
  'exceptions',
  'echelon_nodes',
  'sku_buffers',
  'replenishment_orders',
  'bullwhip_metrics',
  'freight_consignments',
  'yard_appointments',
  'consolidation_plans',
  'lane_congestion_metrics',
  'contracts',
  'rfqs',
  'scenarios',
  'contingency_plans'
];

async function httpsRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function getCollectionDocs(colName) {
  let allDocs = [];
  let pageToken = null;

  do {
    let url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${colName}?pageSize=300`;
    if (pageToken) url += `&pageToken=${pageToken}`;
    const res = await httpsRequest(url, 'GET');
    if (res.status !== 200) return { error: res.data || res.text, status: res.status };
    if (res.data?.documents) allDocs = allDocs.concat(res.data.documents);
    pageToken = res.data?.nextPageToken;
  } while (pageToken);

  return { documents: allDocs };
}

async function updateDocTenant(colName, docId, fields, dryRun = true) {
  if (dryRun) return { status: 'DRY_RUN' };

  // Add organizationId and tenantId fields in Firestore REST format
  const updatedFields = {
    ...fields,
    organizationId: { stringValue: TARGET_TENANT },
    tenantId: { stringValue: TARGET_TENANT }
  };

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${colName}/${docId}?updateMask.fieldPaths=organizationId&updateMask.fieldPaths=tenantId`;
  const res = await httpsRequest(url, 'PATCH', { fields: updatedFields });
  return res;
}

async function runMigration(isDryRun = true) {
  console.log('================================================================');
  console.log(`ORION-9: TENANT DATA MIGRATION (${isDryRun ? 'DRY RUN' : 'APPLYING CHANGES'})`);
  console.log(`Target Tenant ID: ${TARGET_TENANT}`);
  console.log(`Firebase Project: ${projectId}`);
  console.log('================================================================\n');

  let totalScanned = 0;
  let totalRequiringMigration = 0;
  let totalMigrated = 0;

  for (const col of HISTORICAL_COLLECTIONS) {
    const res = await getCollectionDocs(col);
    if (res.error) {
      console.error(`Failed to fetch ${col}:`, res.error);
      continue;
    }

    const docs = res.documents || [];
    totalScanned += docs.length;

    let colMigrated = 0;
    for (const doc of docs) {
      const docId = path.basename(doc.name);
      const fields = doc.fields || {};
      const hasOrg = fields.organizationId?.stringValue;
      const hasTenant = fields.tenantId?.stringValue;

      if (!hasOrg || !hasTenant) {
        totalRequiringMigration++;
        const updateRes = await updateDocTenant(col, docId, fields, isDryRun);
        if (!isDryRun) {
          if (updateRes.status === 200) {
            colMigrated++;
            totalMigrated++;
          } else {
            console.error(`Error migrating ${col}/${docId}:`, updateRes);
          }
        } else {
          colMigrated++;
        }
      }
    }

    console.log(`Collection [${col}]: ${docs.length} docs scanned, ${colMigrated} records ${isDryRun ? 'need migration' : 'migrated'}.`);
  }

  console.log('\n================================================================');
  console.log(`SUMMARY: Total Scanned: ${totalScanned} | Requiring Migration: ${totalRequiringMigration} | Completed: ${isDryRun ? 0 : totalMigrated}`);
  console.log('================================================================\n');
}

const isApply = process.argv.includes('--apply');
runMigration(!isApply).catch(console.error);
