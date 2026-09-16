# ORION-9 Branding Recovery Fix

## Scope

Restores the canonical ORION-9 product identity in the active application tree.

## Changes

- Canonical app/product/OS name: `ORION-9`
- Canonical tagline: `AI-Native Supply Chain Operating System`
- Canonical logo asset: `/orion-9-logo-transparent-v2.png`
- Updated HTML title and Open Graph metadata.
- Updated branding/settings fallbacks from legacy `ORION SCM OS` to `ORION-9`.
- Added migration handling so stale legacy branding values in localStorage/sessionStorage/IndexedDB cannot silently override ORION-9 defaults.
- Updated user-visible administrative/system text that previously displayed the legacy product name.
- Preserved legacy-name detection only as migration compatibility data.

## Validation

- 28 changed TS/TSX files transpiled successfully with TypeScript 5.8.
- `package.json` parses successfully.
- Legacy branding scan shows only intentional migration compatibility strings.
- Full production build was not run because this source tree does not include `node_modules` in the supplied archive.
