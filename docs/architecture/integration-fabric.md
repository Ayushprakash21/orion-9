# Integration Fabric & Canonical Pipeline

```mermaid
flowchart LR
    External[External ERP / EDI / TMS] --> Ingestion[Ingestion Webhook / SFTP]
    Ingestion --> Validation[Schema Validation]
    Validation -- Valid --> Canonical[Canonical Transformation]
    Validation -- Invalid --> DLQ[Dead Letter Queue: integration_dlq]
    
    Canonical --> Idempotency{Idempotency Check}
    Idempotency -- New --> Bus[Kernel Command Bus]
    Idempotency -- Duplicate --> LogDuplicate[Emit Duplicate Notice]
    
    Bus --> Firestore[(Cloud Firestore)]
```

## Canonical Entities
The `ScmCanonicalRegistry` transforms external proprietary schemas (SAP IDocs, Oracle REST payloads, EDIFACT messages) into standardized internal TypeScript interfaces, isolating core business engines from external system idiosyncrasies.
