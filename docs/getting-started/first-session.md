# Your First Operational Session

This guided walkthrough demonstrates an end-to-end purchasing, shipment tracking, and inventory receipt workflow in Orion-9.

## Step 1: Open Executive Command Center
Launch **Command Center** from the dock or search for `Command Center` in the launcher (`Alt + Space`).
- Inspect the **Global Corridor Map**: Identifies maritime canals, air bridges, and highway freight.
- Check the **Active Disruption Counter**: Displays active exceptions requiring attention.

## Step 2: Ingest an Order in "Buy Something"
1. Open the **Buy Something** guided purchasing workflow (`/buy`).
2. Select your procurement requisition category (Raw Materials, Sub-assemblies, Finished Inventory).
3. Choose a qualified Tier-1 supplier. The system evaluates supplier capacity and risk scores in real time.
4. Click **Generate Requisition**. A new PO document is deterministically committed to Firestore with status `ISSUED`.

## Step 3: Track Shipment & ASN
1. Open **Shipments** (`/shipments`).
2. Locate the generated consignment under your supplier.
3. Review the **Advance Shipping Notice (ASN)** and carrier bill of lading (BoL).
4. Monitor simulated GPS transit milestones.

## Step 4: Complete Goods Receipt (GRN) & 3-Way Match
1. Open **Inbound Receiving Gate** (`/inbound`).
2. Check in the arriving transport truck.
3. Scan cartons and confirm zero damage.
4. Issue the **Goods Received Note (GRN)**.
5. Open **Invoice 3-Way Match** (`/invoice-matching`). The system automatically validates:
   $$\text{Purchase Order} \equiv \text{GRN Quantity} \equiv \text{Supplier Invoice Price}$$
   Tolerances within 0.5% automatically approve payment; discrepancies trigger the **Approval Center**.
