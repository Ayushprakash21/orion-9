# Orion-9 Wave 10: Operations Runbook

## 1. System Health Monitoring

### Probing System Telemetry
1. Navigate to `/admin/operations` inside the Admin Platform Control Plane.
2. Verify overall health indicator:
   - **HEALTHY** (Green): All 8 subsystems normal.
   - **DEGRADED** (Amber): One or more components reporting high latency (> 100ms) or elevated heap.
   - **CRITICAL** (Red): Firestore or Kernel probe failure.
3. Review individual diagnostic probes:
   - Firestore Persistence Tier (< 25ms)
   - Firebase Auth Identity Layer (< 10ms)
   - Kernel CommandBus & PolicyEngine (< 5ms)
   - AI Agent Runtime & Provider (< 50ms)
   - Event Fabric & Signal Pipeline (< 10ms)
   - Distributed Job Queue & Leases (< 15ms)
   - Process Heap & Memory Footprint (< 1024 MB)
   - System Clock Drift (< 10ms)

---

## 2. Emergency Safety Controls & Kill Switches

In the event of an operational anomaly, navigate to `/admin/operations` $\rightarrow$ **Emergency Safety Locks**:

| Safety Lock | Purpose | Effect | Authorized Roles |
|---|---|---|---|
| **Production Write Lock** | Prevents data corruption during database maintenance or incident mitigation | Blocks all non-admin write operations across POs, inventory, and shipments | Platform Admin |
| **AI Action Kill Switch** | Halts unvetted autonomous agent recommendations | Immediately disables AI dispatch through Kernel CommandBus | Platform Admin, Security Lead |
| **Autonomous Workflow Kill Switch** | Pauses automated workflow state machine transitions | Enforces mandatory human approval before any workflow step advances | Platform Admin, Org Admin |
| **Read-Only Mode** | Complete freeze for disaster recovery or migration | Rejects all write commands platform-wide | Platform Admin |

---

## 3. Incident Management Workflow

### Declaring an Incident
1. Navigate to `/admin/incidents` $\rightarrow$ Click **Declare Incident**.
2. Select Severity:
   - **SEV1**: Complete customer-facing outage or critical data loss.
   - **SEV2**: Major degradation affecting critical workflows (e.g. ERP feed down).
   - **SEV3**: Minor functional degradation with available workaround.
   - **SEV4**: Informational or cosmetic glitch.
3. List impacted modules and suspected root cause.
4. Click **Confirm Declaration**. Blast radius score will automatically calculate.

### Incident Progression
1. **INVESTIGATING**: Assign lead engineer and engage troubleshooting.
2. **MITIGATED**: Deploy workaround, engage circuit breaker, or activate fallback queue.
3. **RESOLVED**: Confirm normal telemetry for at least 30 minutes.
4. **CLOSED**: Complete post-incident review and link root cause.
5. Log all actions in the **Append-Only Timeline Ledger**.

---

## 4. Circuit Breaker Maintenance

When external connectors (ERP SAP, Carrier 3PL, Customs EDI, Gemini AI) experience elevated failure rates:
1. Circuit breaker automatically trips to **OPEN** after 5 consecutive failures.
2. Traffic to the failing upstream is halted; fallback queue is engaged.
3. After 30 seconds reset timeout, state transitions to **HALF_OPEN**.
4. Operators can manually test and reset breakers via `/admin/operations` $\rightarrow$ **Circuit Breakers** $\rightarrow$ **Reset**.
