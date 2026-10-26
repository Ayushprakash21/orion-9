# Known Limitations & Disclosures

In accordance with enterprise honesty standards:
1. **External ERP Write-Backs**: Integration connectors transform and validate canonical payloads, but live production ERP mutation requires client-specific enterprise credentials.
2. **macOS Native Installer**: The macOS build pipeline and entitlements are fully configured; notarized binary distribution requires Apple Developer certificate signing.
3. **AI Copilot Scope**: The AI Copilot operates within defined tool boundaries and cannot invent or mutate records without passing through the Kernel Command Bus.
