# ORION-9 — Independent Performance Results Verification & Audit Report

**Auditor Role:** Independent Senior QA Auditor & Performance Engineering Lead  
**Verification Date:** 2026-11-12 (`02:13–02:20 IST`)  
**Repository Branch Audited:** `perf/150-user-load-audit` *(HEAD `e1c953f` + uncommitted working-tree changes)*  
**Baseline Reference:** `main` (`e1c953f6f43219a1975b239da9cf6a9a51843113`)  
**Evidence Directory:** [`reports/performance-evidence/`](file:///d:/ANtigravity/Orion%209/reports/performance-evidence/)

> This verification did **not** rely on prior summary markdown reports. Every figure below was independently recalculated from raw k6 `--summary-export` JSONs, raw k6 execution logs (`task-*.log`), live `workers.dev` HTTP probes, Git diffs, source code inspections, detached-worktree baseline test execution, and fresh TypeScript/Vitest runs.

---

## Executive Scorecard — Independent Verdict on Prior Claims

| # | Prior Claim | Independent Verdict | Evidence & Nuance |
| :---: | :--- | :---: | :--- |
| **1** | 150 concurrent users successfully tested | **PARTIALLY VERIFIED** | `vus = 150` genuinely reached in all 150-VU runs (`after-distributed-staged.json`, `after-shared-nat-smoke-clean.json`, 7 domain suites). **Caveats:** (a) Executed only against local `wrangler dev` (`DEMO` mode), not staging/production edge or live Firestore; (b) `STAGE_PRESET=staged` ramped linearly `125 -> 150` over `35s` so `150/150` only ran for ~2 ticks (~1–2s), whereas `smoke` held 150 VUs for 15s and the 15-minute `sustained` soak was **not executed**; (c) Cold standalone `suite-control-tower` and `suite-realtime` breached `<2000ms` P95 SLAs (`EXIT=99`), and `auth`/`dashboard`/`inventory`/`procurement`/`shipment` were not re-run standalone after adding `controlTowerSnapshotCache`. |
| **2** | 200 concurrent users stress-tested | **PARTIALLY VERIFIED** | `after-stress-200vu.json` genuinely reached `vus = 200` and held `200/200 VUs` for **62 ticks (~30+ seconds)** (`41,094` reqs at `390.26 req/s`). **Caveat:** `api-stress-test.js` only hit read-only `GET` endpoints (`/api/health`, `/api/system/status`, `/api/control-tower/data`, `/api/wallpaper/cloudflare/status`) plus SSRF/404 guards — zero mutations, logins, EDI posts, or AI calls. |
| **3** | 99.995% API success at 150 VUs | **VERIFIED** *(with scope nuance)* | Independently recalculated from `after-distributed-staged.json`: `20,861 / 20,862 = 99.9952%` expected-2xx success (`1` failed initial login; `35` expected RBAC `403`s excluded from expected-2xx denominator, totaling `20,897` reqs). Shared-NAT smoke achieved `7,182 / 7,184 = 99.9722%`. |
| **4** | P95 latency of 1,538.7ms | **PARTIALLY VERIFIED** | Exact match for `after-distributed-staged.json` (`1538.71ms` on `expected_status:2xx`). **Caveat:** Does **not** hold for all 150-VU tests — standalone `suite-control-tower.json` hit **P95 = `4,946.55ms`** (failed `<2000ms`) and `suite-realtime.json` hit **P95 = `3,672.60ms`** (failed `<2000ms`). Also `--summary-export` JSONs omit `p(99)` (present only in k6 stdout text logs). |
| **5** | 100% API success at 200 VUs | **VERIFIED** *(read-only stress profile)* | Independently recalculated from `after-stress-200vu.json`: `39,556 / 39,556 = 100.0000%` expected-2xx success, `1,538` expected `403`/`404` probes passed, `0` failures out of `41,094` total HTTP requests. |
| **6** | TypeScript build passed | **VERIFIED** | Fresh `npx tsc --noEmit` exited `0` (`0` errors); `npm run build` exited `0` (`index-DL-7jhKp.js` = `3,321.09 kB`, `dist/server.cjs` = `192.3 kb`). **Note:** All branch modifications are still uncommitted in the working tree. |
| **7** | 4/4 realtime tests passed | **VERIFIED** | Freshly re-executed `realtimeAndFirestoreAudit.test.ts`: **4/4 passed (`35ms`)** — `150-user subscribe=7.54ms`, `fanout=3.51ms`, `50 concurrent inventory=12.85ms`, `listRecords` reads = `1`. *(In-memory/mocked persistence benchmark, not live remote Firestore.)* |
| **8** | Existing Vitest and Playwright failures were baseline issues | **PARTIALLY VERIFIED** | **Vitest VERIFIED 1:1:** Detached worktree test on clean `main` (`e1c953f`, `task-16142`) failed on the exact same **6 files / 16 tests** (`22 passed, 16 failed`). **Playwright INCOMPLETE / OVERGENERALIZED:** Previous report attributed all 68 Playwright failures to mock-auth blocking on `/login`. Actual error audit shows **31/68** blocked on `Sign in to Orion`, **15/68** failed on hardcoded developer machine paths (`ENOENT: C:\Users\LENOVO\...`), and **22/68** failed on UI/selector/pointer/translation/boot-gate issues. Playwright was not re-run on `main`, so baseline status is inferred from untouched files rather than executed. |

---

## TASK 1 — Independent Load-Test Evidence Recalculation

All raw `--summary-export` JSONs are archived in [`reports/performance-evidence/k6-json/`](file:///d:/ANtigravity/Orion%209/reports/performance-evidence/k6-json/) and machine-recalculated in [`recalculated-metrics.json`](file:///d:/ANtigravity/Orion%209/reports/performance-evidence/recalculated-metrics.json).

### 1.1 Recalculated Metrics Table (Raw JSON + Stdout P99 Cross-Check)

| Artifact (`k6-json/*.json`) | Preset / Script | VU Max | Duration / Sustained Plateau Check | Total Reqs (RPS) | Expected-2xx (`OK / Total`) | Recalc. API Success | Avg / P50 / P90 / P95 (ms) | Stdout P99 / Max (ms) | Gate |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `before-shared-nat-smoke.json` | `smoke` / `full-load` (NAT) | 150 | 50s (`30` ticks @ 150 VUs, ~15s) | 8,588 (`168.51`) | `7,996 / 8,514` | **93.9159%** | `564.35 / 409.22 / 1144.02 / 1451.19` | `1.79s` P99 / `12,000.6` max | FAIL |
| `before-distributed-staged.json` | `staged` / `full-load` | 150 | 2m25s (`2` ticks @ 150 VUs, ~1–2s peak) | 21,229 (`145.00`) | `21,161 / 21,199` | **99.8207%** | `481.88 / 369.44 / 969.46 / 1273.32` | `1.88s` P99 / `12,001.0` max | PASS *(15 AI timeouts)* |
| `after-shared-nat-smoke-clean.json` | `smoke` / `full-load` (NAT) | 150 | 50s (`32` ticks @ 150 VUs, ~15s) | 7,238 (`142.69`) | `7,182 / 7,184` | **99.9722%** | `712.88 / 675.81 / 1335.02 / 1544.47` | `2.05s` P99 / `3,331.5` max | PASS |
| `after-distributed-staged.json` | `staged` / `full-load` | 150 | 2m25s (`2` ticks @ 150 VUs, ~1–2s peak) | 20,897 (`143.69`) | `20,861 / 20,862` | **99.9952%** | `520.02 / 386.90 / 1013.08 / 1538.71` | `2.29s` P99 / `3,678.7` max | **PASS** |
| `after-stress-200vu.json` | `stress` / `api-stress` | **200** | 1m45s (`62` ticks @ 200 VUs, ~30s) | 41,094 (`390.26`) | `39,556 / 39,556` | **100.0000%** | `978.26 / 993.21 / 1478.25 / 1717.94` | `2.57s` P99 / `3,967.2` max | **PASS** *(GET-only)* |
| `suite-auth.json` | `smoke` / `authentication` | 150 | 50s (pre-CT-cache edit) | 9,474 (`188.87`) | `8,482 / 8,482` | **100.0000%** | `263.91 / 221.55 / 443.52 / 653.97` | `1.33s` P99 / `1,739.3` max | PASS |
| `suite-dashboard.json` | `smoke` / `dashboard` | 150 | 50s (pre-CT-cache edit) | 11,168 (`221.08`) | `11,168 / 11,168` | **100.0000%** | `545.57 / 532.72 / 937.73 / 1255.89` | `2.69s` P99 / `5,558.2` max | PASS |
| `suite-inventory.json` | `smoke` / `inventory` | 150 | 50s (pre-CT-cache edit) | 6,926 (`135.16`) | `6,808 / 6,809` | **99.9856%** | `254.71 / 199.94 / 408.86 / 590.78` | `1.42s` P99 / `1,987.2` max | PASS (`1` RBAC miss) |
| `suite-procurement.json` | `smoke` / `procurement` | 150 | 50s (pre-CT-cache edit) | 6,222 (`120.29`) | `6,135 / 6,135` | **100.0000%** | `470.03 / 374.96 / 902.26 / 1490.14` | `1.97s` P99 / `2,511.2` max | PASS |
| `suite-shipment.json` | `smoke` / `shipment` | 150 | 50s (pre-CT-cache edit) | 7,070 (`139.07`) | `6,980 / 6,980` | **100.0000%** | `629.08 / 515.20 / 1162.18 / 1840.10` | `2.20s` P99 / `2,940.9` max | PASS |
| `suite-control-tower.json` | `smoke` / `control-tower` | 150 | 50s (post-CT-cache cold start) | 6,084 (`114.82`) | `6,066 / 6,066` | **100.0000%** | `1672.73 / 1776.53 / 3147.69 / 4946.55` | `6.47s` P99 / `7,401.3` max | **FAIL** *(P95 & P99 SLA)* |
| `suite-realtime.json` | `smoke` / `realtime` | 150 | 50s (post-CT-cache cold start) | 5,792 (`113.31`) | `5,539 / 5,539` | **100.0000%** | `1470.08 / 749.02 / 3311.26 / 3672.60` | `4.10s` P99 / `5,222.1` max | **FAIL** *(P95 SLA)* |

### 1.2 Sustained vs. Staged Clarification
- In `tests/performance/k6-config.js`, `STAGE_PRESET=sustained` (9 stages totaling 20m, including `{ duration: '15m', target: 150 }`) exists in config **but was NOT executed**.
- In `STAGE_PRESET=staged` (`2m25s`), Stage 7 linearly ramps `125 -> 150 VUs` over `35s`, hitting `150/150` only at the end (`2` progress log ticks), so it tests ramp resilience rather than sustained 15-minute soaking. `STAGE_PRESET=smoke` (`50s`) genuinely held `150/150` for 15 seconds (`30–32` ticks), and `STAGE_PRESET=stress` genuinely held `200/200` for ~30 seconds (`62` ticks).

---

## TASK 2 — Environment & Production Isolation Verification

- **Load Test Target:** Every k6 command explicitly passed `-e ORION_BASE_URL=http://127.0.0.1:8787` targeting local `npx wrangler dev --port 8787 --local` (local Node/Miniflare `workerd` runtime in `DEMO` mode). Zero load tests were pointed at `workers.dev` or live Firestore writes.
- **Live Production Probe (`2026-11-12T02:13+05:30`, read-only):** Saved in [`live-worker-probe.json`](file:///d:/ANtigravity/Orion%209/reports/performance-evidence/live-worker-probe.json). Confirmed live `https://orion-9.ayushprakash0021.workers.dev` is unmodified and **still serves pre-fix code**:
  - `GET /api/health` -> `environment: "DEMO"`, `queueDeliveryVerified: false`, `deadLetterQuarantine.quarantinedCount: 1`
  - `GET /api/ai/status` -> `{"configured": true, "provider": "gemini", "model": "gemini-3.8-flash"}`

---

## TASK 3 — Independent Code Verification of Bug Fixes & Open Defects

| Component | Verified Status | Exact Source Code Evidence |
| :--- | :---: | :--- |
| **Queue Producer / Consumer Contract** | **OPEN P0 DEFECT** | `src/worker.ts:1791-1801` calls `env.SCM_EVENTS.send({ eventType, eventId, tenantId, payload, timestamp })` **without `idempotencyKey`**. `QueueConsumer.ts:150-159` checks `if (!envelope \|\| !envelope.idempotencyKey \|\| !envelope.tenantId)` and quarantines every inbound EDI queue message with `Malformed event envelope: missing idempotencyKey or tenantId`. |
| **Gemini Model & Deadlines** | **FIXED IN WORKER / OPEN IN EXPRESS** | `src/worker.ts` now uses `'gemini-2.5-flash'`, `withWorkerDeadline` (`2.5s`/`4.5s`/`6.0s`), `chooseToolsDeterministic`, and bounded `aiToolRouteCache` (`256`). However, **`server.ts` lines `889, 1002, 1065, 1171, 1203` still hardcode `'gemini-3.8-flash'`** without deadline wrappers. |
| **`WorkerRateLimiter`** | **VERIFIED FIXED** | `src/server/workerSecurity.ts`: `MAX_BUCKETS = 25000` FIFO eviction, `extractRateLimitIdentity` scopes `ai` (`60/min`) & `edi` (`120/min`) by `${authIdentity}:${clientIp}`, `default` raised to `400/min` (`admin: 15`, `wallpaper: 10` preserved). |
| **Firestore Listener Lifecycle & Fan-Out** | **VERIFIED FIXED (Client)** | `ControlTowerWorkspace.tsx` deps narrowed to `[tenantId]`; `useLiveChartSeries.ts` / `TimeSeriesEngine.ts` stabilized `metricIds.join('\|')` and removed double listeners; `LiveMetricsEngine.ts` `getRequiredCollectionsForMetric(metricId)` cut `INVENTORY_ON_HAND` reads `8 -> 1`. |
| **Control Tower Snapshot Caching** | **VERIFIED IMPLEMENTED (Caveat)** | `src/worker.ts:406-417, 792-795` caches JSON for `2000ms` keyed by `${activeEnv}:${url.pathname}` (max 6 isolate entries). Caveat: key ignores `tenantId`, and standalone 150-VU cold-start batch tests still saturated single-process `workerd`. |

---

## TASK 4 — Regression Verification & Baseline Comparison

1. **`npx tsc --noEmit`:** Re-verified `Exit 0` (`0` errors).
2. **`npm run build`:** Verified `Exit 0` after final edit (`dist/client/assets/index-DL-7jhKp.js` = `3,321.09 kB`, `dist/server.cjs` = `192.3 kb`).
3. **Security + Performance Unit Audits (`task-16158`):**
   - `src/__tests__/performance/realtimeAndFirestoreAudit.test.ts`: **4/4 passed** (`35ms`)
   - `src/__tests__/security/rateLimiting.test.ts`: **3/3 passed** (`56ms`)
   - `src/__tests__/security/workerAuthentication.test.ts`: **8/8 passed**
4. **Full Vitest Baseline Verification (`task-16083` vs Clean `main` `task-16142`):**
   - On `perf/150-user-load-audit`: `225 passed | 6 failed | 8 skipped (239)` (`2,220 passed | 16 failed | 122 skipped`).
   - Independently ran those exact 6 failing files inside a detached worktree at `main` (`e1c953f`, `task-16142`): **`Test Files 6 failed (6) | Tests 16 failed | 22 passed (38)`** — exact 1:1 match (`OrionWindow.tsx` `useSupplyChain` missing provider + `OrionMissionControl` + `mobileAIForensicResponsiveness`). **Baseline classification: 100% VERIFIED.**
5. **Playwright E2E Audit (`task-16087` -> `192 passed | 68 failed | 1 skipped (261)`):**
   - Independent inspection of all 68 failures showed the prior report overgeneralized:
     - **31/68** failed on the `Sign in to Orion` screen (`closedLoopOutcomes` 13, `wave11EnterpriseScale` 7, `crossDeviceWorkspaceAndFS` 5, `desktopWorkspaceAndFileSystem` 5, `windowControlsPlacement` 1).
     - **15/68** failed with **`ENOENT: open 'C:\Users\LENOVO\.gemini\antigravity\brain\...'`** (`commandCenterInspectorLayout` 8, `orbitalCoreVisual` 7).
     - **22/68** failed on UI selectors, pointer interception, boot screen, or Hindi copy (`responsiveMultiDevice` 8, `startMenuDesktopDrag` 6, `worldLanguageSelector` 2, `globe` 1, `desktopContextMenuVFS` 1, `desktopWidgetDrag` 1, `wallpaperDiagnostic` 1, `productionControlPlane` 1).
   - None of those failing files/paths were modified on this branch (`git diff --stat main`), though Playwright itself was not re-executed on `main` (`e1c953f`).

---

## TASK 5 — Security & Isolation Verification

- **Cross-Tenant Data Isolation:** Verified strictly enforced in `firestore.rules`, `RealtimeSubscriptionManager.ts` (`0` leaks across `TENANT_A/B/C`), and `ScmPersistenceService.ts`. **Gap in Worker DEMO API:** `src/worker.ts` `/api/control-tower/data` and `controlTowerSnapshotCache` return shared baseline data keyed only by `${activeEnv}:${url.pathname}` rather than per-tenant datasets.
- **Authentication & RBAC Enforcement:** Verified `401` on missing/malformed Bearer tokens, `403` cross-environment token rejection (`DEMO` vs `LIVE`), and `403` on `viewer`/`analyst` mutations & non-admin AI/outbox routes (`rateLimiting.test.ts` + `workerAuthentication.test.ts` + Express parity in `server.ts`). **Note:** In `DEMO`/`STAGING`, `orion_sess:` tokens use static allowlisted signature tags (`sig_admin`, `sig_demo`, etc.) without HMAC signing, though `LIVE` mode (`workerSecurity.ts:465`) strictly rejects `orion_sess:` tokens.
- **Duplicate Transaction Protection:** `/api/edi/receive` rejects duplicate `${senderId}:${icNumber}` within an isolate via `seenInterchangeControlNumbers` (`MAX_SEEN_ICNS = 50000`, `409 DUPLICATE_TRANSMISSION`). Because this `Set` is in-memory per isolate (not shared across Cloudflare KV/Durable Objects/Firestore), cross-isolate replays in multi-POP production remain unprotected.
- **Firestore Rules Cost Observation:** `firestore.rules:18-34` (`isOrgMember()` / `isAdmin()`) fall back to `exists()` + `get(/users/$(uid))` per evaluated rule unless custom JWT claims (`tenantId`, `organizationId`, `role`) are minted on Firebase Auth tokens.

---

## Final Readiness Verdict — Controlled 150-Concurrent-User Staging Test

**Verdict: `CONDITIONAL GO`** — Ready to advance to a **controlled 150-concurrent-user staging test ONLY AFTER fixing two P0 blockers and committing the branch:**

1. **P0 — Fix EDI-to-QueueConsumer `idempotencyKey` Contract:** Include `idempotencyKey` (e.g. `dedupeKey`) when `src/worker.ts:1791` calls `env.SCM_EVENTS.send(...)` so queued EDI events process instead of landing in DLQ quarantine.
2. **P0 — Commit Changes & Deploy to Dedicated `--env staging`:** Working-tree changes on `perf/150-user-load-audit` are currently uncommitted, and remote `workers.dev` still serves `DEMO` + `gemini-3.8-flash`.
3. **P1 Recommendations Prior to Production Cutover:**
   - Align `server.ts` lines `889/1002/1065/1171/1203` from `'gemini-3.8-flash'` to `'gemini-2.5-flash'` + deadlines.
   - Move EDI `seenInterchangeControlNumbers` deduplication to Durable Objects/KV/Firestore for multi-isolate consistency.
   - Execute the **unrun 15-minute `STAGE_PRESET=sustained`** soak and re-verify warm standalone `control-tower` / `realtime` batch SLAs directly against real Cloudflare `--env staging` + real Firebase `LIVE`/`STAGING` Auth & Firestore.
