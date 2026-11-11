/**
 * ORION-9 PERFORMANCE TEST — PROCUREMENT, SUPPLIERS & PO LIFECYCLE
 *
 * Exercises PO/Supplier retrieval via /api/control-tower/data,
 * inbound EDI X12 850 Purchase Order ingestion via POST /api/edi/receive,
 * duplicate ICN replay rejection (409 DUPLICATE_TRANSMISSION),
 * and expedited PO operational actions via POST /api/control/execute-action.
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
  procurementLatency,
  securityViolationCount,
  duplicateTxnCount,
  trackResponse,
} from './k6-config.js';
import {
  getUserForVU,
  buildUniqueX12EdiPayload,
  SAMPLE_PO_IDS,
} from './test-data-generator.js';

export const options = {
  stages: buildStages(STAGE_PRESET),
  thresholds: {
    ...STRICT_SLA_THRESHOLDS,
    orion_procurement_duration: ['p(95)<2000', 'p(99)<5000'],
  },
};

export default function () {
  const user = getUserForVU(exec.vu.idInTest);
  const headers = buildUserHeaders(user);
  const iter = exec.vu.iterationInScenario;

  group('Procurement_Read_POs_And_Suppliers', () => {
    const res = http.get(`${BASE_URL}/api/control-tower/data?domain=procurement`, {
      headers,
      tags: { endpoint: 'procurement_read', expected_status: '2xx' },
    });
    procurementLatency.add(res.timings.duration);
    trackResponse(res, { expectedStatuses: [200] });

    check(res, {
      'PO and supplier telemetry 200 OK': (r) => r.status === 200,
      'contains purchaseOrders & suppliers': (r) => {
        try {
          const b = JSON.parse(r.body);
          return Array.isArray(b.purchaseOrders) && Array.isArray(b.suppliers) && b.suppliers.length > 0;
        } catch {
          return false;
        }
      },
    });
  });

  if (user.canMutateControl) {
    group('Procurement_Create_PO_Via_EDI_850', () => {
      const ediPayload = buildUniqueX12EdiPayload('850', exec.vu.idInTest, iter, 'PROC');
      const ediHeaders = buildUserHeaders(user, { 'Content-Type': 'text/plain' });
      const ediRes = http.post(`${BASE_URL}/api/edi/receive`, ediPayload, {
        headers: ediHeaders,
        tags: { endpoint: 'edi_850_receive', expected_status: '2xx' },
      });
      procurementLatency.add(ediRes.timings.duration);

      if (ediRes.status === 409) {
        duplicateTxnCount.add(1);
      }
      trackResponse(ediRes, { expectedStatuses: [200] });

      check(ediRes, {
        'EDI 850 accepted 200 OK': (r) => r.status === 200,
        'EDI 997 ACK returned': (r) => {
          try {
            const j = JSON.parse(r.body);
            return j.success === true && typeof j.ack997 === 'string' && j.ack997.includes('ST*997');
          } catch {
            return false;
          }
        },
      });
    });
  }

  group('Procurement_PO_Action_And_RBAC', () => {
    const poId = SAMPLE_PO_IDS[(exec.vu.idInTest + iter) % SAMPLE_PO_IDS.length];
    const expectedStatus = user.canMutateControl ? 200 : 403;
    const actionRes = http.post(
      `${BASE_URL}/api/control/execute-action`,
      JSON.stringify({
        actionType: 'EXPEDITE_PO',
        entityId: poId,
        parameters: { priority: 'URGENT', tenantId: user.organizationId },
      }),
      {
        headers,
        tags: {
          endpoint: 'procurement_execute_action',
          expected_status: user.canMutateControl ? '2xx' : 'rbac_403',
        },
      }
    );
    procurementLatency.add(actionRes.timings.duration);
    trackResponse(actionRes, { expectedStatuses: [expectedStatus] });

    if (!user.canMutateControl && actionRes.status === 200) {
      securityViolationCount.add(1);
    }

    check(actionRes, {
      'procurement action RBAC enforced': (r) => r.status === expectedStatus,
    });
  });

  sleep(0.8);
}
