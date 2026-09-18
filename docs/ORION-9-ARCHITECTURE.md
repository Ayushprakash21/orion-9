# ORION-9 — Enterprise Operating System Architecture

## Overview
Orion-9 is a desktop-grade Supply Chain Operating System built on an autonomous, event-driven kernel architecture powered by Google Firebase (Authentication, Cloud Firestore, Storage) and local-first IndexedDB offline synchronization.

```
                    ORION-9 OS
                        │
                        ▼
                 ORION KERNEL
                        │
                 COMMAND BUS
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
         AUTHENTICATION       ACTOR RESOLUTION
              │                   │
              └─────────┬─────────┘
                        ▼
                 TENANT RESOLUTION
                        │
                        ▼
                  AUTHORIZATION (Fail-Closed)
                        │
              DENY ─────┤───── STOP
                        ▼
                    POLICY
                        │
                     RISK
                        │
              APPROVAL REQUIRED?
                  │           │
                 YES          NO
                  │           │
               STOP           │
                  │           │
           HUMAN APPROVAL     │
                  │           │
                  └─────┬─────┘
                        ▼
                 STATE ENGINE
                        │
                        ▼
              FIRESTORE TRANSACTION
                        │
                        ▼
                    EVENT FABRIC
                        │
                        ▼
                   AUDIT ENGINE
                        │
                        ▼
                    OUTCOME
```

## Architecture Pillars

### 1. Cloud & Local Tiering [IMPLEMENTED]
- **Primary Backend**: Firebase Authentication & Cloud Firestore.
- **Offline Cache & Outbox**: IndexedDB (LocalForage / `SC_DB`).
- **Supabase**: Completely Removed (0 active dependencies).

### 2. Single Login & Auth Authority [IMPLEMENTED]
- Entrypoint: `/login` (Single login portal for users and platform administrators).
- Authority: Firebase Auth SDK (`signInWithEmailAndPassword`). Client-side credential comparison & fallback hashes have been eliminated.

### 3. Fail-Closed Command Pipeline [IMPLEMENTED]
- All state-changing operations dispatch via `KernelCommandBus`.
- Authorization failures immediately halt execution (`UNAUTHORIZED`), emit a `BLOCKED` audit record, and return without falling through to the Policy Engine.

### 4. Durable Governance Engines [IMPLEMENTED]
- **Approvals**: Persisted in Firestore `approvals/{approvalId}`. Self-approval by the request creator is restricted.
- **Idempotency**: Persisted in Firestore `idempotency/{tenantId}_{key}`. Duplicate commands return original results without re-executing.
- **Event Fabric**: Envelope format with `correlationId` & `causationId` stored in Firestore `events/{eventId}`.
- **Audit Engine**: Immutable audit traces stored in Firestore `audit_logs/{auditId}`.

### 5. AI Agent Kernel Boundary [IMPLEMENTED]
- AI agents submit actions as Kernel Commands through the AI Gateway. AI agents operate under governed roles (`AI_AGENT`) and cannot bypass authorization, policy, or approval gates.
