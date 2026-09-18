# ORION-9 — Kernel Command & Governance Specification

## Canonical Execution Pipeline

Every material operation in Orion-9 follows the 14-step canonical execution lifecycle:

1. **COMMAND**: Caller creates a typed `CommandEnvelope` containing `actor`, `tenant`, `payload`, `correlationId`, and optional `idempotencyKey`.
2. **VALIDATE**: Command envelope structure and payload field validation.
3. **AUTHENTICATE**: Verification of caller's identity via Firebase Auth.
4. **ACTOR RESOLUTION**: Resolution of actor ID, display name, and role.
5. **TENANT RESOLUTION**: Verification of caller's organization & tenant scope.
6. **AUTHORIZE**: Hard fail-closed authorization check (`AuthorizationEngine`). Stops execution on any role, permission, or tenant access denial.
7. **POLICY**: Governance rules evaluation (`PolicyEngine`). Determines whether action is allowed, blocked, or requires approval.
8. **RISK**: Financial and operational risk assessment (`RiskEngine`).
9. **APPROVAL**: If policy requires approval, execution halts, an `ApprovalRecord` is persisted in Cloud Firestore `approvals/{approvalId}`, and status `PENDING_APPROVAL` is returned.
10. **STATE VALIDATION**: Canonical state transition check (`StateMachine`). Rejects illegal state transitions (e.g. `DRAFT` → `RECEIVED`).
11. **TRANSACTION**: Atomic mutation in Cloud Firestore repository.
12. **EVENT**: Publishes typed `EventEnvelope` to `KernelEventBus` and mirrors to Cloud Firestore `events/{eventId}`.
13. **AUDIT**: Records immutable audit entry in `KernelAuditEngine` and Cloud Firestore `audit_logs/{auditId}`.
14. **OUTCOME**: Returns typed `CommandResult` to caller.
