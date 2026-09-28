# ORION-9 — Track 1: SCM Authority & Data Foundation

## 1. Executive Summary & Program Scope

**Track 1: SCM Authority & Data Foundation** establishes the single authoritative persistence source of truth, canonical data contracts, master data lifecycle governance, multi-tier referential integrity, strict tenant isolation, DEMO/LIVE environment fencing, and immutable transaction ledgers for the Orion-9 Enterprise Supply Chain Operating System.

### Track 1 Authority Boundaries
- **Cloud Firestore Persistence Authority**: Live enterprise operational transactions are authoritatively committed to Cloud Firestore with read caching via IndexedDB/memory.
- **Canonical SCM Entity Registry**: Standardizes 31 core enterprise entities across 9 SCM domains with deterministic primary keys, lifecycle states, allowed transitions, and foreign key dependencies.
- **ScmReferentialIntegrityEngine**: Guarantees referential validity, tenant consistency, and active-state requirements prior to transaction posting.
- **Tenant & Environment Isolation**: Strict fail-closed isolation across database queries, memory caches, outbox synchronization, and Firestore security rules.
- **Executable Data Quality Framework**: 7-dimensional scoring model (Completeness, Validity, Consistency, Uniqueness, Referential Integrity, Freshness, Provenance) with automated 2-tier deduplication.
- **Immutable Inventory Ledger & Idempotency**: Transaction-driven stock balance updates preventing negative on-hand inventory and duplicate posting via `correlationId` tracking.

---

## 2. Canonical SCM Entity Matrix (31 Core Entities)

| # | Entity Name | Domain Category | Collection Path | Primary Key | Scoping Key | Immutability |
|---|---|---|---|---|---|---|
| 1 | **Tenant** | IDENTITY_TENANCY | `organizations` | `id` | `tenantId` | Mutable |
| 2 | **Organization** | IDENTITY_TENANCY | `organizations` | `id` | `tenantId` | Mutable |
| 3 | **User** | IDENTITY_TENANCY | `users` | `id` | `tenantId` | Mutable |
| 4 | **Supplier** | PROCUREMENT | `suppliers` | `supplierId` | `tenantId` | Mutable |
| 5 | **Customer** | CUSTOMER_ORDERS_FULFILLMENT | `customers` | `customerId` | `tenantId` | Mutable |
| 6 | **Product** | MASTER_DATA | `products` | `productId` | `tenantId` | Mutable |
| 7 | **Material** | MANUFACTURING | `materials` | `materialId` | `tenantId` | Mutable |
| 8 | **Warehouse** | INVENTORY_WAREHOUSING | `warehouses` | `warehouseId` | `tenantId` | Mutable |
| 9 | **Plant** | MANUFACTURING | `plants` | `plantId` | `tenantId` | Mutable |
| 10 | **Location** | MASTER_DATA | `locations` | `locationId` | `tenantId` | Mutable |
| 11 | **Inventory** | INVENTORY_WAREHOUSING | `inventory` | `id` | `tenantId` | Mutable |
| 12 | **PurchaseRequisition** | PROCUREMENT | `purchase_requisitions` | `prId` | `tenantId` | Mutable |
| 13 | **RFQ** | SOURCING | `rfqs` | `rfqId` | `tenantId` | Mutable |
| 14 | **SupplierQuote** | SOURCING | `quotations` | `quotationId` | `tenantId` | Mutable |
| 15 | **PurchaseOrder** | PROCUREMENT | `purchase_orders` | `poId` | `tenantId` | Mutable |
| 16 | **PurchaseOrderLine** | PROCUREMENT | `po_lines` | `lineId` | `tenantId` | Mutable |
| 17 | **SupplierConfirmation** | PROCUREMENT | `supplier_confirmations` | `id` | `tenantId` | **Immutable** |
| 18 | **BOM** | MANUFACTURING | `boms` | `bomId` | `tenantId` | Mutable |
| 19 | **Routing** | MANUFACTURING | `routings` | `routingId` | `tenantId` | Mutable |
| 20 | **WorkCenter** | MANUFACTURING | `work_centers` | `workCenterId` | `tenantId` | Mutable |
| 21 | **ProductionOrder** | MANUFACTURING | `production_orders` | `productionOrderId` | `tenantId` | Mutable |
| 22 | **ASN** | LOGISTICS_TRANSPORT | `asns` | `asnId` | `tenantId` | Mutable |
| 23 | **Shipment** | LOGISTICS_TRANSPORT | `shipments` | `shipmentId` | `tenantId` | Mutable |
| 24 | **ShipmentLine** | LOGISTICS_TRANSPORT | `shipment_lines` | `lineId` | `tenantId` | Mutable |
| 25 | **Receiving** | INVENTORY_WAREHOUSING | `receipts` | `receivingId` | `tenantId` | Mutable |
| 26 | **GRN** | INVENTORY_WAREHOUSING | `grns` | `grnId` | `tenantId` | Mutable |
| 27 | **InventoryTransaction** | INVENTORY_WAREHOUSING | `inventory_transactions` | `transactionId` | `tenantId` | **Immutable** |
| 28 | **CustomerOrder** | CUSTOMER_ORDERS_FULFILLMENT | `customer_orders` | `orderId` | `tenantId` | Mutable |
| 29 | **CustomerOrderLine** | CUSTOMER_ORDERS_FULFILLMENT | `customer_order_lines` | `lineId` | `tenantId` | Mutable |
| 30 | **Fulfillment** | CUSTOMER_ORDERS_FULFILLMENT | `fulfillments` | `fulfillmentId` | `tenantId` | Mutable |
| 31 | **Invoice** | FINANCE_SETTLEMENT | `invoices` | `invoiceId` | `tenantId` | Mutable |

