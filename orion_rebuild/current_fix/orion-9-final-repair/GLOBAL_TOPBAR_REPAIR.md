# ORION-9 Global Top Bar Repair

## Problem fixed
The global ORION system bar could visually escape its shell during application open/close/maximize animations. Application windows were rendered in an absolute stage while the system bar was independently viewport-fixed. This allowed animated/transformed layers to overlap or visually pass through the system chrome.

## Permanent shell contract
- The global system bar is now a 48px **in-flow shell row**, not an independent viewport overlay.
- The desktop root owns the full `100dvh` viewport and clips overflow.
- The application viewport is permanently reserved below the 48px system bar.
- Application windows are clipped by that viewport, including animated entry/exit transforms.
- The system bar has a dedicated high stacking context and cannot be displaced by application transforms.
- The bottom dock remains independent and anchored to the browser viewport.
- Existing application/window functionality is preserved.

## Important
Run the project from the ZIP root (`package.json` at the archive root). Do not launch an old copy under `current_repair/`, `topbar_repair/`, or `orion9_work/`; those are historical repair workspaces included in the archive.

## Verification
The two modified TSX files were parsed successfully with the TypeScript compiler's TSX transpiler. A full Vite build could not be completed in this environment because the uploaded project does not contain a complete installed `node_modules` tree and package installation timed out.
