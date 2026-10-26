# Master Data Center

The Master Data Center (`src/components/MasterDataManager.tsx`) governs the enterprise supply chain ontology:
- **Product Master**: SKUs, Bill of Materials (BOM), unit dimensions, handling requirements, hazard classifications.
- **Facility Master**: Manufacturing plants, distribution centers, cross-docks, dock door counts, GPS geofences.
- **Partner Registry**: Tier 1-3 suppliers, carrier fleets, 3PL partners, verified banking information.
- **Ledger Authority**: Defines the single source of truth for each entity attribute.
