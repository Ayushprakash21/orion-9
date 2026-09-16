# ORION-9 — Phase 2 Security Hardening Blueprint

This document details the server-side authorization architecture, database schema alignment instructions, and security policies implemented for the production release of ORION-9.

---

## 1. Authentication & Secure Username Resolution
- **Email Enumeration Mitigation**: The `/api/auth/resolve-identity` endpoint dynamically resolves username inputs to emails via a secure server-side lookup on `public.profiles`. If the username does not exist, the server returns a generic `404 Invalid username or password.` error without revealing whether the username is valid or invalid.
- **Strict Key Requirement**: Legacy fallbacks like `VITE_SUPABASE_ANON_KEY` have been completely removed. Both the client-side `/src/lib/supabaseClient.ts` and server-side `/server.ts` enforce the presence of `VITE_SUPABASE_PUBLISHABLE_KEY`.

---

## 2. Server-Side Authorization Pipeline
All administrative endpoints under `/api/admin/*` are secured using JWT-based token verification:
1. **Access Token Extraction**: Reads the bearer token directly from the incoming `Authorization: Bearer <access_token>` request header.
2. **Identity Verification**: Checks the validity of the token with Supabase Auth via `admin.auth.getUser(token)`.
3. **Database Validation**: Retrieves the profile of the verified user from `public.profiles` and validates that `status` is `active`.
4. **Role & Membership Resolution**: Verifies the caller's organization membership and dynamic database role name (resolving `roles.name` as `platform_admin` or `organization_admin`).
5. **Organizational Scoping**:
   - `platform_admin`: Has global, unrestricted authority to manage users and resources across any organization.
   - `organization_admin`: Has scoped authority restricted strictly to their own organization. Creating, deleting, or resetting passwords of users outside their own organization is rejected with an HTTP `403 Forbidden` response.

---

## 3. Dynamic Role Assignment during User Creation
On administrative user creation (`POST /api/admin/users`), the specified role is dynamically resolved from `public.roles` where `name` matches the requested role parameter:
- Prevents empty or default-assigned role ids.
- Enforces strict role insertion into `public.organization_memberships` (with columns `user_id`, `organization_id`, `role_id`, and `status = 'active'`).

---

## 4. Audit Logging Architecture
A server-side audit logger writes privileged events directly to the `public.audit_logs` table for tracking compliance and operational changes:
- **Logged Events**:
  - `USER_CREATED` (On successful admin user creation)
  - `PASSWORD_RESET` (On password override)
  - `USER_DELETED` (On user termination)
- **Log Payload**: Records `actor_user_id`, target `organization_id`, `action`, target `entity_type`, target `entity_id`, and description context.
- **Privacy Enforcement**: Passwords, hashes, and access tokens are strictly stripped and never logged.

---

## 5. Database Schema Alignment
Execute the safe migration commands defined in `/migration.sql` in your Supabase SQL Editor. 
This script ensures all schema tables (`profiles` and `organizations`) match the frontend requirements by appending missing columns only if they do not already exist, avoiding any data loss:

```bash
# Locate and run the following file in your Supabase Console:
/migration.sql
```

---

## 6. Required Environment Variables (.env)
Ensure your `.env` configuration contains these server-side and client-side variables:

```env
# Server-Only Secrets (Never exposed to the client-side)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key

# Client-Facing Publishable Keys
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```
