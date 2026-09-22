# Orion-9 Wave 10: Security Model & Hardening Specification

## 1. Tenets of Production Security

1. **Sole Authoritative Database**: Cloud Firestore + Firebase Auth remain the sole persistent store. 0 active references to Supabase.
2. **Zero Plaintext Secrets**: Secrets (Gemini API keys, Firebase service accounts, connector tokens) use the `SecretReference` abstraction with strict masking (`***`) in UI and client bundles.
3. **No Kernel Bypass**: All state mutations, approval workflows, and emergency safety actions route through the Kernel CommandBus with RBAC verification.
4. **Anti-AI Self-Approval**: AI agents are strictly forbidden from approving operational proposals, altering security rules, or overriding emergency safety locks.

---

## 2. Multi-Tenant Isolation & Role-Based Access Control

Every request is evaluated through standard helper functions:
```javascript
function isAuthenticated() { return request.auth != null; }
function isOwner(userId) { return isAuthenticated() && request.auth.uid == userId; }
function isOrgMember(orgId) { ... }
function isAdmin() { ... }
```

### Security Rules Matrix for Wave 10 Operational Collections

| Collection | Read Policy | Write Policy | Delete Policy |
|---|---|---|---|
| `system_configs` | Org Member or Admin | Admin Only | Admin Only |
| `config_versions` | Org Member or Admin | Admin Create Only | **DENIED** (Permanently Immutable) |
| `feature_flags` | Authenticated | Admin Only | Admin Only |
| `incidents` | Org Member or Admin | Org Member or Admin | **DENIED** (Permanent Audit Ledger) |
| `alerts` | Org Member or Admin | Authenticated Create | Admin Only |
| `runtime_jobs` | Org Member or Admin | Org Member or Admin | Admin Only |
| `backups` | Admin Only | Admin Only | **DENIED** (Permanent Snapshot Ledger) |
| `releases` | Authenticated | Admin Only | Admin Only |
| `integrity_findings`| Org Member or Admin | Org Member or Admin | **DENIED** (Compliance Record) |
| `environment_controls` | Org Member or Admin | Admin Only | Admin Only |

---

## 3. Secret Reference Provider Architecture

Secrets are never stored in raw plaintext in repository code, client bundles, or frontend local storage.
```typescript
interface SecretReference {
  secretId: string;
  provider: 'GOOGLE_SECRET_MANAGER' | 'HASHICORP_VAULT' | 'AWS_SECRETS_MANAGER' | 'CLOUDFLARE_SECRETS' | 'ENVIRONMENT_VARIABLE';
  referenceKey: string;
  isRedacted: true;
  maskedValue: '********';
}
```
Client-side attempts to resolve raw secret values are strictly blocked with security alerts.
