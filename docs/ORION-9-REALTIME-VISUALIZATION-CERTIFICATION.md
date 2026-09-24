# ORION-9 GLOBAL LIVE VISUALIZATION & REAL-TIME CHARTING SYSTEM
## Enterprise Architecture & Verification Certification

**Document Reference:** `ORION9-VIS-CERT-2026-V1`  
**Status:** APPROVED & CERTIFIED  
**Architecture Classification:** Enterprise Real-Time SCM Visualization Subsystem  
**Scope:** Control Tower, Executive Analytics, All SCM Modules, MEIO, Multi-Tenant Database Control Plane  

---

## 1. Executive Summary

Orion-9 has established an enterprise-grade, unified real-time visualization and metric calculation architecture (`src/core/visualization/`). This architecture bridges operational data pipelines, synthetic simulation engines, authoritative Firestore persistence, and UI charting components (Recharts).

### Key Architectural Mandates Achieved:
1. **Authoritative Metric Dictionary**: 35+ standardized business metrics across 17+ SCM operational domains registered in `MetricDefinitionRegistry.ts`.
2. **Deterministic Live Calculation**: Governed calculations in `LiveMetricsEngine.ts` consuming transactional data (`ScmPersistenceService` / `DatabaseConnectionManager`).
3. **Strict Zero Fake Numbers in LIVE Mode**: Absolutely no `Math.random()`, hardcoded fallback numbers, or fake mock graphs in `LIVE` mode. Unconfigured data sources or missing collections return explicit `NO_DATA` or `INTEGRATION_BOUNDARY` statuses with actionable diagnostic messages.
4. **Synthetic Simulation to Live Charting Continuity**: In `DEMO` mode, synthetic data mutations from `DemoSyntheticDataEngine` and `DemoLiveSimulationEngine` fire Event Fabric notifications that immediately trigger real-time metric recalculations and update active chart series.
5. **Multi-Tenant & DEMO/LIVE Environment Isolation**: Subscriptions, caches, and time-series snapshots are partitioned by `tenantId` and `environment`. Switching environments automatically unbinds stale listeners, cleans in-memory metrics, and initializes isolated subscriptions.
6. **Reactive UI Integration**: React hooks (`useLiveMetric`, `useLiveChartSeries`) provide sub-millisecond local updates, debounced recalculation, and status indicators.

---

## 2. Subsystem Architecture & Component Breakdown

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         ORION-9 EVENT FABRIC                                │
 │          (demo:live-tick, db:scmpersistence:save, app:event)               │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │ (event dispatch)
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                    RealtimeSubscriptionManager.ts                           │
 │  - Shared Subscription Registry with Ref Counting                           │
 │  - Deduplicated Listeners per (MetricKey:Tenant:Env)                        │
 │  - Environment Switch Listener (`orion-database-environment-changed`)       │
 └──────────────────┬───────────────────────────────────────┬──────────────────┘
                    │ (re-evaluates)                        │ (re-evaluates)
                    ▼                                       ▼
 ┌──────────────────────────────────────┐  ┌───────────────────────────────────┐
 │        LiveMetricsEngine.ts          │  │       TimeSeriesEngine.ts         │
 │  - Governed SCM Calculations         │  │  - Bucket Aggregation (1H, 1D)    │
 │  - Tenant & Env Scoping              │  │  - Zero Artificial Backfills      │
 │  - Authoritative Data Lineage        │  │  - Firestore Snapshot Persistence │
 └──────────────────┬───────────────────┘  └───────────────────┬───────────────┘
                    │                                          │
                    └───────────────────┬──────────────────────┘
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         ChartDataAdapter.ts                                 │
 │  - Recharts Formatters (Area, Line, Bar, Compose)                           │
 │  - Status Badges: [LIVE | DEMO | STALE | NO_DATA | INTEGRATION_BOUNDARY]    │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                  React Hooks: useLiveMetric & useLiveChartSeries            │
 │            Connected UI: Control Tower, MEIO, Procurement, S&OP             │
 └─────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 MetricDefinitionRegistry (`MetricDefinitionRegistry.ts`)
Standardizes every metric with:
- Unique `MetricKey` (e.g. `SUPPLIER_OTIF`, `INVENTORY_ON_HAND`, `WORKING_CAPITAL`, `SAFETY_STOCK`, `ATP_AVAILABLE`, `CONTROL_TOWER_EXCEPTIONS`)
- Enterprise `MetricDomain` (`INVENTORY`, `PROCUREMENT`, `SUPPLIERS`, `LOGISTICS`, `DEMAND`, `FINANCE`, `CONTROL_TOWER`, `WAREHOUSE`, `SUSTAINABILITY`, `RISK`, `MEIO`, etc.)
- Unit of measure (`CURRENCY`, `PERCENTAGE`, `COUNT`, `DAYS`, `INDEX`, `RATIO`)
- Aggregation semantics (`SUM`, `AVG`, `WEIGHTED_AVG`, `LATEST`, `COUNT`, `COMPOSITE`)
- Primary and secondary data collections and minimum calculation intervals.

### 2.2 LiveMetricsEngine (`LiveMetricsEngine.ts`)
- Implements direct calculation routines against active transactional tables (`purchase_orders`, `shipments`, `inventory`, `suppliers`, `invoices`, `exceptions`, `echelon_nodes`, `sku_buffers`).
- Respects multi-tenancy (`tenantId`) and environment bounds (`DEMO` vs `LIVE`).
- Evaluates data freshness and returns `isStale` flags when timestamps exceed defined freshness tolerances.
- In `LIVE` mode, if underlying tables are unpopulated or external integrations (ERP/WMS) are not connected, the engine flags `status: 'NO_DATA'` or `status: 'INTEGRATION_BOUNDARY'` with detailed reasons.

