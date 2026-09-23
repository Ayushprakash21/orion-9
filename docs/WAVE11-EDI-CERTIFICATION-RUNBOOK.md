# ORION-9 WAVE 11: EDI & TRADING PARTNER CERTIFICATION RUNBOOK

## 1. Overview
Trading partners must be certified before they can exchange production transactions with Orion-9. The Trading Partner Center (`/admin/trading-partners`) governs partner onboarding and automated compliance validation.

---

## 2. Onboarding Workflow
1. **Register Partner**:
   - Provide Partner ID, Legal Name, Partner Code, EDI Qualifier (`ZZ`, `01`, `14`), and EDI Identifier.
   - Configure Secret Reference or Certificate Reference (e.g. `cert://vault/demo-tenant/partner-cert`).
   - Initial status is automatically set to `ONBOARDING`.
2. **Execute Automated 8-Point Certification**:
   - Trigger the automated certification suite from `/admin/trading-partners` or via `IntegrationCertificationService`.
   - The engine validates all 8 mandatory compliance gates:
     1. `SCHEMA_VALIDATION`: Evaluates X12 segments (`ISA`, `GS`, `ST`, `BEG`, `PO1`, `CTT`, `SE`, `GE`, `IEA`).
     2. `CANONICAL_MAPPING`: Maps EDI transaction to Orion Canonical SCM entity.
     3. `AUTHENTICATION_HANDSHAKE`: Validates certificate reference existence and expiration.
     4. `TRANSPORT_ROUNDTRIP`: Verifies gateway perimeter acceptance.
     5. `IDEMPOTENCY_VERIFICATION`: Verifies suppression of replayed duplicate transmissions.
     6. `RECONCILIATION_AUDIT`: Validates transaction ledger sequence matching.
     7. `DEAD_LETTER_HANDLING`: Verifies poison pill isolation in the DLQ.
     8. `AUDIT_TRAIL_INTEGRITY`: Verifies cryptographic hash chain.
3. **Status Promotion**:
   - If all 8 gates pass (100% score), the partner status automatically transitions to `ACTIVE`.
   - The immutable audit report is stored in `integration_certifications` with permanent read-only status.
   - If any gate fails, partner remains in `ONBOARDING` or transitions to `TESTING`.

---

## 3. AS2 / SFTP Transport Best Practices
- **AS2 Message Packaging**: Always use SHA-256 for MIC computation. Synchronous MDN receipts should be requested for real-time delivery confirmations.
- **Control Number Symmetry**: Verify that `ISA13` equals `IEA02` and `GS06` equals `GE02` to prevent out-of-sequence processing or envelope tampering.
