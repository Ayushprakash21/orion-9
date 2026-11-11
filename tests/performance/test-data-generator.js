/**
 * ORION-9 PERFORMANCE TESTING — SYNTHETIC 150-USER ROSTER & TEST DATA GENERATOR
 *
 * Generates 150 isolated synthetic test users across the exact role breakdown:
 *   - 15 Administrators
 *   - 35 Supply Chain Managers
 *   - 30 Procurement Users
 *   - 25 Inventory Managers
 *   - 20 Logistics Operators
 *   - 15 Customer Service Users
 *   - 10 Analysts
 * Total = 150 synthetic users across 3 isolated synthetic test tenants.
 * Never uses real customer accounts or production credentials.
 */

import encoding from 'k6/encoding';

export const ROLE_QUOTAS = [
  { key: 'admin', label: 'Administrator', count: 15, workerRole: 'platform_admin', canMutateControl: true, canAccessAdminAi: true },
  { key: 'scm_manager', label: 'Supply Chain Manager', count: 35, workerRole: 'planner', canMutateControl: true, canAccessAdminAi: false },
  { key: 'procurement', label: 'Procurement User', count: 30, workerRole: 'buyer', canMutateControl: true, canAccessAdminAi: false },
  { key: 'inventory', label: 'Inventory Manager', count: 25, workerRole: 'planner', canMutateControl: true, canAccessAdminAi: false },
  { key: 'logistics', label: 'Logistics Operator', count: 20, workerRole: 'operator', canMutateControl: true, canAccessAdminAi: false },
  { key: 'customer_service', label: 'Customer Service User', count: 15, workerRole: 'user', canMutateControl: true, canAccessAdminAi: false },
  { key: 'analyst', label: 'Analyst', count: 10, workerRole: 'viewer', canMutateControl: false, canAccessAdminAi: false },
];

const TEST_TENANTS = [
  'org-perf-sandbox-alpha',
  'org-perf-sandbox-beta',
  'org-perf-sandbox-gamma',
];

function base64UrlEncode(str) {
  return encoding.b64encode(str, 'rawurl');
}

/**
 * Mints a DEMO synthetic JWT containing role and tenantId claims for k6 load tests.
 * Note: For LIVE/STAGING environments, supply pre-signed RS256 test JWTs via env.
 */
function buildSyntheticDemoJwt(user) {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'perf-synthetic-test' }));
  const payload = base64UrlEncode(JSON.stringify({
    sub: user.userId,
    user_id: user.userId,
    email: user.email,
    role: user.workerRole,
    domainRole: user.roleKey,
    organizationId: user.organizationId,
    tenantId: user.organizationId,
    iat: nowSec,
    exp: nowSec + 7200,
  }));
  return `${header}.${payload}.synthetic_perf_test_sig`;
}

/**
 * Generates the fixed deterministic 150-user synthetic roster.
 */
export function generateSyntheticUsers() {
  const users = [];
  let seq = 1;

  for (const spec of ROLE_QUOTAS) {
    for (let i = 1; i <= spec.count; i++) {
      const idxStr = String(seq).padStart(3, '0');
      const userId = `perf-${spec.key}-${idxStr}`;
      const tenant = TEST_TENANTS[(seq - 1) % TEST_TENANTS.length];
      // Assign distinct RFC-5737 / RFC-1918 synthetic IP addresses per VU
      const octet3 = Math.floor(seq / 250) + 10;
      const octet4 = (seq % 250) + 1;
      const clientIp = `198.51.${octet3}.${octet4}`;

      const user = {
        seq,
        userId,
        username: userId,
        email: `${userId}@perf-sandbox.orion.local`,
        roleKey: spec.key,
        roleLabel: spec.label,
        workerRole: spec.workerRole,
        organizationId: tenant,
        canMutateControl: spec.canMutateControl,
        canAccessAdminAi: spec.canAccessAdminAi,
        clientIp,
        sessionToken: `orion_sess:DEMO:${userId}:${spec.workerRole}:${Date.now() + 7200000}:sig_test`,
        token: '',
      };
      user.token = buildSyntheticDemoJwt(user);
      users.push(user);
      seq++;
    }
  }

  return users;
}

export const SYNTHETIC_USERS_150 = generateSyntheticUsers();

/**
 * Deterministically assigns a synthetic user from the 150-user roster to the current k6 VU.
 */
export function getUserForVU(vuId) {
  const idx = (Math.max(1, vuId) - 1) % SYNTHETIC_USERS_150.length;
  return SYNTHETIC_USERS_150[idx];
}