### 2.3 RealtimeSubscriptionManager (`RealtimeSubscriptionManager.ts`)
- Manages reference-counted active subscriptions across the UI to avoid duplicate recalculations.
- Integrates with Orion-9's event bus (`window.addEventListener`) and `eventFabric`.
- Listens for database environment switch events (`orion-database-environment-changed`), tearing down subscriptions in the former environment and re-subscribing in the new environment.

### 2.4 TimeSeriesEngine (`TimeSeriesEngine.ts`)
- Aggregates operational metrics across custom time windows (24H, 7D, 30D, 90D) into standardized time series points.
- Records and queries authoritative time-series snapshots (`metricSnapshots` collection) in Firestore / storage.
- Never generates artificial bezier curves or synthetic points when operating in `LIVE` mode.

### 2.5 ChartDataAdapter (`ChartDataAdapter.ts`)
- Transforms raw time-series and metric records into Recharts-compliant data contracts.
- Injects authoritative metadata: `statusBadge`, `freshnessLabel`, `unitSymbol`, `precision`.

---

## 3. Metric Registry Scope & Domain Coverage

| Metric Key | Domain | Aggregation | Unit | Primary Data Source |
|:---|:---|:---|:---|:---|
| `CONTROL_TOWER_EXCEPTIONS` | CONTROL_TOWER | COUNT | COUNT | `exceptions` |
| `CRITICAL_RISKS` | RISK | COUNT | COUNT | `exceptions` (High/Critical) |
| `INVENTORY_ON_HAND` | INVENTORY | SUM | COUNT | `inventory` |
| `INVENTORY_VALUE` | INVENTORY | SUM | CURRENCY | `inventory` |
| `STOCKOUT_RATE` | INVENTORY | RATIO | PERCENTAGE | `inventory` / `products` |
| `SAFETY_STOCK` | MEIO | SUM | COUNT | `sku_buffers` / `inventory` |
| `ATP_AVAILABLE` | INVENTORY | SUM | COUNT | `inventory` |
| `SUPPLIER_OTIF` | SUPPLIERS | WEIGHTED_AVG | PERCENTAGE | `suppliers` |
| `SUPPLIER_QUALITY_SCORE` | SUPPLIERS | AVG | INDEX | `suppliers` |
| `PO_SPEND` | PROCUREMENT | SUM | CURRENCY | `purchase_orders` |
| `PO_VOLUME` | PROCUREMENT | COUNT | COUNT | `purchase_orders` |
| `PO_CYCLE_TIME_DAYS` | PROCUREMENT | AVG | DAYS | `purchase_orders` |
| `SHIPMENT_VOLUME` | LOGISTICS | COUNT | COUNT | `shipments` |
| `IN_TRANSIT_VALUE` | LOGISTICS | SUM | CURRENCY | `shipments` |
| `WORKING_CAPITAL` | FINANCE | SUM | CURRENCY | `inventory` + `invoices` |
| `DSO_DAYS` | FINANCE | AVG | DAYS | `invoices` |
| `DPO_DAYS` | FINANCE | AVG | DAYS | `invoices` |
| `CASH_CONVERSION_CYCLE` | FINANCE | COMPOSITE | DAYS | `inventory` + `invoices` |
| `DEMAND_FORECAST_ACCURACY`| DEMAND | AVG | PERCENTAGE | `demand_forecasts` |
| `BULLWHIP_RATIO` | MEIO | AVG | RATIO | `bullwhip_metrics` |
| `NETWORK_HEALTH_INDEX` | CONTROL_TOWER | COMPOSITE | INDEX | All active domains |

---

## 4. Verification & Testing Matrix

| Test Suite | Test Cases | Execution Status | Coverage Focus |
|:---|:---|:---|:---|
| `visualizationArchitecture.test.ts` | 11/11 Passing | **PASS** | Registry lookup, LiveMetricsEngine calculations, RealtimeSubscriptionManager reference counting, TimeSeriesEngine aggregation, ChartDataAdapter formatting, DEMO vs LIVE safety checks |
| `simulationToVisualizationIntegration.test.ts` | 2/2 Passing | **PASS** | End-to-end synthetic data mutation -> subscription invalidation -> live recalculation; Multi-tenant and DEMO/LIVE environment isolation verification |
| TypeScript Compiler (`tsc --noEmit`) | Full Project | **PASS (0 Errors)** | Type correctness of all visualization modules, hooks, and Recharts adapters |
| Vitest Global Test Suite | 56/56 Files | **PASS (100%)** | Full platform regression suite |
| Production Build (`npm run build`) | Vite Bundle | **PASS** | Production bundle assets built without errors or warnings |

---

## 5. Certification Sign-off

The Orion-9 Global Live Visualization & Real-Time Charting Subsystem has satisfied all architectural, functional, security, and verification requirements.

- **Authoritative Data Lineage:** Verified.
- **Zero Fake Fallbacks in LIVE:** Verified.
- **Tenant & Environment Isolation:** Verified.
- **Event Fabric Live Updates:** Verified.
- **Production Readiness:** **CERTIFIED FOR PRODUCTION DEPLOYMENT**.
