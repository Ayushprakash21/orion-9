# ORION-9 Clean Architecture Pass

## Scope
This pass preserves the active root application and removes only confirmed project artifacts that were not part of the runtime application.

## Removed
- Duplicate project snapshots: ORION-9-LIVE-WALLPAPER-FIXED, ORION-9-PROFILE-FLAGS-FIXED, ORION-9-VVIP-FINAL, current_fix, orion-9-final-repair, orion_admin2, orion_rebuild, orion_vvip_final, work_orion.
- Detached app/applet artifact tree.
- One-off repair/patch/build/test scripts from the project root.
- Historical repair notes and screenshots from the project root.
- Unreferenced bootstrap/test files new_boot.tsx, new_world.tsx and test-imports.ts.

## Preserved
- The active root React/Vite application.
- package.json/package-lock.json, server, migration, public assets, src and build configuration.
- Existing authentication, routes, services, engines and UI components.
- Existing admin modules and Platform Intelligence.

## Admin Control Center
Added the real Admin route and navigation entry:
- `/admin/control-center`
- Sidebar label: `AI + Manual Control Center`

The control center is data-driven and organized as:
Domain → Capability → Policy → Manual / AI Copilot / AI Autopilot → Governance → Audit.

No existing route was removed or renamed.

## Validation
- Static route/import references were checked after cleanup.
- `npm ci` could not complete in the sandbox within the available execution window, so a dependency-backed Vite build could not be executed here. No claim of a successful production build is made.
