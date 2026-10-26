# End-to-End System Architecture

Orion-9 is architected around an event-driven, micro-kernel architecture designed for zero client authority, deterministic business calculations, and strict tenant isolation.

```mermaid
flowchart TD
    Client[Web Browser / Tauri Desktop] --> Edge[Cloudflare Workers / Reverse Proxy]
    Edge --> Auth[Firebase Authentication SDK]
    Edge --> API[Express / Node.js Application Server]
    
    API --> Kernel[Orion Kernel Command Bus]
    Kernel --> Engine1[19 Deterministic SCM Engines]
    Kernel --> Engine2[Policy & Governance Engine]
    Kernel --> Engine3[Audit & Event Fabric]
    
    Engine1 --> Firestore[(Google Cloud Firestore - Authoritative)]
    Engine2 --> Firestore
    Engine3 --> Firestore
    
    Firestore -.-> RealtimeSync[Firestore Realtime Snapshot Listeners]
    RealtimeSync -.-> Client
```

## Architectural Pillars
1. **Zero Client Authority**: Clients submit intents as commands; only the server-side kernel commits state changes.
2. **Deterministic Calculations**: No probabilistic or LLM-generated business numbers.
3. **Multi-Tenant Isolation**: Every collection query is filtered by `tenantId`.
4. **Offline Resilience**: Local-first IndexedDB buffer preserves operational continuity during network outages.
