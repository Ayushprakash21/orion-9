# ORION-9 — Enterprise Security & Authorization Architecture

This document details the security model, authentication pipelines, tenant isolation boundaries, and database authorization policies governing the **Orion-9 Supply Chain Operating System**.

---

## 1. Executive Security Architecture Overview

Orion-9 operates on a **zero-trust, multi-tenant cloud-native architecture** powered by **Google Firebase Authentication**, **Cloud Firestore Enterprise Rules**, and the **Orion-9 Kernel Security Subsystem**.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT / AGENT / OS                             │
│       Desktop / Mobile UI  •  Kernel Command Bus  •  Autonomous AI          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Bearer Token / Identity Context
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ORION-9 KERNEL SECURITY LAYER                         │
│  • Identity Resolution (No Email/User Enumeration)                          │
│  • AuthorizationEngine (Actor & Role Evaluation)                            │
│  • Privileged Admin Session Manager (15-Min Step-Up TTL)                     │
│  • Constant-Time Crypto & Salted SHA-256 Hashing                            │
│  • Namespaced Cache Key Isolation (`orion9:{env}:{tenant}:{col}:{id}`)      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Authenticated Token & Scoped Claims
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   FIREBASE AUTH & GOVERNED ENVIRONMENTS                     │
│  • LIVE: Authoritative Firebase Project (`orion9-dev-db-2026`)              │
│  • DEMO: Isolated Synthetic Sandbox (`demo-orion9-db-2026` / Emulators)     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Firestore Rules Evaluation (v2)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CLOUD FIRESTORE SECURITY RULES (V2)                      │
│  • Default Deny on all unmatched document paths                             │
│  • Strict Multi-Tenant Isolation (`isOrgMember(tenantId)`)                  │
│  • Approvals State Machine Integrity (`requiredApprovers`)                  │
│  • Immutable Append-Only Audit Logging (`allow update, delete: if false;`)   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication & Identity Management

### 2.1 Firebase Authentication as Single Authority
All human operators, enterprise accounts, and platform administrators authenticate through **Firebase Authentication** (`firebase/auth`), which serves as the sole authoritative identity provider.
- **Identity Resolution**: Handled via `authService.resolveIdentity`. Supports both organizational emails and unique usernames. If an identifier does not exist or credentials fail, generic error responses (`Invalid username or password.`) are returned to prevent user or email enumeration.
- **Dual-Environment Architecture**:
  - **LIVE Database**: Bound to authoritative production Firebase project (`orion9-dev-db-2026`).
  - **DEMO Sandbox**: Bound to an isolated sandbox project (`demo-orion9-db-2026`) or local Firebase Emulators (`auth:9099`, `firestore:8080`), ensuring test traffic never touches live tenant infrastructure.
- **Session Lifecycle & Hardened Boot**:
  - Ephemeral tokens and user profile metadata are verified on system boot.
  - Physical power-on sequences require explicit re-authentication (`LOGIN_REQUIRED`) before mounting operational command centers.

### 2.2 Strict DEMO vs. LIVE Trust Boundary
The platform maintains an absolute, non-interchangeable separation between the DEMO and LIVE operational environments:
- **Quarantined DEMO Credentials**: The default demo identities (`admin/admin`, `user/user`, `local-admin`, `local-user`) are strictly quarantined to the DEMO sandbox. Any attempt to supply demo credentials in the LIVE environment is rejected immediately with an explicit audit log (`DEMO_AUTH_REJECTED_IN_LIVE`) and will never touch Firebase Auth, Firestore, or Kernel execution.
- **Fail-Closed LIVE Authentication**: In the LIVE environment, Firebase Authentication is mandatory. If Firebase Auth returns an error, the system immediately fails closed and returns a generic error. The platform never falls back to demo credentials, mock profiles, or local users.
- **Client-Side Storage Untrusted**: The client-side cache (`localStorage.getItem('orion_auth_session')`) is strictly non-authoritative. In LIVE mode, any cached session is validated against the active environment, and the user identity is cross-referenced with authoritative records (`userService`, `organizationService`). Manipulated roles or organization IDs in local storage are ignored and rejected.
- **Session & Subscription Teardown**: Executing a user logout or switching environments instantly revokes any active privileged admin session, wipes local session storage, and terminates all active realtime Firestore snapshot listeners (`realtimeSubscriptionManager.cleanupUserSubscriptions`).

### 2.3 Authoritative Tenant Resolution & Identity Lifecycle
- **Tenant Verification**: In LIVE mode, identity resolution requires an assigned, active organization (`organizationService.getOrganizationById(profile.organizationId)`). Users without a valid active tenant are rejected with `UNAUTHORIZED_TENANT_ACCESS`.
- **Identity Deprovisioning & Suspension**: Inactive, suspended, or deprovisioned accounts (`status !== 'active'`) are immediately blocked from logging in, having privileged sessions issued, or executing kernel operations. Any existing privileged session is automatically revoked upon detection of disabled account status.

