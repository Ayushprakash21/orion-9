# ORION-9 Load Testing Suite & Performance Summary

**Branch:** `perf/150-user-load-audit` (cleanly branched from `main` at `e1c953f`)  
**Engine:** Grafana `k6 v2.3.0` (`windows/amd64`) + Vitest 5.0.1 + Playwright Chromium E2E  
**Target Architecture Tested:** Local Cloudflare Worker (`wrangler dev --port 8787 --local`) serving optimized `src/worker.ts` + production Vite build (`dist/client`), plus Express parity audit (`server.ts`) and Firebase/Firestore client audit.

---

## 1. Test Suite Inventory (`tests/performance/`)

| File | Purpose & Scope | Presets Supported |
| :--- | :--- | :--- |
| `k6-config.js` | Central stage presets (`baseline`, `smoke`, `staged`, `sustained`, `stress`), custom SLA trend/rate/counter metrics, IP distribution toggle, and strict threshold gates | `baseline`, `smoke`, `staged`, `sustained`, `stress` |
| `test-data-generator.js` | Deterministic 150-user synthetic roster across 7 operational roles & 3 tenants, collision-free `RUN_SEED`-parameterized X12 850/214 EDI payloads, sample SKU/PO/Shipment IDs, AI prompts | Helper module |
| `authentication-test.js` | `GET /api/auth/health`, `POST /api/auth/login`, malformed credential rejection, unauthenticated `401` gates | `STAGE_PRESET` |
| `dashboard-test.js` | Parallel batch telemetry load: `/api/health`, `/api/control-tower/data`, `/api/notifications/alerts`, `/api/branding` | `STAGE_PRESET` |
| `inventory-test.js` | Inventory telemetry retrieval, risk threshold checks, permitted vs `viewer` RBAC `403` enforcement on `/api/control/execute-action` | `STAGE_PRESET` |
| `procurement-test.js` | PO/Supplier telemetry reads, inbound X12 850 EDI ingestion (`/api/edi/receive`), `409` duplicate ICN replay checks, expedited PO actions | `STAGE_PRESET` |
| `shipment-test.js` | Shipment tracking & alerts batch, X12 214 carrier updates, reroute actions, viewer RBAC checks | `STAGE_PRESET` |
| `control-tower-test.js` | Control Tower summary/data/alerts/scheduler batch, `/api/ai/status`, fast-path `/api/ai/choose-tools`, sampled live AI inference, admin RBAC probe on `/api/ai/platform-intelligence` | `STAGE_PRESET` |
| `realtime-test.js` | High-frequency sync bursts, push device registration (`/api/notifications/register-device`), X12 214 EDI fan-in, outbox dispatch admin vs non-admin `403` | `STAGE_PRESET` |
| `api-stress-test.js` | Stage 9 stress escalation (`50 -> 150 -> 200 VUs -> 5 VUs recovery`), SSRF `/proxy` `403` check, `/api/*` JSON `404` non-HTML fallback check | Defaults to `stress` |
| `full-load-test.js` | End-to-end mixed multi-role workload blending all 7 user roles (`10 -> 25 -> 50 -> 75 -> 100 -> 125 -> 150 -> 5 VUs` in `staged` preset) | `STAGE_PRESET` |

---

## 2. How to Run

### Prerequisites
- Build client assets first: `npm run build`
- Start local Cloudflare Worker dev server in terminal 1:
  ```powershell
  npx wrangler dev --port 8787 --local
  ```
- Optionally check baseline Worker health: `Invoke-RestMethod http://127.0.0.1:8787/api/health`

### Run Commands
```powershell
# 1. Mixed 150-user staged load test (Stages 1-7 + Stage 10 recovery)
k6 run -e ORION_BASE_URL=http://127.0.0.1:8787 -e STAGE_PRESET=staged -e SIMULATE_DISTRIBUTED_IPS=true tests/performance/full-load-test.js

# 2. Shared corporate NAT rate-limit stress check (150 VUs from 1 IP)
k6 run -e ORION_BASE_URL=http://127.0.0.1:8787 -e STAGE_PRESET=smoke -e SIMULATE_DISTRIBUTED_IPS=false tests/performance/full-load-test.js

# 3. Focused 150-VU module suites
k6 run -e ORION_BASE_URL=http://127.0.0.1:8787 -e STAGE_PRESET=smoke -e SIMULATE_DISTRIBUTED_IPS=true -e RUN_SEED=400 tests/performance/authentication-test.js
k6 run -e ORION_BASE_URL=http://127.0.0.1:8787 -e STAGE_PRESET=smoke -e SIMULATE_DISTRIBUTED_IPS=true -e RUN_SEED=500 tests/performance/dashboard-test.js
k6 run -e ORION_BASE_URL=http://127.0.0.1:8787 -e STAGE_PRESET=smoke -e SIMULATE_DISTRIBUTED_IPS=true -e RUN_SEED=600 tests/performance/inventory-test.js
k6 run -e ORION_BASE_URL=http://127.0.0.1:8787 -e STAGE_PRESET=smoke -e SIMULATE_DISTRIBUTED_IPS=true -e RUN_SEED=700 tests/performance/procurement-test.js
k6 run -e ORION_BASE_URL=http://127.0.0.1:8787 -e STAGE_PRESET=smoke -e SIMULATE_DISTRIBUTED_IPS=true -e RUN_SEED=800 tests/performance/shipment-test.js
k6 run -e ORION_BASE_URL=http://127.0.0.1:8787 -e STAGE_PRESET=smoke -e SIMULATE_DISTRIBUTED_IPS=true -e RUN_SEED=1100 tests/performance/control-tower-test.js
k6 run -e ORION_BASE_URL=http://127.0.0.1:8787 -e STAGE_PRESET=smoke -e SIMULATE_DISTRIBUTED_IPS=true -e RUN_SEED=1200 tests/performance/realtime-test.js

# 4. Stage 9 (200 VUs) + Stage 10 recovery stress test
k6 run -e ORION_BASE_URL=http://127.0.0.1:8787 -e STAGE_PRESET=stress -e SIMULATE_DISTRIBUTED_IPS=true -e RUN_SEED=1300 tests/performance/api-stress-test.js

# 5. Full Stage 8 15-minute sustained 150-VU soak (recommended on staging)
k6 run -e ORION_BASE_URL=http://127.0.0.1:8787 -e STAGE_PRESET=sustained -e SIMULATE_DISTRIBUTED_IPS=true tests/performance/full-load-test.js

# 6. Realtime fan-out & Firestore query amplification Vitest benchmark
npx vitest run src/__tests__/performance/realtimeAndFirestoreAudit.test.ts
```

