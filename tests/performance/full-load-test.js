/**
 * ORION-9 PERFORMANCE TEST — FULL 150-USER MIXED ROLE WORKLOAD SIMULATION
 *
 * Orchestrates all 150 synthetic users simultaneously with exact role weights:
 *   - 15 Administrators (10.0%)
 *   - 35 Supply Chain Managers (23.3%)
 *   - 30 Procurement Users (20.0%)
 *   - 25 Inventory Managers (16.7%)
 *   - 20 Logistics Operators (13.3%)
 *   - 15 Customer Service Users (10.0%)
 *   - 10 Analysts (6.7%)
 *
 * Stages:
 *   10 -> 25 -> 50 -> 75 -> 100 -> 125 -> 150 VUs (+ sustained 15m option) -> recovery (5 VUs).
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import exec from 'k6/execution';
import {
  BASE_URL,
  TARGET_ENV,
  STAGE_PRESET,
  AI_SAMPLE_RATE,
  buildStages,
  STRICT_SLA_THRESHOLDS,
  buildUserHeaders,
  authLatency,
  dashboardLatency,
  inventoryLatency,
  procurementLatency,
  shipmentLatency,
  controlTowerLatency,
  aiLatency,
  realtimeLatency,
  securityViolationCount,
  duplicateTxnCount,
  trackResponse,
} from './k6-config.js';
import {
  getUserForVU,
  buildUniqueX12EdiPayload,
  buildActionPayload,
  SAMPLE_AI_PROMPTS,
} from './test-data-generator.js';

export const options = {
  stages: buildStages(STAGE_PRESET),
  thresholds: {
    ...STRICT_SLA_THRESHOLDS,
    orion_auth_duration: ['p(95)<2000', 'p(99)<5000'],
    orion_dashboard_duration: ['p(95)<2000', 'p(99)<5000'],
    orion_inventory_duration: ['p(95)<2000', 'p(99)<5000'],
    orion_procurement_duration: ['p(95)<2000', 'p(99)<5000'],
    orion_shipment_duration: ['p(95)<2000', 'p(99)<5000'],
    orion_control_tower_duration: ['p(95)<2000', 'p(99)<5000'],
    orion_realtime_duration: ['p(95)<2000', 'p(99)<5000'],
  },
};

export default function () {
  const user = getUserForVU(exec.vu.idInTest);
  const iter = exec.vu.iterationInScenario;
  const headers = buildUserHeaders(user);

  // 1. Initial Login on first iteration per VU (realistic browser session start)
  if (iter === 0 && TARGET_ENV === 'DEMO') {
    group('Step_1_Session_Login', () => {
      const cred = user.workerRole === 'platform_admin'
        ? { identifier: 'admin', password: 'admin' }
        : { identifier: 'user', password: 'user' };
      const loginHeaders = buildUserHeaders(user);
      delete loginHeaders.Authorization;

      const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(cred), {
        headers: loginHeaders,
        tags: { endpoint: 'full_auth_login', expected_status: '2xx' },
      });
      authLatency.add(loginRes.timings.duration);
      trackResponse(loginRes, { expectedStatuses: [200] });
      check(loginRes, { 'initial session login 200 OK': (r) => r.status === 200 });
    });
  }

  // 2. Dashboard + Control Tower Refresh (Common to all 150 roles)
  group('Step_2_Dashboard_And_Control_Tower', () => {
    const resps = http.batch([
      ['GET', `${BASE_URL}/api/control-tower/summary`, null, { headers, tags: { endpoint: 'full_ct_summary', expected_status: '2xx' } }],
      ['GET', `${BASE_URL}/api/control-tower/data`, null, { headers, tags: { endpoint: 'full_ct_data', expected_status: '2xx' } }],
      ['GET', `${BASE_URL}/api/notifications/alerts`, null, { headers, tags: { endpoint: 'full_alerts', expected_status: '2xx' } }],
    ]);

    dashboardLatency.add(resps[0].timings.duration);
    controlTowerLatency.add(resps[1].timings.duration);
    realtimeLatency.add(resps[2].timings.duration);

    for (const r of resps) {
      trackResponse(r, { expectedStatuses: [200] });
    }

    check(resps[1], {
      'full load control tower data 200 OK': (r) => r.status === 200,
    });
  });

  // 3. Role-specific Supply Chain Execution Workflow
  group(`Step_3_Role_Workflow_${user.roleKey}`, () => {
    if (user.roleKey === 'procurement') {
      const edi850 = buildUniqueX12EdiPayload('850', exec.vu.idInTest, iter, 'PROC');
      const ediRes = http.post(`${BASE_URL}/api/edi/receive`, edi850, {
        headers: buildUserHeaders(user, { 'Content-Type': 'text/plain' }),
        tags: { endpoint: 'full_edi_850', expected_status: '2xx' },
      });
      procurementLatency.add(ediRes.timings.duration);
      if (ediRes.status === 409) duplicateTxnCount.add(1);
      trackResponse(ediRes, { expectedStatuses: [200] });
    } else if (user.roleKey === 'logistics') {
      const edi214 = buildUniqueX12EdiPayload('214', exec.vu.idInTest, iter, 'LOGI');
      const ediRes = http.post(`${BASE_URL}/api/edi/receive`, edi214, {
        headers: buildUserHeaders(user, { 'Content-Type': 'text/plain' }),
        tags: { endpoint: 'full_edi_214', expected_status: '2xx' },
      });
      shipmentLatency.add(ediRes.timings.duration);
      if (ediRes.status === 409) duplicateTxnCount.add(1);
      trackResponse(ediRes, { expectedStatuses: [200] });
    }

    if (user.canMutateControl) {
      const payload = buildActionPayload(user.roleKey, exec.vu.idInTest, iter);
      const actRes = http.post(`${BASE_URL}/api/control/execute-action`, JSON.stringify(payload), {
        headers,
        tags: { endpoint: 'full_execute_action', expected_status: '2xx' },
      });
      if (user.roleKey === 'inventory') inventoryLatency.add(actRes.timings.duration);
      else if (user.roleKey === 'procurement') procurementLatency.add(actRes.timings.duration);
      else if (user.roleKey === 'logistics') shipmentLatency.add(actRes.timings.duration);
      else controlTowerLatency.add(actRes.timings.duration);
      trackResponse(actRes, { expectedStatuses: [200] });

      check(actRes, {
        'permitted action succeeded': (r) => r.status === 200,
      });
    } else {
      // Analyst (viewer) must be denied state-mutating control actions (403)
      const denyRes = http.post(
        `${BASE_URL}/api/control/execute-action`,
        JSON.stringify(buildActionPayload('inventory', exec.vu.idInTest, iter)),
        { headers, tags: { endpoint: 'full_viewer_rbac_403', expected_status: 'rbac_403' } }
      );
      if (denyRes.status === 200) securityViolationCount.add(1);
      check(denyRes, { 'analyst mutation blocked 403': (r) => r.status === 403 || r.status === 429 });
    }

    if (user.canAccessAdminAi && iter % 3 === 0) {
      const dispatchRes = http.post(`${BASE_URL}/api/scm/events/dispatch`, '{}', {
        headers,
        tags: { endpoint: 'full_admin_dispatch', expected_status: '2xx' },
      });
      realtimeLatency.add(dispatchRes.timings.duration);
      trackResponse(dispatchRes, { expectedStatuses: [200] });
    }
  });

  // 4. Controlled Sampling for AI Copilot + Security Isolation Checks
  const sampleMod = Math.max(1, Math.round(1 / Math.max(AI_SAMPLE_RATE, 0.01)));
  if ((exec.vu.idInTest + iter) % sampleMod === 0) {
    group('Step_4_AI_Copilot_Sampled', () => {
      const prompt = SAMPLE_AI_PROMPTS[(exec.vu.idInTest + iter) % SAMPLE_AI_PROMPTS.length];
      const toolRes = http.post(
        `${BASE_URL}/api/ai/choose-tools`,
        JSON.stringify({ prompt }),
        { headers, timeout: '12s', tags: { endpoint: 'full_ai_choose_tools', expected_status: '2xx' } }
      );
      aiLatency.add(toolRes.timings.duration);
      trackResponse(toolRes, { expectedStatuses: [200] });
    });
  }

  // Think time between realistic user operations (1.0s - 1.5s)
  sleep(1 + ((exec.vu.idInTest % 5) * 0.1));
}
