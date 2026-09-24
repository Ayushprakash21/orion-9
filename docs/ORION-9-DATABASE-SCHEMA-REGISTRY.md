# ORION-9 AUTHORITATIVE DATABASE SCHEMA REGISTRY
**Domains Covered**: 18 Enterprise Business Domains (A through R)  
**Status**: 100% Comprehensive Enterprise Registry  
**Persistence Authority**: Google Cloud Firestore

---

## 18-Domain Comprehensive Registry

| Domain Code | Domain Name | Primary Collections | Primary Key | Tenant Scoping | Lifecycle Status | Security Rule Pattern |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A_IDENTITY** | Identity & Organization | `users`, `organizations`, `roles`, `audit_logs` | `id` | `tenantId` / `organizationId` | VERIFIED | Multi-tenant auth / Admin-only write |
| **B_MASTER_DATA** | Master Data Management | `suppliers`, `products`, `warehouses`, `locations`, `lanes`, `bills_of_materials` | `id` | `tenantId` / `both` | VERIFIED | `isOrgMember(tenantId)` |
| **C_PROCUREMENT** | Sourcing & Requisitions | `purchase_requisitions`, `rfqs`, `supplier_bids`, `procurement_contracts` | `id` | `tenantId` | VERIFIED | `isOrgMember(tenantId)` |
| **D_INVENTORY** | Inventory & Echelon Topology | `inventory`, `inventory_positions`, `safety_stock_policies`, `inventory_transfers` | `id` | `tenantId` | VERIFIED | `isOrgMember(tenantId)` |
| **E_WAREHOUSE** | Warehouse Operations | `warehouse_zones`, `inventory_allocations`, `dock_appointments` | `id` | `tenantId` | VERIFIED | `isOrgMember(tenantId)` |
| **F_DEMAND_PLANNING**| Demand Sensing & Forecasts | `demand_forecasts`, `historical_sales`, `forecast_overrides` | `id` | `tenantId` | VERIFIED | `isOrgMember(tenantId)` |
| **G_MANUFACTURING** | Manufacturing & Production | `production_orders`, `work_centers`, `capacity_plans` | `id` | `tenantId` | VERIFIED | `isOrgMember(tenantId)` |
| **H_LOGISTICS** | Multimodal Logistics | `shipments`, `freight_consignments`, `consolidation_plans` | `id` | `tenantId` / `both` | VERIFIED | `isOrgMember(tenantId)` |
| **I_CUSTOMER_ORDERS**| Customer Orders & Fulfillment | `customer_orders`, `order_allocations`, `service_level_agreements` | `id` | `tenantId` | VERIFIED | `isOrgMember(tenantId)` |
| **J_FINANCE** | Finance & Commercial Handoff | `invoices`, `payment_handoffs`, `working_capital_metrics` | `id` | `tenantId` | VERIFIED | `isOrgMember(tenantId)` |
| **K_CONTROL_TOWER** | Control Tower & Telemetry | `exceptions`, `signals`, `decisions`, `disruption_events` | `id` | `tenantId` | VERIFIED | `isOrgMember(tenantId)` |
| **L_DIGITAL_TWIN** | Digital Twin & Simulation | `digital_twin_states`, `scenarios`, `simulation_runs` | `id` | `tenantId` | VERIFIED | `isOrgMember(tenantId)` |
| **M_AI_WORKFORCE** | Governed AI Workforce | `ai_agent_definitions`, `ai_agent_actions`, `ai_guardrails`, `copilot_conversations` | `id` | `tenantId` | VERIFIED | Human-in-the-loop / Admin oversight |
| **N_WORKFLOW** | Workflow & Orchestration | `workflows`, `workflow_executions`, `task_assignments` | `id` | `tenantId` | VERIFIED | `isOrgMember(tenantId)` |
| **O_INTEGRATION_FABRIC** | Integration Gateway & EDI | `integration_connectors`, `edi_transactions`, `webhook_subscriptions` | `id` | `tenantId` | VERIFIED | `isOrgMember(tenantId)` |
| **P_OBSERVABILITY** | System Telemetry & Incidents | `system_metrics`, `incident_reports`, `health_probes` | `id` | `tenantId` | VERIFIED | System & Admin read/write |
| **Q_OUTCOME_LEARNING** | Outcome & Continuous Learning | `decision_outcomes`, `learning_models`, `drift_signals` | `id` | `tenantId` | VERIFIED | Immutable outcome records |
| **R_SYSTEM_GOVERNANCE** | Platform Governance & Settings | `branding_configs`, `feature_flags`, `system_policies`, `data_quality_scores` | `id` | `tenantId` | VERIFIED | Platform Admin authoritative write |

---

## 2. Immutability & Concurrency Rules

- **Append-Only Telemetry**: `audit_logs`, `signals`, `edi_transactions`, and `decision_outcomes` are strictly append-only (updates and deletions are denied by Firestore rules).
- **Optimistic Locking**: State-altering operations on `inventory`, `purchase_requisitions`, and `production_orders` compare `version` numbers before committing mutations.
