# Dual-Tier Persistence & Cache Architecture

Orion-9 combines cloud durability with local responsiveness:
1. **Cloud Tier (Cloud Firestore)**:
   - Single source of truth.
   - Enforces ACID transactional guarantees on stock movements and financial matches.
2. **Local Tier (IndexedDB / LocalForage)**:
   - High-speed client cache for instant window rendering.
   - Buffers offline mutations in the local outbox.
   - Automatically synchronizes when connectivity is restored.
