# ORION-9 STABILIZATION BASELINE REPORT
**Date**: 2026-10-08T06:26:00+05:30  
**Baseline Commit**: `ea24aab` (Full repo commit: updates to runtime settings and map cleanup)  
**Branch**: `main`  
**Working Tree**: Clean  

---

## 1. System Health Verification Baseline

| Test Suite / Step | Command | Status | Details |
|---|---|---|---|
| **TypeScript / Lint** | `npm run lint` (`tsc --noEmit`) | ❌ FAIL | 16 errors in `src/__tests__/browser/orionBrowserSuite.test.tsx` (missing `BrowserTab` properties, `BrowserToolbarProps` missing `securityStatus`, missing/mismatched prop names) and 5 errors in `src/components/browser/OrionBrowser.tsx` (argument count mismatch on helper calls). |
| **Unit & Integration Tests** | `npm test` (`vitest run`) | ⚠️ PARTIAL PASS | **168 passed**, **1 failed** (`src/__tests__/browser/orionBrowserSuite.test.tsx` with 11 failing tests due to prop discrepancies), 7 skipped. **1,604 tests passed**, 11 failed, 104 skipped. |
| **Production Build** | `npm run build` | ✅ PASS | Vite SSR + Client production bundles compiled cleanly in 23.12s, esbuild server built in 16ms. |
| **Playwright / E2E Suite** | `npx playwright test --list` | ✅ READY | 210 tests across 32 files cataloged and operational. |

---

## 2. Identified Baseline Failures to Stabilize

1. **Browser Test & Component Prop Desynchronization**:
   - `src/__tests__/browser/orionBrowserSuite.test.tsx` expects `tab` instead of `activeTab`, `bookmarks` array defaulting, `securityStatus` in `BrowserToolbarProps`, and complete `BrowserTab` model (`loading`, `canGoBack`, `canGoForward`, `lastActiveAt`, `loadState`).
   - `src/components/browser/OrionBrowser.tsx` helper calls have argument count mismatch.
2. **Settings Authority Single Source of Truth**:
   - `src/os/settings/RuntimeSettingsAuthority.ts`, `RuntimeSettingsModel.ts`, and `RuntimeSettingsProvider.tsx` were recently established but need full runtime subscription wiring into Theme, Wallpaper, Dock, Window, File Manager, Browser, and Map subsystems without duplicate sources of truth.
3. **Map Runtime Offline Resilience**:
   - `carto-dark` raster source and layer removed from default style; rail data pipeline, fallback equirectangular SVG, and status state machine need certification across tests.

---

## 3. Subsystem Execution Plan (Strict Phases)

- **Phase 1**: Runtime Settings Authority (guard SSR/DOM, single source of truth, subscribe/persist)
- **Phase 2**: Themes (Graphite, Silver, Midnight, Forest, Warm + CSS tokens, window/dock/desktop sync)
- **Phase 3**: Wallpaper (Desktop target isolation, login isolation, blur/dim, rapid selection queue, fallback)
- **Phase 4**: Dock (Bottom/Top/Left/Right, size presets, race-safe auto-hide state machine)
- **Phase 5**: Window Appearance (Border radius, glass transparency, blur, controls left/right)
- **Phase 6**: File Manager (Race-safe navigation, latest navigation wins, subscription contents refresh)
- **Phase 7**: Orion Browser (Fix TypeScript errors & test suite, truthful web embed vs blocked state, tabs/history/bookmarks)
- **Phase 8**: Global Operations Map (Offline world landmass, rail GeoJSON pipeline, status machine, zero CARTO watermark)
- **Phase 9**: Full OS Regression (End-to-end certification, Playwright suite, build, lint)
