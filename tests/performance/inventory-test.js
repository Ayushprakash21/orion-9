/**
 * ORION-9 PERFORMANCE TEST — INVENTORY MANAGEMENT & RISK CHECKS
 *
 * Simulates concurrent Inventory Managers, Supply Chain Managers, and Analysts
 * retrieving inventory levels, checking stockout risk thresholds, filtering SKUs,
 * and executing permitted stock adjustments while verifying viewer RBAC enforcement.
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
  inventoryLatency,
  securityViolationCount,
  trackResponse,
} from './k6-config.js';
import { getUserForVU, SAMPLE_SKU_IDS } from './test-data-generator.js';

export const options = {
  stages: buildStages(STAGE_PRESET),
  thresholds: {
    ...STRICT_SLA_THRESHOLDS,
    orion_inventory_duration: ['p(95)<2000', 'p(99)<5000'],
  },
};

export default function () {
  const user = getUserForVU(exec.vu.idInTest);
  const headers = buildUserHeaders(user);
  const iter = exec.vu.iterationInScenario;

  group('Inventory_Read_And_Risk_Evaluation', () => {
    const res = http.get(`${BASE_URL}/api/control-tower/data?domain=inventory`, {
      headers,
      tags: { endpoint: 'inventory_read', expected_status: '2xx' },
    });
    inventoryLatency.add(res.timings.duration);
    trackResponse(res, { expectedStatuses: [200] });

    check(res, {
      'inventory data 200 OK': (r) => r.status === 200,
      'inventory records array returned': (r) => {
        try {
          const b = JSON.parse(r.body);
          return Array.isArray(b.inventory) && b.inventory.length > 0 && typeof b.metrics?.inventoryRiskCount === 'number';
        } catch {
          return false;
        }
      },
    });
  });

  group('Inventory_Permitted_Update_And_RBAC', () => {
    const sku = SAMPLE_SKU_IDS[(exec.vu.idInTest + iter) % SAMPLE_SKU_IDS.length];
    const payload = JSON.stringify({
      actionType: 'ADJUST_SAFETY_STOCK',
      entityId: sku,
      parameters: {
        warehouseId: 'WH-CHI-01',
        delta: 10,
        tenantId: user.organizationId,
        correlationId: `inv-perf-${exec.vu.idInTest}-${iter}`,
      },
    });

    const expectedStatus = user.canMutateControl ? 200 : 403;
    const actionRes = http.post(`${BASE_URL}/api/control/execute-action`, payload, {
      headers,
      tags: {
        endpoint: 'inventory_execute_action',
        expected_status: user.canMutateControl ? '2xx' : 'rbac_403',
      },
    });
    inventoryLatency.add(actionRes.timings.duration);
    trackResponse(actionRes, { expectedStatuses: [expectedStatus] });

    if (!user.canMutateControl && actionRes.status === 200) {
      securityViolationCount.add(1);
    }

    check(actionRes, {
      'inventory action respects RBAC': (r) => r.status === expectedStatus,
    });
  });

  sleep(0.8);
}
