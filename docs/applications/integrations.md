# Integration Fabric & EDI Architecture

## Enterprise Connectors
The Integration Fabric (`src/integration/IntegrationFabric.ts`) provides canonical data adapters for external enterprise systems:
- **SAP S/4HANA & ECC**: RFC / BAPI connectors and IDoc integration for POs, ASNs, and material masters.
- **Oracle Fusion SCM**: REST API synchronization for orders, inventory, and shipment statuses.
- **Electronic Data Interchange (EDI)**:
  - **EDI 850**: Purchase Order Ingestion / Generation.
  - **EDI 856**: Ship Notice / Manifest (ASN).
  - **EDI 810**: Commercial Invoice.
  - **EDI 830**: Planning Schedule with Release Capability.

## Resilience Architecture
- **Idempotent Message Ingestion**: Document hash verification ensures duplicate EDI transmissions do not create duplicate records.
- **Dead-Letter Queue (DLQ)**: Malformed payloads are quarantined in `integration_dlq` with full error telemetry.
- **Reconciliation Engine**: Periodically executes bidirectional checksum audits between external systems and Firestore.
