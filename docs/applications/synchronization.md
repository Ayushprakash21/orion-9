# Synchronization Monitor & Offline Outbox

## Dual-Tier Sync Architecture
The Sync Monitor (`src/components/SyncMonitor.tsx`) visualizes the real-time bridge between Cloud Firestore and local client storage:
- **Firestore Real-Time Listeners**: Instant reactive updates for active windows.
- **Local Outbox Queue**: When network connectivity drops, state mutations are buffered in IndexedDB (`SC_DB`).
- **Conflict Resolution**: Deterministic Last-Write-Wins (LWW) with server timestamp validation and conflict event emission.
