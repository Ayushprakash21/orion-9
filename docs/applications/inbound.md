# Inbound Logistics & Receiving Gate

## Operational Scope
The Inbound application (`src/components/Inbound.tsx` and `src/components/ReceivingGateCenter.tsx`) governs the arrival of freight from suppliers and intermodal transfer hubs.

## Inbound Workflow
1. **Advance Shipping Notice (ASN)**: Ingested via EDI 856 or API. Validates line items against issued Purchase Orders.
2. **Dock Scheduling**: Assigns arriving trucks to specific facility loading bays based on container dimensions and unloading equipment requirements.
3. **Optical Inspection & Scan**: Gate operators scan carton SSCC barcodes to verify physical quantities against the ASN manifest.
4. **Goods Received Note (GRN)**: Submitting the receipt immediately updates inventory records in Cloud Firestore and triggers the 3-Way Match finance pipeline.
