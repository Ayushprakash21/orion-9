# ORION-9 Autonomous Operations Expansion

This build adds a unified Autonomous Operations Center for both standard users and administrators.

## User workspace

Route: `/autonomous-operations`

The user workspace includes:
- Mission Control / closed-loop operating lifecycle
- Supply Chain Digital Twin view
- Event Fabric / external signal posture
- Evidence-backed Decision Engine
- Scenario Lab / counterfactual simulation
- Specialized AI Agent workforce
- Integration Fabric visibility
- Master Data Intelligence
- Supply Chain Financial Intelligence
- Supply Chain Risk Graph
- Closed-loop Automation readiness
- AI Governance (Manual / Copilot / Autopilot)
- Learning Loop / outcome capture
- Ask ORION natural-language operational queries

## Admin control plane

Route: `/admin/autonomous-operations`

The admin view uses the same engine and workspace with platform-control context. It is also linked from the Admin sidebar and Admin Overview.

## Engine behavior

`src/services/AutonomousOperationsEngine.ts` provides deterministic local orchestration for:
- snapshot calculation from existing SCM context
- event generation from exceptions and delayed shipments
- decision generation and confidence scoring
- scenario simulation
- agent/integration/master-data posture
- natural-language operational answers
- persisted decision history in `localStorage`
- persisted learning outcomes in `localStorage`

## Important boundary

This expansion does **not** pretend to perform external ERP/WMS/TMS/MES/CRM mutations. The UI marks external execution as governed by connector credentials and policies. Existing ORION connector infrastructure can be attached to the execution boundary later.

Likewise, enterprise SSO/MFA/SCIM and production-grade model training require the existing backend/identity infrastructure; this build does not fabricate those capabilities.

## Existing ORION capabilities reused

The expansion sits on top of the existing inventory, procurement, suppliers, shipments, exceptions, decisions, scenarios, digital twin, intelligence, workflows, audit, RBAC and connector modules rather than replacing them.
