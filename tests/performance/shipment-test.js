/**
 * ORION-9 PERFORMANCE TEST — SHIPMENTS, CARRIERS & LOGISTICS EXCEPTIONS
 *
 * Tracks shipment milestones, reviews delayed freight, ingests EDI X12 214 carrier
 * updates, fetches operational alerts, and generates logistics reroute actions.
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
  shipmentLatency,
  securityViolationCount,
  trackResponse,
} from './k6-config.js';
import {
  getUserForVU,
  buildUniqueX12EdiPayload,
  SAMPLE_SHIPMENT_IDS,
} from './test-data-generator.js';

export const options = {
  stages: buildStages(STAGE_PRESET),
  thresholds: {
    ...STRICT_SLA_THRESHOLDS,
    orion_shipment_duration: ['p(95)<2000', 'p(99)<5000'],
  },
};

export default function () {
  const user = getUserForVU(exec.vu.idInTest);
  const headers = buildUserHeaders(user);
  const iter = exec.vu.iterationInScenario;

  group('Logistics_Track_Shipments_And_Alerts', () => {
    const responses = http.batch([
      ['GET', `${BASE_URL}/api/control-tower/data?domain=shipments`, null, { headers, tags: { endpoint: 'shipments_read', expected_status: '2xx' } }],
      ['GET', `${BASE_URL}/api/notifications/alerts`, null, { headers, tags: { endpoint: 'shipments_alerts', expected_status: '2xx' } }],
    ]);

    for (const r of responses) {
      shipmentLatency.add(r.timings.duration);
      trackResponse(r, { expectedStatuses: [200] });
    }

    check(responses[0], {
      'shipments array returned': (r) => {
        try {
          const j = JSON.parse(r.body);
          return Array.isArray(j.shipments) && j.shipments.some((s) => s.status === 'Delayed');
        } catch {
          return false;
        }
      },
    });
  });

  if (user.canMutateControl) {
    group('Logistics_EDI_214_And_Reroute', () => {
      const edi214 = buildUniqueX12EdiPayload('214', exec.vu.idInTest, iter, 'LOG');
      const ediRes = http.post(`${BASE_URL}/api/edi/receive`, edi214, {
        headers: buildUserHeaders(user, { 'Content-Type': 'text/plain' }),
        tags: { endpoint: 'edi_214_receive', expected_status: '2xx' },
      });
      shipmentLatency.add(ediRes.timings.duration);
      trackResponse(ediRes, { expectedStatuses: [200] });

      const shpId = SAMPLE_SHIPMENT_IDS[(exec.vu.idInTest + iter) % SAMPLE_SHIPMENT_IDS.length];
      const actRes = http.post(
        `${BASE_URL}/api/control/execute-action`,
        JSON.stringify({
          actionType: 'REROUTE_SHIPMENT',
          entityId: shpId,
          parameters: { corridor: 'PAC-04', tenantId: user.organizationId },
        }),
        { headers, tags: { endpoint: 'shipment_reroute', expected_status: '2xx' } }
      );
      shipmentLatency.add(actRes.timings.duration);
      trackResponse(actRes, { expectedStatuses: [200] });

      check(actRes, {
        'shipment reroute confirmed': (r) => r.status === 200,
      });
    });
  } else {
    const blockedRes = http.post(
      `${BASE_URL}/api/control/execute-action`,
      JSON.stringify({ actionType: 'REROUTE_SHIPMENT', entityId: 'SHP-2026-0001' }),
      { headers, tags: { endpoint: 'shipment_reroute_denied', expected_status: 'rbac_403' } }
    );
    if (blockedRes.status === 200) securityViolationCount.add(1);
    check(blockedRes, { 'viewer blocked from rerouting shipments': (r) => r.status === 403 });
  }

  sleep(0.8);
}
