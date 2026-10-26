# Scenario Lab & Disruption Simulation

## Purpose & Scope
The Scenario Lab (`src/components/Scenarios.tsx` and `src/components/admin/ScenarioLab.tsx`) allows risk managers to evaluate "what-if" disruptions without modifying live production operational data.

```mermaid
sequenceDiagram
    participant User as Risk Planner
    participant Lab as Scenario Lab
    participant Engine as Network Design Engine
    participant Baseline as Live SCM Baseline
    
    User->>Lab: Select Disruption (e.g., Rotterdam Port Strike)
    Lab->>Baseline: Snapshot Current Corridors & Inventory
    Lab->>Engine: Induce 7-Day Delay & Calculate Impact
    Engine-->>Lab: Financial Exposure: $1.2M, Stockouts: 3 Facilities
    Lab->>Engine: Evaluate Counter-Strategy (Air Bypass via Frankfurt)
    Engine-->>Lab: Recovery Cost: $280K, Protected Revenue: $1.8M
    Lab-->>User: Present Comparative Cost/Benefit Matrix
```

## Supported Disruption Models
- **Maritime Bottleneck**: Port closure or canal blockage with route transit delays.
- **Supplier Default**: Tier-1 or Tier-2 supplier insolvency triggering secondary sourcing.
- **Demand Surge**: Unanticipated 300%+ order spikes challenging regional fulfillment limits.
