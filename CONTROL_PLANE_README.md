# ORION-9 Control Plane

The Admin Control Center is a functional, local-persistence control plane.

Flow: Domain -> Capability -> Policy -> Operating Mode -> Governance -> Simulation/Proposal -> Approval -> Audit.

Routes:
- /admin/control-center
- /admin/control-center/domains/:domainId
- /admin/control-center/capabilities/:domainId/:capabilityId
- /admin/control-center/policies
- /admin/control-center/approvals
- /admin/control-center/simulations
- /admin/control-center/audit
- /admin/manual
- /manual

Storage keys:
- orion_control_policies
- orion_control_proposals
- orion_control_simulations
- orion_control_audit

AI modes are policy state in this UI. External ERP/carrier/identity writes require real authorized adapters; the UI does not fabricate those integrations.