### 2.4 Enterprise SSO, SCIM 2.0 & MFA Status (Truthful Capability Registry)
Orion-9 provides interfaces and architectural support for enterprise identity federation, governed via `EnterpriseIdentityService`:
- **Single Sign-On (SSO - SAML 2.0 / OIDC)**:
  - *Architecture*: Supported.
  - *Current Status*: `NOT_CONFIGURED`.
  - *Truthful Boundary*: SAML 2.0 and OIDC protocols are architecturally supported. No external customer Identity Provider (IdP) is currently connected out-of-the-box. Full SSO federation is customer/environment-dependent and requires production IdP credentials.
- **SCIM 2.0 Identity Lifecycle Management**:
  - *Architecture*: Supported.
  - *Current Status*: `NOT_OPERATIONAL`.
  - *Truthful Boundary*: SCIM 2.0 user schemas are modeled. Automated inbound provisioning endpoints require deployment of an enterprise tenant gateway and are not operational out-of-the-box.
- **Multi-Factor Authentication (MFA) & Step-Up**:
  - *Architecture*: Supported (`STEP_UP_PASSWORD`, `TOTP`).
  - *Current Status*: `ENVIRONMENT_DEPENDENT`.
  - *Truthful Boundary*: Operational in-app step-up password verification is enforced for administrative privileged sessions (15-minute TTL). Production-grade hardware token / WebAuthn MFA is customer-managed via Google Cloud / Firebase Identity Platform.

---

## 3. Cloud Firestore Security Rules (v2)

Database security is enforced at the database engine level via [`firestore.rules`](./firestore.rules) using rules version 2.

### 3.1 Strict Default Deny
Every document path is closed by default. Only explicitly declared paths with valid tenant predicates allow access:
```javascript
match /{document=**} {
  allow read, write: if false;
}
```

### 3.2 Tenant Isolation & Organization Scoping
Multi-tenancy is enforced on every query and transaction using document-level `organizationId` and `tenantId` verification:
```javascript
function isAuthenticated() {
  return request.auth != null;
}

function isOrgMember(orgId) {
  return isAuthenticated() && (
    (request.auth.token != null && (
      request.auth.token.organizationId == orgId || 
      request.auth.token.tenantId == orgId
    )) ||
    (exists(/databases/$(database)/documents/users/$(request.auth.uid)) && (
      getUserData().organizationId == orgId ||
      getUserData().tenantId == orgId
    ))
  );
}
```
- **Operational Collections**: `purchase_orders`, `inventory`, `suppliers`, `shipments`, `exceptions`, `events`, `signals`, `customer_orders`, `atp_calculations`, and `decisions` strictly require `isOrgMember(resource.data.organizationId)`.
- **Compound Tenant Indexing**: Every collection in [`firestore.indexes.json`](./firestore.indexes.json) enforces `tenantId ASCENDING` as its leading composite index, ensuring high performance without cross-tenant query contamination.

### 3.3 State Machine & Approval Workflow Protection
Supply chain commitments cannot be arbitrarily approved or modified:
```javascript
match /approvals/{approvalId} {
  allow read: if isAuthenticated() && (isOrgMember(resource.data.organizationId) || isAdmin());
  allow create: if isAuthenticated() && isOrgMember(request.resource.data.organizationId);
  allow update: if isAuthenticated() && (
    isAdmin() ||
    (request.resource.data.status in ['APPROVED', 'REJECTED'] && 
     request.auth.uid in resource.data.requiredApprovers)
  );
  allow delete: if isAdmin();
}
```

### 3.4 Immutable Audit Logs
Audit records in `/audit_logs/{auditId}` are **append-only**. Once created by authenticated kernel services, updates and deletions are permanently blocked at the rule level:
```javascript
match /audit_logs/{auditId} {
  allow read: if isAuthenticated() && (isOrgMember(resource.data.organizationId) || isAdmin());
  allow create: if isAuthenticated();
  allow update, delete: if false; // Audit records are immutable once written
}
```

---

## 4. Kernel Authorization & Role-Based Access Control (RBAC)

### 4.1 Governed Roles & Hierarchy
The Orion-9 Kernel defines 9 standardized enterprise roles:
1. `platform_admin`: Global system configuration, tenant provisioning, database switching.
2. `organization_admin`: Organization-scoped administrator, user management, policy authoring.
3. `supply_chain_manager`: Full operational oversight across procurement, inventory, and logistics.
4. `planner`: Inventory optimization, ATP promising, demand forecasting.
5. `procurement_user`: RFQ creation, PO authoring, supplier management.
6. `inventory_user`: Warehouse stock movements, stock counts, adjustments.
7. `logistics_coordinator`: ASN management, shipments tracking, carrier scheduling.
8. `viewer`: Read-only operational transparency and report viewing.
9. `user`: Base authenticated organizational user.

