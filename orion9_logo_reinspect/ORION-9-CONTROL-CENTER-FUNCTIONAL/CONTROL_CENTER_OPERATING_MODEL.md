# ORION-9 Admin Control Center — Operating Model

The Control Center is a real admin control plane, not a visual dashboard.

## Navigation paths

- `/admin/control-center` — Control Plane Overview
- `/admin/control-center/domains/:domainId` — Domain and capability view
- `/admin/control-center/capabilities/:domainId/:capabilityId` — Capability policy editor
- `/admin/control-center/policies` — Policy management
- `/admin/control-center/approvals` — Human approval queue
- `/admin/control-center/ai-operations` — AI recommendation workspace
- `/admin/control-center/simulations` — No-write policy simulation
- `/admin/control-center/audit` — Control-plane audit history

## Operating lifecycle

Domain → Capability → Policy → Operating Mode → Governance → Simulation/Proposal → Approval → Controlled Execution → Audit

## Modes

- Manual: human operator executes through approved operational modules.
- AI Copilot: AI creates a recommendation/proposal; a human decides.
- AI Autopilot: AI may operate only within the saved policy, scope, threshold, cooldown and approval gates.

## Persistence

Control state, proposals and control-plane audit entries are stored in browser persistence under:

- `orion-control-plane-states`
- `orion-control-plane-proposals`
- `orion-control-plane-audit`

## Safety boundary

This build makes the control-plane workflows functional inside ORION, including state changes, proposals, approvals, simulations and audit records. It does not pretend that an external ERP, carrier, identity provider or infrastructure account is connected when no connector is configured. External writes must be attached to an authorized execution adapter before production use.
