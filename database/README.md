# Orion-9 Database Package

This directory contains the complete exported database for **Orion-9 Supply Chain Operating System**.

## Contents

- `orion9_full_database.json`: Consolidated JSON export containing all **611 records across 19 collections**.
- `collections/`: Individual JSON files for each supply chain subsystem:
  - **MEIO Engine**:
    - `echelon_nodes.json` (6 records)
    - `sku_buffers.json` (7 records)
    - `replenishment_orders.json` (5 records)
    - `bullwhip_metrics.json` (5 records)
  - **Logistics & YMS**:
    - `freight_consignments.json` (6 records)
    - `yard_appointments.json` (5 records)
    - `consolidation_plans.json` (3 records)
    - `lane_congestion_metrics.json` (6 records)
  - **Contracts & Sourcing**:
    - `contracts.json` (4 records)
    - `rfqs.json` (2 records)
  - **Scenarios & Digital Twin**:
    - `scenarios.json` (4 records)
    - `contingency_plans.json` (3 records)
  - **Core Operations**:
    - `products.json` (120 records)
    - `warehouses.json` (5 records)
    - `inventory.json` (120 records)
    - `suppliers.json` (25 records)
    - `purchase_orders.json` (150 records)
    - `shipments.json` (100 records)
    - `exceptions.json` (35 records)

## How the Database Works in Orion-9

1. **Client-Side (Local)**:
   - Uses **IndexedDB** via `localforage` under the database name `SC_DB` for ultra-fast, zero-latency offline performance.
   - Initial seeds are automatically loaded into IndexedDB on first run.

2. **Cloud (Firebase Firestore)**:
   - All 19 collections are also synchronized to Google Cloud Firestore under project `orion9-dev-db-2026`.
   - Use `scripts/upload_to_firebase.ts` to re-sync or migrate.
