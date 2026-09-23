# ORION-9 WAVE 11: REGIONAL FAILOVER & DISTRIBUTED FENCING RUNBOOK

## 1. Scope & Truthful Claims Boundary
This runbook governs the execution of regional failovers and disaster recovery drills. In non-production or test environments, failover sequences are classified as `SIMULATED` / `EMULATED`. Physical cloud cross-region DNS cutover and multi-cloud database failover remain `UNVERIFIED` until tested against live cloud infrastructure.

---

## 2. The 6-Phase Governed Failover Protocol

Every regional cutover must transition through the sequential 6-phase protocol without skipping any step:

```
[Phase 1: PREFLIGHT_VALIDATION]
  Verify target region status (must be ACTIVE or DEGRADED with >= 10k RPS headroom).
  Measure replication lag (RPO requirement: < 5.0 seconds).
       │
       ▼
[Phase 2: TRAFFIC_DRAIN]
  Set source region status to DRAINING.
  Allow in-flight saga transactions and command buses to complete (timeout: 15s).
       │
       ▼
[Phase 3: REPLICATION_FREEZE]
  Halt asynchronous log replication stream from source to prevent conflicting journal writes.
  Record sequence checkpoint number.
       │
       ▼
[Phase 4: TARGET_PROMOTION]
  Issue new monotonically increasing Fencing Token from FencingTokenManager.
  Advance Generation ID.
  Update target region status to ACTIVE.
       │
       ▼
[Phase 5: ROUTING_DIVERSION]
  Update Edge router and API Gateway routing ingress to point to target region.
  Source region transitioned to FAILOVER or OFFLINE.
       │
       ▼
[Phase 6: POSTFLIGHT_VERIFICATION]
  Execute synthetic end-to-end health probe against promoted target.
  Verify database read/write quorum and record RTO/RPO metrics in immutable audit log.
```

---

## 3. Split-Brain Invariant & Distributed Fencing
- **Fencing Token**: Whenever target promotion occurs, a new fencing token is generated (e.g., `#1005` $\rightarrow$ `#1006`).
- **Storage Protection**: All Firestore writes and external ERP mutations carry the active token. If a stalled primary region awakens and attempts to write with an older token, the write is rejected with `FencingTokenRejectedException`.
- **Drill Mode**: Scheduled disaster recovery drills can be executed safely by selecting "Disaster Recovery Drill Mode" in the UI. Drills execute synthetic workload transactions and verify RTO/RPO with zero disruption to real customer orders.
