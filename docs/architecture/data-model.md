# Firestore Schema & Entity Model

## Primary Collections

| Collection | Key Fields | Description |
|---|---|---|
| `purchase_orders` | `id`, `tenantId`, `supplierId`, `items`, `totalUsd`, `status` | Authoritative procurement documents. |
| `inventory_items` | `sku`, `tenantId`, `facilityId`, `onHand`, `reserved`, `safetyStock` | Real-time multi-location stock records. |
| `shipments` | `id`, `tenantId`, `carrierId`, `corridor`, `eta`, `status` | Multimodal transit consignments. |
| `events` | `id`, `tenantId`, `type`, `correlationId`, `payload`, `timestamp` | Immutable event fabric stream. |
| `audit_logs` | `id`, `tenantId`, `actor`, `action`, `targetEntity`, `result` | Cryptographically sealed compliance audit log. |
| `approvals` | `id`, `tenantId`, `commandId`, `requiredRole`, `status` | Human-in-the-loop governance records. |

*For complete schema registry, see `docs/ORION-9-DATABASE-SCHEMA-REGISTRY.md`.*
