# ORION-9 — External Dependencies, Integration Matrix & Runtime Prerequisites

**Document Version:** 9.0.0-PROD  
**Release Target:** Enterprise Supply Chain Operating System  
**Last Updated:** October 24, 2026  

---

## 1. Cloud Infrastructure & Edge Services

### 1.1 Cloudflare Workers Ecosystem
Orion-9 relies on Cloudflare's Edge platform for edge compute, secure asset hosting, messaging queues, and on-edge AI generation:

| Binding / Feature | Wrangler Resource Name | Purpose | Configuration / Fallback |
| :--- | :--- | :--- | :--- |
| **`ASSETS`** | Static asset fetcher | Serves React 19 single-page enterprise desktop application | Cloudflare edge static distribution |
| **`SCM_EVENTS`** | `orion-scm-events` | Cloudflare Queue for durable SCM event distribution | In-memory queue during DEMO mode |
| **`SCM_EVENTS_DLQ`** | `orion-scm-events-dlq` | Cloudflare Queue for dead-letter quarantined events | Quarantines unparseable or failed messages |
| **`AI`** | Workers AI binding | Generates desktop wallpapers using `@cf/black-forest-labs/flux-2-klein-4b` | Falls back to system static dark/light wallpapers |
| **`CLOUDFLARE_API_TOKEN`** | Cloudflare Secret | Direct Workers AI REST API authentication | Optional when native `AI` binding is attached |
| **`CLOUDFLARE_ACCOUNT_ID`**| Cloudflare Secret | Cloudflare tenant identification | Required for direct Workers AI calls |

---

## 2. Persistence & Identity Providers

### 2.1 Google Cloud / Firebase Ecosystem
| Component | Required Version | Role | Configuration / Keys |
| :--- | :--- | :--- | :--- |
| **Google Firebase Authentication** | v10.x SDK / JWK REST | Multi-tenant user identity and JWT token generation | `FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID` |
| **Google Cloud Firestore** | Datastore mode | Authoritative persistence for LIVE & STAGING SCM records, outbox, and audit events | REST API & Firebase Admin SDK |
| **Firebase Local Emulator Suite**| v13.x | Local testing of security rules | Requires OpenJDK 21 on the developer workstation |

### 2.2 Google Gemini AI Cognitive Engine
- **Model:** `gemini-3.8-flash`
- **Role:** Powers natural language cognitive reasoning, exception diagnosis, and multi-modal document intelligence (BOL, Invoice, PO PDF/image extraction).
- **Environment Variable:** `GEMINI_API_KEY`
- **Fallback Behavior:** If `GEMINI_API_KEY` is not supplied or the API is unreachable, the system automatically falls back to the deterministic SCM reasoning engine grounded strictly in live tabular context. Zero hallucinations occur.

---

## 3. Enterprise ERP & B2B Integration Partners

### 3.1 SAP S/4HANA Connector
- **Protocol:** OData v4 over HTTPS with OAuth 2.0 Client Credentials.
- **Data Entities:** Sales Orders (`A_SalesOrder`), Purchase Orders (`A_PurchaseOrder`), Material Documents (`A_MaterialDocument2`).
- **Signature Verification:** SHA-256 HMAC webhook verification.

### 3.2 Oracle Fusion SCM Cloud Connector
- **Protocol:** Oracle REST APIs for Supply Chain Management (`/fscmRestApi/resources/11.13.18.05`).
- **Data Entities:** Inventory Balances, Shipments, Purchase Orders.
- **Signature Verification:** SHA-256 HMAC webhook verification.

### 3.3 ANSI ASC X12 & UN/EDIFACT Protocols
- **Inbound Endpoints:** `/api/edi/receive`, `/api/integration/edi/receive`
- **Supported Transactions:**
  - `X12 850` / `ORDERS`: Purchase Order
  - `X12 855` / `ORDRSP`: Purchase Order Acknowledgment
  - `X12 856` / `DESADV`: Advance Ship Notice (ASN)
  - `X12 810` / `INVOIC`: Commercial Invoice
  - `X12 820` / `REMADV`: Payment Order / Remittance Advice
  - `X12 214` / `IFTSTA`: Transportation Carrier Shipment Status Message
  - `X12 997` / `CONTRL`: Functional Acknowledgment
- **Authentication:** `Authorization: Bearer <JWT>` or `X-Orion-Partner-Key: <PartnerSecret>`.

---

## 4. Local Development & CI/CD Runtime Prerequisites

| Prerequisite | Minimum Version | Recommended | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 20.0.0` | `24.x LTS` | Tested and verified on Node.js v24.22.0 |
| **npm** | `>= 10.0.0` | `10.8.2` | Package management and lifecycle scripts |
| **Java Development Kit** | `OpenJDK 21` | `Eclipse Temurin 21` | **Mandatory** for running `@firebase/rules-unit-testing` local emulators |
| **Git** | `>= 2.40.0` | Latest | Version control with credential management |

---

## 5. Environment Variable Reference Guide

| Variable Name | Environment | Required | Description |
| :--- | :---: | :---: | :--- |
| `ORION_RUNTIME_ENVIRONMENT` | All | Yes | Target runtime mode (`DEMO`, `STAGING`, `LIVE`). |
| `FIREBASE_PROJECT_ID` | LIVE, STAGING | Yes | Google Cloud Firebase Project ID. |
| `FIREBASE_API_KEY` | LIVE, STAGING | Yes | Google Firebase Client Web API Key. |
| `GEMINI_API_KEY` | All | Optional | Google GenAI API key for Gemini 3.8 Flash copilot. |
| `CLOUDFLARE_API_TOKEN` | Staging, Prod | Optional | Cloudflare API token for Workers AI FLUX generation. |
| `CLOUDFLARE_ACCOUNT_ID` | Staging, Prod | Optional | Cloudflare Account ID for Workers AI FLUX generation. |
| `JWT_PUBLIC_KEY_PEM` | LIVE, STAGING | Optional | Custom tenant RS256 public key for partner JWT signing. |
