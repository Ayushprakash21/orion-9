# Roles & Permission Matrix

Orion-9 enforces a strict Role-Based Access Control (RBAC) model:

| Role | Permissions | Scope |
|---|---|---|
| **PLATFORM_ADMIN** | Full system configuration, policy definition, user management, audit review | All Tenants / Global |
| **TENANT_ADMIN** | Tenant configuration, user management, approval policies, integration setup | Single Tenant |
| **SCM_OPERATOR** | Day-to-day purchasing, inventory, shipment tracking, GRN creation | Operational Modules |
| **SCM_PLANNER** | S&OP consensus planning, demand forecasting, scenario simulation | Planning Modules |
| **AUDITOR** | Read-only access to audit logs, event fabric, and financial matches | Compliance Surfaces |
| **AI_AGENT** | Tool execution within strict pre-approved policy envelopes; cannot self-approve | Governed Gateway |
