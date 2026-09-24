# ORION-9 DATABASE SECURITY & PERMISSIONS MATRIX

---

## 1. Role-Based Access Control (RBAC) Matrix

| Business Domain | Standard User (Buyer/Planner/Logistics) | Organization Admin | Platform Admin | AI Agent |
| :--- | :--- | :--- | :--- | :--- |
| **A. Identity & Access** | Read Self Profile | Read/Write Org Users & Roles | Read/Write All Tenants | Read Config |
| **B. Master Data** | Read / Write Assigned Domain | Read/Write All Org Master Data | Full Control Across Tenants | Read-Only |
| **C. Procurement** | Create PR / RFQ | Approve & Manage Contracts | Full Administrative Oversight | Generate Recommendations |
| **D. Inventory** | View Stock / Transfer Requests | Adjust Policies & Rebalance | Full Multi-Facility Control | Suggest Reorder Points |
| **E. Warehouse** | View & Execute Allocations | Zone Management & Dock Scheduling | Full Facility Control | Optimize Pick Paths |
| **F. Demand Planning** | View Forecasts & Baseline Demand | Override Forecasts & Set Targets | Global Model Configuration | Run Inference |
| **G. Manufacturing** | View Work Orders & Shop Floor | Schedule Orders & Dispatch | Global Capacity Management | Line Balancing |
| **H. Logistics** | Track Shipments & Consignments | Carrier Dispatch & Consolidation | Global Lane Configuration | Predict Delays |
| **I. Customer Orders** | Create & Track Sales Orders | Prioritize Allocation & SLA | Enterprise Order Flow Oversight | Allocate Inventory |
| **J. Finance** | View Invoices & 3-Way Matches | Authorize Payment Handoffs | Global Financial Integration | Detect Invoice Variance |
| **K. Control Tower** | Triage Exceptions | Configure Policy Rules & Resolve | Global Alert Management | Detect Signals & Anomalies |
| **L. Digital Twin** | Run Local What-If Simulations | Author Scenario Models | Platform-Wide Twin Calibration | Simulate Disruption Impact |
| **M. AI Workforce** | Interact with Copilot | Supervise & Audit Agent Actions | Configure Agent Guardrails | Execute Governed Prompts |
| **N. Workflow** | Execute Assigned Tasks | Author Workflows & Assign Teams | System-Level Orchestration | Automated Task Step |
| **O. Integration Fabric** | View Connector Status | Configure Partner Endpoints & EDI | System Gateway & Certifications | Parse Incoming Payloads |
| **P. Observability** | View Dashboard Latency | Review Incident RCA Reports | Full Telemetry & Probes | Anomaly Alerting |
| **Q. Outcome Learning** | View Feedback & Scorecards | Review Drift & Model Versioning | Promote Global AI Models | Generate Feedback Signals |
| **R. Governance** | View System Status | Manage Org Branding & Policies | **Database Control Plane (LIVE/DEMO)** | **STRICTLY BLOCKED** |

---

## 2. Hard Security Boundaries

1. **AI Agent Execution Boundary**: AI agents operate in an advisory capacity. Agents cannot directly write to `users`, `system_policies`, `branding_configs`, or execute `switchEnvironment`.
2. **Step-Up Verification Gate**: Switching to the `LIVE` database requires multi-step confirmation and mandatory audit reason logging.
3. **Cross-Tenant Rule Gate**: Every collection query is authenticated against `request.auth.token.tenantId`. Queries with missing or mismatched tenant IDs are rejected at the Firestore layer.