---

## 3. Executed Benchmark Results Summary

| Run / Suite | VUs Peak | Total HTTP Reqs | Throughput (req/s) | API Success Rate | Expected-2xx Fail Rate | Avg (ms) | P95 (ms) | P99 / Max (ms) | Security / Auth Violations |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **BEFORE:** Shared NAT Smoke | 150 | 8,588 | 168.51 | 93.92% | 6.08% (512 HTTP 429 + 6 AI timeouts) | 564.4 | 1,451.2 | 12,000.6 max | 0 |
| **BEFORE:** Distributed Staged (Stages 1–7) | 150 | 21,229 | 145.00 | 99.82% | 0.18% (23 HTTP 409 + 15 AI timeouts) | 481.9 | 1,273.3 | 12,001.0 max | 0 |
| **AFTER:** Shared NAT Smoke | 150 | 7,238 | 142.69 | **99.97%** | 0.03% (2/7,184 trailing login hits) | 712.9 | 1,544.5 | 3,331.5 max | 0 |
| **AFTER (Final):** Distributed Staged (`after-distributed-staged`) | 150 | 20,897 | 143.69 | **99.995%** (20,861/20,862) | **0.005%** | 520.0 | **1,538.7** | **2,290.0** (P99) | 0 |
| **AFTER:** Authentication Suite | 150 | 9,474 | 188.87 | **100.00%** | 0.00% | 263.9 | 654.0 | 1,330.0 (P99) | 0 |
| **AFTER:** Dashboard Suite | 150 | 11,168 | 221.08 | **100.00%** | 0.00% | 545.6 | 1,255.9 | 2,690.0 (P99) | 0 |
| **AFTER:** Inventory Suite | 150 | 6,926 | 135.16 | **99.986%** (1/6,809 check miss) | 0.015% | 254.7 | 590.8 | 1,420.0 (P99) | 0 |
| **AFTER:** Procurement Suite | 150 | 6,222 | 120.29 | **100.00%** | 0.00% | 470.0 | 1,490.1 | 1,970.0 (P99) | 0 |
| **AFTER:** Shipment Suite | 150 | 7,070 | 139.07 | **100.00%** | 0.00% | 629.1 | 1,840.1 | 2,200.0 (P99) | 0 |
| **AFTER (Round 2 Warm Staged):** Control Tower | 150 | (in `final-staged`) | 143.69 agg | **99.995%** | — | 482.6 | **1,400.0** | **2,280.0** (P99) | 0 |
| **AFTER (Cold-Start Standalone Batch):** Control Tower | 150 | 6,084 | 114.82 | **100.00%** | 0.00% | 1,672.7 | **4,946.6** *(single-process local workerd batch queue)* | 6,470.0 (P99) | 0 |
| **AFTER (Round 2 Warm Staged):** Realtime Sync | 150 | (in `final-staged`) | 143.69 agg | **99.995%** | — | 532.4 | **1,610.0** | **2,290.0** (P99) | 0 |
| **AFTER (Cold-Start Standalone Batch):** Realtime Sync | 150 | 5,792 | 113.31 | **100.00%** | 0.00% | 1,470.1 | **3,672.6** | 4,100.0 (P99) | 0 |
| **AFTER:** Stress Escalation + Recovery (`after-stress-200vu`) | **200** | 41,094 | **390.26** | **100.00%** (39,556/39,556) | **0.00%** | 978.3 | **1,717.9** | **2,570.0** (P99) | 0 |

For complete forensic findings across Firebase/Firestore, Cloudflare Workers, AI Copilot concurrency, Vite bundle optimization, security parity verification, and regression test outcomes, see [reports/orion-9-performance-report.md](../../reports/orion-9-performance-report.md).
