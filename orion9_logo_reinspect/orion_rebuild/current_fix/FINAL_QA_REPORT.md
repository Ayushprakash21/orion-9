# ORION-9 Latest ZIP QA + Permanent Shell Repair

Base: latest uploaded orion-9(3)(1).zip
Repair date: 2026-09-13

## Scope
Audited the current source as both User and Admin and repaired the global application shell.

## Permanent shell changes
- Global user top bar is a 48px in-flow shell row.
- Application workspace is a separate row below the bar.
- Desktop backdrop is constrained to the workspace row.
- Window stage is clipped to the workspace.
- Maximized windows therefore occupy the workspace, not the browser viewport.
- Removed `sticky` behavior from individual application title bars.
- Admin layout now reserves the same 48px top-bar lane and constrains its content below it.
- Root/authenticated shells have zero margin/padding and no viewport-height drift.

## Feature checks
- User authentication routes preserved.
- Admin authentication routes preserved.
- Admin route protection preserved.
- Window manager APIs preserved.
- Dock/context-menu APIs preserved.
- Existing window controls preserved.
- ORION AI is not rendered as a Home floating chat card in source.
- Existing ORION AI application registry/functionality was not removed by this repair.

## Static verification
- ZIP extraction succeeded.
- ZIP integrity test passed.
- package.json parsed successfully.
- Key shell files exist.
- No extra source references to `orion-global-topbar` outside the intended shell files.
- No source occurrence of the removed Home floating-chat text `Ask ORION about your supply chain`.
- No duplicate OrionDesktop source copies were found in the latest archive.

## Build limitation
A full Vite/TypeScript build could not be completed in this environment because the uploaded project does not contain `node_modules`, and dependency installation timed out twice. The system TypeScript executable is present, but project dependency resolution requires the project's packages.

## Important
This repair deliberately fixes the geometry/containment architecture rather than relying on z-index escalation. The top bar is now structurally separated from the application viewport on both User and Admin shells.
