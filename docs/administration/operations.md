# Operations Runbook & Health Monitoring

## System Health Endpoints
- `/health`: Returns HTTP 200 with uptime, memory usage, and database connection state.
- `/api/status`: Returns detailed latency metrics for Firestore, AI Gateway, and EDI connectors.

## Failover & Disaster Recovery
- Multi-region Firestore failover is managed natively by Google Cloud Platform.
- Client applications automatically switch to read-only cached mode during connectivity disruptions.
