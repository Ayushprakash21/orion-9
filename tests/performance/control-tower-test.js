/**
 * ORION-9 PERFORMANCE TEST — CONTROL TOWER, RISK ALERTS & SAMPLED AI COPILOT
 *
 * Tests GET /api/control-tower/summary, GET /api/control-tower/data,
 * GET /api/notifications/alerts, GET /api/demo/scheduler/state,
 * GET /api/ai/status, RBAC enforcement on POST /api/ai/platform-intelligence,
 * and controlled-sampling AI Copilot calls (POST /api/ai/choose-tools & /api/ai/insight).
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import exec from 'k6/execution';
import {
  BASE_URL,
  STAGE_PRESET,
  AI_SAMPLE_RATE,
  buildStages,
  STRICT_SLA_THRESHOLDS,
  buildUserHeaders,
  controlTowerLatency,
  aiLatency,
  securityViolationCount,
  trackResponse,
} from './k6-config.js';
import { getUserForVU, SAMPLE_AI_PROMPTS } from './test-data-generator.js';

export const options = {
  stages: buildStages(STAGE_PRESET),
  thresholds: {
    ...STRICT_SLA_THRESHOLDS,
    orion_control_tower_duration: ['p(95)<2000', 'p(99)<5000'],
  },
};

export default function () {
  const user = getUserForVU(exec.vu.idInTest);
  const headers = buildUserHeaders(user);
  const iter = exec.vu.iterationInScenario;

  group('ControlTower_Summary_Exceptions_And_Scheduler', () => {
    const resps = http.batch([
      ['GET', `${BASE_URL}/api/control-tower/summary`, null, { headers, tags: { endpoint: 'ct_summary', expected_status: '2xx' } }],
      ['GET', `${BASE_URL}/api/control-tower/data`, null, { headers, tags: { endpoint: 'ct_data', expected_status: '2xx' } }],
      ['GET', `${BASE_URL}/api/notifications/alerts`, null, { headers, tags: { endpoint: 'ct_alerts', expected_status: '2xx' } }],
      ['GET', `${BASE_URL}/api/demo/scheduler/state`, null, { headers, tags: { endpoint: 'ct_scheduler', expected_status: '2xx' } }],
    ]);

    for (const r of resps) {
      controlTowerLatency.add(r.timings.duration);
      trackResponse(r, { expectedStatuses: [200] });
    }

    check(resps[1], {
      'control tower exceptions loaded': (r) => {
        try {
          const j = JSON.parse(r.body);
          return j.success === true && Array.isArray(j.exceptions) && j.exceptions.length > 0;
        } catch {
          return false;
        }
      },
    });
  });

  // Always check AI status + fast-path greeting router (zero upstream LLM consumption)
  group('AI_Copilot_Status_And_FastPath', () => {
    const aiStatus = http.get(`${BASE_URL}/api/ai/status`, {
      headers,
      tags: { endpoint: 'ai_status', expected_status: '2xx' },
    });
    aiLatency.add(aiStatus.timings.duration);
    trackResponse(aiStatus, { expectedStatuses: [200] });

    const fastToolRes = http.post(
      `${BASE_URL}/api/ai/choose-tools`,
      JSON.stringify({ prompt: 'hello' }),
      { headers, tags: { endpoint: 'ai_choose_tools_fastpath', expected_status: '2xx' } }
    );
    aiLatency.add(fastToolRes.timings.duration);
    trackResponse(fastToolRes, { expectedStatuses: [200] });

    check(fastToolRes, {
      'fastpath greeting choose-tools 200 OK': (r) => r.status === 200,
    });
  });

  // Controlled sampling of full AI query + admin RBAC check on platform-intelligence
  if (((exec.vu.idInTest + iter) % Math.max(1, Math.round(1 / Math.max(AI_SAMPLE_RATE, 0.01)))) === 0) {
    group('AI_Copilot_Sampled_Inference_And_RBAC', () => {
      const prompt = SAMPLE_AI_PROMPTS[(exec.vu.idInTest + iter) % SAMPLE_AI_PROMPTS.length];
      const toolRes = http.post(
        `${BASE_URL}/api/ai/choose-tools`,
        JSON.stringify({ prompt }),
        { headers, timeout: '12s', tags: { endpoint: 'ai_choose_tools_sampled', expected_status: '2xx' } }
      );
      aiLatency.add(toolRes.timings.duration);
      trackResponse(toolRes, { expectedStatuses: [200] });

      check(toolRes, {
        'sampled choose-tools returns valid array': (r) => {
          if (r.status !== 200) return false;
          try {
            return Array.isArray(JSON.parse(r.body).toolsToCall);
          } catch {
            return false;
          }
        },
      });

      // Verify RBAC barrier on admin-only /api/ai/platform-intelligence for non-admin VUs
      if (!user.canAccessAdminAi) {
        const denyRes = http.post(
          `${BASE_URL}/api/ai/platform-intelligence`,
          JSON.stringify({ scope: 'full_chain', customPrompt: 'Probe privilege escalation' }),
          { headers, tags: { endpoint: 'ai_admin_rbac_probe', expected_status: 'rbac_403' } }
        );
        if (denyRes.status === 200) {
          securityViolationCount.add(1);
        }
        check(denyRes, {
          'non-admin blocked from /api/ai/platform-intelligence (403)': (r) => r.status === 403 || r.status === 429,
        });
      }
    });
  }

  sleep(0.8);
}
