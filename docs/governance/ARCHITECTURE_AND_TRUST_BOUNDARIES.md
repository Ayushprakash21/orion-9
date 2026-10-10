# ORION-9 — ARCHITECTURE & TRUST BOUNDARIES SPECIFICATION

---

## 1. Zero-Trust System Architecture

```
[ User Browser / Mobile / Tablet ]
                 │
                 │ HTTPS (TLS 1.3 / Strict-Transport-Security)
                 ▼
    ┌─────────────────────────┐
    │  Cloudflare Worker Edge  │
    │  - Rate Limiting        │
    │  - Bearer Token Auth    │
    │  - CORS / Origin Allow  │
    │  - Error Sanitization   │
    └────────────┬────────────┘
                 │ Verified WorkerAuthUser
                 ▼
    ┌─────────────────────────┐
    │     Orion OS Kernel     │
    │  - CommandBus           │
    │  - AuthorizationEngine  │
    │  - PolicyEngine         │
    │  - Autonomy Firewall    │
    └────────────┬────────────┘
                 │ Authorized Command Envelope
                 ▼
    ┌─────────────────────────┐
    │   Workflow & Approval   │
    │  - Segregation of Duties│
    │  - Four-Eyes Approval   │
    │  - Multi-tier Escalation│
    └────────────┬────────────┘
                 │ Verified Transaction
                 ▼
    ┌─────────────────────────┐
    │   Persistence & Audit   │
    │  - Cloud Firestore      │
    │  - Security Rules       │
    │  - Append-Only Audit    │
    │  - Outcome Verification │
    └─────────────────────────┘
```

---

## 2. Trust Invariants & Boundary Enforcements

1. **Client Untrusted Invariant:** Browser storage (`localStorage`, `sessionStorage`, IndexedDB) is treated as an untrusted client cache. No privilege, role, or approval grant is derived from local storage.
2. **Fail-Closed Gate Invariant:** Any failure in token verification, permission lookup, policy engine evaluation, or approval retrieval results in an immediate `401 Unauthorized` or `403 Forbidden` response.
3. **Tenant Boundary Invariant:** Every query, mutation, and command execution requires tenant validation matching the actor's verified `organizationId`. Cross-tenant data inference or modification is blocked at the edge and by database security rules.
4. **Segregation of Duties Invariant:** Requesters of consequential operational changes (such as Purchase Order releases, inventory write-offs, or supplier bank modifications) cannot approve their own actions.
5. **AI Autonomy Invariant:** AI models and agents operate under bounded autonomy (Level 0 to Level 4). AI confidence scores or generated recommendations can never override deterministic policy rules or approve pending transactions.
