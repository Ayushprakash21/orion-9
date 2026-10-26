# Troubleshooting & Diagnostics

## Common Diagnostics

### 1. Window Does Not Open
- Check browser console for `WindowManager` errors.
- Verify user's assigned role permits access to the requested application ID.

### 2. Synchronization Lag / Pending Outbox
- Open **Sync Monitor** (`/sync`).
- Inspect the number of pending transactions in IndexedDB outbox.
- Check network firewall rules for WebSocket / Firestore connections.

### 3. EDI Ingestion Failure
- Open **Integration Fabric** (`/integrations`).
- Check the Dead-Letter Queue (DLQ) for payload validation error messages.
