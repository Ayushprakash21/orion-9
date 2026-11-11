/**
 * ORION-9 PERFORMANCE TEST — DASHBOARD & KPI OVERVIEW
 *
 * Simulates concurrent users loading Executive/Dashboard view:
 * GET /api/health, GET /api/control-tower/data, GET /api/notifications/alerts,
 * GET /api/branding, and repeated dashboard telemetry refresh cycles.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import exec from 'k6/execution';
import {
  BASE_URL,
  STAGE_PRESET,
  buildStages,
  STRICT_SLA_THRESHOLDS,
  buildUserHeaders,
  dashboardLatency,
  trackResponse,
} from './k6-config.js';
import { getUserForVU } from './test-data-generator.js';

export const options = {
  stages: buildStages(STAGE_PRESET),
  thresholds: {
    ...STRICT_SLA_THRESHOLDS,
    orion_dashboard_duration: ['p(95)<2000', 'p(99)<5000'],
  },
};

export default function () {
  const user = getUserForVU(exec.vu.idInTest);
  const headers = buildUserHeaders(user);

  group('Dashboard_Initial_Load_And_Refresh', () => {
    const responses = http.batch([
      ['GET', `${BASE_URL}/api/health`, null, { headers, tags: { endpoint: 'health', expected_status: '2xx' } }],
      ['GET', `${BASE_URL}/api/control-tower/data`, null, { headers, tags: { endpoint: 'control_tower_data', expected_status: '2xx' } }],
      ['GET', `${BASE_URL}/api/notifications/alerts`, null, { headers, tags: { endpoint: 'notifications_alerts', expected_status: '2xx' } }],
      ['GET', `${BASE_URL}/api/branding`, null, { headers, tags: { endpoint: 'branding', expected_status: '2xx' } }],
    ]);

    for (const res of responses) {
      dashboardLatency.add(res.timings.duration);
      trackResponse(res, { expectedStatuses: [200] });
    }

    const ctRes = responses[1];
    check(ctRes, {
      'dashboard control-tower 200 OK': (r) => r.status === 200,
      'KPIs metrics present': (r) => {
        try {
          const j = JSON.parse(r.body);
          return j.success === true && j.metrics && typeof j.metrics.networkHealthIndex === 'number';
        } catch {
          return false;
        }
      },
      'alerts returned': () => responses[2].status === 200,
    });
  });

  sleep(1);
}