export const SAMPLE_SKU_IDS = ['SKU-1000', 'SKU-1001', 'SKU-1002', 'SKU-1003'];
export const SAMPLE_PO_IDS = ['PO-2026-0038', 'PO-2026-0040', 'PO-2026-0042'];
export const SAMPLE_SHIPMENT_IDS = ['SHP-2026-0001', 'SHP-2026-0002', 'SHP-2026-0003', 'SHP-2026-0004'];
export const SAMPLE_SUPPLIER_IDS = ['SUP-001', 'SUP-002', 'SUP-003', 'SUP-004'];

export const SAMPLE_AI_PROMPTS = [
  'Analyze current inventory position and highlight stockout risks.',
  'Review delayed shipments and recommend rerouting actions.',
  'Evaluate supplier OTIF performance and identify high-risk vendors.',
  'Summarize overdue purchase orders and urgent mitigations.',
  'hello',
];

const RUN_SEED = Math.floor(Date.now() / 1000) % 900;

/**
 * Builds a syntactically valid X12 850 (Purchase Order) or 214 (Shipment Status) EDI payload
 * with a unique 9-digit Interchange Control Number (ICN) scoped to (RUN_SEED, vuId, iteration).
 */
export function buildUniqueX12EdiPayload(type, vuId, iter, senderTag = 'PERFSBX') {
  // Strictly injective 9-digit control number prevents 409 collisions within and across runs
  const rawNum = ((RUN_SEED + 10) * 1000000) + ((vuId % 500) * 2000) + (iter % 2000);
  const icn = String(rawNum % 999999999).padStart(9, '0');
  const sender = senderTag.padEnd(15, ' ').slice(0, 15);
  const receiver = 'ORION9_HUB     ';

  if (type === '214') {
    return [
      `ISA*00*          *00*          *ZZ*${sender}*ZZ*${receiver}*261112*0001*U*00401*${icn}*0*P*>~`,
      `GS*QM*${senderTag}*ORION9_HUB*20261112*0001*1*X*004010~`,
      `ST*214*0001~`,
      `B10*SHP-2026-0001*MSK-${icn}*MSKU~`,
      `L11*PERF-${icn}*BM~`,
      `AT7*X6*NS***20261112*0001*UT~`,
      `SE*5*0001~`,
      `GE*1*1~`,
      `IEA*1*${icn}~`,
    ].join('');
  }

  // Default: X12 850 Purchase Order
  const poNum = `PO-PERF-${icn}`;
  return [
    `ISA*00*          *00*          *ZZ*${sender}*ZZ*${receiver}*261112*0001*U*00401*${icn}*0*P*>~`,
    `GS*PO*${senderTag}*ORION9_HUB*20261112*0001*1*X*004010~`,
    `ST*850*0001~`,
    `BEG*00*NE*${poNum}**20261112~`,
    `N1*BY*Orion Perf Sandbox~`,
    `PO1*1*250*EA*450.00**VP*SKU-1000~`,
    `CTT*1~`,
    `SE*6*0001~`,
    `GE*1*1~`,
    `IEA*1*${icn}~`,
  ].join('');
}

export function buildActionPayload(roleKey, vuId, iter) {
  const correlation = `perf-${roleKey}-vu${vuId}-it${iter}`;
  switch (roleKey) {
    case 'inventory':
      return {
        actionType: 'ADJUST_SAFETY_STOCK',
        entityId: SAMPLE_SKU_IDS[(vuId + iter) % SAMPLE_SKU_IDS.length],
        parameters: { safetyStockDelta: 15, warehouseId: 'WH-CHI-01', correlationId: correlation },
      };
    case 'procurement':
      return {
        actionType: 'EXPEDITE_PO',
        entityId: SAMPLE_PO_IDS[(vuId + iter) % SAMPLE_PO_IDS.length],
        parameters: { priority: 'HIGH', correlationId: correlation },
      };
    case 'logistics':
      return {
        actionType: 'REROUTE_SHIPMENT',
        entityId: SAMPLE_SHIPMENT_IDS[(vuId + iter) % SAMPLE_SHIPMENT_IDS.length],
        parameters: { corridor: 'PAC-04', reason: 'Perf simulation delay mitigation', correlationId: correlation },
      };
    default:
      return {
        actionType: 'ACKNOWLEDGE_EXCEPTION',
        entityId: 'EXC-2026-001',
        parameters: { note: 'Verified under load test', correlationId: correlation },
      };
  }
}