---

## 3. Master Data Authority & Canonical Lifecycle

Master data records follow deterministic identity rules (e.g. `SUP-001`, `PRD-001`, `WH-001`) and standard progression states:

```
[Draft] ──> [Pending Review] ──> [Approved] ──> [Active] ──> [Inactive] ──> [Archived]
  │               │                 │              │            │
  └──[Archived]   └──[Draft/Reject] └──[Draft]     └──[Archived]└──[Active]
```

### Lifecycle Transition Rules
1. Direct promotion from `Draft` to `Active` is strictly prohibited without passing validation and approval.
2. Inactive records cannot be referenced by new operational transactions (POs, ASNs, GRNs, Work Orders).
3. Archived records are permanently terminal and cannot transition back to `Active`.

---

## 4. Referential Integrity & Relationship Engine

The `ScmReferentialIntegrityEngine` (`src/scm/canonical/ScmReferentialIntegrityEngine.ts`) evaluates all transactional mutations against the active tenant database:

```typescript
const integrityResult = await scmReferentialIntegrityEngine.validateIntegrity({
  entityName: 'PurchaseOrder',
  record: poRecord,
  tenantId: 'TENANT_001',
});

if (!integrityResult.isValid) {
  // Halts execution and returns structured integrity violations
  throw new Error(`Referential integrity violation: ${integrityResult.violations[0].message}`);
}
```

### Validation Checks:
- **Foreign Key Existence**: Asserts that referenced entity IDs exist in target collections.
- **Tenant Consistency**: Blocks cross-tenant references (e.g., Tenant A PO cannot reference Tenant B Supplier).
- **Active State Requirement**: Confirms that suppliers, products, and warehouses are in `Active` or `Approved` state.

---

## 5. Strict Multi-Tenant & DEMO/LIVE Isolation

```
┌────────────────────────────────────────────────────────┐
│                   ORION-9 TENANT GUARD                 │
├──────────────────────────┬─────────────────────────────┤
│        LIVE MODE         │          DEMO MODE          │
│   (Authoritative Cloud)  │     (Isolated Synthetic)    │
├──────────────────────────┼─────────────────────────────┤
│ orion9:live:tenantA:...  │ orion9:demo:tenantA:...     │
│ Cloud Firestore LIVE DB  │ In-Memory / Demo Storage    │
│ Strict Security Rules    │ Synthetic Reset Permitted   │
│ Outbox: LIVE tags only   │ Outbox: DEMO tags only      │
└──────────────────────────┴─────────────────────────────┘
```

1. **Cache Namespacing**: Format `orion9:{environment}:{tenantId}:{collection}:{id}` prevents cross-environment cache pollution.
2. **Outbox Guard**: Replay engine blocks any payload where `payload.environment !== currentEnvironment`.
3. **Firestore Security Rules**: Rules enforce `isOrgMember(resource.data.tenantId)` and prohibit updating `tenantId` once created.

---

## 6. Deterministic Inventory Transactions & Idempotency

Inventory quantities on-hand are **never mutated directly** by the UI. All balance modifications must pass through `ScmPersistenceService.adjustInventory`:

```typescript
const tx = await scmPersistenceService.adjustInventory({
  tenantId: 'TENANT_001',
  productId: 'PRD-001',
  warehouseId: 'WH-001',
  quantityDelta: 100,
  transactionType: 'GRN_RECEIPT',
  referenceEntityType: 'GRN',
  referenceEntityId: 'GRN-001',
  actor: 'dock_master',
  correlationId: 'CORR-GRN-001-UNIQUE',
});
```

### Invariants Enforced:
- **Negative Stock Protection**: If `currentOnHand + delta < 0`, the transaction is rejected with `[SCM-VALIDATION-ERROR]`.
- **Idempotency via Correlation ID**: Re-submitting the same `correlationId` returns the existing transaction without applying a duplicate balance change.
- **Immutable Ledger Entry**: Every mutation posts an immutable record into `inventory_transactions` with `balanceBefore`, `balanceAfter`, and timestamp.

---

## 7. Executable 8-Step Golden Data Journey

The Golden Data Journey test (`src/__tests__/scm/track1GoldenDataJourney.test.ts`) verifies the end-to-end flow:

```
[1. Tenant] ──> [2. Supplier] ──> [3. Product] ──> [4. Warehouse]
                                                         │
[8. Inventory Tx] <── [7. GRN] <── [6. ASN] <── [5. Purchase Order]
```

1. **Tenant Provisioned**: Organization created with `LIVE` environment tag.
2. **Supplier Activated**: Supplier master record created and validated in `Active` status.
3. **Product Activated**: SKU registered with UOM, cost, and lead time in `Active` status.
4. **Warehouse Created**: Logistics facility node initialized in `Active` status.
5. **Purchase Order Issued**: PO and PO lines created referencing active Supplier and Product.
6. **ASN Received**: Advance shipping notice ingested with tracking number and lot metadata.
7. **GRN Posted**: Goods receipt note verified against PO and physical dock receiving.
8. **Inventory Adjusted**: On-hand stock incremented by 500 units; immutable transaction logged.

---

## 8. Test Execution & Verification

Track 1 test coverage is validated by Vitest:
- `src/__tests__/scm/track1ScmAuthority.test.ts` (14 unit and integration tests)
- `src/__tests__/scm/track1GoldenDataJourney.test.ts` (1 full end-to-end golden journey test)
- Global suite passing with 0 TypeScript compilation errors.
