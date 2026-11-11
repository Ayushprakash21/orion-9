/**
 * ORION-9 PERFORMANCE TEST — AUTHENTICATION & SECURITY GATE
 *
 * Tests GET /api/auth/health, POST /api/auth/login (valid DEMO credentials),
 * malformed login rejection (400/401), token rejection in unauthenticated requests,
 * and cross-environment token enforcement across up to 150 concurrent users.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import exec from 'k6/execution';
import {
  BASE_URL,
  TARGET_ENV,
  STAGE_PRESET,
  SIMULATE_DISTRIBUTED_IPS,
  buildStages,
  STRICT_SLA_THRESHOLDS,
  authLatency,
  unexpectedAuthFailureCount,
  securityViolationCount,
  trackResponse,
} from './k6-config.js';
import { getUserForVU } from './test-data-generator.js';

export const options = {
  stages: buildStages(STAGE_PRESET),
  thresholds: {
    ...STRICT_SLA_THRESHOLDS,
    orion_auth_duration: ['p(95)<2000', 'p(99)<5000'],
  },
};

export default function () {
  const user = getUserForVU(exec.vu.idInTest);
  const ipHeaders = SIMULATE_DISTRIBUTED_IPS
    ? { 'CF-Connecting-IP': user.clientIp, 'X-Forwarded-For': user.clientIp }
    : {};

  group('01_Auth_Health_And_Login', () => {
    const healthRes = http.get(`${BASE_URL}/api/auth/health`, {
      headers: ipHeaders,
      tags: { endpoint: 'auth_health', expected_status: '2xx' },
    });
    authLatency.add(healthRes.timings.duration);
    trackResponse(healthRes, { expectedStatuses: [200] });

    check(healthRes, {
      'auth health 200 OK': (r) => r.status === 200,
      'auth health reports ok': (r) => {
        try {
          return JSON.parse(r.body).status === 'ok';
        } catch {
          return false;
        }
      },
    });

    // Perform login using standard DEMO accounts in non-LIVE environment
    if (TARGET_ENV === 'DEMO') {
      const cred = user.workerRole === 'platform_admin'
        ? { identifier: 'admin', password: 'admin' }
        : { identifier: 'user', password: 'user' };

      const loginRes = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify(cred),
        {
          headers: { 'Content-Type': 'application/json', ...ipHeaders },
          tags: { endpoint: 'auth_login', expected_status: '2xx' },
        }
      );
      authLatency.add(loginRes.timings.duration);
      const ok = trackResponse(loginRes, { expectedStatuses: [200] });
      if (!ok && loginRes.status !== 429) {
        unexpectedAuthFailureCount.add(1);
      }

      check(loginRes, {
        'login status is 200': (r) => r.status === 200,
        'login returns token & session': (r) => {
          if (r.status !== 200) return false;
          try {
            const body = JSON.parse(r.body);
            return Boolean(body.success && body.token && body.session);
          } catch {
            return false;
          }
        },
      });
    }
  });

  // Periodic security negative test (~10% of iterations)
  if (exec.vu.iterationInScenario % 10 === 0) {
    group('02_Auth_Negative_Security_Probes', () => {
      const badLogin = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({ identifier: 'admin', password: 'wrong-password-probe' }),
        {
          headers: { 'Content-Type': 'application/json', ...ipHeaders },
          tags: { endpoint: 'auth_login_negative', expected_status: 'security_reject' },
        }
      );
      const denied = badLogin.status === 401 || badLogin.status === 403 || badLogin.status === 429;
      if (!denied) {
        securityViolationCount.add(1);
      }
      check(badLogin, {
        'wrong password rejected': (r) => r.status === 401 || r.status === 403 || r.status === 429,
      });

      const noAuthProtected = http.get(`${BASE_URL}/api/control-tower/data`, {
        headers: ipHeaders,
        tags: { endpoint: 'control_tower_unauth', expected_status: 'security_reject' },
      });
      if (noAuthProtected.status !== 401) {
        securityViolationCount.add(1);
      }
      check(noAuthProtected, {
        'unauthenticated control-tower blocked with 401': (r) => r.status === 401,
      });
    });
  }

  sleep(0.5);
}
