# ORION-9 WAVE 11: GLOBAL OPERATIONS & TENANT HIERARCHY RUNBOOK

## 1. Operating Procedure: Enterprise Hierarchy Governance

### Overview:
The Global Operations Center (`/admin/global-ops`) provides real-time governance over the 7-level enterprise hierarchy.

### Standard Operating Procedures:
1. **Adding Organizational Nodes**:
   - Access `/admin/global-ops` as `platform_admin` or `organization_admin`.
   - Provide node Name, Level, Code, and Parent ID.
   - The engine automatically computes the canonical path `/ent-.../org-.../reg-...`.
   - Creation is verified against tenant isolation constraints in Firestore security rules.
2. **Auditing Multi-Site Topology**:
   - Inspect active sites and physical facilities linked to warehouse inventories.
   - Verify that all operational leaf nodes are assigned valid sovereign regions and regulatory jurisdictions.

---

## 2. Operating Procedure: Regional Data Residency Enforcement

### Overview:
The Regional Operations Center (`/admin/regional-ops`) monitors regional health, latency, error rates, and jurisdictional compliance.

### Boundary Types:
- **`STRICT_SOVEREIGN`**:
  - Ingress/egress bounded strictly to designated region (e.g. Frankfurt `reg-eu-central`).
  - Cross-region egress attempts are rejected fail-closed.
- **`CONDITIONAL_TRANSFER`**:
  - Payload fields evaluated against `restrictedFields` list.
  - Automatically replaces sensitive values with `[REDACTED:SOVEREIGN_POLICY]` prior to replication.

### Incident Remediation:
- If a data transfer failure occurs due to residency violation, inspect the audit entry in `data_residency_policies`.
- Verify whether the requesting entity possesses a signed regulatory transfer agreement before modifying allowed destination regions.
