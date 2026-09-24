# ORION-9 VISUALIZATION DATA SOURCE AUDIT

**Audit Date**: September 24, 2026  
**Auditor**: Orion-9 Core Platform Engineering  
**Scope**: Enterprise Control Tower, Operational Dashboards, SCM Domain Visualizations  
**Classification**: LIVE / DEMO / STATISTICAL / INTEGRATION BOUNDARY  

---

## 1. Executive Summary

This audit assesses every chart and metric visualization across Orion-9, establishing authoritative data lineage from persistence (Firestore/Event Fabric) and synthetic simulation (DEMO engine) to UI presentation. All legacy static mock calculations have been deprecated in favor of the unified **Orion-9 Realtime Visualization Architecture** (`src/core/visualization/`).

---

## 2. Complete Enterprise Chart & Visualization Inventory

| Chart Component | Application / Module | Metric(s) Tracked | Authoritative Source | Environment | Tenant Scoped | Realtime | Historical Persistence | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Network Health Trajectory** | Control Tower (`CommandCenter.tsx`) | Composite SCM Health, Domain Indices | `firestore/inventory`, `purchase_orders`, `shipments` | LIVE / DEMO | YES | YES | YES (`metric_snapshots`) | **CONNECTED** |
| **Capital & Disruption Risk** | Control Tower (`CommandCenterAnalytics.tsx`) | `CRITICAL_RISKS`, `CONTROL_TOWER_EXCEPTIONS` | `firestore/exceptions`, `shipments` | LIVE / DEMO | YES | YES | YES | **CONNECTED** |
| **Inventory Health Curve** | Inventory Optimization (`InventoryOptimization.tsx`) | `INVENTORY_ON_HAND`, `SAFETY_STOCK`, `STOCKOUT_RATE` | `firestore/inventory` | LIVE / DEMO | YES | YES | YES | **CONNECTED** |
| **Demand Forecast & Bounds** | Demand Forecasting (`DemandForecasting.tsx`) | `DEMAND_FORECAST`, Historical Consumption | `firestore/inventory`, `customer_orders` | LIVE / DEMO | YES | YES | YES | **CONNECTED** |
| **Procurement & Spend Trajectory** | Procurement Operations (`Procurement.tsx`) | `PO_SPEND`, `PO_CYCLE_TIME`, `SUPPLIER_OTIF` | `firestore/purchase_orders`, `suppliers` | LIVE / DEMO | YES | YES | YES | **CONNECTED** |
| **Logistics & Delivery OTIF** | Logistics Intelligence (`Shipments.tsx`) | `SHIPMENT_VOLUME`, `SHIPMENT_OTIF`, `TRANSIT_TIME` | `firestore/shipments` | LIVE / DEMO | YES | YES | YES | **CONNECTED** |
| **Working Capital & CCC** | Financial Intelligence (`WorkingCapital.tsx`) | `WORKING_CAPITAL`, `AR_OUTSTANDING`, `AP_OUTSTANDING` | `firestore/invoices`, `inventory` | LIVE / DEMO | YES | YES | YES | **CONNECTED** |
| **Quality & Defect Pareto** | Quality Management (`QualityCenter.tsx`) | `PRODUCTION_QUALITY`, `WARRANTY_CLAIMS` | `firestore/quality_inspections`, `exceptions` | LIVE / DEMO | YES | YES | YES | **CONNECTED** |
| **Supply Chain Pulse** | System Observability (`SupplyChainPulse.tsx`) | Event throughput, sync latency, error rate | `event_fabric`, `databaseHealthService` | LIVE / DEMO | YES | YES | YES | **CONNECTED** |
| **Digital Twin Scenario Delta** | Digital Twin (`DigitalTwin.tsx`) | Actual vs Simulated vs Forecast | `firestore/inventory` + `ScenarioEngine` | DEMO / SIM | YES | YES | NO (Scenario-scoped) | **CONNECTED** |
| **ERP / EDI Ingestion Rate** | Integration Center (`IntegrationCenter.tsx`) | Connector payload volume & sync status | `integration/edi`, `integration/sap` | LIVE / DEMO | YES | YES | NO | **INTEGRATION_BOUNDARY** |

---

## 3. Data Source Categories & Lineage

### 1. CONNECTED (Authoritative Live / Demo)
- Real transactional records from Firestore / in-memory repositories feed metric calculations via `LiveMetricsEngine`.
- Changes in transactions, events, or synthetic batches immediately recalculate metrics and emit updates through `RealtimeSubscriptionManager`.

### 2. DEMO_ONLY (Governed Synthetic Simulation)
- Driven by `DemoSyntheticDataEngine` and `DemoLiveSimulationEngine`.
- Events are tagged with `environment = DEMO`, batch ID, and tenant ID.
- Strictly prohibited from writing or streaming to the `LIVE` environment.

### 3. INTEGRATION_BOUNDARY (Unconfigured External Connectors)
- Displayed when external SAP, Oracle, or EDI carrier streams are not actively connected.
- The UI explicitly renders `INTEGRATION BOUNDARY` or `NO DATA AVAILABLE` with the exact diagnostic reason, **never inventing mock numbers or random curves in LIVE mode**.

---

## 4. Legacy Audit & Remediation Log

1. **`src/core/data/DataEngine.ts` `getKPIs()`**:
   - *Previous state*: Returned hardcoded empty array `[]`.
   - *Remediation*: Connected to compute actual inventory value, exception counts, supplier OTIF, and stockout counts directly from active transactional stores.
2. **`CommandCenterAnalytics.tsx`**:
   - *Previous state*: Used `Math.sin()` historical curve variation.
   - *Remediation*: Replaced with governed deterministic time-series snapshots derived from actual timestamps and persisted events.
