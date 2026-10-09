# ADR-001: Orion-9 Hybrid Browser Engine Architecture

## Status
**ACCEPTED & IMPLEMENTED** (Phase 21 / Master Hardening)

## Context & Problem Statement
Orion-9 is an enterprise Supply Chain Operating System featuring a macOS-inspired desktop environment with native multi-window workflows. Users require integrated web browsing for external supplier portals, carrier tracking pages, customs declarations, and internal documentation.

A naive browser implementation inside an enterprise web SPA presents severe architectural challenges:
1. **Web Environment (Cloudflare Pages / Browser):** Full native process spawning is prohibited by browser sandbox rules. Direct iframe embedding of arbitrary URLs is blocked by upstream `X-Frame-Options: DENY` and `Content-Security-Policy: frame-ancestors 'none'`.
2. **Desktop Packaged Environment (Tauri 2.x / Windows x64):** An embedded iframe suffers from cookie isolation bugs, lacks native hardware acceleration, cannot handle file downloads natively, and cannot navigate cross-origin enterprise SSO sites that forbid framing.
3. **Security & Data Exfiltration:** Arbitrary proxying (`/proxy?url=...`) introduces severe Server-Side Request Forgery (SSRF) vulnerabilities, allowing attackers to scan internal infrastructure, private subnets (RFC 1918), and cloud metadata endpoints (`169.254.169.254`).

## Decision Drivers
- **Zero Exposed Origin & Zero SSRF:** Strictly eliminate any open proxying or server relay endpoints.
- **Honest Runtime State:** Never report a page as `PAGE_LOADED` or `STATUS 200` when framing is rejected by CSP or network failures.
- **Cross-Platform Parity:** Provide native WebView2 capabilities on desktop platforms while gracefully providing sandboxed iframe embedding and direct linkouts in pure web runtimes.
- **Bundle Efficiency:** Heavy browser engine components must not bloat the initial desktop shell bundle.

---

## Architectural Decision

### 1. Unified `BrowserRuntimeAdapter` Pattern
We implemented an authoritative `BrowserRuntimeAdapter` (`src/components/browser/BrowserRuntimeAdapter.ts`) that acts as an abstraction layer between the React browser chrome (tabs, toolbar, address bar, history, bookmarks, AI Copilot) and the underlying runtime capability:

```
+-------------------------------------------------------------+
|                     Orion Browser UI                        |
|   (BrowserTabBar, BrowserAddressBar, BrowserToolbar)        |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                 BrowserRuntimeAdapter                       |
|   - Normalizes URLs & validates schemes (http/https/orion)  |
|   - Dispatches navigation events (started, finished, fail)  |
|   - Synchronizes active tab bounds with native WebView      |
+-------------------------------------------------------------+
               /                              \
              /                                \
  [Desktop Environment]               [Web / Cloudflare Mode]
             v                                    v
+---------------------------+        +---------------------------+
|   BrowserNativeRuntime    |        |     BrowserWebRuntime     |
|  - Tauri 2.x WebView2     |        |  - Sandboxed <iframe>     |
|  - Bidirectional IPC      |        |  - WebModePolicy check    |
|  - Native downloads & zoom|        |  - Honest frame error UI  |
+---------------------------+        +---------------------------+
```

### 2. Runtime Detection & Capability Negotiation
At startup, `detectBrowserRuntimeCapability()` checks `window.__TAURI_INTERNALS__` or `window.__TAURI__`:
- If running under **Tauri 2.x**, mode is set to `'native'` and native WebView windows are bound to the tab coordinates.
- If running in standard **browser/Cloudflare**, mode is set to `'web-embedded'`, which activates `BrowserWebRuntime` with `WebModePolicy`.

### 3. Web Mode Policy (`WebModePolicy.ts`)
In web-embedded mode, rather than blindly failing or proxying insecurely:
- Permitted domains and same-origin routes are embedded with strict sandbox attributes:
  `sandbox="allow-scripts allow-forms allow-same-origin allow-popups"`
- Known framing-restricted domains (e.g. Google, GitHub, major banks) are identified upfront, displaying a clean "Framing Restricted by Upstream Policy" banner with a 1-click "Open in New Tab" action.
- Arbitrary server proxying is permanently rejected (Cloudflare Worker returns 403 on `/proxy` or `/fetch`).

### 4. Code Splitting & Performance Budget
To prevent browser and file management code from inflating the desktop shell bundle:
- `OrionBrowser` is dynamically loaded via `createLazyApp(() => import('../components/browser/OrionBrowser'), 'OrionBrowser')`.
- Heavy browser submodules (history store, bookmark manager, download manager) are split into dedicated chunks.

---

## Consequences & Compliance

### Positive Consequences
- **Security:** Zero SSRF vulnerability. No server-side HTTP proxy required.
- **Reliability:** Real error propagation. Framing rejections display honest diagnostics instead of infinite spinners.
- **Desktop Fidelity:** True multi-process browsing on native Windows desktop with full cookie/session support.
- **Bundle Size:** Initial bundle load reduced by >300KB by lazy-loading the browser subsystem.

### Negative Consequences / Trade-offs
- In pure web mode, external sites that send `X-Frame-Options: DENY` cannot render inline inside the OS window; users must use the provided "Open in Tab" linkout.
- Native WebView bounds require resize/drag synchronization events from the window manager.
