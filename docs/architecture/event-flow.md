# Event Fabric & Audit Engine

Every state-changing transaction in Orion-9 publishes an event to the Event Fabric:
- **Envelope Metadata**: Contains `eventId`, `tenantId`, `timestamp`, `correlationId`, and `causationId`.
- **Causation Tracing**: Allows operators to trace any inventory change back to the triggering Purchase Order, Goods Receipt, or automated policy decision.
- **Immutable Audit Ledger**: Audit records in `audit_logs` are append-only; Firestore security rules strictly prohibit updates or deletions.
