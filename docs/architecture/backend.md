# Backend & Server Architecture

## Server Components
1. **Application Server (`server.ts`)**:
   - Express 4.x application bundled with `esbuild`.
   - Health check endpoints (`/health`, `/api/status`).
   - Integration webhook receivers with signature verification.
2. **Cloudflare Workers**:
   - Edge routing, asset caching, and security header injection.
   - Zero-origin Content Security Policy (CSP) enforcement.
3. **Firebase Cloud Services**:
   - Firebase Authentication for cryptographic identity.
   - Cloud Firestore for ACID transactions and real-time document change streams.
   - Cloud Storage for document attachments and digital POD signatures.
