/**
 * ORION-9 PERFORMANCE TEST — REALTIME SYNC, OUTBOX DISPATCH & EVENT INGESTION
 *
 * Tests high-frequency real-time operational sync bursts:
 * - Telemetry snapshot sync (GET /api/control-tower/data & /api/notifications/alerts)
 * - Device push registration (POST /api/notifications/register-device)
 * - Inbound X12 214 & 850 event fan-in (POST /api/edi/receive) with uniqueness verification
 * - Admin outbox dispatcher trigger (POST /api/scm/events/dispatch) & non-admin 403 enforcement
 *
 * Note: Firestore onSnapshot client listener deduplication & memory benchmarks run via
 * src/__tests__/performance/realtimeAndFirestoreAudit.test.ts in Vitest.
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
  realtimeLatency,
  securityViolationCount,
  duplicateTxnCount,
  trackResponse,
} from './k6-config.js';
import { getUserForVU, buildUniqueX12EdiPayload } from './test-data-generator.js';

export const options = {
  stages: buildStages(STAGE_PRESET),
  thresholds: {
    ...STRICT_SLA_THRESHOLDS,
    orion_realtime_duration: ['p(95)<2000', 'p(99)<5000'],
  },
};

export default function () {
  const user = getUserForVU(exec.vu.idInTest);
  const headers = buildUserHeaders(user);
  const iter = exec.vu.iterationInScenario;

  group('Realtime_Telemetry_Sync_And_Push_Registration', () => {
    const syncResponses = http.batch([
      ['GET', `${BASE_URL}/api/control-tower/data`, null, { headers, tags: { endpoint: 'rt_ct_sync', expected_status: '2xx' } }],
      ['GET', `${BASE_URL}/api/notifications/alerts`, null, { headers, tags: { endpoint: 'rt_alerts_sync', expected_status: '2xx' } }],
      ['POST', `${BASE_URL}/api/notifications/register-device`, JSON.stringify({ deviceToken: `perf-dev-${user.userId}`, platform: 'web' }), { headers, tags: { endpoint: 'rt_device_reg', expected_status: '2xx' } }],
    ]);

    for (const r of syncResponses) {
      realtimeLatency.add(r.timings.duration);
      trackResponse(r, { expectedStatuses: [200] });
    }

    check(syncResponses[0], {
      'realtime snapshot 200 OK': (r) => r.status === 200,
    });
    check(syncResponses[2], {
      'device registration 200 OK': (r) => r.status === 200,
    });
  });

  group('Realtime_Event_Ingestion_And_Outbox_Dispatch', () => {
    const edi214 = buildUniqueX12EdiPayload('214', exec.vu.idInTest, iter, 'RTSYNC');
    const ediRes = http.post(`${BASE_URL}/api/edi/receive`, edi214, {
      headers: buildUserHeaders(user, { 'Content-Type': 'text/plain' }),
      tags: { endpoint: 'rt_edi_event', expected_status: '2xx' },
    });
    realtimeLatency.add(ediRes.timings.duration);
    if (ediRes.status === 409) duplicateTxnCount.add(1);
    trackResponse(ediRes, { expectedStatuses: [200] });

    check(ediRes, {
      'realtime event ingestion succeeded without unintended duplicate rejection': (r) => r.status === 200,
    });

    // Only Administrators may dispatch the outbox
    if (user.canAccessAdminAi) {
      const dispatchRes = http.post(`${BASE_URL}/api/scm/events/dispatch`, '{}', {
        headers,
        tags: { endpoint: 'rt_outbox_dispatch', expected_status: '2xx' },
      });
      realtimeLatency.add(dispatchRes.timings.duration);
      trackResponse(dispatchRes, { expectedStatuses: [200] });
      check(dispatchRes, { 'admin outbox dispatch 200 OK': (r) => r.status === 200 });
    } else if (iter % 5 === 0) {
      const deniedDispatch = http.post(`${BASE_URL}/api/scm/events/dispatch`, '{}', {
        headers,
        tags: { endpoint: 'rt_outbox_dispatch_rbac', expected_status: 'rbac_403' },
      });
      if (deniedDispatch.status === 200) securityViolationCount.add(1);
      check(deniedDispatch, { 'non-admin outbox dispatch rejected 403': (r) => r.status === 403 });
    }
  });

  sleep(0.5);
}
