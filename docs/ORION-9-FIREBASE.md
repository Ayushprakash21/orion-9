# ORION-9 — Firebase & Storage Architecture

## Backend Platform

Orion-9 relies on **Google Firebase** as its sole cloud platform:

- **Firebase Authentication**: Manages identity tokens, password resets, and user sessions.
- **Cloud Firestore**: Enterprise NoSQL database for real-time state, approvals, idempotency, event fabric, audit traces, and domain entities.
- **IndexedDB / LocalForage**: Browser-native offline storage and outbox queue.

## Firestore Collections

| Collection Path | Purpose | Access Control |
|---|---|---|
| `users/{userId}` | User profiles & organization claims | Owner or Org Admin |
| `organizations/{orgId}` | Organization & tenant configuration | Org Member (Read), Admin (Write) |
| `purchase_orders/{poId}` | Purchase orders & domain state | Org Member (Read/Create/Update) |
| `inventory/{itemId}` | Inventory items & lot tracking | Org Member |
| `suppliers/{supplierId}` | Vendor profiles & performance | Org Member |
| `shipments/{shipmentId}` | Freight & shipment tracking | Org Member |
| `approvals/{approvalId}` | Durable human approval requests | Org Member (Read), Approver/Admin (Write) |
| `idempotency/{key}` | Durable idempotency keys | Authenticated |
| `events/{eventId}` | Event fabric envelopes | Org Member (Read), Authenticated (Create) |
| `policies/{policyId}` | Governance policy rules | Authenticated (Read), Admin (Write) |
| `audit_logs/{auditId}` | Immutable audit traces | Org Member (Read), Append-Only (Create) |
| `administration/{docId}` | System configuration & integration secrets | Platform Admin ONLY |
