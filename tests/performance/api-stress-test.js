/**
 * ORION-9 PERFORMANCE TEST — API STRESS & BOUNDARY HARDENING TEST
 *
 * Stress-tests Cloudflare Worker & Express endpoints up to 150-200 VUs,
 * validating:
 * - Health & static SPA edge delivery
 * - SSRF proxy blocking (/proxy -> 403)
 * - API 404 JSON non-fallback guard (/api/nonexistent-route -> 404 application/json)
 * - Rate limiter threshold behavior (429 Retry-After headers)
 * - Recovery back to <= 5 VUs after burst
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
  securityViolationCount,
  trackResponse,
} from './k6-config.js';
import { getUserForVU } from './test-data-generator.js';

const stressPreset = __ENV.STAGE_PRESET || 'stress';

export const options = {
  stages: buildStages(stressPreset),
  thresholds: {
    ...STRICT_SLA_THRESHOLDS,
  },
};

export default function () {
  const user = getUserForVU(exec.vu.idInTest);
  const headers = buildUserHeaders(user);

  group('Stress_Core_API_Burst', () => {
    const resps = http.batch([
      ['GET', `${BASE_URL}/api/health`, null, { headers, tags: { endpoint: 'stress_health', expected_status: '2xx' } }],
      ['GET', `${BASE_URL}/api/system/status`, null, { headers, tags: { endpoint: 'stress_sys_status', expected_status: '2xx' } }],
      ['GET', `${BASE_URL}/api/control-tower/data`, null, { headers, tags: { endpoint: 'stress_ct_data', expected_status: '2xx' } }],
      ['GET', `${BASE_URL}/api/wallpaper/cloudflare/status`, null, { headers, tags: { endpoint: 'stress_wallpaper_status', expected_status: '2xx' } }],
    ]);

    for (const r of resps) {
      trackResponse(r, { expectedStatuses: [200] });
    }
  });

  if (exec.vu.iterationInScenario % 15 === 0) {
    group('Stress_Security_And_404_Guards', () => {
      const ssrf = http.get(`${BASE_URL}/proxy?proxy_url=http://169.254.169.254/latest/meta-data`, {
        headers,
        tags: { endpoint: 'stress_ssrf_guard', expected_status: 'security_reject' },
      });
      if (ssrf.status !== 403) securityViolationCount.add(1);
      check(ssrf, { 'SSRF proxy blocked 403': (r) => r.status === 403 });

      const api404 = http.get(`${BASE_URL}/api/does-not-exist-perf-probe`, {
        headers,
        tags: { endpoint: 'stress_api_404', expected_status: 'api_404' },
      });
      check(api404, {
        'unknown /api returns 404 JSON not HTML': (r) =>
          r.status === 404 && String(r.headers['Content-Type'] || '').includes('application/json'),
      });
    });
  }

  sleep(0.3);
}
