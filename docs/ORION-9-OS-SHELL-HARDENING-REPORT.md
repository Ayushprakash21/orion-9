# ORION-9 — OS SHELL / WINDOW MANAGER / SYSTEM OVERLAY HARDENING REPORT

**Audit Date**: September 24, 2026  
**Status**: Certified & Hardened  
**Target Subsystem**: Orion OS Desktop Shell, Window Manager, System Bar, Overlays & Stacking Context Architecture  
**Release Gate**: Part 4 — Platform Maturity & Enterprise Stability  

---

## 1. Executive Summary

This engineering audit and hardening program surveyed the full Orion-9 desktop shell runtime across layout contexts, window management state machines, overlay hierarchies, and viewport boundary constraints. 

Prior to this hardening program, system popovers (such as the Wi-Fi/Network connection flyout, notifications, and menus) were vulnerable to clipping and occlusion when application windows were positioned near the top of the desktop stage due to fragmented z-index declarations (`z-50`, `z-[120]`, `z-[150]`) and non-standardized stacking contexts.

The platform architecture now enforces a **monotonic 8-layer OS stacking hierarchy**, strict viewport containment for all application stages, and portal-isolated rendering for all transient system popovers.

---

## 2. Definitive Orion OS Layer Architecture

Orion-9 establishes a single, non-competing, authoritative OS layering standard:

| Layer Level | Subsystem / Surface | Z-Index Range / Class | Behavior & Containment |
| :--- | :--- | :--- | :--- |
| **Layer 0** | Desktop Wallpaper & Network Canvas | `z-0` (`.orion-desktop-wallpaper-layer`) | Non-interactive or background reactive layer |
| **Layer 0.5** | Desktop Surface & App Grid | `z-0` / `z-10` (`.orion-desktop-backdrop`) | Accepts right-click context menu, double-click launch |
| **Layer 10** | Application Window Stage | `10` to `45` (`.orion-app-viewport`) | Sub-grid row 2 (below 48px top bar). Active window pinned at `z=45` |
| **Layer 20** | Desktop Dock & Navigation Bar | `z-[60]` / `z-[61]` (`OrionDock`) | Floats above windows; auto-hides contextually |
| **Layer 30** | Persistent Global Top Bar Chrome | `z-[2147483000]` (`.orion-global-topbar`) | 48px top lane; opaque, fixed, in-flow shell chrome |
| **Layer 40** | OS System Popovers & Flyouts | `z-[2147483600]` (`NetworkConnectionPopover`, Menus, Notifications) | Rendered directly into DOM body via Portals or topbar anchors with absolute screen positioning |
| **Layer 50** | Command Surfaces & Launchers | `z-[2147483620]` (`OrionCommandPalette`, `OrionApplicationLauncher`) | Fullscreen backdrop with centered/docked spotlight dialogs |
| **Layer 60** | System Drawers & Modals | `z-[2147483640]` (`EntityDrawer`, `ConfirmModal`, `SystemStatusModal`) | Modal dialogs with dark blur backdrops and focus trap |
| **Layer 70** | Critical System Overlays & Toasts | `z-[2147483647]` (`useToast`, Brightness Filter, Lock Screen) | Absolute top overlay; guaranteed non-occluded |

---

## 3. Window Manager Hardening & Geometry Integrity

### A. Window Bounds & Viewport Clamping
- **Stage Isolation**: The desktop shell utilizes CSS Grid (`grid-template-rows: 48px minmax(0, 1fr)`) ensuring application windows in `.orion-app-viewport` cannot intrude into the top system bar.
- **Drag Clamping**: Pointer dragging calculates relative offsets clamped to `clampedX = Math.max(-win.width + 120, Math.min(screenW - 120, x))` and `clampedY = Math.max(0, Math.min(screenH - 32, y))`. Window headers cannot be lost or dragged above the stage.
- **Resize Clamping**: Minimum window dimensions are bounded to `minW = min(480, max(320, 0.55 * W))` and `minH = min(340, max(240, 0.45 * H))`.
- **Maximize & Restore**: Windows record `prevGeometry` when maximized, allowing instantaneous pixel-perfect restoration to their prior floating coordinates and dimensions.

### B. Dynamic Z-Order & Focus Management
- Active windows automatically receive `zIndex: 45` and `isFocused: true`.
- Inactive windows are automatically cascaded in `10..40` based on access recency.
- Minimizing an active window dynamically promotes the next topmost window in the active workspace without requiring manual click interaction.

---

## 4. Overlay & System Popover Hardening

1. **Wi-Fi / Network Connection Popover (`NetworkConnectionPopover.tsx`)**:
   - Implemented as a React Portal rendered directly into `document.body` at `z-[2147483600]`.
   - Uses dynamic `getBoundingClientRect()` calculation for the topbar anchor, automatically adapting to window resizing and orientation changes.
   - Includes full click-outside detection, keyboard `Escape` dismissal, connection signal gauges, latency indicators, and master toggle controls.
2. **Notification Center (`OrionSystemBar.tsx`)**:
   - Elevated to `z-[2147483600]`, eliminating clipping behind maximized windows.
3. **Application Launcher (`OrionApplicationLauncher.tsx`)**:
   - Standardized at `z-[2147483620]` with smooth blur backdrop and unified keyboard navigation.
4. **Command Palette (`OrionCommandPalette.tsx`)**:
   - Standardized at `z-[2147483620]` with full search, hotkey support (`Cmd+K` / `Ctrl+Space`), and direct entity linking.
5. **System Modals & Drawers (`EntityDrawer.tsx`, `ConfirmModal.tsx`, `SystemStatusModal.tsx`)**:
   - Standardized at `z-[2147483640]`, rendering above all desktop windows, dock, and system bars.

---

## 5. Verification & Test Suite Execution

### A. TypeScript Type Check
```bash
npx tsc --noEmit
# Exit Code: 0 (0 errors)
```

### B. OS Shell Automated Test Suite
```bash
npx vitest run src/__tests__/os/
# ✓ src/__tests__/os/liveLoginBackground.test.ts (2 tests)
# ✓ src/__tests__/os/networkConnectionPopover.test.ts (3 tests)
# ✓ src/__tests__/os/windowControlsLayout.test.ts (3 tests)
# ✓ src/__tests__/os/osShellWindowManagerHardening.test.ts (10 tests)
# 4 passed (18 tests total)
```

### C. Full Repository Test Suite
```bash
npx vitest run
# 61 passed test files (585 tests passed)
```

### D. Production Bundle Compilation
```bash
npm run build
# vite v6.4.3 building for production...
# ✓ 3865 modules transformed.
# ✓ built in 16.84s (dist/server.cjs generated)
```

---

## 6. Certification

The Orion-9 OS Desktop Shell, Window Manager, and System Overlay Architecture have been audited, remediated, and fully verified. All UI popovers, windows, and overlays operate with strict visual isolation, zero clipping, and enterprise-grade reliability.
