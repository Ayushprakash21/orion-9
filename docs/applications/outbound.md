# Outbound Warehouse & Wave Picking

## Operational Scope
The Outbound module (`src/components/Outbound.tsx` and `src/components/OutboundExecutionCenter.tsx`) manages customer order fulfillment, wave releases, picking schedules, and shipping manifests.

## Key Capabilities
- **Wave Release Engine**: Batches customer orders by shipping priority, destination corridor, or carrier cut-off times.
- **Pick-Pack-Ship Automation**: Generates optimal picking sequences (zone, batch, or cluster picking) to minimize warehouse travel distance.
- **Cartonization & Barcoding**: Calculates packing volume and prints GS1-standard 128 shipping labels and bills of lading.
- **Carrier Dispatch**: Integrates with major multimodal freight carriers to schedule pickup and generate cryptographic proof-of-delivery (POD) tokens.
