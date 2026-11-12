# ORION-9 OS 21.1 — SYSTEM-WIDE PERFORMANCE BASELINE FORENSICS
**Date:** November 13, 2026  
**Environment:** Chromium / Playwright Headless + Node.js (Windows Host, 1440x900 viewport)  
**Execution Target:** `http://127.0.0.1:3000` (Local Vite SPA + Express Dev Server)  
**Evaluation Type:** Quantitative Forensics & Root-Cause Profiling (Pre-Optimization Baseline)  
**Status:** COMPLETE & EMPIRICALLY VERIFIED

---

## 1. EMPIRICAL BASELINE MEASUREMENTS (PHASE 1 FORENSICS)

The following metrics were captured directly via Playwright browser execution using high-resolution W3C Navigation & User Timing APIs.

| Benchmark Scenario | Measured Baseline | Target Standard | Status / Gap Analysis |
| :--- | :--- | :--- | :--- |
| **1. Initial Application Load** | **2,237 ms** | < 1,500 ms | **High Latency:** Heavy bundle parsing, full module execution before hydration. |
| **2. Desktop Shell Initialization** | **3,545 ms** | < 1,000 ms | **Critical Bottleneck:** Desktop initializes 6+ widgets, LiveWallpaper shaders, and multiple Firestore subscriptions simultaneously. |
| **3. Dynamic Island Expansion** | **88 ms** | < 100 ms | **Visual Flaws:** Layout animation causes forced synchronous layout reflow; header jumps state prematurely. |
| **4. Dynamic Island Collapse** | **166 ms** | < 100 ms | **Critical Defect:** Instant state swap (`isExpanded = false`) causes header to flip into alert mode *during* height transition; content squishes. |
| **5. Widget Dragging Response** | **225 ms** | < 100 ms | **Severe Lag:** Pointermove triggers unthrottled state updates across desktop workspace; multiple background health intervals run concurrently. |
| **6. Window Opening (Inventory)** | **528 ms** | < 250 ms | **Suboptimal:** WindowManager renders un-memoized window trees; heavy data fetching on window mount. |
| **7. Application Switching** | **360 ms** | < 150 ms | **Suboptimal:** Workspace transition triggers re-renders across all docked applications. |
| **8. Copilot Opening** | **460 ms** | < 200 ms | **Suboptimal:** Markdown parser, prompt galleries, and conversation memory hydrate synchronously on open. |
| **9. Copilot Response Generation** | **2,595 ms** | < 2,000 ms | **Pipeline Instability:** Unhandled relative URL parse exceptions (`ERR_INVALID_URL`) fall back to synchronous local RAG; no request cancellation. |
| **10. Real-time Update Latency** | **123 ms** | < 50 ms | **Rerender Cascades:** `SupplyChainContext` broadcasts raw arrays to all subscribers rather than scoped slices. |

### Browser Performance API Breakdown
- **First Contentful Paint (FCP):** 308 ms
- **DOM Interactive:** 64 ms
- **DOM Content Loaded:** 1,770 ms
- **Load Event End:** 1,795 ms

---

## 2. ROOT CAUSE AUDIT BY OPERATIONAL SUBSYSTEM

### 2.1 Dynamic Island State Machine & Animation Artifacts
* **Root Cause 1 (State Premature Flipping):** The component relied exclusively on a single boolean `isExpanded: boolean`. The moment `collapse()` is called, `isExpanded` flips to `false` at frame 0. As a consequence, the header immediately switches to collapsed capsule content (`⚠️ Shipment exception detected • 16 Alerts`) while the body `<motion.div>` is still animating height down from ~420px to 0px. This results in the header displaying squished warning text over an active expanding/collapsing card.
* **Root Cause 2 (Framer Motion `layout` Prop Thrashing):** Applying `layout` to the root surface forces Framer Motion to read bounding client rects of all DOM descendants on every animation tick, causing forced synchronous layout reflow and stutter during open/close cycles.
* **Root Cause 3 (Disconnected Visual Token in Collapsed State):** In collapsed mode, `statusToneClass` applies an independent dark red/amber border (`border-rose-500/45 bg-[rgba(34,12,18,0.94)]`) instead of preserving the unified system bar glass surface, making it appear as a detached floating black pill.
* **Affected Files:**
  - `src/os/components/dynamicIsland/DynamicIsland.tsx`
  - `src/os/components/dynamicIsland/useDynamicIslandState.ts`
  - `src/os/components/OrionSystemBar.tsx`

### 2.2 Copilot Execution Pipeline & Stability Breaks
* **Root Cause 1 (Lack of Request Cancellation & AbortController):** `AICopilot.tsx` did not instantiate or track an `AbortController`. If a user entered a query and submitted a second query or navigated away, the previous inference remained in flight.
* **Root Cause 2 (Duplicate Submission Race Conditions):** `handleSubmit` checked `!promptText.trim()` but did not guard against `isLoading === true`. Rapid clicking of the send button or pressing Enter twice caused duplicate in-flight requests and interleaving responses.
* **Root Cause 3 (Relative URL Fetch Failures):** In `src/services/ai/AIProvider.ts`, calls to `fetch('/api/ai/choose-tools')` and `fetch('/api/ai/insight')` failed in non-standard runtimes with `TypeError: Failed to parse URL from /api/ai/choose-tools` (`ERR_INVALID_URL`). While a fallback was present, the unhandled fetch error polluted stdout and introduced unnecessary error catch overhead.
* **Root Cause 4 (Unmanaged Timers):** `setTimeout(() => setAiState('analyzing'), 800)` was unmanaged and fired after component unmount.
* **Affected Files:**
  - `src/components/AICopilot.tsx`
  - `src/services/ai/AIProvider.ts`
  - `src/lib/api.ts`

### 2.3 Desktop Shell, Widgets & Real-time State Management
* **Root Cause 1 (Duplicate Background Intervals in Widgets):** In `DesktopWidgetSystem.tsx`, every single mounted widget ran its own `setInterval(updateHealth, 15000)` executing `runHealthCheck()` and accessing Firestore status. With 4 to 6 widgets active, 4 to 6 parallel intervals fired every 15 seconds, creating thread contention.
* **Root Cause 2 (Un-scoped SupplyChainContext Broadcasts):** In `SupplyChainContext.tsx`, when real-time Firestore listeners (`subscribeInventory`, `subscribeShipments`, etc.) emit changes, state setters (`setInventory`, `setShipments`) trigger a re-render of the entire context provider. Any component calling `useSupplyChain()` re-renders completely, including the Dynamic Island, System Bar, Desktop icons, and open windows.
* **Affected Files:**
  - `src/os/desktop/DesktopWidgetSystem.tsx`
  - `src/core/visualization/useLiveChartSeries.ts`
  - `src/store/SupplyChainContext.tsx`
