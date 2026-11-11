/**
 * ORION-9 PERFORMANCE TESTING — CENTRAL K6 CONFIGURATION & THRESHOLDS
 *
 * Shared configuration, stage presets (Stages 1-10), custom SLA metrics,
 * and threshold gates targeting actual Orion-9 API endpoints.
 */

import { Trend, Rate, Counter } from 'k6/metrics';

export const BASE_URL = (__ENV.ORION_BASE_URL || 'http://127.0.0.1:8787').replace(/\/+$/, '');
export const TARGET_ENV = (__ENV.ORION_ENV || 'DEMO').toUpperCase();
export const STAGE_PRESET = (__ENV.STAGE_PRESET || 'staged').toLowerCase();
export const AI_SAMPLE_RATE = Math.max(0, Math.min(1, parseFloat(__ENV.AI_SAMPLE_RATE || '0.02')));
export const INCLUDE_AI_LIVE = __ENV.INCLUDE_AI_LIVE === 'true';
export const SIMULATE_DISTRIBUTED_IPS = __ENV.SIMULATE_DISTRIBUTED_IPS === 'true';

// Custom domain-level latency & reliability metrics
export const authLatency = new Trend('orion_auth_duration', true);
export const dashboardLatency = new Trend('orion_dashboard_duration', true);
export const inventoryLatency = new Trend('orion_inventory_duration', true);
export const procurementLatency = new Trend('orion_procurement_duration', true);
export const shipmentLatency = new Trend('orion_shipment_duration', true);
export const controlTowerLatency = new Trend('orion_control_tower_duration', true);
export const aiLatency = new Trend('orion_ai_duration', true);
export const realtimeLatency = new Trend('orion_realtime_duration', true);

export const rateLimited429Count = new Counter('orion_rate_limited_429_total');
export const unexpectedAuthFailureCount = new Counter('orion_unexpected_auth_failures');
export const securityViolationCount = new Counter('orion_security_isolation_violations');
export const duplicateTxnCount = new Counter('orion_duplicate_transaction_errors');
export const apiSuccessRate = new Rate('orion_api_success_rate');

/**
 * Standard Stage Presets aligning with the 10-Stage Performance Test Plan:
 * - baseline: 10 VUs
 * - smoke: quick sanity check (10 -> 50 -> 150 -> recovery in ~45s)
 * - staged: Stages 1-7 + Stage 10 recovery (10 -> 25 -> 50 -> 75 -> 100 -> 125 -> 150 -> recovery in ~2m 45s)
 * - sustained: Full Stages 1-8 + 10 (ramping through 10..150, holding 150 VUs for 15 minutes, then recovery)
 * - stress: Stage 9 escalation up to 200 VUs + recovery (only after 150-VU validation)
 */
export function buildStages(preset = STAGE_PRESET) {
  switch (preset) {
    case 'baseline':
      return [
        { duration: '10s', target: 10 },
        { duration: '20s', target: 10 },
        { duration: '10s', target: 0 },
      ];
    case 'smoke':
      return [
        { duration: '10s', target: 25 },
        { duration: '15s', target: 150 },
        { duration: '15s', target: 150 },
        { duration: '10s', target: 5 }, // Stage 10 quick recovery
      ];
    case 'sustained':
      return [
        { duration: '30s', target: 10 },   // Stage 1: Baseline
        { duration: '30s', target: 25 },   // Stage 2: Basic load
        { duration: '30s', target: 50 },   // Stage 3: Moderate load
        { duration: '30s', target: 75 },   // Stage 4: Increasing load
        { duration: '30s', target: 100 },  // Stage 5: High load
        { duration: '30s', target: 125 },  // Stage 6: Near target
        { duration: '1m', target: 150 },   // Stage 7: Target load
        { duration: '15m', target: 150 },  // Stage 8: 150 VUs sustained 15m
        { duration: '1m', target: 5 },     // Stage 10: Recovery verification
      ];
    case 'stress':
      return [
        { duration: '15s', target: 50 },
        { duration: '20s', target: 150 },
        { duration: '20s', target: 200 },  // Stage 9: 200 concurrent users stress
        { duration: '30s', target: 200 },
        { duration: '20s', target: 5 },    // Stage 10: Recovery
      ];
    case 'staged':
    default:
      return [
        { duration: '15s', target: 10 },   // Stage 1: 10 VUs
        { duration: '15s', target: 25 },   // Stage 2: 25 VUs
        { duration: '15s', target: 50 },   // Stage 3: 50 VUs
        { duration: '15s', target: 75 },   // Stage 4: 75 VUs
        { duration: '15s', target: 100 },  // Stage 5: 100 VUs
        { duration: '15s', target: 125 },  // Stage 6: 125 VUs
        { duration: '35s', target: 150 },  // Stage 7: 150 VUs target plateau
        { duration: '20s', target: 5 },    // Stage 10: Recovery
      ];
  }
}

export const STRICT_SLA_THRESHOLDS = {
  // Expected operational traffic must maintain >= 99% HTTP success rate and < 1% failure rate
  'http_req_failed{expected_status:2xx}': ['rate<0.01'],
  'http_req_duration{expected_status:2xx}': ['p(95)<2000', 'p(99)<5000'],
  'orion_api_success_rate': ['rate>=0.99'],
  'orion_security_isolation_violations': ['count==0'],
  'orion_unexpected_auth_failures': ['count==0'],
};

/**
 * Builds standard JSON + Bearer Authorization headers for a synthetic user.
 * When SIMULATE_DISTRIBUTED_IPS=true, attaches a realistic per-user edge IP header;
 * when false, omits spoofing to test shared office NAT / single-IP rate limit behavior.
 */
export function buildUserHeaders(user, extra = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${user.token}`,
    'X-Orion-Tenant-Id': user.organizationId,
    ...extra,
  };
  if (SIMULATE_DISTRIBUTED_IPS && user.clientIp) {
    headers['CF-Connecting-IP'] = user.clientIp;
    headers['X-Forwarded-For'] = user.clientIp;
  }
  return headers;
}

/**
 * Records common response telemetry (429 counts, auth errors, expected success rate).
 */
export function trackResponse(res, opts = { expectedStatuses: [200] }) {
  const ok = opts.expectedStatuses.includes(res.status);
  apiSuccessRate.add(ok);
  if (res.status === 429) {
    rateLimited429Count.add(1);
  }
  if (res.status === 401 && !opts.expectedStatuses.includes(401)) {
    unexpectedAuthFailureCount.add(1);
  }
  return ok;
}