### 4.2 Kernel AuthorizationEngine
Every command dispatched across the Kernel Command Bus passes through `AuthorizationEngine`:
- Evaluates actor type: `USER`, `ADMIN`, `SYSTEM`, `SERVICE`, `AI_AGENT`, `EXTERNAL_INTEGRATION`, `SCHEDULER`.
- Verifies resource-action permissions (e.g. `purchase_order:approve`, `shipment:reroute`).
- Verifies organizational boundaries before executing handlers.

### 4.3 Presentation vs Authority Invariant
Orion-9 provides two UX modes: **Simple Mode** (action-oriented business workflows) and **Advanced Mode** (canonical SCM execution).
> [!IMPORTANT]
> Mode switching alters **presentation and information disclosure only**. RBAC authority, tenant boundaries, approval thresholds, and privileged constraints remain identical and strictly enforced regardless of UX mode.

---

## 5. Privileged Session Engine & Step-Up Authentication

To defend against unauthorized administrative actions, Orion-9 employs a **Just-In-Time Step-Up Authentication Engine** (`privilegedSessionManager`):
- **Never static**: The client application never relies on a client-side boolean `isAdmin = true`.
- **Cryptographic Token**: Administrative access generates a cryptographically random 192-bit token (`crypto.getRandomValues`).
- **Strict 15-Minute TTL**: Privileged sessions expire automatically after 15 minutes (`PRIVILEGED_TTL_MS = 900,000 ms`).
- **Session-Only Storage**: Privileged sessions reside exclusively in `sessionStorage` (cleared immediately when tab or browser closes, never stored in persistent `localStorage`).
- **Explicit Revocation**: Administrative sessions are instantly revoked on manual lock, role changes, or user logout.

---

## 6. Cryptographic Integrity & Anti-Tamper Mechanisms

Implemented in [`src/kernel/security/crypto.ts`](./src/kernel/security/crypto.ts):
- **Salted SHA-256 Hashing**: Uses modern SubtleCrypto (`sha256:{salt}:{hash}`) with high-entropy salts for credential verification.
- **Timing Attack Mitigation**: Password and token verifications use constant-time XOR byte comparison (`verifyPassword`) to prevent timing side-channel exploits.
- **Distributed Correlation Tracing**: Every authentication attempt, decision evaluation, and state transition receives an RFC-compliant cryptographic correlation ID (`generateCorrelationId('trace')`).
- **Transactional Idempotency**: Commands generate deterministic idempotency keys (`generateIdempotencyKey`) scoped to 1-minute deduplication windows to prevent double-execution or replay attacks.

---

## 7. Database Environment Isolation & Cache Namespacing

The `DatabaseConnectionManager` guarantees that data from different environments and organizations cannot cross-contaminate:
- **Namespaced Caching**: In-memory and browser caches enforce the strict format:
  ```text
  orion9:{environment}:{tenantId}:{collection}:{documentId}
  ```
- **Lifecycle Teardown**: Switching between `LIVE` and `DEMO` automatically halts all active Firestore snapshot listeners, invalidates cache partitions, and recreates isolated channels.

---

## 8. Required Environment Variables Configuration

Configure the following environment variables in your deployment environment (`.env`):

```env
# ============================================================================
# ORION-9 ENTERPRISE CONFIGURATION
# ============================================================================

# Orion Platform Host & Gemini AI Copilot
APP_URL="https://orion9.network"
GEMINI_API_KEY="your_production_gemini_api_key"

# Live Firebase Project (Authoritative Production Database)
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="orion9-dev-db-2026.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="orion9-dev-db-2026"
VITE_FIREBASE_STORAGE_BUCKET="orion9-dev-db-2026.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="1031466156269"
VITE_FIREBASE_APP_ID="1:1031466156269:web:44dd23cdcc883f809b8ce4"

# Demo Firebase Project (Isolated Sandbox / Emulators)
VITE_DEMO_FIREBASE_API_KEY="AIzaSyDemo..."
VITE_DEMO_FIREBASE_AUTH_DOMAIN="demo-orion9-db-2026.firebaseapp.com"
VITE_DEMO_FIREBASE_PROJECT_ID="demo-orion9-db-2026"
VITE_DEMO_FIREBASE_STORAGE_BUCKET="demo-orion9-db-2026.firebasestorage.app"
VITE_DEMO_FIREBASE_MESSAGING_SENDER_ID="999999999999"
VITE_DEMO_FIREBASE_APP_ID="1:999999999999:web:demo44dd23cdcc883f809b8ce4"
```

> [!NOTE]
> All legacy Supabase dependencies and variables (`VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) have been fully retired and removed from the active runtime architecture.
