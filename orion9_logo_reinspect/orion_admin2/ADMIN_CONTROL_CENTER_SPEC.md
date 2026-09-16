# ORION-9 Admin Control Center

This release adds a systematic platform control plane based on the supplied administration feature matrix.

## Operating model
- Manual: administrator configures and executes the change.
- Copilot: ORION AI inspects current configuration and prepares a proposed change for human approval.
- Autopilot: allowed only after explicit scope, policy and approval thresholds are configured.

## Governance
- Least privilege / deny by default.
- Explicit tenant scope.
- High-impact AI actions remain approval-gated.
- Configuration changes are intended to be auditable with actor, timestamp, scope and before/after state.

## Domains
Identity, Security, Platform Configuration, Master Data, Procurement, Inventory/Warehouse, Orders, Logistics, Manufacturing, Demand, Analytics, Integrations, Documents, Global Operations, System Operations, AI/ML, Partner Portals, Mobile/Field.

## Current implementation note
The UI provides the systematic control-plane taxonomy, per-capability policy state, mode selection and local policy persistence. Existing application services remain the execution layer. External providers such as SSO, KMS, EDI, Kafka, ERP connectors and third-party compliance services are not falsely represented as live integrations until their credentials/connectors are configured.
